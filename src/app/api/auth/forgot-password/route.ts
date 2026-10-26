import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    const emailLimpo = String(email || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "")
      .trim()
      .toLowerCase();

    if (!emailLimpo) {
      return NextResponse.json(
        { success: false, message: "Informe o e-mail cadastrado." },
        { status: 400 }
      );
    }

    const isNutri = emailLimpo === "metodonutrindoemcasa@gmail.com";
    const supabaseAdmin = getSupabaseAdmin();
    let existePerfil = false;
    let nomeUsuario = isNutri ? "Dra. Laís Leles" : "Responsável";

    if (isNutri) {
      existePerfil = true;
    } else if (isSupabaseConfigured()) {
      try {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id, nome, email")
          .eq("email", emailLimpo)
          .maybeSingle();

        if (profile) {
          existePerfil = true;
          if (profile.nome) nomeUsuario = profile.nome;
        }
      } catch (dbErr) {
        console.warn("Aviso ao consultar profiles:", dbErr);
      }
    } else {
      // Fallback para ambiente local de desenvolvimento
      existePerfil = true;
    }

    if (!existePerfil) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Não encontramos uma conta ativa com este e-mail. Verifique a digitação ou escolha um plano para assinar.",
        },
        { status: 404 }
      );
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://nutrindoemcasa.com.br";
    const redirectUrl = `${origin}/criar-senha?email=${encodeURIComponent(emailLimpo)}`;

    let existingUser: any = null;

    if (isSupabaseConfigured()) {
      try {
        const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (!listError && listData?.users) {
          existingUser = listData.users.find(
            (u: any) => u.email?.toLowerCase() === emailLimpo
          );
        }
      } catch (listErr) {
        console.warn("Aviso ao buscar usuários no Supabase Auth:", listErr);
      }

      if (!existingUser) {
        // Se ainda não existir no Auth (mas existir em profiles), convida o usuário por e-mail
        try {
          const { error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
            emailLimpo,
            {
              redirectTo: redirectUrl,
              data: {
                name: nomeUsuario,
                role: isNutri ? "nutri" : "cliente",
              },
            }
          );
          if (inviteErr) {
            console.warn("Aviso no inviteUserByEmail:", inviteErr.message);
          }
        } catch (inviteException) {
          console.warn("Erro ao disparar inviteUserByEmail:", inviteException);
        }
      } else {
        // Se já existir no Auth, dispara redefinição de senha
        try {
          const { error: resetErr } = await supabaseAdmin.auth.resetPasswordForEmail(
            emailLimpo,
            {
              redirectTo: redirectUrl,
            }
          );
          if (resetErr) {
            console.warn("Aviso no resetPasswordForEmail:", resetErr.message);
            const msgLower = (resetErr.message || "").toLowerCase();
            if (msgLower.includes("security") || msgLower.includes("rate limit") || msgLower.includes("seconds")) {
              return NextResponse.json(
                {
                  success: false,
                  message:
                    "Por motivos de segurança, você só pode solicitar uma redefinição a cada 60 segundos. Aguarde um instante ou verifique sua caixa de entrada e pasta de spam.",
                },
                { status: 429 }
              );
            }
          }
        } catch (resetException: any) {
          console.warn("Erro ao disparar resetPasswordForEmail:", resetException);
          const msg = (resetException?.message || "").toLowerCase();
          if (msg.includes("security") || msg.includes("rate limit") || msg.includes("seconds")) {
            return NextResponse.json(
              {
                success: false,
                message:
                  "Por motivos de segurança, você só pode solicitar uma redefinição a cada 60 segundos. Aguarde um instante ou verifique sua caixa de entrada e pasta de spam.",
              },
              { status: 429 }
            );
          }
        }
      }

      // Se process.env.RESEND_API_KEY estiver configurada, envia e-mail HTML personalizado
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        try {
          let linkFinal = redirectUrl;
          try {
            const linkType = existingUser ? "recovery" : "invite";
            const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
              type: linkType,
              email: emailLimpo,
              options: {
                redirectTo: redirectUrl,
              },
            });
            if (!linkErr && linkData?.properties?.action_link) {
              linkFinal = linkData.properties.action_link;
            }
          } catch (genErr) {
            console.warn("Aviso ao gerar action_link:", genErr);
          }

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: process.env.RESEND_FROM_EMAIL || "Nutrindo em Casa <contato@nutrindoemcasa.com.br>",
              to: [emailLimpo],
              subject: "Redefinição de Senha • Nutrindo em Casa",
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F0EAE1; padding: 40px 20px;">
                  <div style="max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #E2E8F0;">
                    <div style="background-color: #4C6C54; padding: 32px 24px; text-align: center;">
                      <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 800; margin: 0;">Nutrindo em Casa</h1>
                      <p style="color: #E2E8F0; font-size: 13px; margin-top: 6px;">Alimentação Infantil Sem Batalhas • Dra. Laís Leles (CRN-8 18878)</p>
                    </div>
                    <div style="padding: 32px 28px;">
                      <p style="font-size: 16px; color: #2D3748; margin-top: 0;">Olá, <strong>${nomeUsuario}</strong>!</p>
                      <p style="font-size: 14px; line-height: 1.6; color: #4A5568;">
                        Recebemos uma solicitação para redefinir a sua senha de acesso à plataforma <strong>Nutrindo em Casa</strong>.
                      </p>
                      <p style="font-size: 14px; line-height: 1.6; color: #4A5568;">
                        Para criar sua nova senha com segurança, clique no botão abaixo:
                      </p>
                      <div style="text-align: center; margin: 32px 0;">
                        <a href="${linkFinal}" style="background-color: #4C6C54; color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 28px; border-radius: 12px; display: inline-block;">
                          Redefinir Minha Senha →
                        </a>
                      </div>
                      <p style="font-size: 12px; color: #718096; line-height: 1.5; margin-bottom: 0;">
                        Se você não solicitou a redefinição de senha, desconsidere esta mensagem. Sua conta permanece segura.<br/><br/>
                        Caso o botão não abra, copie e cole o link a seguir no seu navegador:<br/>
                        <span style="color: #4C6C54; word-break: break-all;">${linkFinal}</span>
                      </p>
                    </div>
                  </div>
                </div>
              `,
            }),
          });
        } catch (resendException) {
          console.warn("Aviso no disparo via Resend:", resendException);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Instruções para redefinir sua senha foram enviadas com sucesso para o seu e-mail.",
    });
  } catch (error: unknown) {
    console.error("Erro interno ao solicitar redefinição de senha:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Erro desconhecido ao processar solicitação.",
      },
      { status: 500 }
    );
  }
}
