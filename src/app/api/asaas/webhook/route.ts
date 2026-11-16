import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { igualConstante } from "@/lib/auth";
import { liberarAcessoPosPagamento } from "@/lib/acesso";

/**
 * Webhook oficial do Asaas — POST /api/asaas/webhook
 *
 * Configurar no painel do Asaas (Integrações > Webhooks):
 *   URL: https://SEU-DOMINIO/api/asaas/webhook
 *   Token de autenticação: o mesmo valor da variável ASAAS_WEBHOOK_TOKEN
 *   Eventos: PAYMENT_CREATED, PAYMENT_CONFIRMED, PAYMENT_RECEIVED, PAYMENT_OVERDUE, PAYMENT_DELETED,
 *            PAYMENT_REFUNDED, PAYMENT_CREDIT_CARD_CAPTURE_REFUSED, PAYMENT_CHARGEBACK_REQUESTED,
 *            SUBSCRIPTION_DELETED, SUBSCRIPTION_INACTIVATED
 *
 * Segurança: token OBRIGATÓRIO (sem token configurado, recusa tudo). Idempotente (evento repetido é ignorado).
 */

type Perfil = { email: string; nome: string | null; status_assinatura: string | null; acesso_ate?: string | null };

type Chaves = { subscriptionId?: string; installmentId?: string; referencia?: string; customerId?: string };

const COLUNAS_PERFIL = "email, nome, status_assinatura, acesso_ate";

/** Acha o cliente do evento: assinatura -> compra parcelada -> referência (e-mail) -> cliente do Asaas. */
async function acharPerfil(admin: SupabaseClient, k: Chaves): Promise<Perfil | null> {
  if (k.subscriptionId) {
    const { data } = await admin.from("profiles").select(COLUNAS_PERFIL).eq("asaas_subscription_id", k.subscriptionId).maybeSingle();
    if (data) return data as Perfil;
  }
  if (k.installmentId) {
    const { data } = await admin.from("profiles").select(COLUNAS_PERFIL).eq("asaas_installment_id", k.installmentId).maybeSingle();
    if (data) return data as Perfil;
  }
  // A referência externa é o e-mail do cliente (definida por nós na criação da cobrança)
  if (k.referencia && k.referencia.includes("@")) {
    const { data } = await admin.from("profiles").select(COLUNAS_PERFIL).eq("email", k.referencia.toLowerCase().trim()).maybeSingle();
    if (data) return data as Perfil;
  }
  // Cobrança avulsa (sem assinatura nem parcelamento)
  if (!k.subscriptionId && !k.installmentId && k.customerId) {
    const { data } = await admin.from("profiles").select(COLUNAS_PERFIL).eq("asaas_customer_id", k.customerId).maybeSingle();
    if (data) return data as Perfil;
  }
  return null;
}

/**
 * Pagamentos de cartão são confirmados NA HORA e o Asaas avisa em milissegundos: o webhook pode chegar antes
 * do checkout terminar de gravar o cliente. Nesse caso esperamos alguns segundos em vez de perder o evento.
 */
async function acharPerfilComEspera(admin: SupabaseClient, k: Chaves, tentativas = 4): Promise<Perfil | null> {
  for (let i = 0; i < tentativas; i++) {
    const perfil = await acharPerfil(admin, k);
    if (perfil) return perfil;
    if (i < tentativas - 1) await new Promise((r) => setTimeout(r, 1500));
  }
  return null;
}

function chavesDoPagamento(payment: any): Chaves {
  return {
    subscriptionId: payment?.subscription,
    installmentId: payment?.installment,
    referencia: payment?.externalReference,
    customerId: payment?.customer,
  };
}

async function atualizarFatura(
  admin: SupabaseClient,
  payment: any,
  perfil: Perfil | null,
  status: string
) {
  if (!payment?.id) return;
  const { data: existente } = await admin.from("faturas").select("id").eq("asaas_payment_id", payment.id).maybeSingle();
  if (existente) {
    await admin
      .from("faturas")
      .update({ status, valor: payment.value, forma_pagamento: payment.billingType })
      .eq("asaas_payment_id", payment.id);
  } else if (perfil) {
    // Renovações geram cobranças novas: cria a fatura para aparecer no histórico
    await admin.from("faturas").insert({
      user_email: perfil.email,
      asaas_payment_id: payment.id,
      descricao: payment.description || "Assinatura Nutrindo em Casa",
      valor: payment.value,
      forma_pagamento: payment.billingType,
      status,
      data_emissao: new Date().toISOString(),
      parcela_numero: payment.installmentNumber ? Number(payment.installmentNumber) : null,
      asaas_installment_id: payment.installment || null,
    });
  }
}

