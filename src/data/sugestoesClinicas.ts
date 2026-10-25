/**
 * Banco de Respostas Clínicas & Protocolos — Seletividade Alimentar Pediátrica
 * Plataforma Nutrindo em Casa • Dra. Laís Leles (CRN-8 18878)
 *
 * - Protocolos-padrão para os cenários mais frequentes.
 * - Respostas personalizadas da nutricionista persistidas em localStorage
 *   (chave `nutrindo_banco_respostas_custom`).
 * - Motor de pré-análise que cruza as respostas da anamnese (56 parâmetros)
 *   com os gatilhos de cada protocolo.
 */

export type CategoriaProtocolo =
  | "textura"
  | "telas"
  | "autonomia"
  | "ansiedade_parental"
  | "sensorial"
  | "monotonia"
  | "nausea_medo"
  | "personalizado";

export interface ProtocoloClinico {
  id: string;
  categoria: CategoriaProtocolo;
  /** Rótulo curto usado nos chips de 1 clique (ex.: "📱 Desmame Gradual de Telas"). */
  tituloCurto: string;
  /** Palavras-chave/condições (sem acento, minúsculas) que ativam a recomendação. */
  gatilhosAnamnese: string[];
  /** Texto do badge "🚩 Sinal de Atenção" quando o protocolo tem match. */
  sinalAtencao?: string;
  parecerClinicoSugerido: string;
  alimentosAlvoSugeridos: string[];
  metasSemanaisSugeridas: string[];
  orientacaoPratoSeguro: string;
  /** true quando criado pela nutricionista (editável/excluível). */
  personalizado?: boolean;
  criadoEm?: string;
}

export const CHAVE_BANCO_CUSTOM = "nutrindo_banco_respostas_custom";
export const EVENTO_BANCO_ATUALIZADO = "nutrindo_banco_respostas_atualizado";

