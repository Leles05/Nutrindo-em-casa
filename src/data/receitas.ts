export interface Receita {
  id: string;
  titulo: string;
  descricao: string;
  tempoPreparo: string;
  rendimento: string;
  textura: "Crocante" | "Macia/Úmida" | "Pastosa/Cremosa" | "Finger Food";
  texturasSecundarias: string[];
  degrauEscada: string;
  recomendadaPadrao: boolean;
  emoji: string;
  ingredientes: string[];
  modoPreparo: string[];
  estrategiaSensorial: string;
}

export interface RefeicaoPlano {
  id: string;
  nome: string;
  horarioSugerido: string;
  emoji: string;
  alimentoSeguro: {
    nome: string;
    descricao: string;
  };
  alimentoParecido: {
    nome: string;
    descricao: string;
  };
  alimentoExposicao: {
    nome: string;
    descricao: string;
  };
}

export const RECEITAS_PADRAO: Receita[] = [
  {
    id: "bolinho-crocante-brocolis-queijo",
    titulo: "Bolinho Crocante de Brócolis e Queijo",
    descricao:
      "Uma maneira acolhedora e crocante de aproximar os vegetais verdes sem a aversão tátil à folhagem úmida.",
    tempoPreparo: "25 min",
    rendimento: "8 bolinhos",
    textura: "Crocante",
    texturasSecundarias: ["Finger Food"],
    degrauEscada: "Ideal para Tocar e Cheirar",
    recomendadaPadrao: true,
    emoji: "🥦",
    ingredientes: [
      "1 xícara de brócolis cozido no vapor e bem picadinho (ou esfarelado)",
      "1 xícara de queijo muçarela ou queijo minas ralado fininho",
      "1 ovo caipira batido",
      "3 colheres (sopa) de farinha de aveia ou farinha de amêndoas",
      "1 colher (chá) de azeite de oliva extravirgem",
      "1 pitadinha de sal e orégano suave",
    ],
    modoPreparo: [
      "1. Cozinhe o brócolis no vapor até ficar bem macio e escorra todo o excesso de líquido com papel toalha.",
      "2. Em uma tigela média, misture o brócolis picadinho com o ovo, o queijo ralado e os temperos suaves.",
      "3. Adicione a farinha de aveia aos poucos até dar ponto de modelar bolinhas com as mãos.",
      "4. Molde pequenas bolinhas achatadas (formato de medalhão ou 'nugget') para facilitar a pega com os dedinhos.",
      "5. Leve à Airfryer pré-aquecida a 180°C por 12 a 15 minutos até a casquinha ficar dourada e estaladiça, ou asse em forno médio por 20 minutos.",
    ],
    estrategiaSensorial:
      "Convide a criança para 'esfarelar' as arvorezinhas de brócolis com as mãos antes de juntar à massa. O aroma suave do queijo gratinado e a casquinha dourada quebram a aversão visual ao verde, permitindo que a criança toque no alimento sem aflição de textura úmida.",
  },
  {
    id: "panqueca-aveia-banana",
    titulo: "Panqueca Colorida de Aveia e Banana",
    descricao:
      "Massa fofinha, adocicada pelo sabor natural da fruta, com visual alegre para formatos lúdicos cortados à mesa.",
    tempoPreparo: "15 min",
    rendimento: "4 unidades",
    textura: "Macia/Úmida",
    texturasSecundarias: ["Finger Food"],
    degrauEscada: "Ideal para Provar e Comer",
    recomendadaPadrao: true,
    emoji: "🥞",
    ingredientes: [
      "1 banana nanica bem madura (adocicada naturalmente)",
      "1 ovo inteiro",
      "3 colheres (sopa) de farelo ou farinha de aveia",
      "1 pitada suave de canela em pó (opcional)",
      "1 colherzinha de café de óleo de coco ou manteiga para untar a frigideira",
    ],
    modoPreparo: [
      "1. Em um pratinho, amasse a banana com um garfo até formar um purê homogêneo.",
      "2. Adicione o ovo e bata bem com o garfo até espumar suavemente.",
      "3. Junte a farinha de aveia e a canela, misturando até virar uma massa cremosa e aveludada.",
      "4. Aqueça uma frigideira antiaderente untada em fogo bem baixinho.",
      "5. Despeje pequenas conchas da massa; quando formarem bolhinhas na superfície, vire com cuidado e doure o outro lado por 1 minuto.",
    ],
    estrategiaSensorial:
      "Corte as panquecas usando cortadores lúdicos de biscoito (estrelas, corações ou animais). O aroma doce e acolhedor da banana quente diminui a hiper-reatividade olfativa, e o formato divertido convida a criança a morder a pontinha sem sensação de cobrança.",
  },
  {
    id: "chips-cenoura-batata-doce",
    titulo: "Chips Assados de Cenoura e Batata-Doce",
    descricao:
      "Lâminas estaladiças assadas com azeite, perfeitas para a ponte sensorial da crocância do biscoito para os vegetais.",
    tempoPreparo: "30 min",
    rendimento: "2 porções",
    textura: "Crocante",
    texturasSecundarias: ["Finger Food"],
    degrauEscada: "Ideal para Tocar e Provar",
    recomendadaPadrao: true,
    emoji: "🥕",
    ingredientes: [
      "1 cenoura média descascada e fatiada em lâminas finíssimas (use mandolina ou descascador)",
      "1 batata-doce pequena com casca limpa, fatiada em lâminas finas",
      "1 colher (sopa) de azeite de oliva extravirgem",
      "1 pitada de sal marinho e ervas finas desidratadas",
    ],
    modoPreparo: [
      "1. Seque muito bem as lâminas de cenoura e batata-doce com folhas de papel toalha para retirar a umidade.",
      "2. Em uma tigela, envolva as fatias delicadamente com o azeite e a pitadinha de sal, garantindo que todas peguem um brilho sutil.",
      "3. Distribua as rodelas sem sobrepor em uma assadeira forrada com papel manteiga.",
      "4. Asse em forno pré-aquecido a 160°C por cerca de 20 a 25 minutos, virando na metade do tempo até ficarem crocantes e secas.",
      "5. Deixe esfriar por 5 minutos fora do forno para atingir o ponto máximo de crocância estaladiça.",
    ],
    estrategiaSensorial:
      "Brinque de fazer o 'som do coelhinho': proponha quebrar uma lasca com os dedos perto do ouvido para escutar o barulho do 'crack'. Essa ponte sonora estimula a audição antes do paladar, diminuindo a resistência ao sabor característico da cenoura.",
  },
  {
    id: "muffin-macio-abobrinha",
    titulo: "Muffin Macio de Abobrinha com Cenoura",
    descricao:
      "Bolinho fofo e úmido onde os vegetais ralados se fundem à textura reconfortante de um bolo caseiro.",
    tempoPreparo: "35 min",
    rendimento: "6 muffins",
    textura: "Macia/Úmida",
    texturasSecundarias: ["Finger Food"],
    degrauEscada: "Ideal para Cheirar e Provar",
    recomendadaPadrao: false,
    emoji: "🧁",
    ingredientes: [
      "1/2 xícara de abobrinha italiana ralada fina e bem espremida",
      "1/4 xícara de cenoura ralada fininha",
      "2 ovos",
      "1/4 xícara de azeite de oliva ou óleo de girassol",
      "1 xícara de farinha de aveia ou farinha de trigo integral",
      "1 colher (chá) de fermento químico em pó",
      "1 colher (sopa) de queijo parmesão ralado para dar aroma",
    ],
    modoPreparo: [
      "1. Rale a abobrinha e aperte com as mãos em uma peneira para eliminar toda a água.",
      "2. No liquidificador ou tigela, misture os ovos, o azeite e o queijo parmesão.",
      "3. Incorpore a farinha aos poucos e junte delicadamente os legumes ralados.",
      "4. Adicione o fermento e distribua em forminhas de silicone para muffin.",
      "5. Asse a 180°C por 20 a 25 minutos até que espetar um palito ele saia sequinho.",
    ],
    estrategiaSensorial:
      "Como a abobrinha ralada fina e espremida perde os pedaços marcados, a textura fica macia e homogênea. Peça para a criança colocar as forminhas na assadeira, gerando autonomia e previsibilidade sobre o que foi feito.",
  },
  {
    id: "picole-cremoso-manga-coco",
    titulo: "Picolé Cremoso de Frutas Naturais (Manga & Coco)",
    descricao:
      "Geladinho e aveludado, ideal para aliviar hipersensibilidade oral ou desconfortos da dentição com fruta pura.",
    tempoPreparo: "10 min + 4h freezer",
    rendimento: "4 picolés",
    textura: "Pastosa/Cremosa",
    texturasSecundarias: ["Finger Food"],
    degrauEscada: "Ideal para Provar e Comer",
    recomendadaPadrao: true,
    emoji: "🥭",
    ingredientes: [
      "1 manga palmer bem madura e doce descascada e picada",
      "100ml de leite de coco cremoso ou iogurte natural integral",
      "Gotas de limão siciliano para realçar o frescor",
    ],
    modoPreparo: [
      "1. Bata a manga picada com o leite de coco no liquidificador até obter um creme sedoso, sem fibras aparentes.",
      "2. Despeje em forminhas de picolé infantis com palitinho ergonômico.",
      "3. Leve ao congelador por pelo menos 4 horas até firmar por completo.",
      "4. Para desenformar facilmente, passe o fundo da forma por 5 segundos sob água corrente morna.",
    ],
    estrategiaSensorial:
      "A baixa temperatura proporciona um efeito calmante e anestésico na gengiva e na língua da criança seletiva, facilitando a aceitação do sabor de fruta fresca sem a sensação viscosa que algumas crianças recusam na fruta in natura.",
  },
  {
    id: "nuggets-caseiros-frango-milho",
    titulo: "Nuggets Caseiros de Frango com Crosta de Milho",
    descricao:
      "Pedaços suculentos de peito de frango envolvidos em flocos de milho estaladiços, assados e sem conservantes.",
    tempoPreparo: "30 min",
    rendimento: "10 unidades",
    textura: "Crocante",
    texturasSecundarias: ["Finger Food"],
    degrauEscada: "Ideal para Tocar e Provar",
    recomendadaPadrao: true,
    emoji: "🍗",
    ingredientes: [
      "300g de peito de frango moído ou processado cru",
      "1/2 cenoura ralada no ralo mais fininho (desaparece na massa)",
      "1 dente de alho amassado e 1 colherzinha de azeite",
      "1 xícara de flocos de milho sem açúcar (corn flakes) levemente triturados",
      "1 ovo batido para empanar",
    ],
    modoPreparo: [
      "1. Em um recipiente, tempere o frango moído com o azeite, o alho e a cenoura raladinha.",
      "2. Modele pequenos retângulos ou discos no formato tradicional de nuggets com as mãos úmidas.",
      "3. Passe cada pedaço no ovo batido e depois na farofinha de flocos de milho, pressionando para aderir bem.",
      "4. Disponha em assadeira untada e leve ao forno pré-aquecido a 200°C por 20 minutos (ou 15 min na Airfryer a 190°C), virando na metade.",
    ],
    estrategiaSensorial:
      "Muitas crianças rejeitam o frango desfiado pela sensação fibrosa nos dentes. A carne moída modelada com crosta de milho cria uma textura completamente uniforme e previsível, dando segurança total na primeira mordida.",
  },
];

