import { getSupabaseAdmin } from "@/lib/supabase";
import { criarEventoConsulta, horariosOcupadosNoGoogle, limparCacheOcupacao } from "@/lib/googleAgenda";

export interface AgendamentoRow {
  id: string;
  user_email: string;
  titulo: string;
  tipo: string;
  data: string;
  horario: string;
  link?: string | null;
  google_event_id?: string | null;
}

/**
 * Cria no Google Agenda da nutri o evento de uma consulta e grava o vínculo no agendamento.
 * Nunca lança erro: se a nutri não conectou o Google (ou a API falhar), a consulta continua válida
 * e fica pendente para "Sincronizar pendentes" no painel.
 */
export async function sincronizarConsultaComGoogle(ag: AgendamentoRow): Promise<{ sincronizado: boolean; meetLink?: string | null }> {
  try {
    if (ag.tipo !== "consulta" || ag.google_event_id) return { sincronizado: Boolean(ag.google_event_id) };
    const admin = getSupabaseAdmin();
    const { data: perfil } = await admin
      .from("profiles")
      .select("nome, nome_crianca")
      .eq("email", ag.user_email)
      .maybeSingle();

    const evento = await criarEventoConsulta({
      titulo: ag.titulo,
      data: ag.data,
      horario: ag.horario,
      pacienteEmail: ag.user_email,
      pacienteNome: perfil?.nome,
      nomeCrianca: perfil?.nome_crianca,
    });
    if (!evento) return { sincronizado: false };

    const atualizacao: Record<string, unknown> = {
      google_event_id: evento.eventId,
      google_sincronizado_em: new Date().toISOString(),
    };
    // a sala real do Meet substitui o link genérico
    if (evento.meetLink) atualizacao.link = evento.meetLink;
    await admin.from("agendamentos").update(atualizacao).eq("id", ag.id);
    limparCacheOcupacao();
    return { sincronizado: true, meetLink: evento.meetLink };
  } catch (err) {
    console.warn("Aviso ao sincronizar consulta com o Google Agenda:", err);
    return { sincronizado: false };
  }
}

/** Sincroniza todas as consultas futuras que ainda não têm evento (ex.: marcadas antes da nutri conectar o Google). */
export async function sincronizarPendentes(): Promise<{ total: number; sincronizadas: number }> {
  const admin = getSupabaseAdmin();
  const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const { data } = await admin
    .from("agendamentos")
    .select("id, user_email, titulo, tipo, data, horario, link, google_event_id")
    .eq("tipo", "consulta")
    .is("google_event_id", null)
    .gte("data", hoje)
    .order("data", { ascending: true })
    .limit(50);
  let sincronizadas = 0;
  for (const ag of (data || []) as AgendamentoRow[]) {
    const r = await sincronizarConsultaComGoogle(ag);
    if (r.sincronizado) sincronizadas++;
  }
  return { total: (data || []).length, sincronizadas };
}

/** O horário está livre na agenda do Google da nutri? (true quando o Google não está conectado) */
export async function horarioLivreNoGoogle(data: string, horario: string): Promise<boolean> {
  const ocupados = await horariosOcupadosNoGoogle();
  return !ocupados.some((o) => o.data === data && o.horario === horario);
}
