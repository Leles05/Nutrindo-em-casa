/**
 * Testes do tratamento dos avisos do Mercado Pago (estornos, renovações, avisos repetidos ou adiantados, avisos perdidos).
 * Rodam o código REAL de src/lib/pagamentosWebhook.ts contra um banco em memória e um Mercado Pago simulado
 * (tests/helpers/fakes.ts), pois o ambiente de teste do Mercado Pago não reproduz esses casos. Rodam com `npm test`.
 */
import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

import { bancoFalso, mercadoPagoFalso, type MercadoPagoFalso } from "./helpers/fakes.ts";

register("./helpers/alias-hooks.mjs", import.meta.url);
process.env.RESEND_API_KEY = "re_teste";
process.env.NEXT_PUBLIC_SITE_URL = "https://site.teste";

const webhook = await import("../src/lib/pagamentosWebhook.ts");
const { hojeSP, somarMeses } = await import("../src/lib/planos.ts");
const cfg = { token: "TEST-token", webhookSecret: "segredo" };

let mp: MercadoPagoFalso;
afterEach(() => mp?.restaurar());

const perfilBase = (extra: Record<string, unknown> = {}) => ({
  email: "ana@example.com",
  nome: "Ana Souza",
  plano: "trimestral",
  status_assinatura: "ATIVO",
  gateway_assinatura_id: null,
  proxima_cobranca: somarMeses(hojeSP(), 3),
  renovacao_automatica: true,
  renovacao_falhas: 0,
  acesso_enviado_em: new Date().toISOString(),
  ...extra,
});
const faturaBase = (extra: Record<string, unknown> = {}) => ({
  user_email: "ana@example.com",
  gateway_pagamento_id: "ORD1",
  descricao: "Assinatura Nutrindo em Casa - Plano Trimestral",
  valor: 531.9,
  status: "Pago",
  ...extra,
});
const cancelamentos = () => mp.chamadas.filter((c) => c.metodo === "PUT" && (c.corpo as { status?: string })?.status === "cancelled");

describe("Estorno de pedido (Pix / parcelado)", () => {
  it("estorno total: fatura 'Estornado', perfil CANCELADO e assinatura (se houver) cancelada", async () => {
    const { admin, tabelas } = bancoFalso({ profiles: [perfilBase({ gateway_assinatura_id: "SUB1" })], faturas: [faturaBase()] });
    mp = mercadoPagoFalso({ ordens: { ORD1: { id: "ORD1", status: "refunded", status_detail: "refunded" } }, assinaturas: { SUB1: { status: "authorized" } } });
    const r = await webhook.processarPedido(admin as never, cfg, "ORD1");
    assert.equal(r, "fatura Estornado");
    assert.equal(tabelas.faturas[0].status, "Estornado");
    assert.equal(tabelas.profiles[0].status_assinatura, "CANCELADO");
    assert.equal(tabelas.profiles[0].renovacao_automatica, false);
    assert.equal(cancelamentos().length, 1);
  });

  it("estorno PARCIAL: continua 'Pago' e o acesso não muda", async () => {
    const { admin, tabelas } = bancoFalso({ profiles: [perfilBase()], faturas: [faturaBase()] });
    mp = mercadoPagoFalso({ ordens: { ORD1: { id: "ORD1", status: "processed", status_detail: "partially_refunded" } } });
    await webhook.processarPedido(admin as never, cfg, "ORD1");
    assert.equal(tabelas.faturas[0].status, "Pago");
    assert.equal(tabelas.profiles[0].status_assinatura, "ATIVO");
  });

  it("contestação (chargeback) é tratada como estorno", async () => {
    const { admin, tabelas } = bancoFalso({ profiles: [perfilBase()], faturas: [faturaBase()] });
    mp = mercadoPagoFalso({ ordens: { ORD1: { id: "ORD1", status: "processed", status_detail: "charged_back" } } });
    await webhook.processarPedido(admin as never, cfg, "ORD1");
    assert.equal(tabelas.faturas[0].status, "Estornado");
    assert.equal(tabelas.profiles[0].status_assinatura, "CANCELADO");
  });

  it("aviso atrasado ('pendente') nunca desfaz uma fatura paga", async () => {
    const { admin, tabelas } = bancoFalso({ profiles: [perfilBase()], faturas: [faturaBase()] });
    mp = mercadoPagoFalso({ ordens: { ORD1: { id: "ORD1", status: "action_required", status_detail: "waiting_transfer" } } });
    const r = await webhook.processarPedido(admin as never, cfg, "ORD1");
    assert.match(r, /ignorado/);
    assert.equal(tabelas.faturas[0].status, "Pago");
  });
});

