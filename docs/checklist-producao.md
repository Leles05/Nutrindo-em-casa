# Checklist de produção

Nutrindo em Casa: do ambiente de teste ao dinheiro de verdade com o Mercado Pago. Atualizado em 19/11/2026.

Legenda: **Bloqueia o lançamento** (sem isso não lança), **Decisão da nutricionista** (precisa de escolha), **Recomendado**.

## 1. Decisões que mudam o preço e o lucro

Resolva estas antes de mexer em qualquer chave. Os números estão na tabela de taxas mais abaixo.

- [ ] **Decidir quem paga os juros do parcelamento** _(Decisão da nutricionista · Nutri)_
  O site promete "sem juros". Pelo Mercado Pago, isso só acontece se a conta da nutricionista assumir o custo (de 4,62% no 3x até 17,28% no 12x, somados à taxa do cartão). No anual em 12x são cerca de R$ 447 de R$ 2.009,40. Opções: (A) assumir tudo como está; (B) assumir só até 3x ou 6x; (C) só à vista e Pix; (D) reajustar o preço do anual.
- [ ] **Escolher em quantos dias o cartão cai na conta** _(Decisão da nutricionista · Nutri)_
  Na hora custa 4,98%; em 14 dias, 4,48%; em 30 dias, 2,95%. Quanto mais espera, menos taxa. Pix cai na hora.
- [ ] **Confirmar os preços (R$ 197, R$ 531,90, R$ 2.009,40) sabendo o valor líquido** _(Decisão da nutricionista · Nutri)_
  O Pix é a forma mais barata (0,99%). Vale decidir se haverá incentivo para pagar no Pix.
- [ ] **Definir a regra de estorno e pedir ao Mercado Pago a confirmação por escrito de que a tarifa é devolvida** _(Decisão da nutricionista · Nutri)_
  A página de ajuda do Mercado Pago diz que a tarifa de um pagamento devolvido não é cobrada, mas a documentação técnica não confirma. Pergunte ao suporte e confirme no ensaio com dinheiro real (item 4).
- [ ] **Definir quem acompanha e responde contestações de cartão (chargeback)** _(Decisão da nutricionista · Nutri)_
  O site não trata contestação sozinho: o Mercado Pago avisa por e-mail e a defesa é feita no painel dele.
- [ ] **Falar com o contador sobre nota fiscal e impostos das assinaturas** _(Decisão da nutricionista · Nutri)_
  Fora do sistema: o site não emite nota fiscal.
- [ ] **Decidir o plano de hospedagem para operar com vendas** _(Decisão da nutricionista · Ambos)_
  Confira os termos atuais: o plano gratuito da Vercel é voltado a uso pessoal e sem fins comerciais, e o gratuito do Supabase pausa projetos parados e tem backups limitados. Para um negócio com dados de saúde, o pago costuma ser o caminho.

## 2. Conta do Mercado Pago (titular da conta)

Tudo isto é feito dentro da conta da LAIS VIEIRA DE LIMA LELES LTDA, em Seu negócio > Custos e Configurações.

- [ ] **Conta PJ com dados completos, validada e com credenciais de produção liberadas** _(Bloqueia o lançamento · Nutri)_
- [ ] **Ativar o parcelamento sem juros nas parcelas escolhidas (Seu negócio > Custos > Parcelamento)** _(Bloqueia o lançamento · Nutri)_
  Sem isso o site recusa a compra parcelada, de propósito, para não cobrar juros escondidos do cliente.
- [ ] **Configurar o prazo de recebimento escolhido (Seu negócio > Custos > Checkouts)** _(Bloqueia o lançamento · Nutri)_
- [ ] **Conferir as taxas reais exibidas na conta (cartão, parcelas, Pix e Assinaturas) e comparar com a tabela deste documento** _(Bloqueia o lançamento · Nutri)_
  A página pública do Mercado Pago tem números que não batem entre si e não informa a taxa das Assinaturas. O que vale é o que a conta mostrar.
- [ ] **Conferir o nome que aparece na fatura do cartão do cliente (ex.: NUTRINDOEMCASA)** _(Recomendado · Nutri)_
  Nome reconhecível reduz contestações de quem não lembra da compra.
