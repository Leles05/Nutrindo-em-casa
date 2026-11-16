import { NextResponse } from "next/server";
import { ehResposta, exigirNutri } from "@/lib/auth";
import { criarStateNutri, desconectarNutri, statusConexaoNutri, urlAutorizacaoNutri } from "@/lib/googleAgenda";
import { sincronizarPendentes } from "@/lib/agendaSync";

export const maxDuration = 60;

/** Estado da conexão com o Google Agenda da nutricionista. */
export async function GET(request: Request) {
  const ctx = await exigirNutri(request);
  if (ehResposta(ctx)) return ctx;
  try {
    return NextResponse.json({ success: true, ...(await statusConexaoNutri()) });
  } catch (err) {
    console.error("Erro ao ler status do Google Agenda:", err);
    return NextResponse.json({ success: false, message: "Não foi possível ler o status do Google Agenda." }, { status: 500 });
  }
}

/** { acao: "conectar" } → devolve a URL de autorização do Google | { acao: "sincronizar" } → envia as consultas pendentes. */
export async function POST(request: Request) {
  const ctx = await exigirNutri(request);
  if (ehResposta(ctx)) return ctx;
  try {
    const body = await request.json().catch(() => ({}));

    if (body?.acao === "sincronizar") {
      const r = await sincronizarPendentes();
      return NextResponse.json({ success: true, ...r });
    }

    // conectar
    const origin = new URL(request.url).origin;
    const { state, nonce } = criarStateNutri(ctx.email);
    const url = urlAutorizacaoNutri(origin, state);
    if (!url) {
      return NextResponse.json(
        { success: false, message: "O login com Google não está configurado neste ambiente (GOOGLE_CLIENT_ID/SECRET)." },
        { status: 503 }
      );
    }
    const resposta = NextResponse.json({ success: true, url });
    resposta.cookies.set("g_oauth_nonce", nonce, {
      httpOnly: true,
      secure: origin.startsWith("https:"),
      sameSite: "lax",
      path: "/api/auth/google",
      maxAge: 600,
    });
    return resposta;
  } catch (err) {
    console.error("Erro ao iniciar conexão com o Google Agenda:", err);
    return NextResponse.json({ success: false, message: "Não foi possível iniciar a conexão com o Google." }, { status: 500 });
  }
}

/** Desconecta (revoga o acesso no Google e apaga o token). */
export async function DELETE(request: Request) {
  const ctx = await exigirNutri(request);
  if (ehResposta(ctx)) return ctx;
  try {
    await desconectarNutri();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erro ao desconectar Google Agenda:", err);
    return NextResponse.json({ success: false, message: "Não foi possível desconectar." }, { status: 500 });
  }
}
