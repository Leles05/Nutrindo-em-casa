import type { SupabaseClient } from "@supabase/supabase-js";
import { criarCobrancaParcelada, listarParcelas, mensagemErroAsaas, type AsaasConfig } from "@/lib/asaas";
import { enviarEmail, montarEmail } from "@/lib/email";
import { urlDoSite } from "@/lib/acesso";
import { compraPaga, gravarFaturasDasParcelas, ipParaAsaas } from "@/lib/parcelado";
import { ehPlano, MESES_DO_PLANO, normalizarParcelas, PLANOS, somarMeses } from "@/lib/planos";

/** Quantas tentativas diárias de cobrança antes de marcar o cliente como inadimplente. */
export const MAX_TENTATIVAS_RENOVACAO = 3;
/** Quantos dias antes da renovação o cliente é avisado por e-mail. */
export const DIAS_AVISO_RENOVACAO = 7;

export interface PerfilRenovacao {
  email: string;
  nome: string | null;
  plano: string | null;
  parcelas: number | null;
  asaas_customer_id: string | null;
  proxima_cobranca: string;
  renovacao_falhas: number | null;
  status_assinatura: string | null;
}

export type ResultadoRenovacao = "renovado" | "falha" | "inadimplente" | "ignorado";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBR = (ymd: string) => ymd.split("-").reverse().join("/");

/** Avisa por e-mail, uma única vez por ciclo, que a renovação automática se aproxima. */
export async function avisarRenovacao(admin: SupabaseClient, perfil: PerfilRenovacao): Promise<boolean> {
  if (!ehPlano(perfil.plano)) return false;
  const plano = perfil.plano;
  const parcelas = normalizarParcelas(plano, perfil.parcelas, PLANOS[plano].valor) || 1;
  const { data: cartao } = await admin.from("cartoes_salvos").select("ultimos4, bandeira").eq("user_email", perfil.email).maybeSingle();

  const valor = PLANOS[plano].valor;
  const detalheParcelas = parcelas > 1 ? ` em ${parcelas}x de ${brl(valor / parcelas)}` : "";
  const enviado = await enviarEmail({
    para: perfil.email,
    assunto: `Sua assinatura Nutrindo em Casa renova em ${dataBR(perfil.proxima_cobranca)}`,
    html: montarEmail(
      "Sua assinatura será renovada em breve",
      [
        `Olá, ${perfil.nome || "tudo bem"}! No dia ${dataBR(perfil.proxima_cobranca)} o seu Plano ${PLANOS[plano].nome} será renovado automaticamente, no valor de ${brl(valor)}${detalheParcelas}.`,
        cartao?.ultimos4
          ? `A cobrança será feita no cartão ${cartao.bandeira || ""} final ${cartao.ultimos4}, o mesmo usado na sua compra.`
          : "A cobrança será feita no cartão usado na sua compra.",
        "Se preferir não renovar, você pode cancelar a qualquer momento em Configurações > Assinatura, antes dessa data.",
      ],
      { texto: "Gerenciar minha assinatura", url: `${urlDoSite()}/configuracoes` }
    ),
  });
  if (enviado) {
    await admin.from("profiles").update({ renovacao_aviso_ciclo: perfil.proxima_cobranca }).eq("email", perfil.email);
  }
  return enviado;
}

/**
 * Gera a nova fatura e cobra no cartão salvo (token). Seguro contra execução dupla:
 * a "reserva" do dia é feita com um UPDATE condicional (só uma execução consegue).
 */