// ===================================================================
// PROTOCOLOS-PADRÃO
// ===================================================================
export const PROTOCOLOS_PADRAO: ProtocoloClinico[] = [
  {
    id: "textura-crocantes",
    categoria: "textura",
    tituloCurto: "🥨 Ponte de Texturas (Crocante → Úmido)",
    sinalAtencao: "Seletividade por textura",
    gatilhosAnamnese: [
      "textura", "crocante", "pastoso", "umido", "molhado", "misturad", "encostando",
      "biscoito", "salgadinho", "polvilho", "dificuldade com texturas", "so seco",
    ],
    parecerClinicoSugerido:
      "Observamos uma preferência marcante por alimentos secos e crocantes, com recusa de preparações úmidas, pastosas ou misturadas. Esse padrão é comum quando há maior sensibilidade oral-tátil e previsibilidade é sinônimo de segurança para a criança. Nossa estratégia será construir 'pontes de textura': partir do crocante aceito e, em pequenos degraus, aproximar versões levemente mais úmidas — sem esconder alimentos e sem cobrança de ingestão.",
    alimentosAlvoSugeridos: [
      "Chips de legumes assados", "Palitos de cenoura levemente cozidos", "Torradinha com fio de azeite", "Maçã em fatias finas",
    ],
    metasSemanaisSugeridas: [
      "Oferecer o alimento crocante aceito ao lado de uma versão 'um degrau' mais úmida, sem pedir para provar",
      "Servir os alimentos separados no prato (sem encostar) em todas as refeições principais",
      "Uma vez na semana, preparar junto com a criança um chips caseiro de legume",
    ],
    orientacaoPratoSeguro:
      "Prato Seguro 70/20/10: 70% alimentos crocantes já aceitos, 20% alimento-ponte de textura semelhante (ex.: chips de batata-doce) e 10% desafio em quantidade mínima, sempre separado e sem molhos por cima.",
  },
  {
    id: "telas-desmame",
    categoria: "telas",
    tituloCurto: "📱 Desmame Gradual de Telas",
    sinalAtencao: "Uso de telas nas refeições",
    gatilhosAnamnese: [
      "usa_telas_refeicao", "tela", "celular", "tablet", "televisao", "tv", "desenho", "youtube",
    ],
    parecerClinicoSugerido:
      "As refeições hoje acontecem com apoio de telas, o que reduz a percepção de fome/saciedade e afasta a criança das pistas sensoriais do alimento (cor, cheiro, textura). Retirar a tela de forma abrupta costuma gerar crises; por isso, faremos um desmame gradual e previsível, substituindo a distração por conexão familiar e brincadeiras à mesa.",
    alimentosAlvoSugeridos: [
      "Alimentos de conforto já aceitos", "Frutas em formatos divertidos", "Palitinhos de legumes para 'montar figuras'",
    ],
    metasSemanaisSugeridas: [
      "Escolher 1 refeição do dia (preferencialmente o lanche) para ser 100% sem telas",
      "Avisar com 5 minutos de antecedência e usar um timer visual antes de desligar a tela",
      "Substituir a tela por uma conversa ou brincadeira sensorial com os alimentos (cores, sons, formas)",
    ],
    orientacaoPratoSeguro:
      "Durante o desmame, garantir que a refeição sem tela tenha 70% de alimentos de conforto para que a criança associe o momento a segurança, não a perda. Introduzir o desafio (10%) apenas nas refeições em que a tela já não está presente há alguns dias.",
  },
  {
    id: "autonomia-mesa",
    categoria: "autonomia",
    tituloCurto: "🖐️ Estímulo de Autonomia à Mesa",
    sinalAtencao: "Baixa autonomia / come com auxílio",
    gatilhosAnamnese: [
      "na boca", "da na boca", "com ajuda", "auxilio", "depende", "nao come sozinh", "precisa de ajuda",
      "alimentado por", "aviaozinho", "parcialmente",
    ],
    parecerClinicoSugerido:
      "A criança ainda depende do adulto para levar o alimento à boca, o que limita a exploração sensorial e o senso de controle sobre a própria alimentação. Estimular a autonomia — mesmo que com mais sujeira e menor volume no início — é um passo terapêutico essencial para aumentar a aceitação de novos alimentos.",
    alimentosAlvoSugeridos: [
      "Finger foods (bolinhos, palitos, cubinhos)", "Banana em rodelas", "Bolinho de arroz assado", "Frango desfiado em tirinhas",
    ],
    metasSemanaisSugeridas: [
      "Oferecer pelo menos 1 alimento em formato finger food em cada refeição para a criança pegar sozinha",
      "Disponibilizar talheres infantis e permitir que a criança se sirva de uma pequena porção",
      "Aceitar a sujeira como parte do aprendizado: forrar a mesa e evitar limpar o rosto a cada garfada",
    ],
    orientacaoPratoSeguro:
      "Montar o prato em compartimentos com porções pequenas e fáceis de pegar com as mãos. 70% finger foods de conforto, 20% ponte em formato semelhante e 10% desafio apenas para tocar/explorar.",
  },
  {
    id: "ansiedade-parental",
    categoria: "ansiedade_parental",
    tituloCurto: "💛 Desarme da Pressão à Mesa",
    sinalAtencao: "Ansiedade parental / pressão para comer",
    gatilhosAnamnese: [
      "mais uma", "insist", "obrig", "forc", "chantag", "recompensa", "sobremesa", "ameac", "castigo",
      "ansios", "culpa", "frustr", "preocupad", "desesper", "impotente", "cansad",
    ],
    parecerClinicoSugerido:
      "Percebemos um nível elevado de preocupação e cansaço da família em torno das refeições — algo totalmente compreensível. No entanto, estratégias de insistência ('só mais uma colherada'), recompensas ou negociações tendem a aumentar a aversão. Vamos aplicar a Divisão de Responsabilidades: os pais decidem o quê, quando e onde servir; a criança decide se e quanto vai comer.",
    alimentosAlvoSugeridos: [
      "Alimentos de conforto da criança", "Preparações da refeição da família em versão desconstruída",
    ],
    metasSemanaisSugeridas: [
      "Eliminar frases de pressão ('come mais um pouco', 'só mais uma') durante toda a semana",
      "Não usar sobremesa ou telas como recompensa por comer",
      "Fazer pelo menos 1 refeição em família por dia com conversa sobre temas que não sejam a comida",
    ],
    orientacaoPratoSeguro:
      "Servir sempre ao menos 1 alimento seguro em quantidade suficiente para a criança não sair com fome. O desafio (10%) apenas fica disponível no prato ou na travessa — sem comentários, sem contagem de garfadas.",
  },
  {
    id: "hipersensibilidade-sensorial",
    categoria: "sensorial",
    tituloCurto: "👃 Dessensibilização Olfativa & Tátil",
    sinalAtencao: "Hipersensibilidade sensorial (cheiro/toque)",
    gatilhosAnamnese: [
      "cheiro", "olfat", "tocar", "encostar", "tatil", "sensorial", "nojo", "tampa o nariz", "limpa as maos",
      "nao toca", "sujar", "tea", "autis", "processamento sensorial",
    ],
    parecerClinicoSugerido:
      "As respostas indicam desconforto intenso com cheiros e com o contato de alimentos na pele, sugerindo um perfil de hipersensibilidade sensorial. Nessa fase, o objetivo não é a ingestão, e sim tornar o alimento tolerável no ambiente — subindo os primeiros degraus da Escada do Comer (Tolerou → Cheirou → Tocou) através de brincadeiras fora do horário das refeições.",
    alimentosAlvoSugeridos: [
      "Frutas de cheiro suave (pera, banana)", "Legumes cozidos neutros (chuchu, abobrinha)", "Massinha caseira de farinha para brincar",
    ],
    metasSemanaisSugeridas: [
      "Realizar 3 brincadeiras sensoriais fora das refeições (carimbo de legumes, caixa tátil, massinha)",
      "Manter o alimento-alvo à vista na mesa sem exigir contato",
      "Registrar no Diário cada vez que a criança tolerar o cheiro ou tocar voluntariamente",
    ],
    orientacaoPratoSeguro:
      "Usar o prato de apoio (pratinho branco ao lado) para o alimento-desafio, evitando que ele encoste nos alimentos seguros. Preferir preparações de aroma suave e temperatura morna nesta fase.",
  },
  {
    id: "monotonia-food-jag",
    categoria: "monotonia",
    tituloCurto: "🔁 Variação Mínima em Food Jag",
    sinalAtencao: "Monotonia alimentar / marca específica",
    gatilhosAnamnese: [
      "marca", "mesma marca", "todo dia", "exige", "sempre o mesmo", "embalagem", "food jag",
      "so aceita", "sofrimento", "choro intenso", "se faltar", "repertorio restrito", "menos de 20", "menos de 10",
    ],
    parecerClinicoSugerido:
      "Identificamos um repertório restrito com exigência de alimentos específicos (por vezes da mesma marca ou embalagem) e sofrimento quando eles faltam — o chamado food jag. Para evitar que a criança 'enjoe' e perca esses alimentos seguros, vamos introduzir micro-variações planejadas (forma, cor, corte, marca) mantendo sempre a base conhecida.",
    alimentosAlvoSugeridos: [
      "Mesmo alimento seguro em outro formato de corte", "Versão caseira do alimento industrializado aceito", "Alimento-ponte da mesma cor e textura",
    ],
    metasSemanaisSugeridas: [
      "Não oferecer o mesmo alimento seguro em duas refeições seguidas, alternando entre 2 ou 3 opções aceitas",
      "Fazer 1 micro-variação por semana (ex.: trocar o formato do corte ou a cor do prato)",
      "Apresentar a embalagem nova ao lado da antiga, deixando a criança comparar sem pressão",
    ],
    orientacaoPratoSeguro:
      "70% alimentos seguros em rodízio (nunca o mesmo duas vezes seguidas), 20% ponte com micro-variação (formato/marca/cor) e 10% desafio da mesma família sensorial.",
  },
  {
    id: "gag-medo-novo",
    categoria: "nausea_medo",
    tituloCurto: "🫣 Manejo de Gag & Neofobia",
    sinalAtencao: "Reflexo de náusea / medo de novos alimentos",
    gatilhosAnamnese: [
      "engasg", "nausea", "ansia", "vomit", "gag", "medo", "neofobia", "recusa sem provar", "chora",
      "experiencia negativa", "dificuldade para mastigar", "dificuldade para engolir", "cospe",
    ],
    parecerClinicoSugerido:
      "Há relato de ânsia, engasgos ou medo intenso diante de alimentos novos, o que faz a criança associar a refeição a perigo. É fundamental respeitar o ritmo e nunca forçar a entrada do alimento na boca. Trabalharemos a previsibilidade (antecipar o que será servido), a exploração com os dedos e lábios e, se necessário, avaliação complementar com fonoaudiologia para motricidade oral.",
    alimentosAlvoSugeridos: [
      "Alimentos que dissolvem na boca (biscoito de polvilho, fruta liofilizada)", "Purês lisos e homogêneos", "Banana bem madura amassada",
    ],
    metasSemanaisSugeridas: [
      "Antecipar verbalmente o cardápio da refeição para reduzir a surpresa e a ansiedade",
      "Permitir que a criança cuspa o alimento em um guardanapo 'de descarte' sem repreensão",
      "Praticar 'beijinho no alimento' (encostar nos lábios) como uma conquista válida da semana",
    ],
    orientacaoPratoSeguro:
      "Iniciar com texturas homogêneas e que dissolvem facilmente; evitar alimentos com texturas mistas (ex.: iogurte com pedaços). O desafio entra em porção mínima (do tamanho de uma ervilha) apenas para exploração.",
  },
];

