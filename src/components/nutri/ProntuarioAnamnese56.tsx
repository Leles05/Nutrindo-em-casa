"use client";

import { useMemo } from "react";
import { AlertTriangle, Copy, FileEdit, Lightbulb, Plus, CheckCircle2, Target } from "lucide-react";

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
  leituraClinica?: string;
  orientacaoPais?: string;
  metaSugerida?: string;
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
          leituraClinica:
            "Perfil sensorial atípico com necessidade elevada de previsibilidade, rigidez de ambiente e sensibilidade a múltiplos estímulos simultâneos. Risco aumentado de sobrecarga sensorial à mesa.",
          orientacaoPais:
            "Neste momento, nosso foco com o(a) pequeno(a) é proporcionar o máximo de conforto e previsibilidade à mesa. Crianças com essa sensibilidade precisam sentir que o ambiente da refeição é um lugar seguro e sem surpresas. Vamos manter os mesmos horários, o mesmo pratinho e nunca exigir que ele(a) coma algo novo sem antes se sentir pronto(a).",
          metaSugerida:
            "Manter o mesmo horário e assento previsível nas refeições principais, avisando 5 minutos antes de sentar à mesa.",
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
          leituraClinica:
            "Comunicação verbal restrita ou com suporte; a sobrecarga emocional e o limite de tolerância se manifestam por recusa comportamental e choro diante da pressão alimentar.",
          orientacaoPais:
            "Como a comunicação verbal ainda está em desenvolvimento, é natural que a recusa venha em forma de irritação ou choro quando a criança se sente pressionada. Para ajudá-la a expressar seu limite com leveza, vamos adotar o pratinho de apoio, onde ela pode colocar o alimento que não quer comer sem precisar entrar em crise.",
          metaSugerida:
            "Disponibilizar um pratinho de apoio neutro ao lado do prato principal para a criança colocar o que não desejar comer.",
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
          leituraClinica:
            "Nascimento prematuro (< 37 semanas). Considerar idade corrigida e histórico de imaturidade motora-oral na tolerância a texturas mais complexas.",
          orientacaoPais:
            "Bebês que nasceram um pouquinho antes do tempo frequentemente precisam de mais tempo para amadurecer a mastigação e a coordenação da língua. Vamos respeitar o ritmo dele(a), avançando as texturas degrau por degrau sem cobranças.",
          metaSugerida:
            "Respeitar o tempo da criança à mesa, permitindo pausas entre as garfadas para evitar fadiga muscular.",
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
          leituraClinica:
            "Trauma prévio de engasgo ou reflexo faríngeo hiperativo gerando medo condicionado de mastigar e deglutir sólidos.",
          orientacaoPais:
            "Sabemos como episódios anteriores de engasgo deixam a família e a criança apreensivas. Para recuperar essa segurança, vamos apresentar alimentos em palitos firmes que não quebram em pedacinhos soltos na garganta, permitindo que a criança treine a mordida lateral sem risco.",
          metaSugerida:
            "Oferecer palitos firmes de legumes assados ou biscoito longo para exploração mastigatória nas laterais da boca, sem cobrança de engolir.",
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
          leituraClinica:
            "Memória de dor ou desconforto digestivo associada à deglutição, levando à aversão antecipatória aos alimentos.",
          orientacaoPais:
            "Quando a criança já passou por desconfortos gástricos ou refluxo, a cabecinha dela pode associar o comer com sentir dor. Nosso papel será mostrar que a comida agora é leve e amiga da barriguinha, servindo porções menores e respeitando prontamente quando ele(a) disser que está satisfeito(a).",
          metaSugerida:
            "Fracionar as refeições em pequenas porções para manter a digestão leve e confortável.",
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
          leituraClinica:
            "Restrição severa de proteínas de alto valor biológico e risco de carência de ferro/zinco por aversão à textura fibrosa ou mastigação prolongada da carne.",
          orientacaoPais:
            "A carne costuma ser a textura mais difícil para a criança mastigar, pois exige muita força e cansa a boquinha. Não precisamos insistir em bifes ou pedaços grandes; podemos oferecer proteínas em formatos fininhos, crocantes ou misturados de forma bem suave nos pratinhos que ele(a) já aceita.",
          metaSugerida:
            "Apresentar a proteína em formato crocante ou desfiado bem fininho (como frango desfiado levemente tostado), sem pressão de quantidade.",
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
          leituraClinica:
            "Aversão à umidade, textura gelatinosa ou acidez imprevisível característica das frutas in natura.",
          orientacaoPais:
            "As frutas mudam de textura e doçura a cada mordida, e essa imprevisibilidade causa estranhamento em crianças sensíveis. Em vez de forçar uma fruta inteira, vamos começar fatiando em lâminas bem fininhas ou convidando a criança para brincar de lavar as frutinhas na pia da cozinha.",
          metaSugerida:
            "Cortar uma fruta em lâminas finas (como chips de maçã) e colocá-la apenas para exploração visual no pratinho de apoio.",
          sugestaoConduta:
            "Iniciar pela etapa de visualização e cheiro: cortar maçã em fatias ultra-finas (chips) e convidar a criança a ajudar a lavar as frutas.",
        },
        {
          numero: 30,
          pergunta: "Vegetais e legumes aceitos",
          resposta: formatarValor(resp.vegetais || resp.outroVegetalTexto),
          pontoAtencao: semVegetais,
          motivoAtencao: "Nenhum legume ou vegetal aceito na rotina alimentar.",
          leituraClinica:
            "Sensibilidade gustativa a notas amargas e aversão tátil a vegetais cozidos/folhosos. Aplicação dos degraus iniciais da Escada do Comer.",
          orientacaoPais:
            "Não precisamos que o pequeno engula legumes logo de início. O primeiro grande objetivo é simplesmente normalizar a presença das cores e do cheiro no pratinho de apoio, para que ele(a) sinta que o legume é um amigo inofensivo à mesa.",
          metaSugerida:
            "Colocar 1 rodela ou pedacinho pequeno de legume no prato de apoio em 3 refeições da semana, celebrando apenas a tolerância visual.",
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
          leituraClinica:
            "Cardápio restrito com risco de food jags (queima de alimentos seguros). Necessidade de proteção estrita dos alimentos aceitos e variação imperceptível de estímulo.",
          orientacaoPais:
            "Com um repertório mais restrito, nossa prioridade é proteger e cuidar com todo o carinho dos alimentos que a criança já come em paz. Não vamos tentar retirar ou mudar de repente seus alimentos de segurança, para que ele(a) confie plenamente no momento da refeição.",
          metaSugerida:
            "Garantir a presença de pelo menos 1 alimento de segurança conhecido e aceito em 100% das refeições principais.",
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
    const temBaixaAutonomia = temTexto(resp.independencia, [
      "na boca",
      "da na boca",
      "com ajuda",
      "auxilio",
      "depende",
      "nao come sozinh",
      "precisa de ajuda",
      "alimentado por",
      "aviaozinho",
      "parcialmente",
    ]);

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
          leituraClinica:
            "Rigidez alimentar com desregulação emocional intensa ou jejum defensivo. Alimento âncora indispensável para a regulação do estresse à mesa.",
          orientacaoPais:
            "O alimento favorito da criança não é teimosia, mas o porto seguro que traz paz para a cabecinha dela. Nunca devemos deixar a criança em jejum na tentativa de fazê-la comer o que não quer, pois isso aumenta a ansiedade. Manteremos o alimento de segurança ao lado enquanto avançamos com calma.",
          metaSugerida:
            "Garantir o alimento de conforto à disposição, sem comentários de cobrança ou comparação durante a refeição.",
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
          leituraClinica:
            "Hiperfixação visual na embalagem comercial e sabor industrial ultra-padronizado.",
          orientacaoPais:
            "A embalagem comercial transmite à criança a certeza de que o sabor será exatamente idêntico todas as vezes. Para começar a dessensibilizar essa fixação aos poucos, vamos passar o alimento favorito para um potinho neutro e transparente da casa antes de servir.",
          metaSugerida:
            "Transferir o alimento da embalagem original para um pote neutro antes de colocar à mesa.",
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
          leituraClinica:
            "Hipersensibilidade tátil oral e contaminação sensorial percebida (alimentos encostados invalidam o prato inteiro).",
          orientacaoPais:
            "Para uma criança com sensibilidade tátil, quando dois alimentos encostam, a sensação é de que todo o prato foi alterado. Vamos respeitar essa necessidade oferecendo pratos com divisórias ou potinhos individuais para cada comida.",
          metaSugerida:
            "Servir os alimentos separados no prato ou em potinhos individuais, sem deixar que se toquem.",
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
          pontoAtencao: temBaixaAutonomia,
          motivoAtencao: temBaixaAutonomia
            ? "Baixa autonomia alimentar (criança alimentada na boca pelo adulto ou dependente de auxílio constante)."
            : undefined,
          leituraClinica:
            "Alimentação passiva limita o controle proprioceptivo oral e a autorregulação de saciedade. Promover a autonomia gradativa reduz a ansiedade e fortalece o protagonismo da criança.",
          orientacaoPais:
            "Quando a criança mesma pega a comida, ela recupera o controle e a curiosidade sobre o que vai para a sua boca. Mesmo que faça sujeira no começo, permitir que ela explore os alimentos com as mãozinhas ou com garfinhos infantis é um passo terapêutico maravilhoso.",
          metaSugerida:
            "Incentivar a criança a levar o alimento à boca de forma autônoma nos primeiros 5 minutos de cada refeição.",
          sugestaoConduta:
            "Incentivar a autoalimentação sem pressa, permitindo que a criança toque nos alimentos com as mãos ou explore talheres infantis lúdicos.",
        },
        {
          numero: 44,
          pergunta: "Dificuldades orais motoras / mastigação",
          resposta: formatarValor(resp.dificuldadeMastigacao),
          pontoAtencao: temDifMastigacao,
          motivoAtencao: "Sinais de fadiga mastigatória, engolir pedaços inteiros ou acúmulo em bochechas (pocketing).",
          leituraClinica:
            "Tônus reduzido ou fadiga do masseter; dificuldade na lateralização lingual e propensão a engolir pedaços inteiros ou acumular nas bochechas.",
          orientacaoPais:
            "Às vezes a recusa de certos alimentos acontece simplesmente porque a musculatura da boquinha cansa rápido de mastigar. Vamos ajudá-la a exercitar a mordida lateral com alimentos firmes e secos em tirinhas, facilitando o trabalho da língua.",
          metaSugerida:
            "Oferecer palitos de torrada ou tiras de queijo para pequenas mordidas usando os dentes molares laterais.",
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
          leituraClinica:
            "Comer inconsciente sob distração digital; perda das pistas interoceptivas de apetite/saciedade e falta de conexão sensorial com o alimento.",
          orientacaoPais:
            "Sabemos o quanto a telinha foi um salva-vidas nos momentos difíceis de desespero alimentar, e não há espaço para culpas aqui. Nosso plano será fazer um desmame bem acolhedor e progressivo: começaremos apenas reduzindo o volume e afastando o aparelho um pouco mais para longe do prato.",
          metaSugerida:
            "Afastar o celular ou tablet a pelo menos um braço de distância do prato e diminuir o volume durante o almoço.",
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
          leituraClinica:
            "Ansiedade familiar refletida em coerção, chantagem ou cobrança de volume à mesa, ativando resposta de estresse do sistema nervoso autônomo e fechando a fome fisiológica.",
          orientacaoPais:
            "É muito natural que a angústia em ver nosso(a) filho(a) comer pouco nos faça insistir por mais uma garfada. No entanto, quando a criança sente a nossa tensão, o estômago dela se fecha fisiologicamente. Vamos adotar uma postura tranquila: vocês decidem com carinho o que oferecer e a criança decide em paz se come e quanto come.",
          metaSugerida:
            "Evitar insistir ou negociar garfadas; ao primeiro sinal de recusa tranquila da criança, respeitar e encerrar o momento.",
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
          leituraClinica:
            "Reforço operante da recusa alimentar; a criança compreende rapidamente que recusar o prato principal garante um alimento hiperpalatável de socorro.",
          orientacaoPais:
            "Se preparamos um prato especial de socorro logo após a recusa, a criança aprende que não precisa tentar a refeição familiar. A melhor saída é já servir o prato inicial com um alimento que ela gosta junto da comida da família, sem montar um cardápio novo depois.",
          metaSugerida:
            "Colocar uma porção do alimento seguro já no prato inicial da família, sem preparar lanches alternativos após a recusa.",
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
          leituraClinica:
            "Sinais clínicos de déficit nutricional ou desaceleração pôndero-estatural. Demanda enriquecimento calórico-proteico sutil nos alimentos aceitos.",
          orientacaoPais:
            "Para garantir que o corpinho da criança continue forte e crescendo bem enquanto expandimos o paladar, faremos pequenos enriquecimentos nutricionais imperceptíveis nos alimentos que ela já adora, como um fio de azeite extravirgem ou farinhas nutritivas de sabor neutro.",
          metaSugerida:
            "Adicionar 1 fio de azeite extravirgem ou pitada de sementes finas no prato de conforto aceito.",
          sugestaoConduta:
            "Monitoramento rigoroso de peso/altura; avaliar necessidade de enriquecimento calórico do prato aceito com gorduras boas (azeite extravirgem, manteiga ghee, pasta de castanhas).",
        },
        {
          numero: 55,
          pergunta: "Medos alimentares específicos da criança",
          resposta: formatarValor(resp.medosAlimentares || resp.outroMedoAlimentarTexto),
          pontoAtencao: temMedos,
          motivoAtencao: "Medo fóbico de engasgar, vomitar ou adoecer após comer.",
          leituraClinica:
            "Medo fóbico antecipatório de engasgo, vômito ou dor ao deglutir (hiperativação amigdalar).",
          orientacaoPais:
            "O medo de passar mal ou engasgar é real e muito desconfortável para a criança. Para que ela se sinta 100% segura, combinaremos que ela tem total permissão para cuspir o alimento no guardanapo a qualquer momento. Saber que ela tem essa saída devolve a tranquilidade para tentar.",
          metaSugerida:
            "Deixar sempre um guardanapo ao lado e avisar a criança de que ela pode cuspir sem bronca se sentir qualquer incômodo.",
          sugestaoConduta:
            "Abordagem gradual baseada na Escada do Comer com permissão de cuspir no guardanapo a qualquer momento. O sentimento de controle desativa a resposta de medo amigdalar.",
        },
        {
          numero: 56,
          pergunta: "Comportamentos atípicos à mesa e reflexo de náusea/gag",
          resposta: formatarValor(resp.comportamentosAtipicos || resp.outroComportamentoAtipicoTexto),
          pontoAtencao: temGag,
          motivoAtencao: "Reflexo de gag/náusea hiperativo apenas com o cheiro ou visão do alimento.",
          leituraClinica:
            "Hipersensibilidade tátil oral e reflexo faríngeo anteriorizado. Desencadeado por visão, odor ou textura inesperada.",
          orientacaoPais:
            "A ânsia de vômito (gag) é uma defesa do próprio organismo da criança, e nunca pirraça. Caso ela apresente reflexo ao ver ou cheirar a comida, vamos manter a calma, oferecer um gole de água fresca e afastar suavemente o alimento para uma distância confortável.",
          metaSugerida:
            "Manter um copo de água fresca ao lado e afastar o alimento de teste alguns centímetros caso a criança apresente reflexo de náusea.",
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
          leituraClinica:
            "Retenção fecal voluntária por dor ao evacuar (disquezia funcional); impactação retal que suprime o apetite fisiológico e retarda o esvaziamento gástrico.",
          orientacaoPais:
            "Quando a evacuação dói ou a barriguinha está presa, a criança perde totalmente a vontade de comer. Nosso primeiro grande cuidado de acolhimento será amaciar as fezes, oferecendo água ao longo de todo o dia de forma divertida e adicionando fibras suaves que não alteram o sabor.",
          metaSugerida:
            "Disponibilizar uma garrafinha de água atrativa com metas visuais para beber pequenos goles de hora em hora.",
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

                {/* BOX DE SUGESTÃO DE CONDUTA COM ÍCONE ÚNICO E DOIS BOTÕES */}
                {item.pontoAtencao && (item.sugestaoConduta || item.leituraClinica || item.orientacaoPais) && (
                  <div className="pt-2 border-t border-amber-200/70 mt-1 space-y-2">
                    <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200 text-[10px] space-y-1.5">
                      <div className="flex items-center gap-1 font-black text-amber-950 uppercase tracking-wide">
                        <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                        <span>Sugestão de Conduta para a Nutri</span>
                      </div>
                      {(item.leituraClinica || item.sugestaoConduta) && (
                        <p className="text-slate-600 font-medium leading-relaxed">
                          <strong>Leitura Técnica:</strong> {item.leituraClinica || item.sugestaoConduta}
                        </p>
                      )}
                      {item.orientacaoPais && (
                        <p className="text-slate-800 font-semibold leading-relaxed italic bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                          &ldquo;{item.orientacaoPais}&rdquo;
                        </p>
                      )}
                      {(item.metaSugerida || (item.metasSugeridas && item.metasSugeridas[0])) && (
                        <p className="text-[10px] font-bold text-[#2A546D] flex items-center gap-1">
                          <Target className="h-3 w-3 text-[#2A546D] shrink-0" />
                          <span>Meta: {item.metaSugerida || item.metasSugeridas![0]}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          onCopiarAnotacoes(
                            `[Pergunta #${item.numero} - ${item.pergunta}]: ${item.leituraClinica || item.sugestaoConduta || ""}`
                          )
                        }
                        className="py-1 px-2.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-[10px] transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Guardar leitura clínica nas Anotações Internas do Prontuário"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Guardar nas Anotações Internas</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onAbrirRascunhoDevolutiva(
                            item.pergunta,
                            item.orientacaoPais || item.sugestaoConduta || "",
                            item.metaSugerida ? [item.metaSugerida] : (item.metasSugeridas || [])
                          )
                        }
                        className="py-1 px-2.5 rounded-lg bg-[#4C6C54] hover:bg-[#3d5743] text-white font-extrabold text-[10px] transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="Inserir texto acolhedor na Devolutiva Semanal para a família"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Inserir na Devolutiva da Família</span>
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
