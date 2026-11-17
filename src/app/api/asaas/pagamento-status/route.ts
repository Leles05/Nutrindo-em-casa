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
  if (!/^pay_[A-Za-z0-9]{6,40}$/.test(id)) {
    return NextResponse.json({ success: false, message: "Pagamento inválido." }, { status: 400 });
  }

  // a tela consulta a cada 4 s (≈ 225 vezes em 15 min): o limite deixa folga e barra abuso
  const rl = limitar(`pgstatus:${ipDaRequisicao(request)}`, 400, 15 * 60 * 1000);
  if (!rl.permitido) {
    return NextResponse.json({ success: false, message: "Muitas consultas. Aguarde um instante." }, { status: 429 });
  }

  try {
    const { data } = await getSupabaseAdmin().from("faturas").select("status").eq("asaas_payment_id", id).maybeSingle();
    return NextResponse.json(
      { success: true, pago: data?.status === "Pago" },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("Erro ao consultar status do pagamento:", err);
    return NextResponse.json({ success: false, message: "Não foi possível consultar agora." }, { status: 500 });
  }
}
