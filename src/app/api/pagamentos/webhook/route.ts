import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { configMP, validarAssinaturaWebhook } from "@/lib/mercadopago";
import { processarAssinatura, processarCobrancaAssinatura, processarPedido } from "@/lib/pagamentosWebhook";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Avisos do Mercado Pago (webhook). Fluxo seguro:
 *  1. confere a ASSINATURA do aviso (x-signature) e a data (anti-repetição) — sem isso, 401;
 *  2. NÃO confia no corpo: pergunta ao Mercado Pago o estado real do recurso;
 *  3. registra o aviso (não processa o mesmo estado duas vezes) e atualiza fatura/perfil de forma idempotente.
 * Qualquer falha devolve 500 para o Mercado Pago tentar de novo.
 */
export async function POST(request: Request) {
  const cfg = configMP();
  if (!cfg || !cfg.webhookSecret || !isSupabaseConfigured()) {
    console.error("Webhook recusado: Mercado Pago ou segredo do webhook não configurado.");
    return NextResponse.json({ error: "Webhook não configurado." }, { status: 503 });
  }

  const url = new URL(request.url);
  const dataIdUrl = url.searchParams.get("data.id") || url.searchParams.get("id");
  const assinaturaOk = validarAssinaturaWebhook({
    xSignature: request.headers.get("x-signature"),
    xRequestId: request.headers.get("x-request-id"),
    dataId: dataIdUrl,
    segredo: cfg.webhookSecret,
  });
  if (!assinaturaOk) {
    // Diagnóstico sem expor segredo: só indica o que faltou ou destoou no aviso recebido.
    const sig = request.headers.get("x-signature") || "";
    const ts = /(?:^|,)\s*ts=(\d+)/.exec(sig)?.[1];
    console.warn("Webhook recusado (assinatura inválida):", {
      temAssinatura: !!sig,
      temRequestId: !!request.headers.get("x-request-id"),
      temDataIdNaUrl: !!dataIdUrl,
      idadeSegundos: ts ? Math.round((Date.now() - Number(ts.length <= 10 ? Number(ts) * 1000 : ts)) / 1000) : null,
      tamanhoSegredo: cfg.webhookSecret.length,
    });
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  let chaveEvento = "";
  try {
    const corpo = await request.json().catch(() => ({}));
    const tipo = String(corpo?.type || url.searchParams.get("type") || url.searchParams.get("topic") || "").toLowerCase();
    const id = String(corpo?.data?.id || dataIdUrl || "");
    if (!tipo || !id) return NextResponse.json({ received: true, ignorado: "aviso sem tipo ou id" });

    // Idempotência: o mesmo aviso (tipo + id + ação) não é processado duas vezes
    chaveEvento = `${tipo}:${id}:${String(corpo?.action || "")}:${request.headers.get("x-request-id") || ""}`;
    const { error: dupErr } = await admin.from("gateway_eventos").insert({ id: chaveEvento, evento: tipo, payment_id: id });
    if (dupErr) {
      if (dupErr.code === "23505") return NextResponse.json({ received: true, duplicado: true });
      throw new Error(`Falha ao registrar aviso: ${dupErr.message}`);
    }

    let resultado: string;
    if (tipo === "order") resultado = await processarPedido(admin, cfg, id);
    else if (tipo === "subscription_authorized_payment") resultado = await processarCobrancaAssinatura(admin, cfg, id);
    else if (tipo === "subscription_preapproval") resultado = await processarAssinatura(admin, cfg, id);
    else resultado = `tipo sem tratamento: ${tipo}`;

    return NextResponse.json({ received: true, tipo, resultado });
  } catch (error) {
    console.error("Erro ao processar aviso do Mercado Pago:", error);
    // libera o registro para o Mercado Pago poder reenviar o aviso
    try {
      if (chaveEvento) await admin.from("gateway_eventos").delete().eq("id", chaveEvento);
    } catch {}
    return NextResponse.json({ error: "Erro interno ao processar o aviso." }, { status: 500 });
  }
}
