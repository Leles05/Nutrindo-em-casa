/* eslint-disable @typescript-eslint/no-explicit-any -- respostas JSON da API do Mercado Pago */

/**
 * Montagem dos pedidos ao Mercado Pago (funções PURAS, sem rede e sem dependências: testadas em tests/mpPedidos.test.ts).
 * O cartão NUNCA passa por aqui: o navegador troca os dados do cartão por um token (MP.js) e só o token chega ao servidor.
 */

/** Valor em texto com 2 casas (a Orders API exige string, ex.: "197.00"). */
export const valorTexto = (v: number) => v.toFixed(2);

export interface Comprador {
  email: string;
  nome: string;
  cpf: string;
}

function dividirNome(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return { first_name: partes[0] || nome, last_name: partes.slice(1).join(" ") || partes[0] || nome };
}

function pagador(c: Comprador) {
  return { email: c.email, ...dividirNome(c.nome), identification: { type: "CPF", number: c.cpf } };
}

/** Referência externa aceita pelo Mercado Pago (letras, números, hífen): nunca leva e-mail nem dados pessoais. */
export function referenciaExterna(tipo: "compra" | "renovacao" | "assinatura", marca: string | number = Date.now()) {
  return `${tipo}-${String(marca).replace(/[^A-Za-z0-9]/g, "")}`;
}

export function ehRenovacao(referencia: unknown): boolean {
  return typeof referencia === "string" && referencia.startsWith("renovacao-");
}

export function montarPedidoPix(o: { valor: number; comprador: Comprador; referencia: string; descricao: string; expiracao?: string }) {
  return {
    type: "online",
    processing_mode: "automatic",
    total_amount: valorTexto(o.valor),
    external_reference: o.referencia,
    description: o.descricao,
    payer: pagador(o.comprador),
    transactions: {
      payments: [
        {
          amount: valorTexto(o.valor),
          payment_method: { id: "pix", type: "bank_transfer" },
          expiration_time: o.expiracao || "PT30M",
        },
      ],
    },
  };
}

export function montarPedidoCartao(o: {
  valor: number;
  comprador: Comprador;
  referencia: string;
  descricao: string;
  token: string;
  metodo: string;
  parcelas: number;
}) {
  return {
    type: "online",
    processing_mode: "automatic",
    total_amount: valorTexto(o.valor),
    external_reference: o.referencia,
    description: o.descricao,
    payer: pagador(o.comprador),
    transactions: {
      payments: [
        {
          amount: valorTexto(o.valor),
          payment_method: { id: o.metodo, type: "credit_card", token: o.token, installments: o.parcelas },
        },
      ],
    },
  };
}

/** Assinatura (cartão à vista): a 1ª cobrança é feita na hora e as seguintes a cada `meses` meses. */
export function montarAssinatura(o: { email: string; token: string; meses: number; valor: number; motivo: string; referencia: string; backUrl: string }) {
  return {
    reason: o.motivo,
    external_reference: o.referencia,
    payer_email: o.email,
    card_token_id: o.token,
    back_url: o.backUrl,
    status: "authorized",
    auto_recurring: { currency_id: "BRL", frequency: o.meses, frequency_type: "months", transaction_amount: o.valor },
  };
}

/**
 * O Mercado Pago só cobra o parcelamento SEM juros do cliente se a conta do vendedor estiver configurada para assumir o custo
 * (não dá para escolher por requisição). A tabela de parcelas do vendedor mostra a taxa que o CLIENTE pagaria em cada parcela.
 * true = sem juros; false = com juros ou parcela não oferecida; null = tabela indisponível (não dá para saber).
 */
export function parcelaSemJuros(custos: any[] | undefined | null, parcelas: number): boolean | null {
  if (!Array.isArray(custos)) return null;
  const c = custos.find((x) => Number(x?.installments) === parcelas);
  if (!c) return false;
  return Number(c.installment_rate) === 0;
}

/** O total efetivamente pago pelo cliente passou do valor do plano? (juros cobrados do cliente) */
export function cobrouJuros(totalPago: unknown, valor: number): boolean {
  const t = Number(totalPago);
  return Number.isFinite(t) && t > valor + 0.01;
}

/** Token do cartão gerado pelo MP.js: 32 caracteres hexadecimais. */
export function tokenCartaoValido(t: unknown): t is string {
  return typeof t === "string" && /^[A-Za-z0-9]{16,64}$/.test(t);
}

/** Identificador da forma de pagamento do cartão (ex.: "master", "visa", "elo"). */
export function metodoCartaoValido(m: unknown): m is string {
  return typeof m === "string" && /^[a-z0-9_]{2,30}$/.test(m);
}

export interface DadosPix {
  qrCode?: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  expiraEm?: string;
}

export function extrairPix(ordem: any): DadosPix {
  const pg = ordem?.transactions?.payments?.[0];
  const pm = pg?.payment_method || {};
  return { qrCode: pm.qr_code, qrCodeBase64: pm.qr_code_base64, ticketUrl: pm.ticket_url, expiraEm: pg?.date_of_expiration };
}
