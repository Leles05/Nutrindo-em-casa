import { NextResponse } from "next/server";
import { supabase, getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const emailLimpo = String(email || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "")
      .trim()
      .toLowerCase();
    const senhaLimpa = String(password || "").trim();

    if (!emailLimpo || !senhaLimpa) {
      return NextResponse.json(
        {
          success: false,
          message:
            "E-mail ou senha incorretos. Se você acabou de assinar, clique no link enviado ao seu e-mail para criar sua senha.",
        },
        { status: 401 }
      );
    }

    const isNutri =
      emailLimpo === "metodonutrindoemcasa@gmail.com";

    const supabaseAdmin = getSupabaseAdmin();
    let perfil = null;
    let authUser = null;
    let tokenSessao = "";

    // 1. Tratamento Especial para Nutricionista Oficial (Dra. Laís Leles)
    if (isNutri) {
      let autenticadoNutri = false;

      // Para a nutricionista oficial, a senha aceita é estritamente "25012507La*"
      if (senhaLimpa === "25012507La*") {
        autenticadoNutri = true;

        if (isSupabaseConfigured()) {
          try {
            // Sincroniza/atualiza imediatamente a senha no Supabase Auth com updateUserById
            const { data: listData } = await supabaseAdmin.auth.admin.listUsers({
              page: 1,
              perPage: 1000,
            });
            const existingNutri = listData?.users?.find(
              (u) => u.email?.toLowerCase() === emailLimpo
            );

            if (existingNutri) {
              await supabaseAdmin.auth.admin.updateUserById(existingNutri.id, {
                password: "25012507La*",
                email_confirm: true,
              });
              authUser = existingNutri;
              tokenSessao = `nutri_token_${existingNutri.id}`;
            } else {
              const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: emailLimpo,
                password: "25012507La*",
                email_confirm: true,
                user_metadata: { name: "Dra. Laís Leles", role: "nutri" },
              });

              if (!createError && createdUser?.user) {
                authUser = createdUser.user;
                tokenSessao = `nutri_token_${createdUser.user.id}`;
              }
            }

            // Tenta obter sessão real do Supabase
            try {
              const { data: retryAuth } = await supabase.auth.signInWithPassword({
                email: emailLimpo,
                password: "25012507La*",
              });
              if (retryAuth?.user) {
                authUser = retryAuth.user;
                if (retryAuth.session?.access_token) {
                  tokenSessao = retryAuth.session.access_token;
                }
              }
            } catch {}
          } catch (syncErr) {
            console.warn("Aviso ao sincronizar conta da nutri:", syncErr);
          }
        }

        if (!tokenSessao) {
          tokenSessao = `nutri_token_${Date.now()}`;
        }
      } else if (isSupabaseConfigured()) {
        // Fallback caso a nutricionista tenha redefinido a senha pelo Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: emailLimpo,
          password: senhaLimpa,
        });

        if (!authError && authData.user) {
          autenticadoNutri = true;
          authUser = authData.user;
          tokenSessao = authData.session?.access_token || `token_${authData.user.id}`;
        }
      }

      if (!autenticadoNutri) {
        return NextResponse.json(
          {
            success: false,
            message: "Senha de acesso profissional incorreta. Verifique suas credenciais de nutricionista.",
          },
          { status: 401 }
        );
      }

      // Upsert perfil da Nutricionista
      try {
        await supabaseAdmin.from("profiles").upsert(
          {
            email: emailLimpo,
            nome: "Dra. Laís Leles",
            plano: "nutri",
            status_assinatura: "ATIVO",
          },
          { onConflict: "email" }
        );
      } catch (upsertErr) {
        console.warn("Aviso ao salvar perfil da nutri:", upsertErr);
      }

      let tourOcultoNutri = false;
      if (authUser?.user_metadata?.tour_oculto === true) {
        tourOcultoNutri = true;
      } else if (isSupabaseConfigured()) {
        try {
          const { data: anamneseRow } = await supabaseAdmin
            .from("anamneses")
            .select("respostas")
            .eq("user_email", emailLimpo)
            .maybeSingle();
          if (anamneseRow?.respostas?._tour_oculto === true) {
            tourOcultoNutri = true;
          }
        } catch {}
      }

      return NextResponse.json({
        success: true,
        token: tokenSessao,
        role: "nutri",
        redirect: "/nutri",
        tour_oculto: tourOcultoNutri,
        user: {
          id: authUser?.id || "nutri-lais",
          email: emailLimpo,
          nome: "Dra. Laís Leles",
          role: "nutri",
          status_assinatura: "ATIVO",
        },
        profile: {
          nome: "Dra. Laís Leles",
          email: emailLimpo,
          anamnese_concluida: true,
          consulta_agendada: true,
          status_assinatura: "ATIVO",
          tour_oculto: tourOcultoNutri,
        },
      });
    }

    // 2. Validação para Pacientes
    let autenticadoCliente = false;

    // Se for a conta avançada do Lucas com a senha oficial 12345678a
    const isLucas = emailLimpo === "lucaslimaleles@gmail.com" || emailLimpo === "lucas@email.com";
    if (isLucas && senhaLimpa === "12345678a") {
      autenticadoCliente = true;

      if (isSupabaseConfigured()) {
        try {
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
          const existingLucas = listData?.users?.find((u) => u.email?.toLowerCase() === emailLimpo);
          if (existingLucas) {
            await supabaseAdmin.auth.admin.updateUserById(existingLucas.id, {
              password: "12345678a",
              email_confirm: true,
            });
            authUser = existingLucas;
            tokenSessao = `cliente_token_${existingLucas.id}`;
          } else {
            const { data: createdLucas } = await supabaseAdmin.auth.admin.createUser({
              email: emailLimpo,
              password: "12345678a",
              email_confirm: true,
              user_metadata: { name: "Lucas Lima Leles", role: "cliente" },
            });
            if (createdLucas?.user) {
              authUser = createdLucas.user;
              tokenSessao = `cliente_token_${createdLucas.user.id}`;
            }
          }

          // Tenta obter sessão real do Supabase
          try {
            const { data: retryAuth } = await supabase.auth.signInWithPassword({
              email: emailLimpo,
              password: "12345678a",
            });
            if (retryAuth?.user) {
              authUser = retryAuth.user;
              if (retryAuth.session?.access_token) {
                tokenSessao = retryAuth.session.access_token;
              }
            }
          } catch {}
        } catch (syncErr) {
          console.warn("Aviso ao sincronizar conta do Lucas:", syncErr);
        }
      }

      if (!tokenSessao) {
        tokenSessao = `cliente_token_${Date.now()}`;
      }
    } else if (isSupabaseConfigured()) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailLimpo,
        password: senhaLimpa,
      });

      if (authError || !authData?.user) {
        return NextResponse.json(
          {
            success: false,
            message:
              "E-mail ou senha incorretos. Se você acabou de assinar, clique no link enviado ao seu e-mail para criar sua senha.",
          },
          { status: 401 }
        );
      }

      autenticadoCliente = true;
      authUser = authData.user;
      tokenSessao = authData.session?.access_token || `token_${authData.user.id}`;
    } else {
      if (senhaLimpa.length < 6) {
        return NextResponse.json(
          {
            success: false,
            message:
              "E-mail ou senha incorretos. Se você acabou de assinar, clique no link enviado ao seu e-mail para criar sua senha.",
          },
          { status: 401 }
        );
      }
      autenticadoCliente = true;
      tokenSessao = `local_token_${Date.now()}`;
    }

    if (!autenticadoCliente) {
      return NextResponse.json(
        {
          success: false,
          message:
            "E-mail ou senha incorretos. Se você acabou de assinar, clique no link enviado ao seu e-mail para criar sua senha.",
        },
        { status: 401 }
      );
    }

    // 3. Busca o perfil correspondente na tabela profiles (BLOQUEIA quem não tem registro)
    try {
      const { data: profileData } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("email", emailLimpo)
        .maybeSingle();

      if (profileData) {
        perfil = profileData;
      }
    } catch (dbErr) {
      console.warn("Aviso ao buscar perfil na tabela profiles:", dbErr);
    }

    if (!perfil) {
      // Faz logout preventivo no Supabase Auth
      try {
        await supabase.auth.signOut();
      } catch {}

      return NextResponse.json(
        {
          success: false,
          erro: "sem_assinatura",
          message:
            "Não encontramos uma assinatura vinculada a este e-mail. Escolha um plano para criar seu acesso.",
        },
        { status: 403 }
      );
    }

    // 4. Verificação real de onboarding via tabelas anamneses e agendamentos
    let anamneseConcluida = false;
    let consultaAgendada = false;

    if (isSupabaseConfigured()) {
      try {
        const { data: anamneseRow } = await supabaseAdmin
          .from("anamneses")
          .select("concluida")
          .eq("user_email", emailLimpo)
          .maybeSingle();

        if (anamneseRow && anamneseRow.concluida) {
          anamneseConcluida = true;
        }

        const { data: agendamentoRows } = await supabaseAdmin
          .from("agendamentos")
          .select("id")
          .eq("user_email", emailLimpo)
          .eq("tipo", "consulta")
          .limit(1);

        if (agendamentoRows && agendamentoRows.length > 0) {
          consultaAgendada = true;
        }
      } catch (checkErr) {
        console.warn("Aviso ao checar tabelas de anamnese e agendamento:", checkErr);
      }
    }

    let tourOcultoCliente = false;
    if (authUser?.user_metadata?.tour_oculto === true) {
      tourOcultoCliente = true;
    }
    if (!tourOcultoCliente && isSupabaseConfigured()) {
      try {
        const { data: anamneseRow } = await supabaseAdmin
          .from("anamneses")
          .select("respostas")
          .eq("user_email", emailLimpo)
          .maybeSingle();
        if (anamneseRow?.respostas?._tour_oculto === true) {
          tourOcultoCliente = true;
        }
      } catch {}
    }

    perfil = {
      ...perfil,
      anamnese_concluida: anamneseConcluida,
      consulta_agendada: consultaAgendada,
      tour_oculto: tourOcultoCliente,
    };

    return NextResponse.json({
      success: true,
      token: tokenSessao,
      role: "cliente",
      tour_oculto: tourOcultoCliente,
      user: {
        id: authUser?.id || perfil.id,
        email: perfil.email,
        nome: perfil.nome,
        plano: perfil.plano,
        status_assinatura: perfil.status_assinatura,
        role: "cliente",
      },
      profile: perfil,
    });
  } catch (error: unknown) {
    console.error("Erro interno na rota de login:", error);
    const erroMensagem = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { success: false, message: erroMensagem },
      { status: 500 }
    );
  }
}
