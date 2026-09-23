// src/app/anamnese/validation.ts
/**
 * Módulo de validação pura e dados mock para o formulário de Anamnese.
 * Compartilhado entre a interface de usuário (Next.js) e os testes automatizados.
 */

export interface HorarioRefeicao {
  horario: string;
  naoFaz: boolean;
}

export interface AnamneseFormData {
  // Etapa 1
  nomeCrianca?: string;
  dataNascimento?: string;
  sexo?: string;
  nomeResponsavel?: string;
  parentesco?: string;
  outroParentescoTexto?: string;
  participaAlimentacao?: string[];
  outroParticipaTexto?: string;
  motivos?: string[];
  outroMotivoTexto?: string;
  diagnosticos?: string[];
  nivelTEA?: string;
  outroDiagnosticoTexto?: string;
  comunicacao?: string;
  outroComunicacaoTexto?: string;
  comunicacaoGeral?: string;

  // Etapa 2
  gestacao?: string[];
  gestacaoIntercorrencia?: string;
  semanasNascimento?: string;
  pesoNascer?: string;
  aleitamento?: string;
  aleitamentoFimMeses?: string;
  formulaInicioMeses?: string;
  dificuldadesAmamentacao?: string[];
  outroDificuldadeAmamentacaoTexto?: string;
  idadeInicioIA?: string;
  metodoIA?: string;
  outroMetodoIATexto?: string;
  dificuldadesIA?: string[];
  outroDificuldadeIATexto?: string;
  inicioDificuldadesAtuais?: string;
  eventosAssociados?: string[];
  outroEventoAssociadoTexto?: string;
  gastro?: string[];
  gastroDetalhes?: string;
  outroGastroTexto?: string;
  sintomasAdversos?: string;
  sintomasAdversosDetalhes?: string;
  pesoAtual?: string;
  dataMedidaPeso?: string;
  medidaPesoPor?: string;
  alturaAtual?: string;
  dataMedidaAltura?: string;
  medidaAlturaPor?: string;
  medicamentos?: string;
  medicamentosDetalhes?: string;
  suplementos?: string[];
  outroSuplementoTexto?: string;
  exames?: string;
  arquivosExamesCount?: number;

  // Etapa 3
  cereais?: string[];
  outroCerealTexto?: string;
  proteinas?: string[];
  outroProteinaTexto?: string;
  frutas?: string[];
  outroFrutaTexto?: string;
  vegetais?: string[];
  outroVegetalTexto?: string;
  leguminosas?: string[];
  outroLeguminosaTexto?: string;
  qntAlimentos?: string;

  // Etapa 4
  comerFora?: string;
  comerForaQual?: string;
  exigeTodoDia?: string;
  exigeTodoDiaQual?: string;
  sofrimentoFalta?: string;
  sofrimentoFaltaQual?: string;
  influencias?: string[];
  outraInfluenciaTexto?: string;
  mudancasMatriz?: {
    marca?: string;
    preparo?: string;
    apresentacao?: string;
    encostando?: string;
    misturados?: string;
  };
  comportamentoNovo?: string[];
  outroComportamentoNovoTexto?: string;
  utensilios?: string[];
  independencia?: string;
  dificuldadeMastigacao?: string[];

  // Etapa 5
  horarios?: Record<string, HorarioRefeicao>;
  locaisRefeicao?: string[];
  outroLocalRefeicaoTexto?: string;
  usoTelas?: string;
  reacaoSemTela?: string[];
  outraReacaoSemTelaTexto?: string;

  // Etapa 6
  acoesRecusa?: string[];
  outraAcaoRecusaTexto?: string;
  freqSubstituicao?: string;
  motivosSubstituicao?: string[];
  outroMotivoSubstituicaoTexto?: string;
  sentimentosPais?: string[];
  outroSentimentoTexto?: string;

  // Etapa 7
  situacoesNutricionais?: string[];
  outraSituacaoNutricionalTexto?: string;
  medosAlimentares?: string[];
  outroMedoAlimentarTexto?: string;
  comportamentosAtipicos?: string[];
  outroComportamentoAtipicoTexto?: string;

