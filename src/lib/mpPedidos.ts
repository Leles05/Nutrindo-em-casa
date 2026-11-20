import { randomUUID } from "crypto";
import { mpFetch, type ConfigMP, type RespostaMP } from "@/lib/mercadopago";
import { PLANOS, type Plano } from "@/lib/planos";

export * from "@/lib/mpPayloads";

/* eslint-disable @typescript-eslint/no-explicit-any -- respostas JSON da API do Mercado Pago */

/**
 * Montagem e envio dos pedidos ao Mercado Pago (Orders API + Assinaturas).
 * As funções "montar*" são puras (testadas em tests/mpPedidos.test.ts). O cartão NUNCA passa por aqui:
 * o navegador troca os dados do cartão por um token (MP.js) e só o token chega ao servidor.
 */

/**
 * Cria o pedido. Se a rede falhar no meio, repete UMA vez com a MESMA chave de idempotência:
 * o Mercado Pago devolve o pedido já criado em vez de cobrar duas vezes.
 */
export async function criarPedido(cfg: ConfigMP, corpo: unknown, opcoes: { deviceId?: string } = {}): Promise<RespostaMP> {
  const idem = randomUUID();
  const cabecalhos: Record<string, string> = {};
  if (opcoes.deviceId && /^[A-Za-z0-9_-]{8,200}$/.test(opcoes.deviceId)) cabecalhos["X-meli-session-id"] = opcoes.deviceId;
  try {
    return await mpFetch(cfg, "POST", "/v1/orders", corpo, { idempotencia: idem, cabecalhos, timeoutMs: 30_000 });
  } catch (primeira) {
    console.warn("Mercado Pago: falha de rede ao criar pedido, repetindo com a mesma chave:", primeira);
    return mpFetch(cfg, "POST", "/v1/orders", corpo, { idempotencia: idem, cabecalhos, timeoutMs: 30_000 });
  }
}

/**
 * Estorna um pedido JÁ PAGO. O Mercado Pago recusa estornos feitos logo após a aprovação (erro 422 transitório):
 * espera alguns segundos e tenta de novo. Estornar de novo uma ordem já estornada é inofensivo.
 */
export async function estornarPedidoMP(cfg: ConfigMP, pedidoId: string, tentativas = 4): Promise<boolean> {
  for (let i = 0; i < tentativas; i++) {
    await new Promise((ok) => setTimeout(ok, i === 0 ? 4000 : 6000));
    try {
      const r = await mpFetch(cfg, "POST", `/v1/orders/${encodeURIComponent(pedidoId)}/refund`, undefined, { idempotencia: randomUUID() });
      if (r.ok) return true;
      console.warn("Mercado Pago: estorno do pedido ainda não aceito (tentativa", i + 1, "):", r.status, JSON.stringify(r.data?.errors || r.data || {}).slice(0, 200));
    } catch (e) {
      console.warn("Mercado Pago: falha de rede no estorno:", e);
    }
  }
  console.error("ATENÇÃO: não foi possível estornar automaticamente o pedido", pedidoId, "— estorne manualmente no painel do Mercado Pago.");
  return false;
}

/** Estorna um pagamento avulso (ex.: a cobrança de uma assinatura) pela API de pagamentos, com nova tentativa. */
export async function estornarPagamentoMP(cfg: ConfigMP, pagamentoId: string, tentativas = 4): Promise<boolean> {
  for (let i = 0; i < tentativas; i++) {
    await new Promise((ok) => setTimeout(ok, i === 0 ? 4000 : 6000));
    try {
      const r = await mpFetch(cfg, "POST", `/v1/payments/${encodeURIComponent(pagamentoId)}/refunds`, {}, { idempotencia: randomUUID() });
      if (r.ok) return true;
      console.warn("Mercado Pago: estorno do pagamento ainda não aceito (tentativa", i + 1, "):", r.status);
    } catch (e) {
      console.warn("Mercado Pago: falha de rede no estorno:", e);
    }
  }
  console.error("ATENÇÃO: não foi possível estornar automaticamente o pagamento", pagamentoId, "— estorne manualmente no painel do Mercado Pago.");
  return false;
}

/**
 * Tabela de parcelas do vendedor para um valor e uma bandeira (juros que o cliente paga em cada quantidade).
 * Devolve null se o Mercado Pago não responder (a conferência do total pago depois da cobrança continua valendo).
 */
