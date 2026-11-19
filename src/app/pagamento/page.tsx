"use client";

import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { PARCELAS_PERMITIDAS } from "@/lib/planos";
import { TERMOS_VERSAO } from "@/lib/termos";
import {
  ShieldCheck, Lock, CheckCircle2, Copy, Check, CreditCard,
  QrCode, ArrowLeft, Sparkles, AlertCircle, ChevronRight,
  Clock, Award, Shield, Flame, RefreshCw, Loader2, Tag, X, Info
} from "lucide-react";

type TipoPlano = "mensal" | "trimestral" | "anual";
type MetodoPagamento = "pix" | "credito";

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

function luhnValido(numero: string): boolean {
  let soma = 0;
  let dobrar = false;
  for (let i = numero.length - 1; i >= 0; i--) {
    let d = parseInt(numero[i], 10);
    if (dobrar) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    soma += d;
    dobrar = !dobrar;
  }
  return soma % 10 === 0;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- SDK do Mercado Pago (MP.js) não tem tipos */
const CHAVE_PUBLICA_MP = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || "";

/** Troca os dados do cartão por um TOKEN no próprio navegador: número e CVV nunca chegam ao nosso servidor. */
async function gerarTokenDoCartao(d: { numero: string; nome: string; mes: string; ano: string; cvv: string; cpf: string }) {
  const w = window as any;
  if (!CHAVE_PUBLICA_MP) throw new Error("O pagamento por cartão ainda não está disponível. Use o Pix ou tente novamente mais tarde.");
  if (!w.MercadoPago) throw new Error("O ambiente seguro de pagamento ainda está carregando. Aguarde um instante e tente de novo.");
  const msgPadrao = "Não foi possível validar o cartão. Confira os dados (número, validade e código) e tente novamente.";
  try {
    const mp = new w.MercadoPago(CHAVE_PUBLICA_MP, { locale: "pt-BR" });
    const token = await mp.createCardToken({
      cardNumber: d.numero,
      cardholderName: d.nome,
      cardExpirationMonth: d.mes,
      cardExpirationYear: d.ano,
      securityCode: d.cvv,
      identificationType: "CPF",
      identificationNumber: d.cpf,
    });
    if (!token?.id) throw new Error(msgPadrao);
    const metodos = await mp.getPaymentMethods({ bin: d.numero.slice(0, 8) });
    const metodo = metodos?.results?.[0]?.id;
    if (!metodo) throw new Error("Não foi possível identificar a bandeira do cartão. Confira o número digitado.");
    return { token: String(token.id), metodo: String(metodo), deviceId: String(w.MP_DEVICE_SESSION_ID || "") };
  } catch (e) {
    // o SDK rejeita com texto ou lista de erros (não com Error): nunca mostrar isso cru ao cliente
    console.warn("MP.js:", typeof e === "string" ? e : e instanceof Error ? e.message : "erro ao gerar o token do cartão");
    throw e instanceof Error ? e : new Error(msgPadrao);
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

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

  // Estado do Pix
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
  const [parcelasCompradas, setParcelasCompradas] = useState(1);
  const [aceiteCompra, setAceiteCompra] = useState(false);
  const [proximaCobrancaInfo, setProximaCobrancaInfo] = useState("");
  const [modalSucesso, setModalSucesso] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);
  // Criar a senha aqui mesmo, logo após o pagamento confirmado (sem depender do link do e-mail)
  const [tokenAcesso, setTokenAcesso] = useState("");
  const [cartaoConfirmado, setCartaoConfirmado] = useState(false);
  const [novaSenha, setNovaSenha] = useState("");
  const [novaSenha2, setNovaSenha2] = useState("");
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [criandoSenha, setCriandoSenha] = useState(false);
  const [erroSenha, setErroSenha] = useState("");
  const [erroForm, setErroForm] = useState("");

  // Crédito proporcional do plano vigente
  const creditoProporcional = ehUpgrade ? 177.30 : 0;

  // Planos disponíveis
  const planos: Record<TipoPlano, DetalhesPlano> = {
    mensal: {
      id: "mensal",
      nome: "Plano Mensal",
      precoEquivalenteMes: "R$ 197,00",
      precoCobradoTotal: 197.00,
      subtotal: 197.00,
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
      precoEquivalenteMes: "R$ 177,30",
      precoCobradoTotal: 531.90,
      subtotal: 591.00,
      economiaTexto: "10% OFF",
      economiaValor: 59.10,
      periodicidade: "Cobrado R$ 531,90 a cada 3 meses",
      descricao: "Tempo ideal para consolidação das rotinas",
      destaque: !ehUpgrade,
      beneficios: [
        "Todos os benefícios do Mensal",
        "Consulta por videochamada (encontro de alinhamento com especialista) a cada 45 dias (ou 6 semanas)",
        "Economia de 10% no ciclo"
      ]
    },
    anual: {
      id: "anual",
      nome: "Plano Anual",
      badge: ehUpgrade ? "🔥 Oportunidade: Economize R$ 354,60 no ano" : "Melhor Custo-Benefício",
      badgeCor: "bg-[#EB6D57] text-white",
      precoEquivalenteMes: "R$ 167,45",
      precoCobradoTotal: 2009.40,
      subtotal: 2364.00,
      economiaTexto: "15% OFF",
      economiaValor: 354.60,
      periodicidade: "Cobrado R$ 2.009,40 ao ano",
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

  // Estado do Cupom de Desconto
  const [cupomCodigo, setCupomCodigo] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState<{ codigo: string; descontoPercent: number } | null>(null);
  const [cupomErro, setCupomErro] = useState("");
  const [cupomCarregando, setCupomCarregando] = useState(false);

  const cuponsValidos: Record<string, number> = {
    NUTRINDO10: 10,
    PRIMEIRACONSULTA: 15,
    LAIS20: 20,
    BEMVINDO: 10,
    FAMILIA10: 10,
  };

  const aplicarCupom = async () => {
    setCupomErro("");
    const codigoLimpo = cupomCodigo.trim().toUpperCase();
    if (!codigoLimpo) {
      setCupomErro("Digite o código do cupom.");
      return;
    }

    setCupomCarregando(true);
    try {
      const res = await fetch(`/api/cupons?codigo=${encodeURIComponent(codigoLimpo)}`);
      const data = await res.json();

      if (res.ok && data.success && data.cupom) {
        setCupomAplicado({
          codigo: data.cupom.codigo,
          descontoPercent: Number(data.cupom.percentual),
        });
        setCupomErro("");
      } else {
        // Se a API retornou erro específico (expirado, esgotado, etc.)
        if (data.message && data.message !== "Cupom inválido ou não encontrado.") {
          setCupomErro(data.message);
        } else if (cuponsValidos[codigoLimpo]) {
          // Fallback para códigos pré-definidos se não cadastrado dinamicamente
          setCupomAplicado({ codigo: codigoLimpo, descontoPercent: cuponsValidos[codigoLimpo] });
          setCupomErro("");
        } else {
          setCupomErro(data.message || "Cupom inválido ou expirado.");
        }
      }
    } catch {
      if (cuponsValidos[codigoLimpo]) {
        setCupomAplicado({ codigo: codigoLimpo, descontoPercent: cuponsValidos[codigoLimpo] });
        setCupomErro("");
      } else {
        setCupomErro("Erro ao verificar cupom. Tente novamente.");
      }
    } finally {
      setCupomCarregando(false);
    }
  };

  const removerCupom = () => {
    setCupomAplicado(null);
    setCupomCodigo("");
    setCupomErro("");
  };

  // Cálculo do desconto por cupom
  const descontoCupomValor = cupomAplicado
    ? (planoAtivo.precoCobradoTotal * cupomAplicado.descontoPercent) / 100
    : 0;

  // Cálculo do total final com desconto de crédito proporcional e cupom
  const valorTotalFinal = (ehUpgrade && planoSelecionado === "anual")
    ? Math.max(0, planoAtivo.precoCobradoTotal - creditoProporcional - descontoCupomValor)
    : Math.max(0, planoAtivo.precoCobradoTotal - descontoCupomValor);

  // =========================================================================
  // PIX
  // =========================================================================
  const gerarPix = useCallback(async () => {
    setPixCarregando(true);
    setPixErro("");

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

      const res = await fetch("/api/pagamentos/assinatura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nomeEnvio,
          email: emailEnvio,
          cpf: clienteCpf || cartaoCpf,
          celular: clienteCelular,
          billingType: "PIX",
          aceiteTermos: true,
          versaoTermos: TERMOS_VERSAO,
          plano: planoSelecionado,
          origem: ehUpgrade ? "upgrade" : undefined,
          cupom: cupomAplicado?.codigo,
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Erro ao gerar o QR Code Pix.");
      }

      setPixDados({
        encodedImage: data.encodedImage,
        payload: data.payload,
        expirationDate: data.expirationDate,
        subscriptionId: data.subscriptionId,
        paymentId: data.paymentId
      });
      setTempoRestantePix(899);
      setIdAssinaturaGerada(data.subscriptionId);
      setTokenAcesso(data.tokenAcesso || "");
      if (data.emailEnviado) {
        setEmailEnviado(true);
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("nutrindo_user_email", emailEnvio);
        localStorage.setItem("nutrindo_user_nome", nomeEnvio);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao conectar com o servidor de pagamentos.";
      setPixErro(msg);
    } finally {
      setPixCarregando(false);
    }
  }, [clienteNome, clienteEmail, clienteCpf, clienteCelular, cartaoNome, cartaoCpf, planoSelecionado, valorTotalFinal, cupomAplicado, ehUpgrade]);

  // Reseta o PIX caso o usuário troque de plano para garantir valor atualizado
  useEffect(() => {
    setPixDados(null);
  }, [planoSelecionado]);

  // Pix: consulta o servidor a cada 4 s até o pagamento ser confirmado (o aviso do provedor de pagamento marca a fatura como paga)
  const [pixPago, setPixPago] = useState(false);
  const paymentIdPix = pixDados?.paymentId;
  useEffect(() => {
    if (metodoPagamento !== "pix" || !paymentIdPix || pixPago) return;
    let ativo = true;
    const consultar = async () => {
      try {
        const res = await fetch(`/api/pagamentos/status?id=${encodeURIComponent(paymentIdPix)}`, { cache: "no-store" });
        const json = await res.json();
        if (ativo && json?.pago) {
          setPixPago(true);
          setEmailEnviado(true);
          setModalSucesso(true);
        }
      } catch {
        /* tenta de novo no próximo ciclo */
      }
    };
    const intervalo = setInterval(consultar, 4000);
    void consultar();
    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [metodoPagamento, paymentIdPix, pixPago]);

  // Contador regressivo do Pix (15 minutos)
  useEffect(() => {
    if (metodoPagamento !== "pix") return;
    const intervalo = setInterval(() => {
      setTempoRestantePix((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(intervalo);
  }, [metodoPagamento]);

  const podeCriarSenhaAqui = Boolean(tokenAcesso) && !ehUpgrade && (metodoPagamento === "pix" ? pixPago : cartaoConfirmado);

  const criarSenhaEEntrar = async () => {
    setErroSenha("");
    if (novaSenha.length < 8 || !/\d/.test(novaSenha) || !/[A-Za-zÀ-ú]/.test(novaSenha)) {
      setErroSenha("A senha precisa ter pelo menos 8 caracteres, com letras e números.");
      return;
    }
    if (novaSenha !== novaSenha2) {
      setErroSenha("As senhas não conferem.");
      return;
    }
    setCriandoSenha(true);
    try {
      const res = await fetch("/api/auth/criar-senha-compra", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenAcesso, senha: novaSenha }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setErroSenha(json.message || "Não foi possível criar a senha agora. Use o link enviado ao seu e-mail.");
        setCriandoSenha(false);
        return;
      }
      // entra direto na plataforma, como no login
      const emailLogin = String(json.email || clienteEmail).trim().toLowerCase();
      const login = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailLogin, password: novaSenha }),
      });
      const dados = await login.json();
      if (!login.ok || !dados.token) {
        router.push(`/login?email=${encodeURIComponent(emailLogin)}&senha=true`);
        return;
      }
      ["anamnese_concluida", "nutrindo_anamnese_concluida", "consulta_agendada", "nutrindo_consulta_agendada"].forEach((k) =>
        localStorage.removeItem(k)
      );
      localStorage.setItem("nutrindo_user_email", dados.user?.email || emailLogin);
      localStorage.setItem("nutrindo_auth_token", dados.token);
      if (dados.refresh_token) localStorage.setItem("nutrindo_refresh_token", dados.refresh_token);
      localStorage.setItem("nutrindo_user_nome", dados.user?.nome || clienteNome || "Responsável");
      localStorage.setItem("nutrindo_user_role", "cliente");
      localStorage.setItem("nutrindo_status_assinatura", dados.user?.status_assinatura || "ATIVO");
      router.replace("/anamnese");
    } catch {
      setErroSenha("Não foi possível criar a senha agora. Use o link enviado ao seu e-mail.");
      setCriandoSenha(false);
    }
  };

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

  // Parcelamento no cartão: mesmas quantidades aceitas pelo servidor (PARCELAS_PERMITIDAS), sempre sem juros
  const getOpcoesParcelamento = () => {
    const brl = (v: number) => v.toFixed(2).replace(".", ",");
    return PARCELAS_PERMITIDAS[planoSelecionado]
      .filter((n) => n === 1 || valorTotalFinal / n >= 5)
      .map((n) => ({
        parcelas: n,
        valorParcela: valorTotalFinal / n,
        texto: n === 1 ? `1x de R$ ${brl(valorTotalFinal)} à vista` : `${n}x de R$ ${brl(valorTotalFinal / n)} sem juros`,
      }));
  };

  // Se trocar de plano/cupom e a quantidade escolhida deixar de existir, volta para à vista
  useEffect(() => {
    const validas = PARCELAS_PERMITIDAS[planoSelecionado].filter((n) => n === 1 || valorTotalFinal / n >= 5);
    if (!validas.includes(Number(parcelas))) setParcelas("1");
  }, [planoSelecionado, valorTotalFinal, parcelas]);

  // =========================================================================
  // VALIDAÇÃO LOCAL E DESTAQUE CAMPO A CAMPO
  // =========================================================================
  const validarFormularioCartao = (): boolean => {
    const novosErros: ErrosCartao = {};

    // 1. Número do Cartão (13 a 19 dígitos, com verificação do dígito final)
    const numLimpo = cartaoNumero.replace(/\D/g, "");
    if (!numLimpo) {
      novosErros.numero = "Digite o número do cartão de crédito.";
    } else if (numLimpo.length < 13 || numLimpo.length > 19 || !luhnValido(numLimpo)) {
      novosErros.numero = "Número de cartão inválido. Confira os dígitos.";
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
    `w-full h-11 px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${hasError
      ? "bg-red-50/20 border border-red-400 ring-2 ring-red-100 text-slate-900 focus:outline-none focus:border-red-500"
      : "bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] focus:bg-white"
    }`;

  // =========================================================================
  // FINALIZAÇÃO DE ASSINATURA
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
    if (!aceiteCompra) {
      setErroForm("Para continuar, marque que leu e aceita os Termos de Uso e a Política de Privacidade, incluindo a renovação automática.");
      return;
    }

    // Fluxo do PIX
    if (metodoPagamento === "pix") {
      if (!pixDados?.encodedImage) {
        setProcessando(true);
        await gerarPix();
        setProcessando(false);
      }
      return;
    }

    // Fluxo do cartão de crédito
    if (metodoPagamento === "credito") {
      // Validação local campo a campo
      const formValido = validarFormularioCartao();
      if (!formValido) {
        return;
      }

      const numLimpo = cartaoNumero.replace(/\D/g, "");
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

        // Dados do cartão ficam só no navegador: o servidor recebe apenas o token
        const [mesCartao, anoCartao] = cartaoValidade.split("/");
        const dadosCartaoSeguro = await gerarTokenDoCartao({
          numero: numLimpo,
          nome: cartaoNome.trim(),
          mes: mesCartao,
          ano: `20${anoCartao}`,
          cvv: cartaoCvv.trim(),
          cpf: (cartaoCpf || clienteCpf).replace(/D/g, ""),
        });

        const res = await fetch("/api/pagamentos/assinatura", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: nomeEnvio,
            email: emailEnvio,
            cpf: clienteCpf || cartaoCpf,
            celular: clienteCelular,
            billingType: "CREDIT_CARD",
            aceiteTermos: true,
            versaoTermos: TERMOS_VERSAO,
            plano: planoSelecionado,
            origem: ehUpgrade ? "upgrade" : undefined,
            parcelas: Number(parcelas) || 1,
            cupom: cupomAplicado?.codigo,
            cartao: dadosCartaoSeguro,
          })
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setErroForm(
            data.message ||
            "Não foi possível autorizar o cartão. Verifique os dados ou utilize o Pix."
          );
          setProcessando(false);
          return;
        }

        if (typeof window !== "undefined") {
          localStorage.setItem("nutrindo_user_email", emailEnvio);
          localStorage.setItem("nutrindo_user_nome", nomeEnvio);
        }

        setIdAssinaturaGerada(data.subscriptionId);
        setTokenAcesso(data.tokenAcesso || "");
        setCartaoConfirmado(Boolean(data.pagamentoConfirmado));
        setParcelasCompradas(Number(data.parcelas) || 1);
        setProximaCobrancaInfo(data.proximaCobranca || "");
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

    setErroForm("Forma de pagamento indisponível. Escolha Pix ou Cartão de Crédito.");
  };

  return (
    <div className="min-h-screen bg-[#F0EAE1] text-slate-800 font-sans pb-20">
      {/* Ambiente seguro do Mercado Pago: gera o token do cartão no navegador */}
      <Script src="https://sdk.mercadopago.com/js/v2" strategy="afterInteractive" />
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
                Lucas, você possui o <strong>Plano Trimestral ativo até 18/10/2026</strong>. Ao migrar para o <strong>Plano Anual</strong>, você garante o menor valor mensal (R$ 167,45/mês), estende seu acompanhamento com a Dra. Laís e mantém seus dias já pagos como crédito proporcional!
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
              className={`rounded-3xl p-5 sm:p-6 transition-all flex flex-col justify-between ${ehUpgrade
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
                      className={`h-6 w-6 rounded-full border flex items-center justify-center shrink-0 ${planoSelecionado === "mensal"
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
                      R$ 197,00
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
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${planoSelecionado === "mensal"
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
              className={`relative rounded-3xl p-5 sm:p-6 transition-all flex flex-col justify-between ${ehUpgrade
                ? "bg-slate-50/90 border border-slate-300 shadow-2xs"
                : planoSelecionado === "trimestral"
                  ? "bg-white border-2 border-[#4C6C54] shadow-xl ring-4 ring-[#4C6C54]/10 cursor-pointer"
                  : "bg-white/80 hover:bg-white border border-slate-200 shadow-xs hover:shadow-md cursor-pointer"
                }`}
            >
              {/* BADGE SUPERIOR */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
                <span className={`px-3.5 py-1 rounded-full text-[11px] font-extrabold shadow-sm tracking-wide ${ehUpgrade ? "bg-slate-800 text-white" : "bg-emerald-500 text-white"
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
                      className={`h-6 w-6 rounded-full border flex items-center justify-center shrink-0 ${planoSelecionado === "trimestral"
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
                      R$ 177,30
                    </span>
                    <span className="text-xs font-semibold text-slate-500">/mês</span>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 font-medium">R$ 531,90 a cada 3 meses</span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                      10% OFF
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
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${planoSelecionado === "trimestral"
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
              className={`relative rounded-3xl p-5 sm:p-6 transition-all flex flex-col justify-between ${ehUpgrade
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
                  <span>🔥 Oportunidade: Economize R$ 354,60 no ano</span>
                </span>
              </div>

              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Plano Anual</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Consolidação dos ganhos e continuação do progresso</p>
                  </div>
                  <div
                    className={`h-6 w-6 rounded-full border flex items-center justify-center shrink-0 ${planoSelecionado === "anual"
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
                      R$ 167,45
                    </span>
                    <span className="text-xs font-semibold text-slate-500">/mês</span>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 font-medium">Cobrado R$ 2.009,40 ao ano</span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                      15% OFF
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
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${planoSelecionado === "anual"
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
                  Cobrança processada de forma segura pelo Mercado Pago.
                </p>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Mercado Pago
              </span>
            </div>

            {/* SELETOR DE ABAS */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setMetodoPagamento("credito")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${metodoPagamento === "credito"
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
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${metodoPagamento === "pix"
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
            </div>

            {erroForm && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{erroForm}</span>
              </div>
            )}

            {/* ABA 1: CARTÃO DE CRÉDITO COM VALIDAÇÃO LOCAL */}
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
                  {Number(parcelas) > 1 && (
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-2">
                      O valor total é cobrado de uma vez no cartão e aparece parcelado na sua fatura. <strong>Renovação automática:</strong> ao
                      fim do período, uma nova cobrança é feita no mesmo cartão, com aviso por e-mail 7 dias antes. Você pode cancelar a
                      qualquer momento em Configurações.
                    </p>
                  )}
                </div>
              </form>
            )}

            {/* ABA 2: PIX INSTANTÂNEO COM QR CODE */}
            {metodoPagamento === "pix" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* ESTADO 1: ANTES DE GERAR O PIX (CARD INFORMATIVO LIMPO) */}
                {!pixDados && !pixCarregando && (
                  <div className="p-5 sm:p-6 bg-emerald-50/60 border border-emerald-200/90 rounded-2xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[#4C6C54] text-white flex items-center justify-center shadow-xs">
                        <QrCode className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">
                          Liberação Imediata via PIX
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          Pagamento instantâneo e seguro processado pelo Mercado Pago
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-emerald-200/70 space-y-2 text-xs text-slate-700">
                      <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
                        <Info className="h-4 w-4 text-[#4C6C54]" />
                        <span>Como funciona a liberação via PIX:</span>
                      </p>
                      <ol className="list-decimal list-inside space-y-1.5 text-slate-600 font-medium leading-relaxed">
                        <li>
                          <strong>1. Preencha seus dados</strong> de contato e acesso acima;
                        </li>
                        <li>
                          <strong>2. Clique em Concluir Assinatura Segura</strong> ao lado para gerar seu QR Code PIX exclusivo e o código Copia e Cola com o valor atualizado.
                        </li>
                        <li>
                          Após o pagamento, o acesso é liberado instantaneamente.
                        </li>
                      </ol>
                    </div>

                    {pixErro && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                        <span>{pixErro}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-[11px] font-bold text-emerald-800 flex-wrap">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Aprovação em segundos
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Mercado Pago
                      </span>
                    </div>
                  </div>
                )}

                {/* ESTADO 2: CARREGANDO GERAÇÃO DO PIX */}
                {pixCarregando && (
                  <div className="flex flex-col items-center justify-center space-y-3 p-10 bg-slate-50 rounded-2xl border border-slate-200">
                    <Loader2 className="h-10 w-10 animate-spin text-[#4C6C54]" />
                    <span className="text-sm font-extrabold text-slate-800">
                      Gerando seu QR Code Pix...
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Conectando com o ambiente seguro de pagamento
                    </span>
                  </div>
                )}

                {/* ESTADO 3: PIX GERADO COM SUCESSO (QR CODE + COPIA E COLA + SIMULADOR SANDBOX) */}
                {pixDados?.encodedImage && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    {/* CONTADOR DE EXPIRAÇÃO */}
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-medium">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>O código Pix expira em:</span>
                      </div>
                      <strong className="font-mono text-emerald-800 text-sm font-extrabold bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                        {formatarTempo(tempoRestantePix)}
                      </strong>
                    </div>

                    {/* IMAGEM DO QR CODE */}
                    <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-md">
                        <img
                          src={pixDados.encodedImage.startsWith("data:") ? pixDados.encodedImage : `data:image/png;base64,${pixDados.encodedImage}`}
                          alt="QR Code Pix"
                          className="w-48 h-48 sm:w-52 sm:h-52 rounded-lg object-contain"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">
                          Aponte a câmera do aplicativo do seu banco para pagar
                        </span>
                        <button
                          type="button"
                          onClick={() => gerarPix()}
                          title="Atualizar QR Code"
                          className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* CAMPO PIX COPIA E COLA COM FEEDBACK */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase">
                        Código PIX Copia e Cola:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          autoComplete="off"
                          value={pixDados.payload}
                          className="flex-1 h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none select-all font-semibold"
                        />
                        <button
                          type="button"
                          onClick={copiarChavePix}
                          className={`h-11 px-4 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs ${copiadoPix
                            ? "bg-emerald-600 text-white"
                            : "bg-[#4C6C54] hover:bg-[#3a5340] text-white"
                            }`}
                        >
                          {copiadoPix ? (
                            <>
                              <Check className="h-4 w-4 stroke-[3]" />
                              <span>Código PIX Copiado! ✓</span>
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

                    {/* O acesso é liberado automaticamente quando o pagamento é confirmado */}
                    <div className="w-full p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold leading-relaxed mt-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 inline mr-1.5 -mt-0.5" />
                      Assim que o pagamento do Pix for confirmado (costuma levar poucos segundos), enviaremos para o seu e-mail o link para criar sua senha e acessar a plataforma. Confira também o spam.
                    </div>
                  </div>
                )}
              </div>
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

              {/* CAMPO DE CUPOM DE DESCONTO */}
              <div className="pt-1">
                {cupomAplicado ? (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl animation-fade-in text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-extrabold text-emerald-900 block">
                          Cupom {cupomAplicado.codigo} aplicado!
                        </span>
                        <span className="text-[11px] text-emerald-700">
                          {cupomAplicado.descontoPercent}% de desconto imediato
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removerCupom}
                      className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white transition-all cursor-pointer"
                      title="Remover cupom"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase">
                      Cupom de Desconto
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={cupomCodigo}
                          onChange={(e) => {
                            setCupomCodigo(e.target.value.toUpperCase());
                            setCupomErro("");
                          }}
                          placeholder="Ex: NUTRINDO10"
                          className="w-full h-9 pl-8 pr-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:bg-white"
                        />
                        <Tag className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>
                      <button
                        type="button"
                        onClick={aplicarCupom}
                        disabled={cupomCarregando}
                        className="h-9 px-3 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0"
                      >
                        {cupomCarregando ? "..." : "Aplicar"}
                      </button>
                    </div>
                    {cupomErro && (
                      <p className="text-[11px] text-red-500 font-semibold animation-fade-in">
                        {cupomErro}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* LINHA DE DESCONTO DO CUPOM */}
              {cupomAplicado && (
                <div className="flex items-center justify-between text-xs font-bold text-emerald-700 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200">
                  <span className="flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Desconto do Cupom ({cupomAplicado.descontoPercent}%):</span>
                  </span>
                  <span className="font-extrabold">- R$ {descontoCupomValor.toFixed(2).replace(".", ",")}</span>
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
                    {cupomAplicado && (
                      <span className="text-xs text-slate-400 line-through block font-bold">
                        R$ {planoAtivo.precoCobradoTotal.toFixed(2).replace(".", ",")}
                      </span>
                    )}
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#4C6C54] tracking-tight">
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
                    <span>Processando cobrança segura...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>
                      {ehUpgrade && planoSelecionado === "trimestral"
                        ? "✓ Plano Vigente (Você já possui)"
                        : metodoPagamento === "pix" && pixDados
                          ? "Aguardando o pagamento do Pix..."
                          : "Concluir Assinatura Segura"}
                    </span>
                  </>
                )}
              </button>

              <label className="flex items-start gap-2.5 text-[11px] text-slate-600 leading-relaxed cursor-pointer">
                <input
                  type="checkbox"
                  checked={aceiteCompra}
                  onChange={(e) => {
                    setAceiteCompra(e.target.checked);
                    if (e.target.checked) setErroForm("");
                  }}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#4C6C54] cursor-pointer"
                />
                <span>
                  Li e aceito os{" "}
                  <Link href="/termos" target="_blank" className="text-[#4C6C54] font-bold underline">
                    Termos de Uso
                  </Link>{" "}
                  e a{" "}
                  <Link href="/privacidade" target="_blank" className="text-[#4C6C54] font-bold underline">
                    Política de Privacidade
                  </Link>
                  , inclusive a <strong>renovação automática</strong> da assinatura ao fim de cada período (no cartão, com aviso por e-mail 7 dias antes). Posso cancelar quando quiser.
                </span>
              </label>
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
                    Dados blindados e processados diretamente pela infraestrutura de pagamento autorizada do Mercado Pago.
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

      {/* MODAL DE CELEBRAÇÃO / SUCESSO */}
      {modalSucesso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center space-y-5 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="h-9 w-9 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-xs font-extrabold uppercase text-emerald-600 tracking-wider">
                {ehUpgrade ? "Upgrade Concluído! 🚀" : "Assinatura Confirmada! 🎉"}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                {ehUpgrade ? "Plano Anual Ativado!" : "Bem-vindo(a) ao Nutrindo em Casa!"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                {metodoPagamento === "pix"
                  ? pixPago
                    ? "Pagamento do Pix confirmado! Seu acesso foi liberado."
                    : "Sua cobrança Pix foi registrada com sucesso. Assim que o pagamento for compensado, o acesso completo será liberado automaticamente."
                  : ehUpgrade
                    ? "Sua assinatura foi atualizada para o Plano Anual. O crédito proporcional de R$ 177,30 foi aplicado e seu acompanhamento estendido até Setembro de 2027!"
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
              {parcelasCompradas > 1 && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Parcelamento:</span>
                  <strong className="text-slate-800">{parcelasCompradas}x sem juros</strong>
                </div>
              )}
              {proximaCobrancaInfo && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Próxima renovação:</span>
                  <strong className="text-slate-800">{proximaCobrancaInfo.split("-").reverse().join("/")}</strong>
                </div>
              )}
              {idAssinaturaGerada && (
                <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500">ID da assinatura:</span>
                  <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-800 font-bold">
                    {idAssinaturaGerada}
                  </span>
                </div>
              )}
            </div>

            {/* CRIAR A SENHA AQUI MESMO (pagamento já confirmado) */}
            {podeCriarSenhaAqui && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void criarSenhaEEntrar();
                }}
                className="p-4 bg-white rounded-2xl border-2 border-[#4C6C54]/40 text-left space-y-3"
              >
                <p className="text-sm font-extrabold text-[#3D5A45]">Crie sua senha e comece agora</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Seu pagamento foi confirmado. Defina uma senha para entrar direto na plataforma e iniciar a anamnese, sem precisar abrir o e-mail.
                </p>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type={mostrarNovaSenha ? "text" : "password"}
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Senha (mín. 8 caracteres, letras e números)"
                      autoComplete="new-password"
                      className="w-full h-11 px-3 pr-16 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4C6C54]"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarNovaSenha((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-500 hover:text-slate-800 px-2 py-1 cursor-pointer"
                    >
                      {mostrarNovaSenha ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                  <input
                    type={mostrarNovaSenha ? "text" : "password"}
                    value={novaSenha2}
                    onChange={(e) => setNovaSenha2(e.target.value)}
                    placeholder="Repita a senha"
                    autoComplete="new-password"
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4C6C54]"
                  />
                </div>
                {erroSenha && (
                  <p role="alert" className="text-xs font-bold text-rose-600">
                    {erroSenha}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={criandoSenha}
                  className="w-full py-3.5 px-5 bg-[#4C6C54] hover:bg-[#3a5340] disabled:opacity-60 text-white font-extrabold text-sm rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {criandoSenha ? "Criando sua conta..." : "Criar senha e entrar →"}
                </button>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Prefere pelo e-mail? Também enviamos um link para criar a senha, e ele continua valendo.
                </p>
              </form>
            )}

            {/* AVISO DO E-MAIL E INSTRUÇÕES DE ACESSO */}
            {!podeCriarSenhaAqui && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-left space-y-1.5">
              <p className="text-xs text-[#4C6C54] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#4C6C54]" />
                <span>Falta só criar a sua senha</span>
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Em instantes você receberá no e-mail informado o link para criar sua senha de acesso (confira também o spam). Depois de criar a senha, faça login para iniciar sua Anamnese. Se o e-mail não chegar em alguns minutos, use &quot;Esqueci minha senha&quot; na tela de login.
              </p>
            </div>
            )}

            {/* BOTÃO: IR PARA O LOGIN (a senha também pode ser criada pelo link enviado ao e-mail) */}
            <button
              type="button"
              onClick={() => {
                const emailSanitizado = clienteEmail
                  .normalize("NFD")
                  .replace(/[̀-ͯ]/g, "")
                  .replace(/\s+/g, "")
                  .trim()
                  .toLowerCase();
                router.push(
                  `/login${emailSanitizado ? `?email=${encodeURIComponent(emailSanitizado)}` : ""}`
                );
              }}
              className={
                podeCriarSenhaAqui
                  ? "w-full py-2.5 px-5 bg-transparent text-slate-500 hover:text-slate-800 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer text-center underline underline-offset-2"
                  : "w-full py-4 px-5 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-extrabold text-sm sm:text-base rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer text-center"
              }
            >
              <span>{podeCriarSenhaAqui ? "Já tenho senha: ir para o login" : "Ir para o Login →"}</span>
              <ChevronRight className="h-4 w-4" />
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

