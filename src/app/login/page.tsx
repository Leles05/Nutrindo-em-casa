"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye, EyeOff, Lock, Mail, ArrowRight, Loader2,
  ArrowLeft, ShieldCheck
} from "lucide-react";

export default function PaginaLoginDedicada() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [provedorCarregando, setProvedorCarregando] = useState<string | null>(null);
  const [erro, setErro] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    if (!email.trim() || !senha.trim()) {
      setErro("Preencha seu e-mail e sua senha para continuar.");
      return;
    }

    setCarregando(true);

    setTimeout(() => {
      setCarregando(false);
      router.push("/dashboard");
    }, 600);
  };

  const handleLoginSocial = (provedor: "google" | "facebook") => {
    setErro("");
    setProvedorCarregando(provedor);

    setTimeout(() => {
      setProvedorCarregando(null);
      router.push("/dashboard");
    }, 500);
  };

  return (
    <div className="min-h-screen w-full bg-[#F0EAE1] text-slate-800 font-sans flex flex-col justify-between p-4 sm:p-6 select-none relative">
      
      {/* BOTÃO VOLTAR PARA O INÍCIO */}
      <div className="max-w-md w-full mx-auto pt-2 sm:pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para o início</span>
        </Link>
      </div>

      {/* CARD CENTRALIZADO COM ACABAMENTO PREMIUM */}
      <div className="max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200/90 animate-in fade-in duration-300">
          
          {/* CABEÇALHO DO CARD */}
          <div className="text-center space-y-2">
            <Link href="/" className="inline-block relative h-14 w-40 mx-auto">
              <Image
                src="/logo-transparente.png"
                alt="Nutrindo em Casa"
                fill
                className="object-contain"
                priority
              />
            </Link>

            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Bem-vindo(a) de volta!
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Acesse sua conta para continuar o acompanhamento nutricional
              </p>
            </div>
          </div>

          {/* BOTÕES SOCIAIS */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleLoginSocial("google")}
              disabled={carregando || provedorCarregando !== null}
              className="h-11 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-all shadow-2xs hover:border-slate-300 cursor-pointer disabled:opacity-50"
            >
              {provedorCarregando === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Google</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleLoginSocial("facebook")}
              disabled={carregando || provedorCarregando !== null}
              className="h-11 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-all shadow-2xs hover:border-slate-300 cursor-pointer disabled:opacity-50"
            >
              {provedorCarregando === "facebook" ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <>
                  <svg className="h-4 w-4 fill-[#1877F2]" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Facebook</span>
                </>
              )}
            </button>
          </div>

          {/* DIVISOR */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              ou com seu e-mail
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {erro && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold text-center animate-in fade-in duration-200">
              {erro}
            </div>
          )}

          {/* FORMULÁRIO */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                E-mail de Acesso
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full h-11 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] focus:bg-white transition-all"
                />
                <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Senha
                </label>
                <Link
                  href="/esqueci-senha"
                  className="text-[11px] font-bold text-[#4C6C54] hover:underline"
                >
                  Esqueceu sua senha?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full h-11 pl-9 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] focus:bg-white transition-all"
                />
                <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-3.5" />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title={mostrarSenha ? "Ocultar senha" : "Ver senha"}
                >
                  {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full h-12 bg-[#4C6C54] hover:bg-[#3a5340] active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
            >
              {carregando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Entrando na plataforma...</span>
                </>
              ) : (
                <>
                  <span>Entrar na Plataforma</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* RODAPÉ DO CARD */}
          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Ainda não faz parte?{" "}
              <Link
                href="/pagamento"
                className="font-extrabold text-[#4C6C54] hover:underline"
              >
                Conheça os planos e assine agora
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* SELO DE SEGURANÇA NO RODAPÉ */}
      <div className="max-w-md w-full mx-auto pb-2 text-center">
        <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Ambiente Seguro com Criptografia SSL 256 bits</span>
        </div>
      </div>

    </div>
  );
}
