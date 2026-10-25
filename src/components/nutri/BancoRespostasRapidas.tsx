"use client";

import { useEffect, useState } from "react";
import { Zap, ChevronDown, Plus, Trash2, Check, X, Star } from "lucide-react";
import {
  carregarRespostasCustom,
  excluirRespostaCustom,
  salvarRespostaCustom,
  sincronizarRespostasCustomComSupabase,
  EVENTO_BANCO_ATUALIZADO,
  type NovaRespostaCustom,
  type ProtocoloClinico,
} from "@/data/sugestoesClinicas";

/** Hook reativo que mantém apenas os modelos personalizados da Dra. Laís sincronizados. */
export function useBancoRespostas() {
  const [banco, setBanco] = useState<ProtocoloClinico[]>([]);
  useEffect(() => {
    const recarregar = () => setBanco(carregarRespostasCustom());
    recarregar();

    // Sincroniza respostas salvas no Supabase
    sincronizarRespostasCustomComSupabase().then(() => {
      setBanco(carregarRespostasCustom());
    });

    window.addEventListener(EVENTO_BANCO_ATUALIZADO, recarregar);
    window.addEventListener("storage", recarregar);
    return () => {
      window.removeEventListener(EVENTO_BANCO_ATUALIZADO, recarregar);
      window.removeEventListener("storage", recarregar);
    };
  }, []);
  return banco;
}

type Tema = "amber" | "emerald" | "sky";

interface BancoRespostasRapidasProps {
  onAplicar: (protocolo: ProtocoloClinico) => void;
  tema?: Tema;
  /** Texto curto explicando o que será preenchido ao clicar no chip. */
  dica?: string;
  iniciarAberto?: boolean;
}

/** Barra seletora: 100% vazia por padrão, exibe apenas os modelos criados pela nutricionista. */
export default function BancoRespostasRapidas({
  onAplicar,
}: BancoRespostasRapidasProps) {
  const banco = useBancoRespostas();
  const [selecionado, setSelecionado] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelecionado(id);
    if (!id) return;
    const proto = banco.find((p) => p.id === id);
    if (proto) {
      onAplicar(proto);
      setFeedback(`Modelo "${proto.tituloCurto}" aplicado!`);
      setTimeout(() => setFeedback(""), 2500);
    }
  };

  const handleExcluir = () => {
    if (!selecionado) return;
    const proto = banco.find((p) => p.id === selecionado);
    const nome = proto?.tituloCurto || "Modelo";
    excluirRespostaCustom(selecionado);
    setSelecionado("");
    setFeedback(`"${nome}" excluído com sucesso.`);
    setTimeout(() => setFeedback(""), 2500);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap w-full">
      <div className="relative flex-1 min-w-[240px]">
        <select
          value={selecionado}
          onChange={handleChange}
          disabled={banco.length === 0}
          className={`w-full h-9 pl-3 pr-8 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/30 shadow-2xs transition-colors ${
            banco.length === 0 ? "opacity-75 cursor-default text-slate-400" : "cursor-pointer"
          }`}
          title={
            banco.length === 0
              ? "Nenhum modelo salvo ainda"
              : "Selecione um dos seus modelos salvos para aplicar"
          }
        >
          {banco.length === 0 ? (
            <option value="">
              Nenhum modelo salvo ainda — digite um parecer e clique em &apos;+ Salvar parecer atual como Modelo&apos;
            </option>
          ) : (
            <>
              <option value="">✨ Selecione um modelo salvo ({banco.length})...</option>
              {banco.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.tituloCurto}
                </option>
              ))}
            </>
          )}
        </select>
      </div>

      {selecionado && (
        <button
          type="button"
          onClick={handleExcluir}
          className="h-9 px-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer shrink-0"
          title="Excluir este modelo salvo"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Excluir modelo</span>
        </button>
      )}

      {feedback && (
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 animate-in fade-in">
          ✓ {feedback}
        </span>
      )}
    </div>
  );
}

interface BotaoSalvarRespostaRapidaProps {
  /** Monta o modelo a partir dos campos atuais. Retorne null se não houver conteúdo. */
  montarModelo: () => Omit<NovaRespostaCustom, "tituloCurto"> | null;
  onSalvo?: (titulo: string) => void;
}

/** Botão discreto "+ Salvar texto atual como modelo" com campo inline para nomear o modelo. */
export function BotaoSalvarRespostaRapida({ montarModelo, onSalvo }: BotaoSalvarRespostaRapidaProps) {
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [erro, setErro] = useState("");

  const confirmar = () => {
    const modelo = montarModelo();
    if (!modelo) {
      setErro("Preencha o campo antes de salvar.");
      return;
    }
    const nome = titulo.trim() || "Resposta Personalizada";
    salvarRespostaCustom({ ...modelo, tituloCurto: `⭐ ${nome}` });
    onSalvo?.(nome);
    setTitulo("");
    setErro("");
    setEditando(false);
  };

  if (!editando) {
    return (
      <button
        type="button"
        onClick={() => setEditando(true)}
        className="text-[11px] font-bold text-[#4C6C54] hover:bg-[#4C6C54]/10 border border-[#4C6C54]/25 py-1.5 px-3 rounded-xl inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap bg-white shadow-2xs"
        title="Salvar o conteúdo atual como modelo no seu banco de respostas"
      >
        <Plus className="h-3.5 w-3.5" /> Salvar texto atual como modelo
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <input
        autoFocus
        type="text"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            confirmar();
          }
          if (e.key === "Escape") setEditando(false);
        }}
        placeholder="Nome do modelo…"
        className="h-7 w-40 px-2 bg-white border border-slate-300 rounded-lg text-[11px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/30"
        aria-label="Nome da resposta rápida"
      />
      <button
        type="button"
        onClick={confirmar}
        className="h-7 w-7 rounded-lg bg-[#4C6C54] hover:bg-[#3a5340] text-white flex items-center justify-center cursor-pointer"
        title="Salvar"
        aria-label="Confirmar salvar resposta rápida"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => {
          setEditando(false);
          setErro("");
        }}
        className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
        title="Cancelar"
        aria-label="Cancelar"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      {erro && <span className="text-[10px] font-bold text-rose-600">{erro}</span>}
    </span>
  );
}
