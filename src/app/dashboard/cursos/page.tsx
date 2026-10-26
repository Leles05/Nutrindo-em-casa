"use client";

import { useState, useEffect } from "react";
import {
  Play, CheckCircle2, FileText, ArrowRight, ArrowLeft,
  Check, Trophy, Sparkles, ChevronLeft, ChevronRight, Circle, X, Lock
} from "lucide-react";
import Link from "next/link";
import { imprimirMaterialAula } from "@/lib/pdfTimbrado";

interface Aula {
  id: number;
  titulo: string;
  duracao: string;
  concluido: boolean;
  atual: boolean;
  descricao: string;
}

export default function PaginaCursos() {
  const [toastConquista, setToastConquista] = useState(false);
  const [avisoBloqueio, setAvisoBloqueio] = useState("");

  const dispararAviso = (msg: string) => {
    setAvisoBloqueio(msg);
    setTimeout(() => setAvisoBloqueio(""), 3500);
  };

  const obterStorageKey = () => {
    if (typeof window === "undefined") return "nutrindo_aulas_concluidas";
    const email = localStorage.getItem("nutrindo_user_email") || "padrao";
    return `nutrindo_aulas_concluidas_${email.toLowerCase().trim()}`;
  };

  const [aulas, setAulas] = useState<Aula[]>([
    {
      id: 1,
      titulo: "Terapia Alimentar Descomplicada",
      duracao: "05:20",
      concluido: false,
      atual: true,
      descricao: "Compreenda as bases da Escalada do Comer e como a aproximação gradual diminui a ansiedade da criança à mesa."
    },
    {
      id: 2,
      titulo: "Sinais de Alerta na Alimentação",
      duracao: "12:45",
      concluido: false,
      atual: false,
      descricao: "Aprenda a diferenciar uma fase passageira de desinteresse de uma verdadeira sensibilidade tátil e olfativa."
    },
    {
      id: 3,
      titulo: "Manejo da Recusa e Comunicação",
      duracao: "18:30",
      concluido: false,
      atual: false,
      descricao: "Ferramentas práticas de diálogo para evitar chantagens e barganhas na hora das principais refeições."
    },
    {
      id: 4,
      titulo: "Construindo o Prato Seguro",
      duracao: "14:10",
      concluido: false,
      atual: false,
      descricao: "Como combinar alimentos de conforto com novos alimentos de teste no mesmo prato sem gerar rejeição imediata."
    }
  ]);

  // Carrega progresso salvo no localStorage e sincroniza com o banco de dados
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = obterStorageKey();
    const salvas = localStorage.getItem(key);
    if (salvas) {
      try {
        const concluidasIds: number[] = JSON.parse(salvas);
        setAulas((prev) => {
          let encontrouAtual = false;
          return prev.map((a, idx) => {
            const concl = concluidasIds.includes(a.id);
            let atual = false;
            if (!encontrouAtual && !concl) {
              atual = true;
              encontrouAtual = true;
            }
            return { ...a, concluido: concl, atual: atual || (idx === 0 && !encontrouAtual) };
          });
        });
      } catch (err) {
        console.warn("Aviso ao carregar progresso de aulas:", err);
      }
    }

    const email = localStorage.getItem("nutrindo_user_email") || "";
    if (email) {
      fetch(`/api/configuracoes?email=${encodeURIComponent(email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.aulas_concluidas && Array.isArray(data.aulas_concluidas) && data.aulas_concluidas.length > 0) {
            const concluidasIds: number[] = data.aulas_concluidas;
            setAulas((prev) => {
              let encontrouAtual = false;
              return prev.map((a, idx) => {
                const concl = concluidasIds.includes(a.id);
                let atual = false;
                if (!encontrouAtual && !concl) {
                  atual = true;
                  encontrouAtual = true;
                }
                return { ...a, concluido: concl, atual: atual || (idx === 0 && !encontrouAtual) };
              });
            });
            localStorage.setItem(key, JSON.stringify(concluidasIds));
          }
        })
        .catch(() => {});
    }
  }, []);

  const aulaAtualIndex = aulas.findIndex((a) => a.atual);
  const aulaAtual = aulas[aulaAtualIndex] || aulas[0];

  const totalConcluidas = aulas.filter((a) => a.concluido).length;
  const porcentagemProgresso = Math.round((totalConcluidas / aulas.length) * 100);

  // Regra Sequencial: Aula N só fica desbloqueada se a Aula N-1 estiver concluída
  const isAulaDesbloqueada = (index: number) => {
    if (index === 0) return true;
    return Boolean(aulas[index - 1]?.concluido);
  };

  const salvarProgresso = (novasAulas: Aula[]) => {
    setAulas(novasAulas);
    if (typeof window !== "undefined") {
      const ids = novasAulas.filter((a) => a.concluido).map((a) => a.id);
      localStorage.setItem(obterStorageKey(), JSON.stringify(ids));
      window.dispatchEvent(new Event("nutrindo_cursos_atualizado"));

      const email = localStorage.getItem("nutrindo_user_email") || "";
      if (email) {
        fetch("/api/configuracoes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, aulas_concluidas: ids }),
        }).catch((err) => console.warn("Aviso ao persistir aulas:", err));
      }
    }
  };

  // Alterna o checkbox manual da aula atual
  const alternarConclusaoAtual = () => {
    const novas = aulas.map((a, idx) =>
      idx === aulaAtualIndex ? { ...a, concluido: !a.concluido } : a
    );
    salvarProgresso(novas);
  };

  // Garante a conclusão sem desmarcar e celebra a finalização
  const finalizarModulo = () => {
    const novas = aulas.map((a, idx) =>
      idx === aulaAtualIndex ? { ...a, concluido: true } : a
    );
    salvarProgresso(novas);
    setToastConquista(true);
  };

  const irParaProximaAula = () => {
    if (!aulaAtual.concluido) {
      dispararAviso("Marque a aula atual como concluída para liberar a próxima aula.");
      return;
    }
    if (aulaAtualIndex < aulas.length - 1) {
      setAulas((prev) =>
        prev.map((a, idx) => ({
          ...a,
          atual: idx === aulaAtualIndex + 1
        }))
      );
    }
  };

  const irParaAulaAnterior = () => {
    if (aulaAtualIndex > 0) {
      setAulas((prev) =>
        prev.map((a, idx) => ({
          ...a,
          atual: idx === aulaAtualIndex - 1
        }))
      );
    }
  };

  const selecionarAula = (index: number) => {
    if (!isAulaDesbloqueada(index)) {
      dispararAviso("Marque a aula atual como concluída para liberar a próxima aula.");
      return;
    }
    setAulas((prev) =>
      prev.map((a, idx) => ({
        ...a,
        atual: idx === index
      }))
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 animation-fade-in pb-4 relative">

      {/* TOAST DE CONQUISTA AO FINALIZAR O MÓDULO */}
      {toastConquista && (
        <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 p-4 bg-[#4C6C54] text-white text-xs font-bold rounded-2xl shadow-2xl flex items-center gap-3 animation-fade-in border border-emerald-400/30">
          <Trophy className="h-5 w-5 text-amber-300 shrink-0" />
          <div>
            <p className="font-extrabold text-sm">Parabéns! Módulo 1 Concluído! 🎉</p>
            <p className="text-white/80 text-[11px] font-medium">Você concluiu todas as 4 aulas deste ciclo terapêutico.</p>
          </div>
          <button
            type="button"
            onClick={() => setToastConquista(false)}
            className="text-white/70 hover:text-white ml-2 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-[#4C6C54]">
            Terapia Alimentar Descomplicada
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Módulo 1: Entendendo a Seletividade Sensorial
          </p>
        </div>

        {porcentagemProgresso === 100 && (
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs">
            <Trophy className="h-4 w-4 text-emerald-600" /> Módulo Concluído! (100%)
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

        {/* PLAYER E CONTROLES (8 COLUNAS) */}
        <div className="lg:col-span-8 space-y-3.5">
          {/* IFRAME RESPONSIVO DO VÍDEO (YOUTUBE EMBED) */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg border border-slate-200">
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src="https://www.youtube.com/embed/aqz-KE-bpKQ?rel=0&modestbranding=1"
              title="Aula de Demonstração"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen

            ></iframe>
          </div>

          {/* PAINEL DE CONTROLE DA AULA */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#EB6D57] bg-[#EB6D57]/10 px-2 py-0.5 rounded">
                  Aula {aulaAtualIndex + 1} de {aulas.length}
                </span>
                <h2 className="text-base font-extrabold text-slate-800 mt-1">
                  {aulaAtual.titulo}
                </h2>
              </div>

              {/* NAVEGAÇÃO E CONCLUSÃO PROTEGIDA */}
              <div className="flex items-center gap-1.5 shrink-0">
                {aulaAtualIndex > 0 && (
                  <button
                    type="button"
                    onClick={irParaAulaAnterior}
                    className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all cursor-pointer"
                    title="Aula anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={alternarConclusaoAtual}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${aulaAtual.concluido
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300"
                    }`}
                >
                  {aulaAtual.concluido ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      <span>Concluído ✅</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-700" />
                      <span>Marcar como Concluída</span>
                    </>
                  )}
                </button>

                {aulaAtualIndex < aulas.length - 1 ? (
                  <button
                    type="button"
                    onClick={irParaProximaAula}
                    className="px-3.5 py-1.5 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    Próxima <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                ) : aulaAtual.concluido ? (
                  <button
                    type="button"
                    onClick={() => setToastConquista(true)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    Módulo Concluído <Trophy className="h-3.5 w-3.5 text-amber-300" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={finalizarModulo}
                    className="px-3.5 py-1.5 bg-[#EB6D57] hover:bg-[#d95a44] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    Finalizar <Sparkles className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {aulaAtual.descricao}
            </p>

            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  imprimirMaterialAula({
                    id: String(aulaAtual.id),
                    titulo: aulaAtual.titulo,
                    modulo: "Módulo 1 • Fundamentos da Seletividade Alimentar",
                    resumo: aulaAtual.descricao,
                  });
                }}
                className="inline-flex items-center gap-2.5 p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors text-xs font-bold text-slate-700 cursor-pointer"
              >
                <div className="p-1 bg-white rounded-md text-[#EB6D57] shadow-2xs">
                  <FileText className="h-3.5 w-3.5" />
                </div>
                <span>Baixar Material de Apoio da Aula (PDF)</span>
              </button>

              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> +50 pts ao concluir
              </span>
            </div>
          </div>
        </div>

        {/* LISTA LATERAL (4 COLUNAS) */}
        <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs space-y-3">

          <div className="space-y-1.5 border-b border-slate-100 pb-2.5">
            <h3 className="text-sm font-extrabold text-slate-800">Conteúdo do Módulo</h3>
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span>{totalConcluidas} de {aulas.length} aulas concluídas</span>
              <span className={porcentagemProgresso === 100 ? "text-emerald-600 font-extrabold" : "text-[#EB6D57]"}>
                {porcentagemProgresso}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${porcentagemProgresso === 100 ? "bg-emerald-500" : "bg-[#EB6D57]"
                  }`}
                style={{ width: `${porcentagemProgresso}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {aulas.map((aula, idx) => {
              const desbloqueada = isAulaDesbloqueada(idx);

              return (
                <div
                  key={aula.id}
                  onClick={() => selecionarAula(idx)}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                    !desbloqueada
                      ? "border-slate-100 bg-slate-50/70 text-slate-400 opacity-60 hover:opacity-80"
                      : aula.atual
                        ? "border-[#EB6D57] bg-[#EB6D57]/5 shadow-xs ring-1 ring-[#EB6D57]/30"
                        : "border-slate-100 hover:bg-slate-50"
                  }`}
                  title={!desbloqueada ? "Conclua a aula anterior para desbloquear esta aula" : aula.titulo}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {!desbloqueada ? (
                      <div className="h-5 w-5 rounded-full bg-slate-100 border border-slate-200 text-amber-500 flex items-center justify-center shrink-0">
                        <Lock className="h-3 w-3" />
                      </div>
                    ) : aula.concluido ? (
                      <div className="h-5 w-5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    ) : aula.atual ? (
                      <div className="h-5 w-5 rounded-full bg-[#EB6D57]/10 text-[#EB6D57] flex items-center justify-center shrink-0">
                        <Play className="h-3 w-3 fill-current translate-x-0.2" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-slate-200 text-slate-300 flex items-center justify-center shrink-0">
                        <Circle className="h-2 w-2 fill-slate-200" />
                      </div>
                    )}

                    <div className="truncate">
                      <h4 className={`text-xs font-bold truncate ${
                        !desbloqueada
                          ? "text-slate-400"
                          : aula.atual
                            ? "text-[#EB6D57]"
                            : aula.concluido
                              ? "text-slate-700"
                              : "text-slate-600"
                      }`}>
                        {aula.titulo}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium">{aula.duracao}</span>
                    </div>
                  </div>

                  {!desbloqueada ? (
                    <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  ) : aula.atual ? (
                    <span className="text-[9px] font-extrabold text-[#EB6D57] bg-[#EB6D57]/10 px-1.5 py-0.5 rounded uppercase shrink-0">
                      Assistindo
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* AVISO SUAVE DE BLOQUEIO SEQUENCIAL */}
      {avisoBloqueio && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 p-3.5 bg-amber-500 text-slate-900 text-xs font-extrabold rounded-2xl shadow-xl flex items-center gap-2 border border-amber-600 animate-in fade-in slide-in-from-bottom-2">
          <Lock className="h-4 w-4 shrink-0 text-slate-900" />
          <span>{avisoBloqueio}</span>
        </div>
      )}
    </div>
  );
}