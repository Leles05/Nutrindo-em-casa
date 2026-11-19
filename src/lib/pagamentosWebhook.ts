import type { SupabaseClient } from "@supabase/supabase-js";
import { mpFetch, type ConfigMP } from "@/lib/mercadopago";
import { podeAtualizarFatura, statusFaturaDaCobrancaAssinatura, statusFaturaDoPedido } from "@/lib/pagamentosEstado";
import { liberarAcessoPosPagamento } from "@/lib/acesso";
import { enviarEmail, montarEmail } from "@/lib/email";
import { urlDoSite } from "@/lib/acesso";
import { MESES_DO_PLANO, ehPlano, hojeSP, somarMeses, type Plano } from "@/lib/planos";
import { alinharValorAssinatura, cancelarAssinaturaMP, ehRenovacao } from "@/lib/mpPedidos";

/* eslint-disable @typescript-eslint/no-explicit-any -- respostas JSON da API do Mercado Pago */

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));
const MAX_FALHAS_RENOVACAO = 3;

/** O aviso pode chegar antes de o checkout terminar de gravar a fatura: espera um pouco antes de desistir. */
async function acharFatura(admin: SupabaseClient, gatewayId: string, tentativas = 6) {
  for (let i = 0; i < tentativas; i++) {
    const { data } = await admin.from("faturas").select("id, user_email, status, valor").eq("gateway_pagamento_id", gatewayId).maybeSingle();
    if (data) return data;
    await espera(1500);
  }
  return null;
}

/** Aviso de ORDEM (Pix ou cartão da compra inicial). Devolve uma descrição curta do que foi feito. */
export async function processarPedido(admin: SupabaseClient, cfg: ConfigMP, orderId: string): Promise<string> {
  const r = await mpFetch<any>(cfg, "GET", `/v1/orders/${encodeURIComponent(orderId)}`);
  if (!r.ok) throw new Error(`Não foi possível consultar a ordem (HTTP ${r.status}).`);
  const ordem = r.data;
  const novo = statusFaturaDoPedido(ordem.status, ordem.status_detail);

  const fatura = await acharFatura(admin, String(ordem.id));
  if (!fatura) throw new Error("Fatura da ordem ainda não gravada.");
  if (!podeAtualizarFatura(fatura.status, novo)) return "ignorado: aviso atrasado";

  const antes = fatura.status;
  await admin.from("faturas").update({ status: novo }).eq("id", fatura.id);

  const { data: perfil } = await admin
    .from("profiles")
    .select("email, nome, plano, proxima_cobranca, status_assinatura, gateway_assinatura_id")
    .eq("email", fatura.user_email)
    .maybeSingle();
  if (!perfil) return `fatura ${novo} (sem perfil)`;

  if (novo === "Pago") {
    const plano = String(perfil.plano || "").toLowerCase();
    const atualizacao: Record<string, unknown> = { status_assinatura: "ATIVO" };
    if (antes !== "Pago" && ehPlano(plano)) {
      if (ehRenovacao(ordem.external_reference) && perfil.proxima_cobranca) {
        // renovação paga (link por e-mail): avança o ciclo a partir da data de renovação, sem "deriva"
        let proxima = somarMeses(perfil.proxima_cobranca, MESES_DO_PLANO[plano as Plano]);
        if (proxima <= hojeSP()) proxima = somarMeses(hojeSP(), MESES_DO_PLANO[plano as Plano]);
        Object.assign(atualizacao, { proxima_cobranca: proxima, renovacao_falhas: 0, acesso_ate: null });
      } else if (!ehRenovacao(ordem.external_reference)) {
        // compra inicial: o ciclo conta a partir da confirmação do pagamento
        atualizacao.proxima_cobranca = somarMeses(hojeSP(), MESES_DO_PLANO[plano as Plano]);
      }
    }
    await admin.from("profiles").update(atualizacao).eq("email", perfil.email);
    await liberarAcessoPosPagamento(admin, perfil.email, perfil.nome || "");
  } else if (novo === "Estornado") {
    await admin.from("profiles").update({ status_assinatura: "CANCELADO", renovacao_automatica: false }).eq("email", perfil.email);
    if (perfil.gateway_assinatura_id) await cancelarAssinaturaMP(cfg, perfil.gateway_assinatura_id);
  }
  return `fatura ${novo}`;
}

