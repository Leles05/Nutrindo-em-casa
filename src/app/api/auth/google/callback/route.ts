import { NextRequest, NextResponse } from "next/server";
import { createAnonServerClient, getSupabaseAdmin } from "@/lib/supabase";
import { salvarTokenGoogle } from "@/lib/googleTokens";
import { igualConstante, normalizarEmail, papelDoUsuario } from "@/lib/auth";
import { lerStateNutri, salvarConexaoNutri } from "@/lib/googleAgenda";
import { sincronizarPendentes } from "@/lib/agendaSync";

const ESCOPO_EVENTOS = "https://www.googleapis.com/auth/calendar.events";
const ESCOPO_FREEBUSY = "https://www.googleapis.com/auth/calendar.freebusy";

async function conectarAgendaDaNutri(
  req: NextRequest,
  ctx: { code: string | null; errorParam: string | null; rawState: string; origin: string; semCookie: (r: NextResponse) => NextResponse }
): Promise<NextResponse> {
  const { code, errorParam, rawState, origin, semCookie } = ctx;
  const voltar = (resultado: string) => semCookie(NextResponse.redirect(`${origin}/nutri?agenda=${resultado}`));

  const estado = lerStateNutri(rawState);
  const nonceCookie = req.cookies.get("g_oauth_nonce")?.value || "";
  if (!estado || !nonceCookie || !(await igualConstante(estado.nonce, nonceCookie))) return voltar("erro");
  if (errorParam || !code) return voltar("cancelado");

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return voltar("erro");

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenResponse.ok) {
      console.error("Google Agenda (nutri): erro ao trocar o código:", tokenResponse.status);
      return voltar("erro");
    }
    const tokenData = await tokenResponse.json();
    const escopos = String(tokenData.scope || "");
    // a nutri pode desmarcar permissões na tela do Google: sem elas a sincronização não funciona
    if (!escopos.includes(ESCOPO_EVENTOS) || !escopos.includes(ESCOPO_FREEBUSY)) return voltar("permissao");
    if (!tokenData.access_token || !tokenData.refresh_token) return voltar("erro");

    const userinfo = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

    await salvarConexaoNutri({
      usuarioEmail: estado.usuario,
      googleEmail: userinfo?.email ? normalizarEmail(userinfo.email) : null,
      refreshToken: tokenData.refresh_token,
      accessToken: tokenData.access_token,
      expiraEmSegundos: Number(tokenData.expires_in || 3600),
      escopos,
    });

    // consultas já marcadas antes da conexão entram na agenda dela agora
    await sincronizarPendentes().catch((e) => console.warn("Aviso ao sincronizar pendentes:", e));
    return voltar("conectada");
  } catch (err) {
    console.error("Google Agenda (nutri): erro no callback:", err);
    return voltar("erro");
  }
}

