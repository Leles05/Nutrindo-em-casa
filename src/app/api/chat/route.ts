import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

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
    const { data, error } = await supabaseAdmin
      .from("mensagens_chat")
      .select("*")
      .eq("user_email", email)
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("Aviso ao buscar mensagens no Supabase:", error);
      return NextResponse.json({ success: true, mensagens: [] });
    }

    return NextResponse.json({
      success: true,
      mensagens: data || [],
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
    const { email, texto, horario } = body;

    const emailLimpo = String(email || "").toLowerCase().trim();
    const textoLimpo = String(texto || "").trim();

    if (!emailLimpo || !textoLimpo) {
      return NextResponse.json(
        { success: false, message: "E-mail e texto da mensagem são obrigatórios." },
        { status: 400 }
      );
    }

    const agoraHorario =
      horario ||
      new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Grava a mensagem enviada pelo responsável/paciente com Service Role (Bypass RLS)
    const { data: msgUser, error: errUser } = await supabaseAdmin
      .from("mensagens_chat")
      .insert([
        {
          user_email: emailLimpo,
          remetente: "usuario",
          texto: textoLimpo,
          horario: agoraHorario,
        },
      ])
      .select()
      .single();

    if (errUser) {
      console.error("Erro ao inserir mensagem de usuário no Supabase:", errUser);
      return NextResponse.json(
        { success: false, message: "Erro ao salvar mensagem no banco de dados." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        mensagem: msgUser,
        mensagemUsuario: msgUser,
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
