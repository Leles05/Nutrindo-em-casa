"use client";

import { useState } from "react";
import { 
  Calendar as CalendarIcon, Clock, Video, CheckCircle2, 
  ChevronLeft, ChevronRight, Plus, X, Check, Sparkles, AlertCircle, 
  Target, Info, ArrowUpRight, ShieldAlert
} from "lucide-react";
import Link from "next/link";

interface Evento {
  id: number;
  data: string;
  titulo: string;
  tipo: "consulta" | "meta" | "mentoria";
  horario: string;
  plataforma?: string;
  link?: string;
  concluido?: boolean;
}

export default function PaginaCalendario() {
  const hoje = "2026-09-22";
  
  const [dataSelecionada, setDataSelecionada] = useState("2026-09-27");
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "consulta" | "meta">("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [toastMensagem, setToastMensagem] = useState("");
  const [avisoDataPassadaModal, setAvisoDataPassadaModal] = useState("");

  const [eventos, setEventos] = useState<Evento[]>([
    {
      id: 1,
      data: "2026-09-27",
      titulo: "Consulta Nutricional (Retorno com Dra. Laís)",
      tipo: "consulta",
      horario: "14:00 - 15:00",
      plataforma: "Google Meet",
      link: "https://meet.google.com",
      concluido: false
    },
    {
      id: 2,
      data: "2026-09-28",
      titulo: "Introduzir nova fruta (Maçã em fatias finas)",
      tipo: "meta",
      horario: "09:00",
      concluido: false
    },
    {
      id: 3,
      data: "2026-09-27",
      titulo: "Oferecer brócolis no prato de apoio (Tolerar)",
      tipo: "meta",
      horario: "12:30",
      concluido: true
    },
    {
      id: 4,
      data: "2026-09-30",
      titulo: "Avaliação do Diário Alimentar do mês",
      tipo: "meta",
      horario: "18:00",
      concluido: false
    }
  ]);

  const metasMensais = [
    { id: 1, icone: "🥦", meta: "Tolerar 3 novos vegetais", descricao: "Apresentar no prato de apoio sem forçar o consumo.", progresso: 2, total: 3, prazo: "30/09", corBadge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { id: 2, icone: "📱", meta: "Telas < 15min na refeição", descricao: "Transição gradual focada em conversar à mesa.", progresso: 4, total: 7, prazo: "Semanal", corBadge: "bg-blue-50 text-blue-700 border-blue-200" },
    { id: 3, icone: "🍉", meta: "Toque em frutas úmidas", descricao: "Exploração tátil com pedaços de mamão e melancia.", progresso: 1, total: 2, prazo: "28/09", corBadge: "bg-amber-50 text-amber-700 border-amber-200" }
  ];

  const [novoTitulo, setNovoTitulo] = useState("");
  const [novoTipo, setNovoTipo] = useState<"consulta" | "meta">("meta");
  const [novaData, setNovaData] = useState(dataSelecionada >= hoje ? dataSelecionada : hoje);
  const [novoHorario, setNovoHorario] = useState("12:00");
  const [erroData, setErroData] = useState("");

  const abrirModalNovoEvento = () => {
    setErroData("");
    if (dataSelecionada < hoje) {
      const dataFormatada = dataSelecionada.split("-").reverse().join("/");
      setAvisoDataPassadaModal(`Você estava vendo ${dataFormatada}. A data foi ajustada para hoje (${hoje.split("-").reverse().join("/")}).`);
      setNovaData(hoje);
    } else {
      setAvisoDataPassadaModal("");
      setNovaData(dataSelecionada);
    }
    setModalAberto(true);
  };

  const toggleConcluido = (id: number) => {
    setEventos(eventos.map(evt => evt.id === id ? { ...evt, concluido: !evt.concluido } : evt));
  };

  const adicionarEvento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTitulo.trim()) return;

    if (novaData < hoje) {
      setErroData("Não é permitido agendar em datas passadas.");
      return;
    }

    const novo: Evento = {
      id: Date.now(),
      data: novaData,
      titulo: novoTitulo,
      tipo: novoTipo,
      horario: novoHorario,
      concluido: false
    };

    setEventos([...eventos, novo]);
    setDataSelecionada(novaData);
    setNovoTitulo("");
    setModalAberto(false);

    setToastMensagem(`Agendado para ${novaData.split("-").reverse().join("/")}! 🗓️`);
    setTimeout(() => setToastMensagem(""), 3500);
  };

  const diasComEventos = eventos.reduce((acc, evt) => {
    acc[evt.data] = acc[evt.data] || [];
    acc[evt.data].push(evt.tipo);
    return acc;
  }, {} as Record<string, string[]>);

  // Contadores dinâmicos para as abas de filtro
  const eventosDoDiaBase = eventos.filter(evt => evt.data === dataSelecionada);
  const countTodos = eventosDoDiaBase.length;
  const countConsultas = eventosDoDiaBase.filter(evt => evt.tipo === "consulta").length;
  const countMetas = eventosDoDiaBase.filter(evt => evt.tipo === "meta").length;

  const eventosDoDia = eventosDoDiaBase.filter(evt => filtroTipo === "todos" || evt.tipo === filtroTipo);

  const diasDoMes = Array.from({ length: 30 }, (_, i) => i + 1);
  const espacosInicio = 2;

  const formatarDataAmigavel = (dataIso: string) => {
    const [ano, mes, dia] = dataIso.split("-").map(Number);
    const dateObj = new Date(ano, mes - 1, dia);
    const diasSemana = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    return `${diasSemana[dateObj.getDay()]}, ${dia} de ${meses[dateObj.getMonth()]}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 animation-fade-in pb-2 relative">
      
      {/* TOAST FLUTUANTE */}
      {toastMensagem && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 bg-[#2A546D] text-white text-xs font-bold rounded-xl shadow-xl flex items-center gap-2.5 animation-fade-in">
          <Sparkles className="h-4 w-4 text-amber-300 shrink-0" />
          <span>{toastMensagem}</span>
          <button type="button" onClick={() => setToastMensagem("")} className="text-white/70 hover:text-white ml-2 cursor-pointer">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#2A546D] flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-[#2A546D]" /> Calendário & Metas
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Consultas, rotinas alimentares e metas da terapia.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-[#2A546D] bg-[#2A546D]/10 px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-[#2A546D]/15">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#2A546D]" /> Google Calendar Sincronizado
          </span>
          <button
            type="button"
            onClick={abrirModalNovoEvento}
            className="px-4 py-2 bg-[#2A546D] hover:bg-[#204054] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="h-3.5 w-3.5" /> Novo Lembrete / Meta
          </button>
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* MINI CALENDÁRIO MENSAL */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h2 className="text-base font-extrabold text-slate-800">Setembro 2026</h2>
              <p className="text-[11px] text-slate-400">Selecione uma data para inspecionar</p>
            </div>
            <div className="flex items-center gap-1">
              <button 
                type="button" 
                onClick={() => setDataSelecionada(hoje)}
                className="text-xs font-bold text-[#4C6C54] bg-[#4C6C54]/10 hover:bg-[#4C6C54]/20 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              >
                Hoje
              </button>
              <button type="button" className="p-1 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button type="button" className="p-1 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia, idx) => (
              <span key={idx} className="text-[10px] font-extrabold text-slate-400 py-0.5">
                {dia}
              </span>
            ))}

            {Array.from({ length: espacosInicio }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-9"></div>
            ))}

            {diasDoMes.map((dia) => {
              const diaString = dia < 10 ? `0${dia}` : `${dia}`;
              const dataCompleta = `2026-09-${diaString}`;
              const estaSelecionado = dataSelecionada === dataCompleta;
              const ehHoje = hoje === dataCompleta;
              const ehPassado = dataCompleta < hoje;
              const tiposEventos = diasComEventos[dataCompleta];

              return (
                <button
                  key={dia}
                  type="button"
                  onClick={() => setDataSelecionada(dataCompleta)}
                  className={`h-9 w-full rounded-xl flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                    estaSelecionado 
                      ? 'bg-[#2A546D] text-white font-extrabold shadow-xs z-10 scale-105' 
                      : ehHoje
                        ? 'ring-2 ring-[#4C6C54] text-[#4C6C54] font-black bg-[#4C6C54]/10'
                        : ehPassado
                          ? 'text-slate-400 opacity-60 hover:opacity-100 font-normal'
                          : 'hover:bg-slate-50 text-slate-700 font-semibold'
                  }`}
                >
                  <span className="text-xs leading-none">{dia}</span>
                  
                  {tiposEventos && (
                    <div className="flex gap-0.5 mt-0.5">
                      {tiposEventos.includes("consulta") && (
                        <span className={`h-1 w-1 rounded-full ${estaSelecionado ? 'bg-white' : 'bg-[#2A546D]'}`} />
                      )}
                      {tiposEventos.includes("meta") && (
                        <span className={`h-1 w-1 rounded-full ${estaSelecionado ? 'bg-amber-300' : 'bg-[#EB6D57]'}`} />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#2A546D]" /> Consultas
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#EB6D57]" /> Metas
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full ring-2 ring-[#4C6C54] bg-white" /> Hoje
            </span>
          </div>
        </div>

        {/* COMPROMISSOS DO DIA */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2A546D]">
                  Compromissos para
                </span>
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  {formatarDataAmigavel(dataSelecionada)}
                  {dataSelecionada === hoje && (
                    <span className="text-[10px] font-bold bg-[#4C6C54]/10 text-[#4C6C54] px-2 py-0.5 rounded-md">
                      Hoje
                    </span>
                  )}
                  {dataSelecionada < hoje && (
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" /> Data Passada
                    </span>
                  )}
                </h3>
              </div>

              {/* FILTROS COM CONTAGEM NUMÉRICA */}
              <div className="flex items-center gap-1">
                {[
                  { id: "todos", label: `Todos (${countTodos})` },
                  { id: "consulta", label: `Consultas (${countConsultas})` },
                  { id: "meta", label: `Metas (${countMetas})` }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFiltroTipo(f.id as any)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      filtroTipo === f.id
                        ? 'bg-[#2A546D] text-white border-[#2A546D]'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {eventosDoDia.length === 0 ? (
                <div className="py-10 text-center space-y-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <CalendarIcon className="h-6 w-6 text-slate-300 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-700">Nenhum compromisso marcado para este dia</h4>
                  <p className="text-[11px] text-slate-400">
                    {dataSelecionada < hoje 
                      ? "Esta data já passou e não possui eventos registrados." 
                      : "Aproveite para criar um lembrete ou registrar uma meta alimentar."}
                  </p>
                </div>
              ) : (
                eventosDoDia.map((evt) => (
                  <div 
                    key={evt.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      evt.concluido 
                        ? 'bg-slate-50/70 border-slate-100 opacity-60' 
                        : evt.tipo === 'consulta'
                          ? 'bg-[#2A546D]/5 border-[#2A546D]/20'
                          : 'bg-white border-slate-100 hover:border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => toggleConcluido(evt.id)}
                        className={`h-4 w-4 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                          evt.concluido
                            ? 'bg-[#4C6C54] border-[#4C6C54] text-white'
                            : 'border-slate-300 bg-white hover:border-[#2A546D]'
                        }`}
                      >
                        {evt.concluido && <Check className="h-3 w-3" />}
                      </button>

                      <div className="space-y-0.5 truncate">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            evt.tipo === 'consulta' 
                              ? 'bg-[#2A546D] text-white' 
                              : 'bg-[#EB6D57]/10 text-[#EB6D57]'
                          }`}>
                            {evt.tipo}
                          </span>
                          <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {evt.horario}
                          </span>
                        </div>
                        <h4 className={`text-xs font-bold text-slate-800 truncate ${evt.concluido ? 'line-through text-slate-400' : ''}`}>
                          {evt.titulo}
                        </h4>
                      </div>
                    </div>

                    {evt.link && !evt.concluido && (
                      <a
                        href={evt.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2A546D] hover:bg-[#204054] text-white font-bold text-xs rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                      >
                        <Video className="h-3.5 w-3.5" /> Entrar na Chamada
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {dataSelecionada >= hoje && (
            <button
              type="button"
              onClick={abrirModalNovoEvento}
              className="w-full py-2.5 border border-dashed border-[#2A546D]/40 text-[#2A546D] hover:bg-[#2A546D]/5 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-1"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar Meta ou Compromisso neste Dia
            </button>
          )}
        </div>

      </div>

      {/* METAS TERAPÊUTICAS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[#EB6D57]" />
            <h2 className="text-sm font-extrabold text-slate-800">
              Metas Terapêuticas em Andamento
            </h2>
            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
              • Acompanhamento quinzenal traçado com a nutricionista
            </span>
          </div>

          <Link
            href="/dashboard/diario"
            className="text-xs font-bold text-[#4C6C54] hover:underline flex items-center gap-0.5"
          >
            Registrar no Diário <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {metasMensais.map((meta) => {
            const percentual = Math.round((meta.progresso / meta.total) * 100);
            return (
              <div 
                key={meta.id} 
                className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl space-y-2 hover:border-slate-200 transition-colors"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{meta.icone}</span>
                    <h3 className="text-xs font-bold text-slate-800 leading-tight">
                      {meta.meta}
                    </h3>
                  </div>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border shrink-0 ${meta.corBadge}`}>
                    {meta.prazo}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-snug">
                  {meta.descricao}
                </p>

                <div className="space-y-1 pt-1 border-t border-slate-200/50">
                  <div className="flex justify-between text-[10px] font-bold text-slate-600">
                    <span>Evolução</span>
                    <span>{meta.progresso}/{meta.total} ({percentual}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#EB6D57] rounded-full transition-all duration-500"
                      style={{ width: `${percentual}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DE NOVO COMPROMISSO */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animation-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">Novo Lembrete / Meta</h3>
                <p className="text-[11px] text-slate-400">Adicione uma meta na agenda</p>
              </div>
              <button 
                type="button" 
                onClick={() => setModalAberto(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {avisoDataPassadaModal && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-800 text-xs leading-tight font-medium">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{avisoDataPassadaModal}</span>
              </div>
            )}

            {erroData && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-xs font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{erroData}</span>
              </div>
            )}

            <form onSubmit={adicionarEvento} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "meta", label: "Meta Alimentar" },
                    { id: "consulta", label: "Consulta" }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNovoTipo(t.id as any)}
                      className={`py-2 px-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        novoTipo === t.id
                          ? 'bg-[#2A546D] text-white border-[#2A546D]'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Título</label>
                <input 
                  type="text"
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  placeholder="Ex: Oferecer mamão em fatias..."
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2A546D] focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Data</label>
                  <input 
                    type="date"
                    min={hoje}
                    value={novaData}
                    onChange={(e) => {
                      setNovaData(e.target.value);
                      if (e.target.value >= hoje) setErroData("");
                    }}
                    onInvalid={(e) => (e.target as HTMLInputElement).setCustomValidity("Selecione a data de hoje ou uma data futura.")}
                    onInput={(e) => (e.target as HTMLInputElement).setCustomValidity("")}
                    className="w-full h-11 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2A546D] cursor-pointer"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Horário</label>
                  <input 
                    type="time"
                    value={novoHorario}
                    onChange={(e) => setNovoHorario(e.target.value)}
                    className="w-full h-11 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2A546D] cursor-pointer text-center"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="flex-1 py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-3 bg-[#2A546D] hover:bg-[#204054] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" /> Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}