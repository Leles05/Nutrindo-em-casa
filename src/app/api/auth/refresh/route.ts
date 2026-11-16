import { NextResponse } from "next/server";
import { createAnonServerClient } from "@/lib/supabase";
import { ipDaRequisicao } from "@/lib/auth";
import { limitar } from "@/lib/rateLimit";

/** Renova a sessão (o access_token do Supabase dura ~1h) usando o refresh_token. */
export async function POST(request: Request) {
  try {
    const rl = limitar(`refresh:${ipDaRequisicao(request)}`, 60, 10 * 60 * 1000);
    if (!rl.permitido) {
      return NextResponse.json({ success: false, message: "Muitas tentativas." }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const refreshToken = String(body?.refresh_token || "").trim();
    if (!refreshToken) {
      return NextResponse.json({ success: false, message: "Sessão inválida." }, { status: 401 });
    }

    const { data, error } = await createAnonServerClient().auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data?.session) {
      return NextResponse.json({ success: false, message: "Sessão expirada. Faça login novamente." }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    });
  } catch (error) {
    console.error("Erro ao renovar sessão:", error);
    return NextResponse.json({ success: false, message: "Erro ao renovar sessão." }, { status: 500 });
  }
}
