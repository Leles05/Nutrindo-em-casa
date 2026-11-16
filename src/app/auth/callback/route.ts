import { NextResponse } from "next/server";
import { createAnonServerClient, getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { normalizarEmail, papelDoUsuario } from "@/lib/auth";

/** Retorno do OAuth feito pelo próprio Supabase (fallback quando o Google direto não está configurado). */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code && isSupabaseConfigured()) {
    try {
      const { data, error } = await createAnonServerClient().auth.exchangeCodeForSession(code);
      if (!error && data?.session?.user) {
        const email = normalizarEmail(data.session.user.email);
        const role = papelDoUsuario(data.session.user);

        if (role !== "nutri") {
          // Só entra quem já assinou — sem cadastro automático
          const { data: existingProfile } = await getSupabaseAdmin()
            .from("profiles")
            .select("id")
            .eq("email", email)
            .maybeSingle();
          if (!existingProfile) {
            try {
              await getSupabaseAdmin().auth.admin.deleteUser(data.session.user.id);
            } catch {}
            return NextResponse.redirect(`${origin}/login?erro=sem_assinatura`);
          }
        }

        const fragmento = new URLSearchParams({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        }).toString();
        return NextResponse.redirect(`${origin}/login?oauth=${role}#${fragmento}`);
      }
    } catch (err) {
      console.warn("Aviso ao processar callback OAuth:", err);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=falha_oauth`);
}
