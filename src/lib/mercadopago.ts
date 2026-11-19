import { createHmac, timingSafeEqual } from "crypto";

/* eslint-disable @typescript-eslint/no-explicit-any -- respostas JSON da API do Mercado Pago */

/**
 * Cliente da API do Mercado Pago (Orders + Assinaturas) e validação dos avisos (webhook).
 * Nada daqui roda no navegador: a chave de acesso fica só no servidor.
 */

const API = "https://api.mercadopago.com";

export interface ConfigMP {
  token: string;
  webhookSecret: string;
}

/** Lê a configuração. Sem a chave de acesso, a integração fica desligada (os chamadores respondem 503). */
export function configMP(): ConfigMP | null {
  const token = (process.env.MERCADOPAGO_ACCESS_TOKEN || "").trim();
  if (!token) return null;
  return { token, webhookSecret: (process.env.MERCADOPAGO_WEBHOOK_SECRET || "").trim() };
}

export interface RespostaMP<T = Record<string, any>> {
  ok: boolean;
  status: number;
  data: T;
}

/** Chamada à API. `idempotencia` evita cobrança em duplicidade se a mesma requisição for repetida. */
export async function mpFetch<T = Record<string, any>>(
  cfg: ConfigMP,
  metodo: "GET" | "POST" | "PUT" | "DELETE",
  caminho: string,
  corpo?: unknown,
  opcoes: { idempotencia?: string; timeoutMs?: number } = {}
): Promise<RespostaMP<T>> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${cfg.token}`,
    "Content-Type": "application/json",
    accept: "application/json",
  };
  if (opcoes.idempotencia) headers["X-Idempotency-Key"] = opcoes.idempotencia;
  const res = await fetch(API + caminho, {
    method: metodo,
    headers,
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
    signal: AbortSignal.timeout(opcoes.timeoutMs ?? 25_000),
  });
  let data: any = {};
  try {
    data = await res.json();
  } catch {
    /* corpo vazio */
  }
  return { ok: res.ok, status: res.status, data };
}

/** Mensagem curta e segura para mostrar ao cliente a partir de uma resposta de erro do Mercado Pago. */
export function mensagemErroMP(r: RespostaMP, padrao: string): string {
  const detalhe = JSON.stringify(r.data || {});
  if (/rejected_by_issuer|rejected|insufficient|high_risk|bad_filled|cc_rejected/i.test(detalhe)) {
    return "O cartão não foi aprovado pela operadora. Confira os dados, use outro cartão ou escolha o Pix.";
  }
  return padrao;
}

// ---------------------------------------------------------------------------
// Avisos (webhook): assinatura x-signature
// ---------------------------------------------------------------------------

export interface DadosAssinaturaWebhook {
  xSignature: string | null;
  xRequestId: string | null;
  /** valor de `data.id` recebido na URL do aviso */
  dataId: string | null;
  segredo: string;
  /** relógio injetável para testes */
  agoraMs?: number;
  /** tolerância contra repetição de avisos antigos (replay) */
  toleranciaMs?: number;
}

/**
 * Confere a assinatura do aviso: HMAC-SHA256 de `id:{data.id em minúsculas};request-id:{x-request-id};ts:{ts};`
 * com o segredo do webhook, comparado em tempo constante. Recusa avisos com mais de 5 minutos.
 */
export function validarAssinaturaWebhook(d: DadosAssinaturaWebhook): boolean {
  if (!d.segredo || !d.xSignature || !d.dataId) return false;
  let ts = "";
  let v1 = "";
  for (const parte of d.xSignature.split(",")) {
    const [k, ...resto] = parte.split("=");
    const valor = resto.join("=").trim();
    if (k.trim() === "ts") ts = valor;
    if (k.trim() === "v1") v1 = valor;
  }
  if (!ts || !v1) return false;

  const tsMs = Number(ts.length <= 10 ? Number(ts) * 1000 : ts);
  const agora = d.agoraMs ?? Date.now();
  if (!Number.isFinite(tsMs) || Math.abs(agora - tsMs) > (d.toleranciaMs ?? 5 * 60 * 1000)) return false;

  const manifesto = `id:${d.dataId.toLowerCase()};request-id:${d.xRequestId ?? ""};ts:${ts};`;
  const esperado = createHmac("sha256", d.segredo).update(manifesto).digest("hex");
  const a = Buffer.from(esperado);
  const b = Buffer.from(v1);
  return a.length === b.length && timingSafeEqual(a, b);
}
