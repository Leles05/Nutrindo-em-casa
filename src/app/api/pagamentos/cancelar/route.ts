import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { ehResposta, exigirUsuario } from "@/lib/auth";
import { limitar } from "@/lib/rateLimit";
import { MESES_DO_PLANO, ehPlano } from "@/lib/planos";
import { configMP } from "@/lib/mercadopago";
import { cancelarAssinaturaMP, cancelarPedidoMP } from "@/lib/mpPedidos";

/**
 * Cancela a PRÓPRIA renovação: o acesso continua até o fim do período já pago (acesso_ate),
 * como informado ao cliente na tela de Configurações.
 */
export async function POST(request: Request) {
  try {
    const ctx = await exigirUsuario(request);
    if (ehResposta(ctx)) return ctx;
    if (!limitar(`cancel:${ctx.user.id}`, 5, 15 * 60 * 1000).permitido) {
      return NextResponse.json({ success: false, message: "Muitas tentativas. Aguarde." }, { status: 429 });
    }
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: false, message: "Serviço indisponível. Tente novamente em instantes." }, { status: 503 });
    }

    const admin = getSupabaseAdmin();
    const { data: perfil } = await admin
      .from("profiles")
      .select("email, plano, status_assinatura, proxima_cobranca, gateway_assinatura_id")
      .eq("email", ctx.email)
      .maybeSingle();

    if (!perfil || String(perfil.status_assinatura).toUpperCase() !== "ATIVO") {
      return NextResponse.json({ success: false, message: "Nenhuma assinatura ativa encontrada." }, { status: 404 });
    }

    // Cobrança automática no Mercado Pago: cancela LÁ primeiro. Se não conseguir, nada muda aqui
    // (senão o cliente acharia que cancelou e continuaria sendo cobrado).
    const cfg = configMP();
    if (perfil.gateway_assinatura_id) {
      if (!cfg) {
        return NextResponse.json({ success: false, message: "Serviço de pagamento indisponível. Tente novamente em instantes." }, { status: 503 });
      }
      const ok = await cancelarAssinaturaMP(cfg, perfil.gateway_assinatura_id);
      if (!ok) {
        return NextResponse.json(
          { success: false, message: "Não foi possível cancelar agora. Tente novamente em instantes ou escreva para contato@nutrindoemcasa.com.br." },
          { status: 502 }
        );
      }
    }

    // Link de renovação por Pix já enviado e ainda não pago: cancela para não ficar cobrança em aberto
    if (cfg) {
      const { data: abertas } = await admin
        .from("faturas")
        .select("id, gateway_pagamento_id")
        .eq("user_email", ctx.email)
        .eq("status", "Pendente")
        .like("descricao", "Renovação%");
      for (const f of abertas || []) {
        if (f.gateway_pagamento_id && (await cancelarPedidoMP(cfg, f.gateway_pagamento_id))) {
          await admin.from("faturas").update({ status: "Cancelado" }).eq("id", f.id);
        }
      }
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
    const plano = String(perfil.plano || "").toLowerCase();
    if (ultimaPaga?.data_emissao && ehPlano(plano)) {
      acessoAte = new Date(ultimaPaga.data_emissao);
      acessoAte.setMonth(acessoAte.getMonth() + MESES_DO_PLANO[plano]);
    } else if (perfil.proxima_cobranca) {
      acessoAte = new Date(perfil.proxima_cobranca + "T23:59:59-03:00");
    }
    if (acessoAte < new Date()) acessoAte = new Date();

    await admin
      .from("profiles")
      .update({ renovacao_automatica: false, acesso_ate: acessoAte.toISOString() })
      .eq("email", ctx.email);

    return NextResponse.json({
      success: true,
      acesso_ate: acessoAte.toISOString(),
      message: "Renovação cancelada. Você mantém o acesso até o fim do período já pago.",
    });
  } catch (error) {
    console.error("Erro ao cancelar renovação:", error);
    return NextResponse.json({ success: false, message: "Erro ao cancelar a renovação." }, { status: 500 });
  }
}
