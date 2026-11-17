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
  // Um único e-mail por compra: o checkout e os avisos do Asaas (CONFIRMED + RECEIVED) chegam quase juntos
  // e, para quem ainda não criou a senha, o Supabase reenviaria o convite a cada chamada.
  // A "reserva" é atômica: só quem consegue marcar o envio manda o e-mail (intervalo mínimo de 30 min).
  let reservado = false;
  try {
    const limite = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data, error: reservaErr } = await admin
      .from("profiles")
      .update({ acesso_enviado_em: new Date().toISOString() })
      .eq("email", email)
      .or(`acesso_enviado_em.is.null,acesso_enviado_em.lt.${limite}`)
      .select("email");
    if (!reservaErr) {
      if (!data || data.length === 0) return { enviado: false, motivo: "ja_enviado_recentemente" };
      reservado = true;
    }
    // reservaErr (ex.: coluna ainda não criada): segue e envia, como antes
  } catch {
    /* segue e envia */
  }

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${urlDoSite()}/criar-senha`,
    data: { name: nome || "Responsável" },
  });
  if (!error) return { enviado: true };

  // não enviou: libera a reserva para uma nova tentativa
  if (reservado) await admin.from("profiles").update({ acesso_enviado_em: null }).eq("email", email);

  const msg = (error.message || "").toLowerCase();
  if (msg.includes("already") || msg.includes("registered") || error.status === 422) {
    return { enviado: false, motivo: "conta_ja_existe" };
  }
  console.error("Falha ao enviar convite de acesso:", error.message);
  return { enviado: false, motivo: error.message };
}
