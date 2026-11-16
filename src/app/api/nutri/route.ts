import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { acessoNegado, ehResposta, exigirUsuario, resolverEmailAlvo } from "@/lib/auth";
import { lerMateriaisAulas, soRespostasRapidas } from "@/lib/cursosDb";
import { extrairAnexo, serializarComAnexo } from "@/app/api/chat/route";
import { atualizarEvento, garantirMeetNoEvento } from "@/lib/googleAgenda";
import { sincronizarConsultaComGoogle } from "@/lib/agendaSync";

export async function GET(request: Request) {
  try {
    const ctx = await exigirUsuario(request);
    if (ehResposta(ctx)) return ctx;
    const { searchParams } = new URL(request.url);
    const userEmailParam = searchParams.get("user_email")?.trim().toLowerCase();
    const tipoParam = searchParams.get("tipo")?.trim().toLowerCase();

    // Painel geral, banco de respostas e materiais: somente a nutricionista.
    // Dados de UM paciente: o próprio paciente (só o seu e-mail) ou a nutricionista.
    if (!userEmailParam || tipoParam) {
      if (ctx.role !== "nutri") return acessoNegado();
    } else {
      const alvoPermitido = resolverEmailAlvo(ctx, userEmailParam);
      if (ehResposta(alvoPermitido)) return alvoPermitido;
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Consulta específica para Banco de Respostas Rápidas ou Materiais de Aulas
    if (tipoParam === "respostas_rapidas" || tipoParam === "materiais_aulas") {
      let respostasRapidas: any[] = [];
      let materiaisAulas: any[] = [];
      if (isSupabaseConfigured()) {
        try {
          const { data } = await supabaseAdmin
            .from("respostas_rapidas_nutri")
            .select("*")
            .order("created_at", { ascending: false });
          if (data) {
            respostasRapidas = soRespostasRapidas(data);
          }
          materiaisAulas = await lerMateriaisAulas(supabaseAdmin);
        } catch (err) {
          console.warn("Aviso ao buscar respostas rápidas:", err);
        }
      }
      return NextResponse.json({
        success: true,
        respostas_rapidas: respostasRapidas,
        materiais_aulas: materiaisAulas,
      });
    }

    // Consulta específica para o Dashboard/Receitas do Paciente
    // Consulta específica para o Prontuário / Dashboard do Paciente
    if (userEmailParam) {
      let devolutivas: any[] = [];
      let prescricao: any = null;
      let agendamentos: any[] = [];
      let profile: any = null;
      let anamnese: any = null;
      let diario: any[] = [];
      let listaPacientes: any[] = [];

      if (isSupabaseConfigured()) {
        try {
          const [dRes, pRes, aRes, profRes, anamRes, diaRes, pacientesRes] = await Promise.all([
            supabaseAdmin
              .from("devolutivas_semanais")
              .select("*")
              .eq("user_email", userEmailParam)
              .order("created_at", { ascending: false }),
            supabaseAdmin
              .from("prescricoes_plano")
              .select("*")
              .eq("user_email", userEmailParam)
              .maybeSingle(),
            supabaseAdmin
              .from("agendamentos")
              .select("*")
              .eq("user_email", userEmailParam)
              .order("data", { ascending: true }),
            supabaseAdmin
              .from("profiles")
              .select("*")
              .eq("email", userEmailParam)
              .maybeSingle(),
            supabaseAdmin
              .from("anamneses")
              .select("*")
              .eq("user_email", userEmailParam)
              .maybeSingle(),
            supabaseAdmin
              .from("diario_refeicoes")
              .select("*")
              .eq("user_email", userEmailParam)
              .order("data_registro", { ascending: false }),
            supabaseAdmin
              .from("profiles")
              .select("email, nome, nome_crianca, idade_crianca")
              .neq("email", "metodonutrindoemcasa@gmail.com")
              .neq("plano", "nutri")
              .order("nome_crianca", { ascending: true }),
          ]);

          const materiaisAulas = await lerMateriaisAulas(supabaseAdmin);

          if (dRes.data) devolutivas = dRes.data;
          if (pRes.data) prescricao = pRes.data;
          if (aRes.data) agendamentos = aRes.data;
          if (profRes.data) profile = profRes.data;
          if (anamRes.data) anamnese = anamRes.data;
          if (diaRes.data) diario = diaRes.data;
          if (pacientesRes.data && ctx.role === "nutri") listaPacientes = pacientesRes.data;

          return NextResponse.json({
            success: true,
            user_email: userEmailParam,
            profile,
            anamnese,
            devolutivas,
            prescricao,
            agendamentos,
            diario,
            lista_pacientes: listaPacientes,
            materiais_aulas: materiaisAulas,
          });
        } catch (dbErr) {
          console.warn("Aviso ao buscar dados do paciente no Supabase:", dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        user_email: userEmailParam,
        profile,
        anamnese,
        devolutivas,
        prescricao,
        agendamentos,
        diario,
        lista_pacientes: listaPacientes,
        materiais_aulas: [],
      });
    }

    let profiles: any[] = [];
    let anamneses: any[] = [];
    let diario: any[] = [];
    let mensagens: any[] = [];
    let agendamentos: any[] = [];
    let devolutivas: any[] = [];
    let prescricoes: any[] = [];
    let respostasRapidas: any[] = [];

    if (isSupabaseConfigured()) {
      try {
        const [pRes, aRes, dRes, mRes, agRes, devRes, presRes, respRes] = await Promise.all([
          supabaseAdmin.from("profiles").select("*").neq("plano", "nutri").order("created_at", { ascending: false }),
          supabaseAdmin.from("anamneses").select("*").order("updated_at", { ascending: false }),
          supabaseAdmin.from("diario_refeicoes").select("*").order("data_registro", { ascending: false }),
          supabaseAdmin.from("mensagens_chat").select("*").order("created_at", { ascending: true }),
          supabaseAdmin.from("agendamentos").select("*").order("data", { ascending: true }),
          supabaseAdmin.from("devolutivas_semanais").select("*").order("created_at", { ascending: false }),
          supabaseAdmin.from("prescricoes_plano").select("*"),
          supabaseAdmin.from("respostas_rapidas_nutri").select("*").order("created_at", { ascending: false }),
        ]);

        const emailNutriOficial = "metodonutrindoemcasa@gmail.com";
        const ehNutri = (e?: string) => (e || "").toLowerCase().trim() === emailNutriOficial;

        if (pRes.data) profiles = pRes.data.filter((p: any) => !ehNutri(p.email) && p.plano !== "nutri");
        if (aRes.data) anamneses = aRes.data.filter((a: any) => !ehNutri(a.user_email));
        if (dRes.data) {
          diario = dRes.data
            .filter((d: any) => !ehNutri(d.user_email))
            .map((m: any) => {
              let foto = m.foto || null;
              let obs = m.observacoes || "";
              const match = typeof obs === "string" ? obs.match(/^\[FOTO:([^\]]+)\]\s*([\s\S]*)$/) : null;
              if (match) {
                foto = match[1];
                obs = match[2];
              }
              return {
                ...m,
                foto,
                observacoes: obs,
              };
            });
        }
        if (mRes.data) {
          mensagens = mRes.data
            .filter((m: any) => !ehNutri(m.user_email))
            .map((m: any) => {
              const { texto, anexo } = extrairAnexo(m.texto);
              return {
                ...m,
                remetente: m.remetente === "nutri" ? "nutri" : "usuario",
                texto,
                anexo,
                arquivos: anexo ? [anexo] : undefined,
              };
            });
        }
        if (agRes.data) agendamentos = agRes.data.filter((a: any) => !ehNutri(a.user_email));
        if (devRes.data) devolutivas = devRes.data.filter((d: any) => !ehNutri(d.user_email));
        if (presRes.data) prescricoes = presRes.data.filter((p: any) => !ehNutri(p.user_email));
        if (respRes.data) respostasRapidas = soRespostasRapidas(respRes.data);
      } catch (dbErr) {
        console.warn("Aviso ao buscar dados no Supabase para painel da nutri:", dbErr);
      }
    }

    // Base de pacientes real (sem mocks fictícios em produção)
    if (false) {
      profiles = [
        {
          id: "paciente-1",
          nome: "Lucas Lima",
          email: "lucas@email.com",
          cpf: "384.192.837-12",
          telefone: "(41) 98888-7777",
          nome_crianca: "Pedro Lima",
          idade_crianca: "3 anos e 4 meses",
          alimentos_conforto: "Biscoito de polvilho, banana amassada, macarrão puro",
          principais_recusas: "Texturas pegajosas e vegetais verdes (brócolis, alface)",
          plano: "trimestral",
          status_assinatura: "ATIVO",
          anamnese_concluida: true,
          consulta_agendada: true,
          created_at: new Date().toISOString(),
        },
        {
          id: "paciente-2",
          nome: "Mariana Souza",
          email: "mariana.souza@gmail.com",
          cpf: "219.845.193-44",
          telefone: "(41) 99123-4567",
          nome_crianca: "Theo Souza",
          idade_crianca: "2 anos e 8 meses",
          alimentos_conforto: "Iogurte natural, maçã raspada, arroz branco",
          principais_recusas: "Carne bovina em pedaços e alimentos com misturas",
          plano: "anual",
          status_assinatura: "ATIVO",
          anamnese_concluida: true,
          consulta_agendada: true,
          created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        },
        {
          id: "paciente-3",
          nome: "Rodrigo Mendes",
          email: "rodrigo.mendes@hotmail.com",
          cpf: "452.981.332-10",
          telefone: "(11) 97654-3210",
          nome_crianca: "Júlia Mendes",
          idade_crianca: "4 anos",
          alimentos_conforto: "Pão de queijo, melancia, suco de uva",
          principais_recusas: "Legumes cozidos e alimentos quentes",
          plano: "mensal",
          status_assinatura: "EXPIRADO",
          anamnese_concluida: true,
          consulta_agendada: false,
          created_at: new Date(Date.now() - 86400000 * 28).toISOString(),
        },
      ];
    }

    // Sem mocks fictícios quando banco estiver vazio - dados reais apenas
    // Anamneses, agendamentos, mensagens e diário permanecem como vieram do banco (ou vazios)

    const profilesEnriquecidos = profiles.map((p) => {
      const temAnamnese = anamneses.some(
        (a) => a.user_email?.toLowerCase() === p.email?.toLowerCase() && a.concluida
      );
      const temConsulta = agendamentos.some(
        (ag) => ag.user_email?.toLowerCase() === p.email?.toLowerCase() && ag.tipo === "consulta"
      );
      return {
        ...p,
        anamnese_concluida: temAnamnese,
        consulta_agendada: temConsulta,
      };
    });

    const materiaisAulas = isSupabaseConfigured() ? await lerMateriaisAulas(supabaseAdmin) : [];

    return NextResponse.json({
      success: true,
      profiles: profilesEnriquecidos,
      anamneses,
      diario,
      mensagens,
      agendamentos,
      devolutivas,
      prescricoes,
      respostas_rapidas: respostasRapidas,
      materiais_aulas: materiaisAulas,
    });
  } catch (error: unknown) {
    console.error("Erro interno no painel da nutricionista:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao buscar dados do painel da nutricionista." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await exigirUsuario(request);
    if (ehResposta(ctx)) return ctx;
    const body = await request.json();
    const { action } = body;

    // Único ato do paciente neste endpoint é enviar o próprio check-in; o resto é exclusivo da nutricionista
    if (action !== "salvar_checkin" && ctx.role !== "nutri") return acessoNegado();

    const supabaseAdmin = getSupabaseAdmin();

    // Ação 1: Enviar Mensagem no Chat como Nutri
    if (action === "enviar_mensagem") {
      const { user_email, texto, horario, anexo } = body;
      const emailLimpo = String(user_email || "").trim().toLowerCase();
      const textoLimpo = String(texto || "").trim();

      if (!emailLimpo || (!textoLimpo && !anexo)) {
        return NextResponse.json(
          { success: false, message: "E-mail do paciente e conteúdo da mensagem ou anexo são obrigatórios." },
          { status: 400 }
        );
      }

      const textoFinal = serializarComAnexo(textoLimpo, anexo);
      const agoraHorario =
        horario ||
        new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

      const { data: novaMsg, error } = await supabaseAdmin
        .from("mensagens_chat")
        .insert([
          {
            user_email: emailLimpo,
            remetente: "nutri",
            texto: textoFinal,
            horario: agoraHorario,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.warn("Aviso ao salvar mensagem da nutri:", error);
      }

      const respostaFormatada = {
        ...(novaMsg || {
          id: Date.now().toString(),
          user_email: emailLimpo,
          remetente: "nutri",
          horario: agoraHorario,
          created_at: new Date().toISOString(),
        }),
        remetente: "nutri",
        texto: textoLimpo,
        anexo: anexo || null,
        arquivos: anexo ? [anexo] : undefined,
      };

      return NextResponse.json({
        success: true,
        message: "Mensagem enviada com sucesso.",
        mensagem: respostaFormatada,
      });
    }

    // Ação Especial: Salvar Material / Metadados de Apoio de Aula do Curso
    if (action === "salvar_material_aula") {
      const { aula_id, titulo, descricao, video_url, material_anexo } = body;
      const aulaIdNum = Number(aula_id || 1);
      const chaveTitulo = `[AULA_${aulaIdNum}]`;

      const dadosAula = {
        aula_id: aulaIdNum,
        titulo: String(titulo || "").trim(),
        descricao: String(descricao || "").trim(),
        video_url: String(video_url || "").trim(),
        material_anexo: material_anexo || null,
        atualizado_em: new Date().toISOString(),
      };

      let salvo = null;

      if (isSupabaseConfigured()) {
        try {
          // Um registro por aula (atualiza ou cria) — sem apagar antes
          const { data, error } = await supabaseAdmin
            .from("materiais_aulas")
            .upsert(
              {
                aula_id: aulaIdNum,
                titulo: dadosAula.titulo,
                descricao: dadosAula.descricao,
                video_url: dadosAula.video_url,
                material_anexo: dadosAula.material_anexo,
                atualizado_em: dadosAula.atualizado_em,
              },
              { onConflict: "aula_id" }
            )
            .select()
            .single();

          if (error) console.warn("Aviso ao salvar material de aula:", error);
          if (data) salvo = data;
        } catch (dbErr) {
          console.warn("Aviso ao persistir material de aula:", dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Material e dados da aula salvos com sucesso!",
        material_aula: dadosAula,
        registro: salvo,
      });
    }

    // Ação 2: Prescrever Meta Alimentar ou Consulta
    if (action === "criar_agendamento") {
      const { user_email, titulo, tipo, data, horario, plataforma, link } = body;
      const emailLimpo = String(user_email || "").trim().toLowerCase();
      const tituloLimpo = String(titulo || "").trim();

      if (!emailLimpo || !tituloLimpo || !data || !horario) {
        return NextResponse.json(
          { success: false, message: "Campos obrigatórios de agendamento incompletos." },
          { status: 400 }
        );
      }

      const { data: novoAgendamento, error } = await supabaseAdmin
        .from("agendamentos")
        .insert([
          {
            user_email: emailLimpo,
            titulo: tituloLimpo,
            tipo: tipo || "meta",
            data,
            horario,
            plataforma: plataforma || "Google Meet",
            link: link || (tipo === "consulta" ? "https://meet.google.com/nutri-lais" : undefined),
            concluido: false,
          },
        ])
        .select()
        .single();

      if (error || !novoAgendamento) {
        if (error?.code === "23505") {
          return NextResponse.json(
            { success: false, message: "Já existe uma consulta marcada neste dia e horário." },
            { status: 409 }
          );
        }
        console.error("Erro ao criar agendamento pela nutri:", error);
        return NextResponse.json(
          { success: false, message: "Não foi possível criar o agendamento. Tente novamente." },
          { status: 500 }
        );
      }

      // Consulta criada pela nutri também entra no Google Agenda dela (com Meet e convite ao paciente)
      let sincronizadoGoogle = false;
      if ((tipo || "meta") === "consulta") {
        const sync = await sincronizarConsultaComGoogle(novoAgendamento);
        sincronizadoGoogle = sync.sincronizado;
        if (sync.meetLink) novoAgendamento.link = sync.meetLink;
      }

      return NextResponse.json({
        success: true,
        message: "Agendamento prescrito com sucesso.",
        sincronizadoGoogle,
        agendamento: novoAgendamento,
      });
    }

    // Ação 3: Alterar Status da Assinatura do Paciente
    if (action === "atualizar_status_assinatura") {
      const { user_email, status } = body;
      const emailLimpo = String(user_email || "").trim().toLowerCase();

      if (!emailLimpo || !status) {
        return NextResponse.json(
          { success: false, message: "E-mail e novo status são obrigatórios." },
          { status: 400 }
        );
      }

      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ status_assinatura: String(status).toUpperCase() })
        .eq("email", emailLimpo);

      if (error) {
        console.warn("Aviso ao atualizar status pelo painel da nutri:", error);
      }

      return NextResponse.json({
        success: true,
        message: `Status da assinatura alterado para ${status}.`,
      });
    }

    // Ação 4: Salvar Anotações Clínicas da Nutricionista
    if (action === "salvar_anotacoes_clinicas") {
      const { user_email, anotacoes } = body;
      const emailLimpo = String(user_email || "").trim().toLowerCase();

      if (!emailLimpo) {
        return NextResponse.json(
          { success: false, message: "E-mail do paciente é obrigatório." },
          { status: 400 }
        );
      }

      const { error } = await supabaseAdmin
        .from("anamneses")
        .update({
          anotacoes_clinicas: String(anotacoes || ""),
          updated_at: new Date().toISOString(),
        })
        .eq("user_email", emailLimpo);

      if (error) {
        console.warn("Aviso ao salvar anotações clínicas:", error);
      }

      return NextResponse.json({
        success: true,
        message: "Anotações clínicas salvas com sucesso.",
      });
    }

    // Ação 5: Salvar Check-in de 4 Semanas enviado pelos Pais
    if (action === "salvar_checkin") {
      const { user_email, novosAlimentos, refeicoesFamilia, medidasRecentes, duvidasConsulta } = body;
      const alvoCheckin = resolverEmailAlvo(ctx, user_email);
      if (ehResposta(alvoCheckin)) return alvoCheckin;
      const emailLimpo = alvoCheckin;

      if (!emailLimpo) {
        return NextResponse.json(
          { success: false, message: "E-mail do paciente é obrigatório para registrar o check-in." },
          { status: 400 }
        );
      }

      const novoCheckin = {
        id: `chk-${Date.now()}`,
        dataEnvio: new Date().toISOString(),
        novosAlimentos: String(novosAlimentos || "").trim(),
        refeicoesFamilia: String(refeicoesFamilia || "").trim(),
        medidasRecentes: String(medidasRecentes || "").trim(),
        duvidasConsulta: String(duvidasConsulta || "").trim(),
      };

      if (isSupabaseConfigured()) {
        try {
          const { data: anamneseExistente } = await supabaseAdmin
            .from("anamneses")
            .select("respostas")
            .eq("user_email", emailLimpo)
            .maybeSingle();

          const respostasAtuais = (anamneseExistente?.respostas as Record<string, any>) || {};
          const checkinsAtuais = Array.isArray(respostasAtuais.checkins) ? respostasAtuais.checkins : [];
          const checkinsAtualizados = [novoCheckin, ...checkinsAtuais];

          await supabaseAdmin
            .from("anamneses")
            .upsert(
              {
                user_email: emailLimpo,
                respostas: {
                  ...respostasAtuais,
                  checkins: checkinsAtualizados,
                },
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_email" }
            );
        } catch (dbErr) {
          console.warn("Aviso ao salvar check-in de 4 semanas no Supabase:", dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Check-in de 4 semanas enviado com sucesso para a Dra. Laís! 📝",
        checkin: novoCheckin,
      });
    }

    // Ação 6: Atualizar Link da Sala do Google Meet da Consulta
    if (action === "atualizar_link_meet") {
      const { agendamento_id, link } = body;
      const linkLimpo = String(link || "").trim();

      if (!agendamento_id || !linkLimpo) {
        return NextResponse.json(
          { success: false, message: "ID do agendamento e Link do Google Meet são obrigatórios." },
          { status: 400 }
        );
      }

      if (!/^https:\/\/[^\s]+$/i.test(linkLimpo)) {
        return NextResponse.json(
          { success: false, message: "Informe um link completo começando com https://" },
          { status: 400 }
        );
      }

      let googleAtualizado = false;
      if (isSupabaseConfigured()) {
        try {
          const { data: atualizado } = await supabaseAdmin
            .from("agendamentos")
            .update({ link: linkLimpo })
            .eq("id", agendamento_id)
            .select("google_event_id")
            .maybeSingle();
          // mantém o evento do Google Agenda (e o convite do paciente) com o mesmo link
          if (atualizado?.google_event_id) {
            googleAtualizado = await atualizarEvento(atualizado.google_event_id, { link: linkLimpo });
          }
        } catch (dbErr) {
          console.warn("Aviso ao atualizar link do meet:", dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Link da sala do Google Meet atualizado com sucesso! 🔗",
        link: linkLimpo,
        googleAtualizado,
      });
    }

    // Ação 6b: Gerar sala REAL do Google Meet para a consulta (usa o evento na agenda Google da nutri)
    if (action === "gerar_meet_google") {
      const { agendamento_id } = body;
      if (!agendamento_id) {
        return NextResponse.json({ success: false, message: "ID do agendamento é obrigatório." }, { status: 400 });
      }
      const { data: ag } = await supabaseAdmin
        .from("agendamentos")
        .select("id, user_email, titulo, tipo, data, horario, link, google_event_id")
        .eq("id", agendamento_id)
        .maybeSingle();
      if (!ag) return NextResponse.json({ success: false, message: "Agendamento não encontrado." }, { status: 404 });

      if (!ag.google_event_id) await sincronizarConsultaComGoogle(ag);
      const { data: atual } = await supabaseAdmin
        .from("agendamentos")
        .select("google_event_id")
        .eq("id", agendamento_id)
        .maybeSingle();
      if (!atual?.google_event_id) {
        return NextResponse.json(
          { success: false, message: "Conecte o Google Agenda da Dra. Laís para gerar uma sala real do Meet." },
          { status: 409 }
        );
      }
      const meet = await garantirMeetNoEvento(atual.google_event_id);
      if (!meet) {
        return NextResponse.json(
          { success: false, message: "Não foi possível gerar a sala agora. Tente novamente em instantes." },
          { status: 502 }
        );
      }
      await supabaseAdmin.from("agendamentos").update({ link: meet }).eq("id", agendamento_id);
      return NextResponse.json({ success: true, message: "Sala do Google Meet criada! 🔗", link: meet });
    }

    // Ação 7: Concluir Consulta & Liberar Retorno de 4 Semanas
    if (action === "concluir_consulta") {
      const { agendamento_id, orientacoes } = body;

      if (!agendamento_id) {
        return NextResponse.json(
          { success: false, message: "ID do agendamento é obrigatório para concluir a consulta." },
          { status: 400 }
        );
      }

      if (isSupabaseConfigured()) {
        try {
          await supabaseAdmin
            .from("agendamentos")
            .update({
              concluido: true,
              ...(orientacoes ? { observacoes: String(orientacoes).trim() } : {}),
            })
            .eq("id", agendamento_id);
        } catch (dbErr) {
          console.warn("Aviso ao concluir consulta no Supabase:", dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Consulta concluída com sucesso! Próximo retorno mensal (ciclo de 4 semanas) liberado.",
      });
    }

    // Ação 8: Enviar Devolutiva Semanal & Sincronizar Metas
    if (action === "enviar_devolutiva") {
      const { user_email, semana_ref, parecer_clinico, alimentos_alvo, metas_semana, profissional } = body;
      const emailLimpo = String(user_email || "").trim().toLowerCase();
      const parecerLimpo = String(parecer_clinico || "").trim();

      if (!emailLimpo || !parecerLimpo) {
        return NextResponse.json(
          { success: false, message: "E-mail do paciente e parecer clínico são obrigatórios." },
          { status: 400 }
        );
      }

      const listaAlimentos = Array.isArray(alimentos_alvo)
        ? alimentos_alvo
        : typeof alimentos_alvo === "string"
        ? alimentos_alvo.split(",").map((a: string) => a.trim()).filter(Boolean)
        : [];

      const listaMetas = Array.isArray(metas_semana) ? metas_semana : [];

      let novaDevolutiva: any = null;

      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabaseAdmin
            .from("devolutivas_semanais")
            .insert([
              {
                user_email: emailLimpo,
                semana_ref: semana_ref || "Devolutiva Semanal de Acompanhamento",
                parecer_clinico: parecerLimpo,
                alimentos_alvo: listaAlimentos,
                metas_semana: listaMetas,
                profissional: profissional || "Dra. Laís Leles • CRN-8 18878",
                created_at: new Date().toISOString(),
              },
            ])
            .select()
            .single();

          if (error) console.warn("Aviso ao salvar devolutiva no Supabase:", error);
          if (data) novaDevolutiva = data;

          // Sincroniza as metas na tabela agendamentos do paciente
          if (listaMetas.length > 0) {
            const dataHoje = new Date().toISOString().split("T")[0];
            for (const meta of listaMetas) {
              const textoMeta = typeof meta === "string" ? meta : meta?.texto;
              if (textoMeta && textoMeta.trim()) {
                await supabaseAdmin.from("agendamentos").insert([
                  {
                    user_email: emailLimpo,
                    titulo: `Meta: ${textoMeta.trim()}`,
                    tipo: "meta",
                    data: dataHoje,
                    horario: "12:30",
                    concluido: Boolean(meta?.concluida),
                  },
                ]);
              }
            }
          }
        } catch (dbErr) {
          console.warn("Aviso ao sincronizar devolutiva com Supabase:", dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Devolutiva Semanal enviada e sincronizada com sucesso! 💌",
        devolutiva: novaDevolutiva || {
          id: `dev-${Date.now()}`,
          user_email: emailLimpo,
          semana_ref: semana_ref || "Devolutiva Semanal",
          parecer_clinico: parecerLimpo,
          alimentos_alvo: listaAlimentos,
          metas_semana: listaMetas,
          profissional: profissional || "Dra. Laís Leles • CRN-8 18878",
          created_at: new Date().toISOString(),
        },
      });
    }

    // Ação 8.1: Salvar Anotações Internas do Prontuário
    if (action === "salvar_anotacoes_prontuario") {
      const { user_email, anotacoes_clinicas } = body;
      const emailLimpo = String(user_email || "").trim().toLowerCase();
      if (!emailLimpo) {
        return NextResponse.json({ success: false, message: "E-mail do paciente obrigatório." }, { status: 400 });
      }

      if (isSupabaseConfigured()) {
        try {
          const { data: anam } = await supabaseAdmin
            .from("anamneses")
            .select("respostas")
            .eq("user_email", emailLimpo)
            .maybeSingle();

          const respostasAtuais = (anam?.respostas as Record<string, any>) || {};
          await supabaseAdmin
            .from("anamneses")
            .upsert(
              {
                user_email: emailLimpo,
                respostas: {
                  ...respostasAtuais,
                  anotacoes_clinicas: String(anotacoes_clinicas || "").trim(),
                },
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_email" }
            );
        } catch (dbErr) {
          console.warn("Aviso ao salvar anotações no Supabase:", dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Anotações internas do prontuário salvas com sucesso! 📝",
      });
    }

    // Ação 9: Salvar Prescrição do Plano Alimentar & Receitas Recomendadas
    if (action === "salvar_prescricao_plano") {
      const {
        user_email,
        orientacao_prato_seguro,
        composicao_prato,
        refeicoes_estruturadas,
        receitas_recomendadas_ids,
      } = body;
      const emailLimpo = String(user_email || "").trim().toLowerCase();

      if (!emailLimpo) {
        return NextResponse.json(
          { success: false, message: "E-mail do paciente é obrigatório para salvar a prescrição." },
          { status: 400 }
        );
      }

      const payload = {
        user_email: emailLimpo,
        orientacao_prato_seguro: String(orientacao_prato_seguro || "").trim(),
        composicao_prato: composicao_prato || { conforto: 70, ponte: 20, desafio: 10 },
        refeicoes_estruturadas: Array.isArray(refeicoes_estruturadas) ? refeicoes_estruturadas : [],
        receitas_recomendadas_ids: Array.isArray(receitas_recomendadas_ids) ? receitas_recomendadas_ids : [],
        updated_at: new Date().toISOString(),
      };

      let prescricaoSalva: any = null;

      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabaseAdmin
            .from("prescricoes_plano")
            .upsert(payload, { onConflict: "user_email" })
            .select()
            .maybeSingle();

          if (error) console.warn("Aviso ao salvar prescrição no Supabase:", error);
          if (data) prescricaoSalva = data;
        } catch (dbErr) {
          console.warn("Aviso ao persistir prescrição:", dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Prescrição do Plano e Receitas Recomendadas salvas com sucesso! 🍲",
        prescricao: prescricaoSalva || payload,
      });
    }

    // Ação 10: Salvar Nova Resposta Rápida Personalizada da Nutri
    if (action === "salvar_resposta_rapida") {
      const { categoria, titulo, texto } = body;
      const tituloLimpo = String(titulo || "").trim();
      const textoLimpo = typeof texto === "string" ? texto.trim() : JSON.stringify(texto);

      if (!tituloLimpo || !textoLimpo) {
        return NextResponse.json(
          { success: false, message: "Título e texto são obrigatórios." },
          { status: 400 }
        );
      }

      let novaResposta: any = null;

      if (isSupabaseConfigured()) {
        try {
          const { data, error } = await supabaseAdmin
            .from("respostas_rapidas_nutri")
            .insert([
              {
                categoria: categoria || "personalizado",
                titulo: tituloLimpo,
                texto: textoLimpo,
                created_at: new Date().toISOString(),
              },
            ])
            .select()
            .single();

          if (error) console.warn("Aviso ao salvar resposta rápida no Supabase:", error);
          if (data) novaResposta = data;
        } catch (dbErr) {
          console.warn("Aviso ao persistir resposta rápida:", dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Resposta rápida salva com sucesso no banco de dados! ⭐",
        resposta: novaResposta || {
          id: `custom-${Date.now()}`,
          categoria: categoria || "personalizado",
          titulo: tituloLimpo,
          texto: textoLimpo,
          created_at: new Date().toISOString(),
        },
      });
    }

    // Ação 11: Excluir Resposta Rápida
    if (action === "excluir_resposta_rapida") {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ success: false, message: "ID da resposta rápida é obrigatório." }, { status: 400 });
      }

      if (isSupabaseConfigured()) {
        try {
          await supabaseAdmin.from("respostas_rapidas_nutri").delete().eq("id", id);
        } catch (dbErr) {
          console.warn("Aviso ao excluir resposta rápida no Supabase:", dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Resposta rápida excluída com sucesso.",
      });
    }

    return NextResponse.json(
      { success: false, message: "Ação não reconhecida." },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("Erro interno ao processar ação no painel da nutri:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao processar solicitação da nutricionista." },
      { status: 500 }
    );
  }
}
