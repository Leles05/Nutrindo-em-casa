import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConfigMP } from "@/lib/mercadopago";
import { criarPedido, extrairPix, montarPedidoPix, referenciaExterna } from "@/lib/mpPedidos";
import { enviarEmail, montarEmail } from "@/lib/email";
import { urlDoSite } from "@/lib/acesso";
import { DIAS_DE_CARENCIA_RENOVACAO } from "@/lib/assinatura";
import { PLANOS, type Plano } from "@/lib/planos";
import { DIAS_ANTES_DO_LINK, precisaAvisarCartao, precisaEnviarLink, type PerfilRenovacaoLink } from "@/lib/renovacaoRegras";

export { DIAS_ANTES_DO_LINK, precisaAvisarCartao, precisaEnviarLink, type PerfilRenovacaoLink };

/**
 * Renovação por LINK (Pix): vale para quem pagou por Pix ou em parcelas no cartão (o Mercado Pago só renova
 * sozinho a assinatura de cartão à vista). Alguns dias antes do vencimento o cliente recebe um e-mail com o
 * QR Code/"copia e cola" do Pix. Quando ele paga, o aviso do Mercado Pago avança o ciclo (pagamentosWebhook).
 */

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBR = (ymd: string) => ymd.split("-").reverse().join("/");

export type ResultadoLink = "enviado" | "ignorado" | "falha";

/**
 * Cria o Pix de renovação (preço de tabela, sem cupom), grava a fatura pendente e envia o e-mail.
 * Seguro contra execução dupla: a "reserva" do ciclo é um UPDATE condicional (só uma execução consegue).
 */
export async function enviarLinkRenovacao(admin: SupabaseClient, cfg: ConfigMP, p: PerfilRenovacaoLink): Promise<ResultadoLink> {
  const proxima = p.proxima_cobranca as string;
  const plano = String(p.plano || "").toLowerCase() as Plano;

  const { data: reservado } = await admin
    .from("profiles")
    .update({ renovacao_aviso_ciclo: proxima })
    .eq("email", p.email)
    .eq("proxima_cobranca", proxima)
    .or(`renovacao_aviso_ciclo.is.null,renovacao_aviso_ciclo.neq.${proxima}`)
    .select("email");
  if (!reservado || reservado.length === 0) return "ignorado";

  const liberarReserva = async () => {
    await admin.from("profiles").update({ renovacao_aviso_ciclo: p.renovacao_aviso_ciclo }).eq("email", p.email);
  };

  try {
    const { data: perfilCompleto } = await admin.from("profiles").select("cpf").eq("email", p.email).maybeSingle();
    const valor = PLANOS[plano].valor;
    const descricao = `Renovação Nutrindo em Casa - Plano ${PLANOS[plano].nome}`;
    const validadeDias = DIAS_ANTES_DO_LINK + DIAS_DE_CARENCIA_RENOVACAO;
    const r = await criarPedido(
      cfg,
      montarPedidoPix({
        valor,
        comprador: { email: p.email, nome: p.nome || "Cliente", cpf: String(perfilCompleto?.cpf || "").replace(/\D/g, "") },
        referencia: referenciaExterna("renovacao", proxima),
        descricao,
        expiracao: `P${validadeDias}D`,
      })
    );
    const pix = extrairPix(r.data);
    if (!r.ok || !r.data?.id || !pix.qrCode) {
      console.error("Renovação: Mercado Pago não gerou o Pix", r.status, JSON.stringify(r.data?.errors || r.data || {}).slice(0, 300));
      await liberarReserva();
      return "falha";
    }

    const { error: faturaErr } = await admin.from("faturas").insert({
      user_email: p.email,
      gateway_pagamento_id: String(r.data.id),
      descricao,
      valor,
      forma_pagamento: "PIX",
      status: "Pendente",
      data_emissao: new Date().toISOString(),
    });
    if (faturaErr) {
      console.error("Renovação: não foi possível gravar a fatura pendente:", faturaErr.message);
      await liberarReserva();
      return "falha";
    }

    const enviado = await enviarEmail({
      para: p.email,
      assunto: `Renovação do seu plano Nutrindo em Casa: ${dataBR(proxima)}`,
      html: montarEmail(
        "Sua renovação está pronta para pagamento",
        [
          `Olá, ${p.nome || "tudo bem"}! Seu Plano ${PLANOS[plano].nome} renova em ${dataBR(proxima)}. O valor é ${brl(valor)}, pago por Pix.`,
          `Abra o link abaixo para ver o QR Code, ou copie o código Pix: ${pix.qrCode}`,
          `O Pix vale por ${validadeDias} dias. Se preferir não renovar, cancele em Configurações > Assinatura antes do vencimento.`,
        ],
        { texto: "Pagar a renovação por Pix", url: pix.ticketUrl || `${urlDoSite()}/configuracoes` }
      ),
    });
    if (!enviado) console.error("Renovação: o e-mail não foi enviado, mas o Pix foi criado (o cliente pode pagar em Configurações).");
    return "enviado";
  } catch (e) {
    console.error("Renovação: erro ao gerar o link:", e);
    await liberarReserva();
    return "falha";
  }
}

/** Aviso por e-mail (uma vez por ciclo) de que a renovação no cartão será cobrada automaticamente. */
export async function avisarRenovacaoCartao(admin: SupabaseClient, p: PerfilRenovacaoLink): Promise<boolean> {
  const proxima = p.proxima_cobranca as string;
  const plano = String(p.plano || "").toLowerCase() as Plano;
  const { data: reservado } = await admin
    .from("profiles")
    .update({ renovacao_aviso_ciclo: proxima })
    .eq("email", p.email)
    .eq("proxima_cobranca", proxima)
    .or(`renovacao_aviso_ciclo.is.null,renovacao_aviso_ciclo.neq.${proxima}`)
    .select("email");
  if (!reservado || reservado.length === 0) return false;

  const enviado = await enviarEmail({
    para: p.email,
    assunto: `Sua assinatura Nutrindo em Casa renova em ${dataBR(proxima)}`,
    html: montarEmail(
      "Sua assinatura será renovada em breve",
      [
        `Olá, ${p.nome || "tudo bem"}! No dia ${dataBR(proxima)} o seu Plano ${PLANOS[plano].nome} será renovado automaticamente, no valor de ${brl(PLANOS[plano].valor)}, no mesmo cartão usado na contratação.`,
        "Se preferir não renovar, cancele a qualquer momento em Configurações > Assinatura, antes dessa data.",
      ],
      { texto: "Gerenciar minha assinatura", url: `${urlDoSite()}/configuracoes` }
    ),
  });
  if (!enviado) await admin.from("profiles").update({ renovacao_aviso_ciclo: p.renovacao_aviso_ciclo }).eq("email", p.email); // tenta de novo amanhã
  return enviado;
}