- [ ] **Conta bancária cadastrada para saque** _(Bloqueia o lançamento · Nutri)_
  Deixe uma reserva de saldo: estorno de Pix sai do saldo disponível.

## 3. Trocar de teste para produção

Hoje o site inteiro roda com chaves de teste. A troca é feita na Vercel e no painel do Mercado Pago.

- [ ] **Copiar o Access Token e a Public Key de PRODUÇÃO (Suas integrações > Credenciais de produção)** _(Bloqueia o lançamento · Nutri)_
- [ ] **Criar o webhook na aba PRODUÇÃO do painel e copiar o segredo novo** _(Bloqueia o lançamento · Nutri)_
  URL: https://www.nutrindoemcasa.com.br/api/pagamentos/webhook. Eventos: Order (Mercado Pago) e Planos e assinaturas. O segredo de produção é diferente do de teste.
- [ ] **Atualizar na Vercel: MERCADOPAGO_ACCESS_TOKEN (Secret), NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY (Config), MERCADOPAGO_WEBHOOK_SECRET (Secret)** _(Bloqueia o lançamento · Ambos)_
- [ ] **Fazer um novo deploy sem usar o cache** _(Bloqueia o lançamento · Ambos)_
  A Public Key é gravada no site na hora do build: sem novo deploy, ela não muda.
- [ ] **Manter o .env.local com chaves de TESTE** _(Bloqueia o lançamento · Lucas)_
  Os testes automáticos fazem compras. Com chave de produção elas seriam cobranças reais. O banco de dados é o mesmo do site publicado.
- [ ] **Limpar os dados de teste do banco (perfis, faturas, cupons de teste) e deixar só a conta da nutricionista** _(Bloqueia o lançamento · Lucas)_
- [ ] **Revogar a chave de API antiga do Asaas** _(Recomendado · Nutri)_
  Em asaas.com/customerApiAccessToken. O Asaas pede um código por SMS no celular final 6020.
- [ ] **No painel de produção, usar Simular notificação e conferir nos logs da Vercel que o aviso passou pela assinatura** _(Bloqueia o lançamento · Ambos)_

## 4. Ensaio geral com dinheiro de verdade

Use um cupom de 99% (crie o TESTE99 com 1 uso no painel da nutricionista) para gastar centavos. O plano mensal sai por R$ 1,97.

- [ ] **Cartão à vista real (mensal com cupom): acesso liberado, e-mail de acesso chega (olhe o spam) e assinatura ativa no Mercado Pago** _(Bloqueia o lançamento · Ambos)_
- [ ] **Estornar essa compra no painel do Mercado Pago e conferir tudo** _(Bloqueia o lançamento · Ambos)_
  Esperado: fatura "Estornado", acesso encerrado, assinatura cancelada no Mercado Pago. Confira também, no detalhe da venda, se a taxa foi devolvida. O estorno de cobrança de assinatura não pôde ser testado no ambiente de teste.
- [ ] **Pix real (R$ 1,97): pagar o QR Code, acesso liberado em segundos; depois estornar (precisa de saldo)** _(Bloqueia o lançamento · Ambos)_
- [ ] **Compra parcelada real (anual com cupom de 90%, cerca de R$ 200,94, em 2x ou 3x)** _(Bloqueia o lançamento · Ambos)_
  O cliente deve pagar exatamente o valor do plano, sem juros. Anote quanto a nutricionista recebe de fato: é a taxa real do parcelamento.
- [ ] **Cartão recusado (limite insuficiente): mensagem clara e nenhuma cobrança** _(Recomendado · Ambos)_
- [ ] **Cancelar pelo site uma assinatura real e conferir no Mercado Pago que ficou cancelada e que o acesso segue até o fim do período** _(Bloqueia o lançamento · Ambos)_
- [ ] **Painel do Mercado Pago > Webhooks: as entregas aparecem com resposta 200, sem falhas** _(Bloqueia o lançamento · Ambos)_
- [ ] **No dia seguinte, ver nos logs da Vercel que /api/cron/renovacoes respondeu 200** _(Bloqueia o lançamento · Lucas)_
- [ ] **Forçar uma renovação por Pix (data da próxima cobrança para daqui a 3 dias numa conta de teste) e conferir o e-mail e o QR Code** _(Recomendado · Lucas)_

