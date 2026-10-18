"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import TelaBloqueioAssinatura from "@/components/dashboard/TelaBloqueioAssinatura";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { autenticado, carregando, planoExpirado, avisoVencimento, diasRestantes } = useAuthGuard();

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

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-5">
          {children}
        </main>
      </div>
    </div>
  );
}