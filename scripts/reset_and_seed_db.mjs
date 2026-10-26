import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env.local");

if (!fs.existsSync(envPath)) {
  console.error("❌ Arquivo .env.local não encontrado!");
  process.exit(1);
}

// Leitura manual simples e segura do .env.local
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split(/\r?\n/).forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx !== -1) {
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    val = val.replace(/\\([$"\\])/g, "$1");
    env[key] = val;
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos no .env.local!");
  process.exit(1);
}

console.log("🔗 Conectando ao Supabase em:", SUPABASE_URL);
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log("==================================================================");
  console.log("🧹 LIMPEZA TOTAL DE PRODUÇÃO & PREPARAÇÃO DE CONTAS");
  console.log("==================================================================");

  // 1. Limpeza de todas as tabelas na ordem de dependência
  const tabelas = [
    "mensagens_chat",
    "diario_refeicoes",
    "agendamentos",
    "anamneses",
    "faturas",
    "devolutivas_semanais",
    "prescricoes_plano",
    "respostas_rapidas_nutri",
    "profiles",
  ];

  for (const tabela of tabelas) {
    console.log(`🗑️  Limpando tabela '${tabela}'...`);
    const { error } = await supabase
      .from(tabela)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      console.warn(`⚠️ Aviso ao limpar tabela ${tabela}:`, error.message);
    } else {
      console.log(`✅ Tabela '${tabela}' 100% esvaziada.`);
    }
  }

  // 2. Exclusão de TODOS os usuários do Supabase Auth
  console.log("\n👤 Listando e removendo todos os usuários do Supabase Auth...");
  try {
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listError) {
      console.warn("⚠️ Erro ao listar usuários do Auth:", listError.message);
    } else if (usersData?.users && usersData.users.length > 0) {
      console.log(`Encontrados ${usersData.users.length} usuários para excluir.`);
      for (const u of usersData.users) {
        console.log(`  Excluindo usuário Auth: ${u.email} (${u.id})`);
        const { error: delErr } = await supabase.auth.admin.deleteUser(u.id);
        if (delErr) {
          console.warn(`  ⚠️ Erro ao excluir usuário ${u.email}:`, delErr.message);
        }
      }
      console.log("✅ Todos os usuários antigos do Auth foram removidos.");
    } else {
      console.log("ℹ️ Nenhum usuário antigo encontrado no Auth.");
    }
  } catch (authErr) {
    console.warn("⚠️ Aviso na limpeza do Auth:", authErr.message);
  }

  // 3. Criando a conta oficial da nutricionista (DRA. LAÍS LELES)
  console.log("\n==================================================================");
  console.log("🌱 CRIANDO CONTA OFICIAL DA NUTRICIONISTA (DRA. LAÍS LELES)");
  console.log("==================================================================");

  const emailNutri = "metodonutrindoemcasa@gmail.com";
  const senhaNutri = "25012507La*";

  const { data: nutriAuth, error: nutriAuthErr } = await supabase.auth.admin.createUser({
    email: emailNutri,
    password: senhaNutri,
    email_confirm: true,
    user_metadata: {
      name: "Dra. Laís Leles",
      role: "nutri",
      tour_oculto: false,
    },
  });

  let finalNutriId = nutriAuth?.user?.id;
  if (nutriAuthErr) {
    console.warn("⚠️ Aviso ao criar Auth da Dra. Laís, buscando para atualizar senha:", nutriAuthErr.message);
    const { data: usersData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const u = usersData?.users?.find((usr) => usr.email?.toLowerCase() === emailNutri);
    if (u) {
      finalNutriId = u.id;
      await supabase.auth.admin.updateUserById(u.id, {
        password: senhaNutri,
        email_confirm: true,
        user_metadata: {
          name: "Dra. Laís Leles",
          role: "nutri",
          tour_oculto: false,
        },
      });
      console.log(`✅ Senha da Dra. Laís sincronizada e atualizada com sucesso para: ${senhaNutri}`);
    }
  } else {
    console.log(`✅ Usuário Auth oficial criado: ${emailNutri} (ID: ${nutriAuth.user.id})`);
  }

  const { error: nutriProfileErr } = await supabase.from("profiles").upsert(
    {
      id: finalNutriId || undefined,
      email: emailNutri,
      nome: "Dra. Laís Leles",
      cpf: "24971563792",
      telefone: "41984926020",
      plano: "nutri",
      status_assinatura: "ATIVO",
      notificacoes_email: true,
    },
    { onConflict: "email" }
  );

  if (nutriProfileErr) {
    console.error("❌ Erro ao criar perfil da Dra. Laís:", nutriProfileErr.message);
  } else {
    console.log(`✅ Perfil oficial da Dra. Laís salvo na tabela 'profiles'.`);
  }
  console.log("ℹ️ Dra. Laís NÃO possui registros em anamneses nem agendamentos (não aparece como paciente dela mesma).");

  // 4. Criando a conta de teste do Lucas com Anamnese 100% preenchida (56 perguntas)
  console.log("\n==================================================================");
  console.log("🌱 CRIANDO CONTA PACIENTE (LUCAS LIMA LELES & JOÃOZINHO)");
  console.log("==================================================================");

  const emailLucas = "lucaslimaleles@gmail.com";
  const senhaLucas = "12345678a";

  const { data: lucasAuth, error: lucasAuthErr } = await supabase.auth.admin.createUser({
    email: emailLucas,
    password: senhaLucas,
    email_confirm: true,
    user_metadata: {
      name: "Lucas Lima Leles",
      role: "cliente",
      tour_oculto: false,
    },
  });

  let finalLucasId = lucasAuth?.user?.id;
  if (lucasAuthErr) {
    console.warn("⚠️ Aviso ao criar Auth do Lucas, buscando para atualizar senha:", lucasAuthErr.message);
    const { data: usersData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const u = usersData?.users?.find((usr) => usr.email?.toLowerCase() === emailLucas);
    if (u) {
      finalLucasId = u.id;
      await supabase.auth.admin.updateUserById(u.id, {
        password: senhaLucas,
        email_confirm: true,
        user_metadata: {
          name: "Lucas Lima Leles",
          role: "cliente",
          tour_oculto: false,
        },
      });
      console.log(`✅ Senha do Lucas sincronizada e atualizada com sucesso para: ${senhaLucas}`);
    }
  } else {
    console.log(`✅ Usuário Auth do Lucas criado: ${emailLucas} (ID: ${lucasAuth.user.id})`);
  }

  const { error: lucasProfileErr } = await supabase.from("profiles").upsert(
    {
      id: finalLucasId || undefined,
      email: emailLucas,
      nome: "Lucas Lima Leles",
      cpf: "04981726591",
      telefone: "41988887777",
      nome_crianca: "Joãozinho",
      idade_crianca: "3 anos",
      alimentos_conforto: "Biscoito de polvilho crocante, banana prata, batata frita, macarrão puro",
      principais_recusas: "Carnes fibrosas, vegetais úmidos e escuros, misturas com molho",
      plano: "Trimestral",
      status_assinatura: "ATIVO",
      notificacoes_email: true,
    },
    { onConflict: "email" }
  );

  if (lucasProfileErr) {
    console.error("❌ Erro ao criar perfil do Lucas:", lucasProfileErr.message);
  } else {
    console.log("✅ Perfil do paciente Lucas salvo na tabela 'profiles' (Plano Trimestral Ativo).");
  }

  // 1 Fatura Paga de R$ 239,70 para a conta do Lucas (Plano Trimestral)
  const { error: faturaErr } = await supabase.from("faturas").upsert(
    {
      user_email: emailLucas,
      asaas_payment_id: "pay_lucas_trimestral_01",
      descricao: "Assinatura Nutrindo em Casa - Plano Trimestral",
      valor: 239.70,
      forma_pagamento: "CREDIT_CARD",
      status: "CONFIRMED",
      data_emissao: new Date().toISOString(),
    },
    { onConflict: "asaas_payment_id" }
  );

  if (faturaErr) {
    console.warn("⚠️ Aviso ao salvar fatura do Lucas:", faturaErr.message);
  } else {
    console.log("✅ 1 Fatura paga de R$ 239,70 salva na tabela 'faturas' para lucaslimaleles@gmail.com.");
  }

  // Anamnese Completa das 56 Perguntas
  const respostas56Lucas = {
    // 1. Conhecendo a Criança e a Família
    nomeCrianca: "Joãozinho",
    dataNascimento: "2023-05-10",
    sexo: "Masculino",
    nomeResponsavel: "Lucas Lima Leles",
    parentesco: "Pai",
    participaAlimentacao: ["Mãe", "Pai", "Babá / Cuidadora"],
    motivos: [
      "Recusa de novos alimentos e grupos inteiros",
      "Só come alimentos secos e crocantes",
      "Uso obrigatório de celular/desenho durante as refeições",
      "Reflexo de náusea e ânsia só de ver comida diferente no prato",
    ],
    diagnosticos: ["Suspeita de TEA / Perfil Sensorial Atípico"],
    nivelTEA: "Nível 1 de suporte",
    comunicacao: "Frases curtas e gestos; chora e grita quando frustrado à mesa",

    // 2. Histórico de Saúde & Aleitamento
    gestacao: ["A termo", "Sem intercorrências graves"],
    semanasNascimento: "39",
    pesoNascer: "3.250g",
    aleitamento: "Materno até 6 meses",
    aleitamentoFimMeses: "6",
    formulaInicioMeses: "6",
    dificuldadesAmamentacao: ["Nenhuma dificuldade relevante"],
    idadeInicioIA: "6 meses",
    metodoIA: "Tradicional com papinhas e purês",
    dificuldadesIA: [
      "Engasgos frequentes na transição para pedaços",
      "Reflexo de náusea/gag exacerbado ao sentir textura fibrosa",
    ],
    inicioDificuldadesAtuais: "Aos 14 meses, após engasgo com carne desfiada",
    eventosAssociados: ["Engasgo prévio com carne", "Entrada na escolinha aos 2 anos"],
    gastro: ["Histórico de refluxo fisiológico leve até 9 meses"],
    sintomasAdversos: "Nenhum sintoma alérgico imediato",
    pesoAtual: "14.5 kg",
    dataMedidaPeso: "2026-10-10",
    alturaAtual: "97 cm",
    dataMedidaAltura: "2026-10-10",
    medicamentos: "Nenhum medicamento contínuo",
    suplementos: ["Vitamina D (gotas)", "Ômega 3 infantil"],
    exames: "Hemograma recente sem anemia (ferritina 38 ng/mL)",

    // 3. Mapa Alimentar & Repertório
    cereais: ["Biscoito de polvilho", "Arroz branco soltinho", "Pão francês bem torrado", "Pipoca", "Batata frita sequinha"],
    proteinas: ["Ovo mexido bem passado", "Nuggets de frango bem sequinhos"],
    frutas: ["Banana prata", "Maçã fuji em fatias bem finas e crocantes"],
    vegetais: [], // Ponto de atenção: 0 vegetais
    leguminosas: ["Caldo ralo de feijão carioca (apenas o caldo sem grão)"],
    qntAlimentos: "Menos de 10 alimentos aceitos no repertório total",

    // 4. Perfil Sensorial & Comportamento
    comerFora: "Muita dificuldade em festas e restaurantes; só aceita se levar o biscoito de casa",
    exigeTodoDia: "Biscoito de polvilho crocante e banana prata",
    sofrimentoFalta: "Choro intenso, gritos e recusa total de qualquer outra opção (jejum voluntário)",
    influencias: ["Cheiros fortes de tempero", "Texturas úmidas ou pastosas", "Barulho na cozinha"],
    mudancasMatriz: {
      marca: "Só aceita biscoito de polvilho da marca X (embalagem vermelha)",
      preparo: "Só aceita se estiver muito crocante e sequinho",
      apresentacao: "Não aceita se o biscoito vier quebrado",
      encostando: "Recusa o prato inteiro se a banana encostar no arroz",
      misturados: "Recusa completa de pratos misturados (tortas, risotos, sopas)",
    },
    comportamentoNovo: ["Vira o rosto imediatamente", "Afasta o prato com a mão", "Chora se insistirem"],
    utensilios: ["Come a maioria dos alimentos com a mão", "Usa colher apenas para o caldo"],
    independencia: "Prefere ser alimentado na boca quando está distraído",
    dificuldadeMastigacao: [
      "Cansaço rápido para mastigar alimentos que exigem força",
      "Engole pedaços de carne quase sem mastigar",
    ],

    // 5. Rotina das Refeições & Telas
    horarios: {
      cafeDaManha: { horario: "08:00", naoFaz: false },
      lancheManha: { horario: "10:30", naoFaz: false },
      almoco: { horario: "12:30", naoFaz: false },
      lancheTarde: { horario: "16:00", naoFaz: false },
      jantar: { horario: "19:30", naoFaz: false },
      ceia: { horario: "21:00", naoFaz: false },
    },
    locaisRefeicao: ["Em frente à TV na sala"],
    usoTelas: "Sempre assiste desenho no tablet/TV durante o almoço e jantar",
    reacaoSemTela: ["Para imediatamente de mastigar", "Levanta da mesa e chora"],
    refeicoesIncompletas: ["Almoço e jantar frequentemente incompletos"],

    // 6. Manejo Familiar & Recusa
    acoesRecusa: ["Tentamos negociar mais uma garfada", "Oferecemos sobremesa se comer um pedacinho", "Ficamos angustiados"],
    freqSubstituicao: "Quase sempre substituímos por leite com farinha ou biscoito se não almoçar",
    motivosSubstituicao: ["Medo de ficar com fome", "Medo de perder peso ou não dormir à noite"],
    sentimentosPais: ["Exaustão diária", "Medo de desnutrição", "Culpa e brigas conjugais na hora das refeições"],

    // 7. Sinais de Alerta Nutricional & Medos
    situacoesNutricionais: ["Ganho de peso lento nos últimos 6 meses", "Palidez cutânea leve"],
    medosAlimentares: ["Medo evidente de engasgar ao ver pedaços novos", "Ânsia ao sentir o cheiro de comida quente"],
    comportamentosAtipicos: ["Reflexo de náusea/gag só de ver molho ou legumes no prato"],

    // 8. Saúde Intestinal, Ingestão Hídrica & Motivação
    aguaQuantidade: "Aproximadamente 450ml por dia",
    tamanhoCopoMl: "150",
    freqIntestino: "A cada 2 ou 3 dias",
    tipoBristol: "Tipo 2 (fezes em grumos duros e ressecados)",
    sintomasIntestino: ["Dor e esforço ao evacuar"],
    interessesFavoritos: "Dinossauros (T-Rex), carrinhos hot wheels e instrumentos musicais",
    motivacaoCrianca: "Brincadeiras sensoriais com cores e dinossauros",
    informacoesAdicionais: "Estamos muito esperançosos com o acompanhamento da Dra. Laís. Queremos que as refeições voltem a ser momentos de paz em família sem choro e sem brigas.",
  };

  const { error: anamneseErr } = await supabase.from("anamneses").upsert(
    {
      user_email: emailLucas,
      concluida: true,
      respostas: {
        ...respostas56Lucas,
        _tour_oculto: false,
        aulas_concluidas: [],
        anotacoes_clinicas: "Paciente com seletividade sensorial acentuada para texturas úmidas/pastosas e dependência de telas no almoço. Iniciar aproximação gradual de cenoura assada crocante e tiras de frango sem pressão.",
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_email" }
  );

  if (anamneseErr) {
    console.error("❌ Erro ao salvar anamnese do Lucas:", anamneseErr.message);
  } else {
    console.log("✅ Anamnese das 56 perguntas salva com sucesso para lucaslimaleles@gmail.com.");
  }

  console.log("ℹ️ Zero consultas em 'agendamentos' (conta no estado exato pós-anamnese para agendar 1ª consulta).");
  console.log("ℹ️ Zero devolutivas em 'devolutivas_semanais' (pronto para primeira devolutiva após consulta).");
  console.log("ℹ️ Zero refeições em 'diario_refeicoes' e zero mensagens em 'mensagens_chat'.");

  // 5. Banco de Respostas Rápidas inicia 100% vazio para a nutricionista cadastrar seus próprios modelos
  console.log("\n💬 Banco de Respostas Rápidas mantido 100% limpo (autonomia total da Dra. Laís).");

  console.log("\n==================================================================");
  console.log("✨ BANCO RESETADO: APENAS NUTRI + CONTA DO LUCAS PÓS-ANAMNESE!");
  console.log("==================================================================");
  console.log("👩‍⚕️ NUTRICIONISTA OFICIAL:");
  console.log("   E-mail: metodonutrindoemcasa@gmail.com");
  console.log("   Senha:  25012507La*");
  console.log("   Role:   nutri (tour_oculto: false)");
  console.log("\n👶 PACIENTE PÓS-ANAMNESE (PRONTO PARA AGENDAR 1ª CONSULTA):");
  console.log("   E-mail: lucaslimaleles@gmail.com");
  console.log("   Senha:  12345678a");
  console.log("   Filho:  Joãozinho (3 anos) • Plano Trimestral Ativo (1 fatura paga de R$ 239,70)");
  console.log("   Anamnese: CONCLUÍDA (56 perguntas respondidas, _tour_oculto: false)");
  console.log("   Consulta: NÃO AGENDADA (zero agendamentos, zero devolutivas)");
  console.log("==================================================================\n");
}

main().catch((err) => {
  console.error("❌ Erro fatal durante a execução do script:", err);
  process.exit(1);
});
