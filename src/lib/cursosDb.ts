import type { SupabaseClient } from "@supabase/supabase-js";

/** Categorias antigas que ficavam misturadas em respostas_rapidas_nutri e agora têm tabela própria. */
const CATEGORIAS_LEGADAS = new Set(["CUPOM_DESCONTO", "ESTRUTURA_CURSO", "CURSO_MATERIAL_AULA"]);

/** Respostas rápidas "de verdade" (sem cupons/cursos que migraram para tabelas próprias). */
export function soRespostasRapidas<T extends { categoria?: string }>(linhas: T[] | null | undefined): T[] {
  return (linhas || []).filter((r) => !CATEGORIAS_LEGADAS.has(String(r.categoria)));
}

/** Materiais de aula no formato esperado pela tela (aula_id, titulo, descricao, video_url, material_anexo...). */
export async function lerMateriaisAulas(admin: SupabaseClient) {
  const { data, error } = await admin.from("materiais_aulas").select("*").order("aula_id", { ascending: true });
  if (error) {
    console.warn("Aviso ao ler materiais de aula:", error.message);
    return [];
  }
  return (data || []).map((m: any) => ({
    aula_id: m.aula_id,
    titulo: m.titulo || "",
    descricao: m.descricao || "",
    video_url: m.video_url || "",
    material_anexo: m.material_anexo || null,
    atualizado_em: m.atualizado_em,
  }));
}