describe("Pagamento confirmado de pedido", () => {
  it("compra inicial: ativa e conta o ciclo a partir da confirmação; repetir o aviso não muda nada", async () => {
    const { admin, tabelas } = bancoFalso({
      profiles: [perfilBase({ status_assinatura: "AGUARDANDO_PAGAMENTO", proxima_cobranca: null })],
      faturas: [faturaBase({ status: "Pendente" })],
    });
    mp = mercadoPagoFalso({ ordens: { ORD1: { id: "ORD1", status: "processed", status_detail: "accredited", external_reference: "compra-1" } } });
    await webhook.processarPedido(admin as never, cfg, "ORD1");
    assert.equal(tabelas.profiles[0].status_assinatura, "ATIVO");
    assert.equal(tabelas.profiles[0].proxima_cobranca, somarMeses(hojeSP(), 3));
    const { proxima_cobranca: antes, status_assinatura: statusAntes } = tabelas.profiles[0];
    await webhook.processarPedido(admin as never, cfg, "ORD1");
    assert.equal(tabelas.profiles[0].proxima_cobranca, antes);
    assert.equal(tabelas.profiles[0].status_assinatura, statusAntes);
  });

  it("renovação paga por link: avança o ciclo uma vez e zera as falhas", async () => {
    const proxima = hojeSP();
    const { admin, tabelas } = bancoFalso({
      profiles: [perfilBase({ proxima_cobranca: proxima, renovacao_falhas: 2 })],
      faturas: [faturaBase({ status: "Pendente", descricao: "Renovação Nutrindo em Casa - Plano Trimestral" })],
    });
    mp = mercadoPagoFalso({ ordens: { ORD1: { id: "ORD1", status: "processed", status_detail: "accredited", external_reference: "renovacao-x" } } });
    await webhook.processarPedido(admin as never, cfg, "ORD1");
    assert.equal(tabelas.profiles[0].proxima_cobranca, somarMeses(proxima, 3));
    assert.equal(tabelas.profiles[0].renovacao_falhas, 0);
    await webhook.processarPedido(admin as never, cfg, "ORD1"); // aviso repetido
    assert.equal(tabelas.profiles[0].proxima_cobranca, somarMeses(proxima, 3), "não pode avançar o ciclo duas vezes");
  });
});

