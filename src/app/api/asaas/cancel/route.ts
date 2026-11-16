import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { ehResposta, exigirUsuario } from "@/lib/auth";
import { asaasFetch, configAsaas } from "@/lib/asaas";
import { limitar } from "@/lib/rateLimit";

const MESES_POR_PLANO: Record<string, number> = { mensal: 1, trimestral: 3, anual: 12 };

/**
 * Cancela a PRÓPRIA assinatura: interrompe as próximas cobranças no Asaas e mantém o acesso
 * até o fim do período já pago (acesso_ate), como informado ao cliente na tela de Configurações.
 */
export async function POST(request: Request) {
  try {
    const ctx = await exigirUsuario(request);
    if (ehResposta(ctx)) return ctx;
    if (!limitar(`cancel:${ctx.user.id}`, 5, 15 * 60 * 1000).permitido) {
      return NextResponse.json({ success: false, message: "Muitas tentativas. Aguarde." }, { status: 429 });
    }

    const cfg = configAsaas();
    if (!cfg || !isSupabaseConfigured()) {
      return NextResponse.json({ success: false, message: "Serviço indisponível. Tente novamente em instantes." }, { status: 503 });
    }

    const admin = getSupabaseAdmin();
    const { data: perfil } = await admin
      .from("profiles")
      .select("email, plano, status_assinatura, asaas_subscription_id, asaas_installment_id, proxima_cobranca, renovacao_automatica")
      .eq("email", ctx.email)
      .maybeSingle();

    // COMPRA PARCELADA: já foi paga integralmente no cartão (as parcelas só aparecem na fatura do cartão do cliente).
    // Cancelar = parar a renovação automática e manter o acesso até o fim do período pago (proxima_cobranca).
    if (perfil?.asaas_installment_id && !perfil.asaas_subscription_id) {
      const fimDoPeriodo = perfil.proxima_cobranca ? new Date(perfil.proxima_cobranca + "T23:59:59-03:00") : new Date();
      await admin
        .from("profiles")
        .update({ renovacao_automatica: false, acesso_ate: fimDoPeriodo.toISOString() })
        .eq("email", ctx.email);
      return NextResponse.json({
        success: true,
        acesso_ate: fimDoPeriodo.toISOString(),
        message: "Renovação automática cancelada. Você mantém o acesso até o fim do período já pago.",
      });
    }

    if (!perfil?.asaas_subscription_id) {
      return NextResponse.json({ success: false, message: "Nenhuma assinatura ativa encontrada." }, { status: 404 });
    }

    // Fim do período já pago = data da última fatura paga + duração do plano
    const { data: ultimaPaga } = await admin
      .from("faturas")
      .select("data_emissao")
      .eq("user_email", ctx.email)
      .eq("status", "Pago")
      .order("data_emissao", { ascending: false })
      .limit(1)
      .maybeSingle();

    let acessoAte = new Date();
    if (ultimaPaga?.data_emissao) {
      acessoAte = new Date(ultimaPaga.data_emissao);
      acessoAte.setMonth(acessoAte.getMonth() + (MESES_POR_PLANO[String(perfil.plano || "").toLowerCase()] || 1));
    }
    if (acessoAte < new Date()) acessoAte = new Date();

    const resp = await asaasFetch(cfg, "DELETE", `/subscriptions/${perfil.asaas_subscription_id}`);
    // 404 = já removida no Asaas: segue o fluxo normalmente
    if (!resp.ok && resp.status !== 404) {
      console.error("Asaas: falha ao cancelar assinatura", resp.status, resp.data?.errors);
      return NextResponse.json({ success: false, message: "Não foi possível cancelar agora. Tente novamente em instantes." }, { status: 502 });
    }

    await admin.from("profiles").update({ acesso_ate: acessoAte.toISOString() }).eq("email", ctx.email);

    return NextResponse.json({
      success: true,
      acesso_ate: acessoAte.toISOString(),
      message: "Assinatura cancelada. Você mantém o acesso até o fim do período já pago.",
    });
  } catch (error) {
    console.error("Erro ao cancelar assinatura:", error);
    return NextResponse.json({ success: false, message: "Erro ao cancelar a assinatura." }, { status: 500 });
  }
}
