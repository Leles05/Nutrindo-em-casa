import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { ehResposta, exigirNutri, ipDaRequisicao } from "@/lib/auth";
import { limitar } from "@/lib/rateLimit";
import {
  buscarCupom,
  cupomParaPainel,
  mensagemDoStatus,
  normalizarCodigoCupom,
  statusDoCupom,
  type CupomRow,
} from "@/lib/cupons";

export const dynamic = "force-dynamic";

const naoConfigurado = () =>
  NextResponse.json({ success: false, message: "Banco de dados não configurado." }, { status: 503 });

// GET /api/cupons?codigo=XYZ  -> valida um cupom no checkout (público, com limite de tentativas)
// GET /api/cupons             -> lista completa (somente nutricionista)
export async function GET(request: Request) {
  try {
    if (!isSupabaseConfigured()) return naoConfigurado();
    const { searchParams } = new URL(request.url);
    const codigoQuery = searchParams.get("codigo");
    const supabaseAdmin = getSupabaseAdmin();

    if (codigoQuery) {
      // Evita adivinhação de códigos por força bruta
      const rl = limitar(`cupom:${ipDaRequisicao(request)}`, 20, 10 * 60 * 1000);
      if (!rl.permitido) {
        return NextResponse.json(
          { success: false, message: "Muitas tentativas. Aguarde alguns minutos." },
          { status: 429 }
        );
      }

      const cupom = await buscarCupom(supabaseAdmin, codigoQuery);
      if (!cupom) {
        return NextResponse.json({ success: false, message: "Cupom inválido ou não encontrado." }, { status: 404 });
      }

      const status = statusDoCupom(cupom);
      if (status !== "ativo") {
        return NextResponse.json({ success: false, message: mensagemDoStatus(cupom, status) }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        cupom: {
          id: cupom.id,
          codigo: cupom.codigo,
          percentual: cupom.percentual,
          dataValidade: cupom.data_validade,
          limiteUsos: cupom.limite_usos,
          usosAtuais: cupom.usos_atuais,
          ativo: cupom.ativo,
        },
      });
    }

    // Listagem completa: painel da nutricionista
    const ctx = await exigirNutri(request);
    if (ehResposta(ctx)) return ctx;

    const { data, error } = await supabaseAdmin.from("cupons").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Erro ao listar cupons:", error.message);
      return NextResponse.json({ success: false, cupons: [] }, { status: 500 });
    }
    return NextResponse.json({ success: true, cupons: (data as CupomRow[]).map(cupomParaPainel) });
  } catch (err) {
    console.error("Erro inesperado em GET /api/cupons:", err);
    return NextResponse.json({ success: false, message: "Erro interno" }, { status: 500 });
  }
}

