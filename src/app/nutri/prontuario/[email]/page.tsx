"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  FileText,
  Send,
  Plus,
  Trash2,
  Lock,
  User,
  Baby,
  Calendar,
  Heart,
  ChevronDown,
  ChevronUp,
  History,
  Save,
  Clock,
  ShieldCheck,
  Utensils,
  Camera,
} from "lucide-react";
import BancoRespostasRapidas from "@/components/nutri/BancoRespostasRapidas";
import {
  obterSecoesProntuario,
  type ItemPergunta,
  type SecaoProntuario,
} from "@/components/nutri/ProntuarioAnamnese56";
import type { ProtocoloClinico } from "@/data/sugestoesClinicas";

interface PacienteData {
  profile: {
    nome?: string;
    email?: string;
    nome_crianca?: string;
    idade_crianca?: string;
    plano?: string;
    telefone?: string;
    cpf?: string;
  } | null;
  anamnese: {
    concluida?: boolean;
    anotacoes_clinicas?: string;
    respostas?: Record<string, any>;
    created_at?: string;
    updated_at?: string;
  } | null;
  devolutivas: Array<{
    id: string;
    semana_ref: string;
    parecer_clinico: string;
    alimentos_alvo?: string[];
    metas_semana?: Array<string | { texto: string; concluida?: boolean }>;
    created_at: string;
  }>;
  agendamentos: Array<{
    id: string;
    data: string;
    horario: string;
    tipo: string;
    link_meet?: string;
  }>;
  diario: Array<{
    id: string | number;
    alimento: string;
    refeicao: string;
    degrau?: string;
    nivel_tolerado?: string;
    reacao?: string;
    observacoes?: string;
    foto?: string;
    data_registro?: string;
  }>;
  listaPacientes: Array<{
    email: string;
    nome?: string;
    nome_crianca?: string;
    idade_crianca?: string;
  }>;
}