/** Aviso de COBRANÇA de uma assinatura (cada ciclo do cartão). */
export async function processarCobrancaAssinatura(admin: SupabaseClient, cfg: ConfigMP, cobrancaId: string): Promise<string> {
  const r = await mpFetch<any>(cfg, "GET", `/authorized_payments/${encodeURIComponent(cobrancaId)}`);
  if (!r.ok) throw new Error(`Não foi possível consultar a cobrança (HTTP ${r.status}).`);
  const cobranca = r.data;
  const assinaturaId = String(cobranca.preapproval_id || "");
  const { data: perfil } = await admin
    .from("profiles")
    .select("email, nome, plano, status_assinatura, renovacao_falhas")
    .eq("gateway_assinatura_id", assinaturaId)
    .maybeSingle();
  if (!perfil) return "ignorado: assinatura desconhecida";

  const pagamentoId = String(cobranca.payment?.id || `cobranca_${cobranca.id}`);
  const novo = statusFaturaDaCobrancaAssinatura(cobranca.payment?.status);
  const valor = Number(cobranca.transaction_amount || 0);

  let { data: existente } = await admin.from("faturas").select("id, status").eq("gateway_pagamento_id", pagamentoId).maybeSingle();
  if (!existente) {
    // o checkout pode ter gravado uma fatura provisória (a 1ª cobrança ainda não existia): adota-a trocando o id pelo real
    const { data: provisoria } = await admin
      .from("faturas")
      .select("id, status")
      .eq("gateway_pagamento_id", `assinatura_${assinaturaId}`)
      .maybeSingle();
    if (provisoria) {
      await admin.from("faturas").update({ gateway_pagamento_id: pagamentoId }).eq("id", provisoria.id);
      existente = provisoria;
    }
  }
  if (existente) {
    if (!podeAtualizarFatura(existente.status, novo)) return "ignorado: aviso atrasado";
    await admin.from("faturas").update({ status: novo, valor }).eq("id", existente.id);
  } else {
    const plano = String(perfil.plano || "").toLowerCase();
    await admin.from("faturas").insert({
      user_email: perfil.email,
      gateway_pagamento_id: pagamentoId,
      descricao: `Renovação Nutrindo em Casa${ehPlano(plano) ? ` - Plano ${plano[0].toUpperCase()}${plano.slice(1)}` : ""}`,
      valor,
      forma_pagamento: "CREDIT_CARD",
      status: novo,
      data_emissao: new Date().toISOString(),
    });
  }

  if (novo === "Pago") {
    // próxima data de cobrança vem da própria assinatura
    const a = await mpFetch<any>(cfg, "GET", `/preapproval/${encodeURIComponent(assinaturaId)}`);
    const proxima = a.ok && a.data?.next_payment_date ? String(a.data.next_payment_date).split("T")[0] : null;
    await admin
      .from("profiles")
      .update({ status_assinatura: "ATIVO", renovacao_falhas: 0, acesso_ate: null, ...(proxima ? { proxima_cobranca: proxima } : {}) })
      .eq("email", perfil.email);
    // renovações futuras pelo preço de tabela (cupom e crédito do upgrade valem só na 1ª cobrança)
    const planoPerfil = String(perfil.plano || "").toLowerCase();
    if (ehPlano(planoPerfil)) await alinharValorAssinatura(cfg, assinaturaId, planoPerfil);
    await liberarAcessoPosPagamento(admin, perfil.email, perfil.nome || "");
  } else if (novo === "Recusado") {
    const falhas = (perfil.renovacao_falhas || 0) + 1;
    const esgotou = falhas >= MAX_FALHAS_RENOVACAO;
    await admin
      .from("profiles")
      .update({ renovacao_falhas: falhas, ...(esgotou ? { status_assinatura: "INADIMPLENTE" } : {}) })
      .eq("email", perfil.email);
    await enviarEmail({
      para: perfil.email,
      assunto: esgotou ? "Não conseguimos renovar sua assinatura" : "Houve um problema na renovação da sua assinatura",
      html: montarEmail(
        esgotou ? "Sua assinatura foi suspensa" : "Não conseguimos cobrar o seu cartão",
        [
          `Olá, ${perfil.nome || "tudo bem"}! A cobrança da renovação do seu plano não foi aprovada pela operadora do cartão.`,
          esgotou
            ? "Como as tentativas se esgotaram, o acesso foi suspenso até a regularização. Você pode assinar novamente a qualquer momento."
            : "O Mercado Pago tentará novamente nos próximos dias. Para evitar a suspensão, confira se o cartão tem limite e está dentro da validade.",
        ],
        { texto: "Gerenciar minha assinatura", url: `${urlDoSite()}/configuracoes` }
      ),
    });
  }
  return `cobrança ${novo}`;
}

/** Aviso da ASSINATURA em si (cancelada ou pausada pelo cliente ou pelo Mercado Pago). */
export async function processarAssinatura(admin: SupabaseClient, cfg: ConfigMP, assinaturaId: string): Promise<string> {
  const r = await mpFetch<any>(cfg, "GET", `/preapproval/${encodeURIComponent(assinaturaId)}`);
  if (!r.ok) throw new Error(`Não foi possível consultar a assinatura (HTTP ${r.status}).`);
  const status = String(r.data?.status || "").toLowerCase();
  if (status === "cancelled" || status === "canceled" || status === "paused") {
    const { data: perfil } = await admin.from("profiles").select("email, plano, proxima_cobranca").eq("gateway_assinatura_id", assinaturaId).maybeSingle();
    if (perfil) {
      // o acesso continua até o fim do ciclo já pago
      const plano = String(perfil.plano || "").toLowerCase();
      let acessoAte: string | null = null;
      if (perfil.proxima_cobranca) acessoAte = new Date(perfil.proxima_cobranca + "T23:59:59-03:00").toISOString();
      else if (ehPlano(plano)) acessoAte = new Date(Date.now() + MESES_DO_PLANO[plano] * 30 * 86400000).toISOString();
      await admin
        .from("profiles")
        .update({ renovacao_automatica: false, ...(acessoAte ? { acesso_ate: acessoAte } : {}) })
        .eq("email", perfil.email);
    }
    return `assinatura ${status}`;
  }
  return `assinatura ${status || "sem mudança"}`;
}
