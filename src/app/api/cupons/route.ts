import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface CupomDados {
  id?: string;
  codigo: string;
  percentual: number;
  dataValidade: string | null;
  limiteUsos: number | null;
  usosAtuais: number;
  ativo: boolean;
  criadoEm: string;
}

function obterDataHojeSP(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatarDataBR(dataYmd: string): string {
  if (!dataYmd) return "";
  const limpo = dataYmd.split("T")[0];
  const [ano, mes, dia] = limpo.split("-");
  if (dia && mes && ano) return `${dia}/${mes}/${ano}`;
  return dataYmd;
}

function calcularStatusCupom(cupom: CupomDados, hojeSP: string): "ativo" | "expirado" | "esgotado" | "desativado" {
  if (!cupom.ativo) return "desativado";
  if (cupom.dataValidade && hojeSP > cupom.dataValidade.split("T")[0]) return "expirado";
  if (cupom.limiteUsos && cupom.limiteUsos > 0 && cupom.usosAtuais >= cupom.limiteUsos) return "esgotado";
  return "ativo";
}

// GET /api/cupons (Lista todos os cupons ou valida um código específico via ?codigo=XYZ)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const codigoQuery = searchParams.get("codigo");
    const supabaseAdmin = getSupabaseAdmin();

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: false,
        message: "Banco de dados não configurado.",
      }, { status: 503 });
    }

    const hojeSP = obterDataHojeSP();

    // Se houver parâmetro `codigo`, faz a validação para o checkout
    if (codigoQuery) {
      const codigoNormalizado = codigoQuery.trim().toUpperCase();

      const { data: rows, error } = await supabaseAdmin
        .from("respostas_rapidas_nutri")
        .select("*")
        .eq("categoria", "CUPOM_DESCONTO")
        .ilike("titulo", codigoNormalizado);

      if (error) {
        console.error("Erro ao buscar cupom no Supabase:", error);
        return NextResponse.json({ success: false, message: "Erro ao validar cupom." }, { status: 500 });
      }

      if (!rows || rows.length === 0) {
        return NextResponse.json({
          success: false,
          message: "Cupom inválido ou não encontrado.",
        }, { status: 404 });
      }

      const row = rows[0];
      let conteudo: CupomDados;
      try {
        conteudo = typeof row.texto === "string" ? JSON.parse(row.texto) : row.texto;
      } catch {
        return NextResponse.json({ success: false, message: "Estrutura do cupom corrompida." }, { status: 500 });
      }

      // Validação 1: Ativo
      if (conteudo.ativo === false) {
        return NextResponse.json({
          success: false,
          message: "Este cupom está desativado.",
        }, { status: 400 });
      }

      // Validação 2: Data de Validade
      if (conteudo.dataValidade) {
        const dataValidadeLimpa = conteudo.dataValidade.split("T")[0];
        if (hojeSP > dataValidadeLimpa) {
          const dataBR = formatarDataBR(dataValidadeLimpa);
          return NextResponse.json({
            success: false,
            message: `Este cupom expirou em ${dataBR}`,
          }, { status: 400 });
        }
      }

      // Validação 3: Limite de Usos
      const limite = conteudo.limiteUsos ? Number(conteudo.limiteUsos) : 0;
      const usos = conteudo.usosAtuais ? Number(conteudo.usosAtuais) : 0;
      if (limite > 0 && usos >= limite) {
        return NextResponse.json({
          success: false,
          message: "Este cupom atingiu o limite máximo de usos",
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        cupom: {
          id: row.id,
          codigo: conteudo.codigo,
          percentual: conteudo.percentual,
          dataValidade: conteudo.dataValidade,
          limiteUsos: conteudo.limiteUsos,
          usosAtuais: usos,
          ativo: conteudo.ativo,
        },
      });
    }

    // Listagem completa para o painel da Nutri
    const { data: rows, error } = await supabaseAdmin
      .from("respostas_rapidas_nutri")
      .select("*")
      .eq("categoria", "CUPOM_DESCONTO")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao listar cupons:", error);
      return NextResponse.json({ success: false, cupons: [] }, { status: 500 });
    }

    const cupons = (rows || []).map((r) => {
      let conteudo: any = {};
      try {
        conteudo = typeof r.texto === "string" ? JSON.parse(r.texto) : r.texto;
      } catch {}

      const cupomObj: CupomDados = {
        id: r.id,
        codigo: (conteudo.codigo || r.titulo || "").toUpperCase(),
        percentual: Number(conteudo.percentual || 0),
        dataValidade: conteudo.dataValidade || null,
        limiteUsos: conteudo.limiteUsos ? Number(conteudo.limiteUsos) : null,
        usosAtuais: Number(conteudo.usosAtuais || 0),
        ativo: conteudo.ativo !== false,
        criadoEm: conteudo.criadoEm || r.created_at || new Date().toISOString(),
      };

      return {
        ...cupomObj,
        status: calcularStatusCupom(cupomObj, hojeSP),
      };
    });

    return NextResponse.json({
      success: true,
      cupons,
    });
  } catch (err: any) {
    console.error("Erro inesperado em GET /api/cupons:", err);
    return NextResponse.json({ success: false, message: err?.message || "Erro interno" }, { status: 500 });
  }
}