// ===================================================================
// CRUD DE RESPOSTAS PERSONALIZADAS (localStorage)
// ===================================================================
export function carregarRespostasCustom(): ProtocoloClinico[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHAVE_BANCO_CUSTOM);
    const lista = raw ? (JSON.parse(raw) as ProtocoloClinico[]) : [];
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

function persistirRespostasCustom(lista: ProtocoloClinico[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHAVE_BANCO_CUSTOM, JSON.stringify(lista));
  window.dispatchEvent(new CustomEvent(EVENTO_BANCO_ATUALIZADO));
}

/** Retorna os protocolos padrão + personalizados (personalizados primeiro). */
export function carregarBancoCompleto(): ProtocoloClinico[] {
  return [...carregarRespostasCustom(), ...PROTOCOLOS_PADRAO];
}

export type NovaRespostaCustom = Partial<Omit<ProtocoloClinico, "id" | "personalizado" | "criadoEm">> & {
  tituloCurto: string;
};

export function salvarRespostaCustom(dados: NovaRespostaCustom): ProtocoloClinico {
  const nova: ProtocoloClinico = {
    id: `custom-${Date.now()}`,
    categoria: dados.categoria || "personalizado",
    tituloCurto: dados.tituloCurto.trim() || "⭐ Resposta Personalizada",
    gatilhosAnamnese: dados.gatilhosAnamnese || [],
    sinalAtencao: dados.sinalAtencao,
    parecerClinicoSugerido: dados.parecerClinicoSugerido || "",
    alimentosAlvoSugeridos: dados.alimentosAlvoSugeridos || [],
    metasSemanaisSugeridas: dados.metasSemanaisSugeridas || [],
    orientacaoPratoSeguro: dados.orientacaoPratoSeguro || "",
    personalizado: true,
    criadoEm: new Date().toISOString(),
  };

  const listaAtualizada = [nova, ...carregarRespostasCustom()];
  persistirRespostasCustom(listaAtualizada);

  // Sincroniza em segundo plano com a tabela respostas_rapidas_nutri no Supabase
  if (typeof window !== "undefined") {
    fetch("/api/nutri", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "salvar_resposta_rapida",
        categoria: nova.categoria,
        titulo: nova.tituloCurto,
        texto: JSON.stringify(nova),
      }),
    }).catch((err) => console.warn("Aviso ao persistir resposta rápida na nuvem:", err));
  }

  return nova;
}