export async function POST(request: Request) {
  let admin: SupabaseClient | null = null;
  let eventoId = "";
  try {
    // 1. Autenticação do webhook: token obrigatório e comparação em tempo constante
    const tokenConfigurado = process.env.ASAAS_WEBHOOK_TOKEN || "";
    if (!tokenConfigurado) {
      console.error("ASAAS_WEBHOOK_TOKEN não configurado: webhook recusado.");
      return NextResponse.json({ error: "Webhook não configurado." }, { status: 503 });
    }
    const tokenRecebido = request.headers.get("asaas-access-token") || "";
    if (!(await igualConstante(tokenRecebido, tokenConfigurado))) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    if (!isSupabaseConfigured()) return NextResponse.json({ error: "Banco indisponível." }, { status: 503 });
    admin = getSupabaseAdmin();

    const body = await request.json();
    const evento: string = String(body?.event || "");
    const payment = body?.payment;
    const subscription = body?.subscription;
    eventoId = String(body?.id || (payment?.id ? `${evento}:${payment.id}` : ""));

    // 2. Idempotência: o mesmo evento nunca é processado duas vezes
    if (eventoId) {
      const { error: dupErr } = await admin
        .from("asaas_eventos")
        .insert({ id: eventoId, evento, payment_id: payment?.id || null });
      if (dupErr) {
        if (dupErr.code === "23505") return NextResponse.json({ received: true, duplicado: true });
        throw new Error(`Falha ao registrar evento: ${dupErr.message}`);
      }
    }

    // 3. Eventos de ASSINATURA (payload com "subscription", sem "payment")
    if (evento === "SUBSCRIPTION_DELETED" || evento === "SUBSCRIPTION_INACTIVATED") {
      if (subscription?.id) {
        // Só cancela se o perfil ainda aponta para ESTA assinatura (upgrade troca o id).
        // Se o cliente cancelou e ainda tem período pago (acesso_ate no futuro), mantém o acesso até lá.
        const perfilAssinatura = await acharPerfil(admin, { subscriptionId: subscription.id });
        const periodoPagoVigente = perfilAssinatura?.acesso_ate && new Date(perfilAssinatura.acesso_ate) > new Date();
        if (perfilAssinatura && !periodoPagoVigente) {
          await admin.from("profiles").update({ status_assinatura: "CANCELADO" }).eq("asaas_subscription_id", subscription.id);
        }
      }
      return NextResponse.json({ received: true, event: evento });
    }

    // 4. Eventos de COBRANÇA
    if (!payment?.id) return NextResponse.json({ received: true, ignorado: "sem pagamento" });

    const confirmando = evento === "PAYMENT_CONFIRMED" || evento === "PAYMENT_RECEIVED";
    const perfil = confirmando
      ? await acharPerfilComEspera(admin, chavesDoPagamento(payment))
      : await acharPerfil(admin, chavesDoPagamento(payment));

    switch (evento) {
      case "PAYMENT_CREATED":
        await atualizarFatura(admin, payment, perfil, "Pendente");
        break;

      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED": {
        await atualizarFatura(admin, payment, perfil, "Pago");
        if (perfil) {
          await admin.from("profiles").update({ status_assinatura: "ATIVO" }).eq("email", perfil.email);
          // Pagamento confirmado: envia o e-mail para criar a senha (se a conta ainda não existe)
          await liberarAcessoPosPagamento(admin, perfil.email, perfil.nome || "");
        }
        break;
      }

      case "PAYMENT_OVERDUE":
        await atualizarFatura(admin, payment, perfil, "Vencido");
        if (perfil && perfil.status_assinatura !== "CANCELADO") {
          await admin.from("profiles").update({ status_assinatura: "INADIMPLENTE" }).eq("email", perfil.email);
        }
        break;

      case "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED":
        await atualizarFatura(admin, payment, perfil, "Recusado");
        // Renovação recusada: acesso suspenso até regularizar. Compra inicial recusada continua aguardando.
        if (perfil && perfil.status_assinatura === "ATIVO") {
          await admin.from("profiles").update({ status_assinatura: "INADIMPLENTE" }).eq("email", perfil.email);
        }
        break;

      case "PAYMENT_REFUNDED":
      case "PAYMENT_CHARGEBACK_REQUESTED":
        await atualizarFatura(admin, payment, perfil, evento === "PAYMENT_REFUNDED" ? "Estornado" : "Contestado");
        if (perfil) {
          await admin
            .from("profiles")
            .update({ status_assinatura: "CANCELADO", renovacao_automatica: false })
            .eq("email", perfil.email);
        }
        break;

      case "PAYMENT_DELETED":
        await atualizarFatura(admin, payment, perfil, "Cancelado");
        break;

      default:
        // Evento sem tratamento: registrado para auditoria e confirmado ao Asaas
        break;
    }

    return NextResponse.json({ received: true, event: evento });
  } catch (error) {
    console.error("Erro ao processar webhook do Asaas:", error);
    // Libera o id para o Asaas poder reenviar o evento (a falha não pode ser "engolida")
    try {
      if (admin && eventoId) await admin.from("asaas_eventos").delete().eq("id", eventoId);
    } catch {}
    return NextResponse.json({ error: "Erro interno ao processar webhook." }, { status: 500 });
  }
}
