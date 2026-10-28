import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { salvarTokenGoogle } from "@/lib/googleTokens";

export async function GET(req: NextRequest) {
  const urlObj = new URL(req.url);
  const code = urlObj.searchParams.get("code");
  const errorParam = urlObj.searchParams.get("error");
  const rawState = urlObj.searchParams.get("state");
  const stateRedirect = rawState ? decodeURIComponent(rawState) : null;
  const origin = urlObj.origin;

  if (errorParam || !code) {
    return NextResponse.redirect(`${origin}/login?erro=google_cancelado`);
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${origin}/api/auth/google/callback`;

  if (!googleClientId || !googleClientSecret) {
    return NextResponse.redirect(`${origin}/login?erro=google_nao_configurado`);
  }

  try {
    // 1. Troca o código de autorização pelo token de acesso
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Erro na resposta de token do Google:", await tokenResponse.text());
      return NextResponse.redirect(`${origin}/login?error=falha_google_oauth`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const idToken = tokenData.id_token || `google_${Date.now()}`;

    // 2. Obtém perfil do usuário no Google
    const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userinfoResponse.ok) {
      return NextResponse.redirect(`${origin}/login?error=falha_google_perfil`);
    }

    const userData = await userinfoResponse.json();
    const email = String(userData.email || "").toLowerCase().trim();

    if (!email) {
      return NextResponse.redirect(`${origin}/login?error=email_nao_fornecido`);
    }

    if (accessToken) {
      salvarTokenGoogle(email, accessToken, tokenData.refresh_token);
    }

    // Helper para gerar resposta de redirect com cookie de token do calendário
    const criarRedirectComCookie = (targetUrl: string) => {
      const res = NextResponse.redirect(targetUrl);
      if (accessToken) {
        res.cookies.set("google_calendar_token", accessToken, {
          path: "/",
          maxAge: 3600 * 24, // 24 horas
          sameSite: "lax",
          httpOnly: false, // Disponível para API e clientside
        });
      }
      return res;
    };

    // Se a autenticação foi disparada diretamente para sincronizar o calendário em uma tela interna
    if (stateRedirect && stateRedirect.startsWith("/")) {
      return criarRedirectComCookie(`${origin}${stateRedirect}`);
    }

    // 3. Caso especial: Nutricionista Oficial
    if (email === "metodonutrindoemcasa@gmail.com") {
      return criarRedirectComCookie(
        `${origin}/login?oauth=nutri&email=${encodeURIComponent(email)}&token=${encodeURIComponent(idToken)}&calendar_token=${encodeURIComponent(accessToken || "")}`
      );
    }

    // 4. Valida se o usuário possui perfil e assinatura ativa em public.profiles
    const supabaseAdmin = getSupabaseAdmin();
    if (supabaseAdmin) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .ilike("email", email)
        .maybeSingle();

      if (!profile) {
        return NextResponse.redirect(`${origin}/login?erro=sem_assinatura&email=${encodeURIComponent(email)}`);
      }

      const status = (profile.status_assinatura || "").toUpperCase();
      if (status !== "ATIVO" && status !== "ACTIVE" && status !== "PAGO") {
        return NextResponse.redirect(`${origin}/login?erro=sem_assinatura&email=${encodeURIComponent(email)}`);
      }

      // Se o usuário ainda não existir no Supabase Auth, cria automaticamente com email_confirm: true
      let authToken = idToken;
      try {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const existingAuthUser = listData?.users?.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase()
        );

        if (!existingAuthUser) {
          const { data: createdUser } = await supabaseAdmin.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: {
              name: profile.nome || userData.name || "Responsável",
              role: "cliente",
            },
          });
          if (createdUser?.user) {
            authToken = `token_${createdUser.user.id}`;
          }
        } else {
          authToken = `token_${existingAuthUser.id}`;
        }
      } catch (authCreateErr) {
        console.warn("Aviso ao garantir usuário no Supabase Auth:", authCreateErr);
      }

      return criarRedirectComCookie(
        `${origin}/login?oauth=cliente&email=${encodeURIComponent(email)}&token=${encodeURIComponent(authToken)}&calendar_token=${encodeURIComponent(accessToken || "")}`
      );
    }

    // Se o supabaseAdmin não estiver disponível, redireciona cliente
    return criarRedirectComCookie(
      `${origin}/login?oauth=cliente&email=${encodeURIComponent(email)}&token=${encodeURIComponent(idToken)}&calendar_token=${encodeURIComponent(accessToken || "")}`
    );
  } catch (err) {
    console.error("Erro no callback do Google OAuth:", err);
    return NextResponse.redirect(`${origin}/login?error=falha_google_oauth`);
  }
}
