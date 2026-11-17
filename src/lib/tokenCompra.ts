import { createHmac, timingSafeEqual } from "crypto";

/**
 * "Chave de acesso da compra": entregue só ao navegador que fez o checkout.
 * Permite criar a senha na própria tela de pagamento (sem precisar abrir o link do e-mail),
 * mas apenas depois do pagamento confirmado e uma única vez (o servidor confere o resto).
 */

const VALIDADE_MS = 45 * 60 * 1000;

function segredo(): string {
  const s = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("Segredo para assinar a chave de acesso da compra não configurado.");
  return s;
}

function assinar(corpo: string): string {
  return createHmac("sha256", segredo()).update(`compra:${corpo}`).digest("base64url");
}

export function criarTokenCompra(email: string, paymentId: string): string {
  const corpo = Buffer.from(JSON.stringify({ e: email, p: paymentId, x: Date.now() + VALIDADE_MS })).toString("base64url");
  return `${corpo}.${assinar(corpo)}`;
}

export function lerTokenCompra(token: unknown): { email: string; paymentId: string } | null {
  const [corpo, assinatura] = String(token || "").split(".");
  if (!corpo || !assinatura) return null;
  try {
    const esperado = Buffer.from(assinar(corpo));
    const recebido = Buffer.from(assinatura);
    if (esperado.length !== recebido.length || !timingSafeEqual(esperado, recebido)) return null;
    const d = JSON.parse(Buffer.from(corpo, "base64url").toString("utf8"));
    if (typeof d.e !== "string" || typeof d.p !== "string" || Date.now() > Number(d.x)) return null;
    return { email: d.e, paymentId: d.p };
  } catch {
    return null;
  }
}
