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

    // 1. Busca agendamentos do paciente solicitante
    const { data: agendamentosUsuario, error: erroUsuario } = await supabaseAdmin
      .from("agendamentos")
      .select("*")
      .eq("user_email", email)
      .order("data", { ascending: true });

    if (erroUsuario) {
      console.warn("Aviso ao buscar agendamentos do usuário:", erroUsuario);
    }

    // 2. Busca todos os horários de consultas ocupados na clínica da Dra. Laís
    const { data: todasConsultas, error: erroGeral } = await supabaseAdmin
      .from("agendamentos")
      .select("data, horario")
      .eq("tipo", "consulta");

    if (erroGeral) {
      console.warn("Aviso ao buscar ocupação geral da nutricionista:", erroGeral);
    }

    const horariosOcupadosNutri = (todasConsultas || []).map((c) => ({
      data: c.data,
      horario: c.horario,
    }));

    let listaAgendamentos = agendamentosUsuario || [];
    if (listaAgendamentos.length === 0 && (!isSupabaseConfigured() || email === "lucas@email.com")) {
      listaAgendamentos = [
        {
          id: "ag-1",
          user_email: email,
          titulo: "1ª Consulta Nutricional Pediátrica de Acolhimento",
          tipo: "consulta",
          data: "2026-10-23",
          horario: "14:00 - 15:00",
          plataforma: "Google Meet",
          link: "https://meet.google.com/nutri-lais-acolhimento",
          concluido: false,
        },
      ];
    }

    const consultasUsuario = listaAgendamentos.filter((a) => a.tipo === "consulta");
    const ultimaConsulta = consultasUsuario.length > 0 ? consultasUsuario[consultasUsuario.length - 1] : null;
    const ultimaConsultaData = ultimaConsulta?.data || null;

    let proximoRetornoDisponivelData: string | null = null;
    if (ultimaConsultaData) {
      const d = new Date(ultimaConsultaData + "T00:00:00");
      d.setDate(d.getDate() + 28);
      proximoRetornoDisponivelData = d.toISOString().split("T")[0];
    }

    return NextResponse.json({
      success: true,
      agendamentos: listaAgendamentos,
      horariosOcupadosNutri,
      ultimaConsulta,
      ultimaConsultaData,
      proximoRetornoDisponivelData,
    });
  } catch (error: unknown) {
    console.error("Erro interno ao buscar agendamentos:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao buscar agendamentos." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      titulo,
      tipo = "consulta",
      data,
      horario,
      observacoes = "",
      plataforma = "Google Meet",
      link = "https://meet.google.com",
    } = body;

    const emailLimpo = String(email || "").toLowerCase().trim();
    const tituloLimpo = String(titulo || "").trim();
    const dataLimpa = String(data || "").trim();
    const horarioLimpo = String(horario || "").trim();

    if (!emailLimpo || !tituloLimpo || !dataLimpa || !horarioLimpo) {
      return NextResponse.json(
        { success: false, message: "Campos obrigatórios ausentes para o agendamento." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    if (tipo === "consulta") {
      // REGRA DO CICLO DE CONSULTAS:
      // Se o paciente já possui consulta agendada ou realizada, o retorno exige 28 dias (4 semanas)
      const { data: consultasAnteriores } = await supabaseAdmin
        .from("agendamentos")
        .select("data")
        .eq("user_email", emailLimpo)
        .eq("tipo", "consulta")
        .order("data", { ascending: false });

      let dataUltimaConsulta =
        consultasAnteriores && consultasAnteriores.length > 0 ? consultasAnteriores[0].data : null;
      if (!dataUltimaConsulta && (!isSupabaseConfigured() || emailLimpo === "lucas@email.com")) {
        dataUltimaConsulta = "2026-10-23";
      }

      if (dataUltimaConsulta) {
        const dRetorno = new Date(dataUltimaConsulta + "T00:00:00");
        dRetorno.setDate(dRetorno.getDate() + 28);
        const dataMinimaRetornoISO = dRetorno.toISOString().split("T")[0];

        if (dataLimpa < dataMinimaRetornoISO) {
          const partes = dataMinimaRetornoISO.split("-");
          const dataMinimaBR = `${partes[2]}/${partes[1]}`;
          return NextResponse.json(
            {
              success: false,
              message: `Consultas de retorno seguem o ciclo de 4 semanas. Próximo retorno mensal disponível a partir de ${dataMinimaBR}.`,
            },
            { status: 400 }
          );
        }
      } else {
        // Se for a 1ª consulta: antecedência mínima de 7 dias após o cadastro
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataMinima = new Date(hoje);
        dataMinima.setDate(hoje.getDate() + 7);
        const dataMinimaISO = dataMinima.toISOString().split("T")[0];

        if (dataLimpa < dataMinimaISO) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Horários preenchidos nesta data. Próximos horários livres na agenda a partir de 7 dias após a inscrição.",
            },
            { status: 400 }
          );
        }
      }

      // REGRA 2: Verificação de conflito de horário na agenda da Nutricionista
      const { data: conflito } = await supabaseAdmin
        .from("agendamentos")
        .select("id")
        .eq("tipo", "consulta")
        .eq("data", dataLimpa)
        .eq("horario", horarioLimpo)
        .maybeSingle();

      if (conflito) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Este horário já está reservado na agenda da Dra. Laís. Por favor, escolha outro horário disponível.",
          },
          { status: 400 }
        );
      }
    }

    // 1. Grava o agendamento no Supabase
    const { data: novoAgendamento, error } = await supabaseAdmin
      .from("agendamentos")
      .insert([
        {
          user_email: emailLimpo,
          titulo: tituloLimpo,
          tipo,
          data: dataLimpa,
          horario: horarioLimpo,
          observacoes,
          plataforma,
          link,
          concluido: false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.warn("Aviso ao persistir agendamento no Supabase:", error);
    }

    // 2. Se for consulta, marca consulta_agendada no perfil para desbloquear o onboarding
    if (tipo === "consulta") {
      try {
        await supabaseAdmin
          .from("profiles")
          .update({ consulta_agendada: true })
          .eq("email", emailLimpo);
      } catch (profErr) {
        console.warn("Aviso ao atualizar consulta_agendada no profile:", profErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Agendamento registrado com sucesso.",
      agendamento: novoAgendamento || {
        id: Date.now().toString(),
        user_email: emailLimpo,
        titulo: tituloLimpo,
        tipo,
        data: dataLimpa,
        horario: horarioLimpo,
      },
    });
  } catch (error: unknown) {
    console.error("Erro interno ao criar agendamento:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao registrar agendamento." },
      { status: 500 }
    );
  }
}
