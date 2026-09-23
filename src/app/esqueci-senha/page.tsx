"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

export default function PaginaEsqueciSenha() {
  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setCarregando(true);
    setTimeout(() => {
      setCarregando(false);
      setEnviado(true);
    }, 800);
  };

  return (
    <div className="h-screen w-full bg-[#F0EAE1] flex items-center justify-center p-4 overflow-hidden font-sans select-none">
      <div className="bg-white rounded-3xl sm:rounded-[2.5rem] max-w-md w-full p-6 sm:p-8 space-y-5 shadow-xl border border-slate-200/80 animation-fade-in relative">
        
        {/* LOGO */}
        <div className="text-center space-y-2">
          <div className="relative h-16 w-40 mx-auto">
            <Image 
              src="/logo-transparente.png" 
              alt="Nutrindo em Casa" 
              fill 
              className="object-contain" 
              priority 
            />
          </div>
          <h1 className="text-2xl font-black text-[#4C6C54]">
            Esqueceu a senha?
          </h1>
          <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
            Digite seu e-mail cadastrado e enviaremos um link para você redefinir sua senha.
          </p>
        </div>

        {enviado ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3 animation-fade-in">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
            <div>
              <h3 className="text-xs font-bold text-emerald-800">E-mail de recuperação enviado!</h3>
              <p className="text-[11px] text-emerald-600 mt-1">
                Verifique sua caixa de entrada e siga as instruções para cadastrar uma nova senha.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4C6C54] hover:underline pt-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                E-mail cadastrado
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  <span>Enviar instruções</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/"
                className="text-xs font-bold text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o login
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}