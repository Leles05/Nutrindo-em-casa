"use client";

import { useMemo, useState } from "react";
import { Sparkles, ChevronDown, FileText, Mail, AlertTriangle, Info } from "lucide-react";
import { analisarAnamnese, type ProtocoloClinico } from "@/data/sugestoesClinicas";
import { useBancoRespostas } from "./BancoRespostasRapidas";

interface AssistentePreAnaliseProps {
  respostas: Record<string, unknown> | null | undefined;
  perfil?: { alimentos_conforto?: string; principais_recusas?: string };
  onAplicarParecer: (protocolo: ProtocoloClinico) => void;
  onGerarDevolutiva: (protocolo: ProtocoloClinico) => void;
}

/** ✨ Assistente de Pré-Análise Clínica (56 Parâmetros) exibido no topo do prontuário. */
export default function AssistentePreAnalise({
  respostas,
  perfil,
  onAplicarParecer,
  onGerarDevolutiva,
}: AssistentePreAnaliseProps) {
  const banco = useBancoRespostas();
  const [expandidoId, setExpandidoId] = useState<string | null>(null);
  const [simulando, setSimulando] = useState(false);

  const analise = useMemo(
    () => analisarAnamnese(respostas, perfil, banco.length ? banco : undefined, simulando),
    [respostas, perfil, banco, simulando]
  );

  // Estado Informativo Limpo: Aguardando preenchimento completo da anamnese
  if (analise.aguardandoPreenchimento) {
    return (
      <section
        aria-label="Assistente de Pré-Análise Clínica"
        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-3 shadow-2xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide">
                Assistente de Pré-Análise Clínica (56 Parâmetros)
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                Aguardando preenchimento completo da Anamnese pela família
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSimulando(true)}
            className="py-1.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            title="Demonstrar como a pré-análise funciona cruzando respostas e protocolos"
          >
            <span>🔍 Simular Caso Clínico de Exemplo</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Assistente de Pré-Análise Clínica"
      className="p-4 rounded-2xl border border-[#4C6C54]/30 bg-gradient-to-br from-[#FFFDF8] via-white to-emerald-50/50 space-y-3.5 shadow-2xs"
    >
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[#4C6C54] text-white flex items-center justify-center shadow-xs">
            <Sparkles className="h-4 w-4 text-amber-200" />
          </div>
          <div>
            <h4 className="text-xs font-black text-[#3D5A45] uppercase tracking-wide">
              ✨ Assistente de Pré-Análise Clínica (56 Parâmetros)
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">
              {analise.simulandoExemplo
                ? "Modo Demonstração: Cruzamento simulado com caso clínico típico"
                : "Cruzamento automático e estrito das respostas reais da anamnese deste paciente"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {analise.simulandoExemplo && (
            <button
              type="button"
              onClick={() => setSimulando(false)}
              className="text-[10px] font-extrabold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 py-0.5 px-2 rounded-full cursor-pointer"
            >
              ✕ Sair da Simulação
            </button>
          )}
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            {analise.recomendacoes.length} conduta(s) sugerida(s)
          </span>
        </div>
      </div>

      {analise.simulandoExemplo && (
        <div className="flex items-start gap-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-900 font-semibold">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            Exibindo caso demonstrativo simulado (Seletividade severa por texturas, apoio de telas e biscoito de polvilho).
          </span>
        </div>
      )}

      {/* 🚩 SINAIS DE ATENÇÃO */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
          🚩 Sinais de Atenção Mapeados
        </span>
        {analise.sinaisAtencao.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {analise.sinaisAtencao.map((s) => (
              <span
                key={s.rotulo}
                className="inline-flex items-center gap-1 py-1 px-2.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold"
              >
                <AlertTriangle className="h-3 w-3" /> {s.rotulo}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 italic">Nenhum sinal crítico detectado nas respostas.</p>
        )}
      </div>

      {/* 💡 CONDUTAS RECOMENDADAS */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
          💡 Condutas Recomendadas para este Caso
        </span>
        {analise.recomendacoes.length === 0 && (
          <p className="text-[11px] text-slate-500 italic">
            Sem correspondência no banco. Use a barra de respostas comuns abaixo para escolher um protocolo manualmente.
          </p>
        )}
        <div className="space-y-2">
          {analise.recomendacoes.slice(0, 4).map(({ protocolo, gatilhosEncontrados, pontuacao }) => {
            const expandido = expandidoId === protocolo.id;
            return (
              <div key={protocolo.id} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
                <button
                  type="button"
                  onClick={() => setExpandidoId(expandido ? null : protocolo.id)}
                  className="w-full flex items-center justify-between gap-2 text-left cursor-pointer"
                  aria-expanded={expandido}
                >
                  <span className="text-xs font-extrabold text-slate-900">{protocolo.tituloCurto}</span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {pontuacao} indício(s)
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${expandido ? "rotate-180" : ""}`} />
                  </span>
                </button>
                <p className="text-[10px] text-slate-500">
                  Indícios: <span className="font-semibold text-slate-700">{gatilhosEncontrados.slice(0, 5).join(", ")}</span>
                </p>

                {expandido && (
                  <div className="space-y-2 text-[11px] text-slate-700 border-t border-slate-100 pt-2">
                    <p className="leading-relaxed italic">&ldquo;{protocolo.parecerClinicoSugerido}&rdquo;</p>
                    <p>
                      <strong>Alimentos-alvo:</strong> {protocolo.alimentosAlvoSugeridos.join(", ")}
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {protocolo.metasSemanaisSugeridas.map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => onAplicarParecer(protocolo)}
                    className="py-1.5 px-2.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-200 text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <FileText className="h-3 w-3" /> Aplicar no Parecer do Prontuário
                  </button>
                  <button
                    type="button"
                    onClick={() => onGerarDevolutiva(protocolo)}
                    className="py-1.5 px-2.5 rounded-lg bg-[#4C6C54] hover:bg-[#3a5340] text-white text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Mail className="h-3 w-3" /> Gerar Devolutiva com base nesta análise
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
