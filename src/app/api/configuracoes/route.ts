import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "E-mail não fornecido." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Busca perfil do usuário
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();

    if (profileErr && profileErr.code !== "PGRST116") {
      console.warn("Aviso ao buscar profile:", profileErr);
    }

    // 2. Busca histórico de faturas
    const { data: faturas, error: faturasErr } = await supabaseAdmin
      .from("faturas")
      .select("*")
      .eq("user_email", email)
      .order("data_emissao", { ascending: false });

    if (faturasErr) {
      console.warn("Aviso ao buscar faturas:", faturasErr);
    }

    // 3. Resolve status de onboarding (anamnese_concluida e consulta_agendada) diretamente da fonte da verdade
    let anamneseConcluida = email === "metodonutrindoemcasa@gmail.com";
    let consultaAgendada = email === "metodonutrindoemcasa@gmail.com";

    if (profile && !anamneseConcluida) {
      try {
        const { data: anamneseRow } = await supabaseAdmin
          .from("anamneses")
          .select("concluida")
          .eq("user_email", email)
          .maybeSingle();

        if (anamneseRow && anamneseRow.concluida) {
          anamneseConcluida = true;
        }

        const { data: agendamentoRows } = await supabaseAdmin
          .from("agendamentos")
          .select("id")
          .eq("user_email", email)
          .eq("tipo", "consulta")
          .limit(1);

        if (agendamentoRows && agendamentoRows.length > 0) {
          consultaAgendada = true;
        }
      } catch (flagErr) {
        console.warn("Aviso ao resolver flags no perfil:", flagErr);
      }
    }

    const profileComFlags = profile
      ? {
          ...profile,
          anamnese_concluida: anamneseConcluida,
          consulta_agendada: consultaAgendada,
        }
      : null;

    return NextResponse.json({
      success: true,
      profile: profileComFlags,
      faturas: faturas || [],
    });
  } catch (error: unknown) {
    console.error("Erro interno ao buscar configurações:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao carregar configurações." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      nome,
      telefone,
      cpf,
      nome_crianca,
      idade_crianca,
      alimentos_conforto,
      principais_recusas,
      notificacoes_email,
      novaSenha,
    } = body;

    const emailLimpo = String(email || "").toLowerCase().trim();

    if (!emailLimpo) {
      return NextResponse.json(
        { success: false, message: "E-mail é obrigatório para atualizar configurações." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Atualiza dados no perfil (whitelist de campos seguros)
    const updatePayload: Record<string, unknown> = {};
    if (nome !== undefined) updatePayload.nome = nome;
    if (telefone !== undefined) updatePayload.telefone = telefone;
    if (cpf !== undefined) updatePayload.cpf = cpf;
    if (nome_crianca !== undefined) updatePayload.nome_crianca = nome_crianca;
    if (idade_crianca !== undefined) updatePayload.idade_crianca = idade_crianca;
    if (alimentos_conforto !== undefined) updatePayload.alimentos_conforto = alimentos_conforto;
    if (principais_recusas !== undefined) updatePayload.principais_recusas = principais_recusas;
    if (notificacoes_email !== undefined) updatePayload.notificacoes_email = Boolean(notificacoes_email);

    let profileAtualizado = null;

    if (Object.keys(updatePayload).length > 0) {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            email: emailLimpo,
            ...updatePayload,
          },
          { onConflict: "email" }
        )
        .select()
        .single();

      if (error) {
        console.warn("Aviso ao atualizar profile no Supabase:", error);
      } else {
        profileAtualizado = data;
      }
    }

    // 2. Se nova senha foi informada, atualiza no Supabase Auth caso configurado
    let senhaAtualizada = false;
    if (novaSenha && isSupabaseConfigured()) {
      try {
        // Localiza usuário por e-mail no Auth Admin
        const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();
        const authUser = usersList?.users?.find((u) => u.email?.toLowerCase() === emailLimpo);

        if (authUser) {
          const { error: pwdErr } = await supabaseAdmin.auth.admin.updateUserById(
            authUser.id,
            { password: String(novaSenha) }
          );
          if (!pwdErr) {
            senhaAtualizada = true;
          }
        }
      } catch (authPwdErr) {
        console.warn("Aviso ao atualizar senha no Supabase Auth:", authPwdErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Configurações atualizadas com sucesso.",
      profile: profileAtualizado,
      senhaAtualizada,
    });
  } catch (error: unknown) {
    console.error("Erro interno ao atualizar configurações:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao salvar alterações." },
      { status: 500 }
    );
  }
}