export const PLANO_ALIMENTAR_PADRAO: RefeicaoPlano[] = [
  {
    id: "cafe-manha",
    nome: "Café da Manhã",
    horarioSugerido: "07:30 - 08:30",
    emoji: "☀️",
    alimentoSeguro: {
      nome: "Pãozinho francês quentinho na manteiga ou biscoito de polvilho",
      descricao: "Base previsível que o pequeno aceita com tranquilidade, sem gerar ansiedade ao acordar.",
    },
    alimentoParecido: {
      nome: "Panqueca de aveia e banana com formato lúdico de estrela",
      descricao: "Ponte sensorial: aroma adocicado com textura macia e homogênea para segurar com as mãos.",
    },
    alimentoExposicao: {
      nome: "1 rodela de morango fresco ou banana fatiada no pratinho de apoio",
      descricao: "Sem cobrança de comer! Apenas para observar cores e tolerar a presença à mesa.",
    },
  },
  {
    id: "lanche-manha",
    nome: "Lanche da Manhã / Tarde",
    horarioSugerido: "10:00 ou 15:30",
    emoji: "🍎",
    alimentoSeguro: {
      nome: "Água de coco geladinha ou leite com cacau suave",
      descricao: "Hidratação de conforto em copinho com canudo que a criança já domina.",
    },
    alimentoParecido: {
      nome: "Chips assados de maçã fuji ou cenoura em palitos crocantes",
      descricao: "Ponte sensorial: som estaladiço sem a sensação pegajosa ou úmida de purês.",
    },
    alimentoExposicao: {
      nome: "Uvas sem sementes cortadas ao meio em pote transparente",
      descricao: "Convite tátil: usar o alimento para 'montar carrinhos' ou brincar de pinça com os dedos.",
    },
  },
  {
    id: "almoco",
    nome: "Almoço em Família",
    horarioSugerido: "12:00 - 13:00",
    emoji: "🍽️",
    alimentoSeguro: {
      nome: "Arroz branco soltinho e batata assada em palito",
      descricao: "Alimento neutro em sabor e com cor clara previsível, garantindo a ingestão calórica diária.",
    },
    alimentoParecido: {
      nome: "Nuggets caseiros de frango com crosta de milho crocante",
      descricao: "Ponte sensorial: proteína de textura uniforme que substitui a carne desfiada sem travar a mastigação.",
    },
    alimentoExposicao: {
      nome: "Árvore de brócolis tostadinha no cantinho de exploração",
      descricao: "Objetivo da semana: apenas tolerar no prato ou cheirar sem chorar, celebrando cada interação.",
    },
  },
  {
    id: "jantar",
    nome: "Jantar Acolhedor",
    horarioSugerido: "18:30 - 19:30",
    emoji: "🌙",
    alimentoSeguro: {
      nome: "Macarrão parafuso ou gravatinha com azeite e parmesão suave",
      descricao: "Massa sequinha e separada, sem molhos densos misturados que causem alarme sensorial.",
    },
    alimentoParecido: {
      nome: "Bolinho crocante de brócolis e queijo gratinado na airfryer",
      descricao: "Ponte sensorial: o queijo derretido camufla o vegetal e traz aconchego visual.",
    },
    alimentoExposicao: {
      nome: "Tirinhas finas de cenoura crua para brincar de 'colher' no azeite",
      descricao: "Exploração voluntária com os talheres ou lábios, sem obrigação de engolir.",
    },
  },
];

export const NOTA_ORIENTACAO_PADRAO =
  "Família, nesta fase o nosso foco principal é a consolidação das texturas secas e crocantes através do prato seguro. Não insistam para o pequeno engolir os vegetais verdes de imediato: manter 70% do prato com alimentos de conforto reduz o cortisol e devolve o prazer à mesa. Sigam firmes com o método de Composição sem Pressão!";