## 5. Operação do dia a dia

O que precisa estar combinado e escrito antes de ter clientes de verdade.

- [ ] **Saber estornar: Mercado Pago > Atividade > pagamento > Devolver dinheiro** _(Bloqueia o lançamento · Nutri)_
  Espere alguns segundos depois da aprovação (o Mercado Pago recusa estornos imediatos). Estorno total encerra o acesso sozinho; o parcial mantém. Pix só estorna com saldo disponível. Prazo de até 180 dias para cartão.
- [ ] **E-mail transacional pronto: domínio verificado no Resend (SPF e DKIM) e SMTP próprio no Supabase para o e-mail de convite** _(Bloqueia o lançamento · Ambos)_
  O envio padrão do Supabase tem limites baixos e pode falhar em dias de muitas vendas.
- [ ] **Definir quem responde o contato@nutrindoemcasa.com.br e em quanto tempo (a garantia é de 7 dias)** _(Bloqueia o lançamento · Nutri)_
- [ ] **Rotina semanal: Vercel > Logs (procure "ATENÇÃO") e Mercado Pago > Webhooks > entregas** _(Recomendado · Lucas)_
- [ ] **Plano de emergência: para pausar vendas, remova MERCADOPAGO_ACCESS_TOKEN na Vercel e faça deploy; o site avisa que o pagamento está indisponível e não cobra ninguém** _(Recomendado · Lucas)_
- [ ] **Backup do banco (plano pago ou exportação periódica)** _(Recomendado · Lucas)_
- [ ] **Revisão jurídica dos Termos e da Privacidade (dados de saúde de crianças, LGPD)** _(Recomendado · Nutri)_

## Tabela de taxas

Página oficial de tarifas do Checkout do Mercado Pago, consultada em 19/11/2026. Confirme na sua conta: a própria página tem números que não batem entre si.

### À vista: Pix e cartão

| Plano | Pix 0,99% | Cartão à vista, na hora 4,98% | Cartão à vista, 14 dias 4,48% | Cartão à vista, 30 dias 2,95% |
|---|---|---|---|---|
| Mensal R$ 197,00 | taxa 1,95 · fica 195,05 | taxa 9,81 · fica 187,19 | taxa 8,83 · fica 188,17 | taxa 5,81 · fica 191,19 |
| Trimestral R$ 531,90 | taxa 5,27 · fica 526,63 | taxa 26,49 · fica 505,41 | taxa 23,83 · fica 508,07 | taxa 15,69 · fica 516,21 |
| Anual R$ 2.009,40 | taxa 19,89 · fica 1.989,51 | taxa 100,07 · fica 1.909,33 | taxa 90,02 · fica 1.919,38 | taxa 59,28 · fica 1.950,12 |

### Parcelado sem juros para o cliente (a nutricionista paga), na hora

Estimativa: taxa do cartão (4,98%) somada ao adicional da parcela. Confirme no ensaio com dinheiro real.

| Compra | Taxa total | Taxa em R$ | Fica para a nutricionista |
|---|---|---|---|
| Trimestral em 2x | 7,51% | 39,95 | 491,95 |
| Trimestral em 3x | 9,60% | 51,06 | 480,84 |
| Anual em 3x | 9,60% | 192,90 | 1.816,50 |
| Anual em 6x | 14,94% | 300,20 | 1.709,20 |
| Anual em 10x | 19,91% | 400,07 | 1.609,33 |
| Anual em 12x | 22,26% | 447,29 | 1.562,11 |

Referência de estorno: no Asaas, o estorno de R$ 11,82 devolveu R$ 9,75 e reteve R$ 2,07 (17,5%). No Mercado Pago a tarifa de pagamento devolvido não é cobrada segundo a ajuda oficial; falta confirmar na prática (ensaio geral).
