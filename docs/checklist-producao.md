# Checklist de produção

Nutrindo em Casa: do ambiente de teste ao dinheiro de verdade com o Mercado Pago. Atualizado em 23/11/2026.

Legenda: **Bloqueia o lançamento** (sem isso não lança), **Em aberto** (precisa de escolha), **Recomendado**.

## Decisões já tomadas (23/11/2026)

- Cartão cai na conta em 30 dias (taxa de 3,98% à vista). Pix cai na hora (0,99%).
- Preços: Pix R$ 197,00 / R$ 531,90 / R$ 2.009,40 e cartão R$ 210,00 / R$ 567,00 / R$ 2.142,00 (mensal, trimestral, anual). Já está no site.
- Parcelamento: até 3x sem juros (a nutricionista assume: custo total de 6,52% no 2x e 8,61% no 3x, já com o prazo de 30 dias); acima de 3x o cliente paga os juros do Mercado Pago, avisado antes na tela.
- Já configurado na conta do Mercado Pago em 23/11/2026: recebimento do cartão em 30 dias e parcelado vendedor até 3x ligados (conferido depois de recarregar a página).
- Devoluções: pedido respondido em até 48 horas úteis; a nutricionista devolve pela plataforma do Mercado Pago.
- Contestações de cartão: a nutricionista acompanha o e-mail, com a ajuda do irmão do Lucas.
- Nota fiscal e impostos: aguardando a resposta do contador.
- Hospedagem: Vercel e Supabase gratuitos nos primeiros dias. Risco aceito: os Termos da Vercel só preveem o plano gratuito para uso não comercial (pode haver suspensão); por isso o backup semanal do banco é obrigatório e a migração para a Vercel Pro deve ser reavaliada logo após as primeiras vendas.

## 1. Ainda em aberto

Só sobram dois pontos, os dois dependem de resposta de terceiros (contador e suporte do Mercado Pago).

- [ ] **Receber a resposta do contador sobre nota fiscal e impostos das assinaturas** _(Em aberto · Nutri)_
  O site não emite nota fiscal. Definir se será manual ou automática. O Mercado Pago tem o módulo Notas fiscais dentro do Sistema de gestão (assinatura paga, ainda não contratada); sistemas como Focus NFe ou eNotas também emitem a cada pagamento.
- [ ] **Pedir ao suporte do Mercado Pago a confirmação por escrito de que a tarifa é devolvida nas devoluções** _(Em aberto · Nutri)_
  A ajuda do Mercado Pago diz que sim, mas a documentação técnica não confirma. O ensaio com dinheiro real (grupo 4) também confirma.

## 2. Conta do Mercado Pago (titular da conta)

Tudo isto é feito dentro da conta da LAIS VIEIRA DE LIMA LELES LTDA, em Seu negócio > Custos e Configurações.

- [ ] **Conta PJ com dados completos, validada e com credenciais de produção liberadas** _(Bloqueia o lançamento · Nutri)_
- [ ] **Confirmar com um pagamento real que a assinatura no cartão cobra a taxa do cartão (3,98% em 30 dias)** _(Recomendado · Ambos)_
  As taxas da tabela abaixo foram lidas na própria conta em 23/11. A tela de taxas não mostra uma linha separada para Assinaturas; o ensaio com dinheiro real confirma.
- [ ] **Validar a identidade com o código por SMS (celular final 6020) quando o Mercado Pago pedir, para abrir as credenciais de produção do aplicativo** _(Bloqueia o lançamento · Nutri)_
  A página de credenciais pede a confirmação por código enviado ao celular da titular. Só ela recebe o código.
- [ ] **Resolver as pendências de Segurança da conta (métodos de verificação, senha) e usar Colaboradores para dar acesso ao Lucas e ao irmão, em vez de compartilhar o login** _(Recomendado · Nutri)_
  Em Configurações > Segurança e Colaboradores. A conta hoje mostra "configurações pendentes" e não tem senha criada.
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
- [ ] **Backup semanal do banco (o Supabase gratuito não tem backup): node scripts/backup_banco.mjs** _(Bloqueia o lançamento · Lucas)_
  Guarde a pasta backups/ em local privado e protegido: ela tem dados de saúde de clientes.
- [ ] **Revisão jurídica dos Termos e da Privacidade (dados de saúde de crianças, LGPD)** _(Recomendado · Nutri)_

## Tabela de taxas

Lida na própria conta do Mercado Pago (Taxas e parcelas > Checkout) em 23/11/2026, com o recebimento do cartão em 30 dias.

### À vista: Pix e cartão

| Plano | Pix, cai na hora (taxa 0,99%) | Cartão à vista, cai em 30 dias (taxa 3,98%) |
|---|---|---|
| Mensal | cliente paga R$ 197,00 · taxa 1,95 · fica R$ 195,05 | cliente paga R$ 210,00 · taxa 8,36 · fica R$ 201,64 |
| Trimestral | cliente paga R$ 531,90 · taxa 5,27 · fica R$ 526,63 | cliente paga R$ 567,00 · taxa 22,57 · fica R$ 544,43 |
| Anual | cliente paga R$ 2.009,40 · taxa 19,89 · fica R$ 1.989,51 | cliente paga R$ 2.142,00 · taxa 85,25 · fica R$ 2.056,75 |

### Parcelado sem juros (a nutricionista assume), cartão em 30 dias

Taxa por venda de 2,00% mais a taxa de parcelamento (2x: 4,52%; 3x: 6,61%), como mostra a conta. Acima de 3x o cliente paga os juros do Mercado Pago e a nutricionista paga só a taxa por venda (de 2,00% a 2,10% no parcelado do comprador, conforme a tela da conta).

| Compra | Taxa total | Taxa em R$ | Fica para a nutricionista |
|---|---|---|---|
| Trimestral em 2x (R$ 283,50 cada) | 6,52% | 36,97 | 530,03 |
| Trimestral em 3x (R$ 189,00 cada) | 8,61% | 48,82 | 518,18 |
| Anual em 3x (R$ 714,00 cada) | 8,61% | 184,42 | 1.957,58 |

Pix x cartão à vista: com o recebimento em 30 dias, o cartão deixa mais líquido para a nutricionista (mensal R$ 201,64 contra R$ 195,05 no Pix). O incentivo ao Pix é, na prática, um desconto de R$ 13 para o cliente em troca de receber na hora, sem risco de contestação. O 3x sem juros fica abaixo do Pix no trimestral (R$ 518,18 contra R$ 526,63). Referência de devolução: no Asaas, a devolução de R$ 11,82 retornou R$ 9,75 e reteve R$ 2,07 (17,5%); no Mercado Pago a ajuda oficial diz que a tarifa de pagamento devolvido não é cobrada, a confirmar na prática.
