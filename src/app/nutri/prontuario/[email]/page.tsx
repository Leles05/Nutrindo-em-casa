"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  Lightbulb,
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
  Check,
  X,
  Target,
  ClipboardList,
  PenSquare,
  Stethoscope,
  MessageSquare,
  Search,
} from "lucide-react";
import BancoRespostasRapidas from "@/components/nutri/BancoRespostasRapidas";
import {
  obterSecoesProntuario,
  type ItemPergunta,
  type SecaoProntuario,
} from "@/components/nutri/ProntuarioAnamnese56";
import {
  salvarRespostaCustom,
  type ProtocoloClinico,
} from "@/data/sugestoesClinicas";

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

  // Busca rápida de palavra-chave nas 56 perguntas e respostas
  const [buscaPalavraChave, setBuscaPalavraChave] = useState("");

  // Aba da coluna da direita: "devolutiva" vs "anotacoes"
  const [abaDireita, setAbaDireita] = useState<"devolutiva" | "anotacoes">("devolutiva");

  // Seletor mobile entre ler o Prontuário e escrever a Devolutiva (< lg)
  const [secaoMobile, setSecaoMobile] = useState<"prontuario" | "devolutiva">("prontuario");

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
  const [statusAutoSave, setStatusAutoSave] = useState("");
  const primeiraCargaAnotacoes = useRef<boolean>(true);
  const timeoutAutoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const ultimaAnotacaoSalvaRef = useRef<string>("");

  // Estados para salvar modelo próprio no banco de respostas
  const [salvandoModeloInline, setSalvandoModeloInline] = useState(false);
  const [salvandoModeloProprio, setSalvandoModeloProprio] = useState(false);
  const [nomeModeloInput, setNomeModeloInput] = useState("");
  const [erroSalvarModelo, setErroSalvarModelo] = useState("");

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
            ultimaAnotacaoSalvaRef.current = anotacoesSalvas;
          }

          // Permite auto-save após montagem inicial
          setTimeout(() => {
            primeiraCargaAnotacoes.current = false;
          }, 350);

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

  // Auto-Save com debounce de 1500ms nas Anotações Internas
  useEffect(() => {
    if (primeiraCargaAnotacoes.current) return;
    if (!emailDecodificado) return;
    if (anotacoesInternas === ultimaAnotacaoSalvaRef.current) return;

    setStatusAutoSave("Salvando...");

    if (timeoutAutoSaveRef.current) {
      clearTimeout(timeoutAutoSaveRef.current);
    }

    timeoutAutoSaveRef.current = setTimeout(async () => {
      try {
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
        if (res.ok && data.success) {
          ultimaAnotacaoSalvaRef.current = anotacoesInternas;
          const hora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
          setStatusAutoSave(`✓ Salvo automaticamente às ${hora}`);
        } else {
          setStatusAutoSave("⚠️ Erro ao salvar automaticamente");
        }
      } catch {
        setStatusAutoSave("⚠️ Erro de rede ao salvar");
      }
    }, 1500);

    return () => {
      if (timeoutAutoSaveRef.current) {
        clearTimeout(timeoutAutoSaveRef.current);
      }
    };
  }, [anotacoesInternas, emailDecodificado]);

  // Seções organizadas das 56 perguntas
  const secoes: SecaoProntuario[] = useMemo(() => {
    return obterSecoesProntuario(paciente.anamnese?.respostas);
  }, [paciente.anamnese?.respostas]);

  // Totalizador de pontos de atenção
  const totalPontosAtencao = useMemo(() => {
    return secoes.reduce((acc, sec) => acc + sec.itens.filter((i) => i.pontoAtencao).length, 0);
  }, [secoes]);

  // Seções com filtro de busca por palavra-chave e ponto de atenção
  const secoesFiltradas = useMemo(() => {
    const termo = buscaPalavraChave.trim().toLowerCase();
    return secoes.map((secao) => {
      const itens = secao.itens.filter((item) => {
        if (filtroPerguntas === "atencao" && !item.pontoAtencao) return false;
        if (!termo) return true;

        const perguntaStr = (item.pergunta || "").toLowerCase();
        const respostaStr = String(item.resposta || "").toLowerCase();

        const leituraStr = (item.leituraClinica || "").toLowerCase();
        const motivoStr = (item.motivoAtencao || "").toLowerCase();
        const orientacaoStr = (item.orientacaoPais || item.sugestaoConduta || "").toLowerCase();

        return (
          perguntaStr.includes(termo) ||
          respostaStr.includes(termo) ||
          leituraStr.includes(termo) ||
          motivoStr.includes(termo) ||
          orientacaoStr.includes(termo)
        );
      });

      return {
        ...secao,
        itens,
      };
    });
  }, [secoes, filtroPerguntas, buscaPalavraChave]);

  // Total de itens exibidos após busca
  const totalItensFiltrados = useMemo(() => {
    return secoesFiltradas.reduce((acc, sec) => acc + sec.itens.length, 0);
  }, [secoesFiltradas]);

  // Ação 1: Inserir Sugestão Humanizada na Devolutiva Semanal + Meta Prática Sugerida
  const handleInserirSugestao = (item: ItemPergunta) => {
    // Garante que a aba Devolutiva esteja visível na coluna da direita
    if (abaDireita !== "devolutiva") {
      setAbaDireita("devolutiva");
    }

    // Inserir parágrafo fluido, humano, acolhedor e em 1ª pessoa no Parecer Clínico (SEM colchetes, SEM alfinete)
    const textoCru = (item.orientacaoPais || item.sugestaoConduta || "").trim();
    const textoAcolhedor = textoCru
      .replace(/^📌\s*/, "")
      .replace(/^\[.*?\]:\s*/, "")
      .trim();

    if (textoAcolhedor) {
      setParecerClinico((prev) => (prev ? `${prev.trim()}\n\n${textoAcolhedor}` : textoAcolhedor));
    }

    // Adicionar automaticamente a meta prática sugerida correspondente à lista de metas da família
    const meta = item.metaSugerida || (item.metasSugeridas && item.metasSugeridas[0]);
    if (meta && !metas.includes(meta)) {
      setMetas((prev) => [...prev, meta]);
    }

    // Sugerir alimentos-alvo coerentes se o campo estiver vazio
    if (!alimentosAlvo.trim()) {
      const mapaAlimentos: Record<number, string> = {
        8: "Batata rústica assada, cenoura em tiras finas, torradinha caseira",
        17: "Prato com divisórias, palitos de legumes assados, pedaços individuais de frango",
        20: "Purê aveludado de mandioquinha, maçã cozida com canela, caldo caseiro suave",
        28: "Frango desfiado bem macio, ovo mexido cremoso, chips de queijo suave",
        29: "Maçã fatiada finíssima em lâminas, morango fatiado, banana com aveia",
        30: "Cenoura assada em palito, abobrinha em rodelas douradas, chips de batata-doce",
        32: "Alimento de segurança favorito da criança + variação sutil de apresentação",
        40: "Alimentos servidos em prato com divisórias ou potinhos individuais",
        44: "Palitos de torrada com azeite, tiras de queijo firme, pepino em tiras",
        47: "Alimentos de conforto favoritos da criança montados em formato lúdico",
        50: "1 alimento de segurança 100% garantido + 1 preparação familiar sem pressão",
        58: "Mamão em cubinhos, ameixa fresca, purê de pera, água fresca fracionada",
      };
      if (mapaAlimentos[item.numero]) {
        setAlimentosAlvo(mapaAlimentos[item.numero]);
      }
    }

    setFeedbackSucesso(`Orientação da Pergunta #${item.numero} inserida na Devolutiva Semanal!`);
    setSecaoMobile("devolutiva");
    setAbaDireita("devolutiva");
    setTimeout(() => setFeedbackSucesso(""), 4000);
  };

  // Ação 2: Guardar observação clínica técnica nas Anotações Internas (uso privado da Dra. Laís)
  const handleGuardarNasAnotacoesInternas = (item: ItemPergunta) => {
    const textoTecnico = item.leituraClinica || item.sugestaoConduta || item.motivoAtencao || "";
    if (!textoTecnico) return;

    const novaLinha = `[Pergunta #${item.numero} - ${item.pergunta}]:\n${item.motivoAtencao ? `Motivo de Alerta: ${item.motivoAtencao}\n` : ""}${textoTecnico}`;
    setAnotacoesInternas((prev) => (prev ? `${prev.trim()}\n\n${novaLinha}` : novaLinha));

    setFeedbackSucesso(`Observação técnica da Pergunta #${item.numero} guardada nas Anotações Internas!`);
    setSecaoMobile("devolutiva");
    setAbaDireita("anotacoes");
    setTimeout(() => setFeedbackSucesso(""), 4000);
  };

  // Ação 3: Confirmar e salvar modelo atual no Banco de Respostas
  const handleConfirmarSalvarModelo = () => {
    if (salvandoModeloProprio) return;
    if (!nomeModeloInput.trim()) {
      setErroSalvarModelo("Digite o título do modelo (ex: Conduta para Desmame de Telas).");
      return;
    }
    if (!parecerClinico.trim() && !alimentosAlvo.trim() && metas.length === 0) {
      setErroSalvarModelo("Digite ao menos o texto do parecer para salvar como modelo.");
      return;
    }

    try {
      setSalvandoModeloProprio(true);
      const novoModelo = salvarRespostaCustom({
        tituloCurto: nomeModeloInput.trim(),
        categoria: "personalizado",
        parecerClinicoSugerido: parecerClinico.trim(),
        alimentosAlvoSugeridos: alimentosAlvo
          ? alimentosAlvo
              .split(",")
              .map((a) => a.trim())
              .filter(Boolean)
          : [],
        metasSemanaisSugeridas: metas,
      });

      setSalvandoModeloInline(false);
      setNomeModeloInput("");
      setErroSalvarModelo("");
      setFeedbackSucesso(`Modelo "${novoModelo.tituloCurto}" salvo com sucesso no seu banco! ⭐`);
      setTimeout(() => setFeedbackSucesso(""), 3500);
    } finally {
      setSalvandoModeloProprio(false);
    }
  };

  // Ação 4: Aplicar protocolo do banco de respostas rápidas (preenchimento automático)
  const handleAplicarProtocolo = (proto: ProtocoloClinico) => {
    if (proto.parecerClinicoSugerido) {
      setParecerClinico(proto.parecerClinicoSugerido);
    }

    if (proto.alimentosAlvoSugeridos && proto.alimentosAlvoSugeridos.length > 0) {
      setAlimentosAlvo(proto.alimentosAlvoSugeridos.join(", "));
    }

    if (proto.metasSemanaisSugeridas && proto.metasSemanaisSugeridas.length > 0) {
      setMetas(proto.metasSemanaisSugeridas);
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
    if (enviandoDevolutiva) return;
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

      ultimaAnotacaoSalvaRef.current = anotacoesInternas;
      const hora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      setStatusAutoSave(`✓ Salvo manualmente às ${hora}`);
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

        {/* SELETOR MOBILE ENTRE PRONTUÁRIO E DEVOLUTIVA (< lg) */}
        <div className="sticky top-2 z-20 flex items-center gap-2 lg:hidden bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button
            type="button"
            onClick={() => setSecaoMobile("prontuario")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              secaoMobile === "prontuario"
                ? "bg-[#2A546D] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:text-slate-900"
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            <span>Prontuário (56)</span>
          </button>
          <button
            type="button"
            onClick={() => setSecaoMobile("devolutiva")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              secaoMobile === "devolutiva"
                ? "bg-[#4C6C54] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:text-slate-900"
            }`}
          >
            <PenSquare className="h-4 w-4" />
            <span>Redigir Devolutiva</span>
          </button>
        </div>

        {/* CONTAINER COM DUAS ROLAGENS INDEPENDENTES */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 lg:overflow-hidden items-start">
          {/* ========================================================= */}
          {/* COLUNA DA ESQUERDA (7 COLS): ROLA AS 56 PERGUNTAS / DIÁRIO INDEPENDENTE */}
          {/* ========================================================= */}
          <section className={`${secaoMobile === "prontuario" ? "block" : "hidden"} lg:block lg:col-span-7 lg:h-full lg:overflow-y-auto pr-2 pb-12 space-y-4`}>
            {/* TÍTULO CONCEITUAL DO PAINEL DA ESQUERDA */}
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                <span>📋 Prontuário Clínico do Paciente (Anamnese & Diário)</span>
              </h2>
            </div>

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
                  <span>Diário Alimentar da Criança ({paciente.diario.length})</span>
                </button>
              </div>

              <span className="text-xs font-semibold text-slate-400 hidden xl:inline">
                Rolagem independente
              </span>
            </div>

            {/* INPUT DE BUSCA INSTANTÂNEA NAS 56 PERGUNTAS E RESPOSTAS */}
            {filtroPerguntas !== "diario" && (
              <div className="space-y-1.5">
                <div className="relative flex items-center">
                  <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={buscaPalavraChave}
                    onChange={(e) => setBuscaPalavraChave(e.target.value)}
                    placeholder="🔍 Buscar palavra-chave nas 56 perguntas ou respostas (ex: engasgo, telas, escola, leite)..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200/90 bg-white text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/30 focus:border-[#4C6C54] shadow-2xs transition-all"
                  />
                  {buscaPalavraChave && (
                    <button
                      type="button"
                      onClick={() => setBuscaPalavraChave("")}
                      className="absolute right-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Limpar busca"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {buscaPalavraChave && (
                  <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-semibold">
                    <span>
                      Mostrando {totalItensFiltrados} pergunta{totalItensFiltrados === 1 ? "" : "s"} para: &ldquo;{buscaPalavraChave}&rdquo;
                    </span>
                    <button
                      type="button"
                      onClick={() => setBuscaPalavraChave("")}
                      className="text-[#4C6C54] hover:underline font-bold cursor-pointer"
                    >
                      Limpar busca
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SEÇÃO DINÂMICA: DIÁRIO DA CRIANÇA OU ANAMNESE COMPLETA */}
            {filtroPerguntas === "diario" ? (
              <div className="space-y-4 pb-6">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 flex items-start gap-3 text-xs text-amber-950">
                  <Utensils className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-sm text-amber-950">
                      Diário Alimentar & Escada do Comer de {nomeCrianca}
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
                {totalItensFiltrados === 0 && buscaPalavraChave ? (
                  <div className="p-8 sm:p-12 text-center space-y-3 bg-white rounded-3xl border border-dashed border-slate-300 shadow-2xs">
                    <Search className="h-10 w-10 text-slate-300 mx-auto" />
                    <p className="text-base font-extrabold text-slate-800">
                      Nenhuma pergunta ou resposta encontrada para &ldquo;{buscaPalavraChave}&rdquo;
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Tente outros termos como &ldquo;leite&rdquo;, &ldquo;telas&rdquo;, &ldquo;engasgo&rdquo;, &ldquo;escola&rdquo;, &ldquo;fruta&rdquo; ou limpe a busca para ver todas.
                    </p>
                    <button
                      type="button"
                      onClick={() => setBuscaPalavraChave("")}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Limpar busca rápida</span>
                    </button>
                  </div>
                ) : (
                  secoesFiltradas.map((secao) => {
                    const itensFiltrados = secao.itens;
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

                          {/* BOX DE SUGESTÃO DE CONDUTA COM DOIS BOTÕES CLAROS */}
                          {item.pontoAtencao && (item.sugestaoConduta || item.leituraClinica || item.orientacaoPais) && (
                            <div className="mt-3.5 pt-3 border-t border-amber-200/80 space-y-3">
                              <div className="bg-white/95 p-3.5 sm:p-4 rounded-2xl border border-amber-200/90 shadow-2xs space-y-3">
                                {/* CABEÇALHO COM ÍCONE SVG ÚNICO E TEXTO LIMPO (SEM ✨ 💡) */}
                                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-amber-950">
                                  <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                                  <span>SUGESTÃO CLÍNICA DE APOIO PARA A NUTRI</span>
                                </div>

                                {/* 1. DIRECIONAMENTO TÉCNICO (PARA A NUTRI) */}
                                {(item.leituraClinica || item.sugestaoConduta) && (
                                  <div className="space-y-1 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                                      <Stethoscope className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                                      <span>Direcionamento Técnico (Para a Nutri):</span>
                                    </span>
                                    <p className="text-xs sm:text-[13px] text-slate-700 font-medium leading-relaxed">
                                      {item.leituraClinica || item.sugestaoConduta}
                                    </p>
                                  </div>
                                )}

                                {/* 2. SUGESTÃO DE TEXTO HUMANIZADO (PARA A FAMÍLIA) + META SUGERIDA */}
                                {(item.orientacaoPais || item.metaSugerida || (item.metasSugeridas && item.metasSugeridas[0])) && (
                                  <div className="space-y-2 bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100">
                                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                                      <MessageSquare className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                                      <span>Sugestão de Texto Humanizado (Para a Família) + Meta Sugerida:</span>
                                    </span>
                                    {item.orientacaoPais && (
                                      <p className="text-xs sm:text-[13px] text-slate-800 font-medium leading-relaxed italic">
                                        &ldquo;{item.orientacaoPais}&rdquo;
                                      </p>
                                    )}
                                    {(item.metaSugerida || (item.metasSugeridas && item.metasSugeridas[0])) && (
                                      <div className="pt-1.5 border-t border-emerald-200/60">
                                        <p className="text-xs text-emerald-950 font-bold flex items-center gap-1.5">
                                          <Target className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                                          <span>Meta Semanal Sugerida: {item.metaSugerida || item.metasSugeridas![0]}</span>
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* DOIS BOTÕES DE AÇÃO CLAROS (SEM + DUPLICADO) */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handleInserirSugestao(item)}
                                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-[#4C6C54] hover:bg-[#3D5A45] text-white text-xs font-extrabold transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-md"
                                  title="Inserir texto humanizado na Devolutiva Semanal ao lado e adicionar a meta prática correspondente"
                                >
                                  <Plus className="h-4 w-4" />
                                  <span>Inserir esta sugestão na Devolutiva ao lado</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleGuardarNasAnotacoesInternas(item)}
                                  className="w-full sm:w-auto px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                                  title="Guardar leitura clínica nas Anotações Internas confidenciais do Prontuário"
                                >
                                  <Lock className="h-3.5 w-3.5 text-slate-500" />
                                  <span>Guardar nas Anotações Internas</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>

          {/* ========================================================= */}
          {/* COLUNA DA DIREITA (5 COLS): ROLA DE FORMA INDEPENDENTE ATÉ O BOTÃO ENVIAR */}
          {/* ========================================================= */}
          <aside className={`${secaoMobile === "devolutiva" ? "block" : "hidden"} lg:block lg:col-span-5 lg:h-full lg:overflow-y-auto pl-2 pb-12 space-y-4`}>
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-md space-y-4">
              {/* ABAS DO PAINEL LATERAL (2 ABAS COM DISTINÇÃO CONCEITUAL CLARA) */}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <button
                  type="button"
                  onClick={() => setAbaDireita("devolutiva")}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer text-center inline-flex items-center justify-center gap-1.5 ${
                    abaDireita === "devolutiva"
                      ? "bg-[#4C6C54] text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  title="Plano prático, acolhedor e metas semanais que serão enviados diretamente para os pais"
                >
                  <Send className="h-4 w-4" />
                  <span>Enviar Devolutiva Semanal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAbaDireita("anotacoes")}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer text-center inline-flex items-center justify-center gap-1.5 ${
                    abaDireita === "anotacoes"
                      ? "bg-slate-800 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  title="Registro clínico privado e sigiloso da Dra. Laís sobre a consulta, hipóteses e condutas internas"
                >
                  <Lock className="h-4 w-4" />
                  <span>Evolução & Anotações</span>
                </button>
              </div>

              {/* CONTEÚDO 1: EDITOR DA DEVOLUTIVA SEMANAL */}
              {abaDireita === "devolutiva" && (
                <div className="space-y-4">
                  {/* SELETOR DE MODELOS RÁPIDOS DA DRA. LAÍS */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                        BANCO DE RESPOSTAS / MODELOS PRÓPRIOS
                      </label>
                      {!salvandoModeloInline && (
                        <button
                          type="button"
                          onClick={() => {
                            if (!parecerClinico.trim() && !alimentosAlvo.trim() && metas.length === 0) {
                              setFeedbackErro("Preencha ao menos o parecer para salvar como modelo.");
                              setTimeout(() => setFeedbackErro(""), 3500);
                              return;
                            }
                            setSalvandoModeloInline(true);
                            setErroSalvarModelo("");
                          }}
                          className="text-xs font-extrabold text-[#4C6C54] hover:text-[#3a5340] hover:bg-[#4C6C54]/10 border border-[#4C6C54]/30 py-1 px-2.5 rounded-xl inline-flex items-center gap-1 cursor-pointer transition-all bg-white shadow-2xs"
                          title="Salvar o parecer, alimentos e metas atuais como um modelo reutilizável"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Salvar texto atual como modelo</span>
                        </button>
                      )}
                    </div>

                    {/* MINI-FORM INLINE PARA SALVAR MODELO */}
                    {salvandoModeloInline && (
                      <div className="p-3 bg-amber-50/95 rounded-2xl border border-amber-300 shadow-2xs space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                            <Save className="h-3.5 w-3.5 text-amber-700" />
                            <span>Salvar modelo próprio (parecer, alimentos e metas)</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSalvandoModeloInline(false);
                              setNomeModeloInput("");
                              setErroSalvarModelo("");
                            }}
                            className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                            title="Cancelar"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            autoFocus
                            value={nomeModeloInput}
                            onChange={(e) => setNomeModeloInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleConfirmarSalvarModelo();
                              if (e.key === "Escape") setSalvandoModeloInline(false);
                            }}
                            placeholder="Título do Modelo (ex: Conduta para Desmame de Telas)"
                            className="flex-1 px-3 py-1.5 rounded-xl border border-amber-300 bg-white text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/30"
                          />
                          <button
                            type="button"
                            onClick={handleConfirmarSalvarModelo}
                            disabled={salvandoModeloProprio}
                            className="px-3.5 py-1.5 rounded-xl bg-[#4C6C54] hover:bg-[#3a5340] text-white font-extrabold text-xs transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>{salvandoModeloProprio ? "Salvando..." : "Salvar Modelo"}</span>
                          </button>
                        </div>

                        {erroSalvarModelo && (
                          <p className="text-[11px] font-bold text-rose-600">{erroSalvarModelo}</p>
                        )}
                      </div>
                    )}

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

                  {/* PARECER CLÍNICO DA SEMANA */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
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
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#4C6C54] hover:bg-[#3D5A45] text-white font-black text-sm sm:text-base transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enviandoDevolutiva ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Enviando Devolutiva para a Família...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Enviar Devolutiva para a Família 💌</span>
                      </>
                    )}
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
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                        Anotações Clínicas & Hipóteses Diagnósticas
                      </label>
                      {statusAutoSave && (
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 transition-all ${
                            statusAutoSave.includes("Salvando")
                              ? "bg-amber-100 text-amber-900 animate-pulse"
                              : statusAutoSave.includes("✓")
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {statusAutoSave.includes("Salvando") ? (
                            <Clock className="h-3 w-3 animate-spin" />
                          ) : statusAutoSave.includes("✓") ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 text-rose-600" />
                          )}
                          <span>{statusAutoSave}</span>
                        </span>
                      )}
                    </div>
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
                        : "Salvar Anotações Internas do Prontuário"}
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
