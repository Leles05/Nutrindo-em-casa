"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, User, CreditCard, Shield, ShieldCheck, CheckCircle2,
  Calendar, Lock, Bell, Download, ExternalLink, Sparkles,
  Crown, Smartphone, Laptop, AlertCircle, FileText, Check,
  ChevronRight, X, Eye, EyeOff, AlertTriangle, RefreshCw,
  FileDown, Info, Clock, LogOut, CheckSquare
} from "lucide-react";

type AbaConfiguracao = "perfil" | "faturas" | "seguranca";

// Utilitários de máscara
function maskCPF(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

// Cálculo dinâmico de idade a partir de data ISO YYYY-MM-DD
function calcularIdade(dataNasc: string): string {
  if (!dataNasc) return "";
  const partes = dataNasc.split("-");
  if (partes.length !== 3) return "";
  const ano = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10) - 1;
  const dia = parseInt(partes[2], 10);

  const hoje = new Date();
  let anos = hoje.getFullYear() - ano;
  let meses = hoje.getMonth() - mes;
  let dias = hoje.getDate() - dia;

  if (dias < 0) {
    meses -= 1;
  }
  if (meses < 0) {
    anos -= 1;
    meses += 12;
  }

  if (anos < 0) return "Data futura";
  if (anos === 0) {
    if (meses === 0) return "Menos de 1 mês";
    return `${meses} ${meses === 1 ? "mês" : "meses"}`;
  }
  if (meses === 0) {
    return `${anos} ${anos === 1 ? "ano" : "anos"}`;
  }
  return `${anos} ${anos === 1 ? "ano" : "anos"} e ${meses} ${meses === 1 ? "mês" : "meses"}`;
}

// Avaliação de força de senha
function calcularForcaSenha(senha: string): {
  forca: "vazia" | "fraca" | "media" | "forte";
  porcentagem: number;
  cor: string;
  rotulo: string;
} {
  if (!senha) {
    return { forca: "vazia", porcentagem: 0, cor: "bg-slate-200", rotulo: "Digite uma nova senha" };
  }
  let pontos = 0;
  if (senha.length >= 8) pontos += 1;
  if (senha.length >= 12) pontos += 1;
  if (/[A-Z]/.test(senha)) pontos += 1;
  if (/[0-9]/.test(senha)) pontos += 1;
  if (/[^A-Za-z0-9]/.test(senha)) pontos += 1;

  if (pontos <= 2) {
    return { forca: "fraca", porcentagem: 33, cor: "bg-rose-500", rotulo: "Fraca (adicione números ou caracteres especiais)" };
  }
  if (pontos <= 4) {
    return { forca: "media", porcentagem: 66, cor: "bg-amber-500", rotulo: "Média (boa, adicione mais caracteres para fortificar)" };
  }
  return { forca: "forte", porcentagem: 100, cor: "bg-emerald-500", rotulo: "Forte (excelente proteção de segurança)" };
}

