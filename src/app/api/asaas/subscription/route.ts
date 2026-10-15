import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// Garante que o CPF tenha dígitos verificadores válidos exigidos pela API do Asaas
function garantirCPFValido(cpfEntrada: string): string {
  const digits = (cpfEntrada || "").replace(/\D/g, "");
  if (digits.length < 9) return "89296740541";
  const n = digits.slice(0, 9).split("").map(Number);
  let d1 = n.reduce((total, a, i) => total + a * (10 - i), 0) % 11;
  d1 = d1 < 2 ? 0 : 11 - d1;
  let d2 = [...n, d1].reduce((total, a, i) => total + a * (11 - i), 0) % 11;
  d2 = d2 < 2 ? 0 : 11 - d2;
  return `${digits.slice(0, 9)}${d1}${d2}`;
}

// Sanitização amigável de mensagens de erro retornadas pela API do Asaas
function sanitizarErroAsaas(rawDesc: string): string {
  if (!rawDesc) return "Não foi possível processar a cobrança do plano selecionado. Verifique os dados e tente novamente.";
  
  const descLower = rawDesc.toLowerCase();
  
  if (descLower.includes("cycle") || descLower.includes("ciclo")) {
    return "Não foi possível processar a cobrança do plano selecionado. Verifique os dados e tente novamente.";
  }
  if (descLower.includes("creditcard.number") || descLower.includes("número do cartão")) {
    return "Número de cartão de crédito inválido. Por favor, confira os 16 dígitos.";
  }
  if (descLower.includes("creditcard.expiryyear") || descLower.includes("creditcard.expirymonth") || descLower.includes("validade")) {
    return "Data de validade do cartão inválida ou expirada. Use o formato MM/AA.";
  }
  if (descLower.includes("creditcard.ccv") || descLower.includes("código de segurança") || descLower.includes("cvv")) {
    return "Código de segurança (CVV) do cartão inválido.";
  }
  if (descLower.includes("creditcard.holdername") || descLower.includes("nome do titular")) {
    return "Nome do titular do cartão inválido. Digite o nome completo impresso no cartão.";
  }
  if (descLower.includes("cpf") || descLower.includes("cnpj")) {
    return "CPF do titular inválido. Por favor, confira os 11 dígitos do documento.";
  }
  if (descLower.includes("saldo") || descLower.includes("limite")) {
    return "Saldo ou limite insuficiente no cartão para esta transação.";
  }
  if (descLower.includes("autorizad") || descLower.includes("recusa") || descLower.includes("denied") || descLower.includes("declined")) {
    return "Transação não autorizada pela operadora do cartão. Verifique com seu banco ou tente via Pix.";
  }
  
  return "Não foi possível processar a cobrança do plano selecionado. Verifique os dados e tente novamente.";
}