// POST /api/cupons (Cria um novo cupom)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { codigo, percentual, dataValidade, limiteUsos, ativo } = body;

    const codigoLimpo = String(codigo || "").trim().toUpperCase();
    const percentualNum = Number(percentual);

    if (!codigoLimpo) {
      return NextResponse.json({ success: false, message: "Código do cupom é obrigatório." }, { status: 400 });
    }

    if (isNaN(percentualNum) || percentualNum < 1 || percentualNum > 90) {
      return NextResponse.json({
        success: false,
        message: "O percentual de desconto deve ser entre 1% e 90%.",
      }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Verifica se já existe cupom com o mesmo código
    const { data: existente } = await supabaseAdmin
      .from("respostas_rapidas_nutri")
      .select("id")
      .eq("categoria", "CUPOM_DESCONTO")
      .ilike("titulo", codigoLimpo)
      .maybeSingle();

    if (existente) {
      return NextResponse.json({
        success: false,
        message: `Já existe um cupom com o código "${codigoLimpo}". Escolha outro código.`,
      }, { status: 400 });
    }

    const novoCupomDados: CupomDados = {
      codigo: codigoLimpo,
      percentual: percentualNum,
      dataValidade: dataValidade ? String(dataValidade).split("T")[0] : null,
      limiteUsos: limiteUsos ? Number(limiteUsos) : null,
      usosAtuais: 0,
      ativo: ativo !== false,
      criadoEm: new Date().toISOString(),
    };

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("respostas_rapidas_nutri")
      .insert([
        {
          categoria: "CUPOM_DESCONTO",
          titulo: codigoLimpo,
          texto: JSON.stringify(novoCupomDados),
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertErr) {
      console.error("Erro ao salvar cupom no Supabase:", insertErr);
      return NextResponse.json({ success: false, message: "Erro ao persistir cupom no banco de dados." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Cupom ${codigoLimpo} (${percentualNum}%) criado com sucesso!`,
      cupom: {
        id: inserted.id,
        ...novoCupomDados,
        status: novoCupomDados.ativo ? "ativo" : "desativado",
      },
    });
  } catch (err: any) {
    console.error("Erro em POST /api/cupons:", err);
    return NextResponse.json({ success: false, message: err?.message || "Erro interno" }, { status: 500 });
  }
}

// PATCH /api/cupons (Ativa/Desativa, incrementa uso ou atualiza dados)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, codigo, ativo, incrementarUso } = body;

    const supabaseAdmin = getSupabaseAdmin();
    let query = supabaseAdmin.from("respostas_rapidas_nutri").select("*").eq("categoria", "CUPOM_DESCONTO");

    if (id) {
      query = query.eq("id", id);
    } else if (codigo) {
      query = query.ilike("titulo", String(codigo).trim().toUpperCase());
    } else {
      return NextResponse.json({ success: false, message: "ID ou código do cupom é obrigatório." }, { status: 400 });
    }

    const { data: rows, error: findErr } = await query;
    if (findErr || !rows || rows.length === 0) {
      return NextResponse.json({ success: false, message: "Cupom não encontrado." }, { status: 404 });
    }

    const targetRow = rows[0];
    let conteudo: CupomDados;
    try {
      conteudo = typeof targetRow.texto === "string" ? JSON.parse(targetRow.texto) : targetRow.texto;
    } catch {
      return NextResponse.json({ success: false, message: "Dados do cupom corrompidos." }, { status: 500 });
    }

    if (ativo !== undefined) {
      conteudo.ativo = Boolean(ativo);
    }

    if (incrementarUso) {
      conteudo.usosAtuais = (Number(conteudo.usosAtuais) || 0) + 1;
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from("respostas_rapidas_nutri")
      .update({
        texto: JSON.stringify(conteudo),
      })
      .eq("id", targetRow.id)
      .select()
      .single();

    if (updateErr) {
      console.error("Erro ao atualizar cupom:", updateErr);
      return NextResponse.json({ success: false, message: "Erro ao atualizar cupom." }, { status: 500 });
    }

    const hojeSP = obterDataHojeSP();
    const status = calcularStatusCupom(conteudo, hojeSP);

    return NextResponse.json({
      success: true,
      cupom: {
        id: updated.id,
        ...conteudo,
        status,
      },
    });
  } catch (err: any) {
    console.error("Erro em PATCH /api/cupons:", err);
    return NextResponse.json({ success: false, message: err?.message || "Erro interno" }, { status: 500 });
  }
}

// DELETE /api/cupons (Exclui um cupom)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ success: false, message: "ID do cupom é obrigatório para exclusão." }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from("respostas_rapidas_nutri")
      .delete()
      .eq("categoria", "CUPOM_DESCONTO")
      .eq("id", id);

    if (error) {
      console.error("Erro ao excluir cupom:", error);
      return NextResponse.json({ success: false, message: "Erro ao excluir cupom no banco de dados." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Cupom excluído com sucesso.",
    });
  } catch (err: any) {
    console.error("Erro em DELETE /api/cupons:", err);
    return NextResponse.json({ success: false, message: err?.message || "Erro interno" }, { status: 500 });
  }
}

