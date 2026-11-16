import type { SupabaseClient } from "@supabase/supabase-js";

export interface CupomRow {
  id: string;
  codigo: string;
  percentual: number;
  data_validade: string | null;
  limite_usos: number | null;
  usos_atuais: number;
  ativo: boolean;
  created_at: string;
}

export type StatusCupom = "ativo" | "expirado" | "esgotado" | "desativado";

export function hojeSaoPaulo(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function formatarDataBR(dataYmd: string): string {
  const [ano, mes, dia] = String(dataYmd || "").split("T")[0].split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : String(dataYmd || "");
}

export function statusDoCupom(c: CupomRow, hoje = hojeSaoPaulo()): StatusCupom {
  if (!c.ativo) return "desativado";
  if (c.data_validade && hoje > c.data_validade.split("T")[0]) return "expirado";
  if (c.limite_usos && c.usos_atuais >= c.limite_usos) return "esgotado";
  return "ativo";
}

export function mensagemDoStatus(c: CupomRow, status: StatusCupom): string {
  if (status === "desativado") return "Este cupom está desativado.";
  if (status === "expirado") return `Este cupom expirou em ${formatarDataBR(c.data_validade || "")}`;
  if (status === "esgotado") return "Este cupom atingiu o limite máximo de usos";
  return "";
}

/** Formato usado pelo painel da nutricionista (compatível com a tela existente). */
export function cupomParaPainel(c: CupomRow) {
  return {
    id: c.id,
    codigo: c.codigo,
    percentual: c.percentual,
    dataValidade: c.data_validade,
    limiteUsos: c.limite_usos,
    usosAtuais: c.usos_atuais,
    ativo: c.ativo,
    criadoEm: c.created_at,
    status: statusDoCupom(c),
  };
}

export function normalizarCodigoCupom(valor: unknown): string {
  return String(valor || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
}

/** Busca o cupom pelo código (sem consumir). */
export async function buscarCupom(admin: SupabaseClient, codigo: string): Promise<CupomRow | null> {
  const cod = normalizarCodigoCupom(codigo);
  if (!cod) return null;
  const { data } = await admin.from("cupons").select("*").ilike("codigo", cod).maybeSingle();
  return (data as CupomRow) || null;
}

/**
 * Consome 1 uso do cupom de forma atômica (valida ativo/validade/limite e incrementa numa instrução só).
 * Retorna o cupom consumido, ou null se não for mais válido.
 */
export async function consumirCupom(
  admin: SupabaseClient,
  codigo: string
): Promise<{ codigo: string; percentual: number } | null> {
  const cod = normalizarCodigoCupom(codigo);
  if (!cod) return null;
  const { data, error } = await admin.rpc("consumir_cupom", { p_codigo: cod });
  if (error || !data || (Array.isArray(data) && data.length === 0)) return null;
  const linha = Array.isArray(data) ? data[0] : data;
  return { codigo: linha.codigo, percentual: Number(linha.percentual) };
}

export async function devolverCupom(admin: SupabaseClient, codigo: string): Promise<void> {
  const cod = normalizarCodigoCupom(codigo);
  if (cod) await admin.rpc("devolver_cupom", { p_codigo: cod });
}
