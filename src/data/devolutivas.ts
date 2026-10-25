export interface MetaDevolutiva {
  id: string;
  texto: string;
  concluida: boolean;
}

export interface DevolutivaSemanal {
  id: string;
  user_email: string;
  data: string;
  titulo: string;
  parecerClinico: string;
  alimentosAlvo: string[];
  metas: MetaDevolutiva[];
}

export const DEVOLUTIVA_PADRAO: DevolutivaSemanal = {
  id: "dev-semana-3",
  user_email: "lucas@email.com",
  data: "22 de Outubro de 2026",
  titulo: "Semana 3 • Avançando nas Texturas Crocantes & Prato Seguro",
  parecerClinico:
    "Parabéns à família pelo acolhimento! Analisando os registros recentes da Escada do Comer, notamos que o pequeno avançou com louvor na aceitação do biscoito de polvilho e tolerou a maçã fuji no prato de apoio por 4 dias seguidos sem crises ou choro. Para esta semana, nosso objetivo primordial não é a deglutição imediata de novos vegetais, mas reduzir a sensibilidade ao som da mastigação e ao contato tátil com texturas secas e crocantes. Lembrem-se da nossa regra de ouro: quem decide o que e quando servir são os pais; o que e o quanto experimentar é escolha da criança.",
  alimentosAlvo: [
    "Cenoura em palitos finos",
    "Maçã fuji crocante",
    "Brócolis tostadinho na airfryer",
  ],
  metas: [
    {
      id: "meta-1",
      texto: "Montar o prato seguro com o alimento de conforto sempre presente em todas as refeições principais",
      concluida: true,
    },
    {
      id: "meta-2",
      texto: "Brincar de 'som do coelhinho': quebrar o palitinho de cenoura com os dedos antes de levar à mesa",
      concluida: false,
    },
    {
      id: "meta-3",
      texto: "Permitir que a criança escolha o formato do corte da maçã sem qualquer cobrança de provar",
      concluida: false,
    },
  ],
};

export const HISTORICO_DEVOLUTIVAS_PADRAO: DevolutivaSemanal[] = [
  DEVOLUTIVA_PADRAO,
  {
    id: "dev-semana-2",
    user_email: "lucas@email.com",
    data: "15 de Outubro de 2026",
    titulo: "Semana 2 • Mapeamento do Prato de Apoio e Desarme de Ansiedade",
    parecerClinico:
      "A introdução do pratinho de apoio branco ao lado do prato principal foi um sucesso imediato! Reduzimos significativamente as recusas defensivas logo no início do almoço. Continuem valorizando cada vez que o pequeno apenas olhar para o alimento novo sem empurrar a mesa.",
    alimentosAlvo: ["Batata-doce assada", "Biscoito de polvilho", "Banana maçã"],
    metas: [
      {
        id: "meta-s2-1",
        texto: "Estabelecer o prato de apoio branco e neutro nas 4 refeições",
        concluida: true,
      },
      {
        id: "meta-s2-2",
        texto: "Evitar qualquer comentário de 'come mais um pedaço' durante as refeições",
        concluida: true,
      },
    ],
  },
  {
    id: "dev-semana-1",
    user_email: "lucas@email.com",
    data: "08 de Outubro de 2026",
    titulo: "Semana 1 • Acolhimento da Família e Rotina Sensorial",
    parecerClinico:
      "Nesta primeira semana focamos na segurança emocional da família. Compreender que a seletividade alimentar severa é uma resposta neurosensorial e não 'manha' traz um alívio enorme para a dinâmica da casa. O diagnóstico está traçado e agora avançamos passo a passo.",
    alimentosAlvo: ["Arroz soltinho", "Pão francês", "Leite morno"],
    metas: [
      {
        id: "meta-s1-1",
        texto: "Finalizar a anamnese detalhada de 56 perguntas",
        concluida: true,
      },
      {
        id: "meta-s1-2",
        texto: "Desligar telas e celulares durante as refeições da família",
        concluida: true,
      },
    ],
  },
];
