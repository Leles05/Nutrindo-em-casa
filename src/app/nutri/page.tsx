"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users, Calendar as CalendarIcon, MessageCircle, Utensils,
  LogOut, Sparkles, CheckCircle2, Clock, Send, Plus, X,
  FileText, ExternalLink, ShieldAlert, Award, Search, ChevronRight,
  Eye, Save, AlertCircle, Heart, User, Check, Video,
  Mail, UtensilsCrossed, Star, ChefHat, Trash2
} from "lucide-react";
import { useAuthGuard, encerrarSessao } from "@/hooks/useAuthGuard";
import GuidedTour, { abrirTour, type TourStep } from "@/components/GuidedTour";
import { Receita, RECEITAS_PADRAO, NOTA_ORIENTACAO_PADRAO } from "@/data/receitas";
import { DevolutivaSemanal, DEVOLUTIVA_PADRAO } from "@/data/devolutivas";
import { abrirGoogleCalendar } from "@/lib/googleCalendar";
import { concatenarTexto, mesclarListas, type ProtocoloClinico } from "@/data/sugestoesClinicas";
import BancoRespostasRapidas, { BotaoSalvarRespostaRapida } from "@/components/nutri/BancoRespostasRapidas";
import AssistentePreAnalise from "@/components/nutri/AssistentePreAnalise";
import ProntuarioAnamnese56 from "@/components/nutri/ProntuarioAnamnese56";

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
  foto?: string;
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
  const [devolutivasSalvas, setDevolutivasSalvas] = useState<any[]>([]);
  const [prescricoesSalvas, setPrescricoesSalvas] = useState<any[]>([]);
  const [loadingDados, setLoadingDados] = useState(true);

  // Estados de Modais e Interações
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);
  const [anamneseModalAberta, setAnamneseModalAberta] = useState<Anamnese | null>(null);
  const [anotacoesClinicas, setAnotacoesClinicas] = useState("");
  const [salvandoAnotacoes, setSalvandoAnotacoes] = useState(false);
  const [fotoZoomNutri, setFotoZoomNutri] = useState<{ foto: string; alimento: string; email: string } | null>(null);

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

  // ===================================================================
  // MODAL 1: ENVIAR DEVOLUTIVA SEMANAL
  // ===================================================================
  const [modalDevolutivaAberta, setModalDevolutivaAberta] = useState(false);
  const [devolutivaPacienteEmail, setDevolutivaPacienteEmail] = useState("");
  const [devolutivaTitulo, setDevolutivaTitulo] = useState("Semana 1 • Orientações & Metas Clínicas");
  const [devolutivaParecer, setDevolutivaParecer] = useState("");
  const [devolutivaAlimentos, setDevolutivaAlimentos] = useState("");
  const [devolutivaMetas, setDevolutivaMetas] = useState<string[]>([
    "Montar o prato seguro com o alimento de conforto sempre presente",
    "Introduzir pratinho de apoio branco ao lado da refeição principal",
  ]);

  const handleSalvarDevolutiva = (e: React.FormEvent) => {
    e.preventDefault();
    const emailLimpo = (devolutivaPacienteEmail || pacientes[0]?.email || "").trim().toLowerCase();
    if (!emailLimpo) {
      dispararToast("Selecione um paciente para enviar a devolutiva.");
      return;
    }
    
    const novaDevolutiva: DevolutivaSemanal = {
      id: `dev-${Date.now()}`,
      user_email: emailLimpo,
      data: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
      titulo: devolutivaTitulo.trim() || "Devolutiva Semanal de Acompanhamento",
      parecerClinico: devolutivaParecer.trim(),
      alimentosAlvo: devolutivaAlimentos
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      metas: devolutivaMetas
        .filter((m) => m.trim().length > 0)
        .map((m, idx) => ({
          id: `meta-${Date.now()}-${idx}`,
          texto: m.trim(),
          concluida: false,
        })),
    };

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("nutrindo_ultima_devolutiva", JSON.stringify(novaDevolutiva));
        const chaveHistorico = `nutrindo_devolutivas_${emailLimpo}`;
        const historicoAtual = localStorage.getItem(chaveHistorico);
        const listaHistorico: DevolutivaSemanal[] = historicoAtual ? JSON.parse(historicoAtual) : [];
        const novaLista = [novaDevolutiva, ...listaHistorico.filter((d) => d.id !== novaDevolutiva.id)];
        localStorage.setItem(chaveHistorico, JSON.stringify(novaLista));
        localStorage.setItem("nutrindo_devolutivas", JSON.stringify(novaLista));

        // Dispara sincronização em tempo real
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("nutrindo_devolutiva_atualizada", { detail: novaDevolutiva }));
      } catch (err) {
        console.warn("Aviso ao salvar devolutiva no localStorage:", err);
      }
    }

    // Persistência em nuvem no Supabase PostgreSQL
    fetch("/api/nutri", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "enviar_devolutiva",
        user_email: emailLimpo,
        semana_ref: novaDevolutiva.titulo,
        parecer_clinico: novaDevolutiva.parecerClinico,
        alimentos_alvo: novaDevolutiva.alimentosAlvo,
        metas_semana: novaDevolutiva.metas,
        profissional: "Dra. Laís Leles • CRN-8 18878",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.devolutiva) {
          setDevolutivasSalvas((prev) => [data.devolutiva, ...prev]);
        }
      })
      .catch((err) => console.warn("Aviso ao persistir devolutiva no Supabase:", err));

    dispararToast("Devolutiva Semanal enviada com sucesso para a família! 💌");
    setModalDevolutivaAberta(false);
  };

  // ===================================================================
  // MODAL 2: PRESCREVER PLANO ALIMENTAR & RECEITAS RECOMENDADAS
  // ===================================================================
  const [modalPlanoReceitasAberto, setModalPlanoReceitasAberto] = useState(false);
  const [planoPacienteEmail, setPlanoPacienteEmail] = useState("");
  const [planoNotaOrientacao, setPlanoNotaOrientacao] = useState(NOTA_ORIENTACAO_PADRAO);
  const [receitasRecomendadasIds, setReceitasRecomendadasIds] = useState<string[]>([
    "bolinho-crocante-brocolis-queijo",
    "panqueca-aveia-banana",
    "chips-cenoura-batata-doce",
    "nuggets-caseiros-frango-milho",
  ]);

  const abrirModalPlanoReceitas = (email: string) => {
    const emailLimpo = (email || pacientes[0]?.email || "").trim().toLowerCase();
    setPlanoPacienteEmail(emailLimpo);

    if (typeof window !== "undefined") {
      try {
        const recSalvas = localStorage.getItem(`nutrindo_receitas_recomendadas_${emailLimpo}`) || localStorage.getItem("nutrindo_receitas_recomendadas");
        if (recSalvas) {
          setReceitasRecomendadasIds(JSON.parse(recSalvas));
        }
        const notaSalva = localStorage.getItem(`nutrindo_nota_plano_${emailLimpo}`) || localStorage.getItem("nutrindo_nota_plano");
        if (notaSalva) {
          setPlanoNotaOrientacao(notaSalva);
        } else {
          setPlanoNotaOrientacao(NOTA_ORIENTACAO_PADRAO);
        }
      } catch (err) {
        console.warn("Aviso ao carregar dados do plano/receitas:", err);
      }
    }

    // Complementa com dados salvos no Supabase se disponíveis
    const prescricaoExistente = prescricoesSalvas.find(
      (p) => p.user_email?.toLowerCase() === emailLimpo
    );
    if (prescricaoExistente) {
      if (
        Array.isArray(prescricaoExistente.receitas_recomendadas_ids) &&
        prescricaoExistente.receitas_recomendadas_ids.length > 0
      ) {
        setReceitasRecomendadasIds(prescricaoExistente.receitas_recomendadas_ids);
      }
      if (prescricaoExistente.orientacao_prato_seguro) {
        setPlanoNotaOrientacao(prescricaoExistente.orientacao_prato_seguro);
      }
    }

    setModalPlanoReceitasAberto(true);
  };

  const handleSalvarPlanoEReceitas = (e: React.FormEvent) => {
    e.preventDefault();
    const emailLimpo = (planoPacienteEmail || pacientes[0]?.email || "").trim().toLowerCase();
    if (!emailLimpo) {
      dispararToast("Selecione um paciente para prescrever o plano.");
      return;
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`nutrindo_receitas_recomendadas_${emailLimpo}`, JSON.stringify(receitasRecomendadasIds));
        localStorage.setItem("nutrindo_receitas_recomendadas", JSON.stringify(receitasRecomendadasIds));
        localStorage.setItem(`nutrindo_nota_plano_${emailLimpo}`, planoNotaOrientacao.trim());
        localStorage.setItem("nutrindo_nota_plano", planoNotaOrientacao.trim());

        // Dispara eventos para atualização instantânea na visão do paciente
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("nutrindo_receitas_atualizadas"));
        window.dispatchEvent(new CustomEvent("nutrindo_nota_plano_atualizada"));
      } catch (err) {
        console.warn("Aviso ao salvar plano e receitas no localStorage:", err);
      }
    }

    // Persistência em nuvem no Supabase PostgreSQL
    fetch("/api/nutri", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "salvar_prescricao_plano",
        user_email: emailLimpo,
        orientacao_prato_seguro: planoNotaOrientacao.trim(),
        composicao_prato: { conforto: 70, ponte: 20, desafio: 10 },
        receitas_recomendadas_ids: receitasRecomendadasIds,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.prescricao) {
          setPrescricoesSalvas((prev) => [
            data.prescricao,
            ...prev.filter((p) => p.user_email?.toLowerCase() !== emailLimpo),
          ]);
        }
      })
      .catch((err) => console.warn("Aviso ao persistir prescrição no Supabase:", err));

    dispararToast("Plano Alimentar & Receitas recomendadas salvas com sucesso! 🍲");
    setModalPlanoReceitasAberto(false);
  };

  // ===================================================================
  // BANCO DE RESPOSTAS CLÍNICAS & PRÉ-ANÁLISE (Etapa 4)
  // ===================================================================
  const aplicarProtocoloNoProntuario = (p: ProtocoloClinico) => {
    const bloco = [
      `[${p.tituloCurto}]`,
      p.parecerClinicoSugerido,
      p.orientacaoPratoSeguro ? `Prato Seguro: ${p.orientacaoPratoSeguro}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    setAnotacoesClinicas((prev) => concatenarTexto(prev, bloco));
    dispararToast("Protocolo aplicado nas anotações do prontuário. Revise e salve! 🩺");
  };

  const aplicarProtocoloNaDevolutiva = (p: ProtocoloClinico, substituir = false) => {
    if (p.parecerClinicoSugerido) {
      setDevolutivaParecer((prev) => (substituir ? p.parecerClinicoSugerido : concatenarTexto(prev, p.parecerClinicoSugerido)));
    }
    setDevolutivaAlimentos((prev) => {
      const atuais = substituir ? [] : prev.split(",").map((a) => a.trim());
      return mesclarListas(atuais, p.alimentosAlvoSugeridos).join(", ");
    });
    setDevolutivaMetas((prev) => {
      const mescladas = mesclarListas(substituir ? [] : prev, p.metasSemanaisSugeridas);
      return mescladas.length > 0 ? mescladas : [""];
    });
  };

  const gerarDevolutivaComProtocolo = (p: ProtocoloClinico) => {
    const email = anamneseModalAberta?.user_email || pacientes[0]?.email || "";
    setDevolutivaPacienteEmail(email);
    setDevolutivaTitulo(`Devolutiva Semanal • ${p.tituloCurto.replace(/^\S+\s+/, "")}`);
    aplicarProtocoloNaDevolutiva(p, true);
    setAnamneseModalAberta(null);
    setModalDevolutivaAberta(true);
    dispararToast("Devolutiva pré-preenchida com base na pré-análise ✨");
  };

  const copiarParaAnotacoes = (texto: string) => {
    setAnotacoesClinicas((prev) => concatenarTexto(prev, texto));
    dispararToast("Conduta copiada para as Anotações Clínicas! 🩺");
  };

  const abrirRascunhoNaDevolutiva = (titulo: string, parecer: string, metas: string[]) => {
    const email = anamneseModalAberta?.user_email || pacientes[0]?.email || "";
    setDevolutivaPacienteEmail(email);
    setDevolutivaTitulo(`Devolutiva Semanal • ${titulo}`);
    setDevolutivaParecer((prev) => concatenarTexto(prev, parecer));
    if (metas.length > 0) {
      setDevolutivaMetas((prev) => mesclarListas(prev, metas));
    }
    setAnamneseModalAberta(null);
    setModalDevolutivaAberta(true);
    dispararToast("Rascunho de conduta aberto na Devolutiva para edição! ✨");
  };

  const aplicarProtocoloNoPlano = (p: ProtocoloClinico) => {
    const texto = p.orientacaoPratoSeguro || p.parecerClinicoSugerido;
    setPlanoNotaOrientacao((prev) => concatenarTexto(prev, texto));
  };

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
        const emailNutri = "metodonutrindoemcasa@gmail.com";
        const ehNutri = (e?: string) => (e || "").toLowerCase().trim() === emailNutri;

        const perfisFiltrados = (data.profiles || []).filter((p: any) => !ehNutri(p.email) && p.plano !== "nutri");
        setPacientes(perfisFiltrados);
        setAnamneses((data.anamneses || []).filter((a: any) => !ehNutri(a.user_email)));
        setAgendamentos((data.agendamentos || []).filter((a: any) => !ehNutri(a.user_email)));
        setMensagens((data.mensagens || []).filter((m: any) => !ehNutri(m.user_email)));
        setDiario((data.diario || []).filter((d: any) => !ehNutri(d.user_email)));
        setDevolutivasSalvas((data.devolutivas || []).filter((d: any) => !ehNutri(d.user_email)));
        setPrescricoesSalvas((data.prescricoes || []).filter((p: any) => !ehNutri(p.user_email)));

        if (perfisFiltrados.length > 0 && !chatPacienteEmail) {
          setChatPacienteEmail(perfisFiltrados[0].email);
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

  // Gerador rápido de sala do Google Meet
  const handleGerarLinkMeet = (agendamentoId: string | number) => {
    const sufixo1 = Math.random().toString(36).substring(2, 5);
    const sufixo2 = Math.random().toString(36).substring(2, 6);
    const sufixo3 = Math.random().toString(36).substring(2, 5);
    const linkGerado = `https://meet.google.com/${sufixo1}-${sufixo2}-${sufixo3}`;
    setLinksMeetEditados((prev) => ({ ...prev, [agendamentoId]: linkGerado }));
    handleSalvarLinkMeet(agendamentoId, linkGerado);
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

  const passosTour: TourStep[] = [
    {
      id: "metricas",
      target: "nutri-metricas",
      title: "Resumo de Métricas Clínicas",
      subtitulo: "Painel Geral de Atendimento",
      description:
        "Acompanhe de relance o total de famílias ativas, consultas agendadas, anamneses concluídas e novos registros sensoriais na Escada do Comer.",
      dicaPratica: "Monitore a taxa de anamneses preenchidas para antecipar a preparação das primeiras consultas.",
    },
    {
      id: "prontuarios",
      target: "nutri-aba-prontuarios",
      title: "Lista de Pacientes & Prontuário Completo",
      subtitulo: "56 Perguntas + Devolutiva Lado a Lado",
      description:
        "Abra a nova tela dedicada e ampla de Prontuário para ler as 56 perguntas com fontes legíveis, analisar os Pontos de Atenção e redigir a Devolutiva Semanal lado a lado de forma contínua.",
      dicaPratica: "Clique em 'Abrir Prontuário & Devolutiva' em qualquer paciente para abrir a tela ampla.",
      onEnter: () => setAbaAtiva("prontuarios"),
    },
    {
      id: "consultas",
      target: "nutri-aba-consultas",
      title: "Agenda com Link do Meet & Calendário",
      subtitulo: "Ações Clínicas Rápidas",
      description:
        "Gerencie as consultas agendadas, envie links do Google Meet sincronizados instantaneamente com o painel do paciente e conclua atendimentos para liberar os ciclos de 4 semanas.",
      dicaPratica: "Ao gerar o link Meet ou enviar uma devolutiva, a família recebe o acesso na hora.",
      onEnter: () => setAbaAtiva("consultas"),
    },
    {
      id: "chat",
      target: "nutri-aba-chat",
      title: "Central de Dúvidas & Acolhimento",
      subtitulo: "Suporte Profissional Direto",
      description:
        "Responda às dúvidas dos pais enviadas durante a rotina familiar (segunda a sexta em horário comercial) com histórico seguro de mensagens por paciente.",
      dicaPratica: "Envie orientações de acolhimento e esclareça dúvidas de substituição alimentar com rapidez.",
      onEnter: () => setAbaAtiva("chat"),
    },
    {
      id: "diarios",
      target: "nutri-aba-diarios",
      title: "Escada do Comer em Tempo Real",
      subtitulo: "Monitoramento dos 5 Degraus Sensoriais",
      description:
        "Acompanhe em tempo real cada refeição registrada pelas famílias e a resposta da criança nos 5 degraus: Tolerou, Cheirou, Tocou, Provou ou Comeu.",
      dicaPratica: "Comemore pequenas conquistas (como tolerar ou cheirar) nas devolutivas semanais para fortalecer o engajamento familiar.",
      onEnter: () => setAbaAtiva("diarios"),
    },
  ];

  const totalPacientes = pacientes.length;
  const pacientesComAnamnese = pacientes.filter(
    (p) => anamneses.some((a) => a.user_email === p.email) || p.anamnese_concluida
  ).length;
  const pendentesAnamnese = Math.max(0, totalPacientes - pacientesComAnamnese);
  const pctAnamnese = totalPacientes > 0 ? Math.round((pacientesComAnamnese / totalPacientes) * 100) : 100;

  return (
    <div className="min-h-screen bg-[#F0EAE1] font-sans text-slate-800 pb-16">
      
      {/* TOAST DE FEEDBACK */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 bg-[#4C6C54] text-white text-xs font-bold rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400/30 animate-in fade-in">
          <Sparkles className="h-4 w-4 text-amber-300" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TOUR GUIADO (Guia Rápido) */}
      <GuidedTour storageKey="nutrindo_tour_nutri_visto" steps={passosTour} />

      {/* =================================================================== */}
      {/* CABEÇALHO DO PORTAL DA NUTRICIONISTA */}
      {/* =================================================================== */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-28 sm:h-10 sm:w-34 shrink-0">
              <Image src="/logo-transparente.png" alt="Nutrindo em Casa" fill className="object-contain" priority />
            </div>
            <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3">
              <div className="relative h-9 w-9 rounded-full overflow-hidden border-2 border-[#4C6C54]/30 shadow-xs shrink-0 bg-[#4C6C54]/10">
                <Image
                  src="/dra-lais.jpg"
                  alt="Dra. Laís Leles"
                  fill
                  className="object-cover object-top"
                />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-[#4C6C54]">PORTAL CLÍNICO</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#4C6C54]/10 text-[#4C6C54]">
                    CRN-8 18878 • Pediátrica
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Dra. Laís Leles • Gestão Clínica de Pacientes</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={abrirTour}
              className="py-1.5 px-3 rounded-xl bg-[#E8F5E9] hover:bg-[#d7ecd9] text-[#3D5A45] border border-[#3D5A45]/20 text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
              title="Abrir o guia rápido do portal"
            >
              <span className="h-4 w-4 rounded-full bg-[#3D5A45] text-white text-[10px] font-black inline-flex items-center justify-center">?</span>
              <span>Guia Rápido</span>
            </button>
            <Link
              href="/dashboard"
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.setItem("anamnese_concluida", "true");
                  localStorage.setItem("nutrindo_anamnese_concluida", "true");
                  localStorage.setItem("consulta_agendada", "true");
                  localStorage.setItem("nutrindo_consulta_agendada", "true");
                }
              }}
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
        <div data-tour="nutri-metricas" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Famílias Ativas</span>
              <Users className="h-4 w-4 text-[#4C6C54]" />
            </div>
            <div className="text-2xl font-black text-slate-900">{totalPacientes}</div>
            <p className={`text-[10px] font-bold ${pendentesAnamnese > 0 ? "text-amber-700" : "text-emerald-700"}`}>
              {pendentesAnamnese === 0
                ? "100% com prontuário concluído"
                : `${pctAnamnese}% com anamnese concluída (${pendentesAnamnese} pendente${pendentesAnamnese > 1 ? "s" : ""})`}
            </p>
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
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1.5 border-b border-slate-200 scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            type="button"
            data-tour="nutri-aba-prontuarios"
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
            data-tour="nutri-aba-consultas"
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
            data-tour="nutri-aba-chat"
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
            data-tour="nutri-aba-diarios"
            onClick={() => setAbaAtiva("diarios")}
            className={`py-2 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              abaAtiva === "diarios"
                ? "bg-[#4C6C54] text-white shadow-xs"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <Utensils className="h-3.5 w-3.5" />
            <span>Diários Alimentares & Escada do Comer</span>
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

            {/* LISTA EM CARDS NO MOBILE (< md) */}
            <div className="block md:hidden space-y-3">
              {pacientes.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">Nenhum paciente cadastrado no momento.</p>
                </div>
              ) : (
                pacientes.map((p) => {
                  const anamneseDoPaciente = anamneses.find((a) => a.user_email === p.email);
                  return (
                    <div key={p.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                            <span>👦 {p.nome_crianca || "Criança"}</span>
                            {p.idade_crianca && (
                              <span className="text-[10px] font-semibold text-slate-500">• {p.idade_crianca}</span>
                            )}
                          </h3>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Resp: <strong>{p.nome}</strong> • {p.email}
                          </p>
                        </div>

                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                            p.status_assinatura === "ATIVO"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {p.status_assinatura || "ATIVO"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap text-[10px]">
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          {p.plano || "Trimestral"}
                        </span>
                        {anamneseDoPaciente ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" /> 56 itens preenchidos
                          </span>
                        ) : (
                          <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Anamnese Pendente
                          </span>
                        )}
                        {p.consulta_agendada ? (
                          <span className="text-[#2A546D] font-bold bg-[#2A546D]/10 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" /> Consulta Agendada
                          </span>
                        ) : (
                          <span className="text-slate-400">Sem consulta</span>
                        )}
                      </div>

                      <Link
                        href={`/nutri/prontuario/${encodeURIComponent(p.email)}`}
                        className="w-full py-2.5 px-3.5 rounded-xl bg-[#4C6C54] hover:bg-[#3a5340] text-white font-black text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer text-center"
                        title="Abrir Prontuário Completo e Redigir Devolutiva Semanal"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Abrir Prontuário & Devolutiva</span>
                      </Link>
                    </div>
                  );
                })
              )}
            </div>

            {/* TABELA NO DESKTOP (md:block) */}
            <div className="hidden md:block overflow-x-auto">
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
                  {pacientes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                          <Users className="h-9 w-9 text-slate-300 stroke-[1.5]" />
                          <h4 className="text-sm font-extrabold text-slate-700">
                            Nenhum paciente cadastrado no momento.
                          </h4>
                          <p className="text-xs text-slate-400">
                            Assim que novas famílias concluírem a assinatura na plataforma, seus prontuários e registros da Escada do Comer aparecerão aqui.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pacientes.map((p) => {
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
                          <div className="flex items-center justify-end">
                            <Link
                              href={`/nutri/prontuario/${encodeURIComponent(p.email)}`}
                              className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-[#4C6C54] hover:bg-[#3a5340] text-white font-black text-xs transition-all shadow-xs hover:shadow cursor-pointer"
                              title="Abrir Prontuário Completo e Redigir Devolutiva Semanal"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              <span>Abrir Prontuário & Devolutiva</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
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
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-base font-extrabold text-slate-900">Agenda Clínica da Dra. Laís</h2>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full text-[11px] font-extrabold text-emerald-800 shadow-2xs">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ✅ Sincronizado com Google Calendar (Dra. Laís)
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Consultas marcadas com +7 dias de antecedência, devolutivas e metas prescritas
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                <Link
                  href={pacientes.length > 0 ? `/nutri/prontuario/${encodeURIComponent(pacientes[0].email)}` : "/nutri"}
                  className="py-2.5 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                  title="Abrir a Estação Completa de Prontuário & Devolutiva do Paciente"
                >
                  <FileText className="h-4 w-4" />
                  <span>Abrir Prontuário & Devolutiva</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setMetaPacienteEmail(pacientes[0]?.email || "");
                    setModalPrescreverMeta(true);
                  }}
                  className="py-2.5 px-3.5 rounded-xl bg-[#4C6C54] hover:bg-[#3a5340] text-white font-extrabold text-xs transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nova Meta / Consulta</span>
                </button>
              </div>
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
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleGerarLinkMeet(ag.id)}
                                className="text-[10px] font-extrabold text-[#2A546D] hover:underline inline-flex items-center gap-1 cursor-pointer"
                                title="Gerar link de sala instantâneo"
                              >
                                <Sparkles className="h-2.5 w-2.5" /> Gerar Link Meet
                              </button>
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
                      <button
                        type="button"
                        onClick={() => {
                          abrirGoogleCalendar({
                            titulo: ehConsulta
                              ? `Consulta Nutricional Pediátrica - Dra. Laís Leles (${pac?.nome || ag.user_email})`
                              : `${ag.titulo} - Dra. Laís Leles`,
                            descricao: ehConsulta
                              ? `Consulta Nutricional Online com Dra. Laís Leles (CRN-8 18878).\n\nPaciente: ${pac?.nome || ag.user_email}${pac?.nome_crianca ? ` (Criança: ${pac.nome_crianca})` : ""}\nLink da videochamada Google Meet: ${ag.link || linksMeetEditados[ag.id] || "https://meet.google.com"}\n\nOrientações de Preparo: Conectar 5 minutos antes em ambiente calmo, com caderno de anotações e registros da Escada do Comer à mão.`
                              : `Atividade/Meta clínica do paciente ${pac?.nome || ag.user_email}.\n${ag.titulo}`,
                            localizacao: "Google Meet - Plataforma Nutrindo em Casa",
                            data: ag.data,
                            horario: ag.horario,
                            duracaoMinutos: ehConsulta ? 60 : 30,
                            linkMeet: ag.link || linksMeetEditados[ag.id] || undefined,
                          });
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <CalendarIcon className="h-3.5 w-3.5 text-emerald-700" />
                        <span>📅 Salvar no Google Calendar</span>
                      </button>
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
        {/* ABA 4: DIÁRIOS ALIMENTARES & ESCADA DO COMER */}
        {/* =================================================================== */}
        {abaAtiva === "diarios" && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Registros da Escada do Comer
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

                  {/* VISUALIZAÇÃO DA FOTO DO PRATO PELA NUTRICIONISTA */}
                  {d.foto && (
                    <div className="pt-1.5">
                      <div
                        onClick={() => setFotoZoomNutri({ foto: d.foto!, alimento: d.alimento, email: d.user_email })}
                        className="relative h-28 w-full rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:opacity-95 group transition-all cursor-pointer bg-slate-100"
                        title="Clique para avaliar a montagem do prato seguro em tamanho ampliado"
                      >
                        <img src={d.foto} alt={`Prato - ${d.alimento}`} className="w-full h-full object-cover group-hover:scale-103 transition-transform" />
                        <span className="absolute bottom-1.5 right-1.5 bg-black/65 text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                          📷 Avaliar Prato Seguro 🔍
                        </span>
                      </div>
                    </div>
                  )}

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
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-in zoom-in-95">
            
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
              
              {/* ✨ ASSISTENTE DE PRÉ-ANÁLISE CLÍNICA */}
              <AssistentePreAnalise
                respostas={anamneseModalAberta.respostas}
                perfil={pacientes.find((p) => p.email === anamneseModalAberta.user_email)}
                onAplicarParecer={aplicarProtocoloNoProntuario}
                onGerarDevolutiva={gerarDevolutivaComProtocolo}
              />

              {/* CAMPO DE ANOTAÇÕES CLÍNICAS DA DRA. LAÍS */}
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                <BancoRespostasRapidas
                  tema="amber"
                  iniciarAberto={false}
                  onAplicar={aplicarProtocoloNoProntuario}
                  dica="O parecer e a orientação do Prato Seguro do protocolo serão adicionados ao final das suas anotações."
                />
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-black text-amber-900 flex items-center gap-1.5 uppercase tracking-wide">
                    <span>🩺</span> Anotações Clínicas da Nutricionista
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                  <BotaoSalvarRespostaRapida
                    montarModelo={() =>
                      anotacoesClinicas.trim()
                        ? { parecerClinicoSugerido: anotacoesClinicas.trim() }
                        : null
                    }
                    onSalvo={(nome) => dispararToast(`Resposta rápida "${nome}" salva no seu banco! ⭐`)}
                  />
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

              {/* =================================================================== */}
              {/* TODAS AS 56 PERGUNTAS DA ANAMNESE COM DESTAQUE DE ATENÇÃO CLÍNICA */}
              {/* =================================================================== */}
              <ProntuarioAnamnese56
                respostas={anamneseModalAberta.respostas}
                onCopiarAnotacoes={copiarParaAnotacoes}
                onAbrirRascunhoDevolutiva={abrirRascunhoNaDevolutiva}
              />

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

      {/* =================================================================== */}
      {/* MODAL 1: ENVIAR DEVOLUTIVA SEMANAL PARA A FAMÍLIA (EXPANDIDO 2 COLUNAS) */}
      {/* =================================================================== */}
      {modalDevolutivaAberta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#FFFDF8] rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-amber-200 animate-in zoom-in-95">
            <div className="p-5 border-b border-amber-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Enviar Devolutiva Semanal
                  </h3>
                  <p className="text-xs text-slate-500">
                    Parecer clínico humanizado, alimentos-alvo e metas práticas para a família
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalDevolutivaAberta(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarDevolutiva} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/70 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider block">
                    Modelos Rápidos da Nutri (1 Clique)
                  </span>
                  <BotaoSalvarRespostaRapida
                    montarModelo={() =>
                      devolutivaParecer.trim()
                        ? {
                            parecerClinicoSugerido: devolutivaParecer.trim(),
                            alimentosAlvoSugeridos: devolutivaAlimentos.split(",").map((a) => a.trim()).filter(Boolean),
                            metasSemanaisSugeridas: devolutivaMetas.map((m) => m.trim()).filter(Boolean),
                          }
                        : null
                    }
                    onSalvo={(nome) => dispararToast(`Resposta rápida "${nome}" salva no seu banco! ⭐`)}
                  />
                </div>
                <BancoRespostasRapidas
                  onAplicar={(p) => aplicarProtocoloNaDevolutiva(p)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                {/* COLUNA 1: DADOS BÁSICOS & PARECER */}
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Paciente Destinatário
                    </label>
                    <select
                      required
                      value={devolutivaPacienteEmail}
                      onChange={(e) => setDevolutivaPacienteEmail(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4C6C54]"
                    >
                      <option value="">Selecione a família...</option>
                      {pacientes.map((p) => (
                        <option key={p.id} value={p.email}>
                          {p.nome_crianca || "Criança"} ({p.nome} • {p.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Título / Semana de Referência
                    </label>
                    <input
                      type="text"
                      required
                      value={devolutivaTitulo}
                      onChange={(e) => setDevolutivaTitulo(e.target.value)}
                      placeholder="Ex: Semana 3 • Avançando nas Texturas Crocantes"
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4C6C54]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">
                        Parecer Clínico & Acolhimento da Dra. Laís
                      </label>
                    </div>
                    <textarea
                      rows={8}
                      required
                      value={devolutivaParecer}
                      onChange={(e) => setDevolutivaParecer(e.target.value)}
                      placeholder="Analise os registros recentes da Escada do Comer, valorize as conquistas e oriente a família com acolhimento..."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#4C6C54] leading-relaxed resize-none"
                    />
                  </div>
                </div>

                {/* COLUNA 2: ALIMENTOS-ALVO & METAS PRÁTICAS */}
                <div className="space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Alimentos-Alvo da Semana (Separados por vírgula)
                      </label>
                      <input
                        type="text"
                        required
                        value={devolutivaAlimentos}
                        onChange={(e) => setDevolutivaAlimentos(e.target.value)}
                        placeholder="Ex: Brócolis tostadinho, Maçã fuji em fatias, Cenoura palito"
                        className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4C6C54]"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Metas Práticas para a Família (2 a 3 metas)
                        </label>
                        <button
                          type="button"
                          onClick={() => setDevolutivaMetas([...devolutivaMetas, ""])}
                          className="text-[10px] font-bold text-[#4C6C54] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" /> Adicionar Meta
                        </button>
                      </div>

                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {devolutivaMetas.map((meta, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <span className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-800 font-black text-[11px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <input
                              type="text"
                              required
                              value={meta}
                              onChange={(e) => {
                                const nov = [...devolutivaMetas];
                                nov[idx] = e.target.value;
                                setDevolutivaMetas(nov);
                              }}
                              placeholder={`Meta acionável ${idx + 1}...`}
                              className="flex-1 h-9 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4C6C54]"
                            />
                            {devolutivaMetas.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setDevolutivaMetas(devolutivaMetas.filter((_, i) => i !== idx))}
                                className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-lg flex items-center justify-center cursor-pointer shrink-0"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>A devolutiva aparecerá automaticamente na nova tela de Orientações da Nutri da família.</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setModalDevolutivaAberta(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Enviar para a Família</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: PRESCREVER PLANO ALIMENTAR & RECEITAS RECOMENDADAS */}
      {/* =================================================================== */}
      {modalPlanoReceitasAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#FFFDF8] rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-sky-200 animate-in zoom-in-95">
            <div className="p-5 border-b border-sky-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-[#2A546D]/10 text-[#2A546D] flex items-center justify-center font-bold">
                  <UtensilsCrossed className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Plano Alimentar & Receitas Recomendadas
                  </h3>
                  <p className="text-xs text-slate-500">
                    Selecione as receitas do banco e personalize as orientações da família
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalPlanoReceitasAberto(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarPlanoEReceitas} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Coluna 1: Paciente e Orientação */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Paciente Destinatário
                    </label>
                    <select
                      required
                      value={planoPacienteEmail}
                      onChange={(e) => abrirModalPlanoReceitas(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#2A546D]"
                    >
                      {pacientes.map((p) => (
                        <option key={p.id} value={p.email}>
                          {p.nome_crianca || "Criança"} ({p.nome} • {p.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <BancoRespostasRapidas
                    tema="sky"
                    onAplicar={aplicarProtocoloNoPlano}
                    dica="Adiciona a orientação do Prato Seguro (70/20/10) do protocolo à nota do plano alimentar."
                  />

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">
                        Nota de Orientação da Dra. Laís para o Plano
                      </label>
                      <BotaoSalvarRespostaRapida
                        montarModelo={() =>
                          planoNotaOrientacao.trim()
                            ? { orientacaoPratoSeguro: planoNotaOrientacao.trim() }
                            : null
                        }
                        onSalvo={(nome) => dispararToast(`Resposta rápida "${nome}" salva no seu banco! ⭐`)}
                      />
                    </div>
                    <textarea
                      rows={8}
                      required
                      value={planoNotaOrientacao}
                      onChange={(e) => setPlanoNotaOrientacao(e.target.value)}
                      placeholder="Orientações sobre o prato de apoio, alimentos seguros e postura dos pais à mesa..."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2A546D] leading-relaxed"
                    />
                  </div>
                </div>

                {/* Coluna 2: Receitas Recomendadas */}
                <div className="space-y-2 flex flex-col">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">
                      Receitas Sensoriais Recomendadas ({receitasRecomendadasIds.length})
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Selo ⭐ Dra. Laís
                    </span>
                  </div>

                  <div className="space-y-2 overflow-y-auto max-h-[340px] pr-1">
                    {RECEITAS_PADRAO.map((rec) => {
                      const selecionada = receitasRecomendadasIds.includes(rec.id);
                      return (
                        <div
                          key={rec.id}
                          onClick={() => {
                            if (selecionada) {
                              setReceitasRecomendadasIds(receitasRecomendadasIds.filter((id) => id !== rec.id));
                            } else {
                              setReceitasRecomendadasIds([...receitasRecomendadasIds, rec.id]);
                            }
                          }}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                            selecionada
                              ? "bg-amber-50/80 border-amber-300 shadow-2xs"
                              : "bg-white hover:bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{rec.emoji}</span>
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-xs leading-tight">{rec.titulo}</h4>
                              <span className="text-[10px] text-slate-400 font-semibold">{rec.textura} • {rec.tempoPreparo}</span>
                            </div>
                          </div>

                          <div className={`h-5 w-5 rounded-lg flex items-center justify-center shrink-0 border ${
                            selecionada
                              ? "bg-amber-400 border-amber-500 text-slate-900"
                              : "border-slate-300 bg-white"
                          }`}>
                            {selecionada && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setModalPlanoReceitasAberto(false)}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 bg-[#2A546D] hover:bg-[#1f3f52] text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Salvar Recomendações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ZOOM DE FOTO DO PRATO PARA NUTRICIONISTA */}
      {fotoZoomNutri && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in"
          onClick={() => setFotoZoomNutri(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-5 space-y-3 shadow-2xl border border-slate-100 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <span>📷 Avaliação Visual do Prato Seguro</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  {fotoZoomNutri.alimento} • Paciente: {fotoZoomNutri.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFotoZoomNutri(null)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 max-h-[70vh] flex items-center justify-center p-1">
              <img src={fotoZoomNutri.foto} alt={fotoZoomNutri.alimento} className="max-h-[65vh] w-auto object-contain rounded-xl" />
            </div>
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-2.5 text-[11px] text-[#4C6C54] font-medium">
              💡 <strong>Dica da Dra. Laís:</strong> Avalie a proporção visual dos quadrantes (70% alimentos aceitos de conforto, 20% pontes sensoriais e 10% desafio).
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
