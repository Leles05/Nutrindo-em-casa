import type { SupabaseClient } from "@supabase/supabase-js";

/** URL pública do site (usada nos links dos e-mails). Nunca confia em cabeçalhos da requisição. */
export function urlDoSite(fallbackOrigin?: string): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return (fallbackOrigin || "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Libera o acesso do cliente DEPOIS que o pagamento foi confirmado:
 * envia o convite do Supabase com o link para criar a senha (/criar-senha).
 * Se a conta já existe no Auth (ex.: renovação, upgrade), não envia nada.
 */
export async function liberarAcessoPosPagamento(
  admin: SupabaseClient,
  email: string,
  nome: string
): Promise<{ enviado: boolean; motivo?: string }> {
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${urlDoSite()}/criar-senha`,
    data: { name: nome || "Responsável" },
  });
  if (!error) return { enviado: true };

  const msg = (error.message || "").toLowerCase();
  if (msg.includes("already") || msg.includes("registered") || error.status === 422) {
    return { enviado: false, motivo: "conta_ja_existe" };
  }
  console.error("Falha ao enviar convite de acesso:", error.message);
  return { enviado: false, motivo: error.message };
}
