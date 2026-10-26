"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, ArrowRight, Video } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import TelaBloqueioAssinatura from "@/components/dashboard/TelaBloqueioAssinatura";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { autenticado, carregando, planoExpirado, avisoVencimento, diasRestantes } = useAuthGuard();
  const [consultaHoje, setConsultaHoje] = useState<{
    horario: string;
    link?: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let email = (
      localStorage.getItem("nutrindo_user_email") ||
      localStorage.getItem("usuario_email") ||
      ""
    ).toLowerCase().trim();

    if (!email) {
      email = "lucaslimaleles@gmail.com";
    }

    const hojeISO = new Date().toLocaleDateString("en-CA");
    fetch(`/api/agendamentos?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.agendamentos && Array.isArray(data.agendamentos)) {
          const consultaDeHoje = data.agendamentos.find(
            (a: any) =>
              a.tipo === "consulta" &&
              (a.data === hojeISO || a.data?.split("T")[0] === hojeISO) &&
              !a.concluido
          );
          if (consultaDeHoje) {
            setConsultaHoje({
              horario: consultaDeHoje.horario || "14:00",
              link: consultaDeHoje.link || "https://meet.google.com",
            });
          }
        }
      })
      .catch(() => null);
  }, []);

  // Enquanto valida ou se não estiver autenticado, bloqueia renderização e exibe feedback suave
  if (carregando || !autenticado) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F0EAE1]">
        <div className="flex items-center gap-3 bg-white p-6 rounded-2xl shadow-md border border-slate-200/80 animate-in fade-in">
          <div className="h-5 w-5 border-2 border-[#4C6C54] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-700">Verificando autenticação segura...</span>
        </div>
      </div>
    );
  }

  // Estado 2: Plano Expirado / Inadimplente -> Bloqueio Total
  if (planoExpirado) {
    return <TelaBloqueioAssinatura diasRestantes={diasRestantes} />;
  }

  return (
    <div className="flex h-screen bg-[#F0EAE1] overflow-hidden font-sans text-slate-800 flex-col">
      {/* FAIXA SUPERIOR FIXA DE DIA DE CONSULTA (APENAS NAS PÁGINAS INTERNAS) */}
      {consultaHoje && pathname !== "/dashboard" && (
        <div className="bg-gradient-to-r from-emerald-600 via-[#4C6C54] to-emerald-700 text-white px-3 py-2 sm:px-4 sm:py-2.5 border-b border-emerald-500 flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs font-bold z-50 shadow-md">
          <div className="flex items-center gap-2 max-w-4xl mx-auto flex-1 justify-center text-center flex-wrap">
            <span className="flex h-2.5 w-2.5 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span className="uppercase font-black tracking-wider text-amber-300">
              🔴 HOJE É DIA DE CONSULTA!
            </span>
            <span className="leading-snug">
              Sua videochamada individual com a Dra. Laís Leles é <strong>HOJE às {consultaHoje.horario}</strong>!
            </span>
          </div>
          <a
            href={consultaHoje.link || "https://meet.google.com"}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-1.5 px-3.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-xs rounded-xl transition-all shadow-md shrink-0 cursor-pointer animate-pulse text-center"
          >
            <Video className="h-3.5 w-3.5" />
            <span>Entrar na Sala da Consulta</span>
          </a>
        </div>
      )}
      {/* Estado 1: Banner Superior Âmbar de Vencimento Próximo */}
      {avisoVencimento && (
        <div className="bg-amber-500 text-slate-900 px-4 py-2 border-b border-amber-600 flex items-center justify-between gap-3 text-xs font-bold z-40 shadow-xs">
          <div className="flex items-center gap-2 max-w-4xl mx-auto flex-1 justify-center text-center">
            <AlertTriangle className="h-4 w-4 shrink-0 text-slate-900" />
            <span>
              ⚠️ Sua assinatura vence em {diasRestantes} {diasRestantes === 1 ? "dia" : "dias"}. Renove seu plano para não interromper o acompanhamento nutricional do seu pequeno.
            </span>
          </div>
          <Link
            href="/pagamento?origem=upgrade"
            className="inline-flex items-center gap-1.5 py-1 px-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] rounded-lg transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <span>Renovar Agora</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-4 lg:p-5 pb-20 md:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
}