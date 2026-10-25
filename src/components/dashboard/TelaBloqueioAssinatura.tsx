"use client";

import Link from "next/link";
import { Lock, ArrowRight, LogOut, Sparkles, ShieldCheck, HeartHandshake, CheckCircle2 } from "lucide-react";
import { encerrarSessao } from "@/hooks/useAuthGuard";

interface TelaBloqueioAssinaturaProps {
  diasRestantes?: number;
  responsavel?: string;
}

export default function TelaBloqueioAssinatura({
  diasRestantes = 0,
  responsavel = "Responsável",
}: TelaBloqueioAssinaturaProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F0EAE1]/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300">
      <div className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/90 text-center space-y-6 my-auto">
        
        {/* ÍCONE COM DESTAQUE SUAVE */}
        <div className="relative mx-auto w-18 h-18 rounded-3xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-inner">
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
          </span>
          <Lock className="h-9 w-9 stroke-[2.2]" />
        </div>

        {/* TÍTULOS E EXPLICAÇÃO */}
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-700">
            Acesso Temporariamente Suspenso
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
            Sua Assinatura Expirou 🔒
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            Renove seu plano para continuar acessando as aulas, o diário alimentar e o acompanhamento clínico com a <strong>Dra. Laís Leles</strong>.
          </p>
        </div>

        {/* CARD COM BENEFÍCIOS PROTEGIDOS */}
        <div className="bg-[#4C6C54]/5 rounded-2xl p-4 border border-[#4C6C54]/20 text-left space-y-2.5">
          <p className="text-xs font-bold text-[#4C6C54] flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Seu histórico continua protegido:</span>
          </p>
          <ul className="space-y-1.5 text-[11px] text-slate-700 font-medium">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Prontuário completo da Anamnese Pediátrica salvo</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Conquistas registradas na Escada do Comer intactas</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Acesso imediato às novas trilhas e videoaulas</span>
            </li>
          </ul>
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="space-y-2 pt-1">
          <Link
            href="/pagamento?origem=upgrade"
            className="w-full py-3.5 px-6 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Renovar Assinatura Agora</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/configuracoes?aba=faturas"
            className="w-full py-2.5 px-4 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200/80"
          >
            <span>Visualizar Minhas Faturas &amp; Histórico</span>
          </Link>

          <button
            type="button"
            onClick={encerrarSessao}
            className="w-full py-2 px-4 text-xs font-bold text-slate-400 hover:text-rose-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sair da Conta</span>
          </button>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Pagamento 100% seguro processado via Asaas</span>
        </div>

      </div>
    </div>
  );
}
