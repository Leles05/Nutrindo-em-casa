import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { autenticar, cpfEhValido, ipDaRequisicao, normalizarEmail } from "@/lib/auth";
import { limitar } from "@/lib/rateLimit";
import { configMP, mensagemErroMP, mpFetch } from "@/lib/mercadopago";
import {
  alinharValorAssinatura,
  cancelarAssinaturaMP,
  cancelarPedidoMP,
  consultarCustosParcelamento,
  aguardarPedido,
  criarPedido,
  estornarPagamentoMP,
  estornarPedidoMP,
  custoDaParcela,
  extrairPix,
  metodoCartaoValido,
  montarAssinatura,
  montarPedidoCartao,
  montarPedidoPix,
  primeiraCobrancaDaAssinatura,
  referenciaExterna,
  tokenCartaoValido,
  totalConfere,
} from "@/lib/mpPedidos";
import { statusFaturaDaCobrancaAssinatura, statusFaturaDoPedido } from "@/lib/pagamentosEstado";
import {
  arredondar,
  calcularTotal,
  CREDITO_UPGRADE_TRIMESTRAL_PARA_ANUAL,
  ehPlano,
  hojeSP,
  MESES_DO_PLANO,
  normalizarParcelas,
  PLANOS,
  somarMeses,
  VALOR_MINIMO_COBRANCA,
} from "@/lib/planos";
import { buscarCupom, consumirCupom, devolverCupom, mensagemDoStatus, statusDoCupom } from "@/lib/cupons";
import { liberarAcessoPosPagamento, urlDoSite } from "@/lib/acesso";
import { registrarAceite, TERMOS_VERSAO } from "@/lib/termos";
import { criarTokenCompra } from "@/lib/tokenCompra";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Checkout (Pix ou cartão) com o Mercado Pago.
 *
 * Modelos de cobrança:
 *  - Pix .................. pedido (Orders) à vista. A renovação é por link enviado por e-mail (cron).
 *  - Cartão à vista ....... ASSINATURA do Mercado Pago: a 1ª cobrança é na hora e as renovações são automáticas.
 *  - Cartão parcelado ..... pedido (Orders) com N parcelas (primeira compra). A renovação é por link (cron).
 *
 * Segurança e regras de negócio:
 *  - O VALOR é calculado aqui (plano + cupom validado no banco). Qualquer valor vindo do navegador é ignorado.
 *  - O cartão chega como TOKEN gerado no navegador (MP.js): número e CVV nunca passam pelo nosso servidor.
 *  - Sem fallbacks: se o Mercado Pago recusar ou falhar, devolvemos erro e NÃO gravamos "pago/ativo" de mentira.
 *  - Upgrade (trimestral -> anual) exige estar logado e encerra a cobrança antiga.
 */

const erro = (message: string, status = 400) => NextResponse.json({ success: false, message }, { status });

/** O Mercado Pago exige um endereço HTTPS público para o retorno: fora da produção (localhost) usa o domínio oficial. */
function urlHttpsDoSite(): string {
  const url = urlDoSite();
  return url.startsWith("https://") ? url : "https://www.nutrindoemcasa.com.br";
}

function celularValido(valor: string) {
  const d = valor.replace(/\D/g, "");
  return d.length === 10 || d.length === 11;
}

