"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

export default function PaginaEsqueciSenha() {
  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");

  // Envia o link oficial de recuperação. A senha só é definida depois, na tela do link (sessão verificada).
  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailLimpo = email.trim().toLowerCase();
    if (!emailLimpo) return;

    setCarregando(true);
    setErro("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailLimpo }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErro(data.message || "Não foi possível enviar o link agora. Tente novamente em instantes.");
        return;
      }
      setEnviado(true);
    } catch {
      setErro("Falha de conexão com o servidor. Verifique sua internet e tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F0EAE1] flex items-center justify-center p-4 py-8 font-sans">
      <div className="bg-white rounded-3xl sm:rounded-[2.5rem] max-w-md w-full p-6 sm:p-8 space-y-5 shadow-xl border border-slate-200/80 animation-fade-in relative">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block relative h-14 w-40 mx-auto">
            <Image src="/logo-transparente.png" alt="Nutrindo em Casa" fill className="object-contain" priority />
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-[#4C6C54]">Recuperação de Acesso</h1>
          <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
            Informe o e-mail da sua assinatura e enviaremos um link seguro para criar uma nova senha.
          </p>
        </div>

        {erro && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold text-center leading-relaxed animation-fade-in">
            {erro}
          </div>
        )}

        {enviado ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3 animation-fade-in">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
            <div>
              <h3 className="text-xs font-bold text-emerald-800">Pedido recebido!</h3>
              <p className="text-[11px] text-emerald-700 mt-1 leading-relaxed">
                Se <strong>{email}</strong> estiver cadastrado, você receberá em instantes um e-mail com o link para criar uma nova
                senha. Confira também a caixa de spam. O link vale por tempo limitado.
              </p>
            </div>
            <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4C6C54] hover:underline pt-2">
              <ArrowLeft className="h-3.5 w-3.5" /> Ir para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmitEmail} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">E-mail cadastrado</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErro("");
                  }}
                  placeholder="exemplo@email.com"
                  className="w-full h-11 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4C6C54] focus:bg-white transition-all"
                  required
                />
                <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full h-11 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {carregando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Enviando instruções...</span>
                </>
              ) : (
                <>
                  <span>Enviar link de recuperação</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
              💡 <strong>Digitou o e-mail errado na compra?</strong> Por segurança não é possível trocar o e-mail por aqui.
              Fale com a equipe da Dra. Laís para atualizarmos o seu cadastro.
            </div>

            <div className="pt-1 text-center">
              <Link href="/login" className="text-xs font-bold text-slate-500 hover:text-slate-700 inline-flex items-center gap-1">
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
