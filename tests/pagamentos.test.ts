/**
 * Testes das regras de pagamento que não dependem de rede: validação da assinatura dos avisos
 * (webhook) e tradução dos estados do Mercado Pago. Rodam com `npm test`.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

import { validarAssinaturaWebhook } from "../src/lib/mercadopago.ts";
import { podeAtualizarFatura, statusFaturaDaCobrancaAssinatura, statusFaturaDoPedido } from "../src/lib/pagamentosEstado.ts";

const SEGREDO = "segredo-de-teste-123";

function assinar(dataId: string, requestId: string, tsMs: number, segredo = SEGREDO) {
  const ts = String(tsMs);
  const v1 = createHmac("sha256", segredo).update(`id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`).digest("hex");
  return `ts=${ts},v1=${v1}`;
}

describe("Webhook — assinatura do aviso (validarAssinaturaWebhook)", () => {
  const agora = 1_800_000_000_000;
  const base = { dataId: "ORD01ABCDEF", xRequestId: "req-1", segredo: SEGREDO, agoraMs: agora };

  it("aceita um aviso corretamente assinado", () => {
    assert.equal(validarAssinaturaWebhook({ ...base, xSignature: assinar("ORD01ABCDEF", "req-1", agora) }), true);
  });

  it("usa o id em minúsculas no cálculo (como o Mercado Pago)", () => {
    assert.equal(validarAssinaturaWebhook({ ...base, dataId: "ord01abcdef", xSignature: assinar("ORD01ABCDEF", "req-1", agora) }), true);
  });

  it("recusa segredo errado, id diferente e request-id diferente", () => {
    assert.equal(validarAssinaturaWebhook({ ...base, xSignature: assinar("ORD01ABCDEF", "req-1", agora, "outro-segredo") }), false);
    assert.equal(validarAssinaturaWebhook({ ...base, dataId: "ORD99", xSignature: assinar("ORD01ABCDEF", "req-1", agora) }), false);
    assert.equal(validarAssinaturaWebhook({ ...base, xRequestId: "req-2", xSignature: assinar("ORD01ABCDEF", "req-1", agora) }), false);
  });

  it("recusa aviso antigo (repetição) e relógio muito à frente", () => {
    assert.equal(validarAssinaturaWebhook({ ...base, xSignature: assinar("ORD01ABCDEF", "req-1", agora - 6 * 60_000) }), false);
    assert.equal(validarAssinaturaWebhook({ ...base, xSignature: assinar("ORD01ABCDEF", "req-1", agora + 6 * 60_000) }), false);
    assert.equal(validarAssinaturaWebhook({ ...base, xSignature: assinar("ORD01ABCDEF", "req-1", agora - 60_000) }), true);
  });

  it("recusa cabeçalho ausente, malformado ou sem segredo configurado", () => {
    assert.equal(validarAssinaturaWebhook({ ...base, xSignature: null }), false);
    assert.equal(validarAssinaturaWebhook({ ...base, xSignature: "lixo" }), false);
    assert.equal(validarAssinaturaWebhook({ ...base, xSignature: `ts=${agora}` }), false);
    assert.equal(validarAssinaturaWebhook({ ...base, segredo: "", xSignature: assinar("ORD01ABCDEF", "req-1", agora) }), false);
    assert.equal(validarAssinaturaWebhook({ ...base, dataId: null, xSignature: assinar("ORD01ABCDEF", "req-1", agora) }), false);
  });
});

describe("Estados do Mercado Pago → fatura", () => {
  it("ordem paga, pendente, cancelada, recusada e estornada", () => {
    assert.equal(statusFaturaDoPedido("processed", "accredited"), "Pago");
    assert.equal(statusFaturaDoPedido("action_required", "waiting_transfer"), "Pendente");
    assert.equal(statusFaturaDoPedido("processing"), "Pendente");
    assert.equal(statusFaturaDoPedido("canceled"), "Cancelado");
    assert.equal(statusFaturaDoPedido("expired"), "Cancelado");
    assert.equal(statusFaturaDoPedido("failed"), "Recusado");
    assert.equal(statusFaturaDoPedido("refunded", "refunded"), "Estornado");
    assert.equal(statusFaturaDoPedido("partially_refunded"), "Pago");
  });

  it("cobrança de assinatura aprovada ou recusada", () => {
    assert.equal(statusFaturaDaCobrancaAssinatura("approved"), "Pago");
    assert.equal(statusFaturaDaCobrancaAssinatura("rejected"), "Recusado");
    assert.equal(statusFaturaDaCobrancaAssinatura("refunded"), "Estornado");
    assert.equal(statusFaturaDaCobrancaAssinatura(undefined), "Pendente");
  });

  it("aviso atrasado nunca desfaz uma fatura paga ou estornada", () => {
    assert.equal(podeAtualizarFatura("Pago", "Pendente"), false);
    assert.equal(podeAtualizarFatura("Pago", "Estornado"), true);
    assert.equal(podeAtualizarFatura("Estornado", "Pago"), false);
    assert.equal(podeAtualizarFatura("Pendente", "Pago"), true);
    assert.equal(podeAtualizarFatura(null, "Pendente"), true);
  });
});