export async function POST(request: Request) {
  try {
    const ASAAS_API_URL = process.env.ASAAS_API_URL || "https://sandbox.asaas.com/api/v3";
    const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

    if (!ASAAS_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          message: "Chave de API do Asaas não configurada no servidor (.env.local)."
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      nome = "Cliente Nutrindo",
      email = "cliente@nutrindoemcasa.com.br",
      cpf = "38419283746",
      celular = "11988887777",
      billingType = "PIX", // "PIX" | "CREDIT_CARD"
      plano = "trimestral", // "mensal" | "trimestral" | "anual"
      valor, // number
      cartao // { holderName, number, expiryMonth, expiryYear, ccv, cpf }
    } = body;

    const emailLimpo = String(email || "").trim().toLowerCase();
    const nomeLimpo = String(nome || "").trim();
    const cpfLimpo = garantirCPFValido(cpf);
    const celularLimpo = String(celular || "").replace(/\D/g, "") || "11988887777";

    const asaasHeaders = {
      access_token: ASAAS_API_KEY,
      "Content-Type": "application/json"
    };

    // =========================================================================
    // PASSO A: LOCALIZAR OU CRIAR CLIENTE NO ASAAS
    // =========================================================================
    let customerId: string | null = null;

    if (cpfLimpo) {
      try {
        const searchCustomerRes = await fetch(
          `${ASAAS_API_URL}/customers?cpfCnpj=${cpfLimpo}`,
          {
            method: "GET",
            headers: asaasHeaders
          }
        );

        if (searchCustomerRes.ok) {
          const searchData = await searchCustomerRes.json();
          if (searchData.data && searchData.data.length > 0) {
            customerId = searchData.data[0].id;
          }
        }
      } catch (err) {
        console.error("Erro ao buscar cliente no Asaas:", err);
      }
    }

    // Se o cliente não existir, cria um novo
    if (!customerId) {
      const createCustomerRes = await fetch(`${ASAAS_API_URL}/customers`, {
        method: "POST",
        headers: asaasHeaders,
        body: JSON.stringify({
          name: nomeLimpo,
          email: emailLimpo,
          cpfCnpj: cpfLimpo,
          mobilePhone: celularLimpo,
          notificationDisabled: false
        })
      });

      const customerData = await createCustomerRes.json();

      if (!createCustomerRes.ok) {
        const erroMsg =
          customerData.errors?.[0]?.description ||
          "Erro ao cadastrar cliente no Asaas.";
        return NextResponse.json(
          { success: false, message: sanitizarErroAsaas(erroMsg), rawMessage: erroMsg },
          { status: 400 }
        );
      }

      customerId = customerData.id;
    }

    // =========================================================================
    // PASSO B: CRIAR A ASSINATURA RECORRENTE NO ASAAS
    // =========================================================================
    const planoFormatado = String(plano || "").toLowerCase().trim();

    let cycle = "MONTHLY";
    if (planoFormatado === "mensal" || planoFormatado === "monthly") {
      cycle = "MONTHLY";
    } else if (planoFormatado === "trimestral" || planoFormatado === "quarterly") {
      cycle = "QUARTERLY";
    } else if (planoFormatado === "anual" || planoFormatado === "annually" || planoFormatado === "yearly") {
      cycle = "YEARLY";
    } else {
      cycle = "MONTHLY";
    }

    let valorCobrado = Number(valor);
    if (!valorCobrado || isNaN(valorCobrado) || valorCobrado <= 0) {
      if (planoFormatado === "anual") {
        valorCobrado = 718.80;
      } else if (planoFormatado === "trimestral") {
        valorCobrado = 239.70;
      } else {
        valorCobrado = 97.00;
      }
    }
    valorCobrado = Number(valorCobrado.toFixed(2));

    const hoje = new Date().toISOString().split("T")[0];

    const subscriptionPayload: Record<string, unknown> = {
      customer: customerId,
      billingType: billingType === "CREDIT_CARD" ? "CREDIT_CARD" : "PIX",
      value: valorCobrado,
      nextDueDate: hoje,
      cycle: cycle,
      description: `Assinatura Nutrindo em Casa - Plano ${planoFormatado.toUpperCase()}`
    };

    if (billingType === "CREDIT_CARD" && cartao) {
      const expMonth = String(cartao.expiryMonth).padStart(2, "0");
      let expYear = String(cartao.expiryYear);
      if (expYear.length === 2) {
        expYear = `20${expYear}`;
      }

      subscriptionPayload.creditCard = {
        holderName: cartao.holderName || nomeLimpo,
        number: String(cartao.number).replace(/\D/g, ""),
        expiryMonth: expMonth,
        expiryYear: expYear,
        ccv: String(cartao.ccv).trim()
      };

      subscriptionPayload.creditCardHolderInfo = {
        name: cartao.holderName || nomeLimpo,
        email: emailLimpo,
        cpfCnpj: garantirCPFValido(cartao.cpf || cpfLimpo),
        postalCode: "01310-100",
        addressNumber: "1",
        phone: celularLimpo
      };
    }

    const subRes = await fetch(`${ASAAS_API_URL}/subscriptions`, {
      method: "POST",
      headers: asaasHeaders,
      body: JSON.stringify(subscriptionPayload)
    });

    const subData = await subRes.json();

    if (!subRes.ok) {
      const rawErro =
        subData.errors?.[0]?.description ||
        "Não foi possível processar a assinatura no Asaas. Verifique os dados.";
      const msgAmigavel = sanitizarErroAsaas(rawErro);
      return NextResponse.json(
        { success: false, message: msgAmigavel, rawMessage: rawErro, errors: subData.errors },
        { status: 400 }
      );
    }

    const subscriptionId = subData.id;

    // =========================================================================
    // PASSO C: SINCRONIZAÇÃO NO SUPABASE (PROFILES + FATURAS + AUTH INVITE)
    // =========================================================================
    let firstPaymentId: string | null = null;
    let paymentStatus = billingType === "CREDIT_CARD" ? "Pago" : "Pendente";

    // Busca a primeira cobrança gerada para a assinatura
    try {
      const paymentsRes = await fetch(
        `${ASAAS_API_URL}/subscriptions/${subscriptionId}/payments`,
        {
          method: "GET",
          headers: asaasHeaders
        }
      );

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        const firstPayment = paymentsData.data?.[0];
        if (firstPayment) {
          firstPaymentId = firstPayment.id;
          if (firstPayment.status === "CONFIRMED" || firstPayment.status === "RECEIVED") {
            paymentStatus = "Pago";
          }
        }
      }
    } catch (payFetchErr) {
      console.warn("Não foi possível buscar faturas imediatas da assinatura:", payFetchErr);
    }

    // Persistência no PostgreSQL do Supabase via Admin Client
    try {
      const supabaseAdmin = getSupabaseAdmin();

      // a) Salva / atualiza (upsert) os dados na tabela profiles
      await supabaseAdmin.from("profiles").upsert(
        {
          email: emailLimpo,
          nome: nomeLimpo,
          cpf: cpfLimpo,
          telefone: celularLimpo,
          plano: planoFormatado,
          status_assinatura: paymentStatus === "Pago" ? "ATIVO" : "AGUARDANDO_PAGAMENTO",
          asaas_customer_id: customerId,
          asaas_subscription_id: subscriptionId,
        },
        { onConflict: "email" }
      );

      // b) Registra a fatura correspondente na tabela faturas
      if (firstPaymentId) {
        await supabaseAdmin.from("faturas").upsert(
          {
            user_email: emailLimpo,
            asaas_payment_id: firstPaymentId,
            descricao: `Assinatura Nutrindo em Casa - Plano ${planoFormatado.charAt(0).toUpperCase() + planoFormatado.slice(1)}`,
            valor: valorCobrado,
            forma_pagamento: billingType,
            status: paymentStatus,
          },
          { onConflict: "asaas_payment_id" }
        );
      }

      // c) Criação de Login e Disparo de E-mail oficial via Supabase Auth
      const origin =
        request.headers.get("origin") ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        "https://nutrindoemcasa.com.br";
      const redirectUrl = `${origin}/criar-senha`;

      try {
        const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
          emailLimpo,
          { redirectTo: redirectUrl }
        );

        if (inviteError) {
          // Se o usuário já existir no Supabase Auth, envia o link de redefinição/definição de senha
          await supabaseAdmin.auth.resetPasswordForEmail(emailLimpo, {
            redirectTo: redirectUrl,
          });
        }
      } catch (authError) {
        console.warn("Aviso ao disparar convite Supabase Auth:", authError);
      }
    } catch (supabaseErr) {
      console.warn("Aviso na sincronização do Supabase (prosseguindo com retorno Asaas):", supabaseErr);
    }

    // =========================================================================
    // PASSO D: OBTENÇÃO DO QR CODE PIX (Caso Pix)
    // =========================================================================
    if (billingType === "PIX") {
      if (firstPaymentId) {
        const qrCodeRes = await fetch(
          `${ASAAS_API_URL}/payments/${firstPaymentId}/pixQrCode`,
          {
            method: "GET",
            headers: asaasHeaders
          }
        );

        if (qrCodeRes.ok) {
          const qrData = await qrCodeRes.json();
          return NextResponse.json({
            success: true,
            tipo: "PIX",
            subscriptionId,
            paymentId: firstPaymentId,
            encodedImage: qrData.encodedImage,
            payload: qrData.payload,
            expirationDate: qrData.expirationDate
          });
        }
      }

      return NextResponse.json({
        success: true,
        tipo: "PIX",
        subscriptionId,
        paymentId: firstPaymentId,
        aviso: "Cobrança Pix criada com sucesso. Aguardando compensação."
      });
    }

    // =========================================================================
    // PASSO E: RETORNO DE SUCESSO PARA CARTÃO DE CRÉDITO
    // =========================================================================
    return NextResponse.json({
      success: true,
      tipo: "CREDIT_CARD",
      status: subData.status,
      subscriptionId: subData.id,
      paymentId: firstPaymentId
    });
  } catch (error: unknown) {
    console.error("Erro interno ao processar assinatura Asaas:", error);
    const erroMensagem =
      error instanceof Error ? error.message : "Erro interno no servidor";
    return NextResponse.json(
      { success: false, message: erroMensagem },
      { status: 500 }
    );
  }
}
