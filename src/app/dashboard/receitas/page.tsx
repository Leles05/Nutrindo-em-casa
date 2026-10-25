"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  UtensilsCrossed,
  Sparkles,
  Heart,
  Clock,
  ShieldCheck,
  ChevronRight,
  Star,
  Filter,
  CheckCircle2,
  X,
  ChefHat,
  Eye,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  BookOpen,
  Printer,
} from "lucide-react";
import { imprimirDocumentoTimbrado } from "@/lib/pdfTimbrado";
import {
  Receita,
  RefeicaoPlano,
  RECEITAS_PADRAO,
  PLANO_ALIMENTAR_PADRAO,
  NOTA_ORIENTACAO_PADRAO,
} from "@/data/receitas";

type AbaAtiva = "plano" | "receitas";

export default function PaginaReceitasEPlano() {
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>("plano");
  const [receitas, setReceitas] = useState<Receita[]>(RECEITAS_PADRAO);
  const [idsRecomendados, setIdsRecomendados] = useState<string[]>([
    "bolinho-crocante-brocolis-queijo",
    "panqueca-aveia-banana",
    "chips-cenoura-batata-doce",
    "nuggets-caseiros-frango-milho",
  ]);
  const [notaOrientacao, setNotaOrientacao] = useState(NOTA_ORIENTACAO_PADRAO);
  const [filtroTextura, setFiltroTextura] = useState<string>("Todas");
  const [apenasRecomendadas, setApenasRecomendadas] = useState(false);
  const [receitaModalAberta, setReceitaModalAberta] = useState<Receita | null>(null);

  // Sincronização reativa com o que a Nutri salvar no /nutri
  const sincronizarComLocalStorage = () => {
    if (typeof window === "undefined") return;

    try {
      const email = localStorage.getItem("nutrindo_user_email") || "lucas@email.com";
      
      // Carrega receitas recomendadas específicas ou gerais
      const recomendadasSalvas =
        localStorage.getItem(`nutrindo_receitas_recomendadas_${email}`) ||
        localStorage.getItem("nutrindo_receitas_recomendadas");
      if (recomendadasSalvas) {
        setIdsRecomendados(JSON.parse(recomendadasSalvas));
      }

      // Carrega nota de orientação da nutricionista
      const notaSalva =
        localStorage.getItem(`nutrindo_nota_plano_${email}`) ||
        localStorage.getItem("nutrindo_nota_plano");
      if (notaSalva) {
        setNotaOrientacao(notaSalva);
      }

      // Sincronização em tempo real da prescrição salva no Supabase
      fetch(`/api/nutri?user_email=${encodeURIComponent(email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.prescricao) {
            if (
              Array.isArray(data.prescricao.receitas_recomendadas_ids) &&
              data.prescricao.receitas_recomendadas_ids.length > 0
            ) {
              setIdsRecomendados(data.prescricao.receitas_recomendadas_ids);
              localStorage.setItem(
                `nutrindo_receitas_recomendadas_${email}`,
                JSON.stringify(data.prescricao.receitas_recomendadas_ids)
              );
            }
            if (data.prescricao.orientacao_prato_seguro) {
              setNotaOrientacao(data.prescricao.orientacao_prato_seguro);
              localStorage.setItem(`nutrindo_nota_plano_${email}`, data.prescricao.orientacao_prato_seguro);
            }
          }
        })
        .catch((err) => console.warn("Aviso ao buscar prescrição na nuvem:", err));
    } catch (err) {
      console.warn("Aviso ao carregar dados do plano/receitas:", err);
    }
  };

  useEffect(() => {
    sincronizarComLocalStorage();

    if (typeof window !== "undefined") {
      localStorage.setItem("nutrindo_visitou_receitas", "true");
      window.dispatchEvent(new Event("nutrindo_visitou_receitas_alterado"));
    }

    const handleAtualizacao = () => sincronizarComLocalStorage();
    window.addEventListener("storage", handleAtualizacao);
    window.addEventListener("nutrindo_receitas_atualizadas", handleAtualizacao);
    window.addEventListener("nutrindo_nota_plano_atualizada", handleAtualizacao);

    return () => {
      window.removeEventListener("storage", handleAtualizacao);
      window.removeEventListener("nutrindo_receitas_atualizadas", handleAtualizacao);
      window.removeEventListener("nutrindo_nota_plano_atualizada", handleAtualizacao);
    };
  }, []);

  // Filtragem de receitas
  const receitasFiltradas = receitas.filter((r) => {
    const ehRecomendada = idsRecomendados.includes(r.id);
    if (apenasRecomendadas && !ehRecomendada) return false;

    if (filtroTextura === "Todas") return true;
    if (filtroTextura === "Finger Food") {
      return r.textura === "Finger Food" || r.texturasSecundarias?.includes("Finger Food");
    }
    return r.textura === filtroTextura;
  });

  const handleImprimirPlano = () => {
    const nomeResponsavel =
      typeof window !== "undefined"
        ? localStorage.getItem("nutrindo_user_nome") || "Responsável"
        : "Responsável";

    const receitasParaImprimir = receitas
      .filter((r) => idsRecomendados.includes(r.id))
      .map((r) => ({
        titulo: r.titulo,
        textura: r.textura,
        tempoPreparo: r.tempoPreparo,
        rendimento: r.rendimento,
        ingredientes: r.ingredientes,
        modoPreparo: r.modoPreparo,
        estrategiaSensorial: r.estrategiaSensorial,
      }));

    const refeicoesParaImprimir = PLANO_ALIMENTAR_PADRAO.map((p) => ({
      nome: p.nome,
      horario: p.horarioSugerido,
      seguro: `${p.alimentoSeguro.nome} (${p.alimentoSeguro.descricao})`,
      parecido: `${p.alimentoParecido.nome} (${p.alimentoParecido.descricao})`,
      exposicao: `${p.alimentoExposicao.nome} (${p.alimentoExposicao.descricao})`,
    }));

    imprimirDocumentoTimbrado({
      tipo: "plano",
      paciente: nomeResponsavel,
      crianca: "Pedro Lima",
      orientacaoPrato: notaOrientacao,
      composicaoPrato: { conforto: 70, ponte: 20, desafio: 10 },
      refeicoes: refeicoesParaImprimir,
      receitas: receitasParaImprimir,
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-8 animate-in fade-in duration-200">
      
      {/* CABEÇALHO DO MÓDULO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#4C6C54]/10 text-[#4C6C54] tracking-wider flex items-center gap-1">
              <ChefHat className="h-3 w-3" /> Terapia Alimentar Nutricional
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              Método Dra. Laís Leles • CRN-8 18878
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            🍲 Plano Alimentar & Receitas Sensoriais
          </h1>
          <p className="text-xs text-slate-500 max-w-2xl">
            Composição sem pressão para as refeições em família e receitas testadas para aproximação gradual de texturas.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleImprimirPlano}
            className="py-2 px-3.5 rounded-xl bg-[#4C6C54] hover:bg-[#3a5340] text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Baixar ou Imprimir Plano Alimentar & Prato Seguro com Timbrado Oficial da Dra. Laís Leles"
          >
            <Printer className="h-4 w-4" />
            <span>🖨️ PDF Timbrado</span>
          </button>

          <Link
            href="/dashboard"
            className="py-2 px-3.5 rounded-xl bg-[#F0EAE1] hover:bg-[#e4dcce] text-slate-700 text-xs font-bold transition-all inline-flex items-center gap-1.5"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            <span>Voltar ao Início</span>
          </Link>
        </div>
      </div>

      {/* SELETOR DE ABAS PRINCIPAIS */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          type="button"
          onClick={() => setAbaAtiva("plano")}
          className={`py-2.5 px-5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            abaAtiva === "plano"
              ? "bg-[#4C6C54] text-white shadow-xs"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80"
          }`}
        >
          <UtensilsCrossed className="h-4 w-4" />
          <span>🍽️ Meu Plano Alimentar & Prato Seguro</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("receitas")}
          className={`py-2.5 px-5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            abaAtiva === "receitas"
              ? "bg-[#4C6C54] text-white shadow-xs"
              : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>👩‍🍳 Caderno de Receitas Sensoriais ({receitas.length})</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* ABA A: MEU PLANO ALIMENTAR & PRATO SEGURO */}
      {/* ===================================================================== */}
      {abaAtiva === "plano" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* BANNER EDUCATIVO: O MÉTODO DA COMPOSIÇÃO SEM PRESSÃO */}
          <div className="bg-gradient-to-br from-emerald-50/80 via-white to-amber-50/60 p-5 sm:p-6 rounded-3xl border border-emerald-200/70 shadow-2xs space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-[#4C6C54] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                    Método Clínico: Composição sem Pressão
                  </h2>
                  <p className="text-xs text-slate-600">
                    Como organizar o prato para desativar a reação de alerta e medo da criança à mesa
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 tracking-wide">
                Protocolo Ativo da Família
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="bg-white/90 p-3.5 rounded-2xl border border-emerald-100 shadow-2xs space-y-1">
                <div className="flex items-center gap-2 text-emerald-800">
                  <span className="text-base">🛡️</span>
                  <h3 className="text-xs font-black uppercase tracking-wide">Alimento Seguro (70%)</h3>
                </div>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  <strong>Base de Conforto:</strong> Alimento 100% previsível que a criança consome sem hesitar. Garante saciedade e diminui o cortisol de alerta logo ao sentar.
                </p>
              </div>

              <div className="bg-white/90 p-3.5 rounded-2xl border border-sky-100 shadow-2xs space-y-1">
                <div className="flex items-center gap-2 text-[#2A546D]">
                  <span className="text-base">🌉</span>
                  <h3 className="text-xs font-black uppercase tracking-wide">Alimento Parecido (20%)</h3>
                </div>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  <strong>Ponte Sensorial:</strong> Compartilha cor, formato ou textura (ex: crocância) com o alimento seguro, promovendo uma transição segura e sem sustos.
                </p>
              </div>

              <div className="bg-white/90 p-3.5 rounded-2xl border border-amber-100 shadow-2xs space-y-1">
                <div className="flex items-center gap-2 text-amber-900">
                  <span className="text-base">🌱</span>
                  <h3 className="text-xs font-black uppercase tracking-wide">Alimento de Exposição (10%)</h3>
                </div>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  <strong>Sem Obrigação de Comer:</strong> Fica no cantinho ou no prato de apoio. A meta é apenas tolerar visualmente, cheirar ou tocar com talheres.
                </p>
              </div>
            </div>
          </div>

          {/* BOX: NOTA DE ORIENTAÇÃO DA DRA. LAÍS PARA A FAMÍLIA */}
          <div className="bg-[#FFFDF8] p-5 sm:p-6 rounded-3xl border border-amber-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-sm">
                  🩺
                </div>
                <div>
                  <h3 className="text-xs font-black text-amber-950 uppercase tracking-wide">
                    Direcionamento Clínico Individual da Dra. Laís
                  </h3>
                  <p className="text-[11px] text-amber-800/80">
                    Orientação atualizada para o momento alimentar do seu filho
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                CRN-8 18878
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed italic bg-white/80 p-4 rounded-2xl border border-amber-100/80">
              &ldquo;{notaOrientacao}&rdquo;
            </p>
          </div>

          {/* GUIA DAS 4 REFEIÇÕES DO DIA */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Estrutura das Refeições do Dia
                </h3>
                <p className="text-xs text-slate-500">
                  Exemplo de montagem prática baseada nos alimentos prescritos
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400">
                4 momentos alimentares
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PLANO_ALIMENTAR_PADRAO.map((ref) => (
                <div
                  key={ref.id}
                  className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{ref.emoji}</span>
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900">{ref.nome}</h4>
                          <span className="text-[10px] font-semibold text-slate-400">
                            Horário sugerido: {ref.horarioSugerido}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Prato Triplo
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      {/* Alimento Seguro */}
                      <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100/80 space-y-0.5">
                        <span className="text-[10px] font-black text-emerald-800 uppercase flex items-center gap-1">
                          🛡️ Seguro (Conforto)
                        </span>
                        <p className="font-bold text-slate-900">{ref.alimentoSeguro.nome}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{ref.alimentoSeguro.descricao}</p>
                      </div>

                      {/* Alimento Parecido */}
                      <div className="bg-sky-50/50 p-3 rounded-2xl border border-sky-100/80 space-y-0.5">
                        <span className="text-[10px] font-black text-[#2A546D] uppercase flex items-center gap-1">
                          🌉 Parecido (Ponte Sensorial)
                        </span>
                        <p className="font-bold text-slate-900">{ref.alimentoParecido.nome}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{ref.alimentoParecido.descricao}</p>
                      </div>

                      {/* Alimento de Exposição */}
                      <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100/80 space-y-0.5">
                        <span className="text-[10px] font-black text-amber-900 uppercase flex items-center gap-1">
                          🌱 Exposição (Sem Pressão)
                        </span>
                        <p className="font-bold text-slate-900">{ref.alimentoExposicao.nome}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{ref.alimentoExposicao.descricao}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Regra de ouro: respeitar a saciedade</span>
                    <span className="text-emerald-700 font-bold">Sem brigas à mesa ✅</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* ABA B: CADERNO DE RECEITAS SENSORIAIS */}
      {/* ===================================================================== */}
      {abaAtiva === "receitas" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* BARRA DE FILTROS RÁPIDOS */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <span className="text-[11px] font-extrabold uppercase text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="h-3 w-3" /> Textura:
              </span>
              {["Todas", "Crocante", "Macia/Úmida", "Pastosa/Cremosa", "Finger Food"].map((textura) => (
                <button
                  key={textura}
                  type="button"
                  onClick={() => setFiltroTextura(textura)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filtroTextura === textura
                      ? "bg-[#4C6C54] text-white shadow-2xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {textura}
                </button>
              ))}
            </div>

            {/* FILTRO DE RECOMENDADAS PELA NUTRI */}
            <button
              type="button"
              onClick={() => setApenasRecomendadas(!apenasRecomendadas)}
              className={`py-1.5 px-3.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                apenasRecomendadas
                  ? "bg-amber-400 text-slate-900 shadow-2xs"
                  : "bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200"
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${apenasRecomendadas ? "fill-slate-900" : "fill-amber-400 text-amber-500"}`} />
              <span>Recomendadas pela Dra. Laís</span>
            </button>
          </div>

          {/* GRID DE RECEITAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {receitasFiltradas.map((rec) => {
              const ehRecomendada = idsRecomendados.includes(rec.id);

              return (
                <div
                  key={rec.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-5 space-y-3">
                    {/* Topo do Card */}
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-3xl p-2 rounded-2xl bg-slate-50 border border-slate-100 group-hover:scale-105 transition-transform">
                        {rec.emoji}
                      </span>
                      {ehRecomendada && (
                        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          <span>Recomendada pela Dra. Laís</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-[#4C6C54] transition-colors leading-snug">
                        {rec.titulo}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {rec.descricao}
                      </p>
                    </div>

                    {/* Metadados e Textura */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-2 flex-wrap text-[11px]">
                        <span className="font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" /> {rec.tempoPreparo}
                        </span>
                        <span className="font-bold px-2 py-0.5 rounded-md bg-[#2A546D]/10 text-[#2A546D]">
                          Textura: {rec.textura}
                        </span>
                      </div>

                      {/* Degrau da Escada Trabalhado */}
                      <div className="text-[11px] font-bold text-[#4C6C54] bg-[#4C6C54]/10 px-2.5 py-1 rounded-xl flex items-center gap-1">
                        <Sparkles className="h-3 w-3 shrink-0" />
                        <span>{rec.degrauEscada}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botão de Ação */}
                  <div className="p-4 bg-slate-50/70 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setReceitaModalAberta(rec)}
                      className="w-full py-2.5 px-3 bg-white hover:bg-[#4C6C54] text-slate-800 hover:text-white border border-slate-200 hover:border-[#4C6C54] font-extrabold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Ver Ingredientes & Estratégia</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {receitasFiltradas.length === 0 && (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <span className="text-3xl">🔍</span>
              <h4 className="text-sm font-bold text-slate-800">Nenhuma receita encontrada para os filtros selecionados.</h4>
              <button
                type="button"
                onClick={() => {
                  setFiltroTextura("Todas");
                  setApenasRecomendadas(false);
                }}
                className="py-2 px-4 rounded-xl bg-[#4C6C54] text-white text-xs font-bold cursor-pointer"
              >
                Limpar Filtros
              </button>
            </div>
          )}

        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL RICO DE DETALHES DA RECEITA COM A ESTRATÉGIA SENSORIAL */}
      {/* ===================================================================== */}
      {receitaModalAberta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#FFFDF8] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-amber-200/60 animate-in zoom-in-95">
            
            {/* Topo do Modal */}
            <div className="p-5 border-b border-amber-100/80 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 rounded-2xl bg-amber-50 border border-amber-100">
                  {receitaModalAberta.emoji}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#4C6C54]/10 text-[#4C6C54]">
                      {receitaModalAberta.textura}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {receitaModalAberta.rendimento} • {receitaModalAberta.tempoPreparo}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900">
                    {receitaModalAberta.titulo}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReceitaModalAberta(null)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              
              {/* BOX DE DESTAQUE: ESTRATÉGIA SENSORIAL DA DRA. LAÍS */}
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/40 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-950 uppercase flex items-center gap-1.5 tracking-wide">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    💡 Estratégia Sensorial da Dra. Laís
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-200/70 text-amber-900">
                    {receitaModalAberta.degrauEscada}
                  </span>
                </div>
                <p className="text-xs text-amber-950 font-medium leading-relaxed italic">
                  &ldquo;{receitaModalAberta.estrategiaSensorial}&rdquo;
                </p>
              </div>

              {/* Ingredientes */}
              <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200/80">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <span>🛒</span> Ingredientes Separados
                </h4>
                <ul className="space-y-1.5 text-xs font-medium text-slate-700">
                  {receitaModalAberta.ingredientes.map((ing, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#4C6C54] mt-1.5 shrink-0" />
                      <span>{ing}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Modo de Preparo */}
              <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200/80">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <span>👩‍🍳</span> Modo de Preparo Passo a Passo
                </h4>
                <div className="space-y-2 text-xs font-medium text-slate-700">
                  {receitaModalAberta.modoPreparo.map((passo, idx) => (
                    <p key={idx} className="leading-relaxed bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                      {passo}
                    </p>
                  ))}
                </div>
              </div>

            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Dúvidas sobre adaptações de alergias? Fale com a Dra. Laís no Chat.
              </span>
              <button
                type="button"
                onClick={() => setReceitaModalAberta(null)}
                className="py-2 px-4 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Concluir Leitura
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