export async function renovarPerfil(
  admin: SupabaseClient,
  cfg: AsaasConfig,
  perfil: PerfilRenovacao,
  hoje: string
): Promise<ResultadoRenovacao> {
  // 1. Reserva a tentativa do dia (no máximo 1 por dia por cliente)
  const { data: reservado } = await admin
    .from("profiles")
    .update({ renovacao_ultima_tentativa: hoje })
    .eq("email", perfil.email)
    .eq("proxima_cobranca", perfil.proxima_cobranca)
    .eq("renovacao_automatica", true)
    .or(`renovacao_ultima_tentativa.is.null,renovacao_ultima_tentativa.lt.${hoje}`)
    .select("email");
  if (!reservado || reservado.length === 0) return "ignorado";

  const registrarFalha = async (motivo: string): Promise<ResultadoRenovacao> => {
    const falhas = (perfil.renovacao_falhas || 0) + 1;
    const esgotou = falhas >= MAX_TENTATIVAS_RENOVACAO;
    await admin
      .from("profiles")
      .update({ renovacao_falhas: falhas, ...(esgotou ? { status_assinatura: "INADIMPLENTE" } : {}) })
      .eq("email", perfil.email);
    console.error(`Renovação falhou (${falhas}/${MAX_TENTATIVAS_RENOVACAO}) para um cliente: ${motivo}`);
    await enviarEmail({
      para: perfil.email,
      assunto: esgotou ? "Não conseguimos renovar sua assinatura" : "Houve um problema na renovação da sua assinatura",
      html: montarEmail(
        esgotou ? "Sua assinatura foi suspensa" : "Não conseguimos cobrar a renovação",
        esgotou
          ? [
              "Tentamos cobrar a renovação do seu plano algumas vezes, sem sucesso, e o acesso foi suspenso.",
              "Para reativar, é só fazer uma nova assinatura com um cartão válido ou pagar via Pix.",
            ]
          : [
              `A cobrança da renovação do seu plano não foi aprovada (${motivo}). Vamos tentar novamente amanhã.`,
              "Para evitar a suspensão do acesso, confira se o cartão cadastrado tem limite e está válido.",
            ],
        { texto: esgotou ? "Reativar minha assinatura" : "Ver minha assinatura", url: `${urlDoSite()}${esgotou ? "/pagamento" : "/configuracoes"}` }
      ),
    });
    return esgotou ? "inadimplente" : "falha";
  };

  // 2. Dados necessários
  if (!ehPlano(perfil.plano) || !perfil.asaas_customer_id) return registrarFalha("dados da assinatura incompletos");
  const plano = perfil.plano;
  const parcelas = normalizarParcelas(plano, perfil.parcelas, PLANOS[plano].valor) || 1;

  const { data: cartao } = await admin.from("cartoes_salvos").select("token, ip_compra").eq("user_email", perfil.email).maybeSingle();
  if (!cartao?.token) return registrarFalha("cartão salvo não encontrado");

  // 3. Nova fatura parcelada no cartão salvo (renovação sempre pelo preço de tabela, sem cupom)
  const valor = PLANOS[plano].valor;
  const cobranca = await criarCobrancaParcelada(cfg, {
    customerId: perfil.asaas_customer_id,
    valorTotal: valor,
    parcelas,
    descricao: `Renovação Nutrindo em Casa - Plano ${PLANOS[plano].nome}`,
    referencia: perfil.email,
    hoje,
    token: cartao.token,
    remoteIp: ipParaAsaas(cartao.ip_compra),
  });

  if (!cobranca.ok || !cobranca.data?.id || cobranca.data.status === "REFUSED") {
    return registrarFalha(mensagemErroAsaas(cobranca, "cartão recusado"));
  }

  const installmentId: string = cobranca.data.installment || cobranca.data.id;
  const paga = compraPaga(cobranca.data.status);
  const lista = cobranca.data.installment ? await listarParcelas(cfg, installmentId) : [cobranca.data];
  await gravarFaturasDasParcelas(admin, perfil.email, installmentId, lista, `Renovação Nutrindo em Casa - Plano ${PLANOS[plano].nome}`);

  if (!paga) {
    // Cobrança criada mas ainda não confirmada: o webhook confirma; não avança o ciclo nem conta como falha
    console.warn("Renovação criada, aguardando confirmação do Asaas (status:", cobranca.data.status, ")");
    return "falha";
  }

  // 4. Avança o ciclo a partir da data de renovação (sem "deriva" por atraso na rotina)
  let proxima = somarMeses(perfil.proxima_cobranca, MESES_DO_PLANO[plano]);
  if (proxima <= hoje) proxima = somarMeses(hoje, MESES_DO_PLANO[plano]); // rotina ficou muito tempo parada
  await admin
    .from("profiles")
    .update({
      asaas_installment_id: cobranca.data.installment || null,
      status_assinatura: "ATIVO",
      proxima_cobranca: proxima,
      renovacao_falhas: 0,
      renovacao_aviso_ciclo: null,
      acesso_ate: null,
    })
    .eq("email", perfil.email);

  await enviarEmail({
    para: perfil.email,
    assunto: "Sua assinatura Nutrindo em Casa foi renovada",
    html: montarEmail(
      "Renovação concluída",
      [
        `Renovamos o seu Plano ${PLANOS[plano].nome}: ${brl(valor)}${parcelas > 1 ? ` em ${parcelas}x de ${brl(valor / parcelas)}` : ""}.`,
        `Sua próxima renovação será em ${dataBR(proxima)}. O comprovante de cada parcela está em Configurações > Faturas.`,
      ],
      { texto: "Ver minhas faturas", url: `${urlDoSite()}/configuracoes` }
    ),
  });
  return "renovado";
}
