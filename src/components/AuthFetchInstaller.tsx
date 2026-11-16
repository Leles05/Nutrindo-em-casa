"use client";

import { instalarAuthFetch } from "@/lib/authFetch";

// Executa no carregamento do módulo (antes dos efeitos das páginas), só no navegador.
instalarAuthFetch();

export default function AuthFetchInstaller() {
  return null;
}
