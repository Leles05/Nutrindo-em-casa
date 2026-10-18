"use client";

import { useState, useEffect, Suspense, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Calendar as CalendarIcon, Clock, Video, CheckCircle2, 
  ChevronLeft, ChevronRight, Plus, X, Check, Sparkles, AlertCircle, 
  Target, Info, ArrowUpRight, ShieldAlert, Lock, ExternalLink
} from "lucide-react";
import Link from "next/link";
import ModalCheckin4Semanas from "@/components/ModalCheckin4Semanas";

interface Evento {
  id: number | string;
  data: string; // YYYY-MM-DD
  titulo: string;
  tipo: "consulta" | "meta" | "mentoria" | "lembrete";
  horario: string;
  plataforma?: string;
  link?: string;
  concluido?: boolean;
  observacoes?: string;
}

function ConteudoCalendario() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modoOnboarding = searchParams.get("onboarding") === "consulta";

  // Data atual real no fuso do navegador do usuário
  const obterDataHojeLocal = () => {
    const d = new Date();
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  };

  const hoje = useMemo(() => obterDataHojeLocal(), []);

  // Regra Clínica: Consultas com a Dra. Laís exigem antecedência mínima de 7 dias (+7 dias de hoje)
  const dataMinimaConsultaISO = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 7);
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }, []);

  const dataMinimaConsultaBR = useMemo(() => {
    const partes = dataMinimaConsultaISO.split("-");
    return `${partes[2]}/${partes[1]}`;
  }, [dataMinimaConsultaISO]);

  // Grade de horários padrão da agenda clínica da Dra. Laís
  const slotsDraLais = useMemo(() => ["09:00", "10:30", "14:00", "15:30", "17:00"], []);
  const [horariosOcupadosNutri, setHorariosOcupadosNutri] = useState<Array<{ data: string; horario: string }>>([]);

  // Ano e Mês de visualização do calendário (0 = Janeiro ... 11 = Dezembro)
  const [anoVisualizacao, setAnoVisualizacao] = useState(() => new Date().getFullYear());
  const [mesVisualizacao, setMesVisualizacao] = useState(() => new Date().getMonth());
  const [dataSelecionada, setDataSelecionada] = useState(hoje);

  const [filtroTipo, setFiltroTipo] = useState<"todos" | "consulta" | "meta">("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [modalCheckinAberto, setModalCheckinAberto] = useState(false);
  const [toastMensagem, setToastMensagem] = useState("");
  const [modalSucessoOnboarding, setModalSucessoOnboarding] = useState(false);

  // Status de Onboarding do Usuário
  const [anamneseConcluida, setAnamneseConcluida] = useState(true);
  const [consultaAgendada, setConsultaAgendada] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const anamneseSalva = localStorage.getItem("anamnese_concluida") === "true";
      const consultaSalva = localStorage.getItem("consulta_agendada") === "true";
      
      // Se estiver explicitamente com o param onboarding ou se a flag ainda for falsa
      if (modoOnboarding || !consultaSalva) {
        setAnamneseConcluida(true);
        setConsultaAgendada(consultaSalva);
      }
    }
  }, [modoOnboarding]);

  const [eventos, setEventos] = useState<Evento[]>([
    {
      id: 1,
      data: hoje,
      titulo: "Meta do Dia: Oferecer vegetal no prato de apoio",
      tipo: "meta",
      horario: "12:30",
      concluido: false
    },
    {
      id: 2,
      data: hoje,
      titulo: "Consulta Nutricional de Acolhimento - Dra. Laís Leles",
      tipo: "consulta",
      horario: "14:00 - 15:00",
      plataforma: "Google Meet",
      link: "https://meet.google.com",
      concluido: false
    }
  ]);

  // Regra Clínica do Ciclo de 4 Semanas (28 dias entre consultas):
  const consultasUsuario = useMemo(() => {
    return eventos.filter((e) => e.tipo === "consulta").sort((a, b) => a.data.localeCompare(b.data));
  }, [eventos]);

  const ultimaConsulta = useMemo(() => {
    return consultasUsuario.length > 0 ? consultasUsuario[consultasUsuario.length - 1] : null;
  }, [consultasUsuario]);

  const temConsultaAgendadaOuRealizada = Boolean(ultimaConsulta);

  const dataMinimaRetornoISO = useMemo(() => {
    if (!ultimaConsulta) return dataMinimaConsultaISO;
    const d = new Date(ultimaConsulta.data + "T00:00:00");
    d.setDate(d.getDate() + 28);
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  }, [ultimaConsulta, dataMinimaConsultaISO]);

  const dataMinimaRetornoBR = useMemo(() => {
    const partes = dataMinimaRetornoISO.split("-");
    return `${partes[2]}/${partes[1]}`;
  }, [dataMinimaRetornoISO]);

  const dataUltimaConsultaBR = useMemo(() => {
    if (!ultimaConsulta) return "";
    const partes = ultimaConsulta.data.split("-");
    return `${partes[2]}/${partes[1]}`;
  }, [ultimaConsulta]);

  // Carrega agendamentos reais do Supabase
  useEffect(() => {
    const emailUsuario =
      typeof window !== "undefined"
        ? localStorage.getItem("nutrindo_user_email") || "lucas@email.com"
        : "lucas@email.com";

    async function carregarAgendamentos() {
      try {
        const res = await fetch(`/api/agendamentos?email=${encodeURIComponent(emailUsuario)}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.horariosOcupadosNutri && Array.isArray(data.horariosOcupadosNutri)) {
          setHorariosOcupadosNutri(data.horariosOcupadosNutri);
        }

        if (data.success && data.agendamentos && data.agendamentos.length > 0) {
          const formatados: Evento[] = data.agendamentos.map((ag: { id: string; data: string; titulo: string; tipo: "consulta" | "meta" | "mentoria" | "lembrete"; horario: string; plataforma?: string; link?: string; concluido?: boolean; observacoes?: string }) => ({
            id: ag.id,
            data: ag.data,
            titulo: ag.titulo,
            tipo: ag.tipo,
            horario: ag.horario,
            plataforma: ag.plataforma || "Google Meet",
            link: ag.link || "https://meet.google.com",
            concluido: Boolean(ag.concluido),
            observacoes: ag.observacoes
          }));

          setEventos((prev) => {
            const mapa = new Map<number | string, Evento>();
            [...formatados, ...prev].forEach((e) => mapa.set(e.id, e));
            return Array.from(mapa.values());
          });
        }
      } catch (err) {
        console.warn("Aviso ao carregar agendamentos:", err);
      }
    }

    carregarAgendamentos();
  }, []);

  // Navegação de Mês Dinâmica
  const voltarMes = () => {
    if (mesVisualizacao === 0) {
      setMesVisualizacao(11);
      setAnoVisualizacao((prev) => prev - 1);
    } else {
      setMesVisualizacao((prev) => prev - 1);
    }
  };

  const avancarMes = () => {
    if (mesVisualizacao === 11) {
      setMesVisualizacao(0);
      setAnoVisualizacao((prev) => prev + 1);
    } else {
      setMesVisualizacao((prev) => prev + 1);
    }
  };

  const irParaHoje = () => {
    const d = new Date();
    setAnoVisualizacao(d.getFullYear());
    setMesVisualizacao(d.getMonth());
    setDataSelecionada(hoje);
  };

  // Nomes dos Meses
  const nomesMeses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const tituloMesAno = `${nomesMeses[mesVisualizacao]} ${anoVisualizacao}`;

  // Cálculo da grade do calendário
  const primeiroDiaSemana = new Date(anoVisualizacao, mesVisualizacao, 1).getDay(); // 0 (Dom) a 6 (Sáb)
  const totalDiasNoMes = new Date(anoVisualizacao, mesVisualizacao + 1, 0).getDate();
  const diasDoMes = Array.from({ length: totalDiasNoMes }, (_, i) => i + 1);

  // Form State do Modal
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novoTipo, setNovoTipo] = useState<"consulta" | "meta">("consulta");
  const [novaData, setNovaData] = useState(dataSelecionada >= hoje ? dataSelecionada : hoje);
  const [novoHorario, setNovoHorario] = useState("14:00");
  const [erroData, setErroData] = useState("");

  const isHorarioOcupado = useCallback((dataStr: string, slotStr: string) => {
    // Se já possui consulta agendada ou realizada: bloqueia datas antes do ciclo de 4 semanas (+28 dias)
    if (temConsultaAgendadaOuRealizada && dataStr < dataMinimaRetornoISO) {
      return true;
    }

    // Se for a 1ª consulta (sem consulta prévia): antecedência mínima de 7 dias
    if (!temConsultaAgendadaOuRealizada && dataStr < dataMinimaConsultaISO) {
      return true;
    }

    // 1. Verifica na lista de consultas ocupadas da API da clínica
    const ocupadoApi = horariosOcupadosNutri.some(
      (h) => h.data === dataStr && (h.horario === slotStr || h.horario.startsWith(slotStr))
    );
    if (ocupadoApi) return true;

    // 2. Verifica se o próprio usuário já marcou consulta no mesmo dia e horário
    const ocupadoLocal = eventos.some(
      (e) => e.tipo === "consulta" && e.data === dataStr && (e.horario === slotStr || e.horario.startsWith(slotStr))
    );
    if (ocupadoLocal) return true;

    // 3. Simulação visual de ocupação de slots em dias específicos para demonstrar realismo da agenda
    const diaNum = parseInt(dataStr.split("-")[2] || "0", 10);
    if (diaNum % 2 === 0 && slotStr === "10:30") return true;
    if (diaNum % 3 === 0 && slotStr === "15:30") return true;

    return false;
  }, [temConsultaAgendadaOuRealizada, dataMinimaRetornoISO, dataMinimaConsultaISO, horariosOcupadosNutri, eventos]);

  const abrirModalNovoEvento = (tipoInicial: "consulta" | "meta" = "meta") => {
    setErroData("");
    setNovoTipo(tipoInicial);
    if (tipoInicial === "consulta") {
      setNovoTitulo(
        temConsultaAgendadaOuRealizada
          ? "Consulta de Retorno Mensal (Ciclo de 4 Semanas) - Dra. Laís"
          : "1ª Consulta Nutricional Pediátrica com Dra. Laís Leles"
      );
      const dataSugerida =
        temConsultaAgendadaOuRealizada && dataSelecionada < dataMinimaRetornoISO
          ? dataMinimaRetornoISO
          : !temConsultaAgendadaOuRealizada && dataSelecionada < dataMinimaConsultaISO
          ? dataMinimaConsultaISO
          : dataSelecionada;
      setNovaData(dataSugerida);
      const slotLivre = slotsDraLais.find((s) => !isHorarioOcupado(dataSugerida, s)) || "";
      setNovoHorario(slotLivre);
    } else {
      if (!novoTitulo || novoTitulo.includes("Consulta")) {
        setNovoTitulo("Meta: Oferecer novo vegetal no prato de apoio");
      }
      setNovaData(dataSelecionada >= hoje ? dataSelecionada : hoje);
      setNovoHorario("12:00");
    }
    setModalAberto(true);
  };

  const toggleConcluido = (id: number | string) => {
    setEventos(eventos.map(evt => evt.id === id ? { ...evt, concluido: !evt.concluido } : evt));
  };

  // Gerador Oficial de Link do Google Calendar
  const gerarLinkGoogleCalendar = (evt: Evento) => {
    const [hInicio, hFim] = evt.horario.includes("-")
      ? evt.horario.split("-").map((s) => s.trim())
      : [evt.horario, ""];

    const dataSemTraco = evt.data.replace(/-/g, "");
    const horaInicioLimpa = (hInicio || "14:00").replace(/\D/g, "").slice(0, 4);
    const inicioStr = `${dataSemTraco}T${horaInicioLimpa.padEnd(4, "0")}00`;

    let fimStr = "";
    if (hFim) {
      const horaFimLimpa = hFim.replace(/\D/g, "").slice(0, 4);
      fimStr = `${dataSemTraco}T${horaFimLimpa.padEnd(4, "0")}00`;
    } else {
      const [hh, mm] = (hInicio || "14:00").split(":").map(Number);
      const fimDate = new Date(
        Number(evt.data.slice(0, 4)),
        Number(evt.data.slice(5, 7)) - 1,
        Number(evt.data.slice(8, 10)),
        (hh || 14) + 1,
        mm || 0
      );
      const yFim = fimDate.getFullYear();
      const mFim = String(fimDate.getMonth() + 1).padStart(2, "0");
      const dFim = String(fimDate.getDate()).padStart(2, "0");
      const hhFim = String(fimDate.getHours()).padStart(2, "0");
      const mmFim = String(fimDate.getMinutes()).padStart(2, "0");
      fimStr = `${yFim}${mFim}${dFim}T${hhFim}${mmFim}00`;
    }

    const text = encodeURIComponent(evt.titulo);
    const details = encodeURIComponent(
      evt.tipo === "consulta"
        ? `Consulta Nutricional Pediátrica com Dra. Laís Leles.\nPlataforma: Google Meet\nLink: ${evt.link || "https://meet.google.com"}`
        : `Meta de Evolução Alimentar Nutrindo em Casa: ${evt.titulo}`
    );
    const location = encodeURIComponent(evt.tipo === "consulta" ? "Google Meet (Online)" : "Nutrindo em Casa");

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${inicioStr}/${fimStr}&details=${details}&location=${location}`;
  };

  const adicionarEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTitulo.trim()) return;

    if (novoTipo === "consulta") {
      const dataMinimaPermitida = temConsultaAgendadaOuRealizada ? dataMinimaRetornoISO : dataMinimaConsultaISO;
      if (novaData < dataMinimaPermitida) {
        setErroData(
          temConsultaAgendadaOuRealizada
            ? `Consultas de retorno seguem o ciclo de 4 semanas. Próximo retorno mensal disponível a partir de ${dataMinimaRetornoBR}.`
            : `Horários preenchidos nesta data. Próximos horários livres na agenda a partir de ${dataMinimaConsultaBR}.`
        );
        return;
      }
      if (!novoHorario) {
        setErroData("Por favor, selecione um dos horários disponíveis na agenda da nutricionista.");
        return;
      }
      if (isHorarioOcupado(novaData, novoHorario)) {
        setErroData("Este horário já está reservado na agenda da nutricionista. Por favor, escolha outro.");
        return;
      }
    } else {
      if (novaData < hoje) {
        setErroData("Não é permitido agendar em datas passadas. Escolha a data de hoje ou futura.");
        return;
      }
    }

    const emailUsuario =
      typeof window !== "undefined"
        ? localStorage.getItem("nutrindo_user_email") || "lucas@email.com"
        : "lucas@email.com";

    const novo: Evento = {
      id: Date.now(),
      data: novaData,
      titulo: novoTitulo,
      tipo: novoTipo,
      horario: novoHorario,
      plataforma: "Google Meet",
      link: "https://meet.google.com",
      concluido: false
    };

    setEventos([novo, ...eventos]);
    setDataSelecionada(novaData);
    setNovoTitulo("");
    setModalAberto(false);

    // Se foi agendada uma consulta durante o onboarding
    if (novoTipo === "consulta") {
      if (typeof window !== "undefined") {
        localStorage.setItem("consulta_agendada", "true");
        setConsultaAgendada(true);
      }
      setModalSucessoOnboarding(true);
    } else {
      setToastMensagem(`Agendado para ${novaData.split("-").reverse().join("/")}! 🗓️`);
      setTimeout(() => setToastMensagem(""), 3500);
    }

    // Persistência no Supabase
    try {
      fetch("/api/agendamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailUsuario,
          titulo: novo.titulo,
          tipo: novo.tipo,
          data: novo.data,
          horario: novo.horario,
          plataforma: novo.plataforma,
          link: novo.link,
        }),
      }).catch((err) => console.warn("Aviso ao salvar agendamento:", err));
    } catch (err) {
      console.warn("Aviso ao persistir agendamento:", err);
    }
  };

  const diasComEventos = eventos.reduce((acc, evt) => {
    acc[evt.data] = acc[evt.data] || [];
    acc[evt.data].push(evt.tipo);
    return acc;
  }, {} as Record<string, string[]>);

  const eventosDoDiaBase = eventos.filter(evt => evt.data === dataSelecionada);
  const countTodos = eventosDoDiaBase.length;
  const countConsultas = eventosDoDiaBase.filter(evt => evt.tipo === "consulta").length;
  const countMetas = eventosDoDiaBase.filter(evt => evt.tipo === "meta").length;

  const eventosDoDia = eventosDoDiaBase.filter(evt => filtroTipo === "todos" || evt.tipo === filtroTipo);

  const formatarDataAmigavel = (dataIso: string) => {
    const [ano, mes, dia] = dataIso.split("-").map(Number);
    const dateObj = new Date(ano, mes - 1, dia);
    const diasSemana = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    return `${diasSemana[dateObj.getDay()]}, ${dia} de ${nomesMeses[dateObj.getMonth()]}`;
  };

  const ehDataPassada = dataSelecionada < hoje;

  return (
    <div className="max-w-6xl mx-auto space-y-4 animation-fade-in pb-4 relative">
      
      {/* TOAST FLUTUANTE */}
      {toastMensagem && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-[#2A546D] text-white text-xs font-bold rounded-2xl shadow-2xl flex items-center gap-2.5 animation-fade-in border border-sky-400/30">
          <Sparkles className="h-4 w-4 text-amber-300 shrink-0" />
          <span>{toastMensagem}</span>
          <button type="button" onClick={() => setToastMensagem("")} className="text-white/70 hover:text-white ml-2 p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* BANNER DE ONBOARDING OBRIGATÓRIO (PASSO FINAL: AGENDAR CONSULTA) */}
      {(!consultaAgendada || modoOnboarding) && (
        <div className="bg-gradient-to-r from-[#2A546D] to-[#1E3B4D] text-white p-5 rounded-3xl shadow-lg border border-sky-300/30 space-y-3 animation-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-900 font-extrabold text-[10px] uppercase tracking-wider">
                <Sparkles className="h-3 w-3" /> Passo 2 de 2 • Onboarding Obrigatório
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                Agende sua 1ª Consulta com a Dra. Laís Leles
              </h2>
              <p className="text-xs text-sky-100 max-w-2xl leading-relaxed">
                Parabéns por concluir sua Anamnese! Agora, selecione um dia e horário na agenda abaixo para agendar sua videochamada de alinhamento individual e desbloquear o acesso total a todos os módulos da plataforma.
              </p>
            </div>

            <button
              type="button"
              onClick={() => abrirModalNovoEvento("consulta")}
              className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Video className="h-4 w-4" />
              <span>Agendar Minha Consulta Agora</span>
            </button>
          </div>
        </div>
      )}

      {/* CABEÇALHO DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Calendário de Acompanhamento</h1>
          <p className="text-slate-500 text-xs">Consultas com a Dra. Laís, metas alimentares e lembretes diários.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setModalCheckinAberto(true)}
            className="px-3.5 py-2.5 bg-[#4C6C54] hover:bg-[#3d5743] text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>📝 Check-in 4 Semanas</span>
          </button>

          <button
            type="button"
            onClick={() => abrirModalNovoEvento("consulta")}
            className="px-4 py-2.5 bg-[#2A546D] hover:bg-[#204054] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Video className="h-3.5 w-3.5" /> Agendar Consulta
          </button>
          
          <button
            type="button"
            disabled={ehDataPassada}
            onClick={() => abrirModalNovoEvento("meta")}
            className={`px-4 py-2.5 font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 ${
              ehDataPassada
                ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 opacity-60"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            }`}
            title={ehDataPassada ? "Não é possível agendar em datas passadas" : "Adicionar Meta"}
          >
            <Plus className="h-3.5 w-3.5" /> Nova Meta / Lembrete
          </button>
        </div>
      </div>

      {/* INDICADOR DO CICLO DE 4 SEMANAS (28 DIAS ENTRE CONSULTAS) */}
      {temConsultaAgendadaOuRealizada && (
        <div className="bg-gradient-to-r from-[#2A546D] to-[#1E3B4D] text-white p-4 sm:p-5 rounded-3xl shadow-sm border border-sky-300/30 flex flex-col md:flex-row md:items-center justify-between gap-3 animation-fade-in">
          <div className="flex items-start sm:items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10 text-sky-200 flex items-center justify-center shrink-0">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 tracking-wider">
                  Ciclo de Acompanhamento (4 em 4 semanas)
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-white mt-1 leading-snug">
                Sua consulta atual está marcada para <strong>{dataUltimaConsultaBR}</strong>. Seu próximo retorno mensal estará disponível a partir de <strong>{dataMinimaRetornoBR}</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setModalCheckinAberto(true)}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span>📝 Atualizar Evolução para a Próxima Consulta (Check-in 4 Semanas)</span>
          </button>
        </div>
      )}

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* MINI CALENDÁRIO MENSAL DINÂMICO */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <h2 className="text-base font-extrabold text-slate-800 capitalize">{tituloMesAno}</h2>
              <p className="text-[11px] text-slate-400">Fuso horário local sincronizado</p>
            </div>
            <div className="flex items-center gap-1">
              <button 
                type="button" 
                onClick={irParaHoje}
                className="text-xs font-bold text-[#4C6C54] bg-[#4C6C54]/10 hover:bg-[#4C6C54]/20 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              >
                Hoje
              </button>
              <button 
                type="button" 
                onClick={voltarMes}
                className="p-1 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer"
                title="Mês anterior"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button 
                type="button" 
                onClick={avancarMes}
                className="p-1 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer"
                title="Próximo mês"
              >
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

            {/* Espaços vazios do início do mês */}
            {Array.from({ length: primeiroDiaSemana }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-9"></div>
            ))}

            {/* Dias reais do mês */}
            {diasDoMes.map((dia) => {
              const mesStr = String(mesVisualizacao + 1).padStart(2, "0");
              const diaStr = String(dia).padStart(2, "0");
              const dataCompleta = `${anoVisualizacao}-${mesStr}-${diaStr}`;
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

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#2A546D]"></span> Consultas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#EB6D57]"></span> Metas
            </span>
            <span className="flex items-center gap-1.5 text-[#4C6C54] font-bold">
              <span className="h-2 w-2 rounded-full border-2 border-[#4C6C54]"></span> Hoje
            </span>
          </div>
        </div>

        {/* AGENDA DETALHADA DO DIA SELECIONADO */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#2A546D] tracking-wider block">
                  {dataSelecionada === hoje ? "Hoje • Compromissos do Dia" : "Compromissos do Dia"}
                </span>
                <h3 className="text-base font-extrabold text-slate-800">
                  {formatarDataAmigavel(dataSelecionada)}
                </h3>
              </div>

              {/* ABAS DE FILTRO */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFiltroTipo("todos")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    filtroTipo === "todos" ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Todos ({countTodos})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTipo("consulta")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    filtroTipo === "consulta" ? 'bg-white text-[#2A546D] shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Consultas ({countConsultas})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroTipo("meta")}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    filtroTipo === "meta" ? 'bg-white text-[#EB6D57] shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Metas ({countMetas})
                </button>
              </div>
            </div>

            {/* AVISO SE A DATA SELECIONADA JÁ PASSOU */}
            {ehDataPassada && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-slate-400" />
                <span>Esta data é passada. Você pode visualizar os registros anteriores normalmente.</span>
              </div>
            )}

            {/* LISTA DE COMPROMISSOS */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {eventosDoDia.length === 0 ? (
                <div className="p-8 text-center space-y-2 border border-dashed border-slate-200 rounded-xl">
                  <CalendarIcon className="h-6 w-6 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Nenhum evento agendado para esta data.</p>
                  <p className="text-[11px] text-slate-400">
                    {ehDataPassada 
                      ? "Esta data já passou e não possui eventos registrados." 
                      : "Aproveite para criar um lembrete ou agendar uma consulta nutricional."}
                  </p>
                </div>
              ) : (
                eventosDoDia.map((evt) => (
                  <div 
                    key={evt.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
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
                        title={evt.concluido ? "Marcar como pendente" : "Marcar como concluído"}
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

                    <div className="flex items-center gap-2 shrink-0">
                      {/* BOTÃO INTEGRADO COM O GOOGLE CALENDAR */}
                      <a
                        href={gerarLinkGoogleCalendar(evt)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                        title="Salvar evento na sua conta do Google Calendar"
                      >
                        <CalendarIcon className="h-3 w-3 text-blue-600" />
                        <span>Google Calendar</span>
                        <ExternalLink className="h-2.5 w-2.5 text-slate-400" />
                      </a>

                      {evt.link && !evt.concluido && evt.tipo === "consulta" && (
                        <a
                          href={evt.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2A546D] hover:bg-[#204054] text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
                        >
                          <Video className="h-3.5 w-3.5" /> Entrar
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* BOTÃO DE AÇÃO CONDICIONAL */}
          {!ehDataPassada ? (
            <button
              type="button"
              onClick={() => abrirModalNovoEvento("meta")}
              className="w-full py-2.5 border border-dashed border-[#2A546D]/40 text-[#2A546D] hover:bg-[#2A546D]/5 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-1"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar Meta ou Compromisso neste Dia
            </button>
          ) : (
            <div className="w-full py-2.5 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl text-center border border-slate-200">
              Não é possível agendar compromissos em datas passadas.
            </div>
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
          {[
            { id: 1, icone: "🥦", meta: "Tolerar 3 novos vegetais", descricao: "Apresentar no prato de apoio sem forçar o consumo.", progresso: 2, total: 3, prazo: "Quinzenal", corBadge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
            { id: 2, icone: "📱", meta: "Telas < 15min na refeição", descricao: "Transição gradual focada em conversar à mesa.", progresso: 4, total: 7, prazo: "Semanal", corBadge: "bg-blue-50 text-blue-700 border-blue-200" },
            { id: 3, icone: "🍉", meta: "Toque em frutas úmidas", descricao: "Exploração tátil com pedaços de mamão e melancia.", progresso: 1, total: 2, prazo: "Em andamento", corBadge: "bg-amber-50 text-amber-700 border-amber-200" }
          ].map((meta) => (
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
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DE NOVO EVENTO / CONSULTA */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 animation-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">
                  {novoTipo === "consulta" ? "Agendar Consulta Nutricional" : "Adicionar Meta / Lembrete"}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {novoTipo === "consulta" ? "Sessão individual com a Dra. Laís Leles" : "Planejamento da rotina alimentar"}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setModalAberto(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {erroData && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{erroData}</span>
              </div>
            )}

            <form onSubmit={adicionarEvento} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Tipo de Agendamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNovoTipo("consulta");
                      if (!novoTitulo || novoTitulo.startsWith("Meta:")) {
                        setNovoTitulo("Consulta Nutricional Pediátrica com Dra. Laís");
                      }
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      novoTipo === "consulta"
                        ? "bg-[#2A546D] text-white border-[#2A546D] shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Video className="h-3.5 w-3.5" /> Consulta Oficial
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNovoTipo("meta");
                      if (!novoTitulo || novoTitulo.startsWith("Consulta")) {
                        setNovoTitulo("Oferecer novo vegetal no prato de apoio");
                      }
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      novoTipo === "meta"
                        ? "bg-[#EB6D57] text-white border-[#EB6D57] shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Target className="h-3.5 w-3.5" /> Meta ou Lembrete
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Título / Descrição
                </label>
                <input
                  type="text"
                  required
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  placeholder="Ex: Consulta com Dra. Laís"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2A546D]"
                />
              </div>

              {novoTipo === "consulta" ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Data da Consulta
                    </label>
                    <input
                      type="date"
                      required
                      value={novaData}
                      onChange={(e) => {
                        setNovaData(e.target.value);
                        if (erroData) setErroData("");
                      }}
                      className="w-full h-10 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2A546D] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                      Horários da Agenda da Dra. Laís Leles
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {slotsDraLais.map((slot) => {
                        const ocupado = isHorarioOcupado(novaData, slot);
                        const ehCiclo4Semanas = temConsultaAgendadaOuRealizada && novaData < dataMinimaRetornoISO;
                        const selecionado = novoHorario === slot && !ocupado;

                        return (
                          <button
                            key={slot}
                            type="button"
                            disabled={ocupado}
                            onClick={() => {
                              setNovoHorario(slot);
                              if (erroData) setErroData("");
                            }}
                            className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all relative ${
                              ocupado
                                ? "bg-slate-100 text-slate-400 border-slate-200 line-through cursor-not-allowed opacity-60"
                                : selecionado
                                ? "bg-[#2A546D] text-white border-[#2A546D] shadow-xs ring-2 ring-[#2A546D]/30 cursor-pointer"
                                : "bg-white text-slate-700 border-slate-200 hover:border-[#2A546D] hover:bg-slate-50 cursor-pointer"
                            }`}
                          >
                            <div>{slot}</div>
                            {ocupado && (
                              <span className="text-[7.5px] font-black uppercase text-slate-500 block no-underline leading-tight mt-0.5">
                                {ehCiclo4Semanas ? "Ciclo 4 Semanas" : "Ocupado"}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {novaData < (temConsultaAgendadaOuRealizada ? dataMinimaRetornoISO : dataMinimaConsultaISO) && (
                      <p className="text-[11px] text-slate-500 font-medium mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        {temConsultaAgendadaOuRealizada ? (
                          <>
                            Horários bloqueados nesta data. Pelo ciclo clínico de 4 semanas, seu próximo retorno mensal estará disponível a partir de <strong>{dataMinimaRetornoBR}</strong>.
                          </>
                        ) : (
                          <>
                            Horários preenchidos nesta data. Próximos horários livres na agenda a partir de <strong>{dataMinimaConsultaBR}</strong>.
                          </>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Data (Hoje ou Futura)
                    </label>
                    <input
                      type="date"
                      required
                      min={hoje}
                      value={novaData}
                      onChange={(e) => {
                        setNovaData(e.target.value);
                        if (erroData) setErroData("");
                      }}
                      className="w-full h-10 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2A546D] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Horário
                    </label>
                    <input
                      type="time"
                      required
                      value={novoHorario}
                      onChange={(e) => setNovoHorario(e.target.value)}
                      className="w-full h-10 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2A546D] cursor-pointer"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-[#2A546D] hover:bg-[#204054] text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Check className="h-4 w-4" />
                <span>Confirmar Agendamento</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE SUCESSO DO ONBOARDING (CONSULTA AGENDADA) */}
      {modalSucessoOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center space-y-5 shadow-2xl border border-slate-100">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="h-9 w-9 stroke-[2.5]" />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-extrabold uppercase text-emerald-600 tracking-wider">
                Onboarding Concluído! 🎉
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                1ª Consulta Agendada com Sucesso!
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Seu agendamento foi confirmado e seu acesso a todos os módulos, videoaulas e ferramentas do Nutrindo em Casa está <strong>100% liberado</strong>!
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setModalSucessoOnboarding(false);
                router.push("/dashboard");
              }}
              className="w-full py-3.5 px-4 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Acessar o Painel Completo do Dashboard →</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE CHECK-IN DE 4 SEMANAS (PAIS ATUALIZANDO A NUTRI) */}
      <ModalCheckin4Semanas
        aberto={modalCheckinAberto}
        onClose={() => setModalCheckinAberto(false)}
        onSucesso={() => {
          setToastMensagem("Check-in de 4 semanas enviado com sucesso para a Dra. Laís! Ela analisará suas respostas antes da sua consulta. 📝");
          setTimeout(() => setToastMensagem(""), 4500);
        }}
      />

    </div>
  );
}

export default function PaginaCalendario() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500">
          Carregando calendário de acompanhamento...
        </div>
      }
    >
      <ConteudoCalendario />
    </Suspense>
  );
}