/**
 * Utilitário completo para Integração com Google Calendar e exportação iCalendar (.ics)
 * Plataforma Nutrindo em Casa - Dra. Laís Leles (CRN-8 18878)
 */

export interface EventoCalendar {
  id?: string | number;
  titulo: string;
  data: string; // YYYY-MM-DD
  horario?: string; // HH:MM ou "14:00 - 15:00"
  duracaoMinutos?: number;
  detalhes?: string;
  descricao?: string;
  localizacao?: string;
  linkMeet?: string;
  tipo?: "consulta" | "meta" | "mentoria" | "lembrete" | string;
}

/**
 * Converte data e horário locais para string formatada no padrão UTC do Google Calendar (YYYYMMDDTHHmmssZ)
 */
function formatarDataHoraUTC(dataStr: string, horarioStr: string = "09:00", duracaoMinutos: number = 60) {
  try {
    // Extrai hora e minuto iniciais
    const horarioInicio = horarioStr.split("-")[0].trim();
    const [hora, minuto] = horarioInicio.split(":").map(Number);

    const [ano, mes, dia] = dataStr.split("-").map(Number);

    // Constrói objeto Date no fuso local
    const dataInicio = new Date(ano, mes - 1, dia, hora || 9, minuto || 0, 0);
    const dataFim = new Date(dataInicio.getTime() + duracaoMinutos * 60 * 1000);

    const pad = (n: number) => String(n).padStart(2, "0");

    const toGCalString = (d: Date) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

    return {
      start: toGCalString(dataInicio),
      end: toGCalString(dataFim),
    };
  } catch {
    // Fallback caso a data esteja fora do formato padrão
    const limpo = dataStr.replace(/-/g, "");
    return {
      start: `${limpo}T120000Z`,
      end: `${limpo}T130000Z`,
    };
  }
}

/**
 * Gera o link direto oficial para adicionar evento ao Google Calendar em 1 clique
 */
export function gerarLinkGoogleCalendar(evento: EventoCalendar): string {
  const duracao = evento.duracaoMinutos || (evento.tipo === "consulta" ? 60 : 30);
  const { start, end } = formatarDataHoraUTC(evento.data, evento.horario || "14:00", duracao);

  const tituloFormatado = evento.tipo === "consulta" && !evento.titulo.toLowerCase().includes("consulta")
    ? `Consulta Nutricional Pediátrica - Dra. Laís Leles (${evento.titulo})`
    : evento.titulo;

  const meetLink = evento.linkMeet || "https://meet.google.com/nutri-lais";
  
  const descricaoCompleta = [
    evento.detalhes || evento.descricao || (evento.tipo === "consulta"
      ? "Consulta individual de Terapia Alimentar Pediátrica com a Dra. Laís Leles (CRN-8 18878)."
      : "Meta prática prescrita na plataforma Nutrindo em Casa para avanço sensorial sem pressão."),
    "",
    evento.tipo === "consulta" ? `🔗 Link da Sala no Google Meet: ${meetLink}` : "",
    evento.tipo === "consulta" ? "📋 Orientações: Tenha em mãos a anamnese preenchida e esteja em ambiente tranquilo com a criança." : "",
    "",
    "Plataforma Nutrindo em Casa • Acolhimento Familiar e Seletividade Alimentar",
  ].filter(Boolean).join("\n");

  const local = evento.localizacao || "Google Meet - Plataforma Nutrindo em Casa";

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: tituloFormatado,
    dates: `${start}/${end}`,
    details: descricaoCompleta,
    location: local,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Abre a janela oficial do Google Calendar pronta para salvar
 */
export function abrirGoogleCalendar(evento: EventoCalendar): void {
  if (typeof window === "undefined") return;
  const url = gerarLinkGoogleCalendar(evento);
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Gera string no padrão iCalendar (.ics) RFC-5545 para exportação universal
 */
export function gerarConteudoICS(eventos: EventoCalendar[]): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const agoraUTC = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  const vevents = eventos.map((ev, idx) => {
    const duracao = ev.duracaoMinutos || (ev.tipo === "consulta" ? 60 : 30);
    const { start, end } = formatarDataHoraUTC(ev.data, ev.horario || "14:00", duracao);
    const uid = `nutrindo-${ev.id || idx}-${start}@nutrindoemcasa.com.br`;
    const meetLink = ev.linkMeet || "https://meet.google.com/nutri-lais";

    const desc = (
      ev.detalhes ||
      ev.descricao ||
      `Compromisso Nutrindo em Casa. ${ev.tipo === "consulta" ? `Sala Meet: ${meetLink}` : "Meta prática semanal."}`
    ).replace(/\n/g, "\\n");

    return [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${agoraUTC}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${ev.titulo.replace(/,/g, "\\,")}`,
      `DESCRIPTION:${desc}`,
      `LOCATION:Google Meet - Plataforma Nutrindo em Casa`,
      "STATUS:CONFIRMED",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:Lembrete de Consulta Nutrindo em Casa",
      "TRIGGER:-PT60M",
      "END:VALARM",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:Lembrete: Consulta amanhã com Dra. Laís Leles",
      "TRIGGER:-P1D",
      "END:VALARM",
      "END:VEVENT",
    ].join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nutrindo em Casa//Agenda Pediatrica Dra Lais Leles//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Nutrindo em Casa - Agenda & Metas",
    "X-WR-TIMEZONE:America/Sao_Paulo",
    ...vevents,
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * Dispara o download imediato de arquivo .ics para celular ou Google Calendar
 */
export function baixarArquivoICS(eventos: EventoCalendar[], nomeArquivo: string = "agenda-nutrindo-em-casa.ics"): void {
  if (typeof window === "undefined" || eventos.length === 0) return;

  const conteudo = gerarConteudoICS(eventos);
  const blob = new Blob([conteudo], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
