// Cache global em memória para persistência de tokens do Google Calendar por e-mail do usuário
interface GoogleTokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __googleTokenStore: Map<string, GoogleTokenData> | undefined;
}

if (!global.__googleTokenStore) {
  global.__googleTokenStore = new Map<string, GoogleTokenData>();
}

export const googleTokenStore = global.__googleTokenStore;

export function salvarTokenGoogle(email: string, accessToken: string, refreshToken?: string) {
  if (!email || !accessToken) return;
  const limpo = email.toLowerCase().trim();
  googleTokenStore.set(limpo, {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + 3600 * 1000,
  });
}

export function obterTokenGoogle(email: string): string | null {
  if (!email) return null;
  const limpo = email.toLowerCase().trim();
  const dados = googleTokenStore.get(limpo);
  if (!dados) return null;
  return dados.accessToken;
}

export async function obterOuRenovarTokenGoogle(email: string): Promise<string | null> {
  if (!email) return null;
  const limpo = email.toLowerCase().trim();
  const dados = googleTokenStore.get(limpo);
  if (!dados) return null;

  // Se o token ainda for válido por pelo menos 1 minuto, retorna direto
  if (Date.now() < dados.expiresAt - 60000) {
    return dados.accessToken;
  }

  // Se expirou e temos refresh_token, tenta renovar via endpoint OAuth do Google
  if (dados.refreshToken) {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (clientId && clientSecret) {
        const res = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: dados.refreshToken,
            grant_type: "refresh_token",
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.access_token) {
            salvarTokenGoogle(limpo, json.access_token, dados.refreshToken);
            return json.access_token;
          }
        }
      }
    } catch (err) {
      console.warn("Aviso ao renovar token do Google OAuth:", err);
    }
  }

  return dados.accessToken;
}
