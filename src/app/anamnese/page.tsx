"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ChevronLeft, Save, AlertCircle } from "lucide-react";

export default function AnamneseWizard() {
  // Controle de qual etapa do formulário a mãe está (de 1 a 8)
  const [etapaAtual, setEtapaAtual] = useState(1);
  const totalEtapas = 8;

  // Títulos das 8 etapas para a barra de progresso
  const titulosEtapas = [
    "Conhecendo a Criança",
    "Histórico de Saúde",
    "Mapa Alimentar",
    "Perfil Sensorial",
    "Rotina das Refeições",
    "Família e Comportamento",
    "Sinais de Atenção",
    "Rotina e Objetivos"
  ];

  const avancarEtapa = () => {
    if (etapaAtual < totalEtapas) setEtapaAtual(etapaAtual + 1);
    window.scrollTo(0, 0); // Sobe a tela de volta pro topo ao avançar
  };

  const voltarEtapa = () => {
    if (etapaAtual > 1) setEtapaAtual(etapaAtual - 1);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-[#F0EAE1] font-sans text-slate-800 pb-20">
      
      {/* Header Fixo / Barra de Progresso */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/dashboard" className="relative h-10 w-24 hover:opacity-80 transition-opacity">
              <Image src="/logo-transparente.png" alt="Nutrindo em Casa" fill className="object-contain" priority />
            </Link>
            <div className="flex items-center gap-2 text-base font-medium text-slate-500">
              <Save className="h-4 w-4" />
              <span>Rascunho salvo automaticamente</span>
            </div>
          </div>

          {/* Barra de Progresso Visual */}
          <div className="space-y-2">
            <div className="flex justify-between text-lg font-bold">
              <span className="text-[#4C6C54]">Etapa {etapaAtual} de {totalEtapas}</span>
              <span className="text-slate-400">{titulosEtapas[etapaAtual - 1]}</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-[#4C6C54] rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${(etapaAtual / totalEtapas) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      {/* Área do Formulário */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 mt-8">
        
        {/* Renderização Condicional: Mostra a Etapa 1 */}
        {etapaAtual === 1 && (
          <div className="animation-fade-in space-y-8">
            
            <div className="text-center mb-8">
              <h1 className="text-4xl font-extrabold text-[#4C6C54] mb-2">👧 Conhecendo a Criança</h1>
              <p className="text-slate-500">Vamos começar pelo básico. Queremos conhecer um pouco mais sobre o seu pequeno.</p>
            </div>

            <form className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-slate-100 space-y-8">
              
              {/* Q1: Nome */}
              <div>
                <label htmlFor="nomeCrianca" className="block text-lg font-bold text-slate-800 mb-2">
                  1. Qual é o nome da criança? <span className="text-red-500">*</span>
                </label>
                <input type="text" id="nomeCrianca" className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 transition-all" placeholder="Digite o nome" required />
              </div>

              {/* Q2: Data de Nascimento */}
              <div>
                <label htmlFor="dataNascimento" className="block text-lg font-bold text-slate-800 mb-2">
                  2. Data de nascimento <span className="text-red-500">*</span>
                </label>
                <input type="date" id="dataNascimento" className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 transition-all" required />
              </div>

              {/* Q3: Motivo da Procura (Checkboxes Avançados) */}
              <div>
                <label className="block text-lg font-bold text-slate-800 mb-2">
                  3. Qual é o principal motivo pelo qual você procurou o Nutrindo em Casa? (Escolha até 3)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {[
                    "Come poucos alimentos", "Recusa alimentos novos", "Recusa frutas", 
                    "Recusa verduras/legumes", "Recusa carnes/proteínas", "Dificuldade com texturas",
                    "Apresenta choro/irritação", "Excesso de peso", "Baixo peso/desnutrição"
                  ].map((motivo, index) => (
                    <label key={index} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors has-[:checked]:border-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5">
                      <input type="checkbox" className="w-5 h-5 text-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54]" />
                      <span className="text-sm font-medium text-slate-700">{motivo}</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors sm:col-span-2">
                    <input type="checkbox" className="w-5 h-5 text-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54]" />
                    <span className="text-sm font-medium text-slate-700">Outro:</span>
                    <input type="text" className="flex-1 bg-transparent border-b border-slate-300 focus:border-[#4C6C54] focus:outline-none px-2 text-sm" placeholder="Especifique..." />
                  </label>
                </div>
              </div>

              {/* Q4 e Q5: Textos Longos */}
              <div className="space-y-6">
                <div>
                  <label htmlFor="unicaCoisa" className="block text-lg font-bold text-slate-800 mb-2">
                    4. Se pudesse escolher apenas UMA coisa para melhorar primeiro, qual seria? <span className="text-red-500">*</span>
                  </label>
                  <textarea id="unicaCoisa" rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 transition-all resize-none" placeholder="Ex: Gostaria que ele aceitasse comer na mesma mesa que a família..." required></textarea>
                </div>

                <div>
                  <label htmlFor="objetivo6Semanas" className="block text-lg font-bold text-slate-800 mb-2">
                    5. Como você gostaria que estivesse a alimentação da criança daqui a 6 semanas? <span className="text-red-500">*</span>
                  </label>
                  <textarea id="objetivo6Semanas" rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 transition-all resize-none" placeholder="Isso nos ajudará a alinhar nossas metas juntos." required></textarea>
                </div>
              </div>

              {/* Bloco Diagnóstico Clínico */}
              <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <label className="block text-lg font-bold text-slate-800 mb-2">
                      6. A criança possui algum diagnóstico?
                    </label>
                    <select className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                      <option value="">Selecione uma opção...</option>
                      <option value="nao">Não possui</option>
                      <option value="tea">TEA (Transtorno do Espectro Autista)</option>
                      <option value="tdah">TDAH</option>
                      <option value="atraso">Atraso do desenvolvimento</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                </div>
              </div>

            </form>
          </div>
        )}

        {/* Placeholder para as próximas etapas no protótipo */}
        {etapaAtual > 1 && (
          <div className="animation-fade-in text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Etapa {etapaAtual} em construção! </h2>
            <p className="text-slate-500">No projeto final, os formulários {etapaAtual} a 8 entrarão aqui, mantendo a experiência fluida.</p>
          </div>
        )}

        {/* Botões de Navegação Rodapé */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
          <button 
            onClick={voltarEtapa}
            disabled={etapaAtual === 1}
            className="flex items-center gap-2 px-6 py-3 font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5" /> Voltar
          </button>

          <button 
            onClick={avancarEtapa}
            className="flex items-center gap-2 px-8 py-3 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-bold rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            {etapaAtual === totalEtapas ? "Finalizar" : "Próximo Passo"} <ChevronRight className="h-5 w-5" />
          </button>
        </div>

      </main>
    </div>
  );
}