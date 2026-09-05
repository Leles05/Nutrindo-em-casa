"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronRight, ChevronLeft, Save } from "lucide-react";

export default function AnamneseWizard() {
  const [etapaAtual, setEtapaAtual] = useState(1);
  const totalEtapas = 8;

  const titulosEtapas = [
    "Conhecendo a Criança", "Histórico de Saúde", "Mapa Alimentar", "Perfil Sensorial",
    "Rotina das Refeições", "Família e Comportamento", "Sinais de Atenção", "Rotina e Objetivos"
  ];

  // Estados Q7 (Motivos)
  const [motivos, setMotivos] = useState<string[]>([]);
  const [outroMotivoTexto, setOutroMotivoTexto] = useState("");
  
  // Estados Q8 (Diagnósticos)
  const [diagnosticos, setDiagnosticos] = useState<string[]>([]);
  const [outroDiagnosticoTexto, setOutroDiagnosticoTexto] = useState("");

  // Estados Q9 (Comunicação)
  const [comunicacao, setComunicacao] = useState("");
  const [outroComunicacaoTexto, setOutroComunicacaoTexto] = useState("");

  const handleMotivoToggle = (motivo: string) => {
    if (motivos.includes(motivo)) {
      setMotivos(motivos.filter((m) => m !== motivo));
      if (motivo === "Outro") setOutroMotivoTexto(""); 
    } else {
      if (motivos.length < 3) {
        setMotivos([...motivos, motivo]);
      }
    }
  };

  const handleDiagnosticoToggle = (diag: string) => {
    if (diag === "Não") {
      setDiagnosticos(["Não"]);
      setOutroDiagnosticoTexto("");
      return;
    }
    let novosDiagnosticos = diagnosticos.filter(d => d !== "Não");
    
    if (novosDiagnosticos.includes(diag)) {
      novosDiagnosticos = novosDiagnosticos.filter(d => d !== diag);
      if (diag === "Outro") setOutroDiagnosticoTexto("");
      setDiagnosticos(novosDiagnosticos);
    } else {
      setDiagnosticos([...novosDiagnosticos, diag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (etapaAtual < totalEtapas) setEtapaAtual(etapaAtual + 1);
    window.scrollTo(0, 0);
  };

  const voltarEtapa = () => {
    if (etapaAtual > 1) setEtapaAtual(etapaAtual - 1);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-[#F0EAE1] font-sans text-slate-800 pb-20">
      
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between mb-3 relative">
            <div className="w-10 sm:w-32"></div> 
            <div className="relative h-14 w-40 sm:h-20 sm:w-56">
              <Image src="/logo-transparente.png" alt="Nutrindo em Casa" fill className="object-contain" priority />
            </div>
            <div className="flex items-center gap-1.5 text-base font-semibold text-slate-400 w-10 sm:w-32 justify-end">
              <Save className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Salvo</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-sm sm:text-base font-bold">
              <span className="text-[#4C6C54]">Etapa {etapaAtual} de {totalEtapas}</span>
              <span className="text-slate-400">{titulosEtapas[etapaAtual - 1]}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-[#4C6C54] rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${(etapaAtual / totalEtapas) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 mt-8">
        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-12 rounded-[2rem] shadow-sm border border-slate-100 space-y-12">
          
          {etapaAtual === 1 && (
            <div className="animation-fade-in space-y-12">
              
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center h-16 w-16 bg-[#4C6C54]/10 rounded-2xl mb-4">
                  <span className="text-3xl">👧</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#4C6C54] mb-3">Conhecendo a criança</h1>
                <p className="text-slate-500 text-lg">Perfil e motivo da procura.</p>
              </div>

              {/* BLOCO 1: DADOS BÁSICOS */}
              <div className="space-y-6 bg-slate-50/50 p-6 sm:p-8 rounded-3xl border border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label htmlFor="nomeCrianca" className="block text-base font-bold text-slate-800 mb-2">
                      1. Nome da criança <span className="text-red-500">*</span>
                    </label>
                    <input type="text" id="nomeCrianca" className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] transition-all text-lg" placeholder="Digite o nome" required />
                  </div>
                  <div>
                    <label htmlFor="dataNascimento" className="block text-base font-bold text-slate-800 mb-2">
                      2. Data de nascimento da criança <span className="text-red-500">*</span>
                    </label>
                    <input type="date" id="dataNascimento" className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] transition-all text-lg" required />
                  </div>
                  <div>
                    <label className="block text-base font-bold text-slate-800 mb-2">
                      3. Sexo <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-3 h-14">
                      {["Masculino", "Feminino"].map(sexo => (
                        <label key={sexo} className="flex-1 flex items-center justify-center gap-2 border border-slate-200 bg-white rounded-2xl cursor-pointer has-[:checked]:border-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5 has-[:checked]:ring-1 has-[:checked]:ring-[#4C6C54] transition-all">
                          <input type="radio" name="sexo" value={sexo} className="hidden" required /> 
                          <span className="font-semibold text-slate-700">{sexo}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* BLOCO 2: RESPONSÁVEIS */}
              <div className="space-y-8">
                <div>
                  <label htmlFor="nomeResponsavel" className="block text-base font-bold text-slate-800 mb-2">
                    4. Nome completo do responsável <span className="text-red-500">*</span>
                  </label>
                  <input type="text" id="nomeResponsavel" className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] transition-all text-lg" placeholder="Digite seu nome" required />
                </div>

                <div>
                  <label className="block text-base font-bold text-slate-800 mb-3">
                    5. Quem está preenchendo? (Grau de parentesco) <span className="text-red-500">*</span>
                  </label>
                  <select className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] transition-all text-lg appearance-none cursor-pointer" required defaultValue="">
                    <option value="" disabled>Selecione...</option>
                    <option value="Mãe">Mãe</option>
                    <option value="Pai">Pai</option>
                    <option value="Avó/avô">Avó/avô</option>
                    <option value="Responsável legal">Responsável legal</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-base font-bold text-slate-800 mb-3">
                    6. Quem participa da alimentação da criança?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {["Mãe", "Pai", "Ambos", "Avó/avô", "Babá/cuidador", "Escola", "Outro"].map((opt) => (
                      <label key={opt} className="relative flex items-center p-4 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5">
                        <input type="checkbox" className="peer w-5 h-5 text-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-3" />
                        <span className="text-sm font-semibold text-slate-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* BLOCO 3: MOTIVOS */}
              <div>
                <div className="mb-4">
                  <label className="block text-base font-bold text-slate-800 mb-1">
                    7. Qual o principal motivo da procura? <span className="text-red-500">*</span>
                  </label>
                  <span className="inline-block bg-[#EB6D57]/10 text-[#EB6D57] text-xs font-bold px-3 py-1 rounded-full">
                    Escolha até 3 opções ({motivos.length}/3)
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    "Come poucos alimentos", "Recusa alimentos novos", "Recusa frutas", 
                    "Recusa verduras/legumes", "Recusa carnes/proteínas", "Dificuldade com texturas",
                    "Dificuldade com cheiro/aparência", "Aceita poucas marcas/apresentações",
                    "Não aceita alimentos misturados", "Refeições muito demoradas", 
                    "Chora/irritada nas refeições", "Engasga, tem ânsia ou vomita", 
                    "Dificuldade de mastigar/engolir", "Baixo peso", "Excesso de peso", 
                    "Introdução alimentar", "Melhorar qualidade da alimentação"
                  ].map((motivo) => (
                    <label key={motivo} className={`flex items-start p-4 rounded-2xl border cursor-pointer transition-all ${motivos.includes(motivo) ? 'border-[#4C6C54] bg-[#4C6C54]/5 shadow-sm' : 'border-slate-200 hover:border-slate-300'} ${!motivos.includes(motivo) && motivos.length >= 3 ? 'opacity-40 cursor-not-allowed' : ''}`}>
                      <input 
                        type="checkbox" checked={motivos.includes(motivo)} onChange={() => handleMotivoToggle(motivo)}
                        disabled={!motivos.includes(motivo) && motivos.length >= 3}
                        className="w-5 h-5 text-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mt-0.5 mr-3 shrink-0" 
                      />
                      <span className="text-sm font-medium text-slate-700 leading-tight">{motivo}</span>
                    </label>
                  ))}
                  
                  <div className={`flex flex-col p-4 rounded-2xl border transition-all sm:col-span-2 ${motivos.includes("Outro") ? 'border-[#4C6C54] bg-[#4C6C54]/5 shadow-sm' : 'border-slate-200'}`}>
                    <label className={`flex items-center cursor-pointer ${!motivos.includes("Outro") && motivos.length >= 3 ? 'opacity-40' : ''}`}>
                      <input type="checkbox" checked={motivos.includes("Outro")} onChange={() => handleMotivoToggle("Outro")} disabled={!motivos.includes("Outro") && motivos.length >= 3} className="w-5 h-5 text-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-3" />
                      <span className="text-sm font-bold text-slate-700">Outro motivo</span>
                    </label>
                    {motivos.includes("Outro") && (
                      <input type="text" value={outroMotivoTexto} onChange={(e) => setOutroMotivoTexto(e.target.value)} placeholder="Por favor, especifique o motivo..." className="w-full mt-3 h-12 px-4 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#4C6C54] text-sm" required />
                    )}
                  </div>
                </div>
              </div>

              {/* BLOCO 4: DIAGNÓSTICO CLÍNICO */}
              <div className="p-6 sm:p-8 bg-[#4C6C54]/5 border border-[#4C6C54]/20 rounded-3xl space-y-6">
                <div>
                  <label className="block text-base font-bold text-slate-800 mb-4">
                    8. A criança possui algum diagnóstico?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {["Não", "TEA", "TDAH/TDA", "TOD", "Atraso do desenvolvimento", "Deficiência intelectual", "Síndrome genética", "Paralisia cerebral", "Transtorno de linguagem", "Outro"].map((diag) => (
                      <label key={diag} className="flex items-center p-3.5 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#4C6C54]/30 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:ring-1 has-[:checked]:ring-[#4C6C54]">
                        <input type="checkbox" checked={diagnosticos.includes(diag)} onChange={() => handleDiagnosticoToggle(diag)} className="w-5 h-5 text-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-3" />
                        <span className="text-sm font-semibold text-slate-700">{diag}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Expansão Q8 - TEA */}
                {diagnosticos.includes("TEA") && (
                  <div className="animation-fade-in pt-4 border-t border-[#4C6C54]/20">
                    <label className="block text-base font-bold text-slate-800 mb-3">
                      Se TEA → Qual o nível de suporte? <span className="text-red-500">*</span>
                    </label>
                    <select className="w-full h-14 px-5 bg-white border border-[#4C6C54]/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4C6C54] text-base appearance-none cursor-pointer" required defaultValue="">
                      <option value="" disabled>Selecione o nível...</option>
                      <option value="1">Nível 1</option>
                      <option value="2">Nível 2</option>
                      <option value="3">Nível 3</option>
                      <option value="Não sei">Não sei</option>
                    </select>
                  </div>
                )}

                {/* Expansão Q8 - Outro Diagnóstico */}
                {diagnosticos.includes("Outro") && (
                  <div className="animation-fade-in pt-4 border-t border-[#4C6C54]/20">
                    <label className="block text-base font-bold text-slate-800 mb-3">
                      Qual outro diagnóstico? <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={outroDiagnosticoTexto} 
                      onChange={(e) => setOutroDiagnosticoTexto(e.target.value)} 
                      placeholder="Especifique o diagnóstico..." 
                      className="w-full h-14 px-5 bg-white border border-[#4C6C54]/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4C6C54] text-base" 
                      required 
                    />
                  </div>
                )}
              </div>

              {/* BLOCO 5: COMUNICAÇÃO */}
              <div className="space-y-8 border-t border-slate-100 pt-10">
                <div>
                  <label className="block text-base font-bold text-slate-800 mb-3">
                    9. Como a criança se comunica? <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={comunicacao}
                    onChange={(e) => setComunicacao(e.target.value)}
                    className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] text-lg appearance-none cursor-pointer" 
                    required 
                  >
                    <option value="" disabled>Selecione a opção que melhor descreve...</option>
                    <option value="Verbal, adequada para idade">Verbal, adequada para idade</option>
                    <option value="Verbal, com dificuldades">Verbal, com dificuldades</option>
                    <option value="Fala poucas palavras">Fala poucas palavras</option>
                    <option value="Predominantemente não verbal">Predominantemente não verbal</option>
                    <option value="Comunicação alternativa/aumentativa">Comunicação alternativa/aumentativa</option>
                    <option value="Outro">Outro</option>
                  </select>

                  {/* Expansão Q9 - Outra Comunicação */}
                  {comunicacao === "Outro" && (
                    <div className="animation-fade-in mt-4">
                      <input 
                        type="text" 
                        value={outroComunicacaoTexto} 
                        onChange={(e) => setOutroComunicacaoTexto(e.target.value)} 
                        placeholder="Descreva como a criança se comunica..." 
                        className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] text-base" 
                        required 
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-base font-bold text-slate-800 mb-4">
                    10. A criança consegue se comunicar de forma geral? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col gap-3">
                    {["Sim, na maioria das situações", "Às vezes", "Tem muita dificuldade", "Não consigo avaliar"].map((opcao) => (
                      <label key={opcao} className="flex items-center p-5 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5 has-[:checked]:shadow-sm">
                        <input type="radio" name="situacao_comunicacao" value={opcao} className="w-5 h-5 text-[#4C6C54] focus:ring-[#4C6C54] mr-4" required />
                        <span className="text-base font-semibold text-slate-700">{opcao}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {etapaAtual === 2 && (
            <div className="animation-fade-in text-center py-20">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Etapa 2: Histórico de Saúde 🩺</h2>
              <p className="text-slate-500">Em desenvolvimento para a próxima iteração.</p>
            </div>
          )}

          {/* Rodapé de Navegação */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-100">
            <button type="button" onClick={voltarEtapa} disabled={etapaAtual === 1} className="flex items-center gap-2 px-6 py-4 font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-2xl transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft className="h-5 w-5" /> Voltar
            </button>
            <button type="submit" className="flex items-center gap-2 px-8 py-4 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-bold rounded-2xl transition-all shadow-md hover:shadow-lg hover:scale-105">
              Próximo Passo <ChevronRight className="h-5 w-5" />
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}