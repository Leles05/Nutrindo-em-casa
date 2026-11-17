import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { autenticar, cpfEhValido, ipDaRequisicao, normalizarEmail } from "@/lib/auth";
import { limitar } from "@/lib/rateLimit";
import {
  asaasFetch,
  configAsaas,
  criarCobrancaParcelada,
  desfazerCompraParcelada,
  listarParcelas,
  mensagemErroAsaas,
} from "@/lib/asaas";
import {
  arredondar,
  calcularTotal,
  CREDITO_UPGRADE_TRIMESTRAL_PARA_ANUAL,
  ehPlano,
  hojeSP,
  MESES_DO_PLANO,
  normalizarParcelas,
  PLANOS,
  somarMeses,
  VALOR_MINIMO_ASAAS,
} from "@/lib/planos";
import { buscarCupom, consumirCupom, devolverCupom, mensagemDoStatus, statusDoCupom } from "@/lib/cupons";
import { liberarAcessoPosPagamento } from "@/lib/acesso";
import { registrarAceite, TERMOS_VERSAO } from "@/lib/termos";
import { compraPaga, desfazerCompraOrfa, gravarFaturasDasParcelas, ipParaAsaas, salvarCartao } from "@/lib/parcelado";

// Compras parceladas em 12x levam ~15s no Asaas: a função precisa de tempo
export const maxDuration = 60;

/**
 * Checkout (PIX ou cartão).
 *
 * Modelos de cobrança:
 *  - PIX ................ assinatura recorrente do Asaas (o Asaas gera a fatura de cada ciclo).
 *  - Cartão à vista ..... assinatura recorrente do Asaas (renovação feita pelo Asaas).
 *  - Cartão parcelado ... compra parcelada única (N parcelas no cartão do cliente) + renovação AUTOMÁTICA
 *                         no fim do período, feita por /api/cron/renovacoes com o cartão salvo (token do Asaas).
 *
 * Regras de segurança/negócio:
 *  - O VALOR é calculado aqui (plano + cupom validado no banco). Qualquer `valor` vindo do navegador é ignorado.
 *  - Sem fallbacks: se o Asaas recusar ou falhar, devolvemos erro e NÃO gravamos "pago/ativo" de mentira.
 *  - Upgrade (trimestral -> anual) exige estar logado e encerra a cobrança antiga.
 */

const erro = (message: string, status = 400) => NextResponse.json({ success: false, message }, { status });

