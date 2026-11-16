import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

/** Início do login com Google. Gera um `state` aleatório (anti-CSRF) guardado em cookie httpOnly. */
export async function GET(req: NextRequest) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const urlObj = new URL(req.url);
  const redirectUri = `${urlObj.origin}/api/auth/google/callback`;
  // returnTo só é aceito se for um caminho interno ("/algo"), nunca "//host" ou URL externa
  const returnToBruto = urlObj.searchParams.get("returnTo") || urlObj.searchParams.get("redirect") || "";
  const returnTo = /^\/(?![/\\])/.test(returnToBruto) ? returnToBruto : "";

  if (!googleClientId || !googleClientSecret) {
    return NextResponse.json({
      useSupabaseFallback: true,
      message: "Credenciais diretas do Google OAuth não configuradas no ambiente. Utilizando fallback do Supabase.",
    });
  }

  const nonce = randomBytes(24).toString("base64url");
  const state = Buffer.from(JSON.stringify({ n: nonce, r: returnTo })).toString("base64url");

  const params = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope:
      "openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events",
    access_type: "offline",
    prompt: "select_account",
    state,
  });
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  const resposta = req.headers.get("accept")?.includes("application/json")
    ? NextResponse.json({ url: googleAuthUrl })
    : NextResponse.redirect(googleAuthUrl);

  resposta.cookies.set("g_oauth_nonce", nonce, {
    httpOnly: true,
    secure: urlObj.protocol === "https:",
    sameSite: "lax",
    path: "/api/auth/google",
    maxAge: 600,
  });
  return resposta;
}