function ConteudoConfiguracoes() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const abaParam = searchParams.get("aba") as AbaConfiguracao | null;

  const [abaAtiva, setAbaAtiva] = useState<AbaConfiguracao>(
    abaParam === "faturas" || abaParam === "seguranca" ? abaParam : "perfil"
  );

  const [salvando, setSalvando] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Sincroniza estado com searchParams da URL quando mudar externamente
  useEffect(() => {
    if (abaParam && (abaParam === "perfil" || abaParam === "faturas" || abaParam === "seguranca")) {
      setAbaAtiva(abaParam);
    }
  }, [abaParam]);

  const trocarAba = (novaAba: AbaConfiguracao) => {
    setAbaAtiva(novaAba);
    router.push(`/configuracoes?aba=${novaAba}`, { scroll: false });
  };

  const dispararToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  // ===========================================================================
  // ESTADOS - ABA 1: PERFIL & CRIANÇA
  // ===========================================================================
  const [dadosUsuario, setDadosUsuario] = useState({
    nome: "Lucas Lima",
    email: "lucas@email.com",
    telefone: "(11) 98888-7777",
    cpf: "384.192.837-12",
    nomeCrianca: "Pedro Lima",
    nascimentoCrianca: "2023-05-14",
    diagnostico: "Recusa alimentar seletiva, sensibilidade a texturas pastosas e alergia a proteína do leite (APLV sob investigação)"
  });

  const idadeCalculada = calcularIdade(dadosUsuario.nascimentoCrianca);

  const handleSalvarPerfil = (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setTimeout(() => {
      setSalvando(false);
      dispararToast("Informações do perfil e da criança salvas com sucesso!");
    }, 600);
  };

  const handleDownloadProntuario = () => {
    dispararToast("Gerando cópia clínica da Anamnese em PDF... Download iniciado!");
  };

  // ===========================================================================
  // ESTADOS - ABA 2: ASSINATURA & CANCELAMENTO
  // ===========================================================================
  const [statusAssinatura, setStatusAssinatura] = useState<"ativo" | "cancelamento_agendado">("ativo");
  const [modalCancelamento, setModalCancelamento] = useState(false);
  const [etapaCancelamento, setEtapaCancelamento] = useState<1 | 2 | 3>(1);
  const [motivoCancelamento, setMotivoCancelamento] = useState<string>("");
  const [outroMotivoTexto, setOutroMotivoTexto] = useState("");

  const faturas = [
    {
      id: "FAT-84920",
      data: "18/07/2026",
      descricao: "Plano Trimestral (Jul - Out/2026)",
      valor: "R$ 239,70",
      metodo: "Cartão de Crédito Mastercard •••• 4242",
      status: "Pago"
    },
    {
      id: "FAT-71029",
      data: "18/04/2026",
      descricao: "Plano Trimestral (Abr - Jul/2026)",
      valor: "R$ 239,70",
      metodo: "PIX Recorrente Asaas",
      status: "Pago"
    },
    {
      id: "FAT-59201",
      data: "18/01/2026",
      descricao: "Plano Trimestral (Jan - Abr/2026)",
      valor: "R$ 239,70",
      metodo: "Cartão de Crédito Mastercard •••• 4242",
      status: "Pago"
    }
  ];

  const handleAbrirCancelamento = () => {
    setEtapaCancelamento(1);
    setMotivoCancelamento("");
    setOutroMotivoTexto("");
    setModalCancelamento(true);
  };

  const handleConfirmarCancelamento = () => {
    setStatusAssinatura("cancelamento_agendado");
    setModalCancelamento(false);
    dispararToast("Cancelamento agendado. Seu acesso continuará ativo até 18/10/2026.");
  };

  const handleReativarAssinatura = () => {
    setStatusAssinatura("ativo");
    dispararToast("Assinatura reativada com sucesso! Bem-vindo(a) de volta.");
  };

  // ===========================================================================
  // ESTADOS - ABA 3: SEGURANÇA & PREFERÊNCIAS
  // ===========================================================================
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [verSenhas, setVerSenhas] = useState(false);

  // Sessões ativas
  const [dispositivos, setDispositivos] = useState([
    {
      id: "dev-1",
      nome: "Chrome no Windows",
      tipo: "Computador",
      local: "São Paulo, SP • Sessão Atual",
      ativoAgora: true,
      icone: Laptop
    },
    {
      id: "dev-2",
      nome: "Safari no iPhone",
      tipo: "Celular",
      local: "São Paulo, SP • Último acesso há 2 dias",
      ativoAgora: false,
      icone: Smartphone
    }
  ]);

  // Notificações
  const [notifDiario, setNotifDiario] = useState(true);
  const [horarioDiario, setHorarioDiario] = useState("19:30");
  const [notifAulas, setNotifAulas] = useState(true);
  const [canalEmail, setCanalEmail] = useState(true);
  const [canalWhats, setCanalWhats] = useState(true);

  // Modal LGPD / Política
  const [modalLGPD, setModalLGPD] = useState(false);

  const forcaSenha = calcularForcaSenha(novaSenha);

  const handleAtualizarSenha = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senhaAtual) {
      dispararToast("Por favor, digite sua senha atual.");
      return;
    }
    if (novaSenha.length < 8) {
      dispararToast("A nova senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      dispararToast("A confirmação não coincide com a nova senha.");
      return;
    }
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarSenha("");
    dispararToast("Senha alterada com sucesso!");
  };

  const handleDesconectarOutros = () => {
    setDispositivos((prev) => prev.filter((d) => d.ativoAgora));
    dispararToast("Você foi desconectado com sucesso de todos os outros aparelhos!");
  };

  const handleExportarDados = () => {
    const dadosExportados = {
      geradoEm: new Date().toISOString(),
      responsavel: dadosUsuario,
      plano: {
        tipo: "Trimestral",
        status: statusAssinatura,
        proximaRenovacao: "18/10/2026",
        gateway: "Asaas Pagamentos"
      },
      faturas: faturas,
      seguranca: {
        dispositivosConectados: dispositivos.length,
        notificacoes: {
          lembreteDiario: notifDiario,
          horarioDiario,
          novasAulas: notifAulas,
          canais: { email: canalEmail, whatsapp: canalWhats }
        }
      }
    };

    const blob = new Blob([JSON.stringify(dadosExportados, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dados-nutrindo-em-casa-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    dispararToast("Arquivo com todos os seus dados gerado com sucesso (LGPD)!");
  };

  return (
    <div className="min-h-screen bg-[#F0EAE1] text-slate-800 font-sans pb-20">
      {/* TOAST DE FEEDBACK GLOBAL */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-[#4C6C54] text-white text-xs sm:text-sm font-bold rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-300 border border-emerald-400/30">
          <CheckCircle2 className="h-5 w-5 text-emerald-300 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* HEADER DA PÁGINA */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar ao Dashboard</span>
            <span className="sm:hidden">Voltar</span>
          </Link>

          <Link href="/dashboard" className="relative h-8 w-28 block">
            <Image
              src="/logo-transparente.png"
              alt="Nutrindo em Casa"
              fill
              className="object-contain"
              priority
            />
          </Link>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#4C6C54] to-[#689373] text-white flex items-center justify-center font-bold text-xs ring-2 ring-emerald-50">
              LL
            </div>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        
        {/* TÍTULO */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Minha Conta & Configurações
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gerencie seus dados pessoais, prontuário da criança, assinatura e segurança.
          </p>
        </div>

        {/* NAVEGAÇÃO POR ABAS / TABS */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl mb-8 overflow-x-auto shadow-inner">
          <button
            type="button"
            onClick={() => trocarAba("perfil")}
            className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
              abaAtiva === "perfil"
                ? "bg-white text-[#4C6C54] shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <User className="h-4 w-4" />
            <span>Meus Dados & Criança</span>
          </button>

          <button
            type="button"
            onClick={() => trocarAba("faturas")}
            className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
              abaAtiva === "faturas"
                ? "bg-white text-[#4C6C54] shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Assinatura & Faturas</span>
            {statusAssinatura === "ativo" ? (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded ml-1">
                Ativo
              </span>
            ) : (
              <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded ml-1">
                Encerra 18/10
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => trocarAba("seguranca")}
            className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shrink-0 ${
              abaAtiva === "seguranca"
                ? "bg-white text-[#4C6C54] shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Segurança & Preferências</span>
          </button>
        </div>

        {/* ===================================================================== */}
        {/* ABA 1: MEUS DADOS & CRIANÇA */}
        {/* ===================================================================== */}
        {abaAtiva === "perfil" && (
          <form onSubmit={handleSalvarPerfil} className="space-y-6 animate-in fade-in duration-300">
            {/* CARD 1: DADOS DO RESPONSÁVEL */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <User className="h-4 w-4 text-[#4C6C54]" />
                    Dados do Responsável
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Informações de contato e identificação da titular da conta</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nome Completo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={dadosUsuario.nome}
                    onChange={(e) => setDadosUsuario({ ...dadosUsuario, nome: e.target.value })}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    E-mail de Acesso <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={dadosUsuario.email}
                    onChange={(e) => setDadosUsuario({ ...dadosUsuario, email: e.target.value })}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    WhatsApp (com DDD) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={dadosUsuario.telefone}
                    onChange={(e) => setDadosUsuario({ ...dadosUsuario, telefone: maskPhone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] focus:bg-white transition-all"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Utilizado para lembretes diários e contato com a Dra. Laís</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    CPF (Documento Fiscal) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={dadosUsuario.cpf}
                    onChange={(e) => setDadosUsuario({ ...dadosUsuario, cpf: maskCPF(e.target.value) })}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] focus:bg-white transition-all"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Utilizado na emissão automática das notas fiscais no Asaas</span>
                </div>
              </div>
            </div>

            {/* CARD 2: DADOS DA CRIANÇA */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EB6D57]/10 text-[#EB6D57] mb-1">
                    <span>👦 Paciente Pediátrico em Acompanhamento</span>
                  </div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-800">
                    Dados da Criança
                  </h2>
                  <p className="text-xs text-slate-500">Parâmetros essenciais para a individualização das orientações e metas</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nome da Criança <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={dadosUsuario.nomeCrianca}
                    onChange={(e) => setDadosUsuario({ ...dadosUsuario, nomeCrianca: e.target.value })}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Data de Nascimento <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dadosUsuario.nascimentoCrianca}
                    onChange={(e) => setDadosUsuario({ ...dadosUsuario, nascimentoCrianca: e.target.value })}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Idade Atual (Calculada)
                  </label>
                  <div className="h-11 px-3.5 bg-[#4C6C54]/10 border border-[#4C6C54]/20 rounded-xl flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-extrabold text-[#4C6C54]">
                      {idadeCalculada || "Informe a data"}
                    </span>
                    <span className="text-[10px] font-bold text-[#4C6C54] bg-white px-2 py-0.5 rounded-md shadow-2xs">
                      Dinâmica
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Diagnósticos Conhecidos, Seletividades e Alergias Alimentares
                  </label>
                  <textarea
                    rows={3}
                    value={dadosUsuario.diagnostico}
                    onChange={(e) => setDadosUsuario({ ...dadosUsuario, diagnostico: e.target.value })}
                    placeholder="Ex: Alergia a leite de vaca, seletividade sensorial, intolerância a glúten..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* CARD 3: ATALHO DO PRONTUÁRIO / ANAMNESE */}
            <div className="bg-gradient-to-br from-white to-[#F0EAE1]/40 rounded-3xl p-6 sm:p-7 border border-[#4C6C54]/25 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="h-12 w-12 rounded-2xl bg-[#4C6C54] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold text-slate-900">
                        Anamnese Nutricional Pediátrica
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" /> Concluída em 15/09/2026
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 max-w-xl">
                      Prontuário completo contendo os 56 parâmetros clínicos, histórico perinatal, introdução alimentar e mapeamento dos grupos alimentares respondidos.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                  <Link
                    href="/anamnese?modo=visualizacao"
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-white border border-slate-300 hover:border-slate-400 text-slate-800 text-xs font-bold rounded-xl shadow-xs transition-all hover:bg-slate-50 cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-[#4C6C54]" />
                    <span>Visualizar Respostas</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleDownloadProntuario}
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#4C6C54] hover:bg-[#3a5340] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Baixar Cópia Clínica (PDF)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* AÇÃO: SALVAR ALTERAÇÕES */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={salvando}
                className="py-3 px-7 bg-[#4C6C54] hover:bg-[#3a5340] active:scale-[0.98] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
              >
                {salvando ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Salvando Alterações...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ===================================================================== */}
        {/* ABA 2: ASSINATURA & FATURAS */}
        {/* ===================================================================== */}
        {abaAtiva === "faturas" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* AVISO SE CANCELAMENTO AGENDADO */}
            {statusAssinatura === "cancelamento_agendado" && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5 text-amber-900">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-extrabold block text-sm">Cancelamento de renovação agendado</strong>
                    <span>
                      Seu plano permanecerá com acesso 100% liberado até <strong>18 de Outubro de 2026</strong>. Nenhuma cobrança futura será realizada.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleReativarAssinatura}
                  className="py-2 px-4 bg-[#4C6C54] hover:bg-[#3a5340] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap self-end sm:self-center flex items-center gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Reativar Assinatura</span>
                </button>
              </div>
            )}

            {/* CARD DO PLANO VIGENTE */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-start gap-3.5">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#4C6C54] to-[#689373] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Crown className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-extrabold text-slate-900">
                        Plano Trimestral
                      </h2>
                      {statusAssinatura === "ativo" ? (
                        <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Ativo
                        </span>
                      ) : (
                        <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Cancelamento Agendado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      R$ 79,90/mês — cobrança de <strong className="text-slate-700">R$ 239,70</strong> a cada ciclo trimestral
                    </p>
                  </div>
                </div>

                <Link
                  href="/pagamento?origem=upgrade"
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#4C6C54] hover:bg-[#3a5340] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Fazer Upgrade de Plano</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-bold block uppercase text-[10px] tracking-wider">
                    {statusAssinatura === "ativo" ? "Próxima Renovação" : "Término do Acesso"}
                  </span>
                  <strong className="text-slate-800 text-sm font-extrabold mt-0.5 block">18 de Outubro de 2026</strong>
                  <span className="text-emerald-700 font-semibold text-[11px] mt-0.5 block">
                    Restam 24 dias de vigência
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-bold block uppercase text-[10px] tracking-wider">Forma de Pagamento</span>
                  <strong className="text-slate-800 text-sm font-extrabold mt-0.5 block">Mastercard •••• 4242</strong>
                  <span className="text-slate-500 text-[11px] mt-0.5 block">Cartão de Crédito Recorrente</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-bold block uppercase text-[10px] tracking-wider">Processador Asaas</span>
                  <strong className="text-slate-800 text-sm font-extrabold mt-0.5 block">Assinatura Ativa</strong>
                  <span className="text-slate-500 text-[11px] mt-0.5 block">ID #sub_asaas_88294</span>
                </div>
              </div>

              {/* RODAPÉ DO CARD COM LINK SUTIL DE CANCELAMENTO */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Ambiente seguro com criptografia ponta a ponta</span>
                </div>

                {statusAssinatura === "ativo" && (
                  <button
                    type="button"
                    onClick={handleAbrirCancelamento}
                    className="text-slate-400 hover:text-rose-600 hover:underline text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Deseja cancelar sua assinatura?
                  </button>
                )}
              </div>
            </div>

            {/* TABELA DE HISTÓRICO DE FATURAS */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-800">
                    Histórico de Faturas
                  </h3>
                  <p className="text-xs text-slate-500">Recibos e notas fiscais emitidos no Asaas</p>
                </div>
              </div>

              {/* Tabela Responsiva */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-extrabold">
                      <th className="pb-3 font-extrabold">Data</th>
                      <th className="pb-3 font-extrabold">Plano / Descrição</th>
                      <th className="pb-3 font-extrabold">Valor</th>
                      <th className="pb-3 font-extrabold">Forma de Pagamento</th>
                      <th className="pb-3 font-extrabold">Status</th>
                      <th className="pb-3 font-extrabold text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {faturas.map((fat) => (
                      <tr key={fat.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 font-bold text-slate-800 whitespace-nowrap">
                          {fat.data}
                        </td>
                        <td className="py-3.5 text-slate-700">
                          <span className="font-semibold block">{fat.descricao}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{fat.id}</span>
                        </td>
                        <td className="py-3.5 font-extrabold text-slate-900 whitespace-nowrap">
                          {fat.valor}
                        </td>
                        <td className="py-3.5 text-slate-600 whitespace-nowrap">
                          {fat.metodo}
                        </td>
                        <td className="py-3.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                            <Check className="h-3 w-3" /> {fat.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => dispararToast(`Baixando recibo em PDF da fatura ${fat.id}...`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-[#4C6C54] hover:bg-emerald-50 text-[11px] font-bold transition-colors cursor-pointer"
                            title="Baixar Recibo / PDF"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Baixar Recibo / PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* ABA 3: SEGURANÇA & PREFERÊNCIAS */}
        {/* ===================================================================== */}
        {abaAtiva === "seguranca" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* CARD 1: ALTERAÇÃO DE SENHA */}
            <form onSubmit={handleAtualizarSenha} className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-[#4C6C54]" />
                    Alteração de Senha
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Mantenha sua conta e os dados clínicos da criança protegidos</p>
                </div>
                <button
                  type="button"
                  onClick={() => setVerSenhas(!verSenhas)}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  {verSenhas ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  <span>{verSenhas ? "Ocultar" : "Mostrar"} senhas</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Senha Atual
                  </label>
                  <input
                    type={verSenhas ? "text" : "password"}
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nova Senha
                  </label>
                  <input
                    type={verSenhas ? "text" : "password"}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Mínimo 8 dígitos"
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type={verSenhas ? "text" : "password"}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* INDICADOR VISUAL DE FORÇA DA SENHA */}
              {novaSenha.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600">Força da nova senha:</span>
                    <span className="font-extrabold text-slate-800">{forcaSenha.rotulo}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${forcaSenha.cor}`}
                      style={{ width: `${forcaSenha.porcentagem}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Atualizar Senha
                </button>
              </div>
            </form>

            {/* CARD 2: SESSÕES E DISPOSITIVOS CONECTADOS (PROTEÇÃO PANDA VIDEO) */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#4C6C54]" />
                    Sessões e Aparelhos Conectados
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Proteção contra logins compartilhados para garantir o acesso exclusivo às videoaulas e suporte
                  </p>
                </div>

                {dispositivos.length > 1 && (
                  <button
                    type="button"
                    onClick={handleDesconectarOutros}
                    className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-colors cursor-pointer self-start sm:self-center"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Desconectar de todos os outros aparelhos</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {dispositivos.map((dev) => {
                  const Icon = dev.icone;
                  return (
                    <div
                      key={dev.id}
                      className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                          dev.ativoAgora ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-slate-800 font-extrabold">{dev.nome}</strong>
                            <span className="text-[10px] text-slate-500">({dev.tipo})</span>
                          </div>
                          <span className="text-slate-400 text-[11px] block mt-0.5">{dev.local}</span>
                        </div>
                      </div>

                      {dev.ativoAgora ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Sessão Atual • Ativo agora
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Conectado</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CARD 3: PREFERÊNCIAS DE NOTIFICAÇÃO */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[#4C6C54]" />
                  Preferências de Notificações
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Controle os horários e canais de contato da plataforma</p>
              </div>

              <div className="space-y-3.5">
                {/* Lembrete diário */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="pr-4">
                    <strong className="text-xs font-bold text-slate-800 block">
                      Lembrete diário para preencher o Diário Alimentar do dia
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Notificação rápida para não esquecer de registrar os grupos e refeições aceitas pela criança
                    </span>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-lg">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="time"
                        value={horarioDiario}
                        onChange={(e) => setHorarioDiario(e.target.value)}
                        className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none"
                      />
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifDiario}
                        onChange={(e) => setNotifDiario(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4C6C54]"></div>
                    </label>
                  </div>
                </div>

                {/* Novas aulas */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3">
                  <div className="pr-4">
                    <strong className="text-xs font-bold text-slate-800 block">
                      Avisos de novas aulas e materiais publicados
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Seja notificado sempre que a Dra. Laís postar uma nova estratégia prática de aceitação alimentar
                    </span>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={notifAulas}
                      onChange={(e) => setNotifAulas(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4C6C54]"></div>
                  </label>
                </div>

                {/* Canais preferidos */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">
                    Canais de contato preferidos:
                  </span>
                  <div className="flex items-center gap-6">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={canalEmail}
                        onChange={(e) => setCanalEmail(e.target.checked)}
                        className="w-4 h-4 accent-[#4C6C54] rounded cursor-pointer"
                      />
                      <span>E-mail</span>
                    </label>

                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={canalWhats}
                        onChange={(e) => setCanalWhats(e.target.checked)}
                        className="w-4 h-4 accent-[#4C6C54] rounded cursor-pointer"
                      />
                      <span>WhatsApp</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => dispararToast("Preferências de notificação salvas!")}
                  className="py-2.5 px-6 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Salvar Preferências
                </button>
              </div>
            </div>

            {/* CARD 4: PRIVACIDADE & LGPD */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#4C6C54]" />
                    Privacidade & LGPD
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Seus direitos e controle integral sobre seus dados</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <strong className="text-xs font-bold text-slate-800 block">Exportação Completa de Dados Pessoais</strong>
                  <span className="text-[11px] text-slate-500">
                    Faça o download de todos os seus registros clínicos, respostas da anamnese e histórico financeiro em formato aberto (JSON).
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleExportarDados}
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-white border border-slate-300 hover:border-slate-400 text-slate-800 text-xs font-bold rounded-xl shadow-xs transition-all hover:bg-slate-100 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <FileDown className="h-4 w-4 text-[#4C6C54]" />
                  <span>Exportar Todos os Meus Dados</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setModalLGPD(true)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline font-semibold cursor-pointer"
                >
                  Ler a Política de Privacidade e Proteção de Dados
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================================= */}
      {/* MODAL AMIGÁVEL DE RETENÇÃO / CANCELAMENTO (3 ETAPAS) */}
      {/* ======================================================================= */}
      {modalCancelamento && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200">
            {/* Botão Fechar Modal */}
            <button
              type="button"
              onClick={() => setModalCancelamento(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* PROGRESSO EM ETAPAS */}
            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    etapaCancelamento >= step ? "bg-[#4C6C54]" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>

            {/* ETAPA 1: CONSCIENTIZAÇÃO DE PERDAS */}
            {etapaCancelamento === 1 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6" />
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Sentiremos muito a sua falta!
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Antes de confirmar o cancelamento, veja o que você e o Pedro deixarão de ter acesso:
                  </p>
                </div>

                <div className="space-y-2.5 text-xs bg-amber-50/60 p-4 rounded-2xl border border-amber-200/50">
                  <div className="flex items-start gap-2 text-slate-700">
                    <span className="text-rose-500 font-bold shrink-0">✕</span>
                    <span><strong>Diário Alimentar Pediátrico:</strong> Registro e cálculo dinâmico de grupos e evolução da seletividade.</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-700">
                    <span className="text-rose-500 font-bold shrink-0">✕</span>
                    <span><strong>Devolutivas com a Dra. Laís:</strong> Orientação contínua e análise das refeições do seu filho.</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-700">
                    <span className="text-rose-500 font-bold shrink-0">✕</span>
                    <span><strong>Videoaulas Práticas (Panda Video):</strong> Metodologia passo a passo de aproximação sensorial e texturas.</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalCancelamento(false)}
                    className="w-full py-3 px-4 bg-[#4C6C54] hover:bg-[#3a5340] text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Quero Continuar Evoluindo (Manter Minha Assinatura)
                  </button>

                  <button
                    type="button"
                    onClick={() => setEtapaCancelamento(2)}
                    className="w-full py-2.5 text-slate-400 hover:text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Avançar para o cancelamento
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 2: PESQUISA RÁPIDA DE MOTIVOS */}
            {etapaCancelamento === 2 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Info className="h-6 w-6" />
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Pode nos contar o motivo principal?
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Sua resposta é anônima e nos ajuda a melhorar a experiência para todas as famílias.
                  </p>
                </div>

                <div className="space-y-2.5 text-xs">
                  {[
                    { id: "preco", label: "Preço elevado no momento" },
                    { id: "metas", label: "Criança já atingiu as metas de alimentação" },
                    { id: "tempo", label: "Pouco tempo para acompanhar as rotinas e aulas" },
                    { id: "tecnico", label: "Problemas técnicos / Outro motivo" }
                  ].map((item) => (
                    <label
                      key={item.id}
                      onClick={() => setMotivoCancelamento(item.id)}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        motivoCancelamento === item.id
                          ? "border-[#4C6C54] bg-[#4C6C54]/5 text-slate-900 font-bold"
                          : "border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="motivoCancelamento"
                        checked={motivoCancelamento === item.id}
                        onChange={() => setMotivoCancelamento(item.id)}
                        className="accent-[#4C6C54] w-4 h-4 cursor-pointer"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}

                  {motivoCancelamento === "tecnico" && (
                    <textarea
                      rows={2}
                      value={outroMotivoTexto}
                      onChange={(e) => setOutroMotivoTexto(e.target.value)}
                      placeholder="Conte-nos brevemente o que aconteceu..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54]"
                    />
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEtapaCancelamento(1)}
                    className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Voltar
                  </button>

                  <button
                    type="button"
                    disabled={!motivoCancelamento}
                    onClick={() => setEtapaCancelamento(3)}
                    className="flex-1 py-2.5 px-4 bg-[#4C6C54] hover:bg-[#3a5340] disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 3: VIGÊNCIA JUSTA E CONFIRMAÇÃO */}
            {etapaCancelamento === 3 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6" />
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Vigência Justa e Transparente
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Conforme nossos termos de assinatura no Asaas:
                  </p>
                </div>

                <div className="p-4 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Seu acesso continuará <strong>100% liberado até 18 de Outubro de 2026</strong>.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span><strong>Nenhuma nova cobrança</strong> será realizada no cartão cadastrado.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>O prontuário da criança ficará salvo caso deseje retornar no futuro.</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalCancelamento(false)}
                    className="w-full py-3 px-4 bg-[#4C6C54] hover:bg-[#3a5340] text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Manter Minha Assinatura
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmarCancelamento}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-rose-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Confirmar Cancelamento da Assinatura
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL POLÍTICA DE PRIVACIDADE & LGPD */}
      {/* ======================================================================= */}
      {modalLGPD && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setModalLGPD(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-extrabold text-slate-900 mb-2">
              Política de Privacidade e Proteção de Dados (LGPD)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Última atualização: Setembro de 2026
            </p>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>1. Dados Pediátricos Sensíveis:</strong> Os dados clínicos, comportamentais e nutricionais do seu filho são tratados com confidencialidade médica estrita sob responsabilidade da Dra. Laís e da equipe clínica do Nutrindo em Casa.
              </p>
              <p>
                <strong>2. Segurança Financeira:</strong> Dados de pagamento (cartão de crédito e PIX) são processados exclusivamente pelo Asaas Gestão Financeira com certificação PCI-DSS. Nosso sistema não armazena dados de cartão de crédito.
              </p>
              <p>
                <strong>3. Vídeos e Streaming:</strong> As videoaulas são hospedadas na infraestrutura do Panda Video, com DRM e restrição de sessões simultâneas para prevenir vazamentos.
              </p>
              <p>
                <strong>4. Seus Direitos (Art. 18 LGPD):</strong> Você pode solicitar a qualquer momento a exportação integral dos seus dados ou a exclusão da sua conta através do painel de configurações ou por e-mail de suporte.
              </p>
            </div>

            <div className="pt-5 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => setModalLGPD(false)}
                className="w-full py-2.5 bg-[#4C6C54] hover:bg-[#3a5340] text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Entendi e Concordo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaginaConfiguracoes() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F0EAE1] flex items-center justify-center">
          <div className="p-6 bg-white rounded-2xl shadow-md flex items-center gap-3 text-slate-700 text-sm font-bold">
            <div className="h-5 w-5 border-2 border-[#4C6C54] border-t-transparent rounded-full animate-spin" />
            <span>Carregando configurações...</span>
          </div>
        </div>
      }
    >
      <ConteudoConfiguracoes />
    </Suspense>
  );
}
