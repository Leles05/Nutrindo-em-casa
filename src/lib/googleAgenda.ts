import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase";

/* eslint-disable @typescript-eslint/no-explicit-any -- respostas JSON da API do Google */
/**
 * Sincronização da agenda com o Google Agenda da nutricionista.
 *
 * - A conexão (refresh_token) fica na tabela `google_integracao`, só acessível pelo servidor.
 * - Cada consulta marcada vira um evento na agenda dela, com o paciente como convidado e sala do Meet.
 * - Os horários que ela já tem ocupados no Google bloqueiam a escolha de horário pelas famílias.
 */

export const HORARIOS_CONSULTA = ["09:00", "10:30", "14:00", "15:30", "17:00"] as const;
export const DURACAO_CONSULTA_MIN = 50;
export const DIAS_A_FRENTE_AGENDA = 120;
const FUSO = "America/Sao_Paulo";
const SCOPES_NUTRI = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.freebusy",
].join(" ");
const GOOGLE_API = "https://www.googleapis.com/calendar/v3";

// ---------------------------------------------------------------------------
// state assinado (impede que alguém invente um "state" para plugar a própria conta Google)
// ---------------------------------------------------------------------------
function segredoState(): string {
  const s = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.GOOGLE_CLIENT_SECRET;
  if (!s) throw new Error("Segredo para assinar o state OAuth não configurado.");
  return s;
}
function assinar(corpo: string): string {
  return createHmac("sha256", segredoState()).update(corpo).digest("base64url");
}

export interface EstadoNutri {
  nonce: string;
  usuario: string; // e-mail da nutri no sistema
}

export function criarStateNutri(usuarioEmail: string): { state: string; nonce: string } {
  const nonce = randomBytes(24).toString("base64url");
  const corpo = Buffer.from(
    JSON.stringify({ n: nonce, k: "nutri", u: usuarioEmail, exp: Date.now() + 10 * 60 * 1000 })
  ).toString("base64url");
  return { state: `${corpo}.${assinar(corpo)}`, nonce };
}

/** Devolve o estado se a assinatura for válida e não tiver expirado; senão null. */
export function lerStateNutri(state: string): EstadoNutri | null {
  const [corpo, assinatura] = String(state || "").split(".");
  if (!corpo || !assinatura) return null;
  try {
    const esperado = Buffer.from(assinar(corpo));
    const recebido = Buffer.from(assinatura);
    if (esperado.length !== recebido.length || !timingSafeEqual(esperado, recebido)) return null;
    const d = JSON.parse(Buffer.from(corpo, "base64url").toString("utf8"));
    if (d.k !== "nutri" || typeof d.n !== "string" || typeof d.u !== "string" || Date.now() > Number(d.exp)) return null;
    return { nonce: d.n, usuario: d.u };
  } catch {
    return null;
  }
}

export function urlAutorizacaoNutri(origin: string, state: string): string | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return null;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: "code",
    scope: SCOPES_NUTRI,
    access_type: "offline",
    prompt: "select_account consent", // consent garante o refresh_token mesmo em reconexões
    include_granted_scopes: "false",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// conexão / tokens
// ---------------------------------------------------------------------------
interface Integracao {
  usuario_email: string;
  google_email: string | null;
  refresh_token: string;
  access_token: string | null;
  expira_em: string | null;
  calendario_id: string;
  conectado_em: string;
}

async function lerIntegracao(): Promise<Integracao | null> {
  const { data } = await getSupabaseAdmin().from("google_integracao").select("*").eq("id", "nutri").maybeSingle();
  return (data as Integracao | null) ?? null;
}

