import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { autenticar } from "@/lib/auth";

/**
 * Encerra a sessão NO SERVIDOR: depois disso o access token e o refresh token deste login deixam de valer
 * (limpar o navegador sozinho não invalida nada). Só afeta esta sessão; outros aparelhos continuam logados.
 */
export async function POST(request: Request) {
  const ctx = await autenticar(request);
  // sem sessão válida não há o que encerrar: responde ok para a tela seguir o logout normalmente
  if (!ctx) return NextResponse.json({ success: true, jaEncerrada: true });

  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  try {
    const { error } = await getSupabaseAdmin().auth.admin.signOut(token, "local");
    if (error) {
      console.error("Falha ao encerrar sessão no servidor:", error.message);
      return NextResponse.json({ success: false, message: "Não foi possível encerrar a sessão no servidor." }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erro ao encerrar sessão:", err);
    return NextResponse.json({ success: false, message: "Erro ao encerrar a sessão." }, { status: 500 });
  }
}
