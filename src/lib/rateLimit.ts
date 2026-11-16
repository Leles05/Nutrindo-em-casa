/**
 * Limitador de tentativas simples em memória (janela deslizante).
 * Em ambiente serverless cada instância tem sua própria memória, então isto é uma proteção
 * básica contra força bruta. O Supabase Auth também aplica limites próprios por IP.
 * Para proteção forte e global, trocar por Upstash Redis / tabela no Postgres.
 */
const tentativas = new Map<string, number[]>();

export function limitar(chave: string, max: number, janelaMs: number): { permitido: boolean; retryAfterSeg: number } {
  const agora = Date.now();
  const recentes = (tentativas.get(chave) || []).filter((t) => agora - t < janelaMs);
  if (recentes.length >= max) {
    tentativas.set(chave, recentes);
    return { permitido: false, retryAfterSeg: Math.ceil((janelaMs - (agora - recentes[0])) / 1000) };
  }
  recentes.push(agora);
  tentativas.set(chave, recentes);
  // limpeza ocasional para não crescer indefinidamente
  if (tentativas.size > 5000) {
    for (const [k, v] of tentativas) if (!v.some((t) => agora - t < janelaMs)) tentativas.delete(k);
  }
  return { permitido: true, retryAfterSeg: 0 };
}

/** Só consulta (não registra): true se a chave já estourou o limite na janela. */
export function excedeu(chave: string, max: number, janelaMs: number): { bloqueado: boolean; retryAfterSeg: number } {
  const agora = Date.now();
  const recentes = (tentativas.get(chave) || []).filter((t) => agora - t < janelaMs);
  if (recentes.length >= max) {
    return { bloqueado: true, retryAfterSeg: Math.ceil((janelaMs - (agora - recentes[0])) / 1000) };
  }
  return { bloqueado: false, retryAfterSeg: 0 };
}

/** Registra uma tentativa FALHA (logins corretos não consomem o limite). */
export function registrarFalha(chave: string): void {
  const lista = tentativas.get(chave) || [];
  lista.push(Date.now());
  tentativas.set(chave, lista);
}
