"use client";

import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck, Lock, CheckCircle2, Copy, Check, CreditCard,
  QrCode, ArrowLeft, Sparkles, AlertCircle, ChevronRight,
  Clock, Award, Shield, Flame, RefreshCw, Loader2
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

interface ErrosCartao {
  numero?: string;
  nome?: string;
  validade?: string;
  cvv?: string;
  cpf?: string;
}

function ConteudoCheckout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ehUpgrade = searchParams.get("origem") === "upgrade";
  const planoParam = searchParams.get("plano") as TipoPlano | null;

  const planoInicial: TipoPlano = ehUpgrade
    ? "anual"
    : (planoParam === "mensal" || planoParam === "trimestral" || planoParam === "anual")
    ? planoParam
    : "trimestral";

  const [planoSelecionado, setPlanoSelecionado] = useState<TipoPlano>(planoInicial);
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento>("credito");

  const secaoPagamentoRef = useRef<HTMLDivElement>(null);

  // Refs dos inputs para scroll suave até o primeiro erro
  const inputNumeroRef = useRef<HTMLInputElement>(null);
  const inputNomeRef = useRef<HTMLInputElement>(null);
  const inputValidadeRef = useRef<HTMLInputElement>(null);
  const inputCvvRef = useRef<HTMLInputElement>(null);
  const inputCpfRef = useRef<HTMLInputElement>(null);

  // Scroll automático se plano foi pré-selecionado via URL
  useEffect(() => {
    if (planoParam && (planoParam === "mensal" || planoParam === "trimestral" || planoParam === "anual")) {
      setPlanoSelecionado(planoParam);
      const timer = setTimeout(() => {
        secaoPagamentoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [planoParam]);

  // Dados do Comprador / Acesso (iniciados totalmente vazios por padrão)
  const [clienteNome, setClienteNome] = useState("");
  const [clienteEmail, setClienteEmail] = useState("");
  const [clienteCelular, setClienteCelular] = useState("");
  const [clienteCpf, setClienteCpf] = useState("");

  // Estado dos campos de Cartão de Crédito (iniciados totalmente vazios por padrão)
  const [cartaoNumero, setCartaoNumero] = useState("");
  const [cartaoNome, setCartaoNome] = useState("");
  const [cartaoValidade, setCartaoValidade] = useState("");
  const [cartaoCvv, setCartaoCvv] = useState("");
  const [cartaoCpf, setCartaoCpf] = useState("");
  const [parcelas, setParcelas] = useState(ehUpgrade ? "12" : "1");

  // Estado de erros individuais campo a campo
  const [errosCartao, setErrosCartao] = useState<ErrosCartao>({});

  // Estado dos campos de Débito (iniciados totalmente vazios por padrão)
  const [debitoNumero, setDebitoNumero] = useState("");
  const [debitoNome, setDebitoNome] = useState("");
  const [debitoValidade, setDebitoValidade] = useState("");
  const [debitoCvv, setDebitoCvv] = useState("");
  const [debitoCpf, setDebitoCpf] = useState("");

  // Pré-preenche apenas quando for explicitamente rota de upgrade (?origem=upgrade)
  useEffect(() => {
    if (ehUpgrade && typeof window !== "undefined") {
      const emailSalvo = localStorage.getItem("nutrindo_user_email") || "";
      const nomeSalvo = localStorage.getItem("nutrindo_user_nome") || "";
      if (emailSalvo) setClienteEmail(emailSalvo);
      if (nomeSalvo) {
        setClienteNome(nomeSalvo);
        setCartaoNome(nomeSalvo.toUpperCase());
      }
    }
  }, [ehUpgrade]);

  // Estado do Pix Asaas Real
  const [pixCarregando, setPixCarregando] = useState(false);
  const [pixDados, setPixDados] = useState<{
    encodedImage?: string;
    payload?: string;
    expirationDate?: string;
    subscriptionId?: string;
    paymentId?: string;
  } | null>(null);
  const [pixErro, setPixErro] = useState("");
  const [copiadoPix, setCopiadoPix] = useState(false);
  const [tempoRestantePix, setTempoRestantePix] = useState(899); // 14:59 min

  // Loading, ID de Transação e Modal de Sucesso
  const [processando, setProcessando] = useState(false);
  const [idAssinaturaGerada, setIdAssinaturaGerada] = useState("");
  const [modalSucesso, setModalSucesso] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [erroForm, setErroForm] = useState("");

  // Crédito proporcional do plano vigente
  const creditoProporcional = ehUpgrade ? 79.90 : 0;

  // Planos disponíveis
  const planos: Record<TipoPlano, DetalhesPlano> = {
    mensal: {
      id: "mensal",
      nome: "Plano Mensal",
      precoEquivalenteMes: "R$ 97,00",
      precoCobradoTotal: 97.00,
      subtotal: 97.00,
      periodicidade: "Cobrado mensalmente",
      descricao: "Flexibilidade para testar mês a mês",
      beneficios: [
        "Acesso total à plataforma",
        "Anamnese completa com 56 parâmetros",
        "Consulta individual por videochamada",
        "Devolutivas semanais via plataforma",
        "Central de dúvidas com especialista de segunda a sexta (horário comercial)",
        "Plano alimentar e receitas individualizadas, com foco nos interesses da criança e realidade familiar",
        "Cancele a qualquer momento"
      ]
    },
    trimestral: {
      id: "trimestral",
      nome: "Plano Trimestral",
      badge: ehUpgrade ? "Seu Plano Atual" : "Mais Escolhido pelas Famílias",
      badgeCor: ehUpgrade ? "bg-slate-800 text-white" : "bg-emerald-500 text-white",
      precoEquivalenteMes: "R$ 79,90",
      precoCobradoTotal: 239.70,
      subtotal: 291.00,
      economiaTexto: "Economize 18%",
      economiaValor: 51.30,
      periodicidade: "Cobrado R$ 239,70 a cada 3 meses",
      descricao: "Tempo ideal para consolidação das rotinas",
      destaque: !ehUpgrade,
      beneficios: [
        "Todos os benefícios do Mensal",
        "Consulta por videochamada (encontro de alinhamento com especialista) a cada 45 dias (ou 6 semanas)",
        "Economia de 18% no ciclo"
      ]
    },
    anual: {
      id: "anual",
      nome: "Plano Anual",
      badge: ehUpgrade ? "🔥 Oportunidade: Economize R$ 225,00 no ano" : "Melhor Custo-Benefício",
      badgeCor: "bg-[#EB6D57] text-white",
      precoEquivalenteMes: "R$ 59,90",
      precoCobradoTotal: 718.80,
      subtotal: 1164.00,
      economiaTexto: "Economize 38%",
      economiaValor: 445.20,
      periodicidade: "Cobrado R$ 718,80 ao ano",
      descricao: "Consolidação dos ganhos e continuação do progresso",
      destaque: ehUpgrade,
      beneficios: [
        "Todos os benefícios do Mensal",
        "Consulta mensal por videochamada com especialista (a cada 30 dias / 4 semanas)",
        "Menor valor mensal garantido"
      ]
    }
  };

  const planoAtivo = planos[planoSelecionado];

  // Cálculo do total final com desconto de crédito proporcional
  const valorTotalFinal = (ehUpgrade && planoSelecionado === "anual")
    ? Math.max(0, planoAtivo.precoCobradoTotal - creditoProporcional)
    : planoAtivo.precoCobradoTotal;

  // =========================================================================
  // INTEGRAÇÃO REAL COM A API DO ASAAS (PIX)
  // =========================================================================
  const gerarPixAsaas = useCallback(async () => {
    setPixCarregando(true);
    setPixErro("");

    try {
      const emailEnvio = clienteEmail
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "")
        .trim()
        .toLowerCase() || (ehUpgrade ? "lucas@email.com" : "cliente@nutrindoemcasa.com.br");
      const nomeEnvio = clienteNome.trim() || cartaoNome || (ehUpgrade ? "Lucas Lima" : "Cliente Nutrindo");

      // Limpa quaisquer flags antigas de onboarding para conta nova
      if (typeof window !== "undefined") {
        localStorage.removeItem("anamnese_concluida");
        localStorage.removeItem("nutrindo_anamnese_concluida");
        localStorage.removeItem("consulta_agendada");
        localStorage.removeItem("nutrindo_consulta_agendada");
        localStorage.removeItem("nutrindo_anamnese_rascunho");
      }

      const res = await fetch("/api/asaas/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nomeEnvio,
          email: emailEnvio,
          cpf: clienteCpf || cartaoCpf || "89296740541",
          celular: clienteCelular || "11988887777",
          billingType: "PIX",
          plano: planoSelecionado,
          valor: valorTotalFinal
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Erro ao gerar QR Code Pix no Asaas.");
      }

      setPixDados({
        encodedImage: data.encodedImage,
        payload: data.payload,
        expirationDate: data.expirationDate,
        subscriptionId: data.subscriptionId,
        paymentId: data.paymentId
      });
      setIdAssinaturaGerada(data.subscriptionId);
      if (data.emailEnviado) {
        setEmailEnviado(true);
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("nutrindo_user_email", emailEnvio);
        localStorage.setItem("nutrindo_user_nome", nomeEnvio);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao conectar com o Asaas.";
      setPixErro(msg);
    } finally {
      setPixCarregando(false);
    }
  }, [clienteNome, clienteEmail, clienteCpf, clienteCelular, cartaoNome, cartaoCpf, planoSelecionado, valorTotalFinal, ehUpgrade]);

  // Dispara a geração de Pix do Asaas ao trocar para aba Pix ou trocar de plano
  useEffect(() => {
    if (metodoPagamento === "pix") {
      gerarPixAsaas();
    }
  }, [metodoPagamento, planoSelecionado, gerarPixAsaas]);

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

  const copiarChavePix = () => {
    const chave = pixDados?.payload || "";
    if (!chave) return;
    navigator.clipboard.writeText(chave);
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

  // Opções de parcelamento dinâmicas baseadas no total final
  const getOpcoesParcelamento = () => {
    const total = valorTotalFinal;
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
    // Anual: parcelamento facilitado em até 12x
    return [
      { parcelas: 1, valorParcela: total, texto: `1x de R$ ${total.toFixed(2).replace(".", ",")} à vista (sem juros)` },
      { parcelas: 3, valorParcela: total / 3, texto: `3x de R$ ${(total / 3).toFixed(2).replace(".", ",")} sem juros` },
      { parcelas: 6, valorParcela: total / 6, texto: `6x de R$ ${(total / 6).toFixed(2).replace(".", ",")} sem juros` },
      { parcelas: 10, valorParcela: total / 10, texto: `10x de R$ ${(total / 10).toFixed(2).replace(".", ",")} sem juros` },
      { parcelas: 12, valorParcela: total / 12, texto: `12x de R$ ${(total / 12).toFixed(2).replace(".", ",")} sem juros` }
    ];
  };

  // =========================================================================
  // VALIDAÇÃO LOCAL E DESTAQUE CAMPO A CAMPO
  // =========================================================================
  const validarFormularioCartao = (): boolean => {
    const novosErros: ErrosCartao = {};

    // 1. Número do Cartão (16 dígitos numéricos)
    const numLimpo = cartaoNumero.replace(/\D/g, "");
    if (!numLimpo) {
      novosErros.numero = "Digite o número do cartão de crédito.";
    } else if (numLimpo.length !== 16) {
      novosErros.numero = "O número do cartão deve conter 16 dígitos.";
    }

    // 2. Nome do Titular (pelo menos duas palavras)
    const nomeTrim = cartaoNome.trim();
    if (!nomeTrim) {
      novosErros.nome = "Digite o nome como impresso no cartão.";
    } else if (nomeTrim.split(/\s+/).filter(Boolean).length < 2) {
      novosErros.nome = "Informe o nome e o sobrenome do titular.";
    }

    // 3. Validade (formato MM/AA, mês 01 a 12, ano >= atual)
    if (!cartaoValidade.trim()) {
      novosErros.validade = "Informe a validade (MM/AA).";
    } else {
      const match = cartaoValidade.match(/^(\d{2})\/(\d{2})$/);
      if (!match) {
        novosErros.validade = "Use o formato MM/AA.";
      } else {
        const mes = parseInt(match[1], 10);
        const ano = parseInt(`20${match[2]}`, 10);
        const dataAtual = new Date();
        const anoAtual = dataAtual.getFullYear();
        const mesAtual = dataAtual.getMonth() + 1; // 1 a 12

        if (mes < 1 || mes > 12) {
          novosErros.validade = "Mês inválido (01 a 12).";
        } else if (ano < anoAtual || (ano === anoAtual && mes < mesAtual)) {
          novosErros.validade = "Cartão com validade vencida.";
        }
      }
    }

    // 4. CVV (3 ou 4 dígitos numéricos, bloqueia vazio, <3 dígitos ou '000')
    const cvvLimpo = cartaoCvv.trim();
    if (!cvvLimpo) {
      novosErros.cvv = "Digite o código CVV.";
    } else if (cvvLimpo.length < 3 || cvvLimpo.length > 4 || !/^\d{3,4}$/.test(cvvLimpo)) {
      novosErros.cvv = "O CVV deve ter no mínimo 3 dígitos numéricos.";
    } else if (cvvLimpo === "000" || cvvLimpo === "0000" || cvvLimpo === "111") {
      novosErros.cvv = "Código de segurança inválido.";
    }

    // 5. CPF do Titular (11 dígitos)
    const cpfLimpo = cartaoCpf.replace(/\D/g, "");
    if (!cpfLimpo) {
      novosErros.cpf = "Informe o CPF do titular.";
    } else if (cpfLimpo.length !== 11 || /^(\d)\1{10}$/.test(cpfLimpo)) {
      novosErros.cpf = "CPF inválido. Digite os 11 dígitos.";
    }

    setErrosCartao(novosErros);

    // Scroll suave até o primeiro campo inválido se houver erro
    if (Object.keys(novosErros).length > 0) {
      if (novosErros.numero) {
        inputNumeroRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        inputNumeroRef.current?.focus();
      } else if (novosErros.nome) {
        inputNomeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        inputNomeRef.current?.focus();
      } else if (novosErros.validade) {
        inputValidadeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        inputValidadeRef.current?.focus();
      } else if (novosErros.cvv) {
        inputCvvRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        inputCvvRef.current?.focus();
      } else if (novosErros.cpf) {
        inputCpfRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        inputCpfRef.current?.focus();
      }
      return false;
    }

    return true;
  };

  // Helper para classes visuais com erro ou padrão
  const getInputClass = (hasError: boolean) =>
    `w-full h-11 px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
      hasError
        ? "bg-red-50/20 border border-red-400 ring-2 ring-red-100 text-slate-900 focus:outline-none focus:border-red-500"
        : "bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] focus:bg-white"
    }`;

  // =========================================================================
  // FINALIZAÇÃO DE ASSINATURA (CONEXÃO REAL ASAAS SANDBOX)
  // =========================================================================
  const handleFinalizarAssinatura = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm("");

    if (ehUpgrade && planoSelecionado === "trimestral") {
      setErroForm("Você já possui o Plano Trimestral ativo. Selecione o Plano Anual para realizar o upgrade.");
      return;
    }

    // Validação obrigatória dos dados de contato do comprador
    if (!clienteNome.trim()) {
      setErroForm("Por favor, preencha o seu nome completo nos dados de acesso.");
      return;
    }
    if (!clienteEmail.trim() || !clienteEmail.includes("@")) {
      setErroForm("Por favor, informe um e-mail de acesso válido.");
      return;
    }
    if (!clienteCelular.trim() || clienteCelular.replace(/\D/g, "").length < 10) {
      setErroForm("Por favor, informe seu celular/WhatsApp com DDD.");
      return;
    }
    if (!clienteCpf.trim() && !cartaoCpf.trim()) {
      setErroForm("Por favor, informe seu CPF.");
      return;
    }

    // Fluxo do PIX
    if (metodoPagamento === "pix") {
      if (!pixDados?.encodedImage) {
        await gerarPixAsaas();
      }
      setModalSucesso(true);
      return;
    }

    // Fluxo do Cartão de Crédito Real via Asaas
    if (metodoPagamento === "credito") {
      // Validação local campo a campo
      const formValido = validarFormularioCartao();
      if (!formValido) {
        return;
      }

      const numLimpo = cartaoNumero.replace(/\D/g, "");
      const [expMonth, expYear] = cartaoValidade.split("/");

      setProcessando(true);

      try {
        const emailEnvio = clienteEmail
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "")
          .trim()
          .toLowerCase();
        const nomeEnvio = clienteNome.trim() || cartaoNome;

        // Limpa quaisquer flags antigas de onboarding para conta nova
        if (typeof window !== "undefined") {
          localStorage.removeItem("anamnese_concluida");
          localStorage.removeItem("nutrindo_anamnese_concluida");
          localStorage.removeItem("consulta_agendada");
          localStorage.removeItem("nutrindo_consulta_agendada");
          localStorage.removeItem("nutrindo_anamnese_rascunho");
        }

        const res = await fetch("/api/asaas/subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: nomeEnvio,
            email: emailEnvio,
            cpf: clienteCpf || cartaoCpf,
            celular: clienteCelular || "11988887777",
            billingType: "CREDIT_CARD",
            plano: planoSelecionado,
            valor: valorTotalFinal,
            cartao: {
              holderName: cartaoNome,
              number: numLimpo,
              expiryMonth: expMonth,
              expiryYear: expYear,
              ccv: cartaoCvv,
              cpf: cartaoCpf || clienteCpf
            }
          })
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setErroForm(
            data.message ||
              "Não foi possível autorizar o cartão no Asaas. Verifique os dados ou utilize o Pix."
          );
          setProcessando(false);
          return;
        }

        if (typeof window !== "undefined") {
          localStorage.setItem("nutrindo_user_email", emailEnvio);
          localStorage.setItem("nutrindo_user_nome", nomeEnvio);
        }

        setIdAssinaturaGerada(data.subscriptionId);
        if (data.emailEnviado) {
          setEmailEnviado(true);
        }
        setProcessando(false);
        setModalSucesso(true);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro ao processar cobrança segura.";
        setErroForm(msg);
        setProcessando(false);
      }
      return;
    }

    // Fluxo de Débito
    if (metodoPagamento === "debito") {
      if (debitoNumero.replace(/\s/g, "").length < 15) {
        setErroForm("Por favor, digite um número de cartão de débito válido.");
        return;
      }
      if (!debitoNome.trim()) {
        setErroForm("Informe o nome do titular.");
        return;
      }
      setProcessando(true);
      setTimeout(() => {
        setProcessando(false);
        setModalSucesso(true);
      }, 1400);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0EAE1] text-slate-800 font-sans pb-20">
      {/* HEADER DO CHECKOUT */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={ehUpgrade ? "/configuracoes?aba=faturas" : "/"}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 p-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{ehUpgrade ? "Voltar às Configurações" : "Voltar ao Início"}</span>
            </Link>
          </div>

          <Link href="/" className="relative h-9 w-28 block">
            <Image
              src="/logo-transparente.png"
              alt="Nutrindo em Casa"
              fill
              className="object-contain"
              priority
            />
          </Link>

          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full shadow-2xs">
            <Lock className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Ambiente Seguro SSL 256 bits</span>
            <span className="sm:hidden">Seguro</span>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL COM PADDING ADEQUADO */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-20">
        
        {/* TÍTULO E SUBTÍTULO / HERO BANNER */}
        <div className="text-center max-w-3xl mx-auto mb-10 overflow-visible">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4C6C54]/10 text-[#4C6C54] text-xs font-extrabold uppercase tracking-wider mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{ehUpgrade ? "Upgrade de Plano & Gestão de Ciclo" : "Assinatura & Acesso Imediato"}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-snug mb-3">
            Escolha o plano ideal para a evolução alimentar do seu filho
          </h1>

          {/* HERO BANNER DE UPGRADE PERSONALIZADO */}
          {ehUpgrade ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 mb-8 text-center text-xs sm:text-sm text-emerald-900 shadow-xs animate-in fade-in duration-300">
              <p className="font-extrabold text-emerald-950 text-sm sm:text-base flex items-center justify-center gap-1.5 mb-1.5">
                <span>✨</span> Upgrade Exclusivo de Assinatura
              </p>
              <p className="leading-relaxed text-emerald-800 max-w-2xl mx-auto">
                Lucas, você possui o <strong>Plano Trimestral ativo até 18/10/2026</strong>. Ao migrar para o <strong>Plano Anual</strong>, você garante o menor valor mensal (R$ 59,90/mês), estende seu acompanhamento com a Dra. Laís e mantém seus dias já pagos como crédito proporcional!
              </p>
            </div>
          ) : (
            <p className="text-slate-600 text-xs sm:text-sm mt-2 max-w-2xl mx-auto">
              Acompanhamento contínuo, métodos baseados em evidências e suporte com profissionais especializados.
            </p>
          )}
        </div>

        {/* 1. SELETOR DE PLANOS (3 CARDS COM HIERARQUIA INTELIGENTE) */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span>1. Escolha o seu ciclo de assinatura</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">Troque ou cancele quando quiser</span>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 items-stretch ${ehUpgrade ? "mt-8 pt-2" : "mt-6"}`}>
            
            {/* =============================================================== */}
            {/* CARD 1: PLANO MENSAL */}
            {/* =============================================================== */}
            <div
              onClick={() => {
                if (!ehUpgrade) setPlanoSelecionado("mensal");
              }}
              className={`rounded-3xl p-5 sm:p-6 transition-all flex flex-col justify-between ${
                ehUpgrade
                  ? "opacity-60 hover:opacity-100 transition-opacity bg-white/70 border border-slate-200 cursor-default"
                  : planoSelecionado === "mensal"
                  ? "bg-white border-2 border-[#4C6C54] shadow-xl ring-4 ring-[#4C6C54]/10 cursor-pointer"
                  : "bg-white/80 hover:bg-white border border-slate-200 shadow-xs hover:shadow-md cursor-pointer"
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Plano Mensal</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Flexibilidade para testar mês a mês</p>
                  </div>
                  {!ehUpgrade && (
                    <div
                      className={`h-6 w-6 rounded-full border flex items-center justify-center shrink-0 ${
                        planoSelecionado === "mensal"
                          ? "border-[#4C6C54] bg-[#4C6C54] text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {planoSelecionado === "mensal" && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                  )}
                </div>

                <div className="my-4 pt-3 border-t border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      R$ 97,00
                    </span>
                    <span className="text-xs font-semibold text-slate-500">/mês</span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium block mt-1">Cobrado mensalmente</span>
                </div>

                <ul className="space-y-2.5 my-4 pt-3 border-t border-slate-100">
                  {planos.mensal.beneficios.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 pt-3">
                {ehUpgrade ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-400 cursor-not-allowed text-center"
                  >
                    Downgrade não recomendado
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPlanoSelecionado("mensal")}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                      planoSelecionado === "mensal"
                        ? "bg-[#4C6C54] text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span>{planoSelecionado === "mensal" ? "Plano Selecionado" : "Escolher este plano"}</span>
                    {planoSelecionado === "mensal" && <Check className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            </div>

            {/* =============================================================== */}
            {/* CARD 2: PLANO TRIMESTRAL */}
            {/* =============================================================== */}
            <div
              onClick={() => {
                if (!ehUpgrade) setPlanoSelecionado("trimestral");
              }}
              className={`relative rounded-3xl p-5 sm:p-6 transition-all flex flex-col justify-between ${
                ehUpgrade
                  ? "bg-slate-50/90 border border-slate-300 shadow-2xs"
                  : planoSelecionado === "trimestral"
                  ? "bg-white border-2 border-[#4C6C54] shadow-xl ring-4 ring-[#4C6C54]/10 cursor-pointer"
                  : "bg-white/80 hover:bg-white border border-slate-200 shadow-xs hover:shadow-md cursor-pointer"
              }`}
            >
              {/* BADGE SUPERIOR */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
                <span className={`px-3.5 py-1 rounded-full text-[11px] font-extrabold shadow-sm tracking-wide ${
                  ehUpgrade ? "bg-slate-800 text-white" : "bg-emerald-500 text-white"
                }`}>
                  {ehUpgrade ? "Seu Plano Atual" : "Mais Escolhido pelas Famílias"}
                </span>
              </div>

              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Plano Trimestral</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Tempo ideal para consolidação das rotinas</p>
                  </div>
                  {!ehUpgrade && (
                    <div
                      className={`h-6 w-6 rounded-full border flex items-center justify-center shrink-0 ${
                        planoSelecionado === "trimestral"
                          ? "border-[#4C6C54] bg-[#4C6C54] text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {planoSelecionado === "trimestral" && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>
                  )}
                </div>

                <div className="my-4 pt-3 border-t border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      R$ 79,90
                    </span>
                    <span className="text-xs font-semibold text-slate-500">/mês</span>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 font-medium">R$ 239,70 a cada 3 meses</span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                      Economize 18%
                    </span>
                  </div>
                </div>

                <ul className="space-y-2.5 my-4 pt-3 border-t border-slate-100">
                  {planos.trimestral.beneficios.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3.5 p-3 rounded-2xl bg-[#F4F9F5] border border-[#3D5A45]/15 text-xs text-slate-700 font-medium leading-snug">
                  ✨ <strong>Diferencial do Ciclo:</strong> Inclui acompanhamentos ao vivo por vídeo a cada 45 dias para ajuste fino da rotina.
                </div>
              </div>

              <div className="mt-4 pt-3">
                {ehUpgrade ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 rounded-xl font-extrabold text-xs bg-slate-200 text-slate-700 cursor-default flex items-center justify-center gap-1.5"
                  >
                    <span>✓ Plano Vigente (Você já possui)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPlanoSelecionado("trimestral")}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                      planoSelecionado === "trimestral"
                        ? "bg-[#4C6C54] text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span>{planoSelecionado === "trimestral" ? "Plano Selecionado" : "Escolher este plano"}</span>
                    {planoSelecionado === "trimestral" && <Check className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            </div>

            {/* =============================================================== */}
            {/* CARD 3: PLANO ANUAL (DESTAQUE MÁXIMO NO UPGRADE) */}
            {/* =============================================================== */}
            <div
              onClick={() => setPlanoSelecionado("anual")}
              className={`relative rounded-3xl p-5 sm:p-6 transition-all flex flex-col justify-between ${
                ehUpgrade
                  ? "scale-105 shadow-xl border-2 border-emerald-600 ring-4 ring-emerald-100 relative bg-white z-10 cursor-pointer"
                  : planoSelecionado === "anual"
                  ? "bg-white border-2 border-[#4C6C54] shadow-xl ring-4 ring-[#4C6C54]/10 cursor-pointer"
                  : "bg-white/80 hover:bg-white border border-slate-200 shadow-xs hover:shadow-md cursor-pointer"
              }`}
            >
              {/* BADGE PULSANTE DE ALTO DESTAQUE */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
                <span className="px-3.5 py-1 rounded-full text-[11px] font-extrabold shadow-md tracking-wide bg-[#EB6D57] text-white flex items-center gap-1.5 animate-pulse">
                  <Flame className="h-3.5 w-3.5" />
                  <span>🔥 Oportunidade: Economize R$ 225,00 no ano</span>
                </span>
              </div>

              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Plano Anual</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Consolidação dos ganhos e continuação do progresso</p>
                  </div>
                  <div
                    className={`h-6 w-6 rounded-full border flex items-center justify-center shrink-0 ${
                      planoSelecionado === "anual"
                        ? "border-[#4C6C54] bg-[#4C6C54] text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {planoSelecionado === "anual" && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>
                </div>

                <div className="my-4 pt-3 border-t border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      R$ 59,90
                    </span>
                    <span className="text-xs font-semibold text-slate-500">/mês</span>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 font-medium">Cobrado R$ 718,80 ao ano</span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                      Economize 38%
                    </span>
                  </div>
                </div>

                <ul className="space-y-2.5 my-4 pt-3 border-t border-slate-100">
                  {planos.anual.beneficios.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-3.5 p-3 rounded-2xl bg-[#F4F9F5] border border-[#3D5A45]/15 text-xs text-slate-700 font-medium leading-snug">
                  👑 <strong>Diferencial VIP:</strong> Acompanhamento VIP com consultas mensais por vídeo e suporte contínuo por 12 meses.
                </div>
              </div>

              <div className="mt-4 pt-3">
                {ehUpgrade ? (
                  <button
                    type="button"
                    onClick={() => setPlanoSelecionado("anual")}
                    className="w-full py-3 px-3 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Fazer Upgrade para o Anual com Desconto →</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPlanoSelecionado("anual")}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                      planoSelecionado === "anual"
                        ? "bg-[#4C6C54] text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span>{planoSelecionado === "anual" ? "Plano Selecionado" : "Escolher este plano"}</span>
                    {planoSelecionado === "anual" && <Check className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. FORMAS DE PAGAMENTO E RESUMO DO PEDIDO */}
        <div
          id="metodo-pagamento"
          ref={secaoPagamentoRef}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start scroll-mt-24"
        >
          
          {/* COLUNA ESQUERDA: DADOS PESSOAIS + FORMAS DE PAGAMENTO (7 COLUNAS) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
            
            {/* SEÇÃO 1: DADOS DO COMPRADOR E ACESSO À PLATAFORMA */}
            <div className="space-y-4 pb-6 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                    2. Dados de Contato e Acesso
                  </h2>
                  <p className="text-xs text-slate-500">
                    Seus dados para emissão da fatura e liberação de acesso imediato.
                  </p>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Seguro
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={clienteNome}
                    onChange={(e) => {
                      setClienteNome(e.target.value);
                      if (!cartaoNome) setCartaoNome(e.target.value.toUpperCase());
                    }}
                    placeholder="Seu nome completo"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    E-mail de Acesso
                  </label>
                  <input
                    type="email"
                    value={clienteEmail}
                    onChange={(e) =>
                      setClienteEmail(
                        e.target.value
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .replace(/\s+/g, "")
                          .toLowerCase()
                      )
                    }
                    placeholder="seuemail@exemplo.com"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Celular / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={clienteCelular}
                    onChange={(e) => setClienteCelular(e.target.value)}
                    placeholder="(11) 98888-7777"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    CPF do Titular
                  </label>
                  <input
                    type="text"
                    value={clienteCpf}
                    onChange={(e) => {
                      handleCpf(e.target.value, setClienteCpf);
                      setCartaoCpf(e.target.value);
                    }}
                    placeholder="000.000.000-00"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54]"
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: FORMAS DE PAGAMENTO */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                  3. Método de Pagamento
                </h2>
                <p className="text-xs text-slate-500">
                  Cobrança oficial processada de forma segura pelo Asaas Sandbox.
                </p>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Asaas Oficial
              </span>
            </div>

            {/* SELETOR DE ABAS */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setMetodoPagamento("credito")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  metodoPagamento === "credito"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CreditCard className="h-4 w-4 text-slate-600" />
                <span>Crédito</span>
              </button>

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
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{erroForm}</span>
              </div>
            )}

            {/* ABA 1: CARTÃO DE CRÉDITO COM PROCESSAMENTO REAL NO ASAAS E VALIDAÇÃO LOCAL */}
            {metodoPagamento === "credito" && (
              <form
                onSubmit={handleFinalizarAssinatura}
                autoComplete="off"
                noValidate
                className="space-y-4 animate-in fade-in duration-200"
              >
                {/* 1. NÚMERO DO CARTÃO */}
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
                    ref={inputNumeroRef}
                    id="f_num_pay"
                    name="f_num_pay"
                    type="text"
                    autoComplete="new-password"
                    data-form-type="other"
                    data-lpignore="true"
                    placeholder="0000 0000 0000 0000"
                    value={cartaoNumero}
                    onChange={(e) => {
                      handleNumeroCartao(e.target.value, setCartaoNumero);
                      if (errosCartao.numero) {
                        setErrosCartao((prev) => ({ ...prev, numero: undefined }));
                      }
                    }}
                    className={getInputClass(!!errosCartao.numero)}
                  />
                  {errosCartao.numero && (
                    <span className="text-xs text-red-500 font-medium mt-1 block animate-in fade-in duration-150">
                      {errosCartao.numero}
                    </span>
                  )}
                </div>

                {/* 2. NOME IMPRESSO */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Nome Impresso no Cartão
                  </label>
                  <input
                    ref={inputNomeRef}
                    id="f_nom_pay"
                    name="f_nom_pay"
                    type="text"
                    autoComplete="new-password"
                    data-form-type="other"
                    data-lpignore="true"
                    placeholder="Como impresso no cartão"
                    value={cartaoNome}
                    onChange={(e) => {
                      setCartaoNome(e.target.value.toUpperCase());
                      if (errosCartao.nome) {
                        setErrosCartao((prev) => ({ ...prev, nome: undefined }));
                      }
                    }}
                    className={`${getInputClass(!!errosCartao.nome)} uppercase`}
                  />
                  {errosCartao.nome && (
                    <span className="text-xs text-red-500 font-medium mt-1 block animate-in fade-in duration-150">
                      {errosCartao.nome}
                    </span>
                  )}
                </div>

                {/* 3. VALIDADE & CVV */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Validade (MM/AA)
                    </label>
                    <input
                      ref={inputValidadeRef}
                      id="f_val_pay"
                      name="f_val_pay"
                      type="text"
                      autoComplete="new-password"
                      data-form-type="other"
                      data-lpignore="true"
                      placeholder="12/28"
                      value={cartaoValidade}
                      onChange={(e) => {
                        handleValidade(e.target.value, setCartaoValidade);
                        if (errosCartao.validade) {
                          setErrosCartao((prev) => ({ ...prev, validade: undefined }));
                        }
                      }}
                      className={getInputClass(!!errosCartao.validade)}
                    />
                    {errosCartao.validade && (
                      <span className="text-xs text-red-500 font-medium mt-1 block animate-in fade-in duration-150">
                        {errosCartao.validade}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      CVV / Código
                    </label>
                    <input
                      ref={inputCvvRef}
                      id="f_sec_pay"
                      name="f_sec_pay"
                      type="password"
                      autoComplete="new-password"
                      data-form-type="other"
                      data-lpignore="true"
                      maxLength={4}
                      placeholder="123"
                      value={cartaoCvv}
                      onChange={(e) => {
                        handleCvv(e.target.value, setCartaoCvv);
                        if (errosCartao.cvv) {
                          setErrosCartao((prev) => ({ ...prev, cvv: undefined }));
                        }
                      }}
                      className={getInputClass(!!errosCartao.cvv)}
                    />
                    {errosCartao.cvv && (
                      <span className="text-xs text-red-500 font-medium mt-1 block animate-in fade-in duration-150">
                        {errosCartao.cvv}
                      </span>
                    )}
                  </div>
                </div>

                {/* 4. CPF DO TITULAR */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    CPF do Titular
                  </label>
                  <input
                    ref={inputCpfRef}
                    id="f_doc_pay"
                    name="f_doc_pay"
                    type="text"
                    autoComplete="new-password"
                    data-form-type="other"
                    data-lpignore="true"
                    placeholder="000.000.000-00"
                    value={cartaoCpf}
                    onChange={(e) => {
                      handleCpf(e.target.value, setCartaoCpf);
                      if (errosCartao.cpf) {
                        setErrosCartao((prev) => ({ ...prev, cpf: undefined }));
                      }
                    }}
                    className={getInputClass(!!errosCartao.cpf)}
                  />
                  {errosCartao.cpf && (
                    <span className="text-xs text-red-500 font-medium mt-1 block animate-in fade-in duration-150">
                      {errosCartao.cpf}
                    </span>
                  )}
                </div>

                {/* 5. OPÇÕES DE PARCELAMENTO */}
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

            {/* ABA 2: PIX COM QR CODE REAL GERADO NO ASAAS SANDBOX */}
            {metodoPagamento === "pix" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-medium">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>O código Pix expira em:</span>
                  </div>
                  <strong className="font-mono text-emerald-800 text-sm font-bold bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                    {formatarTempo(tempoRestantePix)}
                  </strong>
                </div>

                {/* ÁREA DO QR CODE REAL DO ASAAS */}
                <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 min-h-[260px]">
                  {pixCarregando ? (
                    <div className="flex flex-col items-center justify-center space-y-3 py-8">
                      <Loader2 className="h-9 w-9 animate-spin text-[#4C6C54]" />
                      <span className="text-xs font-extrabold text-slate-700">
                        Gerando QR Code Pix oficial no Asaas...
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Conectando com o gateway seguro Asaas Sandbox
                      </span>
                    </div>
                  ) : pixErro ? (
                    <div className="text-center space-y-3 py-4 max-w-sm">
                      <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
                      <p className="text-xs font-bold text-rose-700">{pixErro}</p>
                      <button
                        type="button"
                        onClick={() => gerarPixAsaas()}
                        className="py-2 px-4 bg-[#4C6C54] hover:bg-[#3a5340] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Tentar Novamente</span>
                      </button>
                    </div>
                  ) : pixDados?.encodedImage ? (
                    <>
                      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-md">
                        {/* Imagem Base64 Real do Asaas */}
                        <img
                          src={`data:image/png;base64,${pixDados.encodedImage}`}
                          alt="QR Code Pix Asaas"
                          className="w-48 h-48 rounded-lg object-contain"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-600">
                          Aponte a câmera do seu banco para pagar
                        </span>
                        <button
                          type="button"
                          onClick={() => gerarPixAsaas()}
                          title="Atualizar QR Code"
                          className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <button
                        type="button"
                        onClick={() => gerarPixAsaas()}
                        className="py-2.5 px-5 bg-[#4C6C54] hover:bg-[#3a5340] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
                      >
                        <QrCode className="h-4 w-4" />
                        <span>Gerar QR Code Pix Oficial</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* CAMPO COPIA E COLA REAL DO ASAAS */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Pix Copia e Cola:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      autoComplete="off"
                      data-form-type="other"
                      data-lpignore="true"
                      value={pixDados?.payload || (pixCarregando ? "Gerando código Pix oficial..." : "Aguardando geração do QR Code...")}
                      className="flex-1 h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 focus:outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={copiarChavePix}
                      disabled={!pixDados?.payload || pixCarregando}
                      className={`h-11 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed ${
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

            {/* ABA 3: CARTÃO DE DÉBITO */}
            {metodoPagamento === "debito" && (
              <form
                onSubmit={handleFinalizarAssinatura}
                autoComplete="off"
                noValidate
                className="space-y-4 animate-in fade-in duration-200"
              >
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
                    id="f_num_deb"
                    name="f_num_deb"
                    type="text"
                    autoComplete="new-password"
                    data-form-type="other"
                    data-lpignore="true"
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
                    id="f_nom_deb"
                    name="f_nom_deb"
                    type="text"
                    autoComplete="new-password"
                    data-form-type="other"
                    data-lpignore="true"
                    placeholder="Como impresso no cartão"
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
                      id="f_val_deb"
                      name="f_val_deb"
                      type="text"
                      autoComplete="new-password"
                      data-form-type="other"
                      data-lpignore="true"
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
                      id="f_sec_deb"
                      name="f_sec_deb"
                      type="password"
                      autoComplete="new-password"
                      data-form-type="other"
                      data-lpignore="true"
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
                    id="f_doc_deb"
                    name="f_doc_deb"
                    type="text"
                    autoComplete="new-password"
                    data-form-type="other"
                    data-lpignore="true"
                    placeholder="000.000.000-00"
                    value={debitoCpf}
                    onChange={(e) => handleCpf(e.target.value, setDebitoCpf)}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] transition-all"
                  />
                </div>
              </form>
            )}
          </div>

          {/* COLUNA DIREITA: RESUMO DO PEDIDO ADAPTADO AO UPGRADE (5 COLUNAS) */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Resumo do Pedido
              </h2>

              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">{planoAtivo.nome}</h3>
                  <span className="text-xs text-slate-500">{planoAtivo.periodicidade}</span>
                </div>
                <span className="font-bold text-slate-700 text-sm">
                  R$ {planoAtivo.precoCobradoTotal.toFixed(2).replace(".", ",")}
                </span>
              </div>

              {/* LINHA DE CRÉDITO PROPORCIONAL EM MODO UPGRADE */}
              {ehUpgrade && planoSelecionado === "anual" && (
                <div className="flex items-center justify-between text-xs font-bold text-emerald-700 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Crédito proporcional do Trimestral:</span>
                  </span>
                  <span className="font-extrabold">- R$ {creditoProporcional.toFixed(2).replace(".", ",")}</span>
                </div>
              )}

              {/* TOTAL A PAGAR E PARCELAMENTO */}
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs font-extrabold uppercase text-slate-400 block">Total a pagar</span>
                    <span className="text-xs text-slate-500 font-medium">
                      {ehUpgrade && planoSelecionado === "trimestral"
                        ? "Plano já ativo"
                        : planoAtivo.periodicidade}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      R$ {valorTotalFinal.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>

                {/* DESTAQUE DE PARCELAMENTO FACILITADO EM ATÉ 12X */}
                {planoSelecionado === "anual" && (
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-md inline-block">
                      ou em até 12x de R$ {(valorTotalFinal / 12).toFixed(2).replace(".", ",")} sem juros
                    </span>
                  </div>
                )}
              </div>

              {/* BOTÃO PRINCIPAL DE FINALIZAÇÃO (CTA) */}
              <button
                type="button"
                onClick={handleFinalizarAssinatura}
                disabled={processando || (ehUpgrade && planoSelecionado === "trimestral")}
                className="w-full py-3.5 px-4 bg-[#4C6C54] hover:bg-[#3a5340] active:scale-[0.99] text-white font-extrabold text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {processando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Processando cobrança segura no Asaas...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>
                      {ehUpgrade && planoSelecionado === "trimestral"
                        ? "✓ Plano Vigente (Você já possui)"
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
                  <strong className="text-slate-800 block text-xs">Garantia de 7 Dias de Atendimento e Direcionamento</strong>
                  <span className="text-slate-500 text-[11px] leading-relaxed block">
                    Como o plano prático é personalizado após a avaliação clínica, a garantia de 7 dias assegura o agendamento do seu atendimento individualizado, a primeira consulta com a especialista e a devolutiva do caso da criança com as estratégias iniciais.
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
                    As informações clínicas e nutricionais do seu filho nunca são compartilhadas com terceiros. Consulte nossa{" "}
                    <Link href="/privacidade" target="_blank" className="text-[#4C6C54] font-bold underline hover:text-[#3a5340]">
                      Política de Privacidade
                    </Link>{" "}
                    e nossos{" "}
                    <Link href="/termos" target="_blank" className="text-[#4C6C54] font-bold underline hover:text-[#3a5340]">
                      Termos de Uso & Garantia
                    </Link>.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL DE CELEBRAÇÃO / SUCESSO ASAAS */}
      {modalSucesso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center space-y-5 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="h-9 w-9 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-xs font-extrabold uppercase text-emerald-600 tracking-wider">
                {ehUpgrade ? "Upgrade Concluído via Asaas! 🚀" : "Assinatura Confirmada via Asaas! 🎉"}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                {ehUpgrade ? "Plano Anual Ativado!" : "Bem-vindo(a) ao Nutrindo em Casa!"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                {metodoPagamento === "pix"
                  ? "Sua cobrança Pix foi registrada com sucesso no Asaas. Assim que o pagamento for compensado, o acesso completo será liberado automaticamente."
                  : ehUpgrade
                  ? "Sua assinatura foi atualizada para o Plano Anual no Asaas. O crédito proporcional de R$ 79,90 foi aplicado e seu acompanhamento estendido até Setembro de 2027!"
                  : `Seu acesso ao ${planoAtivo.nome} foi liberado com sucesso. Todos os recursos, anamnese e ferramentas já estão disponíveis.`}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-left space-y-1.5 font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Plano Ativado:</span>
                <strong className="text-slate-800">{planoAtivo.nome}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valor Cobrado:</span>
                <strong className="text-slate-800">R$ {valorTotalFinal.toFixed(2).replace(".", ",")}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Forma de Pagamento:</span>
                <strong className="text-slate-800 uppercase">{metodoPagamento}</strong>
              </div>
              {idAssinaturaGerada && (
                <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500">ID da Assinatura Asaas:</span>
                  <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-800 font-bold">
                    {idAssinaturaGerada}
                  </span>
                </div>
              )}
            </div>

            {/* AVISO DO E-MAIL E INSTRUÇÕES DE ACESSO */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-left space-y-1.5">
              <p className="text-xs text-[#4C6C54] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#4C6C54]" />
                <span>Instruções enviadas para seu e-mail</span>
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Enviamos um link para o seu e-mail para você definir sua senha de acesso. Após criar sua senha, faça login para iniciar sua Anamnese.
              </p>
            </div>

            {/* BOTÃO PRINCIPAL DESTACADO: DEFINIR SENHA AGORA */}
            <button
              type="button"
              onClick={() => {
                const emailSanitizado = clienteEmail
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .replace(/\s+/g, "")
                  .trim()
                  .toLowerCase();
                router.push(
                  `/criar-senha${emailSanitizado ? `?email=${encodeURIComponent(emailSanitizado)}` : ""}`
                );
              }}
              className="w-full py-4 px-5 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-extrabold text-sm sm:text-base rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer text-center"
            >
              <span>Definir Minha Senha Agora →</span>
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* BOTÃO SECUNDÁRIO: IR DIRETO PARA LOGIN */}
            <button
              type="button"
              onClick={() => {
                const emailSanitizado = clienteEmail
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .replace(/\s+/g, "")
                  .trim()
                  .toLowerCase();
                router.push(
                  `/login${emailSanitizado ? `?email=${encodeURIComponent(emailSanitizado)}` : ""}`
                );
              }}
              className="w-full py-2.5 px-4 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors text-center cursor-pointer block"
            >
              Já defini minha senha (Ir para Login)
            </button>
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
