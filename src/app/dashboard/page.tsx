"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  PlayCircle, Calendar as CalendarIcon, Utensils, Sparkles, 
  ArrowRight, CheckCircle2, Plus, X, Check, Video, User,
  ChevronDown, CreditCard, ClipboardCheck, Settings, LogOut, Crown
} from "lucide-react";

interface RefeicaoHoje {
  id: number;
  refeicao: "Café" | "Almoço" | "Lanche" | "Jantar";
  alimento: string;
  etapa: string;
  reacaoEmoji: string;
  reacaoTexto: string;
}

export default function PaginaDashboard() {
  const hoje = "2026-09-22";

  const [modalAberto, setModalAberto] = useState(false);
  const [toastMensagem, setToastMensagem] = useState("");

  // Estado do Perfil e Assinatura
  const [menuPerfilAberto, setMenuPerfilAberto] = useState(false);
  const menuPerfilRef = useRef<HTMLDivElement>(null);

  const [dadosPlano] = useState({
    plano: 'Trimestral',
    status: 'ativo' as 'ativo' | 'expirando' | 'inativo',
    vencimento: '18/10/2026',
    diasRestantes: 24,
    valorCiclo: 'R$ 239,70',
    responsavel: 'Lucas Lima',
    email: 'lucas@email.com',
    crianca: 'Pedro'
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuPerfilRef.current && !menuPerfilRef.current.contains(event.target as Node)) {
        setMenuPerfilAberto(false);
      }
    }
    if (menuPerfilAberto) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuPerfilAberto]);

  // Estado do formulário do modal
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
    { label: "Interagiu c/ talher", icone: "🖐️", slug: "tocou" as const },
    { label: "Cheirou voluntariamente", icone: "👃", slug: "cheirou" as const },
    { label: "Tocou com os dedos", icone: "✋", slug: "tocou" as const },
    { label: "Encostou nos lábios", icone: "👄", slug: "provou" as const },
    { label: "Provou / Lambeu", icone: "👅", slug: "provou" as const },
    { label: "Comeu e engoliu", icone: "😋", slug: "comeu" as const }
  ];

  const [refeicoesHoje, setRefeicoesHoje] = useState<RefeicaoHoje[]>([
    {
      id: 1,
      refeicao: "Almoço",
      alimento: "Brócolis 🥦",
      etapa: "👃 Cheirou voluntariamente",
      reacaoEmoji: "😊",
      reacaoTexto: "Positivo"
    },
    {
      id: 2,
      refeicao: "Lanche",
      alimento: "Maçã em fatias 🍎",
      etapa: "👀 Tolerou no prato",
      reacaoEmoji: "😐",
      reacaoTexto: "Neutro"
    }
  ]);

  // Compromissos com suporte a check direto na Home
  const [compromissosSemana, setCompromissosSemana] = useState([
    {
      id: 1,
      dia: "22",
      mes: "SET",
      ehHoje: true,
      titulo: "Meta do Dia: Oferecer vegetal no prato de apoio",
      horario: "12:30",
      tipo: "Meta Alimentar",
      concluido: false
    },
    {
      id: 2,
      dia: "27",
      mes: "SET",
      ehHoje: false,
      titulo: "Consulta Nutricional (Retorno com Dra. Laís)",
      horario: "14:00 - 15:00",
      tipo: "Consulta",
      linkMeet: "https://meet.google.com",
      concluido: false
    },
    {
      id: 3,
      dia: "28",
      mes: "SET",
      ehHoje: false,
      titulo: "Introduzir nova fruta (Maçã em fatias finas)",
      horario: "09:00 • Lembrete",
      tipo: "Meta Alimentar",
      concluido: false
    }
  ]);

  const toggleConcluirCompromisso = (id: number) => {
    setCompromissosSemana(prev =>
      prev.map(c => c.id === id ? { ...c, concluido: !c.concluido } : c)
    );
  };

  const salvarRefeicao = (e: React.FormEvent) => {
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
      reacaoTexto: textoReacao
    };

    setRefeicoesHoje([nova, ...refeicoesHoje]);
    setNovoAlimento("");
    setNovoDetalhe("");
    setModalAberto(false);

    setToastMensagem(`Conquista com ${nova.alimento} registrada! 🎉`);
    setTimeout(() => setToastMensagem(""), 3500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 animation-fade-in pb-2 relative">
      
      {/* TOAST DE FEEDBACK */}
      {toastMensagem && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 bg-[#4C6C54] text-white text-xs font-bold rounded-xl shadow-xl flex items-center gap-2.5 animation-fade-in border border-emerald-400/30">
          <Sparkles className="h-4 w-4 text-amber-300 shrink-0" />
          <span>{toastMensagem}</span>
          <button type="button" onClick={() => setToastMensagem("")} className="text-white/70 hover:text-white ml-2 cursor-pointer">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* CABEÇALHO */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#4C6C54] flex items-center gap-2">
            Boa tarde! 👋
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Aqui está o resumo da jornada do seu pequeno hoje.
          </p>
        </div>

        {/* PERFIL & ASSINATURA */}
        <div className="relative" ref={menuPerfilRef}>
          <button
            type="button"
            onClick={() => setMenuPerfilAberto(!menuPerfilAberto)}
            className="flex items-center gap-2 p-1.5 pl-2.5 rounded-full bg-white/90 hover:bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/30"
            aria-expanded={menuPerfilAberto}
            aria-label="Menu de perfil e assinatura"
          >
            {/* Badge Interativo do Status do Plano */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                dadosPlano.diasRestantes <= 7
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-emerald-50 border-emerald-200 text-emerald-800"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${
                  dadosPlano.diasRestantes <= 7
                    ? "bg-amber-500 animate-pulse"
                    : "bg-emerald-500 animate-pulse"
                }`}
              />
              <span className="hidden sm:inline">
                {dadosPlano.diasRestantes <= 7
                  ? `Expira em ${dadosPlano.diasRestantes} dias`
                  : `Plano ${dadosPlano.plano} • Ativo`}
              </span>
              <span className="sm:hidden font-bold">
                {dadosPlano.diasRestantes <= 7 ? "Expira em breve" : "Trimestral"}
              </span>
            </div>

            {/* Avatar do Usuário */}
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#4C6C54] to-[#689373] text-white flex items-center justify-center font-extrabold text-xs shadow-xs ring-2 ring-white">
              LL
            </div>

            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 mr-1 ${
                menuPerfilAberto ? "rotate-180 text-[#4C6C54]" : ""
              }`}
            />
          </button>

          {/* DROPDOWN FLUTUANTE DE PERFIL E ASSINATURA */}
          {menuPerfilAberto && (
            <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl p-4 space-y-3.5 z-50 animation-fade-in divide-y divide-slate-100">
              {/* CABEÇALHO */}
              <div className="flex items-start justify-between pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-[#4C6C54] to-[#689373] text-white flex items-center justify-center font-extrabold text-sm shadow-sm ring-2 ring-emerald-50 shrink-0">
                    LL
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm leading-tight">
                      {dadosPlano.responsavel}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      {dadosPlano.email}
                    </p>
                    <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EB6D57]/10 text-[#EB6D57] border border-[#EB6D57]/20">
                      <span>👦 {dadosPlano.crianca}</span>
                      <span className="text-slate-400 font-normal">• 3 anos</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD DE ASSINATURA RÁPIDA */}
              <div className="pt-3">
                <div className="bg-gradient-to-br from-slate-50 to-emerald-50/40 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="h-6 w-6 rounded-lg bg-[#4C6C54]/10 text-[#4C6C54] flex items-center justify-center">
                        <Crown className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        Plano {dadosPlano.plano}
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 tracking-wider">
                      Ativo
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center justify-between font-medium">
                    <span>Próxima renovação:</span>
                    <strong className="text-slate-700">{dadosPlano.vencimento}</strong>
                  </div>

                  <Link
                    href="/pagamento?origem=upgrade"
                    onClick={() => setMenuPerfilAberto(false)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-[#4C6C54] hover:bg-[#3a5340] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer group/cta"
                  >
                    <span>Renovar ou Alterar Plano</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover/cta:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* AÇÕES DE NAVEGAÇÃO */}
              <div className="pt-3 space-y-1">
                <Link
                  href="/configuracoes?aba=faturas"
                  onClick={() => setMenuPerfilAberto(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold text-xs transition-colors"
                >
                  <CreditCard className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Minha Assinatura & Faturas</span>
                </Link>

                <Link
                  href="/anamnese?modo=visualizacao"
                  onClick={() => setMenuPerfilAberto(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold text-xs transition-colors"
                >
                  <ClipboardCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div className="flex-1 flex items-center justify-between">
                    <span>Ver Anamnese Concluída</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Enviada
                    </span>
                  </div>
                </Link>

                <Link
                  href="/configuracoes?aba=perfil"
                  onClick={() => setMenuPerfilAberto(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold text-xs transition-colors text-left cursor-pointer"
                >
                  <Settings className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Configurações de Conta</span>
                </Link>

                <Link
                  href="/"
                  onClick={() => setMenuPerfilAberto(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4 text-red-500 shrink-0" />
                  <span>Sair</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* GRID PRINCIPAL: 7 COLUNAS / 5 COLUNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        
        {/* COLUNA ESQUERDA (7 COLUNAS): CURSOS + CALENDÁRIO DA SEMANA */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          
          {/* CARD 1: CURSO */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#EB6D57]/10 text-[#EB6D57] flex items-center justify-center shrink-0">
                  <PlayCircle className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    Continue de onde parou
                  </span>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-800 leading-snug">
                    Terapia Alimentar Descomplicada
                  </h2>
                </div>
              </div>

              <Link
                href="/dashboard/cursos"
                className="px-4 py-2 bg-[#EB6D57] hover:bg-[#d95a44] text-white font-bold text-xs rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-1"
              >
                Continuar <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="space-y-1 pt-1 border-t border-slate-100">
              <div className="flex justify-between text-[11px] font-bold text-slate-500">
                <span>Progresso do Módulo</span>
                <span className="text-[#EB6D57]">30%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#EB6D57] rounded-full w-[30%] transition-all duration-300" />
              </div>
            </div>
          </div>

          {/* CARD 2: COMPROMISSOS DA SEMANA */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex-1 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-[#2A546D]" />
                <h3 className="text-sm font-extrabold text-slate-800">
                  Compromissos da Semana
                </h3>
              </div>
              <span className="text-[10px] font-semibold text-[#2A546D] bg-[#2A546D]/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Sincronizado
              </span>
            </div>

            {/* LISTAGEM DOS EVENTOS DA SEMANA */}
            <div className="space-y-2">
              {compromissosSemana.map((comp) => (
                <div
                  key={comp.id}
                  className={`p-2.5 sm:p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    comp.ehHoje
                      ? "bg-[#4C6C54]/5 border-[#4C6C54]/30"
                      : "bg-slate-50/60 border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox para metas ou badge de calendário */}
                    {comp.ehHoje ? (
                      <button
                        type="button"
                        onClick={() => toggleConcluirCompromisso(comp.id)}
                        className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          comp.concluido
                            ? "bg-[#4C6C54] text-white"
                            : "border-2 border-[#4C6C54] bg-white text-[#4C6C54] hover:bg-[#4C6C54]/10"
                        }`}
                        title={comp.concluido ? "Desmarcar" : "Marcar como concluída"}
                      >
                        {comp.concluido ? <Check className="h-5 w-5" /> : <span className="text-xs font-black">22</span>}
                      </button>
                    ) : (
                      <div className="h-10 w-10 rounded-xl flex flex-col items-center justify-center font-bold shrink-0 bg-white border border-slate-200 text-slate-700">
                        <span className="text-[9px] uppercase leading-none">{comp.mes}</span>
                        <span className="text-sm leading-none mt-0.5">{comp.dia}</span>
                      </div>
                    )}

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                          comp.tipo === "Consulta" ? "bg-[#2A546D] text-white" : "bg-[#EB6D57]/10 text-[#EB6D57]"
                        }`}>
                          {comp.tipo}
                        </span>
                        {comp.ehHoje && (
                          <span className="text-[9px] font-extrabold text-[#4C6C54] bg-[#4C6C54]/15 px-1.5 py-0.2 rounded">
                            Hoje
                          </span>
                        )}
                      </div>
                      <h4 className={`text-xs font-bold text-slate-800 leading-tight ${comp.concluido ? "line-through text-slate-400" : ""}`}>
                        {comp.titulo}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {comp.horario}
                      </p>
                    </div>
                  </div>

                  {/* Botão de chamada para consulta */}
                  {comp.linkMeet && (
                    <a
                      href={comp.linkMeet}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-[#2A546D] hover:bg-[#204054] text-white font-bold text-[11px] rounded-lg transition-all shadow-xs shrink-0 flex items-center gap-1.5"
                    >
                      <Video className="h-3 w-3" /> Meet
                    </a>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 text-center">
              <Link
                href="/dashboard/calendario"
                className="text-xs font-bold text-[#2A546D] hover:underline inline-flex items-center gap-1"
              >
                Ver calendário completo <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

        </div>

        {/* COLUNA DIREITA (5 COLUNAS): DIÁRIO + 5 DEGRAUS DA ESCALADA */}
        <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-3.5">
          
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">Diário Alimentar</h3>
                <p className="text-[11px] text-slate-400">Jornada de aproximação sensorial</p>
              </div>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                Hoje
              </span>
            </div>

            {/* MÉTRICAS COMPLETAS DA ESCALADA DO COMER (5 DEGRAUS) */}
            <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-2 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-[#EB6D57]" /> Essa semana a criança:
                </span>
                <span className="text-[10px] font-black text-[#4C6C54] bg-[#4C6C54]/10 px-2 py-0.5 rounded-md">
                  +6 conquistas
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1 text-center">
                <div className="bg-white p-1.5 rounded-lg border border-slate-100 shadow-2xs">
                  <span className="text-xs">👀</span>
                  <p className="text-xs font-black text-slate-800">3</p>
                  <span className="text-[8px] text-slate-400 font-bold uppercase truncate block">Tolerou</span>
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-slate-100 shadow-2xs">
                  <span className="text-xs">👃</span>
                  <p className="text-xs font-black text-slate-800">1</p>
                  <span className="text-[8px] text-slate-400 font-bold uppercase truncate block">Cheirou</span>
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-slate-100 shadow-2xs">
                  <span className="text-xs">🖐️</span>
                  <p className="text-xs font-black text-slate-800">1</p>
                  <span className="text-[8px] text-slate-400 font-bold uppercase truncate block">Tocou</span>
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-slate-100 shadow-2xs">
                  <span className="text-xs">👅</span>
                  <p className="text-xs font-black text-slate-400">0</p>
                  <span className="text-[8px] text-slate-400 font-bold uppercase truncate block">Provou</span>
                </div>
                <div className="bg-white p-1.5 rounded-lg border border-slate-100 shadow-2xs">
                  <span className="text-xs">😋</span>
                  <p className="text-xs font-black text-slate-800">1</p>
                  <span className="text-[8px] text-slate-400 font-bold uppercase truncate block">Comeu</span>
                </div>
              </div>
            </div>

            {/* REFEIÇÕES DE HOJE (SEM SCROLLBAR FORÇADA) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Refeições de Hoje
                </span>
                <Link href="/dashboard/diario" className="text-[11px] font-bold text-[#4C6C54] hover:underline">
                  Ver histórico →
                </Link>
              </div>

              <div className="space-y-1.5">
                {refeicoesHoje.map((ref) => (
                  <div 
                    key={ref.id}
                    className="p-2.5 bg-white border border-slate-100 rounded-xl shadow-2xs flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="text-[9px] font-extrabold uppercase text-[#EB6D57] bg-[#EB6D57]/10 px-1.5 py-0.2 rounded">
                        {ref.refeicao}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 mt-0.5">{ref.alimento}</h4>
                      <p className="text-[10px] text-slate-500">{ref.etapa}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base">{ref.reacaoEmoji}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BOTÃO QUE ABRE O MODAL COMPACTO */}
          <button
            type="button"
            onClick={() => setModalAberto(true)}
            className="w-full py-2.5 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 mt-2"
          >
            <Plus className="h-4 w-4" /> Registrar Refeição
          </button>

        </div>

      </div>

      {/* MODAL ZERO-SCROLL COM AUTOCOMPLETE */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 animation-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 space-y-3.5 shadow-2xl border border-slate-100">
            
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

            <form onSubmit={salvarRefeicao} className="space-y-3">
              
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
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4C6C54] focus:bg-white"
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
                        className="w-full px-3 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-[#4C6C54]/10 hover:text-[#4C6C54] transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <span>{sug}</span>
                      </button>
                    ))}
                  </div>
                )}

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

              {/* REAÇÃO DA CRIANÇA */}
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
                  className="w-full h-8 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#4C6C54] focus:bg-white"
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