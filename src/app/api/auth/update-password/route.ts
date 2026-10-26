import { NextResponse } from "next/server";
import { supabase, getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, novaSenha, senhaAtual } = body;
    const senhaNova = novaSenha || password;

    const emailLimpo = String(email || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "")
      .trim()
      .toLowerCase();

    if (!emailLimpo || !senhaNova) {
      return NextResponse.json(
        { success: false, message: "E-mail e nova senha são obrigatórios." },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured()) {
      // Validação da senha atual antes de atualizar
      if (senhaAtual) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: emailLimpo,
          password: String(senhaAtual),
        });

        if (signInErr) {
          return NextResponse.json(
            { success: false, message: "A senha atual está incorreta." },
            { status: 401 }
          );
        }
      }

      const supabaseAdmin = getSupabaseAdmin();

      // Localiza o usuário no Supabase Auth Admin
      const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (!listError && listData?.users) {
        const targetUser = listData.users.find(
          (u) => u.email?.toLowerCase() === emailLimpo
        );

        if (targetUser) {
          const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
            targetUser.id,
            {
              password: String(senhaNova),
              email_confirm: true,
            }
          );
          if (updateErr) {
            console.warn("Aviso ao atualizar senha pelo Supabase Admin:", updateErr);
            return NextResponse.json(
              { success: false, message: updateErr.message || "Erro ao atualizar senha." },
              { status: 400 }
            );
          }
        } else {
          // Se o usuário ainda não tiver sido registrado no Auth, cria com a senha definida
          const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
            email: emailLimpo,
            password: String(senhaNova),
            email_confirm: true,
            user_metadata: { role: "cliente" },
          });
          if (createErr) {
            console.warn("Aviso ao criar usuário com senha no Supabase Admin:", createErr);
            return NextResponse.json(
              { success: false, message: createErr.message || "Erro ao definir senha." },
              { status: 400 }
            );
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Senha atualizada com segurança.",
    });
  } catch (error: unknown) {
    console.error("Erro interno ao atualizar senha:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
