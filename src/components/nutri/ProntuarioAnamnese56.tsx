"use client";

import { useMemo } from "react";
import { AlertTriangle, Copy, FileEdit, Sparkles, CheckCircle2 } from "lucide-react";

interface ProntuarioAnamnese56Props {
  respostas: Record<string, any> | undefined | null;
  onCopiarAnotacoes: (texto: string) => void;
  onAbrirRascunhoDevolutiva: (titulo: string, parecer: string, metas: string[]) => void;
}

export interface ItemPergunta {
  numero: number;
  pergunta: string;
  resposta: string;
  pontoAtencao?: boolean;
  motivoAtencao?: string;
  sugestaoConduta?: string;
  metasSugeridas?: string[];
}

export interface SecaoProntuario {
  titulo: string;
  numeroSecao: number;
  itens: ItemPergunta[];
}

export function formatarValorProntuario(val: any, fallback = "Não informado"): string {
  if (val === undefined || val === null || val === "") return fallback;
  if (Array.isArray(val)) {
    const filtrados = val.filter((v) => Boolean(v) && typeof v === "string");
    return filtrados.length > 0 ? filtrados.join(", ") : fallback;
  }
  if (typeof val === "object") {
    const entries = Object.entries(val)
      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
      .filter(Boolean);
    return entries.length > 0 ? entries.join(" | ") : fallback;
  }
  return String(val);
}

