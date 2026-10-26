"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

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

/** Verificação unificada se o tour deve ser ocultado automaticamente */
export function isTourOculto(storageKey?: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const ocultoPermanente = localStorage.getItem("nutrindo_tour_oculto_permanente") === "true";
    const cookieOculto = typeof document !== "undefined" && document.cookie.includes("nutrindo_tour_oculto=true");
    const desativadoGeral = localStorage.getItem("nutrindo_tour_desativado") === "true";

    if (ocultoPermanente || cookieOculto || desativadoGeral) return true;
  } catch {}
  return false;
}

/** Grava no localStorage, no cookie e no Banco de Dados que o tour está permanentemente oculto */
export function salvarTourOculto(storageKey?: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("nutrindo_tour_oculto_permanente", "true");
    localStorage.setItem("nutrindo_tour_desativado", "true");
    if (storageKey) {
      localStorage.setItem(`nutrindo_tour_desativado_${storageKey}`, "true");
    }
    document.cookie = "nutrindo_tour_oculto=true; path=/; max-age=31536000; SameSite=Lax";

    // Gravação persistente no Banco de Dados via PUT /api/configuracoes
    const email =
      localStorage.getItem("nutrindo_user_email") ||
      localStorage.getItem("usuario_email") ||
      (typeof window !== "undefined" && window.location.pathname.startsWith("/nutri")
        ? "metodonutrindoemcasa@gmail.com"
        : "");
    if (email) {
      fetch("/api/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), tour_oculto: true }),
      }).catch((err) => {
        console.warn("Aviso ao salvar tour_oculto no backend:", err);
      });
    }
  } catch {}
}

/** Remove a preferência de ocultação permanente caso o usuário desmarque */
export function reativarTour(storageKey?: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("nutrindo_tour_oculto_permanente");
    localStorage.removeItem("nutrindo_tour_desativado");
    if (storageKey) {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(`nutrindo_tour_visto_${storageKey}`);
      localStorage.removeItem(`nutrindo_tour_desativado_${storageKey}`);
    }
    document.cookie = "nutrindo_tour_oculto=; path=/; max-age=0; SameSite=Lax";

    const email =
      localStorage.getItem("nutrindo_user_email") ||
      localStorage.getItem("usuario_email") ||
      (typeof window !== "undefined" && window.location.pathname.startsWith("/nutri")
        ? "metodonutrindoemcasa@gmail.com"
        : "");
    if (email) {
      fetch("/api/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), tour_oculto: false }),
      }).catch(() => {});
    }
  } catch {}
}

interface Rect {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
}

const POPOVER_LARGURA = 380;
const MARGEM = 12;
const PADDING_SPOTLIGHT = 6;

