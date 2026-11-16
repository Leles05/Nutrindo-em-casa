/** Cliente mínimo da API do Asaas (servidor). Sem fallbacks: se falhar, o erro chega ao chamador. */

export interface AsaasConfig {
  baseUrl: string;
  apiKey: string;
}

export interface AsaasResposta<T = any> {
  ok: boolean;
  status: number;
  data: T;
}

/**
 * Lê a configuração. A URL é OBRIGATÓRIA (nada de "adivinhar" sandbox/produção pela chave):
 *   sandbox:  https://api-sandbox.asaas.com/v3  (ou https://sandbox.asaas.com/api/v3)
 *   produção: https://api.asaas.com/v3
 */
export function configAsaas(): AsaasConfig | null {
  const apiKey = (process.env.ASAAS_API_KEY || "")
    .replace(/^["']|["']$/g, "")
    .replace(/\\([$"\\])/g, "$1")
    .trim();
  const baseUrl = (process.env.ASAAS_API_URL || "").trim().replace(/\/$/, "");
  if (!apiKey || !baseUrl) return null;
  return { apiKey, baseUrl };
}

export async function asaasFetch<T = any>(
  cfg: AsaasConfig,
  method: "GET" | "POST" | "PUT" | "DELETE",
  caminho: string,
  corpo?: unknown,
  timeoutMs = 20000
): Promise<AsaasResposta<T>> {
  const res = await fetch(`${cfg.baseUrl}${caminho}`, {
    method,
    headers: {
      access_token: cfg.apiKey,
      "Content-Type": "application/json",
      "User-Agent": "nutrindo-em-casa",
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
    signal: AbortSignal.timeout(timeoutMs),
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {}
  return { ok: res.ok, status: res.status, data };
}

/** Mensagem legível (em português) do primeiro erro retornado pelo Asaas. */
export function mensagemErroAsaas(resp: AsaasResposta, padrao: string): string {
  return resp?.data?.errors?.[0]?.description || padrao;
}

// ---------------------------------------------------------------------------
// COMPRA PARCELADA NO CARTÃO (uma cobrança única dividida em N parcelas no cartão do cliente)
// ---------------------------------------------------------------------------
export interface CompraParceladaParams {
  customerId: string;
  valorTotal: number;
  parcelas: number;
  descricao: string;
  referencia: string; // e-mail do cliente (volta nos eventos do webhook)
  hoje: string; // YYYY-MM-DD
  remoteIp?: string;
  /** Primeira compra: dados do cartão + titular. */
  cartao?: {
    creditCard: Record<string, string>;
    creditCardHolderInfo: Record<string, string>;
  };
  /** Renovação: cartão salvo (token devolvido pelo Asaas na compra anterior). */
  token?: string;
}

export async function criarCobrancaParcelada(cfg: AsaasConfig, p: CompraParceladaParams): Promise<AsaasResposta> {
  const corpo: Record<string, unknown> = {
    customer: p.customerId,
    billingType: "CREDIT_CARD",
    dueDate: p.hoje,
    description: p.descricao,
    externalReference: p.referencia,
  };
  if (p.parcelas > 1) {
    corpo.installmentCount = p.parcelas;
    corpo.totalValue = p.valorTotal;
  } else {
    corpo.value = p.valorTotal;
  }
  if (p.token) corpo.creditCardToken = p.token;
  if (p.cartao) {
    corpo.creditCard = p.cartao.creditCard;
    corpo.creditCardHolderInfo = p.cartao.creditCardHolderInfo;
  }
  if (p.remoteIp) corpo.remoteIp = p.remoteIp;
  // Compras em muitas parcelas levam cerca de 1s por parcela para serem criadas (12x ≈ 15s)
  return asaasFetch(cfg, "POST", "/payments", corpo, 55000);
}

/** Todas as parcelas de uma compra parcelada, em ordem (1..N). */
export async function listarParcelas(cfg: AsaasConfig, installmentId: string): Promise<any[]> {
  const r = await asaasFetch(cfg, "GET", `/installments/${installmentId}/payments?limit=100`);
  const lista: any[] = Array.isArray(r.data?.data) ? r.data.data : [];
  return lista.sort((a, b) => Number(a.installmentNumber) - Number(b.installmentNumber));
}

/** Desfaz uma compra parcelada: estorna se já foi paga, cancela se ainda não. Uso: falha ao gravar no banco. */
export async function desfazerCompraParcelada(cfg: AsaasConfig, installmentId: string, paga: boolean): Promise<void> {
  try {
    if (paga) {
      const r = await asaasFetch(cfg, "POST", `/installments/${installmentId}/refund`);
      if (r.ok) return;
      console.error("ATENÇÃO: não foi possível estornar o parcelamento", installmentId, r.status, r.data?.errors);
    }
    await asaasFetch(cfg, "DELETE", `/installments/${installmentId}`);
  } catch (e) {
    console.error("ATENÇÃO: falha ao desfazer o parcelamento", installmentId, e);
  }
}