export function obterSecoesProntuario(respostas: Record<string, any> | undefined | null): SecaoProntuario[] {
  const resp = respostas || {};
  const formatarValor = formatarValorProntuario;
  // Helper de detecção textual
  const temTexto = (val: any, termos: string[]): boolean => {
    const str = (Array.isArray(val) ? val.join(" ") : String(val || "")).toLowerCase();
    return termos.some((t) => str.includes(t.toLowerCase()));
  };

    // ==========================================
    // SEÇÃO 1: CONHECENDO A CRIANÇA E A FAMÍLIA
    // ==========================================
    const diag = resp.diagnosticos || [];
    const ehNeurodivergente = temTexto(diag, [
      "tea",
      "autism",
      "tdah",
      "apraxia",
      "atraso",
      "sensorial",
      "sindrome",
    ]);

    const comunicacaoResp = resp.comunicacao || resp.comunicacaoGeral || "";
    const comunicacaoComApoio = temTexto(comunicacaoResp, [
      "nao verbal",
      "aponta",
      "choro",
      "grito",
      "apoio",
      "poucas palavras",
    ]);

    const secao1: SecaoProntuario = {
      numeroSecao: 1,
      titulo: "1. Conhecendo a Criança e a Família",
      itens: [
        {
          numero: 1,
          pergunta: "Nome completo da Criança",
          resposta: formatarValor(resp.nomeCrianca, "Não preenchido"),
        },
        {
          numero: 2,
          pergunta: "Data de Nascimento / Idade",
          resposta: formatarValor(resp.dataNascimento),
        },
        {
          numero: 3,
          pergunta: "Sexo da Criança",
          resposta: formatarValor(resp.sexo),
        },
        {
          numero: 4,
          pergunta: "Nome do Responsável",
          resposta: formatarValor(resp.nomeResponsavel),
        },
        {
          numero: 5,
          pergunta: "Grau de Parentesco",
          resposta: formatarValor(resp.parentesco || resp.outroParentescoTexto),
        },
        {
          numero: 6,
          pergunta: "Quem participa da rotina alimentar da criança",
          resposta: formatarValor(resp.participaAlimentacao || resp.outroParticipaTexto),
        },
        {
          numero: 7,
          pergunta: "Principais motivos da consulta / queixas",
          resposta: formatarValor(resp.motivos || resp.outroMotivoTexto),
        },
        {
          numero: 8,
          pergunta: "Diagnósticos médicos ou hipóteses (TEA, TDAH, Apraxia)",
          resposta: formatarValor(resp.diagnosticos || resp.outroDiagnosticoTexto),
          pontoAtencao: ehNeurodivergente,
          motivoAtencao: "Presença de perfil neurodivergente ou atraso no desenvolvimento oral.",
          sugestaoConduta:
            "Ajustar a abordagem sensorial considerando o perfil neurodivergente (máxima previsibilidade, prato de apoio sem cobrança, diminuição de estímulos concorrentes e rotina visual de refeição).",
          metasSugeridas: [
            "Manter o mesmo horário e assento previsível nas refeições principais",
            "Avisar com 5 minutos de antecedência antes de iniciar o momento da refeição",
          ],
        },
        {
          numero: 9,
          pergunta: "Nível e forma de comunicação da criança",
          resposta: formatarValor(comunicacaoResp || resp.outroComunicacaoTexto),
          pontoAtencao: comunicacaoComApoio,
          motivoAtencao: "Comunicação não-verbal ou com suporte; frustração expressa por comportamento.",
          sugestaoConduta:
            "Utilizar suportes visuais de escolha (cartões de alimentos, 'prato do sim' e 'prato de apoio') para que a criança sinalize seu limite sem necessidade de crises ou choro.",
          metasSugeridas: [
            "Disponibilizar um prato de apoio neutro onde a criança pode colocar o que não quiser comer",
          ],
        },
      ],
    };

    // ==========================================
    // SEÇÃO 2: HISTÓRICO DE SAÚDE & ALEITAMENTO
    // ==========================================
    const semanas = parseInt(resp.semanasNascimento || "40", 10);
    const prematuro = !isNaN(semanas) && semanas < 37 && semanas > 0;
    const difIA = resp.dificuldadesIA || [];
    const teveEngasgosIA = temTexto(difIA, ["engasg", "nausea", "vomito", "gag", "pedaco", "recusa"]);
    const gastroSintomas = resp.gastro || [];
    const temGastro = temTexto(gastroSintomas, ["refluxo", "aplv", "alergia", "dor", "constip", "vomit"]);

    const secao2: SecaoProntuario = {
      numeroSecao: 2,
      titulo: "2. Histórico de Saúde, Parto & Introdução Alimentar",
      itens: [
        {
          numero: 10,
          pergunta: "Gestação e intercorrências no parto",
          resposta: formatarValor(resp.gestacao || resp.gestacaoIntercorrencia),
        },
        {
          numero: 11,
          pergunta: "Semanas gestacionais ao nascimento",
          resposta: resp.semanasNascimento ? `${resp.semanasNascimento} semanas` : "A termo",
          pontoAtencao: prematuro,
          motivoAtencao: "Nascimento prematuro (< 37 semanas).",
          sugestaoConduta:
            "Considerar idade corrigida e histórico de imaturidade motora-oral na progressão de texturas.",
        },
        {
          numero: 12,
          pergunta: "Peso ao nascer",
          resposta: formatarValor(resp.pesoNascer),
        },
        {
          numero: 13,
          pergunta: "Histórico de aleitamento e fórmula infantil",
          resposta: `Aleitamento: ${formatarValor(resp.aleitamento)} • Até: ${formatarValor(resp.aleitamentoFimMeses, "N/I")} meses • Fórmula: ${formatarValor(resp.formulaInicioMeses, "N/I")} meses`,
        },
        {
          numero: 14,
          pergunta: "Dificuldades na amamentação / sucção",
          resposta: formatarValor(resp.dificuldadesAmamentacao || resp.outroDificuldadeAmamentacaoTexto),
        },
        {
          numero: 15,
          pergunta: "Idade de início da Introdução Alimentar",
          resposta: formatarValor(resp.idadeInicioIA),
        },
        {
          numero: 16,
          pergunta: "Método de Introdução Alimentar",
          resposta: formatarValor(resp.metodoIA || resp.outroMetodoIATexto),
        },
        {
          numero: 17,
          pergunta: "Dificuldades na Introdução Alimentar (engasgos, gag, recusa de pedaços)",
          resposta: formatarValor(resp.dificuldadesIA || resp.outroDificuldadeIATexto),
          pontoAtencao: teveEngasgosIA,
          motivoAtencao: "Histórico de engasgos, ânsia exacerbada (gag) ou trauma na introdução alimentar.",
          sugestaoConduta:
            "Trabalhar dessensibilização oral com alimentos crocantes longos (mordedores sensoriais alimentares) que estimulam lateralização da língua sem risco de esfarelar no fundo da garganta.",
          metasSugeridas: [
            "Oferecer palitos firmes de cenoura assada ou biscoito longo para exploração motora sem cobrança de engolir",
          ],
        },
        {
          numero: 18,
          pergunta: "Início das dificuldades alimentares atuais",
          resposta: formatarValor(resp.inicioDificuldadesAtuais),
        },
        {
          numero: 19,
          pergunta: "Eventos associados ao início das recusas",
          resposta: formatarValor(resp.eventosAssociados || resp.outroEventoAssociadoTexto),
        },
        {
          numero: 20,
          pergunta: "Histórico gastrointestinal (refluxo, APLV, dores)",
          resposta: formatarValor(resp.gastro || resp.gastroDetalhes || resp.outroGastroTexto),
          pontoAtencao: temGastro,
          motivoAtencao: "Sintomas gastrointestinais presentes (refluxo, APLV ou desconforto associado à digestão).",
          sugestaoConduta:
            "A dor digestiva prévia pode ter gerado aversão condicionada à alimentação. Investigar conforto gástrico pós-refeição e evitar combinações ácidas ou com alta densidade lipídica.",
        },
        {
          numero: 21,
          pergunta: "Sintomas adversos após comer (tosse, soluço, distensão)",
          resposta: formatarValor(resp.sintomasAdversos || resp.sintomasAdversosDetalhes),
        },
        {
          numero: 22,
          pergunta: "Peso atual e data da medida",
          resposta: `${formatarValor(resp.pesoAtual)} (medido em ${formatarValor(resp.dataMedidaPeso)})`,
        },
        {
          numero: 23,
          pergunta: "Estatura atual e data da medida",
          resposta: `${formatarValor(resp.alturaAtual)} (medido em ${formatarValor(resp.dataMedidaAltura)})`,
        },
        {
          numero: 24,
          pergunta: "Medicamentos de uso contínuo",
          resposta: formatarValor(resp.medicamentos || resp.medicamentosDetalhes),
        },
        {
          numero: 25,
          pergunta: "Suplementação alimentar / vitaminas",
          resposta: formatarValor(resp.suplementos || resp.outroSuplementoTexto),
        },
        {
          numero: 26,
          pergunta: "Exames de sangue ou imagem recentes",
          resposta: formatarValor(resp.exames),
        },
      ],
    };

    // ==========================================
    // SEÇÃO 3: MAPA ALIMENTAR & REPERTÓRIO ATUAL
    // ==========================================
    const proteinasLista = resp.proteinas || [];
    const frutasLista = resp.frutas || [];
    const vegetaisLista = resp.vegetais || [];
    const semProteinas = Array.isArray(proteinasLista) && proteinasLista.length <= 1;
    const semVegetais = Array.isArray(vegetaisLista) && vegetaisLista.length === 0;
    const semFrutas = Array.isArray(frutasLista) && frutasLista.length === 0;
    const qntStr = (resp.qntAlimentos || "").toLowerCase();
    const seletividadeSevera = qntStr.includes("menos de 5") || qntStr.includes("menos de 10") || qntStr.includes("menos de 15");

    const secao3: SecaoProntuario = {
      numeroSecao: 3,
      titulo: "3. Mapa Alimentar & Repertório Aceito",
      itens: [
        {
          numero: 27,
          pergunta: "Cereais, pães e tubérculos aceitos",
          resposta: formatarValor(resp.cereais || resp.outroCerealTexto),
        },
        {
          numero: 28,
          pergunta: "Proteínas aceitas (carnes, ovos, laticínios)",
          resposta: formatarValor(resp.proteinas || resp.outroProteinaTexto),
          pontoAtencao: semProteinas,
          motivoAtencao: "Apenas 1 ou nenhuma fonte de proteína aceita.",
          sugestaoConduta:
            "Trabalhar fontes alternativas em textura de conforto (ex: farinhas enriquecidas, pasta de sementes, ovos em preparações crocantes) para garantir o aporte de ferro e zinco.",
          metasSugeridas: [
            "Testar uma pequena variação de formato na proteína aceita (ex: frango desfiado levemente tostado)",
          ],
        },
        {
          numero: 29,
          pergunta: "Frutas consumidas atualmente",
          resposta: formatarValor(resp.frutas || resp.outroFrutaTexto),
          pontoAtencao: semFrutas,
          motivoAtencao: "Nenhuma fruta aceita na rotina.",
          sugestaoConduta:
            "Iniciar pela etapa de visualização e cheiro: cortar maçã em fatias ultra-finas (chips) e convidar a criança a ajudar a lavar as frutas.",
        },
        {
          numero: 30,
          pergunta: "Vegetais e legumes aceitos",
          resposta: formatarValor(resp.vegetais || resp.outroVegetalTexto),
          pontoAtencao: semVegetais,
          motivoAtencao: "Nenhum legume ou vegetal aceito na rotina alimentar.",
          sugestaoConduta:
            "Focar nos degraus iniciais da Escada do Comer: colocar uma rodela de cenoura ou florzinha de brócolis apenas no prato de apoio, sem exigência de provar ou engolir.",
          metasSugeridas: [
            "Manter 1 vegetal de teste no pratinho de apoio em pelo menos 3 almoços da semana",
          ],
        },
        {
          numero: 31,
          pergunta: "Leguminosas aceitas (feijões, lentilha, grão-de-bico)",
          resposta: formatarValor(resp.leguminosas || resp.outroLeguminosaTexto),
        },
        {
          numero: 32,
          pergunta: "Quantidade total estimada de alimentos no repertório",
          resposta: formatarValor(resp.qntAlimentos),
          pontoAtencao: seletividadeSevera,
          motivoAtencao: "Seletividade alimentar severa (< 15 alimentos no cardápio total).",
          sugestaoConduta:
            "Priorizar a preservação dos alimentos seguros. Evitar a 'queima' de alimentos de conforto mantendo pequenas rotações de apresentação e temperatura.",
          metasSugeridas: [
            "Garantir a presença de pelo menos 1 alimento de segurança 100% garantido em todas as refeições",
          ],
        },
      ],
    };

    // ==========================================
    // SEÇÃO 4: PERFIL SENSORIAL & COMPORTAMENTO
    // ==========================================
    const sofrimentoFaltaResp = resp.sofrimentoFalta || "";
    const sofrimentoSevero = temTexto(sofrimentoFaltaResp, ["choro", "desespero", "jejum", "fome", "grita"]);
    const mudancas = resp.mudancasMatriz || {};
    const rigidezMarcas = temTexto(mudancas.marca, ["nao aceita", "recusa", "so a mesma", "mesma marca"]);
    const naoEncosta = temTexto(mudancas.encostando, ["nao aceita", "recusa", "separa", "nojo"]);
    const mastigacaoDif = resp.dificuldadeMastigacao || [];
    const temDifMastigacao = temTexto(mastigacaoDif, ["engole sem mastigar", "cansaco", "acumula", "bochecha", "baba"]);

    const secao4: SecaoProntuario = {
      numeroSecao: 4,
      titulo: "4. Perfil Sensorial & Comportamento à Mesa",
      itens: [
        {
          numero: 33,
          pergunta: "Comer fora de casa / festas / restaurantes",
          resposta: formatarValor(resp.comerFora || resp.comerForaQual),
        },
        {
          numero: 34,
          pergunta: "Alimento que exige todos os dias",
          resposta: formatarValor(resp.exigeTodoDia || resp.exigeTodoDiaQual),
        },
        {
          numero: 35,
          pergunta: "Reação se faltar o alimento de conforto",
          resposta: formatarValor(resp.sofrimentoFalta || resp.sofrimentoFaltaQual),
          pontoAtencao: sofrimentoSevero,
          motivoAtencao: "Sofrimento intenso ou jejum voluntário prolongado na ausência do alimento de conforto.",
          sugestaoConduta:
            "Regra de Ouro: nunca retirar abruptamente o alimento de segurança. Usá-lo como âncora afetiva para apresentar novas aproximações ao lado.",
        },
        {
          numero: 36,
          pergunta: "Influências sensoriais marcantes (cheiro, textura, ruído)",
          resposta: formatarValor(resp.influencias || resp.outraInfluenciaTexto),
        },
        {
          numero: 37,
          pergunta: "Rigidez com marcas comerciais específicas",
          resposta: formatarValor(mudancas.marca),
          pontoAtencao: rigidezMarcas,
          motivoAtencao: "Alta rigidez de marcas comerciais e embalagens.",
          sugestaoConduta:
            "Transição em degraus: transferir o alimento aceito para um pote transparente e, mais tarde, introduzir sutilmente variações da mesma categoria no mesmo pote.",
        },
        {
          numero: 38,
          pergunta: "Rigidez na forma de preparo",
          resposta: formatarValor(mudancas.preparo),
        },
        {
          numero: 39,
          pergunta: "Rigidez na apresentação visual do prato",
          resposta: formatarValor(mudancas.apresentacao),
        },
        {
          numero: 40,
          pergunta: "Reação a alimentos encostando uns nos outros",
          resposta: formatarValor(mudancas.encostando),
          pontoAtencao: naoEncosta,
          motivoAtencao: "Intolerância a alimentos encostados (contaminação sensorial percebida).",
          sugestaoConduta:
            "Adotar pratos com divisórias ou pratinhos de apoio auxiliares. O contato forçado entre alimentos gera recusa imediata de todo o prato.",
          metasSugeridas: [
            "Servir os alimentos separados no prato ou em potinhos individuais",
          ],
        },
        {
          numero: 41,
          pergunta: "Reação a alimentos misturados (risoto, torta, ensopado)",
          resposta: formatarValor(mudancas.misturados),
        },
        {
          numero: 42,
          pergunta: "Comportamento diante de um novo alimento à mesa",
          resposta: formatarValor(resp.comportamentoNovo || resp.outroComportamentoNovoTexto),
        },
        {
          numero: 43,
          pergunta: "Uso de talheres e independência alimentar",
          resposta: `Talheres: ${formatarValor(resp.utensilios)} • Autonomia: ${formatarValor(resp.independencia)}`,
        },
        {
          numero: 44,
          pergunta: "Dificuldades orais motoras / mastigação",
          resposta: formatarValor(resp.dificuldadeMastigacao),
          pontoAtencao: temDifMastigacao,
          motivoAtencao: "Sinais de fadiga mastigatória, engolir pedaços inteiros ou acúmulo em bochechas (pocketing).",
          sugestaoConduta:
            "Trabalhar mordidas laterais com tiras de alimentos firmes e secos (cenoura, pepino, palitos de torrada) para fortalecer o masseter e a lateralização lingual.",
        },
      ],
    };

    // ==========================================
    // SEÇÃO 5: ROTINA DAS REFEIÇÕES & TELAS
    // ==========================================
    const usoTelasResp = resp.usoTelas || "";
    const usaTelasSempre = temTexto(usoTelasResp, ["sempre", "todas", "so come", "celular", "tablet", "tv"]);

    const secao5: SecaoProntuario = {
      numeroSecao: 5,
      titulo: "5. Rotina das Refeições & Ambiente",
      itens: [
        {
          numero: 45,
          pergunta: "Horários e regularidade das refeições do dia",
          resposta: formatarValor(resp.horarios),
        },
        {
          numero: 46,
          pergunta: "Locais habituais das refeições (mesa, sofá, chão)",
          resposta: formatarValor(resp.locaisRefeicao || resp.outroLocalRefeicaoTexto),
        },
        {
          numero: 47,
          pergunta: "Uso de telas / distrações nas refeições",
          resposta: formatarValor(usoTelasResp),
          pontoAtencao: usaTelasSempre,
          motivoAtencao: "Alimentação dependente de telas (alimentação passiva/inconsciente).",
          sugestaoConduta:
            "Protocolo de desmame gradual de telas: não retirar de forma abrupta. Diminuir brilho/volume, pausar por 1 minuto na metade do prato e manter diálogo leve sobre o alimento.",
          metasSugeridas: [
            "Afastar a tela a pelo menos 1 braço de distância do prato durante o almoço",
            "Pausar o vídeo por 60 segundos antes de servir a sobremesa/fruta",
          ],
        },
        {
          numero: 48,
          pergunta: "Reação ao tentar retirar a tela da refeição",
          resposta: formatarValor(resp.reacaoSemTela || resp.outraReacaoSemTelaTexto),
        },
        {
          numero: 49,
          pergunta: "Refeições que costumam ser puladas ou incompletas",
          resposta: formatarValor(resp.refeicoesIncompletas),
        },
      ],
    };

    // ==========================================
    // SEÇÃO 6: MANEJO FAMILIAR & RECUSA
    // ==========================================
    const acoesRecusaResp = resp.acoesRecusa || [];
    const temPressao = temTexto(acoesRecusaResp, ["obriga", "forca", "raspar", "chantagem", "castigo", "premio doce"]);
    const freqSubst = (resp.freqSubstituicao || "").toLowerCase();
    const substituiSempre = freqSubst.includes("sempre") || freqSubst.includes("quase sempre");

    const secao6: SecaoProntuario = {
      numeroSecao: 6,
      titulo: "6. Manejo Familiar & Respostas à Recusa",
      itens: [
        {
          numero: 50,
          pergunta: "Ações da família quando a criança recusa a refeição",
          resposta: formatarValor(resp.acoesRecusa || resp.outraAcaoRecusaTexto),
          pontoAtencao: temPressao,
          motivoAtencao: "Práticas de pressão à mesa (forçar, chantagem ou obrigar a raspar o prato).",
          sugestaoConduta:
            "Divisão de Responsabilidades de Ellyn Satter: os pais decidem o quê, onde e quando servir; a criança decide se come e quanto come. Eliminar chantagens diminui a ativação de estresse à mesa.",
          metasSugeridas: [
            "Evitar insistir mais de 2 vezes para a criança dar outra garfada",
            "Não negociar a sobremesa como prêmio por comer a comida principal",
          ],
        },
        {
          numero: 51,
          pergunta: "Frequência de substituição do prato recusado",
          resposta: formatarValor(resp.freqSubstituicao),
          pontoAtencao: substituiSempre,
          motivoAtencao: "Substituição imediata constante por leite ou alimento de conforto.",
          sugestaoConduta:
            "A substituição imediata reforça a recusa do prato principal. Estratégia: servir o prato com o alimento aceito já incluso, sem preparar prato especial após a recusa.",
        },
        {
          numero: 52,
          pergunta: "Motivos que levam à substituição",
          resposta: formatarValor(resp.motivosSubstituicao || resp.outroMotivoSubstituicaoTexto),
        },
        {
          numero: 53,
          pergunta: "Sentimentos dos pais à mesa (ansiedade, culpa, exaustão)",
          resposta: formatarValor(resp.sentimentosPais || resp.outroSentimentoTexto),
        },
      ],
    };

    // ==========================================
    // SEÇÃO 7: SINAIS DE ALERTA & MEDOS
    // ==========================================
    const sitNutri = resp.situacoesNutricionais || [];
    const alertaNutri = temTexto(sitNutri, ["perda de peso", "anemia", "palidez", "infeccoes"]);
    const medosResp = resp.medosAlimentares || [];
    const temMedos = temTexto(medosResp, ["engasg", "vomit", "morrer", "fobia", "passar mal"]);
    const atipicos = resp.comportamentosAtipicos || [];
    const temGag = temTexto(atipicos, ["gag", "nausea", "ansia", "vomit", "cheiro"]);

    const secao7: SecaoProntuario = {
      numeroSecao: 7,
      titulo: "7. Sinais de Alerta Nutricional & Medos",
      itens: [
        {
          numero: 54,
          pergunta: "Sinais clínicos de alerta nutricional",
          resposta: formatarValor(resp.situacoesNutricionais || resp.outraSituacaoNutricionalTexto),
          pontoAtencao: alertaNutri,
          motivoAtencao: "Sinais de déficit pondero-estatural, anemia ou perda ponderal recente.",
          sugestaoConduta:
            "Monitoramento rigoroso de peso/altura; avaliar necessidade de enriquecimento calórico do prato aceito com gorduras boas (azeite extravirgem, manteiga ghee, pasta de castanhas).",
        },
        {
          numero: 55,
          pergunta: "Medos alimentares específicos da criança",
          resposta: formatarValor(resp.medosAlimentares || resp.outroMedoAlimentarTexto),
          pontoAtencao: temMedos,
          motivoAtencao: "Medo fóbico de engasgar, vomitar ou adoecer após comer.",
          sugestaoConduta:
            "Abordagem gradual baseada na Escada do Comer com permissão de cuspir no guardanapo a qualquer momento. O sentimento de controle desativa a resposta de medo amigdalar.",
        },
        {
          numero: 56,
          pergunta: "Comportamentos atípicos à mesa e reflexo de náusea/gag",
          resposta: formatarValor(resp.comportamentosAtipicos || resp.outroComportamentoAtipicoTexto),
          pontoAtencao: temGag,
          motivoAtencao: "Reflexo de gag/náusea hiperativo apenas com o cheiro ou visão do alimento.",
          sugestaoConduta:
            "Respeitar o reflexo de gag sem repreensão. Oferecer água fria para recuperar o conforto oral e afastar levemente o alimento para o limite confortável da criança.",
          metasSugeridas: [
            "Colocar o alimento de teste a uma distância segura onde o cheiro não gere desconforto",
          ],
        },
      ],
    };

    // ==========================================
    // SEÇÃO 8: SAÚDE INTESTINAL, HIDRATAÇÃO & OBJETIVOS
    // ==========================================
    const bristol = (resp.tipoBristol || "").toLowerCase();
    const constipacao = bristol.includes("tipo 1") || bristol.includes("tipo 2") || temTexto(resp.sintomasIntestino, ["dor", "sangue", "ressec"]);

    const secao8: SecaoProntuario = {
      numeroSecao: 8,
      titulo: "8. Saúde Intestinal, Ingestão Hídrica & Motivações",
      itens: [
        {
          numero: 57,
          pergunta: "Ingestão hídrica diária e tamanho do copo",
          resposta: `${formatarValor(resp.aguaQuantidade)} (copo de ${formatarValor(resp.tamanhoCopoMl, "N/I")} ml)`,
        },
        {
          numero: 58,
          pergunta: "Frequência intestinal e Escala de Bristol",
          resposta: `Frequência: ${formatarValor(resp.freqIntestino)} • Bristol: ${formatarValor(resp.tipoBristol)} • Sintomas: ${formatarValor(resp.sintomasIntestino || resp.outroSintomaIntestinoTexto)}`,
          pontoAtencao: constipacao,
          motivoAtencao: "Constipação intestinal (fezes em cíbalos tipo 1 ou 2, dor ao evacuar).",
          sugestaoConduta:
            "A dor para evacuar fecha o apetite da criança e intensifica a seletividade. Introduzir água em garrafas atrativas e fibras solúveis hidratadas no cardápio de conforto.",
          metasSugeridas: [
            "Aumentar a oferta de água ao longo do dia, oferecendo pequenos goles a cada 1 hora",
          ],
        },
        {
          numero: 59,
          pergunta: "Interesses favoritos e motivações da criança",
          resposta: formatarValor(resp.interessesFavoritos || resp.motivacaoCrianca),
        },
        {
          numero: 60,
          pergunta: "Informações adicionais relatadas pela família",
          resposta: formatarValor(resp.informacoesAdicionais),
        },
      ],
    };

    return [secao1, secao2, secao3, secao4, secao5, secao6, secao7, secao8];
}