// Algoritmo de Luhn: barra números de cartão digitados errados antes de chamar o Asaas
function cartaoLuhnValido(numero: string): boolean {
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

function cartaoVencido(mes: string, ano: string): boolean {
  const agora = new Date();
  const anoAtual = agora.getFullYear();
  const mesAtual = agora.getMonth() + 1;
  const a = parseInt(ano, 10);
  const m = parseInt(mes, 10);
  return a < anoAtual || (a === anoAtual && m < mesAtual);
}

function celularValido(valor: string) {
  const d = valor.replace(/\D/g, "");
  return d.length === 10 || d.length === 11;
}

export async function POST(request: Request) {
  let cupomConsumido: string | null = null;
  let assinaturaCriadaId: string | null = null;
  let parceladoCriadoId: string | null = null;
  let parceladoPago = false;
  const cfg = configAsaas();
  const admin = isSupabaseConfigured() ? getSupabaseAdmin() : null;

  // Desfaz o que já foi feito se algo falhar no meio (cupom, assinatura ou compra parcelada no Asaas)
  const desfazer = async () => {
    try {
      if (cupomConsumido && admin) await devolverCupom(admin, cupomConsumido);
    } catch {}
    try {
      if (assinaturaCriadaId && cfg) await asaasFetch(cfg, "DELETE", `/subscriptions/${assinaturaCriadaId}`);
    } catch {}
    try {
      if (parceladoCriadoId && cfg) await desfazerCompraParcelada(cfg, parceladoCriadoId, parceladoPago);
    } catch {}
  };

  try {
    if (!cfg || !admin) return erro("Pagamento temporariamente indisponível. Tente novamente em instantes.", 503);

    const rl = limitar(`checkout:${ipDaRequisicao(request)}`, 30, 10 * 60 * 1000);
    if (!rl.permitido) return erro("Muitas tentativas. Aguarde alguns minutos e tente novamente.", 429);

    const body = await request.json().catch(() => ({}));

    // ---------- 1. Validação dos dados (nada de valores padrão inventados) ----------
    const nome = String(body.nome || "").trim();
    const email = normalizarEmail(body.email);
    const cpf = String(body.cpf || "").replace(/\D/g, "");
    const celular = String(body.celular || "").replace(/\D/g, "");
    const billingType = body.billingType === "PIX" ? "PIX" : body.billingType === "CREDIT_CARD" ? "CREDIT_CARD" : null;
    const plano = String(body.plano || "").toLowerCase().trim();
    const ehUpgrade = body.origem === "upgrade";

    if (nome.length < 3) return erro("Informe o seu nome completo.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro("Informe um e-mail válido.");
    if (!cpfEhValido(cpf)) return erro("CPF inválido. Confira os 11 dígitos.");
    if (!celularValido(celular)) return erro("Informe o celular com DDD.");
    if (!billingType) return erro("Forma de pagamento inválida.");
    if (!ehPlano(plano)) return erro("Plano inválido.");
    // Aceite obrigatório dos Termos (inclui a renovação automática), na versão vigente
    if (body.aceiteTermos !== true) return erro("Para continuar, aceite os Termos de Uso e a Política de Privacidade.");
    if (body.versaoTermos !== TERMOS_VERSAO) return erro("Os termos foram atualizados. Recarregue a página para ler a versão mais recente.", 409);

    // ---------- 2. Perfil existente / upgrade ----------
    const { data: perfilExistente } = await admin.from("profiles").select("*").eq("email", email).maybeSingle();

    let credito = 0;
    let assinaturaAntigaId: string | null = null;

    if (ehUpgrade) {
      const ctx = await autenticar(request);
      if (!ctx || ctx.email !== email) return erro("Faça login para realizar o upgrade.", 401);
      if (
        !perfilExistente ||
        String(perfilExistente.plano || "").toLowerCase() !== "trimestral" ||
        String(perfilExistente.status_assinatura || "").toUpperCase() !== "ATIVO" ||
        plano !== "anual"
      ) {
        return erro("Upgrade disponível apenas do plano Trimestral ativo para o Anual.", 409);
      }
      credito = CREDITO_UPGRADE_TRIMESTRAL_PARA_ANUAL;
      assinaturaAntigaId = perfilExistente.asaas_subscription_id || null;
    } else if (perfilExistente) {
      const status = String(perfilExistente.status_assinatura || "").toUpperCase();
      if (status === "ATIVO") return erro("Já existe uma assinatura ativa para este e-mail. Faça login para acessar.", 409);
      const cpfCadastrado = String(perfilExistente.cpf || "").replace(/\D/g, "");
      if (cpfCadastrado && cpfCadastrado !== cpf) {
        return erro("Este e-mail já está cadastrado com outro CPF. Use o e-mail correto ou fale com o suporte.", 409);
      }
    }

    // CPF não pode estar em outra conta (é usado no login)
    const { data: outroComCpf } = await admin.from("profiles").select("email").eq("cpf", cpf).neq("email", email).limit(1);
    if (outroComCpf && outroComCpf.length > 0) {
      return erro("Este CPF já está vinculado a outra conta. Use o e-mail original da assinatura.", 409);
    }

    // ---------- 3. Cartão: dados obrigatórios ----------
    const cartao = body.cartao || {};
    let dadosCartao: Record<string, string> | null = null;
    if (billingType === "CREDIT_CARD") {
      const numero = String(cartao.number || "").replace(/\D/g, "");
      const mes = String(cartao.expiryMonth || "").replace(/\D/g, "").padStart(2, "0");
      let ano = String(cartao.expiryYear || "").replace(/\D/g, "");
      if (ano.length === 2) ano = `20${ano}`;
      const ccv = String(cartao.ccv || "").replace(/\D/g, "");
      const cep = String(cartao.cep || "").replace(/\D/g, "");
      const numeroEnd = String(cartao.numeroEndereco || "").trim();
      const cpfTitular = String(cartao.cpf || cpf).replace(/\D/g, "");
      const titular = String(cartao.holderName || "").trim();

      if (numero.length < 13 || numero.length > 19 || !cartaoLuhnValido(numero)) return erro("Número do cartão inválido.");
      if (!/^(0[1-9]|1[0-2])$/.test(mes) || ano.length !== 4) return erro("Validade do cartão inválida.");
      if (cartaoVencido(mes, ano)) return erro("Cartão vencido. Use outro cartão ou o Pix.");
      if (ccv.length < 3 || ccv.length > 4) return erro("CVV inválido.");
      if (titular.length < 3) return erro("Informe o nome impresso no cartão.");
      if (!cpfEhValido(cpfTitular)) return erro("CPF do titular do cartão inválido.");
      if (cep.length !== 8 || !numeroEnd) return erro("Informe o CEP e o número do endereço do titular.");

      dadosCartao = { numero, mes, ano, ccv, cep, numeroEnd, cpfTitular, titular };
    }

    // ---------- 4. Cupom + preço (tudo no servidor) ----------
    let percentualCupom = 0;
    const cupomInformado = String(body.cupom || "").trim();
    if (cupomInformado) {
      const cupom = await buscarCupom(admin, cupomInformado);
      if (!cupom) return erro("Cupom inválido ou não encontrado.");
      const status = statusDoCupom(cupom);
      if (status !== "ativo") return erro(mensagemDoStatus(cupom, status));

      // Reserva o uso de forma atômica (respeita o limite mesmo com compras simultâneas)
      const consumido = await consumirCupom(admin, cupomInformado);
      if (!consumido) return erro("Este cupom não está mais disponível.");
      cupomConsumido = consumido.codigo;
      percentualCupom = consumido.percentual;
    }

    const valorCobrado = calcularTotal({ plano, percentualCupom, credito });
    if (valorCobrado < VALOR_MINIMO_ASAAS) {
      await desfazer();
      const minimoBR = VALOR_MINIMO_ASAAS.toFixed(2).replace(".", ",");
      const finalBR = valorCobrado.toFixed(2).replace(".", ",");
      return erro(`O valor final (R$ ${finalBR}) é menor que o mínimo de R$ ${minimoBR} aceito para cobrança. Use um cupom com desconto menor ou escolha outro plano.`);
    }

    // Parcelas: só no cartão e só nas quantidades permitidas para o plano (Pix é sempre à vista)
    let parcelas = 1;
    if (billingType === "CREDIT_CARD") {
      const p = normalizarParcelas(plano, body.parcelas, valorCobrado);
      if (p === null) {
        await desfazer();
        return erro("Quantidade de parcelas não disponível para este plano ou valor.");
      }
      parcelas = p;
    }
    const parcelado = billingType === "CREDIT_CARD" && parcelas > 1;
    const ipComprador = ipParaAsaas(ipDaRequisicao(request));

    // ---------- 5. Cliente no Asaas (reaproveita pelo CPF) ----------
    let customerId: string | null = null;
    const busca = await asaasFetch(cfg, "GET", `/customers?cpfCnpj=${cpf}`);
    if (busca.ok && Array.isArray(busca.data?.data) && busca.data.data.length > 0) {
      customerId = busca.data.data[0].id;
    } else if (!busca.ok) {
      console.error("Asaas: falha ao buscar cliente", busca.status, busca.data?.errors);
      await desfazer();
      return erro("Não foi possível falar com o serviço de pagamento. Tente novamente em instantes.", 502);
    }
    if (!customerId) {
      const criado = await asaasFetch(cfg, "POST", "/customers", {
        name: nome,
        email,
        cpfCnpj: cpf,
        mobilePhone: celular,
        notificationDisabled: false,
      });
      if (!criado.ok || !criado.data?.id) {
        await desfazer();
        return erro(mensagemErroAsaas(criado, "Não foi possível cadastrar o cliente no serviço de pagamento."), 400);
      }
      customerId = criado.data.id;
    }

    const gravarAceiteDaCompra = async () => {
      const ok = await registrarAceite(admin, {
        email,
        versao: TERMOS_VERSAO,
        consentimentoSaude: false,
        renovacaoAutomatica: true,
        origem: "checkout",
        ip: ipDaRequisicao(request),
        userAgent: request.headers.get("user-agent"),
      });
      if (!ok) console.error("ATENÇÃO: compra concluída sem registro de aceite para", email);
    };

    const hoje = hojeSP();
    const descricaoBase = `Assinatura Nutrindo em Casa - Plano ${PLANOS[plano].nome}`;
    const cartaoAsaas = dadosCartao
      ? {
          creditCard: {
            holderName: dadosCartao.titular,
            number: dadosCartao.numero,
            expiryMonth: dadosCartao.mes,
            expiryYear: dadosCartao.ano,
            ccv: dadosCartao.ccv,
          },
          creditCardHolderInfo: {
            name: dadosCartao.titular,
            email,
            cpfCnpj: dadosCartao.cpfTitular,
            postalCode: dadosCartao.cep,
            addressNumber: dadosCartao.numeroEnd,
            phone: celular,
          },
        }
      : null;

    // =====================================================================
    // 6A. CARTÃO PARCELADO: compra única em N parcelas (renovação automática pelo cron)
    // =====================================================================
    if (parcelado && cartaoAsaas) {
      let compra;
      try {
        compra = await criarCobrancaParcelada(cfg, {
          customerId: customerId as string,
          valorTotal: valorCobrado,
          parcelas,
          descricao: descricaoBase,
          referencia: email,
          hoje,
          remoteIp: ipComprador,
          cartao: cartaoAsaas,
        });
      } catch (e) {
        // Timeout/rede: o Asaas pode ter processado a compra. Procura e desfaz antes de pedir nova tentativa.
        console.error("Falha de comunicação ao criar a compra parcelada:", e);
        const desfeitas = await desfazerCompraOrfa(admin, cfg, customerId as string, email, hoje);
        await desfazer();
        return erro(
          desfeitas > 0
            ? "O pagamento demorou para responder e foi cancelado por segurança. Nenhuma cobrança foi mantida. Tente novamente."
            : "O pagamento demorou para responder. Confira a fatura do cartão antes de tentar de novo; se houver cobrança, ela será cancelada automaticamente.",
          504
        );
      }
      if (!compra.ok || !compra.data?.id) {
        await desfazer();
        return erro(
          mensagemErroAsaas(compra, "Pagamento não autorizado. Confira os dados ou tente outra forma de pagamento."),
          400
        );
      }
      const installmentId: string | undefined = compra.data.installment;
      if (!installmentId) {
        console.error("Asaas devolveu compra parcelada sem 'installment'", compra.data.id);
        await asaasFetch(cfg, "DELETE", `/payments/${compra.data.id}`);
        await desfazer();
        return erro("Não foi possível criar o parcelamento. Tente novamente.", 502);
      }
      parceladoCriadoId = installmentId;
      parceladoPago = compraPaga(compra.data.status);

      if (compra.data.status === "REFUSED") {
        await desfazer();
        return erro("Cartão recusado pela operadora. Confira os dados ou utilize outro cartão ou o Pix.", 402);
      }

      const listaParcelas = await listarParcelas(cfg, installmentId);
      if (listaParcelas.length === 0) {
        await desfazer();
        return erro("Não foi possível confirmar as parcelas. Tente novamente.", 502);
      }

      const proxima = somarMeses(hoje, MESES_DO_PLANO[plano]);
      const { error: perfilErr } = await admin.from("profiles").upsert(
        {
          email,
          nome: perfilExistente?.nome || nome,
          cpf,
          telefone: celular,
          plano,
          status_assinatura: ehUpgrade || parceladoPago ? "ATIVO" : "AGUARDANDO_PAGAMENTO",
          asaas_customer_id: customerId,
          asaas_subscription_id: null,
          asaas_installment_id: installmentId,
          parcelas,
          proxima_cobranca: proxima,
          renovacao_automatica: true,
          renovacao_falhas: 0,
          renovacao_ultima_tentativa: null,
          renovacao_aviso_ciclo: null,
          acesso_ate: null,
          notificacoes_email: perfilExistente?.notificacoes_email ?? true,
        },
        { onConflict: "email" }
      );
      if (perfilErr) {
        console.error("Falha ao salvar perfil do checkout parcelado:", perfilErr.message);
        await desfazer();
        return erro("Não foi possível concluir o cadastro. Nenhuma cobrança foi mantida. Tente novamente.", 500);
      }

      await gravarAceiteDaCompra();

      const cartaoPago = compra.data.creditCard || {};
      if (cartaoPago.creditCardToken) {
        await salvarCartao(admin, email, {
          token: cartaoPago.creditCardToken,
          ultimos4: cartaoPago.creditCardNumber,
          bandeira: cartaoPago.creditCardBrand,
          ip: ipComprador,
        });
      } else {
        console.error("ATENÇÃO: o Asaas não devolveu token do cartão; a renovação automática não vai funcionar para", email);
      }

      const descricaoFatura = cupomConsumido ? `${descricaoBase} (Cupom: ${cupomConsumido})` : descricaoBase;
      await gravarFaturasDasParcelas(admin, email, installmentId, listaParcelas, descricaoFatura);

      // Upgrade: encerra a cobrança anterior para não cobrar em duplicidade
      if (ehUpgrade && assinaturaAntigaId) {
        const cancel = await asaasFetch(cfg, "DELETE", `/subscriptions/${assinaturaAntigaId}`);
        if (!cancel.ok) console.error("ATENÇÃO: não foi possível cancelar a assinatura antiga", assinaturaAntigaId, cancel.status);
      }

      // Compra concluída: a partir daqui nada é desfeito
      cupomConsumido = null;
      parceladoCriadoId = null;

      // Cartão confirmado na hora: libera o acesso já (não depende do webhook chegar depois do cadastro)
      let emailEnviado = false;
      if (parceladoPago && !ehUpgrade) {
        emailEnviado = (await liberarAcessoPosPagamento(admin, email, nome)).enviado;
      }

      return NextResponse.json({
        success: true,
        tipo: "CREDIT_CARD",
        status: parceladoPago ? "ACTIVE" : "PENDING",
        subscriptionId: installmentId,
        paymentId: compra.data.id,
        email,
        valorCobrado,
        parcelas,
        valorParcela: arredondar(valorCobrado / parcelas),
        proximaCobranca: proxima,
        pagamentoConfirmado: parceladoPago,
        emailEnviado,
        mensagemAcesso: emailEnviado
          ? "Enviamos para o seu e-mail o link para criar sua senha."
          : "Assim que o pagamento for confirmado, enviaremos o e-mail para você criar sua senha.",
      });
    }

    // =====================================================================
    // 6B. ASSINATURA RECORRENTE (PIX ou cartão à vista): o Asaas gera as cobranças de cada ciclo
    // =====================================================================
    const payloadAssinatura: Record<string, unknown> = {
      customer: customerId,
      billingType,
      value: valorCobrado,
      nextDueDate: hoje,
      cycle: PLANOS[plano].ciclo,
      description: descricaoBase,
      externalReference: email,
    };
    if (cartaoAsaas) {
      payloadAssinatura.creditCard = cartaoAsaas.creditCard;
      payloadAssinatura.creditCardHolderInfo = cartaoAsaas.creditCardHolderInfo;
      // O Asaas exige o IP do comprador no cartão (na Vercel sempre vem no x-forwarded-for)
      if (ipComprador) payloadAssinatura.remoteIp = ipComprador;
    }

    const assinatura = await asaasFetch(cfg, "POST", "/subscriptions", payloadAssinatura);
    if (!assinatura.ok || !assinatura.data?.id) {
      await desfazer();
      return erro(
        mensagemErroAsaas(assinatura, "Pagamento não autorizado. Confira os dados ou tente outra forma de pagamento."),
        400
      );
    }
    assinaturaCriadaId = assinatura.data.id as string;

    // Primeira cobrança da assinatura
    const cobrancas = await asaasFetch(cfg, "GET", `/subscriptions/${assinaturaCriadaId}/payments`);
    const primeira = cobrancas.data?.data?.[0];
    if (!cobrancas.ok || !primeira?.id) {
      await desfazer();
      return erro("Não foi possível gerar a cobrança. Tente novamente.", 502);
    }
    const pagamentoId: string = primeira.id;
    const pagoAgora = compraPaga(primeira.status);

    // Cartão recusado: o Asaas não confirma a cobrança. Não deixamos assinatura "pendurada".
    if (billingType === "CREDIT_CARD" && primeira.status === "REFUSED") {
      await desfazer();
      return erro("Cartão recusado pela operadora. Confira os dados ou utilize outro cartão ou o Pix.", 402);
    }

    // PIX: QR Code real (obrigatório)
    let pix: { encodedImage?: string; payload?: string; expirationDate?: string } | null = null;
    if (billingType === "PIX") {
      // O QR Code às vezes demora alguns instantes para ficar disponível: até 3 tentativas
      let qr = await asaasFetch(cfg, "GET", `/payments/${pagamentoId}/pixQrCode`);
      for (let tentativa = 1; tentativa < 3 && (!qr.ok || !qr.data?.payload); tentativa++) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        qr = await asaasFetch(cfg, "GET", `/payments/${pagamentoId}/pixQrCode`);
      }
      if (!qr.ok || !qr.data?.payload) {
        console.error("Asaas: QR Code Pix indisponível", qr.status, JSON.stringify(qr.data?.errors || qr.data || {}).slice(0, 300));
        await desfazer();
        return erro("Não foi possível gerar o QR Code do Pix. Tente novamente.", 502);
      }
      pix = qr.data;
    }

    // ---------- 7. Persistência (se falhar, desfaz tudo) ----------
    // Mantém ATIVO apenas se já estava ativo (upgrade) ou se o cartão confirmou agora; Pix aguarda o webhook.
    const statusAssinatura = ehUpgrade ? "ATIVO" : pagoAgora ? "ATIVO" : "AGUARDANDO_PAGAMENTO";
    const { error: perfilErr } = await admin.from("profiles").upsert(
      {
        email,
        nome: perfilExistente?.nome || nome,
        cpf,
        telefone: celular,
        plano,
        status_assinatura: statusAssinatura,
        asaas_customer_id: customerId,
        asaas_subscription_id: assinaturaCriadaId,
        asaas_installment_id: null,
        parcelas: 1,
        proxima_cobranca: null,
        renovacao_automatica: false,
        renovacao_falhas: 0,
        renovacao_ultima_tentativa: null,
        renovacao_aviso_ciclo: null,
        acesso_ate: null,
        notificacoes_email: perfilExistente?.notificacoes_email ?? true,
      },
      { onConflict: "email" }
    );
    if (perfilErr) {
      console.error("Falha ao salvar perfil do checkout:", perfilErr.message);
      await desfazer();
      return erro("Não foi possível concluir o cadastro. Nenhuma cobrança foi mantida. Tente novamente.", 500);
    }

    await gravarAceiteDaCompra();

    const { error: faturaErr } = await admin.from("faturas").upsert(
      {
        user_email: email,
        asaas_payment_id: pagamentoId,
        descricao: `${descricaoBase}${cupomConsumido ? ` (Cupom: ${cupomConsumido})` : ""}`,
        valor: valorCobrado,
        forma_pagamento: billingType,
        status: pagoAgora ? "Pago" : "Pendente",
        data_emissao: new Date().toISOString(),
        parcela_numero: null,
        parcelas_total: null,
        asaas_installment_id: null,
      },
      { onConflict: "asaas_payment_id" }
    );
    if (faturaErr) console.error("Falha ao salvar fatura:", faturaErr.message); // o webhook recria a fatura

    // Upgrade: encerra a assinatura anterior para não cobrar em duplicidade
    if (ehUpgrade && assinaturaAntigaId && assinaturaAntigaId !== assinaturaCriadaId) {
      const cancel = await asaasFetch(cfg, "DELETE", `/subscriptions/${assinaturaAntigaId}`);
      if (!cancel.ok) console.error("ATENÇÃO: não foi possível cancelar a assinatura antiga", assinaturaAntigaId, cancel.status);
    }

    const subscriptionIdFinal = assinaturaCriadaId;

    // Compra concluída: a partir daqui nada é desfeito
    cupomConsumido = null;
    assinaturaCriadaId = null;

    // Cartão confirmado na hora: libera o acesso já (não depende do webhook chegar depois do cadastro)
    let emailEnviado = false;
    if (pagoAgora && !ehUpgrade) {
      emailEnviado = (await liberarAcessoPosPagamento(admin, email, nome)).enviado;
    }

    // ---------- 8. Resposta ----------
    const base = {
      success: true,
      subscriptionId: subscriptionIdFinal,
      paymentId: pagamentoId,
      email,
      valorCobrado,
      parcelas: 1,
      pagamentoConfirmado: pagoAgora,
      emailEnviado,
      mensagemAcesso: emailEnviado
        ? "Enviamos para o seu e-mail o link para criar sua senha."
        : "Assim que o pagamento for confirmado, enviaremos o e-mail para você criar sua senha.",
    };

    if (billingType === "PIX") {
      return NextResponse.json({
        ...base,
        tipo: "PIX",
        encodedImage: pix?.encodedImage,
        payload: pix?.payload,
        expirationDate: pix?.expirationDate,
      });
    }
    return NextResponse.json({ ...base, tipo: "CREDIT_CARD", status: pagoAgora ? "ACTIVE" : "PENDING" });
  } catch (error) {
    console.error("Erro interno ao processar assinatura:", error);
    await desfazer();
    return erro("Não foi possível processar o pagamento agora. Tente novamente em instantes.", 500);
  }
}
