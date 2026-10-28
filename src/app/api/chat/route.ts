import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export function extrairAnexo(textoRaw?: string | null) {
  if (!textoRaw || typeof textoRaw !== "string") {
    return { texto: "", anexo: null };
  }
  const match = textoRaw.match(/^__ANEXO_JSON__:(.*?)__FIM_ANEXO__([\s\S]*)$/);
  if (match) {
    try {
      const anexo = JSON.parse(match[1]);
      return { texto: match[2] || "", anexo };
    } catch {
      return { texto: textoRaw, anexo: null };
    }
  }
  return { texto: textoRaw, anexo: null };
}

export function serializarComAnexo(texto: string, anexo?: any) {
  const textoLimpo = (texto || "").trim();
  if (!anexo) return textoLimpo;
  return `__ANEXO_JSON__:${JSON.stringify(anexo)}__FIM_ANEXO__${textoLimpo}`;
}

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
    // Busca usando .ilike('user_email', email) ordenado por created_at ASC
    const { data, error } = await supabaseAdmin
      .from("mensagens_chat")
      .select("*")
      .ilike("user_email", email)
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("Aviso ao buscar mensagens no Supabase:", error);
      return NextResponse.json({ success: true, mensagens: [] });
    }

    // Extrai anexos serializados e padroniza remetente
    const mensagensProcessadas = (data || []).map((m: any) => {
      const { texto, anexo } = extrairAnexo(m.texto);
      const remetenteNormalizado =
        m.remetente === "nutri" ? "nutri" : "usuario";
      return {
        ...m,
        remetente: remetenteNormalizado,
        texto,
        anexo,
        arquivos: anexo ? [anexo] : undefined,
      };
    });

    return NextResponse.json({
      success: true,
      mensagens: mensagensProcessadas,
    });
  } catch (error: unknown) {
    console.error("Erro interno ao buscar mensagens de chat:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao buscar mensagens." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, texto, horario, remetente, anexo } = body;

    const emailLimpo = String(email || "").toLowerCase().trim();
    const textoLimpo = String(texto || "").trim();

    if (!emailLimpo || (!textoLimpo && !anexo)) {
      return NextResponse.json(
        { success: false, message: "E-mail e conteúdo da mensagem ou anexo são obrigatórios." },
        { status: 400 }
      );
    }

    const agoraHorario =
      horario ||
      new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    const remetenteValido = remetente === "nutri" ? "nutri" : "usuario";
    const textoFinal = serializarComAnexo(textoLimpo, anexo);

    const supabaseAdmin = getSupabaseAdmin();

    // Grava a mensagem com Service Role (Bypass RLS)
    const { data: msgUser, error: errUser } = await supabaseAdmin
      .from("mensagens_chat")
      .insert([
        {
          user_email: emailLimpo,
          remetente: remetenteValido,
          texto: textoFinal,
          horario: agoraHorario,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (errUser) {
      console.error("Erro ao inserir mensagem de chat no Supabase:", errUser);
      return NextResponse.json(
        { success: false, message: "Erro ao salvar mensagem no banco de dados." },
        { status: 500 }
      );
    }

    const respostaFormatada = {
      ...msgUser,
      remetente: remetenteValido,
      texto: textoLimpo,
      anexo: anexo || null,
      arquivos: anexo ? [anexo] : undefined,
    };

    return NextResponse.json(
      {
        success: true,
        mensagem: respostaFormatada,
        mensagemUsuario: respostaFormatada,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Erro interno ao enviar mensagem:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao processar mensagem." },
      { status: 500 }
    );
  }
}
