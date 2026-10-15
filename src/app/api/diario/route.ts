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
      .from("diario_refeicoes")
      .select("*")
      .eq("user_email", email)
      .order("data_registro", { ascending: false });

    if (error) {
      console.warn("Aviso ao buscar diário no Supabase:", error);
      return NextResponse.json({ success: true, refeicoes: [] });
    }

    return NextResponse.json({
      success: true,
      refeicoes: data || [],
    });
  } catch (error: unknown) {
    console.error("Erro interno ao buscar diário alimentar:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao buscar refeições." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      alimento,
      refeicao,
      degrau,
      observacoes = "",
    } = body;

    const emailLimpo = String(email || "").toLowerCase().trim();
    const alimentoLimpo = String(alimento || "").trim();
    const refeicaoLimpa = String(refeicao || "").trim();
    const degrauLimpo = String(degrau || "").toLowerCase().trim();

    if (!emailLimpo || !alimentoLimpo || !refeicaoLimpa || !degrauLimpo) {
      return NextResponse.json(
        { success: false, message: "Todos os campos obrigatórios devem ser preenchidos." },
        { status: 400 }
      );
    }

    const degrausValidos = ["tolerou", "cheirou", "tocou", "provou", "comeu"];
    const degrauNormalizado = degrausValidos.includes(degrauLimpo) ? degrauLimpo : "tolerou";

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("diario_refeicoes")
      .insert([
        {
          user_email: emailLimpo,
          alimento: alimentoLimpo,
          refeicao: refeicaoLimpa,
          degrau: degrauNormalizado,
          observacoes: String(observacoes || "").trim(),
          data_registro: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Erro ao salvar refeição no Supabase:", error);
      return NextResponse.json(
        { success: false, message: "Erro ao persistir refeição no banco." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Refeição registrada com sucesso no Diário Alimentar.",
      refeicao: data,
    });
  } catch (error: unknown) {
    console.error("Erro interno ao salvar refeição no diário:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao registrar refeição." },
      { status: 500 }
    );
  }
}
