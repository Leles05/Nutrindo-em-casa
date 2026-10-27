"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Sparkles,
  ArrowRight,
  Plus,
  X,
  Check,
  Video,
  ChevronDown,
  CheckSquare,
  Square,
  FileText,
  Clock,
  HeartHandshake,
  CheckCircle2,
  CalendarCheck,
  UtensilsCrossed,
  Play,
  GraduationCap,
} from "lucide-react";
import ModalCheckin4Semanas from "@/components/ModalCheckin4Semanas";
import GuidedTour, { abrirTour, isTourOculto, salvarTourOculto, type TourStep } from "@/components/GuidedTour";
import { encerrarSessao } from "@/hooks/useAuthGuard";
export { encerrarSessao } from "@/hooks/useAuthGuard";
import { abrirGoogleCalendar } from "@/lib/googleCalendar";
import NotificationBell from "@/components/dashboard/NotificationBell";

const AULAS_CURSO = [
  { id: 1, titulo: "Terapia Alimentar Descomplicada", modulo: "Módulo 1 - Aula 1" },
  { id: 2, titulo: "Sinais de Alerta na Alimentação", modulo: "Módulo 1 - Aula 2" },
  { id: 3, titulo: "Manejo da Recusa e Comunicação", modulo: "Módulo 2 - Aula 1" },
  { id: 4, titulo: "Construindo o Prato Seguro", modulo: "Módulo 2 - Aula 2" },
];

interface MetaDevolutiva {
  id: string;
  texto: string;
  concluida: boolean;
}

interface RefeicaoHoje {
  id: number | string;
  refeicao: "Café" | "Almoço" | "Lanche" | "Jantar";
  alimento: string;
  etapa: string;
  reacaoEmoji: string;
  reacaoTexto: string;
}