export async function GET(req: NextRequest) {
  const urlObj = new URL(req.url);
  const origin = urlObj.origin;
  const code = urlObj.searchParams.get("code");
  const errorParam = urlObj.searchParams.get("error");
  const rawState = urlObj.searchParams.get("state") || "";

  const semCookie = (res: NextResponse) => {
    res.cookies.set("g_oauth_nonce", "", { path: "/api/auth/google", maxAge: 0 });
    return res;
  };
  const voltarLogin = (query: string) => semCookie(NextResponse.redirect(`${origin}/login?${query}`));

  // Conexão do Google Agenda da NUTRICIONISTA: state assinado pelo servidor (contém um ponto "." — o do login comum não)
  if (rawState.includes(".")) return conectarAgendaDaNutri(req, { code, errorParam, rawState, origin, semCookie });

  if (errorParam || !code) return voltarLogin("erro=google_cancelado");

  // Anti-CSRF: o state devolvido pelo Google precisa conter o nonce do cookie desta sessão
  let returnTo = "";
  try {
    const estado = JSON.parse(Buffer.from(rawState, "base64url").toString("utf8"));
    const nonceCookie = req.cookies.get("g_oauth_nonce")?.value || "";
    if (!nonceCookie || typeof estado?.n !== "string" || !(await igualConstante(estado.n, nonceCookie))) {
      return voltarLogin("error=falha_google_oauth");
    }
    returnTo = typeof estado.r === "string" && /^\/(?![/\\])/.test(estado.r) ? estado.r : "";
  } catch {
    return voltarLogin("error=falha_google_oauth");
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!googleClientId || !googleClientSecret) return voltarLogin("erro=google_nao_configurado");

  try {
    // 1. Troca o código pelo token de acesso do Google
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenResponse.ok) {
      console.error("Erro na resposta de token do Google:", tokenResponse.status);
      return voltarLogin("error=falha_google_oauth");
    }
    const tokenData = await tokenResponse.json();
    const accessToken: string | undefined = tokenData.access_token;
    if (!accessToken) return voltarLogin("error=falha_google_oauth");

    // 2. Perfil do usuário no Google — o e-mail precisa estar VERIFICADO pelo Google
    const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userinfoResponse.ok) return voltarLogin("error=falha_google_perfil");

    const userData = await userinfoResponse.json();
    const email = normalizarEmail(userData.email);
    if (!email) return voltarLogin("error=email_nao_fornecido");
    if (userData.email_verified !== true && userData.email_verified !== "true") {
      return voltarLogin("error=falha_google_oauth");
    }

    salvarTokenGoogle(email, accessToken, tokenData.refresh_token);

    const comCookieCalendario = (res: NextResponse) => {
      res.cookies.set("google_calendar_token", accessToken, {
        path: "/",
        maxAge: 3600,
        sameSite: "lax",
        secure: origin.startsWith("https:"),
        httpOnly: false, // a tela do calendário só checa a PRESENÇA do cookie
      });
      return semCookie(res);
    };

    // Conexão do Google Agenda feita dentro do sistema (usuário já logado): volta para a tela de origem
    if (returnTo) return comCookieCalendario(NextResponse.redirect(`${origin}${returnTo}`));

    // 3. Só entra quem já tem perfil (assinatura) — sem cadastro automático
    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile } = await supabaseAdmin.from("profiles").select("status_assinatura, plano").eq("email", email).maybeSingle();
    if (!profile) return voltarLogin(`erro=sem_assinatura&email=${encodeURIComponent(email)}`);

    // 4. Cria uma sessão REAL do Supabase para este e-mail (link mágico gerado no servidor, resgatado aqui)
    const { data: link, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
    const tokenHash = link?.properties?.hashed_token;
    if (linkErr || !tokenHash) {
      console.error("Falha ao gerar sessão para login Google:", linkErr?.message);
      return voltarLogin("error=falha_google_oauth");
    }
    const { data: sessao, error: otpErr } = await createAnonServerClient().auth.verifyOtp({
      token_hash: tokenHash,
      type: "magiclink",
    });
    if (otpErr || !sessao?.session || !sessao.user) {
      console.error("Falha ao validar sessão para login Google:", otpErr?.message);
      return voltarLogin("error=falha_google_oauth");
    }

    const role = papelDoUsuario(sessao.user);
    const status = String(profile.status_assinatura || "").toUpperCase();
    if (role !== "nutri" && status !== "ATIVO" && status !== "ACTIVE" && status !== "PAGO") {
      return voltarLogin(`erro=sem_assinatura&email=${encodeURIComponent(email)}`);
    }

    // Tokens no FRAGMENTO (#): não vão para logs de servidor nem para o cabeçalho Referer
    const fragmento = new URLSearchParams({
      access_token: sessao.session.access_token,
      refresh_token: sessao.session.refresh_token,
    }).toString();
    return comCookieCalendario(NextResponse.redirect(`${origin}/login?oauth=${role}#${fragmento}`));
  } catch (err) {
    console.error("Erro no callback do Google OAuth:", err);
    return voltarLogin("error=falha_google_oauth");
  }
}