export default function ProntuarioDedicadoPage() {
  const router = useRouter();
  const params = useParams();
  const rawEmail = typeof params?.email === "string" ? params.email : "";
  const emailDecodificado = decodeURIComponent(rawEmail).toLowerCase().trim();

  const [carregando, setCarregando] = useState(true);
  const [paciente, setPaciente] = useState<PacienteData>({
    profile: null,
    anamnese: null,
    devolutivas: [],
    agendamentos: [],
    diario: [],
    listaPacientes: [],
  });

  // Filtro da coluna da esquerda: "todas" vs "atencao" vs "diario"
  const [filtroPerguntas, setFiltroPerguntas] = useState<"todas" | "atencao" | "diario">("todas");

  // Aba da coluna da direita: "devolutiva" vs "anotacoes"
  const [abaDireita, setAbaDireita] = useState<"devolutiva" | "anotacoes">("devolutiva");

  // Estados do formulário de Devolutiva
  const [semanaRef, setSemanaRef] = useState("Semana 1 - Avaliação Inicial e Transição Sensorial");
  const [parecerClinico, setParecerClinico] = useState("");
  const [alimentosAlvo, setAlimentosAlvo] = useState("");
  const [metas, setMetas] = useState<string[]>([
    "Manter 1 alimento seguro garantido em todas as refeições principais",
    "Pratinho de apoio ao lado para apresentar novos alimentos sem obrigação de comer",
  ]);
  const [novaMetaInput, setNovaMetaInput] = useState("");
  const [enviandoDevolutiva, setEnviandoDevolutiva] = useState(false);
  const [feedbackSucesso, setFeedbackSucesso] = useState("");
  const [feedbackErro, setFeedbackErro] = useState("");

  // Estados das Anotações Internas do Prontuário
  const [anotacoesInternas, setAnotacoesInternas] = useState("");
  const [salvandoAnotacoes, setSalvandoAnotacoes] = useState(false);
  const [feedbackAnotacoes, setFeedbackAnotacoes] = useState("");

  // Histórico expandido de devolutivas anteriores
  const [historicoAberto, setHistoricoAberto] = useState(false);

  // Carregar dados clínicos do paciente
  useEffect(() => {
    if (!emailDecodificado) return;

    let cancelado = false;
    async function carregar() {
      try {
        setCarregando(true);
        const res = await fetch(`/api/nutri?user_email=${encodeURIComponent(emailDecodificado)}`);
        if (!res.ok) throw new Error("Erro ao buscar dados do paciente.");
        const data = await res.json();
        if (cancelado) return;

        if (data.success) {
          setPaciente({
            profile: data.profile || null,
            anamnese: data.anamnese || null,
            devolutivas: data.devolutivas || [],
            agendamentos: data.agendamentos || [],
            diario: data.diario || [],
            listaPacientes: data.lista_pacientes || [],
          });

          const anotacoesSalvas = data.anamnese?.anotacoes_clinicas || data.anamnese?.respostas?.anotacoes_clinicas;
          if (anotacoesSalvas) {
            setAnotacoesInternas(anotacoesSalvas);
          }

          // Ajusta número da semana com base nas devolutivas já enviadas
          const totalDevs = (data.devolutivas || []).length;
          setSemanaRef(`Semana ${totalDevs + 1} - Acompanhamento Clínico`);
        }
      } catch (err) {
        console.error("Erro ao carregar prontuário do paciente:", err);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, [emailDecodificado]);

  // Seções organizadas das 56 perguntas
  const secoes: SecaoProntuario[] = useMemo(() => {
    return obterSecoesProntuario(paciente.anamnese?.respostas);
  }, [paciente.anamnese?.respostas]);

  // Totalizador de pontos de atenção
  const totalPontosAtencao = useMemo(() => {
    return secoes.reduce((acc, sec) => acc + sec.itens.filter((i) => i.pontoAtencao).length, 0);
  }, [secoes]);

  // Ação: Inserir sugestão de conduta de uma pergunta na Devolutiva
  const handleInserirSugestaoNaDevolutiva = (item: ItemPergunta) => {
    if (!item.sugestaoConduta) return;

    const textoFormatado = `\n\n📌 [Conduta baseada na Pergunta #${item.numero} - ${item.pergunta}]:\n${item.sugestaoConduta}`;
    setParecerClinico((prev) => (prev ? `${prev.trim()}${textoFormatado}` : textoFormatado.trim()));

    setFeedbackSucesso(`Sugestão da Pergunta #${item.numero} copiada para o Parecer Clínico!`);
    setTimeout(() => setFeedbackSucesso(""), 4000);

    // Se estiver em outra aba na direita, muda automaticamente para devolutiva
    if (abaDireita !== "devolutiva") {
      setAbaDireita("devolutiva");
    }
  };

  // Ação: Aplicar protocolo do banco de respostas rápidas
  const handleAplicarProtocolo = (proto: ProtocoloClinico) => {
    if (proto.parecerClinicoSugerido) {
      setParecerClinico((prev) => (prev ? `${prev}\n\n${proto.parecerClinicoSugerido}` : proto.parecerClinicoSugerido));
    }

    if (proto.alimentosAlvoSugeridos && proto.alimentosAlvoSugeridos.length > 0) {
      const novosAlimentos = proto.alimentosAlvoSugeridos.join(", ");
      setAlimentosAlvo((prev) => (prev ? `${prev}, ${novosAlimentos}` : novosAlimentos));
    }

    if (proto.metasSemanaisSugeridas && proto.metasSemanaisSugeridas.length > 0) {
      setMetas((prev) => {
        const setUnico = new Set([...prev, ...proto.metasSemanaisSugeridas]);
        return Array.from(setUnico);
      });
    }

    setFeedbackSucesso(`Modelo "${proto.tituloCurto || 'Clínico'}" aplicado com sucesso!`);
    setTimeout(() => setFeedbackSucesso(""), 3500);
  };

  // Metas handlers
  const handleAdicionarMeta = () => {
    if (!novaMetaInput.trim()) return;
    setMetas((prev) => [...prev, novaMetaInput.trim()]);
    setNovaMetaInput("");
  };

  const handleRemoverMeta = (idx: number) => {
    setMetas((prev) => prev.filter((_, i) => i !== idx));
  };

  // Enviar Devolutiva para a Família
  const handleEnviarDevolutiva = async () => {
    if (!parecerClinico.trim()) {
      setFeedbackErro("O parecer clínico não pode estar vazio.");
      setTimeout(() => setFeedbackErro(""), 3500);
      return;
    }

    try {
      setEnviandoDevolutiva(true);
      setFeedbackErro("");

      const res = await fetch("/api/nutri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "enviar_devolutiva",
          user_email: emailDecodificado,
          semana_ref: semanaRef.trim(),
          parecer_clinico: parecerClinico.trim(),
          alimentos_alvo: alimentosAlvo
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean),
          metas_semana: metas.map((m) => ({ texto: m, concluida: false })),
          profissional: "Dra. Laís Leles • CRN-8 18878",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Falha ao enviar devolutiva.");
      }

      setFeedbackSucesso("Devolutiva enviada com sucesso para a família! 💌");
      setTimeout(() => setFeedbackSucesso(""), 4500);

      // Atualiza lista local
      if (data.devolutiva) {
        setPaciente((prev) => ({
          ...prev,
          devolutivas: [data.devolutiva, ...prev.devolutivas],
        }));
      }

      // Prepara próxima semana
      const proxNum = paciente.devolutivas.length + 2;
      setSemanaRef(`Semana ${proxNum} - Acompanhamento Clínico`);
    } catch (err: any) {
      setFeedbackErro(err.message || "Erro de conexão ao enviar.");
      setTimeout(() => setFeedbackErro(""), 4000);
    } finally {
      setEnviandoDevolutiva(false);
    }
  };

  // Salvar Anotações Internas do Prontuário
  const handleSalvarAnotacoes = async () => {
    try {
      setSalvandoAnotacoes(true);
      setFeedbackAnotacoes("");

      const res = await fetch("/api/nutri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "salvar_anotacoes_prontuario",
          user_email: emailDecodificado,
          anotacoes_clinicas: anotacoesInternas,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Falha ao salvar anotações.");
      }

      setFeedbackAnotacoes("Anotações confidenciais salvas com sucesso! 📝");
      setTimeout(() => setFeedbackAnotacoes(""), 3500);
    } catch (err: any) {
      setFeedbackAnotacoes(`Erro: ${err.message || "Falha ao salvar"}`);
      setTimeout(() => setFeedbackAnotacoes(""), 4000);
    } finally {
      setSalvandoAnotacoes(false);
    }
  };

  const nomeCrianca = paciente.profile?.nome_crianca || "Paciente Infantil";
  const idadeCrianca = paciente.profile?.idade_crianca || "Idade não informada";
  const nomeResponsavel = paciente.profile?.nome || "Responsável";
  const plano = paciente.profile?.plano ? `Plano ${paciente.profile.plano}` : "Acompanhamento Ativo";

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#F0EAE1] flex items-center justify-center p-6">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl flex items-center gap-3.5 border border-slate-200">
          <div className="h-5 w-5 border-2 border-[#4C6C54] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-700">Carregando prontuário clínico individual...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0EAE1] font-sans text-slate-800">
      {/* ========================================================= */}
      {/* HEADER FIXO SUPERIOR COM TROCA RÁPIDA DE PACIENTE */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/nutri"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-[#4C6C54] hover:text-white transition-all shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar ao Painel Clínico</span>
            </Link>

            <span className="hidden sm:inline-block text-slate-300">|</span>

            {/* SELETOR RÁPIDO DE PACIENTES */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 hidden sm:inline">Trocar Paciente:</span>
              <select
                value={emailDecodificado}
                onChange={(e) => {
                  if (e.target.value) {
                    router.push(`/nutri/prontuario/${encodeURIComponent(e.target.value)}`);
                  }
                }}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-extrabold text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/30"
              >
                {paciente.listaPacientes.length > 0 ? (
                  paciente.listaPacientes.map((p) => (
                    <option key={p.email} value={p.email}>
                      {p.nome_crianca ? `${p.nome_crianca} (${p.nome || p.email})` : p.email}
                    </option>
                  ))
                ) : (
                  <option value={emailDecodificado}>{nomeCrianca} ({emailDecodificado})</option>
                )}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
              <span>Dra. Laís Leles • CRN-8 18878</span>
            </span>
          </div>
        </div>
      </header>

      {/* FEEDBACKS FLUTUANTES */}
      {feedbackSucesso && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#4C6C54] text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-sm font-bold animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-300 shrink-0" />
          <span>{feedbackSucesso}</span>
        </div>
      )}
      {feedbackErro && (
        <div className="fixed bottom-6 right-6 z-50 bg-rose-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 text-sm font-bold animate-in fade-in slide-in-from-bottom-3 duration-300">
          <AlertTriangle className="h-5 w-5 text-rose-200 shrink-0" />
          <span>{feedbackErro}</span>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL COM ROLAGEM 100% INDEPENDENTE NAS 2 COLUNAS */}
      {/* ========================================================= */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:h-[calc(100vh-73px)] lg:overflow-hidden flex flex-col pt-3 pb-2 space-y-3">
        {/* CARD HERO DE IDENTIFICAÇÃO DO PACIENTE (COMPACTO) */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#4C6C54]/10 text-[#4C6C54] border border-[#4C6C54]/20">
                {plano}
              </span>
              {paciente.anamnese?.concluida ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Anamnese 100% Concluída (56 Perguntas)</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Anamnese Em Preenchimento</span>
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>{nomeCrianca}</span>
              <span className="text-sm font-semibold text-slate-500">• {idadeCrianca}</span>
            </h1>

            <p className="text-xs font-medium text-slate-600 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span>Responsável: <strong>{nomeResponsavel}</strong></span>
              </span>
              <span>•</span>
              <span className="text-slate-500">{emailDecodificado}</span>
              {paciente.profile?.telefone && (
                <>
                  <span>•</span>
                  <span className="text-slate-500">WhatsApp: {paciente.profile.telefone}</span>
                </>
              )}
            </p>
          </div>

          {/* RESUMO RÁPIDO DE CONSULTAS & DEVOLUTIVAS */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200/80">
            <div className="text-center px-2">
              <span className="block text-xl font-black text-[#4C6C54]">
                {paciente.devolutivas.length}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Devolutivas
              </span>
            </div>
            <div className="h-7 w-px bg-slate-300" />
            <div className="text-center px-2">
              <span className="block text-xl font-black text-amber-600">
                {totalPontosAtencao}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Pontos de Atenção
              </span>
            </div>
            <div className="h-7 w-px bg-slate-300" />
            <div className="text-center px-2">
              <span className="block text-xl font-black text-blue-600">
                {paciente.diario.length}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Registros Diário
              </span>
            </div>
          </div>
        </section>

        {/* CONTAINER COM DUAS ROLAGENS INDEPENDENTES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 lg:overflow-hidden items-start">
          {/* ========================================================= */}
          {/* COLUNA DA ESQUERDA (7 COLS): ROLA AS 56 PERGUNTAS / DIÁRIO INDEPENDENTE */}
          {/* ========================================================= */}
          <section className="lg:col-span-7 lg:h-full lg:overflow-y-auto pr-2 pb-12 space-y-4">
            {/* BARRA DE CONTROLE & ABAS DE NAVEGAÇÃO DA ESQUERDA */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3 flex-wrap sticky top-0 z-10 backdrop-blur-md">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFiltroPerguntas("todas")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                    filtroPerguntas === "todas"
                      ? "bg-[#4C6C54] text-white shadow-2xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Todas as 56 Respostas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroPerguntas("atencao")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                    filtroPerguntas === "atencao"
                      ? "bg-amber-600 text-white shadow-2xs"
                      : "bg-amber-100/80 text-amber-900 hover:bg-amber-200/90 border border-amber-300"
                  }`}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Apenas Pontos de Atenção ({totalPontosAtencao})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroPerguntas("diario")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                    filtroPerguntas === "diario"
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-blue-50 text-blue-900 hover:bg-blue-100/90 border border-blue-200"
                  }`}
                >
                  <Utensils className="h-3.5 w-3.5" />
                  <span>🍽️ Diário Alimentar da Criança ({paciente.diario.length})</span>
                </button>
              </div>

              <span className="text-xs font-semibold text-slate-400 hidden xl:inline">
                Rolagem independente
              </span>
            </div>

            {/* SEÇÃO DINÂMICA: DIÁRIO DA CRIANÇA OU ANAMNESE COMPLETA */}
            {filtroPerguntas === "diario" ? (
              <div className="space-y-4 pb-6">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 flex items-start gap-3 text-xs text-amber-950">
                  <Utensils className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-amber-950">
                      🍽️ Diário Alimentar & Escada do Comer de {nomeCrianca}
                    </h3>
                    <p className="leading-relaxed text-amber-900/90">
                      Consulte as refeições, alimentos testados e nível de tolerância sensorial sem precisar trocar de tela, enquanto redige a Devolutiva Semanal na coluna ao lado.
                    </p>
                  </div>
                </div>

                {paciente.diario.length === 0 ? (
                  <div className="p-10 text-center space-y-3 border border-dashed border-slate-200 rounded-3xl bg-white shadow-2xs">
                    <Utensils className="h-9 w-9 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">Nenhum registro alimentar no diário ainda.</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Assim que a família registrar conquistas na Escada do Comer pelo painel deles, os dados aparecerão aqui em tempo real.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paciente.diario.map((item, idx) => {
                      const degrau = (item.degrau || item.nivel_tolerado || "tolerou").toLowerCase();
                      const degrauNome =
                        degrau === "tolerou"
                          ? "👀 Tolerou no prato"
                          : degrau === "cheirou"
                          ? "👃 Cheirou voluntariamente"
                          : degrau === "tocou"
                          ? "🖐️ Tocou ou lambeu"
                          : degrau === "provou"
                          ? "👅 Provou um pedaço"
                          : "😋 Comeu uma porção";

                      return (
                        <div
                          key={item.id || idx}
                          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-black text-slate-900 text-base">
                              {item.alimento}
                            </span>
                            <span className="text-xs font-bold text-slate-400">
                              {item.data_registro ? new Date(item.data_registro).toLocaleDateString("pt-BR") : "Hoje"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-extrabold text-xs">
                              {item.refeicao}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-extrabold text-xs">
                              {degrauNome}
                            </span>
                            {item.reacao && (
                              <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 font-extrabold text-xs">
                                {item.reacao}
                              </span>
                            )}
                          </div>

                          {item.observacoes && (
                            <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs sm:text-[13px] leading-relaxed">
                              {item.observacoes}
                            </p>
                          )}

                          {item.foto && (
                            <div className="pt-1">
                              <span className="text-xs font-bold text-slate-500 inline-flex items-center gap-1.5">
                                <Camera className="h-3.5 w-3.5" /> Foto anexada da refeição
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* LISTAGEM DAS SEÇÕES DE ANAMNESE */
              <div className="space-y-6 pb-12">
              {secoes.map((secao) => {
                const itensFiltrados =
                  filtroPerguntas === "atencao"
                    ? secao.itens.filter((item) => item.pontoAtencao)
                    : secao.itens;

                if (itensFiltrados.length === 0) return null;

                return (
                  <div
                    key={secao.numeroSecao}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4"
                  >
                    {/* CABEÇALHO DA SEÇÃO */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <h2 className="text-base sm:text-lg font-black text-[#4C6C54] tracking-tight flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#4C6C54]" />
                        <span>{secao.titulo}</span>
                      </h2>
                      <span className="text-xs font-bold text-slate-400">
                        {itensFiltrados.length} parâmetros
                      </span>
                    </div>

                    {/* CARDS DE CADA PERGUNTA (FONTE GRANDE 16px / text-base) */}
                    <div className="space-y-3.5">
                      {itensFiltrados.map((item) => (
                        <div
                          key={item.numero}
                          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                            item.pontoAtencao
                              ? "bg-amber-50/70 border-amber-300 shadow-2xs ring-1 ring-amber-300/60"
                              : "bg-slate-50/60 border-slate-200/80 hover:bg-white"
                          }`}
                        >
                          {/* CABEÇALHO DO CARD */}
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                              Pergunta #{item.numero} • {item.pergunta}
                            </span>
                            {item.pontoAtencao && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wide bg-amber-200/90 text-amber-900 border border-amber-400 shrink-0">
                                <AlertTriangle className="h-3 w-3 text-amber-700" />
                                <span>Ponto de Atenção</span>
                              </span>
                            )}
                          </div>

                          {/* RESPOSTA EM FONTE GRANDE (text-base / 16px) */}
                          <p className="text-base font-bold text-slate-900 leading-relaxed">
                            {item.resposta}
                          </p>

                          {/* MOTIVO DO ALERTA */}
                          {item.pontoAtencao && item.motivoAtencao && (
                            <p className="text-xs sm:text-sm font-semibold text-amber-900 mt-2 italic flex items-center gap-1.5">
                              <span>⚠️ Motivo clínico:</span>
                              <span>{item.motivoAtencao}</span>
                            </p>
                          )}

                          {/* BOX DE SUGESTÃO DE CONDUTA COM BOTÃO PARA DEVOLUTIVA */}
                          {item.pontoAtencao && item.sugestaoConduta && (
                            <div className="mt-3.5 pt-3 border-t border-amber-200/80 space-y-2.5">
                              <div className="bg-white/95 p-3.5 rounded-xl border border-amber-300 shadow-2xs space-y-1">
                                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-amber-950">
                                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                                  <span>💡 Sugestão de Conduta para a Nutri (Apoio Clínico)</span>
                                </div>
                                <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed">
                                  {item.sugestaoConduta}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleInserirSugestaoNaDevolutiva(item)}
                                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-[#4C6C54] hover:bg-[#3D5A45] text-white text-xs sm:text-sm font-extrabold transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-md"
                              >
                                <Plus className="h-4 w-4" />
                                <span>+ Inserir esta sugestão no rascunho da Devolutiva ao lado</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </section>

          {/* ========================================================= */}
          {/* COLUNA DA DIREITA (5 COLS): ROLA DE FORMA INDEPENDENTE ATÉ O BOTÃO ENVIAR */}
          {/* ========================================================= */}
          <aside className="lg:col-span-5 lg:h-full lg:overflow-y-auto pl-2 pb-12 space-y-4">
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-md space-y-4">
              {/* ABAS DO PAINEL LATERAL (2 ABAS: DEVOLUTIVA E ANOTAÇÕES) */}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <button
                  type="button"
                  onClick={() => setAbaDireita("devolutiva")}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer text-center inline-flex items-center justify-center gap-2 ${
                    abaDireita === "devolutiva"
                      ? "bg-[#4C6C54] text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Devolutiva Semanal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAbaDireita("anotacoes")}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer text-center inline-flex items-center justify-center gap-2 ${
                    abaDireita === "anotacoes"
                      ? "bg-slate-800 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Anotações Internas</span>
                </button>
              </div>

              {/* CONTEÚDO 1: EDITOR DA DEVOLUTIVA SEMANAL */}
              {abaDireita === "devolutiva" && (
                <div className="space-y-4">
                  {/* SELETOR DE MODELOS RÁPIDOS DA DRA. LAÍS */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Banco de Respostas / Modelos Próprios
                    </label>
                    <BancoRespostasRapidas
                      onAplicar={handleAplicarProtocolo}
                      dica="Selecione um modelo clínico que você salvou para aplicar no parecer"
                    />
                  </div>

                  {/* SEMANA DE REFERÊNCIA */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Semana de Referência / Título
                    </label>
                    <input
                      type="text"
                      value={semanaRef}
                      onChange={(e) => setSemanaRef(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/30"
                      placeholder="Ex: Semana 1 - Avaliação Inicial e Transição Sensorial"
                    />
                  </div>

                  {/* PARECER CLÍNICO (TEXTAREA AMPLO COM FONTE text-base) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                        Parecer Clínico da Semana (Visível para a Família)
                      </label>
                      <span className="text-[11px] font-bold text-slate-400">
                        {parecerClinico.length} caracteres
                      </span>
                    </div>
                    <textarea
                      value={parecerClinico}
                      onChange={(e) => setParecerClinico(e.target.value)}
                      rows={7}
                      className="w-full p-3.5 rounded-2xl border border-slate-200 text-sm sm:text-base font-medium text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/30 bg-slate-50/50"
                      placeholder="Escreva as orientações práticas, acolhimento e condutas da semana para os pais da criança..."
                    />
                  </div>

                  {/* ALIMENTOS-ALVO DA SEMANA */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Alimentos-Alvo da Semana (Separados por vírgula)
                    </label>
                    <input
                      type="text"
                      value={alimentosAlvo}
                      onChange={(e) => setAlimentosAlvo(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/30"
                      placeholder="Ex: Cenoura assada em palito, maçã em lâminas finas"
                    />
                  </div>

                  {/* METAS PRÁTICAS DA FAMÍLIA */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Metas Práticas da Família ({metas.length})
                    </label>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={novaMetaInput}
                        onChange={(e) => setNovaMetaInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAdicionarMeta()}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/30"
                        placeholder="Digite uma nova meta e pressione Enter..."
                      />
                      <button
                        type="button"
                        onClick={handleAdicionarMeta}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                      >
                        + Adicionar
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {metas.map((meta, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700"
                        >
                          <span className="leading-snug">• {meta}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoverMeta(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer shrink-0"
                            title="Remover meta"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* BOTÃO PRINCIPAL DE ENVIO */}
                  <button
                    type="button"
                    onClick={handleEnviarDevolutiva}
                    disabled={enviandoDevolutiva}
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#4C6C54] hover:bg-[#3D5A45] text-white font-black text-sm sm:text-base transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    <span>
                      {enviandoDevolutiva
                        ? "Enviando Devolutiva..."
                        : "Enviar Devolutiva para a Família 💌"}
                    </span>
                  </button>

                  {/* HISTÓRICO RÁPIDO DE DEVOLUTIVAS */}
                  {paciente.devolutivas.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <button
                        type="button"
                        onClick={() => setHistoricoAberto(!historicoAberto)}
                        className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-[#4C6C54] transition-colors py-1 cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <History className="h-3.5 w-3.5" />
                          <span>Histórico de Devolutivas ({paciente.devolutivas.length})</span>
                        </span>
                        {historicoAberto ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>

                      {historicoAberto && (
                        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                          {paciente.devolutivas.map((dev) => (
                            <div
                              key={dev.id}
                              className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between font-black text-slate-800">
                                <span>{dev.semana_ref}</span>
                                <span className="text-[10px] text-slate-400 font-semibold">
                                  {new Date(dev.created_at).toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                              <p className="text-slate-600 line-clamp-3 leading-relaxed">
                                {dev.parecer_clinico}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* CONTEÚDO 2: ANOTAÇÕES INTERNAS DO PRONTUÁRIO */}
              {abaDireita === "anotacoes" && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 font-medium">
                    🔒 <strong>Anotações estritamente confidenciais da Dra. Laís</strong>: Este campo NÃO é enviado para a família. Fica registrado no prontuário interno da criança para evolução clínica.
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Anotações Clínicas & Hipóteses Diagnósticas
                    </label>
                    <textarea
                      value={anotacoesInternas}
                      onChange={(e) => setAnotacoesInternas(e.target.value)}
                      rows={12}
                      className="w-full p-4 rounded-2xl border border-slate-200 text-sm font-medium text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-slate-400 bg-slate-50/50"
                      placeholder="Registre hipóteses de dessensibilização, observações sobre o vínculo da família com a comida, evolução do tônus oral e próximos passos..."
                    />
                  </div>

                  {feedbackAnotacoes && (
                    <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{feedbackAnotacoes}</span>
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleSalvarAnotacoes}
                    disabled={salvandoAnotacoes}
                    className="w-full py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-black text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>
                      {salvandoAnotacoes
                        ? "Salvando Anotações..."
                        : "Salvar Anotações Internas do Prontuário 📝"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
