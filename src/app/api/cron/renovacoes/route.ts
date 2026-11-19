import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { igualConstante } from "@/lib/auth";
import { diasEntre, hojeSP } from "@/lib/planos";
import { configMP } from "@/lib/mercadopago";
import { conferirAssinatura } from "@/lib/pagamentosWebhook";
import { DIAS_DE_CARENCIA_RENOVACAO } from "@/lib/assinatura";
import { avisarRenovacaoCartao, DIAS_ANTES_DO_LINK, enviarLinkRenovacao, precisaAvisarCartao, precisaEnviarLink, type PerfilRenovacaoLink } from "@/lib/renovacaoLink";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Rotina diária — GET /api/cron/renovacoes
 *
 * 1) Renovação por LINK (Pix): quem pagou por Pix ou parcelado no cartão recebe, alguns dias antes do vencimento,
 *    um e-mail com o Pix da renovação (a assinatura de cartão à vista é renovada pelo próprio Mercado Pago).
 * 2) Alinha o status gravado de quem está com a renovação atrasada além da carência
 *    (o acesso já é bloqueado em tempo real por `statusEfetivo`; aqui só mantemos o cadastro coerente).
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
    // ---- 1) links de renovação ----
    let enviados = 0;
    let falhas = 0;
    const cfg = configMP();
    if (cfg) {
      const limite = new Date(Date.parse(hoje + "T00:00:00Z") + DIAS_ANTES_DO_LINK * 86400000).toISOString().split("T")[0];
      const { data: candidatos } = await admin
        .from("profiles")
        .select("email, nome, plano, proxima_cobranca, renovacao_aviso_ciclo, renovacao_automatica, status_assinatura, gateway_assinatura_id, acesso_ate")
        .eq("status_assinatura", "ATIVO")
        .eq("renovacao_automatica", true)
        .is("gateway_assinatura_id", null)
        .lte("proxima_cobranca", limite)
        .limit(100);
      for (const c of (candidatos || []) as PerfilRenovacaoLink[]) {
        if (!precisaEnviarLink(c, hoje)) continue;
        const r = await enviarLinkRenovacao(admin, cfg, c);
        if (r === "enviado") enviados++;
        else if (r === "falha") falhas++;
      }
    } else {
      console.error("Rotina de renovação: Mercado Pago não configurado, links não enviados.");
    }

    // ---- 1b) aviso de renovação para quem tem assinatura no cartão (o Mercado Pago cobra sozinho) ----
    let avisosCartao = 0;
    {
      const limite = new Date(Date.parse(hoje + "T00:00:00Z") + DIAS_ANTES_DO_LINK * 86400000).toISOString().split("T")[0];
      const { data: comAssinatura } = await admin
        .from("profiles")
        .select("email, nome, plano, proxima_cobranca, renovacao_aviso_ciclo, renovacao_automatica, status_assinatura, gateway_assinatura_id, acesso_ate")
        .eq("status_assinatura", "ATIVO")
        .eq("renovacao_automatica", true)
        .not("gateway_assinatura_id", "is", null)
        .gte("proxima_cobranca", hoje)
        .lte("proxima_cobranca", limite)
        .limit(100);
      for (const c of (comAssinatura || []) as PerfilRenovacaoLink[]) {
        if (precisaAvisarCartao(c, hoje) && (await avisarRenovacaoCartao(admin, c))) avisosCartao++;
      }
    }

    // ---- 1c) conferência das assinaturas atrasadas direto no Mercado Pago (cobre avisos perdidos) ----
    let conferidas = 0;
    if (cfg) {
      const { data: atrasadasCartao } = await admin
        .from("profiles")
        .select("gateway_assinatura_id")
        .eq("status_assinatura", "ATIVO")
        .eq("renovacao_automatica", true)
        .not("gateway_assinatura_id", "is", null)
        .lte("proxima_cobranca", hoje)
        .limit(50);
      for (const a of atrasadasCartao || []) {
        try {
          await conferirAssinatura(admin, cfg, String(a.gateway_assinatura_id));
          conferidas++;
        } catch (e) {
          console.error("Conferência da assinatura falhou:", e);
        }
      }
    }

    // ---- 2) alinhamento de status ----
    let alinhados = 0;
    const { data: atrasados } = await admin
      .from("profiles")
      .select("email, proxima_cobranca")
      .eq("renovacao_automatica", true)
      .eq("status_assinatura", "ATIVO")
      .lt("proxima_cobranca", hoje)
      .limit(200);
    for (const a of atrasados || []) {
      if (a.proxima_cobranca && diasEntre(a.proxima_cobranca, hoje) > DIAS_DE_CARENCIA_RENOVACAO) {
        await admin.from("profiles").update({ status_assinatura: "INADIMPLENTE" }).eq("email", a.email);
        alinhados++;
      }
    }
    return NextResponse.json({ success: true, hoje, links_enviados: enviados, links_com_falha: falhas, avisos_cartao: avisosCartao, assinaturas_conferidas: conferidas, alinhados });
  } catch (error) {
    console.error("Erro na rotina diária:", error);
    return NextResponse.json({ success: false, error: "Erro na rotina diária." }, { status: 500 });
  }
}
