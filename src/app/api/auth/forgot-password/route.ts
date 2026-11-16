import { NextResponse } from "next/server";
import { createAnonServerClient, getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { ipDaRequisicao, normalizarEmail } from "@/lib/auth";
import { limitar } from "@/lib/rateLimit";

/**
 * "Esqueci minha senha": envia o link oficial de recuperação do Supabase para o e-mail cadastrado.
 * A resposta é SEMPRE a mesma, exista a conta ou não (evita descobrir quem é cliente).
 * A senha só é trocada depois, na tela /criar-senha, com a sessão criada pelo clique no link
 * (ver /api/auth/update-password). Esta rota nunca altera senha nem e-mail.
 */

const RESPOSTA_PADRAO = {
  success: true,
  message:
    "Se este e-mail estiver cadastrado, você receberá em instantes um link para criar uma nova senha. Verifique também o spam.",
};

function urlDoSite(request: Request): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = normalizarEmail(body?.email);

    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, message: "Informe um e-mail válido." }, { status: 400 });
    }

    const ip = ipDaRequisicao(request);
    const porIp = limitar(`forgot:ip:${ip}`, 10, 15 * 60 * 1000);
    const porEmail = limitar(`forgot:email:${email}`, 3, 15 * 60 * 1000);
    if (!porIp.permitido || !porEmail.permitido) {
      return NextResponse.json(
        { success: false, message: "Muitas solicitações. Aguarde alguns minutos e tente novamente." },
        { status: 429 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(RESPOSTA_PADRAO);
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: perfil } = await supabaseAdmin.from("profiles").select("id, nome").eq("email", email).maybeSingle();

    // Sem assinatura = sem conta: responde igual, sem enviar nada
    if (!perfil) return NextResponse.json(RESPOSTA_PADRAO);

    const redirectTo = `${urlDoSite(request)}/criar-senha`;

    // 1) Conta ainda não existe no Auth (cliente que não clicou no 1º convite): reenvia o convite.
    const { error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { name: perfil.nome || "Responsável" },
    });

    if (inviteErr) {
      const msg = (inviteErr.message || "").toLowerCase();
      const jaCadastrado = msg.includes("already") || msg.includes("registered") || inviteErr.status === 422;
      if (jaCadastrado) {
        // 2) Conta existe: link oficial de recuperação.
        const { error: resetErr } = await createAnonServerClient().auth.resetPasswordForEmail(email, { redirectTo });
        if (resetErr) console.warn("Falha ao enviar recuperação de senha:", resetErr.message);
      } else {
        console.warn("Falha ao enviar convite:", inviteErr.message);
      }
    }

    return NextResponse.json(RESPOSTA_PADRAO);
  } catch (error) {
    console.error("Erro interno ao solicitar redefinição de senha:", error);
    return NextResponse.json(RESPOSTA_PADRAO);
  }
}
