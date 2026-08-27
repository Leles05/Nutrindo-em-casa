"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle2, Check, X } from "lucide-react";
import { useParams } from "next/navigation";

export default function RedefinirSenhaPage() {
  const params = useParams();
  const token = params.token; 

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha1, setMostrarSenha1] = useState(false);
  const [mostrarSenha2, setMostrarSenha2] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  // Regras de validação em tempo real
  const temTamanho = novaSenha.length >= 8;
  const temMaiuscula = /[A-Z]/.test(novaSenha);
  const temNumero = /[0-9]/.test(novaSenha);
  const senhaValida = temTamanho && temMaiuscula && temNumero;

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trava o envio se as senhas forem diferentes
    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem. Tente novamente.");
      return; 
    }

    // Trava o envio se a senha não cumprir todos os requisitos de segurança
    if (!senhaValida) {
      setErro("A senha não atende a todos os requisitos de segurança.");
      return;
    }

    setErro("");
    // Futuro: Enviaremos a 'novaSenha' e o 'token' da URL para o banco de dados aqui!
    console.log("Token enviado para o backend:", token); 
    setSucesso(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F0EAE1] text-slate-800 font-sans p-4">
      
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

      <div className="w-full max-w-md bg-white rounded-3xl shadow-md border border-slate-100 p-8 sm:p-10">
        
        {sucesso ? (
          <div className="flex flex-col items-center text-center py-6 animation-fade-in">
            <CheckCircle2 className="h-16 w-16 text-[#4C6C54] mb-5" />
            <h2 className="text-3xl font-extrabold text-[#4C6C54] mb-3 tracking-tight">Senha Atualizada!</h2>
            <p className="text-slate-600 mb-8 text-base leading-relaxed px-2">
              Sua nova senha foi salva com sucesso. Você já pode acessar a plataforma utilizando suas novas credenciais.
            </p>
            <Link 
              href="/"
              className="w-full h-12 flex items-center justify-center bg-[#4C6C54] hover:bg-[#3a5340] text-white font-bold rounded-2xl transition-colors shadow-sm text-lg"
            >
              Ir para o Login
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h2 className="text-4xl font-extrabold text-[#4C6C54] mb-3 tracking-tight">Criar nova senha</h2>
              <p className="text-slate-600 text-lg leading-relaxed px-2">
                Sua nova senha deve ser forte e diferente das utilizadas anteriormente.
              </p>
            </div>

            <form onSubmit={handleSalvar} className="space-y-5">
              <div>
                <label className="block text-lg font-semibold text-[#4C6C54] mb-2">Nova Senha</label>
                <div className="relative">
                  <input
                    id="novaSenha"
                    type={mostrarSenha1 ? "text" : "password"}
                    value={novaSenha}
                    onChange={(e) => {
                      setNovaSenha(e.target.value);
                      setErro(""); // Limpa o erro ao digitar
                    }}
                    placeholder="Digite a nova senha"
                    className="w-full h-12 px-4 pr-12 text-base bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha1(!mostrarSenha1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#4C6C54] transition-colors"
                  >
                    {mostrarSenha1 ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Feedback visual em tempo real da força da senha */}
                <div className="mt-4 space-y-2">
                  <p className="text-base font-semibold text-slate-700">A senha precisa ter:</p>
                  <ul className="text-sm space-y-1.5">
                    <li className={`flex items-center gap-2 ${temTamanho ? "text-[#4C6C54]" : "text-slate-400"}`}>
                      {temTamanho ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      Mínimo de 8 caracteres
                    </li>
                    <li className={`flex items-center gap-2 ${temMaiuscula ? "text-[#4C6C54]" : "text-slate-400"}`}>
                      {temMaiuscula ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      Pelo menos uma letra maiúscula
                    </li>
                    <li className={`flex items-center gap-2 ${temNumero ? "text-[#4C6C54]" : "text-slate-400"}`}>
                      {temNumero ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      Pelo menos um número
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <label className="block text-lg font-semibold text-[#4C6C54] mb-2 mt-2">Confirmar Senha</label>
                <div className="relative">
                  <input
                    id="confirmarSenha"
                    type={mostrarSenha2 ? "text" : "password"}
                    value={confirmarSenha}
                    onChange={(e) => {
                      setConfirmarSenha(e.target.value);
                      setErro(""); 
                    }}
                    placeholder="Repita a nova senha"
                    className={`w-full h-12 px-4 pr-12 text-base bg-slate-50 border rounded-2xl focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      erro ? "border-red-400 focus:ring-red-400/50 focus:border-red-400" : "border-slate-200 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54]"
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha2(!mostrarSenha2)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#4C6C54] transition-colors"
                  >
                    {mostrarSenha2 ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                
                {erro && (
                  <p className="text-red-500 text-base font-medium mt-2 ml-1 animation-fade-in">
                    {erro}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full h-12 flex items-center justify-center bg-[#4C6C54] hover:bg-[#3a5340] text-white font-bold rounded-2xl transition-colors shadow-sm mt-8 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!senhaValida} // Desativa o botão se a senha for fraca
              >
                Salvar nova senha
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}