export async function salvarConexaoNutri(params: {
  usuarioEmail: string;
  googleEmail: string | null;
  refreshToken: string;
  accessToken: string;
  expiraEmSegundos: number;
  escopos: string;
}): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("google_integracao")
    .upsert(
      {
        id: "nutri",
        usuario_email: params.usuarioEmail,
        google_email: params.googleEmail,
        refresh_token: params.refreshToken,
        access_token: params.accessToken,
        expira_em: new Date(Date.now() + params.expiraEmSegundos * 1000).toISOString(),
        escopos: params.escopos,
        conectado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  if (error) throw new Error(`Não foi possível salvar a conexão com o Google: ${error.message}`);
}

export async function statusConexaoNutri(): Promise<{
  conectado: boolean;
  googleEmail?: string | null;
  desde?: string;
  configurado: boolean;
}> {
  const configurado = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const i = await lerIntegracao();
  if (!i) return { conectado: false, configurado };
  return { conectado: true, googleEmail: i.google_email, desde: i.conectado_em, configurado };
}

export async function desconectarNutri(): Promise<void> {
  const i = await lerIntegracao();
  if (i?.refresh_token) {
    // revoga no Google (se falhar, ainda assim apagamos do nosso lado)
    await fetch("https://oauth2.googleapis.com/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: i.refresh_token }),
      signal: AbortSignal.timeout(8000),
    }).catch(() => {});
  }
  await getSupabaseAdmin().from("google_integracao").delete().eq("id", "nutri");
}

