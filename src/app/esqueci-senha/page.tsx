"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, ArrowLeft, ArrowRight, Loader2, CheckCircle2, ShieldCheck, Lock, Eye, EyeOff, UserCheck } from "lucide-react";

export default function PaginaEsqueciSenha() {
  const [modo, setModo] = useState<"email" | "cpf">("email");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [carregando, setCarregando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");
  const [sucessoCpf, setSucessoCpf] = useState<{
    email: string;
    token: string;
    nome: string;
    anamnese_concluida: boolean;
    consulta_agendada: boolean;
  } | null>(null);

  // Redefinir por E-mail
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
        setErro(
          data.message ||
            "Não encontramos uma conta ativa com este e-mail. Verifique a digitação ou recupere pelo CPF da compra."
        );
        return;
      }

      setEnviado(true);
    } catch {
      setErro("Falha de conexão com o servidor. Verifique sua internet e tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  // Recuperar e Corrigir E-mail por CPF
  const handleSubmitCpf = async (e: React.FormEvent) => {
    e.preventDefault();
    const cpfLimpo = cpf.replace(/\D/g, "");
    const emailLimpo = novoEmail.trim().toLowerCase();
    const senhaLimpa = novaSenha.trim();

    if (cpfLimpo.length !== 11) {
      setErro("Informe um CPF válido com 11 dígitos numéricos.");
      return;
    }
    if (!emailLimpo || !emailLimpo.includes("@")) {
      setErro("Informe um novo e-mail válido.");
      return;
    }
    if (senhaLimpa.length < 6) {
      setErro("A nova senha deve possuir no mínimo 6 caracteres.");
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "recuperar_cpf",
          cpf: cpfLimpo,
          novoEmail: emailLimpo,
          novaSenha: senhaLimpa,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErro(data.message || "Não foi possível validar o CPF informado.");
        return;
      }

      setSucessoCpf({
        email: data.email || emailLimpo,
        token: data.token || `token_${Date.now()}`,
        nome: data.nome || "Responsável",
        anamnese_concluida: Boolean(data.anamnese_concluida),
        consulta_agendada: Boolean(data.consulta_agendada),
      });
    } catch {
      setErro("Falha de conexão com o servidor. Verifique sua internet e tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  const acessarAposCorrecao = () => {
    if (!sucessoCpf) return;
    if (typeof window !== "undefined") {
      localStorage.setItem("nutrindo_user_email", sucessoCpf.email);
      localStorage.setItem("nutrindo_auth_token", sucessoCpf.token);
      localStorage.setItem("nutrindo_user_nome", sucessoCpf.nome);
      localStorage.setItem("nutrindo_user_role", "cliente");
      localStorage.setItem("nutrindo_status_assinatura", "ATIVO");

      if (sucessoCpf.anamnese_concluida) {
        localStorage.setItem("nutrindo_anamnese_concluida", "true");
        localStorage.setItem("anamnese_concluida", "true");
      } else {
        localStorage.removeItem("nutrindo_anamnese_concluida");
        localStorage.removeItem("anamnese_concluida");
      }

      if (sucessoCpf.consulta_agendada) {
        localStorage.setItem("nutrindo_consulta_agendada", "true");
        localStorage.setItem("consulta_agendada", "true");
      } else {
        localStorage.removeItem("nutrindo_consulta_agendada");
        localStorage.removeItem("consulta_agendada");
      }
    }

    if (!sucessoCpf.anamnese_concluida) {
      window.location.href = "/anamnese";
    } else if (!sucessoCpf.consulta_agendada) {
      window.location.href = "/dashboard/calendario?onboarding=consulta";
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F0EAE1] flex items-center justify-center p-4 py-8 font-sans">
      <div className="bg-white rounded-3xl sm:rounded-[2.5rem] max-w-md w-full p-6 sm:p-8 space-y-5 shadow-xl border border-slate-200/80 animation-fade-in relative">
        
        {/* LOGO */}
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
          <h1 className="text-xl sm:text-2xl font-black text-[#4C6C54]">
            Recuperação de Acesso
          </h1>
          <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
            Escolha como prefere recuperar ou corrigir seu acesso à plataforma.
          </p>
        </div>

        {/* SELETOR DE ABAS */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold text-slate-600 gap-1">
          <button
            type="button"
            onClick={() => {
              setModo("email");
              setErro("");
            }}
            className={`py-2 px-2 rounded-xl transition-all text-center ${
              modo === "email" ? "bg-white text-[#4C6C54] shadow-xs font-extrabold" : "hover:text-slate-900"
            }`}
          >
            Redefinir por E-mail
          </button>
          <button
            type="button"
            onClick={() => {
              setModo("cpf");
              setErro("");
            }}
            className={`py-2 px-2 rounded-xl transition-all text-center leading-tight ${
              modo === "cpf" ? "bg-white text-[#4C6C54] shadow-xs font-extrabold" : "hover:text-slate-900"
            }`}
          >
            Recuperar por CPF
          </button>
        </div>

        {erro && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold text-center leading-relaxed animation-fade-in">
            {erro}
          </div>
        )}

        {/* SUCESSO DO FLUXO DE CPF */}
        {sucessoCpf ? (
          <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3.5 animation-fade-in">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
            <div>
              <h3 className="text-sm font-extrabold text-emerald-900">E-mail corrigido e senha definida!</h3>
              <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                Olá, <strong>{sucessoCpf.nome}</strong>! Sua conta agora está vinculada ao e-mail <strong>{sucessoCpf.email}</strong>. Seu acesso está liberado imediatamente.
              </p>
            </div>
            <button
              type="button"
              onClick={acessarAposCorrecao}
              className="w-full py-3 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Acessar Plataforma Agora</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : enviado ? (
          /* SUCESSO DO FLUXO DE EMAIL */
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3 animation-fade-in">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
            <div>
              <h3 className="text-xs font-bold text-emerald-800">E-mail de recuperação enviado!</h3>
              <p className="text-[11px] text-emerald-600 mt-1 leading-relaxed">
                Verifique a caixa de entrada do e-mail <strong>{email}</strong> e siga as instruções para cadastrar sua nova senha.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4C6C54] hover:underline pt-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Ir para o login
            </Link>
          </div>
        ) : modo === "email" ? (
          /* FORMULÁRIO 1: REDEFINIÇÃO DE SENHA POR EMAIL */
          <form onSubmit={handleSubmitEmail} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                E-mail cadastrado
              </label>
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

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="text-xs font-bold text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar para o login
              </Link>
            </div>
          </form>
        ) : (
          /* FORMULÁRIO 2: RECUPERAÇÃO POR CPF (EMAIL DIGITADO ERRADO) */
          <form onSubmit={handleSubmitCpf} className="space-y-3.5">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
              💡 <strong>Digitou o e-mail errado no pagamento?</strong> Informe o CPF usado na compra para localizar sua assinatura, atualizar seu e-mail e criar sua senha de acesso.
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                CPF usado na compra
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => {
                    setCpf(e.target.value);
                    setErro("");
                  }}
                  placeholder="000.000.000-00"
                  className="w-full h-11 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4C6C54] focus:bg-white transition-all"
                  required
                />
                <UserCheck className="h-4 w-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Novo E-mail Correto
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={novoEmail}
                  onChange={(e) => {
                    setNovoEmail(e.target.value);
                    setErro("");
                  }}
                  placeholder="seu-email-correto@exemplo.com"
                  className="w-full h-11 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4C6C54] focus:bg-white transition-all"
                  required
                />
                <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Nova Senha de Acesso
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={novaSenha}
                  onChange={(e) => {
                    setNovaSenha(e.target.value);
                    setErro("");
                  }}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full h-11 pl-9 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#4C6C54] focus:bg-white transition-all"
                  required
                  minLength={6}
                />
                <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-3.5" />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
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
                  <span>Validando e liberando...</span>
                </>
              ) : (
                <>
                  <span>Corrigir E-mail e Liberar Acesso</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/login"
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