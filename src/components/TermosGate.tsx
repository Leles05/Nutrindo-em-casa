"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, FileText, Loader2, ShieldCheck } from "lucide-react";
import { encerrarSessao } from "@/hooks/useAuthGuard";

// Páginas abertas ao público: a janela de aceite só aparece para quem está logado
const ROTAS_PUBLICAS = ["/login", "/termos", "/privacidade", "/pagamento", "/criar-senha", "/esqueci-senha", "/redefinir-senha", "/auth"];

function ehRotaPublica(caminho: string) {
  return caminho === "/" || ROTAS_PUBLICAS.some((r) => caminho === r || caminho.startsWith(r + "/"));
}

/**
 * Janela de aceite OBRIGATÓRIO dos Termos de Uso e do consentimento LGPD.
 * Aparece por cima de todo o sistema assim que o cliente entra (e de novo sempre que a versão dos termos mudar).
 * Só fecha depois do aceite registrado no servidor; a única outra saída é sair da conta.
 */
export default function TermosGate() {
  const caminho = usePathname();
  const [versao, setVersao] = useState<string | null>(null);
  const [aceiteTermos, setAceiteTermos] = useState(false);
  const [aceiteSaude, setAceiteSaude] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (ehRotaPublica(caminho)) {
      setVersao(null);
      return;
    }
    let cancelado = false;
    const token = localStorage.getItem("nutrindo_auth_token");
    const papel = localStorage.getItem("nutrindo_user_role");
    if (!token || papel === "nutri") return;

    fetch("/api/termos")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelado && d?.precisaAceitar) setVersao(d.versaoAtual);
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [caminho]);

  // Trava a rolagem da página de trás enquanto a janela estiver aberta
  useEffect(() => {
    if (!versao) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [versao]);

  if (!versao) return null;

  const aceitar = async () => {
    setErro("");
    setEnviando(true);
    try {
      const res = await fetch("/api/termos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versao, aceiteTermos: true, consentimentoSaude: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setErro(data.message || "Não foi possível registrar o aceite. Tente novamente.");
        return;
      }
      setVersao(null);
      setAceiteTermos(false);
      setAceiteSaude(false);
    } catch {
      setErro("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="termos-titulo"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-3 sm:p-6"
    >
      <div className="w-full max-w-xl max-h-[94vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 sm:p-8 space-y-5">
        <div className="space-y-2 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-[#4C6C54]/10 flex items-center justify-center">
            <FileText className="h-6 w-6 text-[#4C6C54]" />
          </div>
          <h2 id="termos-titulo" className="text-xl sm:text-2xl font-black text-[#3D5A45]">
            Antes de continuar
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Para usar o Nutrindo em Casa precisamos do seu aceite dos Termos de Uso e da autorização para tratar os dados do seu filho(a).
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-xs sm:text-[13px] text-slate-600 leading-relaxed">
          <p className="font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-[#4C6C54]" /> Os pontos principais
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Renovação automática:</strong> ao fim do período do plano, a assinatura no cartão à vista é renovada no mesmo cartão; no Pix e no parcelado, enviamos o link de pagamento por e-mail. Em todos os casos, com aviso 7 dias antes.
              Você cancela quando quiser em Configurações, sem multa, e mantém o acesso até o fim do período pago.
            </li>
            <li>
              <strong>Garantia de 7 dias:</strong> devolução integral do valor se você desistir nesse prazo, a partir da confirmação do pagamento.
            </li>
            <li>
              <strong>Dados do seu filho(a):</strong> informações de saúde e alimentares são sigilosas, usadas apenas pela Dra. Laís Leles e equipe
              autorizada para o acompanhamento nutricional, e nunca vendidas ou compartilhadas para publicidade.
            </li>
            <li>
              <strong>Não substitui o pediatra:</strong> o método não trata emergências nem substitui o acompanhamento médico.
            </li>
          </ul>
          <p className="pt-1">
            Leia na íntegra:{" "}
            <Link href="/termos" target="_blank" className="font-bold text-[#4C6C54] underline">
              Termos de Uso
            </Link>{" "}
            e{" "}
            <Link href="/privacidade" target="_blank" className="font-bold text-[#4C6C54] underline">
              Política de Privacidade
            </Link>{" "}
            (versão {versao}).
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 hover:border-[#4C6C54]/50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={aceiteTermos}
              onChange={(e) => setAceiteTermos(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[#4C6C54] cursor-pointer"
            />
            <span className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">
              Li e aceito os <strong>Termos de Uso</strong> e a <strong>Política de Privacidade</strong>, incluindo a{" "}
              <strong>renovação automática</strong> da assinatura.
            </span>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 hover:border-[#4C6C54]/50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={aceiteSaude}
              onChange={(e) => setAceiteSaude(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[#4C6C54] cursor-pointer"
            />
            <span className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">
              Declaro ser <strong>pai, mãe ou responsável legal</strong> da criança e <strong>autorizo, de forma específica e destacada</strong>, o
              tratamento dos dados de saúde e alimentares dela para o acompanhamento nutricional (LGPD, arts. 11 e 14). Posso revogar essa
              autorização a qualquer momento.
            </span>
          </label>
        </div>

        {erro && (
          <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 text-center" role="alert">
            {erro}
          </p>
        )}

        <div className="space-y-2">
          <button
            type="button"
            onClick={aceitar}
            disabled={!aceiteTermos || !aceiteSaude || enviando}
            className="w-full h-12 rounded-2xl bg-[#4C6C54] hover:bg-[#3a5340] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {enviando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Registrando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Aceitar e continuar</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => encerrarSessao()}
            disabled={enviando}
            className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Não aceito (sair da conta)
          </button>
        </div>
      </div>
    </div>
  );
}
