"use client";

import { useState } from "react";
import { Plus, Sparkles, Utensils, X, Check, ArrowRight } from "lucide-react";
import Link from "next/link";

interface RegistroRefeicao {
  id: number;
  refeicao: string;
  alimento: string;
  etapaEscalada: string;
  reacao: "positivo" | "neutro" | "desafiador";
  horario: string;
}

export default function DiarioAlimentar() {
  const [modalAberto, setModalAberto] = useState(false);
  const [toastMensagem, setToastMensagem] = useState("");

  const [registros, setRegistros] = useState<RegistroRefeicao[]>([
    {
      id: 1,
      refeicao: "Almoço",
      alimento: "Brócolis 🥦",
      etapaEscalada: "👃 Cheirou voluntariamente",
      reacao: "positivo",
      horario: "12:30"
    },
    {
      id: 2,
      refeicao: "Lanche",
      alimento: "Maçã em fatias 🍎",
      etapaEscalada: "👀 Tolerou no prato",
      reacao: "neutro",
      horario: "15:45"
    }
  ]);

  // Form State do Modal
  const [novoAlimento, setNovoAlimento] = useState("");
  const [novaRefeicao, setNovaRefeicao] = useState("Almoço");
  const [novaEtapa, setNovaEtapa] = useState("👃 Cheirou voluntariamente");
  const [novaReacao, setNovaReacao] = useState<"positivo" | "neutro" | "desafiador">("positivo");

  const etapasEscalada = [
    { label: "Tolerou no prato", icone: "👀" },
    { label: "Interagiu c/ talher", icone: "🖐️" },
    { label: "Cheirou voluntariamente", icone: "👃" },
    { label: "Tocou com os dedos", icone: "✋" },
    { label: "Encostou nos lábios", icone: "👄" },
    { label: "Provou / Lambeu", icone: "👅" },
    { label: "Comeu e engoliu", icone: "😋" }
  ];

  const adicionarRegistro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoAlimento.trim()) return;

    const novo: RegistroRefeicao = {
      id: Date.now(),
      refeicao: novaRefeicao,
      alimento: novoAlimento,
      etapaEscalada: novaEtapa,
      reacao: novaReacao,
      horario: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setRegistros([novo, ...registros]);
    setNovoAlimento("");
    setModalAberto(false);

    // Feedback Imediato
    setToastMensagem(`Conquista registrada com ${novo.alimento}! 🎉`);
    setTimeout(() => {
      setToastMensagem("");
    }, 3500);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm flex flex-col h-full justify-between space-y-6 relative">
      
      {/* TOAST DE FEEDBACK FLUTUANTE */}
      {toastMensagem && (
        <div className="absolute top-4 left-4 right-4 z-30 p-3.5 bg-[#4C6C54] text-white text-xs font-bold rounded-2xl shadow-xl flex items-center justify-between animation-fade-in">
          <span>{toastMensagem}</span>
          <button type="button" onClick={() => setToastMensagem("")} className="text-white/80 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* CABEÇALHO */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Diário Alimentar</h2>
          <p className="text-xs text-slate-400 font-medium">Jornada de aproximação sensorial</p>
        </div>
        <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
          Hoje
        </span>
      </div>

      {/* BLOCO 1: ESCALADA DO COMER (RESUMO SEMANAL) */}
      <div className="bg-[#4C6C54]/5 border border-[#4C6C54]/15 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#4C6C54] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Essa semana a criança:
          </span>
          <span className="text-[11px] font-extrabold text-[#4C6C54] bg-white px-2 py-0.5 rounded-md border border-[#4C6C54]/20">
            +{registros.length + 4} conquistas
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-600 font-medium flex items-center gap-1.5">
              👀 Tolerou
            </span>
            <span className="font-extrabold text-slate-800">4</span>
          </div>

          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-600 font-medium flex items-center gap-1.5">
              👃 Cheirou
            </span>
            <span className="font-extrabold text-[#EB6D57]">2</span>
          </div>

          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-600 font-medium flex items-center gap-1.5">
              🖐️ Tocou
            </span>
            <span className="font-extrabold text-slate-800">3</span>
          </div>

          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-600 font-medium flex items-center gap-1.5">
              👅 Provou
            </span>
            <span className="font-extrabold text-[#4C6C54]">1</span>
          </div>
        </div>
      </div>

      {/* BLOCO 2: FEED DE HOJE */}
      <div className="flex-1 flex flex-col space-y-3 min-h-[220px]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Refeições de Hoje
          </span>
          <Link
            href="/dashboard/diario"
            className="text-xs font-bold text-slate-400 hover:text-[#4C6C54] flex items-center gap-1 transition-colors"
          >
            Ver histórico <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
          {registros.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-2xl">
              <Utensils className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs text-slate-400 font-medium">Nenhum registro feito hoje.</p>
            </div>
          ) : (
            registros.map((item) => (
              <div 
                key={item.id}
                className="p-3.5 bg-slate-50/70 border border-slate-100 hover:border-slate-200 rounded-2xl flex items-center justify-between gap-3 transition-all"
              >
                <div className="space-y-0.5 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-700">{item.refeicao}</span>
                    <span className="text-[10px] text-slate-400">• {item.horario}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 truncate">{item.alimento}</p>
                  <span className="inline-block text-[11px] font-semibold text-[#4C6C54] bg-[#4C6C54]/10 px-2 py-0.5 rounded-md">
                    {item.etapaEscalada}
                  </span>
                </div>

                <div className="shrink-0">
                  {item.reacao === "positivo" && (
                    <span className="text-xl" title="Tranquilo / Positivo">😊</span>
                  )}
                  {item.reacao === "neutro" && (
                    <span className="text-xl" title="Curioso / Neutro">😐</span>
                  )}
                  {item.reacao === "desafiador" && (
                    <span className="text-xl" title="Resistência / Choro">🙁</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* BOTÃO PRINCIPAL DE AÇÃO */}
      <button 
        type="button"
        onClick={() => setModalAberto(true)}
        className="w-full py-4 px-4 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-bold text-sm rounded-2xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
      >
        <Plus className="h-4 w-4" /> Registrar Refeição
      </button>

      {/* MODAL INTERATIVO */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animation-fade-in">
          <div className="bg-white rounded-[2.5rem] max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">Registrar no Diário</h3>
                <p className="text-xs text-slate-400 mt-0.5">Mapeie a aproximação sensorial da criança</p>
              </div>
              <button 
                type="button"
                onClick={() => setModalAberto(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={adicionarRegistro} className="space-y-6">
              {/* REFEIÇÃO */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5">
                  Refeição
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["Café", "Almoço", "Lanche", "Jantar"].map((ref) => (
                    <button
                      key={ref}
                      type="button"
                      onClick={() => setNovaRefeicao(ref)}
                      className={`py-2.5 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        novaRefeicao === ref 
                          ? 'bg-[#4C6C54] text-white border-[#4C6C54] shadow-xs' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {ref}
                    </button>
                  ))}
                </div>
              </div>

              {/* ALIMENTO */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5">
                  Alimento Oferecido
                </label>
                <input 
                  type="text"
                  value={novoAlimento}
                  onChange={(e) => setNovoAlimento(e.target.value)}
                  placeholder="Ex: Cenoura ralada, Pedaço de morango..."
                  className="w-full h-13 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4C6C54] focus:bg-white"
                  required
                />
              </div>

              {/* ESCALADA DO COMER (SELETOR VISUAL EM CHIPS) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5">
                  Degrau Atingido (Escalada do Comer)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {etapasEscalada.map((etapa) => {
                    const textoCompleto = `${etapa.icone} ${etapa.label}`;
                    const estaSelecionado = novaEtapa === textoCompleto;

                    return (
                      <button
                        key={etapa.label}
                        type="button"
                        onClick={() => setNovaEtapa(textoCompleto)}
                        className={`p-3 text-left rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                          estaSelecionado
                            ? 'border-[#4C6C54] bg-[#4C6C54]/10 text-[#4C6C54] font-bold shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <span className="text-base">{etapa.icone}</span>
                        <span className="text-xs truncate">{etapa.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* REAÇÃO EMOCIONAL */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5">
                  Reação da Criança
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: "positivo", emoji: "😊", label: "Tranquilo" },
                    { id: "neutro", emoji: "😐", label: "Curioso / Neutro" },
                    { id: "desafiador", emoji: "🙁", label: "Resistência" }
                  ].map((rec) => (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => setNovaReacao(rec.id as any)}
                      className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        novaReacao === rec.id
                          ? 'border-[#EB6D57] bg-[#EB6D57]/10 ring-1 ring-[#EB6D57]'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-2xl">{rec.emoji}</span>
                      <span className="text-xs font-bold text-slate-700">{rec.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* BOTÕES DE CONFIRMAÇÃO */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="flex-1 py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 px-4 bg-[#EB6D57] hover:bg-[#d95a44] text-white font-bold text-sm rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="h-4 w-4" /> Salvar Conquista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}