  // Etapa 8
  aguaQuantidade?: string;
  freqIntestino?: string;
  tipoBristol?: string;
  sintomasIntestino?: string[];
  outroSintomaIntestinoTexto?: string;
  interessesFavoritos?: string;
  motivacaoCrianca?: string;
  informacoesAdicionais?: string;
}

export interface ValidationResult {
  isValid: boolean;
  erros: Record<string, boolean>;
  refeicoesIncompletas?: string[];
  mensagemToast?: string;
  mensagemEtapa?: string;
}

export const HOJE = new Date().toISOString().split("T")[0];
export const DATA_MINIMA = "2006-01-01";

/**
 * Valida os dados da etapa fornecida.
 */
export function validarEtapa(etapa: number, data: AnamneseFormData): ValidationResult {
  const erros: Record<string, boolean> = {};
  let refeicoesIncompletas: string[] | undefined;
  let mensagemEtapa: string | undefined;

  // -------------------------------------------------------------
  // ETAPA 1
  // -------------------------------------------------------------
  if (etapa === 1) {
    if (!data.nomeCrianca?.trim()) erros['q1'] = true;
    if (!data.dataNascimento || data.dataNascimento > HOJE || data.dataNascimento < DATA_MINIMA) erros['q2'] = true;
    if (!data.sexo) erros['q3'] = true;
    if (!data.nomeResponsavel?.trim()) erros['q4'] = true;
    if (!data.parentesco) erros['q5'] = true;
    if (data.parentesco === "Outro" && !data.outroParentescoTexto?.trim()) {
      erros['q5'] = true;
      erros['q5_outro'] = true;
    }
    if (data.participaAlimentacao?.includes("Outro") && !data.outroParticipaTexto?.trim()) {
      erros['q6'] = true;
      erros['q6_outro'] = true;
    }
    if (!data.motivos || data.motivos.length === 0) erros['q7'] = true;
    if (data.motivos?.includes("Outro") && !data.outroMotivoTexto?.trim()) {
      erros['q7'] = true;
      erros['q7_outro'] = true;
    }
    if (data.diagnosticos?.includes("TEA") && !data.nivelTEA) {
      erros['q8'] = true;
      erros['q8_tea'] = true;
    }
    if (data.diagnosticos?.includes("Outro") && !data.outroDiagnosticoTexto?.trim()) {
      erros['q8'] = true;
      erros['q8_outro'] = true;
    }
    if (!data.comunicacao) erros['q9'] = true;
    if (data.comunicacao === "Outro" && !data.outroComunicacaoTexto?.trim()) {
      erros['q9'] = true;
      erros['q9_outro'] = true;
    }
    if (!data.comunicacaoGeral) erros['q10'] = true;
  }

  // -------------------------------------------------------------
  // ETAPA 2
  // -------------------------------------------------------------
  if (etapa === 2) {
    if (data.gestacao?.includes("Houve alguma intercorrência") && !data.gestacaoIntercorrencia?.trim()) {
      erros['q11'] = true;
      erros['q11_outro'] = true;
    }
    if (!data.semanasNascimento) erros['q12'] = true;
    if (!data.pesoNascer?.trim()) erros['q13'] = true;
    if (!data.aleitamento) {
      erros['q14'] = true;
    } else {
      if ((data.aleitamento === "Aleitamento materno" || data.aleitamento === "Ambos") && !data.aleitamentoFimMeses?.trim()) {
        erros['q14'] = true;
      }
      if ((data.aleitamento === "Fórmula infantil" || data.aleitamento === "Ambos") && !data.formulaInicioMeses?.trim()) {
        erros['q14'] = true;
      }
    }
    // Q15: Obrigatória ("Não", "Não sei" ou dificuldades)
    if (!data.dificuldadesAmamentacao || data.dificuldadesAmamentacao.length === 0) erros['q15'] = true;
    if (data.dificuldadesAmamentacao?.includes("Outra") && !data.outroDificuldadeAmamentacaoTexto?.trim()) {
      erros['q15'] = true;
      erros['q15_outro'] = true;
    }
    if (!data.idadeInicioIA?.trim()) erros['q16'] = true;
    if (!data.metodoIA) erros['q17'] = true;
    if (data.metodoIA === "Outro" && !data.outroMetodoIATexto?.trim()) {
      erros['q17'] = true;
      erros['q17_outro'] = true;
    }
    // Q18: Obrigatória ("Não" ou dificuldades)
    if (!data.dificuldadesIA || data.dificuldadesIA.length === 0) erros['q18'] = true;
    if (data.dificuldadesIA?.includes("Outra") && !data.outroDificuldadeIATexto?.trim()) {
      erros['q18'] = true;
      erros['q18_outro'] = true;
    }
    if (!data.inicioDificuldadesAtuais) erros['q19'] = true;
    // Q20: Obrigatória ("Não", "Não sei" ou eventos)
    if (!data.eventosAssociados || data.eventosAssociados.length === 0) erros['q20'] = true;
    if (data.eventosAssociados?.includes("Outro") && !data.outroEventoAssociadoTexto?.trim()) {
      erros['q20'] = true;
      erros['q20_outro'] = true;
    }
    // Q21: Obrigatória ("Nenhum" ou problemas)
    if (!data.gastro || data.gastro.length === 0) erros['q21'] = true;
    if (data.gastro?.includes("Outro") && !data.outroGastroTexto?.trim()) {
      erros['q21'] = true;
      erros['q21_outro'] = true;
    }
    if ((data.gastro?.includes("Alergia alimentar") || data.gastro?.includes("Intolerância alimentar")) && !data.gastroDetalhes?.trim()) {
      erros['q21'] = true;
      erros['q21_detalhes'] = true;
    }
    if (!data.sintomasAdversos) erros['q22'] = true;
    if (data.sintomasAdversos === "Sim" && !data.sintomasAdversosDetalhes?.trim()) {
      erros['q22'] = true;
    }
    // Q23: Dados mais recentes (Peso e Altura) + Validação de datas
    if (!data.pesoAtual?.trim() || !data.dataMedidaPeso || !data.medidaPesoPor) {
      erros['q23'] = true;
    }
    if (data.dataMedidaPeso) {
      if ((data.dataNascimento && data.dataMedidaPeso < data.dataNascimento) || data.dataMedidaPeso > HOJE) {
        erros['q23'] = true;
        erros['q23_data_peso'] = true;
      }
    }
    if (!data.alturaAtual?.trim() || !data.dataMedidaAltura || !data.medidaAlturaPor) {
      erros['q23'] = true;
    }
    if (data.dataMedidaAltura) {
      if ((data.dataNascimento && data.dataMedidaAltura < data.dataNascimento) || data.dataMedidaAltura > HOJE) {
        erros['q23'] = true;
        erros['q23_data_altura'] = true;
      }
    }
    if (!data.medicamentos) erros['q24'] = true;
    if (data.medicamentos === "Sim" && !data.medicamentosDetalhes?.trim()) {
      erros['q24'] = true;
    }
    // Q25: Obrigatória ("Não" ou suplementos)
    if (!data.suplementos || data.suplementos.length === 0) erros['q25'] = true;
    if (data.suplementos?.includes("Outro") && !data.outroSuplementoTexto?.trim()) {
      erros['q25'] = true;
      erros['q25_outro'] = true;
    }
    // Q26: Exames + condicional estrito de arquivo
    if (!data.exames) erros['q26'] = true;
    if (data.exames === "Sim" && (!data.arquivosExamesCount || data.arquivosExamesCount === 0)) {
      erros['q26'] = true;
      erros['q26_arquivo'] = true;
    }
  }

  // -------------------------------------------------------------
  // ETAPA 3 (Mapa Alimentar)
  // -------------------------------------------------------------
  if (etapa === 3) {
    if (!data.cereais || data.cereais.length === 0) erros['q27'] = true;
    if (data.cereais?.includes("➕ Outros") && !data.outroCerealTexto?.trim()) {
      erros['q27'] = true;
      erros['q27_outro'] = true;
    }
    if (!data.proteinas || data.proteinas.length === 0) erros['q28'] = true;
    if (data.proteinas?.includes("➕ Outras") && !data.outroProteinaTexto?.trim()) {
      erros['q28'] = true;
      erros['q28_outro'] = true;
    }
    if (!data.frutas || data.frutas.length === 0) erros['q29'] = true;
    if (data.frutas?.includes("➕ Outras") && !data.outroFrutaTexto?.trim()) {
      erros['q29'] = true;
      erros['q29_outro'] = true;
    }
    if (!data.vegetais || data.vegetais.length === 0) erros['q30'] = true;
    if (data.vegetais?.includes("➕ Outros") && !data.outroVegetalTexto?.trim()) {
      erros['q30'] = true;
      erros['q30_outro'] = true;
    }
    if (!data.leguminosas || data.leguminosas.length === 0) erros['q31'] = true;
    if (data.leguminosas?.includes("➕ Outras") && !data.outroLeguminosaTexto?.trim()) {
      erros['q31'] = true;
      erros['q31_outro'] = true;
    }
    if (!data.qntAlimentos) erros['q32'] = true;
  }

  // -------------------------------------------------------------
  // ETAPA 4 (Perfil Sensorial)
  // -------------------------------------------------------------
  if (etapa === 4) {
    if (!data.comerFora) erros['q33'] = true;
    if (data.comerFora === "Sim" && !data.comerForaQual?.trim()) {
      erros['q33'] = true;
      erros['q33_outro'] = true;
    }
    if (!data.exigeTodoDia) erros['q34'] = true;
    if (data.exigeTodoDia === "Sim" && !data.exigeTodoDiaQual?.trim()) {
      erros['q34'] = true;
      erros['q34_outro'] = true;
    }
    if (!data.sofrimentoFalta) erros['q35'] = true;
    if (data.sofrimentoFalta === "Sim" && !data.sofrimentoFaltaQual?.trim()) {
      erros['q35'] = true;
      erros['q35_outro'] = true;
    }
    // Q36: Obrigatória
    if (!data.influencias || data.influencias.length === 0) erros['q36'] = true;
    if (data.influencias?.includes("Outro") && !data.outraInfluenciaTexto?.trim()) {
      erros['q36'] = true;
      erros['q36_outro'] = true;
    }
    // Q37: Matriz todas preenchidas
    if (
      !data.mudancasMatriz?.marca ||
      !data.mudancasMatriz?.preparo ||
      !data.mudancasMatriz?.apresentacao ||
      !data.mudancasMatriz?.encostando ||
      !data.mudancasMatriz?.misturados
    ) {
      erros['q37'] = true;
    }
    if (!data.comportamentoNovo || data.comportamentoNovo.length === 0) {
      erros['q38'] = true;
      mensagemEtapa = "Por favor, selecione ao menos uma reação ao novo alimento (Pergunta 38).";
    }
    if (data.comportamentoNovo?.includes("Outro") && !data.outroComportamentoNovoTexto?.trim()) {
      erros['q38'] = true;
      erros['q38_outro'] = true;
    }
    // Q39: Obrigatória
    if (!data.utensilios || data.utensilios.length === 0) erros['q39'] = true;
    if (!data.independencia) erros['q40'] = true;
    if (!data.dificuldadeMastigacao || data.dificuldadeMastigacao.length === 0) {
      erros['q41'] = true;
      mensagemEtapa = "Por favor, selecione ao menos uma opção sobre mastigação e deglutição (Pergunta 41).";
    }
  }

  // -------------------------------------------------------------
  // ETAPA 5 (Rotina das Refeições)
  // -------------------------------------------------------------
  if (etapa === 5) {
    const faltantes: string[] = [];
    if (data.horarios) {
      (Object.keys(data.horarios) as string[]).forEach((refKey) => {
        const refData = data.horarios![refKey];
        if (!refData.horario && !refData.naoFaz) {
          faltantes.push(refKey);
        }
      });
    } else {
      faltantes.push("cafeDaManha", "lancheManha", "almoco", "lancheTarde", "jantar", "ceia");
    }

    if (faltantes.length > 0) {
      refeicoesIncompletas = faltantes;
      erros['q42'] = true;
      mensagemEtapa = "Por favor, defina o horário ou marque 'Não costuma fazer' em todas as refeições (Pergunta 42).";
    }

    if (!data.locaisRefeicao || data.locaisRefeicao.length === 0) {
      erros['q43'] = true;
      mensagemEtapa = "Por favor, selecione onde a criança geralmente realiza as refeições (Pergunta 43).";
    }
    if (data.locaisRefeicao?.includes("Outro") && !data.outroLocalRefeicaoTexto?.trim()) {
      erros['q43'] = true;
      erros['q43_outro'] = true;
    }

    if (!data.usoTelas) {
      erros['q44'] = true;
    }
    if (data.usoTelas && data.usoTelas !== "Nunca") {
      if (!data.reacaoSemTela || data.reacaoSemTela.length === 0) {
        erros['q44'] = true;
        mensagemEtapa = "Por favor, informe o que acontece quando a tela é retirada (Pergunta 44).";
      }
      if (data.reacaoSemTela?.includes("Outro") && !data.outraReacaoSemTelaTexto?.trim()) {
        erros['q44'] = true;
        erros['q44_outro'] = true;
      }
    }
  }

  // -------------------------------------------------------------
  // ETAPA 6 (Família e Comportamento)
  // -------------------------------------------------------------
  if (etapa === 6) {
    if (!data.acoesRecusa || data.acoesRecusa.length === 0) {
      erros['q45'] = true;
      mensagemEtapa = "Por favor, selecione ao menos uma atitude diante da recusa alimentar (Pergunta 45).";
    }
    if (data.acoesRecusa?.includes("Outra") && !data.outraAcaoRecusaTexto?.trim()) {
      erros['q45'] = true;
      erros['q45_outro'] = true;
    }

    if (!data.freqSubstituicao) {
      erros['q46'] = true;
      mensagemEtapa = "Por favor, informe com que frequência costuma oferecer outra opção (Pergunta 46).";
    }
    if (data.freqSubstituicao && data.freqSubstituicao !== "Nunca") {
      if (!data.motivosSubstituicao || data.motivosSubstituicao.length === 0) {
        erros['q47'] = true;
        mensagemEtapa = "Por favor, informe os motivos pelos quais costuma oferecer outra comida (Pergunta 47).";
      }
      if (data.motivosSubstituicao?.includes("Outro") && !data.outroMotivoSubstituicaoTexto?.trim()) {
        erros['q47'] = true;
        erros['q47_outro'] = true;
      }
    }

    if (!data.sentimentosPais || data.sentimentosPais.length === 0) {
      erros['q48'] = true;
      mensagemEtapa = "Por favor, selecione como você geralmente reage ou se sente diante da recusa (Pergunta 48).";
    }
    if (data.sentimentosPais?.includes("Outro") && !data.outroSentimentoTexto?.trim()) {
      erros['q48'] = true;
      erros['q48_outro'] = true;
    }
  }

  // -------------------------------------------------------------
  // ETAPA 7 (Sinais de Atenção)
  // -------------------------------------------------------------
  if (etapa === 7) {
    if (!data.situacoesNutricionais || data.situacoesNutricionais.length === 0) {
      erros['q49'] = true;
      mensagemEtapa = "Por favor, selecione ao menos uma situação nutricional recente (Pergunta 49).";
    }
    if (data.situacoesNutricionais?.includes("Outra") && !data.outraSituacaoNutricionalTexto?.trim()) {
      erros['q49'] = true;
      erros['q49_outro'] = true;
    }

    if (!data.medosAlimentares || data.medosAlimentares.length === 0) {
      erros['q50'] = true;
      mensagemEtapa = "Por favor, informe sobre os medos alimentares ou marque 'Não se aplica' (Pergunta 50).";
    }
    if (data.medosAlimentares?.includes("Outro") && !data.outroMedoAlimentarTexto?.trim()) {
      erros['q50'] = true;
      erros['q50_outro'] = true;
    }

    if (!data.comportamentosAtipicos || data.comportamentosAtipicos.length === 0) {
      erros['q51'] = true;
      mensagemEtapa = "Por favor, selecione ao menos uma opção sobre comportamentos atípicos (Pergunta 51).";
    }
    if (data.comportamentosAtipicos?.includes("Outro") && !data.outroComportamentoAtipicoTexto?.trim()) {
      erros['q51'] = true;
      erros['q51_outro'] = true;
    }
  }

  // -------------------------------------------------------------
  // ETAPA 8 (Rotina e Objetivos)
  // -------------------------------------------------------------
  if (etapa === 8) {
    if (!data.aguaQuantidade) {
      erros['q52'] = true;
      mensagemEtapa = "Por favor, informe a quantidade aproximada de água que a criança bebe (Pergunta 52).";
    }

    if (!data.freqIntestino || !data.tipoBristol || !data.sintomasIntestino || data.sintomasIntestino.length === 0) {
      erros['q53'] = true;
      mensagemEtapa = "Por favor, preencha a frequência, o aspecto das fezes (Bristol) e os sintomas intestinais (Pergunta 53).";
    }
    if (data.sintomasIntestino?.includes("Outro") && !data.outroSintomaIntestinoTexto?.trim()) {
      erros['q53'] = true;
      erros['q53_outro'] = true;
    }

    if (!data.interessesFavoritos?.trim()) {
      erros['q54'] = true;
      mensagemEtapa = "Por favor, descreva os interesses favoritos da criança para direcionarmos a terapia (Pergunta 54).";
    }

    // Q55: Obrigatória
    if (!data.motivacaoCrianca?.trim()) {
      erros['q55'] = true;
      mensagemEtapa = "Por favor, informe o que costuma motivar ou deixar sua criança muito feliz (Pergunta 55).";
    }
  }

  const isValid = Object.keys(erros).length === 0;

  return {
    isValid,
    erros,
    refeicoesIncompletas,
    mensagemToast: isValid ? undefined : "Por favor, responda a todos os campos obrigatórios assinalados com * para prosseguir.",
    mensagemEtapa
  };
}