export function editarRespostaCustom(id: string, alteracoes: Partial<ProtocoloClinico>): ProtocoloClinico | null {
  let atualizado: ProtocoloClinico | null = null;
  const lista = carregarRespostasCustom().map((p) => {
    if (p.id !== id) return p;
    atualizado = { ...p, ...alteracoes, id: p.id, personalizado: true };
    return atualizado;
  });
  persistirRespostasCustom(lista);
  return atualizado;
}

export function excluirRespostaCustom(id: string): void {
  persistirRespostasCustom(carregarRespostasCustom().filter((p) => p.id !== id));

  // Remove também do Supabase caso exista
  if (typeof window !== "undefined") {
    fetch("/api/nutri", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "excluir_resposta_rapida",
        id,
      }),
    }).catch((err) => console.warn("Aviso ao excluir resposta rápida no Supabase:", err));
  }
}

/** Sincroniza o banco local com o Supabase ao iniciar */
export async function sincronizarRespostasCustomComSupabase(): Promise<ProtocoloClinico[]> {
  const locais = carregarRespostasCustom();
  if (typeof window === "undefined") return locais;
  try {
    const res = await fetch("/api/nutri?tipo=respostas_rapidas");
    const data = await res.json();
    if (data.success && Array.isArray(data.respostas_rapidas) && data.respostas_rapidas.length > 0) {
      const doBanco: ProtocoloClinico[] = data.respostas_rapidas.map((r: any) => {
        let payload: any = {};
        try {
          payload = JSON.parse(r.texto);
        } catch {
          payload = { parecerClinicoSugerido: r.texto };
        }
        return {
          id: r.id,
          categoria: (r.categoria as CategoriaProtocolo) || "personalizado",
          tituloCurto: r.titulo,
          gatilhosAnamnese: payload.gatilhosAnamnese || [],
          sinalAtencao: payload.sinalAtencao,
          parecerClinicoSugerido: payload.parecerClinicoSugerido || r.texto,
          alimentosAlvoSugeridos: payload.alimentosAlvoSugeridos || [],
          metasSemanaisSugeridas: payload.metasSemanaisSugeridas || [],
          orientacaoPratoSeguro: payload.orientacaoPratoSeguro || "",
          personalizado: true,
          criadoEm: r.created_at,
        };
      });

      const mesclados = [...locais];
      doBanco.forEach((b) => {
        if (!mesclados.some((m) => m.id === b.id || m.tituloCurto === b.tituloCurto)) {
          mesclados.push(b);
        }
      });
      persistirRespostasCustom(mesclados);
      return mesclados;
    }
  } catch (err) {
    console.warn("Aviso ao sincronizar respostas rápidas com o Supabase:", err);
  }
  return locais;
}

