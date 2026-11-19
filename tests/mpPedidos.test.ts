/**
 * Testes dos pedidos enviados ao Mercado Pago (montagem do corpo, validação do token do cartão,
 * leitura do Pix) e da regra de envio do link de renovação. Não usam rede. Rodam com `npm test`.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  ehRenovacao,
  cobrouJuros,
  extrairPix,
  metodoCartaoValido,
  parcelaSemJuros,
  montarAssinatura,
  montarPedidoCartao,
  montarPedidoPix,
  referenciaExterna,
  tokenCartaoValido,
  valorTexto,
} from "../src/lib/mpPayloads.ts";
import { DIAS_ANTES_DO_LINK, precisaAvisarCartao, precisaEnviarLink, type PerfilRenovacaoLink } from "../src/lib/renovacaoRegras.ts";

const comprador = { email: "maria@example.com", nome: "Maria da Silva Souza", cpf: "12345678909" };

describe("Pedidos do Mercado Pago — montagem do corpo", () => {
  it("valor sempre em texto com 2 casas", () => {
    assert.equal(valorTexto(197), "197.00");
    assert.equal(valorTexto(531.9), "531.90");
    assert.equal(valorTexto(1707.99), "1707.99");
  });

  it("Pix: valor, método, expiração e pagador com CPF", () => {
    const p = montarPedidoPix({ valor: 197, comprador, referencia: "compra-1", descricao: "Plano Mensal" });
    assert.equal(p.total_amount, "197.00");
    assert.equal(p.transactions.payments[0].amount, "197.00");
    assert.deepEqual(p.transactions.payments[0].payment_method, { id: "pix", type: "bank_transfer" });
    assert.equal(p.transactions.payments[0].expiration_time, "PT30M");
    assert.equal(p.payer.first_name, "Maria");
    assert.equal(p.payer.last_name, "da Silva Souza");
    assert.deepEqual(p.payer.identification, { type: "CPF", number: "12345678909" });
  });

  it("Pix de renovação usa a validade informada", () => {
    const p = montarPedidoPix({ valor: 531.9, comprador, referencia: "renovacao-20270219", descricao: "x", expiracao: "P10D" });
    assert.equal(p.transactions.payments[0].expiration_time, "P10D");
  });

  it("cartão: leva só o TOKEN e as parcelas (nunca número ou CVV)", () => {
    const p = montarPedidoCartao({ valor: 531.9, comprador, referencia: "compra-2", descricao: "x", token: "a".repeat(32), metodo: "master", parcelas: 3 });
    const pg = p.transactions.payments[0];
    assert.equal(pg.payment_method.token, "a".repeat(32));
    assert.equal(pg.payment_method.installments, 3);
    assert.equal(pg.payment_method.type, "credit_card");
    const texto = JSON.stringify(p);
    assert.equal(/card_number|security_code|cvv|cardNumber/i.test(texto), false);
  });

  it("assinatura: ciclo em meses, valor numérico e cobrança imediata", () => {
    const a = montarAssinatura({ email: comprador.email, token: "b".repeat(32), meses: 3, valor: 531.9, motivo: "x", referencia: "assinatura-1", backUrl: "https://site/x" });
    assert.equal(a.status, "authorized");
    assert.equal(a.auto_recurring.frequency, 3);
    assert.equal(a.auto_recurring.frequency_type, "months");
    assert.equal(a.auto_recurring.transaction_amount, 531.9);
    assert.equal("start_date" in a.auto_recurring, false);
  });

  it("nome com uma palavra só continua válido", () => {
    const p = montarPedidoPix({ valor: 10, comprador: { ...comprador, nome: "Madonna" }, referencia: "compra-3", descricao: "x" });
    assert.equal(p.payer.first_name, "Madonna");
    assert.ok(p.payer.last_name.length > 0);
  });
});

describe("Pedidos do Mercado Pago — validações e leitura", () => {
  it("referência externa não leva e-mail nem caracteres estranhos", () => {
    assert.equal(referenciaExterna("compra", 123), "compra-123");
    assert.equal(referenciaExterna("renovacao", "2027-02-19"), "renovacao-20270219");
    assert.equal(/[@.\s]/.test(referenciaExterna("compra")), false);
  });

  it("reconhece pedido de renovação", () => {
    assert.equal(ehRenovacao("renovacao-20270219"), true);
    assert.equal(ehRenovacao("compra-1"), false);
    assert.equal(ehRenovacao(undefined), false);
  });

  it("token do cartão e bandeira: aceita o formato do MP.js e barra lixo", () => {
    assert.equal(tokenCartaoValido("0123456789abcdef0123456789abcdef"), true);
    assert.equal(tokenCartaoValido("curto"), false);
    assert.equal(tokenCartaoValido("../etc/passwd"), false);
    assert.equal(tokenCartaoValido({ id: "x" }), false);
    assert.equal(metodoCartaoValido("master"), true);
    assert.equal(metodoCartaoValido("visa"), true);
    assert.equal(metodoCartaoValido("MASTER; DROP"), false);
    assert.equal(metodoCartaoValido(""), false);
  });

  it("lê o QR Code do Pix da resposta do Mercado Pago", () => {
    const pix = extrairPix({
      transactions: { payments: [{ date_of_expiration: "2026-11-20T16:00:00.000+00:00", payment_method: { qr_code: "000201...", qr_code_base64: "iVBOR...", ticket_url: "https://mp/ticket" } }] },
    });
    assert.equal(pix.qrCode, "000201...");
    assert.equal(pix.qrCodeBase64, "iVBOR...");
    assert.equal(pix.ticketUrl, "https://mp/ticket");
    assert.equal(pix.expiraEm, "2026-11-20T16:00:00.000+00:00");
    assert.deepEqual(extrairPix({}), { qrCode: undefined, qrCodeBase64: undefined, ticketUrl: undefined, expiraEm: undefined });
  });
});

describe("Renovação por link (Pix) — quando enviar", () => {
  const base: PerfilRenovacaoLink = {
    email: "a@b.com",
    nome: "A",
    plano: "trimestral",
    proxima_cobranca: "2027-02-19",
    renovacao_aviso_ciclo: null,
    renovacao_automatica: true,
    status_assinatura: "ATIVO",
    gateway_assinatura_id: null,
    acesso_ate: null,
  };

  it("envia a partir de 7 dias antes do vencimento (e não antes), como informado nos Termos", () => {
    assert.equal(DIAS_ANTES_DO_LINK, 7);
    assert.equal(precisaEnviarLink(base, "2027-02-12"), true);
    assert.equal(precisaEnviarLink(base, "2027-02-19"), true);
    assert.equal(precisaEnviarLink(base, "2027-02-11"), false);
  });

  it("continua enviando se a rotina ficou parada e o vencimento já passou", () => {
    assert.equal(precisaEnviarLink(base, "2027-02-21"), true);
  });

  it("não envia duas vezes no mesmo ciclo", () => {
    assert.equal(precisaEnviarLink({ ...base, renovacao_aviso_ciclo: "2027-02-19" }, "2027-02-19"), false);
    assert.equal(precisaEnviarLink({ ...base, renovacao_aviso_ciclo: "2026-11-19" }, "2027-02-19"), true);
  });

  it("não envia para assinatura de cartão (o Mercado Pago renova), cancelada ou inativa", () => {
    assert.equal(precisaEnviarLink({ ...base, gateway_assinatura_id: "2c93808" }, "2027-02-19"), false);
    assert.equal(precisaEnviarLink({ ...base, renovacao_automatica: false }, "2027-02-19"), false);
    assert.equal(precisaEnviarLink({ ...base, acesso_ate: "2027-02-19T00:00:00Z" }, "2027-02-19"), false);
    assert.equal(precisaEnviarLink({ ...base, status_assinatura: "INADIMPLENTE" }, "2027-02-19"), false);
    assert.equal(precisaEnviarLink({ ...base, plano: null }, "2027-02-19"), false);
    assert.equal(precisaEnviarLink({ ...base, proxima_cobranca: null }, "2027-02-19"), false);
  });
});

describe("Aviso de renovação no cartão (assinatura do Mercado Pago)", () => {
  const cartao: PerfilRenovacaoLink = {
    email: "a@b.com",
    nome: "A",
    plano: "mensal",
    proxima_cobranca: "2027-02-19",
    renovacao_aviso_ciclo: null,
    renovacao_automatica: true,
    status_assinatura: "ATIVO",
    gateway_assinatura_id: "2c93808",
    acesso_ate: null,
  };

  it("avisa 7 dias antes, uma vez por ciclo", () => {
    assert.equal(precisaAvisarCartao(cartao, "2027-02-12"), true);
    assert.equal(precisaAvisarCartao(cartao, "2027-02-11"), false);
    assert.equal(precisaAvisarCartao({ ...cartao, renovacao_aviso_ciclo: "2027-02-19" }, "2027-02-15"), false);
  });

  it("não avisa depois do vencimento, nem quem cancelou, nem quem não tem assinatura de cartão", () => {
    assert.equal(precisaAvisarCartao(cartao, "2027-02-20"), false);
    assert.equal(precisaAvisarCartao({ ...cartao, renovacao_automatica: false }, "2027-02-15"), false);
    assert.equal(precisaAvisarCartao({ ...cartao, acesso_ate: "2027-02-19T00:00:00Z" }, "2027-02-15"), false);
    assert.equal(precisaAvisarCartao({ ...cartao, gateway_assinatura_id: null }, "2027-02-15"), false);
  });
});

describe("Parcelamento sem juros (a conta do Mercado Pago decide quem paga os juros)", () => {
  const contaComJuros = [
    { installments: 1, installment_rate: 0 },
    { installments: 2, installment_rate: 9.64 },
    { installments: 3, installment_rate: 11.23 },
  ];
  const contaSemJuros = [
    { installments: 1, installment_rate: 0 },
    { installments: 2, installment_rate: 0 },
    { installments: 3, installment_rate: 0 },
  ];

  it("reconhece a conta que cobra juros do cliente e a que não cobra", () => {
    assert.equal(parcelaSemJuros(contaComJuros, 3), false);
    assert.equal(parcelaSemJuros(contaSemJuros, 3), true);
    assert.equal(parcelaSemJuros(contaComJuros, 1), true);
  });

  it("parcela que a conta nem oferece é recusada; tabela indisponível não bloqueia (a 2ª proteção decide)", () => {
    assert.equal(parcelaSemJuros(contaSemJuros, 12), false);
    assert.equal(parcelaSemJuros(undefined, 3), null);
    assert.equal(parcelaSemJuros(null, 3), null);
  });

  it("detecta juros cobrados do cliente pelo total pago", () => {
    assert.equal(cobrouJuros("591.63", 531.9), true);
    assert.equal(cobrouJuros("531.90", 531.9), false);
    assert.equal(cobrouJuros(531.9, 531.9), false);
    assert.equal(cobrouJuros("531.91", 531.9), false); // tolerância de 1 centavo
    assert.equal(cobrouJuros(undefined, 531.9), false);
  });
});
