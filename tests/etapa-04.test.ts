/**
 * Testes automatizados das regras de validação e cálculo usadas na Etapa 04.
 * Rodam com o executor nativo do Node.js (sem instalar nada além do projeto):
 *
 *   npm test
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { validarEtapa, getMockDataForEtapa } from "../src/app/anamnese/validation.ts";
import { calcularTotal, normalizarParcelas, somarMeses, diasEntre } from "../src/lib/planos.ts";

describe("Anamnese — validação por etapa (validarEtapa)", () => {
  it("rejeita a etapa 1 vazia e aponta cada campo obrigatório", () => {
    const r = validarEtapa(1, {});
    assert.equal(r.isValid, false);
    for (const campo of ["q1", "q2", "q3", "q4", "q5", "q7", "q9", "q10"]) {
      assert.equal(r.erros[campo], true, `esperava erro em ${campo}`);
    }
    assert.match(r.mensagemToast ?? "", /campos obrigatórios/);
  });

  it("aceita a etapa 1 quando todos os campos estão corretos", () => {
    const r = validarEtapa(1, getMockDataForEtapa(1));
    assert.equal(r.isValid, true);
    assert.deepEqual(r.erros, {});
  });

  it("rejeita data de nascimento no futuro e anterior ao limite", () => {
    const base = getMockDataForEtapa(1);
    const futuro = new Date(Date.now() + 86_400_000 * 30).toISOString().split("T")[0];
    assert.equal(validarEtapa(1, { ...base, dataNascimento: futuro }).erros["q2"], true);
    assert.equal(validarEtapa(1, { ...base, dataNascimento: "1999-01-01" }).erros["q2"], true);
  });

  it("exige o texto quando a opção 'Outro' é escolhida", () => {
    const base = getMockDataForEtapa(1);
    const r = validarEtapa(1, { ...base, parentesco: "Outro", outroParentescoTexto: "   " });
    assert.equal(r.isValid, false);
    assert.equal(r.erros["q5_outro"], true);
  });

  it("exige horário ou 'não costuma fazer' em todas as refeições (etapa 5)", () => {
    const r = validarEtapa(5, { ...getMockDataForEtapa(5), horarios: undefined });
    assert.equal(r.isValid, false);
    assert.equal(r.refeicoesIncompletas?.length, 6);
  });

  it("todas as 8 etapas aceitam os dados de exemplo válidos", () => {
    for (let etapa = 1; etapa <= 8; etapa++) {
      const r = validarEtapa(etapa, getMockDataForEtapa(etapa));
      assert.equal(r.isValid, true, `etapa ${etapa} deveria ser válida: ${JSON.stringify(r.erros)}`);
    }
  });
});

describe("Pagamento — cálculo do total (calcularTotal)", () => {
  it("sem cupom cobra o preço de tabela", () => {
    assert.equal(calcularTotal({ plano: "mensal" }), 197);
    assert.equal(calcularTotal({ plano: "trimestral" }), 531.9);
  });

  it("aplica o percentual do cupom com arredondamento em centavos", () => {
    assert.equal(calcularTotal({ plano: "trimestral", percentualCupom: 10 }), 478.71);
    assert.equal(calcularTotal({ plano: "anual", percentualCupom: 15 }), 1707.99);
  });

  it("desconta o crédito de upgrade e nunca devolve valor negativo", () => {
    assert.equal(calcularTotal({ plano: "anual", credito: 177.3 }), 1832.1);
    assert.equal(calcularTotal({ plano: "mensal", credito: 500 }), 0);
  });
});

describe("Pagamento — parcelamento (normalizarParcelas)", () => {
  it("aceita só as quantidades permitidas para cada plano", () => {
    assert.equal(normalizarParcelas("mensal", 1, 197), 1);
    assert.equal(normalizarParcelas("mensal", 3, 197), null);
    assert.equal(normalizarParcelas("trimestral", 3, 531.9), 3);
    assert.equal(normalizarParcelas("anual", 12, 2009.4), 12);
    assert.equal(normalizarParcelas("anual", 4, 2009.4), null);
  });

  it("trata valor vazio como à vista e recusa valores inválidos", () => {
    assert.equal(normalizarParcelas("trimestral", undefined, 531.9), 1);
    assert.equal(normalizarParcelas("trimestral", "", 531.9), 1);
    assert.equal(normalizarParcelas("trimestral", "abc", 531.9), null);
    assert.equal(normalizarParcelas("trimestral", 2.5, 531.9), null);
  });

  it("recusa parcelas abaixo do valor mínimo por parcela", () => {
    assert.equal(normalizarParcelas("anual", 12, 40), null);
  });
});

describe("Datas (somarMeses / diasEntre)", () => {
  it("preserva o último dia do mês ao somar meses", () => {
    assert.equal(somarMeses("2026-01-31", 1), "2026-02-28");
    assert.equal(somarMeses("2026-11-16", 3), "2027-02-16");
  });

  it("calcula a diferença em dias", () => {
    assert.equal(diasEntre("2026-11-01", "2026-11-16"), 15);
  });
});
