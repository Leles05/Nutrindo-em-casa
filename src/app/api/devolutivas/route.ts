import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { ehResposta, exigirUsuario, resolverEmailAlvo } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const ctx = await exigirUsuario(request);
    if (ehResposta(ctx)) return ctx;
    const { searchParams } = new URL(request.url);
    const email = resolverEmailAlvo(ctx, searchParams.get("email"));
    if (ehResposta(email)) return email;

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, devolutivas: [], profile: null });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Consultas exatas por e-mail (sem filtros montados por texto e sem busca parcial)
    const [devRes, profRes] = await Promise.all([
      supabaseAdmin
        .from("devolutivas_semanais")
        .select("*")
        .eq("user_email", email)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("profiles")
        .select("nome, nome_crianca, idade_crianca")
        .eq("email", email)
        .maybeSingle(),
    ]);

    if (devRes.error) {
      console.warn("Aviso ao buscar devolutivas:", devRes.error);
    }

    return NextResponse.json({
      success: true,
      devolutivas: devRes.data || [],
      profile: profRes.data || null,
    });
  } catch (error: unknown) {
    console.error("Erro interno ao buscar devolutivas:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao buscar orientações." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const ctx = await exigirUsuario(request);
    if (ehResposta(ctx)) return ctx;

    const body = await request.json();
    const { id, metas_semana } = body;

    if (!id || !metas_semana || !Array.isArray(metas_semana)) {
      return NextResponse.json(
        { success: false, message: "Dados incompletos para atualização de metas." },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Só o dono da devolutiva (ou a nutricionista) pode alterar as metas
    const { data: existente } = await supabaseAdmin
      .from("devolutivas_semanais")
      .select("id, user_email")
      .eq("id", id)
      .maybeSingle();

    if (!existente) {
      return NextResponse.json({ success: false, message: "Orientação não encontrada." }, { status: 404 });
    }
    if (ctx.role !== "nutri" && String(existente.user_email).toLowerCase() !== ctx.email) {
      return NextResponse.json({ success: false, message: "Sem permissão." }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from("devolutivas_semanais")
      .update({ metas_semana })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar metas da devolutiva:", error);
      return NextResponse.json(
        { success: false, message: "Erro ao salvar metas." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, devolutiva: data });
  } catch (error: unknown) {
    console.error("Erro interno ao atualizar meta:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}
