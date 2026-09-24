"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck, Lock, CheckCircle2, Copy, Check, CreditCard,
  QrCode, ArrowLeft, Sparkles, AlertCircle, ChevronRight,
  Clock, Award, Shield
} from "lucide-react";

type TipoPlano = "mensal" | "trimestral" | "anual";
type MetodoPagamento = "pix" | "credito" | "debito";

interface DetalhesPlano {
  id: TipoPlano;
  nome: string;
  badge?: string;
  badgeCor?: string;
  precoEquivalenteMes: string;
  precoCobradoTotal: number;
  subtotal: number;
  economiaTexto?: string;
  economiaValor?: number;
  periodicidade: string;
  descricao: string;
  destaque?: boolean;
  beneficios: string[];
}

function ConteudoCheckout() {
  const searchParams = useSearchParams();
  const ehUpgrade = searchParams.get("origem") === "upgrade";

  const [planoSelecionado, setPlanoSelecionado] = useState<TipoPlano>(ehUpgrade ? "anual" : "trimestral");
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento>("pix");

  // Estado dos campos de Cartão de Crédito
  const [cartaoNumero, setCartaoNumero] = useState("");
  const [cartaoNome, setCartaoNome] = useState("");
  const [cartaoValidade, setCartaoValidade] = useState("");
  const [cartaoCvv, setCartaoCvv] = useState("");
  const [cartaoCpf, setCartaoCpf] = useState("");
  const [parcelas, setParcelas] = useState("1");

  // Estado dos campos de Débito
  const [debitoNumero, setDebitoNumero] = useState("");
  const [debitoNome, setDebitoNome] = useState("");
  const [debitoValidade, setDebitoValidade] = useState("");
  const [debitoCvv, setDebitoCvv] = useState("");
  const [debitoCpf, setDebitoCpf] = useState("");

  // Estado do Pix
  const [copiadoPix, setCopiadoPix] = useState(false);
  const [tempoRestantePix, setTempoRestantePix] = useState(899); // 14:59 min

  // Loading e Modal de Sucesso
  const [processando, setProcessando] = useState(false);
  const [modalSucesso, setModalSucesso] = useState(false);
  const [erroForm, setErroForm] = useState("");

  // Planos disponíveis com diferenciação inteligente para upgrade
  const planos: Record<TipoPlano, DetalhesPlano> = {
    mensal: {
      id: "mensal",
      nome: "Plano Mensal",
      precoEquivalenteMes: "R$ 97,00",
      precoCobradoTotal: 97.00,
      subtotal: 97.00,
      periodicidade: "Cobrado mensalmente",
      descricao: "Flexibilidade para testar o método mês a mês",
      beneficios: [
        "Acesso total à plataforma Nutrindo em Casa",
        "Anamnese alimentar pediátrica completa",
        "Diário de evolução e suporte contínuo",
        "Cancele a qualquer momento sem fidelidade"
      ]
    },
    trimestral: {
      id: "trimestral",
      nome: "Plano Trimestral",
      badge: ehUpgrade ? "Seu Plano Atual" : "Mais Escolhido",
      badgeCor: ehUpgrade ? "bg-slate-700 text-white" : "bg-emerald-500 text-white",
      precoEquivalenteMes: "R$ 79,90",
      precoCobradoTotal: 239.70,
      subtotal: 291.00,
      economiaTexto: "Economize 18%",
      economiaValor: 51.30,
      periodicidade: "Cobrado R$ 239,70 a cada 3 meses",
      descricao: "O equilíbrio perfeito entre economia e tempo hábil para evolução",
      destaque: !ehUpgrade,
      beneficios: [
        "Todos os benefícios do plano Mensal",
        "Acompanhamento estruturado das metas alimentares",
        "1 Encontro de alinhamento com especialista",
        "Economia acumulada de 18% no trimestre"
      ]
    },
    anual: {
      id: "anual",
      nome: "Plano Anual",
      badge: ehUpgrade ? "Upgrade Recomendado • Maior Economia" : "Melhor Custo-Benefício",
      badgeCor: "bg-[#EB6D57] text-white",
      precoEquivalenteMes: "R$ 59,90",
      precoCobradoTotal: 718.80,
      subtotal: 1164.00,
      economiaTexto: "Economize 38%",
      economiaValor: 445.20,
      periodicidade: "Cobrado R$ 718,80 ao ano",
      descricao: "Transformação completa e acompanhamento integral por 12 meses",
      destaque: ehUpgrade,
      beneficios: [
        "Todos os benefícios do plano Trimestral",
        "Prioridade máxima nas devolutivas e reavaliações",
        "Acesso ilimitado a novos cursos e masterclasses",
        "Maior economia anual (equivalente a R$ 59,90/mês)"
      ]
    }
  };

  const planoAtivo = planos[planoSelecionado];

  // Contador regressivo do Pix (15 minutos)
  useEffect(() => {
    if (metodoPagamento !== "pix") return;
    const intervalo = setInterval(() => {
      setTempoRestantePix((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(intervalo);
  }, [metodoPagamento]);

  const formatarTempo = (segundos: number) => {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${min.toString().padStart(2, "0")}:${seg.toString().padStart(2, "0")}`;
  };

  // Código Pix fictício compatível com formato Asaas
  const pixCopiaECola = `00020126580014br.gov.bcb.pix0136nutrindoemcasa-asaas-pix-62b1a9e3-82a15204000053039865405${planoAtivo.precoCobradoTotal.toFixed(2)}5802BR5916NUTRINDO EM CASA6009SAO PAULO62070503***6304`;

  const copiarChavePix = () => {
    navigator.clipboard.writeText(pixCopiaECola);
    setCopiadoPix(true);
    setTimeout(() => setCopiadoPix(false), 3000);
  };

  // Máscaras de entrada em tempo real
  const handleNumeroCartao = (val: string, setter: (v: string) => void) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    const masked = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
    setter(masked);
  };

  const handleValidade = (val: string, setter: (v: string) => void) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      setter(`${digits.slice(0, 2)}/${digits.slice(2, 4)}`);
    } else {
      setter(digits);
    }
  };

  const handleCvv = (val: string, setter: (v: string) => void) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    setter(digits);
  };

  const handleCpf = (val: string, setter: (v: string) => void) => {
    const digits = val.replace(/\D/g, "").slice(0, 11);
    let masked = digits;
    if (digits.length > 9) {
      masked = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
    } else if (digits.length > 6) {
      masked = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}`;
    } else if (digits.length > 3) {
      masked = `${digits.slice(0, 3)}.${digits.slice(3, 6)}`;
    }
    setter(masked);
  };

  // Detecção dinâmica de bandeira de cartão
  const detectarBandeira = (num: string) => {
    const limpo = num.replace(/\s/g, "");
    if (/^4/.test(limpo)) return "Visa 💳";
    if (/^(5[1-5]|2[2-7])/.test(limpo)) return "Mastercard 💳";
    if (/^(4011|4389|4514|5041|5090|6362)/.test(limpo)) return "Elo 💳";
    if (/^3[47]/.test(limpo)) return "Amex 💳";
    if (/^6(?:011|5)/.test(limpo)) return "Hipercard 💳";
    return "Cartão 💳";
  };

  // Opções de parcelamento dinâmicas baseadas no plano selecionado
  const getOpcoesParcelamento = () => {
    const total = planoAtivo.precoCobradoTotal;
    if (planoSelecionado === "mensal") {
      return [
        { parcelas: 1, valorParcela: total, texto: `1x de R$ ${total.toFixed(2).replace(".", ",")} à vista` }
      ];
    }
    if (planoSelecionado === "trimestral") {
      return [
        { parcelas: 1, valorParcela: total, texto: `1x de R$ ${total.toFixed(2).replace(".", ",")} à vista (sem juros)` },
        { parcelas: 2, valorParcela: total / 2, texto: `2x de R$ ${(total / 2).toFixed(2).replace(".", ",")} sem juros` },
        { parcelas: 3, valorParcela: total / 3, texto: `3x de R$ ${(total / 3).toFixed(2).replace(".", ",")} sem juros` }
      ];
    }
    // Anual
    return [
      { parcelas: 1, valorParcela: total, texto: `1x de R$ ${total.toFixed(2).replace(".", ",")} à vista (sem juros)` },
      { parcelas: 3, valorParcela: total / 3, texto: `3x de R$ ${(total / 3).toFixed(2).replace(".", ",")} sem juros` },
      { parcelas: 6, valorParcela: total / 6, texto: `6x de R$ ${(total / 6).toFixed(2).replace(".", ",")} sem juros` },
      { parcelas: 10, valorParcela: total / 10, texto: `10x de R$ ${(total / 10).toFixed(2).replace(".", ",")} sem juros` },
      { parcelas: 12, valorParcela: total / 12, texto: `12x de R$ ${(total / 12).toFixed(2).replace(".", ",")} sem juros` }
    ];
  };

  /**
   * =========================================================================
   * INTEGRAÇÃO COM A API DO ASAAS (BACKEND PREPARATION)
   * =========================================================================
   *
   * Endpoint de Criação de Assinatura:
   *   POST /api/asaas/subscription (ou diretamente na API do Asaas v3)
   *
   * Headers recomendados:
   *   access_token: process.env.ASAAS_API_KEY
   *   Content-Type: application/json
   *
   * Exemplo de Payload montado a partir deste estado:
   * {
   *   customer: "cus_000005938472", // ID do cliente previamente criado no Asaas
   *   billingType: metodoPagamento === "pix" ? "PIX" : metodoPagamento === "credito" ? "CREDIT_CARD" : "DEBIT_CARD",
   *   value: planoAtivo.precoCobradoTotal,
   *   nextDueDate: new Date().toISOString().split("T")[0],
   *   cycle: planoSelecionado === "mensal" ? "MONTHLY" : planoSelecionado === "trimestral" ? "QUARTERLY" : "ANNUALLY",
   *   description: `Assinatura ${planoAtivo.nome} - Nutrindo em Casa`,
   *   creditCard: metodoPagamento === "credito" ? {
   *     holderName: cartaoNome,
   *     number: cartaoNumero.replace(/\s/g, ""),
   *     expiryMonth: cartaoValidade.split("/")[0],
   *     expiryYear: "20" + cartaoValidade.split("/")[1],
   *     ccv: cartaoCvv
   *   } : undefined,
   *   creditCardHolderInfo: metodoPagamento === "credito" ? {
   *     name: cartaoNome,
   *     cpfCnpj: cartaoCpf.replace(/\D/g, ""),
   *     email: "lucas@email.com",
   *     mobilePhone: "11988887777"
   *   } : undefined
   * }
   * =========================================================================
   */
  const handleFinalizarAssinatura = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm("");

    if (metodoPagamento === "credito") {
      if (cartaoNumero.replace(/\s/g, "").length < 15) {
        setErroForm("Por favor, digite um número de cartão de crédito válido.");
        return;
      }
      if (!cartaoNome.trim()) {
        setErroForm("Informe o nome do titular como impresso no cartão.");
        return;
      }
      if (cartaoValidade.length < 5) {
        setErroForm("Informe a validade no formato MM/AA.");
        return;
      }
      if (cartaoCvv.length < 3) {
        setErroForm("Informe o código de segurança (CVV) do cartão.");
        return;
      }
    }

    if (metodoPagamento === "debito") {
      if (debitoNumero.replace(/\s/g, "").length < 15) {
        setErroForm("Por favor, digite um número de cartão de débito válido.");
        return;
      }
      if (!debitoNome.trim()) {
        setErroForm("Informe o nome do titular.");
        return;
      }
    }

    setProcessando(true);

    setTimeout(() => {
      setProcessando(false);
      setModalSucesso(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F0EAE1] text-slate-800 font-sans pb-16">
      {/* HEADER DO CHECKOUT */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar ao Dashboard</span>
            </Link>
          </div>

          <div className="relative h-9 w-28 block">
            <Image
              src="/logo-transparente.png"
              alt="Nutrindo em Casa"
              fill
              className="object-contain"
              priority
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full shadow-2xs">
            <Lock className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Ambiente Seguro SSL 256 bits</span>
            <span className="sm:hidden">Seguro</span>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        
        {/* TÍTULO E SUBTÍTULO */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4C6C54]/10 text-[#4C6C54] text-xs font-extrabold uppercase tracking-wider mb-2.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{ehUpgrade ? "Upgrade de Plano & Gestão de Ciclo" : "Assinatura & Acesso Imediato"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {ehUpgrade
              ? "Amplie os benefícios da terapia alimentar do seu filho"
              : "Escolha o plano ideal para a evolução alimentar do seu filho"}
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-2">
            Acompanhamento contínuo, métodos baseados em evidências e suporte com profissionais especializados.
          </p>
        </div>

        {/* 1. SELETOR DE PLANOS (3 CARDS) */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span>1. Escolha o seu ciclo de assinatura</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">Troque ou cancele quando quiser</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-stretch">
            {(Object.keys(planos) as TipoPlano[]).map((key) => {
              const plano = planos[key];
              const selecionado = planoSelecionado === key;

              return (
                <div
                  key={key}
                  onClick={() => setPlanoSelecionado(key)}
                  className={`relative rounded-3xl p-5 sm:p-6 transition-all cursor-pointer flex flex-col justify-between ${
                    selecionado
                      ? "bg-white border-2 border-[#4C6C54] shadow-xl ring-4 ring-[#4C6C54]/10 scale-[1.01]"
                      : "bg-white/80 hover:bg-white border border-slate-200 shadow-xs hover:shadow-md"
                  }`}
                >
                  {/* BADGES SUPERIORES */}
                  {plano.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
                      <span className={`px-3.5 py-1 rounded-full text-[11px] font-extrabold shadow-sm tracking-wide ${plano.badgeCor || "bg-emerald-600 text-white"}`}>
                        {plano.badge}
                      </span>
                    </div>
                  )}

                  <div>
                    {/* CABEÇALHO DO CARD */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">{plano.nome}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{plano.descricao}</p>
                      </div>

                      <div
                        className={`h-6 w-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          selecionado
                            ? "border-[#4C6C54] bg-[#4C6C54] text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {selecionado && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    {/* VALOR DO PLANO */}
                    <div className="my-4 pt-3 border-t border-slate-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                          {plano.precoEquivalenteMes}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">/mês</span>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 font-medium">{plano.periodicidade}</span>
                        {plano.economiaTexto && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                            {plano.economiaTexto}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* LISTA DE BENEFÍCIOS */}
                    <ul className="space-y-2.5 my-4 pt-3 border-t border-slate-100">
                      {plano.beneficios.map((beneficio, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{beneficio}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-3">
                    <button
                      type="button"
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                        selecionado
                          ? "bg-[#4C6C54] text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <span>
                        {ehUpgrade && key === "trimestral"
                          ? "Plano Vigente (Manter)"
                          : ehUpgrade && key === "anual"
                          ? (selecionado ? "Fazer Upgrade para o Anual" : "Escolher Upgrade Anual")
                          : selecionado
                          ? "Plano Selecionado"
                          : "Escolher este plano"}
                      </span>
                      {selecionado && <Check className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. FORMAS DE PAGAMENTO E RESUMO (GRID 2 COLUNAS) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUNA ESQUERDA: FORMAS DE PAGAMENTO (7 COLUNAS) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                2. Método de Pagamento
              </h2>
              <p className="text-xs text-slate-500">
                Pagamentos criptografados e processados com segurança pelo Asaas.
              </p>
            </div>

            {/* SELETOR DE ABAS / TABS */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setMetodoPagamento("pix")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  metodoPagamento === "pix"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <QrCode className="h-4 w-4 text-emerald-600" />
                <span>PIX</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded hidden sm:inline">
                  Instantâneo
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMetodoPagamento("credito")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  metodoPagamento === "credito"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CreditCard className="h-4 w-4 text-slate-500" />
                <span>Crédito</span>
              </button>

              <button
                type="button"
                onClick={() => setMetodoPagamento("debito")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  metodoPagamento === "debito"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CreditCard className="h-4 w-4 text-slate-400" />
                <span>Débito</span>
              </button>
            </div>

            {erroForm && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2 animation-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{erroForm}</span>
              </div>
            )}

            {/* ABA 1: PIX */}
            {metodoPagamento === "pix" && (
              <div className="space-y-6 animation-fade-in">
                <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-medium">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>O código Pix expira em:</span>
                  </div>
                  <strong className="font-mono text-emerald-800 text-sm font-bold bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                    {formatarTempo(tempoRestantePix)}
                  </strong>
                </div>

                {/* INSTRUÇÕES DO PIX */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Como pagar com Pix:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <span className="font-extrabold text-[#4C6C54] block mb-1">1. Abra seu banco</span>
                      <p className="text-slate-500">Entre no aplicativo do seu banco e acerte a opção de pagar com Pix.</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <span className="font-extrabold text-[#4C6C54] block mb-1">2. Escaneie ou Copie</span>
                      <p className="text-slate-500">Use a câmera para ler o QR Code ou cole a chave copia e cola.</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <span className="font-extrabold text-[#4C6C54] block mb-1">3. Acesso Imediato</span>
                      <p className="text-slate-500">A confirmação é automática no Asaas em menos de 10 segundos.</p>
                    </div>
                  </div>
                </div>

                {/* QR CODE MOCK VISUAL */}
                <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center">
                    <svg
                      width="180"
                      height="180"
                      viewBox="0 0 180 180"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="rounded-lg"
                    >
                      <rect width="180" height="180" fill="white" />
                      <rect x="10" y="10" width="45" height="45" rx="8" fill="#1E293B" />
                      <rect x="18" y="18" width="29" height="29" rx="4" fill="white" />
                      <rect x="24" y="24" width="17" height="17" rx="2" fill="#1E293B" />

                      <rect x="125" y="10" width="45" height="45" rx="8" fill="#1E293B" />
                      <rect x="133" y="18" width="29" height="29" rx="4" fill="white" />
                      <rect x="139" y="24" width="17" height="17" rx="2" fill="#1E293B" />

                      <rect x="10" y="125" width="45" height="45" rx="8" fill="#1E293B" />
                      <rect x="18" y="133" width="29" height="29" rx="4" fill="white" />
                      <rect x="24" y="139" width="17" height="17" rx="2" fill="#1E293B" />

                      <rect x="65" y="15" width="10" height="10" rx="2" fill="#1E293B" />
                      <rect x="85" y="15" width="10" height="10" rx="2" fill="#1E293B" />
                      <rect x="105" y="15" width="10" height="10" rx="2" fill="#1E293B" />

                      <rect x="65" y="35" width="20" height="10" rx="2" fill="#1E293B" />
                      <rect x="95" y="35" width="10" height="20" rx="2" fill="#1E293B" />

                      <rect x="15" y="65" width="15" height="10" rx="2" fill="#1E293B" />
                      <rect x="40" y="65" width="10" height="20" rx="2" fill="#1E293B" />

                      <rect x="125" y="65" width="20" height="10" rx="2" fill="#1E293B" />
                      <rect x="155" y="75" width="15" height="15" rx="2" fill="#1E293B" />

                      <circle cx="90" cy="90" r="24" fill="#00BDAE" />
                      <path
                        d="M82 90L90 82L98 90L90 98L82 90Z"
                        fill="white"
                      />
                      <rect x="87" y="87" width="6" height="6" fill="#00BDAE" />

                      <rect x="65" y="125" width="15" height="15" rx="2" fill="#1E293B" />
                      <rect x="90" y="135" width="20" height="10" rx="2" fill="#1E293B" />
                      <rect x="120" y="125" width="10" height="25" rx="2" fill="#1E293B" />
                      <rect x="140" y="145" width="25" height="15" rx="2" fill="#1E293B" />
                      <rect x="70" y="155" width="30" height="15" rx="2" fill="#1E293B" />
                    </svg>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    Aponte a câmera do seu aplicativo de pagamentos
                  </span>
                </div>

                {/* CAMPO COPIA E COLA */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Pix Copia e Cola:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={pixCopiaECola}
                      className="flex-1 h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 focus:outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={copiarChavePix}
                      className={`h-11 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs ${
                        copiadoPix
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-900 hover:bg-slate-800 text-white"
                      }`}
                    >
                      {copiadoPix ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copiar Código</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: CARTÃO DE CRÉDITO */}
            {metodoPagamento === "credito" && (
              <form onSubmit={handleFinalizarAssinatura} className="space-y-4 animation-fade-in">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Número do Cartão
                    </label>
                    <span className="text-xs font-bold text-[#4C6C54]">
                      {detectarBandeira(cartaoNumero)}
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="0000 0000 0000 0000"
                    value={cartaoNumero}
                    onChange={(e) => handleNumeroCartao(e.target.value, setCartaoNumero)}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Nome Impresso no Cartão
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: LUCAS LIMA"
                    value={cartaoNome}
                    onChange={(e) => setCartaoNome(e.target.value.toUpperCase())}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Validade (MM/AA)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="12/28"
                      value={cartaoValidade}
                      onChange={(e) => handleValidade(e.target.value, setCartaoValidade)}
                      className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      CVV / Código
                    </label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      placeholder="123"
                      value={cartaoCvv}
                      onChange={(e) => handleCvv(e.target.value, setCartaoCvv)}
                      className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    CPF do Titular
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={cartaoCpf}
                    onChange={(e) => handleCpf(e.target.value, setCartaoCpf)}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Opções de Parcelamento
                  </label>
                  <select
                    value={parcelas}
                    onChange={(e) => setParcelas(e.target.value)}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] transition-all cursor-pointer"
                  >
                    {getOpcoesParcelamento().map((op) => (
                      <option key={op.parcelas} value={op.parcelas}>
                        {op.texto}
                      </option>
                    ))}
                  </select>
                </div>
              </form>
            )}

            {/* ABA 3: CARTÃO DE DÉBITO */}
            {metodoPagamento === "debito" && (
              <form onSubmit={handleFinalizarAssinatura} className="space-y-4 animation-fade-in">
                <div className="p-3.5 bg-blue-50 border border-blue-200/80 rounded-2xl text-xs text-blue-900 font-medium flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <p>
                    Para pagamentos em débito, você será redirecionado para a autenticação 3D Secure ou app do seu banco para autorização biométrica imediata.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Número do Cartão de Débito
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0000 0000 0000 0000"
                    value={debitoNumero}
                    onChange={(e) => handleNumeroCartao(e.target.value, setDebitoNumero)}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Nome Impresso no Cartão
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: LUCAS LIMA"
                    value={debitoNome}
                    onChange={(e) => setDebitoNome(e.target.value.toUpperCase())}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Validade (MM/AA)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="12/28"
                      value={debitoValidade}
                      onChange={(e) => handleValidade(e.target.value, setDebitoValidade)}
                      className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      CVV / Código
                    </label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      placeholder="123"
                      value={debitoCvv}
                      onChange={(e) => handleCvv(e.target.value, setDebitoCvv)}
                      className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    CPF do Titular
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={debitoCpf}
                    onChange={(e) => handleCpf(e.target.value, setDebitoCpf)}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] transition-all"
                  />
                </div>
              </form>
            )}
          </div>

          {/* COLUNA DIREITA: RESUMO DO PEDIDO & CONFIANÇA (5 COLUNAS) */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              
              {/* BARRA INFORMATIVA SUTIL DE UPGRADE */}
              {ehUpgrade && (
                <div className="p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 font-medium animation-fade-in">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Você já possui o <strong>Plano Trimestral</strong> ativo até <strong>18/10/2026</strong>. A alteração entrará em vigor mantendo seus créditos proporcionais.
                  </p>
                </div>
              )}

              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Resumo do Pedido
              </h2>

              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">{planoAtivo.nome}</h3>
                  <span className="text-xs text-slate-500">{planoAtivo.periodicidade}</span>
                </div>
                <span className="font-bold text-slate-700 text-sm">
                  R$ {planoAtivo.subtotal.toFixed(2).replace(".", ",")}
                </span>
              </div>

              {planoAtivo.economiaValor && (
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Desconto do Ciclo ({planoAtivo.economiaTexto})</span>
                  </span>
                  <span>- R$ {planoAtivo.economiaValor.toFixed(2).replace(".", ",")}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-extrabold uppercase text-slate-400 block">Total a pagar</span>
                  <span className="text-xs text-slate-500 font-medium">{planoAtivo.periodicidade}</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    R$ {planoAtivo.precoCobradoTotal.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>

              {/* BOTÃO PRINCIPAL DE FINALIZAÇÃO (CTA) */}
              <button
                type="button"
                onClick={handleFinalizarAssinatura}
                disabled={processando}
                className="w-full py-3.5 px-4 bg-[#4C6C54] hover:bg-[#3a5340] active:scale-[0.99] text-white font-extrabold text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {processando ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processando via Asaas...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>
                      {ehUpgrade && planoSelecionado === "trimestral"
                        ? "Plano Vigente (Manter)"
                        : ehUpgrade
                        ? "Confirmar Alteração de Plano"
                        : "Concluir Assinatura Segura"}
                    </span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-400 font-medium">
                Ao prosseguir, você concorda com nossos Termos de Serviço e Política de Privacidade.
              </p>
            </div>

            {/* SELOS DE CONFIANÇA E GARANTIA */}
            <div className="bg-white/80 rounded-2xl p-5 border border-slate-200/80 space-y-3.5 text-xs">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Award className="h-4 w-4" />
                </div>
                <div>
                  <strong className="text-slate-800 block text-xs">Garantia Incondicional de 7 Dias</strong>
                  <span className="text-slate-500 text-[11px] leading-relaxed block">
                    Se você não notar valor real na evolução do seu filho, devolvemos 100% do seu dinheiro sem perguntas.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <strong className="text-slate-800 block text-xs">Transação Criptografada SSL 256 bits</strong>
                  <span className="text-slate-500 text-[11px] leading-relaxed block">
                    Dados blindados e processados diretamente pela infraestrutura bancária autorizada do Asaas.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                <div className="h-8 w-8 rounded-xl bg-[#EB6D57]/10 text-[#EB6D57] flex items-center justify-center shrink-0">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <strong className="text-slate-800 block text-xs">Privacidade e Proteção LGPD</strong>
                  <span className="text-slate-500 text-[11px] leading-relaxed block">
                    As informações clínicas e nutricionais do seu filho nunca são compartilhadas com terceiros.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL DE SUCESSO / CONFIRMAÇÃO DE ASSINATURA */}
      {modalSucesso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animation-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center space-y-5 shadow-2xl border border-slate-100 animation-scale-up">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="h-9 w-9 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-xs font-extrabold uppercase text-emerald-600 tracking-wider">
                {ehUpgrade ? "Upgrade Concluído" : "Pagamento Autorizado"}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                {ehUpgrade ? "Plano Atualizado com Sucesso! 🚀" : "Assinatura Confirmada! 🎉"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                Seu acesso ao <strong>{planoAtivo.nome}</strong> foi liberado com sucesso. Todos os recursos, anamnese e ferramentas já estão disponíveis.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-left space-y-1.5 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Plano Ativado:</span>
                <strong className="text-slate-800">{planoAtivo.nome}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valor Cobrado:</span>
                <strong className="text-slate-800">R$ {planoAtivo.precoCobradoTotal.toFixed(2).replace(".", ",")}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Método:</span>
                <strong className="text-slate-800 uppercase">{metodoPagamento}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Próxima Renovação:</span>
                <strong className="text-slate-800">
                  {planoSelecionado === "mensal"
                    ? "Em 30 dias"
                    : planoSelecionado === "trimestral"
                    ? "Em 90 dias"
                    : "Em 365 dias"}
                </strong>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="w-full py-3.5 px-4 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Acessar o Meu Dashboard</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaginaCheckout() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F0EAE1] flex items-center justify-center">
          <div className="p-6 bg-white rounded-2xl shadow-md flex items-center gap-3 text-slate-700 text-sm font-bold">
            <div className="h-5 w-5 border-2 border-[#4C6C54] border-t-transparent rounded-full animate-spin" />
            <span>Carregando checkout seguro...</span>
          </div>
        </div>
      }
    >
      <ConteudoCheckout />
    </Suspense>
  );
}
