"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Printer,
  Calendar,
  CheckCircle2,
  Circle,
  Apple,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  HeartHandshake,
  Loader2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { imprimirDocumentoTimbrado } from "@/lib/pdfTimbrado";
import Link from "next/link";

interface Meta {
  id?: string;
  texto: string;
  concluida?: boolean;
}

interface Devolutiva {
  id: string;
  user_email: string;
  semana_ref: string;
  parecer_clinico: string;
  alimentos_alvo: string[] | string;
  metas_semana: Meta[] | string[];
  profissional?: string;
  created_at: string;
}

export default function DevolutivasPage() {
  const [carregando, setCarregando] = useState(true);
  const [devolutivas, setDevolutivas] = useState<Devolutiva[]>([]);
  const [perfil, setPerfil] = useState<{ nome?: string; nome_crianca?: string; idade_crianca?: string } | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [expandedHistoricoId, setExpandedHistoricoId] = useState<string | null>(null);
  const [salvandoMeta, setSalvandoMeta] = useState(false);

  useEffect(() => {
    async function carregarDados() {
      try {
        let email = "";
        if (typeof window !== "undefined") {
          email =
            localStorage.getItem("nutrindo_user_email") ||
            localStorage.getItem("usuario_email") ||
            "";
        }
        if (!email && supabase) {
          const { data: sessionData } = await supabase.auth.getSession();
          email = sessionData?.session?.user?.email || "";
        }

        email = email.toLowerCase().trim();
        if (!email) {
          email = "lucaslimaleles@gmail.com";
        }
        setUserEmail(email);

        const res = await fetch(`/api/devolutivas?email=${encodeURIComponent(email)}`);
        const data = await res.json();

        if (data.success) {
          setDevolutivas(data.devolutivas || []);
          if (data.profile) {
            setPerfil(data.profile);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar devolutivas:", err);
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, []);

  // Helper para normalizar alimentos alvo
  const normalizarAlimentos = (alimentos: string[] | string | undefined): string[] => {
    if (!alimentos) return [];
    if (Array.isArray(alimentos)) return alimentos;
    if (typeof alimentos === "string") {
      return alimentos.split(",").map((a) => a.trim()).filter(Boolean);
    }
    return [];
  };

  // Helper para normalizar metas
  const normalizarMetas = (metas: Meta[] | string[] | undefined): Meta[] => {
    if (!metas || !Array.isArray(metas)) return [];
    return metas.map((m, idx) => {
      if (typeof m === "string") {
        return { id: `meta-${idx}`, texto: m, concluida: false };
      }
      return {
        id: m.id || `meta-${idx}`,
        texto: m.texto || "",
        concluida: !!m.concluida,
      };
    });
  };

  const handleToggleMeta = async (devolutivaId: string, metaIdx: number) => {
    const dev = devolutivas.find((d) => d.id === devolutivaId);
    if (!dev) return;

    const metas = normalizarMetas(dev.metas_semana);
    metas[metaIdx] = {
      ...metas[metaIdx],
      concluida: !metas[metaIdx].concluida,
    };

    // Atualização otimista
    const updated = devolutivas.map((d) => (d.id === devolutivaId ? { ...d, metas_semana: metas } : d));
    setDevolutivas(updated);

    try {
      setSalvandoMeta(true);
      await fetch("/api/devolutivas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: devolutivaId,
          metas_semana: metas,
          email: userEmail,
        }),
      });
    } catch (err) {
      console.error("Erro ao salvar meta:", err);
    } finally {
      setSalvandoMeta(false);
    }
  };

  const handleImprimir = (dev: Devolutiva) => {
    const alimentos = normalizarAlimentos(dev.alimentos_alvo);
    const metas = normalizarMetas(dev.metas_semana);

    const dataFormatada = dev.created_at
      ? new Date(dev.created_at).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "Data da consulta";

    imprimirDocumentoTimbrado({
      tipo: "devolutiva",
      paciente: perfil?.nome || "Responsável",
      crianca: perfil?.nome_crianca || "Criança",
      idadeCrianca: perfil?.idade_crianca || "",
      data: dataFormatada,
      semanaRef: dev.semana_ref,
      devolutiva: {
        titulo: dev.semana_ref,
        parecerClinico: dev.parecer_clinico,
        alimentosAlvo: alimentos,
        metas: metas,
      },
    });
  };

  if (carregando) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-[#3D5A45] mb-3" />
        <p className="text-sm font-semibold">Carregando as orientações da Dra. Laís...</p>
      </div>
    );
  }

  const devolutivaAtual = devolutivas.length > 0 ? devolutivas[0] : null;
  const historicoDevolutivas = devolutivas.length > 1 ? devolutivas.slice(1) : [];

  const metasAtuais = devolutivaAtual ? normalizarMetas(devolutivaAtual.metas_semana) : [];
  const alimentosAtuais = devolutivaAtual ? normalizarAlimentos(devolutivaAtual.alimentos_alvo) : [];
  const metasConcluidasCount = metasAtuais.filter((m) => m.concluida).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* CABEÇALHO DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3D5A45] mb-1">
            <HeartHandshake className="h-4 w-4" />
            <span>Acompanhamento Personalizado</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Orientações da Nutri
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Parecer clínico, metas e passos graduais para o acolhimento à mesa • Dra. Laís Leles (CRN-8 18878)
          </p>
        </div>

        {devolutivaAtual && (
          <button
            onClick={() => handleImprimir(devolutivaAtual)}
            className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:border-[#3D5A45] text-slate-700 hover:text-[#3D5A45] font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4 text-[#3D5A45]" />
            <span>🖨️ Baixar em PDF</span>
          </button>
        )}
      </div>

      {/* ESTADO VAZIO: NENHUMA DEVOLUTIVA AINDA */}
      {!devolutivaAtual && (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 text-center shadow-xs space-y-4">
          <div className="h-16 w-16 bg-[#3D5A45]/10 text-[#3D5A45] rounded-3xl mx-auto flex items-center justify-center">
            <FileText className="h-8 w-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg font-black text-slate-900">
              Sua primeira orientação semanal está sendo preparada
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              A Dra. Laís elabora cada devolutiva após analisar a sua anamnese e os registros do diário alimentar. Assim que for publicada, você encontrará aqui seu plano de ação calmo e sem pressão.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Link
              href="/dashboard/diario"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#3D5A45] hover:bg-[#2e4434] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all"
            >
              <span>Registrar Refeição no Diário</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/dashboard/chat"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              <span>Tirar Dúvida no Chat</span>
            </Link>
          </div>
        </div>
      )}

      {/* CARD PRINCIPAL: ORIENTAÇÃO DA SEMANA ATUAL */}
      {devolutivaAtual && (
        <div className="bg-white rounded-3xl border border-[#3D5A45]/20 shadow-sm overflow-hidden">
          {/* Header do Card da Semana */}
          <div className="bg-gradient-to-r from-[#3D5A45]/10 via-[#3D5A45]/5 to-transparent p-6 sm:p-8 border-b border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3D5A45] text-white font-black text-[11px] uppercase tracking-wider">
                <Sparkles className="h-3 w-3" />
                Semana Atual em Destaque
              </span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Calendar className="h-3.5 w-3.5 text-[#3D5A45]" />
                <span>
                  {devolutivaAtual.created_at
                    ? new Date(devolutivaAtual.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "Semana Atual"}
                </span>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
              {devolutivaAtual.semana_ref}
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Elaborado com carinho por {devolutivaAtual.profissional || "Dra. Laís Leles • CRN-8 18878"}
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* PARECER CLÍNICO COM TIPOGRAFIA GENEROSA E ESPAÇADA */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Parecer Clínico & Conduta da Semana
              </h3>
              <div className="text-slate-800 text-sm sm:text-base leading-relaxed bg-[#FFFDF8] p-5 sm:p-6 rounded-2xl border border-amber-100/80 whitespace-pre-line font-normal">
                {devolutivaAtual.parecer_clinico}
              </div>
            </div>

            {/* ALIMENTOS-ALVO DA SEMANA */}
            {alimentosAtuais.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Apple className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Alimentos-Alvo da Semana (Sem Pressão de Provar)</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Regra: Foco em tolerar no prato de apoio
                  </span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {alimentosAtuais.map((alim, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 font-bold text-xs"
                    >
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>{alim}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CHECKLIST INTERATIVO DE METAS PRÁTICAS */}
            {metasAtuais.length > 0 && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#3D5A45]" />
                      <span>Metas Práticas da Família para Esta Semana</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Marque com um clique conforme você e a criança realizarem no dia a dia:
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    {metasConcluidasCount} de {metasAtuais.length} concluídas
                  </span>
                </div>

                <div className="space-y-2.5">
                  {metasAtuais.map((meta, idx) => (
                    <div
                      key={meta.id || idx}
                      onClick={() => handleToggleMeta(devolutivaAtual.id, idx)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                        meta.concluida
                          ? "bg-emerald-50/60 border-emerald-200 text-slate-600"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-900 shadow-2xs"
                      }`}
                    >
                      <div className="pt-0.5 shrink-0">
                        {meta.concluida ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 fill-emerald-100" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-300 hover:text-[#3D5A45]" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span
                          className={`text-xs sm:text-sm font-semibold leading-relaxed block ${
                            meta.concluida ? "line-through text-slate-400" : "text-slate-800"
                          }`}
                        >
                          {meta.texto}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LINHA DO TEMPO: ORIENTAÇÕES DAS SEMANAS ANTERIORES */}
      {historicoDevolutivas.length > 0 && (
        <div className="space-y-4 pt-6">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <h2 className="text-lg font-black text-slate-900">
              Orientações de Semanas Anteriores
            </h2>
            <span className="text-xs font-bold text-slate-400">
              ({historicoDevolutivas.length})
            </span>
          </div>

          <div className="space-y-3">
            {historicoDevolutivas.map((dev) => {
              const isExpanded = expandedHistoricoId === dev.id;
              const metas = normalizarMetas(dev.metas_semana);
              const alimentos = normalizarAlimentos(dev.alimentos_alvo);

              return (
                <div
                  key={dev.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
                >
                  <div
                    onClick={() => setExpandedHistoricoId(isExpanded ? null : dev.id)}
                    className="p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-400">
                          {dev.created_at
                            ? new Date(dev.created_at).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : ""}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {dev.semana_ref}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImprimir(dev);
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-[#3D5A45] hover:bg-slate-100 transition-colors"
                        title="Baixar em PDF"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-5 pt-0 border-t border-slate-100 space-y-4 mt-2 text-xs">
                      <div className="text-slate-700 bg-slate-50 p-4 rounded-xl leading-relaxed whitespace-pre-line">
                        {dev.parecer_clinico}
                      </div>

                      {alimentos.length > 0 && (
                        <div>
                          <span className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">
                            Alimentos trabalhados:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {alimentos.map((a, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold text-[11px]"
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {metas.length > 0 && (
                        <div>
                          <span className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">
                            Metas daquela semana:
                          </span>
                          <div className="space-y-1.5">
                            {metas.map((m, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 text-slate-600 text-xs"
                              >
                                {m.concluida ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                ) : (
                                  <Circle className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                                )}
                                <span className={m.concluida ? "line-through text-slate-400" : ""}>
                                  {m.texto}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
