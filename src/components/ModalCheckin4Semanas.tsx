"use client";

import { useState } from "react";
import { X, Sparkles, Send, CheckCircle2, AlertCircle, HeartHandshake } from "lucide-react";

interface ModalCheckin4SemanasProps {
  aberto: boolean;
  onClose: () => void;
  onSucesso?: (checkin: any) => void;
  userEmail?: string;
}

export default function ModalCheckin4Semanas({
  aberto,
  onClose,
  onSucesso,
  userEmail,
}: ModalCheckin4SemanasProps) {
  const [novosAlimentos, setNovosAlimentos] = useState("");
  const [refeicoesFamilia, setRefeicoesFamilia] = useState("");
  const [medidasRecentes, setMedidasRecentes] = useState("");
  const [duvidasConsulta, setDuvidasConsulta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  if (!aberto) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    const email =
      userEmail ||
      (typeof window !== "undefined"
        ? localStorage.getItem("nutrindo_user_email") || "lucas@email.com"
        : "lucas@email.com");

    if (!novosAlimentos.trim() && !refeicoesFamilia.trim() && !duvidasConsulta.trim()) {
      setErro("Por favor, preencha pelo menos um dos campos de evolução para atualizar a nutricionista.");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch("/api/nutri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "salvar_checkin",
          user_email: email,
          novosAlimentos: novosAlimentos.trim(),
          refeicoesFamilia: refeicoesFamilia.trim(),
          medidasRecentes: medidasRecentes.trim(),
          duvidasConsulta: duvidasConsulta.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (onSucesso) {
          onSucesso(data.checkin);
        }
        onClose();
        // Limpa campos
        setNovosAlimentos("");
        setRefeicoesFamilia("");
        setMedidasRecentes("");
        setDuvidasConsulta("");
      } else {
        setErro(data.message || "Erro ao registrar atualização. Tente novamente.");
      }
    } catch (err) {
      console.warn("Aviso ao enviar check-in de 4 semanas:", err);
      setErro("Não foi possível enviar agora. Verifique sua conexão e tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-in zoom-in-95">
        
        {/* CABEÇALHO DO MODAL */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/80 to-sky-50/50">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-[#4C6C54] text-white flex items-center justify-center shadow-xs shrink-0">
              <HeartHandshake className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-800 leading-tight">
                  Atualizar Evolução para a Próxima Consulta
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Check-in de 4 Semanas • Informações diretas para a Dra. Laís Leles
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-full transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* CORPO DO FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* BANNER INFORMATIVO DO CICLO */}
          <div className="p-3 bg-emerald-50/80 border border-emerald-200/70 rounded-2xl flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-[#4C6C54] shrink-0 mt-0.5" />
            <p className="text-[11px] text-emerald-900 leading-relaxed font-medium">
              Manter a Dra. Laís atualizada a cada <strong>4 semanas</strong> permite que ela analise previamente o prontuário do seu pequeno e chegue na consulta com metas sob medida!
            </p>
          </div>

          {erro && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {/* CAMPO 1 */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide">
              1. Novos alimentos tolerados ou aceitos nestas 4 semanas
            </label>
            <textarea
              rows={2}
              value={novosAlimentos}
              onChange={(e) => setNovosAlimentos(e.target.value)}
              placeholder="Ex: Tolerou cenoura ralada no prato de apoio por 3 dias e provou um pedacinho de melancia sem cuspir..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/40"
            />
          </div>

          {/* CAMPO 2 */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide">
              2. Como foram as refeições em família neste ciclo? (Avanços e desafios)
            </label>
            <textarea
              rows={2}
              value={refeicoesFamilia}
              onChange={(e) => setRefeicoesFamilia(e.target.value)}
              placeholder="Ex: Conseguimos jantar juntos à mesa sem telas 4 vezes na semana. Houve menos estresse, mas o almoço na escola ainda é difícil..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/40"
            />
          </div>

          {/* CAMPO 3 */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide">
              3. Peso / Estatura recentes (se houver nova medição pediátrica)
            </label>
            <input
              type="text"
              value={medidasRecentes}
              onChange={(e) => setMedidasRecentes(e.target.value)}
              placeholder="Ex: Peso: 14.6 kg | Altura: 97 cm (Consulta de rotina com pediatra em 10/10)"
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/40"
            />
          </div>

          {/* CAMPO 4 */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide">
              4. Principais dúvidas para conversar com a Dra. Laís na consulta
            </label>
            <textarea
              rows={2}
              value={duvidasConsulta}
              onChange={(e) => setDuvidasConsulta(e.target.value)}
              placeholder="Ex: Como fazer a transição de apenas tolerar o vegetal visualmente para tocar e levar à boca com segurança?"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/40"
            />
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Preencher Depois
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="flex-1 py-2.5 px-4 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{enviando ? "Enviando à Nutri..." : "Salvar & Enviar à Dra. Laís"}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
