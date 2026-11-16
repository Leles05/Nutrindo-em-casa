import type { SupabaseClient } from "@supabase/supabase-js";
import { asaasFetch, desfazerCompraParcelada, type AsaasConfig } from "@/lib/asaas";

/** Status da cobrança no Asaas => texto da fatura exibido ao cliente. */
export function statusDaFatura(statusAsaas: string): string {
  switch (statusAsaas) {
    case "CONFIRMED":
    case "RECEIVED":
    case "RECEIVED_IN_CASH":
      return "Pago";
    case "OVERDUE":
      return "Vencido";
    case "REFUNDED":
    case "REFUND_REQUESTED":
    case "REFUND_IN_PROGRESS":
      return "Estornado";
    case "CHARGEBACK_REQUESTED":
    case "CHARGEBACK_DISPUTE":
      return "Contestado";
    case "DELETED":
      return "Cancelado";
    default:
      return "Pendente";
  }
}

export function compraPaga(statusAsaas: string | undefined): boolean {
  return statusAsaas === "CONFIRMED" || statusAsaas === "RECEIVED" || statusAsaas === "RECEIVED_IN_CASH";
}

/** Grava (ou atualiza) uma fatura por parcela da compra. Retorna a quantidade gravada. */
export async function gravarFaturasDasParcelas(
  admin: SupabaseClient,
  email: string,
  installmentId: string,
  parcelasAsaas: any[],
  descricaoBase: string
): Promise<number> {
  const total = parcelasAsaas.length;
  if (total === 0) return 0;
  const linhas = parcelasAsaas.map((p) => ({
    user_email: email,
    asaas_payment_id: p.id,
    descricao: total > 1 ? `${descricaoBase} - Parcela ${p.installmentNumber}/${total}` : descricaoBase,
    valor: p.value,
    forma_pagamento: "CREDIT_CARD",
    status: statusDaFatura(p.status),
    data_emissao: new Date().toISOString(),
    parcela_numero: total > 1 ? Number(p.installmentNumber) : null,
    parcelas_total: total > 1 ? total : null,
    asaas_installment_id: installmentId,
  }));
  const { error } = await admin.from("faturas").upsert(linhas, { onConflict: "asaas_payment_id" });
  if (error) {
    console.error("Falha ao gravar faturas das parcelas:", error.message);
    return 0;
  }
  return total;
}

/** Guarda o cartão salvo (token do Asaas) para a renovação automática. Tabela trancada: só o servidor lê. */
export async function salvarCartao(
  admin: SupabaseClient,
  email: string,
  dados: { token: string; ultimos4?: string; bandeira?: string; ip?: string }
): Promise<boolean> {
  const { error } = await admin.from("cartoes_salvos").upsert(
    {
      user_email: email,
      token: dados.token,
      ultimos4: dados.ultimos4 || null,
      bandeira: dados.bandeira || null,
      ip_compra: dados.ip || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_email" }
  );
  if (error) console.error("Falha ao salvar o cartão para renovação:", error.message);
  return !error;
}

/** IP válido (v4 ou v6) para o campo remoteIp do Asaas; senão undefined. */
export function ipParaAsaas(ip: string | null | undefined): string | undefined {
  if (!ip) return undefined;
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip) || /^[0-9a-fA-F:]+$/.test(ip) ? ip : undefined;
}

/**
 * Se a chamada de criação da compra EXPIRAR (timeout/rede), o Asaas pode ter processado mesmo assim.
 * Procura compras parceladas recentes deste cliente que o nosso sistema NÃO conhece e as desfaz,
 * para o cliente não ser cobrado sem ter acesso (nem em duplicidade ao tentar de novo).
 * Retorna quantas compras órfãs foram desfeitas.
 */
export async function desfazerCompraOrfa(
  admin: SupabaseClient,
  cfg: AsaasConfig,
  customerId: string,
  email: string,
  hoje: string
): Promise<number> {
  try {
    const r = await asaasFetch(
      cfg,
      "GET",
      `/payments?customer=${customerId}&externalReference=${encodeURIComponent(email)}&billingType=CREDIT_CARD&dateCreated[ge]=${hoje}&limit=100`
    );
    const pagamentos: any[] = Array.isArray(r.data?.data) ? r.data.data : [];
    const porCompra = new Map<string, { paga: boolean }>();
    for (const p of pagamentos) {
      const chave = p.installment || p.id;
      const atual = porCompra.get(chave) || { paga: false };
      if (compraPaga(p.status)) atual.paga = true;
      porCompra.set(chave, atual);
    }
    let desfeitas = 0;
    for (const [chave, info] of porCompra) {
      // Só mexe no que o sistema não conhece (não está no perfil nem nas faturas)
      const { data: noPerfil } = await admin.from("profiles").select("email").eq("asaas_installment_id", chave).maybeSingle();
      const { data: nasFaturas } = await admin.from("faturas").select("id").or(`asaas_installment_id.eq.${chave},asaas_payment_id.eq.${chave}`).limit(1);
      if (noPerfil || (nasFaturas && nasFaturas.length > 0)) continue;
      console.error("Cobrança órfã encontrada após falha de comunicação; desfazendo:", chave);
      if (chave.startsWith("pay_")) await asaasFetch(cfg, "DELETE", `/payments/${chave}`);
      else await desfazerCompraParcelada(cfg, chave, info.paga);
      desfeitas++;
    }
    return desfeitas;
  } catch (e) {
    console.error("ATENÇÃO: falha ao procurar cobrança órfã de", email, e);
    return 0;
  }
}