// ===================================================================
// MOTOR DE PRÉ-ANÁLISE DA ANAMNESE
// ===================================================================
export interface MatchProtocolo {
  protocolo: ProtocoloClinico;
  pontuacao: number;
  gatilhosEncontrados: string[];
}

export interface ResultadoPreAnalise {
  sinaisAtencao: { rotulo: string; categoria: CategoriaProtocolo }[];
  recomendacoes: MatchProtocolo[];
  /** true quando a anamnese ainda não possui respostas suficientes (< 3 campos) */
  aguardandoPreenchimento: boolean;
  /** true quando o usuário ativou o modo de simulação com caso demonstrativo */
  simulandoExemplo: boolean;
}

/** Remove acentos e normaliza para comparação de palavras-chave. */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function achatarValores(valor: unknown, acc: string[]) {
  if (valor === null || valor === undefined || valor === false) return;
  if (Array.isArray(valor)) {
    valor.forEach((v) => achatarValores(v, acc));
  } else if (typeof valor === "object") {
    Object.values(valor as Record<string, unknown>).forEach((v) => achatarValores(v, acc));
  } else {
    acc.push(String(valor));
  }
}

/** Perfil de exemplo coerente para simulação demonstrativa solicitada pela nutricionista. */
const RESPOSTAS_DEMONSTRATIVAS: Record<string, unknown> = {
  diagnosticos: ["Suspeita de TEA"],
  exigeTodoDia: "Biscoito de polvilho",
  sofrimentoFalta: "Choro intenso e recusa de outros alimentos",
  usoTelas: "Sempre",
  independencia: "Come parcialmente sozinho, precisa de ajuda",
  dificuldadeMastigacao: ["Dificuldade com texturas"],
};

