import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { ipDaRequisicao } from "@/lib/auth";
import { limitar } from "@/lib/rateLimit";

/**
 * Consulta usada pela tela de Pix para saber se o pagamento já foi confirmado.
 * Não exige login (o cliente ainda não tem conta) e devolve só "pago: sim/não".
 * O id do pagamento é longo e imprevisível, e o limite por IP impede varredura.
 */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!/^[A-Za-z0-9_-]{6,60}$/.test(id)) {
    return NextResponse.json({ success: false, message: "Pagamento inválido." }, { status: 400 });
  }

  // a tela consulta a cada 4 s (≈ 225 vezes em 15 min): o limite deixa folga e barra abuso
  const rl = limitar(`pgstatus:${ipDaRequisicao(request)}`, 400, 15 * 60 * 1000);
  if (!rl.permitido) {
    return NextResponse.json({ success: false, message: "Muitas consultas. Aguarde um instante." }, { status: 429 });
  }

  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin.from("faturas").select("status").eq("gateway_pagamento_id", id).maybeSingle();
    let pago = data?.status === "Pago";

    // Fatura provisória de assinatura (1ª cobrança ainda não existia no checkout): depois do aviso o id é trocado
    // pelo real; então olhamos a assinatura ligada ao perfil.
    if (!data && id.startsWith("assinatura_")) {
      const { data: perfil } = await admin.from("profiles").select("email").eq("gateway_assinatura_id", id.slice("assinatura_".length)).maybeSingle();
      if (perfil?.email) {
        const { count } = await admin.from("faturas").select("id", { count: "exact", head: true }).eq("user_email", perfil.email).eq("status", "Pago");
        pago = (count || 0) > 0;
      }
    }
    return NextResponse.json({ success: true, pago }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("Erro ao consultar status do pagamento:", err);
    return NextResponse.json({ success: false, message: "Não foi possível consultar agora." }, { status: 500 });
  }
}
