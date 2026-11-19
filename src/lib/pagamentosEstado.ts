/**
 * Tradução dos estados do Mercado Pago para os estados que o sistema usa nas faturas.
 * Funções puras (testadas em tests/pagamentos.test.ts).
 */

export type StatusFatura = "Pago" | "Pendente" | "Cancelado" | "Estornado" | "Recusado";

/** Estado de uma ORDEM (API de Orders) → estado da fatura. */
export function statusFaturaDoPedido(status: unknown, detalhe?: unknown): StatusFatura {
  const s = String(status || "").toLowerCase();
  const d = String(detalhe || "").toLowerCase();
  if (s === "refunded") return "Estornado";
  if (s === "processed" && (d === "accredited" || d === "partially_refunded" || d === "")) return "Pago";
  if (s === "partially_refunded") return "Pago"; // estorno parcial: o acesso continua
  if (s === "canceled" || s === "cancelled" || s === "expired") return "Cancelado";
  if (s === "failed" || s === "rejected") return "Recusado";
  return "Pendente"; // created, processing, action_required...
}

/** Estado do pagamento de um ciclo de ASSINATURA → estado da fatura. */
export function statusFaturaDaCobrancaAssinatura(statusPagamento: unknown): StatusFatura {
  const s = String(statusPagamento || "").toLowerCase();
  if (s === "approved" || s === "authorized") return "Pago";
  if (s === "rejected" || s === "cancelled" || s === "canceled") return "Recusado";
  if (s === "refunded" || s === "charged_back") return "Estornado";
  return "Pendente";
}

/** Uma fatura já paga nunca volta para "Pendente" por causa de um aviso atrasado. */
export function podeAtualizarFatura(atual: string | null | undefined, novo: StatusFatura): boolean {
  if (atual === "Pago" && novo === "Pendente") return false;
  if (atual === "Estornado" && (novo === "Pendente" || novo === "Pago")) return false;
  return true;
}
