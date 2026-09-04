"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronRight, ChevronLeft, Save } from "lucide-react";

export default function AnamneseWizard() {
    // Controle de qual etapa do formulário a mãe está (de 1 a 8)
  const [etapaAtual, setEtapaAtual] = useState(1);
  const totalEtapas = 8;

    // Títulos das 8 etapas para a barra de progresso
  const titulosEtapas = [
    "Conhecendo a Criança", "Histórico de Saúde", "Mapa Alimentar", "Perfil Sensorial",
    "Rotina das Refeições", "Família e Comportamento", "Sinais de Atenção", "Rotina e Objetivos"
  ];

  // ESTADOS DA QUESTÃO 5 (Motivos - Max 3)
  const [motivos, setMotivos] = useState<string[]>([]);
  const [outroMotivoTexto, setOutroMotivoTexto] = useState("");
  
  // ESTADO DA QUESTÃO 8 (Diagnóstico - Para abrir a Q9 se for TEA)
  const [diagnostico, setDiagnostico] = useState("");

  // Lógica de travamento dos Checkboxes (Max 3)
  const handleMotivoToggle = (motivo: string) => {
    if (motivos.includes(motivo)) {
      setMotivos(motivos.filter((m) => m !== motivo));
      if (motivo === "Outro") setOutroMotivoTexto(""); // Limpa o texto se desmarcar
    } else {
      if (motivos.length < 3) {
        setMotivos([...motivos, motivo]);
      }
    }
  };

  // Avanço bloqueado nativamente pelo Formulário (só avança se tudo estiver preenchido)
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
      
      {/* Header Fixo / Barra de Progresso com Logo Centralizada */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          
          {/* Topo: Logo Centralizada e Ícone de Salvar */}
          <div className="flex items-center justify-between mb-3 relative">
            {/* Espaçador invisível à esquerda para manter a logo exatamente no centro usando Flexbox */}
            <div className="w-10 sm:w-32"></div> 
            
            <div className="relative h-16 w-48 sm:h-20 sm:w-56">
              <Image src="/logo-transparente.png" alt="Nutrindo em Casa" fill className="object-contain" priority />
            </div>
            
            {/* Status de Salvamento Refinado */}
            <div className="flex items-center gap-1.5 text-base font-semibold text-slate-400 w-10 sm:w-32 justify-end">
              <Save className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Salvo</span>
            </div>
          </div>

          {/* Barra de Progresso Visual */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-base sm:text-base font-bold">
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

      {/* Área Principal */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 mt-8">
        
        {/* FORMULÁRIO ENVOLVE TODAS AS ETAPAS E OS BOTÕES */}
        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-slate-100 space-y-10">
          
          {etapaAtual === 1 && (
            <div className="animation-fade-in space-y-8">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-[#4C6C54] mb-2">👧 Conhecendo a Criança</h1>
                <p className="text-slate-500">Vamos começar pelo básico. Queremos conhecer um pouco mais sobre o seu pequeno.</p>
              </div>

              {/* Q1 e Q2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="nomeCrianca" className="block text-xl font-bold text-slate-800 mb-2">
                    1. Nome da criança <span className="text-red-500">*</span>
                  </label>
                  <input type="text" id="nomeCrianca" className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50" placeholder="Digite o nome" required />
                </div>
                <div>
                  <label htmlFor="dataNascimento" className="block text-xl font-bold text-slate-800 mb-2">
                    2. Data de nascimento <span className="text-red-500">*</span>
                  </label>
                  <input type="date" id="dataNascimento" className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50" required />
                </div>
              </div>

              {/* Q3 */}
              <div>
                <label className="block text-xl font-bold text-slate-800 mb-2">
                  3. Quem está preenchendo? <span className="text-red-500">*</span>
                </label>
                <select className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50" required>
                  <option value="">Selecione...</option>
                  <option value="mae">Mãe</option>
                  <option value="pai">Pai</option>
                  <option value="avo">Avó/Avô</option>
                  <option value="responsavel">Responsável legal</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              {/* Q4 */}
              <div>
                <label className="block text-xl font-bold text-slate-800 mb-2">
                  4. Quem participa mais diretamente da alimentação da criança?
                </label>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {["Mãe", "Pai", "Ambos", "Avó/avô", "Babá/cuidador", "Escola", "Outro"].map((opt) => (
                    <label key={opt} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer has-[:checked]:border-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5" >
                      <input type="checkbox" className="w-5 h-5 text-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54]" />
                      <span className="text-base font-medium text-slate-700">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Q5 - COM LÓGICA DE TRAVAMENTO E OBRIGATORIEDADE */}
              <div>
                <label className="block text-xl font-bold text-slate-800 mb-1">
                  5. Qual é o principal motivo pelo qual você procurou o Nutrindo em Casa? <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-[#EB6D57] font-medium mb-4">Escolha no máximo 3 opções ({motivos.length}/3).</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    "Come poucos alimentos", "Recusa alimentos novos", "Recusa frutas", 
                    "Recusa verduras/legumes", "Recusa carnes/proteínas", "Não aceita determinados grupos",
                    "Aceita somente algumas marcas", "Dificuldade com texturas", "Dificuldade com cheiros",
                    "Dificuldade com aparência", "Não aceita alimentos misturados", "Faz refeições muito demoradas",
                    "Apresenta choro/irritação", "Apresenta ânsia/vômito", "Dificuldade de mastigação",
                    "Baixo peso/desnutrição", "Excesso de peso", "Melhorar qualidade da alimentação"
                  ].map((motivo) => (
                    <label key={motivo} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${motivos.includes(motivo) ? 'border-[#4C6C54] bg-[#4C6C54]/5' : 'border-slate-200 hover:bg-slate-50'} ${!motivos.includes(motivo) && motivos.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input 
                        type="checkbox" 
                        checked={motivos.includes(motivo)}
                        onChange={() => handleMotivoToggle(motivo)}
                        disabled={!motivos.includes(motivo) && motivos.length >= 3}
                        className="w-5 h-5 text-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54]" 
                      />
                      <span className="text-sm font-medium text-slate-700">{motivo}</span>
                    </label>
                  ))}
                  
                  {/* Opção Outro - Com campo obrigatório se marcado */}
                  <div className={`flex flex-col gap-2 p-3 rounded-xl border sm:col-span-2 ${motivos.includes("Outro") ? 'border-[#4C6C54] bg-[#4C6C54]/5' : 'border-slate-200'}`}>
                    <label className={`flex items-center gap-3 cursor-pointer ${!motivos.includes("Outro") && motivos.length >= 3 ? 'opacity-50' : ''}`}>
                      <input 
                        type="checkbox" 
                        checked={motivos.includes("Outro")}
                        onChange={() => handleMotivoToggle("Outro")}
                        disabled={!motivos.includes("Outro") && motivos.length >= 3}
                        className="w-5 h-5 text-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54]" 
                      />
                      <span className="text-sm font-medium text-slate-700">Outro motivo</span>
                    </label>
                    {motivos.includes("Outro") && (
                      <input 
                        type="text" 
                        value={outroMotivoTexto}
                        onChange={(e) => setOutroMotivoTexto(e.target.value)}
                        placeholder="Por favor, especifique o motivo..." 
                        className="w-full mt-2 h-10 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#4C6C54]"
                        required // ISSO OBRIGA A PREENCHER SE "OUTRO" ESTIVER MARCADO
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Q6 e Q7 */}
              <div className="space-y-8">
                <div>
                  <label htmlFor="unicaCoisa" className="block text-xl font-bold text-slate-800 mb-2">
                    6. Se pudesse escolher apenas UMA coisa para melhorar primeiro, qual seria? <span className="text-red-500">*</span>
                  </label>
                  <textarea id="unicaCoisa" rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 transition-all resize-none" placeholder="Ex: Gostaria que ele aceitasse comer na mesma mesa que a família..." required></textarea>
                </div>
                <div>
                  <label htmlFor="objetivo6Semanas" className="block text-xl font-bold text-slate-800 mb-2">
                    7. Como você gostaria que estivesse a alimentação da criança daqui a 6 semanas? <span className="text-red-500">*</span>
                  </label>
                  <textarea id="objetivo6Semanas" rows={3} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 transition-all resize-none" 
                  placeholder="Isso nos ajudará a alinhar nossas metas juntos." required></textarea>
                </div>
              </div>

              {/* Q8 e Dependencia TEA */}
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-6">
                <div>
                  <label className="block text-xl font-bold text-slate-800 mb-2">
                    8. A criança possui algum diagnóstico?
                  </label>
                  <select 
                    value={diagnostico}
                    onChange={(e) => setDiagnostico(e.target.value)}
                    className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50" required>

                    <option value="" disabled>Selecione...</option>    
                    <option value="nao">Não possui</option>
                    <option value="tea">TEA</option>
                    <option value="tdah">TDAH / TDA</option>
                    <option value="tod">TOD</option>
                    <option value="sindrome">Síndrome genética</option>
                    <option value="atraso">Atraso do desenvolvimento</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                
                {diagnostico === "tea" && (
                  <div className="animation-fade-in pt-4 border-t border-slate-200">
                    <label className="block text-xl font-bold text-slate-800 mb-2">
                      Se TEA, qual nível de suporte informado no diagnóstico?
                    </label>
                    <select className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50" required>
                      <option value="" disabled>Selecione...</option>
                      <option value="1">Nível 1</option>
                      <option value="2">Nível 2</option>
                      <option value="3">Nível 3</option>
                      <option value="naosei">Não sei</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Q9 */}
              <div>
                <label className="block text-xl font-bold text-slate-800 mb-2">
                  9. Como a criança se comunica?
                </label>
                <select className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50" required>
                  <option value="">Selecione...</option>
                  <option value="verbal_adequada">Verbal, com comunicação adequada para idade</option>
                  <option value="verbal_dificuldade">Verbal, mas com dificuldades</option>
                  <option value="poucas_palavras">Fala poucas palavras</option>
                  <option value="nao_verbal">Predominantemente não verbal</option>
                  <option value="alternativa">Utiliza comunicação alternativa/aumentativa</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              {/* Q10 - Matriz */}
              <div>
                <label className="block text-xl font-bold text-slate-800 mb-4">
                  10. A criança consegue comunicar quando:
                </label>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b-2 border-slate-200 text-slate-500 text-sm uppercase">
                        <th className="pb-3 font-semibold">Situação</th>
                        <th className="pb-3 text-center font-semibold">Sim</th>
                        <th className="pb-3 text-center font-semibold">Às vezes</th>
                        <th className="pb-3 text-center font-semibold">Não</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {["Está com fome", "Está satisfeita", "Está com sede", "Não gostou de um alimento", "Está com dor", "Está desconfortável"].map((sit, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 text-base font-medium text-slate-700">{sit}</td>
                          <td className="py-4 text-center"><input type="radio" name={`sit-${i}`} value="sim" className="w-5 h-5 text-[#4C6C54] focus:ring-[#4C6C54]" /></td>
                          <td className="py-4 text-center"><input type="radio" name={`sit-${i}`} value="as_vezes" className="w-5 h-5 text-[#4C6C54] focus:ring-[#4C6C54]" /></td>
                          <td className="py-4 text-center"><input type="radio" name={`sit-${i}`} value="nao" className="w-5 h-5 text-[#4C6C54] focus:ring-[#4C6C54]" required/></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Q11 */}
              <div>
                <label className="block text-xl font-bold text-slate-800 mb-2">
                  11. Possui algum comportamento que possa interferir nas refeições?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                  {["Hiperatividade", "Agressividade", "Autoagressão", "Fuga", "Choro", "Gritos", "Ansiedade", "Dificuldade de sentar", "Nenhum", "Outro"].map((comp) => (
                    <label key={comp} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer has-[:checked]:border-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5">
                      <input type="checkbox" className="w-5 h-5 text-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54]" />
                      <span className="text-sm font-medium text-slate-700">{comp}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {etapaAtual === 2 && (
            <div className="animation-fade-in text-center py-20">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Etapa 2: Histórico de Saúde 🩺</h2>
              <p className="text-slate-500">As perguntas sobre gestação, aleitamento e introdução alimentar entrarão aqui.</p>
            </div>
          )}

          {/* Botões de Navegação (Agora DENTRO do form) */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <button 
              type="button"
              onClick={voltarEtapa}
              disabled={etapaAtual === 1}
              className="flex items-center gap-2 px-6 py-3 font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" /> Voltar
            </button>

            {/* O type="submit" garante que o form seja validado antes de chamar a função handleSubmit */}
            <button 
              type="submit"
              className="flex items-center gap-2 px-8 py-3 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-bold rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              Próximo Passo <ChevronRight className="h-5 w-5" />
            </button>
          </div>

        </form>

      </main>
    </div>
  );
}