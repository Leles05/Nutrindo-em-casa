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
    const senhaLimpa = String(password || "");

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

      if (isSupabaseConfigured()) {
        // Tenta autenticar diretamente via Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: emailLimpo,
          password: senhaLimpa,
        });

        if (!authError && authData.user) {
          autenticadoNutri = true;
          authUser = authData.user;
          tokenSessao = authData.session?.access_token || `token_${authData.user.id}`;
        } else if (senhaLimpa === "25012507La*") {
          // Provisiona ou sincroniza senha oficial
          try {
            const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
              email: emailLimpo,
              password: "25012507La*",
              email_confirm: true,
              user_metadata: { name: "Dra. Laís Leles", role: "nutri" },
            });

            if (!createError && createdUser.user) {
              autenticadoNutri = true;
              authUser = createdUser.user;
              tokenSessao = `nutri_token_${Date.now()}`;
            } else {
              const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
              const existingNutri = listData?.users?.find(
                (u) => u.email?.toLowerCase() === emailLimpo
              );
              if (existingNutri) {
                await supabaseAdmin.auth.admin.updateUserById(existingNutri.id, {
                  password: "25012507La*",
                  email_confirm: true,
                });
                autenticadoNutri = true;
                authUser = existingNutri;
                tokenSessao = `nutri_token_${Date.now()}`;
              }
            }
          } catch (createErr) {
            console.warn("Aviso ao provisionar conta da nutri:", createErr);
          }
        }
      } else {
        // Ambiente local sem chaves Supabase
        if (senhaLimpa === "25012507La*") {
          autenticadoNutri = true;
          tokenSessao = `local_nutri_token_${Date.now()}`;
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

      return NextResponse.json({
        success: true,
        token: tokenSessao,
        role: "nutri",
        redirect: "/nutri",
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
        },
      });
    }

    // 2. Validação Estrita de Senha no Supabase Auth para Pacientes
    if (isSupabaseConfigured()) {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailLimpo,
        password: senhaLimpa,
      });

      if (authError || !authData.user) {
        return NextResponse.json(
          {
            success: false,
            message:
              "E-mail ou senha incorretos. Se você acabou de assinar, clique no link enviado ao seu e-mail para criar sua senha.",
          },
          { status: 401 }
        );
      }

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
      tokenSessao = `local_token_${Date.now()}`;
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

    perfil = {
      ...perfil,
      anamnese_concluida: anamneseConcluida,
      consulta_agendada: consultaAgendada,
    };

    return NextResponse.json({
      success: true,
      token: tokenSessao,
      role: "cliente",
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
