"use client";

import { useState, useEffect } from "react";
import { BookOpen, Calendar as CalendarIcon, UserCircle, Clock, CheckCircle2, Apple, Droplet, Carrot, PlusCircle, Trophy } from "lucide-react";
import Link from "next/link";

export default function DashboardInicio() {
  const [saudacao, setSaudacao] = useState("Carregando...");

  // Lógica exata: Madrugada/Manhã (03:00 - 11:59), Tarde (12:00 - 17:59), Noite (18:00 - 02:59)
  useEffect(() => {
    const horaAtual = new Date().getHours();
    if (horaAtual >= 3 && horaAtual < 12) {
      setSaudacao("Bom dia! 👋");
    } else if (horaAtual >= 12 && horaAtual < 18) {
      setSaudacao("Boa tarde! 👋");
    } else {
      setSaudacao("Boa noite! 👋");
    }
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animation-fade-in">
      
      {/* Cabeçalho com Saudação Emocional e Perfil */}
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-[#4C6C54]">
            {saudacao}
          </h1>
          <p className="text-slate-500 mt-1 text-base">Aqui está o resumo da jornada do seu pequeno hoje.</p>
        </div>
        
        {/* Ícone de Perfil / Conta no topo direito */}
        <button className="h-12 w-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#4C6C54] hover:border-[#4C6C54] transition-colors shadow-sm">
          <UserCircle className="h-7 w-7" />
        </button>
      </header>

      {/* Grid Principal do Dashboard (2/3 Esquerda, 1/3 Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna da Esquerda (Cursos e Calendário) - Ocupa 2/3 do espaço */}
        <div className="col-span-1 lg:col-span-2 space-y-8">
          
          {/* Card do Curso Atual (Progresso) */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 bg-[#EB6D57]/10 rounded-2xl flex items-center justify-center text-[#EB6D57]">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Continue de onde parou</p>
                <h3 className="text-xl font-bold text-slate-800">Introdução Alimentar Descomplicada</h3>
              </div>
            </div>
            
            <div className="flex items-center gap-5">
              <span className="text-lg font-bold text-[#EB6D57]">30%</span>
              <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#EB6D57] rounded-full w-[30%]"></div>
              </div>
              <Link 
                href="/dashboard/cursos"
                className="px-6 py-2.5 bg-[#EB6D57] hover:bg-[#d55e49] text-white font-bold rounded-xl transition-colors shadow-sm"
              >
                Continuar
              </Link>
            </div>
          </section>

          {/* Área do Calendário (Front-end com Dados Simulados/Mock) */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <CalendarIcon className="h-5 w-5 text-[#2A546D]" />
                <h3 className="text-xl font-bold text-slate-800">Seu Calendário</h3>
              </div>
              <button className="text-xs font-semibold text-[#2A546D] bg-[#2A546D]/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-[#2A546D]/20 transition-colors">
                <CheckCircle2 className="h-3 w-3" />
                Sincronizado
              </button>
            </div>
            
            <div className="space-y-4">
              
              <div className="flex gap-4 items-start p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#2A546D]/30 transition-colors cursor-pointer group">
                <div className="flex flex-col items-center justify-center bg-white h-14 w-14 rounded-xl shadow-sm border border-slate-100 shrink-0 group-hover:bg-[#2A546D] group-hover:text-white transition-colors">
                  <span className="text-xs font-bold uppercase text-slate-400 group-hover:text-white/80">Ago</span>
                  <span className="text-lg font-extrabold text-[#2A546D] group-hover:text-white">27</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 group-hover:text-[#2A546D] transition-colors">Consulta Nutricional (Retorno)</h4>
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> 
                    14:00 - 15:00 • Google Meet
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#2A546D]/30 transition-colors cursor-pointer group">
                <div className="flex flex-col items-center justify-center bg-white h-14 w-14 rounded-xl shadow-sm border border-slate-100 shrink-0 group-hover:bg-[#2A546D] group-hover:text-white transition-colors">
                  <span className="text-xs font-bold uppercase text-slate-400 group-hover:text-white/80">Ago</span>
                  <span className="text-lg font-extrabold text-[#2A546D] group-hover:text-white">28</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 group-hover:text-[#2A546D] transition-colors">Introduzir nova fruta (Maçã)</h4>
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> 
                    09:00 - Lembrete
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#2A546D]/30 transition-colors cursor-pointer group opacity-75">
                <div className="flex flex-col items-center justify-center bg-white h-14 w-14 rounded-xl shadow-sm border border-slate-100 shrink-0 group-hover:bg-[#2A546D] group-hover:text-white transition-colors">
                  <span className="text-xs font-bold uppercase text-slate-400 group-hover:text-white/80">Set</span>
                  <span className="text-lg font-extrabold text-[#2A546D] group-hover:text-white">02</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 group-hover:text-[#2A546D] transition-colors">Mentoria ao vivo (Curso)</h4>
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> 
                    19:00 - 20:30 • Zoom
                  </p>
                </div>
              </div>

            </div>
            
            <button className="w-full mt-4 py-3 text-sm font-bold text-slate-500 hover:text-[#2A546D] hover:bg-slate-50 rounded-xl transition-colors">
              Ver calendário completo
            </button>
          </section>
        </div>

        {/* Coluna da Direita (Diário Alimentar e Registro Rápido) */}
        <div className="col-span-1 space-y-8">
          
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-full flex flex-col hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            
            {/* Cabeçalho do Diário */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Diário Alimentar</h3>
              <span className="text-xs font-bold text-[#4C6C54] bg-[#4C6C54]/10 px-3 py-1 rounded-full">
                Hoje
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}