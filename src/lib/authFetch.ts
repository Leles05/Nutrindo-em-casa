/**
 * Interceptador de fetch (somente navegador).
 * Anexa `Authorization: Bearer <access_token>` em toda chamada às rotas internas `/api/*`
 * e renova a sessão automaticamente (1 tentativa) quando a API responde 401.
 * Assim as telas não precisam tratar token individualmente.
 */

const TOKEN_KEY = "nutrindo_auth_token";
const REFRESH_KEY = "nutrindo_refresh_token";
// Rotas públicas / de autenticação: nunca disparam renovação nem redirecionamento
const ROTAS_SEM_RENOVACAO = ["/api/auth/login", "/api/auth/refresh", "/api/auth/forgot-password", "/api/auth/esqueci-senha"];

let renovando: Promise<string | null> | null = null;

function caminhoDaApi(input: RequestInfo | URL): string | null {
  try {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : null;
    if (!url) return null;
    const u = new URL(url, window.location.origin);
    if (u.origin !== window.location.origin || !u.pathname.startsWith("/api/")) return null;
    return u.pathname;
  } catch {
    return null;
  }
}

export function salvarSessao(token?: string | null, refreshToken?: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  } catch {}
}

export function limparSessao() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {}
}

async function renovarSessao(originalFetch: typeof fetch): Promise<string | null> {
  if (renovando) return renovando;
  renovando = (async () => {
    try {
      const refresh = localStorage.getItem(REFRESH_KEY);
      if (!refresh) return null;
      const res = await originalFetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data?.token) return null;
      salvarSessao(data.token, data.refresh_token);
      return data.token as string;
    } catch {
      return null;
    } finally {
      setTimeout(() => {
        renovando = null;
      }, 0);
    }
  })();
  return renovando;
}

export function instalarAuthFetch() {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __authFetchInstalado?: boolean };
  if (w.__authFetchInstalado) return;
  w.__authFetchInstalado = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const caminho = caminhoDaApi(input);
    if (!caminho) return originalFetch(input, init);

    const headers = new Headers(init?.headers || {});
    const headerExplicito = headers.has("Authorization");
    if (!headerExplicito) {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }

    let res = await originalFetch(input, { ...init, headers });

    if (res.status === 401 && !headerExplicito && !ROTAS_SEM_RENOVACAO.includes(caminho)) {
      const novoToken = await renovarSessao(originalFetch);
      if (novoToken) {
        headers.set("Authorization", `Bearer ${novoToken}`);
        res = await originalFetch(input, { ...init, headers });
      } else if (localStorage.getItem(TOKEN_KEY)) {
        // havia sessão, mas não dá mais para renová-la: volta ao login
        limparSessao();
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login?erro=sessao_expirada";
        }
      }
    }
    return res;
  };
}
