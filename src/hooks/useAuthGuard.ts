"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface AuthState {
  autenticado: boolean;
  carregando: boolean;
  userEmail: string | null;
  userRole: "nutri" | "cliente";
  statusAssinatura: string;
  diasRestantes: number;
  planoExpirado: boolean;
  avisoVencimento: boolean;
}

export function encerrarSessao() {
  if (typeof window !== "undefined") {
    // 1. Salvar antes todas as chaves que começam com nutrindo_tour_
    const tourBackup: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("nutrindo_tour_")) {
        const val = localStorage.getItem(key);
        if (val !== null) {
          tourBackup[key] = val;
        }
      }
    }

    // Salvar também em um cookie persistente caso tenha sido marcado permanentemente
    const tourOculto =
      localStorage.getItem("nutrindo_tour_oculto_permanente") === "true" ||
      document.cookie.includes("nutrindo_tour_oculto=true");

    if (tourOculto) {
      document.cookie = "nutrindo_tour_oculto=true; path=/; max-age=31536000; SameSite=Lax";
    }

    // Limpar localStorage
    localStorage.clear();

    // 2. Restaurar imediatamente as chaves do tour após o clear
    Object.entries(tourBackup).forEach(([k, val]) => {
      localStorage.setItem(k, val);
    });

    if (document.cookie.includes("nutrindo_tour_oculto=true")) {
      localStorage.setItem("nutrindo_tour_oculto_permanente", "true");
    }
  }
  if (isSupabaseConfigured()) {
    try {
      supabase.auth.signOut().catch(() => {});
    } catch {}
  }
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

export function useAuthGuard(): AuthState {
  const router = useRouter();
  const pathname = usePathname();

  const temSessao = typeof window !== "undefined"
    ? Boolean(localStorage.getItem("nutrindo_user_email")?.trim() && localStorage.getItem("nutrindo_auth_token")?.trim())
    : true;

  // Redirecionamento instantâneo se não houver credenciais ativas
  if (typeof window !== "undefined" && !temSessao) {
    try {
      window.location.replace("/");
    } catch {}
  }

  const [autenticado, setAutenticado] = useState(false);
  const [carregando, setCarregando] = useState(temSessao);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"nutri" | "cliente">("cliente");
  const [statusAssinatura, setStatusAssinatura] = useState("ATIVO");
  const [diasRestantes, setDiasRestantes] = useState(24);
  const [planoExpirado, setPlanoExpirado] = useState(false);
  const [avisoVencimento, setAvisoVencimento] = useState(false);

  const checarSessao = useCallback(() => {
    if (typeof window === "undefined") return;

    const email = localStorage.getItem("nutrindo_user_email");
    const token = localStorage.getItem("nutrindo_auth_token");
    const roleSalva = (localStorage.getItem("nutrindo_user_role") || "cliente") as "nutri" | "cliente";

    // 1. Verificação Estrita de Sessão: Se não houver e-mail ou token de autenticação
    if (!email || !token) {
      setAutenticado(false);
      setCarregando(false);
      if (typeof window !== "undefined") {
        router.replace("/");
        window.location.replace("/");
      }
      return;
    }

    setUserEmail(email);
    setUserRole(roleSalva);

    const isNutri =
      roleSalva === "nutri" ||
      email === "metodonutrindoemcasa@gmail.com";

    // Se for Nutricionista (Dra. Laís):
    if (isNutri) {
      setUserRole("nutri");
      setStatusAssinatura("ATIVO");
      setDiasRestantes(999);
      setPlanoExpirado(false);
      setAvisoVencimento(false);
      setAutenticado(true);
      setCarregando(false);
      localStorage.setItem("anamnese_concluida", "true");
      localStorage.setItem("nutrindo_anamnese_concluida", "true");
      localStorage.setItem("consulta_agendada", "true");
      localStorage.setItem("nutrindo_consulta_agendada", "true");
      return;
    }

    // Se for rota exclusiva da nutri e o usuário for cliente comum, redireciona para o dashboard
    if (pathname.startsWith("/nutri")) {
      router.replace("/dashboard");
      return;
    }

    // 2. Verificação de Vigência do Plano para Clientes
    const statusSalvo = (localStorage.getItem("nutrindo_status_assinatura") || "ATIVO").toUpperCase();
    const diasSalvosRaw = localStorage.getItem("nutrindo_dias_restantes");
    const dias = diasSalvosRaw !== null ? parseInt(diasSalvosRaw, 10) : 24;

    setStatusAssinatura(statusSalvo);
    setDiasRestantes(dias);

    const expirado = dias <= 0 || statusSalvo === "EXPIRADO" || statusSalvo === "INADIMPLENTE";
    const aviso = !expirado && dias <= 5 && dias > 0;

    setPlanoExpirado(expirado);
    setAvisoVencimento(aviso);

    // Se o plano estiver expirado, permite autenticação para visualizar TelaBloqueioAssinatura e /configuracoes
    if (expirado) {
      setAutenticado(true);
      setCarregando(false);
      return;
    }

    // 3. Verificação de Regras Obrigatórias de Onboarding para usuários autenticados
    const anamneseConcluida =
      localStorage.getItem("anamnese_concluida") === "true" ||
      localStorage.getItem("nutrindo_anamnese_concluida") === "true";

    const consultaAgendada =
      localStorage.getItem("consulta_agendada") === "true" ||
      localStorage.getItem("nutrindo_consulta_agendada") === "true";

    // Se estiver em rota restrita e não concluiu a anamnese, só pode acessar /anamnese
    if (!anamneseConcluida && pathname !== "/anamnese") {
      router.replace("/anamnese");
      return;
    }

    // Se concluiu a anamnese mas não agendou a 1ª consulta, permite /dashboard, /dashboard/calendario e /configuracoes
    if (
      anamneseConcluida &&
      !consultaAgendada &&
      pathname !== "/dashboard" &&
      pathname !== "/dashboard/calendario" &&
      pathname !== "/anamnese" &&
      pathname !== "/configuracoes"
    ) {
      router.replace("/dashboard/calendario?onboarding=consulta");
      return;
    }

    setAutenticado(true);
    setCarregando(false);
  }, [pathname, router]);

  useEffect(() => {
    checarSessao();

    // Timeout máximo de segurança de 200ms para NUNCA ficar travado na tela de carregamento
    const timerSeguranca = setTimeout(() => {
      if (typeof window !== "undefined") {
        const email = localStorage.getItem("nutrindo_user_email")?.trim();
        const token = localStorage.getItem("nutrindo_auth_token")?.trim();
        if (!email || !token) {
          router.replace("/");
          window.location.replace("/");
        }
      }
    }, 200);

    // Permite que o Simulador de Vigência e outras abas atualizem o estado ao vivo
    const handleAtualizacao = () => checarSessao();
    window.addEventListener("nutrindo_assinatura_alterada", handleAtualizacao);
    window.addEventListener("storage", handleAtualizacao);

    return () => {
      clearTimeout(timerSeguranca);
      window.removeEventListener("nutrindo_assinatura_alterada", handleAtualizacao);
      window.removeEventListener("storage", handleAtualizacao);
    };
  }, [checarSessao]);

  return {
    autenticado,
    carregando,
    userEmail,
    userRole,
    statusAssinatura,
    diasRestantes,
    planoExpirado,
    avisoVencimento,
  };
}
