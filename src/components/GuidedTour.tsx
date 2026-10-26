"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface TourStep {
  id: string;
  /** Valor do atributo data-tour do elemento destacado. Sem target = balão centralizado. */
  target?: string;
  title: string;
  description: string;
  /** Subtítulo ou badge contextual opcional */
  subtitulo?: string;
  /** Dica prática destacada com ícone 💡 */
  dicaPratica?: string;
  /** Executado ao entrar no passo (ex.: alternar a aba correspondente). */
  onEnter?: () => void;
}

interface GuidedTourProps {
  steps: TourStep[];
  /** Chave do localStorage que marca o tour como já visto. */
  storageKey: string;
}

export const EVENTO_ABRIR_TOUR = "nutrindo:abrir-tour";

/** Reabre o tour a partir de qualquer botão (ex.: "? Guia Rápido"). */
export function abrirTour() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENTO_ABRIR_TOUR));
  }
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const POPOVER_LARGURA = 380;
const MARGEM = 12;
const PADDING_SPOTLIGHT = 6;

export default function GuidedTour({ steps, storageKey }: GuidedTourProps) {
  const [aberto, setAberto] = useState(false);
  const [indice, setIndice] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [alturaPopover, setAlturaPopover] = useState(220);
  const [viewport, setViewport] = useState({ w: 1024, h: 768 });
  const [naoMostrarNovamente, setNaoMostrarNovamente] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  const passo = steps[indice];
  const ultimo = indice === steps.length - 1;

  const abrir = useCallback(() => {
    setIndice(0);
    setAberto(true);
  }, []);

  const fechar = useCallback(() => {
    setAberto(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, "true");
      localStorage.setItem(`nutrindo_tour_visto_${storageKey}`, "true");
      if (naoMostrarNovamente) {
        localStorage.setItem("nutrindo_tour_oculto_permanente", "true");
        localStorage.setItem("nutrindo_tour_desativado", "true");
        localStorage.setItem(`nutrindo_tour_desativado_${storageKey}`, "true");
      }
    }
  }, [storageKey, naoMostrarNovamente]);

  // Auto-início no primeiro acesso + verificação de ocultação permanente
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (localStorage.getItem("nutrindo_tour_oculto_permanente") === "true") {
      setAberto(false);
      // Se o usuário clicar manualmente em abrir tour, ainda permitimos
      const handleAbrirManual = () => {
        setIndice(0);
        setAberto(true);
      };
      window.addEventListener(EVENTO_ABRIR_TOUR, handleAbrirManual);
      return () => {
        window.removeEventListener(EVENTO_ABRIR_TOUR, handleAbrirManual);
      };
    }

    const visto =
      localStorage.getItem(storageKey) === "true" ||
      localStorage.getItem(`nutrindo_tour_visto_${storageKey}`) === "true" ||
      localStorage.getItem("nutrindo_tour_desativado") === "true" ||
      localStorage.getItem(`nutrindo_tour_desativado_${storageKey}`) === "true" ||
      localStorage.getItem("nutrindo_tour_oculto_permanente") === "true";

    let timer: ReturnType<typeof setTimeout> | undefined;
    if (!visto) {
      timer = setTimeout(abrir, 900);
    }
    window.addEventListener(EVENTO_ABRIR_TOUR, abrir);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener(EVENTO_ABRIR_TOUR, abrir);
    };
  }, [storageKey, abrir]);

  // Medição do elemento destacado
  const medir = useCallback(() => {
    setViewport({ w: window.innerWidth, h: window.innerHeight });
    const alvo = stepsRef.current[indice]?.target;
    if (!alvo) {
      setRect(null);
      return;
    }
    const el = document.querySelector<HTMLElement>(`[data-tour="${alvo}"], #${alvo}`);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [indice]);

  // Ao entrar em um passo: troca de aba (se houver), rola até o alvo e mede
  useEffect(() => {
    if (!aberto) return;
    stepsRef.current[indice]?.onEnter?.();

    const timers: ReturnType<typeof setTimeout>[] = [];
    const rolar = () => {
      const alvo = stepsRef.current[indice]?.target;
      const el = alvo ? document.querySelector<HTMLElement>(`[data-tour="${alvo}"], #${alvo}`) : null;
      el?.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
      medir();
    };
    timers.push(setTimeout(rolar, 60));
    timers.push(setTimeout(medir, 350));
    return () => timers.forEach(clearTimeout);
  }, [aberto, indice, medir]);

  // Reposicionamento em resize/scroll + atalhos de teclado
  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
      if (e.key === "ArrowRight") setIndice((i) => Math.min(i + 1, stepsRef.current.length - 1));
      if (e.key === "ArrowLeft") setIndice((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("resize", medir);
    window.addEventListener("scroll", medir, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", medir);
      window.removeEventListener("scroll", medir, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [aberto, medir, fechar]);

  // Altura real do balão para posicionamento preciso
  useEffect(() => {
    if (aberto && popoverRef.current) {
      setAlturaPopover(popoverRef.current.offsetHeight);
    }
  }, [aberto, indice, rect]);

  if (!aberto || !passo) return null;

  const isMobile = viewport.w < 640;
  const larguraPopover = Math.min(POPOVER_LARGURA, viewport.w - MARGEM * 2);

  // Cálculo inteligente da posição do balão para que NUNCA fique em cima do spotlight
  let topPop: number;
  let leftPop: number = MARGEM;

  if (isMobile) {
    const gap = MARGEM + PADDING_SPOTLIGHT;
    if (rect) {
      const centroAlvoY = rect.top + rect.height / 2;
      const centroTelaY = viewport.h / 2;

      if (centroAlvoY < centroTelaY) {
        // Alvo na metade superior: posiciona o card abaixo do recorte iluminado
        topPop = Math.min(rect.top + rect.height + gap, viewport.h - alturaPopover - MARGEM);
        // Garante que não invada o topo do spotlight
        if (topPop < rect.top + rect.height + 4) {
          topPop = rect.top + rect.height + 4;
        }
      } else {
        // Alvo na metade inferior: posiciona o card acima do recorte iluminado
        topPop = Math.max(MARGEM, rect.top - alturaPopover - gap);
        // Garante que não invada a base do spotlight
        if (topPop + alturaPopover > rect.top - 4) {
          topPop = Math.max(8, rect.top - alturaPopover - 4);
        }
      }
    } else {
      topPop = Math.max(MARGEM, (viewport.h - alturaPopover) / 2);
    }
  } else {
    // DESKTOP: Abaixo > Direita > Acima > Esquerda
    if (rect) {
      const espacoAbaixo = viewport.h - (rect.top + rect.height);
      const espacoAcima = rect.top;
      const espacoDireita = viewport.w - (rect.left + rect.width);
      const espacoEsquerda = rect.left;
      const gap = MARGEM + PADDING_SPOTLIGHT;

      if (espacoAbaixo >= alturaPopover + gap) {
        topPop = rect.top + rect.height + gap;
        leftPop = rect.left;
      } else if (espacoDireita >= larguraPopover + gap) {
        leftPop = rect.left + rect.width + gap;
        topPop = Math.max(MARGEM, Math.min(rect.top, viewport.h - alturaPopover - MARGEM));
      } else if (espacoAcima >= alturaPopover + gap) {
        topPop = rect.top - alturaPopover - gap;
        leftPop = rect.left;
      } else if (espacoEsquerda >= larguraPopover + gap) {
        leftPop = rect.left - larguraPopover - gap;
        topPop = Math.max(MARGEM, Math.min(rect.top, viewport.h - alturaPopover - MARGEM));
      } else {
        if (espacoAbaixo >= espacoAcima) {
          topPop = rect.top + rect.height + gap;
          leftPop = rect.left;
        } else {
          topPop = Math.max(MARGEM, rect.top - alturaPopover - gap);
          leftPop = rect.left;
        }
      }
      leftPop = Math.max(MARGEM, Math.min(leftPop, viewport.w - larguraPopover - MARGEM));
      topPop = Math.max(MARGEM, Math.min(topPop, viewport.h - alturaPopover - MARGEM));
    } else {
      topPop = Math.max(MARGEM, (viewport.h - alturaPopover) / 2);
      leftPop = Math.max(MARGEM, (viewport.w - larguraPopover) / 2);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true" aria-label="Guia rápido">
      {/* Bloqueia cliques no restante da página durante o tour */}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

      {/* Spotlight: recorte iluminado com backdrop escurecido via box-shadow */}
      {rect ? (
        <div
          className="absolute rounded-2xl pointer-events-none transition-all duration-300 ease-out"
          style={{
            top: rect.top - PADDING_SPOTLIGHT,
            left: rect.left - PADDING_SPOTLIGHT,
            width: rect.width + PADDING_SPOTLIGHT * 2,
            height: rect.height + PADDING_SPOTLIGHT * 2,
            boxShadow:
              "0 0 0 9999px rgba(15, 23, 20, 0.55), 0 0 0 3px #3D5A45, 0 0 24px 6px rgba(61, 90, 69, 0.55)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[rgba(15,23,20,0.55)] pointer-events-none" />
      )}

      {/* Balão (popover) */}
      <div
        ref={popoverRef}
        className="fixed sm:absolute bg-[#FFFDF8] rounded-2xl border border-[#3D5A45]/20 shadow-2xl p-4 sm:p-5 space-y-3 transition-all duration-300 ease-out left-3 right-3 sm:left-auto sm:right-auto max-w-[calc(100vw-24px)] sm:max-w-md mx-auto sm:mx-0"
        style={
          isMobile
            ? { top: topPop, zIndex: 10000 }
            : { top: topPop, left: leftPop, width: larguraPopover, zIndex: 10000 }
        }
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#3D5A45] bg-[#E8F5E9] px-2.5 py-0.5 rounded-full border border-[#3D5A45]/20">
              Passo {indice + 1} de {steps.length}
            </span>
            {passo.subtitulo && (
              <span className="text-[10px] font-bold text-slate-500">
                • {passo.subtitulo}
              </span>
            )}
          </div>
          <div className="flex gap-1 shrink-0" aria-hidden="true">
            {steps.map((s, i) => (
              <span
                key={s.id}
                className={`h-1.5 rounded-full transition-all ${
                  i === indice ? "w-5 bg-[#3D5A45]" : "w-1.5 bg-[#3D5A45]/25"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">{passo.title}</h3>
          <p className="text-xs text-slate-600 leading-relaxed">{passo.description}</p>
        </div>

        {passo.dicaPratica && (
          <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-[11px] text-amber-950 flex items-start gap-2 shadow-2xs">
            <span className="text-sm shrink-0 leading-none">💡</span>
            <div className="leading-snug">
              <strong className="font-extrabold text-amber-900 block mb-0.5">Dica Prática:</strong>
              <span>{passo.dicaPratica}</span>
            </div>
          </div>
        )}

        {/* Checkbox para não exibir novamente */}
        <div className="pt-2 border-t border-slate-100">
          <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-500 hover:text-slate-800 font-medium">
            <input
              type="checkbox"
              checked={naoMostrarNovamente}
              onChange={(e) => {
                const checked = e.target.checked;
                setNaoMostrarNovamente(checked);
                if (checked && typeof window !== "undefined") {
                  localStorage.setItem("nutrindo_tour_oculto_permanente", "true");
                } else if (!checked && typeof window !== "undefined") {
                  localStorage.removeItem("nutrindo_tour_oculto_permanente");
                }
              }}
              className="rounded border-slate-300 text-[#3D5A45] focus:ring-[#3D5A45] h-3.5 w-3.5 cursor-pointer"
            />
            <span>Não mostrar este guia novamente ao entrar</span>
          </label>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={fechar}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            Pular guia
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIndice((i) => Math.max(i - 1, 0))}
              disabled={indice === 0}
              className="py-1.5 px-3 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => (ultimo ? fechar() : setIndice((i) => i + 1))}
              className="py-1.5 px-3.5 rounded-xl text-xs font-extrabold bg-[#3D5A45] hover:bg-[#2f4636] text-white shadow-xs transition-all cursor-pointer"
            >
              {ultimo ? "Concluir" : "Próximo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
