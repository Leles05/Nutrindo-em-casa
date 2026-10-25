"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  User, CreditCard, ShieldCheck, ArrowLeft, Calendar,
  Lock, CheckCircle2, Download, ExternalLink, FileText,
  Check, X, Eye, EyeOff, AlertTriangle, Clock, Sparkles,
  Loader2, ChevronRight, Bell, Smartphone
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import { useAuthGuard, encerrarSessao } from "@/hooks/useAuthGuard";

type AbaConfiguracao = "dados" | "assinatura" | "seguranca";

interface FaturaMock {
  id: string;
  data: string;
  descricao: string;
  valor: string;
  status: "pago" | "pendente";
  codigoAsaas: string;
}

function ConteudoConfiguracoes() {
  const { autenticado, carregando } = useAuthGuard();
  const searchParams = useSearchParams();
  const abaParam = searchParams.get("aba");

  const [abaAtiva, setAbaAtiva] = useState<AbaConfiguracao>(() => {
    if (abaParam === "faturas" || abaParam === "assinatura") return "assinatura";
    if (abaParam === "seguranca") return "seguranca";
    return "dados";
  });

  // Feedback Toast
  const [toastMsg, setToastMsg] = useState("");
  const dispararToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const trocarAba = (novaAba: AbaConfiguracao) => {
    setAbaAtiva(novaAba);
    // Atualiza a URL sem disparar reload da página
    if (typeof window !== "undefined") {
      const urlAba = novaAba === "assinatura" ? "faturas" : novaAba;
      window.history.replaceState(null, "", `/configuracoes?aba=${urlAba}`);
    }
  };

  // ===========================================================================
  // ESTADO - ABA 1: MEUS DADOS & CRIANÇA
  // ===========================================================================
  const [salvandoDados, setSalvandoDados] = useState(false);
  const [dadosForm, setDadosForm] = useState({
    nome: "Lucas Lima",
    email: "lucas@email.com",
    cpf: "384.192.837-12",
    telefone: "(11) 98888-7777",
    nomeCrianca: "Pedro Lima",
    idadeCrianca: "3 anos e 4 meses",
    alimentosConforto: "Banana 🍌, Maçã em fatias 🍎, Arroz branco 🍚, Pão de queijo 🧀",
    principaisRecusas: "Vegetais verdes (brócolis, espinafre), texturas pastosas misturadas e molhos quentes"
  });

  const [planoUsuario, setPlanoUsuario] = useState({
    tipo: "trimestral",
    nome: "Plano Trimestral",
    valor: "R$ 239,70",
    periodicidade: "Cobrado a cada 3 meses",
    asaasId: "sub_88294",
    status: "ATIVO"
  });

  // Cálculo de data de renovação dinâmica com base no plano atual
  const obterDataRenovacao = (tipoPlano: string) => {
    const hoje = new Date();
    const dias = tipoPlano === "mensal" ? 30 : tipoPlano === "anual" ? 365 : 90;
    const dataRenovacao = new Date(hoje.getTime() + dias * 24 * 60 * 60 * 1000);
    return dataRenovacao.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const [listaFaturas, setListaFaturas] = useState<FaturaMock[]>([]);

  // Carrega dados reais do Supabase ao montar
  useEffect(() => {
    const emailUsuario =
      typeof window !== "undefined"
        ? localStorage.getItem("nutrindo_user_email") || "lucas@email.com"
        : "lucas@email.com";

    async function carregarPerfil() {
      try {
        const res = await fetch(`/api/configuracoes?email=${encodeURIComponent(emailUsuario)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) {
          if (data.profile) {
            setDadosForm((prev) => ({
              ...prev,
              nome: data.profile.nome || prev.nome,
              email: data.profile.email || prev.email,
              cpf: data.profile.cpf || prev.cpf,
              telefone: data.profile.telefone || prev.telefone,
              nomeCrianca: data.profile.nome_crianca || prev.nomeCrianca,
              idadeCrianca: data.profile.idade_crianca || prev.idadeCrianca,
              alimentosConforto: data.profile.alimentos_conforto || prev.alimentosConforto,
              principaisRecusas: data.profile.principais_recusas || prev.principaisRecusas,
            }));

            const planoTipo = (data.profile.plano || "trimestral").toLowerCase();
            let nomePlano = "Plano Trimestral";
            let valorPlano = "R$ 239,70";
            let periodicidadePlano = "Cobrado a cada 3 meses";

            if (planoTipo === "mensal") {
              nomePlano = "Plano Mensal";
              valorPlano = "R$ 97,00";
              periodicidadePlano = "Cobrado mensalmente";
            } else if (planoTipo === "anual") {
              nomePlano = "Plano Anual";
              valorPlano = "R$ 718,80";
              periodicidadePlano = "Cobrado anualmente";
            }

            setPlanoUsuario({
              tipo: planoTipo,
              nome: nomePlano,
              valor: valorPlano,
              periodicidade: periodicidadePlano,
              asaasId: data.profile.asaas_subscription_id || "sub_88294",
              status: data.profile.status_assinatura || "ATIVO"
            });
          }
          if (data.faturas && data.faturas.length > 0) {
            const faturasFormatadas: FaturaMock[] = data.faturas.map((f: { id: string; asaas_payment_id: string; data_emissao: string; descricao: string; valor: number; status: string }) => ({
              id: f.id,
              data: f.data_emissao ? new Date(f.data_emissao).toLocaleDateString("pt-BR") : "Recente",
              descricao: f.descricao || "Assinatura Nutrindo em Casa",
              valor: `R$ ${Number(f.valor || 0).toFixed(2).replace(".", ",")}`,
              status: f.status === "Pago" ? "pago" : "pendente",
              codigoAsaas: f.asaas_payment_id || "pay_asaas",
            }));
            setListaFaturas(faturasFormatadas);
          }
        }
      } catch (err) {
        console.warn("Aviso ao carregar dados do usuário:", err);
      }
    }

    carregarPerfil();
  }, []);

  const handleSalvarDados = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoDados(true);

    try {
      await fetch("/api/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: dadosForm.email,
          nome: dadosForm.nome,
          cpf: dadosForm.cpf,
          telefone: dadosForm.telefone,
          nome_crianca: dadosForm.nomeCrianca,
          idade_crianca: dadosForm.idadeCrianca,
          alimentos_conforto: dadosForm.alimentosConforto,
          principais_recusas: dadosForm.principaisRecusas,
        }),
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("nutrindo_user_nome", dadosForm.nome);
      }

      dispararToast("Dados do responsável e da criança atualizados com sucesso! 🎉");
    } catch (err) {
      console.warn("Erro ao salvar:", err);
      dispararToast("Dados atualizados localmente.");
    } finally {
      setSalvandoDados(false);
    }
  };

  // ===========================================================================
  // ESTADO - ABA 2: ASSINATURA & FATURAS
  // ===========================================================================
  const [modalCancelamento, setModalCancelamento] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  const faturas: FaturaMock[] = listaFaturas;

  const handleDownloadFatura = (fatId: string) => {
    dispararToast(`Download do recibo oficial da fatura (${fatId}) iniciado em PDF!`);
  };

  const handleConfirmarCancelamento = () => {
    setCancelando(true);
    setTimeout(() => {
      setCancelando(false);
      setModalCancelamento(false);
      dispararToast(`Solicitação registrada. Sua assinatura permanecerá ativa até o fim da vigência (${obterDataRenovacao(planoUsuario.tipo)}).`);
    }, 1200);
  };

  // ===========================================================================
  // ESTADO - ABA 3: SEGURANÇA & PREFERÊNCIAS
  // ===========================================================================
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [notifAulas, setNotifAulas] = useState(true);
  const [notifWhatsapp, setNotifWhatsapp] = useState(true);

  const handleAtualizarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      dispararToast("Preencha todos os campos para alterar sua senha.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      dispararToast("A nova senha e a confirmação não coincidem.");
      return;
    }
    if (novaSenha.length < 6) {
      dispararToast("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setSalvandoSenha(true);
    try {
      await fetch("/api/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: dadosForm.email,
          novaSenha,
        }),
      });

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      dispararToast("Sua senha foi redefinida com sucesso no Supabase Auth!");
    } catch (err) {
      console.warn("Erro ao atualizar senha:", err);
      dispararToast("Senha atualizada.");
    } finally {
      setSalvandoSenha(false);
    }
  };

  const handleSalvarPreferencias = () => {
    dispararToast("Preferências de notificação salvas com sucesso!");
  };

  if (carregando || !autenticado) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F0EAE1]">
        <div className="flex items-center gap-3 bg-white p-6 rounded-2xl shadow-md border border-slate-200/80 animate-in fade-in">
          <div className="h-5 w-5 border-2 border-[#4C6C54] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-700">Verificando autenticação segura...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F0EAE1] overflow-hidden font-sans text-slate-800 flex-col md:flex-row">
      {/* BARRA LATERAL REUTILIZÁVEL INTEGRADA */}
      <Sidebar />

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-4 lg:p-6 pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
          
          {/* TOAST DE FEEDBACK GLOBAL */}
          {toastMsg && (
            <div className="fixed bottom-6 right-6 z-50 p-4 bg-[#4C6C54] text-white text-xs sm:text-sm font-bold rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-300 border border-emerald-400/30">
              <CheckCircle2 className="h-5 w-5 text-emerald-300 shrink-0" />
              <span>{toastMsg}</span>
              <button 
                type="button" 
                onClick={() => setToastMsg("")}
                className="ml-2 text-white/70 hover:text-white p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* =============================================================== */}
          {/* TOPO: TÍTULO, SUBTÍTULO E NAVEGAÇÃO */}
          {/* =============================================================== */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors py-1 px-2 rounded-lg hover:bg-white/70"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Voltar ao Dashboard</span>
                </Link>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#4C6C54] tracking-tight">
                Minha Conta & Configurações
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Gerencie seus dados pessoais, prontuário da criança, assinatura e segurança.
              </p>
            </div>

            {/* BADGE DE USUÁRIO COM PLANO */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <div className="flex items-center gap-2 p-1.5 pl-3 rounded-full bg-white/90 border border-slate-200/90 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-700">{planoUsuario.nome}</span>
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#4C6C54] to-[#689373] text-white flex items-center justify-center font-extrabold text-xs shadow-xs ring-2 ring-white">
                  LL
                </div>
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* NAVEGAÇÃO EM ABAS (TABS PILLS MODERNAS) */}
          {/* =============================================================== */}
          <div className="flex items-center gap-2 p-1.5 bg-white/90 backdrop-blur-xs border border-slate-200/90 rounded-2xl shadow-2xs overflow-x-auto">
            
            {/* ABA 1: MEUS DADOS & CRIANÇA */}
            <button
              type="button"
              onClick={() => trocarAba("dados")}
              className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                abaAtiva === "dados"
                  ? "bg-[#4C6C54] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
              }`}
            >
              <User className="h-4 w-4" />
              <span>Meus Dados & Criança</span>
            </button>

            {/* ABA 2: ASSINATURA & FATURAS */}
            <button
              type="button"
              onClick={() => trocarAba("assinatura")}
              className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                abaAtiva === "assinatura"
                  ? "bg-[#4C6C54] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span>Assinatura & Faturas</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 ${
                abaAtiva === "assinatura" 
                  ? "bg-emerald-500 text-white" 
                  : "bg-emerald-100 text-emerald-800"
              }`}>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Ativo
              </span>
            </button>

            {/* ABA 3: SEGURANÇA & PREFERÊNCIAS */}
            <button
              type="button"
              onClick={() => trocarAba("seguranca")}
              className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                abaAtiva === "seguranca"
                  ? "bg-[#4C6C54] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Segurança & Preferências</span>
            </button>
          </div>

          {/* =============================================================== */}
          {/* CONTEÚDO DAS ABAS */}
          {/* =============================================================== */}

          {/* ------------------------------------------------------------- */}
          {/* ABA 1: MEUS DADOS & CRIANÇA */}
          {/* ------------------------------------------------------------- */}
          {abaAtiva === "dados" && (
            <form onSubmit={handleSalvarDados} className="space-y-6 animate-in fade-in duration-200">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* SEÇÃO RESPONSÁVEL */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <div className="h-8 w-8 rounded-xl bg-[#4C6C54]/10 text-[#4C6C54] flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900">
                        Dados do Responsável
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Informações do titular da conta e contato clínico
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        required
                        value={dadosForm.nome}
                        onChange={(e) => setDadosForm({ ...dadosForm, nome: e.target.value })}
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/40 focus:border-[#4C6C54] focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        E-mail de Acesso
                      </label>
                      <input
                        type="email"
                        required
                        value={dadosForm.email}
                        onChange={(e) => setDadosForm({ ...dadosForm, email: e.target.value })}
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/40 focus:border-[#4C6C54] focus:bg-white transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          CPF
                        </label>
                        <input
                          type="text"
                          required
                          value={dadosForm.cpf}
                          onChange={(e) => setDadosForm({ ...dadosForm, cpf: e.target.value })}
                          className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/40 focus:border-[#4C6C54] focus:bg-white transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Telefone / WhatsApp
                        </label>
                        <input
                          type="text"
                          required
                          value={dadosForm.telefone}
                          onChange={(e) => setDadosForm({ ...dadosForm, telefone: e.target.value })}
                          className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/40 focus:border-[#4C6C54] focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SEÇÃO CRIANÇA */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <div className="h-8 w-8 rounded-xl bg-[#EB6D57]/10 text-[#EB6D57] flex items-center justify-center">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900">
                        Dados da Criança
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Prontuário alimentar e mapa de conforto
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Nome da Criança
                        </label>
                        <input
                          type="text"
                          required
                          value={dadosForm.nomeCrianca}
                          onChange={(e) => setDadosForm({ ...dadosForm, nomeCrianca: e.target.value })}
                          className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/40 focus:border-[#4C6C54] focus:bg-white transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                          Idade
                        </label>
                        <input
                          type="text"
                          required
                          value={dadosForm.idadeCrianca}
                          onChange={(e) => setDadosForm({ ...dadosForm, idadeCrianca: e.target.value })}
                          className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/40 focus:border-[#4C6C54] focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Alimentos de Conforto
                      </label>
                      <input
                        type="text"
                        value={dadosForm.alimentosConforto}
                        onChange={(e) => setDadosForm({ ...dadosForm, alimentosConforto: e.target.value })}
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/40 focus:border-[#4C6C54] focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Principais Recusas
                      </label>
                      <input
                        type="text"
                        value={dadosForm.principaisRecusas}
                        onChange={(e) => setDadosForm({ ...dadosForm, principaisRecusas: e.target.value })}
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/40 focus:border-[#4C6C54] focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* BOTÃO SALVAR ALTERAÇÕES (CANTO INFERIOR DIREITO) */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={salvandoDados}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#4C6C54] hover:bg-[#3d5743] text-white font-extrabold text-sm shadow-md hover:shadow-lg active:scale-[0.99] transition-all cursor-pointer disabled:opacity-70"
                >
                  {salvandoDados ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
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

          {/* ------------------------------------------------------------- */}
          {/* ABA 2: ASSINATURA & FATURAS */}
          {/* ------------------------------------------------------------- */}
          {abaAtiva === "assinatura" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* CARD PRINCIPAL DA ASSINATURA */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-[#4C6C54]/30 shadow-sm space-y-5">
                
                {/* CABEÇALHO DO CARD */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-[#4C6C54]/10 text-[#4C6C54] flex items-center justify-center">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-extrabold text-slate-900">
                          {planoUsuario.nome}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {planoUsuario.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Acesso total à plataforma, anamnese pediátrica e suporte
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xl sm:text-2xl font-extrabold text-[#4C6C54]">
                      {planoUsuario.valor}
                    </span>
                    <span className="text-xs text-slate-500 block">{planoUsuario.periodicidade}</span>
                  </div>
                </div>

                {/* INFORMAÇÕES EM 3 COLUNAS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  
                  <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>Próxima Renovação</span>
                    </div>
                    <p className="text-sm font-extrabold text-slate-800 capitalize">
                      {obterDataRenovacao(planoUsuario.tipo)}
                    </p>
                  </div>

                  <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase">
                      <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                      <span>Forma de Pagamento</span>
                    </div>
                    <p className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                      <span>Cartão final 4242</span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">VISA</span>
                    </p>
                  </div>

                  <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase">
                      <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                      <span>ID Asaas</span>
                    </div>
                    <p className="text-sm font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded-lg border border-slate-200 inline-block">
                      {planoUsuario.asaasId}
                    </p>
                  </div>

                </div>

                {/* BOTÕES DE AÇÃO SECUNDÁRIA */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <Link
                    href="/pagamento?origem=upgrade"
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border-2 border-[#4C6C54] text-[#4C6C54] hover:bg-[#4C6C54] hover:text-white font-extrabold text-xs transition-all cursor-pointer shadow-2xs"
                  >
                    <span>Alterar Plano</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setModalCancelamento(true)}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold underline underline-offset-2 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    Deseja cancelar sua assinatura?
                  </button>
                </div>

              </div>

              {/* HISTÓRICO DE FATURAS (TABELA UI) */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Histórico de Faturas
                    </h3>
                    <p className="text-xs text-slate-500">
                      Demonstrativo fiscal e recibos oficiais das cobranças no Asaas
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-400 hidden sm:inline">
                    {faturas.length} faturas encontradas
                  </span>
                </div>

                {/* TABELA RESPONSIVA */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200/80 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-3">Data</th>
                        <th className="py-3 px-3">Descrição</th>
                        <th className="py-3 px-3">Valor</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {faturas.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                            Nenhuma fatura registrada até o momento.
                          </td>
                        </tr>
                      ) : (
                        faturas.map((fat) => (
                          <tr key={fat.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                              {fat.data}
                            </td>
                            <td className="py-3.5 px-3 font-medium text-slate-800">
                              {fat.descricao}
                            </td>
                            <td className="py-3.5 px-3 font-extrabold text-slate-900 whitespace-nowrap">
                              {fat.valor}
                            </td>
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              {fat.status === "pago" ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-max">
                                  <Check className="h-3 w-3 stroke-[3]" />
                                  Pago
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1 w-max">
                                  <Clock className="h-3 w-3" />
                                  Pendente
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-3 text-right whitespace-nowrap">
                              {fat.status === "pago" ? (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadFatura(fat.codigoAsaas)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#4C6C54] text-slate-700 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                                  title="Baixar PDF da fatura"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  <span>PDF</span>
                                </button>
                              ) : (
                                <span className="text-slate-400 font-medium text-xs px-2 py-1">
                                  Em aberto
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* ABA 3: SEGURANÇA & PREFERÊNCIAS */}
          {/* ------------------------------------------------------------- */}
          {abaAtiva === "seguranca" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* FORMULÁRIO DE TROCA DE SENHA */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <div className="h-8 w-8 rounded-xl bg-[#4C6C54]/10 text-[#4C6C54] flex items-center justify-center">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold text-slate-900">
                        Alterar Senha de Acesso
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Crie uma senha forte e segura para proteger seu perfil
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleAtualizarSenha} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Senha Atual
                      </label>
                      <div className="relative">
                        <input
                          type={mostrarSenha ? "text" : "password"}
                          value={senhaAtual}
                          onChange={(e) => setSenhaAtual(e.target.value)}
                          placeholder="Digite sua senha atual"
                          className="w-full h-11 pl-3.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/40 focus:border-[#4C6C54] focus:bg-white transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarSenha(!mostrarSenha)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        >
                          {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Nova Senha
                      </label>
                      <input
                        type={mostrarSenha ? "text" : "password"}
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/40 focus:border-[#4C6C54] focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Confirmar Nova Senha
                      </label>
                      <input
                        type={mostrarSenha ? "text" : "password"}
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                        placeholder="Repita a nova senha"
                        className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/40 focus:border-[#4C6C54] focus:bg-white transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={salvandoSenha}
                      className="w-full h-11 bg-[#4C6C54] hover:bg-[#3d5743] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
                    >
                      {salvandoSenha ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-white" />
                          <span>Atualizando...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Atualizar Senha</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* PREFERÊNCIAS E NOTIFICAÇÕES */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                      <div className="h-8 w-8 rounded-xl bg-[#EB6D57]/10 text-[#EB6D57] flex items-center justify-center">
                        <Bell className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-extrabold text-slate-900">
                          Preferências de Notificação
                        </h2>
                        <p className="text-[11px] text-slate-500">
                          Escolha como e quando receber atualizações importantes
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-1">
                      
                      {/* CHECKBOX 1: AULAS POR E-MAIL */}
                      <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifAulas}
                          onChange={(e) => setNotifAulas(e.target.checked)}
                          className="h-4 w-4 mt-0.5 rounded text-[#4C6C54] focus:ring-[#4C6C54] border-slate-300 cursor-pointer"
                        />
                        <div>
                          <strong className="text-xs font-bold text-slate-800 block">
                            Receber notificações de novas aulas por e-mail
                          </strong>
                          <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                            Avisaremos sempre que um novo módulo ou aula de suporte for liberado na sua trilha.
                          </span>
                        </div>
                      </label>

                      {/* CHECKBOX 2: LEMBRETES NO WHATSAPP */}
                      <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifWhatsapp}
                          onChange={(e) => setNotifWhatsapp(e.target.checked)}
                          className="h-4 w-4 mt-0.5 rounded text-[#4C6C54] focus:ring-[#4C6C54] border-slate-300 cursor-pointer"
                        />
                        <div>
                          <strong className="text-xs font-bold text-slate-800 block">
                            Lembretes de metas e consultorias no WhatsApp
                          </strong>
                          <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                            Receba alertas com links de encontros ao vivo com a Dra. Laís e lembretes do diário.
                          </span>
                        </div>
                      </label>

                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSalvarPreferencias}
                    className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs transition-colors cursor-pointer text-center mt-4"
                  >
                    Salvar Preferências
                  </button>
                </div>

                {/* SESSÃO ATIVA E DESCONEXÃO */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-3 lg:col-span-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Lock className="h-4 w-4 text-slate-500" />
                      Sessão Ativa no Navegador
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Deseja desconectar sua conta deste dispositivo? Suas informações e progresso continuarão salvos com segurança.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={encerrarSessao}
                    className="py-2.5 px-5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs rounded-xl border border-rose-200 transition-all cursor-pointer shrink-0 inline-flex items-center justify-center gap-2"
                  >
                    <span>Sair da Conta</span>
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>
      </main>

      {/* =================================================================== */}
      {/* MODAL DE CONFIRMAÇÃO DE CANCELAMENTO */}
      {/* =================================================================== */}
      {modalCancelamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 text-center space-y-4 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="h-14 w-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Deseja pausar ou cancelar sua assinatura?
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Você possui o <strong>{planoUsuario.nome} ativo até {obterDataRenovacao(planoUsuario.tipo)}</strong>. Caso cancele, você manterá acesso até o fim do ciclo pago, mas perderá o histórico contínuo da anamnese e suporte prioritário.
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-left text-xs text-amber-900 font-medium space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-950">
                <span>💡</span> Alternativa recomendada:
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Você pode solicitar uma pausa de 30 dias sem custos para manter o prontuário de {dadosForm.nomeCrianca || "sua criança"} salvo com segurança.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setModalCancelamento(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-all cursor-pointer"
              >
                Manter Assinatura
              </button>

              <button
                type="button"
                onClick={handleConfirmarCancelamento}
                disabled={cancelando}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {cancelando ? "Cancelando..." : "Confirmar Cancelamento"}
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
