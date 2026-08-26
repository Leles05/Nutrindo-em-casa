"use client";

import { useState, useEffect } from "react";
import { BookOpen, Calendar as CalendarIcon, UserCircle } from "lucide-react";
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
        
        {/* Ícone de Perfil / Conta no topo direito (Melhoria de UX) */}
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

          {/* Área do Calendário Gigante (Placeholder) */}
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 min-h-[400px] hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <CalendarIcon className="h-5 w-5 text-[#2A546D]" />
              <h3 className="text-xl font-bold text-slate-800">Seu Calendário</h3>
            </div>
            <div className="flex items-center justify-center h-64 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
              <p className="text-slate-400 font-medium text-center">
                Visualização do Calendário entrará aqui.<br/>
                <span className="text-sm font-normal">(Integração futura com Google Calendar)</span>
              </p>
            </div>
          </section>
        </div>

        {/* Coluna da Direita (Espaço reservado para o Diário/Mapa) */}
        <div className="col-span-1 space-y-8">
          
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-full min-h-[600px] flex flex-col hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Diário Alimentar</h3>
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-[#F0EAE1]/30">
              <p className="text-slate-400 font-medium text-center px-4">
                O Mapa de Nutrição da criança entrará aqui futuramente.
              </p>
            </div>
          </section>
          
        </div>
      </div>
    </div>
  );
}