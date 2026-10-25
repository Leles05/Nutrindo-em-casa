import { NextRequest, NextResponse } from "next/server";
import { obterOuRenovarTokenGoogle } from "@/lib/googleTokens";

export async function GET(req: NextRequest) {
  try {
    const cookieToken = req.cookies.get("google_calendar_token")?.value;
    const authHeader = req.headers.get("authorization");
    const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const queryToken = req.nextUrl.searchParams.get("token");
    const queryEmail = req.nextUrl.searchParams.get("email");
    const queryMonth = req.nextUrl.searchParams.get("month");
    const queryYear = req.nextUrl.searchParams.get("year");
    const queryTimeMin = req.nextUrl.searchParams.get("timeMin");
    const queryTimeMax = req.nextUrl.searchParams.get("timeMax");
    const memoryToken = queryEmail ? await obterOuRenovarTokenGoogle(queryEmail) : null;

    let token = cookieToken || headerToken || queryToken || memoryToken;

    // Se NÃO houver token do Google OAuth, retorna lista vazia honestamente (sem mocks inventados)
    if (!token) {
      return NextResponse.json({
        success: true,
        connected: false,
        sincronizado: false,
        origemReal: false,
        eventos: [],
        events: [],
      });
    }

    try {
      const agora = new Date();
      let inicio: string;
      let fim: string;

      if (queryTimeMin && queryTimeMax) {
        inicio = new Date(queryTimeMin).toISOString();
        fim = new Date(queryTimeMax).toISOString();
      } else if (queryYear) {
        const anoReq = parseInt(queryYear, 10);
        const mesParam = queryMonth ? parseInt(queryMonth, 10) : agora.getMonth();
        // Se mesParam estiver entre 1 e 12 (1-indexado), ajusta para 0-indexado
        const mesReq = mesParam >= 1 && mesParam <= 12 ? mesParam - 1 : mesParam;
        inicio = new Date(anoReq, mesReq - 1, 1, 0, 0, 0).toISOString();
        fim = new Date(anoReq, mesReq + 2, 0, 23, 59, 59).toISOString();
      } else {
        // Janela ampla: do início do mês anterior até 6 meses à frente
        inicio = new Date(agora.getFullYear(), agora.getMonth() - 1, 1, 0, 0, 0).toISOString();
        fim = new Date(agora.getFullYear(), agora.getMonth() + 7, 0, 23, 59, 59).toISOString();
      }

      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(
        inicio
      )}&timeMax=${encodeURIComponent(fim)}&maxResults=250`;

      let googleRes = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Se deu 401 e temos email, tenta renovar token via refresh_token e reexecuta
      if (googleRes.status === 401 && queryEmail) {
        const novoToken = await obterOuRenovarTokenGoogle(queryEmail);
        if (novoToken && novoToken !== token) {
          token = novoToken;
          googleRes = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }

      if (!googleRes.ok) {
        console.warn("Resposta não-OK da API do Google Calendar:", googleRes.status);
        return NextResponse.json({
          success: true,
          connected: false,
          sincronizado: false,
          origemReal: false,
          eventos: [],
          events: [],
        });
      }

      const data = await googleRes.json();
      const formatadorDataSP = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const formatadorHoraSP = new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      const eventosGoogle = (data.items || []).map((item: any) => {
        let dataStr = "";
        let horarioStr = "Dia Todo";

        if (item.start?.dateTime) {
          const d = new Date(item.start.dateTime);
          try {
            dataStr = formatadorDataSP.format(d); // Formato YYYY-MM-DD
          } catch {
            dataStr = item.start.dateTime.split("T")[0];
          }

          try {
            horarioStr = formatadorHoraSP.format(d);
          } catch {
            horarioStr = item.start.dateTime.split("T")[1]?.substring(0, 5) || "09:00";
          }
        } else if (item.start?.date) {
          dataStr = item.start.date; // Evento de dia todo já vem YYYY-MM-DD
          horarioStr = "Dia Todo";
        }

        return {
          id: `gcal-${item.id}`,
          titulo: item.summary || "Compromisso Pessoal",
          data: dataStr,
          horario: horarioStr,
          tipo: "google_calendar",
          origem: "google_calendar",
          tag: "Google Calendar",
          sincronizado: true,
          link: item.htmlLink || null,
        };
      });

      return NextResponse.json({
        success: true,
        connected: true,
        sincronizado: true,
        origemReal: true,
        eventos: eventosGoogle,
        events: eventosGoogle,
      });
    } catch (googleErr) {
      console.warn("Aviso ao buscar eventos reais na API do Google Calendar:", googleErr);
      return NextResponse.json({
        success: true,
        connected: false,
        sincronizado: false,
        origemReal: false,
        eventos: [],
        events: [],
      });
    }
  } catch (error: any) {
    console.error("Erro interno em /api/google-calendar/events:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao buscar eventos do Google Calendar." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { titulo, data, horario, meetLink, detalhes, duracaoMinutos = 60, email, token: bodyToken } = body;

    const cookieToken = req.cookies.get("google_calendar_token")?.value;
    const authHeader = req.headers.get("authorization");
    const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const token = cookieToken || headerToken || bodyToken || (email ? await obterOuRenovarTokenGoogle(email) : null);

    if (!token) {
      return NextResponse.json({
        success: false,
        sincronizado: false,
        message: "Token de autenticação do Google Calendar não encontrado.",
      });
    }

    if (!titulo || !data || !horario) {
      return NextResponse.json(
        { success: false, message: "Dados incompletos para criação de evento." },
        { status: 400 }
      );
    }

    const [hhStr, mmStr = "00"] = horario.split(":");
    const hh = parseInt(hhStr, 10);
    const mm = parseInt(mmStr, 10);

    const horaInicioFormatada = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`;
    
    // Cálculo do horário de término
    const fimTotalMin = hh * 60 + mm + duracaoMinutos;
    const hhFim = Math.floor(fimTotalMin / 60) % 24;
    const mmFim = fimTotalMin % 60;
    const horaFimFormatada = `${String(hhFim).padStart(2, "0")}:${String(mmFim).padStart(2, "0")}:00`;

    const payloadGoogle = {
      summary: titulo,
      description: `${detalhes || "Consulta Nutricional Pediátrica com Dra. Laís Leles (Nutrindo em Casa)."}\n\nLink do Google Meet: ${meetLink || "https://meet.google.com"}`,
      location: meetLink ? `Google Meet (${meetLink})` : "Google Meet (Online)",
      start: {
        dateTime: `${data}T${horaInicioFormatada}`,
        timeZone: "America/Sao_Paulo",
      },
      end: {
        dateTime: `${data}T${horaFimFormatada}`,
        timeZone: "America/Sao_Paulo",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 60 },
          { method: "email", minutes: 1440 }, // 24 horas antes
        ],
      },
    };

    const googleRes = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payloadGoogle),
    });

    if (!googleRes.ok) {
      const errText = await googleRes.text();
      console.warn("Aviso ao criar evento na API do Google Calendar:", errText);
      return NextResponse.json({
        success: false,
        message: "Não foi possível sincronizar o evento diretamente no Google Calendar.",
      });
    }

    const eventCreated = await googleRes.json();

    return NextResponse.json({
      success: true,
      sincronizado: true,
      eventId: eventCreated.id,
      htmlLink: eventCreated.htmlLink,
    });
  } catch (error: any) {
    console.error("Erro interno ao criar evento no Google Calendar:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao criar evento no Google Calendar." },
      { status: 500 }
    );
  }
}