/** Localiza o elemento pelo target de forma infalível (#id, id puro, data-tour ou seletor CSS) */
export function getElementByTarget(alvo?: string): HTMLElement | null {
  if (!alvo || typeof document === "undefined") return null;
  const cleanId = alvo.replace(/^[#.]/, "");
  try {
    if (alvo.startsWith("#") || alvo.startsWith(".")) {
      const el = document.querySelector<HTMLElement>(alvo);
      if (el) return el;
    }
    const byId = document.getElementById(cleanId);
    if (byId) return byId;
    const byDataTour = document.querySelector<HTMLElement>(`[data-tour="${cleanId}"], [data-tour="${alvo}"]`);
    if (byDataTour) return byDataTour;
  } catch {}
  return null;
}

export default function GuidedTour({ steps, storageKey }: GuidedTourProps) {
  const [aberto, setAberto] = useState(false);
  const [indice, setIndice] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [alturaPopover, setAlturaPopover] = useState(240);
  const [viewport, setViewport] = useState({ w: 1024, h: 768 });
  const [naoMostrarNovamente, setNaoMostrarNovamente] = useState(() => {
    if (typeof window === "undefined") return false;
    return isTourOculto(storageKey);
  });

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
  }, []);

  const pular = useCallback(() => {
    setAberto(false);
  }, []);

  const concluir = useCallback(() => {
    setAberto(false);
  }, []);

  // Auto-início no acesso: abre em 250ms a menos que explicitamente oculto permanente
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Listener para reabertura manual a qualquer momento (ex.: botão "? Guia Rápido" / "Como usar a plataforma")
    const handleAbrirManual = () => {
      setIndice(0);
      setAberto(true);
      setNaoMostrarNovamente(isTourOculto(storageKey));
    };
    window.addEventListener(EVENTO_ABRIR_TOUR, handleAbrirManual);

    let cancelado = false;
    let timer: NodeJS.Timeout | null = null;

    // Abertura rápida imediata (250ms) se localmente não estiver marcado para ocultar
    if (!isTourOculto(storageKey)) {
      timer = setTimeout(() => {
        if (!cancelado) {
          setIndice(0);
          setAberto(true);
        }
      }, 250);
    }

    async function verificarEIniciarTour() {
      const email =
        localStorage.getItem("nutrindo_user_email") ||
        localStorage.getItem("usuario_email") ||
        (window.location.pathname.startsWith("/nutri") ? "metodonutrindoemcasa@gmail.com" : "");

      let backendOculto: boolean | null = null;

      if (email) {
        try {
          const res = await fetch(`/api/configuracoes?email=${encodeURIComponent(email.toLowerCase().trim())}`)
            .then((r) => r.json())
            .catch(() => null);

          if (res?.tour_oculto === true || res?.profile?.tour_oculto === true) {
            backendOculto = true;
            salvarTourOculto(storageKey);
            setNaoMostrarNovamente(true);
            setAberto(false);
            return;
          } else if (res && (res.tour_oculto === false || res.profile?.tour_oculto === false)) {
            // Se no banco tour_oculto é false, limpa resíduos de ocultação imediatamente
            backendOculto = false;
            localStorage.removeItem("nutrindo_tour_oculto_permanente");
            localStorage.removeItem("nutrindo_tour_desativado");
            if (storageKey) {
              localStorage.removeItem(storageKey);
              localStorage.removeItem(`nutrindo_tour_desativado_${storageKey}`);
              localStorage.removeItem(`nutrindo_tour_visto_${storageKey}`);
            }
            document.cookie = "nutrindo_tour_oculto=; path=/; max-age=0; SameSite=Lax";
            setNaoMostrarNovamente(false);

            // Se ainda não estiver aberto, abre rapidamente em 250ms
            if (!cancelado) {
              if (timer) clearTimeout(timer);
              timer = setTimeout(() => {
                if (!cancelado) {
                  setIndice(0);
                  setAberto(true);
                }
              }, 250);
            }
            return;
          }
        } catch {}
      }

      if (cancelado) return;

      // Se o usuário já marcou explicitamente para ocultar, não abre
      if (backendOculto === true || (backendOculto === null && isTourOculto(storageKey))) {
        setAberto(false);
        return;
      }
    }

    verificarEIniciarTour();

    return () => {
      cancelado = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener(EVENTO_ABRIR_TOUR, handleAbrirManual);
    };
  }, [storageKey]);

  // Medição do elemento destacado
  const medir = useCallback(() => {
    setViewport({ w: window.innerWidth, h: window.innerHeight });
    const alvo = stepsRef.current[indice]?.target;
    const el = getElementByTarget(alvo);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) {
      setRect(null);
      return;
    }
    setRect({
      top: r.top,
      bottom: r.bottom,
      left: r.left,
      right: r.right,
      width: r.width,
      height: r.height,
    });
  }, [indice]);

  // Ao entrar em um passo: troca de aba (se houver), rola até o alvo e mede
  useEffect(() => {
    if (!aberto) return;
    stepsRef.current[indice]?.onEnter?.();

    const timers: ReturnType<typeof setTimeout>[] = [];
    const alvo = stepsRef.current[indice]?.target;
    const el = getElementByTarget(alvo);

    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    medir();

    timers.push(setTimeout(medir, 100));
    timers.push(setTimeout(medir, 300));
    timers.push(setTimeout(medir, 600));

    return () => timers.forEach(clearTimeout);
  }, [aberto, indice, medir]);

  // Reposicionamento em resize/scroll + atalhos de teclado
  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") pular();
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

  // Cálculo inteligente da posição do balão para que NUNCA cubra o destaque e nunca corte a tela
  let topPop: number;
  let leftPop: number = MARGEM;

  if (rect) {
    const alturaBalao = alturaPopover || 240;
    // Se houver espaço abaixo do elemento destacado (rect.bottom + 280 < window.innerHeight):
    if (rect.bottom + 280 < viewport.h) {
      topPop = rect.bottom + 16;
    } else if (rect.top - alturaBalao - 16 >= MARGEM) {
      // Se houver espaço acima do elemento destacado:
      topPop = rect.top - alturaBalao - 16;
    } else {
      // Caso contrário, posiciona na metade com maior espaço visível sem invadir o elemento
      const espacoAbaixo = viewport.h - rect.bottom;
      const espacoAcima = rect.top;
      if (espacoAbaixo >= espacoAcima) {
        topPop = Math.min(rect.bottom + 16, viewport.h - alturaBalao - MARGEM);
      } else {
        topPop = Math.max(MARGEM, rect.top - alturaBalao - 16);
      }
    }

    if (isMobile) {
      leftPop = MARGEM;
    } else {
      // Alinha horizontalmente com o elemento
      leftPop = rect.left;
      leftPop = Math.max(MARGEM, Math.min(leftPop, viewport.w - larguraPopover - MARGEM));
    }

    // Clamping final para NUNCA cortar na borda da tela
    topPop = Math.max(MARGEM, Math.min(topPop, Math.max(MARGEM, viewport.h - alturaBalao - MARGEM)));
  } else {
    // Balão perfeitamente centralizado caso o elemento não exista ou esteja oculto
    topPop = Math.max(MARGEM, (viewport.h - alturaPopover) / 2);
    leftPop = Math.max(MARGEM, (viewport.w - larguraPopover) / 2);
  }

  return (
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true" aria-label="Guia rápido">
      {/* Bloqueia cliques no restante da página durante o tour */}
      <div className="fixed inset-0" onClick={(e) => e.stopPropagation()} />

      {/* Spotlight: recorte iluminado com backdrop escurecido via box-shadow */}
      {rect ? (
        <div
          className="fixed rounded-2xl pointer-events-none transition-all duration-300 ease-out z-[9999]"
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
        <div className="fixed inset-0 bg-[rgba(15,23,20,0.55)] pointer-events-none z-[9999]" />
      )}

      {/* Balão (popover) */}
      <div
        ref={popoverRef}
        className="fixed bg-[#FFFDF8] rounded-2xl border border-[#3D5A45]/20 shadow-2xl p-4 sm:p-5 space-y-3 transition-all duration-300 ease-out left-3 right-3 sm:left-auto sm:right-auto max-w-[calc(100vw-24px)] sm:max-w-md mx-auto sm:mx-0 z-[10000]"
        style={
          isMobile
            ? { top: topPop }
            : { top: topPop, left: leftPop, width: larguraPopover }
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
          <div className="flex items-center gap-2 shrink-0">
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
            <button
              type="button"
              onClick={fechar}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Fechar guia"
              title="Fechar guia"
            >
              <X className="w-3.5 h-3.5" />
            </button>
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
                if (typeof window !== "undefined") {
                  if (checked) {
                    salvarTourOculto(storageKey);
                  } else {
                    reativarTour(storageKey);
                  }
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
            onClick={pular}
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
              onClick={() => (ultimo ? concluir() : setIndice((i) => i + 1))}
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
