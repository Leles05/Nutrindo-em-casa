import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const urlObj = new URL(req.url);
  const origin = urlObj.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;
  const returnTo = urlObj.searchParams.get("returnTo") || urlObj.searchParams.get("redirect") || "";

  // Se as credenciais do Google OAuth estiverem configuradas diretamente no domínio
  if (googleClientId && googleClientSecret) {
    const params = new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events",
      access_type: "offline",
      prompt: "select_account",
      ...(returnTo ? { state: encodeURIComponent(returnTo) } : {}),
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    // Se a requisição veio via JSON fetch
    if (req.headers.get("accept")?.includes("application/json")) {
      return NextResponse.json({ url: googleAuthUrl });
    }

    return NextResponse.redirect(googleAuthUrl);
  }

  // Fallback seguro caso as chaves ainda não estejam preenchidas no .env.local
  return NextResponse.json({
    useSupabaseFallback: true,
    message: "Credenciais diretas do Google OAuth não configuradas no ambiente. Utilizando fallback do Supabase.",
  });
}
