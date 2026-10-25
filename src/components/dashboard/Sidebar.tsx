"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, Utensils, PlayCircle, Calendar, MessageCircle, Settings, LogOut, Lock, Eye, X, ArrowRight, CheckCircle2, UtensilsCrossed, FileText } from "lucide-react";
import { encerrarSessao } from "@/hooks/useAuthGuard";

export default function Sidebar() {
  const pathname = usePathname();
  const [consultaAgendada, setConsultaAgendada] = useState(true);
  const [anamneseConcluida, setAnamneseConcluida] = useState(true);
  const [isNutri, setIsNutri] = useState(false);
  const [visitouReceitas, setVisitouReceitas] = useState(false);
  const [modalBloqueioAberto, setModalBloqueioAberto] = useState(false);
  const [moduloBloqueadoNome, setModuloBloqueadoNome] = useState("");

  const checarEstado = () => {
    if (typeof window === "undefined") return;

    const role = localStorage.getItem("nutrindo_user_role");
    const email = (localStorage.getItem("nutrindo_user_email") || "").toLowerCase().trim();

    // 1. Somente a nutricionista visualiza o atalho do Portal Clínico no rodapé
    const ehNutri =
      role === "nutri" ||
      email === "metodonutrindoemcasa@gmail.com";
    setIsNutri(ehNutri);

    // 2. Anamnese e Consulta (Nutricionista sempre 100% desbloqueada na visão do paciente)
    const anamneseSalva =
      ehNutri ||
      localStorage.getItem("anamnese_concluida") === "true" ||
      localStorage.getItem("nutrindo_anamnese_concluida") === "true";

    const consultaSalva =
      ehNutri ||
      localStorage.getItem("consulta_agendada") === "true" ||
      localStorage.getItem("nutrindo_consulta_agendada") === "true";

    setAnamneseConcluida(anamneseSalva);
    setConsultaAgendada(consultaSalva);

    // 3. Status de visita ao módulo de Plano & Receitas
    const jaVisitou = localStorage.getItem("nutrindo_visitou_receitas") === "true";
    if (pathname?.startsWith("/dashboard/receitas")) {
      localStorage.setItem("nutrindo_visitou_receitas", "true");
      setVisitouReceitas(true);
    } else {
      setVisitouReceitas(jaVisitou);
    }
  };

  useEffect(() => {
    checarEstado();

    const handleSync = () => checarEstado();
    window.addEventListener("storage", handleSync);
    window.addEventListener("nutrindo_onboarding_atualizado", handleSync);
    window.addEventListener("nutrindo_assinatura_alterada", handleSync);
    window.addEventListener("nutrindo_visitou_receitas_alterado", handleSync);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("nutrindo_onboarding_atualizado", handleSync);
      window.removeEventListener("nutrindo_assinatura_alterada", handleSync);
      window.removeEventListener("nutrindo_visitou_receitas_alterado", handleSync);
    };
  }, [pathname]);

  const navItems = [
    {
      name: "Início",
      href: "/dashboard",
      icon: Home,
      color: "hover:bg-[#4C6C54] hover:text-white",
      activeColor: "bg-[#4C6C54] text-white shadow-xs",
      isActive: pathname === "/dashboard",
      bloqueadoSemConsulta: false,
      tourId: "sidebar-inicio",
    },
    {
      name: "Orientações da Nutri",
      href: "/dashboard/devolutivas",
      icon: FileText,
      color: "hover:bg-[#4C6C54] hover:text-white",
      activeColor: "bg-[#4C6C54] text-white shadow-xs",
      isActive: pathname?.startsWith("/dashboard/devolutivas"),
      bloqueadoSemConsulta: true,
      tourId: "sidebar-devolutivas",
    },
    {
      name: "Diário",
      href: "/dashboard/diario",
      icon: Utensils,
      color: "hover:bg-[#4C6C54] hover:text-white",
      activeColor: "bg-[#4C6C54] text-white shadow-xs",
      isActive: pathname?.startsWith("/dashboard/diario"),
      bloqueadoSemConsulta: true,
      tourId: "sidebar-diario",
    },
    {
      name: "Cursos",
      href: "/dashboard/cursos",
      icon: PlayCircle,
      color: "hover:bg-[#4C6C54] hover:text-white",
      activeColor: "bg-[#4C6C54] text-white shadow-xs",
      isActive: pathname === "/dashboard/cursos" || pathname?.startsWith("/dashboard/cursos") || pathname === "/cursos" || pathname?.startsWith("/cursos"),
      bloqueadoSemConsulta: true,
      tourId: "sidebar-cursos",
    },
    {
      name: "Calendário",
      href: "/dashboard/calendario",
      icon: Calendar,
      color: "hover:bg-[#4C6C54] hover:text-white",
      activeColor: "bg-[#4C6C54] text-white shadow-xs",
      isActive: pathname?.startsWith("/dashboard/calendario"),
      bloqueadoSemConsulta: false,
      tourId: "sidebar-calendario",
    },
    {
      name: "Chat",
      href: "/dashboard/chat",
      icon: MessageCircle,
      color: "hover:bg-[#4C6C54] hover:text-white",
      activeColor: "bg-[#4C6C54] text-white shadow-xs",
      isActive: pathname?.startsWith("/dashboard/chat"),
      bloqueadoSemConsulta: true,
      tourId: "paciente-chat",
    },
    {
      name: "Configurações",
      href: "/configuracoes",
      icon: Settings,
      color: "hover:bg-[#4C6C54] hover:text-white",
      activeColor: "bg-[#4C6C54] text-white shadow-xs",
      isActive: pathname?.startsWith("/configuracoes"),
      bloqueadoSemConsulta: true,
      tourId: "sidebar-configuracoes",
    },
  ];

  return (
    <aside className="w-52 bg-white border-r border-slate-200 flex flex-col shadow-xs shrink-0 z-20">
      <div className="h-16 flex items-center justify-center border-b border-slate-100 px-3">
        <Link href="/dashboard" className="relative h-10 w-28 block hover:opacity-85 transition-opacity">
          <Image 
            src="/logo-transparente.png" 
            alt="Nutrindo em Casa" 
            fill 
            className="object-contain" 
            priority 
          />
        </Link>
      </div>

      <nav className="flex-1 p-3 flex flex-col gap-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const estaBloqueado = !isNutri && !consultaAgendada && item.bloqueadoSemConsulta;

          if (estaBloqueado) {
            return (
              <button
                key={item.name}
                id={item.tourId}
                type="button"
                data-tour={item.tourId}
                onClick={() => {
                  setModuloBloqueadoNome(item.name);
                  setModalBloqueioAberto(true);
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-400 bg-slate-50/60 hover:bg-slate-100 transition-all text-xs font-semibold cursor-pointer group text-left"
                title={`Clique para entender como desbloquear o módulo ${item.name}`}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className="h-4 w-4 shrink-0 text-slate-400" />
                  <span>{item.name}</span>
                </div>
                <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              id={item.tourId}
              href={item.href}
              data-tour={item.tourId}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-xs font-bold ${
                item.isActive ? item.activeColor : `text-slate-500 bg-transparent ${item.color}`
              }`}
            >
              <div className="flex items-center gap-2.5">
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
                {anamneseConcluida && consultaAgendada && !visitouReceitas && item.name === "Plano & Receitas" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4C6C54] shrink-0" />
                )}
              </div>
              {!isNutri && !consultaAgendada && item.name === "Calendário" && (
                <span className="text-[9px] bg-amber-400 text-slate-900 font-extrabold px-1.5 py-0.5 rounded-full">
                  Passo 2
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-100 space-y-1">
        {/* Se for nutricionista em visita ao dashboard, botão de volta ao portal */}
        {isNutri && (
          <Link
            href="/nutri"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#3D5A45] bg-[#E8F5E9] hover:bg-[#d8eed9] transition-colors text-xs font-bold"
            title="Voltar ao Portal Clínico da Nutricionista"
          >
            <Eye className="h-4 w-4 shrink-0" />
            <span>Portal Clínico</span>
          </Link>
        )}

        <button 
          type="button"
          onClick={() => encerrarSessao()}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-xs font-bold cursor-pointer text-left"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sair da Conta</span>
        </button>
      </div>

      {/* MODAL EXPLICATIVO DE ETAPA BLOQUEADA */}
      {modalBloqueioAberto && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setModalBloqueioAberto(false)}
        >
          <div 
            className="bg-[#FFFDF8] rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-[#3D5A45]/20 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Acesso Seguro
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight mt-0.5">
                    Módulo {moduloBloqueadoNome} Bloqueado
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalBloqueioAberto(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mensagem Explicativa Solicitada */}
            <p className="text-xs text-slate-600 leading-relaxed">
              🔒 <strong>Etapa bloqueada temporariamente:</strong> Para garantirmos um acompanhamento 100% seguro e individualizado, este módulo é liberado após você concluir o <strong>Passo 1 (Anamnese de 56 perguntas)</strong> e o <strong>Passo 2 (Agendamento da 1ª Consulta)</strong>.
            </p>

            {/* Checklist de Status dos 2 Passos */}
            <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  {anamneseConcluida ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <span className="h-4 w-4 rounded-full border-2 border-amber-500 text-[10px] font-black flex items-center justify-center text-amber-600">1</span>
                  )}
                  Passo 1: Anamnese (56 perguntas)
                </span>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  anamneseConcluida ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}>
                  {anamneseConcluida ? "Concluído" : "Pendente"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  {consultaAgendada ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <span className="h-4 w-4 rounded-full border-2 border-amber-500 text-[10px] font-black flex items-center justify-center text-amber-600">2</span>
                  )}
                  Passo 2: Agendar 1ª Consulta
                </span>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  consultaAgendada ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}>
                  {consultaAgendada ? "Concluído" : "Pendente"}
                </span>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              {!anamneseConcluida ? (
                <Link
                  href="/anamnese"
                  onClick={() => setModalBloqueioAberto(false)}
                  className="w-full sm:flex-1 py-2.5 px-3 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <span>Preencher Anamnese (Passo 1)</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : !consultaAgendada ? (
                <Link
                  href="/dashboard/calendario?onboarding=consulta"
                  onClick={() => setModalBloqueioAberto(false)}
                  className="w-full sm:flex-1 py-2.5 px-3 bg-[#2A546D] hover:bg-[#1e3c4e] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <span>Agendar 1ª Consulta (Passo 2)</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : null}

              <button
                type="button"
                onClick={() => setModalBloqueioAberto(false)}
                className="w-full sm:w-auto py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Entendido
              </button>
            </div>

          </div>
        </div>
      )}
    </aside>
  );
}