/** Access token válido da nutri (renova com o refresh_token). null = não conectada ou acesso revogado. */
async function tokenDaNutri(): Promise<{ token: string; calendarioId: string } | null> {
  const i = await lerIntegracao();
  if (!i) return null;
  const calendarioId = i.calendario_id || "primary";
  if (i.access_token && i.expira_em && new Date(i.expira_em).getTime() > Date.now() + 60_000) {
    return { token: i.access_token, calendarioId };
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: i.refresh_token,
        grant_type: "refresh_token",
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const json = await res.json().catch(() => ({}));
    if (res.status === 400 && json?.error === "invalid_grant") {
      // a nutri revogou o acesso (ou a senha foi trocada): desfaz a conexão para o painel mostrar "reconectar"
      await getSupabaseAdmin().from("google_integracao").delete().eq("id", "nutri");
      console.warn("Google Agenda: acesso revogado pela nutri; conexão removida.");
      return null;
    }
    if (!res.ok || !json.access_token) {
      console.warn("Google Agenda: falha ao renovar token:", res.status, json?.error);
      return null;
    }
    await getSupabaseAdmin()
      .from("google_integracao")
      .update({
        access_token: json.access_token,
        expira_em: new Date(Date.now() + Number(json.expires_in || 3600) * 1000).toISOString(),
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", "nutri");
    return { token: json.access_token as string, calendarioId };
  } catch (err) {
    console.warn("Google Agenda: erro ao renovar token:", err);
    return null;
  }
}

async function chamarGoogle(
  token: string,
  metodo: string,
  caminho: string,
  corpo?: unknown
): Promise<{ ok: boolean; status: number; json: Record<string, any> }> {
  const res = await fetch(`${GOOGLE_API}${caminho}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
    signal: AbortSignal.timeout(12_000),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

// ---------------------------------------------------------------------------
// horários
// ---------------------------------------------------------------------------
function inicioFim(data: string, horario: string, duracaoMin = DURACAO_CONSULTA_MIN) {
  const [hh, mm = "00"] = horario.split(":");
  const h = String(parseInt(hh, 10)).padStart(2, "0");
  const m = String(parseInt(mm, 10)).padStart(2, "0");
  const total = parseInt(h, 10) * 60 + parseInt(m, 10) + duracaoMin;
  const hf = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mf = String(total % 60).padStart(2, "0");
  return {
    inicio: { dateTime: `${data}T${h}:${m}:00`, timeZone: FUSO },
    fim: { dateTime: `${data}T${hf}:${mf}:00`, timeZone: FUSO },
  };
}

/** Instante (ms) de data+horário no fuso de Brasília (UTC-3 fixo desde 2019). */
function epochSP(data: string, horario: string): number {
  return Date.parse(`${data}T${horario}:00-03:00`);
}

// ---------------------------------------------------------------------------
// eventos
// ---------------------------------------------------------------------------
export interface ConsultaParaGoogle {
  titulo: string;
  data: string;
  horario: string;
  pacienteEmail: string;
  pacienteNome?: string | null;
  nomeCrianca?: string | null;
}

export interface EventoCriado {
  eventId: string;
  meetLink: string | null;
  htmlLink: string | null;
}

function descricaoDaConsulta(c: ConsultaParaGoogle): string {
  return [
    "Consulta online — Nutrindo em Casa.",
    c.pacienteNome ? `Paciente (responsável): ${c.pacienteNome}` : `Paciente: ${c.pacienteEmail}`,
    c.nomeCrianca ? `Criança: ${c.nomeCrianca}` : "",
    "",
    "Orientação à família: conectar 5 minutos antes, em ambiente tranquilo, com o registro da Escada do Comer à mão.",
  ]
    .filter((l) => l !== "")
    .join("\n");
}

/** Cria o evento na agenda da nutri (com Meet e o paciente como convidado). null = não conectada / falhou. */
export async function criarEventoConsulta(c: ConsultaParaGoogle): Promise<EventoCriado | null> {
  const acesso = await tokenDaNutri();
  if (!acesso) return null;
  const { inicio, fim } = inicioFim(c.data, c.horario);
  const base = {
    summary: c.titulo,
    description: descricaoDaConsulta(c),
    start: inicio,
    end: fim,
    attendees: [{ email: c.pacienteEmail, displayName: c.pacienteNome || undefined }],
    reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 60 }, { method: "email", minutes: 1440 }] },
    guestsCanModify: false,
    extendedProperties: { private: { origem: "nutrindo-em-casa" } },
  };
  const cal = encodeURIComponent(acesso.calendarioId);
  const comMeet = { ...base, conferenceData: { createRequest: { requestId: randomBytes(12).toString("hex"), conferenceSolutionKey: { type: "hangoutsMeet" } } } };

  let r = await chamarGoogle(acesso.token, "POST", `/calendars/${cal}/events?conferenceDataVersion=1&sendUpdates=all`, comMeet);
  if (!r.ok) {
    // sem Meet (por ex. conta que não permite criar salas): cria só o evento
    r = await chamarGoogle(acesso.token, "POST", `/calendars/${cal}/events?sendUpdates=all`, base);
  }
  if (!r.ok) {
    console.warn("Google Agenda: falha ao criar evento:", r.status, JSON.stringify(r.json?.error || r.json).slice(0, 300));
    return null;
  }
  return {
    eventId: r.json.id as string,
    meetLink: (r.json.hangoutLink as string | undefined) || null,
    htmlLink: (r.json.htmlLink as string | undefined) || null,
  };
}

/** Atualiza texto/horário de um evento já criado (ex.: link da sala trocado pela nutri). */
export async function atualizarEvento(
  eventId: string,
  mudancas: { data?: string; horario?: string; link?: string; titulo?: string }
): Promise<boolean> {
  const acesso = await tokenDaNutri();
  if (!acesso) return false;
  const corpo: Record<string, unknown> = {};
  if (mudancas.titulo) corpo.summary = mudancas.titulo;
  if (mudancas.link) corpo.location = mudancas.link;
  if (mudancas.data && mudancas.horario) {
    const { inicio, fim } = inicioFim(mudancas.data, mudancas.horario);
    corpo.start = inicio;
    corpo.end = fim;
  }
  const r = await chamarGoogle(
    acesso.token,
    "PATCH",
    `/calendars/${encodeURIComponent(acesso.calendarioId)}/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
    corpo
  );
  if (!r.ok) console.warn("Google Agenda: falha ao atualizar evento:", r.status);
  return r.ok;
}

/** Garante uma sala do Meet real no evento (cria se ainda não tiver). */
export async function garantirMeetNoEvento(eventId: string): Promise<string | null> {
  const acesso = await tokenDaNutri();
  if (!acesso) return null;
  const caminho = `/calendars/${encodeURIComponent(acesso.calendarioId)}/events/${encodeURIComponent(eventId)}`;
  const atual = await chamarGoogle(acesso.token, "GET", caminho);
  if (!atual.ok) return null;
  if (atual.json.hangoutLink) return atual.json.hangoutLink as string;
  const r = await chamarGoogle(acesso.token, "PATCH", `${caminho}?conferenceDataVersion=1&sendUpdates=all`, {
    conferenceData: { createRequest: { requestId: randomBytes(12).toString("hex"), conferenceSolutionKey: { type: "hangoutsMeet" } } },
  });
  return r.ok ? ((r.json.hangoutLink as string | undefined) ?? null) : null;
}

export async function removerEvento(eventId: string): Promise<boolean> {
  const acesso = await tokenDaNutri();
  if (!acesso) return false;
  const r = await chamarGoogle(
    acesso.token,
    "DELETE",
    `/calendars/${encodeURIComponent(acesso.calendarioId)}/events/${encodeURIComponent(eventId)}?sendUpdates=all`
  );
  return r.ok || r.status === 404 || r.status === 410;
}

// ---------------------------------------------------------------------------
// disponibilidade (FreeBusy)
// ---------------------------------------------------------------------------
export interface HorarioOcupado {
  data: string;
  horario: string;
  origem: "google";
}

let cacheOcupacao: { ate: number; itens: HorarioOcupado[] } | null = null;

function hojeSPISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function somarDiasISO(iso: string, dias: number): string {
  const [a, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d + dias));
  return dt.toISOString().slice(0, 10);
}

/**
 * Horários de consulta que já estão ocupados na agenda do Google da nutri
 * (próximos 120 dias). Vazio quando não conectada. Cache curto para poupar a cota da API.
 */
export async function horariosOcupadosNoGoogle(): Promise<HorarioOcupado[]> {
  if (cacheOcupacao && cacheOcupacao.ate > Date.now()) return cacheOcupacao.itens;
  const acesso = await tokenDaNutri();
  if (!acesso) return [];

  const hoje = hojeSPISO();
  const ultimo = somarDiasISO(hoje, DIAS_A_FRENTE_AGENDA);
  const r = await chamarGoogle(acesso.token, "POST", "/freeBusy", {
    timeMin: `${hoje}T00:00:00-03:00`,
    timeMax: `${ultimo}T23:59:59-03:00`,
    timeZone: FUSO,
    items: [{ id: acesso.calendarioId }],
  });
  if (!r.ok) {
    console.warn("Google Agenda: falha no FreeBusy:", r.status);
    return cacheOcupacao?.itens ?? []; // melhor usar o último resultado do que liberar tudo
  }
  const ocupados: Array<{ ini: number; fim: number }> = (r.json?.calendars?.[acesso.calendarioId]?.busy || []).map(
    (b: { start: string; end: string }) => ({ ini: Date.parse(b.start), fim: Date.parse(b.end) })
  );

  const itens: HorarioOcupado[] = [];
  for (let i = 0; i <= DIAS_A_FRENTE_AGENDA; i++) {
    const dia = somarDiasISO(hoje, i);
    for (const slot of HORARIOS_CONSULTA) {
      const ini = epochSP(dia, slot);
      const fim = ini + DURACAO_CONSULTA_MIN * 60_000;
      if (ocupados.some((o) => o.ini < fim && o.fim > ini)) itens.push({ data: dia, horario: slot, origem: "google" });
    }
  }
  cacheOcupacao = { ate: Date.now() + 60_000, itens };
  return itens;
}

export function limparCacheOcupacao(): void {
  cacheOcupacao = null;
}
