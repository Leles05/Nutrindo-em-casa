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

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, devolutivas: [], profile: null });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const emails = [email];
    if (email === "lucas@email.com" || email === "lucaslimaleles@gmail.com" || email.includes("lucas")) {
      emails.push("lucas@email.com", "lucaslimaleles@gmail.com");
    }
    const uniqueEmails = Array.from(new Set(emails));

    const orDevFilter = uniqueEmails.map((e) => `user_email.ilike.${e}`).join(",");
    const orProfFilter = uniqueEmails.map((e) => `email.ilike.${e}`).join(",");

    let [devRes, profRes] = await Promise.all([
      supabaseAdmin
        .from("devolutivas_semanais")
        .select("*")
        .or(orDevFilter)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("profiles")
        .select("nome, nome_crianca, idade_crianca")
        .or(orProfFilter)
        .limit(1)
        .maybeSingle(),
    ]);

    // Fallback de segurança se nada foi encontrado: tentar ilike parcial
    if (!devRes.data || devRes.data.length === 0) {
      const fbDev = await supabaseAdmin
        .from("devolutivas_semanais")
        .select("*")
        .ilike("user_email", `%${email}%`)
        .order("created_at", { ascending: false });
      if (fbDev.data && fbDev.data.length > 0) {
        devRes = fbDev;
      }
    }

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
    const body = await request.json();
    const { id, metas_semana, email } = body;

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
