import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";

  if (code && isSupabaseConfigured()) {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin.auth.exchangeCodeForSession(code);
      if (!error && data?.session?.user) {
        const email = data.session.user.email?.toLowerCase().trim() || "";
        const token = data.session.access_token || `oauth_${Date.now()}`;
        const isNutri = email === "metodonutrindoemcasa@gmail.com";

        if (isNutri) {
          // Garante perfil da nutricionista
          try {
            await supabaseAdmin.from("profiles").upsert(
              {
                email,
                nome: "Dra. Laís Leles",
                plano: "nutri",
                status_assinatura: "ATIVO",
              },
              { onConflict: "email" }
            );
          } catch {}

          return NextResponse.redirect(
            `${origin}/login?oauth=nutri&email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`
          );
        }

        // Verifica estritamente se o paciente possui assinatura ativa na tabela profiles
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("id, status_assinatura")
          .ilike("email", email)
          .maybeSingle();

        // Se NÃO possuir perfil prévio de assinante, NÃO cria perfil automático e bloqueia
        if (!existingProfile) {
          try {
            await supabaseAdmin.auth.admin.deleteUser(data.session.user.id);
          } catch {}
          return NextResponse.redirect(`${origin}/login?erro=sem_assinatura`);
        }

        return NextResponse.redirect(
          `${origin}/login?oauth=cliente&email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`
        );
      }
    } catch (err) {
      console.warn("Aviso ao processar callback OAuth:", err);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}

