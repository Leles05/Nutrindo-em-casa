import { NextResponse } from "next/server";
import { createAnonServerClient, getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { ipDaRequisicao, normalizarEmail, papelDoUsuario } from "@/lib/auth";
import { statusEfetivo } from "@/lib/assinatura";
import { excedeu, registrarFalha } from "@/lib/rateLimit";

const MSG_CREDENCIAIS_INVALIDAS =
  "E-mail/CPF ou senha incorretos. Se você acabou de assinar, clique no link enviado ao seu e-mail para criar sua senha.";

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { success: false, message: "Serviço de autenticação indisponível no momento." },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const identificador = normalizarEmail(body?.email);
    const senha = String(body?.password || "").trim();

    if (!identificador || !senha) {
      return NextResponse.json(
        { success: false, message: "E-mail ou CPF e senha são obrigatórios para acessar." },
        { status: 400 }
      );
    }

    // Limite de tentativas FALHAS: por IP e por identificador (força bruta / enumeração).
    // Logins corretos não consomem o limite.
    const ip = ipDaRequisicao(request);
    const chaveIp = `login:ip:${ip}`;
    const chaveId = `login:id:${identificador}`;
    const janela = 10 * 60 * 1000;
    const porIp = excedeu(chaveIp, 40, janela);
    const porId = excedeu(chaveId, 8, janela);
    const falhou = () => {
      registrarFalha(chaveIp);
      registrarFalha(chaveId);
    };
    if (porIp.bloqueado || porId.bloqueado) {
      const espera = Math.max(porIp.retryAfterSeg, porId.retryAfterSeg);
      return NextResponse.json(
        { success: false, message: `Muitas tentativas. Aguarde ${Math.ceil(espera / 60)} min e tente novamente.` },
        { status: 429, headers: { "Retry-After": String(espera) } }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    let emailLogin = identificador;

    // Login por CPF (11 dígitos, com ou sem pontuação): busca filtrada no banco, sem baixar todos os perfis
    if (!identificador.includes("@")) {
      const digitos = identificador.replace(/\D/g, "");
      if (digitos.length !== 11) {
        {
        falhou();
        return NextResponse.json({ success: false, message: MSG_CREDENCIAIS_INVALIDAS }, { status: 401 });
      }
      }
      const formatado = `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
      const { data: porCpf } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .in("cpf", [digitos, formatado])
        .limit(1);

      if (!porCpf || porCpf.length === 0 || !porCpf[0].email) {
        // Mesma mensagem de "senha errada": não revela se o CPF existe
        {
        falhou();
        return NextResponse.json({ success: false, message: MSG_CREDENCIAIS_INVALIDAS }, { status: 401 });
      }
      }
      emailLogin = normalizarEmail(porCpf[0].email);
    }

    // Autenticação real no Supabase Auth (cliente novo por requisição)
    const { data: authData, error: authError } = await createAnonServerClient().auth.signInWithPassword({
      email: emailLogin,
      password: senha,
    });

    if (authError || !authData?.user || !authData.session) {
      {
        falhou();
        return NextResponse.json({ success: false, message: MSG_CREDENCIAIS_INVALIDAS }, { status: 401 });
      }
    }

    const authUser = authData.user;
    const role = papelDoUsuario(authUser);
    const session = authData.session;

    // Perfil (assinatura) — a nutricionista tem perfil próprio; cliente sem perfil não entra
    const { data: perfilBanco } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("email", emailLogin)
      .maybeSingle();

    if (!perfilBanco && role !== "nutri") {
      return NextResponse.json(
        {
          success: false,
          erro: "sem_assinatura",
          message: "Não encontramos uma assinatura vinculada a este e-mail. Escolha um plano para criar seu acesso.",
        },
        { status: 403 }
      );
    }

    const statusAssinatura = role === "nutri" ? "ATIVO" : statusEfetivo(perfilBanco);

    // Onboarding (anamnese e consulta agendada) + preferência do tour
    let anamneseConcluida = role === "nutri";
    let consultaAgendada = role === "nutri";
    let tourOculto = authUser.user_metadata?.tour_oculto === true;

    const { data: anamneseRow } = await supabaseAdmin
      .from("anamneses")
      .select("concluida, respostas")
      .eq("user_email", emailLogin)
      .maybeSingle();

    if (anamneseRow?.concluida) anamneseConcluida = true;
    if (anamneseRow?.respostas?._tour_oculto === true) tourOculto = true;

    if (role !== "nutri") {
      const { data: agendamentos } = await supabaseAdmin
        .from("agendamentos")
        .select("id")
        .eq("user_email", emailLogin)
        .eq("tipo", "consulta")
        .limit(1);
      if (agendamentos && agendamentos.length > 0) consultaAgendada = true;
    }

    const nomeExibicao = role === "nutri" ? perfilBanco?.nome || "Dra. Laís Leles" : perfilBanco?.nome;

    return NextResponse.json({
      success: true,
      token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      role,
      redirect: role === "nutri" ? "/nutri" : undefined,
      tour_oculto: tourOculto,
      user: {
        id: authUser.id,
        email: emailLogin,
        nome: nomeExibicao,
        plano: perfilBanco?.plano,
        status_assinatura: statusAssinatura,
        role,
      },
      profile: {
        ...(perfilBanco || {}),
        nome: nomeExibicao,
        email: emailLogin,
        status_assinatura: statusAssinatura,
        anamnese_concluida: anamneseConcluida,
        consulta_agendada: consultaAgendada,
        tour_oculto: tourOculto,
      },
    });
  } catch (error: unknown) {
    console.error("Erro interno na rota de login:", error);
    return NextResponse.json(
      { success: false, message: "Não foi possível entrar agora. Tente novamente em instantes." },
      { status: 500 }
    );
  }
}