// POST /api/cupons (cria um novo cupom) — somente nutricionista
export async function POST(request: Request) {
  try {
    const ctx = await exigirNutri(request);
    if (ehResposta(ctx)) return ctx;
    if (!isSupabaseConfigured()) return naoConfigurado();

    const { codigo, percentual, dataValidade, limiteUsos, ativo } = await request.json();

    const codigoLimpo = normalizarCodigoCupom(codigo);
    const percentualNum = Number(percentual);
    if (!codigoLimpo) {
      return NextResponse.json({ success: false, message: "Código do cupom é obrigatório." }, { status: 400 });
    }
    if (!Number.isInteger(percentualNum) || percentualNum < 1 || percentualNum > 90) {
      return NextResponse.json(
        { success: false, message: "O percentual de desconto deve ser um número inteiro entre 1% e 90%." },
        { status: 400 }
      );
    }
    const limite = limiteUsos ? Number(limiteUsos) : null;
    if (limite !== null && (!Number.isInteger(limite) || limite < 1)) {
      return NextResponse.json({ success: false, message: "O limite de usos deve ser um número inteiro maior que 0." }, { status: 400 });
    }
    const validade = dataValidade ? String(dataValidade).split("T")[0] : null;
    if (validade && !/^\d{4}-\d{2}-\d{2}$/.test(validade)) {
      return NextResponse.json({ success: false, message: "Data de validade inválida." }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (await buscarCupom(supabaseAdmin, codigoLimpo)) {
      return NextResponse.json(
        { success: false, message: `Já existe um cupom com o código "${codigoLimpo}". Escolha outro código.` },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("cupons")
      .insert([{ codigo: codigoLimpo, percentual: percentualNum, data_validade: validade, limite_usos: limite, ativo: ativo !== false }])
      .select()
      .single();

    if (error || !data) {
      console.error("Erro ao salvar cupom:", error?.message);
      return NextResponse.json({ success: false, message: "Erro ao salvar o cupom no banco de dados." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Cupom ${codigoLimpo} (${percentualNum}%) criado com sucesso!`,
      cupom: cupomParaPainel(data as CupomRow),
    });
  } catch (err) {
    console.error("Erro em POST /api/cupons:", err);
    return NextResponse.json({ success: false, message: "Erro interno" }, { status: 500 });
  }
}

// PATCH /api/cupons (ativa/desativa) — somente nutricionista
export async function PATCH(request: Request) {
  try {
    const ctx = await exigirNutri(request);
    if (ehResposta(ctx)) return ctx;
    if (!isSupabaseConfigured()) return naoConfigurado();

    const { id, codigo, ativo } = await request.json();
    const supabaseAdmin = getSupabaseAdmin();

    let alvo: CupomRow | null = null;
    if (id) {
      const { data } = await supabaseAdmin.from("cupons").select("*").eq("id", id).maybeSingle();
      alvo = (data as CupomRow) || null;
    } else if (codigo) {
      alvo = await buscarCupom(supabaseAdmin, codigo);
    } else {
      return NextResponse.json({ success: false, message: "ID ou código do cupom é obrigatório." }, { status: 400 });
    }
    if (!alvo) return NextResponse.json({ success: false, message: "Cupom não encontrado." }, { status: 404 });

    if (ativo === undefined) {
      return NextResponse.json({ success: false, message: "Nada para atualizar." }, { status: 400 });
    }

    const { data: atualizado, error } = await supabaseAdmin
      .from("cupons")
      .update({ ativo: Boolean(ativo) })
      .eq("id", alvo.id)
      .select()
      .single();

    if (error || !atualizado) {
      console.error("Erro ao atualizar cupom:", error?.message);
      return NextResponse.json({ success: false, message: "Erro ao atualizar cupom." }, { status: 500 });
    }
    return NextResponse.json({ success: true, cupom: cupomParaPainel(atualizado as CupomRow) });
  } catch (err) {
    console.error("Erro em PATCH /api/cupons:", err);
    return NextResponse.json({ success: false, message: "Erro interno" }, { status: 500 });
  }
}

// DELETE /api/cupons?id=... (exclui) — somente nutricionista
export async function DELETE(request: Request) {
  try {
    const ctx = await exigirNutri(request);
    if (ehResposta(ctx)) return ctx;
    if (!isSupabaseConfigured()) return naoConfigurado();

    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");
    if (!id) {
      try {
        id = (await request.json())?.id;
      } catch {}
    }
    if (!id) {
      return NextResponse.json({ success: false, message: "ID do cupom é obrigatório para exclusão." }, { status: 400 });
    }

    const { error } = await getSupabaseAdmin().from("cupons").delete().eq("id", id);
    if (error) {
      console.error("Erro ao excluir cupom:", error.message);
      return NextResponse.json({ success: false, message: "Erro ao excluir cupom no banco de dados." }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: "Cupom excluído com sucesso." });
  } catch (err) {
    console.error("Erro em DELETE /api/cupons:", err);
    return NextResponse.json({ success: false, message: "Erro interno" }, { status: 500 });
  }
}
