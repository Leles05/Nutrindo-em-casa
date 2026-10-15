import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Webhook Oficial do Asaas para Notificações de Pagamentos e Assinaturas
 * Rota: POST /api/asaas/webhook
 */
export async function POST(request: Request) {
  try {
    // 1. Validação de token de autenticação do webhook caso configurado
    const webhookTokenConfigurado = process.env.ASAAS_WEBHOOK_TOKEN;
    const tokenRecebido = request.headers.get("asaas-access-token");

    if (webhookTokenConfigurado && tokenRecebido !== webhookTokenConfigurado) {
      return NextResponse.json(
        { error: "Token de webhook inválido ou não autorizado." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { event, payment } = body;

    if (!payment) {
      return NextResponse.json({ received: true, message: "Evento sem payload de pagamento ignorado." });
    }

    const paymentId = payment.id;
    const customerId = payment.customer;
    const subscriptionId = payment.subscription;
    const supabaseAdmin = getSupabaseAdmin();

    // =========================================================================
    // EVENTOS DE PAGAMENTO CONFIRMADO OU RECEBIDO
    // =========================================================================
    if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
      // 1. Atualiza o status da fatura para 'Pago'
      if (paymentId) {
        await supabaseAdmin
          .from("faturas")
          .update({
            status: "Pago",
            valor: payment.value,
            forma_pagamento: payment.billingType,
          })
          .eq("asaas_payment_id", paymentId);
      }

      // 2. Atualiza a assinatura do perfil para 'ATIVO'
      if (subscriptionId) {
        await supabaseAdmin
          .from("profiles")
          .update({ status_assinatura: "ATIVO" })
          .eq("asaas_subscription_id", subscriptionId);
      } else if (customerId) {
        await supabaseAdmin
          .from("profiles")
          .update({ status_assinatura: "ATIVO" })
          .eq("asaas_customer_id", customerId);
      }
    }

    // =========================================================================
    // EVENTO DE PAGAMENTO VENCIDO / INADIMPLENTE
    // =========================================================================
    else if (event === "PAYMENT_OVERDUE") {
      if (paymentId) {
        await supabaseAdmin
          .from("faturas")
          .update({ status: "Vencido" })
          .eq("asaas_payment_id", paymentId);
      }

      if (subscriptionId) {
        await supabaseAdmin
          .from("profiles")
          .update({ status_assinatura: "INADIMPLENTE" })
          .eq("asaas_subscription_id", subscriptionId);
      } else if (customerId) {
        await supabaseAdmin
          .from("profiles")
          .update({ status_assinatura: "INADIMPLENTE" })
          .eq("asaas_customer_id", customerId);
      }
    }

    return NextResponse.json({
      received: true,
      event,
      paymentId,
      status: "processado com sucesso",
    });
  } catch (error: unknown) {
    console.error("Erro ao processar webhook do Asaas:", error);
    const erroMensagem =
      error instanceof Error ? error.message : "Erro desconhecido no webhook";
    return NextResponse.json(
      { error: "Erro interno ao processar webhook", detalhe: erroMensagem },
      { status: 500 }
    );
  }
}
