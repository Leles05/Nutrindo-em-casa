import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Autenticação REAL no servidor: valida o JWT do Supabase (Authorization: Bearer <access_token>)
 * consultando o próprio Supabase Auth. Nada aqui confia em e-mail/papel enviados pelo cliente.
 */

export type Role = "nutri" | "cliente";

export interface AuthContext {
  user: User;
  email: string;
  role: Role;
}

export function normalizarEmail(valor: unknown): string {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

/** O papel vem de app_metadata (só o servidor/admin consegue gravar) — NUNCA de user_metadata. */
export function papelDoUsuario(user: User): Role {
  return user.app_metadata?.role === "nutri" ? "nutri" : "cliente";
}

function extrairBearer(request: Request): string | null {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/** Retorna o contexto autenticado ou null (token ausente, inválido ou expirado). */
export async function autenticar(request: Request): Promise<AuthContext | null> {
  const token = extrairBearer(request);
  if (!token) return null;
  try {
    const { data, error } = await getSupabaseAdmin().auth.getUser(token);
    if (error || !data?.user?.email) return null;
    return {
      user: data.user,
      email: normalizarEmail(data.user.email),
      role: papelDoUsuario(data.user),
    };
  } catch {
    return null;
  }
}

export function naoAutenticado(): NextResponse {
  return NextResponse.json(
    { success: false, message: "Sessão inválida ou expirada. Faça login novamente." },
    { status: 401 }
  );
}

export function acessoNegado(): NextResponse {
  return NextResponse.json(
    { success: false, message: "Você não tem permissão para acessar este recurso." },
    { status: 403 }
  );
}

/** Exige usuário logado (cliente ou nutricionista). */
export async function exigirUsuario(request: Request): Promise<AuthContext | NextResponse> {
  const ctx = await autenticar(request);
  return ctx ?? naoAutenticado();
}

/** Exige a nutricionista. */
export async function exigirNutri(request: Request): Promise<AuthContext | NextResponse> {
  const ctx = await autenticar(request);
  if (!ctx) return naoAutenticado();
  if (ctx.role !== "nutri") return acessoNegado();
  return ctx;
}

/**
 * Resolve de quem são os dados pedidos.
 * - Cliente: sempre o próprio e-mail; se pedir outro e-mail => 403.
 * - Nutricionista: pode informar o e-mail do paciente; sem informar, usa o próprio.
 */
export function resolverEmailAlvo(ctx: AuthContext, solicitado?: unknown): string | NextResponse {
  const pedido = normalizarEmail(solicitado);
  if (!pedido || pedido === ctx.email) return ctx.email;
  if (ctx.role === "nutri") return pedido;
  return acessoNegado();
}

export function ehResposta(valor: unknown): valor is NextResponse {
  return valor instanceof NextResponse;
}

/** Comparação de segredos em tempo constante (evita ataque de tempo). */
export async function igualConstante(a: string, b: string): Promise<boolean> {
  const { timingSafeEqual, createHash } = await import("crypto");
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** CPF: valida os dois dígitos verificadores. */
export function cpfEhValido(cpf: string): boolean {
  const d = String(cpf || "").replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const calc = (base: number) => {
    let soma = 0;
    for (let i = 0; i < base; i++) soma += parseInt(d[i], 10) * (base + 1 - i);
    const r = 11 - (soma % 11);
    return r >= 10 ? 0 : r;
  };
  return calc(9) === parseInt(d[9], 10) && calc(10) === parseInt(d[10], 10);
}

export function ipDaRequisicao(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0].trim() : request.headers.get("x-real-ip")) || "desconhecido";
}
