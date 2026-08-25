"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);

  const handleEnviar = (e: React.FormEvent) => {
    e.preventDefault();
    // Futura conexão com backend para enviar o e-mail de recuperação
    setEnviado(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F0EAE1] text-slate-800 font-sans p-4">
      
      {/* Área da Logo Centralizada (Menor que a do login para dar foco ao texto) */}
      <div className="mb-6 flex flex-col items-center">
        <div className="relative h-32 w-32 sm:h-40 sm:w-40 mb-1">
          <Image 
            src="/logo-transparente.png" 
            alt="Logo Nutrindo em Casa"
            fill
            sizes="(max-width: 768px) 128px, 160px"
            className="object-contain"
            priority 
          />
        </div>
      </div>

      {/* Card Principal */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-md border border-slate-100 p-8 sm:p-10 text-center">
        
        {/* Renderização Condicional: Se enviou, mostra sucesso. Se não, mostra o formulário. */}
        {enviado ? (
          <div className="flex flex-col items-center py-6 animation-fade-in">
            <CheckCircle2 className="h-16 w-16 text-[#4C6C54] mb-4" />
            <h2 className="text-2xl font-bold text-[#4C6C54] mb-2">E-mail Enviado!</h2>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
              Enviamos as instruções de recuperação para <strong>{email}</strong>. 
              Por favor, verifique sua caixa de entrada e a pasta de spam.
            </p>
            <Link 
              href="/"
              className="w-full h-12 flex items-center justify-center bg-[#4C6C54] hover:bg-[#3a5340] text-white font-semibold rounded-2xl transition-colors shadow-sm"
            >
              Voltar para o Login
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-[#4C6C54] mb-2">Esqueceu a senha?</h2>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
              Não se preocupe! Digite o e-mail cadastrado e enviaremos um link para você redefinir sua senha.
            </p>

            <form onSubmit={handleEnviar} className="space-y-5 text-left">
              <div>
                <label className="block text-sm font-medium text-[#4C6C54] mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 flex items-center justify-center bg-[#4C6C54] hover:bg-[#3a5340] text-white font-semibold rounded-2xl transition-colors shadow-sm mt-2"
              >
                Enviar instruções
              </button>
            </form>

            <div className="mt-8">
              <Link 
                href="/"
                className="inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-[#4C6C54] transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para o login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}