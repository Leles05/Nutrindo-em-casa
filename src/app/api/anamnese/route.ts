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
      .from("anamneses")
      .select("*")
      .eq("user_email", email)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 é 'nenhuma linha encontrada'
      console.warn("Aviso ao buscar anamnese no Supabase:", error);
    }

    return NextResponse.json({
      success: true,
      anamnese: data || null,
    });
  } catch (error: unknown) {
    console.error("Erro interno ao buscar anamnese:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao buscar anamnese." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, respostas, concluida = true } = body;

    const emailLimpo = String(email || "").toLowerCase().trim();

    if (!emailLimpo) {
      return NextResponse.json(
        { success: false, message: "E-mail é obrigatório para registrar a anamnese." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("anamneses")
      .upsert(
        {
          user_email: emailLimpo,
          respostas: respostas || {},
          concluida: Boolean(concluida),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_email" }
      )
      .select()
      .single();

    if (error) {
      console.error("Erro ao salvar anamnese no Supabase:", error);
      return NextResponse.json(
        { success: false, message: "Erro ao persistir anamnese no banco de dados." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Anamnese salva com sucesso no prontuário clínico.",
      anamnese: data,
    });
  } catch (error: unknown) {
    console.error("Erro interno ao salvar anamnese:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao processar anamnese." },
      { status: 500 }
    );
  }
}