/**
 * Retorna dados fictícios 100% válidos para preenchimento de teste rápido (Dev Autofill).
 */
export function getMockDataForEtapa(etapa: number): Partial<AnamneseFormData> {
  switch (etapa) {
    case 1:
      return {
        nomeCrianca: "Lucas Gabriel",
        dataNascimento: "2020-05-15",
        sexo: "Masculino",
        nomeResponsavel: "Mariana Silva Leles",
        parentesco: "Mãe",
        outroParentescoTexto: "",
        participaAlimentacao: ["Mãe", "Pai"],
        outroParticipaTexto: "",
        motivos: ["Come poucos alimentos", "Recusa verduras/legumes"],
        outroMotivoTexto: "",
        diagnosticos: ["Não"],
        nivelTEA: "",
        outroDiagnosticoTexto: "",
        comunicacao: "Verbal, adequada para idade",
        outroComunicacaoTexto: "",
        comunicacaoGeral: "Sim, na maioria das situações"
      };

    case 2:
      return {
        gestacao: ["Sem intercorrências"],
        gestacaoIntercorrencia: "",
        semanasNascimento: "39–40 semanas",
        pesoNascer: "3,35",
        aleitamento: "Aleitamento materno",
        aleitamentoFimMeses: "12",
        formulaInicioMeses: "",
        dificuldadesAmamentacao: ["Não"],
        outroDificuldadeAmamentacaoTexto: "",
        idadeInicioIA: "6",
        metodoIA: "BLW",
        outroMetodoIATexto: "",
        dificuldadesIA: ["Não"],
        outroDificuldadeIATexto: "",
        inicioDificuldadesAtuais: "1–2 anos",
        eventosAssociados: ["Não"],
        outroEventoAssociadoTexto: "",
        gastro: ["Nenhum"],
        gastroDetalhes: "",
        outroGastroTexto: "",
        sintomasAdversos: "Não",
        sintomasAdversosDetalhes: "",
        pesoAtual: "16,4",
        dataMedidaPeso: "2024-02-10",
        medidaPesoPor: "Profissional",
        alturaAtual: "103,5",
        dataMedidaAltura: "2024-02-10",
        medidaAlturaPor: "Profissional",
        medicamentos: "Não",
        medicamentosDetalhes: "",
        suplementos: ["Vitamina D"],
        outroSuplementoTexto: "",
        exames: "Não",
        arquivosExamesCount: 0
      };

    case 3:
      return {
        cereais: ["🍚 Arroz", "🥔 Batata", "🥖 Pão"],
        outroCerealTexto: "",
        proteinas: ["🍗 Frango", "🥚 Ovo"],
        outroProteinaTexto: "",
        frutas: ["🍌 Banana", "🍎 Maçã", "🍉 Melancia"],
        outroFrutaTexto: "",
        vegetais: ["🥕 Cenoura", "🥦 Brócolis"],
        outroVegetalTexto: "",
        leguminosas: ["🫘 Feijão"],
        outroLeguminosaTexto: "",
        qntAlimentos: "11–20"
      };

    case 4:
      return {
        comerFora: "Não",
        comerForaQual: "",
        exigeTodoDia: "Não",
        exigeTodoDiaQual: "",
        sofrimentoFalta: "Não",
        sofrimentoFaltaQual: "",
        influencias: ["Textura", "Sabor", "Aparência"],
        outraInfluenciaTexto: "",
        mudancasMatriz: {
          marca: "Aceita bem",
          preparo: "Estranha mas come",
          apresentacao: "Aceita bem",
          encostando: "Aceita bem",
          misturados: "Estranha mas come"
        },
        comportamentoNovo: ["Aceita tocar ou cheirar"],
        outroComportamentoNovoTexto: "",
        utensilios: ["Colher", "Garfo", "Copo"],
        independencia: "Independente",
        dificuldadeMastigacao: ["Não"]
      };

    case 5:
      return {
        horarios: {
          cafeDaManha: { horario: "07:30", naoFaz: false },
          lancheManha: { horario: "10:00", naoFaz: false },
          almoco: { horario: "12:30", naoFaz: false },
          lancheTarde: { horario: "16:00", naoFaz: false },
          jantar: { horario: "19:30", naoFaz: false },
          ceia: { horario: "", naoFaz: true }
        },
        locaisRefeicao: ["Come à mesa"],
        outroLocalRefeicaoTexto: "",
        usoTelas: "Nunca",
        reacaoSemTela: [],
        outraReacaoSemTelaTexto: ""
      };

    case 6:
      return {
        acoesRecusa: ["Retiro o alimento", "Ofereço outra opção"],
        outraAcaoRecusaTexto: "",
        freqSubstituicao: "Raramente",
        motivosSubstituicao: ["Garantir que coma algo"],
        outroMotivoSubstituicaoTexto: "",
        sentimentosPais: ["Mantém a calma"],
        outroSentimentoTexto: ""
      };

    case 7:
      return {
        situacoesNutricionais: ["Nenhuma das anteriores"],
        outraSituacaoNutricionalTexto: "",
        medosAlimentares: ["Não se aplica"],
        outroMedoAlimentarTexto: "",
        comportamentosAtipicos: ["Nenhum desses"],
        outroComportamentoAtipicoTexto: ""
      };

    case 8:
      return {
        aguaQuantidade: "500ml a 1 litro",
        freqIntestino: "Uma vez ao dia",
        tipoBristol: "Tipo 3 e 4",
        sintomasIntestino: ["Nenhum desses"],
        outroSintomaIntestinoTexto: "",
        interessesFavoritos: "Dinossauros, Legos e carros de corrida",
        motivacaoCrianca: "Brincadeiras no parquinho ao ar livre",
        informacoesAdicionais: "Criança muito participativa em jogos educativos."
      };

    default:
      return {};
  }
}
