/**
 * FONTE ÚNICA DE PREÇOS E REGRAS DE PARCELAMENTO (servidor). O valor cobrado NUNCA vem do navegador.
 * Se mudar o preço de um plano, altere aqui e também o texto exibido em /pagamento.
 */
export type Plano = "mensal" | "trimestral" | "anual";

export const PLANOS: Record<Plano, { ciclo: "MONTHLY" | "QUARTERLY" | "YEARLY"; valor: number; nome: string }> = {
  mensal: { ciclo: "MONTHLY", valor: 197.0, nome: "Mensal" },
  trimestral: { ciclo: "QUARTERLY", valor: 531.9, nome: "Trimestral" },
  anual: { ciclo: "YEARLY", valor: 2009.4, nome: "Anual" },
};

/** Crédito aplicado ao migrar do Trimestral para o Anual (mesmo valor exibido na tela de upgrade). */
export const CREDITO_UPGRADE_TRIMESTRAL_PARA_ANUAL = 177.3;

/** Valor mínimo de cobrança. Revisar com o mínimo exigido pelo provedor de pagamento em uso. */
export const VALOR_MINIMO_COBRANCA = 10.0;

export function ehPlano(valor: unknown): valor is Plano {
  return valor === "mensal" || valor === "trimestral" || valor === "anual";
}

export function arredondar(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export function calcularTotal(opts: { plano: Plano; percentualCupom?: number; credito?: number }): number {
  const base = PLANOS[opts.plano].valor;
  const desconto = arredondar((base * (opts.percentualCupom || 0)) / 100);
  return arredondar(Math.max(0, base - (opts.credito || 0) - desconto));
}

// ---------------------------------------------------------------------------
// PARCELAMENTO NO CARTÃO
// ---------------------------------------------------------------------------

/** Quantidades de parcelas aceitas por plano (cartão de crédito). Pix é sempre à vista. */
export const PARCELAS_PERMITIDAS: Record<Plano, number[]> = {
  mensal: [1],
  trimestral: [1, 2, 3],
  anual: [1, 3, 6, 10, 12],
};

/** Duração de cada plano em meses = intervalo até a renovação. */
export const MESES_DO_PLANO: Record<Plano, number> = { mensal: 1, trimestral: 3, anual: 12 };

/** Valor mínimo de cada parcela. */
export const VALOR_MINIMO_PARCELA = 5.0;

/** Valida a quantidade de parcelas pedida; devolve null se não for permitida para o plano/valor. */
export function normalizarParcelas(plano: Plano, pedido: unknown, total: number): number | null {
  const n = pedido === undefined || pedido === null || pedido === "" ? 1 : Number(pedido);
  if (!Number.isInteger(n) || !PARCELAS_PERMITIDAS[plano].includes(n)) return null;
  if (n > 1 && arredondar(total / n) < VALOR_MINIMO_PARCELA) return null;
  return n;
}

/** Data de hoje em São Paulo (YYYY-MM-DD). */
export function hojeSP(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Soma meses a uma data YYYY-MM-DD preservando o dia (31/jan + 1 mês = 28/fev). */
export function somarMeses(ymd: string, meses: number): string {
  const [a, m, d] = ymd.split("-").map(Number);
  const alvo = new Date(Date.UTC(a, m - 1 + meses, 1));
  const ultimoDia = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate();
  alvo.setUTCDate(Math.min(d, ultimoDia));
  return alvo.toISOString().split("T")[0];
}

/** Diferença em dias (b − a) entre duas datas YYYY-MM-DD. */
export function diasEntre(a: string, b: string): number {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
}
