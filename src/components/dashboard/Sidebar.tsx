"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, Utensils, PlayCircle, Calendar, MessageCircle, Settings, LogOut, Lock, Eye, X, ArrowRight, CheckCircle2, UtensilsCrossed, FileText, Menu } from "lucide-react";
import { encerrarSessao } from "@/hooks/useAuthGuard";
export { encerrarSessao } from "@/hooks/useAuthGuard";
import NotificationBell from "@/components/dashboard/NotificationBell";

export default function Sidebar() {
  const pathname = usePathname();
  const [consultaAgendada, setConsultaAgendada] = useState(true);
  const [anamneseConcluida, setAnamneseConcluida] = useState(true);
  const [isNutri, setIsNutri] = useState(false);
  const [modalBloqueioAberto, setModalBloqueioAberto] = useState(false);
  const [moduloBloqueadoNome, setModuloBloqueadoNome] = useState("");
  const [drawerAberto, setDrawerAberto] = useState(false);

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
  };

  useEffect(() => {
    checarEstado();

    const handleSync = () => checarEstado();
    window.addEventListener("storage", handleSync);
    window.addEventListener("nutrindo_onboarding_atualizado", handleSync);
    window.addEventListener("nutrindo_assinatura_alterada", handleSync);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("nutrindo_onboarding_atualizado", handleSync);
      window.removeEventListener("nutrindo_assinatura_alterada", handleSync);
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

  const mobileNavItems = [
    {
      name: "Início",
      shortName: "Início",
      href: "/dashboard",
      icon: Home,
      isActive: pathname === "/dashboard",
      bloqueadoSemConsulta: false,
    },
    {
      name: "Orientações da Nutri",
      shortName: "Orientações",
      href: "/dashboard/devolutivas",
      icon: FileText,
      isActive: pathname?.startsWith("/dashboard/devolutivas"),
      bloqueadoSemConsulta: true,
    },
    {
      name: "Diário",
      shortName: "Diário",
      href: "/dashboard/diario",
      icon: Utensils,
      isActive: pathname?.startsWith("/dashboard/diario"),
      bloqueadoSemConsulta: true,
    },
    {
      name: "Cursos",
      shortName: "Cursos",
      href: "/dashboard/cursos",
      icon: PlayCircle,
      isActive: pathname?.startsWith("/dashboard/cursos") || pathname?.startsWith("/cursos"),
      bloqueadoSemConsulta: true,
    },
    {
      name: "Calendário",
      shortName: "Agenda",
      href: "/dashboard/calendario",
      icon: Calendar,
      isActive: pathname?.startsWith("/dashboard/calendario"),
      bloqueadoSemConsulta: false,
    },
    {
      name: "Chat",
      shortName: "Chat",
      href: "/dashboard/chat",
      icon: MessageCircle,
      isActive: pathname?.startsWith("/dashboard/chat"),
      bloqueadoSemConsulta: true,
    },
  ];

  return (
    <>
      {/* 1. BARRA SUPERIOR MOBILE (< md) */}
      <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-2xs">
        <Link href="/dashboard" className="relative h-8 w-28 block hover:opacity-85 transition-opacity">
          <Image 
            src="/logo-transparente.png" 
            alt="Nutrindo em Casa" 
            fill 
            className="object-contain" 
            priority 
          />
        </Link>

        <div className="flex items-center gap-2">
          {isNutri && (
            <Link
              href="/nutri"
              className="p-1.5 rounded-xl text-[#3D5A45] bg-[#E8F5E9] hover:bg-[#d8eed9] transition-colors"
              title="Portal Clínico"
            >
              <Eye className="h-4 w-4" />
            </Link>
          )}
          <NotificationBell />
          <button
            type="button"
            onClick={() => setDrawerAberto(true)}
            className="p-1.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Abrir menu completo"
            aria-label="Abrir menu de navegação"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* MENU GAVETA MOBILE (DRAWER COM OVERLAY) */}
      {drawerAberto && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop escuro com blur */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setDrawerAberto(false)}
          />

          {/* Painel lateral drawer */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {/* Header da gaveta */}
            <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between">
              <div className="relative h-9 w-28">
                <Image
                  src="/logo-transparente.png"
                  alt="Nutrindo em Casa"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <button
                type="button"
                onClick={() => setDrawerAberto(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Links da gaveta */}
            <nav className="flex-1 p-3 flex flex-col gap-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const estaBloqueado = !isNutri && !consultaAgendada && item.bloqueadoSemConsulta;

                if (estaBloqueado) {
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        setDrawerAberto(false);
                        setModuloBloqueadoNome(item.name);
                        setModalBloqueioAberto(true);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-400 bg-slate-50/60 hover:bg-slate-100 transition-all text-xs font-semibold cursor-pointer group text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <item.icon className="h-4 w-4 shrink-0 text-slate-400" />
                        <span>{item.name}</span>
                      </div>
                      <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setDrawerAberto(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-xs font-bold ${
                      item.isActive ? item.activeColor : `text-slate-600 bg-transparent ${item.color}`
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Rodapé da gaveta */}
            <div className="p-3 border-t border-slate-100 space-y-1 bg-slate-50/50">
              {isNutri && (
                <Link
                  href="/nutri"
                  onClick={() => setDrawerAberto(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[#3D5A45] bg-[#E8F5E9] hover:bg-[#d8eed9] transition-colors text-xs font-bold"
                >
                  <Eye className="h-4 w-4 shrink-0" />
                  <span>Portal Clínico da Nutri</span>
                </Link>
              )}
              <Link
                href="/configuracoes"
                onClick={() => setDrawerAberto(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-xs font-bold"
              >
                <Settings className="h-4 w-4 shrink-0" />
                <span>Minha Conta & Configurações</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setDrawerAberto(false);
                  encerrarSessao();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors text-xs font-bold cursor-pointer text-left"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span>Sair da Conta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. SIDEBAR LATERAL DESKTOP (md:flex) */}
      <aside className="hidden md:flex w-52 bg-white border-r border-slate-200 flex-col shadow-xs shrink-0 z-20">
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
      </aside>

      {/* 3. BARRA DE NAVEGAÇÃO INFERIOR FIXA (< md) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1.5 flex justify-around items-center shadow-lg">
        {mobileNavItems.map((item) => {
          const estaBloqueado = !isNutri && !consultaAgendada && item.bloqueadoSemConsulta;

          if (estaBloqueado) {
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  setModuloBloqueadoNome(item.name);
                  setModalBloqueioAberto(true);
                }}
                className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-slate-600 relative cursor-pointer"
                title={`Clique para entender como desbloquear ${item.name}`}
              >
                <div className="relative">
                  <item.icon className="h-4 w-4" />
                  <Lock className="h-2.5 w-2.5 text-amber-500 absolute -top-1 -right-1" />
                </div>
                <span className="text-[10px] font-bold mt-0.5 truncate max-w-[54px]">{item.shortName}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all rounded-xl relative ${
                item.isActive
                  ? "text-[#4C6C54] font-black"
                  : "text-slate-500 hover:text-slate-800 font-semibold"
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${item.isActive ? "bg-[#4C6C54]/10 scale-105" : ""}`}>
                <item.icon className={`h-4 w-4 ${item.isActive ? "stroke-[2.5]" : ""}`} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-[56px]">{item.shortName}</span>
            </Link>
          );
        })}
      </nav>

      {/* 4. MODAL EXPLICATIVO DE ETAPA BLOQUEADA */}
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
    </>
  );
}
