import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    let profiles: any[] = [];
    let anamneses: any[] = [];
    let diario: any[] = [];
    let mensagens: any[] = [];
    let agendamentos: any[] = [];

    if (isSupabaseConfigured()) {
      try {
        const [pRes, aRes, dRes, mRes, agRes] = await Promise.all([
          supabaseAdmin.from("profiles").select("*").neq("plano", "nutri").order("created_at", { ascending: false }),
          supabaseAdmin.from("anamneses").select("*").order("updated_at", { ascending: false }),
          supabaseAdmin.from("diario_refeicoes").select("*").order("data_registro", { ascending: false }),
          supabaseAdmin.from("mensagens_chat").select("*").order("created_at", { ascending: true }),
          supabaseAdmin.from("agendamentos").select("*").order("data", { ascending: true }),
        ]);

        if (pRes.data) profiles = pRes.data;
        if (aRes.data) anamneses = aRes.data;
        if (dRes.data) diario = dRes.data;
        if (mRes.data) mensagens = mRes.data;
        if (agRes.data) agendamentos = agRes.data;
      } catch (dbErr) {
        console.warn("Aviso ao buscar dados no Supabase para painel da nutri:", dbErr);
      }
    }

    // Se a base estiver vazia no ambiente local de testes ou apresentação, injeta dados reais de demonstração
    if (profiles.length === 0) {
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

    if (anamneses.length === 0) {
      anamneses = [
        {
          id: "anamnese-1",
          user_email: "lucas@email.com",
          concluida: true,
          updated_at: new Date().toISOString(),
          anotacoes_clinicas: "Paciente com sensibilidade tátil e olfativa acentuada. Hipersensibilidade moderada a folhas. Recomendado iniciar tolerância visual no prato de apoio por 7 dias.",
          respostas: {
            nomeCrianca: "Pedro Lima",
            dataNascimento: "2023-05-10",
            sexo: "Masculino",
            nomeResponsavel: "Lucas Lima",
            parentesco: "Pai",
            participaAlimentacao: ["Mãe", "Pai", "Escola"],
            motivos: ["Seletividade alimentar severa", "Pouca variedade de alimentos", "Recusa a experimentar"],
            diagnosticos: ["Suspeita de TEA", "Sensibilidade sensorial"],
            nivelTEA: "Nível 1 de suporte",
            comunicacao: "Fala frases curtas e aponta",
            comunicacaoGeral: "Boa compreensão verbal",
            gestacao: ["A termo (39 semanas)", "Parto cesárea sem intercorrências"],
            pesoNascer: "3.250g",
            aleitamento: "Materno exclusivo até 6 meses",
            inicioDificuldadesAtuais: "Por volta de 1 ano e 6 meses",
            pesoAtual: "14.2 kg",
            alturaAtual: "96 cm",
            cereais: ["Arroz branco", "Biscoito de polvilho", "Pão francês", "Macarrão"],
            proteinas: ["Ovo mexido", "Frango desfiado"],
            frutas: ["Banana", "Maçã em fatias finas"],
            vegetais: ["Batata doce cozida"],
            leguminosas: ["Feijão carioca (apenas o caldo)"],
            qntAlimentos: "11–20",
            comerFora: "Dificuldade em restaurantes com muito barulho",
            exigeTodoDia: "Biscoito de polvilho",
            sofrimentoFalta: "Choro intenso se o alimento de conforto não estiver visível",
            influencias: ["Cheiro forte", "Mistura de texturas no mesmo prato"],
            mudancasMatriz: "Aceita fruta se fatiada finamente",
            comportamentoNovo: "Tolerou vegetal no prato de apoio sem empurrar",
            utensilios: "Usa colher própria, recusa garfo de metal",
            independencia: "Come sozinho com as mãos ou colher",
            horarios: {
              cafeDaManha: { horario: "08:00", naoFaz: false },
              almoco: { horario: "12:30", naoFaz: false },
              lancheTarde: { horario: "16:00", naoFaz: false },
              jantar: { horario: "19:30", naoFaz: false },
            },
            locaisRefeicao: ["Mesa da cozinha em cadeirão"],
            usoTelas: "Ocasional quando a recusa é intensa",
            sentimentosPais: ["Ansiedade nas refeições", "Esperança no método"],
            aguaQuantidade: "Aproximadamente 600ml por dia",
            freqIntestino: "1 vez ao dia",
            tipoBristol: "Tipo 3 e 4 (Normal)",
            interessesFavoritos: "Dinossauros, carrinhos e blocos de montar",
            expectativas: "Conseguir fazer refeições em família sem estresse e introduzir 2 novos vegetais.",
            checkins: [
              {
                id: "chk-demo-1",
                dataEnvio: new Date(Date.now() - 86400000 * 2).toISOString(),
                novosAlimentos: "Tolerou e provou pedacinhos de cenoura crua em palitinhos e morango fresco.",
                refeicoesFamilia: "Conseguimos jantar juntos à mesa 4 vezes nesta semana sem choro ou fuga da cadeira.",
                medidasRecentes: "Peso: 14.5 kg | Estatura: 97 cm (medição do pediatra em 12/10)",
                duvidasConsulta: "Como avançar da exploração visual do brócolis para levar até os lábios sem forçar?",
              },
            ],
          },
        },
      ];
    }

    if (agendamentos.length === 0) {
      agendamentos = [
        {
          id: "ag-1",
          user_email: "lucas@email.com",
          titulo: "1ª Consulta Nutricional Pediátrica de Acolhimento",
          tipo: "consulta",
          data: "2026-10-23",
          horario: "14:00 - 15:00",
          plataforma: "Google Meet",
          link: "https://meet.google.com/nutri-lais-acolhimento",
          concluido: false,
        },
        {
          id: "ag-2",
          user_email: "mariana.souza@gmail.com",
          titulo: "1ª Consulta Nutricional Pediátrica de Acolhimento",
          tipo: "consulta",
          data: "2026-10-24",
          horario: "10:30 - 11:30",
          plataforma: "Google Meet",
          link: "https://meet.google.com/nutri-lais-theo",
          concluido: false,
        },
        {
          id: "ag-3",
          user_email: "lucas@email.com",
          titulo: "Meta: Oferecer cenoura ralada no prato de apoio",
          tipo: "meta",
          data: "2026-10-18",
          horario: "12:30",
          concluido: false,
        },
      ];
    }

    if (mensagens.length === 0) {
      mensagens = [
        {
          id: "msg-1",
          user_email: "lucas@email.com",
          remetente: "nutri",
          texto: "Olá Lucas! Analisei a anamnese do Pedro com carinho. Vamos focar nos alimentos de textura crocante seca primeiro. Qualquer dúvida, estou aqui!",
          horario: "10:15",
          created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        },
        {
          id: "msg-2",
          user_email: "lucas@email.com",
          remetente: "usuario",
          texto: "Muito obrigado, Dra. Laís! Ele tolerou a cenoura ralada ontem no prato de apoio sem reclamar. Estamos muito animados!",
          horario: "11:20",
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
      ];
    }

    if (diario.length === 0) {
      diario = [
        {
          id: "d-1",
          user_email: "lucas@email.com",
          alimento: "Cenoura ralada",
          refeicao: "Almoço",
          degrau: "tolerou",
          observacoes: "Ficou no prato de apoio durante todo o almoço sem empurrar",
          data_registro: new Date().toISOString(),
        },
        {
          id: "d-2",
          user_email: "lucas@email.com",
          alimento: "Brócolis cozido",
          refeicao: "Jantar",
          degrau: "cheirou",
          observacoes: "Cheirou voluntariamente quando o pai ofereceu para adivinhar",
          data_registro: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "d-3",
          user_email: "mariana.souza@gmail.com",
          alimento: "Manga fatiada",
          refeicao: "Lanche",
          degrau: "tocou",
          observacoes: "Ajudou a colocar no prato com as mãos",
          data_registro: new Date().toISOString(),
        },
      ];
    }

    return NextResponse.json({
      success: true,
      profiles,
      anamneses,
      diario,
      mensagens,
      agendamentos,
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
    const body = await request.json();
    const { action } = body;

    const supabaseAdmin = getSupabaseAdmin();

    // Ação 1: Enviar Mensagem no Chat como Nutri
    if (action === "enviar_mensagem") {
      const { user_email, texto, horario } = body;
      const emailLimpo = String(user_email || "").trim().toLowerCase();
      const textoLimpo = String(texto || "").trim();

      if (!emailLimpo || !textoLimpo) {
        return NextResponse.json(
          { success: false, message: "E-mail do paciente e texto são obrigatórios." },
          { status: 400 }
        );
      }

      const { data: novaMsg, error } = await supabaseAdmin
        .from("mensagens_chat")
        .insert([
          {
            user_email: emailLimpo,
            remetente: "nutri",
            texto: textoLimpo,
            horario: horario || new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.warn("Aviso ao salvar mensagem da nutri:", error);
      }

      return NextResponse.json({
        success: true,
        message: "Mensagem enviada com sucesso.",
        mensagem: novaMsg || {
          id: Date.now().toString(),
          user_email: emailLimpo,
          remetente: "nutri",
          texto: textoLimpo,
          horario: horario || "Agora",
          created_at: new Date().toISOString(),
        },
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

      if (error) {
        console.warn("Aviso ao criar agendamento pela nutri:", error);
      }

      return NextResponse.json({
        success: true,
        message: "Agendamento prescrito com sucesso.",
        agendamento: novoAgendamento || {
          id: Date.now().toString(),
          user_email: emailLimpo,
          titulo: tituloLimpo,
          tipo: tipo || "meta",
          data,
          horario,
        },
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
      const emailLimpo = String(user_email || "").trim().toLowerCase();

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

      if (isSupabaseConfigured()) {
        try {
          await supabaseAdmin
            .from("agendamentos")
            .update({ link: linkLimpo })
            .eq("id", agendamento_id);
        } catch (dbErr) {
          console.warn("Aviso ao atualizar link do meet:", dbErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Link da sala do Google Meet atualizado com sucesso! 🔗",
        link: linkLimpo,
      });
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
