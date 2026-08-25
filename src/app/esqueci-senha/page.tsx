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
    setEnviado(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F0EAE1] text-slate-800 font-sans p-4">
      
      {/* Área da Logo Centralizada - Igualada ao tamanho da tela de login para consistência */}
      <div className="mb-8 flex flex-col items-center">
        <div className="relative h-48 w-48 sm:h-64 sm:w-64 mb-1">
          <Image 
            src="/logo-transparente.png" 
            alt="Logo Nutrindo em Casa"
            fill
            sizes="(max-width: 768px) 192px, 256px"
            className="object-contain"
            priority 
          />
        </div>
      </div>

      {/* Card Principal */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-md border border-slate-100 p-8 sm:p-10 text-center">
        
        {enviado ? (
          <div className="flex flex-col items-center py-6">
            <CheckCircle2 className="h-16 w-16 text-[#4C6C54] mb-5" />
            <h2 className="text-3xl font-extrabold text-[#4C6C54] mb-3 tracking-tight">E-mail Enviado!</h2>
            <p className="text-slate-600 mb-8 text-base leading-relaxed px-2">
              Enviamos as instruções de recuperação para <strong className="text-slate-800">{email}</strong>. 
              Por favor, verifique sua caixa de entrada e a pasta de spam.
            </p>
            <Link 
              href="/"
              className="w-full h-12 flex items-center justify-center bg-[#4C6C54] hover:bg-[#3a5340] text-white font-bold rounded-2xl transition-colors shadow-sm text-lg"
            >
              Voltar para o Login
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-extrabold text-[#4C6C54] mb-3 tracking-tight">Esqueceu a senha?</h2>
            <p className="text-slate-600 mb-8 text-lg leading-relaxed px-2">
              Não se preocupe! Digite o e-mail cadastrado e enviaremos um link para você redefinir sua senha.
            </p>

            <form onSubmit={handleEnviar} className="space-y-5 text-left">
              <div>
                <label className="block text-base font-semibold text-[#4C6C54] mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full h-12 px-4 text-base bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 flex items-center justify-center bg-[#4C6C54] hover:bg-[#3a5340] text-white font-bold rounded-2xl transition-colors shadow-sm mt-4 text-lg"
              >
                Enviar instruções
              </button>
            </form>

            <div className="mt-8">
              <Link 
                href="/"
                className="inline-flex items-center justify-center gap-2 text-base font-medium text-slate-500 hover:text-[#4C6C54] transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                Voltar para o login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}