export async function consultarCustosParcelamento(cfg: ConfigMP, valor: number, metodo: string): Promise<any[] | null> {
  try {
    const r = await mpFetch(cfg, "GET", `/v1/payment_methods/installments?amount=${valor.toFixed(2)}&payment_method_id=${encodeURIComponent(metodo)}`, undefined, { timeoutMs: 10_000 });
    if (!r.ok) return null;
    const dados: any = r.data;
    const custos = Array.isArray(dados) ? dados[0]?.payer_costs : dados?.payer_costs;
    return Array.isArray(custos) ? custos : null;
  } catch {
    return null;
  }
}

export async function cancelarPedidoMP(cfg: ConfigMP, pedidoId: string): Promise<boolean> {
  try {
    const r = await mpFetch(cfg, "POST", `/v1/orders/${encodeURIComponent(pedidoId)}/cancel`, undefined, { idempotencia: randomUUID() });
    return r.ok;
  } catch (e) {
    console.warn("Mercado Pago: falha ao cancelar pedido:", e);
    return false;
  }
}

/** Cancela a assinatura no Mercado Pago. Devolve true também se ela já estava cancelada. */
export async function cancelarAssinaturaMP(cfg: ConfigMP, assinaturaId: string, tentativas = 3): Promise<boolean> {
  for (let i = 0; i < tentativas; i++) {
    try {
      const r = await mpFetch(cfg, "PUT", `/preapproval/${encodeURIComponent(assinaturaId)}`, { status: "cancelled" });
      if (r.ok) return true;
      const atual = await mpFetch(cfg, "GET", `/preapproval/${encodeURIComponent(assinaturaId)}`);
      if (atual.ok && String(atual.data?.status || "").toLowerCase().startsWith("cancel")) return true;
      console.warn("Mercado Pago: cancelamento da assinatura não aceito (tentativa", i + 1, "):", r.status);
    } catch (e) {
      console.warn("Mercado Pago: falha ao cancelar assinatura:", e);
    }
    if (i < tentativas - 1) await new Promise((ok) => setTimeout(ok, 1500));
  }
  return false;
}

/**
 * Primeira cobrança de uma assinatura. Ela aparece alguns segundos depois de criada e só ganha o resultado do
 * pagamento (aprovado/recusado) um pouco depois: espera até o resultado existir (no máximo ~16 s) e, se não vier,
 * devolve o que houver (o aviso do Mercado Pago conclui depois).
 */
export async function primeiraCobrancaDaAssinatura(cfg: ConfigMP, assinaturaId: string, tentativas = 8): Promise<any | null> {
  let ultima: any = null;
  for (let i = 0; i < tentativas; i++) {
    const r = await mpFetch(cfg, "GET", `/authorized_payments/search?preapproval_id=${encodeURIComponent(assinaturaId)}`);
    const lista = r.ok && Array.isArray(r.data?.results) ? r.data.results : [];
    if (lista.length > 0) {
      ultima = lista[0];
      if (ultima?.payment?.status) return ultima;
    }
    await new Promise((ok) => setTimeout(ok, 2000));
  }
  return ultima;
}

/**
 * Garante que as renovações futuras sejam cobradas pelo preço de TABELA: o cupom (e o crédito do upgrade)
 * vale só para a primeira cobrança. Só altera depois de a 1ª cobrança existir, para não mexer nela.
 */
export async function alinharValorAssinatura(cfg: ConfigMP, assinaturaId: string, plano: Plano): Promise<boolean> {
  try {
    const a = await mpFetch(cfg, "GET", `/preapproval/${encodeURIComponent(assinaturaId)}`);
    if (!a.ok) return false;
    const atual = Number(a.data?.auto_recurring?.transaction_amount);
    const tabela = PLANOS[plano].valor;
    if (Math.abs(atual - tabela) < 0.005) return true;
    const r = await mpFetch(cfg, "PUT", `/preapproval/${encodeURIComponent(assinaturaId)}`, {
      auto_recurring: { transaction_amount: tabela, currency_id: "BRL" },
    });
    if (!r.ok) console.error("ATENÇÃO: não foi possível ajustar a assinatura para o preço de tabela", assinaturaId, r.status);
    return r.ok;
  } catch (e) {
    console.error("ATENÇÃO: falha ao ajustar o valor da assinatura:", e);
    return false;
  }
}
