/**
 * Duplos de teste: banco em memória (com a parte da API do Supabase que o webhook usa) e Mercado Pago simulado.
 * Servem para provar regras que o ambiente de teste do Mercado Pago não consegue reproduzir
 * (estorno de assinatura, avisos repetidos ou adiantados, avisos perdidos).
 */
type Linha = Record<string, unknown>;

export function bancoFalso(tabelas: Record<string, Linha[]>) {
  let seq = 1000;
  const from = (tabela: string) => {
    tabelas[tabela] ||= [];
    const q: { op: "select" | "update" | "insert" | "delete"; dados: Linha | null; filtros: Array<(r: Linha) => boolean>; devolve: boolean } = {
      op: "select",
      dados: null,
      filtros: [],
      devolve: false,
    };
    const casa = (r: Linha) => q.filtros.every((f) => f(r));
    const executar = () => {
      const linhas = tabelas[tabela];
      if (q.op === "insert") {
        linhas.push({ id: seq++, ...(q.dados as Linha) });
        return { data: null, error: null };
      }
      if (q.op === "update") {
        const alvo = linhas.filter(casa);
        for (const r of alvo) Object.assign(r, q.dados);
        return { data: q.devolve ? alvo.map((r) => ({ ...r })) : null, error: null };
      }
      if (q.op === "delete") {
        tabelas[tabela] = linhas.filter((r) => !casa(r));
        return { data: null, error: null };
      }
      return { data: linhas.filter(casa).map((r) => ({ ...r })), error: null };
    };
    const b: Record<string, unknown> = {
      select: () => {
        if (q.op === "update") q.devolve = true;
        return b;
      },
      update: (d: Linha) => {
        q.op = "update";
        q.dados = d;
        return b;
      },
      insert: (d: Linha) => {
        q.op = "insert";
        q.dados = d;
        return b;
      },
      delete: () => {
        q.op = "delete";
        return b;
      },
      eq: (c: string, v: unknown) => {
        q.filtros.push((r) => r[c] === v);
        return b;
      },
      lt: (c: string, v: string) => {
        q.filtros.push((r) => String(r[c] ?? "") < v);
        return b;
      },
      or: () => b, // a reserva de envio de e-mail: nos testes sempre libera
      not: () => b,
      is: () => b,
      limit: () => b,
      maybeSingle: async () => ({ data: (executar().data as Linha[])[0] ?? null, error: null }),
      then: (ok: (v: unknown) => unknown, err: (e: unknown) => unknown) => Promise.resolve(executar()).then(ok, err),
    };
    return b;
  };
  const convites: string[] = [];
  const admin = {
    from,
    auth: { admin: { inviteUserByEmail: async (email: string) => (convites.push(email), { error: null }) } },
  };
  return { admin, tabelas, convites };
}

export interface MercadoPagoFalso {
  ordens: Record<string, Linha>;
  cobrancas: Record<string, Linha>;
  assinaturas: Record<string, Linha>;
  chamadas: Array<{ metodo: string; url: string; corpo?: unknown }>;
  emails: Array<{ para: string; assunto: string }>;
  restaurar: () => void;
}

/** Substitui o fetch global: responde como o Mercado Pago (e o Resend) com os dados informados. */
export function mercadoPagoFalso(dados: Partial<Pick<MercadoPagoFalso, "ordens" | "cobrancas" | "assinaturas">>): MercadoPagoFalso {
  const original = globalThis.fetch;
  const mp: MercadoPagoFalso = {
    ordens: dados.ordens || {},
    cobrancas: dados.cobrancas || {},
    assinaturas: dados.assinaturas || {},
    chamadas: [],
    emails: [],
    restaurar: () => {
      globalThis.fetch = original;
    },
  };
  const resposta = (status: number, corpo: unknown) =>
    new Response(JSON.stringify(corpo), { status, headers: { "content-type": "application/json" } });

  globalThis.fetch = (async (entrada: string | URL | Request, init?: RequestInit) => {
    const url = String(entrada instanceof Request ? entrada.url : entrada);
    const metodo = (init?.method || "GET").toUpperCase();
    const corpo = init?.body ? JSON.parse(String(init.body)) : undefined;

    if (url.startsWith("https://api.resend.com")) {
      mp.emails.push({ para: corpo.to[0], assunto: corpo.subject });
      return resposta(200, { id: "email-falso" });
    }
    mp.chamadas.push({ metodo, url: url.replace("https://api.mercadopago.com", ""), corpo });
    const rota = url.replace("https://api.mercadopago.com", "");
    let m: RegExpMatchArray | null;
    if ((m = rota.match(/^\/v1\/orders\/([^/]+)$/)) && metodo === "GET") return mp.ordens[m[1]] ? resposta(200, mp.ordens[m[1]]) : resposta(404, {});
    if ((m = rota.match(/^\/authorized_payments\/search\?preapproval_id=([^&]+)$/)) && metodo === "GET") {
      // como o Mercado Pago de verdade: a busca NÃO devolve o "id" da cobrança, só o pagamento
      const lista = Object.values(mp.cobrancas)
        .filter((c) => c.preapproval_id === decodeURIComponent(m![1]))
        .map((c) => {
          const { id: _id, ...resto } = c;
          void _id;
          return resto;
        });
      return resposta(200, { results: lista });
    }
    if ((m = rota.match(/^\/authorized_payments\/([^/]+)$/)) && metodo === "GET") return mp.cobrancas[m[1]] ? resposta(200, mp.cobrancas[m[1]]) : resposta(404, {});
    if ((m = rota.match(/^\/preapproval\/([^/]+)$/))) {
      const a = mp.assinaturas[m[1]];
      if (!a) return resposta(404, {});
      if (metodo === "PUT") {
        const novo = corpo as Linha;
        if (novo.status) a.status = novo.status;
        if (novo.auto_recurring) a.auto_recurring = { ...(a.auto_recurring as Linha), ...(novo.auto_recurring as Linha) };
      }
      return resposta(200, a);
    }
    return resposta(404, { message: "rota não simulada: " + rota });
  }) as typeof fetch;
  return mp;
}
