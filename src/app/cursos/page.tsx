"use client";

import Link from "next/link";
import { 
  Play, Video, ArrowLeft, Sparkles, Trophy, Clock, 
  Lock, CheckCircle2, ChevronRight, BookOpen, AlertCircle,
  AlertTriangle, ArrowRight as ArrowRightIcon
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import TelaBloqueioAssinatura from "@/components/dashboard/TelaBloqueioAssinatura";

export default function CatalogoCursosPage() {
  const { autenticado, carregando, planoExpirado, avisoVencimento, diasRestantes } = useAuthGuard();

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

  if (planoExpirado) {
    return <TelaBloqueioAssinatura diasRestantes={diasRestantes} />;
  }

  return (
    <div className="flex h-screen bg-[#F0EAE1] overflow-hidden font-sans text-slate-800 flex-col">
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
            <ArrowRightIcon className="h-3 w-3" />
          </Link>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
      {/* BARRA LATERAL REUTILIZÁVEL */}
      <Sidebar />

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20">
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
          
          {/* =============================================================== */}
          {/* 1. CABEÇALHO DA ÁREA DE MEMBROS */}
          {/* =============================================================== */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors py-1 px-2 rounded-lg hover:bg-white/70"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Voltar ao Dashboard</span>
                </Link>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#4C6C54] tracking-tight">
                Área de Membros & Trilhas de Aulas 🎓
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Acompanhe o Método Dra. Laís Leles no seu ritmo, construindo segurança alimentar dia a dia.
              </p>
            </div>

            {/* MEU PERFIL E STATUS DO PLANO */}
            <div className="flex items-center gap-3">
              <Link
                href="/configuracoes?aba=perfil"
                className="flex items-center gap-2.5 p-1.5 pl-3 rounded-full bg-white/90 hover:bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all group focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/30"
                title="Acessar Configurações e Meu Perfil"
              >
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="hidden sm:inline">Plano Trimestral • Ativo</span>
                  <span className="sm:hidden">Ativo</span>
                </div>
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#4C6C54] to-[#689373] text-white flex items-center justify-center font-extrabold text-xs shadow-xs ring-2 ring-white">
                  LL
                </div>
                <span className="text-xs font-bold text-slate-700 hidden md:inline pr-1">
                  Meu Perfil
                </span>
              </Link>
            </div>
          </div>

          {/* =============================================================== */}
          {/* 1.1 BARRA DE PROGRESSO GLOBAL */}
          {/* =============================================================== */}
          <div className="bg-white/95 backdrop-blur-xs rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#4C6C54]/10 text-[#4C6C54] flex items-center justify-center shrink-0">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                    Seu Progresso na Jornada
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Módulos práticos estruturados para cada fase da seletividade.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Em Andamento
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-[#4C6C54] bg-[#4C6C54]/10 px-2.5 py-1 rounded-xl">
                  15%
                </span>
              </div>
            </div>

            {/* BARRA LARGA EM VERDE SUAVE */}
            <div className="w-full h-3.5 bg-emerald-100 rounded-full overflow-hidden p-0.5 border border-emerald-200/60">
              <div
                className="h-full bg-[#4C6C54] rounded-full transition-all duration-500 w-[15%]"
                role="progressbar"
                aria-valuenow={15}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-0.5">
              <span className="font-bold text-slate-700">3 de 20 aulas concluídas (15%)</span>
              <span className="text-slate-400 hidden sm:inline">17 aulas restantes na trilha completa</span>
            </div>
          </div>

          {/* =============================================================== */}
          {/* 2. HERO BANNER: "CONTINUE DE ONDE PAROU" */}
          {/* =============================================================== */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-50 via-emerald-50/70 to-[#F0EAE1] border border-emerald-100 shadow-md p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              
              <div className="flex items-start sm:items-center gap-4 sm:gap-5">
                {/* ÍCONE GRANDE DE PLAY CIRCUNDADO */}
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl sm:rounded-3xl bg-white border border-emerald-200 shadow-sm flex items-center justify-center shrink-0 text-[#4C6C54] group">
                  <div className="h-11 w-11 sm:h-13 sm:w-13 rounded-full bg-[#4C6C54]/10 flex items-center justify-center">
                    <Play className="h-6 w-6 sm:h-7 sm:w-7 text-[#4C6C54] fill-[#4C6C54] ml-0.5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#4C6C54]/10 text-[#4C6C54] uppercase tracking-wider">
                    <Sparkles className="h-3 w-3" />
                    <span>Continue de Onde Parou</span>
                  </div>
                  <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    Continuar Assistindo: Módulo 1 - Aula 3
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-semibold">
                    Apresentando o Prato de Apoio Sem Brigas
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      14 min restantes
                    </span>
                    <span>•</span>
                    <span className="text-[#4C6C54] font-bold">Módulo 1: Fundamentos</span>
                  </div>
                </div>
              </div>

              {/* BOTÃO DE AÇÃO DESTACADO */}
              <div className="shrink-0 w-full md:w-auto">
                <Link
                  href="/dashboard/cursos"
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl bg-[#EB6D57] hover:bg-orange-600 text-white font-extrabold text-sm sm:text-base shadow-lg hover:shadow-xl active:scale-[0.99] transition-all cursor-pointer"
                >
                  <span>▶ Assistir Agora</span>
                </Link>
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* 3. CATÁLOGO EM GRID (MÓDULOS GRAVADOS) */}
          {/* =============================================================== */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  Trilhas de Conhecimento
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Etapas sequenciais da metodologia para você assistir quando quiser.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500 hidden sm:inline">
                3 Módulos Cadastrados
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              
              {/* =========================================================== */}
              {/* CARD MÓDULO 1: EM PROGRESSO */}
              {/* =========================================================== */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
                <div>
                  {/* THUMBNAIL ILUSTRATIVA */}
                  <div className="h-44 w-full bg-gradient-to-br from-emerald-100/90 via-slate-100 to-[#4C6C54]/20 border-b border-slate-100 flex items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-300">
                    {/* Badge de status no topo da thumbnail */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#4C6C54] text-white shadow-xs uppercase tracking-wider flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Em Progresso
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 z-10">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-white/90 text-slate-700 shadow-2xs">
                        5 Aulas
                      </span>
                    </div>

                    {/* Placeholder retangular cinza/verde claro com ícone de vídeo */}
                    <div className="h-16 w-16 rounded-2xl bg-white/90 shadow-md border border-emerald-100 flex items-center justify-center text-[#4C6C54] group-hover:scale-110 transition-transform">
                      <Video className="h-8 w-8 text-[#4C6C54]" />
                    </div>
                  </div>

                  {/* CONTEÚDO DO CARD */}
                  <div className="p-5 space-y-3">
                    <h3 className="text-base font-extrabold text-slate-900 leading-snug group-hover:text-[#4C6C54] transition-colors">
                      Módulo 1: Fundamentos da Terapia Alimentar
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Aprenda a desarmar a ansiedade e construir um ambiente seguro nas refeições.
                    </p>

                    {/* PROGRESSO LOCAL: 3/5 AULAS (60%) */}
                    <div className="pt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1 text-[#4C6C54]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          3 de 5 aulas
                        </span>
                        <span>60%</span>
                      </div>
                      <div className="w-full h-2 bg-emerald-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#4C6C54] rounded-full w-[60%]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTÃO CONTINUAR MÓDULO */}
                <div className="p-5 pt-0">
                  <Link
                    href="/cursos/mod1"
                    className="w-full py-2.5 px-4 rounded-xl bg-[#4C6C54] hover:bg-[#3d5743] text-white font-extrabold text-xs text-center transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Continuar Módulo</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* =========================================================== */}
              {/* CARD MÓDULO 2: LIBERADO */}
              {/* =========================================================== */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
                <div>
                  {/* THUMBNAIL ILUSTRATIVA */}
                  <div className="h-44 w-full bg-gradient-to-br from-slate-100 via-emerald-50 to-slate-200/70 border-b border-slate-100 flex items-center justify-center relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-300">
                    <div className="absolute top-3 left-3 z-10">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white shadow-xs uppercase tracking-wider">
                        Liberado
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 z-10">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-white/90 text-slate-700 shadow-2xs">
                        7 Aulas
                      </span>
                    </div>

                    <div className="h-16 w-16 rounded-2xl bg-white/90 shadow-md border border-slate-200 flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform">
                      <Video className="h-8 w-8 text-[#4C6C54]" />
                    </div>
                  </div>

                  {/* CONTEÚDO DO CARD */}
                  <div className="p-5 space-y-3">
                    <h3 className="text-base font-extrabold text-slate-900 leading-snug group-hover:text-[#4C6C54] transition-colors">
                      Módulo 2: O Prato de Apoio na Prática
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Estratégias sensoriais reais: do tolerar ao provar sem choro.
                    </p>

                    {/* PROGRESSO LOCAL: 0/7 AULAS */}
                    <div className="pt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span>0 de 7 aulas</span>
                        <span>Não iniciado</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#4C6C54] rounded-full w-0" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTÃO OUTLINE VERDE: INICIAR MÓDULO */}
                <div className="p-5 pt-0">
                  <Link
                    href="/dashboard/cursos"
                    className="w-full py-2.5 px-4 rounded-xl border-2 border-[#4C6C54] text-[#4C6C54] hover:bg-[#4C6C54] hover:text-white font-extrabold text-xs text-center transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Iniciar Módulo</span>
                    <Play className="h-3 w-3 fill-current" />
                  </Link>
                </div>
              </div>

              {/* =========================================================== */}
              {/* CARD MÓDULO 3: BLOQUEADO / EM BREVE */}
              {/* =========================================================== */}
              <div className="bg-white/80 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between overflow-hidden relative opacity-60">
                <div>
                  {/* THUMBNAIL ILUSTRATIVA COM OPACIDADE E BADGE FLUTUANTE */}
                  <div className="h-44 w-full bg-slate-100 border-b border-slate-200/80 flex items-center justify-center relative overflow-hidden">
                    {/* Badge flutuante no topo do card */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-slate-800 text-white shadow-sm flex items-center gap-1">
                        <span>🔒 Liberado em 7 dias</span>
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 z-10">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-200 text-slate-600">
                        8 Aulas
                      </span>
                    </div>

                    <div className="h-16 w-16 rounded-2xl bg-slate-200/90 border border-slate-300 flex items-center justify-center text-slate-500">
                      <Lock className="h-7 w-7 text-slate-500" />
                    </div>
                  </div>

                  {/* CONTEÚDO DO CARD */}
                  <div className="p-5 space-y-3">
                    <h3 className="text-base font-extrabold text-slate-800 leading-snug">
                      Módulo 3: Texturas e Transições
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      Como evoluir da aceitação visual para a mastigação de novos grupos alimentares.
                    </p>

                    {/* PROGRESSO LOCAL: BLOQUEADO */}
                    <div className="pt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                        <span>0 de 8 aulas</span>
                        <span>Aguardando liberação</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-300 rounded-full w-0" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTÃO DESABILITADO CINZA */}
                <div className="p-5 pt-0">
                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 font-bold text-xs text-center cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <Lock className="h-3 w-3" />
                    <span>Bloqueado pelo cronograma</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
      </div>
    </div>
  );
}
