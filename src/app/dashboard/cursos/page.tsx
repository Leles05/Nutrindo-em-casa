"use client";

import { PlayCircle, CheckCircle2, FileText, Lock, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function CursosPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animation-fade-in pb-10">
      
      {/* Cabeçalho do Curso Limpo */}
      <header className="mb-6">
        <Link href="/dashboard" className="text-sm font-semibold text-slate-400 hover:text-[#4C6C54] flex items-center gap-1 mb-3 transition-colors w-fit">
          <ChevronLeft className="h-4 w-4" /> Voltar ao Início
        </Link>
        <h1 className="text-3xl font-extrabold text-[#4C6C54]">
          Introdução Alimentar Descomplicada
        </h1>
        <p className="text-slate-500 mt-1 text-base">Módulo 1: Entendendo a Seletividade</p>
      </header>

      {/* Grid Principal: Player (Esquerda) + Playlist (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: Player e Conteúdo da Aula */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Área do Player de Vídeo */}
          <div className="w-full aspect-video bg-slate-900 rounded-3xl overflow-hidden relative shadow-lg group">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <button className="h-20 w-20 bg-[#EB6D57] rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 hover:bg-[#d55e49] transition-transform duration-300">
                <PlayCircle className="h-10 w-10 ml-1" />
              </button>
            </div>
            <div className="absolute bottom-0 w-full h-12 bg-gradient-to-t from-black/80 to-transparent flex items-end px-4 pb-3">
              <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-[#EB6D57] w-1/3"></div>
              </div>
            </div>
          </div>

          {/* Título e Descrição da Aula Atual */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-slate-800">1. Sinais de Alerta na Alimentação</h2>
              <button className="flex items-center justify-center gap-2 bg-[#4C6C54] hover:bg-[#3a5340] text-white px-6 py-2.5 rounded-xl font-bold transition-colors w-full sm:w-auto">
                Próxima Aula <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-slate-600 leading-relaxed mb-8 text-lg">
              Nesta aula, vamos entender a diferença entre uma fase passageira de recusa alimentar e os sinais reais de uma seletividade que precisa de atenção clínica. Aprenda a observar o comportamento do seu filho sem ansiedade.
            </p>

            {/* Materiais Complementares (Downloads) */}
            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Materiais Complementares</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a href="#" className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#4C6C54]/30 hover:bg-[#4C6C54]/5 transition-colors group">
                  <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-[#4C6C54] shadow-sm">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700 group-hover:text-[#4C6C54]">Checklist de Sinais</h4>
                    <p className="text-xs text-slate-500">PDF • 1.2 MB</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: Playlist / Módulos com Progresso Integrado */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden sticky top-24">
            
            {/* Header da Playlist + Progresso */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Conteúdo do Curso</h3>
                <p className="text-sm text-slate-500 mt-1">12 aulas • 2h 40m</p>
              </div>
              
              <div className="pt-2">
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-slate-500 uppercase tracking-wider">Progresso Geral</span>
                  <span className="text-[#EB6D57]">30%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#EB6D57] rounded-full w-[30%]"></div>
                </div>
              </div>
            </div>

            {/* Lista de Módulos */}
            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
              
              {/* Módulo 1 (Ativo) */}
              <div className="border-b border-slate-100">
                <div className="p-4 bg-white flex justify-between items-center cursor-pointer">
                  <h4 className="font-bold text-slate-800">Módulo 1: O Básico</h4>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">2/4</span>
                </div>
                
                {/* Aulas do Módulo 1 */}
                <div className="bg-slate-50 flex flex-col">
                  <button className="flex items-start gap-3 p-4 hover:bg-slate-100 transition-colors text-left border-l-4 border-transparent">
                    <CheckCircle2 className="h-5 w-5 text-[#4C6C54] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm font-semibold text-slate-600 line-through">Introdução ao Método</span>
                      <span className="block text-xs text-slate-400 mt-1">05:20</span>
                    </div>
                  </button>

                  <button className="flex items-start gap-3 p-4 bg-white border-l-4 border-[#EB6D57] transition-colors text-left shadow-sm">
                    <PlayCircle className="h-5 w-5 text-[#EB6D57] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm font-bold text-slate-800">1. Sinais de Alerta</span>
                      <span className="block text-xs text-[#EB6D57] font-semibold mt-1">12:45 • Assistindo</span>
                    </div>
                  </button>

                  <button className="flex items-start gap-3 p-4 hover:bg-slate-100 transition-colors text-left border-l-4 border-transparent group">
                    <div className="h-5 w-5 rounded-full border-2 border-slate-300 group-hover:border-[#4C6C54] shrink-0 mt-0.5"></div>
                    <div>
                      <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-800">Como lidar com o choro</span>
                      <span className="block text-xs text-slate-400 mt-1">18:30</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Módulo 2 (Bloqueado) */}
              <div className="border-b border-slate-100 opacity-60 bg-slate-50">
                <div className="p-4 flex justify-between items-center cursor-not-allowed">
                  <h4 className="font-bold text-slate-700 flex items-center gap-2">
                    <Lock className="h-4 w-4" /> Módulo 2: Na Prática
                  </h4>
                  <span className="text-xs font-bold text-slate-400">0/5</span>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}