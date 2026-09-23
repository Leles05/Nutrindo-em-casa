"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Check, ArrowRight, Loader2 } from "lucide-react";

export default function PaginaCriarSenha() {
  const router = useRouter();

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const temOitoDigitos = novaSenha.length >= 8;
  const temNumero = /\d/.test(novaSenha);
  const senhasConferem = novaSenha === confirmarSenha && novaSenha.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    if (!temOitoDigitos || !temNumero) {
      setErro("A senha precisa ter pelo menos 8 caracteres e incluir um número.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro("As senhas digitadas não são idênticas.");
      return;
    }

    setCarregando(true);

    setTimeout(() => {
      setCarregando(false);
      router.push("/anamnese");
    }, 700);
  };

  return (
    <div className="h-screen w-full bg-[#F0EAE1] flex items-center justify-center p-4 overflow-hidden font-sans select-none">
      
      <div className="bg-white rounded-3xl sm:rounded-[2.5rem] max-w-md w-full p-6 sm:p-8 space-y-4 shadow-xl border border-slate-200/80 animation-fade-in relative">
        
        {/* LOGO INTEGRADA E PROPORCIONAL */}
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
            Crie sua senha
          </h1>
          <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
            Defina uma senha pessoal para acessar seus futuros planos e aulas
          </p>
        </div>

        {erro && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold text-center animation-fade-in">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Nova Senha
            </label>
            <div className="relative">
              <input
                type={mostrarSenha ? "text" : "password"}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Crie uma nova senha"
                className="w-full h-11 pl-9 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4C6C54] focus:bg-white transition-all"
                required
              />
              <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-3.5" />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <input
                type={mostrarSenha ? "text" : "password"}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita a senha criada"
                className="w-full h-11 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4C6C54] focus:bg-white transition-all"
                required
              />
              <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          {/* INDICADORES EM TEMPO REAL */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] font-semibold">
              <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${temOitoDigitos ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                <Check className="h-2.5 w-2.5" />
              </div>
              <span className={temOitoDigitos ? 'text-slate-700' : 'text-slate-400'}>Mínimo de 8 caracteres</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-semibold">
              <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${temNumero ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                <Check className="h-2.5 w-2.5" />
              </div>
              <span className={temNumero ? 'text-slate-700' : 'text-slate-400'}>Conter pelo menos um número</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-semibold">
              <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${senhasConferem ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                <Check className="h-2.5 w-2.5" />
              </div>
              <span className={senhasConferem ? 'text-slate-700' : 'text-slate-400'}>As senhas são idênticas</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={carregando || !temOitoDigitos || !temNumero || !senhasConferem}
            className="w-full h-11 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs hover:shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {carregando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <span>Avançar para Anamnese</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

      </div>

    </div>
  );
}