"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Calendar, MessageCircle, AlertTriangle, Check, Sparkles, X, ChevronRight } from "lucide-react";

export interface NotificacaoItem {
  id: string;
  tipo: "consulta" | "mensagem" | "devolutiva" | "renovacao";
  titulo: string;
  descricao: string;
  link: string;
  horario?: string;
  destaque?: boolean;
}

export default function NotificationBell() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [notificacoes, setNotificacoes] = useState<NotificacaoItem[]>([]);
  const [lidas, setLidas] = useState<string[]>([]);
  const [consultaHojeHorario, setConsultaHojeHorario] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const obterEmail = () => {
    if (typeof window === "undefined") return "";
    return (
      localStorage.getItem("nutrindo_user_email") ||
      localStorage.getItem("usuario_email") ||
      ""
    ).toLowerCase().trim();
  };

  useEffect(() => {
    const email = obterEmail();
    if (!email) return;

    // Carrega IDs lidos do localStorage
    try {
      const salvas = localStorage.getItem(`nutrindo_notificacoes_lidas_${email}`);
      if (salvas) {
        setLidas(JSON.parse(salvas));
      }
    } catch {}

    async function buscarNotificacoes() {
      const itens: NotificacaoItem[] = [];
      const hojeStr = new Date().toLocaleDateString("en-CA");
      const amanhaObj = new Date();
      amanhaObj.setDate(amanhaObj.getDate() + 1);
      const amanhaStr = amanhaObj.toLocaleDateString("en-CA");

      try {
        // 1. Consultas agendadas
        const agRes = await fetch(`/api/agendamentos?email=${encodeURIComponent(email)}`)
          .then((r) => r.json())
          .catch(() => null);

        if (agRes?.agendamentos && Array.isArray(agRes.agendamentos)) {
          const consultas = agRes.agendamentos.filter((a: any) => a.tipo === "consulta");
          if (consultas.length > 0) {
            const prox = consultas[0];
            const dataConsulta = prox.data ? prox.data.split("T")[0] : "";
            const horaConsulta = prox.horario || "14:00";

            if (dataConsulta === hojeStr) {
              setConsultaHojeHorario(horaConsulta);
              itens.push({
                id: `consulta-${prox.id || "hoje"}`,
                tipo: "consulta",
                titulo: "📅 Consulta com a Dra. Laís é HOJE!",
                descricao: `Sua consulta individual é hoje às ${horaConsulta}. Clique para acessar a sala do Meet.`,
                link: "/dashboard/calendario",
                horario: "Hoje",
                destaque: true,
              });
            } else if (dataConsulta === amanhaStr) {
              itens.push({
                id: `consulta-${prox.id || "amanha"}`,
                tipo: "consulta",
                titulo: "📅 Lembrete de Consulta Amanhã",
                descricao: `Sua consulta com a Dra. Laís é amanhã às ${horaConsulta}.`,
                link: "/dashboard/calendario",
                horario: "Amanhã",
              });
            } else if (dataConsulta > hojeStr) {
              itens.push({
                id: `consulta-${prox.id || "futura"}`,
                tipo: "consulta",
                titulo: "📅 Próxima Consulta Agendada",
                descricao: `Agendada para ${dataConsulta.split("-").reverse().join("/")} às ${horaConsulta}.`,
                link: "/dashboard/calendario",
              });
            }
          }
        }

        // 2. Devolutivas da semana
        const devRes = await fetch(`/api/devolutivas?email=${encodeURIComponent(email)}`)
          .then((r) => r.json())
          .catch(() => null);

        if (devRes?.success && devRes.devolutivas?.length > 0) {
          const ultDev = devRes.devolutivas[0];
          itens.push({
            id: `devolutiva-${ultDev.id}`,
            tipo: "devolutiva",
            titulo: "🎯 Nova Orientação da Dra. Laís",
            descricao: "Seu parecer clínico semanal e metas alimentares foram atualizados.",
            link: "/dashboard/devolutiva",
          });
        }

        // 3. Chat: Mensagens recentes da nutricionista
        const chatRes = await fetch(`/api/chat?email=${encodeURIComponent(email)}`)
          .then((r) => r.json())
          .catch(() => null);

        if (chatRes?.mensagens && Array.isArray(chatRes.mensagens)) {
          const ultMsg = chatRes.mensagens[chatRes.mensagens.length - 1];
          if (ultMsg && ultMsg.remetente === "nutri") {
            itens.push({
              id: `chat-${ultMsg.id || ultMsg.created_at || "msg"}`,
              tipo: "mensagem",
              titulo: "💬 Mensagem da Dra. Laís no Chat",
              descricao: ultMsg.texto ? ultMsg.texto.slice(0, 75) + "..." : "Nova resposta no chat de acolhimento.",
              link: "/dashboard/chat",
            });
          }
        }

        // 4. Assinatura e Renovação
        const confRes = await fetch(`/api/configuracoes?email=${encodeURIComponent(email)}`)
          .then((r) => r.json())
          .catch(() => null);

        const diasRestantes = confRes?.diasRestantes ?? 30;
        if (diasRestantes <= 5 && diasRestantes >= 0) {
          itens.push({
            id: `renovacao-${diasRestantes}`,
            tipo: "renovacao",
            titulo: "⚠️ Renovação de Acompanhamento",
            descricao: `Faltam ${diasRestantes} ${diasRestantes === 1 ? "dia" : "dias"} para renovar seu plano. Garanta a continuidade do acompanhamento.`,
            link: "/configuracoes?aba=assinatura",
            destaque: true,
          });
        }

        setNotificacoes(itens);
      } catch (err) {
        console.warn("Aviso ao carregar notificações:", err);
      }
    }

    buscarNotificacoes();
  }, []);

  // Fechar ao clicar fora
  useEffect(() => {
    function tratarCliqueFora(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    if (aberto) {
      document.addEventListener("mousedown", tratarCliqueFora);
    }
    return () => {
      document.removeEventListener("mousedown", tratarCliqueFora);
    };
  }, [aberto]);

  const naoLidas = notificacoes.filter((n) => !lidas.includes(n.id));
  const contadorNaoLidas = naoLidas.length;

  const marcarTodasComoLidas = () => {
    const todosIds = notificacoes.map((n) => n.id);
    setLidas(todosIds);
    const email = obterEmail();
    if (email && typeof window !== "undefined") {
      localStorage.setItem(`nutrindo_notificacoes_lidas_${email}`, JSON.stringify(todosIds));
    }
  };

  const clicarNotificacao = (notif: NotificacaoItem) => {
    if (!lidas.includes(notif.id)) {
      const novasLidas = [...lidas, notif.id];
      setLidas(novasLidas);
      const email = obterEmail();
      if (email && typeof window !== "undefined") {
        localStorage.setItem(`nutrindo_notificacoes_lidas_${email}`, JSON.stringify(novasLidas));
      }
    }
    setAberto(false);
    router.push(notif.link);
  };

  return (
    <div className="flex items-center gap-2 relative" ref={dropdownRef}>
      {/* BOTÃO DO SININHO */}
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        aria-label="Notificações"
        aria-expanded={aberto}
        className="relative p-2 rounded-2xl bg-white border border-slate-200 hover:border-[#3D5A45] text-slate-700 hover:text-[#3D5A45] transition-all shadow-xs cursor-pointer flex items-center justify-center shrink-0"
        title="Ver notificações e lembretes"
      >
        <Bell className="h-4 w-4" />
        {contadorNaoLidas > 0 && (
          <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse shadow-xs">
            {contadorNaoLidas}
          </span>
        )}
      </button>

      {/* DROPDOWN DE NOTIFICAÇÕES */}
      {aberto && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* TOPO DO DROPDOWN */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-xl bg-[#3D5A45]/10 text-[#3D5A45] flex items-center justify-center">
                <Bell className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                Notificações
              </h3>
              {contadorNaoLidas > 0 && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                  {contadorNaoLidas} nova{contadorNaoLidas > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {contadorNaoLidas > 0 && (
              <button
                type="button"
                onClick={marcarTodasComoLidas}
                className="text-[11px] font-bold text-[#3D5A45] hover:text-[#2d4333] hover:underline cursor-pointer"
              >
                Marcar lidas
              </button>
            )}
          </div>

          {/* LISTA DE NOTIFICAÇÕES */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-1">
            {notificacoes.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                <p className="text-xl">🌿</p>
                <p className="font-semibold text-slate-600">Tudo em ordem!</p>
                <p className="text-[11px] text-slate-400">Nenhuma notificação nova no momento.</p>
              </div>
            ) : (
              notificacoes.map((item) => {
                const lida = lidas.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => clicarNotificacao(item)}
                    className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-start gap-3 cursor-pointer group ${
                      !lida
                        ? item.destaque
                          ? "bg-amber-50/70 hover:bg-amber-50 border border-amber-200/60"
                          : "bg-emerald-50/40 hover:bg-emerald-50/70"
                        : "hover:bg-slate-50 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <div
                      className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-sm ${
                        item.tipo === "consulta"
                          ? "bg-emerald-100 text-[#3D5A45]"
                          : item.tipo === "renovacao"
                          ? "bg-rose-100 text-rose-700"
                          : item.tipo === "mensagem"
                          ? "bg-sky-100 text-sky-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.tipo === "consulta" ? (
                        <Calendar className="h-4 w-4" />
                      ) : item.tipo === "renovacao" ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : item.tipo === "mensagem" ? (
                        <MessageCircle className="h-4 w-4" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-black text-slate-900 group-hover:text-[#3D5A45] transition-colors truncate">
                          {item.titulo}
                        </h4>
                        {!lida && (
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {item.descricao}
                      </p>
                    </div>

                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 shrink-0 self-center transition-colors" />
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
