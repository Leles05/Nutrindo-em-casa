import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { igualConstante } from "@/lib/auth";
import { configAsaas } from "@/lib/asaas";
import { diasEntre, hojeSP } from "@/lib/planos";
import {
  avisarRenovacao,
  DIAS_AVISO_RENOVACAO,
  MAX_TENTATIVAS_RENOVACAO,
  renovarPerfil,
  type PerfilRenovacao,
} from "@/lib/renovacao";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Rotina diária de renovação automática (parcelado no cartão) — GET /api/cron/renovacoes
 *
 *  1. Avisa por e-mail, 7 dias antes, quem vai renovar (uma vez por ciclo).
 *  2. No dia da renovação gera a nova fatura e cobra no cartão salvo. Se falhar, tenta de novo nos
 *     dias seguintes (até 3 tentativas); depois disso o cliente fica INADIMPLENTE.
 *
 * Agendada em vercel.json. A Vercel envia "Authorization: Bearer <CRON_SECRET>" automaticamente
 * quando a variável CRON_SECRET existe no projeto. Sem CRON_SECRET a rota recusa tudo.
 * Use ?dry=1 para simular sem cobrar nem enviar nada.
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

  const cfg = configAsaas();
  if (!cfg || !isSupabaseConfigured()) {
    return NextResponse.json({ error: "Serviços indisponíveis." }, { status: 503 });
  }

  const dry = new URL(request.url).searchParams.get("dry") === "1";
  const admin = getSupabaseAdmin();
  const hoje = hojeSP();
  const limiteAviso = new Date(Date.parse(hoje + "T00:00:00Z") + DIAS_AVISO_RENOVACAO * 86400000).toISOString().split("T")[0];

  const colunas = "email, nome, plano, parcelas, asaas_customer_id, proxima_cobranca, renovacao_falhas, status_assinatura, renovacao_aviso_ciclo";
  const resumo = { dry, avisos: { enviados: 0, previstos: 0 }, cobrancas: { renovadas: 0, falhas: 0, inadimplentes: 0, ignoradas: 0, previstas: 0 } };

  try {
    // ---------- 1. Avisos prévios ----------
    const { data: paraAvisar } = await admin
      .from("profiles")
      .select(colunas)
      .eq("renovacao_automatica", true)
      .eq("status_assinatura", "ATIVO")
      .not("asaas_installment_id", "is", null)
      .gt("proxima_cobranca", hoje)
      .lte("proxima_cobranca", limiteAviso)
      .limit(100);
    for (const p of (paraAvisar || []) as (PerfilRenovacao & { renovacao_aviso_ciclo: string | null })[]) {
      if (p.renovacao_aviso_ciclo === p.proxima_cobranca) continue; // já avisado neste ciclo
      resumo.avisos.previstos++;
      if (!dry && (await avisarRenovacao(admin, p))) resumo.avisos.enviados++;
    }

    // ---------- 2. Cobranças do dia (e tentativas pendentes) ----------
    const { data: paraCobrar } = await admin
      .from("profiles")
      .select(colunas)
      .eq("renovacao_automatica", true)
      .eq("status_assinatura", "ATIVO")
      .not("asaas_installment_id", "is", null)
      .lte("proxima_cobranca", hoje)
      .lt("renovacao_falhas", MAX_TENTATIVAS_RENOVACAO)
      .order("proxima_cobranca", { ascending: true })
      .limit(50);

    for (const p of (paraCobrar || []) as PerfilRenovacao[]) {
      resumo.cobrancas.previstas++;
      if (dry) continue;
      const r = await renovarPerfil(admin, cfg, p, hoje);
      if (r === "renovado") resumo.cobrancas.renovadas++;
      else if (r === "falha") resumo.cobrancas.falhas++;
      else if (r === "inadimplente") resumo.cobrancas.inadimplentes++;
      else resumo.cobrancas.ignoradas++;
    }

    // ---------- 3. Trava de segurança: carência estourada sem cobrança bem-sucedida ----------
    // (o acesso já é bloqueado em tempo real por statusEfetivo; aqui só alinhamos o status gravado)
    if (!dry) {
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
        }
      }
    }

    return NextResponse.json({ success: true, hoje, ...resumo });
  } catch (error) {
    console.error("Erro na rotina de renovações:", error);
    return NextResponse.json({ success: false, error: "Erro na rotina de renovações." }, { status: 500 });
  }
}
