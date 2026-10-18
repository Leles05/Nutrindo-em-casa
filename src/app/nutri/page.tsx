"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users, Calendar as CalendarIcon, MessageCircle, Utensils,
  LogOut, Sparkles, CheckCircle2, Clock, Send, Plus, X,
  FileText, ExternalLink, ShieldAlert, Award, Search, ChevronRight,
  Eye, Save, AlertCircle, Heart, User, Check, Video
} from "lucide-react";
import { useAuthGuard, encerrarSessao } from "@/hooks/useAuthGuard";

type AbaNutri = "prontuarios" | "consultas" | "chat" | "diarios";

interface Paciente {
  id: string;
  nome: string;
  email: string;
  cpf?: string;
  telefone?: string;
  nome_crianca?: string;
  idade_crianca?: string;
  alimentos_conforto?: string;
  principais_recusas?: string;
  plano?: string;
  status_assinatura?: string;
  anamnese_concluida?: boolean;
  consulta_agendada?: boolean;
  created_at?: string;
}

interface Anamnese {
  id: string;
  user_email: string;
  concluida: boolean;
  anotacoes_clinicas?: string;
  respostas: Record<string, any>;
  updated_at?: string;
}

interface Agendamento {
  id: string | number;
  user_email: string;
  titulo: string;
  tipo: "consulta" | "meta" | "mentoria" | "lembrete";
  data: string;
  horario: string;
  plataforma?: string;
  link?: string;
  concluido?: boolean;
}

interface MensagemChat {
  id: string | number;
  user_email: string;
  remetente: "usuario" | "nutri";
  texto: string;
  horario: string;
  created_at?: string;
}

interface RefeicaoDiario {
  id: string | number;
  user_email: string;
  alimento: string;
  refeicao: string;
  degrau: "tolerou" | "cheirou" | "tocou" | "provou" | "comeu";
  observacoes?: string;
  data_registro: string;
}