export default function ProntuarioAnamnese56({
  respostas,
  onCopiarAnotacoes,
  onAbrirRascunhoDevolutiva,
}: ProntuarioAnamnese56Props) {
  const secoes = useMemo(() => obterSecoesProntuario(respostas), [respostas]);

  return (
    <div className="space-y-6">
      {secoes.map((secao) => (
        <div
          key={secao.numeroSecao}
          className="space-y-3 pb-5 border-b border-slate-100 last:border-b-0"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-black text-[#4C6C54] uppercase tracking-wider flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#4C6C54]" />
              <span>{secao.titulo}</span>
            </h4>
            <span className="text-[10px] font-bold text-slate-400">
              {secao.itens.length} parâmetros
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {secao.itens.map((item) => (
              <div
                key={item.numero}
                className={`p-3.5 rounded-2xl border transition-all text-xs flex flex-col justify-between gap-2.5 ${
                  item.pontoAtencao
                    ? "border-amber-300/90 bg-amber-50/60 shadow-2xs"
                    : "border-slate-100 bg-slate-50/80 hover:bg-slate-50"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wide">
                      Pergunta {item.numero} • {item.pergunta}
                    </span>
                    {item.pontoAtencao && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full shrink-0 border border-amber-300">
                        <AlertTriangle className="h-3 w-3 text-amber-700" />
                        <span>Ponto de Atenção</span>
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-slate-800 text-[11px] leading-relaxed">
                    {item.resposta}
                  </p>
                  {item.pontoAtencao && item.motivoAtencao && (
                    <p className="text-[10px] font-semibold text-amber-800 mt-1 italic">
                      ⚠️ {item.motivoAtencao}
                    </p>
                  )}
                </div>

                {/* BOX DISCRETO DE SUGESTÃO DE CONDUTA / APOIO PARA DEVOLUTIVA */}
                {item.pontoAtencao && item.sugestaoConduta && (
                  <div className="pt-2 border-t border-amber-200/70 mt-1 space-y-2">
                    <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200 text-[10px] space-y-1">
                      <div className="flex items-center gap-1 font-black text-amber-950 uppercase tracking-wide">
                        <Sparkles className="h-3 w-3 text-amber-600" />
                        <span>💡 Sugestão de Conduta / Rascunho Clínico</span>
                      </div>
                      <p className="text-slate-700 font-medium leading-relaxed">
                        {item.sugestaoConduta}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <button
                        type="button"
                        onClick={() => onCopiarAnotacoes(`[Conduta ${item.pergunta}]: ${item.sugestaoConduta}`)}
                        className="py-1 px-2.5 rounded-lg bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-[10px] transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Copiar texto da conduta para as Anotações Clínicas da Nutricionista"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copiar para Anotações</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onAbrirRascunhoDevolutiva(
                            item.pergunta,
                            item.sugestaoConduta || "",
                            item.metasSugeridas || []
                          )
                        }
                        className="py-1 px-2.5 rounded-lg bg-[#4C6C54] hover:bg-[#3d5743] text-white font-extrabold text-[10px] transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Abrir este rascunho de conduta na Devolutiva Semanal para editar e enviar"
                      >
                        <FileEdit className="h-3 w-3" />
                        <span>Abrir Rascunho na Devolutiva para Editar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