export default function PaginaDashboard() {
  if (typeof window !== "undefined") {
    try {
      const emailStorage = localStorage.getItem("nutrindo_user_email")?.trim();
      const tokenStorage = localStorage.getItem("nutrindo_auth_token")?.trim();
      if (!emailStorage || !tokenStorage) {
        window.location.replace("/");
        return null;
      }
    } catch {}
  }

  const hoje = typeof window !== "undefined"
    ? new Date().toLocaleDateString("en-CA")
    : "2026-10-24";

  const [modalAberto, setModalAberto] = useState(false);
  const [modalCheckinAberto, setModalCheckinAberto] = useState(false);
  const [toastMensagem, setToastMensagem] = useState("");

  // Estado do Usuário e Perfil
  const [dadosPlano, setDadosPlano] = useState({
    plano: "Trimestral",
    status: "ativo",
    diasRestantes: 30,
    responsavel: "Responsável",
    email: "",
    crianca: "Joãozinho",
  });

  // Estado de Onboarding
  const [anamneseConcluida, setAnamneseConcluida] = useState(true);
  const [consultaAgendada, setConsultaAgendada] = useState(false);
  const [proximaConsulta, setProximaConsulta] = useState<{
    data?: string;
    horario?: string;
    titulo?: string;
    linkMeet?: string;
  } | null>(null);

  // Estado do Curso Terapia Alimentar Descomplicada
  const [progressoCurso, setProgressoCurso] = useState<{
    concluidasIds: number[];
    totalAulas: number;
    proximaAula: { id: number; titulo: string; modulo: string };
  }>({
    concluidasIds: [],
    totalAulas: 4,
    proximaAula: AULAS_CURSO[0],
  });

  // Estado da Devolutiva da Semana
  const [devolutivaAtual, setDevolutivaAtual] = useState<{
    id: string;
    semana_ref: string;
    parecer_clinico: string;
    alimentos_alvo: string[];
    metas: MetaDevolutiva[];
  } | null>(null);

  // Estado da Escada do Comer e Refeições
  const [contadoresSemana, setContadoresSemana] = useState({
    tolerou: 0,
    cheirou: 0,
    tocou: 0,
    provou: 0,
    comeu: 0,
  });
  const [refeicoesHoje, setRefeicoesHoje] = useState<RefeicaoHoje[]>([]);
  const [prontoParaTour, setProntoParaTour] = useState(false);

  // Menu de perfil
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  const menuPerfilRef = useRef<HTMLDivElement>(null);

  // Modal de registro de refeição
  const [novaData, setNovaData] = useState(hoje);
  const [novaRefeicao, setNovaRefeicao] = useState<"Café" | "Almoço" | "Lanche" | "Jantar">("Almoço");
  const [novoAlimento, setNovoAlimento] = useState("");
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [novaEtapa, setNovaEtapa] = useState("👃 Cheirou voluntariamente");
  const [novaEtapaSlug, setNovaEtapaSlug] = useState<"tolerou" | "cheirou" | "tocou" | "provou" | "comeu">("cheirou");
  const [novaReacao, setNovaReacao] = useState<"positivo" | "neutro" | "desafiador">("positivo");
  const [novoDetalhe, setNovoDetalhe] = useState("");

  const bancoAlimentos = [
    "Brócolis 🥦", "Cenoura 🥕", "Maçã 🍎", "Mamão 🥭", "Banana 🍌",
    "Morango 🍓", "Abobrinha 🥒", "Beterraba 🥗", "Batata doce 🍠",
    "Ovo mexido 🥚", "Frango desfiado 🍗", "Arroz com feijão 🍚"
  ];

  const sugestoesAlimentos = novoAlimento.trim()
    ? bancoAlimentos.filter(
        (a) =>
          a.toLowerCase().includes(novoAlimento.toLowerCase().trim()) &&
          a.toLowerCase() !== novoAlimento.toLowerCase().trim()
      )
    : [];

  const etapasEscalada = [
    { label: "Tolerou no prato", icone: "👀", slug: "tolerou" as const },
    { label: "Cheirou voluntariamente", icone: "👃", slug: "cheirou" as const },
    { label: "Tocou ou lambeu", icone: "🖐️", slug: "tocou" as const },
    { label: "Provou um pedaço", icone: "👅", slug: "provou" as const },
    { label: "Comeu uma porção", icone: "😋", slug: "comeu" as const },
  ];

  // Sincronizar progresso real das aulas do curso
  useEffect(() => {
    function atualizarProgressoCurso() {
      if (typeof window === "undefined") return;
      const email = (
        localStorage.getItem("nutrindo_user_email") ||
        localStorage.getItem("usuario_email") ||
        "padrao"
      ).toLowerCase().trim();
      try {
        const raw = localStorage.getItem(`nutrindo_aulas_concluidas_${email}`);
        const concluidas: number[] = raw ? JSON.parse(raw) : [];
        const prox = AULAS_CURSO.find((a) => !concluidas.includes(a.id)) || AULAS_CURSO[0];
        setProgressoCurso({
          concluidasIds: concluidas,
          totalAulas: AULAS_CURSO.length,
          proximaAula: prox,
        });
      } catch {}
    }

    atualizarProgressoCurso();
    window.addEventListener("nutrindo_cursos_atualizado", atualizarProgressoCurso);
    window.addEventListener("storage", atualizarProgressoCurso);
    return () => {
      window.removeEventListener("nutrindo_cursos_atualizado", atualizarProgressoCurso);
      window.removeEventListener("storage", atualizarProgressoCurso);
    };
  }, []);

  // Verificação unificada de ocultação do Tour (localStorage / Cookie)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isTourOculto("nutrindo_tour_paciente_visto")) {
      if (document.cookie.includes("nutrindo_tour_oculto=true")) {
        try {
          localStorage.setItem("nutrindo_tour_oculto_permanente", "true");
        } catch {}
      }
    }
  }, []);

  // Carregar dados reais do usuário
  useEffect(() => {
    async function carregarDashboard() {
      if (typeof window === "undefined") return;

      let email = (
        localStorage.getItem("nutrindo_user_email") ||
        localStorage.getItem("usuario_email") ||
        ""
      ).toLowerCase().trim();
      const token = localStorage.getItem("nutrindo_auth_token")?.trim();

      if (!email || !token) {
        window.location.replace("/");
        return;
      }

      const role = localStorage.getItem("nutrindo_user_role");
      const ehNutri = role === "nutri" || email === "metodonutrindoemcasa@gmail.com";

      if (ehNutri) {
        setAnamneseConcluida(true);
        setConsultaAgendada(true);
      }

      const nomeSalvo = localStorage.getItem("nutrindo_user_nome") || "";
      const criancaSalva =
        localStorage.getItem("nutrindo_crianca_nome") ||
        localStorage.getItem("nutrindo_nome_crianca") ||
        "";

      setDadosPlano((prev) => ({
        ...prev,
        email,
        responsavel: nomeSalvo || prev.responsavel,
        crianca: criancaSalva || prev.crianca,
      }));

      try {
        // 1. Carrega Perfil & Assinatura
        const confRes = await fetch(`/api/configuracoes?email=${encodeURIComponent(email)}`).then((r) => r.json()).catch(() => null);
        if (confRes?.tour_oculto === true || confRes?.profile?.tour_oculto === true) {
          localStorage.setItem("nutrindo_tour_oculto_permanente", "true");
          localStorage.setItem("nutrindo_tour_desativado", "true");
          document.cookie = "nutrindo_tour_oculto=true; path=/; max-age=31536000; SameSite=Lax";
        } else {
          localStorage.removeItem("nutrindo_tour_oculto_permanente");
          localStorage.removeItem("nutrindo_tour_desativado");
          document.cookie = "nutrindo_tour_oculto=; path=/; max-age=0; SameSite=Lax";
        }
        if (confRes?.profile) {
          const prof = confRes.profile;
          setDadosPlano({
            plano: prof.plano || "Trimestral",
            status: prof.status_assinatura || "ativo",
            diasRestantes: confRes.diasRestantes ?? 30,
            responsavel: prof.nome || nomeSalvo || "Responsável",
            email: prof.email || email,
            crianca: prof.nome_crianca || criancaSalva || "Joãozinho",
          });
          const anamneseOk = ehNutri ? true : Boolean(prof.anamnese_concluida);
          setAnamneseConcluida(anamneseOk);
          if (anamneseOk && typeof window !== "undefined") {
            localStorage.setItem("anamnese_concluida", "true");
            localStorage.setItem("nutrindo_anamnese_concluida", "true");
          }
          if (prof.consulta_agendada) {
            setConsultaAgendada(true);
            if (typeof window !== "undefined") {
              localStorage.setItem("consulta_agendada", "true");
              localStorage.setItem("nutrindo_consulta_agendada", "true");
              window.dispatchEvent(new Event("nutrindo_onboarding_atualizado"));
            }
          }
        }

        // 2. Carrega Agendamentos
        const agRes = await fetch(`/api/agendamentos?email=${encodeURIComponent(email)}`).then((r) => r.json()).catch(() => null);
        if (agRes?.agendamentos && Array.isArray(agRes.agendamentos)) {
          const consultas = agRes.agendamentos.filter((a: any) => a.tipo === "consulta");
          if (consultas.length > 0) {
            setConsultaAgendada(true);
            if (typeof window !== "undefined") {
              localStorage.setItem("consulta_agendada", "true");
              localStorage.setItem("nutrindo_consulta_agendada", "true");
              window.dispatchEvent(new Event("nutrindo_onboarding_atualizado"));
            }
            setProximaConsulta({
              data: consultas[0].data,
              horario: consultas[0].horario,
              titulo: consultas[0].titulo || "Consulta Nutricional de Acolhimento",
              linkMeet: consultas[0].link || "https://meet.google.com/nutri-lais-acolhimento",
            });
          }
        }

        // 3. Carrega Devolutivas
        const devRes = await fetch(`/api/devolutivas?email=${encodeURIComponent(email)}`).then((r) => r.json()).catch(() => null);
        if (devRes?.success && devRes.devolutivas?.length > 0) {
          const d = devRes.devolutivas[0];
          let parsedMetas = d.metas_semana;
          if (typeof parsedMetas === "string") {
            try {
              parsedMetas = JSON.parse(parsedMetas);
            } catch {
              parsedMetas = [parsedMetas];
            }
          }

          const metasNorm = Array.isArray(parsedMetas)
            ? parsedMetas.map((m: any, idx: number) =>
                typeof m === "string"
                  ? { id: `meta-${idx}`, texto: m, concluida: false }
                  : { id: m?.id || `meta-${idx}`, texto: m?.texto || "", concluida: Boolean(m?.concluida) }
              )
            : [];

          const alimentosNorm = Array.isArray(d.alimentos_alvo)
            ? d.alimentos_alvo
            : typeof d.alimentos_alvo === "string"
            ? d.alimentos_alvo.split(",").map((a: string) => a.trim()).filter(Boolean)
            : [];

          setDevolutivaAtual({
            id: d.id,
            semana_ref: d.semana_ref || "Orientação da Semana",
            parecer_clinico: d.parecer_clinico || "",
            alimentos_alvo: alimentosNorm,
            metas: metasNorm,
          });
        }

        // 4. Carrega Diário e Contadores
        const diarioRes = await fetch(`/api/diario?email=${encodeURIComponent(email)}`).then((r) => r.json()).catch(() => null);
        if (diarioRes?.refeicoes && Array.isArray(diarioRes.refeicoes)) {
          const refHojeList: RefeicaoHoje[] = [];
          const cont = { tolerou: 0, cheirou: 0, tocou: 0, provou: 0, comeu: 0 };

          diarioRes.refeicoes.forEach((ref: any) => {
            const slug = (ref.degrau || "").toLowerCase().trim() as keyof typeof cont;
            if (cont[slug] !== undefined) {
              cont[slug] += 1;
            }

            // Refeições de hoje
            const dataRef = ref.data_registro ? ref.data_registro.split("T")[0] : "";
            if (dataRef === hoje) {
              refHojeList.push({
                id: ref.id,
                refeicao: ref.refeicao || "Almoço",
                alimento: ref.alimento || "Alimento",
                etapa: ref.degrau || "tolerou",
                reacaoEmoji: "😊",
                reacaoTexto: "Registrado",
              });
            }
          });

          setContadoresSemana(cont);
          setRefeicoesHoje(refHojeList);
        }
      } catch (err) {
        console.warn("Aviso ao carregar dados do dashboard:", err);
      } finally {
        setProntoParaTour(true);
      }
    }

    carregarDashboard();
  }, [hoje]);

  // Toggle de Meta com 1 Clique
  const toggleMetaSemana = async (metaId: string) => {
    if (!devolutivaAtual) return;

    const novasMetas = devolutivaAtual.metas.map((m) =>
      m.id === metaId ? { ...m, concluida: !m.concluida } : m
    );

    setDevolutivaAtual({
      ...devolutivaAtual,
      metas: novasMetas,
    });

    const metaModificada = novasMetas.find((m) => m.id === metaId);
    if (metaModificada) {
      setToastMensagem(
        metaModificada.concluida
          ? "Meta semanal concluída! Parabéns pelo acolhimento! 🎉"
          : "Meta desmarcada."
      );
      setTimeout(() => setToastMensagem(""), 3500);
    }

    try {
      await fetch("/api/devolutivas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: devolutivaAtual.id,
          metas_semana: novasMetas,
          email: dadosPlano.email,
        }),
      });
    } catch (err) {
      console.warn("Aviso ao salvar meta:", err);
    }
  };

  // Salvar Refeição no Modal
  const salvarRefeicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoAlimento.trim()) return;

    const emojiReacao = novaReacao === "positivo" ? "😊" : novaReacao === "neutro" ? "😐" : "🙁";
    const textoReacao = novaReacao === "positivo" ? "Positivo" : novaReacao === "neutro" ? "Neutro" : "Desafiador";

    const nova: RefeicaoHoje = {
      id: Date.now(),
      refeicao: novaRefeicao,
      alimento: novoAlimento.trim(),
      etapa: novaEtapa,
      reacaoEmoji: emojiReacao,
      reacaoTexto: textoReacao,
    };

    setRefeicoesHoje([nova, ...refeicoesHoje]);
    setContadoresSemana((prev) => ({ ...prev, [novaEtapaSlug]: prev[novaEtapaSlug] + 1 }));
    setNovoAlimento("");
    setNovoDetalhe("");
    setModalAberto(false);

    setToastMensagem(`Conquista com ${nova.alimento} registrada! 🎉`);
    setTimeout(() => setToastMensagem(""), 3500);

    try {
      await fetch("/api/diario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: dadosPlano.email,
          alimento: nova.alimento,
          refeicao: nova.refeicao,
          degrau: novaEtapaSlug,
          observacoes: novoDetalhe.trim(),
        }),
      });
    } catch (err) {
      console.warn("Aviso ao salvar refeição no banco:", err);
    }
  };

  const totalConquistasSemana =
    contadoresSemana.tolerou +
    contadoresSemana.cheirou +
    contadoresSemana.tocou +
    contadoresSemana.provou +
    contadoresSemana.comeu;

  const ehDiaDeConsulta = Boolean(
    proximaConsulta?.data &&
    (proximaConsulta.data === hoje || proximaConsulta.data.split("T")[0] === hoje)
  );

  // Tour Steps Atualizados
  const passosTourPaciente: TourStep[] = [
    {
      id: "inicio",
      target: "#tour-boas-vindas",
      title: "Boas-vindas & Alertas de Consulta",
      subtitulo: "Seu portal de acolhimento alimentar",
      description: "Construímos este espaço para que a jornada alimentar do seu filho seja leve, segura e sem brigas à mesa. Acompanhe alertas importantes e notificações no sininho.",
      dicaPratica: "Fique atento ao sininho e aos avisos de consulta no topo da tela.",
    },
    {
      id: "curso-descomplicado",
      target: "#tour-curso",
      title: "Curso Terapia Alimentar Descomplicada",
      subtitulo: "Aulas Práticas e Sequenciais",
      description: "Assista às aulas exclusivas gravadas pela Dra. Laís Leles sobre manejo da recusa, sinais de alerta e construção do prato seguro.",
      dicaPratica: "Assista no seu próprio ritmo pelo celular ou computador.",
    },
    {
      id: "card-devolutiva",
      target: "#tour-foco-semana",
      title: "Foco da Semana & Orientações da Nutri",
      subtitulo: "Parecer Clínico e Metas Práticas",
      description: "Aqui você acompanha o parecer clínico semanal da Dra. Laís e suas metas calmas. Marque suas vitórias conforme avança.",
      dicaPratica: "Acesse a aba 'Orientações da Nutri' para ver o histórico completo e baixar em PDF timbrado.",
    },
    {
      id: "card-diario",
      target: "#tour-diario",
      title: "Diário Alimentar & Escada do Comer",
      subtitulo: "5 Degraus Sensoriais",
      description: "Acompanhe as pequenas conquistas sensoriais da criança: tolerou, cheirou, tocou, provou e comeu. Clique no botão verde para registrar novas refeições.",
      dicaPratica: "Aproximar-se ou tolerar no prato de apoio já é um enorme avanço! Registre sem pressa.",
    },
    {
      id: "card-consulta",
      target: "#tour-consulta",
      title: "Próxima Consulta & Calendário",
      subtitulo: "Integrado com o Google Calendar",
      description: "Visualize a data e horário da sua videochamada individual com a Dra. Laís Leles, entre direto na sala do Meet e visualize seus compromissos no Google Calendar.",
      dicaPratica: "Sincronize com o Google Calendar para receber lembretes no celular.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* TOUR GUIADO (SÓ AUTO-INICIA SE O ONBOARDING ESTIVER 100% COMPLETO OU SE CLICADO MANUALMENTE) */}
      <GuidedTour
        storageKey="nutrindo_tour_paciente_visto"
        steps={passosTourPaciente}
        autoIniciar={Boolean(anamneseConcluida && consultaAgendada)}
      />

      {/* TOAST DE FEEDBACK */}
      {toastMensagem && (
        <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 p-4 bg-[#3D5A45] text-white text-xs font-bold rounded-2xl shadow-xl flex items-center gap-2.5 animation-fade-in border border-emerald-400/30">
          <Sparkles className="h-4 w-4 text-amber-300 shrink-0" />
          <span>{toastMensagem}</span>
          <button
            type="button"
            onClick={() => setToastMensagem("")}
            className="text-white/70 hover:text-white ml-2 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* HERO CARD DE DESTAQUE EXCLUSIVO: HOJE É DIA DE CONSULTA! */}
      {/* =================================================================== */}
      {ehDiaDeConsulta && (
        <section className="bg-gradient-to-r from-emerald-700 via-[#3D5A45] to-[#2A546D] text-white p-6 sm:p-7 rounded-3xl shadow-xl border-2 border-emerald-400 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500 text-white font-black text-xs uppercase tracking-wider animate-pulse shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                  <span>🔴 HOJE É DIA DE CONSULTA!</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-white/20 text-white font-extrabold text-xs">
                  ⏰ Horário: {proximaConsulta?.horario || "14:00"}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Sua Videochamada Individual com a Dra. Laís Leles é Hoje!
              </h2>

              <p className="text-xs sm:text-sm text-emerald-100 font-medium max-w-xl leading-relaxed">
                Este é o momento exclusivo para alinharmos o plano de acolhimento do seu filho, tirar todas as suas dúvidas e traçar as próximas metas.
              </p>

              <div className="flex items-center gap-2 text-xs font-bold text-amber-200 bg-black/25 px-3.5 py-2 rounded-xl w-fit">
                <span>💡 Dica importante:</span>
                <span className="text-white font-medium">Esteja em um local tranquilo 5 minutos antes do horário marcado.</span>
              </div>
            </div>

            <a
              href={proximaConsulta?.linkMeet || "https://meet.google.com"}
              target="_blank"
              rel="noopener noreferrer"
              className="py-4 px-6 sm:px-7 bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-sm sm:text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer shrink-0 hover:scale-[1.02] active:scale-[0.98] animate-pulse"
            >
              <Video className="h-5 w-5 text-slate-900" />
              <span>Entrar na Consulta com a Dra. Laís Agora (Google Meet)</span>
            </a>
          </div>
        </section>
      )}

      {/* =================================================================== */}
      {/* 1. CABEÇALHO LIMPO E ACOLHEDOR (FOCO EM PAIS CANSADOS) */}
      {/* =================================================================== */}
      <div
        id="tour-boas-vindas"
        data-tour="tour-boas-vindas"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Olá, {dadosPlano.responsavel.split(" ")[0]}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {dadosPlano.crianca &&
            dadosPlano.crianca.trim() &&
            dadosPlano.crianca !== "Criança" &&
            dadosPlano.crianca.toLowerCase() !== dadosPlano.responsavel.toLowerCase()
              ? `Acompanhamento diário de ${dadosPlano.crianca}.`
              : "Acompanhamento diário de Joãozinho."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sininho de Notificações */}
          <NotificationBell />

          {/* Botão Discreto de Tour */}
          <button
            type="button"
            onClick={abrirTour}
            className="px-3.5 py-2 rounded-2xl bg-white border border-slate-200 hover:border-[#3D5A45] text-slate-700 hover:text-[#3D5A45] text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
            title="Como usar a plataforma"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Como usar a plataforma</span>
          </button>

          {/* Badge de Status do Plano */}
          <Link
            href="/configuracoes"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold hover:bg-emerald-100 transition-colors"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Plano {dadosPlano.plano} • Ativo</span>
          </Link>
        </div>
      </div>

      {/* BANNER GENTIL SE A ANAMNESE ESTIVER PENDENTE */}
      {!anamneseConcluida && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-amber-200/70 text-amber-900 flex items-center justify-center shrink-0 font-bold">
              📋
            </div>
            <div>
              <h2 className="font-bold text-amber-950 text-xs">
                Passo 1: Preencher a Anamnese da Criança
              </h2>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Essencial para a Dra. Laís analisar o caso do seu filho e formular as primeiras orientações.
              </p>
            </div>
          </div>
          <Link
            href="/anamnese"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all whitespace-nowrap shrink-0"
          >
            Iniciar Anamnese →
          </Link>
        </div>
      )}

      {/* BANNER SE A ANAMNESE ESTIVER CONCLUÍDA MAS 1ª CONSULTA NÃO AGENDADA (PASSO FINAL DE ONBOARDING) */}
      {anamneseConcluida && !consultaAgendada && (
        <div className="bg-gradient-to-r from-emerald-50 via-white to-sky-50 border-2 border-emerald-400 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-md animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-2xl shadow-2xs">
              📅
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Anamnese Concluída ✅
                </span>
                <span className="text-[11px] font-black text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full animate-pulse">
                  Passo Final Obrigatório
                </span>
              </div>
              <h2 className="font-black text-slate-900 text-base sm:text-lg mt-1 tracking-tight">
                Passo Final: Agende sua 1ª Consulta com a Dra. Laís
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-0.5 max-w-xl leading-relaxed">
                Escolha o melhor dia e horário para a sua videochamada individual de acolhimento e desbloqueie o acesso completo a todos os módulos da plataforma.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/calendario?onboarding=consulta"
            className="px-5 py-3.5 bg-[#2A546D] hover:bg-[#1f3f52] text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <CalendarCheck className="h-4 w-4" />
            <span>Agendar 1ª Consulta Agora →</span>
          </Link>
        </div>
      )}

      {/* =================================================================== */}
      {/* CARD DE DESTAQUE DO CURSO TERAPIA ALIMENTAR DESCOMPLICADA */}
      {/* =================================================================== */}
      <div id="tour-curso" data-tour="tour-curso" className="bg-gradient-to-r from-emerald-50/90 via-white to-amber-50/40 rounded-3xl border border-emerald-200/80 p-5 sm:p-6 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-[#3D5A45] text-white flex items-center justify-center shrink-0 shadow-xs">
              {progressoCurso.concluidasIds.length === 0 ? (
                <GraduationCap className="h-6 w-6 text-amber-200" />
              ) : (
                <Play className="h-5 w-5 text-amber-200 fill-amber-200 ml-0.5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#3D5A45] bg-[#3D5A45]/10 px-2 py-0.5 rounded-full">
                  Curso Oficial • Método Dra. Laís Leles
                </span>
                {progressoCurso.concluidasIds.length > 0 && (
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {Math.round((progressoCurso.concluidasIds.length / progressoCurso.totalAulas) * 100)}% concluído
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                {progressoCurso.concluidasIds.length === 0
                  ? "Comece sua Jornada: Módulo 1 - Aula 1 (Terapia Alimentar Descomplicada)"
                  : `Continue de onde parou: Aula ${progressoCurso.proximaAula.id} (${progressoCurso.proximaAula.titulo})`}
              </h2>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {progressoCurso.concluidasIds.length === 0
                  ? "Aprenda as bases da Escalada do Comer e transforme a hora da refeição em um momento seguro e calmo."
                  : `${progressoCurso.concluidasIds.length} de ${progressoCurso.totalAulas} aulas concluídas. Dê mais um passo na jornada alimentar.`}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <Link
              href="/dashboard/cursos"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#3D5A45] hover:bg-[#2e4434] text-white text-xs font-extrabold shadow-sm hover:shadow transition-all whitespace-nowrap cursor-pointer"
            >
              <span>
                {progressoCurso.concluidasIds.length === 0
                  ? "Assistir 1ª Aula Agora →"
                  : "Continuar Curso →"}
              </span>
            </Link>
          </div>
        </div>

        {progressoCurso.concluidasIds.length > 0 && (
          <div className="pt-1 space-y-1.5">
            <div className="w-full h-2 bg-emerald-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#3D5A45] rounded-full transition-all duration-500"
                style={{
                  width: `${(progressoCurso.concluidasIds.length / progressoCurso.totalAulas) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* ESTRUTURA EM 3 CARDS CLAROS E ESPAÇADOS */}
      {/* =================================================================== */}
      <div className="space-y-6">

        {/* ----------------------------------------------------------------- */}
        {/* CARD 1: FOCO DA SEMANA (CHECKLIST RÁPIDO) */}
        {/* ----------------------------------------------------------------- */}
        <div
          id="tour-foco-semana"
          data-tour="tour-foco-semana"
          className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-2xl bg-[#3D5A45]/10 text-[#3D5A45] flex items-center justify-center font-bold">
                🎯
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900">
                    Foco da Semana
                  </h2>
                  {devolutivaAtual && (
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {devolutivaAtual.semana_ref}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Pequenas metas sem pressão para você marcar com 1 clique
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/devolutivas"
              className="text-xs font-extrabold text-[#3D5A45] hover:text-[#2d4233] inline-flex items-center gap-1 hover:underline self-start sm:self-center"
            >
              <span>Ler orientação completa da Dra. Laís</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {devolutivaAtual ? (
            <div className="space-y-3">
              {/* Preview do parecer */}
              {devolutivaAtual.parecer_clinico && (
                <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-4">
                  <p className="text-sm text-slate-700 italic leading-relaxed line-clamp-3">
                    &ldquo;{devolutivaAtual.parecer_clinico}&rdquo;
                  </p>
                </div>
              )}

              {/* 2 a 3 metas práticas da semana */}
              <div className="space-y-2 pt-1">
                {devolutivaAtual.metas.slice(0, 3).map((meta) => (
                  <button
                    key={meta.id}
                    type="button"
                    onClick={() => toggleMetaSemana(meta.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      meta.concluida
                        ? "bg-emerald-50/60 border-emerald-200 text-slate-500"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-900 shadow-2xs"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0 text-[#3D5A45]">
                      {meta.concluida ? (
                        <CheckSquare className="h-4 w-4 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <span
                      className={`text-xs sm:text-[13px] font-semibold leading-relaxed flex-1 ${
                        meta.concluida ? "line-through text-slate-400" : "text-slate-800"
                      }`}
                    >
                      {meta.texto}
                    </span>
                    {meta.concluida && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md shrink-0">
                        Concluído ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-2">
              <p className="text-xs text-slate-600 leading-relaxed">
                A Dra. Laís está estruturando suas primeiras metas práticas. Assim que publicadas, elas aparecerão aqui para você acompanhar no dia a dia.
              </p>
              <Link
                href="/dashboard/devolutivas"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#3D5A45] hover:underline"
              >
                Ver orientações da nutri →
              </Link>
            </div>
          )}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* CARD 2: DIÁRIO ALIMENTAR & ESCADA DO COMER */}
        {/* ----------------------------------------------------------------- */}
        <div
          id="tour-diario"
          data-tour="tour-diario"
          className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>🥣 Diário Alimentar & Escada do Comer</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cada pequena interação com o alimento novo é uma vitória que merece registro
              </p>
            </div>

            <Link
              href="/dashboard/diario"
              className="text-xs font-extrabold text-[#3D5A45] hover:text-[#2d4233] inline-flex items-center gap-1 hover:underline self-start sm:self-center"
            >
              <span>Ver histórico completo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Resumo Visual dos 5 Degraus */}
          <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                Evolução Sensorial da Semana:
              </span>
              <span className="text-[11px] font-black text-[#3D5A45] bg-[#3D5A45]/10 px-2.5 py-0.5 rounded-full">
                +{totalConquistasSemana} conquistas registradas
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 text-center">
              {[
                { emoji: "👀", count: contadoresSemana.tolerou, label: "Tolerou", desc: "Tolerou no prato de apoio" },
                { emoji: "👃", count: contadoresSemana.cheirou, label: "Cheirou", desc: "Sentiu o cheiro sem reclamar" },
                { emoji: "🖐️", count: contadoresSemana.tocou, label: "Tocou", desc: "Tocou com a mão ou talher" },
                { emoji: "👅", count: contadoresSemana.provou, label: "Provou", desc: "Lambeu ou mordeu um pedaço" },
                { emoji: "😋", count: contadoresSemana.comeu, label: "Comeu", desc: "Engoliu com segurança" },
              ].map((degrau, idx) => (
                <div
                  key={degrau.label}
                  className={`bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-[#3D5A45] transition-all ${
                    idx === 4 ? "col-span-2 sm:col-span-1" : ""
                  }`}
                  title={`${degrau.label}: ${degrau.desc}`}
                >
                  <span className="text-lg">{degrau.emoji}</span>
                  <p className="text-sm font-black text-slate-800 mt-0.5">{degrau.count}</p>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block truncate">
                    {degrau.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Botão Grande e Inconfundível: + Registrar Refeição */}
          <button
            type="button"
            onClick={() => setModalAberto(true)}
            className="w-full py-3.5 px-4 bg-[#3D5A45] hover:bg-[#2e4434] text-white font-black text-sm rounded-2xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="h-5 w-5 stroke-[2.5]" />
            <span>Registrar Refeição</span>
          </button>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* CARD 3: PRÓXIMA CONSULTA */}
        {/* ----------------------------------------------------------------- */}
        <div
          id="tour-consulta"
          data-tour="tour-consulta"
          className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-2xl bg-[#2A546D]/10 text-[#2A546D] flex items-center justify-center font-bold">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Próxima Consulta
                </h2>
                <p className="text-xs text-slate-500">
                  Encontro individual por videochamada com a Dra. Laís Leles (CRN-8 18878)
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/calendario"
              className="text-xs font-extrabold text-[#2A546D] hover:underline self-start sm:self-center"
            >
              Ver agenda completa →
            </Link>
          </div>

          {proximaConsulta ? (
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#2A546D] text-white">
                      Confirmada
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      Google Meet
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {proximaConsulta.titulo}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <Clock className="h-3.5 w-3.5 text-[#2A546D]" />
                    <span>
                      {proximaConsulta.data
                        ? new Date(proximaConsulta.data + "T00:00:00").toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })
                        : "A definir"}{" "}
                      • {proximaConsulta.horario || "14:00 - 15:00"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    abrirGoogleCalendar({
                      titulo: proximaConsulta.titulo || "Consulta Nutricional de Acolhimento",
                      data: proximaConsulta.data || hoje,
                      horario: proximaConsulta.horario || "14:00",
                      tipo: "consulta",
                      linkMeet: proximaConsulta.linkMeet,
                      detalhes: "Consulta Nutricional individual com a Dra. Laís Leles (CRN-8 18878).",
                    });
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <CalendarIcon className="h-3.5 w-3.5 text-sky-600" />
                  <span>Google Calendar</span>
                </button>
              </div>

              {/* Botões de Ação da Consulta */}
              <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row gap-2.5">
                {proximaConsulta.linkMeet && (
                  <a
                    href={proximaConsulta.linkMeet}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 px-4 bg-[#2A546D] hover:bg-[#1f3f52] text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
                  >
                    <Video className="h-4 w-4" />
                    <span>Entrar na Videochamada</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setModalCheckinAberto(true)}
                  className="flex-1 py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="h-4 w-4 text-[#3D5A45]" />
                  <span>Preencher atualização pré-consulta</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Você ainda não possui uma consulta agendada. Acesse o calendário para escolher o melhor dia e horário com a Dra. Laís.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Link
                  href="/dashboard/calendario"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2A546D] hover:bg-[#1f3f52] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all"
                >
                  <CalendarCheck className="h-4 w-4" />
                  <span>Agendar Consulta</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setModalCheckinAberto(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  <span>Preencher atualização pré-consulta</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* =================================================================== */}
      {/* MODAL DE REGISTRO DE REFEIÇÃO */}
      {/* =================================================================== */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 animation-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-3.5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
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

            <form onSubmit={salvarRefeicao} className="space-y-3 text-xs">
              {/* DATA E REFEIÇÃO */}
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
                    className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#3D5A45] cursor-pointer"
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
                            ? "bg-[#3D5A45] text-white border-[#3D5A45]"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {ref}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ALIMENTO COM AUTOCOMPLETE */}
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
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#3D5A45] focus:bg-white"
                  required
                />

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
                        className="w-full px-3 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-[#3D5A45]/10 hover:text-[#3D5A45] transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <span>{sug}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* DEGRAU DA ESCALADA */}
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
                            ? "border-[#3D5A45] bg-[#3D5A45]/10 text-[#3D5A45] font-bold shadow-2xs"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-xs">{etapa.icone}</span>
                        <span className="text-[11px] truncate">{etapa.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* REAÇÃO DA CRIANÇA */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Reação da Criança
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "positivo", emoji: "😊", label: "Tranquilo" },
                    { id: "neutro", emoji: "😐", label: "Curioso" },
                    { id: "desafiador", emoji: "🙁", label: "Resistência" },
                  ].map((rec) => (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => setNovaReacao(rec.id as any)}
                      className={`py-1.5 px-2 rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        novaReacao === rec.id
                          ? "border-[#EB6D57] bg-[#EB6D57]/10 text-[#EB6D57] font-bold"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span className="text-sm">{rec.emoji}</span>
                      <span className="text-[11px]">{rec.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* OBSERVAÇÃO */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Observação (Opcional)
                </label>
                <input
                  type="text"
                  value={novoDetalhe}
                  onChange={(e) => setNovoDetalhe(e.target.value)}
                  placeholder="Ex: Tocou com curiosidade no prato de apoio..."
                  className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3D5A45] focus:bg-white"
                />
              </div>

              {/* AÇÕES FIXAS NO RODAPÉ */}
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
                  className="flex-1 py-2 px-3 bg-[#3D5A45] hover:bg-[#2e4434] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" /> Salvar Conquista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CHECK-IN DE 4 SEMANAS (PRÉ-CONSULTA) */}
      <ModalCheckin4Semanas
        aberto={modalCheckinAberto}
        onClose={() => setModalCheckinAberto(false)}
        onSucesso={() => {
          setToastMensagem("Atualização pré-consulta enviada com sucesso para a Dra. Laís! Ela analisará suas respostas antes do encontro. 📝");
          setTimeout(() => setToastMensagem(""), 4500);
        }}
      />
    </div>
  );
}