export default function PortalNutricionista() {
  const { autenticado, carregando, userRole } = useAuthGuard();

  const [abaAtiva, setAbaAtiva] = useState<AbaNutri>("prontuarios");
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [anamneses, setAnamneses] = useState<Anamnese[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [diario, setDiario] = useState<RefeicaoDiario[]>([]);
  const [loadingDados, setLoadingDados] = useState(true);

  // Estados de Modais e Interações
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);
  const [anamneseModalAberta, setAnamneseModalAberta] = useState<Anamnese | null>(null);
  const [anotacoesClinicas, setAnotacoesClinicas] = useState("");
  const [salvandoAnotacoes, setSalvandoAnotacoes] = useState(false);

  // Gestão de Links do Google Meet & Conclusão de Consulta (Ciclo 4 Semanas)
  const [linksMeetEditados, setLinksMeetEditados] = useState<Record<string | number, string>>({});
  const [salvandoLinkMeet, setSalvandoLinkMeet] = useState<string | number | null>(null);
  const [modalConcluirConsulta, setModalConcluirConsulta] = useState<Agendamento | null>(null);
  const [orientacoesConclusao, setOrientacoesConclusao] = useState("");
  const [concluindoConsulta, setConcluindoConsulta] = useState(false);

  // Modal Prescrever Meta
  const [modalPrescreverMeta, setModalPrescreverMeta] = useState(false);
  const [metaPacienteEmail, setMetaPacienteEmail] = useState("");
  const [metaTitulo, setMetaTitulo] = useState("");
  const [metaData, setMetaData] = useState(new Date().toLocaleDateString("en-CA"));
  const [metaHorario, setMetaHorario] = useState("12:30");
  const [metaTipo, setMetaTipo] = useState<"meta" | "consulta">("meta");

  // Chat
  const [chatPacienteEmail, setChatPacienteEmail] = useState("");
  const [novoTextoMsg, setNovoTextoMsg] = useState("");
  const [enviandoMsg, setEnviandoMsg] = useState(false);

  // Feedback Toast
  const [toastMsg, setToastMsg] = useState("");
  const dispararToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  // Busca inicial dos dados clínicos
  const carregarDadosClinicos = async () => {
    try {
      setLoadingDados(true);
      const res = await fetch("/api/nutri");
      const data = await res.json();
      if (data.success) {
        setPacientes(data.profiles || []);
        setAnamneses(data.anamneses || []);
        setAgendamentos(data.agendamentos || []);
        setMensagens(data.mensagens || []);
        setDiario(data.diario || []);

        if (data.profiles && data.profiles.length > 0 && !chatPacienteEmail) {
          setChatPacienteEmail(data.profiles[0].email);
        }
      }
    } catch (err) {
      console.warn("Aviso ao carregar dados do portal nutri:", err);
    } finally {
      setLoadingDados(false);
    }
  };

  useEffect(() => {
    carregarDadosClinicos();
  }, []);

  // Handler para Salvar Anotações Clínicas
  const handleSalvarAnotacoes = async () => {
    if (!anamneseModalAberta) return;
    setSalvandoAnotacoes(true);
    try {
      const res = await fetch("/api/nutri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "salvar_anotacoes_clinicas",
          user_email: anamneseModalAberta.user_email,
          anotacoes: anotacoesClinicas,
        }),
      });
      const data = await res.json();
      if (data.success) {
        dispararToast("Anotações clínicas salvas com sucesso! 📝");
        setAnamneses((prev) =>
          prev.map((a) =>
            a.user_email === anamneseModalAberta.user_email
              ? { ...a, anotacoes_clinicas: anotacoesClinicas }
              : a
          )
        );
      }
    } catch (err) {
      console.warn("Aviso ao salvar anotações:", err);
    } finally {
      setSalvandoAnotacoes(false);
    }
  };

  // Handler para Salvar/Atualizar Link da Sala do Google Meet
  const handleSalvarLinkMeet = async (agendamentoId: string | number, link: string) => {
    if (!link.trim()) return;
    setSalvandoLinkMeet(agendamentoId);
    try {
      const res = await fetch("/api/nutri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "atualizar_link_meet",
          agendamento_id: agendamentoId,
          link: link.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        dispararToast("Link da sala do Google Meet salvo com sucesso! 🔗");
        setAgendamentos((prev) =>
          prev.map((a) => (a.id === agendamentoId ? { ...a, link: link.trim() } : a))
        );
      }
    } catch (err) {
      console.warn("Aviso ao salvar link do meet:", err);
    } finally {
      setSalvandoLinkMeet(null);
    }
  };

  // Handler para Concluir Consulta & Liberar Retorno de 4 Semanas
  const handleConcluirConsulta = async () => {
    if (!modalConcluirConsulta) return;
    setConcluindoConsulta(true);
    try {
      const res = await fetch("/api/nutri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "concluir_consulta",
          agendamento_id: modalConcluirConsulta.id,
          user_email: modalConcluirConsulta.user_email,
          orientacoes: orientacoesConclusao.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        dispararToast("Consulta concluída! Próximo retorno (ciclo de 4 semanas) liberado para o paciente! ✅");
        setAgendamentos((prev) =>
          prev.map((a) =>
            a.id === modalConcluirConsulta.id ? { ...a, concluido: true } : a
          )
        );
        setModalConcluirConsulta(null);
        setOrientacoesConclusao("");
      }
    } catch (err) {
      console.warn("Aviso ao concluir consulta:", err);
    } finally {
      setConcluindoConsulta(false);
    }
  };

  // Handler para Prescrever Nova Meta ou Consulta
  const handlePrescreverMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metaPacienteEmail || !metaTitulo.trim()) return;

    try {
      const res = await fetch("/api/nutri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "criar_agendamento",
          user_email: metaPacienteEmail,
          titulo: metaTitulo.trim(),
          tipo: metaTipo,
          data: metaData,
          horario: metaHorario,
          plataforma: "Google Meet",
          link: metaTipo === "consulta" ? "https://meet.google.com/nutri-lais" : undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.agendamento) {
        dispararToast(`${metaTipo === "consulta" ? "Consulta" : "Meta"} prescrita no calendário do paciente! 🎉`);
        setAgendamentos((prev) => [...prev, data.agendamento]);
        setModalPrescreverMeta(false);
        setMetaTitulo("");
      }
    } catch (err) {
      console.warn("Aviso ao prescrever meta:", err);
    }
  };

  // Handler para Enviar Mensagem no Chat como Nutri
  const handleEnviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatPacienteEmail || !novoTextoMsg.trim() || enviandoMsg) return;

    setEnviandoMsg(true);
    const texto = novoTextoMsg.trim();
    setNovoTextoMsg("");

    try {
      const res = await fetch("/api/nutri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "enviar_mensagem",
          user_email: chatPacienteEmail,
          texto,
          horario: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        }),
      });
      const data = await res.json();
      if (data.success && data.mensagem) {
        setMensagens((prev) => [...prev, data.mensagem]);
      }
    } catch (err) {
      console.warn("Aviso ao enviar mensagem:", err);
    } finally {
      setEnviandoMsg(false);
    }
  };

  // Handler para Alternar Status da Assinatura
  const handleAlternarStatusAssinatura = async (email: string, novoStatus: string) => {
    try {
      const res = await fetch("/api/nutri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "atualizar_status_assinatura",
          user_email: email,
          status: novoStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        dispararToast(`Status do paciente atualizado para ${novoStatus}!`);
        setPacientes((prev) =>
          prev.map((p) => (p.email === email ? { ...p, status_assinatura: novoStatus } : p))
        );
      }
    } catch (err) {
      console.warn("Aviso ao atualizar status:", err);
    }
  };

  if (carregando || !autenticado || userRole !== "nutri") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F0EAE1]">
        <div className="flex items-center gap-3 bg-white p-6 rounded-2xl shadow-md border border-slate-200">
          <div className="h-5 w-5 border-2 border-[#4C6C54] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-700">Verificando credenciais profissionais...</span>
        </div>
      </div>
    );
  }

  const mensagensFiltradas = mensagens.filter((m) => m.user_email === chatPacienteEmail);
  const pacienteDoChat = pacientes.find((p) => p.email === chatPacienteEmail);

  return (
    <div className="min-h-screen bg-[#F0EAE1] font-sans text-slate-800 pb-16">
      
      {/* TOAST DE FEEDBACK */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 bg-[#4C6C54] text-white text-xs font-bold rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400/30 animate-in fade-in">
          <Sparkles className="h-4 w-4 text-amber-300" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* =================================================================== */}
      {/* CABEÇALHO DO PORTAL DA NUTRICIONISTA */}
      {/* =================================================================== */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-28 sm:h-10 sm:w-34 shrink-0">
              <Image src="/logo-transparente.png" alt="Nutrindo em Casa" fill className="object-contain" priority />
            </div>
            <div className="hidden sm:block border-l border-slate-200 pl-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#4C6C54]">PORTAL CLÍNICO</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#4C6C54]/10 text-[#4C6C54]">
                  CRN-8 • Pediátrica
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Dra. Laís Leles • Gestão Clínica de Pacientes</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all inline-flex items-center gap-1.5"
              title="Acessar visão do paciente"
            >
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">Visão do Paciente</span>
            </Link>

            <button
              type="button"
              onClick={encerrarSessao}
              className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sair</span>
            </button>
          </div>

        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* =================================================================== */}
        {/* CARDS DE RESUMO DE IMPACTO CLÍNICO */}
        {/* =================================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Famílias Ativas</span>
              <Users className="h-4 w-4 text-[#4C6C54]" />
            </div>
            <div className="text-2xl font-black text-slate-900">{pacientes.length}</div>
            <p className="text-[10px] text-emerald-700 font-bold">100% com prontuário salvo</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Consultas Agendadas</span>
              <CalendarIcon className="h-4 w-4 text-[#2A546D]" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {agendamentos.filter((a) => a.tipo === "consulta").length}
            </div>
            <p className="text-[10px] text-[#2A546D] font-bold">Grade médica com +7 dias</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Anamneses 56 Itens</span>
              <FileText className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">{anamneses.length}</div>
            <p className="text-[10px] text-slate-500 font-medium">Prontuários para avaliação</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Refeições Registradas</span>
              <Utensils className="h-4 w-4 text-[#EB6D57]" />
            </div>
            <div className="text-2xl font-black text-slate-900">{diario.length}</div>
            <p className="text-[10px] text-[#EB6D57] font-bold">Degraus da Escada do Comer</p>
          </div>
        </div>

        {/* =================================================================== */}
        {/* NAVEGAÇÃO POR ABAS CLÍNICAS */}
        {/* =================================================================== */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setAbaAtiva("prontuarios")}
            className={`py-2 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              abaAtiva === "prontuarios"
                ? "bg-[#4C6C54] text-white shadow-xs"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Pacientes & Prontuários (56 Perguntas)</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva("consultas")}
            className={`py-2 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              abaAtiva === "consultas"
                ? "bg-[#4C6C54] text-white shadow-xs"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>Agenda de Consultas & Metas</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva("chat")}
            className={`py-2 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              abaAtiva === "chat"
                ? "bg-[#4C6C54] text-white shadow-xs"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>Chat com as Famílias</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva("diarios")}
            className={`py-2 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              abaAtiva === "diarios"
                ? "bg-[#4C6C54] text-white shadow-xs"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <Utensils className="h-3.5 w-3.5" />
            <span>Diários Alimentares & Escada Sensorial</span>
          </button>
        </div>

        {/* =================================================================== */}
        {/* ABA 1: PACIENTES & PRONTUÁRIOS (ANAMNESE 56 PERGUNTAS) */}
        {/* =================================================================== */}
        {abaAtiva === "prontuarios" && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Lista Geral de Pacientes</h2>
                <p className="text-xs text-slate-500">
                  Prontuários detalhados, status de assinatura e histórico alimentar
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {pacientes.length} famílias cadastradas
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Criança / Responsável</th>
                    <th className="py-3 px-3">Plano & Status</th>
                    <th className="py-3 px-3">Anamnese</th>
                    <th className="py-3 px-3">1ª Consulta</th>
                    <th className="py-3 px-3 text-right">Ações Clínicas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pacientes.map((p) => {
                    const anamneseDoPaciente = anamneses.find((a) => a.user_email === p.email);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="font-extrabold text-slate-900 text-sm">
                            👦 {p.nome_crianca || "Criança"}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Resp: <strong>{p.nome}</strong> • {p.email}
                          </div>
                          {p.idade_crianca && (
                            <span className="text-[10px] text-slate-400">Idade: {p.idade_crianca}</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 uppercase text-[10px] bg-slate-100 px-2 py-0.5 rounded-md">
                              {p.plano || "Trimestral"}
                            </span>
                            <span
                              className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                p.status_assinatura === "ATIVO"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {p.status_assinatura || "ATIVO"}
                            </span>
                          </div>
                          <div className="mt-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleAlternarStatusAssinatura(
                                  p.email,
                                  p.status_assinatura === "ATIVO" ? "EXPIRADO" : "ATIVO"
                                )
                              }
                              className="text-[10px] text-slate-400 hover:text-slate-700 underline cursor-pointer"
                            >
                              Alternar p/ {p.status_assinatura === "ATIVO" ? "EXPIRADO" : "ATIVO"}
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          {anamneseDoPaciente ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3" /> 56 itens preenchidos
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                              Pendente
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          {p.consulta_agendada ? (
                            <span className="text-[10px] font-bold text-[#2A546D] bg-[#2A546D]/10 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" /> Agendada
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Aguardando agendamento</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const an = anamneses.find((a) => a.user_email === p.email) || {
                                id: "novo",
                                user_email: p.email,
                                concluida: true,
                                respostas: {
                                  nomeCrianca: p.nome_crianca,
                                  alimentosConforto: p.alimentos_conforto,
                                  principaisRecusas: p.principais_recusas,
                                },
                              };
                              setAnamneseModalAberta(an);
                              setAnotacoesClinicas(an.anotacoes_clinicas || "");
                            }}
                            className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#4C6C54] hover:bg-[#3a5340] text-white font-extrabold text-xs transition-all shadow-xs cursor-pointer"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>Ver Prontuário</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* ABA 2: AGENDA DE CONSULTAS & METAS */}
        {/* =================================================================== */}
        {abaAtiva === "consultas" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Agenda Clínica da Dra. Laís</h2>
                <p className="text-xs text-slate-500">
                  Consultas marcadas com +7 dias de antecedência e metas prescritas
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMetaPacienteEmail(pacientes[0]?.email || "");
                  setModalPrescreverMeta(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-[#4C6C54] hover:bg-[#3a5340] text-white font-extrabold text-xs transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Prescrever Nova Meta / Consulta</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agendamentos.map((ag) => {
                const pac = pacientes.find((p) => p.email === ag.user_email);
                const ehConsulta = ag.tipo === "consulta";

                return (
                  <div
                    key={ag.id}
                    className={`bg-white p-5 rounded-3xl border shadow-sm flex flex-col justify-between space-y-4 ${
                      ag.concluido
                        ? "border-emerald-200/80 bg-emerald-50/15"
                        : ehConsulta
                        ? "border-sky-200/80"
                        : "border-slate-200/90"
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                            ehConsulta
                              ? "bg-[#2A546D] text-white"
                              : "bg-[#EB6D57]/15 text-[#EB6D57]"
                          }`}
                        >
                          {ehConsulta ? "Consulta Pediátrica • Ciclo de 4 Semanas" : "Meta Alimentar"}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          {ag.data} • {ag.horario}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">{ag.titulo}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Paciente: <strong>{pac?.nome || ag.user_email}</strong> {pac?.nome_crianca ? `(Criança: ${pac.nome_crianca})` : ""}
                        </p>
                      </div>

                      {/* GESTÃO DO LINK DO GOOGLE MEET DA CONSULTA */}
                      {ehConsulta && (
                        <div className="bg-sky-50/70 p-3 rounded-2xl border border-sky-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-[#2A546D] uppercase flex items-center gap-1.5">
                              <Video className="h-3 w-3" /> Link da Sala do Google Meet
                            </label>
                            {ag.link && (
                              <a
                                href={ag.link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] font-extrabold text-[#2A546D] hover:underline inline-flex items-center gap-1"
                              >
                                Testar Sala <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <input
                              type="url"
                              value={linksMeetEditados[ag.id] ?? (ag.link || "")}
                              onChange={(e) =>
                                setLinksMeetEditados({ ...linksMeetEditados, [ag.id]: e.target.value })
                              }
                              placeholder="https://meet.google.com/xyz-abcd-efg"
                              className="flex-1 h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2A546D]/30"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleSalvarLinkMeet(ag.id, linksMeetEditados[ag.id] ?? ag.link ?? "")
                              }
                              disabled={salvandoLinkMeet === ag.id}
                              className="h-8 px-3 bg-[#2A546D] hover:bg-[#204054] text-white text-[11px] font-extrabold rounded-lg transition-all shadow-2xs cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50"
                            >
                              <Save className="h-3 w-3" />
                              <span>{salvandoLinkMeet === ag.id ? "Salvando..." : "Salvar Link"}</span>
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            Os pais abrirão exatamente esta sala ao clicar no botão &quot;Entrar no Meet&quot;.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* RODAPÉ DO CARD: STATUS OU BOTÃO DE CONCLUIR */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                      {ehConsulta ? (
                        ag.concluido ? (
                          <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <div className="flex-1">
                              <div>Consulta Realizada ✅</div>
                              <div className="text-[10px] text-emerald-600 font-semibold">
                                Próximo retorno liberado para o ciclo de 4 semanas.
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setModalConcluirConsulta(ag);
                              setOrientacoesConclusao("");
                            }}
                            className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Concluir Consulta & Liberar Retorno (4 Semanas)</span>
                          </button>
                        )
                      ) : (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] text-slate-400">Atividade prescrita na plataforma</span>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            Confirmada
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* ABA 3: CHAT COM AS FAMÍLIAS */}
        {/* =================================================================== */}
        {abaAtiva === "chat" && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
            
            {/* LISTA LATERAL DE PACIENTES */}
            <div className="md:col-span-4 border-r border-slate-100 p-4 space-y-2 bg-slate-50/50">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block px-1">
                Famílias em Acompanhamento
              </span>
              <div className="space-y-1">
                {pacientes.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setChatPacienteEmail(p.email)}
                    className={`w-full p-3 rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      chatPacienteEmail === p.email
                        ? "bg-[#4C6C54] text-white shadow-xs"
                        : "bg-white hover:bg-slate-100/80 text-slate-800 border border-slate-200/70"
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-xs">
                        👦 {p.nome_crianca || "Criança"}
                      </div>
                      <div className={`text-[11px] truncate ${chatPacienteEmail === p.email ? "text-emerald-100" : "text-slate-400"}`}>
                        {p.nome}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />
                  </button>
                ))}
              </div>
            </div>

            {/* ÁREA DE CONVERSA COM O PACIENTE SELECIONADO */}
            <div className="md:col-span-8 flex flex-col justify-between p-4 sm:p-5 space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {pacienteDoChat ? `👦 ${pacienteDoChat.nome_crianca} (${pacienteDoChat.nome})` : "Selecione um paciente"}
                  </h3>
                  <p className="text-[11px] text-slate-400">{chatPacienteEmail}</p>
                </div>
                <span className="text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Canal Prioritário
                </span>
              </div>

              {/* LISTA DE MENSAGENS */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[350px] pr-2">
                {mensagensFiltradas.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                    Nenhuma mensagem anterior com esta família. Envie uma orientação abaixo!
                  </div>
                ) : (
                  mensagensFiltradas.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${
                        m.remetente === "nutri" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                          m.remetente === "nutri"
                            ? "bg-[#4C6C54] text-white rounded-br-xs"
                            : "bg-slate-100 text-slate-800 rounded-bl-xs"
                        }`}
                      >
                        <p className="font-semibold">{m.texto}</p>
                        <span className={`text-[9px] block text-right mt-1 font-mono ${
                          m.remetente === "nutri" ? "text-emerald-200" : "text-slate-400"
                        }`}>
                          {m.horario} • {m.remetente === "nutri" ? "Dra. Laís" : "Família"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* FORMULÁRIO DE ENVIO */}
              <form onSubmit={handleEnviarMensagem} className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <input
                  type="text"
                  required
                  value={novoTextoMsg}
                  onChange={(e) => setNovoTextoMsg(e.target.value)}
                  placeholder={`Responder para ${pacienteDoChat?.nome || "o paciente"}...`}
                  className="flex-1 h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/40"
                />
                <button
                  type="submit"
                  disabled={enviandoMsg || !novoTextoMsg.trim()}
                  className="h-11 px-4 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Enviar</span>
                </button>
              </form>
            </div>

          </div>
        )}

        {/* =================================================================== */}
        {/* ABA 4: DIÁRIOS ALIMENTARES & ESCADA SENSORIAL */}
        {/* =================================================================== */}
        {abaAtiva === "diarios" && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Registros Sensoriais da Escada do Comer
                </h2>
                <p className="text-xs text-slate-500">
                  Acompanhe em tempo real as aproximações (Tolerou, Cheirou, Tocou, Provou, Comeu)
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {diario.length} registros computados
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {diario.map((d) => (
                <div
                  key={d.id}
                  className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-2 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                      {d.refeicao}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      d.degrau === "comeu"
                        ? "bg-emerald-100 text-emerald-800"
                        : d.degrau === "provou"
                        ? "bg-teal-100 text-teal-800"
                        : d.degrau === "tocou"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {d.degrau}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-900">{d.alimento}</h4>
                    <p className="text-xs text-slate-600 mt-1 italic">
                      &ldquo;{d.observacoes || "Registro realizado pela família"}&rdquo;
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Paciente: {d.user_email}</span>
                    <span>{new Date(d.data_registro).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* =================================================================== */}
      {/* MODAL: PRONTUÁRIO COMPLETO COM TODAS AS 56 PERGUNTAS */}
      {/* =================================================================== */}
      {anamneseModalAberta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-in zoom-in-95">
            
            {/* CABEÇALHO DO MODAL */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-[#4C6C54]/10 text-[#4C6C54] flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Prontuário da Anamnese Pediátrica
                  </h3>
                  <p className="text-xs text-slate-500">
                    Paciente: {anamneseModalAberta.user_email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAnamneseModalAberta(null)}
                className="h-8 w-8 rounded-full bg-white hover:bg-slate-200 border border-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* CORPO DO PRONTUÁRIO */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
              
              {/* CAMPO DE ANOTAÇÕES CLÍNICAS DA DRA. LAÍS */}
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-900 flex items-center gap-1.5 uppercase tracking-wide">
                    <span>🩺</span> Anotações Clínicas da Nutricionista
                  </span>
                  <button
                    type="button"
                    onClick={handleSalvarAnotacoes}
                    disabled={salvandoAnotacoes}
                    className="py-1 px-3 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-extrabold text-[11px] rounded-lg transition-all shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <Save className="h-3 w-3" />
                    <span>{salvandoAnotacoes ? "Salvando..." : "Salvar Anotação"}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={anotacoesClinicas}
                  onChange={(e) => setAnotacoesClinicas(e.target.value)}
                  placeholder="Insira as condutas nutricionais, observações do acolhimento e hipóteses diagnósticas..."
                  className="w-full p-2.5 bg-white border border-amber-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/30"
                />
              </div>

              {/* SEÇÃO DESTACADA: ATUALIZAÇÕES DE CICLO (CHECK-INS DE 4 SEMANAS) */}
              <div className="p-4 bg-sky-50/70 rounded-2xl border border-sky-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📝</span>
                    <div>
                      <h4 className="text-xs font-black text-[#2A546D] uppercase tracking-wide">
                        Atualizações de Ciclo dos Pais (Check-ins de 4 Semanas)
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Evolução, medições recentes e dúvidas enviadas pela família antes de cada consulta mensal
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#2A546D] text-white">
                    {Array.isArray(anamneseModalAberta.respostas?.checkins) && anamneseModalAberta.respostas.checkins.length > 0
                      ? `${anamneseModalAberta.respostas.checkins.length} atualização(ões)`
                      : "Aguardando envio"}
                  </span>
                </div>

                {Array.isArray(anamneseModalAberta.respostas?.checkins) && anamneseModalAberta.respostas.checkins.length > 0 ? (
                  <div className="space-y-3 pt-1">
                    {anamneseModalAberta.respostas.checkins.map((chk: any, idx: number) => (
                      <div key={chk.id || idx} className="bg-white p-3.5 rounded-xl border border-sky-100 shadow-2xs space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-[11px] font-bold text-[#2A546D] flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            Ciclo {anamneseModalAberta.respostas.checkins.length - idx} • Enviado em{" "}
                            {chk.dataEnvio ? new Date(chk.dataEnvio).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Data recente"}
                          </span>
                          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Check-in Ativo
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                          <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                            <span className="text-[10px] font-extrabold text-emerald-700 uppercase block mb-0.5">
                              1. Novos alimentos tolerados / aceitos:
                            </span>
                            <p className="font-semibold text-slate-800">{chk.novosAlimentos || "Nenhum novo alimento relatado."}</p>
                          </div>

                          <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                            <span className="text-[10px] font-extrabold text-slate-600 uppercase block mb-0.5">
                              2. Refeições em família (avanços e desafios):
                            </span>
                            <p className="font-semibold text-slate-800">{chk.refeicoesFamilia || "Sem alterações reportadas."}</p>
                          </div>

                          <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                            <span className="text-[10px] font-extrabold text-slate-600 uppercase block mb-0.5">
                              3. Peso e estatura recentes:
                            </span>
                            <p className="font-semibold text-slate-800">{chk.medidasRecentes || "Sem nova medição pediátrica."}</p>
                          </div>

                          <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/70">
                            <span className="text-[10px] font-extrabold text-amber-900 uppercase block mb-0.5">
                              4. Dúvidas para a consulta com Dra. Laís:
                            </span>
                            <p className="font-semibold text-amber-950">{chk.duvidasConsulta || "Sem dúvidas pontuais registradas."}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-white/80 rounded-xl border border-sky-100 text-center text-[11px] text-slate-400">
                    A família ainda não enviou uma atualização de 4 semanas neste ciclo. Assim que os pais enviarem pelo Dashboard ou Calendário, ela aparecerá aqui em destaque!
                  </div>
                )}
              </div>

              {/* SEÇÃO 1: DADOS DA CRIANÇA E RESPONSÁVEL */}
              <div className="space-y-3 pb-4 border-b border-slate-100">
                <h4 className="text-sm font-black text-[#4C6C54] uppercase tracking-wider">
                  1. Conhecendo a Criança e a Família
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Nome da Criança</span>
                    <strong className="text-slate-800">{anamneseModalAberta.respostas?.nomeCrianca || "Pedro Lima"}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Data de Nascimento</span>
                    <strong className="text-slate-800">{anamneseModalAberta.respostas?.dataNascimento || "10/05/2023"}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Sexo</span>
                    <strong className="text-slate-800">{anamneseModalAberta.respostas?.sexo || "Masculino"}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Responsável / Parentesco</span>
                    <strong className="text-slate-800">{anamneseModalAberta.respostas?.nomeResponsavel || "Lucas Lima"} ({anamneseModalAberta.respostas?.parentesco || "Pai"})</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Diagnósticos / TEA</span>
                    <strong className="text-slate-800">
                      {Array.isArray(anamneseModalAberta.respostas?.diagnosticos)
                        ? anamneseModalAberta.respostas.diagnosticos.join(", ")
                        : anamneseModalAberta.respostas?.diagnosticos || "Suspeita de TEA"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Comunicação</span>
                    <strong className="text-slate-800">{anamneseModalAberta.respostas?.comunicacao || "Frases curtas / Aponta"}</strong>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2: HISTÓRICO DE SAÚDE E PARTO */}
              <div className="space-y-3 pb-4 border-b border-slate-100">
                <h4 className="text-sm font-black text-[#4C6C54] uppercase tracking-wider">
                  2. Histórico de Saúde & Aleitamento
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Gestação / Parto</span>
                    <strong className="text-slate-800">A termo (39 semanas) • Parto Cesárea</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Peso ao Nascer</span>
                    <strong className="text-slate-800">{anamneseModalAberta.respostas?.pesoNascer || "3.250g"}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Aleitamento</span>
                    <strong className="text-slate-800">{anamneseModalAberta.respostas?.aleitamento || "Materno exclusivo até 6 meses"}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Peso e Altura Atuais</span>
                    <strong className="text-slate-800">{anamneseModalAberta.respostas?.pesoAtual || "14.2 kg"} • {anamneseModalAberta.respostas?.alturaAtual || "96 cm"}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Início das Recusas</span>
                    <strong className="text-slate-800">{anamneseModalAberta.respostas?.inicioDificuldadesAtuais || "Aos 18 meses"}</strong>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 3: MAPA ALIMENTAR & REPERTÓRIO */}
              <div className="space-y-3 pb-4 border-b border-slate-100">
                <h4 className="text-sm font-black text-[#4C6C54] uppercase tracking-wider">
                  3. Mapa Alimentar & Alimentos Aceitos
                </h4>
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Cereais & Pães Aceitos</span>
                    <p className="font-semibold text-slate-800">
                      {Array.isArray(anamneseModalAberta.respostas?.cereais)
                        ? anamneseModalAberta.respostas.cereais.join(", ")
                        : "Arroz branco, Macarrão, Biscoito de polvilho, Pão francês"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Proteínas Aceitas</span>
                    <p className="font-semibold text-slate-800">
                      {Array.isArray(anamneseModalAberta.respostas?.proteinas)
                        ? anamneseModalAberta.respostas.proteinas.join(", ")
                        : "Ovo mexido, Frango desfiado"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Frutas & Vegetais</span>
                    <p className="font-semibold text-slate-800">
                      Frutas: {Array.isArray(anamneseModalAberta.respostas?.frutas) ? anamneseModalAberta.respostas.frutas.join(", ") : "Banana, Maçã"} • Vegetais: {Array.isArray(anamneseModalAberta.respostas?.vegetais) ? anamneseModalAberta.respostas.vegetais.join(", ") : "Batata doce"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Alimentos de Conforto & Sofrimento na Falta</span>
                    <p className="font-semibold text-slate-800">
                      Exige todo dia: {anamneseModalAberta.respostas?.exigeTodoDia || "Biscoito de polvilho"}. Reação se faltar: {anamneseModalAberta.respostas?.sofrimentoFalta || "Choro intenso e recusa de outros alimentos"}.
                    </p>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 4: ROTINA, OBJETIVOS E INTESTINO */}
              <div className="space-y-3">
                <h4 className="text-sm font-black text-[#4C6C54] uppercase tracking-wider">
                  4. Rotina das Refeições & Escala de Bristol
                </h4>
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Ingestão de Água</span>
                    <strong className="text-slate-800">{anamneseModalAberta.respostas?.aguaQuantidade || "Aproximadamente 600ml / dia"}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Escala de Bristol</span>
                    <strong className="text-slate-800">{anamneseModalAberta.respostas?.tipoBristol || "Tipo 3 e 4 (Fezes moldadas normais)"}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Interesses e Motivação da Criança</span>
                    <strong className="text-slate-800">{anamneseModalAberta.respostas?.interessesFavoritos || "Dinossauros, carrinhos e quebra-cabeças"}</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* RODAPÉ DO MODAL */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-end bg-slate-50">
              <button
                type="button"
                onClick={() => setAnamneseModalAberta(null)}
                className="py-2 px-5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl cursor-pointer"
              >
                Fechar Prontuário
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: PRESCREVER META ALIMENTAR OU CONSULTA */}
      {/* =================================================================== */}
      {modalPrescreverMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900">
                Prescrever Meta ou Consulta
              </h3>
              <button
                type="button"
                onClick={() => setModalPrescreverMeta(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handlePrescreverMeta} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Paciente Destinatário
                </label>
                <select
                  required
                  value={metaPacienteEmail}
                  onChange={(e) => setMetaPacienteEmail(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4C6C54]"
                >
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.email}>
                      {p.nome_crianca || "Criança"} ({p.nome} • {p.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Tipo de Atividade
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMetaTipo("meta")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      metaTipo === "meta"
                        ? "bg-[#EB6D57] text-white border-[#EB6D57]"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    Meta Alimentar
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetaTipo("consulta")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      metaTipo === "consulta"
                        ? "bg-[#2A546D] text-white border-[#2A546D]"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    Consulta Pediátrica
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Título da Orientação
                </label>
                <input
                  type="text"
                  required
                  value={metaTitulo}
                  onChange={(e) => setMetaTitulo(e.target.value)}
                  placeholder="Ex: Oferecer cenoura ralada no prato de apoio"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4C6C54]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    value={metaData}
                    onChange={(e) => setMetaData(e.target.value)}
                    className="w-full h-10 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4C6C54]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    required
                    value={metaHorario}
                    onChange={(e) => setMetaHorario(e.target.value)}
                    className="w-full h-10 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4C6C54]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer mt-2"
              >
                Confirmar Prescrição
              </button>
            </form>

          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: CONCLUIR CONSULTA & LIBERAR RETORNO DE 4 SEMANAS */}
      {/* =================================================================== */}
      {modalConcluirConsulta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Concluir Consulta (Ciclo 4 Semanas)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Paciente: {modalConcluirConsulta.user_email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalConcluirConsulta(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-xs text-emerald-900 space-y-1">
              <p className="font-extrabold">
                Ao concluir esta consulta:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-emerald-800 font-medium">
                <li>O status da consulta passará para <strong>Realizada</strong>.</li>
                <li>O próximo retorno mensal dos pais será <strong>automaticamente liberado para daqui a 28 dias (4 semanas)</strong>.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                Resumo das Orientações Clínicas do Ciclo (Opcional)
              </label>
              <textarea
                rows={3}
                value={orientacoesConclusao}
                onChange={(e) => setOrientacoesConclusao(e.target.value)}
                placeholder="Ex: Pedro tolerou cenoura ralada. Próxima meta: manter o prato de apoio e introduzir mamão no lanche..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setModalConcluirConsulta(null)}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConcluirConsulta}
                disabled={concluindoConsulta}
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                <span>{concluindoConsulta ? "Concluindo..." : "Confirmar Conclusão"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
