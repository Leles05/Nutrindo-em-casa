"use client";

import { useState } from "react";
import { ArrowLeft, Sparkles, Plus, Utensils, Check, X, Calendar } from "lucide-react";
import Link from "next/link";

interface RegistroRefeicao {
  id: number;
  data: string; // YYYY-MM-DD
  refeicao: "Café" | "Almoço" | "Lanche" | "Jantar";
  alimento: string;
  etapa: string;
  degrauSlug: "tolerou" | "cheirou" | "tocou" | "provou" | "comeu";
  reacao: "positivo" | "neutro" | "desafiador";
  detalhe: string;
}

export default function PaginaDiarioAlimentar() {
  const hoje = "2026-09-22";

  const [filtroRefeicao, setFiltroRefeicao] = useState("Todas");
  const [filtroDegrau, setFiltroDegrau] = useState<string | null>(null);
  const [filtroData, setFiltroData] = useState<string>("");

  const [modalAberto, setModalAberto] = useState(false);
  const [toastMensagem, setToastMensagem] = useState("");

  // Form State do Modal
  const [novaData, setNovaData] = useState(hoje);
  const [novaRefeicao, setNovaRefeicao] = useState<"Café" | "Almoço" | "Lanche" | "Jantar">("Almoço");
  const [novoAlimento, setNovoAlimento] = useState("");
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [novaEtapa, setNovaEtapa] = useState("👃 Cheirou voluntariamente");
  const [novaEtapaSlug, setNovaEtapaSlug] = useState<"tolerou" | "cheirou" | "tocou" | "provou" | "comeu">("cheirou");
  const [novaReacao, setNovaReacao] = useState<"positivo" | "neutro" | "desafiador">("positivo");
  const [novoDetalhe, setNovoDetalhe] = useState("");

  // Base de alimentos para Autocomplete (simulando futuro BD)
  const bancoAlimentos = [
    "Brócolis 🥦", "Cenoura 🥕", "Maçã 🍎", "Mamão 🥭", "Banana 🍌",
    "Morango 🍓", "Abobrinha 🥒", "Beterraba 🥗", "Batata doce 🍠",
    "Ovo mexido 🥚", "Frango desfiado 🍗", "Arroz com feijão 🍚",
    "Melancia 🍉", "Pera 🍐", "Tomate 🍅", "Abacate 🥑"
  ];

  const sugestoesAlimentos = novoAlimento.trim()
    ? bancoAlimentos.filter(
        (a) =>
          a.toLowerCase().includes(novoAlimento.toLowerCase().trim()) &&
          a.toLowerCase() !== novoAlimento.toLowerCase().trim()
      )
    : [];

  const [historico, setHistorico] = useState<RegistroRefeicao[]>([
    { 
      id: 1, 
      data: "2026-09-22", 
      refeicao: "Almoço", 
      alimento: "Brócolis 🥦", 
      etapa: "👃 Cheirou voluntariamente", 
      degrauSlug: "cheirou",
      reacao: "positivo", 
      detalhe: "Aproximou do prato e cheirou sem afastar." 
    },
    { 
      id: 2, 
      data: "2026-09-22", 
      refeicao: "Lanche", 
      alimento: "Maçã em fatias 🍎", 
      etapa: "👀 Tolerou no prato", 
      degrauSlug: "tolerou",
      reacao: "neutro", 
      detalhe: "Permaneceu no prato sem demonstrar incômodo." 
    },
    { 
      id: 3, 
      data: "2026-09-21", 
      refeicao: "Jantar", 
      alimento: "Cenoura baby 🥕", 
      etapa: "🖐️ Tocou com talher", 
      degrauSlug: "tocou",
      reacao: "positivo", 
      detalhe: "Espetou o vegetal com o garfo por iniciativa própria." 
    },
    { 
      id: 4, 
      data: "2026-09-21", 
      refeicao: "Almoço", 
      alimento: "Arroz com Feijão 🍚", 
      etapa: "😋 Comeu e engoliu", 
      degrauSlug: "comeu",
      reacao: "positivo", 
      detalhe: "Comeu 3 colheres cheias com boa autonomia." 
    },
    { 
      id: 5, 
      data: "2026-09-16", 
      refeicao: "Café", 
      alimento: "Mamão 🥭", 
      etapa: "👀 Tolerou no prato", 
      degrauSlug: "tolerou",
      reacao: "desafiador", 
      detalhe: "Pediu para afastar a fruta nos primeiros minutos." 
    },
  ]);

  const etapasEscalada = [
    { label: "Tolerou no prato", icone: "👀", slug: "tolerou" as const },
    { label: "Interagiu c/ talher", icone: "🖐️", slug: "tocou" as const },
    { label: "Cheirou voluntariamente", icone: "👃", slug: "cheirou" as const },
    { label: "Tocou com os dedos", icone: "✋", slug: "tocou" as const },
    { label: "Encostou nos lábios", icone: "👄", slug: "provou" as const },
    { label: "Provou / Lambeu", icone: "👅", slug: "provou" as const },
    { label: "Comeu e engoliu", icone: "😋", slug: "comeu" as const }
  ];

  const badgesCores = {
    tolerou: "bg-blue-50 text-blue-700 border-blue-200",
    cheirou: "bg-amber-50 text-amber-700 border-amber-200",
    tocou: "bg-purple-50 text-purple-700 border-purple-200",
    provou: "bg-rose-50 text-rose-700 border-rose-200",
    comeu: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  const ordemRefeicoes: Record<string, number> = {
    "Café": 1,
    "Almoço": 2,
    "Lanche": 3,
    "Jantar": 4
  };

  const formatarGrupoData = (dataIso: string) => {
    if (dataIso === hoje) return "Hoje, 22 de Setembro";
    if (dataIso === "2026-09-21") return "Ontem, 21 de Setembro";
    const [ano, mes, dia] = dataIso.split("-").map(Number);
    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return `${dia} de ${meses[mes - 1]}`;
  };

  const adicionarRegistro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoAlimento.trim()) return;

    const novo: RegistroRefeicao = {
      id: Date.now(),
      data: novaData,
      refeicao: novaRefeicao,
      alimento: novoAlimento.trim(),
      etapa: novaEtapa,
      degrauSlug: novaEtapaSlug,
      reacao: novaReacao,
      detalhe: novoDetalhe.trim() || "Registro realizado no diário alimentar."
    };

    setHistorico([novo, ...historico]);
    setNovoAlimento("");
    setNovoDetalhe("");
    setNovaData(hoje);
    setModalAberto(false);

    setToastMensagem(`Conquista com ${novo.alimento} registrada! 🎉`);
    setTimeout(() => setToastMensagem(""), 3500);
  };

  // Filtros aplicados
  const registrosFiltrados = historico.filter((item) => {
    const combinaRefeicao = filtroRefeicao === "Todas" || item.refeicao === filtroRefeicao;
    const combinaDegrau = !filtroDegrau || item.degrauSlug === filtroDegrau;
    const combinaData = !filtroData || item.data === filtroData;
    return combinaRefeicao && combinaDegrau && combinaData;
  });

  // Agrupamento por data com ordenação cronológica das refeições dentro de cada dia
  const datasUnicas = Array.from(new Set(registrosFiltrados.map((r) => r.data))).sort(
    (a, b) => b.localeCompare(a)
  );

  const gruposPorData = datasUnicas.map((dataIso) => {
    const itensDoDia = registrosFiltrados
      .filter((r) => r.data === dataIso)
      .sort((a, b) => ordemRefeicoes[a.refeicao] - ordemRefeicoes[b.refeicao]);
    return {
      dataIso,
      labelGrupo: formatarGrupoData(dataIso),
      itens: itensDoDia
    };
  });

  return (
    <div className="max-w-5xl mx-auto space-y-5 animation-fade-in pb-4 relative">
      
      {/* TOAST DE FEEDBACK */}
      {toastMensagem && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-[#4C6C54] text-white text-xs font-bold rounded-2xl shadow-2xl flex items-center gap-2.5 animation-fade-in border border-emerald-400/30">
          <Sparkles className="h-4 w-4 text-amber-300 shrink-0" />
          <span>{toastMensagem}</span>
          <button type="button" onClick={() => setToastMensagem("")} className="text-white/70 hover:text-white ml-2 p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#4C6C54] transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao Início
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-800">Histórico do Diário Alimentar</h1>
          <p className="text-slate-500 text-xs">Evolução sensorial e marcos da Escalada do Comer.</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setNovaData(hoje);
            setModalAberto(true);
          }}
          className="px-5 py-2.5 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" /> Registrar Refeição
        </button>
      </div>

      {/* MÉTRICAS DA ESCALADA (FILTRO INTERATIVO) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-1.5 text-[#4C6C54] font-bold text-xs">
            <Sparkles className="h-4 w-4" />
            <span>Progresso na Escalada do Comer</span>
          </div>
          <span className="text-[11px] text-slate-400">
            {filtroDegrau ? "Clique no card ativo para limpar" : "Clique para filtrar por degrau"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { degrau: "Tolerou", slug: "tolerou", total: historico.filter((i) => i.degrauSlug === "tolerou").length, icone: "👀", cor: "bg-blue-50 text-blue-700 border-blue-100 ring-blue-400" },
            { degrau: "Cheirou", slug: "cheirou", total: historico.filter((i) => i.degrauSlug === "cheirou").length, icone: "👃", cor: "bg-amber-50 text-amber-700 border-amber-100 ring-amber-400" },
            { degrau: "Tocou", slug: "tocou", total: historico.filter((i) => i.degrauSlug === "tocou").length, icone: "🖐️", cor: "bg-purple-50 text-purple-700 border-purple-100 ring-purple-400" },
            { degrau: "Provou", slug: "provou", total: historico.filter((i) => i.degrauSlug === "provou").length, icone: "👅", cor: "bg-rose-50 text-rose-700 border-rose-100 ring-rose-400" },
            { degrau: "Comeu", slug: "comeu", total: historico.filter((i) => i.degrauSlug === "comeu").length, icone: "😋", cor: "bg-emerald-50 text-emerald-700 border-emerald-100 ring-emerald-400" },
          ].map((item) => {
            const isAtivo = filtroDegrau === item.slug;
            return (
              <button
                key={item.degrau}
                type="button"
                onClick={() => setFiltroDegrau(isAtivo ? null : item.slug)}
                className={`p-3 rounded-xl border ${item.cor} flex flex-col items-center justify-center text-center space-y-0.5 transition-all cursor-pointer ${
                  isAtivo ? "ring-2 shadow-xs font-black scale-102" : "opacity-85 hover:opacity-100"
                }`}
              >
                <span className="text-xl">{item.icone}</span>
                <span className="text-base font-extrabold">{item.total}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">{item.degrau}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <Utensils className="h-4 w-4 text-[#EB6D57]" /> Linha do Tempo Alimentar
          </h2>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <input 
                type="date"
                value={filtroData}
                onChange={(e) => setFiltroData(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
              />
              {filtroData && (
                <button 
                  type="button" 
                  onClick={() => setFiltroData("")}
                  className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                  title="Limpar filtro de data"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 overflow-x-auto">
              {["Todas", "Café", "Almoço", "Lanche", "Jantar"].map((filtro) => (
                <button
                  key={filtro}
                  type="button"
                  onClick={() => setFiltroRefeicao(filtro)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
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
        </div>

        {/* TIMELINE ORDENADA CRONOLOGICAMENTE */}
        {gruposPorData.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-dashed border-slate-200 text-center space-y-3">
            <Utensils className="h-7 w-7 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">Nenhum registro encontrado</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Nenhuma refeição corresponde aos filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {gruposPorData.map((grupo) => (
              <div key={grupo.dataIso} className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-extrabold text-[#4C6C54] bg-[#4C6C54]/10 px-3 py-1 rounded-full shrink-0">
                    {grupo.labelGrupo}
                  </span>
                  <div className="flex-1 h-px bg-slate-200/80" />
                </div>

                <div className="space-y-2">
                  {grupo.itens.map((item) => (
                    <div 
                      key={item.id}
                      className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs hover:border-slate-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold text-[#EB6D57] bg-[#EB6D57]/10 px-2 py-0.5 rounded">
                            {item.refeicao}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">{item.alimento}</h3>
                        <p className="text-xs text-slate-500">{item.detalhe}</p>
                      </div>

                      <div className="flex sm:flex-col sm:items-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${badgesCores[item.degrauSlug]}`}>
                          {item.etapa}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500">
                          Reação: <strong>{item.reacao}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL COMPACTO 100% SEM ROLAGEM COM AUTOCOMPLETE */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 animation-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-3.5 shadow-2xl border border-slate-100">
            
            {/* CABEÇALHO DO MODAL */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Registrar no Diário</h3>
                <p className="text-[11px] text-slate-400">Mapeie a evolução sensorial da criança</p>
              </div>
              <button 
                type="button" 
                onClick={() => setModalAberto(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={adicionarRegistro} className="space-y-3">
              
              {/* LINHA 1: DATA E REFEIÇÃO COMPACTADAS */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                <div className="sm:col-span-5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Data
                  </label>
                  <input 
                    type="date"
                    max={hoje}
                    value={novaData}
                    onChange={(e) => setNovaData(e.target.value)}
                    className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4C6C54] cursor-pointer"
                    required
                  />
                </div>

                <div className="sm:col-span-7">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Refeição
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {(["Café", "Almoço", "Lanche", "Jantar"] as const).map((ref) => (
                      <button
                        key={ref}
                        type="button"
                        onClick={() => setNovaRefeicao(ref)}
                        className={`py-2 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                          novaRefeicao === ref 
                            ? 'bg-[#4C6C54] text-white border-[#4C6C54]' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {ref}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* LINHA 2: ALIMENTO COM AUTOCOMPLETE DINÂMICO */}
              <div className="relative">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Alimento Oferecido
                </label>
                <input 
                  type="text"
                  value={novoAlimento}
                  onChange={(e) => {
                    setNovoAlimento(e.target.value);
                    setDropdownAberto(true);
                  }}
                  onFocus={() => setDropdownAberto(true)}
                  placeholder="Digite o alimento (ex: Brócolis, Maçã...)"
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4C6C54] focus:bg-white"
                  required
                />

                {/* DROPDOWN DE AUTOCOMPLETE CONFORME DIGITA */}
                {dropdownAberto && sugestoesAlimentos.length > 0 && (
                  <div className="absolute left-0 right-0 top-15 z-20 bg-white border border-slate-200 rounded-xl shadow-lg max-h-36 overflow-y-auto py-1">
                    {sugestoesAlimentos.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => {
                          setNovoAlimento(sug);
                          setDropdownAberto(false);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-[#4C6C54]/10 hover:text-[#4C6C54] transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <span>{sug}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* CHIPS RÁPIDOS SE ESTIVER VAZIO */}
                {!novoAlimento && (
                  <div className="flex items-center gap-1.5 mt-1 overflow-x-auto pb-0.5">
                    <span className="text-[10px] text-slate-400 font-bold shrink-0">Atalhos:</span>
                    {["Brócolis 🥦", "Cenoura 🥕", "Maçã 🍎", "Mamão 🥭"].map((fruta) => (
                      <button
                        key={fruta}
                        type="button"
                        onClick={() => setNovoAlimento(fruta)}
                        className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors shrink-0 cursor-pointer"
                      >
                        +{fruta}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* LINHA 3: DEGRAU DA ESCALADA (GRID COMPACTO) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Degrau da Escalada
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {etapasEscalada.map((etapa) => {
                    const textoCompleto = `${etapa.icone} ${etapa.label}`;
                    const isSelected = novaEtapa === textoCompleto;
                    return (
                      <button
                        key={etapa.label}
                        type="button"
                        onClick={() => {
                          setNovaEtapa(textoCompleto);
                          setNovaEtapaSlug(etapa.slug);
                        }}
                        className={`py-1.5 px-2.5 text-left rounded-lg border flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#4C6C54] bg-[#4C6C54]/10 text-[#4C6C54] font-bold shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs">{etapa.icone}</span>
                        <span className="text-[11px] truncate">{etapa.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LINHA 4: REAÇÃO DA CRIANÇA (HORIZONTAL COMPACTA) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Reação da Criança
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "positivo", emoji: "😊", label: "Tranquilo" },
                    { id: "neutro", emoji: "😐", label: "Curioso" },
                    { id: "desafiador", emoji: "🙁", label: "Resistência" }
                  ].map((rec) => (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => setNovaReacao(rec.id as any)}
                      className={`py-1.5 px-2 rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        novaReacao === rec.id
                          ? 'border-[#EB6D57] bg-[#EB6D57]/10 text-[#EB6D57] font-bold'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-sm">{rec.emoji}</span>
                      <span className="text-[11px]">{rec.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* LINHA 5: OBSERVAÇÃO EM UMA LINHA */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Observação (Opcional)
                </label>
                <input
                  type="text"
                  value={novoDetalhe}
                  onChange={(e) => setNovoDetalhe(e.target.value)}
                  placeholder="Ex: Tocou com curiosidade no prato de apoio..."
                  className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#4C6C54] focus:bg-white"
                />
              </div>

              {/* RODAPÉ DO FORMULÁRIO COM AÇÕES IMEDIATAS */}
              <div className="pt-2 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" /> Salvar Conquista
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}