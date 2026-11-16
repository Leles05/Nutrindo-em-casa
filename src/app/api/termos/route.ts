import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { ehResposta, exigirUsuario, ipDaRequisicao } from "@/lib/auth";
import { limitar } from "@/lib/rateLimit";
import { precisaAceitar, registrarAceite, TERMOS_DATA, TERMOS_VERSAO } from "@/lib/termos";

export const dynamic = "force-dynamic";

/** GET: situação do aceite do usuário logado. A nutricionista não precisa aceitar. */
export async function GET(request: Request) {
  const ctx = await exigirUsuario(request);
  if (ehResposta(ctx)) return ctx;

  if (ctx.role === "nutri" || !isSupabaseConfigured()) {
    return NextResponse.json({ success: true, versaoAtual: TERMOS_VERSAO, precisaAceitar: false });
  }

  const { data: perfil } = await getSupabaseAdmin()
    .from("profiles")
    .select("termos_versao, termos_aceito_em, consentimento_saude_em")
    .eq("email", ctx.email)
    .maybeSingle();

  return NextResponse.json({
    success: true,
    versaoAtual: TERMOS_VERSAO,
    dataVersao: TERMOS_DATA,
    aceitoVersao: perfil?.termos_versao || null,
    aceitoEm: perfil?.termos_aceito_em || null,
    precisaAceitar: precisaAceitar(perfil),
  });
}

/**
 * POST: registra o aceite. Exige os DOIS consentimentos marcados e a versão vigente
 * (impede aceitar um texto antigo ou "de mentira" por chamada manual sem as caixas).
 */
export async function POST(request: Request) {
  try {
    const ctx = await exigirUsuario(request);
    if (ehResposta(ctx)) return ctx;
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: false, message: "Serviço indisponível." }, { status: 503 });
    }
    if (!limitar(`aceite:${ctx.user.id}`, 10, 10 * 60 * 1000).permitido) {
      return NextResponse.json({ success: false, message: "Muitas tentativas. Aguarde." }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    if (body?.aceiteTermos !== true || body?.consentimentoSaude !== true) {
      return NextResponse.json(
        { success: false, message: "Para continuar é preciso aceitar os Termos de Uso e autorizar o tratamento dos dados de saúde." },
        { status: 400 }
      );
    }
    if (body?.versao !== TERMOS_VERSAO) {
      return NextResponse.json(
        { success: false, message: "Os termos foram atualizados. Recarregue a página para ler a versão mais recente." },
        { status: 409 }
      );
    }

    const ok = await registrarAceite(getSupabaseAdmin(), {
      email: ctx.email,
      versao: TERMOS_VERSAO,
      consentimentoSaude: true,
      renovacaoAutomatica: true,
      origem: "app",
      ip: ipDaRequisicao(request),
      userAgent: request.headers.get("user-agent"),
    });
    if (!ok) {
      return NextResponse.json({ success: false, message: "Não foi possível registrar o aceite. Tente novamente." }, { status: 500 });
    }
    return NextResponse.json({ success: true, versao: TERMOS_VERSAO });
  } catch (error) {
    console.error("Erro ao registrar aceite dos termos:", error);
    return NextResponse.json({ success: false, message: "Erro ao registrar o aceite." }, { status: 500 });
  }
}
