import { NextResponse } from "next/server";
import { createAnonServerClient, getSupabaseAdmin } from "@/lib/supabase";
import { autenticar, naoAutenticado } from "@/lib/auth";
import { limitar } from "@/lib/rateLimit";

/**
 * Define/troca a senha DO PRÓPRIO usuário autenticado. Nunca aceita e-mail do corpo da requisição.
 *
 * Dois cenários legítimos:
 *  1) Sessão criada por LINK DE E-MAIL (recuperação ou convite): o clique no link prova a posse do e-mail,
 *     então basta a nova senha. Reconhecido pelo claim `amr` do JWT, e só enquanto a sessão for recente.
 *  2) Sessão normal (login com senha): exige `senhaAtual`, verificada no Supabase Auth.
 */

const METODOS_VIA_LINK = new Set(["recovery", "invite", "otp"]);
const JANELA_LINK_SEG = 30 * 60; // o link vale para troca de senha por até 30 min

function lerAmr(token: string): { method: string; timestamp: number }[] {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    return Array.isArray(payload.amr) ? payload.amr : [];
  } catch {
    return [];
  }
}

function senhaForte(s: string): boolean {
  return s.length >= 8 && /\d/.test(s) && /[A-Za-zÀ-ú]/.test(s);
}

export async function POST(request: Request) {
  try {
    const ctx = await autenticar(request);
    if (!ctx) return naoAutenticado();

    const rl = limitar(`pwd:${ctx.user.id}`, 10, 15 * 60 * 1000);
    if (!rl.permitido) {
      return NextResponse.json({ success: false, message: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const novaSenha = String(body?.novaSenha || body?.password || "");
    const senhaAtual = String(body?.senhaAtual || "");

    if (!senhaForte(novaSenha)) {
      return NextResponse.json(
        { success: false, message: "A nova senha precisa ter pelo menos 8 caracteres, com letras e números." },
        { status: 400 }
      );
    }

    // Sessão veio de um link de e-mail recente?
    const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
    const agora = Math.floor(Date.now() / 1000);
    const viaLinkRecente = lerAmr(token).some(
      (a) => METODOS_VIA_LINK.has(a.method) && agora - Number(a.timestamp || 0) <= JANELA_LINK_SEG
    );

    if (!viaLinkRecente) {
      if (!senhaAtual) {
        return NextResponse.json(
          { success: false, message: "Informe a senha atual para definir uma nova." },
          { status: 400 }
        );
      }
      const { error: signInErr } = await createAnonServerClient().auth.signInWithPassword({
        email: ctx.email,
        password: senhaAtual,
      });
      if (signInErr) {
        // 403 (e não 401): senha atual errada não significa sessão expirada
        return NextResponse.json({ success: false, message: "A senha atual está incorreta." }, { status: 403 });
      }
    }

    const { error: updateErr } = await getSupabaseAdmin().auth.admin.updateUserById(ctx.user.id, {
      password: novaSenha,
    });
    if (updateErr) {
      console.error("Erro ao atualizar senha:", updateErr.message);
      return NextResponse.json({ success: false, message: "Não foi possível atualizar a senha." }, { status: 400 });
    }

    // Trocar a senha encerra as sessões antigas. Devolve uma sessão nova para o usuário não ser deslogado.
    let sessaoNova: { token: string; refresh_token: string } | null = null;
    if (!viaLinkRecente) {
      const { data: novaSessao } = await createAnonServerClient().auth.signInWithPassword({
        email: ctx.email,
        password: novaSenha,
      });
      if (novaSessao?.session) {
        sessaoNova = { token: novaSessao.session.access_token, refresh_token: novaSessao.session.refresh_token };
      }
    }

    return NextResponse.json({ success: true, message: "Senha atualizada com sucesso.", ...(sessaoNova || {}) });
  } catch (error) {
    console.error("Erro interno ao atualizar senha:", error);
    return NextResponse.json({ success: false, message: "Erro ao atualizar a senha." }, { status: 500 });
  }
}
