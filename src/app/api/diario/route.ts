import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { ehResposta, exigirUsuario, resolverEmailAlvo } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const ctx = await exigirUsuario(request);
    if (ehResposta(ctx)) return ctx;
    const { searchParams } = new URL(request.url);
    const email = resolverEmailAlvo(ctx, searchParams.get("email"));
    if (ehResposta(email)) return email;

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

    const refeicoesTratadas = (data || []).map((m: any) => {
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

    return NextResponse.json({
      success: true,
      refeicoes: refeicoesTratadas,
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
    const ctx = await exigirUsuario(request);
    if (ehResposta(ctx)) return ctx;
    const body = await request.json();
    const {
      email,
      alimento,
      refeicao,
      degrau,
      observacoes = "",
      foto = null,
    } = body;

    const alvo = resolverEmailAlvo(ctx, email);
    if (ehResposta(alvo)) return alvo;
    const emailLimpo = alvo;
    const alimentoLimpo = String(alimento || "").trim();
    const refeicaoLimpa = String(refeicao || "").trim();
    const degrauLimpo = String(degrau || "").toLowerCase().trim();
    const fotoLimpa = typeof foto === "string" && foto.startsWith("data:image/") ? foto : null;
    if (fotoLimpa && fotoLimpa.length > 3_000_000) {
      return NextResponse.json(
        { success: false, message: "A foto é muito grande. Envie uma imagem de até 2 MB." },
        { status: 413 }
      );
    }

    if (!emailLimpo || !alimentoLimpo || !refeicaoLimpa || !degrauLimpo) {
      return NextResponse.json(
        { success: false, message: "Todos os campos obrigatórios devem ser preenchidos." },
        { status: 400 }
      );
    }

    const degrausValidos = ["tolerou", "cheirou", "tocou", "provou", "comeu"];
    const degrauNormalizado = degrausValidos.includes(degrauLimpo) ? degrauLimpo : "tolerou";
    const supabaseAdmin = getSupabaseAdmin();
    const dataIso = new Date().toISOString();
    const obsTexto = String(observacoes || "").trim();

    let savedItem: any = null;

    // Tentativa 1: Inserir com coluna 'foto' dedicada
    if (fotoLimpa) {
      const { data, error } = await supabaseAdmin
        .from("diario_refeicoes")
        .insert([
          {
            user_email: emailLimpo,
            alimento: alimentoLimpo,
            refeicao: refeicaoLimpa,
            degrau: degrauNormalizado,
            observacoes: obsTexto,
            foto: fotoLimpa,
            data_registro: dataIso,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        savedItem = data;
      }
    }

    // Tentativa 2: Fallback se a coluna foto não existir ainda na tabela remota do Supabase
    if (!savedItem) {
      const obsComFoto = fotoLimpa ? `[FOTO:${fotoLimpa}]\n${obsTexto}` : obsTexto;
      const { data, error } = await supabaseAdmin
        .from("diario_refeicoes")
        .insert([
          {
            user_email: emailLimpo,
            alimento: alimentoLimpo,
            refeicao: refeicaoLimpa,
            degrau: degrauNormalizado,
            observacoes: obsComFoto,
            data_registro: dataIso,
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
      savedItem = data;
    }

    // Normaliza retorno para o cliente
    const itemNormalizado = {
      ...savedItem,
      foto: fotoLimpa || savedItem?.foto || null,
      observacoes: obsTexto,
    };

    return NextResponse.json({
      success: true,
      message: "Refeição registrada com sucesso no Diário Alimentar.",
      refeicao: itemNormalizado,
    });
  } catch (error: unknown) {
    console.error("Erro interno ao salvar refeição no diário:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao registrar refeição." },
      { status: 500 }
    );
  }
}
