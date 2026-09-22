"use client";

import { useState } from "react";
import { 
  Play, CheckCircle2, FileText, ArrowRight, ArrowLeft, 
  Check, Trophy, Sparkles, ChevronLeft, ChevronRight, Circle, X
} from "lucide-react";
import Link from "next/link";

interface Aula {
  id: number;
  titulo: string;
  duracao: string;
  concluido: boolean;
  atual: boolean;
  descricao: string;
}

export default function PaginaCursos() {
  const [toastConquista, setToastConquista] = useState(false);

  const [aulas, setAulas] = useState<Aula[]>([
    { 
      id: 1, 
      titulo: "Terapia Alimentar Descomplicada", 
      duracao: "05:20", 
      concluido: true, 
      atual: false,
      descricao: "Compreenda as bases da Escalada do Comer e como a aproximação gradual diminui a ansiedade da criança à mesa."
    },
    { 
      id: 2, 
      titulo: "Sinais de Alerta na Alimentação", 
      duracao: "12:45", 
      concluido: true, 
      atual: false,
      descricao: "Aprenda a diferenciar uma fase passageira de desinteresse de uma verdadeira sensibilidade tátil e olfativa."
    },
    { 
      id: 3, 
      titulo: "Manejo da Recusa e Comunicação", 
      duracao: "18:30", 
      concluido: true, 
      atual: false,
      descricao: "Ferramentas práticas de diálogo para evitar chantagens e barganhas na hora das principais refeições."
    },
    { 
      id: 4, 
      titulo: "Construindo o Prato Seguro", 
      duracao: "14:10", 
      concluido: false, 
      atual: true,
      descricao: "Como combinar alimentos de conforto com novos alimentos de teste no mesmo prato sem gerar rejeição imediata."
    }
  ]);

  const aulaAtualIndex = aulas.findIndex((a) => a.atual);
  const aulaAtual = aulas[aulaAtualIndex] || aulas[0];

  const totalConcluidas = aulas.filter((a) => a.concluido).length;
  const porcentagemProgresso = Math.round((totalConcluidas / aulas.length) * 100);

  // Alterna apenas o checkbox manual da aula atual
  const alternarConclusaoAtual = () => {
    setAulas((prev) =>
      prev.map((a, idx) =>
        idx === aulaAtualIndex ? { ...a, concluido: !a.concluido } : a
      )
    );
  };

  // Garante a conclusão sem desmarcar e celebra a finalização
  const finalizarModulo = () => {
    setAulas((prev) =>
      prev.map((a, idx) =>
        idx === aulaAtualIndex ? { ...a, concluido: true } : a
      )
    );
    setToastConquista(true);
  };

  const irParaProximaAula = () => {
    if (aulaAtualIndex < aulas.length - 1) {
      setAulas((prev) =>
        prev.map((a, idx) => ({
          ...a,
          atual: idx === aulaAtualIndex + 1
        }))
      );
    }
  };

  const irParaAulaAnterior = () => {
    if (aulaAtualIndex > 0) {
      setAulas((prev) =>
        prev.map((a, idx) => ({
          ...a,
          atual: idx === aulaAtualIndex - 1
        }))
      );
    }
  };

  const selecionarAula = (index: number) => {
    setAulas((prev) =>
      prev.map((a, idx) => ({
        ...a,
        atual: idx === index
      }))
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 animation-fade-in pb-4 relative">
      
      {/* TOAST DE CONQUISTA AO FINALIZAR O MÓDULO */}
      {toastConquista && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-[#4C6C54] text-white text-xs font-bold rounded-2xl shadow-2xl flex items-center gap-3 animation-fade-in border border-emerald-400/30">
          <Trophy className="h-5 w-5 text-amber-300 shrink-0" />
          <div>
            <p className="font-extrabold text-sm">Parabéns! Módulo 1 Concluído! 🎉</p>
            <p className="text-white/80 text-[11px] font-medium">Você concluiu todas as 4 aulas deste ciclo terapêutico.</p>
          </div>
          <button 
            type="button" 
            onClick={() => setToastConquista(false)}
            className="text-white/70 hover:text-white ml-2 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#EB6D57] transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao Início
          </Link>
          <h1 className="text-xl font-extrabold text-[#4C6C54]">
            Terapia Alimentar Descomplicada
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Módulo 1: Entendendo a Seletividade Sensorial
          </p>
        </div>

        {porcentagemProgresso === 100 && (
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs">
            <Trophy className="h-4 w-4 text-emerald-600" /> Módulo Concluído! (100%)
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* PLAYER E CONTROLES (8 COLUNAS) */}
        <div className="lg:col-span-8 space-y-3.5">
          
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-xs border border-slate-200 group bg-slate-900 select-none">
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-35 group-hover:opacity-45 transition-opacity"
              style={{ backgroundImage: "radial-gradient(circle, rgba(76,108,84,0.6) 0%, rgba(15,23,42,0.95) 100%)" }}
            />
            
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-[#EB6D57] text-white px-2.5 py-1 rounded-md shadow-xs">
                HD • Aula {aulaAtualIndex + 1}
              </span>
              <span className="text-[10px] font-bold text-white/90 bg-black/40 backdrop-blur-xs px-2 py-1 rounded-md">
                {aulaAtual.duracao} min
              </span>
            </div>

            {/* BOTÃO PLAY CENTRALIZADO */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <button 
                type="button" 
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-[#EB6D57] hover:bg-[#d55e49] text-white flex items-center justify-center transition-all shadow-2xl hover:scale-110 active:scale-95 cursor-pointer ring-4 ring-white/20"
                title="Reproduzir aula"
              >
                <Play className="h-7 w-7 sm:h-8 sm:w-8 fill-white translate-x-0.5" />
              </button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 z-10">
              <div 
                className="h-full bg-[#EB6D57] transition-all duration-300"
                style={{ width: `${aulaAtual.concluido ? 100 : 35}%` }}
              />
            </div>
          </div>

          {/* PAINEL DE CONTROLE DA AULA */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#EB6D57] bg-[#EB6D57]/10 px-2 py-0.5 rounded">
                  Aula {aulaAtualIndex + 1} de {aulas.length}
                </span>
                <h2 className="text-base font-extrabold text-slate-800 mt-1">
                  {aulaAtual.titulo}
                </h2>
              </div>

              {/* NAVEGAÇÃO E CONCLUSÃO PROTEGIDA */}
              <div className="flex items-center gap-1.5 shrink-0">
                {aulaAtualIndex > 0 && (
                  <button 
                    type="button"
                    onClick={irParaAulaAnterior}
                    className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all cursor-pointer"
                    title="Aula anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}

                <button 
                  type="button"
                  onClick={alternarConclusaoAtual}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                    aulaAtual.concluido
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  {aulaAtual.concluido ? "Concluída" : "Marcar como Concluída"}
                </button>

                {aulaAtualIndex < aulas.length - 1 ? (
                  <button 
                    type="button" 
                    onClick={irParaProximaAula}
                    className="px-3.5 py-1.5 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    Próxima <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                ) : aulaAtual.concluido ? (
                  <button 
                    type="button" 
                    onClick={() => setToastConquista(true)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    Módulo Concluído <Trophy className="h-3.5 w-3.5 text-amber-300" />
                  </button>
                ) : (
                  <button 
                    type="button" 
                    onClick={finalizarModulo}
                    className="px-3.5 py-1.5 bg-[#EB6D57] hover:bg-[#d95a44] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    Finalizar <Sparkles className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {aulaAtual.descricao}
            </p>

            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <a 
                href="#" 
                className="inline-flex items-center gap-2.5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors text-xs font-bold text-slate-700"
              >
                <div className="p-1 bg-white rounded-md text-[#EB6D57] shadow-2xs">
                  <FileText className="h-3.5 w-3.5" />
                </div>
                <span>Baixar Checklist de Sinais (PDF)</span>
              </a>

              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> +50 pts ao concluir
              </span>
            </div>
          </div>
        </div>

        {/* LISTA LATERAL (4 COLUNAS) */}
        <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">
          
          <div className="space-y-1.5 border-b border-slate-100 pb-2.5">
            <h3 className="text-sm font-extrabold text-slate-800">Conteúdo do Módulo</h3>
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span>{totalConcluidas} de {aulas.length} aulas concluídas</span>
              <span className={porcentagemProgresso === 100 ? "text-emerald-600 font-extrabold" : "text-[#EB6D57]"}>
                {porcentagemProgresso}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  porcentagemProgresso === 100 ? "bg-emerald-500" : "bg-[#EB6D57]"
                }`}
                style={{ width: `${porcentagemProgresso}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {aulas.map((aula, idx) => (
              <div 
                key={aula.id} 
                onClick={() => selecionarAula(idx)}
                className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                  aula.atual 
                    ? 'border-[#EB6D57] bg-[#EB6D57]/5 shadow-xs ring-1 ring-[#EB6D57]/30' 
                    : 'border-slate-100 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {aula.concluido ? (
                    <div className="h-5 w-5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  ) : aula.atual ? (
                    <div className="h-5 w-5 rounded-full bg-[#EB6D57]/10 text-[#EB6D57] flex items-center justify-center shrink-0">
                      <Play className="h-3 w-3 fill-current translate-x-0.2" />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full border border-slate-200 text-slate-300 flex items-center justify-center shrink-0">
                      <Circle className="h-2 w-2 fill-slate-200" />
                    </div>
                  )}

                  <div className="truncate">
                    <h4 className={`text-xs font-bold truncate ${
                      aula.atual ? 'text-[#EB6D57]' : aula.concluido ? 'text-slate-700' : 'text-slate-600'
                    }`}>
                      {aula.titulo}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">{aula.duracao}</span>
                  </div>
                </div>

                {aula.atual && (
                  <span className="text-[9px] font-extrabold text-[#EB6D57] bg-[#EB6D57]/10 px-1.5 py-0.5 rounded uppercase shrink-0">
                    Assistindo
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}