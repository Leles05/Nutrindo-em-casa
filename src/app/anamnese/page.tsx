"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ChevronRight, ChevronLeft, Save, Paperclip, X, FileText } from "lucide-react";

export default function AnamneseWizard() {
  const [etapaAtual, setEtapaAtual] = useState(1);
  const totalEtapas = 8;

  const titulosEtapas = [
    "Conhecendo a Criança", "Histórico de Saúde", "Mapa Alimentar", "Perfil Sensorial",
    "Rotina das Refeições", "Família e Comportamento", "Sinais de Atenção", "Rotina e Objetivos"
  ];

  // Travas de Data Seguras (Focado em Pediatria)
  const hoje = new Date().toISOString().split("T")[0];
  const dataMinima = "2000-01-01"; 

  // ==========================================
  // ESTADOS - ETAPA 1
  // ==========================================
  const [motivos, setMotivos] = useState<string[]>([]);
  const [outroMotivoTexto, setOutroMotivoTexto] = useState("");
  const [diagnosticos, setDiagnosticos] = useState<string[]>([]);
  const [outroDiagnosticoTexto, setOutroDiagnosticoTexto] = useState("");
  const [comunicacao, setComunicacao] = useState("");
  const [outroComunicacaoTexto, setOutroComunicacaoTexto] = useState("");

  // ==========================================
  // ESTADOS - ETAPA 2
  // ==========================================
  const [gestacao, setGestacao] = useState<string[]>([]);
  const [gestacaoIntercorrencia, setGestacaoIntercorrencia] = useState("");
  const [aleitamento, setAleitamento] = useState("");
  const [aleitamentoFimMeses, setAleitamentoFimMeses] = useState("");
  const [formulaInicioMeses, setFormulaInicioMeses] = useState("");
  
  const [dificuldadesAmamentacao, setDificuldadesAmamentacao] = useState<string[]>([]);
  const [outroDificuldadeAmamentacaoTexto, setOutroDificuldadeAmamentacaoTexto] = useState(""); 
  
  const [metodoIA, setMetodoIA] = useState("");
  const [outroMetodoIATexto, setOutroMetodoIATexto] = useState("");

  const [dificuldadesIA, setDificuldadesIA] = useState<string[]>([]);
  const [outroDificuldadeIATexto, setOutroDificuldadeIATexto] = useState(""); 
  
  const [eventosAssociados, setEventosAssociados] = useState<string[]>([]);
  const [outroEventoAssociadoTexto, setOutroEventoAssociadoTexto] = useState(""); 
  
  const [gastro, setGastro] = useState<string[]>([]);
  const [gastroDetalhes, setGastroDetalhes] = useState("");
  const [outroGastroTexto, setOutroGastroTexto] = useState(""); 

  const [sintomasAdversos, setSintomasAdversos] = useState("");
  const [sintomasAdversosDetalhes, setSintomasAdversosDetalhes] = useState("");
  
  const [medidaPesoPor, setMedidaPesoPor] = useState("");
  const [medidaAlturaPor, setMedidaAlturaPor] = useState("");
  
  const [medicamentos, setMedicamentos] = useState("");
  const [medicamentosDetalhes, setMedicamentosDetalhes] = useState("");
  
  const [suplementos, setSuplementos] = useState<string[]>([]);
  const [outroSuplementoTexto, setOutroSuplementoTexto] = useState("");

  const [exames, setExames] = useState("");
  const [arquivosExames, setArquivosExames] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // FUNÇÕES DE CONTROLE
  // ==========================================
  const handleMotivoToggle = (motivo: string) => {
    if (motivos.includes(motivo)) {
      setMotivos(motivos.filter((m) => m !== motivo));
      if (motivo === "Outro") setOutroMotivoTexto(""); 
    } else {
      if (motivos.length < 3) setMotivos([...motivos, motivo]);
    }
  };

  const handleCheckboxToggle = (
    valor: string, 
    estadoAtual: string[], 
    setEstado: React.Dispatch<React.SetStateAction<string[]>>,
    exclusivos: string[] = ["Não", "Nenhum", "Sem intercorrências", "Não sei informar", "Não sei"]
  ) => {
    if (exclusivos.includes(valor)) {
      setEstado([valor]);
      return;
    }
    let novoEstado = estadoAtual.filter(item => !exclusivos.includes(item));
    
    if (novoEstado.includes(valor)) {
      setEstado(novoEstado.filter(item => item !== valor));
    } else {
      setEstado([...novoEstado, valor]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const novosArquivos = Array.from(e.target.files);
      setArquivosExames(prev => [...prev, ...novosArquivos]);
    }
    if (e.target) e.target.value = '';
  };

  const removerArquivo = (indexToRemove: number) => {
    setArquivosExames(prev => prev.filter((_, index) => index !== indexToRemove));
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
      
      {/* HEADER FIXO */}
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
          
          {/* ================================================================ */}
          {/* ETAPA 1 */}
          {/* ================================================================ */}
          {etapaAtual === 1 && (
            <div className="animation-fade-in space-y-12">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center h-16 w-16 bg-[#4C6C54]/10 rounded-2xl mb-4">
                  <span className="text-3xl">👧</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#4C6C54] mb-3">Conhecendo a criança</h1>
                <p className="text-slate-500 text-lg">Perfil e motivo da procura.</p>
              </div>

              {/* BLOCO 1 */}
              <div className="space-y-6 bg-slate-50/50 p-6 sm:p-8 rounded-3xl border border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-base font-bold text-slate-800 mb-2">1. Nome da criança <span className="text-red-500">*</span></label>
                    <input type="text" className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] transition-all text-lg" placeholder="Digite o nome" required />
                  </div>
                  <div>
                    <label className="block text-base font-bold text-slate-800 mb-2">2. Data de nascimento <span className="text-red-500">*</span></label>
                    <input type="date" min={dataMinima} max={hoje} className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] transition-all text-lg" required />
                  </div>
                  <div>
                    <label className="block text-base font-bold text-slate-800 mb-2">3. Sexo <span className="text-red-500">*</span></label>
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

              {/* BLOCO 2 */}
              <div className="space-y-8">
                <div>
                  <label className="block text-base font-bold text-slate-800 mb-2">4. Nome completo do responsável <span className="text-red-500">*</span></label>
                  <input type="text" className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] transition-all text-lg" placeholder="Digite seu nome" required />
                </div>
                <div>
                  <label className="block text-base font-bold text-slate-800 mb-3">5. Grau de parentesco <span className="text-red-500">*</span></label>
                  <select className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] transition-all text-lg cursor-pointer" required defaultValue="">
                    <option value="" disabled>Selecione...</option>
                    <option value="Mãe">Mãe</option>
                    <option value="Pai">Pai</option>
                    <option value="Avó/avô">Avó/avô</option>
                    <option value="Responsável legal">Responsável legal</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-base font-bold text-slate-800 mb-3">6. Quem participa da alimentação da criança?</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {["Mãe", "Pai", "Ambos", "Avó/avô", "Babá/cuidador", "Escola", "Outro"].map((opt) => (
                      <label key={opt} className="flex items-center p-4 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5">
                        <input type="checkbox" className="w-5 h-5 text-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-3" />
                        <span className="text-sm font-semibold text-slate-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* BLOCO 3 */}
              <div>
                <div className="mb-4">
                  <label className="block text-base font-bold text-slate-800 mb-1">7. Qual o principal motivo da procura? <span className="text-red-500">*</span></label>
                  <span className="inline-block bg-[#EB6D57]/10 text-[#EB6D57] text-xs font-bold px-3 py-1 rounded-full">Escolha até 3 opções ({motivos.length}/3)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {["Come poucos alimentos", "Recusa alimentos novos", "Recusa frutas", "Recusa verduras/legumes", "Recusa carnes/proteínas", "Dificuldade com texturas", "Dificuldade com cheiro/aparência", "Aceita poucas marcas/apresentações", "Não aceita alimentos misturados", "Refeições muito demoradas", "Chora/irritada nas refeições", "Engasga, tem ânsia ou vomita", "Dificuldade de mastigar/engolir", "Baixo peso", "Excesso de peso", "Introdução alimentar", "Melhorar qualidade da alimentação"].map((motivo) => (
                    <label key={motivo} className={`flex items-start p-4 rounded-2xl border cursor-pointer transition-all ${motivos.includes(motivo) ? 'border-[#4C6C54] bg-[#4C6C54]/5 shadow-sm' : 'border-slate-200 hover:border-slate-300'} ${!motivos.includes(motivo) && motivos.length >= 3 ? 'opacity-40 cursor-not-allowed' : ''}`}>
                      <input type="checkbox" checked={motivos.includes(motivo)} onChange={() => handleMotivoToggle(motivo)} disabled={!motivos.includes(motivo) && motivos.length >= 3} className="w-5 h-5 text-[#4C6C54] rounded border-slate-300 mt-0.5 mr-3 shrink-0 focus:ring-[#4C6C54]" />
                      <span className="text-sm font-medium text-slate-700 leading-tight">{motivo}</span>
                    </label>
                  ))}
                  <div className={`flex flex-col p-4 rounded-2xl border transition-all sm:col-span-2 ${motivos.includes("Outro") ? 'border-[#4C6C54] bg-[#4C6C54]/5 shadow-sm' : 'border-slate-200'}`}>
                    <label className={`flex items-center cursor-pointer ${!motivos.includes("Outro") && motivos.length >= 3 ? 'opacity-40' : ''}`}>
                      <input type="checkbox" checked={motivos.includes("Outro")} onChange={() => handleMotivoToggle("Outro")} disabled={!motivos.includes("Outro") && motivos.length >= 3} className="w-5 h-5 text-[#4C6C54] rounded border-slate-300 mr-3 focus:ring-[#4C6C54]" />
                      <span className="text-sm font-bold text-slate-700">Outro motivo</span>
                    </label>
                    {motivos.includes("Outro") && <input type="text" value={outroMotivoTexto} onChange={(e) => setOutroMotivoTexto(e.target.value)} placeholder="Por favor, especifique o motivo..." className="w-full mt-3 h-12 px-4 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#4C6C54] text-sm" required />}
                  </div>
                </div>
              </div>

              {/* BLOCO 4 */}
              <div className="p-6 sm:p-8 bg-[#4C6C54]/5 border border-[#4C6C54]/20 rounded-3xl space-y-6">
                <div>
                  <label className="block text-base font-bold text-slate-800 mb-4">8. A criança possui algum diagnóstico?</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {["Não", "TEA", "TDAH/TDA", "TOD", "Atraso do desenvolvimento", "Deficiência intelectual", "Síndrome genética", "Paralisia cerebral", "Transtorno de linguagem", "Outro"].map((diag) => (
                      <label key={diag} className="flex items-center p-3.5 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#4C6C54]/30 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:ring-1 has-[:checked]:ring-[#4C6C54]">
                        <input type="checkbox" checked={diagnosticos.includes(diag)} onChange={() => handleCheckboxToggle(diag, diagnosticos, setDiagnosticos)} className="w-5 h-5 text-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-3" />
                        <span className="text-sm font-semibold text-slate-700">{diag}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {diagnosticos.includes("TEA") && (
                  <div className="animation-fade-in pt-4 border-t border-[#4C6C54]/20">
                    <label className="block text-base font-bold text-slate-800 mb-3">Se TEA → Qual o nível de suporte? <span className="text-red-500">*</span></label>
                    <select className="w-full h-14 px-5 bg-white border border-[#4C6C54]/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4C6C54] text-base cursor-pointer" required defaultValue="">
                      <option value="" disabled>Selecione o nível...</option>
                      <option value="1">Nível 1</option>
                      <option value="2">Nível 2</option>
                      <option value="3">Nível 3</option>
                      <option value="Não sei">Não sei</option>
                    </select>
                  </div>
                )}
                {diagnosticos.includes("Outro") && (
                  <div className="animation-fade-in pt-4 border-t border-[#4C6C54]/20">
                    <label className="block text-base font-bold text-slate-800 mb-3">Qual outro diagnóstico? <span className="text-red-500">*</span></label>
                    <input type="text" value={outroDiagnosticoTexto} onChange={(e) => setOutroDiagnosticoTexto(e.target.value)} placeholder="Especifique o diagnóstico..." className="w-full h-14 px-5 bg-white border border-[#4C6C54]/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4C6C54] text-base" required />
                  </div>
                )}
              </div>

              {/* BLOCO 5 */}
              <div className="space-y-8 border-t border-slate-100 pt-10">
                <div>
                  <label className="block text-base font-bold text-slate-800 mb-3">9. Como a criança se comunica? <span className="text-red-500">*</span></label>
                  <select value={comunicacao} onChange={(e) => setComunicacao(e.target.value)} className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] text-lg cursor-pointer" required>
                    <option value="" disabled>Selecione a opção que melhor descreve...</option>
                    <option value="Verbal, adequada para idade">Verbal, adequada para idade</option>
                    <option value="Verbal, com dificuldades">Verbal, com dificuldades</option>
                    <option value="Fala poucas palavras">Fala poucas palavras</option>
                    <option value="Predominantemente não verbal">Predominantemente não verbal</option>
                    <option value="Comunicação alternativa/aumentativa">Comunicação alternativa/aumentativa</option>
                    <option value="Outro">Outro</option>
                  </select>
                  {comunicacao === "Outro" && (
                    <div className="animation-fade-in mt-4">
                      <input type="text" value={outroComunicacaoTexto} onChange={(e) => setOutroComunicacaoTexto(e.target.value)} placeholder="Descreva como a criança se comunica..." className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] text-base" required />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-base font-bold text-slate-800 mb-4">10. A criança consegue se comunicar de forma geral? <span className="text-red-500">*</span></label>
                  <div className="flex flex-col gap-3">
                    {["Sim, na maioria das situações", "Às vezes", "Tem muita dificuldade", "Não consigo avaliar"].map((opcao) => (
                      <label key={opcao} className="flex items-center p-5 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5 has-[:checked]:shadow-sm">
                        <input type="radio" name="situacao_comunicacao" value={opcao} className="w-5 h-5 text-[#4C6C54] mr-4 focus:ring-[#4C6C54]" required />
                        <span className="text-base font-semibold text-slate-700">{opcao}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* ================================================================ */}
          {/* ETAPA 2 - HISTÓRICO DE SAÚDE */}
          {/* ================================================================ */}
          {etapaAtual === 2 && (
            <div className="animation-fade-in space-y-12">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center h-16 w-16 bg-[#EB6D57]/10 rounded-2xl mb-4">
                  <span className="text-3xl">🩺</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#EB6D57] mb-3">Histórico de Saúde</h1>
                <p className="text-slate-500 text-lg">Gestação, amamentação, introdução alimentar e digestão.</p>
              </div>

              {/* BLOCO 1: GESTAÇÃO E NASCIMENTO */}
              <div className="space-y-8 bg-slate-50/50 p-6 sm:p-8 rounded-3xl border border-slate-100">
                <div>
                  <label className="block text-base font-bold text-slate-800 mb-4">11. Histórico da gestação e nascimento:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {["Sem intercorrências", "Houve alguma intercorrência", "Prematuro(a)", "Parto cesárea", "Parto vaginal", "Precisou de internação após nascer", "Não sei informar"].map((opcao) => (
                      <label key={opcao} className="flex items-center p-4 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#EB6D57]/30 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5">
                        <input type="checkbox" checked={gestacao.includes(opcao)} onChange={() => handleCheckboxToggle(opcao, gestacao, setGestacao, ["Sem intercorrências", "Não sei informar"])} className="w-5 h-5 text-[#EB6D57] rounded border-slate-300 focus:ring-[#EB6D57] mr-3" />
                        <span className="text-sm font-semibold text-slate-700">{opcao}</span>
                      </label>
                    ))}
                  </div>
                  {gestacao.includes("Houve alguma intercorrência") && (
                    <div className="animation-fade-in mt-4">
                      <textarea value={gestacaoIntercorrencia} onChange={(e) => setGestacaoIntercorrencia(e.target.value)} placeholder="Conte brevemente o que aconteceu..." rows={3} className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57] text-base resize-none" required />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200/60">
                  <div>
                    <label className="block text-base font-bold text-slate-800 mb-3">12. Com quantas semanas nasceu? <span className="text-red-500">*</span></label>
                    <select className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57] text-base cursor-pointer" required defaultValue="">
                      <option value="" disabled>Selecione...</option>
                      <option value="<37 semanas">Menos de 37 semanas</option>
                      <option value="37–38 semanas">37 a 38 semanas</option>
                      <option value="39–40 semanas">39 a 40 semanas</option>
                      <option value="Mais de 40 semanas">Mais de 40 semanas</option>
                      <option value="Não sei">Não sei</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-base font-bold text-slate-800 mb-3">13. Peso ao nascer (kg) <span className="text-red-500">*</span></label>
                    <input type="number" step="0.01" min="0" placeholder="Ex: 3.20" className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57] text-base" required />
                  </div>
                </div>
              </div>

              {/* BLOCO 2: ALEITAMENTO */}
              <div className="space-y-8">
                <div>
                  <label className="block text-base font-bold text-slate-800 mb-3">14. Como foi a alimentação nos primeiros meses? <span className="text-red-500">*</span></label>
                  <select value={aleitamento} onChange={(e) => setAleitamento(e.target.value)} className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57] text-lg cursor-pointer" required>
                    <option value="" disabled>Selecione a opção predominante...</option>
                    <option value="Aleitamento materno">Aleitamento materno exclusivo</option>
                    <option value="Fórmula infantil">Fórmula infantil</option>
                    <option value="Ambos">Ambos</option>
                    <option value="Não sei">Não sei</option>
                  </select>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {(aleitamento === "Aleitamento materno" || aleitamento === "Ambos") && (
                      <div className="animation-fade-in">
                        <label className="block text-sm font-bold text-slate-600 mb-2">Até aproximadamente quantos meses? (Peito) <span className="text-red-500">*</span></label>
                        <input type="number" min="0" value={aleitamentoFimMeses} onChange={(e) => setAleitamentoFimMeses(e.target.value)} placeholder="Ex: 6" className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57] text-base" required />
                      </div>
                    )}
                    {(aleitamento === "Fórmula infantil" || aleitamento === "Ambos") && (
                      <div className="animation-fade-in">
                        <label className="block text-sm font-bold text-slate-600 mb-2">Com quantos meses iniciou? (Fórmula) <span className="text-red-500">*</span></label>
                        <input type="number" min="0" value={formulaInicioMeses} onChange={(e) => setFormulaInicioMeses(e.target.value)} placeholder="Ex: 2" className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57] text-base" required />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-base font-bold text-slate-800 mb-4">15. Houve dificuldade no período de amamentação / fórmula?</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {["Não", "Pega", "Sucção", "Baixo ganho de peso", "Refluxo", "Recusa", "Dor", "Outra", "Não sei"].map((opt) => (
                      <label key={opt} className="relative flex items-center p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5">
                        <input type="checkbox" checked={dificuldadesAmamentacao.includes(opt)} onChange={() => handleCheckboxToggle(opt, dificuldadesAmamentacao, setDificuldadesAmamentacao, ["Não", "Não sei"])} className="w-5 h-5 text-[#EB6D57] rounded border-slate-300 focus:ring-[#EB6D57] mr-3" />
                        <span className="text-sm font-semibold text-slate-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                  {dificuldadesAmamentacao.includes("Outra") && (
                    <div className="animation-fade-in mt-3">
                      <input type="text" value={outroDificuldadeAmamentacaoTexto} onChange={(e) => setOutroDificuldadeAmamentacaoTexto(e.target.value)} placeholder="Especifique qual outra dificuldade..." className="w-full h-14 px-5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57] text-base" required />
                    </div>
                  )}
                </div>
              </div>

              {/* BLOCO 3: INTRODUÇÃO ALIMENTAR (IA) */}
              <div className="space-y-8 border-t border-slate-100 pt-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-base font-bold text-slate-800 mb-3">16. Com quantos meses iniciou a Introdução Alimentar? <span className="text-red-500">*</span></label>
                    <input type="number" min="0" placeholder="Ex: 6" className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57] text-lg" required />
                  </div>
                  <div>
                    <label className="block text-base font-bold text-slate-800 mb-3">17. Como os alimentos foram oferecidos? <span className="text-red-500">*</span></label>
                    <select value={metodoIA} onChange={(e) => setMetodoIA(e.target.value)} className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57] text-base cursor-pointer" required>
                      <option value="" disabled>Selecione...</option>
                      <option value="Amassados/papas">Amassados/papas</option>
                      <option value="Pedaços macios">Pedaços macios</option>
                      <option value="Pedaços desde o início BLW">Pedaços desde o início (BLW)</option>
                      <option value="Combinado">Combinado</option>
                      <option value="Não sei">Não sei</option>
                      <option value="Outro">Outro</option>
                    </select>
                    {metodoIA === "Outro" && (
                      <div className="animation-fade-in mt-3">
                        <input type="text" value={outroMetodoIATexto} onChange={(e) => setOutroMetodoIATexto(e.target.value)} placeholder="Especifique o método de introdução..." className="w-full h-14 px-5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57] text-base" required />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-base font-bold text-slate-800 mb-4">18. Houve dificuldade na Introdução Alimentar?</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {["Não", "Recusa", "Engasgos", "Náuseas/vômitos", "Dificuldade para mastigar", "Dificuldade para engolir", "Dificuldade com texturas", "Choro/estresse", "Outra"].map((opt) => (
                      <label key={opt} className="relative flex items-center p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5">
                        <input type="checkbox" checked={dificuldadesIA.includes(opt)} onChange={() => handleCheckboxToggle(opt, dificuldadesIA, setDificuldadesIA, ["Não"])} className="w-5 h-5 text-[#EB6D57] rounded border-slate-300 focus:ring-[#EB6D57] mr-3" />
                        <span className="text-sm font-semibold text-slate-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                  {dificuldadesIA.includes("Outra") && (
                    <div className="animation-fade-in mt-3">
                      <input type="text" value={outroDificuldadeIATexto} onChange={(e) => setOutroDificuldadeIATexto(e.target.value)} placeholder="Especifique qual outra dificuldade..." className="w-full h-14 px-5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57] text-base" required />
                    </div>
                  )}
                </div>
              </div>

              {/* BLOCO 4: DIFICULDADES ATUAIS */}
              <div className="space-y-8 bg-slate-50/50 p-6 sm:p-8 rounded-3xl border border-slate-100">
                <div>
                  <label className="block text-base font-bold text-slate-800 mb-3">19. Quando começaram as dificuldades alimentares atuais? <span className="text-red-500">*</span></label>
                  <select className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57] text-base cursor-pointer" required defaultValue="">
                    <option value="" disabled>Selecione a fase...</option>
                    <option value="Desde a introdução alimentar">Desde a introdução alimentar</option>
                    <option value="Antes de 1 ano">Antes de 1 ano</option>
                    <option value="1–2 anos">1–2 anos</option>
                    <option value="2–4 anos">2–4 anos</option>
                    <option value="4–6 anos">4–6 anos</option>
                    <option value="Após 6 anos">Após 6 anos</option>
                    <option value="Não sei">Não sei</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-base font-bold text-slate-800 mb-4">20. Houve algum evento associado ao início da dificuldade?</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {["Não", "Engasgo", "Vômito", "Dor/refluxo", "Doença", "Mudança de rotina", "Entrada na escola", "Mudança familiar", "Experiência negativa com alimento", "Outro", "Não sei"].map((evt) => (
                      <label key={evt} className="flex items-center p-3.5 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#EB6D57]/30 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57]">
                        <input type="checkbox" checked={eventosAssociados.includes(evt)} onChange={() => handleCheckboxToggle(evt, eventosAssociados, setEventosAssociados, ["Não", "Não sei"])} className="w-5 h-5 text-[#EB6D57] rounded border-slate-300 focus:ring-[#EB6D57] mr-3" />
                        <span className="text-sm font-semibold text-slate-700">{evt}</span>
                      </label>
                    ))}
                  </div>
                  {eventosAssociados.includes("Outro") && (
                    <div className="animation-fade-in mt-3">
                      <input type="text" value={outroEventoAssociadoTexto} onChange={(e) => setOutroEventoAssociadoTexto(e.target.value)} placeholder="Especifique qual outro evento..." className="w-full h-14 px-5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57] text-base" required />
                    </div>
                  )}
                </div>
              </div>

              {/* BLOCO 5: SAÚDE GASTROINTESTINAL E SINTOMAS ADVERSOS */}
              <div className="space-y-8 pt-4 border-b border-slate-100 pb-10">
                <div>
                  <label className="block text-base font-bold text-slate-800 mb-4">21. A criança apresenta ou já apresentou algum problema gastrointestinal?</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {["Refluxo", "Esofagite/gastrite", "Constipação", "Diarreia recorrente", "Dor abdominal", "Distensão abdominal", "Náuseas/vômitos", "Alergia alimentar", "Intolerância alimentar", "Disfagia", "Engasgos frequentes", "Nenhum", "Outro"].map((g) => (
                      <label key={g} className="relative flex items-center p-3.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5">
                        <input type="checkbox" checked={gastro.includes(g)} onChange={() => handleCheckboxToggle(g, gastro, setGastro, ["Nenhum"])} className="w-5 h-5 text-[#EB6D57] rounded border-slate-300 focus:ring-[#EB6D57] mr-3 shrink-0" />
                        <span className="text-sm font-semibold text-slate-700 leading-tight">{g}</span>
                      </label>
                    ))}
                  </div>
                  
                  {gastro.includes("Outro") && (
                    <div className="animation-fade-in mt-3">
                      <input type="text" value={outroGastroTexto} onChange={(e) => setOutroGastroTexto(e.target.value)} placeholder="Qual outro problema gastrointestinal?" className="w-full h-14 px-5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57] text-base" required />
                    </div>
                  )}
                  
                  {(gastro.includes("Alergia alimentar") || gastro.includes("Intolerância alimentar")) && (
                    <div className="animation-fade-in mt-3">
                      <textarea value={gastroDetalhes} onChange={(e) => setGastroDetalhes(e.target.value)} placeholder="Se marcou Alergia ou Intolerância: Qual alimento e quais sintomas?" rows={2} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57] text-base resize-none" required />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-base font-bold text-slate-800 mb-4">22. Algum alimento provoca sintomas adversos? <span className="text-red-500">*</span></label>
                  <div className="flex gap-4 h-14">
                    {["Não", "Sim"].map(opcao => (
                      <label key={opcao} className="flex-1 flex items-center justify-center gap-2 border border-slate-200 bg-white rounded-2xl cursor-pointer has-[:checked]:border-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5 has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] transition-all">
                        <input type="radio" name="sintomasAdversos" value={opcao} onChange={(e) => setSintomasAdversos(e.target.value)} className="hidden" required /> 
                        <span className="font-semibold text-slate-700">{opcao}</span>
                      </label>
                    ))}
                  </div>
                  {sintomasAdversos === "Sim" && (
                    <div className="animation-fade-in mt-4">
                      <label className="block text-sm font-bold text-slate-600 mb-2">Qual alimento e quais sintomas? <span className="text-red-500">*</span></label>
                      <textarea value={sintomasAdversosDetalhes} onChange={(e) => setSintomasAdversosDetalhes(e.target.value)} placeholder="Descreva os detalhes..." rows={2} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57] text-base resize-none" required />
                    </div>
                  )}
                </div>
              </div>

              {/* BLOCO 6: ANTROPOMETRIA, MEDICAMENTOS E EXAMES */}
              <div className="space-y-8 bg-slate-50/50 p-6 sm:p-8 rounded-3xl border border-slate-100">
                
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                    23. Dados mais recentes da criança
                  </h3>

                  <div className="space-y-6">
                    {/* Bloco Peso */}
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl">
                      <h4 className="inline-block bg-[#2563EB] text-white text-[10px] font-bold px-2.5 py-1 rounded mb-4 uppercase tracking-wider">Referente ao Peso</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-600 mb-2">Peso (kg) <span className="text-red-500">*</span></label>
                          <input type="number" step="0.01" min="0" placeholder="Ex: 14.5" className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57] text-base" required />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-600 mb-2">Data da medida <span className="text-red-500">*</span></label>
                          <input type="date" max={hoje} min={dataMinima} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57] text-base" required />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-600 mb-2">Quem mediu? <span className="text-red-500">*</span></label>
                          <select value={medidaPesoPor} onChange={(e) => setMedidaPesoPor(e.target.value)} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57] text-base cursor-pointer" required>
                            <option value="" disabled>Selecione...</option>
                            <option value="Profissional">Profissional</option>
                            <option value="Em casa">Em casa</option>
                            <option value="Estimativa">Estimativa</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Bloco Altura */}
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl">
                      <h4 className="inline-block bg-[#64748B] text-white text-[10px] font-bold px-2.5 py-1 rounded mb-4 uppercase tracking-wider">Referente à Altura</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-600 mb-2">Altura (cm) <span className="text-red-500">*</span></label>
                          <input type="number" step="0.1" min="0" placeholder="Ex: 95.0" className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57] text-base" required />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-600 mb-2">Data da medida <span className="text-red-500">*</span></label>
                          <input type="date" max={hoje} min={dataMinima} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57] text-base" required />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-600 mb-2">Quem mediu? <span className="text-red-500">*</span></label>
                          <select value={medidaAlturaPor} onChange={(e) => setMedidaAlturaPor(e.target.value)} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57] text-base cursor-pointer" required>
                            <option value="" disabled>Selecione...</option>
                            <option value="Profissional">Profissional</option>
                            <option value="Em casa">Em casa</option>
                            <option value="Estimativa">Estimativa</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200/60">
                  <label className="block text-base font-bold text-slate-800 mb-4">24. Utiliza medicamentos atualmente? <span className="text-red-500">*</span></label>
                  <div className="flex gap-4 h-14">
                    {["Não", "Sim"].map(opcao => (
                      <label key={opcao} className="flex-1 flex items-center justify-center gap-2 border border-slate-200 bg-white rounded-2xl cursor-pointer has-[:checked]:border-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5 has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] transition-all">
                        <input type="radio" name="medicamentos" value={opcao} onChange={(e) => setMedicamentos(e.target.value)} className="hidden" required /> 
                        <span className="font-semibold text-slate-700">{opcao}</span>
                      </label>
                    ))}
                  </div>
                  {medicamentos === "Sim" && (
                    <div className="animation-fade-in mt-4">
                      <label className="block text-sm font-bold text-slate-600 mb-2">Informe: Nome do medicamento + Dose + Frequência <span className="text-red-500">*</span></label>
                      <textarea value={medicamentosDetalhes} onChange={(e) => setMedicamentosDetalhes(e.target.value)} placeholder="Ex: Ritalina 10mg, 1x ao dia..." rows={2} className="w-full p-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57] text-base resize-none" required />
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-200/60">
                  <label className="block text-base font-bold text-slate-800 mb-4">25. Utiliza algum suplemento?</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {["Não", "Multivitamínico", "Vitamina D", "Ferro", "Ômega-3", "Probiótico", "Fórmula/suplemento oral", "Outro"].map((opt) => (
                      <label key={opt} className="relative flex items-center p-3.5 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#EB6D57]/30 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57]">
                        <input type="checkbox" checked={suplementos.includes(opt)} onChange={() => handleCheckboxToggle(opt, suplementos, setSuplementos, ["Não"])} className="w-5 h-5 text-[#EB6D57] rounded border-slate-300 focus:ring-[#EB6D57] mr-3 shrink-0" />
                        <span className="text-sm font-semibold text-slate-700 leading-tight">{opt}</span>
                      </label>
                    ))}
                  </div>
                  {suplementos.includes("Outro") && (
                    <div className="animation-fade-in mt-3">
                      <input type="text" value={outroSuplementoTexto} onChange={(e) => setOutroSuplementoTexto(e.target.value)} placeholder="Especifique o suplemento..." className="w-full h-14 px-5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57] text-base" required />
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-200/60">
                  <label className="block text-base font-bold text-slate-800 mb-4">26. Possui exames laboratoriais dos últimos 6 meses? <span className="text-red-500">*</span></label>
                  <div className="flex gap-4 h-14">
                    {["Não", "Sim"].map(opcao => (
                      <label key={opcao} className="flex-1 flex items-center justify-center gap-2 border border-slate-200 bg-white rounded-2xl cursor-pointer has-[:checked]:border-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5 has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] transition-all">
                        <input type="radio" name="exames" value={opcao} onChange={(e) => setExames(e.target.value)} className="hidden" required /> 
                        <span className="font-semibold text-slate-700">{opcao}</span>
                      </label>
                    ))}
                  </div>
                  
                  {exames === "Sim" && (
                    <div className="animation-fade-in mt-4 bg-white p-5 border border-dashed border-[#EB6D57]/40 rounded-2xl text-center">
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.png,.jpg,.jpeg" multiple />
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 px-6 py-3 bg-[#EB6D57]/10 text-[#EB6D57] hover:bg-[#EB6D57]/20 font-bold rounded-xl transition-colors">
                        <Paperclip className="h-5 w-5" /> Anexar Exames
                      </button>
                      <p className="text-xs text-slate-400 mt-2">Formatos aceitos: PDF, JPG, PNG.</p>
                      
                      {arquivosExames.length > 0 && (
                        <div className="mt-4 flex flex-col gap-2 text-left">
                          {arquivosExames.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <FileText className="h-5 w-5 text-slate-400 shrink-0" />
                                <span className="text-sm font-semibold text-slate-700 truncate">{file.name}</span>
                              </div>
                              <button type="button" onClick={() => removerArquivo(idx)} className="text-slate-400 hover:text-red-500 p-1 rounded-full transition-colors shrink-0">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* ================================================================ */}
          {/* ETAPA 3 - MAPA ALIMENTAR */}
          {/* ================================================================ */}
          {etapaAtual === 3 && (
            <div className="animation-fade-in text-center py-20">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Etapa 3: Mapa Alimentar 🥦</h2>
              <p className="text-slate-500">Aguardando a implementação.</p>
            </div>
          )}

          {/* Rodapé de Navegação Comum */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-100">
            <button type="button" onClick={voltarEtapa} disabled={etapaAtual === 1} className="flex items-center gap-2 px-6 py-4 font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-2xl transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft className="h-5 w-5" /> Voltar
            </button>
            <button type="submit" className="flex items-center gap-2 px-8 py-4 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-bold rounded-2xl transition-all shadow-md hover:shadow-lg hover:scale-105">
              {etapaAtual === totalEtapas ? "Finalizar" : "Próximo Passo"} <ChevronRight className="h-5 w-5" />
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}