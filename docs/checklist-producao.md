# Checklist de produção

Nutrindo em Casa: do ambiente de teste ao dinheiro de verdade com o Mercado Pago. Atualizado em 23/11/2026.

Legenda: **Bloqueia o lançamento** (sem isso não lança), **Em aberto** (precisa de escolha), **Recomendado**.

## Decisões já tomadas (23/11/2026)

- Cartão cai na conta em 30 dias (taxa de 2,95%). Pix cai na hora (0,99%).
- Preços: Pix R$ 197,00 / R$ 531,90 / R$ 2.009,40 e cartão R$ 210,00 / R$ 567,00 / R$ 2.142,00 (mensal, trimestral, anual). Já está no site.
- Parcelamento: até 3x sem juros (a nutricionista assume); acima de 3x o cliente paga os juros do Mercado Pago, avisado antes na tela.
- Devoluções: pedido respondido em até 48 horas úteis; a nutricionista devolve pela plataforma do Mercado Pago.
- Contestações de cartão: a nutricionista acompanha o e-mail, com a ajuda do irmão do Lucas.
- Nota fiscal e impostos: aguardando a resposta do contador.

## 1. Ainda em aberto

Só sobram três pontos. Os números estão na tabela de taxas mais abaixo.

- [ ] **Decidir a hospedagem para vender: manter o plano gratuito ou pagar a Vercel (Pro, US$ 20 por mês)** _(Em aberto · Ambos)_
  Os Termos da Vercel dizem que o plano gratuito é só para uso pessoal ou não comercial. Um site que cobra assinaturas é comercial, então há risco de a conta ser suspensa. O Supabase gratuito funciona no começo (500 MB, 50 mil usuários), pausa só após 7 dias parado (o cron diário mantém ativo) e não tem backup: use scripts/backup_banco.mjs toda semana. Sugestão: começar com o Supabase gratuito e a Vercel Pro.
- [ ] **Receber a resposta do contador sobre nota fiscal e impostos das assinaturas** _(Em aberto · Nutri)_
  O site não emite nota fiscal. Definir se será manual ou automática (sistemas como Focus NFe ou eNotas emitem a cada pagamento).
- [ ] **Pedir ao suporte do Mercado Pago a confirmação por escrito de que a tarifa é devolvida nas devoluções** _(Em aberto · Nutri)_
  A ajuda do Mercado Pago diz que sim, mas a documentação técnica não confirma. O ensaio com dinheiro real (grupo 4) também confirma.

## 2. Conta do Mercado Pago (titular da conta)

Tudo isto é feito dentro da conta da LAIS VIEIRA DE LIMA LELES LTDA, em Seu negócio > Custos e Configurações.

- [ ] **Conta PJ com dados completos, validada e com credenciais de produção liberadas** _(Bloqueia o lançamento · Nutri)_
- [ ] **Ativar o parcelamento sem juros em 2x e 3x (Seu negócio > Custos > Parcelamento), deixando as parcelas maiores com juros para o cliente** _(Bloqueia o lançamento · Nutri)_
  O site promete 3x sem juros: sem essa configuração o cliente verá os juros do Mercado Pago em todas as parcelas. Custo para a nutricionista: 2,53% (2x) e 4,62% (3x), além dos 2,95% do cartão em 30 dias.
- [ ] **Configurar o recebimento do cartão em 30 dias (Seu negócio > Custos > Checkouts)** _(Bloqueia o lançamento · Nutri)_
- [ ] **Conferir as taxas reais exibidas na conta (cartão, parcelas, Pix e Assinaturas) e comparar com a tabela deste documento** _(Bloqueia o lançamento · Nutri)_
  A página pública do Mercado Pago tem números que não batem entre si e não informa a taxa das Assinaturas. O que vale é o que a conta mostrar.
- [ ] **Conferir o nome que aparece na fatura do cartão do cliente (ex.: NUTRINDOEMCASA)** _(Recomendado · Nutri)_
  Nome reconhecível reduz contestações de quem não lembra da compra.
- [ ] **Conta bancária cadastrada para saque** _(Bloqueia o lançamento · Nutri)_
  Deixe uma reserva de saldo: devolução de Pix sai do saldo disponível.

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

Use um cupom de 99% (crie o TESTE99 com 1 uso no painel da nutricionista) para gastar centavos. O plano mensal no cartão sai por R$ 2,10 e no Pix por R$ 1,97.

- [ ] **Cartão à vista real (mensal com cupom): acesso liberado, e-mail de acesso chega (olhe o spam) e assinatura ativa no Mercado Pago** _(Bloqueia o lançamento · Ambos)_
- [ ] **Devolver essa compra no painel do Mercado Pago e conferir tudo** _(Bloqueia o lançamento · Ambos)_
  Esperado: fatura "Estornado", acesso encerrado, assinatura cancelada no Mercado Pago. Confira também, no detalhe da venda, se a taxa foi devolvida. A devolução de cobrança de assinatura não pôde ser testada no ambiente de teste.
- [ ] **Pix real (R$ 1,97): pagar o QR Code, acesso liberado em segundos; depois devolver (precisa de saldo)** _(Bloqueia o lançamento · Ambos)_
- [ ] **Compra parcelada real (anual com cupom de 90%, cerca de R$ 214,20): 3x deve sair sem juros e 6x com juros avisados na tela** _(Bloqueia o lançamento · Ambos)_
  Em 3x o cartão deve ser cobrado exatamente o valor do plano. Anote quanto a nutricionista recebe de fato: é a taxa real do parcelamento.
