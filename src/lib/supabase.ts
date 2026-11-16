import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

/**
 * Cliente público do Supabase para uso EXCLUSIVO no navegador (client components).
 * Nunca use este cliente em rotas de API: ele é um singleton e guarda sessão em memória.
 * Configurado com fallbacks para não falhar durante o build.
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Cliente administrativo (Service Role) para uso exclusivo no servidor.
 * Faz bypass do RLS: use somente depois de autenticar/autorizar a requisição (ver lib/auth.ts).
 * Falha de forma explícita se a chave não existir — nunca degrada para a anon key.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.");
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Cliente anônimo NOVO a cada chamada, para operações de autenticação no servidor
 * (signInWithPassword, refreshSession, verifyOtp). Evita compartilhar sessão entre requisições.
 */
export function createAnonServerClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/**
 * Helper utilitário para checar se as variáveis do Supabase estão configuradas.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-url")
  );
}
