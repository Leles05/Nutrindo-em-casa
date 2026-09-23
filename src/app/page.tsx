"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2 } from "lucide-react";

export default function PaginaLogin() {
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

    // Encaminha para o primeiro acesso: criação de nova senha
    setTimeout(() => {
      setCarregando(false);
      router.push("/criar-senha");
    }, 700);
  };

  const handleLoginSocial = (provedor: "google" | "facebook") => {
    setErro("");
    setProvedorCarregando(provedor);

    setTimeout(() => {
      setProvedorCarregando(null);
      router.push("/dashboard");
    }, 600);
  };

  return (
    <div className="h-screen w-full bg-[#F0EAE1] flex items-center justify-center p-4 overflow-hidden font-sans select-none">
      
      <div className="bg-white rounded-3xl sm:rounded-[2.5rem] max-w-md w-full p-6 sm:p-8 space-y-4 shadow-xl border border-slate-200/80 animation-fade-in relative">
        
        {/* LOGO COM TAMANHO REAL E PROPORCIONAL */}
        <div className="text-center space-y-2">
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 mx-auto">
            <Image 
              src="/logo-transparente.png" 
              alt="Nutrindo em Casa" 
              fill 
              className="object-contain" 
              priority 
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#4C6C54]">
            Bem-vindo(a)!
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Acompanhe a evolução nutricional do seu pequeno
          </p>
        </div>

        {/* BOTÕES SOCIAIS */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
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
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ou</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {erro && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold text-center animation-fade-in">
            {erro}
          </div>
        )}

        {/* FORMULÁRIO */}
        <form onSubmit={handleLogin} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              E-mail
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

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-slate-600 uppercase">
                Senha
              </label>
              <Link
                href="/esqueci-senha"
                className="text-[11px] font-bold text-[#4C6C54] hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative">
              <input
                type={mostrarSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full h-11 pl-9 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4C6C54] focus:bg-white transition-all"
                required
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
            className="w-full h-11 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
          >
            {carregando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Entrando...</span>
              </>
            ) : (
              <>
                <span>Entrar</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

      </div>

    </div>
  );
}