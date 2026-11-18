import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { cpfEhValido, ehResposta, exigirUsuario, resolverEmailAlvo } from "@/lib/auth";
import { statusEfetivo } from "@/lib/assinatura";

export async function GET(request: Request) {
  try {
    const ctx = await exigirUsuario(request);
    if (ehResposta(ctx)) return ctx;
    const { searchParams } = new URL(request.url);
    const email = resolverEmailAlvo(ctx, searchParams.get("email"));
    if (ehResposta(email)) return email;

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

    // 3. Resolve status de onboarding e preferência de tour diretamente da fonte da verdade
    const alvoEhNutri = email === ctx.email && ctx.role === "nutri";
    let anamneseConcluida = alvoEhNutri;
    let consultaAgendada = alvoEhNutri;
    let tourOculto = false;

    let avatarUrl: string | null = (profile as any)?.avatar_url || null;

    try {
      const { data: anamneseRow } = await supabaseAdmin
        .from("anamneses")
        .select("concluida, respostas")
        .eq("user_email", email)
        .maybeSingle();

      if (anamneseRow) {
        if (anamneseRow.concluida) {
          anamneseConcluida = true;
        }
        if (anamneseRow.respostas?._tour_oculto === true) {
          tourOculto = true;
        }
        if (anamneseRow.respostas?._foto_perfil) {
          avatarUrl = anamneseRow.respostas._foto_perfil;
        }
        const aulasConcluidas = anamneseRow.respostas?.aulas_concluidas || [];
        if (profile) {
          (profile as any).aulas_concluidas = aulasConcluidas;
        }
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

    // Se ainda não encontrou tour_oculto ou avatar_url, verifica no user_metadata do Supabase Auth
    if ((!tourOculto || !avatarUrl) && isSupabaseConfigured()) {
      try {
        const authUser = email === ctx.email ? ctx.user : null;
        if (authUser?.user_metadata?.tour_oculto === true) {
          tourOculto = true;
        }
        if (!avatarUrl && authUser?.user_metadata?.avatar_url) {
          avatarUrl = authUser.user_metadata.avatar_url;
        }
      } catch (authErr) {
        console.warn("Aviso ao buscar metadata do auth:", authErr);
      }
    }

    const profileComFlags = profile
      ? {
          ...profile,
          status_assinatura: statusEfetivo(profile),
          avatar_url: avatarUrl,
          anamnese_concluida: anamneseConcluida,
          consulta_agendada: consultaAgendada,
          tour_oculto: tourOculto,
        }
      : null;

    // O cartão nunca é guardado por nós (o provedor de pagamento cuida disso)
    const cartao: { ultimos4: string | null; bandeira: string | null } | null = null;

    return NextResponse.json({
      success: true,
      cartao,
      tour_oculto: tourOculto,
      avatar_url: avatarUrl,
      profile: profileComFlags,
      faturas: faturas || [],
      aulas_concluidas: (profile as any)?.aulas_concluidas || [],
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
    const ctx = await exigirUsuario(request);
    if (ehResposta(ctx)) return ctx;
    const body = await request.json();
    const {
      email,
      nome,
      telefone,
      cpf,
      nome_crianca,
      crianca_nome,
      idade_crianca,
      alimentos_conforto,
      principais_recusas,
      notificacoes_email,
      aulas_concluidas,
      tour_oculto,
      avatar_url,
    } = body;

    const alvo = resolverEmailAlvo(ctx, email);
    if (ehResposta(alvo)) return alvo;
    const emailLimpo = alvo;

    const supabaseAdmin = getSupabaseAdmin();
    const finalNomeCrianca = nome_crianca !== undefined ? nome_crianca : crianca_nome;

    // 1. Atualiza dados no perfil (whitelist de campos seguros - nunca sobrescreve com vazio)
    const updatePayload: Record<string, unknown> = {};
    if (nome !== undefined && nome !== null && String(nome).trim() !== "") updatePayload.nome = String(nome).trim();
    if (telefone !== undefined && telefone !== null && String(telefone).trim() !== "") updatePayload.telefone = String(telefone).trim();
    if (cpf !== undefined && cpf !== null && String(cpf).trim() !== "") {
      const cpfDigitos = String(cpf).replace(/\D/g, "");
      if (!cpfEhValido(cpfDigitos)) {
        return NextResponse.json({ success: false, message: "CPF inválido." }, { status: 400 });
      }
      // CPF é usado para login: não pode pertencer a outra conta
      const { data: outro } = await supabaseAdmin.from("profiles").select("email").eq("cpf", cpfDigitos).neq("email", emailLimpo).limit(1);
      if (outro && outro.length > 0) {
        return NextResponse.json({ success: false, message: "Este CPF já está vinculado a outra conta." }, { status: 409 });
      }
      updatePayload.cpf = cpfDigitos;
    }
    if (finalNomeCrianca !== undefined && finalNomeCrianca !== null && String(finalNomeCrianca).trim() !== "") {
      updatePayload.nome_crianca = String(finalNomeCrianca).trim();
    }
    if (idade_crianca !== undefined && idade_crianca !== null && String(idade_crianca).trim() !== "") {
      updatePayload.idade_crianca = String(idade_crianca).trim();
    }
    if (alimentos_conforto !== undefined && alimentos_conforto !== null) updatePayload.alimentos_conforto = alimentos_conforto;
    if (principais_recusas !== undefined && principais_recusas !== null) updatePayload.principais_recusas = principais_recusas;
    if (notificacoes_email !== undefined) updatePayload.notificacoes_email = Boolean(notificacoes_email);

    // Persistência das aulas concluídas no JSONB de anamneses
    if (aulas_concluidas !== undefined) {
      try {
        const { data: anamneseAtual } = await supabaseAdmin
          .from("anamneses")
          .select("respostas")
          .eq("user_email", emailLimpo)
          .maybeSingle();

        const respostasAtualizadas = {
          ...(anamneseAtual?.respostas || {}),
          aulas_concluidas: Array.isArray(aulas_concluidas) ? aulas_concluidas : [],
        };

        await supabaseAdmin.from("anamneses").upsert(
          {
            user_email: emailLimpo,
            respostas: respostasAtualizadas,
          },
          { onConflict: "user_email" }
        );
      } catch (errAulas) {
        console.warn("Aviso ao salvar aulas_concluidas em anamneses:", errAulas);
      }
    }

    // Persistência da preferência do tour_oculto no Banco (anamneses + Supabase Auth user_metadata)
    if (tour_oculto !== undefined) {
      try {
        const { data: anamneseAtual } = await supabaseAdmin
          .from("anamneses")
          .select("concluida, respostas")
          .eq("user_email", emailLimpo)
          .maybeSingle();

        const respostasAtualizadas = {
          ...(anamneseAtual?.respostas || {}),
          _tour_oculto: Boolean(tour_oculto),
        };

        if (anamneseAtual) {
          await supabaseAdmin
            .from("anamneses")
            .update({
              respostas: respostasAtualizadas,
            })
            .eq("user_email", emailLimpo);
        } else {
          await supabaseAdmin.from("anamneses").insert({
            user_email: emailLimpo,
            concluida: false,
            respostas: respostasAtualizadas,
          });
        }
      } catch (errTour) {
        console.warn("Aviso ao salvar tour_oculto em anamneses:", errTour);
      }

      if (isSupabaseConfigured()) {
        try {
          const authUser = emailLimpo === ctx.email ? ctx.user : null;
          if (authUser) {
            await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
              user_metadata: {
                ...(authUser.user_metadata || {}),
                tour_oculto: Boolean(tour_oculto),
              },
            });
          }
        } catch (authMetaErr) {
          console.warn("Aviso ao atualizar tour_oculto no user_metadata do Auth:", authMetaErr);
        }
      }
    }

    // Persistência da foto de perfil (anamneses respostas + Supabase Auth user_metadata)
    if (avatar_url !== undefined) {
      try {
        const { data: anamneseAtual } = await supabaseAdmin
          .from("anamneses")
          .select("concluida, respostas")
          .eq("user_email", emailLimpo)
          .maybeSingle();

        const respostasAtualizadas = {
          ...(anamneseAtual?.respostas || {}),
          _foto_perfil: avatar_url,
        };

        if (anamneseAtual) {
          await supabaseAdmin
            .from("anamneses")
            .update({ respostas: respostasAtualizadas })
            .eq("user_email", emailLimpo);
        } else {
          await supabaseAdmin.from("anamneses").insert({
            user_email: emailLimpo,
            concluida: false,
            respostas: respostasAtualizadas,
          });
        }
      } catch (errFoto) {
        console.warn("Aviso ao salvar foto de perfil em anamneses:", errFoto);
      }

      if (isSupabaseConfigured()) {
        try {
          const authUser = emailLimpo === ctx.email ? ctx.user : null;
          if (authUser) {
            await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
              user_metadata: {
                ...(authUser.user_metadata || {}),
                avatar_url: avatar_url,
              },
            });
          }
        } catch (authMetaErr) {
          console.warn("Aviso ao atualizar avatar_url no user_metadata do Auth:", authMetaErr);
        }
      }
    }

    let profileAtualizado = null;

    if (Object.keys(updatePayload).length > 0) {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .update(updatePayload)
        .eq("email", emailLimpo)
        .select()
        .maybeSingle();

      if (error) {
        console.warn("Aviso ao atualizar profile no Supabase:", error);
      } else {
        profileAtualizado = data;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Configurações atualizadas com sucesso.",
      tour_oculto: tour_oculto !== undefined ? Boolean(tour_oculto) : undefined,
      profile: profileAtualizado,
    });
  } catch (error: unknown) {
    console.error("Erro interno ao atualizar configurações:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao salvar alterações." },
      { status: 500 }
    );
  }
}

export const PATCH = PUT;