describe("Cobranças da assinatura no cartão", () => {
  const cobranca = (extra: Record<string, unknown> = {}) => ({ id: 77, preapproval_id: "SUB1", transaction_amount: 197, payment: { id: 555, status: "approved" }, ...extra });
  const assinatura = (valor = 197) => ({ status: "authorized", next_payment_date: "2027-03-19T12:00:00.000-03:00", auto_recurring: { transaction_amount: valor } });

  it("cobrança aprovada: gera a fatura da renovação, mantém ATIVO e usa a data do Mercado Pago", async () => {
    const { admin, tabelas } = bancoFalso({ profiles: [perfilBase({ plano: "mensal", gateway_assinatura_id: "SUB1" })], faturas: [] });
    mp = mercadoPagoFalso({ cobrancas: { 77: cobranca() }, assinaturas: { SUB1: assinatura() } });
    await webhook.processarCobrancaAssinatura(admin as never, cfg, "77");
    assert.equal(tabelas.faturas.length, 1);
    assert.equal(tabelas.faturas[0].status, "Pago");
    assert.equal(tabelas.faturas[0].gateway_pagamento_id, "555");
    assert.equal(tabelas.profiles[0].proxima_cobranca, "2027-03-19");
  });

  it("1ª cobrança com cupom: depois dela a assinatura volta ao preço de tabela", async () => {
    const { admin } = bancoFalso({ profiles: [perfilBase({ plano: "mensal", gateway_assinatura_id: "SUB1" })], faturas: [] });
    mp = mercadoPagoFalso({ cobrancas: { 77: cobranca({ transaction_amount: 98.5 }) }, assinaturas: { SUB1: assinatura(98.5) } });
    await webhook.processarCobrancaAssinatura(admin as never, cfg, "77");
    assert.equal((mp.assinaturas.SUB1.auto_recurring as { transaction_amount: number }).transaction_amount, 197);
  });

  it("fatura provisória do checkout é adotada (sem criar fatura duplicada)", async () => {
    const { admin, tabelas } = bancoFalso({
      profiles: [perfilBase({ plano: "mensal", gateway_assinatura_id: "SUB1", status_assinatura: "AGUARDANDO_PAGAMENTO" })],
      faturas: [faturaBase({ gateway_pagamento_id: "assinatura_SUB1", status: "Pendente" })],
    });
    mp = mercadoPagoFalso({ cobrancas: { 77: cobranca() }, assinaturas: { SUB1: assinatura() } });
    await webhook.processarCobrancaAssinatura(admin as never, cfg, "77");
    assert.equal(tabelas.faturas.length, 1);
    assert.equal(tabelas.faturas[0].gateway_pagamento_id, "555");
    assert.equal(tabelas.faturas[0].status, "Pago");
    assert.equal(tabelas.profiles[0].status_assinatura, "ATIVO");
  });

  it("cobrança ESTORNADA: acesso encerrado, assinatura cancelada no MP e o aviso repetido não repete nada", async () => {
    const { admin, tabelas } = bancoFalso({
      profiles: [perfilBase({ plano: "mensal", gateway_assinatura_id: "SUB1" })],
      faturas: [faturaBase({ gateway_pagamento_id: "555", status: "Pago" })],
    });
    mp = mercadoPagoFalso({ cobrancas: { 77: cobranca({ payment: { id: 555, status: "refunded" } }) }, assinaturas: { SUB1: assinatura() } });
    await webhook.processarCobrancaAssinatura(admin as never, cfg, "77");
    assert.equal(tabelas.faturas[0].status, "Estornado");
    assert.equal(tabelas.profiles[0].status_assinatura, "CANCELADO");
    assert.equal(tabelas.profiles[0].renovacao_automatica, false);
    assert.equal(mp.assinaturas.SUB1.status, "cancelled");
    await webhook.processarCobrancaAssinatura(admin as never, cfg, "77");
    assert.equal(cancelamentos().length, 1, "não cancela de novo no aviso repetido");
  });

  it("cobrança recusada: conta a falha UMA vez por cobrança, mesmo com aviso repetido; 3 falhas = INADIMPLENTE", async () => {
    const { admin, tabelas } = bancoFalso({ profiles: [perfilBase({ plano: "mensal", gateway_assinatura_id: "SUB1" })], faturas: [] });
    mp = mercadoPagoFalso({ cobrancas: { 77: cobranca({ payment: { id: 601, status: "rejected" } }), 78: cobranca({ id: 78, payment: { id: 602, status: "rejected" } }), 79: cobranca({ id: 79, payment: { id: 603, status: "rejected" } }) }, assinaturas: { SUB1: assinatura() } });
    await webhook.processarCobrancaAssinatura(admin as never, cfg, "77");
    await webhook.processarCobrancaAssinatura(admin as never, cfg, "77"); // repetido
    assert.equal(tabelas.profiles[0].renovacao_falhas, 1);
    assert.equal(mp.emails.length, 1, "um único e-mail de aviso");
    await webhook.processarCobrancaAssinatura(admin as never, cfg, "78");
    await webhook.processarCobrancaAssinatura(admin as never, cfg, "79");
    assert.equal(tabelas.profiles[0].renovacao_falhas, 3);
    assert.equal(tabelas.profiles[0].status_assinatura, "INADIMPLENTE");
  });

  it("aviso que chega ANTES de o cadastro gravar a assinatura: falha de propósito para o Mercado Pago reenviar", async () => {
    const { admin } = bancoFalso({ profiles: [], faturas: [] });
    mp = mercadoPagoFalso({ cobrancas: { 77: cobranca() }, assinaturas: { SUB1: assinatura() } });
    const original = globalThis.setTimeout;
    globalThis.setTimeout = ((fn: () => void) => original(fn, 0)) as typeof setTimeout; // sem esperar os segundos reais
    try {
      await assert.rejects(webhook.processarCobrancaAssinatura(admin as never, cfg, "77"), /ainda não vinculada/);
    } finally {
      globalThis.setTimeout = original;
    }
  });

  it("aviso de assinatura que já foi cancelada e não tem cliente (ex.: trocada num upgrade) é ignorado", async () => {
    const { admin } = bancoFalso({ profiles: [perfilBase({ gateway_assinatura_id: "SUB-NOVA" })], faturas: [] });
    mp = mercadoPagoFalso({ cobrancas: { 77: cobranca() }, assinaturas: { SUB1: { status: "cancelled" } } });
    const original = globalThis.setTimeout;
    globalThis.setTimeout = ((fn: () => void) => original(fn, 0)) as typeof setTimeout;
    try {
      const r = await webhook.processarCobrancaAssinatura(admin as never, cfg, "77");
      assert.match(r, /ignorado/);
    } finally {
      globalThis.setTimeout = original;
    }
  });
});