export function analisarAnamnese(
  respostas: Record<string, unknown> | null | undefined,
  perfilExtra?: { alimentos_conforto?: string; principais_recusas?: string },
  banco: ProtocoloClinico[] = carregarBancoCompleto(),
  simularExemplo: boolean = false
): ResultadoPreAnalise {
  const base = respostas || {};
  const chavesPreenchidas = Object.values(base).filter(
    (v) => v !== "" && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)
  ).length;

  const totalCamposReais =
    chavesPreenchidas +
    (perfilExtra?.alimentos_conforto ? 1 : 0) +
    (perfilExtra?.principais_recusas ? 1 : 0);

  // Se o paciente real não respondeu a anamnese (menos de 3 campos) e não está em simulação:
  // Exibe estado informativo limpo sem preenchimento silencioso de dados fictícios.
  if (totalCamposReais < 3 && !simularExemplo) {
    return {
      sinaisAtencao: [],
      recomendacoes: [],
      aguardandoPreenchimento: true,
      simulandoExemplo: false,
    };
  }

  // Fonte de dados: estritamente real OU caso demonstrativo se a nutri clicou para simular
  const fonte: Record<string, unknown> = simularExemplo ? { ...RESPOSTAS_DEMONSTRATIVAS, ...base } : base;

  const partes: string[] = [];
  achatarValores(fonte, partes);
  if (perfilExtra?.alimentos_conforto) partes.push(perfilExtra.alimentos_conforto);
  if (perfilExtra?.principais_recusas) partes.push(perfilExtra.principais_recusas);

  // Tokens sintéticos para regras estruturadas
  const usoTelas = typeof fonte.usoTelas === "string" ? normalizarTexto(fonte.usoTelas) : "";
  if (usoTelas && usoTelas !== "nunca") partes.push("usa_telas_refeicao");

  const texto = ` ${normalizarTexto(partes.join(" | "))} `;

  const recomendacoes: MatchProtocolo[] = banco
    .map((protocolo) => {
      const gatilhosEncontrados = protocolo.gatilhosAnamnese.filter((g) => {
        const gNorm = normalizarTexto(g).trim();
        if (!gNorm) return false;
        // Gatilhos curtos (ex.: "tv", "tea") exigem palavra inteira
        if (gNorm.length <= 3) return new RegExp(`[^a-z]${gNorm}[^a-z]`).test(texto);
        return texto.includes(gNorm);
      });
      return { protocolo, pontuacao: gatilhosEncontrados.length, gatilhosEncontrados };
    })
    .filter((m) => m.pontuacao > 0)
    .sort((a, b) => b.pontuacao - a.pontuacao);

  const sinaisAtencao = recomendacoes
    .filter((m) => m.protocolo.sinalAtencao)
    .map((m) => ({ rotulo: m.protocolo.sinalAtencao as string, categoria: m.protocolo.categoria }))
    .filter((s, i, arr) => arr.findIndex((x) => x.rotulo === s.rotulo) === i);

  return {
    sinaisAtencao,
    recomendacoes,
    aguardandoPreenchimento: false,
    simulandoExemplo: Boolean(simularExemplo),
  };
}

/** Concatena textos de forma organizada, evitando duplicar um bloco já presente. */
export function concatenarTexto(atual: string, novo: string): string {
  const a = atual.trim();
  const n = novo.trim();
  if (!n) return a;
  if (!a) return n;
  if (a.includes(n)) return a;
  return `${a}\n\n${n}`;
}

/** Mescla listas sem duplicatas (case-insensitive), descartando itens vazios. */
export function mesclarListas(atual: string[], novos: string[]): string[] {
  const resultado = atual.filter((x) => x.trim().length > 0);
  novos.forEach((n) => {
    if (!resultado.some((r) => normalizarTexto(r) === normalizarTexto(n))) resultado.push(n);
  });
  return resultado;
}
