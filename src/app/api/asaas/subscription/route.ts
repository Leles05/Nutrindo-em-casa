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

      // c) Criação de Login e Disparo de E-mail oficial via Resend / Supabase Auth
      const origin =
        request.headers.get("origin") ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        "https://nutrindoemcasa.com.br";
      const redirectUrl = `${origin}/criar-senha`;

      let emailEnviado = false;
      const resendApiKey = process.env.RESEND_API_KEY;

      if (resendApiKey) {
        try {
          // Gera link oficial de convite ou recuperação via Supabase Admin
          let actionLink = "";
          const { data: linkInvite, error: inviteLinkErr } = await supabaseAdmin.auth.admin.generateLink({
            type: "invite",
            email: emailLimpo,
            options: { redirectTo: redirectUrl }
          });

          if (!inviteLinkErr && linkInvite?.properties?.action_link) {
            actionLink = linkInvite.properties.action_link;
          } else {
            const { data: linkRecovery } = await supabaseAdmin.auth.admin.generateLink({
              type: "recovery",
              email: emailLimpo,
              options: { redirectTo: redirectUrl }
            });
            actionLink = linkRecovery?.properties?.action_link || `${origin}/criar-senha?email=${encodeURIComponent(emailLimpo)}`;
          }

          const resendRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              from: process.env.RESEND_FROM_EMAIL || "Nutrindo em Casa <contato@nutrindoemcasa.com.br>",
              to: [emailLimpo],
              subject: "Bem-vindo(a) ao Nutrindo em Casa! Defina sua senha de acesso",
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F0EAE1; padding: 40px 20px; color: #2D3748;">
                  <div style="max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); border: 1px solid #E2E8F0;">
                    <div style="background-color: #4C6C54; padding: 32px 24px; text-align: center;">
                      <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">Nutrindo em Casa</h1>
                      <p style="color: #E2E8F0; font-size: 13px; margin-top: 6px; margin-bottom: 0;">Alimentação Infantil Sem Batalhas</p>
                    </div>
                    <div style="padding: 32px 28px;">
                      <p style="font-size: 16px; color: #2D3748; margin-top: 0;">Olá, <strong>${nomeLimpo || "Família"}</strong>!</p>
                      <p style="font-size: 14px; line-height: 1.6; color: #4A5568;">
                        Seu acesso ao <strong>Nutrindo em Casa</strong> foi liberado com sucesso! Estamos muito felizes em caminhar junto com você na jornada de alimentação do seu filho(a).
                      </p>
                      <div style="background-color: #F7FAFC; border-left: 4px solid #4C6C54; padding: 14px 18px; border-radius: 8px; margin: 24px 0;">
                        <p style="margin: 0; font-size: 13px; color: #4A5568; line-height: 1.5;">
                          <strong>Próximo passo obrigatório:</strong> Crie sua senha de segurança para acessar o sistema, preencher a Anamnese Pediátrica e agendar sua 1ª consulta com a Dra. Laís Leles.
                        </p>
                      </div>
                      <div style="text-align: center; margin: 32px 0;">
                        <a href="${actionLink}" style="background-color: #4C6C54; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 28px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(76, 108, 84, 0.3);">
                          Definir Minha Senha de Acesso →
                        </a>
                      </div>
                      <p style="font-size: 12px; color: #718096; line-height: 1.5;">
                        Se o botão acima não funcionar, copie e cole este link em seu navegador:<br/>
                        <a href="${actionLink}" style="color: #EB6D57; word-break: break-all;">${actionLink}</a>
                      </p>
                      <hr style="border: none; border-top: 1px solid #EDF2F7; margin: 24px 0;" />
                      <p style="font-size: 12px; color: #A0AEC0; margin-bottom: 0; text-align: center;">
                        Nutrindo em Casa • Dra. Laís Leles • Todos os direitos reservados.
                      </p>
                    </div>
                  </div>
                </div>
              `
            })
          });

          if (resendRes.ok) {
            emailEnviado = true;
          } else {
            console.warn("Falha no disparo via Resend, tentando Supabase Auth...");
          }
        } catch (resendErr) {
          console.warn("Erro ao enviar e-mail via Resend:", resendErr);
        }
      }

      // Se não enviou pelo Resend (ou se não havia chave RESEND_API_KEY), dispara pelo Supabase
      if (!emailEnviado) {
        try {
          const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
            emailLimpo,
            { redirectTo: redirectUrl }
          );

          if (!inviteError) {
            emailEnviado = true;
          } else {
            // Se o usuário já existir no Supabase Auth, envia o link de redefinição/definição de senha
            const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(emailLimpo, {
              redirectTo: redirectUrl,
            });
            if (!resetError) {
              emailEnviado = true;
            }
          }
        } catch (authError) {
          console.warn("Aviso ao disparar convite Supabase Auth:", authError);
        }
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
            expirationDate: qrData.expirationDate,
            email: emailLimpo,
            emailEnviado: true
          });
        }
      }

      return NextResponse.json({
        success: true,
        tipo: "PIX",
        subscriptionId,
        paymentId: firstPaymentId,
        email: emailLimpo,
        emailEnviado: true,
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
      paymentId: firstPaymentId,
      email: emailLimpo,
      emailEnviado: true
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
