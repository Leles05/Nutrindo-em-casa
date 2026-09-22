"use client";

import { useState } from "react";
import { ArrowLeft, Sparkles, Plus, Utensils, Check, X, Filter } from "lucide-react";
import Link from "next/link";

interface RegistroRefeicao {
  id: number;
  data: string;
  refeicao: string;
  alimento: string;
  etapa: string;
  reacao: "positivo" | "neutro" | "desafiador";
  detalhe: string;
}

export default function PaginaDiarioAlimentar() {
  const [filtroRefeicao, setFiltroRefeicao] = useState("Todas");
  const [modalAberto, setModalAberto] = useState(false);
  const [toastMensagem, setToastMensagem] = useState("");

  // Mock de Histórico Completo com Estado Reativo
  const [historico, setHistorico] = useState<RegistroRefeicao[]>([
    { id: 1, data: "Hoje", refeicao: "Almoço", alimento: "Brócolis 🥦", etapa: "👃 Cheirou voluntariamente", reacao: "positivo", detalhe: "Aproximou do nariz sem reclamar do cheiro." },
    { id: 2, data: "Hoje", refeicao: "Lanche", alimento: "Maçã em fatias 🍎", etapa: "👀 Tolerou no prato", reacao: "neutro", detalhe: "Ficou no prato durante toda a refeição." },
    { id: 3, data: "Ontem", refeicao: "Jantar", alimento: "Cenoura baby 🥕", etapa: "🖐️ Tocou com talher", reacao: "positivo", detalhe: "Espetou com o garfo e colocou de volta." },
    { id: 4, data: "Ontem", refeicao: "Almoço", alimento: "Arroz com Feijão 🍚", etapa: "😋 Comeu e engoliu", reacao: "positivo", detalhe: "Aceitou 3 colheres cheias com autonomia." },
    { id: 5, data: "16/09", refeicao: "Café", alimento: "Mamão 🥭", etapa: "👀 Tolerou no prato", reacao: "desafiador", detalhe: "Pediu para afastar o prato inicialmente." },
  ]);

  // Form State do Modal
  const [novoAlimento, setNovoAlimento] = useState("");
  const [novaRefeicao, setNovaRefeicao] = useState("Almoço");
  const [novaEtapa, setNovaEtapa] = useState("👃 Cheirou voluntariamente");
  const [novaReacao, setNovaReacao] = useState<"positivo" | "neutro" | "desafiador">("positivo");
  const [novoDetalhe, setNovoDetalhe] = useState("");

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
      data: "Hoje",
      refeicao: novaRefeicao,
      alimento: novoAlimento,
      etapa: novaEtapa,
      reacao: novaReacao,
      detalhe: novoDetalhe.trim() || "Registro realizado no diário alimentar."
    };

    setHistorico([novo, ...historico]);
    setNovoAlimento("");
    setNovoDetalhe("");
    setModalAberto(false);

    setToastMensagem(`Conquista registrada com ${novo.alimento}! 🎉`);
    setTimeout(() => setToastMensagem(""), 3500);
  };

  const registrosFiltrados = filtroRefeicao === "Todas" 
    ? historico 
    : historico.filter(item => item.refeicao === filtroRefeicao);

  const emojiReacao = (reacao: string) => {
    if (reacao === "positivo") return "😊 Positivo";
    if (reacao === "neutro") return "😐 Neutro";
    return "🙁 Resistência";
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animation-fade-in pb-16 relative">
      
      {/* TOAST DE FEEDBACK FLUTUANTE */}
      {toastMensagem && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-[#4C6C54] text-white text-sm font-bold rounded-2xl shadow-2xl flex items-center gap-3 animation-fade-in">
          <Sparkles className="h-5 w-5 text-amber-300" />
          <span>{toastMensagem}</span>
          <button type="button" onClick={() => setToastMensagem("")} className="text-white/70 hover:text-white ml-2">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* CABEÇALHO COM BOTÃO VOLTAR E AÇÃO DE REGISTRAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#4C6C54] transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao Início
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-800">Histórico do Diário Alimentar</h1>
          <p className="text-slate-500 text-sm">Acompanhamento detalhado da evolução sensorial e nutricional.</p>
        </div>

        {/* BOTÃO PRINCIPAL DE ADICIONAR REFEIÇÃO */}
        <button
          type="button"
          onClick={() => setModalAberto(true)}
          className="px-6 py-3.5 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-bold text-sm rounded-2xl transition-all shadow-sm hover:shadow-md hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" /> Registrar Refeição
        </button>
      </div>

      {/* PAINEL DE CONQUISTAS DA ESCALADA DO COMER */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-[#4C6C54] font-bold text-base">
            <Sparkles className="h-5 w-5" />
            <span>Progresso na Escalada do Comer</span>
          </div>
          <span className="text-xs font-bold text-slate-400">Total acumulado</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { degrau: "Tolerou", total: 12, icone: "👀", cor: "bg-blue-50 text-blue-700 border-blue-100" },
            { degrau: "Cheirou", total: 8, icone: "👃", cor: "bg-amber-50 text-amber-700 border-amber-100" },
            { degrau: "Tocou", total: 9, icone: "🖐️", cor: "bg-purple-50 text-purple-700 border-purple-100" },
            { degrau: "Provou", total: 4, icone: "👅", cor: "bg-rose-50 text-rose-700 border-rose-100" },
            { degrau: "Comeu", total: 7, icone: "😋", cor: "bg-emerald-50 text-emerald-700 border-emerald-100" },
          ].map((item) => (
            <div key={item.degrau} className={`p-4 rounded-2xl border ${item.cor} flex flex-col items-center justify-center text-center space-y-1`}>
              <span className="text-2xl">{item.icone}</span>
              <span className="text-xl font-extrabold">{item.total}</span>
              <span className="text-xs font-bold uppercase tracking-wider">{item.degrau}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FILTROS E LISTA DE REFEIÇÕES */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Utensils className="h-5 w-5 text-[#EB6D57]" /> Registros de Refeições
          </h2>

          {/* CHIPS DE FILTRO */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {["Todas", "Café", "Almoço", "Lanche", "Jantar"].map((filtro) => (
              <button
                key={filtro}
                type="button"
                onClick={() => setFiltroRefeicao(filtro)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  filtroRefeicao === filtro
                    ? 'bg-[#4C6C54] text-white border-[#4C6C54]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {filtro}
              </button>
            ))}
          </div>
        </div>

        {/* FEED EM CARDS ESTRUTURADOS */}
        <div className="space-y-3">
          {registrosFiltrados.map((item) => (
            <div 
              key={item.id}
              className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-extrabold text-[#EB6D57] bg-[#EB6D57]/10 px-2.5 py-0.5 rounded-md">
                    {item.refeicao}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">• {item.data}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800">{item.alimento}</h3>
                <p className="text-xs text-slate-500">{item.detalhe}</p>
              </div>

              <div className="flex sm:flex-col sm:items-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <span className="text-xs font-bold text-[#4C6C54] bg-[#4C6C54]/10 px-3 py-1 rounded-xl">
                  {item.etapa}
                </span>
                <span className="text-xs font-medium text-slate-600">
                  Reação: <strong>{emojiReacao(item.reacao)}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DE REGISTRO DIRETO NA PÁGINA */}
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

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5">
                  Alimento Oferecido
                </label>
                <input 
                  type="text"
                  value={novoAlimento}
                  onChange={(e) => setNovoAlimento(e.target.value)}
                  placeholder="Ex: Cenoura ralada, Pedaço de melancia..."
                  className="w-full h-13 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4C6C54] focus:bg-white"
                  required
                />
              </div>

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

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5">
                  Observações (Opcional)
                </label>
                <textarea
                  value={novoDetalhe}
                  onChange={(e) => setNovoDetalhe(e.target.value)}
                  placeholder="Ex: Não reclamou do cheiro, mas empurrou o prato na hora de provar..."
                  rows={2}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4C6C54] focus:bg-white resize-none"
                />
              </div>

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
                  className="flex-1 py-3.5 px-4 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-bold text-sm rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
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