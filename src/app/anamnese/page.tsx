"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { ChevronRight, ChevronLeft, Save, Paperclip, X, FileText, AlertCircle } from "lucide-react";

export default function AnamneseWizard() {
  const [etapaAtual, setEtapaAtual] = useState(1);
  const totalEtapas = 8;

  const titulosEtapas = [
    "Conhecendo a Criança", "Histórico de Saúde", "Mapa Alimentar", "Perfil Sensorial",
    "Rotina das Refeições", "Família e Comportamento", "Sinais de Atenção", "Rotina e Objetivos"
  ];

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
  
  const [pesoNascer, setPesoNascer] = useState("");
  const [pesoAtual, setPesoAtual] = useState("");
  const [alturaAtual, setAlturaAtual] = useState("");
  
  const [medidaPesoPor, setMedidaPesoPor] = useState("");
  const [medidaAlturaPor, setMedidaAlturaPor] = useState("");
  const [medicamentos, setMedicamentos] = useState("");
  const [medicamentosDetalhes, setMedicamentosDetalhes] = useState("");
  const [suplementos, setSuplementos] = useState<string[]>([]);
  const [outroSuplementoTexto, setOutroSuplementoTexto] = useState("");
  const [exames, setExames] = useState("");
  const [arquivosExames, setArquivosExames] = useState<File[]>([]);
  const [erroExame, setErroExame] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const medicamentosRef = useRef<HTMLDivElement>(null); 

  // ==========================================
  // ESTADOS - ETAPA 3 (MAPA ALIMENTAR)
  // ==========================================
  const [cereais, setCereais] = useState<string[]>([]);
  const [outroCerealTexto, setOutroCerealTexto] = useState("");
  const [proteinas, setProteinas] = useState<string[]>([]);
  const [outroProteinaTexto, setOutroProteinaTexto] = useState("");
  const [frutas, setFrutas] = useState<string[]>([]);
  const [outroFrutaTexto, setOutroFrutaTexto] = useState("");
  const [vegetais, setVegetais] = useState<string[]>([]);
  const [outroVegetalTexto, setOutroVegetalTexto] = useState("");
  const [leguminosas, setLeguminosas] = useState<string[]>([]);
  const [outroLeguminosaTexto, setOutroLeguminosaTexto] = useState("");

  const [qntAlimentos, setQntAlimentos] = useState("Menos de 5");
  const [alimentosContados, setAlimentosContados] = useState(0);

  // ==========================================
  // ESTADOS - ETAPA 4 (PERFIL SENSORIAL)
  // ==========================================
  const [comerFora, setComerFora] = useState("");
  const [comerForaQual, setComerForaQual] = useState("");
  const [exigeTodoDia, setExigeTodoDia] = useState("");
  const [exigeTodoDiaQual, setExigeTodoDiaQual] = useState("");
  const [sofrimentoFalta, setSofrimentoFalta] = useState("");
  const [sofrimentoFaltaQual, setSofrimentoFaltaQual] = useState("");
  const [influencias, setInfluencias] = useState<string[]>([]);
  const [outraInfluenciaTexto, setOutraInfluenciaTexto] = useState("");
  
  const [mudancasMatriz, setMudancasMatriz] = useState({
    marca: "",
    preparo: "",
    apresentacao: "",
    encostando: "",
    misturados: ""
  });

  const [comportamentoNovo, setComportamentoNovo] = useState<string[]>([]);
  const [outroComportamentoNovoTexto, setOutroComportamentoNovoTexto] = useState("");
  const [utensilios, setUtensilios] = useState<string[]>([]);
  const [independencia, setIndependencia] = useState("");
  const [dificuldadeMastigacao, setDificuldadeMastigacao] = useState<string[]>([]);
  const [erroValidacaoEtapa4, setErroValidacaoEtapa4] = useState("");

  const q38Ref = useRef<HTMLDivElement>(null);
  const q41Ref = useRef<HTMLDivElement>(null);

  // ==========================================
  // ESTADOS - ETAPA 5 (ROTINA DAS REFEIÇÕES)
  // ==========================================
  const [horarios, setHorarios] = useState({
    cafe: { horario: "", naoFaz: false },
    lancheManha: { horario: "", naoFaz: false },
    almoco: { horario: "", naoFaz: false },
    lancheTarde: { horario: "", naoFaz: false },
    jantar: { horario: "", naoFaz: false },
    ceia: { horario: "", naoFaz: false }
  });

  const [locaisRefeicao, setLocaisRefeicao] = useState<string[]>([]);
  const [outroLocalRefeicaoTexto, setOutroLocalRefeicaoTexto] = useState("");

  const [usoTelas, setUsoTelas] = useState("");
  const [reacaoSemTela, setReacaoSemTela] = useState<string[]>([]);
  const [outraReacaoSemTelaTexto, setOutraReacaoSemTelaTexto] = useState("");
  const [erroValidacaoEtapa5, setErroValidacaoEtapa5] = useState("");
  const [refeicoesIncompletas, setRefeicoesIncompletas] = useState<string[]>([]);

  const q42Ref = useRef<HTMLDivElement>(null);
  const q43Ref = useRef<HTMLDivElement>(null);
  const q44Ref = useRef<HTMLDivElement>(null);

  // ==========================================
  // FUNÇÕES DE CONTROLE
  // ==========================================

  const handleDecimalChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    let valor = e.target.value.replace(/[^0-9.,]/g, '');
    setter(valor);
  };

  useEffect(() => {
    if (medicamentos === "Sim" && medicamentosRef.current) {
      setTimeout(() => {
        medicamentosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [medicamentos]);

  useEffect(() => {
    const todosMarcados = [...cereais, ...proteinas, ...frutas, ...vegetais, ...leguminosas];
    const contagemBase = todosMarcados.filter(item => 
      !item.includes("Outros") && 
      !item.includes("Outras") && 
      !item.includes("Nenhum") &&
      !item.includes("Nenhuma")
    ).length;
    
    setAlimentosContados(contagemBase);

    if (contagemBase < 5) setQntAlimentos("Menos de 5");
    else if (contagemBase <= 10) setQntAlimentos("5–10");
    else if (contagemBase <= 20) setQntAlimentos("11–20");
    else if (contagemBase <= 30) setQntAlimentos("21–30");
    else if (contagemBase <= 50) setQntAlimentos("31–50");
    else setQntAlimentos("Mais de 50");
  }, [cereais, proteinas, frutas, vegetais, leguminosas]);

  const handleMotivoToggle = (motivo: string) => {
    if (motivos.includes(motivo)) {
      setMotivos(motivos.filter((m) => m !== motivo));
      if (motivo === "Outro") setOutroMotivoTexto(""); 
    } else {
      if (motivos.length < 3) setMotivos([...motivos, motivo]);
    }
  };

  const handleInfluenciaToggle = (fator: string) => {
    if (influencias.includes(fator)) {
      setInfluencias(influencias.filter((i) => i !== fator));
      if (fator === "Outro") setOutraInfluenciaTexto("");
    } else {
      if (influencias.length < 5) setInfluencias([...influencias, fator]);
    }
  };

  const handleMatrizChange = (categoria: keyof typeof mudancasMatriz, valor: string) => {
    setMudancasMatriz(prev => ({ ...prev, [categoria]: valor }));
  };

  const handleCheckboxToggle = (
    valor: string, 
    estadoAtual: string[], 
    setEstado: React.Dispatch<React.SetStateAction<string[]>>,
    exclusivos: string[] = ["Não", "Nenhum", "🚫 Nenhum", "🚫 Nenhuma", "Sem intercorrências", "Não sei informar", "Não sei", "Não sei avaliar"]
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

  const handleHorarioChange = (refeicao: keyof typeof horarios, valor: string) => {
    setHorarios(prev => ({
      ...prev,
      [refeicao]: { ...prev[refeicao], horario: valor }
    }));
    setRefeicoesIncompletas(prev => prev.filter(item => item !== refeicao));
    if (erroValidacaoEtapa5.includes("42")) setErroValidacaoEtapa5("");
  };

  const handleNaoFazToggle = (refeicao: keyof typeof horarios) => {
    setHorarios(prev => ({
      ...prev,
      [refeicao]: { 
        horario: !prev[refeicao].naoFaz ? "" : prev[refeicao].horario,
        naoFaz: !prev[refeicao].naoFaz 
      }
    }));
    setRefeicoesIncompletas(prev => prev.filter(item => item !== refeicao));
    if (erroValidacaoEtapa5.includes("42")) setErroValidacaoEtapa5("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErroExame("");
    if (e.target.files && e.target.files.length > 0) {
      const arquivosPermitidos: File[] = [];
      let teveErro = false;
      const limiteMB = 5 * 1024 * 1024; 

      Array.from(e.target.files).forEach(file => {
        if (file.size > limiteMB) {
          teveErro = true;
        } else {
          arquivosPermitidos.push(file);
        }
      });

      if (teveErro) {
        setErroExame("Um ou mais arquivos excedem o limite de 5MB e não foram anexados.");
      }

      setArquivosExames(prev => [...prev, ...arquivosPermitidos]);
    }
    if (e.target) e.target.value = '';
  };

  const removerArquivo = (indexToRemove: number) => {
    setArquivosExames(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações da Etapa 4
    if (etapaAtual === 4) {
      if (comportamentoNovo.length === 0) {
        setErroValidacaoEtapa4("Por favor, selecione ao menos uma reação ao novo alimento (Pergunta 38).");
        q38Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (dificuldadeMastigacao.length === 0) {
        setErroValidacaoEtapa4("Por favor, selecione ao menos uma opção sobre mastigação e deglutição (Pergunta 41).");
        q41Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      setErroValidacaoEtapa4("");
    }

    // Validações da Etapa 5
    if (etapaAtual === 5) {
      const faltantes: string[] = [];
      (Object.keys(horarios) as Array<keyof typeof horarios>).forEach((refKey) => {
        const refData = horarios[refKey];
        if (!refData.horario && !refData.naoFaz) {
          faltantes.push(refKey);
        }
      });

      if (faltantes.length > 0) {
        setRefeicoesIncompletas(faltantes);
        setErroValidacaoEtapa5("Por favor, defina o horário ou marque 'Não costuma fazer' em todas as refeições (Pergunta 42).");
        q42Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      if (locaisRefeicao.length === 0) {
        setErroValidacaoEtapa5("Por favor, selecione onde a criança geralmente realiza as refeições (Pergunta 43).");
        q43Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      if (usoTelas && usoTelas !== "Nunca" && reacaoSemTela.length === 0) {
        setErroValidacaoEtapa5("Por favor, informe o que acontece quando a tela é retirada (Pergunta 44).");
        q44Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      setErroValidacaoEtapa5("");
      setRefeicoesIncompletas([]);
    }

    if (etapaAtual < totalEtapas) setEtapaAtual(etapaAtual + 1);
    window.scrollTo(0, 0);
  };

  const voltarEtapa = () => {
    setErroValidacaoEtapa4("");
    setErroValidacaoEtapa5("");
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
          {/* ETAPA 1 - CONHECENDO A CRIANÇA */}
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
                          <input type="radio" name="sexo" value={sexo} className="sr-only" required /> 
                          <span className="font-semibold text-slate-700">{sexo}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

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
                    <input 
                      type="text" 
                      inputMode="decimal" 
                      value={pesoNascer}
                      onChange={(e) => handleDecimalChange(e, setPesoNascer)}
                      placeholder="Ex: 3,20" 
                      className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57] text-base" 
                      required 
                    />
                  </div>
                </div>
              </div>

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
                      <option value="Pedaços desde o início">Pedaços desde o início (oferecidos pelos cuidadores)</option>
                      <option value="BLW">BLW (Criança come sozinha: tiras, pedaços ou inteiros)</option>
                      <option value="Mista">Abordagem Mista (Papinhas + BLW)</option>
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
                        <input type="radio" name="sintomasAdversos" value={opcao} onChange={(e) => setSintomasAdversos(e.target.value)} className="sr-only" required /> 
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

              <div className="space-y-8 bg-slate-50/50 p-6 sm:p-8 rounded-3xl border border-slate-100">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                    23. Dados mais recentes da criança
                  </h3>

                  <div className="space-y-6">
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl">
                      <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Referente ao Peso</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-600 mb-2">Peso (kg) <span className="text-red-500">*</span></label>
                          <input 
                            type="text" 
                            inputMode="decimal"
                            value={pesoAtual}
                            onChange={(e) => handleDecimalChange(e, setPesoAtual)}
                            placeholder="Ex: 14,5" 
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57] text-base" 
                            required 
                          />
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

                    <div className="p-5 bg-white border border-slate-200 rounded-2xl">
                      <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Referente à Altura</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-slate-600 mb-2">Altura (cm) <span className="text-red-500">*</span></label>
                          <input 
                            type="text" 
                            inputMode="decimal"
                            value={alturaAtual}
                            onChange={(e) => handleDecimalChange(e, setAlturaAtual)}
                            placeholder="Ex: 95,0" 
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57] text-base" 
                            required 
                          />
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

                <div className="pt-6 border-t border-slate-200/60" ref={medicamentosRef}>
                  <label className="block text-base font-bold text-slate-800 mb-4">24. Utiliza medicamentos atualmente? <span className="text-red-500">*</span></label>
                  <div className="flex gap-4 h-14">
                    {["Não", "Sim"].map(opcao => (
                      <label key={opcao} className="flex-1 flex items-center justify-center gap-2 border border-slate-200 bg-white rounded-2xl cursor-pointer has-[:checked]:border-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5 has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] transition-all">
                        <input type="radio" name="medicamentos" value={opcao} onChange={(e) => setMedicamentos(e.target.value)} className="sr-only" required /> 
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
                        <input type="radio" name="exames" value={opcao} onChange={(e) => setExames(e.target.value)} className="sr-only" required /> 
                        <span className="font-semibold text-slate-700">{opcao}</span>
                      </label>
                    ))}
                  </div>
                  
                  {exames === "Sim" && (
                    <div className="animation-fade-in mt-4 bg-white p-5 border border-dashed border-[#EB6D57]/40 rounded-2xl text-center">
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="sr-only" accept=".pdf,.png,.jpg,.jpeg" multiple />
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 px-6 py-3 bg-[#EB6D57]/10 text-[#EB6D57] hover:bg-[#EB6D57]/20 font-bold rounded-xl transition-colors">
                        <Paperclip className="h-5 w-5" /> Anexar Exames
                      </button>
                      <p className="text-xs text-slate-500 mt-3">Formatos aceitos: PDF, JPG, PNG (Máx. 5MB por arquivo).</p>
                      
                      {erroExame && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-sm font-semibold text-left">
                          <AlertCircle className="h-5 w-5 shrink-0" />
                          {erroExame}
                        </div>
                      )}

                      {arquivosExames.length > 0 && (
                        <div className="mt-4 flex flex-col gap-2 text-left">
                          {arquivosExames.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <FileText className="h-5 w-5 text-slate-400 shrink-0" />
                                <div>
                                  <span className="text-sm font-semibold text-slate-700 truncate block">{file.name}</span>
                                  <span className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
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
            <div className="animation-fade-in space-y-10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center h-16 w-16 bg-[#4C6C54]/10 rounded-2xl mb-4">
                  <span className="text-3xl">🥦</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#4C6C54] mb-3">Mapa Alimentar</h1>
                <p className="text-slate-500 text-lg">Mapeando o repertório e a aceitação alimentar.</p>
              </div>

              {/* GRUPO 1: CEREAIS E TUBÉRCULOS */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
                <label className="block text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  🌾 27. Cereais e Tubérculos
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {["🍚 Arroz", "🍝 Macarrão", "🥖 Pão", "🧀 Pão de queijo", "🥔 Batata", "🍠 Mandioca", "🥞 Tapioca", "🌽 Cuscuz", "🌽 Milho", "🍪 Biscoitos", "➕ Outros", "🚫 Nenhum"].map((item) => (
                    <label key={item} className={`flex items-center p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5 ${item === "🚫 Nenhum" ? 'text-red-500 has-[:checked]:border-red-500 has-[:checked]:bg-red-50' : ''}`}>
                      <input type="checkbox" checked={cereais.includes(item)} onChange={() => handleCheckboxToggle(item, cereais, setCereais, ["🚫 Nenhum"])} className="w-5 h-5 text-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-3 shrink-0" />
                      <span className="text-sm font-semibold truncate">{item}</span>
                    </label>
                  ))}
                </div>
                {cereais.includes("➕ Outros") && (
                  <div className="animation-fade-in mt-4">
                    <input type="text" value={outroCerealTexto} onChange={(e) => setOutroCerealTexto(e.target.value)} placeholder="Quais? (Separe por vírgula)" className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] text-base" />
                  </div>
                )}
              </div>

              {/* GRUPO 2: PROTEÍNAS */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
                <label className="block text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  🥩 28. Proteínas
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {["🍗 Frango", "🥩 Carne bovina", "🐟 Peixe", "🥚 Ovo", "🥓 Carne suína", "🧀 Queijo", "➕ Outras", "🚫 Nenhum"].map((item) => (
                    <label key={item} className={`flex items-center p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5 ${item === "🚫 Nenhum" ? 'text-red-500 has-[:checked]:border-red-500 has-[:checked]:bg-red-50' : ''}`}>
                      <input type="checkbox" checked={proteinas.includes(item)} onChange={() => handleCheckboxToggle(item, proteinas, setProteinas, ["🚫 Nenhum"])} className="w-5 h-5 text-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-3 shrink-0" />
                      <span className="text-sm font-semibold truncate">{item}</span>
                    </label>
                  ))}
                </div>
                {proteinas.includes("➕ Outras") && (
                  <div className="animation-fade-in mt-4">
                    <input type="text" value={outroProteinaTexto} onChange={(e) => setOutroProteinaTexto(e.target.value)} placeholder="Quais? (Separe por vírgula)" className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] text-base" />
                  </div>
                )}
              </div>

              {/* GRUPO 3: FRUTAS */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
                <label className="block text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  🍎 29. Frutas
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {["🍌 Banana", "🍎 Maçã", "🍉 Melancia", "🍇 Uva", "🍓 Morango", "🥭 Manga", "🍊 Laranja", "🍐 Pera", "🥑 Abacate", "➕ Outras", "🚫 Nenhuma"].map((item) => (
                    <label key={item} className={`flex items-center p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5 ${item === "🚫 Nenhuma" ? 'text-red-500 has-[:checked]:border-red-500 has-[:checked]:bg-red-50' : ''}`}>
                      <input type="checkbox" checked={frutas.includes(item)} onChange={() => handleCheckboxToggle(item, frutas, setFrutas, ["🚫 Nenhuma"])} className="w-5 h-5 text-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-3 shrink-0" />
                      <span className="text-sm font-semibold truncate">{item}</span>
                    </label>
                  ))}
                </div>
                {frutas.includes("➕ Outras") && (
                  <div className="animation-fade-in mt-4">
                    <input type="text" value={outroFrutaTexto} onChange={(e) => setOutroFrutaTexto(e.target.value)} placeholder="Quais? (Separe por vírgula)" className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] text-base" />
                  </div>
                )}
              </div>

              {/* GRUPO 4: VEGETAIS */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
                <label className="block text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  🥦 30. Vegetais
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {["🥦 Brócolis", "🥕 Cenoura", "🍅 Tomate", "🎃 Abóbora", "🍠 Batata Doce", "🥒 Pepino", "🥬 Alface", "🧅 Cebola", "➕ Outros", "🚫 Nenhum"].map((item) => (
                    <label key={item} className={`flex items-center p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5 ${item === "🚫 Nenhum" ? 'text-red-500 has-[:checked]:border-red-500 has-[:checked]:bg-red-50' : ''}`}>
                      <input type="checkbox" checked={vegetais.includes(item)} onChange={() => handleCheckboxToggle(item, vegetais, setVegetais, ["🚫 Nenhum"])} className="w-5 h-5 text-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-3 shrink-0" />
                      <span className="text-sm font-semibold truncate">{item}</span>
                    </label>
                  ))}
                </div>
                {vegetais.includes("➕ Outros") && (
                  <div className="animation-fade-in mt-4">
                    <input type="text" value={outroVegetalTexto} onChange={(e) => setOutroVegetalTexto(e.target.value)} placeholder="Quais? (Separe por vírgula)" className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] text-base" />
                  </div>
                )}
              </div>

              {/* GRUPO 5: LEGUMINOSAS */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
                <label className="block text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  🫘 31. Leguminosas
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {["🫘 Feijão", "🍲 Lentilha", "🥙 Grão-de-bico", "🫛 Ervilha", "🫘 Soja", "➕ Outras", "🚫 Nenhuma"].map((item) => (
                    <label key={item} className={`flex items-center p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5 ${item === "🚫 Nenhuma" ? 'text-red-500 has-[:checked]:border-red-500 has-[:checked]:bg-red-50' : ''}`}>
                      <input type="checkbox" checked={leguminosas.includes(item)} onChange={() => handleCheckboxToggle(item, leguminosas, setLeguminosas, ["🚫 Nenhuma"])} className="w-5 h-5 text-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-3 shrink-0" />
                      <span className="text-sm font-semibold truncate">{item}</span>
                    </label>
                  ))}
                </div>
                {leguminosas.includes("➕ Outras") && (
                  <div className="animation-fade-in mt-4">
                    <input type="text" value={outroLeguminosaTexto} onChange={(e) => setOutroLeguminosaTexto(e.target.value)} placeholder="Quais? (Separe por vírgula)" className="w-full h-14 px-5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] text-base" />
                  </div>
                )}
              </div>

              {/* CONTAGEM TOTAL AUTOMÁTICA */}
              <div className="bg-[#4C6C54]/10 p-6 sm:p-8 rounded-3xl border border-[#4C6C54]/20 shadow-sm mt-8">
                <div className="mb-6 text-center sm:text-left">
                  <label className="block text-xl font-extrabold text-[#4C6C54] mb-2">
                    32. Confirmação do Repertório <span className="text-red-500">*</span>
                  </label>
                  <p className="text-slate-600 text-base">
                    Baseado nas suas seleções acima, mapeamos que a criança aceita <strong>pelo menos {alimentosContados} alimentos</strong> (que ela efetivamente come e engole). 
                    Se você lembrar de mais algum que não estava na lista, ajuste o volume total abaixo:
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {["Menos de 5", "5–10", "11–20", "21–30", "31–50", "Mais de 50"].map(opcao => (
                    <label key={opcao} className="flex items-center justify-center p-3 bg-white border border-slate-200 rounded-2xl cursor-pointer has-[:checked]:border-[#4C6C54] has-[:checked]:bg-[#4C6C54] has-[:checked]:text-white transition-all text-center group">
                      <input type="radio" name="qntAlimentos" value={opcao} checked={qntAlimentos === opcao} onChange={(e) => setQntAlimentos(e.target.value)} className="sr-only" required /> 
                      <span className="font-bold text-slate-700 group-has-[:checked]:text-white text-sm">{opcao}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* ETAPA 4 - PERFIL SENSORIAL */}
          {/* ================================================================ */}
          {etapaAtual === 4 && (
            <div className="animation-fade-in space-y-12">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center h-16 w-16 bg-[#EB6D57]/10 rounded-2xl mb-4">
                  <span className="text-3xl">👃</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#EB6D57] mb-3">Perfil Sensorial</h1>
                <p className="text-slate-500 text-lg">Comportamentos de apego, flexibilidade, texturas e mastigação.</p>
              </div>

              {erroValidacaoEtapa4 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold shadow-sm animation-fade-in">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{erroValidacaoEtapa4}</span>
                </div>
              )}

              {/* BLOCO 1: COMPORTAMENTO E APEGO */}
              <div className="space-y-8 bg-slate-50/50 p-6 sm:p-8 rounded-3xl border border-slate-100">
                <div>
                  <label className="block text-base font-bold text-slate-800 mb-4">
                    33. Existe algum alimento que ele(a) aceita comer apenas fora de casa? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4 h-14">
                    {["Não", "Sim"].map(opcao => (
                      <label key={opcao} className="flex-1 flex items-center justify-center gap-2 border border-slate-200 bg-white rounded-2xl cursor-pointer has-[:checked]:border-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5 has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] transition-all">
                        <input type="radio" name="comerFora" value={opcao} onChange={(e) => setComerFora(e.target.value)} className="sr-only" required />
                        <span className="font-semibold text-slate-700">{opcao}</span>
                      </label>
                    ))}
                  </div>
                  {comerFora === "Sim" && (
                    <div className="animation-fade-in mt-4">
                      <input type="text" value={comerForaQual} onChange={(e) => setComerForaQual(e.target.value)} placeholder="Quais alimentos aceita apenas fora?" className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57] text-base" required />
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-200/60">
                  <label className="block text-base font-bold text-slate-800 mb-4">
                    34. Existe algum alimento que ela exige ou precisa comer todos os dias? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4 h-14">
                    {["Não", "Sim"].map(opcao => (
                      <label key={opcao} className="flex-1 flex items-center justify-center gap-2 border border-slate-200 bg-white rounded-2xl cursor-pointer has-[:checked]:border-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5 has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] transition-all">
                        <input type="radio" name="exigeTodoDia" value={opcao} onChange={(e) => setExigeTodoDia(e.target.value)} className="sr-only" required />
                        <span className="font-semibold text-slate-700">{opcao}</span>
                      </label>
                    ))}
                  </div>
                  {exigeTodoDia === "Sim" && (
                    <div className="animation-fade-in mt-4">
                      <input type="text" value={exigeTodoDiaQual} onChange={(e) => setExigeTodoDiaQual(e.target.value)} placeholder="Quais alimentos ela exige diariamente?" className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57] text-base" required />
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-200/60">
                  <label className="block text-base font-bold text-slate-800 mb-4">
                    35. Existe algum alimento que, se não estiver disponível, gera grande sofrimento? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4 h-14">
                    {["Não", "Sim"].map(opcao => (
                      <label key={opcao} className="flex-1 flex items-center justify-center gap-2 border border-slate-200 bg-white rounded-2xl cursor-pointer has-[:checked]:border-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5 has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] transition-all">
                        <input type="radio" name="sofrimentoFalta" value={opcao} onChange={(e) => setSofrimentoFalta(e.target.value)} className="sr-only" required />
                        <span className="font-semibold text-slate-700">{opcao}</span>
                      </label>
                    ))}
                  </div>
                  {sofrimentoFalta === "Sim" && (
                    <div className="animation-fade-in mt-4">
                      <input type="text" value={sofrimentoFaltaQual} onChange={(e) => setSofrimentoFaltaQual(e.target.value)} placeholder="Quais alimentos geram esse sofrimento?" className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57] text-base" required />
                    </div>
                  )}
                </div>
              </div>

              {/* BLOCO 2: FATORES SENSORIAIS */}
              <div>
                <div className="mb-4">
                  <label className="block text-base font-bold text-slate-800 mb-1">
                    36. O que mais influencia a aceitação de um alimento? <span className="text-red-500">*</span>
                  </label>
                  <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full transition-all ${influencias.length === 5 ? 'bg-amber-100 text-amber-800 font-extrabold' : 'bg-[#EB6D57]/10 text-[#EB6D57]'}`}>
                    Escolha até 5 opções ({influencias.length}/5)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    "Textura", "Cor", "Aparência", "Cheiro", "Temperatura", 
                    "Formato", "Marca", "Embalagem", "Sabor", "Crocância", 
                    "Forma de preparo", "Alimento separado", "Familiaridade"
                  ].map((fator) => (
                    <label key={fator} className={`flex items-start p-4 rounded-2xl border cursor-pointer transition-all ${influencias.includes(fator) ? 'border-[#EB6D57] bg-[#EB6D57]/5 shadow-sm' : 'border-slate-200 hover:border-slate-300'} ${!influencias.includes(fator) && influencias.length >= 5 ? 'opacity-40 cursor-not-allowed' : ''}`}>
                      <input 
                        type="checkbox" 
                        checked={influencias.includes(fator)} 
                        onChange={() => handleInfluenciaToggle(fator)} 
                        disabled={!influencias.includes(fator) && influencias.length >= 5} 
                        className="w-5 h-5 text-[#EB6D57] accent-[#EB6D57] rounded border-slate-300 mt-0.5 mr-3 shrink-0 focus:ring-[#EB6D57]" 
                      />
                      <span className="text-sm font-medium text-slate-700 leading-tight">{fator}</span>
                    </label>
                  ))}
                  
                  <div className={`flex flex-col p-4 rounded-2xl border transition-all sm:col-span-2 md:col-span-3 ${influencias.includes("Outro") ? 'border-[#EB6D57] bg-[#EB6D57]/5 shadow-sm' : 'border-slate-200'}`}>
                    <label className={`flex items-center cursor-pointer ${!influencias.includes("Outro") && influencias.length >= 5 ? 'opacity-40' : ''}`}>
                      <input 
                        type="checkbox" 
                        checked={influencias.includes("Outro")} 
                        onChange={() => handleInfluenciaToggle("Outro")} 
                        disabled={!influencias.includes("Outro") && influencias.length >= 5} 
                        className="w-5 h-5 text-[#EB6D57] accent-[#EB6D57] rounded border-slate-300 mr-3 focus:ring-[#EB6D57]" 
                      />
                      <span className="text-sm font-bold text-slate-700">Outro fator</span>
                    </label>
                    {influencias.includes("Outro") && (
                      <input 
                        type="text" 
                        value={outraInfluenciaTexto} 
                        onChange={(e) => setOutraInfluenciaTexto(e.target.value)} 
                        placeholder="Especifique qual outro fator influencia..." 
                        className="w-full mt-3 h-12 px-4 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#EB6D57] text-sm" 
                        required 
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* BLOCO 3: MATRIZ DE FLEXIBILIDADE */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 sm:p-8 bg-slate-50 border-b border-slate-200">
                  <label className="block text-lg font-bold text-slate-800">
                    37. A criança aceita o mesmo alimento quando há pequenas mudanças? <span className="text-red-500">*</span>
                  </label>
                  <p className="text-slate-500 text-sm mt-1">Marque a reação dela para cada situação abaixo:</p>
                </div>

                <div className="divide-y divide-slate-100">
                  {[
                    { key: "marca", label: "Quando é de outra marca" },
                    { key: "preparo", label: "Com outra forma de preparo" },
                    { key: "apresentacao", label: "Com outra apresentação" },
                    { key: "encostando", label: "Com os alimentos encostando uns nos outros" },
                    { key: "misturados", label: "Com os alimentos misturados" }
                  ].map((linha) => (
                    <div key={linha.key} className="p-6 sm:px-8 sm:py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <span className="font-semibold text-slate-700 text-base">{linha.label}</span>
                      <div className="flex gap-2">
                        {["Sim", "Às vezes", "Não"].map(opcao => (
                          <label key={`${linha.key}-${opcao}`} className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:bg-[#EB6D57] has-[:checked]:text-white">
                            <input 
                              type="radio" 
                              name={`mudancasMatriz_${linha.key}`} 
                              value={opcao} 
                              onChange={() => handleMatrizChange(linha.key as keyof typeof mudancasMatriz, opcao)} 
                              className="sr-only" 
                              required 
                            />
                            <span className="font-bold text-sm whitespace-nowrap">{opcao}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BLOCO 4: REAÇÃO AO NOVO */}
              <div 
                ref={q38Ref}
                className={`p-6 sm:p-8 rounded-3xl border transition-all ${
                  erroValidacaoEtapa4 && comportamentoNovo.length === 0 
                    ? 'bg-red-50/40 border-red-300 ring-2 ring-red-200' 
                    : 'bg-slate-50/50 border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-base font-bold text-slate-800">
                    38. Quando um alimento novo aparece, o que ela costuma fazer? <span className="text-red-500">*</span>
                  </label>
                  {erroValidacaoEtapa4 && comportamentoNovo.length === 0 && (
                    <span className="text-xs font-bold text-red-500 bg-red-100 px-2.5 py-1 rounded-md">
                      Campo obrigatório
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    "Aceita normalmente", "Observa, mas não come", "Não aceita no prato", 
                    "Não aceita próximo", "Não aceita tocar", "Não aceita cheirar", 
                    "Tem ânsia/nojo", "Foge/chora"
                  ].map((acao) => (
                    <label key={acao} className="flex items-center p-3.5 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#EB6D57]/30 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5">
                      <input 
                        type="checkbox" 
                        checked={comportamentoNovo.includes(acao)} 
                        onChange={() => {
                          handleCheckboxToggle(acao, comportamentoNovo, setComportamentoNovo);
                          setErroValidacaoEtapa4("");
                        }} 
                        className="w-5 h-5 text-[#EB6D57] accent-[#EB6D57] rounded border-slate-300 focus:ring-[#EB6D57] mr-3" 
                      />
                      <span className="text-sm font-semibold text-slate-700">{acao}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-3">
                  <label className="flex items-center p-3.5 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#EB6D57]/30 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5">
                    <input 
                      type="checkbox" 
                      checked={comportamentoNovo.includes("Outro")} 
                      onChange={() => {
                        handleCheckboxToggle("Outro", comportamentoNovo, setComportamentoNovo);
                        setErroValidacaoEtapa4("");
                      }} 
                      className="w-5 h-5 text-[#EB6D57] accent-[#EB6D57] rounded border-slate-300 focus:ring-[#EB6D57] mr-3" 
                    />
                    <span className="text-sm font-semibold text-slate-700">Outro comportamento</span>
                  </label>
                  {comportamentoNovo.includes("Outro") && (
                    <div className="animation-fade-in mt-3">
                      <input 
                        type="text" 
                        value={outroComportamentoNovoTexto} 
                        onChange={(e) => setOutroComportamentoNovoTexto(e.target.value)} 
                        placeholder="Descreva o que a criança costuma fazer..." 
                        className="w-full h-14 px-5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57] text-base" 
                        required 
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* BLOCO 5: HABILIDADES, UTENSÍLIOS E MASTIGAÇÃO */}
              <div className="space-y-8 bg-slate-50/50 p-6 sm:p-8 rounded-3xl border border-slate-100">
                <div>
                  <label className="block text-base font-bold text-slate-800 mb-4">
                    39. Como ela costuma comer? (Pode marcar mais de um)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { nome: "Mãos", icone: "🖐️", especial: false },
                      { nome: "Colher", icone: "🥄", especial: false },
                      { nome: "Garfo", icone: "🍴", especial: false },
                      { nome: "Faca infantil", icone: "🔪", especial: false },
                      { nome: "Copo", icone: "🥛", especial: false },
                      { nome: "Canudo", icone: "🥤", especial: false },
                      { nome: "Só come com auxílio de responsáveis", icone: "🤲", especial: true }
                    ].map((item) => (
                      <label 
                        key={item.nome} 
                        className={`flex items-center p-3.5 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#EB6D57]/30 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5 ${
                          item.especial ? 'col-span-2 sm:col-span-3 border-dashed border-slate-300' : ''
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          checked={utensilios.includes(item.nome)} 
                          onChange={() => handleCheckboxToggle(item.nome, utensilios, setUtensilios)} 
                          className="w-5 h-5 text-[#EB6D57] accent-[#EB6D57] rounded border-slate-300 focus:ring-[#EB6D57] mr-3 shrink-0" 
                        />
                        <span className="text-sm font-semibold text-slate-700 truncate">
                          {item.icone} {item.nome}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200/60">
                  <label className="block text-base font-bold text-slate-800 mb-4">
                    40. Ele(a) se alimenta de forma... <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      "Independente", 
                      "Precisa de ajuda parcial", 
                      "Precisa de ajuda frequente", 
                      "Precisa de ajuda total"
                    ].map((opcao) => (
                      <label key={opcao} className="flex items-center p-4 rounded-2xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#EB6D57]/30 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5">
                        <input 
                          type="radio" 
                          name="independencia" 
                          value={opcao} 
                          onChange={(e) => setIndependencia(e.target.value)} 
                          className="sr-only" 
                          required 
                        />
                        <span className="text-sm font-semibold text-slate-700">{opcao}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div 
                  ref={q41Ref}
                  className={`pt-6 border-t rounded-2xl transition-all p-4 ${
                    erroValidacaoEtapa4 && dificuldadeMastigacao.length === 0 
                      ? 'bg-red-50/40 border-red-300 ring-2 ring-red-200' 
                      : 'border-slate-200/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-base font-bold text-slate-800">
                      41. Você percebe alguma dificuldade de mastigação ou para engolir?<span className="whitespace-nowrap">&nbsp;<span className="text-red-500">*</span></span>
                    </label>
                    {erroValidacaoEtapa4 && dificuldadeMastigacao.length === 0 && (
                      <span className="text-xs font-bold text-red-500 bg-red-100 px-2.5 py-1 rounded-md shrink-0">
                        Campo obrigatório
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      "Não", 
                      "Mastiga pouco", 
                      "Engole rapidamente", 
                      "Guarda comida na boca", 
                      "Tosse durante/após comer ou beber", 
                      "Engasga", 
                      "Parece ter dificuldade para engolir", 
                      "Não sei avaliar"
                    ].map((opt) => (
                      <label key={opt} className={`flex items-start p-4 rounded-2xl border bg-white shadow-sm cursor-pointer transition-all hover:border-[#EB6D57]/30 has-[:checked]:border-[#EB6D57] has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5 ${opt === "Não" || opt === "Não sei avaliar" ? 'font-bold' : ''}`}>
                        <input 
                          type="checkbox" 
                          checked={dificuldadeMastigacao.includes(opt)} 
                          onChange={() => {
                            handleCheckboxToggle(opt, dificuldadeMastigacao, setDificuldadeMastigacao, ["Não", "Não sei avaliar"]);
                            setErroValidacaoEtapa4("");
                          }} 
                          className="w-5 h-5 text-[#EB6D57] accent-[#EB6D57] rounded border-slate-300 mt-0.5 mr-3 shrink-0 focus:ring-[#EB6D57]" 
                        />
                        <span className="text-sm font-medium text-slate-700 leading-tight">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* ETAPA 5 - ROTINA DAS REFEIÇÕES */}
          {/* ================================================================ */}
          {etapaAtual === 5 && (
            <div className="animation-fade-in space-y-12">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center h-16 w-16 bg-[#4C6C54]/10 rounded-2xl mb-4">
                  <span className="text-3xl">⏰</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#4C6C54] mb-3">Rotina das Refeições</h1>
                <p className="text-slate-500 text-lg">Horários diários, ambientes de refeição e uso de telas.</p>
              </div>

              {erroValidacaoEtapa5 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold shadow-sm animation-fade-in">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{erroValidacaoEtapa5}</span>
                </div>
              )}

              {/* BLOCO 1: HORÁRIOS DA ROTINA (Q42 - OBRIGATÓRIA) */}
              <div 
                ref={q42Ref}
                className={`space-y-6 p-6 sm:p-8 rounded-3xl border transition-all ${
                  refeicoesIncompletas.length > 0 
                    ? 'bg-red-50/40 border-red-300 ring-2 ring-red-200' 
                    : 'bg-slate-50/50 border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-base font-bold text-slate-800 mb-1">
                      42. Como costuma ser a rotina alimentar? (Horários aproximados)<span className="whitespace-nowrap">&nbsp;<span className="text-red-500">*</span></span>
                    </label>
                    <p className="text-sm text-slate-500">
                      Defina o horário habitual ou marque se a criança não tem o hábito de realizá-la.
                    </p>
                  </div>
                  {refeicoesIncompletas.length > 0 && (
                    <span className="text-xs font-bold text-red-500 bg-red-100 px-2.5 py-1 rounded-md shrink-0">
                      Campo obrigatório
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: "cafe", label: "Café da manhã", icone: "☕" },
                    { key: "lancheManha", label: "Lanche da manhã", icone: "🍎" },
                    { key: "almoco", label: "Almoço", icone: "🍽️" },
                    { key: "lancheTarde", label: "Lanche da tarde", icone: "🥪" },
                    { key: "jantar", label: "Jantar", icone: "🍲" },
                    { key: "ceia", label: "Ceia", icone: "🥛" }
                  ].map((ref) => {
                    const itemKey = ref.key as keyof typeof horarios;
                    const itemData = horarios[itemKey];
                    const estaIncompleta = refeicoesIncompletas.includes(itemKey);
                    const estaConcluida = !!itemData.horario || itemData.naoFaz;

                    return (
                      <div 
                        key={ref.key} 
                        className={`p-4 rounded-2xl border transition-all ${
                          estaIncompleta
                            ? 'bg-red-50/70 border-red-300 ring-1 ring-red-300'
                            : itemData.naoFaz 
                              ? 'bg-slate-100/70 border-slate-200 opacity-70' 
                              : estaConcluida
                                ? 'bg-[#4C6C54]/5 border-[#4C6C54]/40 shadow-sm'
                                : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">{ref.icone}</span>
                          <span className="text-sm font-bold text-slate-700">{ref.label}</span>
                        </div>

                        <div className="relative mb-3">
                          <input 
                            type="time" 
                            value={itemData.horario} 
                            onChange={(e) => handleHorarioChange(itemKey, e.target.value)} 
                            disabled={itemData.naoFaz} 
                            className="w-full h-12 px-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-center" 
                          />
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-slate-100">
                          <input 
                            type="checkbox" 
                            checked={itemData.naoFaz} 
                            onChange={() => handleNaoFazToggle(itemKey)} 
                            className="w-4 h-4 text-[#4C6C54] accent-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54]" 
                          />
                          <span className="text-xs font-semibold text-slate-600">
                            Não costuma fazer
                          </span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BLOCO 2: LOCAIS DA REFEIÇÃO (Q43) */}
              <div 
                ref={q43Ref}
                className={`p-6 sm:p-8 rounded-3xl border transition-all ${
                  erroValidacaoEtapa5 && locaisRefeicao.length === 0 
                    ? 'bg-red-50/40 border-red-300 ring-2 ring-red-200' 
                    : 'bg-slate-50/50 border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-base font-bold text-slate-800">
                    43. Durante as refeições, geralmente a criança: <span className="text-red-500">*</span>
                  </label>
                  {erroValidacaoEtapa5 && locaisRefeicao.length === 0 && (
                    <span className="text-xs font-bold text-red-500 bg-red-100 px-2.5 py-1 rounded-md shrink-0">
                      Campo obrigatório
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { nome: "Come à mesa", icone: "🪑" },
                    { nome: "Come no sofá", icone: "🛋️" },
                    { nome: "Come andando", icone: "🚶" },
                    { nome: "Come no carro", icone: "🚗" }
                  ].map((local) => (
                    <label 
                      key={local.nome} 
                      className="flex items-center p-4 rounded-2xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#4C6C54]/30 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:ring-1 has-[:checked]:ring-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5"
                    >
                      <input 
                        type="checkbox" 
                        checked={locaisRefeicao.includes(local.nome)} 
                        onChange={() => {
                          handleCheckboxToggle(local.nome, locaisRefeicao, setLocaisRefeicao);
                          setErroValidacaoEtapa5("");
                        }} 
                        className="w-5 h-5 text-[#4C6C54] accent-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-3 shrink-0" 
                      />
                      <span className="text-sm font-semibold text-slate-700">
                        {local.icone} {local.nome}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="mt-3">
                  <label className="flex items-center p-4 rounded-2xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#4C6C54]/30 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:ring-1 has-[:checked]:ring-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5">
                    <input 
                      type="checkbox" 
                      checked={locaisRefeicao.includes("Outro")} 
                      onChange={() => {
                        handleCheckboxToggle("Outro", locaisRefeicao, setLocaisRefeicao);
                        setErroValidacaoEtapa5("");
                      }} 
                      className="w-5 h-5 text-[#4C6C54] accent-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-3 shrink-0" 
                    />
                    <span className="text-sm font-semibold text-slate-700">➕ Outro local</span>
                  </label>
                  {locaisRefeicao.includes("Outro") && (
                    <div className="animation-fade-in mt-3">
                      <input 
                        type="text" 
                        value={outroLocalRefeicaoTexto} 
                        onChange={(e) => setOutroLocalRefeicaoTexto(e.target.value)} 
                        placeholder="Especifique em qual outro lugar ela costuma comer..." 
                        className="w-full h-14 px-5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] text-base" 
                        required 
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* BLOCO 3: USO DE TELAS (Q44) */}
              <div 
                ref={q44Ref}
                className="space-y-8 bg-slate-50/50 p-6 sm:p-8 rounded-3xl border border-slate-100"
              >
                <div>
                  <label className="block text-base font-bold text-slate-800 mb-4">
                    44. Usa telas durante as refeições? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"].map((opcao) => (
                      <label 
                        key={opcao} 
                        className="flex items-center justify-center p-3.5 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:bg-[#4C6C54] has-[:checked]:text-white text-center group"
                      >
                        <input 
                          type="radio" 
                          name="usoTelas" 
                          value={opcao} 
                          checked={usoTelas === opcao} 
                          onChange={(e) => {
                            setUsoTelas(e.target.value);
                            setErroValidacaoEtapa5("");
                            if (e.target.value === "Nunca") {
                              setReacaoSemTela([]);
                              setOutraReacaoSemTelaTexto("");
                            }
                          }} 
                          className="sr-only" 
                          required 
                        />
                        <span className="font-bold text-slate-700 group-has-[:checked]:text-white text-sm">
                          {opcao}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Subpergunta Condicional se usa telas */}
                {usoTelas && usoTelas !== "Nunca" && (
                  <div className="animation-fade-in pt-6 border-t border-slate-200/70 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-base font-bold text-slate-800">
                        O que acontece quando a tela é retirada? <span className="text-red-500">*</span>
                      </label>
                      {erroValidacaoEtapa5 && reacaoSemTela.length === 0 && (
                        <span className="text-xs font-bold text-red-500 bg-red-100 px-2.5 py-1 rounded-md shrink-0">
                          Selecione ao menos uma opção
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        "Continua comendo normalmente",
                        "Come menos",
                        "Para de comer",
                        "Fica irritada/chora",
                        "Não aceita comer sem tela"
                      ].map((reacao) => (
                        <label 
                          key={reacao} 
                          className="flex items-center p-3.5 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#4C6C54]/30 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:ring-1 has-[:checked]:ring-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5"
                        >
                          <input 
                            type="checkbox" 
                            checked={reacaoSemTela.includes(reacao)} 
                            onChange={() => {
                              handleCheckboxToggle(reacao, reacaoSemTela, setReacaoSemTela);
                              setErroValidacaoEtapa5("");
                            }} 
                            className="w-5 h-5 text-[#4C6C54] accent-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-3 shrink-0" 
                          />
                          <span className="text-sm font-semibold text-slate-700">{reacao}</span>
                        </label>
                      ))}
                    </div>

                    <div className="mt-3">
                      <label className="flex items-center p-3.5 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#4C6C54]/30 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:ring-1 has-[:checked]:ring-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5">
                        <input 
                          type="checkbox" 
                          checked={reacaoSemTela.includes("Outro")} 
                          onChange={() => {
                            handleCheckboxToggle("Outro", reacaoSemTela, setReacaoSemTela);
                            setErroValidacaoEtapa5("");
                          }} 
                          className="w-5 h-5 text-[#4C6C54] accent-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-3 shrink-0" 
                        />
                        <span className="text-sm font-semibold text-slate-700">Outra reação</span>
                      </label>
                      {reacaoSemTela.includes("Outro") && (
                        <div className="animation-fade-in mt-3">
                          <input 
                            type="text" 
                            value={outraReacaoSemTelaTexto} 
                            onChange={(e) => setOutraReacaoSemTelaTexto(e.target.value)} 
                            placeholder="Descreva a reação ao retirar o dispositivo..." 
                            className="w-full h-14 px-5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54] text-base" 
                            required 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* PLACEHOLDER PARA ETAPAS 6 A 8 */}
          {/* ================================================================ */}
          {etapaAtual > 5 && (
            <div className="animation-fade-in text-center py-20">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Etapa {etapaAtual}: {titulosEtapas[etapaAtual - 1]}
              </h2>
              <p className="text-slate-500">Aguardando a implementação da próxima etapa.</p>
            </div>
          )}

          {/* RODAPÉ DE NAVEGAÇÃO */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-100">
            <button 
              type="button" 
              onClick={voltarEtapa} 
              disabled={etapaAtual === 1} 
              className="flex items-center gap-2 px-6 py-4 font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-2xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" /> Voltar
            </button>
            <button 
              type="submit" 
              className="flex items-center gap-2 px-8 py-4 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-bold rounded-2xl transition-all shadow-md hover:shadow-lg hover:scale-105"
            >
              {etapaAtual === totalEtapas ? "Finalizar" : "Próximo Passo"} <ChevronRight className="h-5 w-5" />
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}