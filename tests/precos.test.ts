/**
 * Testes dos preços do Pix e do cartão (lib/planos.ts): o Pix é mais barato como incentivo e o cartão é o preço padrão.
 * Rodam com `npm test`.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { calcularTotal, formatarReais, MESES_DO_PLANO, PLANOS, valorDoPlano } from "../src/lib/planos.ts";

describe("Preços: Pix (incentivo) e cartão (padrão)", () => {
  it("valores combinados com a nutricionista", () => {
    assert.equal(valorDoPlano("mensal", "PIX"), 197);
    assert.equal(valorDoPlano("mensal", "CARTAO"), 210);
    assert.equal(valorDoPlano("trimestral", "PIX"), 531.9);
    assert.equal(valorDoPlano("trimestral", "CARTAO"), 567);
    assert.equal(valorDoPlano("anual", "PIX"), 2009.4);
    assert.equal(valorDoPlano("anual", "CARTAO"), 2142);
  });

  it("o Pix é sempre mais barato que o cartão, na mesma proporção do plano mensal (R$ 197 / R$ 210)", () => {
    for (const p of ["mensal", "trimestral", "anual"] as const) {
      assert.ok(PLANOS[p].valor < PLANOS[p].valorCartao, p);
      assert.equal(Math.round((PLANOS[p].valor * 210) / 197 * 100) / 100, PLANOS[p].valorCartao, p);
    }
  });

  it("os descontos por ciclo se mantêm nas duas formas de pagamento (10% no trimestral, 15% no anual)", () => {
    for (const forma of ["PIX", "CARTAO"] as const) {
      const mensal = valorDoPlano("mensal", forma);
      assert.equal(Math.round(valorDoPlano("trimestral", forma) * 100), Math.round(mensal * MESES_DO_PLANO.trimestral * 0.9 * 100));
      assert.equal(Math.round(valorDoPlano("anual", forma) * 100), Math.round(mensal * MESES_DO_PLANO.anual * 0.85 * 100));
    }
  });

  it("o total calculado no servidor depende da forma de pagamento (e o padrão continua sendo o Pix)", () => {
    assert.equal(calcularTotal({ plano: "mensal" }), 197);
    assert.equal(calcularTotal({ plano: "mensal", forma: "PIX" }), 197);
    assert.equal(calcularTotal({ plano: "mensal", forma: "CARTAO" }), 210);
    assert.equal(calcularTotal({ plano: "trimestral", forma: "CARTAO" }), 567);
  });

  it("cupom e crédito de upgrade incidem sobre o preço da forma escolhida", () => {
    assert.equal(calcularTotal({ plano: "mensal", forma: "CARTAO", percentualCupom: 50 }), 105);
    assert.equal(calcularTotal({ plano: "mensal", forma: "PIX", percentualCupom: 50 }), 98.5);
    assert.equal(calcularTotal({ plano: "anual", forma: "CARTAO", credito: 177.3 }), 1964.7);
    assert.equal(calcularTotal({ plano: "anual", forma: "PIX", credito: 177.3 }), 1832.1);
    assert.equal(calcularTotal({ plano: "mensal", forma: "CARTAO", percentualCupom: 99 }), 2.1);
  });

  it("formata em reais no padrão brasileiro", () => {
    assert.equal(formatarReais(197), "R$ 197,00");
    assert.equal(formatarReais(2009.4), "R$ 2.009,40");
    assert.equal(formatarReais(177.3), "R$ 177,30");
    assert.equal(formatarReais(2142), "R$ 2.142,00");
  });
});

describe("Cupom: vale só para a compra em que foi aplicado", () => {
  it("o desconto vale na 1ª cobrança de qualquer plano e a renovação continua no preço de tabela", () => {
    assert.equal(calcularTotal({ plano: "mensal", percentualCupom: 50, forma: "CARTAO" }), 105);
    assert.equal(calcularTotal({ plano: "anual", percentualCupom: 95, forma: "PIX" }), 100.47);
    assert.equal(valorDoPlano("mensal", "CARTAO"), 210);
    assert.equal(valorDoPlano("trimestral", "PIX"), 531.9);
    assert.equal(valorDoPlano("anual", "CARTAO"), 2142);
  });
});
