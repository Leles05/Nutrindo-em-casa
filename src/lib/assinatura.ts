import { diasEntre, hojeSP } from "@/lib/planos";

/** Dias de tolerância após a data de renovação (3 tentativas diárias de cobrança + margem). */
export const DIAS_DE_CARENCIA_RENOVACAO = 5;

type PerfilAssinatura =
  | {
      status_assinatura?: string | null;
      acesso_ate?: string | null;
      proxima_cobranca?: string | null;
      renovacao_automatica?: boolean | null;
    }
  | null
  | undefined;

/**
 * Situação efetiva da assinatura (a que vale para liberar ou bloquear o acesso):
 *  - cancelou e o período pago acabou (acesso_ate vencido) => CANCELADO;
 *  - renovação automática atrasada além da carência (cobrança não rodou/não passou) => INADIMPLENTE.
 * A segunda regra é uma trava de segurança: mesmo se a rotina de cobrança parar, ninguém fica com acesso grátis.
 */
export function statusEfetivo(perfil: PerfilAssinatura): string {
  const status = String(perfil?.status_assinatura || "").toUpperCase();
  if (status !== "ATIVO") return status;

  if (perfil?.acesso_ate && new Date(perfil.acesso_ate) < new Date()) return "CANCELADO";

  if (perfil?.renovacao_automatica && perfil?.proxima_cobranca) {
    if (diasEntre(perfil.proxima_cobranca, hojeSP()) > DIAS_DE_CARENCIA_RENOVACAO) return "INADIMPLENTE";
  }
  return status;
}