export async function POST(request: Request) {
  let cupomConsumido: string | null = null;
  let pedidoCriadoId: string | null = null;
  let pedidoFoiPago = false; // pedido já aprovado: para desfazer é preciso ESTORNAR, não cancelar
  let pagamentoDaAssinatura: string | null = null; // cobrança já feita da assinatura criada
  let travaId: string | null = null; // trava contra clique duplo (só definida por quem a adquiriu)
  let assinaturaCriadaId: string | null = null;
  const cfg = configMP();
  const admin = isSupabaseConfigured() ? getSupabaseAdmin() : null;

  // Desfaz o que já foi feito se algo falhar no meio (cupom, pedido ou assinatura no Mercado Pago)
  const desfazer = async () => {
    try {
      if (cupomConsumido && admin) await devolverCupom(admin, cupomConsumido);
    } catch {}
    try {
      if (pedidoCriadoId && cfg) {
        if (pedidoFoiPago) await estornarPedidoMP(cfg, pedidoCriadoId);
        else await cancelarPedidoMP(cfg, pedidoCriadoId);
      }
    } catch {}
    try {
      if (assinaturaCriadaId && cfg) {
        await cancelarAssinaturaMP(cfg, assinaturaCriadaId);
        if (pagamentoDaAssinatura && /^\d+$/.test(pagamentoDaAssinatura)) await estornarPagamentoMP(cfg, pagamentoDaAssinatura);
        else if (pagamentoDaAssinatura) console.error("ATENÇÃO: assinatura desfeita após cobrança; estorne manualmente:", pagamentoDaAssinatura);
      }
    } catch {}
    try {
      if (travaId && admin) await admin.from("gateway_eventos").delete().eq("id", travaId);
      travaId = null;
    } catch {}
  };

  try {
    if (!cfg || !admin) return erro("Pagamento temporariamente indisponível. Tente novamente em instantes.", 503);

    const rl = limitar(`checkout:${ipDaRequisicao(request)}`, 30, 10 * 60 * 1000);
    if (!rl.permitido) return erro("Muitas tentativas. Aguarde alguns minutos e tente novamente.", 429);

    const body = await request.json().catch(() => ({}));

    // ---------- 1. Validação dos dados (nada de valores padrão inventados) ----------
    const nome = String(body.nome || "").trim();
    const email = normalizarEmail(body.email);
    const cpf = String(body.cpf || "").replace(/\D/g, "");
    const celular = String(body.celular || "").replace(/\D/g, "");
    const billingType = body.billingType === "PIX" ? "PIX" : body.billingType === "CREDIT_CARD" ? "CREDIT_CARD" : null;
    const plano = String(body.plano || "").toLowerCase().trim();
    const ehUpgrade = body.origem === "upgrade";

    if (nome.length < 3) return erro("Informe o seu nome completo.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro("Informe um e-mail válido.");
    if (!cpfEhValido(cpf)) return erro("CPF inválido. Confira os 11 dígitos.");
    if (!celularValido(celular)) return erro("Informe o celular com DDD.");
    if (!billingType) return erro("Forma de pagamento inválida.");
    if (!ehPlano(plano)) return erro("Plano inválido.");
    // Aceite obrigatório dos Termos (inclui a renovação automática), na versão vigente
    if (body.aceiteTermos !== true) return erro("Para continuar, aceite os Termos de Uso e a Política de Privacidade.");
    if (body.versaoTermos !== TERMOS_VERSAO) return erro("Os termos foram atualizados. Recarregue a página para ler a versão mais recente.", 409);

    // Cartão: só o token gerado no navegador e a bandeira (forma de pagamento)
    let tokenCartao = "";
    let metodoCartao = "";
    if (billingType === "CREDIT_CARD") {
      tokenCartao = String(body.cartao?.token || "");
      metodoCartao = String(body.cartao?.metodo || "").toLowerCase();
      if (!tokenCartaoValido(tokenCartao) || !metodoCartaoValido(metodoCartao)) {
        return erro("Não foi possível validar o cartão. Confira os dados e tente novamente.");
      }
    }

    // ---------- 2. Perfil existente / upgrade ----------
    const { data: perfilExistente } = await admin.from("profiles").select("*").eq("email", email).maybeSingle();

    let credito = 0;
    let assinaturaAntigaId: string | null = null;

    if (ehUpgrade) {
      const ctx = await autenticar(request);
      if (!ctx || ctx.email !== email) return erro("Faça login para realizar o upgrade.", 401);
      if (
        !perfilExistente ||
        String(perfilExistente.plano || "").toLowerCase() !== "trimestral" ||
        String(perfilExistente.status_assinatura || "").toUpperCase() !== "ATIVO" ||
        plano !== "anual"
      ) {
        return erro("Upgrade disponível apenas do plano Trimestral ativo para o Anual.", 409);
      }
      credito = CREDITO_UPGRADE_TRIMESTRAL_PARA_ANUAL;
      assinaturaAntigaId = perfilExistente.gateway_assinatura_id || null;
    } else if (perfilExistente) {
      const status = String(perfilExistente.status_assinatura || "").toUpperCase();
      if (status === "ATIVO") return erro("Já existe uma assinatura ativa para este e-mail. Faça login para acessar.", 409);
      const cpfCadastrado = String(perfilExistente.cpf || "").replace(/\D/g, "");
      if (cpfCadastrado && cpfCadastrado !== cpf) {
        return erro("Este e-mail já está cadastrado com outro CPF. Use o e-mail correto ou fale com o suporte.", 409);
      }
    }

    // CPF não pode estar em outra conta (é usado no login)
    const { data: outroComCpf } = await admin.from("profiles").select("email").eq("cpf", cpf).neq("email", email).limit(1);
    if (outroComCpf && outroComCpf.length > 0) {
      return erro("Este CPF já está vinculado a outra conta. Use o e-mail original da assinatura.", 409);
    }

    // ---------- 3. Cupom + preço (tudo no servidor) ----------
    let percentualCupom = 0;
    const cupomInformado = String(body.cupom || "").trim();
    if (cupomInformado) {
      const cupom = await buscarCupom(admin, cupomInformado);
      if (!cupom) return erro("Cupom inválido ou não encontrado.");
      const status = statusDoCupom(cupom);
      if (status !== "ativo") return erro(mensagemDoStatus(cupom, status));

      // Reserva o uso de forma atômica (respeita o limite mesmo com compras simultâneas)
      const consumido = await consumirCupom(admin, cupomInformado);
      if (!consumido) return erro("Este cupom não está mais disponível.");
      cupomConsumido = consumido.codigo;
      percentualCupom = consumido.percentual;
    }

    const valorCobrado = calcularTotal({ plano, percentualCupom, credito, forma: billingType === "PIX" ? "PIX" : "CARTAO" });
    if (valorCobrado < VALOR_MINIMO_COBRANCA) {
      await desfazer();
      const minimoBR = VALOR_MINIMO_COBRANCA.toFixed(2).replace(".", ",");
      const finalBR = valorCobrado.toFixed(2).replace(".", ",");
      return erro(`O valor final (R$ ${finalBR}) é menor que o mínimo de R$ ${minimoBR} aceito para cobrança. Use um cupom com desconto menor ou escolha outro plano.`);
    }

    // Parcelas: só no cartão e só nas quantidades permitidas para o plano (Pix é sempre à vista)
    let parcelas = 1;
    if (billingType === "CREDIT_CARD") {
      const p = normalizarParcelas(plano, body.parcelas, valorCobrado);
      if (p === null) {
        await desfazer();
        return erro("Quantidade de parcelas não disponível para este plano ou valor.");
      }
      parcelas = p;
    }
    const usaAssinatura = billingType === "CREDIT_CARD" && parcelas === 1;

    // Parcelado: os juros são definidos pelo Mercado Pago (configuração da conta) e o cliente PRECISA ter visto o total
    // exato antes de pagar. Confere a tabela de parcelas ANTES de cobrar; se divergir do que a tela mostrou, não cobra.
    let totalNoCartao = valorCobrado; // quanto o cliente paga no cartão (com juros, se houver)
    if (billingType === "CREDIT_CARD" && parcelas > 1) {
      const totalVisto = Number(body.totalEsperado);
      if (!Number.isFinite(totalVisto)) {
        await desfazer();
        return erro("Confira o valor do parcelamento na tela e tente novamente.", 400);
      }
      const custos = await consultarCustosParcelamento(cfg, valorCobrado, metodoCartao);
      const custo = custoDaParcela(custos, parcelas);
      if (custos && !custo) {
        await desfazer();
        return erro("Essa quantidade de parcelas não está disponível para o seu cartão. Escolha outra opção.", 409);
      }
      if (custo && !totalConfere(custo.total, totalVisto)) {
        await desfazer();
        return erro("As condições do parcelamento mudaram. Atualize as opções de parcelas e confira o total antes de pagar.", 409);
      }
      totalNoCartao = custo ? custo.total : totalVisto;
    }

    // Trava contra clique duplo / duas abas: só um pagamento de cartão por e-mail e plano a cada minuto.
    // (A trava é liberada se a compra falhar; se der certo, o perfil ATIVO já impede uma segunda compra.)
    if (billingType === "CREDIT_CARD") {
      const id = `trava:${email}:${plano}:${Math.floor(Date.now() / 60_000)}`;
      const { error: travaErr } = await admin.from("gateway_eventos").insert({ id, evento: "checkout", payment_id: "checkout" });
      if (travaErr) {
        if (travaErr.code === "23505") {
          await desfazer(); // devolve o cupom (a trava não é nossa, então não é liberada)
          return erro("Já estamos processando o seu pagamento. Aguarde alguns segundos antes de tentar novamente.", 409);
        }
        console.error("Não foi possível registrar a trava do checkout:", travaErr.message); // segue sem trava
      } else {
        travaId = id;
      }
    }

    const comprador = { email, nome, cpf };
    const hoje = hojeSP();
    const descricaoBase = `Assinatura Nutrindo em Casa - Plano ${PLANOS[plano].nome}`;
    const descricaoFatura = `${descricaoBase}${cupomConsumido ? ` (Cupom: ${cupomConsumido})` : ""}`;
    const deviceId = typeof body.cartao?.deviceId === "string" ? body.cartao.deviceId : undefined;

    // ---------- 4. Cobrança no Mercado Pago ----------
    let pagamentoId = ""; // identificador da fatura (o webhook usa o mesmo)
    let assinaturaId: string | null = null;
    let statusFatura: "Pago" | "Pendente" = "Pendente";
    let pix: ReturnType<typeof extrairPix> | null = null;

    if (usaAssinatura) {
      // ---- Cartão à vista: assinatura com renovação automática ----
      const ass = await criarPedidoAssinatura();
      if (ass.resposta) return ass.resposta;
      assinaturaId = ass.id;
      pagamentoId = ass.pagamentoId;
      statusFatura = ass.pago ? "Pago" : "Pendente";
    } else {
      // ---- Pix ou cartão parcelado: pedido (Orders) ----
      const referencia = referenciaExterna("compra");
      const corpoPedido =
        billingType === "PIX"
          ? montarPedidoPix({ valor: valorCobrado, comprador, referencia, descricao: descricaoBase })
          : montarPedidoCartao({ valor: valorCobrado, comprador, referencia, descricao: descricaoBase, token: tokenCartao, metodo: metodoCartao, parcelas });

      let r;
      try {
        r = await criarPedido(cfg, corpoPedido, { deviceId });
      } catch (e) {
        console.error("Mercado Pago: sem resposta ao criar o pedido:", e);
        await desfazer();
        return erro("O pagamento demorou para responder. Confira a fatura do cartão antes de tentar de novo; se houver cobrança indevida, ela será estornada.", 504);
      }
      if (!r.ok || !r.data?.id) {
        console.error("Mercado Pago: pedido recusado", r.status, JSON.stringify(r.data?.errors || r.data || {}).slice(0, 400));
        await desfazer();
        const recusadoNoCartao = billingType === "CREDIT_CARD" && mensagemErroMP(r, "") !== "";
        return erro(
          mensagemErroMP(r, "Não foi possível criar a cobrança. Confira os dados ou tente outra forma de pagamento."),
          recusadoNoCartao ? 402 : r.status >= 500 ? 502 : 400
        );
      }
      pedidoCriadoId = String(r.data.id);
      pagamentoId = pedidoCriadoId;

      // O Mercado Pago pode responder "processando": espera o resultado (Pix sem QR Code, cartão ainda sem aprovação)
      const ordem = await aguardarPedido(cfg, r.data, billingType === "PIX");

      const statusPedido = statusFaturaDoPedido(ordem.status, ordem.status_detail);
      if (statusPedido === "Recusado" || statusPedido === "Cancelado") {
        await desfazer();
        return erro("Cartão recusado pela operadora. Confira os dados ou utilize outro cartão ou o Pix.", 402);
      }
      statusFatura = statusPedido === "Pago" ? "Pago" : "Pendente";
      pedidoFoiPago = statusPedido === "Pago";

      // Rede de segurança: o total cobrado no cartão tem que ser exatamente o que o cliente viu; se não, estorna e avisa
      if (parcelas > 1 && statusPedido === "Pago" && !totalConfere(ordem.total_paid_amount, totalNoCartao)) {
        console.error("ATENÇÃO: total cobrado diferente do mostrado ao cliente; compra estornada.", pedidoCriadoId, ordem.total_paid_amount, totalNoCartao);
        await desfazer();
        return erro("O valor do parcelamento mudou durante o pagamento. Nenhuma cobrança foi mantida. Confira as opções e tente novamente.", 409);
      }

      if (billingType === "PIX") {
        pix = extrairPix(ordem);
        if (!pix.qrCode || !pix.qrCodeBase64) {
          console.error("Mercado Pago: QR Code Pix indisponível para o pedido", pedidoCriadoId);
          await desfazer();
          return erro("Não foi possível gerar o QR Code do Pix. Tente novamente.", 502);
        }
      }
    }

    // ---------- 5. Persistência (se falhar, desfaz tudo) ----------
    // Mantém ATIVO apenas se já estava ativo (upgrade) ou se o cartão confirmou agora; Pix aguarda o aviso do Mercado Pago.
    const statusAssinatura = ehUpgrade || statusFatura === "Pago" ? "ATIVO" : "AGUARDANDO_PAGAMENTO";
    const proxima = somarMeses(hoje, MESES_DO_PLANO[plano]);
    const { error: perfilErr } = await admin.from("profiles").upsert(
      {
        email,
        nome: perfilExistente?.nome || nome,
        cpf,
        telefone: celular,
        plano,
        status_assinatura: statusAssinatura,
        gateway_assinatura_id: assinaturaId,
        parcelas,
        proxima_cobranca: proxima,
        renovacao_automatica: true,
        renovacao_falhas: 0,
        renovacao_ultima_tentativa: null,
        renovacao_aviso_ciclo: null,
        acesso_ate: null,
        notificacoes_email: perfilExistente?.notificacoes_email ?? true,
      },
      { onConflict: "email" }
    );
    if (perfilErr) {
      console.error("Falha ao salvar perfil do checkout:", perfilErr.message);
      await desfazer();
      return erro("Não foi possível concluir o cadastro. Nenhuma cobrança foi mantida. Tente novamente.", 500);
    }

    const aceiteOk = await registrarAceite(admin, {
      email,
      versao: TERMOS_VERSAO,
      consentimentoSaude: false,
      renovacaoAutomatica: true,
      origem: "checkout",
      ip: ipDaRequisicao(request),
      userAgent: request.headers.get("user-agent"),
    });
    if (!aceiteOk) console.error("ATENÇÃO: compra concluída sem registro de aceite para", email);

    const { error: faturaErr } = await admin.from("faturas").upsert(
      {
        user_email: email,
        gateway_pagamento_id: pagamentoId,
        descricao: parcelas > 1 && totalNoCartao > valorCobrado + 0.01 ? `${descricaoFatura} (${parcelas}x com juros, total R$ ${totalNoCartao.toFixed(2).replace(".", ",")})` : descricaoFatura,
        valor: parcelas > 1 ? totalNoCartao : valorCobrado,
        forma_pagamento: billingType,
        status: statusFatura,
        data_emissao: new Date().toISOString(),
        parcela_numero: null,
        parcelas_total: parcelas > 1 ? parcelas : null,
      },
      { onConflict: "gateway_pagamento_id" }
    );
    if (faturaErr) console.error("Falha ao salvar fatura:", faturaErr.message); // o aviso do Mercado Pago recria a fatura

    // Upgrade: encerra a assinatura anterior (o perfil já aponta para a nova) para não cobrar em duplicidade
    const antigaId: string | null = assinaturaAntigaId || perfilExistente?.gateway_assinatura_id || null;
    if (antigaId && antigaId !== assinaturaId) {
      const ok = await cancelarAssinaturaMP(cfg, antigaId);
      if (!ok) console.error("ATENÇÃO: não foi possível cancelar a assinatura antiga", antigaId);
    }

    // Compra concluída: a partir daqui nada é desfeito
    cupomConsumido = null;
    pedidoCriadoId = null;
    assinaturaCriadaId = null;

    // Cartão confirmado na hora: libera o acesso já (não depende do aviso chegar depois do cadastro)
    let emailEnviado = false;
    if (statusFatura === "Pago" && !ehUpgrade) {
      emailEnviado = (await liberarAcessoPosPagamento(admin, email, nome)).enviado;
    }

    // ---------- 6. Resposta ----------
    const base = {
      success: true,
      subscriptionId: assinaturaId || pagamentoId,
      paymentId: pagamentoId,
      email,
      valorCobrado,
      parcelas,
      valorParcela: arredondar(totalNoCartao / parcelas),
      totalPago: totalNoCartao,
      proximaCobranca: proxima,
      pagamentoConfirmado: statusFatura === "Pago",
      tokenAcesso: ehUpgrade ? undefined : criarTokenCompra(email, pagamentoId),
      emailEnviado,
      mensagemAcesso: emailEnviado
        ? "Enviamos para o seu e-mail o link para criar sua senha."
        : "Assim que o pagamento for confirmado, enviaremos o e-mail para você criar sua senha.",
    };
    if (billingType === "PIX") {
      return NextResponse.json({
        ...base,
        tipo: "PIX",
        encodedImage: pix?.qrCodeBase64,
        payload: pix?.qrCode,
        ticketUrl: pix?.ticketUrl,
        expirationDate: pix?.expiraEm,
      });
    }
    return NextResponse.json({ ...base, tipo: "CREDIT_CARD", status: statusFatura === "Pago" ? "ACTIVE" : "PENDING" });

    // -----------------------------------------------------------------
    // Cartão à vista: cria a assinatura, confere a 1ª cobrança e acerta o valor das renovações.
    // -----------------------------------------------------------------
    async function criarPedidoAssinatura(): Promise<{ id: string; pagamentoId: string; pago: boolean; resposta?: NextResponse }> {
      const vazio = { id: "", pagamentoId: "", pago: false };
      const corpo = montarAssinatura({
        email,
        token: tokenCartao,
        meses: MESES_DO_PLANO[plano as keyof typeof MESES_DO_PLANO],
        valor: valorCobrado,
        motivo: descricaoBase,
        referencia: referenciaExterna("assinatura"),
        backUrl: `${urlHttpsDoSite()}/configuracoes`,
      });
      const r = await mpFetch(cfg!, "POST", "/preapproval", corpo, { timeoutMs: 30_000 }).catch((e) => {
        console.error("Mercado Pago: sem resposta ao criar a assinatura:", e);
        return null;
      });
      if (!r) {
        await desfazer();
        return { ...vazio, resposta: erro("O pagamento demorou para responder. Confira a fatura do cartão antes de tentar de novo.", 504) };
      }
      if (!r.ok || !r.data?.id) {
        console.error("Mercado Pago: assinatura recusada", r.status, JSON.stringify(r.data || {}).slice(0, 400));
        await desfazer();
        const motivoCartao = mensagemErroMP(r, "") !== "";
        return {
          ...vazio,
          resposta: motivoCartao
            ? erro(mensagemErroMP(r, ""), 402)
            : erro("Não foi possível criar a assinatura agora. Confira os dados do cartão ou escolha o Pix.", r.status >= 500 ? 502 : 400),
        };
      }
      assinaturaCriadaId = String(r.data.id);

      const cobranca = await primeiraCobrancaDaAssinatura(cfg!, assinaturaCriadaId);
      const statusCobranca = statusFaturaDaCobrancaAssinatura(cobranca?.payment?.status);
      if (statusCobranca === "Recusado") {
        await desfazer();
        return { ...vazio, resposta: erro("Cartão recusado pela operadora. Confira os dados ou utilize outro cartão ou o Pix.", 402) };
      }
      // Renovações futuras pelo preço de tabela (cupom/crédito vale só para a 1ª cobrança)
      if (cobranca?.payment?.id) pagamentoDaAssinatura = String(cobranca.payment.id);
      if (cobranca) await alinharValorAssinatura(cfg!, assinaturaCriadaId, plano as keyof typeof PLANOS);
      return {
        id: assinaturaCriadaId,
        pagamentoId: String(cobranca?.payment?.id || `assinatura_${assinaturaCriadaId}`),
        pago: statusCobranca === "Pago",
      };
    }
  } catch (error) {
    console.error("Erro interno ao processar assinatura:", error);
    await desfazer();
    return erro("Não foi possível processar o pagamento agora. Tente novamente em instantes.", 500);
  }
}
