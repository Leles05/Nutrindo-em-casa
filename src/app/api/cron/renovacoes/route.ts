import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { igualConstante } from "@/lib/auth";
import { diasEntre, hojeSP } from "@/lib/planos";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Rotina diária — GET /api/cron/renovacoes
 *
 * Hoje: alinha o status gravado de quem está com a renovação atrasada além da carência
 * (o acesso já é bloqueado em tempo real por `statusEfetivo`; aqui só mantemos o cadastro coerente).
 * As cobranças de renovação entram com a integração do novo provedor de pagamento.
 *
 * Agendada em vercel.json. A Vercel envia "Authorization: Bearer <CRON_SECRET>" automaticamente
 * quando a variável CRON_SECRET existe no projeto. Sem CRON_SECRET a rota recusa tudo.
 */
export async function GET(request: Request) {
  const segredo = process.env.CRON_SECRET || "";
  if (!segredo) {
    console.error("CRON_SECRET não configurado: rotina de renovação recusada.");
    return NextResponse.json({ error: "Rotina não configurada." }, { status: 503 });
  }
  const recebido = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!(await igualConstante(recebido, segredo))) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Serviços indisponíveis." }, { status: 503 });
  }

  const admin = getSupabaseAdmin();
  const hoje = hojeSP();
  try {
    let alinhados = 0;
    const { data: atrasados } = await admin
      .from("profiles")
      .select("email, proxima_cobranca")
      .eq("renovacao_automatica", true)
      .eq("status_assinatura", "ATIVO")
      .lt("proxima_cobranca", hoje)
      .limit(200);
    for (const a of atrasados || []) {
      if (a.proxima_cobranca && diasEntre(a.proxima_cobranca, hoje) > 5) {
        await admin.from("profiles").update({ status_assinatura: "INADIMPLENTE" }).eq("email", a.email);
        alinhados++;
      }
    }
    return NextResponse.json({ success: true, hoje, alinhados });
  } catch (error) {
    console.error("Erro na rotina diária:", error);
    return NextResponse.json({ success: false, error: "Erro na rotina diária." }, { status: 500 });
  }
}
