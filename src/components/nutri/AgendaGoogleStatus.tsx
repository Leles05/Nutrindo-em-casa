"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarCheck, CalendarX2, Loader2, RefreshCw } from "lucide-react";

interface Status {
  conectado: boolean;
  configurado: boolean;
  googleEmail?: string | null;
}

const AVISOS: Record<string, { ok: boolean; texto: string }> = {
  conectada: { ok: true, texto: "Google Agenda conectado! As consultas agora aparecem na sua agenda." },
  cancelado: { ok: false, texto: "Conexão cancelada. Quando quiser, é só conectar de novo." },
  permissao: {
    ok: false,
    texto: "Faltou autorizar o acesso à agenda na tela do Google. Conecte de novo e mantenha todas as permissões marcadas.",
  },
  erro: { ok: false, texto: "Não foi possível conectar ao Google. Tente novamente." },
};

/** Estado REAL da sincronização com o Google Agenda da nutricionista (conectar / desconectar / enviar pendentes). */
export default function AgendaGoogleStatus({ onMudou }: { onMudou?: () => void }) {
  const [status, setStatus] = useState<Status | null>(null);
  const [ocupado, setOcupado] = useState<"" | "conectar" | "desconectar" | "sincronizar">("");
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const [confirmandoDesconectar, setConfirmandoDesconectar] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const r = await fetch("/api/nutri/google");
      const j = await r.json();
      if (j?.success) setStatus({ conectado: j.conectado, configurado: j.configurado, googleEmail: j.googleEmail });
    } catch {
      /* mantém o último estado */
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca inicial do status (assíncrona)
    void carregar();
    // retorno do Google: /nutri?agenda=conectada|cancelado|permissao|erro
    const params = new URLSearchParams(window.location.search);
    const resultado = params.get("agenda");
    if (resultado) {
      setAviso(AVISOS[resultado] || AVISOS.erro);
      params.delete("agenda");
      const resto = params.toString();
      window.history.replaceState(null, "", window.location.pathname + (resto ? `?${resto}` : ""));
      if (resultado === "conectada") onMudou?.();
    }
  }, [carregar, onMudou]);

  const conectar = async () => {
    setOcupado("conectar");
    setAviso(null);
    try {
      const r = await fetch("/api/nutri/google", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao: "conectar" }) });
      const j = await r.json();
      if (j?.url) {
        window.location.href = j.url;
        return;
      }
      setAviso({ ok: false, texto: j?.message || AVISOS.erro.texto });
    } catch {
      setAviso(AVISOS.erro);
    }
    setOcupado("");
  };

  const sincronizar = async () => {
    setOcupado("sincronizar");
    setAviso(null);
    try {
      const r = await fetch("/api/nutri/google", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao: "sincronizar" }) });
      const j = await r.json();
      if (j?.success) {
        setAviso({
          ok: true,
          texto:
            j.total === 0
              ? "Tudo certo: todas as consultas futuras já estão na sua agenda."
              : `${j.sincronizadas} de ${j.total} consulta(s) enviada(s) para o Google Agenda.`,
        });
        onMudou?.();
      } else setAviso({ ok: false, texto: j?.message || "Não foi possível sincronizar agora." });
    } catch {
      setAviso({ ok: false, texto: "Não foi possível sincronizar agora." });
    }
    setOcupado("");
  };

  const desconectar = async () => {
    setOcupado("desconectar");
    try {
      const r = await fetch("/api/nutri/google", { method: "DELETE" });
      const j = await r.json();
      if (j?.success) {
        setAviso({ ok: true, texto: "Google Agenda desconectado. Novas consultas não serão enviadas para a sua agenda." });
        setConfirmandoDesconectar(false);
        await carregar();
      } else setAviso({ ok: false, texto: j?.message || "Não foi possível desconectar." });
    } catch {
      setAviso({ ok: false, texto: "Não foi possível desconectar." });
    }
    setOcupado("");
  };

  if (!status) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-[11px] font-bold text-slate-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verificando Google Agenda...
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-2 items-start">
      {status.conectado ? (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full text-[11px] font-extrabold text-emerald-800">
            <CalendarCheck className="h-3.5 w-3.5 text-emerald-600" />
            Sincronizado com o Google Agenda{status.googleEmail ? ` (${status.googleEmail})` : ""}
          </span>
          <button
            type="button"
            onClick={sincronizar}
            disabled={ocupado !== ""}
            className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#2A546D] hover:underline disabled:opacity-60 cursor-pointer"
            title="Envia para o Google Agenda as consultas futuras que ainda não estão lá"
          >
            {ocupado === "sincronizar" ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Sincronizar agora
          </button>
          {confirmandoDesconectar ? (
            <span className="inline-flex items-center gap-2 text-[11px]">
              <span className="font-bold text-slate-600">Desconectar?</span>
              <button type="button" onClick={desconectar} disabled={ocupado !== ""} className="font-extrabold text-rose-600 hover:underline cursor-pointer">
                {ocupado === "desconectar" ? "Desconectando..." : "Sim, desconectar"}
              </button>
              <button type="button" onClick={() => setConfirmandoDesconectar(false)} className="font-bold text-slate-500 hover:underline cursor-pointer">
                Cancelar
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmandoDesconectar(true)}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-600 hover:underline cursor-pointer"
            >
              Desconectar
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-[11px] font-extrabold text-amber-800">
            <CalendarX2 className="h-3.5 w-3.5 text-amber-600" />
            Google Agenda não conectado
          </span>
          <button
            type="button"
            onClick={conectar}
            disabled={ocupado !== "" || !status.configurado}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2A546D] hover:bg-[#204054] text-white text-[11px] font-extrabold disabled:opacity-60 cursor-pointer"
            title={status.configurado ? "Autorize o acesso à sua agenda do Google" : "Google não configurado neste ambiente"}
          >
            {ocupado === "conectar" && <Loader2 className="h-3 w-3 animate-spin" />}
            Conectar meu Google Agenda
          </button>
        </div>
      )}
      {!status.conectado && (
        <p className="text-[11px] text-slate-500 max-w-xl leading-snug">
          Ao conectar, cada consulta marcada vira um evento na sua agenda (com sala do Meet e convite para a família) e os
          horários em que você já está ocupada deixam de aparecer para as famílias.
        </p>
      )}
      {aviso && (
        <p role="status" className={`text-[11px] font-bold ${aviso.ok ? "text-emerald-700" : "text-rose-600"}`}>
          {aviso.texto}
        </p>
      )}
    </div>
  );
}