- [ ] **Cartão recusado (limite insuficiente): mensagem clara e nenhuma cobrança** _(Recomendado · Ambos)_
- [ ] **Cancelar pelo site uma assinatura real e conferir no Mercado Pago que ficou cancelada e que o acesso segue até o fim do período** _(Bloqueia o lançamento · Ambos)_
- [ ] **Painel do Mercado Pago > Webhooks: as entregas aparecem com resposta 200, sem falhas** _(Bloqueia o lançamento · Ambos)_
- [ ] **No dia seguinte, ver nos logs da Vercel que /api/cron/renovacoes respondeu 200** _(Bloqueia o lançamento · Lucas)_
- [ ] **Forçar uma renovação por Pix (data da próxima cobrança para daqui a 3 dias numa conta de teste) e conferir o e-mail e o QR Code** _(Recomendado · Lucas)_

## 5. Operação do dia a dia

O que precisa estar combinado e escrito antes de ter clientes de verdade.

- [ ] **Fazer as devoluções: Mercado Pago > Atividade > pagamento > Devolver dinheiro, respondendo o cliente em até 48 horas úteis** _(Bloqueia o lançamento · Nutri)_
  Espere alguns segundos depois da aprovação (o Mercado Pago recusa devoluções imediatas). Devolução total encerra o acesso sozinha; a parcial mantém. Pix só devolve com saldo disponível. Prazo de até 180 dias para cartão.
- [ ] **Acompanhar o e-mail de contestações de cartão do Mercado Pago (a nutricionista, com a ajuda do irmão do Lucas) e responder no prazo do painel** _(Bloqueia o lançamento · Nutri)_
- [ ] **E-mail transacional pronto: domínio verificado no Resend (SPF e DKIM) e SMTP próprio no Supabase para o e-mail de convite** _(Bloqueia o lançamento · Ambos)_
  O envio padrão do Supabase tem limites baixos e pode falhar em dias de muitas vendas.
- [ ] **Responder o contato@nutrindoemcasa.com.br dentro da regra de 48 horas úteis (a garantia é de 7 dias)** _(Bloqueia o lançamento · Nutri)_
- [ ] **Rotina semanal: Vercel > Logs (procure "ATENÇÃO") e Mercado Pago > Webhooks > entregas** _(Recomendado · Lucas)_
- [ ] **Plano de emergência: para pausar vendas, remova MERCADOPAGO_ACCESS_TOKEN na Vercel e faça deploy; o site avisa que o pagamento está indisponível e não cobra ninguém** _(Recomendado · Lucas)_
- [ ] **Backup semanal do banco enquanto estiver no Supabase gratuito: node scripts/backup_banco.mjs** _(Bloqueia o lançamento · Lucas)_
  Guarde a pasta backups/ em local privado e protegido: ela tem dados de saúde de clientes.
- [ ] **Revisão jurídica dos Termos e da Privacidade (dados de saúde de crianças, LGPD)** _(Recomendado · Nutri)_

## Tabela de taxas

Página oficial de tarifas do Checkout do Mercado Pago, consultada em 19/11/2026, com o prazo de 30 dias escolhido. Confirme na sua conta: a própria página tem números que não batem entre si.

### À vista: Pix e cartão

| Plano | Pix, cai na hora (taxa 0,99%) | Cartão à vista, cai em 30 dias (taxa 2,95%) |
|---|---|---|
| Mensal | cliente paga R$ 197,00 · taxa 1,95 · fica R$ 195,05 | cliente paga R$ 210,00 · taxa 6,19 · fica R$ 203,81 |
| Trimestral | cliente paga R$ 531,90 · taxa 5,27 · fica R$ 526,63 | cliente paga R$ 567,00 · taxa 16,73 · fica R$ 550,27 |
| Anual | cliente paga R$ 2.009,40 · taxa 19,89 · fica R$ 1.989,51 | cliente paga R$ 2.142,00 · taxa 63,19 · fica R$ 2.078,81 |

### Parcelado sem juros (a nutricionista assume), cartão em 30 dias

Taxa do cartão (2,95%) somada ao adicional da parcela (2x: 2,53%; 3x: 4,62%). Acima de 3x o cliente paga os juros do Mercado Pago e a nutricionista recebe como no cartão à vista. Estimativa a confirmar no ensaio com dinheiro real.

| Compra | Taxa total | Taxa em R$ | Fica para a nutricionista |
|---|---|---|---|
| Trimestral em 2x (R$ 283,50 cada) | 5,48% | 31,07 | 535,93 |
| Trimestral em 3x (R$ 189,00 cada) | 7,57% | 42,92 | 524,08 |
| Anual em 3x (R$ 714,00 cada) | 7,57% | 162,15 | 1.979,85 |

Pix x cartão à vista: com o recebimento em 30 dias, o cartão deixa mais líquido para a nutricionista (mensal R$ 203,81 contra R$ 195,05 no Pix). O incentivo ao Pix é, na prática, um desconto de R$ 13 para o cliente em troca de receber na hora, sem risco de contestação. Referência de devolução: no Asaas, a devolução de R$ 11,82 retornou R$ 9,75 e reteve R$ 2,07 (17,5%); no Mercado Pago a ajuda oficial diz que a tarifa de pagamento devolvido não é cobrada, a confirmar na prática.
