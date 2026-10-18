"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, Utensils, PlayCircle, Calendar, MessageCircle, Settings, LogOut, Lock } from "lucide-react";
import { encerrarSessao } from "@/hooks/useAuthGuard";

export default function Sidebar() {
  const pathname = usePathname();
  const [consultaAgendada, setConsultaAgendada] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const consultaSalva = localStorage.getItem("consulta_agendada") === "true";
      setConsultaAgendada(consultaSalva);
    }
  }, [pathname]);

  const navItems = [
    {
      name: "Início",
      href: "/dashboard",
      icon: Home,
      color: "hover:bg-[#4C6C54] hover:text-white",
      activeColor: "bg-[#4C6C54] text-white shadow-xs",
      isActive: pathname === "/dashboard",
      bloqueadoSemConsulta: true,
    },
    {
      name: "Diário",
      href: "/dashboard/diario",
      icon: Utensils,
      color: "hover:bg-[#3D6B50] hover:text-white",
      activeColor: "bg-[#3D6B50] text-white shadow-xs",
      isActive: pathname?.startsWith("/dashboard/diario"),
      bloqueadoSemConsulta: true,
    },
    {
      name: "Cursos",
      href: "/cursos",
      icon: PlayCircle,
      color: "hover:bg-[#EB6D57] hover:text-white",
      activeColor: "bg-[#EB6D57] text-white shadow-xs",
      isActive: pathname === "/cursos" || pathname?.startsWith("/cursos") || pathname?.startsWith("/dashboard/cursos"),
      bloqueadoSemConsulta: true,
    },
    {
      name: "Calendário",
      href: "/dashboard/calendario",
      icon: Calendar,
      color: "hover:bg-[#2A546D] hover:text-white",
      activeColor: "bg-[#2A546D] text-white shadow-xs",
      isActive: pathname?.startsWith("/dashboard/calendario"),
      bloqueadoSemConsulta: false,
    },
    {
      name: "Chat",
      href: "/dashboard/chat",
      icon: MessageCircle,
      color: "hover:bg-[#EAA345] hover:text-white",
      activeColor: "bg-[#EAA345] text-white shadow-xs",
      isActive: pathname?.startsWith("/dashboard/chat"),
      bloqueadoSemConsulta: true,
    },
    {
      name: "Configurações",
      href: "/configuracoes",
      icon: Settings,
      color: "hover:bg-[#4C6C54] hover:text-white",
      activeColor: "bg-[#4C6C54] text-white shadow-xs",
      isActive: pathname?.startsWith("/configuracoes"),
      bloqueadoSemConsulta: true,
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
          const estaBloqueado = !consultaAgendada && item.bloqueadoSemConsulta;

          if (estaBloqueado) {
            return (
              <Link
                key={item.name}
                href="/dashboard/calendario?onboarding=consulta"
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-400 bg-slate-50/60 hover:bg-slate-100 transition-all text-xs font-semibold cursor-pointer group"
                title="Conclua o agendamento da 1ª consulta para desbloquear este módulo"
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className="h-4 w-4 shrink-0 text-slate-400" />
                  <span>{item.name}</span>
                </div>
                <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-xs font-bold ${
                item.isActive ? item.activeColor : `text-slate-500 bg-transparent ${item.color}`
              }`}
            >
              <div className="flex items-center gap-2.5">
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </div>
              {!consultaAgendada && item.name === "Calendário" && (
                <span className="text-[9px] bg-amber-400 text-slate-900 font-extrabold px-1.5 py-0.5 rounded-full">
                  Passo 2
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-100">
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
  );
}
