/** Regras puras da renovação por link (sem dependências: testadas em tests/pagamentos.test.ts). */

const dias = (a: string, b: string) => Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);

/** Quantos dias antes do vencimento o link (Pix) ou o aviso (cartão) é enviado, como informado nos Termos. */
export const DIAS_ANTES_DO_LINK = 7;

export interface PerfilRenovacaoLink {
  email: string;
  nome: string | null;
  plano: string | null;
  proxima_cobranca: string | null;
  renovacao_aviso_ciclo: string | null;
  renovacao_automatica: boolean | null;
  status_assinatura: string | null;
  gateway_assinatura_id: string | null;
  acesso_ate: string | null;
}

/** O link de renovação deste ciclo já deve ser enviado agora? (função pura, testada) */
export function precisaEnviarLink(p: PerfilRenovacaoLink, hoje: string): boolean {
  if (String(p.status_assinatura || "").toUpperCase() !== "ATIVO") return false;
  if (!p.renovacao_automatica || p.acesso_ate) return false; // cancelou a renovação
  if (p.gateway_assinatura_id) return false; // cartão à vista: o Mercado Pago renova sozinho
  if (!p.proxima_cobranca || !["mensal", "trimestral", "anual"].includes(String(p.plano || "").toLowerCase())) return false;
  if (p.renovacao_aviso_ciclo === p.proxima_cobranca) return false; // este ciclo já foi enviado
  return dias(hoje, p.proxima_cobranca) <= DIAS_ANTES_DO_LINK; // inclui atrasados dentro da carência
}

/** Aviso de renovação para quem tem ASSINATURA no cartão (o Mercado Pago cobra sozinho; avisamos 7 dias antes). */
export function precisaAvisarCartao(p: PerfilRenovacaoLink, hoje: string): boolean {
  if (String(p.status_assinatura || "").toUpperCase() !== "ATIVO") return false;
  if (!p.renovacao_automatica || p.acesso_ate) return false;
  if (!p.gateway_assinatura_id) return false;
  if (!p.proxima_cobranca || !["mensal", "trimestral", "anual"].includes(String(p.plano || "").toLowerCase())) return false;
  if (p.renovacao_aviso_ciclo === p.proxima_cobranca) return false;
  const faltam = dias(hoje, p.proxima_cobranca);
  return faltam >= 0 && faltam <= DIAS_ANTES_DO_LINK; // depois do vencimento a cobrança já foi tentada: sem aviso
}
