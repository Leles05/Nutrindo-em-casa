import { NextResponse } from "next/server";
import { createAnonServerClient, getSupabaseAdmin } from "@/lib/supabase";
import { ipDaRequisicao } from "@/lib/auth";
import { limitar } from "@/lib/rateLimit";
import { lerTokenCompra } from "@/lib/tokenCompra";

/**
 * Cria a senha logo após a compra, na própria tela de pagamento.
 *
 * Só funciona se TUDO isto for verdade:
 *  - a chave de acesso foi emitida pelo checkout (assinada) e ainda está dentro da validade;
 *  - o pagamento dessa chave está confirmado (fatura "Pago") e é do mesmo e-mail;
 *  - a conta ainda nunca fez login (depois disso, só entrando com a senha ou pelo "esqueci minha senha").
 */

function senhaForte(s: string): boolean {
  return s.length >= 8 && /\d/.test(s) && /[A-Za-zÀ-ú]/.test(s);
}

const erro = (message: string, status: number) => NextResponse.json({ success: false, message }, { status });

export async function POST(request: Request) {
  try {
    const rl = limitar(`senhacompra:${ipDaRequisicao(request)}`, 10, 15 * 60 * 1000);
    if (!rl.permitido) return erro("Muitas tentativas. Aguarde alguns minutos.", 429);

    const body = await request.json().catch(() => ({}));
    const senha = String(body?.senha || "");
    const chave = lerTokenCompra(body?.token);
    if (!chave) return erro("Esta tela expirou. Use o link que enviamos ao seu e-mail para criar a senha.", 401);
    if (!senhaForte(senha)) return erro("A senha precisa ter pelo menos 8 caracteres, com letras e números.", 400);

    const admin = getSupabaseAdmin();

    // pagamento confirmado e do mesmo e-mail
    const { data: fatura } = await admin
      .from("faturas")
      .select("status, user_email")
      .eq("gateway_pagamento_id", chave.paymentId)
      .maybeSingle();
    if (!fatura || fatura.user_email !== chave.email) return erro("Pagamento não encontrado.", 404);
    if (fatura.status !== "Pago") return erro("O pagamento ainda não foi confirmado. Aguarde alguns instantes.", 409);

    const { data: perfil } = await admin.from("profiles").select("email").eq("email", chave.email).maybeSingle();
    if (!perfil) return erro("Conta não encontrada.", 404);

    // localiza a conta de login (criada pelo convite) sem enviar e-mail nenhum
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "recovery", email: chave.email });
    let userId = link?.user?.id || "";
    let jaEntrou = Boolean(link?.user?.last_sign_in_at);

    if (linkErr || !userId) {
      // convite ainda não criou a conta de login: cria agora, já com a senha
      const { data: criado, error: criarErr } = await admin.auth.admin.createUser({
        email: chave.email,
        password: senha,
        email_confirm: true,
      });
      if (criarErr || !criado?.user) {
        console.error("Falha ao criar conta de login na compra:", criarErr?.message);
        return erro("Não foi possível criar a senha agora. Use o link enviado ao seu e-mail.", 500);
      }
      userId = criado.user.id;
      jaEntrou = false;
    } else {
      if (jaEntrou) return erro("Você já tem acesso. Faça login, ou use “Esqueci minha senha”.", 409);
      const { error: updErr } = await admin.auth.admin.updateUserById(userId, { password: senha, email_confirm: true });
      if (updErr) {
        console.error("Falha ao definir senha na compra:", updErr.message);
        return erro("Não foi possível criar a senha agora. Use o link enviado ao seu e-mail.", 500);
      }
    }

    // primeiro login feito aqui mesmo: marca a conta como "já entrou" e impede reaproveitar a chave
    const { error: loginErr } = await createAnonServerClient().auth.signInWithPassword({ email: chave.email, password: senha });
    if (loginErr) console.error("Senha criada, mas o login automático falhou:", loginErr.message);

    return NextResponse.json({ success: true, email: chave.email });
  } catch (err) {
    console.error("Erro interno ao criar senha da compra:", err);
    return erro("Erro ao criar a senha. Use o link enviado ao seu e-mail.", 500);
  }
}
