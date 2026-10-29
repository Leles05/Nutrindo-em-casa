import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export interface AulaCurso {
  id: number;
  titulo: string;
  duracao: string;
  descricao: string;
  video_url: string;
  material_anexo?: {
    nome: string;
    tipo: string;
    url: string;
    tamanho?: string;
  } | null;
}

export interface ModuloCurso {
  id: string;
  titulo: string;
  descricao?: string;
  aulas: AulaCurso[];
}

export const ESTRUTURA_CURSO_PADRAO: ModuloCurso[] = [
  {
    id: "mod-1",
    titulo: "Módulo 1: Fundamentos da Seletividade Alimentar",
    descricao: "Bases da Escalada do Comer e primeiras abordagens sem conflito",
    aulas: [
      {
        id: 1,
        titulo: "Terapia Alimentar Descomplicada",
        duracao: "05:20",
        descricao: "Compreenda as bases da Escalada do Comer e como a aproximação gradual diminui a ansiedade da criança à mesa.",
        video_url: "https://www.youtube.com/embed/aqz-KE-bpKQ?rel=0&modestbranding=1",
        material_anexo: null,
      },
      {
        id: 2,
        titulo: "Sinais de Alerta na Alimentação",
        duracao: "12:45",
        descricao: "Aprenda a diferenciar uma fase passageira de desinteresse de uma verdadeira sensibilidade tátil e olfativa.",
        video_url: "https://www.youtube.com/embed/aqz-KE-bpKQ?rel=0&modestbranding=1",
        material_anexo: null,
      },
      {
        id: 3,
        titulo: "Manejo da Recusa e Comunicação",
        duracao: "18:30",
        descricao: "Ferramentas práticas de diálogo para evitar chantagens e barganhas na hora das principais refeições.",
        video_url: "https://www.youtube.com/embed/aqz-KE-bpKQ?rel=0&modestbranding=1",
        material_anexo: null,
      },
      {
        id: 4,
        titulo: "Construindo o Prato Seguro",
        duracao: "14:10",
        descricao: "Como combinar alimentos de conforto com novos alimentos de teste no mesmo prato sem gerar rejeição imediata.",
        video_url: "https://www.youtube.com/embed/aqz-KE-bpKQ?rel=0&modestbranding=1",
        material_anexo: null,
      },
    ],
  },
  {
    id: "mod-2",
    titulo: "Módulo 2: Prática na Cozinha e Novas Texturas",
    descricao: "Técnicas de exposição sensorial e transição de texturas no dia a dia",
    aulas: [
      {
        id: 5,
        titulo: "Sensibilidade Tátil e o Contato com o Alimento",
        duracao: "10:15",
        descricao: "Estratégias lúdicas para familiarizar a criança com o toque dos alimentos sem obrigação de ingestão.",
        video_url: "https://www.youtube.com/embed/aqz-KE-bpKQ?rel=0&modestbranding=1",
        material_anexo: null,
      },
      {
        id: 6,
        titulo: "Pontes Alimentares: Da Conforto à Novidade",
        duracao: "15:40",
        descricao: "Aprenda a conectar os alimentos preferidos da criança com novas opções nutricionalmente ricas.",
        video_url: "https://www.youtube.com/embed/aqz-KE-bpKQ?rel=0&modestbranding=1",
        material_anexo: null,
      },
    ],
  },
];

// GET /api/cursos - Retorna a árvore completa de módulos e aulas
export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        modulos: ESTRUTURA_CURSO_PADRAO,
      });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("respostas_rapidas_nutri")
      .select("*")
      .eq("categoria", "ESTRUTURA_CURSO")
      .eq("titulo", "ESTRUTURA_MODULOS_AULAS")
      .maybeSingle();

    if (error || !data || !data.texto) {
      return NextResponse.json({
        success: true,
        modulos: ESTRUTURA_CURSO_PADRAO,
      });
    }

    let modulos: ModuloCurso[] = [];
    try {
      modulos = typeof data.texto === "string" ? JSON.parse(data.texto) : data.texto;
    } catch {
      modulos = ESTRUTURA_CURSO_PADRAO;
    }

    if (!Array.isArray(modulos) || modulos.length === 0) {
      modulos = ESTRUTURA_CURSO_PADRAO;
    }

    return NextResponse.json({
      success: true,
      modulos,
    });
  } catch (err: any) {
    console.error("Erro em GET /api/cursos:", err);
    return NextResponse.json({
      success: true,
      modulos: ESTRUTURA_CURSO_PADRAO,
    });
  }
}

// POST /api/cursos - Salva a estrutura de módulos e aulas gerenciada pela Nutri
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { modulos } = body;

    if (!Array.isArray(modulos)) {
      return NextResponse.json(
        { success: false, message: "Lista de módulos inválida." },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        modulos,
        message: "Estrutura do curso atualizada localmente.",
      });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Remove registro anterior para garantir consistência única
    await supabaseAdmin
      .from("respostas_rapidas_nutri")
      .delete()
      .eq("categoria", "ESTRUTURA_CURSO")
      .eq("titulo", "ESTRUTURA_MODULOS_AULAS");

    const { error: insertErr } = await supabaseAdmin
      .from("respostas_rapidas_nutri")
      .insert([
        {
          categoria: "ESTRUTURA_CURSO",
          titulo: "ESTRUTURA_MODULOS_AULAS",
          texto: JSON.stringify(modulos),
          created_at: new Date().toISOString(),
        },
      ]);

    if (insertErr) {
      console.error("Erro ao salvar estrutura de cursos no Supabase:", insertErr);
      return NextResponse.json(
        { success: false, message: "Erro ao salvar no banco de dados." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      modulos,
      message: "Estrutura do curso salva com sucesso!",
    });
  } catch (err: any) {
    console.error("Erro em POST /api/cursos:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Erro interno" },
      { status: 500 }
    );
  }
}