describe("Conferência diária das assinaturas (rede de segurança contra avisos perdidos)", () => {
  it("renovou e o aviso se perdeu: atualiza a próxima cobrança (o cliente não é bloqueado)", async () => {
    const { admin, tabelas } = bancoFalso({ profiles: [perfilBase({ plano: "mensal", gateway_assinatura_id: "SUB1", proxima_cobranca: "2026-11-01" })] });
    mp = mercadoPagoFalso({ assinaturas: { SUB1: { status: "authorized", next_payment_date: "2026-12-01T10:00:00.000-03:00" } } });
    await webhook.conferirAssinatura(admin as never, cfg, "SUB1");
    assert.equal(tabelas.profiles[0].proxima_cobranca, "2026-12-01");
  });

  it("avisos perdidos: a conferência cria a fatura de cada cobrança que faltava e não duplica ao rodar de novo", async () => {
    const { admin, tabelas } = bancoFalso({ profiles: [perfilBase({ plano: "mensal", gateway_assinatura_id: "SUB1", proxima_cobranca: "2026-11-01" })], faturas: [] });
    mp = mercadoPagoFalso({
      cobrancas: {
        1: { id: 1, preapproval_id: "SUB1", transaction_amount: 98.5, date_created: "2026-10-01T10:00:00Z", payment: { id: 900, status: "approved" } },
        2: { id: 2, preapproval_id: "SUB1", transaction_amount: 197, date_created: "2026-11-01T10:00:00Z", payment: { id: 901, status: "approved" } },
        3: { id: 3, preapproval_id: "SUB1", transaction_amount: 197, date_created: "2026-12-01T10:00:00Z" }, // ainda sem pagamento: ignorada
      },
      assinaturas: { SUB1: { status: "authorized", next_payment_date: "2026-12-01T10:00:00.000-03:00", auto_recurring: { transaction_amount: 197 } } },
    });
    await webhook.conferirAssinatura(admin as never, cfg, "SUB1");
    await webhook.conferirAssinatura(admin as never, cfg, "SUB1");
    assert.deepEqual(tabelas.faturas.map((f) => f.gateway_pagamento_id).sort(), ["900", "901"]);
    assert.equal(tabelas.profiles[0].proxima_cobranca, "2026-12-01");
    assert.equal(tabelas.profiles[0].status_assinatura, "ATIVO");
  });

  it("cancelada no painel do Mercado Pago: desliga a renovação e mantém o acesso até o fim do ciclo", async () => {
    const { admin, tabelas } = bancoFalso({ profiles: [perfilBase({ plano: "mensal", gateway_assinatura_id: "SUB1", proxima_cobranca: "2026-12-01" })] });
    mp = mercadoPagoFalso({ assinaturas: { SUB1: { status: "cancelled" } } });
    await webhook.conferirAssinatura(admin as never, cfg, "SUB1");
    assert.equal(tabelas.profiles[0].renovacao_automatica, false);
    assert.ok(tabelas.profiles[0].acesso_ate);
  });
});
