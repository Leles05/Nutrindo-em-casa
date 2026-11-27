import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Versão vigente dos Termos de Uso e da Política de Privacidade.
 * AO ALTERAR O TEXTO DOS TERMOS, SUBA ESTA VERSÃO: todos os clientes voltam a ver a janela de aceite.
 */
export const TERMOS_VERSAO = "3.10";
export const TERMOS_DATA = "Novembro de 2026";

export interface DadosAceite {
  email: string;
  versao: string;
  consentimentoSaude: boolean;
  renovacaoAutomatica: boolean;
  origem: "checkout" | "app";
  ip?: string | null;
  userAgent?: string | null;
}

/**
 * Registra o aceite: uma linha imutável na trilha de auditoria (prova do consentimento)
 * e atualiza a situação atual no perfil. Retorna false se a trilha não pôde ser gravada.
 */
export async function registrarAceite(admin: SupabaseClient, d: DadosAceite): Promise<boolean> {
  const { error } = await admin.from("aceites_termos").insert({
    user_email: d.email,
    versao: d.versao,
    termos: true,
    privacidade: true,
    consentimento_saude: d.consentimentoSaude,
    renovacao_automatica: d.renovacaoAutomatica,
    origem: d.origem,
    ip: d.ip || null,
    user_agent: d.userAgent ? d.userAgent.slice(0, 400) : null,
  });
  if (error) {
    console.error("Falha ao registrar aceite dos termos:", error.message);
    return false;
  }

  const agora = new Date().toISOString();
  const atualizacao: Record<string, string> = { termos_versao: d.versao, termos_aceito_em: agora };
  if (d.consentimentoSaude) atualizacao.consentimento_saude_em = agora;
  const { error: perfilErr } = await admin.from("profiles").update(atualizacao).eq("email", d.email);
  if (perfilErr) console.error("Falha ao atualizar o aceite no perfil:", perfilErr.message);
  return true;
}

/** O cliente precisa ver a janela de aceite? (versão antiga/ausente ou sem consentimento de saúde) */
export function precisaAceitar(perfil: { termos_versao?: string | null; consentimento_saude_em?: string | null } | null | undefined): boolean {
  if (!perfil) return true;
  return perfil.termos_versao !== TERMOS_VERSAO || !perfil.consentimento_saude_em;
}
