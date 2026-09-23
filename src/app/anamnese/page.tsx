"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  ChevronRight, ChevronLeft, Save, Paperclip, X, FileText,
  AlertCircle, HeartHandshake, AlertTriangle, CheckCircle2,
  Calendar, Droplets, Sparkles, Activity
} from "lucide-react";
import { validarEtapa } from "./validation";

export default function AnamneseWizard() {
  const [etapaAtual, setEtapaAtual] = useState(1);
  const totalEtapas = 8;
  const [formularioConcluido, setFormularioConcluido] = useState(false);

  const titulosEtapas = [
    "Conhecendo a Criança", "Histórico de Saúde", "Mapa Alimentar", "Perfil Sensorial",
    "Rotina das Refeições", "Família e Comportamento", "Sinais de Atenção", "Rotina e Objetivos"
  ];

  const hoje = new Date().toISOString().split("T")[0];
  const dataMinima = "2000-01-01";

  // ==========================================
  // ESTADOS - ETAPA 1
  // ==========================================
  const [nomeCrianca, setNomeCrianca] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState("");
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [parentesco, setParentesco] = useState("");
  const [outroParentescoTexto, setOutroParentescoTexto] = useState("");
  const [participaAlimentacao, setParticipaAlimentacao] = useState<string[]>([]);
  const [outroParticipaTexto, setOutroParticipaTexto] = useState("");
  const [motivos, setMotivos] = useState<string[]>([]);
  const [outroMotivoTexto, setOutroMotivoTexto] = useState("");
  const [diagnosticos, setDiagnosticos] = useState<string[]>([]);
  const [outroDiagnosticoTexto, setOutroDiagnosticoTexto] = useState("");
  const [nivelTEA, setNivelTEA] = useState("");
  const [comunicacao, setComunicacao] = useState("");
  const [outroComunicacaoTexto, setOutroComunicacaoTexto] = useState("");
  const [comunicacaoGeral, setComunicacaoGeral] = useState("");

  // ==========================================
  // ESTADOS - ETAPA 2
  // ==========================================
  const [gestacao, setGestacao] = useState<string[]>([]);
  const [gestacaoIntercorrencia, setGestacaoIntercorrencia] = useState("");
  const [semanasNascimento, setSemanasNascimento] = useState("");
  const [pesoNascer, setPesoNascer] = useState("");
  const [aleitamento, setAleitamento] = useState("");
  const [aleitamentoFimMeses, setAleitamentoFimMeses] = useState("");
  const [formulaInicioMeses, setFormulaInicioMeses] = useState("");
  const [dificuldadesAmamentacao, setDificuldadesAmamentacao] = useState<string[]>([]);
  const [outroDificuldadeAmamentacaoTexto, setOutroDificuldadeAmamentacaoTexto] = useState("");
  const [idadeInicioIA, setIdadeInicioIA] = useState("");
  const [metodoIA, setMetodoIA] = useState("");
  const [outroMetodoIATexto, setOutroMetodoIATexto] = useState("");
  const [dificuldadesIA, setDificuldadesIA] = useState<string[]>([]);
  const [outroDificuldadeIATexto, setOutroDificuldadeIATexto] = useState("");
  const [inicioDificuldadesAtuais, setInicioDificuldadesAtuais] = useState("");
  const [eventosAssociados, setEventosAssociados] = useState<string[]>([]);
  const [outroEventoAssociadoTexto, setOutroEventoAssociadoTexto] = useState("");
  const [gastro, setGastro] = useState<string[]>([]);
  const [gastroDetalhes, setGastroDetalhes] = useState("");
  const [outroGastroTexto, setOutroGastroTexto] = useState("");
  const [sintomasAdversos, setSintomasAdversos] = useState("");
  const [sintomasAdversosDetalhes, setSintomasAdversosDetalhes] = useState("");

  const [pesoAtual, setPesoAtual] = useState("");
  const [dataMedidaPeso, setDataMedidaPeso] = useState("");
  const [medidaPesoPor, setMedidaPesoPor] = useState("");
  const [alturaAtual, setAlturaAtual] = useState("");
  const [dataMedidaAltura, setDataMedidaAltura] = useState("");
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

  // ==========================================
  // ESTADOS - ETAPA 5 (ROTINA DAS REFEIÇÕES)
  // ==========================================
  const [horarios, setHorarios] = useState({
    cafeDaManha: { horario: "", naoFaz: false },
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

  // ==========================================
  // ESTADOS - ETAPA 6 (FAMÍLIA E COMPORTAMENTO)
  // ==========================================
  const [acoesRecusa, setAcoesRecusa] = useState<string[]>([]);
  const [outraAcaoRecusaTexto, setOutraAcaoRecusaTexto] = useState("");

  const [freqSubstituicao, setFreqSubstituicao] = useState("");

  const [motivosSubstituicao, setMotivosSubstituicao] = useState<string[]>([]);
  const [outroMotivoSubstituicaoTexto, setOutroMotivoSubstituicaoTexto] = useState("");

  const [sentimentosPais, setSentimentosPais] = useState<string[]>([]);
  const [outroSentimentoTexto, setOutroSentimentoTexto] = useState("");
  const [erroValidacaoEtapa6, setErroValidacaoEtapa6] = useState("");

  // ==========================================
  // ESTADOS - ETAPA 7 (SINAIS DE ATENÇÃO)
  // ==========================================
  const [situacoesNutricionais, setSituacoesNutricionais] = useState<string[]>([]);
  const [outraSituacaoNutricionalTexto, setOutraSituacaoNutricionalTexto] = useState("");

  const [medosAlimentares, setMedosAlimentares] = useState<string[]>([]);
  const [outroMedoAlimentarTexto, setOutroMedoAlimentarTexto] = useState("");

  const [comportamentosAtipicos, setComportamentosAtipicos] = useState<string[]>([]);
  const [outroComportamentoAtipicoTexto, setOutroComportamentoAtipicoTexto] = useState("");

  const [erroValidacaoEtapa7, setErroValidacaoEtapa7] = useState("");

  // ==========================================
  // ESTADOS - ETAPA 8 (ROTINA E OBJETIVOS)
  // ==========================================
  const [aguaQuantidade, setAguaQuantidade] = useState("");
  const [tamanhoCopoMl, setTamanhoCopoMl] = useState("");

  const [freqIntestino, setFreqIntestino] = useState("");
  const [tipoBristol, setTipoBristol] = useState("");
  const [sintomasIntestino, setSintomasIntestino] = useState<string[]>([]);
  const [outroSintomaIntestinoTexto, setOutroSintomaIntestinoTexto] = useState("");

  const [interessesFavoritos, setInteressesFavoritos] = useState("");
  const [motivacaoCrianca, setMotivacaoCrianca] = useState("");
  const [informacoesAdicionais, setInformacoesAdicionais] = useState("");

  const [erroValidacaoEtapa8, setErroValidacaoEtapa8] = useState("");

  // ==========================================
  // ESTADOS DE VALIDAÇÃO E REFS
  // ==========================================
  const [errosValidacao, setErrosValidacao] = useState<Record<string, boolean>>({});
  const [mensagemToast, setMensagemToast] = useState("");

  // Refs de todas as perguntas para scroll automático
  const q1Ref = useRef<HTMLDivElement>(null);
  const q2Ref = useRef<HTMLDivElement>(null);
  const q3Ref = useRef<HTMLDivElement>(null);
  const q4Ref = useRef<HTMLDivElement>(null);
  const q5Ref = useRef<HTMLDivElement>(null);
  const q6Ref = useRef<HTMLDivElement>(null);
  const q7Ref = useRef<HTMLDivElement>(null);
  const q8Ref = useRef<HTMLDivElement>(null);
  const q9Ref = useRef<HTMLDivElement>(null);
  const q10Ref = useRef<HTMLDivElement>(null);

  const q11Ref = useRef<HTMLDivElement>(null);
  const q12Ref = useRef<HTMLDivElement>(null);
  const q13Ref = useRef<HTMLDivElement>(null);
  const q14Ref = useRef<HTMLDivElement>(null);
  const q15Ref = useRef<HTMLDivElement>(null);
  const q16Ref = useRef<HTMLDivElement>(null);
  const q17Ref = useRef<HTMLDivElement>(null);
  const q18Ref = useRef<HTMLDivElement>(null);
  const q19Ref = useRef<HTMLDivElement>(null);
  const q20Ref = useRef<HTMLDivElement>(null);
  const q21Ref = useRef<HTMLDivElement>(null);
  const q22Ref = useRef<HTMLDivElement>(null);
  const q23Ref = useRef<HTMLDivElement>(null);
  const q24Ref = useRef<HTMLDivElement>(null);
  const q25Ref = useRef<HTMLDivElement>(null);
  const q26Ref = useRef<HTMLDivElement>(null);

  const q27Ref = useRef<HTMLDivElement>(null);
  const q28Ref = useRef<HTMLDivElement>(null);
  const q29Ref = useRef<HTMLDivElement>(null);
  const q30Ref = useRef<HTMLDivElement>(null);
  const q31Ref = useRef<HTMLDivElement>(null);
  const q32Ref = useRef<HTMLDivElement>(null);

  const q33Ref = useRef<HTMLDivElement>(null);
  const q34Ref = useRef<HTMLDivElement>(null);
  const q35Ref = useRef<HTMLDivElement>(null);
  const q36Ref = useRef<HTMLDivElement>(null);
  const q37Ref = useRef<HTMLDivElement>(null);
  const q38Ref = useRef<HTMLDivElement>(null);
  const q39Ref = useRef<HTMLDivElement>(null);
  const q40Ref = useRef<HTMLDivElement>(null);
  const q41Ref = useRef<HTMLDivElement>(null);

  const q42Ref = useRef<HTMLDivElement>(null);
  const q43Ref = useRef<HTMLDivElement>(null);
  const q44Ref = useRef<HTMLDivElement>(null);

  const q45Ref = useRef<HTMLDivElement>(null);
  const q46Ref = useRef<HTMLDivElement>(null);
  const q47Ref = useRef<HTMLDivElement>(null);
  const q48Ref = useRef<HTMLDivElement>(null);

  const q49Ref = useRef<HTMLDivElement>(null);
  const q50Ref = useRef<HTMLDivElement>(null);
  const q51Ref = useRef<HTMLDivElement>(null);

  const q52Ref = useRef<HTMLDivElement>(null);
  const q53Ref = useRef<HTMLDivElement>(null);
  const q54Ref = useRef<HTMLDivElement>(null);
  const q55Ref = useRef<HTMLDivElement>(null);
  const q56Ref = useRef<HTMLDivElement>(null);

  const limparErro = (id: string) => {
    setErrosValidacao(prev => {
      if (!prev[id] && !prev[`${id}_outro`] && !prev[`${id}_data_peso`] && !prev[`${id}_data_altura`] && !prev[`${id}_arquivo`]) {
        return prev;
      }
      const copy = { ...prev };
      delete copy[id];
      delete copy[`${id}_outro`];
      delete copy[`${id}_data_peso`];
      delete copy[`${id}_data_altura`];
      delete copy[`${id}_arquivo`];
      return copy;
    });
    setMensagemToast("");
  };

  // ==========================================
  // FUNÇÕES DE CONTROLE
  // ==========================================

  const handleDecimalChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const valor = e.target.value.replace(/[^0-9.,]/g, '');
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
    exclusivos: string[] = ["Não", "Nenhum", "Nenhuma", "Não se aplica", "🚫 Nenhum", "🚫 Nenhuma", "Sem intercorrências", "Não sei informar", "Não sei", "Não sei avaliar"]
  ) => {
    if (exclusivos.includes(valor)) {
      if (estadoAtual.includes(valor)) {
        setEstado([]);
      } else {
        setEstado([valor]);
      }
      return;
    }
    const novoEstado = estadoAtual.filter(item => !exclusivos.includes(item));
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
    limparErro('q42');
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
    limparErro('q42');
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
      limparErro('q26');
    }
    if (e.target) e.target.value = '';
  };

  const removerArquivo = (indexToRemove: number) => {
    setArquivosExames(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const etapasPerguntasRefs: Record<number, Array<{ id: string; ref: React.RefObject<HTMLDivElement | null> }>> = {
    1: [
      { id: 'q1', ref: q1Ref },
      { id: 'q2', ref: q2Ref },
      { id: 'q3', ref: q3Ref },
      { id: 'q4', ref: q4Ref },
      { id: 'q5', ref: q5Ref },
      { id: 'q6', ref: q6Ref },
      { id: 'q7', ref: q7Ref },
      { id: 'q8', ref: q8Ref },
      { id: 'q9', ref: q9Ref },
      { id: 'q10', ref: q10Ref }
    ],
    2: [
      { id: 'q11', ref: q11Ref },
      { id: 'q12', ref: q12Ref },
      { id: 'q13', ref: q13Ref },
      { id: 'q14', ref: q14Ref },
      { id: 'q15', ref: q15Ref },
      { id: 'q16', ref: q16Ref },
      { id: 'q17', ref: q17Ref },
      { id: 'q18', ref: q18Ref },
      { id: 'q19', ref: q19Ref },
      { id: 'q20', ref: q20Ref },
      { id: 'q21', ref: q21Ref },
      { id: 'q22', ref: q22Ref },
      { id: 'q23', ref: q23Ref },
      { id: 'q24', ref: q24Ref },
      { id: 'q25', ref: q25Ref },
      { id: 'q26', ref: q26Ref }
    ],
    3: [
      { id: 'q27', ref: q27Ref },
      { id: 'q28', ref: q28Ref },
      { id: 'q29', ref: q29Ref },
      { id: 'q30', ref: q30Ref },
      { id: 'q31', ref: q31Ref },
      { id: 'q32', ref: q32Ref }
    ],
    4: [
      { id: 'q33', ref: q33Ref },
      { id: 'q34', ref: q34Ref },
      { id: 'q35', ref: q35Ref },
      { id: 'q36', ref: q36Ref },
      { id: 'q37', ref: q37Ref },
      { id: 'q38', ref: q38Ref },
      { id: 'q39', ref: q39Ref },
      { id: 'q40', ref: q40Ref },
      { id: 'q41', ref: q41Ref }
    ],
    5: [
      { id: 'q42', ref: q42Ref },
      { id: 'q43', ref: q43Ref },
      { id: 'q44', ref: q44Ref }
    ],
    6: [
      { id: 'q45', ref: q45Ref },
      { id: 'q46', ref: q46Ref },
      { id: 'q47', ref: q47Ref },
      { id: 'q48', ref: q48Ref }
    ],
    7: [
      { id: 'q49', ref: q49Ref },
      { id: 'q50', ref: q50Ref },
      { id: 'q51', ref: q51Ref }
    ],
    8: [
      { id: 'q52', ref: q52Ref },
      { id: 'q53', ref: q53Ref },
      { id: 'q54', ref: q54Ref },
      { id: 'q55', ref: q55Ref }
    ]
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validarEtapa(etapaAtual, {
      nomeCrianca,
      dataNascimento,
      sexo,
      nomeResponsavel,
      parentesco,
      outroParentescoTexto,
      participaAlimentacao,
      outroParticipaTexto,
      motivos,
      outroMotivoTexto,
      diagnosticos,
      nivelTEA,
      outroDiagnosticoTexto,
      comunicacao,
      outroComunicacaoTexto,
      comunicacaoGeral,
      gestacao,
      gestacaoIntercorrencia,
      semanasNascimento,
      pesoNascer,
      aleitamento,
      aleitamentoFimMeses,
      formulaInicioMeses,
      dificuldadesAmamentacao,
      outroDificuldadeAmamentacaoTexto,
      idadeInicioIA,
      metodoIA,
      outroMetodoIATexto,
      dificuldadesIA,
      outroDificuldadeIATexto,
      inicioDificuldadesAtuais,
      eventosAssociados,
      outroEventoAssociadoTexto,
      gastro,
      gastroDetalhes,
      outroGastroTexto,
      sintomasAdversos,
      sintomasAdversosDetalhes,
      pesoAtual,
      dataMedidaPeso,
      medidaPesoPor,
      alturaAtual,
      dataMedidaAltura,
      medidaAlturaPor,
      medicamentos,
      medicamentosDetalhes,
      suplementos,
      outroSuplementoTexto,
      exames,
      arquivosExamesCount: arquivosExames.length,
      cereais,
      outroCerealTexto,
      proteinas,
      outroProteinaTexto,
      frutas,
      outroFrutaTexto,
      vegetais,
      outroVegetalTexto,
      leguminosas,
      outroLeguminosaTexto,
      qntAlimentos,
      comerFora,
      comerForaQual,
      exigeTodoDia,
      exigeTodoDiaQual,
      sofrimentoFalta,
      sofrimentoFaltaQual,
      influencias,
      outraInfluenciaTexto,
      mudancasMatriz,
      comportamentoNovo,
      outroComportamentoNovoTexto,
      utensilios,
      independencia,
      dificuldadeMastigacao,
      horarios,
      locaisRefeicao,
      outroLocalRefeicaoTexto,
      usoTelas,
      reacaoSemTela,
      outraReacaoSemTelaTexto,
      acoesRecusa,
      outraAcaoRecusaTexto,
      freqSubstituicao,
      motivosSubstituicao,
      outroMotivoSubstituicaoTexto,
      sentimentosPais,
      outroSentimentoTexto,
      situacoesNutricionais,
      outraSituacaoNutricionalTexto,
      medosAlimentares,
      outroMedoAlimentarTexto,
      comportamentosAtipicos,
      outroComportamentoAtipicoTexto,
      aguaQuantidade,
      freqIntestino,
      tipoBristol,
      sintomasIntestino,
      outroSintomaIntestinoTexto,
      interessesFavoritos,
      motivacaoCrianca,
      informacoesAdicionais,
    });

    if (!validation.isValid) {
      setErrosValidacao(validation.erros);
      setMensagemToast(validation.mensagemToast || "Por favor, responda a todos os campos obrigatórios assinalados com * para prosseguir.");

      if (validation.refeicoesIncompletas) {
        setRefeicoesIncompletas(validation.refeicoesIncompletas);
      }
      if (etapaAtual === 4 && validation.mensagemEtapa) setErroValidacaoEtapa4(validation.mensagemEtapa);
      if (etapaAtual === 5 && validation.mensagemEtapa) setErroValidacaoEtapa5(validation.mensagemEtapa);
      if (etapaAtual === 6 && validation.mensagemEtapa) setErroValidacaoEtapa6(validation.mensagemEtapa);
      if (etapaAtual === 7 && validation.mensagemEtapa) setErroValidacaoEtapa7(validation.mensagemEtapa);
      if (etapaAtual === 8 && validation.mensagemEtapa) setErroValidacaoEtapa8(validation.mensagemEtapa);

      // Scroll suave automático para a PRIMEIRA pergunta inválida da etapa
      const lista = etapasPerguntasRefs[etapaAtual] || [];
      const primeiro = lista.find(item => validation.erros[item.id]);
      if (primeiro && primeiro.ref.current) {
        primeiro.ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // LIMPEZA E AVANÇO
    setErrosValidacao({});
    setMensagemToast("");
    setErroValidacaoEtapa4("");
    setErroValidacaoEtapa5("");
    setErroValidacaoEtapa6("");
    setErroValidacaoEtapa7("");
    setErroValidacaoEtapa8("");

    if (etapaAtual === 8) {
      setFormularioConcluido(true);
      window.scrollTo(0, 0);
      return;
    }

    if (etapaAtual < totalEtapas) setEtapaAtual(etapaAtual + 1);
    window.scrollTo(0, 0);
  };

  const voltarEtapa = () => {
    setErrosValidacao({});
    setMensagemToast("");
    setErroValidacaoEtapa4("");
    setErroValidacaoEtapa5("");
    setErroValidacaoEtapa6("");
    setErroValidacaoEtapa7("");
    setErroValidacaoEtapa8("");
    if (etapaAtual > 1) setEtapaAtual(etapaAtual - 1);
    window.scrollTo(0, 0);
  };


    if (formularioConcluido) {
    return (
      <div className="min-h-screen bg-[#F0EAE1] font-sans text-slate-800 pb-20">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-center">
            <div className="relative h-9 w-32 sm:h-11 sm:w-40">
              <Image src="/logo-transparente.png" alt="Nutrindo em Casa" fill className="object-contain" priority />
            </div>
          </div>
        </header>

        <main className="max-w-xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8">
          <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 text-center space-y-5 animation-fade-in">
            <div className="inline-flex items-center justify-center h-16 w-16 bg-[#4C6C54]/10 rounded-full text-[#4C6C54] shadow-inner">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <div className="space-y-2">
              <span className="inline-block bg-[#4C6C54]/10 text-[#4C6C54] font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                100% Concluído
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800">
                Anamnese Entregue com Sucesso!
              </h1>
            </div>

            <div className="bg-[#4C6C54]/5 border border-[#4C6C54]/20 p-4 sm:p-5 rounded-2xl text-left space-y-3">
              <p className="text-slate-700 text-xs sm:text-sm leading-relaxed font-medium">
                &ldquo;Obrigada por compartilhar essas informações comigo. 💚 Agora consigo conhecer melhor sua criança e entender quais pontos merecem mais atenção durante o acompanhamento.&rdquo;
              </p>
              <div className="flex items-center gap-2.5 pt-1.5">
                <div className="w-8 h-8 rounded-full bg-[#4C6C54] text-white flex items-center justify-center font-bold text-xs shadow">
                  DL
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-800">Dra. Laís Leles</h4>
                  <p className="text-[11px] text-slate-500 font-semibold">Nutricionista Clínica Pediátrica</p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-center gap-1.5 text-[#EB6D57] font-bold text-xs sm:text-sm">
                <Calendar className="h-4 w-4" />
                <span>Próximo Passo: Agendamento da Devolutiva</span>
              </div>
              <p className="text-xs text-slate-600">
                Selecione o melhor dia e horário para a nossa videochamada de apresentação do cronograma e alinhamento das estratégias alimentares.
              </p>
              <button
                type="button"
                onClick={() => alert("Módulo de agendamento integrado (Calendly/Google Agenda).")}
                className="w-full py-2.5 px-5 bg-[#EB6D57] hover:bg-[#d95a44] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar className="h-4 w-4" /> Agendar Videochamada Devolutiva
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Uma cópia das suas respostas foi arquivada em seu prontuário clínico seguro.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0EAE1] font-sans text-slate-800 pb-20">

      {/* HEADER FIXO */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2 relative">
            <div className="w-10 sm:w-28"></div>
            <div className="relative h-9 w-32 sm:h-11 sm:w-40">
              <Image src="/logo-transparente.png" alt="Nutrindo em Casa" fill className="object-contain" priority />
            </div>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-400 w-10 sm:w-28 justify-end">
              <Save className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Salvo</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs sm:text-sm font-bold">
              <span className="text-[#4C6C54]">Etapa {etapaAtual} de {totalEtapas}</span>
              <span className="text-slate-400">{titulosEtapas[etapaAtual - 1]}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-[#4C6C54] rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${(etapaAtual / totalEtapas) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 mt-4 sm:mt-6">
        <form onSubmit={handleSubmit} noValidate className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 space-y-6 sm:space-y-8">

          {/* ================================================================ */}
          {/* ETAPA 1 - CONHECENDO A CRIANÇA */}
          {/* ================================================================ */}
                    {/* ================================================================ */}
          {/* ETAPA 1 - CONHECENDO A CRIANÇA */}
          {/* ================================================================ */}
          {etapaAtual === 1 && (
            <div className="animation-fade-in space-y-6 sm:space-y-8">
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center h-12 w-12 bg-[#4C6C54]/10 rounded-xl mb-2.5">
                  <span className="text-2xl">👧</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#4C6C54] mb-1.5">Conhecendo a criança</h1>
                <p className="text-xs text-slate-400 font-medium">Perfil e motivo da procura.</p>
              </div>

              <div className="space-y-4 bg-slate-50/50 p-4 sm:p-6 rounded-2xl border border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Q1: Nome da criança */}
                  <div
                    ref={q1Ref}
                    className={`md:col-span-2 p-3 sm:p-4 rounded-xl border transition-all ${
                      errosValidacao['q1'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                    }`}
                  >
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      1. Nome da criança <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nomeCrianca}
                      onChange={(e) => {
                        setNomeCrianca(e.target.value);
                        limparErro('q1');
                      }}
                      className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                        errosValidacao['q1']
                          ? 'border-red-400 ring-2 ring-red-100'
                          : 'border-slate-200 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54]'
                      }`}
                      placeholder="Digite o nome"
                      required
                    />
                  </div>

                  {/* Q2: Data de nascimento */}
                  <div
                    ref={q2Ref}
                    className={`p-3 sm:p-4 rounded-xl border transition-all ${
                      errosValidacao['q2'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                    }`}
                  >
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      2. Data de nascimento <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={dataNascimento}
                      onChange={(e) => {
                        setDataNascimento(e.target.value);
                        limparErro('q2');
                      }}
                      min={dataMinima}
                      max={hoje}
                      className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                        errosValidacao['q2']
                          ? 'border-red-400 ring-2 ring-red-100'
                          : 'border-slate-200 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54]'
                      }`}
                      required
                    />
                  </div>

                  {/* Q3: Sexo */}
                  <div
                    ref={q3Ref}
                    className={`p-3 sm:p-4 rounded-xl border transition-all ${
                      errosValidacao['q3'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                    }`}
                  >
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      3. Sexo <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2.5 h-10">
                      {["Masculino", "Feminino"].map((s) => (
                        <label
                          key={s}
                          className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 bg-white rounded-xl cursor-pointer has-[:checked]:border-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5 has-[:checked]:ring-1 has-[:checked]:ring-[#4C6C54] transition-all text-xs sm:text-sm"
                        >
                          <input
                            type="radio"
                            name="sexo"
                            value={s}
                            checked={sexo === s}
                            onChange={() => {
                              setSexo(s);
                              limparErro('q3');
                            }}
                            className="sr-only"
                            required
                          />
                          <span className="font-semibold text-slate-700">{s}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* Q4: Nome do responsável */}
                <div
                  ref={q4Ref}
                  className={`p-3 sm:p-4 rounded-2xl border transition-all ${
                    errosValidacao['q4'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                  }`}
                >
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    4. Nome completo do responsável <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nomeResponsavel}
                    onChange={(e) => {
                      setNomeResponsavel(e.target.value);
                      limparErro('q4');
                    }}
                    className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                      errosValidacao['q4']
                        ? 'border-red-400 ring-2 ring-red-100'
                        : 'border-slate-200 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54]'
                    }`}
                    placeholder="Digite seu nome"
                    required
                  />
                </div>

                {/* Q5: Grau de parentesco */}
                <div
                  ref={q5Ref}
                  className={`p-3 sm:p-4 rounded-2xl border transition-all ${
                    errosValidacao['q5'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                  }`}
                >
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    5. Grau de parentesco <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={parentesco}
                    onChange={(e) => {
                      setParentesco(e.target.value);
                      limparErro('q5');
                    }}
                    className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold cursor-pointer transition-all ${
                      errosValidacao['q5'] && !parentesco
                        ? 'border-red-400 ring-2 ring-red-100'
                        : 'border-slate-200 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54]'
                    }`}
                    required
                  >
                    <option value="" disabled>Selecione...</option>
                    <option value="Mãe">Mãe</option>
                    <option value="Pai">Pai</option>
                    <option value="Avó/avô">Avó/avô</option>
                    <option value="Responsável legal">Responsável legal</option>
                    <option value="Outro">Outro</option>
                  </select>
                  {parentesco === "Outro" && (
                    <div className="animation-fade-in mt-3">
                      <input
                        type="text"
                        value={outroParentescoTexto}
                        onChange={(e) => {
                          setOutroParentescoTexto(e.target.value);
                          limparErro('q5');
                          limparErro('q5_outro');
                        }}
                        placeholder="Especifique o grau de parentesco..."
                        className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                          errosValidacao['q5_outro']
                            ? 'border-red-400 ring-2 ring-red-100'
                            : 'border-slate-200 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54]'
                        }`}
                        required
                      />
                    </div>
                  )}
                </div>

                {/* Q6: Quem participa da alimentação */}
                <div
                  ref={q6Ref}
                  className={`p-3 sm:p-4 rounded-2xl border transition-all ${
                    errosValidacao['q6'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                  }`}
                >
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    6. Quem participa da alimentação da criança?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {["Mãe", "Pai", "Ambos", "Avó/avô", "Babá/cuidador", "Escola", "Outro"].map((opt) => (
                      <label key={opt} className="flex items-center p-2.5 sm:p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5">
                        <input
                          type="checkbox"
                          checked={participaAlimentacao.includes(opt)}
                          onChange={() => {
                            handleCheckboxToggle(opt, participaAlimentacao, setParticipaAlimentacao);
                            limparErro('q6');
                          }}
                          className="w-4 h-4 text-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-2.5 shrink-0"
                        />
                        <span className="text-xs font-semibold text-slate-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                  {participaAlimentacao.includes("Outro") && (
                    <div className="animation-fade-in mt-3">
                      <input
                        type="text"
                        value={outroParticipaTexto}
                        onChange={(e) => {
                          setOutroParticipaTexto(e.target.value);
                          limparErro('q6');
                          limparErro('q6_outro');
                        }}
                        placeholder="Quem mais participa da alimentação?"
                        className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                          errosValidacao['q6_outro']
                            ? 'border-red-400 ring-2 ring-red-100'
                            : 'border-slate-200 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54]'
                        }`}
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Q7: Motivo principal da procura */}
              <div
                ref={q7Ref}
                className={`p-4 sm:p-6 rounded-2xl border transition-all ${
                  errosValidacao['q7'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                }`}
              >
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    7. Qual o principal motivo da procura? <span className="text-red-500">*</span>
                  </label>
                  <span className="inline-block bg-[#EB6D57]/10 text-[#EB6D57] text-xs font-bold px-3 py-1 rounded-full">
                    Escolha até 3 opções ({motivos.length}/3)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    "Come poucos alimentos", "Recusa alimentos novos", "Recusa frutas", "Recusa verduras/legumes",
                    "Recusa carnes/proteínas", "Dificuldade com texturas", "Dificuldade com cheiro/aparência",
                    "Aceita poucas marcas/apresentações", "Não aceita alimentos misturados", "Refeições muito demoradas",
                    "Chora/irritada nas refeições", "Engasga, tem ânsia ou vomita", "Dificuldade de mastigar/engolir",
                    "Baixo peso", "Excesso de peso", "Introdução alimentar", "Melhorar qualidade da alimentação"
                  ].map((motivo) => (
                    <label
                      key={motivo}
                      className={`flex items-start p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-all ${
                        motivos.includes(motivo)
                          ? 'border-[#4C6C54] bg-[#4C6C54]/5 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      } ${!motivos.includes(motivo) && motivos.length >= 3 ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={motivos.includes(motivo)}
                        onChange={() => {
                          handleMotivoToggle(motivo);
                          limparErro('q7');
                        }}
                        disabled={!motivos.includes(motivo) && motivos.length >= 3}
                        className="w-4 h-4 text-[#4C6C54] rounded border-slate-300 mt-0.5 mr-2.5 shrink-0 focus:ring-[#4C6C54]"
                      />
                      <span className="text-xs font-semibold text-slate-700 leading-tight">{motivo}</span>
                    </label>
                  ))}
                  <div
                    className={`flex flex-col p-2.5 sm:p-3 rounded-xl border transition-all sm:col-span-2 ${
                      motivos.includes("Outro") ? 'border-[#4C6C54] bg-[#4C6C54]/5 shadow-sm' : 'border-slate-200'
                    }`}
                  >
                    <label className={`flex items-center cursor-pointer ${!motivos.includes("Outro") && motivos.length >= 3 ? 'opacity-40' : ''}`}>
                      <input
                        type="checkbox"
                        checked={motivos.includes("Outro")}
                        onChange={() => {
                          handleMotivoToggle("Outro");
                          limparErro('q7');
                        }}
                        disabled={!motivos.includes("Outro") && motivos.length >= 3}
                        className="w-4 h-4 text-[#4C6C54] rounded border-slate-300 mr-2.5 shrink-0 focus:ring-[#4C6C54]"
                      />
                      <span className="text-sm font-bold text-slate-700">Outro motivo</span>
                    </label>
                    {motivos.includes("Outro") && (
                      <input
                        type="text"
                        value={outroMotivoTexto}
                        onChange={(e) => {
                          setOutroMotivoTexto(e.target.value);
                          limparErro('q7');
                          limparErro('q7_outro');
                        }}
                        placeholder="Por favor, especifique o motivo..."
                        className={`w-full mt-2 h-10 px-3.5 bg-white border rounded-xl focus:outline-none text-xs sm:text-sm font-semibold transition-all ${
                          errosValidacao['q7_outro']
                            ? 'border-red-400 ring-2 ring-red-100'
                            : 'border-slate-300 focus:border-[#4C6C54]'
                        }`}
                        required
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Q8: Diagnósticos associados */}
              <div
                ref={q8Ref}
                className={`p-6 sm:p-8 rounded-3xl space-y-6 transition-all border ${
                  errosValidacao['q8'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'bg-[#4C6C54]/5 border-[#4C6C54]/20'
                }`}
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    8. A criança possui algum diagnóstico?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      "Não", "TEA", "TDAH/TDA", "TOD", "Atraso do desenvolvimento",
                      "Deficiência intelectual", "Síndrome genética", "Paralisia cerebral",
                      "Transtorno de linguagem", "Outro"
                    ].map((diag) => (
                      <label key={diag} className="flex items-center p-2.5 sm:p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#4C6C54]/30 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:ring-1 has-[:checked]:ring-[#4C6C54]">
                        <input
                          type="checkbox"
                          checked={diagnosticos.includes(diag)}
                          onChange={() => {
                            handleCheckboxToggle(diag, diagnosticos, setDiagnosticos, ["Não"]);
                            limparErro('q8');
                          }}
                          className="w-4 h-4 text-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-2.5 shrink-0"
                        />
                        <span className="text-xs font-semibold text-slate-700">{diag}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {diagnosticos.includes("TEA") && (
                  <div className="animation-fade-in pt-4 border-t border-[#4C6C54]/20">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Se TEA → Qual o nível de suporte? <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={nivelTEA}
                      onChange={(e) => {
                        setNivelTEA(e.target.value);
                        limparErro('q8');
                        limparErro('q8_tea');
                      }}
                      className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold cursor-pointer transition-all ${
                        errosValidacao['q8_tea']
                          ? 'border-red-400 ring-2 ring-red-100'
                          : 'border-[#4C6C54]/30 focus:ring-[#4C6C54]'
                      }`}
                      required
                    >
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
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      Qual outro diagnóstico? <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={outroDiagnosticoTexto}
                      onChange={(e) => {
                        setOutroDiagnosticoTexto(e.target.value);
                        limparErro('q8');
                        limparErro('q8_outro');
                      }}
                      placeholder="Especifique o diagnóstico..."
                      className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                        errosValidacao['q8_outro']
                          ? 'border-red-400 ring-2 ring-red-100'
                          : 'border-[#4C6C54]/30 focus:ring-[#4C6C54]'
                      }`}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="space-y-8 border-t border-slate-100 pt-10">
                {/* Q9: Como a criança se comunica */}
                <div
                  ref={q9Ref}
                  className={`p-4 sm:p-6 rounded-2xl border transition-all ${
                    errosValidacao['q9'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                  }`}
                >
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    9. Como a criança se comunica? <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={comunicacao}
                    onChange={(e) => {
                      setComunicacao(e.target.value);
                      limparErro('q9');
                    }}
                    className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold cursor-pointer transition-all ${
                      errosValidacao['q9'] && !comunicacao
                        ? 'border-red-400 ring-2 ring-red-100'
                        : 'border-slate-200 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54]'
                    }`}
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
                  {comunicacao === "Outro" && (
                    <div className="animation-fade-in mt-4">
                      <input
                        type="text"
                        value={outroComunicacaoTexto}
                        onChange={(e) => {
                          setOutroComunicacaoTexto(e.target.value);
                          limparErro('q9');
                          limparErro('q9_outro');
                        }}
                        placeholder="Descreva como a criança se comunica..."
                        className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                          errosValidacao['q9_outro']
                            ? 'border-red-400 ring-2 ring-red-100'
                            : 'border-slate-200 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54]'
                        }`}
                        required
                      />
                    </div>
                  )}
                </div>

                {/* Q10: Como ela se comunica no dia a dia */}
                <div
                  ref={q10Ref}
                  className={`p-4 sm:p-6 rounded-2xl border transition-all ${
                    errosValidacao['q10'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                  }`}
                >
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    10. A criança consegue se comunicar de forma geral? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col gap-3">
                    {["Sim, na maioria das situações", "Às vezes", "Tem muita dificuldade", "Não consigo avaliar"].map((opcao) => (
                      <label key={opcao} className="flex items-center p-2.5 sm:p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5 has-[:checked]:shadow-sm">
                        <input
                          type="radio"
                          name="situacao_comunicacao"
                          value={opcao}
                          checked={comunicacaoGeral === opcao}
                          onChange={() => {
                            setComunicacaoGeral(opcao);
                            limparErro('q10');
                          }}
                          className="w-4 h-4 text-[#4C6C54] mr-2.5 shrink-0 focus:ring-[#4C6C54]"
                          required
                        />
                        <span className="text-xs font-semibold text-slate-700">{opcao}</span>
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
            <div className="animation-fade-in space-y-6 sm:space-y-8">
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center h-12 w-12 bg-[#EB6D57]/10 rounded-xl mb-2.5">
                  <span className="text-2xl">🩺</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#EB6D57] mb-1.5">Histórico de Saúde</h1>
                <p className="text-xs text-slate-400 font-medium">Gestação, amamentação, introdução alimentar e digestão.</p>
              </div>

              {/* BLOCO: GESTAÇÃO E NASCIMENTO (Q11, Q12, Q13) */}
              <div className="space-y-5 bg-slate-50/50 p-4 sm:p-6 rounded-2xl border border-slate-100">
                {/* Q11: Histórico da gestação */}
                <div
                  ref={q11Ref}
                  className={`p-3 sm:p-4 rounded-xl border transition-all ${
                    errosValidacao['q11'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                  }`}
                >
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    11. Histórico da gestação e nascimento:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {["Sem intercorrências", "Houve alguma intercorrência", "Prematuro(a)", "Parto cesárea", "Parto vaginal", "Precisou de internação após nascer", "Não sei informar"].map((opcao) => (
                      <label key={opcao} className="flex items-center p-2.5 sm:p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#EB6D57]/30 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5">
                        <input
                          type="checkbox"
                          checked={gestacao.includes(opcao)}
                          onChange={() => {
                            handleCheckboxToggle(opcao, gestacao, setGestacao, ["Sem intercorrências", "Não sei informar"]);
                            limparErro('q11');
                          }}
                          className="w-4 h-4 text-[#EB6D57] rounded border-slate-300 focus:ring-[#EB6D57] mr-2.5 shrink-0"
                        />
                        <span className="text-xs font-semibold text-slate-700">{opcao}</span>
                      </label>
                    ))}
                  </div>
                  {gestacao.includes("Houve alguma intercorrência") && (
                    <div className="animation-fade-in mt-4">
                      <textarea
                        value={gestacaoIntercorrencia}
                        onChange={(e) => {
                          setGestacaoIntercorrencia(e.target.value);
                          limparErro('q11');
                          limparErro('q11_outro');
                        }}
                        placeholder="Conte brevemente o que aconteceu..."
                        rows={3}
                        className={`w-full p-3 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold resize-none transition-all ${
                          errosValidacao['q11_outro']
                            ? 'border-red-400 ring-2 ring-red-100'
                            : 'border-slate-200 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57]'
                        }`}
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-200/60">
                  {/* Q12: Semanas nascimento */}
                  <div
                    ref={q12Ref}
                    className={`p-3 rounded-xl border transition-all ${
                      errosValidacao['q12'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                    }`}
                  >
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      12. Com quantas semanas nasceu? <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={semanasNascimento}
                      onChange={(e) => {
                        setSemanasNascimento(e.target.value);
                        limparErro('q12');
                      }}
                      className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold cursor-pointer transition-all ${
                        errosValidacao['q12']
                          ? 'border-red-400 ring-2 ring-red-100'
                          : 'border-slate-200 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57]'
                      }`}
                      required
                    >
                      <option value="" disabled>Selecione...</option>
                      <option value="<37 semanas">Menos de 37 semanas</option>
                      <option value="37–38 semanas">37 a 38 semanas</option>
                      <option value="39–40 semanas">39 a 40 semanas</option>
                      <option value="Mais de 40 semanas">Mais de 40 semanas</option>
                      <option value="Não sei">Não sei</option>
                    </select>
                  </div>

                  {/* Q13: Peso ao nascer */}
                  <div
                    ref={q13Ref}
                    className={`p-3 rounded-xl border transition-all ${
                      errosValidacao['q13'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                    }`}
                  >
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      13. Peso ao nascer (kg) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={pesoNascer}
                      onChange={(e) => {
                        handleDecimalChange(e, setPesoNascer);
                        limparErro('q13');
                      }}
                      placeholder="Ex: 3,20"
                      className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                        errosValidacao['q13']
                          ? 'border-red-400 ring-2 ring-red-100'
                          : 'border-slate-200 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57]'
                      }`}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* BLOCO: AMAMENTAÇÃO (Q14, Q15) */}
              <div className="space-y-8">
                {/* Q14: Alimentação primeiros meses */}
                <div
                  ref={q14Ref}
                  className={`p-3 sm:p-4 rounded-2xl border transition-all ${
                    errosValidacao['q14'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                  }`}
                >
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    14. Como foi a alimentação nos primeiros meses? <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={aleitamento}
                    onChange={(e) => {
                      setAleitamento(e.target.value);
                      limparErro('q14');
                    }}
                    className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold cursor-pointer transition-all ${
                      errosValidacao['q14'] && !aleitamento
                        ? 'border-red-400 ring-2 ring-red-100'
                        : 'border-slate-200 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57]'
                    }`}
                    required
                  >
                    <option value="" disabled>Selecione a opção predominante...</option>
                    <option value="Aleitamento materno">Aleitamento materno exclusivo</option>
                    <option value="Fórmula infantil">Fórmula infantil</option>
                    <option value="Ambos">Ambos</option>
                    <option value="Não sei">Não sei</option>
                  </select>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {(aleitamento === "Aleitamento materno" || aleitamento === "Ambos") && (
                      <div className="animation-fade-in">
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                          Até aproximadamente quantos meses? (Peito) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={aleitamentoFimMeses}
                          onChange={(e) => {
                            setAleitamentoFimMeses(e.target.value);
                            limparErro('q14');
                          }}
                          placeholder="Ex: 6"
                          className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                            errosValidacao['q14'] && !aleitamentoFimMeses.trim()
                              ? 'border-red-400 ring-2 ring-red-100'
                              : 'border-slate-200 focus:ring-[#EB6D57]'
                          }`}
                          required
                        />
                      </div>
                    )}
                    {(aleitamento === "Fórmula infantil" || aleitamento === "Ambos") && (
                      <div className="animation-fade-in">
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                          Com quantos meses iniciou? (Fórmula) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formulaInicioMeses}
                          onChange={(e) => {
                            setFormulaInicioMeses(e.target.value);
                            limparErro('q14');
                          }}
                          placeholder="Ex: 2"
                          className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                            errosValidacao['q14'] && !formulaInicioMeses.trim()
                              ? 'border-red-400 ring-2 ring-red-100'
                              : 'border-slate-200 focus:ring-[#EB6D57]'
                          }`}
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Q15: Dificuldade na amamentação (OBRIGATÓRIA) */}
                <div
                  ref={q15Ref}
                  className={`p-3 sm:p-4 rounded-2xl border transition-all ${
                    errosValidacao['q15'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                  }`}
                >
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    15. Houve dificuldade no período de amamentação / fórmula? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {["Não", "Pega", "Sucção", "Baixo ganho de peso", "Refluxo", "Recusa", "Dor", "Outra", "Não sei"].map((opt) => (
                      <label key={opt} className="relative flex items-center p-2.5 sm:p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5">
                        <input
                          type="checkbox"
                          checked={dificuldadesAmamentacao.includes(opt)}
                          onChange={() => {
                            handleCheckboxToggle(opt, dificuldadesAmamentacao, setDificuldadesAmamentacao, ["Não", "Não sei"]);
                            limparErro('q15');
                          }}
                          className="w-4 h-4 text-[#EB6D57] rounded border-slate-300 focus:ring-[#EB6D57] mr-2.5 shrink-0"
                        />
                        <span className="text-xs font-semibold text-slate-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                  {dificuldadesAmamentacao.includes("Outra") && (
                    <div className="animation-fade-in mt-3">
                      <input
                        type="text"
                        value={outroDificuldadeAmamentacaoTexto}
                        onChange={(e) => {
                          setOutroDificuldadeAmamentacaoTexto(e.target.value);
                          limparErro('q15');
                          limparErro('q15_outro');
                        }}
                        placeholder="Especifique qual outra dificuldade..."
                        className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                          errosValidacao['q15_outro']
                            ? 'border-red-400 ring-2 ring-red-100'
                            : 'border-slate-200 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57]'
                        }`}
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* BLOCO: INTRODUÇÃO ALIMENTAR (Q16, Q17, Q18) */}
              <div className="space-y-8 border-t border-slate-100 pt-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Q16: Meses início IA */}
                  <div
                    ref={q16Ref}
                    className={`p-3 rounded-xl border transition-all ${
                      errosValidacao['q16'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                    }`}
                  >
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      16. Com quantos meses iniciou a Introdução Alimentar? <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={idadeInicioIA}
                      onChange={(e) => {
                        setIdadeInicioIA(e.target.value);
                        limparErro('q16');
                      }}
                      placeholder="Ex: 6"
                      className={`w-full h-10 px-3.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                        errosValidacao['q16']
                          ? 'border-red-400 ring-2 ring-red-100'
                          : 'border-slate-200 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57]'
                      }`}
                      required
                    />
                  </div>

                  {/* Q17: Método IA */}
                  <div
                    ref={q17Ref}
                    className={`p-3 rounded-xl border transition-all ${
                      errosValidacao['q17'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                    }`}
                  >
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      17. Como os alimentos foram oferecidos? <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={metodoIA}
                      onChange={(e) => {
                        setMetodoIA(e.target.value);
                        limparErro('q17');
                      }}
                      className={`w-full h-10 px-3.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold cursor-pointer transition-all ${
                        errosValidacao['q17']
                          ? 'border-red-400 ring-2 ring-red-100'
                          : 'border-slate-200 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57]'
                      }`}
                      required
                    >
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
                        <input
                          type="text"
                          value={outroMetodoIATexto}
                          onChange={(e) => {
                            setOutroMetodoIATexto(e.target.value);
                            limparErro('q17');
                            limparErro('q17_outro');
                          }}
                          placeholder="Especifique o método de introdução..."
                          className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                            errosValidacao['q17_outro']
                              ? 'border-red-400 ring-2 ring-red-100'
                              : 'border-slate-200 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57]'
                          }`}
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Q18: Dificuldade na IA (OBRIGATÓRIA) */}
                <div
                  ref={q18Ref}
                  className={`p-3 sm:p-4 rounded-2xl border transition-all ${
                    errosValidacao['q18'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                  }`}
                >
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    18. Houve dificuldade na Introdução Alimentar? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {["Não", "Recusa", "Engasgos", "Náuseas/vômitos", "Dificuldade para mastigar", "Dificuldade para engolir", "Dificuldade com texturas", "Choro/estresse", "Outra"].map((opt) => (
                      <label key={opt} className="relative flex items-center p-2.5 sm:p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5">
                        <input
                          type="checkbox"
                          checked={dificuldadesIA.includes(opt)}
                          onChange={() => {
                            handleCheckboxToggle(opt, dificuldadesIA, setDificuldadesIA, ["Não"]);
                            limparErro('q18');
                          }}
                          className="w-4 h-4 text-[#EB6D57] rounded border-slate-300 focus:ring-[#EB6D57] mr-2.5 shrink-0"
                        />
                        <span className="text-xs font-semibold text-slate-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                  {dificuldadesIA.includes("Outra") && (
                    <div className="animation-fade-in mt-3">
                      <input
                        type="text"
                        value={outroDificuldadeIATexto}
                        onChange={(e) => {
                          setOutroDificuldadeIATexto(e.target.value);
                          limparErro('q18');
                          limparErro('q18_outro');
                        }}
                        placeholder="Especifique qual outra dificuldade..."
                        className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                          errosValidacao['q18_outro']
                            ? 'border-red-400 ring-2 ring-red-100'
                            : 'border-slate-200 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57]'
                        }`}
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* BLOCO: EVOLUÇÃO E SINTOMAS (Q19, Q20) */}
              <div className="space-y-5 bg-slate-50/50 p-4 sm:p-6 rounded-2xl border border-slate-100">
                {/* Q19: Quando começaram as dificuldades */}
                <div
                  ref={q19Ref}
                  className={`p-3 rounded-xl border transition-all ${
                    errosValidacao['q19'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                  }`}
                >
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    19. Quando começaram as dificuldades alimentares atuais? <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={inicioDificuldadesAtuais}
                    onChange={(e) => {
                      setInicioDificuldadesAtuais(e.target.value);
                      limparErro('q19');
                    }}
                    className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold cursor-pointer transition-all ${
                      errosValidacao['q19']
                        ? 'border-red-400 ring-2 ring-red-100'
                        : 'border-slate-200 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57]'
                    }`}
                    required
                  >
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

                {/* Q20: Evento associado (OBRIGATÓRIA) */}
                <div
                  ref={q20Ref}
                  className={`p-3 sm:p-4 rounded-xl border transition-all ${
                    errosValidacao['q20'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                  }`}
                >
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    20. Houve algum evento associado ao início da dificuldade? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {["Não", "Engasgo", "Vômito", "Dor/refluxo", "Doença", "Mudança de rotina", "Entrada na escola", "Mudança familiar", "Experiência negativa com alimento", "Outro", "Não sei"].map((evt) => (
                      <label key={evt} className="flex items-center p-2.5 sm:p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#EB6D57]/30 transition-all has-[:checked]:border-[#EB6D57] has-[:ring-1] has-[:checked]:ring-[#EB6D57]">
                        <input
                          type="checkbox"
                          checked={eventosAssociados.includes(evt)}
                          onChange={() => {
                            handleCheckboxToggle(evt, eventosAssociados, setEventosAssociados, ["Não", "Não sei"]);
                            limparErro('q20');
                          }}
                          className="w-4 h-4 text-[#EB6D57] rounded border-slate-300 focus:ring-[#EB6D57] mr-2.5 shrink-0"
                        />
                        <span className="text-xs font-semibold text-slate-700">{evt}</span>
                      </label>
                    ))}
                  </div>
                  {eventosAssociados.includes("Outro") && (
                    <div className="animation-fade-in mt-3">
                      <input
                        type="text"
                        value={outroEventoAssociadoTexto}
                        onChange={(e) => {
                          setOutroEventoAssociadoTexto(e.target.value);
                          limparErro('q20');
                          limparErro('q20_outro');
                        }}
                        placeholder="Especifique qual outro evento..."
                        className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                          errosValidacao['q20_outro']
                            ? 'border-red-400 ring-2 ring-red-100'
                            : 'border-slate-200 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57]'
                        }`}
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* BLOCO: GASTROINTESTINAL E ADVERSOS (Q21, Q22) */}
              <div className="space-y-8 pt-4 border-b border-slate-100 pb-10">
                {/* Q21: Problema gastrointestinal (OBRIGATÓRIA) */}
                <div
                  ref={q21Ref}
                  className={`p-3 sm:p-4 rounded-2xl border transition-all ${
                    errosValidacao['q21'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                  }`}
                >
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    21. A criança apresenta ou já apresentou algum problema gastrointestinal? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {["Refluxo", "Esofagite/gastrite", "Constipação", "Diarreia recorrente", "Dor abdominal", "Distensão abdominal", "Náuseas/vômitos", "Alergia alimentar", "Intolerância alimentar", "Disfagia", "Engasgos frequentes", "Nenhum", "Outro"].map((g) => (
                      <label key={g} className="relative flex items-center p-2.5 sm:p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5">
                        <input
                          type="checkbox"
                          checked={gastro.includes(g)}
                          onChange={() => {
                            handleCheckboxToggle(g, gastro, setGastro, ["Nenhum"]);
                            limparErro('q21');
                          }}
                          className="w-4 h-4 text-[#EB6D57] rounded border-slate-300 focus:ring-[#EB6D57] mr-2.5 shrink-0 shrink-0"
                        />
                        <span className="text-xs font-semibold text-slate-700 leading-tight">{g}</span>
                      </label>
                    ))}
                  </div>

                  {gastro.includes("Outro") && (
                    <div className="animation-fade-in mt-3">
                      <input
                        type="text"
                        value={outroGastroTexto}
                        onChange={(e) => {
                          setOutroGastroTexto(e.target.value);
                          limparErro('q21');
                          limparErro('q21_outro');
                        }}
                        placeholder="Qual outro problema gastrointestinal?"
                        className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                          errosValidacao['q21_outro']
                            ? 'border-red-400 ring-2 ring-red-100'
                            : 'border-slate-200 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57]'
                        }`}
                        required
                      />
                    </div>
                  )}

                  {(gastro.includes("Alergia alimentar") || gastro.includes("Intolerância alimentar")) && (
                    <div className="animation-fade-in mt-3">
                      <textarea
                        value={gastroDetalhes}
                        onChange={(e) => {
                          setGastroDetalhes(e.target.value);
                          limparErro('q21');
                          limparErro('q21_detalhes');
                        }}
                        placeholder="Se marcou Alergia ou Intolerância: Qual alimento e quais sintomas?"
                        rows={2}
                        className={`w-full p-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold resize-none transition-all ${
                          errosValidacao['q21_detalhes']
                            ? 'border-red-400 ring-2 ring-red-100 bg-red-50/10'
                            : 'border-slate-200 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57]'
                        }`}
                        required
                      />
                    </div>
                  )}
                </div>

                {/* Q22: Sintomas adversos */}
                <div
                  ref={q22Ref}
                  className={`p-3 sm:p-4 rounded-2xl border transition-all ${
                    errosValidacao['q22'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                  }`}
                >
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    22. Algum alimento provoca sintomas adversos? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2.5 h-10">
                    {["Não", "Sim"].map(opcao => (
                      <label key={opcao} className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 bg-white rounded-xl cursor-pointer has-[:checked]:border-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5 has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] transition-all text-xs sm:text-sm">
                        <input
                          type="radio"
                          name="sintomasAdversos"
                          value={opcao}
                          checked={sintomasAdversos === opcao}
                          onChange={(e) => {
                            setSintomasAdversos(e.target.value);
                            limparErro('q22');
                          }}
                          className="sr-only"
                          required
                        />
                        <span className="font-semibold text-slate-700">{opcao}</span>
                      </label>
                    ))}
                  </div>
                  {sintomasAdversos === "Sim" && (
                    <div className="animation-fade-in mt-4">
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                        Qual alimento e quais sintomas? <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={sintomasAdversosDetalhes}
                        onChange={(e) => {
                          setSintomasAdversosDetalhes(e.target.value);
                          limparErro('q22');
                        }}
                        placeholder="Descreva os detalhes..."
                        rows={2}
                        className={`w-full p-3 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold resize-none transition-all ${
                          errosValidacao['q22'] && !sintomasAdversosDetalhes.trim()
                            ? 'border-red-400 ring-2 ring-red-100'
                            : 'border-slate-200 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57]'
                        }`}
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* BLOCO: MEDIDAS ANTROPOMÉTRICAS RECENTES (Q23) */}
              <div
                ref={q23Ref}
                className={`space-y-5 p-4 sm:p-6 rounded-2xl border transition-all ${
                  errosValidacao['q23'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'bg-slate-50/50 border-slate-100'
                }`}
              >
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-1.5">
                    23. Dados mais recentes da criança <span className="text-red-500">*</span>
                  </h3>

                  <div className="space-y-6">
                    {/* Referente ao Peso */}
                    <div className="p-3.5 sm:p-4 bg-white border border-slate-200 rounded-xl">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Referente ao Peso</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                            Peso (kg) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={pesoAtual}
                            onChange={(e) => {
                              handleDecimalChange(e, setPesoAtual);
                              limparErro('q23');
                            }}
                            placeholder="Ex: 14,5"
                            className={`w-full h-10 px-3.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                              errosValidacao['q23'] && !pesoAtual.trim()
                                ? 'border-red-400 ring-2 ring-red-100'
                                : 'border-slate-200 focus:ring-[#EB6D57]'
                            }`}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                            Data da medida <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={dataMedidaPeso}
                            onChange={(e) => {
                              setDataMedidaPeso(e.target.value);
                              limparErro('q23');
                              limparErro('q23_data_peso');
                            }}
                            max={hoje}
                            min={dataNascimento || dataMinima}
                            className={`w-full h-10 px-3.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                              errosValidacao['q23_data_peso'] || (errosValidacao['q23'] && !dataMedidaPeso)
                                ? 'border-red-400 ring-2 ring-red-100'
                                : 'border-slate-200 focus:ring-[#EB6D57]'
                            }`}
                            required
                          />
                          {errosValidacao['q23_data_peso'] && (
                            <p className="text-[11px] text-red-500 font-semibold mt-1">Data não pode ser anterior ao nascimento ou futura.</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                            Quem mediu? <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={medidaPesoPor}
                            onChange={(e) => {
                              setMedidaPesoPor(e.target.value);
                              limparErro('q23');
                            }}
                            className={`w-full h-10 px-3.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold cursor-pointer transition-all ${
                              errosValidacao['q23'] && !medidaPesoPor
                                ? 'border-red-400 ring-2 ring-red-100'
                                : 'border-slate-200 focus:ring-[#EB6D57]'
                            }`}
                            required
                          >
                            <option value="" disabled>Selecione...</option>
                            <option value="Profissional">Profissional</option>
                            <option value="Em casa">Em casa</option>
                            <option value="Estimativa">Estimativa</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Referente à Altura */}
                    <div className="p-3.5 sm:p-4 bg-white border border-slate-200 rounded-xl">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Referente à Altura</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                            Altura (cm) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={alturaAtual}
                            onChange={(e) => {
                              handleDecimalChange(e, setAlturaAtual);
                              limparErro('q23');
                            }}
                            placeholder="Ex: 95,0"
                            className={`w-full h-10 px-3.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                              errosValidacao['q23'] && !alturaAtual.trim()
                                ? 'border-red-400 ring-2 ring-red-100'
                                : 'border-slate-200 focus:ring-[#EB6D57]'
                            }`}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                            Data da medida <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={dataMedidaAltura}
                            onChange={(e) => {
                              setDataMedidaAltura(e.target.value);
                              limparErro('q23');
                              limparErro('q23_data_altura');
                            }}
                            max={hoje}
                            min={dataNascimento || dataMinima}
                            className={`w-full h-10 px-3.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                              errosValidacao['q23_data_altura'] || (errosValidacao['q23'] && !dataMedidaAltura)
                                ? 'border-red-400 ring-2 ring-red-100'
                                : 'border-slate-200 focus:ring-[#EB6D57]'
                            }`}
                            required
                          />
                          {errosValidacao['q23_data_altura'] && (
                            <p className="text-[11px] text-red-500 font-semibold mt-1">Data não pode ser anterior ao nascimento ou futura.</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                            Quem mediu? <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={medidaAlturaPor}
                            onChange={(e) => {
                              setMedidaAlturaPor(e.target.value);
                              limparErro('q23');
                            }}
                            className={`w-full h-10 px-3.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold cursor-pointer transition-all ${
                              errosValidacao['q23'] && !medidaAlturaPor
                                ? 'border-red-400 ring-2 ring-red-100'
                                : 'border-slate-200 focus:ring-[#EB6D57]'
                            }`}
                            required
                          >
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

                {/* Q24: Medicamentos */}
                <div className="pt-6 border-t border-slate-200/60" ref={medicamentosRef}>
                  <div
                    ref={q24Ref}
                    className={`p-3 rounded-xl border transition-all ${
                      errosValidacao['q24'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                    }`}
                  >
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      24. Utiliza medicamentos atualmente? <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2.5 h-10">
                      {["Não", "Sim"].map(opcao => (
                        <label key={opcao} className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 bg-white rounded-xl cursor-pointer has-[:checked]:border-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5 has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] transition-all text-xs sm:text-sm">
                          <input
                            type="radio"
                            name="medicamentos"
                            value={opcao}
                            checked={medicamentos === opcao}
                            onChange={(e) => {
                              setMedicamentos(e.target.value);
                              limparErro('q24');
                            }}
                            className="sr-only"
                            required
                          />
                          <span className="font-semibold text-slate-700">{opcao}</span>
                        </label>
                      ))}
                    </div>
                    {medicamentos === "Sim" && (
                      <div className="animation-fade-in mt-4">
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                          Informe: Nome do medicamento + Dose + Frequência <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={medicamentosDetalhes}
                          onChange={(e) => {
                            setMedicamentosDetalhes(e.target.value);
                            limparErro('q24');
                          }}
                          placeholder="Ex: Ritalina 10mg, 1x ao dia..."
                          rows={2}
                          className={`w-full p-3 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold resize-none transition-all ${
                            errosValidacao['q24'] && !medicamentosDetalhes.trim()
                              ? 'border-red-400 ring-2 ring-red-100'
                              : 'border-slate-200 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57]'
                          }`}
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Q25: Suplementos (OBRIGATÓRIA) */}
                <div className="pt-6 border-t border-slate-200/60">
                  <div
                    ref={q25Ref}
                    className={`p-3 rounded-xl border transition-all ${
                      errosValidacao['q25'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                    }`}
                  >
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      25. Utiliza algum suplemento? <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {["Não", "Multivitamínico", "Vitamina D", "Ferro", "Ômega-3", "Probiótico", "Fórmula/suplemento oral", "Outro"].map((opt) => (
                        <label key={opt} className="relative flex items-center p-2.5 sm:p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#EB6D57]/30 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57]">
                          <input
                            type="checkbox"
                            checked={suplementos.includes(opt)}
                            onChange={() => {
                              handleCheckboxToggle(opt, suplementos, setSuplementos, ["Não"]);
                              limparErro('q25');
                            }}
                            className="w-4 h-4 text-[#EB6D57] rounded border-slate-300 focus:ring-[#EB6D57] mr-2.5 shrink-0 shrink-0"
                          />
                          <span className="text-xs font-semibold text-slate-700 leading-tight">{opt}</span>
                        </label>
                      ))}
                    </div>
                    {suplementos.includes("Outro") && (
                      <div className="animation-fade-in mt-3">
                        <input
                          type="text"
                          value={outroSuplementoTexto}
                          onChange={(e) => {
                            setOutroSuplementoTexto(e.target.value);
                            limparErro('q25');
                            limparErro('q25_outro');
                          }}
                          placeholder="Especifique o suplemento..."
                          className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                            errosValidacao['q25_outro']
                              ? 'border-red-400 ring-2 ring-red-100'
                              : 'border-slate-200 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57]'
                          }`}
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Q26: Exames laboratoriais com upload obrigatório condicional */}
                <div className="pt-6 border-t border-slate-200/60">
                  <div
                    ref={q26Ref}
                    className={`p-3 rounded-xl border transition-all ${
                      errosValidacao['q26'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                    }`}
                  >
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      26. Possui exames laboratoriais dos últimos 6 meses? <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2.5 h-10">
                      {["Não", "Sim"].map(opcao => (
                        <label key={opcao} className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 bg-white rounded-xl cursor-pointer has-[:checked]:border-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5 has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] transition-all text-xs sm:text-sm">
                          <input
                            type="radio"
                            name="exames"
                            value={opcao}
                            checked={exames === opcao}
                            onChange={(e) => {
                              setExames(e.target.value);
                              limparErro('q26');
                            }}
                            className="sr-only"
                            required
                          />
                          <span className="font-semibold text-slate-700">{opcao}</span>
                        </label>
                      ))}
                    </div>

                    {exames === "Sim" && (
                      <div
                        className={`animation-fade-in mt-3 p-3.5 sm:p-4 rounded-xl text-center transition-all ${
                          errosValidacao['q26_arquivo']
                            ? 'border-2 border-dashed border-red-400 bg-red-50/30'
                            : 'bg-white border border-dashed border-[#EB6D57]/40'
                        }`}
                      >
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="sr-only" accept=".pdf,.png,.jpg,.jpeg" multiple />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#EB6D57]/10 text-[#EB6D57] hover:bg-[#EB6D57]/20 font-bold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
                        >
                          <Paperclip className="h-5 w-5" /> Anexar Exames
                        </button>
                        <p className="text-xs text-slate-500 mt-3">Formatos aceitos: PDF, JPG, PNG (Máx. 5MB por arquivo).</p>

                        {errosValidacao['q26_arquivo'] && arquivosExames.length === 0 && (
                          <div className="mt-3 p-2.5 bg-red-100 border border-red-300 rounded-xl flex items-center justify-center gap-2 text-red-700 text-xs sm:text-sm font-bold">
                            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                            <span>É obrigatório anexar os exames laboratoriais dos últimos 6 meses para prosseguir.</span>
                          </div>
                        )}

                        {erroExame && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-sm font-semibold text-left">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            {erroExame}
                          </div>
                        )}

                        {arquivosExames.length > 0 && (
                          <div className="mt-4 flex flex-col gap-2 text-left">
                            {arquivosExames.map((file, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <FileText className="h-5 w-5 text-slate-400 shrink-0" />
                                  <div>
                                    <span className="text-xs font-semibold text-slate-700 truncate block">{file.name}</span>
                                    <span className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                  </div>
                                </div>
                                <button type="button" onClick={() => removerArquivo(idx)} className="text-slate-400 hover:text-red-500 p-1 rounded-full transition-colors shrink-0 cursor-pointer">
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
            </div>
          )}


                    {/* ================================================================ */}
          {/* ETAPA 3 - MAPA ALIMENTAR */}
          {/* ================================================================ */}
          {etapaAtual === 3 && (
            <div className="animation-fade-in space-y-6 sm:space-y-8">
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center h-12 w-12 bg-[#4C6C54]/10 rounded-xl mb-2.5">
                  <span className="text-2xl">🥦</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#4C6C54] mb-1.5">Mapa Alimentar</h1>
                <p className="text-xs text-slate-400 font-medium">Mapeando o repertório e a aceitação alimentar.</p>
              </div>

              {/* GRUPO 1: CEREAIS E TUBÉRCULOS (Q27 - OBRIGATÓRIA) */}
              <div
                ref={q27Ref}
                className={`bg-white p-4 sm:p-6 rounded-2xl border transition-all shadow-sm ${
                  errosValidacao['q27'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-slate-200'
                }`}
              >
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-1.5">
                  🌾 27. Cereais e Tubérculos <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {["🍚 Arroz", "🍝 Macarrão", "🥖 Pão", "🧀 Pão de queijo", "🥔 Batata", "🍠 Mandioca", "🥞 Tapioca", "🌽 Cuscuz", "🌽 Milho", "🍪 Biscoitos", "➕ Outros", "🚫 Nenhum"].map((item) => (
                    <label key={item} className={`flex items-center p-2 sm:p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5 ${item === "🚫 Nenhum" ? 'text-red-500 has-[:checked]:border-red-500 has-[:checked]:bg-red-50' : ''}`}>
                      <input
                        type="checkbox"
                        checked={cereais.includes(item)}
                        onChange={() => {
                          handleCheckboxToggle(item, cereais, setCereais, ["🚫 Nenhum"]);
                          limparErro('q27');
                        }}
                        className="w-4 h-4 text-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-2.5 shrink-0 shrink-0"
                      />
                      <span className="text-xs font-semibold truncate">{item}</span>
                    </label>
                  ))}
                </div>
                {cereais.includes("➕ Outros") && (
                  <div className="animation-fade-in mt-4">
                    <input
                      type="text"
                      value={outroCerealTexto}
                      onChange={(e) => {
                        setOutroCerealTexto(e.target.value);
                        limparErro('q27');
                        limparErro('q27_outro');
                      }}
                      placeholder="Quais? (Separe por vírgula)"
                      className={`w-full h-10 px-3.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                        errosValidacao['q27_outro']
                          ? 'border-red-400 ring-2 ring-red-100'
                          : 'border-slate-200 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54]'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* GRUPO 2: PROTEÍNAS (Q28 - OBRIGATÓRIA) */}
              <div
                ref={q28Ref}
                className={`bg-white p-4 sm:p-6 rounded-2xl border transition-all shadow-sm ${
                  errosValidacao['q28'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-slate-200'
                }`}
              >
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-1.5">
                  🥩 28. Proteínas <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {["🍗 Frango", "🥩 Carne bovina", "🐟 Peixe", "🥚 Ovo", "🥓 Carne suína", "🧀 Queijo", "➕ Outras", "🚫 Nenhum"].map((item) => (
                    <label key={item} className={`flex items-center p-2 sm:p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5 ${item === "🚫 Nenhum" ? 'text-red-500 has-[:checked]:border-red-500 has-[:checked]:bg-red-50' : ''}`}>
                      <input
                        type="checkbox"
                        checked={proteinas.includes(item)}
                        onChange={() => {
                          handleCheckboxToggle(item, proteinas, setProteinas, ["🚫 Nenhum"]);
                          limparErro('q28');
                        }}
                        className="w-4 h-4 text-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-2.5 shrink-0 shrink-0"
                      />
                      <span className="text-xs font-semibold truncate">{item}</span>
                    </label>
                  ))}
                </div>
                {proteinas.includes("➕ Outras") && (
                  <div className="animation-fade-in mt-4">
                    <input
                      type="text"
                      value={outroProteinaTexto}
                      onChange={(e) => {
                        setOutroProteinaTexto(e.target.value);
                        limparErro('q28');
                        limparErro('q28_outro');
                      }}
                      placeholder="Quais? (Separe por vírgula)"
                      className={`w-full h-10 px-3.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                        errosValidacao['q28_outro']
                          ? 'border-red-400 ring-2 ring-red-100'
                          : 'border-slate-200 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54]'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* GRUPO 3: FRUTAS (Q29 - OBRIGATÓRIA) */}
              <div
                ref={q29Ref}
                className={`bg-white p-4 sm:p-6 rounded-2xl border transition-all shadow-sm ${
                  errosValidacao['q29'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-slate-200'
                }`}
              >
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-1.5">
                  🍎 29. Frutas <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {["🍌 Banana", "🍎 Maçã", "🍉 Melancia", "🍇 Uva", "🍓 Morango", "🥭 Manga", "🍊 Laranja", "🍐 Pera", "🥑 Abacate", "➕ Outras", "🚫 Nenhuma"].map((item) => (
                    <label key={item} className={`flex items-center p-2 sm:p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5 ${item === "🚫 Nenhuma" ? 'text-red-500 has-[:checked]:border-red-500 has-[:checked]:bg-red-50' : ''}`}>
                      <input
                        type="checkbox"
                        checked={frutas.includes(item)}
                        onChange={() => {
                          handleCheckboxToggle(item, frutas, setFrutas, ["🚫 Nenhuma"]);
                          limparErro('q29');
                        }}
                        className="w-4 h-4 text-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-2.5 shrink-0 shrink-0"
                      />
                      <span className="text-xs font-semibold truncate">{item}</span>
                    </label>
                  ))}
                </div>
                {frutas.includes("➕ Outras") && (
                  <div className="animation-fade-in mt-4">
                    <input
                      type="text"
                      value={outroFrutaTexto}
                      onChange={(e) => {
                        setOutroFrutaTexto(e.target.value);
                        limparErro('q29');
                        limparErro('q29_outro');
                      }}
                      placeholder="Quais? (Separe por vírgula)"
                      className={`w-full h-10 px-3.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                        errosValidacao['q29_outro']
                          ? 'border-red-400 ring-2 ring-red-100'
                          : 'border-slate-200 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54]'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* GRUPO 4: VEGETAIS (Q30 - OBRIGATÓRIA) */}
              <div
                ref={q30Ref}
                className={`bg-white p-4 sm:p-6 rounded-2xl border transition-all shadow-sm ${
                  errosValidacao['q30'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-slate-200'
                }`}
              >
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-1.5">
                  🥦 30. Vegetais <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {["🥦 Brócolis", "🥕 Cenoura", "🍅 Tomate", "🎃 Abóbora", "🍠 Batata Doce", "🥒 Pepino", "🥬 Alface", "🧅 Cebola", "➕ Outros", "🚫 Nenhum"].map((item) => (
                    <label key={item} className={`flex items-center p-2 sm:p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5 ${item === "🚫 Nenhum" ? 'text-red-500 has-[:checked]:border-red-500 has-[:checked]:bg-red-50' : ''}`}>
                      <input
                        type="checkbox"
                        checked={vegetais.includes(item)}
                        onChange={() => {
                          handleCheckboxToggle(item, vegetais, setVegetais, ["🚫 Nenhum"]);
                          limparErro('q30');
                        }}
                        className="w-4 h-4 text-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-2.5 shrink-0 shrink-0"
                      />
                      <span className="text-xs font-semibold truncate">{item}</span>
                    </label>
                  ))}
                </div>
                {vegetais.includes("➕ Outros") && (
                  <div className="animation-fade-in mt-4">
                    <input
                      type="text"
                      value={outroVegetalTexto}
                      onChange={(e) => {
                        setOutroVegetalTexto(e.target.value);
                        limparErro('q30');
                        limparErro('q30_outro');
                      }}
                      placeholder="Quais? (Separe por vírgula)"
                      className={`w-full h-10 px-3.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                        errosValidacao['q30_outro']
                          ? 'border-red-400 ring-2 ring-red-100'
                          : 'border-slate-200 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54]'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* GRUPO 5: LEGUMINOSAS (Q31 - OBRIGATÓRIA) */}
              <div
                ref={q31Ref}
                className={`bg-white p-4 sm:p-6 rounded-2xl border transition-all shadow-sm ${
                  errosValidacao['q31'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-slate-200'
                }`}
              >
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2 flex items-center gap-1.5">
                  🫘 31. Leguminosas <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {["🫘 Feijão", "🍲 Lentilha", "🥙 Grão-de-bico", "🫛 Ervilha", "🫘 Soja", "➕ Outras", "🚫 Nenhuma"].map((item) => (
                    <label key={item} className={`flex items-center p-2 sm:p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5 ${item === "🚫 Nenhuma" ? 'text-red-500 has-[:checked]:border-red-500 has-[:checked]:bg-red-50' : ''}`}>
                      <input
                        type="checkbox"
                        checked={leguminosas.includes(item)}
                        onChange={() => {
                          handleCheckboxToggle(item, leguminosas, setLeguminosas, ["🚫 Nenhuma"]);
                          limparErro('q31');
                        }}
                        className="w-4 h-4 text-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-2.5 shrink-0 shrink-0"
                      />
                      <span className="text-xs font-semibold truncate">{item}</span>
                    </label>
                  ))}
                </div>
                {leguminosas.includes("➕ Outras") && (
                  <div className="animation-fade-in mt-4">
                    <input
                      type="text"
                      value={outroLeguminosaTexto}
                      onChange={(e) => {
                        setOutroLeguminosaTexto(e.target.value);
                        limparErro('q31');
                        limparErro('q31_outro');
                      }}
                      placeholder="Quais? (Separe por vírgula)"
                      className={`w-full h-10 px-3.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                        errosValidacao['q31_outro']
                          ? 'border-red-400 ring-2 ring-red-100'
                          : 'border-slate-200 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54]'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* CONTAGEM TOTAL AUTOMÁTICA (Q32 - OBRIGATÓRIA) */}
              <div
                ref={q32Ref}
                className={`bg-[#4C6C54]/10 p-4 sm:p-6 rounded-2xl border transition-all shadow-sm mt-8 ${
                  errosValidacao['q32'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-[#4C6C54]/20'
                }`}
              >
                <div className="mb-6 text-center sm:text-left">
                  <label className="block text-xs sm:text-sm font-extrabold text-[#4C6C54] uppercase mb-1.5">
                    32. Confirmação do Repertório <span className="text-red-500">*</span>
                  </label>
                  <p className="text-slate-600 text-base">
                    Baseado nas suas seleções acima, mapeamos que a criança aceita <strong>pelo menos {alimentosContados} alimentos</strong> (que ela efetivamente come e engole).
                    Se você lembrar de mais algum que não estava na lista, ajuste o volume total abaixo:
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {["Menos de 5", "5–10", "11–20", "21–30", "31–50", "Mais de 50"].map(opcao => (
                    <label key={opcao} className="flex items-center justify-center p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer has-[:checked]:border-[#4C6C54] has-[:checked]:bg-[#4C6C54] has-[:checked]:text-white transition-all text-center group">
                      <input
                        type="radio"
                        name="qntAlimentos"
                        value={opcao}
                        checked={qntAlimentos === opcao}
                        onChange={(e) => {
                          setQntAlimentos(e.target.value);
                          limparErro('q32');
                        }}
                        className="sr-only"
                        required
                      />
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
            <div className="animation-fade-in space-y-6 sm:space-y-8">
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center h-12 w-12 bg-[#EB6D57]/10 rounded-xl mb-2.5">
                  <span className="text-2xl">👃</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#EB6D57] mb-1.5">Perfil Sensorial</h1>
                <p className="text-xs text-slate-400 font-medium">Comportamentos de apego, flexibilidade, texturas e mastigação.</p>
              </div>

              {erroValidacaoEtapa4 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold shadow-sm animation-fade-in">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{erroValidacaoEtapa4}</span>
                </div>
              )}

              {/* BLOCO 1: COMPORTAMENTO E APEGO (Q33, Q34, Q35) */}
              <div className="space-y-5 bg-slate-50/50 p-4 sm:p-6 rounded-2xl border border-slate-100">
                {/* Q33: Aceita apenas fora de casa */}
                <div
                  ref={q33Ref}
                  className={`p-3 rounded-xl border transition-all ${
                    errosValidacao['q33'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                  }`}
                >
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    33. Existe algum alimento que ele(a) aceita comer apenas fora de casa? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2.5 h-10">
                    {["Não", "Sim"].map(opcao => (
                      <label key={opcao} className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 bg-white rounded-xl cursor-pointer has-[:checked]:border-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5 has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] transition-all text-xs sm:text-sm">
                        <input
                          type="radio"
                          name="comerFora"
                          value={opcao}
                          checked={comerFora === opcao}
                          onChange={(e) => {
                            setComerFora(e.target.value);
                            limparErro('q33');
                          }}
                          className="sr-only"
                          required
                        />
                        <span className="font-semibold text-slate-700">{opcao}</span>
                      </label>
                    ))}
                  </div>
                  {comerFora === "Sim" && (
                    <div className="animation-fade-in mt-4">
                      <input
                        type="text"
                        value={comerForaQual}
                        onChange={(e) => {
                          setComerForaQual(e.target.value);
                          limparErro('q33');
                          limparErro('q33_outro');
                        }}
                        placeholder="Quais alimentos aceita apenas fora?"
                        className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                          errosValidacao['q33_outro']
                            ? 'border-red-400 ring-2 ring-red-100'
                            : 'border-slate-200 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57]'
                        }`}
                        required
                      />
                    </div>
                  )}
                </div>

                {/* Q34: Exige todo dia */}
                <div className="pt-6 border-t border-slate-200/60">
                  <div
                    ref={q34Ref}
                    className={`p-3 rounded-xl border transition-all ${
                      errosValidacao['q34'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                    }`}
                  >
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      34. Existe algum alimento que ela exige ou precisa comer todos os dias? <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2.5 h-10">
                      {["Não", "Sim"].map(opcao => (
                        <label key={opcao} className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 bg-white rounded-xl cursor-pointer has-[:checked]:border-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5 has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] transition-all text-xs sm:text-sm">
                          <input
                            type="radio"
                            name="exigeTodoDia"
                            value={opcao}
                            checked={exigeTodoDia === opcao}
                            onChange={(e) => {
                              setExigeTodoDia(e.target.value);
                              limparErro('q34');
                            }}
                            className="sr-only"
                            required
                          />
                          <span className="font-semibold text-slate-700">{opcao}</span>
                        </label>
                      ))}
                    </div>
                    {exigeTodoDia === "Sim" && (
                      <div className="animation-fade-in mt-4">
                        <input
                          type="text"
                          value={exigeTodoDiaQual}
                          onChange={(e) => {
                            setExigeTodoDiaQual(e.target.value);
                            limparErro('q34');
                            limparErro('q34_outro');
                          }}
                          placeholder="Quais alimentos ela exige diariamente?"
                          className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                            errosValidacao['q34_outro']
                              ? 'border-red-400 ring-2 ring-red-100'
                              : 'border-slate-200 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57]'
                          }`}
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Q35: Sofrimento na falta */}
                <div className="pt-6 border-t border-slate-200/60">
                  <div
                    ref={q35Ref}
                    className={`p-3 rounded-xl border transition-all ${
                      errosValidacao['q35'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                    }`}
                  >
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      35. Existe algum alimento que, se não estiver disponível, gera grande sofrimento? <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2.5 h-10">
                      {["Não", "Sim"].map(opcao => (
                        <label key={opcao} className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 bg-white rounded-xl cursor-pointer has-[:checked]:border-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5 has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] transition-all text-xs sm:text-sm">
                          <input
                            type="radio"
                            name="sofrimentoFalta"
                            value={opcao}
                            checked={sofrimentoFalta === opcao}
                            onChange={(e) => {
                              setSofrimentoFalta(e.target.value);
                              limparErro('q35');
                            }}
                            className="sr-only"
                            required
                          />
                          <span className="font-semibold text-slate-700">{opcao}</span>
                        </label>
                      ))}
                    </div>
                    {sofrimentoFalta === "Sim" && (
                      <div className="animation-fade-in mt-4">
                        <input
                          type="text"
                          value={sofrimentoFaltaQual}
                          onChange={(e) => {
                            setSofrimentoFaltaQual(e.target.value);
                            limparErro('q35');
                            limparErro('q35_outro');
                          }}
                          placeholder="Quais alimentos geram esse sofrimento?"
                          className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                            errosValidacao['q35_outro']
                              ? 'border-red-400 ring-2 ring-red-100'
                              : 'border-slate-200 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57]'
                          }`}
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* BLOCO 2: FATORES SENSORIAIS (Q36 - OBRIGATÓRIA) */}
              <div
                ref={q36Ref}
                className={`p-4 sm:p-6 rounded-2xl border transition-all ${
                  errosValidacao['q36'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                }`}
              >
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
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
                    <label key={fator} className={`flex items-start p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-all ${influencias.includes(fator) ? 'border-[#EB6D57] bg-[#EB6D57]/5 shadow-sm' : 'border-slate-200 hover:border-slate-300'} ${!influencias.includes(fator) && influencias.length >= 5 ? 'opacity-40 cursor-not-allowed' : ''}`}>
                      <input
                        type="checkbox"
                        checked={influencias.includes(fator)}
                        onChange={() => {
                          handleInfluenciaToggle(fator);
                          limparErro('q36');
                        }}
                        disabled={!influencias.includes(fator) && influencias.length >= 5}
                        className="w-4 h-4 text-[#EB6D57] accent-[#EB6D57] rounded border-slate-300 mt-0.5 mr-2.5 shrink-0 focus:ring-[#EB6D57]"
                      />
                      <span className="text-xs font-semibold text-slate-700 leading-tight">{fator}</span>
                    </label>
                  ))}

                  <div className={`flex flex-col p-2.5 sm:p-3 rounded-xl border transition-all sm:col-span-2 md:col-span-3 ${influencias.includes("Outro") ? 'border-[#EB6D57] bg-[#EB6D57]/5 shadow-sm' : 'border-slate-200'}`}>
                    <label className={`flex items-center cursor-pointer ${!influencias.includes("Outro") && influencias.length >= 5 ? 'opacity-40' : ''}`}>
                      <input
                        type="checkbox"
                        checked={influencias.includes("Outro")}
                        onChange={() => {
                          handleInfluenciaToggle("Outro");
                          limparErro('q36');
                        }}
                        disabled={!influencias.includes("Outro") && influencias.length >= 5}
                        className="w-5 h-5 text-[#EB6D57] accent-[#EB6D57] rounded border-slate-300 mr-3 focus:ring-[#EB6D57]"
                      />
                      <span className="text-sm font-bold text-slate-700">Outro fator</span>
                    </label>
                    {influencias.includes("Outro") && (
                      <input
                        type="text"
                        value={outraInfluenciaTexto}
                        onChange={(e) => {
                          setOutraInfluenciaTexto(e.target.value);
                          limparErro('q36');
                          limparErro('q36_outro');
                        }}
                        placeholder="Especifique qual outro fator influencia..."
                        className={`w-full mt-2 h-10 px-3.5 bg-white border rounded-xl focus:outline-none text-xs sm:text-sm font-semibold transition-all ${
                          errosValidacao['q36_outro']
                            ? 'border-red-400 ring-2 ring-red-100'
                            : 'border-slate-300 focus:border-[#EB6D57]'
                        }`}
                        required
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* BLOCO 3: MATRIZ DE SENSIBILIDADE E RIGIDEZ (Q37) */}
              <div
                ref={q37Ref}
                className={`bg-white p-4 sm:p-6 rounded-2xl border transition-all shadow-sm ${
                  errosValidacao['q37'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-slate-200'
                }`}
              >
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    37. Matriz de Sensibilidade e Rigidez <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-slate-500">Como a criança reage quando ocorrem as seguintes situações com o alimento habitual:</p>
                </div>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Situação</th>
                        <th className="py-2.5 px-3 text-center">Aceita bem</th>
                        <th className="py-2.5 px-3 text-center">Estranha mas come</th>
                        <th className="py-2.5 px-3 text-center">Recusa</th>
                        <th className="py-2.5 px-3 text-center">Crise / Choro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {[
                        { id: "marca", label: "Mudança de marca" },
                        { id: "preparo", label: "Mudança no ponto ou modo de preparo" },
                        { id: "apresentacao", label: "Mudança no corte ou apresentação" },
                        { id: "encostando", label: "Alimentos encostando um no outro" },
                        { id: "misturados", label: "Alimentos misturados no mesmo prato" }
                      ].map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-semibold text-slate-700">{item.label}</td>
                          {["Aceita bem", "Estranha mas come", "Recusa", "Crise/Choro"].map((val) => (
                            <td key={val} className="py-3 px-3 text-center">
                              <input
                                type="radio"
                                name={`matriz_${item.id}`}
                                value={val}
                                checked={mudancasMatriz[item.id as keyof typeof mudancasMatriz] === val}
                                onChange={() => {
                                  handleMatrizChange(item.id as keyof typeof mudancasMatriz, val);
                                  limparErro('q37');
                                }}
                                className="w-4 h-4 text-[#EB6D57] accent-[#EB6D57] border-slate-300 focus:ring-[#EB6D57]"
                                required
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* BLOCO 4: COMPORTAMENTO COM ALIMENTOS NOVOS (Q38) */}
              <div
                ref={q38Ref}
                className={`p-4 sm:p-6 rounded-2xl border transition-all ${
                  (errosValidacao['q38'] || (erroValidacaoEtapa4 && comportamentoNovo.length === 0))
                    ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200'
                    : 'bg-slate-50/50 border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    38. Como a criança reage ao ser exposta a um alimento novo? <span className="text-red-500">*</span>
                  </label>
                  {(errosValidacao['q38'] || (erroValidacaoEtapa4 && comportamentoNovo.length === 0)) && (
                    <span className="text-xs font-bold text-red-500 bg-red-100 px-2.5 py-1 rounded-md shrink-0">
                      Campo obrigatório
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    "Aceita experimentar se incentivada",
                    "Aceita tocar ou cheirar",
                    "Tolera no prato sem comer",
                    "Não tolera no próprio prato",
                    "Não tolera na mesa",
                    "Tem nojo aparente",
                    "Tem ânsia de vômito ao ver ou cheirar",
                    "Tem crise de choro ou estresse"
                  ].map((comportamento) => (
                    <label key={comportamento} className="flex items-center p-2.5 sm:p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#EB6D57]/30 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5">
                      <input
                        type="checkbox"
                        checked={comportamentoNovo.includes(comportamento)}
                        onChange={() => {
                          handleCheckboxToggle(comportamentoNovo.includes(comportamento) ? comportamento : comportamento, comportamentoNovo, setComportamentoNovo);
                          setErroValidacaoEtapa4("");
                          limparErro('q38');
                        }}
                        className="w-4 h-4 text-[#EB6D57] accent-[#EB6D57] rounded border-slate-300 focus:ring-[#EB6D57] mr-2.5 shrink-0 shrink-0"
                      />
                      <span className="text-xs font-semibold text-slate-700">{comportamento}</span>
                    </label>
                  ))}
                </div>

                <div className="mt-3">
                  <label className="flex items-center p-2.5 sm:p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#EB6D57]/30 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5">
                    <input
                      type="checkbox"
                      checked={comportamentoNovo.includes("Outro")}
                      onChange={() => {
                        handleCheckboxToggle("Outro", comportamentoNovo, setComportamentoNovo);
                        setErroValidacaoEtapa4("");
                        limparErro('q38');
                      }}
                      className="w-4 h-4 text-[#EB6D57] accent-[#EB6D57] rounded border-slate-300 focus:ring-[#EB6D57] mr-2.5 shrink-0 shrink-0"
                    />
                    <span className="text-xs font-semibold text-slate-700">Outro comportamento</span>
                  </label>
                  {comportamentoNovo.includes("Outro") && (
                    <div className="animation-fade-in mt-3">
                      <input
                        type="text"
                        value={outroComportamentoNovoTexto}
                        onChange={(e) => {
                          setOutroComportamentoNovoTexto(e.target.value);
                          limparErro('q38');
                          limparErro('q38_outro');
                        }}
                        placeholder="Descreva o comportamento..."
                        className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                          errosValidacao['q38_outro']
                            ? 'border-red-400 ring-2 ring-red-100'
                            : 'border-slate-200 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57]'
                        }`}
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* BLOCO 5: HABILIDADES, UTENSÍLIOS E MASTIGAÇÃO (Q39, Q40, Q41) */}
              <div className="space-y-5 bg-slate-50/50 p-4 sm:p-6 rounded-2xl border border-slate-100">
                {/* Q39: Como ela costuma comer (OBRIGATÓRIA) */}
                <div
                  ref={q39Ref}
                  className={`p-3 rounded-xl border transition-all ${
                    errosValidacao['q39'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                  }`}
                >
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    39. Como ela costuma comer? (Pode marcar mais de um) <span className="text-red-500">*</span>
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
                        className={`flex items-center p-2.5 sm:p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#EB6D57]/30 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5 ${item.especial ? 'col-span-2 sm:col-span-3 border-dashed border-slate-300' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={utensilios.includes(item.nome)}
                          onChange={() => {
                            handleCheckboxToggle(item.nome, utensilios, setUtensilios);
                            limparErro('q39');
                          }}
                          className="w-4 h-4 text-[#EB6D57] accent-[#EB6D57] rounded border-slate-300 focus:ring-[#EB6D57] mr-2.5 shrink-0 shrink-0"
                        />
                        <span className="text-xs font-semibold text-slate-700 truncate">
                          {item.icone} {item.nome}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Q40: Independência */}
                <div className="pt-6 border-t border-slate-200/60">
                  <div
                    ref={q40Ref}
                    className={`p-3 rounded-xl border transition-all ${
                      errosValidacao['q40'] ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-transparent'
                    }`}
                  >
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      40. Ele(a) se alimenta de forma... <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        "Independente",
                        "Precisa de ajuda parcial",
                        "Precisa de ajuda frequente",
                        "Precisa de ajuda total"
                      ].map((opcao) => (
                        <label key={opcao} className="flex items-center p-2.5 sm:p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#EB6D57]/30 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5">
                          <input
                            type="radio"
                            name="independencia"
                            value={opcao}
                            checked={independencia === opcao}
                            onChange={(e) => {
                              setIndependencia(e.target.value);
                              limparErro('q40');
                            }}
                            className="sr-only"
                            required
                          />
                          <span className="text-xs font-semibold text-slate-700">{opcao}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Q41: Dificuldade de mastigação ou deglutição */}
                <div
                  ref={q41Ref}
                  className={`pt-6 border-t rounded-2xl transition-all p-4 ${
                    (errosValidacao['q41'] || (erroValidacaoEtapa4 && dificuldadeMastigacao.length === 0))
                      ? 'bg-red-50/40 border-red-300 ring-2 ring-red-200'
                      : 'border-slate-200/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      41. Você percebe alguma dificuldade de mastigação ou para engolir?<span className="whitespace-nowrap">&nbsp;<span className="text-red-500">*</span></span>
                    </label>
                    {(errosValidacao['q41'] || (erroValidacaoEtapa4 && dificuldadeMastigacao.length === 0)) && (
                      <span className="text-xs font-bold text-red-500 bg-red-100 px-2.5 py-1 rounded-md shrink-0">
                        Campo obrigatório
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      "Não",
                      "Mastiga pouco",
                      "Engole pedaços inteiros",
                      "Guarda comida na bochecha",
                      "Engasga com frequência",
                      "Tem ânsia ao engolir",
                      "Dificuldade com pedaços grandes",
                      "Cansaço para mastigar",
                      "Prefere consistências pastosas"
                    ].map((dif) => (
                      <label key={dif} className="flex items-center p-2.5 sm:p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#EB6D57]/30 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5">
                        <input
                          type="checkbox"
                          checked={dificuldadeMastigacao.includes(dif)}
                          onChange={() => {
                            handleCheckboxToggle(dif, dificuldadeMastigacao, setDificuldadeMastigacao, ["Não"]);
                            setErroValidacaoEtapa4("");
                            limparErro('q41');
                          }}
                          className="w-4 h-4 text-[#EB6D57] accent-[#EB6D57] rounded border-slate-300 focus:ring-[#EB6D57] mr-2.5 shrink-0 shrink-0"
                        />
                        <span className="text-xs font-semibold text-slate-700">{dif}</span>
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
            <div className="animation-fade-in space-y-6 sm:space-y-8">
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center h-12 w-12 bg-[#4C6C54]/10 rounded-xl mb-2.5">
                  <span className="text-2xl">⏰</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#4C6C54] mb-1.5">Rotina das Refeições</h1>
                <p className="text-xs text-slate-400 font-medium">Horários, ambiente, distrações e dinâmica familiar.</p>
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
                className={`space-y-6 p-4 sm:p-6 rounded-2xl border transition-all ${
                  (errosValidacao['q42'] || refeicoesIncompletas.length > 0)
                    ? 'bg-red-50/40 border-red-300 ring-2 ring-red-200'
                    : 'bg-slate-50/50 border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      42. Como costuma ser a rotina alimentar? (Horários aproximados)<span className="whitespace-nowrap">&nbsp;<span className="text-red-500">*</span></span>
                    </label>
                    <p className="text-sm text-slate-500">
                      Defina o horário habitual ou marque se a criança não tem o hábito de realizá-la.
                    </p>
                  </div>
                  {(errosValidacao['q42'] || refeicoesIncompletas.length > 0) && (
                    <span className="text-xs font-bold text-red-500 bg-red-100 px-2.5 py-1 rounded-md shrink-0">
                      Campo obrigatório
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: "cafeDaManha", label: "Café da manhã", icone: "☕" },
                    { key: "lancheManha", label: "Lanche da manhã", icone: "🍎" },
                    { key: "almoco", label: "Almoço", icone: "🍽️" },
                    { key: "lancheTarde", label: "Lanche da tarde", icone: "🥪" },
                    { key: "jantar", label: "Jantar", icone: "🍲" },
                    { key: "ceia", label: "Ceia", icone: "🥛" }
                  ].map((refItem) => {
                    const rKey = refItem.key as keyof typeof horarios;
                    const rData = horarios[rKey];
                    const isIncompleta = refeicoesIncompletas.includes(rKey);

                    return (
                      <div
                        key={refItem.key}
                        className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                          isIncompleta
                            ? 'bg-red-50/80 border-red-300 shadow-sm'
                            : 'bg-white border-slate-200 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
                            <span>{refItem.icone}</span> {refItem.label}
                          </span>
                          {isIncompleta && (
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-red-500 bg-red-100 px-2 py-0.5 rounded">
                              Obrigatório
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                          <input
                            type="time"
                            value={rData.horario}
                            disabled={rData.naoFaz}
                            onChange={(e) => handleHorarioChange(rKey, e.target.value)}
                            className={`flex-1 h-9 px-3 bg-slate-50 border rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4C6C54] transition-all disabled:opacity-30 disabled:bg-slate-100 ${
                              isIncompleta ? 'border-red-300 focus:border-red-400' : 'border-slate-200'
                            }`}
                          />
                          <label className="flex items-center gap-2 cursor-pointer select-none py-1">
                            <input
                              type="checkbox"
                              checked={rData.naoFaz}
                              onChange={() => handleNaoFazToggle(rKey)}
                              className="w-4 h-4 text-[#4C6C54] accent-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54]"
                            />
                            <span className="text-xs font-medium text-slate-500">
                              Não costuma fazer
                            </span>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BLOCO 2: LOCAL DA REFEIÇÃO (Q43) */}
              <div
                ref={q43Ref}
                className={`p-4 sm:p-6 rounded-2xl border transition-all ${
                  (errosValidacao['q43'] || (erroValidacaoEtapa5 && locaisRefeicao.length === 0))
                    ? 'bg-red-50/40 border-red-300 ring-2 ring-red-200'
                    : 'bg-slate-50/50 border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    43. Durante as refeições, geralmente a criança: <span className="text-red-500">*</span>
                  </label>
                  {(errosValidacao['q43'] || (erroValidacaoEtapa5 && locaisRefeicao.length === 0)) && (
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
                      className="flex items-center p-2.5 sm:p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#4C6C54]/30 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:ring-1 has-[:checked]:ring-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5"
                    >
                      <input
                        type="checkbox"
                        checked={locaisRefeicao.includes(local.nome)}
                        onChange={() => {
                          handleCheckboxToggle(local.nome, locaisRefeicao, setLocaisRefeicao);
                          setErroValidacaoEtapa5("");
                          limparErro('q43');
                        }}
                        className="w-4 h-4 text-[#4C6C54] accent-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-2.5 shrink-0 shrink-0"
                      />
                      <span className="text-xs font-semibold text-slate-700">
                        {local.icone} {local.nome}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="mt-3">
                  <label className="flex items-center p-2.5 sm:p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#4C6C54]/30 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:ring-1 has-[:checked]:ring-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5">
                    <input
                      type="checkbox"
                      checked={locaisRefeicao.includes("Outro")}
                      onChange={() => {
                        handleCheckboxToggle("Outro", locaisRefeicao, setLocaisRefeicao);
                        setErroValidacaoEtapa5("");
                        limparErro('q43');
                      }}
                      className="w-4 h-4 text-[#4C6C54] accent-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-2.5 shrink-0 shrink-0"
                    />
                    <span className="text-xs font-semibold text-slate-700">➕ Outro local</span>
                  </label>
                  {locaisRefeicao.includes("Outro") && (
                    <div className="animation-fade-in mt-3">
                      <input
                        type="text"
                        value={outroLocalRefeicaoTexto}
                        onChange={(e) => {
                          setOutroLocalRefeicaoTexto(e.target.value);
                          limparErro('q43');
                          limparErro('q43_outro');
                        }}
                        placeholder="Especifique em qual outro lugar ela costuma comer..."
                        className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                          errosValidacao['q43_outro']
                            ? 'border-red-400 ring-2 ring-red-100'
                            : 'border-slate-200 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54]'
                        }`}
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* BLOCO 3: USO DE TELAS (Q44) */}
              <div
                ref={q44Ref}
                className={`space-y-5 p-4 sm:p-6 rounded-2xl border transition-all ${
                  (errosValidacao['q44'] || erroValidacaoEtapa5)
                    ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200'
                    : 'bg-slate-50/50 border-slate-100'
                }`}
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    44. Usa telas durante as refeições? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"].map((opcao) => (
                      <label
                        key={opcao}
                        className="flex items-center justify-center p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:bg-[#4C6C54] has-[:checked]:text-white text-center group"
                      >
                        <input
                          type="radio"
                          name="usoTelas"
                          value={opcao}
                          checked={usoTelas === opcao}
                          onChange={(e) => {
                            setUsoTelas(e.target.value);
                            setErroValidacaoEtapa5("");
                            limparErro('q44');
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
                      <label className="block text-xs font-bold text-slate-700 uppercase">
                        O que acontece quando a tela é retirada? <span className="text-red-500">*</span>
                      </label>
                      {(errosValidacao['q44'] || (erroValidacaoEtapa5 && reacaoSemTela.length === 0)) && (
                        <span className="text-xs font-bold text-red-500 bg-red-100 px-2.5 py-1 rounded-md shrink-0">
                          Campo obrigatório
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        "Come normalmente",
                        "Come menos",
                        "Recusa totalmente",
                        "Chora ou faz birra",
                        "Fica irritada",
                        "Sai do local da refeição"
                      ].map((reacao) => (
                        <label
                          key={reacao}
                          className="flex items-center p-2.5 sm:p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#4C6C54]/30 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:ring-1 has-[:checked]:ring-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5"
                        >
                          <input
                            type="checkbox"
                            checked={reacaoSemTela.includes(reacao)}
                            onChange={() => {
                              handleCheckboxToggle(reacao, reacaoSemTela, setReacaoSemTela);
                              setErroValidacaoEtapa5("");
                              limparErro('q44');
                            }}
                            className="w-4 h-4 text-[#4C6C54] accent-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-2.5 shrink-0 shrink-0"
                          />
                          <span className="text-xs font-semibold text-slate-700">{reacao}</span>
                        </label>
                      ))}
                    </div>

                    <div className="mt-3">
                      <label className="flex items-center p-2.5 sm:p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#4C6C54]/30 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:ring-1 has-[:checked]:ring-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5">
                        <input
                          type="checkbox"
                          checked={reacaoSemTela.includes("Outro")}
                          onChange={() => {
                            handleCheckboxToggle("Outro", reacaoSemTela, setReacaoSemTela);
                            setErroValidacaoEtapa5("");
                            limparErro('q44');
                          }}
                          className="w-4 h-4 text-[#4C6C54] accent-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-2.5 shrink-0 shrink-0"
                        />
                        <span className="text-xs font-semibold text-slate-700">Outra reação</span>
                      </label>
                      {reacaoSemTela.includes("Outro") && (
                        <div className="animation-fade-in mt-3">
                          <input
                            type="text"
                            value={outraReacaoSemTelaTexto}
                            onChange={(e) => {
                              setOutraReacaoSemTelaTexto(e.target.value);
                              limparErro('q44');
                              limparErro('q44_outro');
                            }}
                            placeholder="Descreva o que acontece quando a tela é retirada..."
                            className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                              errosValidacao['q44_outro']
                                ? 'border-red-400 ring-2 ring-red-100'
                                : 'border-slate-200 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54]'
                            }`}
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
          {/* ETAPA 6 - FAMÍLIA E COMPORTAMENTO */}
          {/* ================================================================ */}
          {etapaAtual === 6 && (
            <div className="animation-fade-in space-y-6 sm:space-y-8">
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center h-12 w-12 bg-[#EB6D57]/10 rounded-xl mb-2.5">
                  <span className="text-2xl">👨‍👩‍👧</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#EB6D57] mb-1.5">Família e Comportamento</h1>
                <p className="text-xs text-slate-400 font-medium">Dinâmica familiar, estratégias e sentimentos à mesa.</p>
              </div>

              {erroValidacaoEtapa6 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold shadow-sm animation-fade-in">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{erroValidacaoEtapa6}</span>
                </div>
              )}

              {/* BLOCO 1: ATITUDES DIANTE DA RECUSA (Q45) */}
              <div
                ref={q45Ref}
                className={`p-4 sm:p-6 rounded-2xl border transition-all ${
                  (errosValidacao['q45'] || (erroValidacaoEtapa6 && acoesRecusa.length === 0))
                    ? 'bg-red-50/40 border-red-300 ring-2 ring-red-200'
                    : 'bg-slate-50/50 border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    45. Quando a criança recusa uma comida, o que você costuma fazer?<span className="whitespace-nowrap">&nbsp;<span className="text-red-500">*</span></span>
                  </label>
                  {(errosValidacao['q45'] || (erroValidacaoEtapa6 && acoesRecusa.length === 0)) && (
                    <span className="text-xs font-bold text-red-500 bg-red-100 px-2.5 py-1 rounded-md shrink-0">
                      Campo obrigatório
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mb-6">Pode marcar mais de uma opção:</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    "Retiro o alimento",
                    "Ofereço outra opção",
                    "Insisto para experimentar",
                    "Negocio",
                    "Distraio",
                    "Ofereço recompensa",
                    "Dou bronca",
                    "Obrigo",
                    "Tento colocar a comida na boca",
                    "Ignoro"
                  ].map((acao) => (
                    <label
                      key={acao}
                      className="flex items-center p-2.5 sm:p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#EB6D57]/30 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5"
                    >
                      <input
                        type="checkbox"
                        checked={acoesRecusa.includes(acao)}
                        onChange={() => {
                          handleCheckboxToggle(acao, acoesRecusa, setAcoesRecusa);
                          setErroValidacaoEtapa6("");
                          limparErro('q45');
                        }}
                        className="w-4 h-4 text-[#EB6D57] accent-[#EB6D57] rounded border-slate-300 focus:ring-[#EB6D57] mr-2.5 shrink-0 shrink-0"
                      />
                      <span className="text-xs font-semibold text-slate-700">{acao}</span>
                    </label>
                  ))}
                </div>

                <div className="mt-3">
                  <label className="flex items-center p-2.5 sm:p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#EB6D57]/30 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5">
                    <input
                      type="checkbox"
                      checked={acoesRecusa.includes("Outra")}
                      onChange={() => {
                        handleCheckboxToggle("Outra", acoesRecusa, setAcoesRecusa);
                        setErroValidacaoEtapa6("");
                        limparErro('q45');
                      }}
                      className="w-4 h-4 text-[#EB6D57] accent-[#EB6D57] rounded border-slate-300 focus:ring-[#EB6D57] mr-2.5 shrink-0 shrink-0"
                    />
                    <span className="text-xs font-semibold text-slate-700">Outra atitude</span>
                  </label>
                  {acoesRecusa.includes("Outra") && (
                    <div className="animation-fade-in mt-3">
                      <input
                        type="text"
                        value={outraAcaoRecusaTexto}
                        onChange={(e) => {
                          setOutraAcaoRecusaTexto(e.target.value);
                          limparErro('q45');
                          limparErro('q45_outro');
                        }}
                        placeholder="Descreva o que costuma fazer..."
                        className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                          errosValidacao['q45_outro']
                            ? 'border-red-400 ring-2 ring-red-100'
                            : 'border-slate-200 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57]'
                        }`}
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* BLOCO 2: FREQUÊNCIA DE SUBSTITUIÇÃO (Q46) */}
              <div
                ref={q46Ref}
                className={`p-4 sm:p-6 rounded-2xl border transition-all ${
                  (errosValidacao['q46'] || (erroValidacaoEtapa6 && !freqSubstituicao))
                    ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200'
                    : 'bg-slate-50/50 border-slate-100'
                }`}
              >
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    46. Com que frequência você oferece outra comida quando ela recusa a refeição?<span className="whitespace-nowrap">&nbsp;<span className="text-red-500">*</span></span>
                  </label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {["Nunca", "Raramente", "Às vezes", "Frequentemente", "Sempre"].map((opcao) => (
                    <label
                      key={opcao}
                      className="flex items-center justify-center p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:bg-[#EB6D57] has-[:checked]:text-white text-center group"
                    >
                      <input
                        type="radio"
                        name="freqSubstituicao"
                        value={opcao}
                        checked={freqSubstituicao === opcao}
                        onChange={(e) => {
                          setFreqSubstituicao(e.target.value);
                          setErroValidacaoEtapa6("");
                          limparErro('q46');
                          if (e.target.value === "Nunca") {
                            setMotivosSubstituicao([]);
                            setOutroMotivoSubstituicaoTexto("");
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

              {/* BLOCO 3: MOTIVOS DA SUBSTITUIÇÃO (Q47 CONDICIONAL) */}
              {freqSubstituicao && freqSubstituicao !== "Nunca" && (
                <div
                  ref={q47Ref}
                  className={`animation-fade-in p-4 sm:p-6 rounded-2xl border transition-all ${
                    (errosValidacao['q47'] || (erroValidacaoEtapa6 && motivosSubstituicao.length === 0))
                      ? 'bg-red-50/40 border-red-300 ring-2 ring-red-200'
                      : 'bg-slate-50/50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      47. Por que costuma oferecer outra opção?<span className="whitespace-nowrap">&nbsp;<span className="text-red-500">*</span></span>
                    </label>
                    {(errosValidacao['q47'] || (erroValidacaoEtapa6 && motivosSubstituicao.length === 0)) && (
                      <span className="text-xs font-bold text-red-500 bg-red-100 px-2.5 py-1 rounded-md shrink-0">
                        Campo obrigatório
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      "Medo de ficar com fome",
                      "Evitar choro ou estresse",
                      "Garantir que coma algo",
                      "Facilidade na rotina corrida",
                      "Dó da criança"
                    ].map((motivo) => (
                      <label
                        key={motivo}
                        className="flex items-center p-2.5 sm:p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#EB6D57]/30 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5"
                      >
                        <input
                          type="checkbox"
                          checked={motivosSubstituicao.includes(motivo)}
                          onChange={() => {
                            handleCheckboxToggle(motivo, motivosSubstituicao, setMotivosSubstituicao);
                            setErroValidacaoEtapa6("");
                            limparErro('q47');
                          }}
                          className="w-4 h-4 text-[#EB6D57] accent-[#EB6D57] rounded border-slate-300 focus:ring-[#EB6D57] mr-2.5 shrink-0 shrink-0"
                        />
                        <span className="text-xs font-semibold text-slate-700">{motivo}</span>
                      </label>
                    ))}
                  </div>

                  <div className="mt-3">
                    <label className="flex items-center p-2.5 sm:p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#EB6D57]/30 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5">
                      <input
                        type="checkbox"
                        checked={motivosSubstituicao.includes("Outro")}
                        onChange={() => {
                          handleCheckboxToggle("Outro", motivosSubstituicao, setMotivosSubstituicao);
                          setErroValidacaoEtapa6("");
                          limparErro('q47');
                        }}
                        className="w-4 h-4 text-[#EB6D57] accent-[#EB6D57] rounded border-slate-300 focus:ring-[#EB6D57] mr-2.5 shrink-0 shrink-0"
                      />
                      <span className="text-xs font-semibold text-slate-700">Outro motivo</span>
                    </label>
                    {motivosSubstituicao.includes("Outro") && (
                      <div className="animation-fade-in mt-3">
                        <input
                          type="text"
                          value={outroMotivoSubstituicaoTexto}
                          onChange={(e) => {
                            setOutroMotivoSubstituicaoTexto(e.target.value);
                            limparErro('q47');
                            limparErro('q47_outro');
                          }}
                          placeholder="Descreva o motivo..."
                          className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                            errosValidacao['q47_outro']
                              ? 'border-red-400 ring-2 ring-red-100'
                              : 'border-slate-200 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57]'
                          }`}
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* BLOCO 4: SENTIMENTOS DOS PAIS (Q48) */}
              <div
                ref={q48Ref}
                className={`p-4 sm:p-6 rounded-2xl border transition-all ${
                  (errosValidacao['q48'] || (erroValidacaoEtapa6 && sentimentosPais.length === 0))
                    ? 'bg-red-50/40 border-red-300 ring-2 ring-red-200'
                    : 'bg-slate-50/50 border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    48. Quando ela recusa uma refeição, você geralmente:<span className="whitespace-nowrap">&nbsp;<span className="text-red-500">*</span></span>
                  </label>
                  {(errosValidacao['q48'] || (erroValidacaoEtapa6 && sentimentosPais.length === 0)) && (
                    <span className="text-xs font-bold text-red-500 bg-red-100 px-2.5 py-1 rounded-md shrink-0">
                      Campo obrigatório
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    "Fica ansioso(a)",
                    "Fica irritado(a)",
                    "Sente culpa",
                    "Sente cansaço ou desânimo",
                    "Mantém a calma",
                    "Sente frustração"
                  ].map((sentimento) => (
                    <label
                      key={sentimento}
                      className="flex items-center p-2.5 sm:p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#EB6D57]/30 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5"
                    >
                      <input
                        type="checkbox"
                        checked={sentimentosPais.includes(sentimento)}
                        onChange={() => {
                          handleCheckboxToggle(sentimento, sentimentosPais, setSentimentosPais);
                          setErroValidacaoEtapa6("");
                          limparErro('q48');
                        }}
                        className="w-4 h-4 text-[#EB6D57] accent-[#EB6D57] rounded border-slate-300 focus:ring-[#EB6D57] mr-2.5 shrink-0 shrink-0"
                      />
                      <span className="text-xs font-semibold text-slate-700">{sentimento}</span>
                    </label>
                  ))}
                </div>

                <div className="mt-3">
                  <label className="flex items-center p-2.5 sm:p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#EB6D57]/30 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5">
                    <input
                      type="checkbox"
                      checked={sentimentosPais.includes("Outro")}
                      onChange={() => {
                        handleCheckboxToggle("Outro", sentimentosPais, setSentimentosPais);
                        setErroValidacaoEtapa6("");
                        limparErro('q48');
                      }}
                      className="w-4 h-4 text-[#EB6D57] accent-[#EB6D57] rounded border-slate-300 focus:ring-[#EB6D57] mr-2.5 shrink-0 shrink-0"
                    />
                    <span className="text-xs font-semibold text-slate-700">Outro sentimento</span>
                  </label>
                  {sentimentosPais.includes("Outro") && (
                    <div className="animation-fade-in mt-3">
                      <input
                        type="text"
                        value={outroSentimentoTexto}
                        onChange={(e) => {
                          setOutroSentimentoTexto(e.target.value);
                          limparErro('q48');
                          limparErro('q48_outro');
                        }}
                        placeholder="Descreva o que costuma sentir..."
                        className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                          errosValidacao['q48_outro']
                            ? 'border-red-400 ring-2 ring-red-100'
                            : 'border-slate-200 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57]'
                        }`}
                        required
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}


                    {/* ================================================================ */}
          {/* ETAPA 7 - SINAIS DE ATENÇÃO */}
          {/* ================================================================ */}
          {etapaAtual === 7 && (
            <div className="animation-fade-in space-y-6 sm:space-y-8">
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center h-12 w-12 bg-[#4C6C54]/10 rounded-xl mb-2.5">
                  <span className="text-2xl">⚠️</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#4C6C54] mb-1.5">Sinais de Atenção</h1>
                <p className="text-xs text-slate-400 font-medium">Marcadores nutricionais clínicos e comportamentos que merecem cuidado.</p>
              </div>

              {erroValidacaoEtapa7 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold shadow-sm animation-fade-in">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{erroValidacaoEtapa7}</span>
                </div>
              )}

              {/* BLOCO 1: SITUAÇÕES NUTRICIONAIS RECENTES (Q49) */}
              <div
                ref={q49Ref}
                className={`p-4 sm:p-6 rounded-2xl border transition-all ${
                  (errosValidacao['q49'] || (erroValidacaoEtapa7 && situacoesNutricionais.length === 0))
                    ? 'bg-red-50/40 border-red-300 ring-2 ring-red-200'
                    : 'bg-slate-50/50 border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    49. Nos últimos meses, aconteceu alguma dessas situações?<span className="whitespace-nowrap">&nbsp;<span className="text-red-500">*</span></span>
                  </label>
                  {(errosValidacao['q49'] || (erroValidacaoEtapa7 && situacoesNutricionais.length === 0)) && (
                    <span className="text-xs font-bold text-red-500 bg-red-100 px-2.5 py-1 rounded-md shrink-0">
                      Campo obrigatório
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    "Perda de peso",
                    "Dificuldade de ganhar peso",
                    "Dificuldade de crescer",
                    "Queda de cabelo",
                    "Unhas fracas",
                    "Palidez",
                    "Cansaço excessivo",
                    "Nenhuma das anteriores"
                  ].map((situacao) => (
                    <label
                      key={situacao}
                      className="flex items-center p-2.5 sm:p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#4C6C54]/30 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:ring-1 has-[:checked]:ring-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5"
                    >
                      <input
                        type="checkbox"
                        checked={situacoesNutricionais.includes(situacao)}
                        onChange={() => {
                          handleCheckboxToggle(situacao, situacoesNutricionais, setSituacoesNutricionais, ["Nenhuma das anteriores"]);
                          setErroValidacaoEtapa7("");
                          limparErro('q49');
                        }}
                        className="w-4 h-4 text-[#4C6C54] accent-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-2.5 shrink-0 shrink-0"
                      />
                      <span className="text-xs font-semibold text-slate-700">{situacao}</span>
                    </label>
                  ))}
                </div>

                <div className="mt-3">
                  <label className="flex items-center p-2.5 sm:p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#4C6C54]/30 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:ring-1 has-[:checked]:ring-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5">
                    <input
                      type="checkbox"
                      checked={situacoesNutricionais.includes("Outra")}
                      onChange={() => {
                        handleCheckboxToggle("Outra", situacoesNutricionais, setSituacoesNutricionais, ["Nenhuma das anteriores"]);
                        setErroValidacaoEtapa7("");
                        limparErro('q49');
                      }}
                      className="w-4 h-4 text-[#4C6C54] accent-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-2.5 shrink-0 shrink-0"
                    />
                    <span className="text-xs font-semibold text-slate-700">Outra situação</span>
                  </label>
                  {situacoesNutricionais.includes("Outra") && (
                    <div className="animation-fade-in mt-3">
                      <input
                        type="text"
                        value={outraSituacaoNutricionalTexto}
                        onChange={(e) => {
                          setOutraSituacaoNutricionalTexto(e.target.value);
                          limparErro('q49');
                          limparErro('q49_outro');
                        }}
                        placeholder="Descreva a situação..."
                        className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                          errosValidacao['q49_outro']
                            ? 'border-red-400 ring-2 ring-red-100'
                            : 'border-slate-200 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54]'
                        }`}
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* BLOCO 2: MEDOS ALIMENTARES (Q50) */}
              <div
                ref={q50Ref}
                className={`p-4 sm:p-6 rounded-2xl border transition-all ${
                  (errosValidacao['q50'] || (erroValidacaoEtapa7 && medosAlimentares.length === 0))
                    ? 'bg-red-50/40 border-red-300 ring-2 ring-red-200'
                    : 'bg-slate-50/50 border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    50. Ela evita alimentos por medo de:<span className="whitespace-nowrap">&nbsp;<span className="text-red-500">*</span></span>
                  </label>
                  {(errosValidacao['q50'] || (erroValidacaoEtapa7 && medosAlimentares.length === 0)) && (
                    <span className="text-xs font-bold text-red-500 bg-red-100 px-2.5 py-1 rounded-md shrink-0">
                      Campo obrigatório
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    "Engasgar",
                    "Vomitar",
                    "Sentir dor",
                    "Passar mal",
                    "Gosto ruim",
                    "Não saber o que é",
                    "Não se aplica"
                  ].map((medo) => (
                    <label
                      key={medo}
                      className="flex items-center p-2.5 sm:p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#4C6C54]/30 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:ring-1 has-[:checked]:ring-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5"
                    >
                      <input
                        type="checkbox"
                        checked={medosAlimentares.includes(medo)}
                        onChange={() => {
                          handleCheckboxToggle(medo, medosAlimentares, setMedosAlimentares, ["Não se aplica"]);
                          setErroValidacaoEtapa7("");
                          limparErro('q50');
                        }}
                        className="w-4 h-4 text-[#4C6C54] accent-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-2.5 shrink-0 shrink-0"
                      />
                      <span className="text-xs font-semibold text-slate-700">{medo}</span>
                    </label>
                  ))}
                </div>

                <div className="mt-3">
                  <label className="flex items-center p-2.5 sm:p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#4C6C54]/30 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:ring-1 has-[:checked]:ring-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5">
                    <input
                      type="checkbox"
                      checked={medosAlimentares.includes("Outro")}
                      onChange={() => {
                        handleCheckboxToggle("Outro", medosAlimentares, setMedosAlimentares, ["Não se aplica"]);
                        setErroValidacaoEtapa7("");
                        limparErro('q50');
                      }}
                      className="w-4 h-4 text-[#4C6C54] accent-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-2.5 shrink-0 shrink-0"
                    />
                    <span className="text-xs font-semibold text-slate-700">Outro medo</span>
                  </label>
                  {medosAlimentares.includes("Outro") && (
                    <div className="animation-fade-in mt-3">
                      <input
                        type="text"
                        value={outroMedoAlimentarTexto}
                        onChange={(e) => {
                          setOutroMedoAlimentarTexto(e.target.value);
                          limparErro('q50');
                          limparErro('q50_outro');
                        }}
                        placeholder="Descreva o medo..."
                        className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                          errosValidacao['q50_outro']
                            ? 'border-red-400 ring-2 ring-red-100'
                            : 'border-slate-200 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54]'
                        }`}
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* BLOCO 3: COMPORTAMENTOS ATÍPICOS (Q51) */}
              <div
                ref={q51Ref}
                className={`p-4 sm:p-6 rounded-2xl border transition-all ${
                  (errosValidacao['q51'] || (erroValidacaoEtapa7 && comportamentosAtipicos.length === 0))
                    ? 'bg-red-50/40 border-red-300 ring-2 ring-red-200'
                    : 'bg-slate-50/50 border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    51. Apresenta algum desses comportamentos?<span className="whitespace-nowrap">&nbsp;<span className="text-red-500">*</span></span>
                  </label>
                  {(errosValidacao['q51'] || (erroValidacaoEtapa7 && comportamentosAtipicos.length === 0)) && (
                    <span className="text-xs font-bold text-red-500 bg-red-100 px-2.5 py-1 rounded-md shrink-0">
                      Campo obrigatório
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    "Come coisas que não são comida (terra, papel, etc.)",
                    "Cheira excessivamente os alimentos",
                    "Lambe objetos ou alimentos",
                    "Cospe a comida discretamente",
                    "Limpa a boca excessivamente",
                    "Guarda comida na boca por muito tempo",
                    "Nenhum desses"
                  ].map((comportamento) => (
                    <label
                      key={comportamento}
                      className="flex items-center p-2.5 sm:p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#4C6C54]/30 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:ring-1 has-[:checked]:ring-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5"
                    >
                      <input
                        type="checkbox"
                        checked={comportamentosAtipicos.includes(comportamento)}
                        onChange={() => {
                          handleCheckboxToggle(comportamento, comportamentosAtipicos, setComportamentosAtipicos, ["Nenhum desses"]);
                          setErroValidacaoEtapa7("");
                          limparErro('q51');
                        }}
                        className="w-4 h-4 text-[#4C6C54] accent-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-2.5 shrink-0 shrink-0"
                      />
                      <span className="text-xs font-semibold text-slate-700">{comportamento}</span>
                    </label>
                  ))}
                </div>

                <div className="mt-3">
                  <label className="flex items-center p-2.5 sm:p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#4C6C54]/30 transition-all has-[:checked]:border-[#4C6C54] has-[:checked]:ring-1 has-[:checked]:ring-[#4C6C54] has-[:checked]:bg-[#4C6C54]/5">
                    <input
                      type="checkbox"
                      checked={comportamentosAtipicos.includes("Outro")}
                      onChange={() => {
                        handleCheckboxToggle("Outro", comportamentosAtipicos, setComportamentosAtipicos, ["Nenhum desses"]);
                        setErroValidacaoEtapa7("");
                        limparErro('q51');
                      }}
                      className="w-4 h-4 text-[#4C6C54] accent-[#4C6C54] rounded border-slate-300 focus:ring-[#4C6C54] mr-2.5 shrink-0 shrink-0"
                    />
                    <span className="text-xs font-semibold text-slate-700">Outro comportamento</span>
                  </label>
                  {comportamentosAtipicos.includes("Outro") && (
                    <div className="animation-fade-in mt-3">
                      <input
                        type="text"
                        value={outroComportamentoAtipicoTexto}
                        onChange={(e) => {
                          setOutroComportamentoAtipicoTexto(e.target.value);
                          limparErro('q51');
                          limparErro('q51_outro');
                        }}
                        placeholder="Descreva o comportamento..."
                        className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                          errosValidacao['q51_outro']
                            ? 'border-red-400 ring-2 ring-red-100'
                            : 'border-slate-200 focus:ring-[#4C6C54]/50 focus:border-[#4C6C54]'
                        }`}
                        required
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}


                    {/* ================================================================ */}
          {/* ETAPA 8 - ROTINA E OBJETIVOS */}
          {/* ================================================================ */}
          {etapaAtual === 8 && (
            <div className="animation-fade-in space-y-6 sm:space-y-8">
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center h-12 w-12 bg-[#EB6D57]/10 rounded-xl mb-2.5">
                  <span className="text-2xl">🎯</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#EB6D57] mb-1.5">Rotina e Objetivos</h1>
                <p className="text-xs text-slate-400 font-medium">Hidratação, fisiologia intestinal, interesses e expectativas.</p>
              </div>

              {erroValidacaoEtapa8 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold shadow-sm animation-fade-in">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>{erroValidacaoEtapa8}</span>
                </div>
              )}

              {/* BLOCO 1: HIDRATAÇÃO (Q52) */}
              <div
                ref={q52Ref}
                className={`p-4 sm:p-6 rounded-2xl border transition-all ${
                  (errosValidacao['q52'] || (erroValidacaoEtapa8 && !aguaQuantidade))
                    ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200'
                    : 'bg-slate-50/50 border-slate-100'
                }`}
              >
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    52. Aproximadamente quanto de água a criança bebe por dia?<span className="whitespace-nowrap">&nbsp;<span className="text-red-500">*</span></span>
                  </label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    "Menos de 500ml",
                    "500ml a 1 litro",
                    "1 a 1,5 litro",
                    "Mais de 1,5 litro",
                    "Não sei informar"
                  ].map((opcao) => (
                    <label
                      key={opcao}
                      className="flex items-center justify-center p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:bg-[#EB6D57] has-[:checked]:text-white text-center group"
                    >
                      <input
                        type="radio"
                        name="aguaQuantidade"
                        value={opcao}
                        checked={aguaQuantidade === opcao}
                        onChange={(e) => {
                          setAguaQuantidade(e.target.value);
                          setErroValidacaoEtapa8("");
                          limparErro('q52');
                        }}
                        className="sr-only"
                        required
                      />
                      <span className="font-bold text-slate-700 group-has-[:checked]:text-white text-xs sm:text-sm">
                        {opcao}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* BLOCO 2: INTESTINO E BRISTOL (Q53) */}
              <div
                ref={q53Ref}
                className={`space-y-6 p-4 sm:p-6 rounded-2xl border transition-all ${
                  (errosValidacao['q53'] || (erroValidacaoEtapa8 && (!freqIntestino || !tipoBristol || sintomasIntestino.length === 0)))
                    ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200'
                    : 'bg-slate-50/50 border-slate-100'
                }`}
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    53. Como costuma ser o funcionamento do intestino?<span className="whitespace-nowrap">&nbsp;<span className="text-red-500">*</span></span>
                  </label>
                  <p className="text-xs text-slate-500 mb-3">Com que frequência ela costuma evacuar?</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      "Mais de uma vez ao dia",
                      "Uma vez ao dia",
                      "A cada 2 dias",
                      "A cada 3 dias ou mais",
                      "Muito irregular"
                    ].map((freq) => (
                      <label
                        key={freq}
                        className="flex items-center justify-center p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:bg-[#EB6D57] has-[:checked]:text-white text-center group"
                      >
                        <input
                          type="radio"
                          name="freqIntestino"
                          value={freq}
                          checked={freqIntestino === freq}
                          onChange={(e) => {
                            setFreqIntestino(e.target.value);
                            setErroValidacaoEtapa8("");
                            limparErro('q53');
                          }}
                          className="sr-only"
                          required
                        />
                        <span className="font-bold text-slate-700 group-has-[:checked]:text-white text-xs">
                          {freq}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200/60">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Como costuma ser o aspecto das fezes? (Escala de Bristol)<span className="whitespace-nowrap">&nbsp;<span className="text-red-500">*</span></span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    {[
                      { tipo: "Tipo 1 e 2", desc: "Bolinhas duras / ressecadas (Constipação)", icon: "🪨" },
                      { tipo: "Tipo 3 e 4", desc: "Formato de salsicha, macias e suaves (Ideal)", icon: "✨" },
                      { tipo: "Tipo 5 e 6", desc: "Pedaços moles ou pastosas (Atenção)", icon: "💧" },
                      { tipo: "Tipo 7", desc: "Totalmente líquidas (Diarreia)", icon: "🌊" },
                      { tipo: "Varia muito", desc: "Alterna frequentemente entre duras e líquidas", icon: "🔄" },
                      { tipo: "Não sei avaliar", desc: "Não costumo observar", icon: "❓" }
                    ].map((item) => (
                      <label
                        key={item.tipo}
                        className="flex items-start p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5 has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57]"
                      >
                        <input
                          type="radio"
                          name="tipoBristol"
                          value={item.tipo}
                          checked={tipoBristol === item.tipo}
                          onChange={(e) => {
                            setTipoBristol(e.target.value);
                            setErroValidacaoEtapa8("");
                            limparErro('q53');
                          }}
                          className="w-4 h-4 text-[#EB6D57] accent-[#EB6D57] mt-0.5 mr-3 shrink-0 focus:ring-[#EB6D57]"
                          required
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span>{item.icon}</span> {item.tipo}
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200/60">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Apresenta algum destes sintomas intestinais?<span className="whitespace-nowrap">&nbsp;<span className="text-red-500">*</span></span>
                  </label>
                  <p className="text-xs text-slate-500 mb-3">Pode marcar mais de um:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      "Dor para evacuar",
                      "Sangue nas fezes",
                      "Fezes muito ressecadas",
                      "Fezes com restos visíveis de comida",
                      "Escape de fezes na roupa (escape fecal)",
                      "Faz muita força para evacuar",
                      "Segura a vontade de evacuar",
                      "Gases frequentes ou com cheiro forte",
                      "Nenhum desses"
                    ].map((sintoma) => (
                      <label
                        key={sintoma}
                        className="flex items-center p-2.5 sm:p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#EB6D57]/30 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5"
                      >
                        <input
                          type="checkbox"
                          checked={sintomasIntestino.includes(sintoma)}
                          onChange={() => {
                            handleCheckboxToggle(sintoma, sintomasIntestino, setSintomasIntestino, ["Nenhum desses"]);
                            setErroValidacaoEtapa8("");
                            limparErro('q53');
                          }}
                          className="w-4 h-4 text-[#EB6D57] accent-[#EB6D57] rounded border-slate-300 focus:ring-[#EB6D57] mr-2.5 shrink-0 shrink-0"
                        />
                        <span className="text-xs font-semibold text-slate-700">{sintoma}</span>
                      </label>
                    ))}
                  </div>

                  <div className="mt-3">
                    <label className="flex items-center p-2.5 sm:p-3 rounded-xl border border-white bg-white shadow-sm cursor-pointer hover:border-[#EB6D57]/30 transition-all has-[:checked]:border-[#EB6D57] has-[:checked]:ring-1 has-[:checked]:ring-[#EB6D57] has-[:checked]:bg-[#EB6D57]/5">
                      <input
                        type="checkbox"
                        checked={sintomasIntestino.includes("Outro")}
                        onChange={() => {
                          handleCheckboxToggle("Outro", sintomasIntestino, setSintomasIntestino, ["Nenhum desses"]);
                          setErroValidacaoEtapa8("");
                          limparErro('q53');
                        }}
                        className="w-4 h-4 text-[#EB6D57] accent-[#EB6D57] rounded border-slate-300 focus:ring-[#EB6D57] mr-2.5 shrink-0 shrink-0"
                      />
                      <span className="text-xs font-semibold text-slate-700">Outro sintoma</span>
                    </label>
                    {sintomasIntestino.includes("Outro") && (
                      <div className="animation-fade-in mt-3">
                        <input
                          type="text"
                          value={outroSintomaIntestinoTexto}
                          onChange={(e) => {
                            setOutroSintomaIntestinoTexto(e.target.value);
                            limparErro('q53');
                            limparErro('q53_outro');
                          }}
                          placeholder="Descreva o sintoma intestinal..."
                          className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                            errosValidacao['q53_outro']
                              ? 'border-red-400 ring-2 ring-red-100'
                              : 'border-slate-200 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57]'
                          }`}
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* BLOCO 3: HIPERFOCOS E MOTIVAÇÕES (Q54, Q55, Q56) */}
              <div className="space-y-6 bg-slate-50/50 p-4 sm:p-6 rounded-2xl border border-slate-100">
                {/* Q54: Hiperfocos */}
                <div
                  ref={q54Ref}
                  className={`p-3 rounded-xl border transition-all ${
                    (errosValidacao['q54'] || (erroValidacaoEtapa8 && !interessesFavoritos.trim()))
                      ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200'
                      : 'border-transparent'
                  }`}
                >
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    54. Quais são os interesses favoritos da criança? (Hiperfocos)<span className="whitespace-nowrap">&nbsp;<span className="text-red-500">*</span></span>
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    Ex: dinossauros, carros, números, personagens (Peppa, Patrulha Canina), cores, planetas... Usaremos esses temas para planejar as atividades lúdicas e a aproximação dos alimentos!
                  </p>
                  <textarea
                    value={interessesFavoritos}
                    onChange={(e) => {
                      setInteressesFavoritos(e.target.value);
                      setErroValidacaoEtapa8("");
                      limparErro('q54');
                    }}
                    placeholder="Liste os principais interesses, brinquedos favoritos ou temas que ela mais gosta..."
                    rows={3}
                    className={`w-full p-3 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold resize-none transition-all ${
                      errosValidacao['q54'] || (erroValidacaoEtapa8 && !interessesFavoritos.trim())
                        ? 'border-red-400 ring-2 ring-red-100'
                        : 'border-slate-200 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57]'
                    }`}
                    required
                  />
                </div>

                {/* Q55: Motivação da criança (OBRIGATÓRIA) */}
                <div className="pt-6 border-t border-slate-200/60">
                  <div
                    ref={q55Ref}
                    className={`p-3 rounded-xl border transition-all ${
                      (errosValidacao['q55'] || (erroValidacaoEtapa8 && !motivacaoCrianca.trim()))
                        ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200'
                        : 'border-transparent'
                    }`}
                  >
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      55. O que costuma motivar ou deixar sua criança muito feliz? <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-slate-500 mb-3">Resposta curta (obrigatório).</p>
                    <input
                      type="text"
                      value={motivacaoCrianca}
                      onChange={(e) => {
                        setMotivacaoCrianca(e.target.value);
                        setErroValidacaoEtapa8("");
                        limparErro('q55');
                      }}
                      placeholder="Ex: elogios, brincadeiras ao ar livre, construir blocos..."
                      className={`w-full h-10 px-3.5 bg-white border rounded-xl focus:outline-none focus:ring-2 text-xs sm:text-sm font-semibold transition-all ${
                        errosValidacao['q55'] || (erroValidacaoEtapa8 && !motivacaoCrianca.trim())
                          ? 'border-red-400 ring-2 ring-red-100'
                          : 'border-slate-200 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57]'
                      }`}
                      required
                    />
                  </div>
                </div>

                {/* Q56: Informação importante livre (opcional) */}
                <div className="pt-6 border-t border-slate-200/60">
                  <div ref={q56Ref} className="p-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                      56. Existe alguma informação importante sobre seu filho que não perguntamos?
                    </label>
                    <p className="text-xs text-slate-500 mb-3">Espaço livre para observações dos responsáveis (opcional).</p>
                    <textarea
                      value={informacoesAdicionais}
                      onChange={(e) => setInformacoesAdicionais(e.target.value)}
                      placeholder="Fique à vontade para compartilhar qualquer detalhe que julgar relevante..."
                      rows={3}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EB6D57]/50 focus:border-[#EB6D57] text-xs sm:text-sm font-semibold resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* FEEDBACK DE VALIDAÇÃO */}
          {mensagemToast && (
            <div className="p-3.5 sm:p-4 bg-red-50 border border-red-300 rounded-2xl flex items-center justify-between gap-3 text-red-700 text-xs sm:text-sm font-bold shadow-sm animation-fade-in">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
                <span>{mensagemToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setMensagemToast("")}
                className="text-red-400 hover:text-red-700 p-1 rounded-lg transition-colors cursor-pointer"
                aria-label="Fechar aviso"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* FLOATING TOAST NO CANTO INFERIOR */}
          {mensagemToast && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] sm:w-auto bg-red-600 text-white px-4 sm:px-5 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-bold animation-fade-in border border-red-500">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-5 w-5 shrink-0 text-white" />
                <span>{mensagemToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setMensagemToast("")}
                className="p-1 hover:bg-red-700/60 rounded-lg transition-colors cursor-pointer shrink-0 ml-2"
                aria-label="Fechar aviso"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* RODAPÉ DE NAVEGAÇÃO */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={voltarEtapa}
              disabled={etapaAtual === 1}
              className="flex items-center gap-1.5 px-5 py-2.5 font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl text-xs sm:text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" /> Voltar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md hover:shadow-lg hover:scale-[1.02] cursor-pointer"
            >
              {etapaAtual === totalEtapas ? "Finalizar Anamnese" : "Próximo Passo"}
              {etapaAtual === totalEtapas ? <CheckCircle2 className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}