# Etapa 04 — Interatividade com JavaScript

Esta etapa documenta o comportamento dinâmico da aplicação **Nutrindo em Casa**. A interface é escrita em **TypeScript + React (Next.js)**: em vez de manipular o DOM manualmente, o React atualiza a tela a partir do estado (`useState`, `useMemo`, `useEffect`). Onde é preciso, também são usadas APIs nativas do navegador (`document.createElement`, `window.addEventListener`, `scrollIntoView`, `localStorage`).

Versão desta entrega: tag Git **`etapa-04`**.

---

## 1. Como executar e testar

**Requisitos:** Node.js 22.18 ou superior (testado com 24) e as variáveis de ambiente listadas em `.env.example`.

```bash
npm install
cp .env.example .env.local   # preencha as chaves (Supabase etc.)
npm run dev                  # abre em http://localhost:3000
npm test                     # testes automatizados das regras de validação e cálculo (14 casos)
```

Para testar manualmente cada funcionalidade, siga a seção "Como testar" dentro de cada item abaixo. As telas do Diário, da Anamnese e do Calendário exigem uma conta de cliente ativa; a tela de Pagamento (`/pagamento`) é pública e não cobra nada enquanto o formulário estiver inválido.

---

## 2. Funcionalidades interativas desta etapa

### 2.1 Diário Alimentar — filtros combinados, busca e autocomplete

**O que faz.** A família registra cada alimento oferecido à criança. A linha do tempo pode ser filtrada por **tipo de refeição**, por **degrau da escada do comer** (clicando nos cartões de progresso) e por **data**. Ao digitar o nome do alimento, aparece uma lista de sugestões. Quando nenhum registro combina com os filtros, é exibido um estado vazio.

**Como funciona.**
1. Três estados guardam os filtros (`filtroRefeicao`, `filtroDegrau`, `filtroData`) — `diario/page.tsx:73-75`.
2. `registrosFiltrados` aplica os três critérios ao mesmo tempo com `Array.filter` — `diario/page.tsx:295`.
3. As datas únicas são obtidas com `new Set(...map(...))` e ordenadas com `sort` — `diario/page.tsx:303`; cada dia vira um grupo com `map` e as refeições do dia são ordenadas pela ordem Café → Jantar — `diario/page.tsx:307`.
4. O autocomplete filtra uma lista de alimentos conforme o texto digitado (`filter` + `includes`) — `diario/page.tsx:118`.
5. A tecla **Esc** fecha os pop-ups (`addEventListener("keydown")`) — `diario/page.tsx:180`.
6. Ao salvar, o item aparece na hora na lista (atualização otimista), os contadores por degrau são recalculados e um aviso (toast) é exibido — `diario/page.tsx:227-270`.

**Arquivos:** `src/app/dashboard/diario/page.tsx`.

**Conceitos:** estado e eventos, renderização condicional, `filter`/`map`/`sort`/`Set`, funções, atualização otimista.

**Validações e situações inválidas.**
- Alimento vazio ou só com espaços: mensagem "Informe o alimento oferecido (não pode ficar em branco)." e o campo fica destacado — `diario/page.tsx:231-234`.
- Alimento com menos de 2 letras: mensagem específica — `diario/page.tsx:235-238`.
- Filtros sem resultado: estado vazio "Nenhum registro encontrado" — `diario/page.tsx:450`.
- O erro some assim que a pessoa volta a digitar.

**Como testar.** Entre como cliente → *Diário* → clique em "Almoço", depois em um cartão de degrau (por exemplo "Provou") e depois em "Todas". Abra "Registrar Refeição", digite "Ma" (sugestões), apague tudo e tente salvar (erro), depois escolha "Mamão" e salve.

**Evidências:** `01`, `02`, `03`, `04`, `05` e `06` (seção 6).

---

### 2.2 Anamnese em 8 etapas — validação campo a campo e rascunho automático

**O que faz.** Um formulário clínico dividido em 8 etapas. Não deixa avançar com campos obrigatórios em branco, destaca cada campo com problema, mostra uma mensagem e leva a tela até o primeiro erro. Enquanto a família preenche, o rascunho é salvo sozinho e pode ser retomado depois.

**Como funciona.**
1. As regras ficam em uma **função pura** `validarEtapa(etapa, dados)` que devolve `{ isValid, erros, mensagemToast, mensagemEtapa, refeicoesIncompletas }` — `anamnese/validation.ts:152`.
2. Ao clicar em "Próximo Passo", `handleSubmit` chama a função e, se houver erro, guarda `errosValidacao`, exibe o aviso e rola até a primeira pergunta inválida com `scrollIntoView` — `anamnese/page.tsx:946-1074`.
3. Regras condicionais: "Outro" exige texto; "TEA" exige o nível; "Sim" em medicamentos exige detalhes; horários de refeição ou "não costuma fazer" para cada refeição — `anamnese/validation.ts:160-519`.
4. Datas: nascimento não pode ser futuro nem anterior a 2006; datas de medidas não podem ser anteriores ao nascimento nem futuras — `anamnese/validation.ts:146-147` e `:162`.
5. **Rascunho automático:** a cada mudança, as respostas vão para o `localStorage` e, após **1,2 s sem digitar** (debounce com `setTimeout`/`clearTimeout`), são enviadas ao servidor; o selo "Alterações salvas automaticamente" mostra o estado — `anamnese/page.tsx:494-546`.
6. **Salvar e sair da conta:** abre um pop-up de confirmação, salva as respostas no servidor e só então encerra a sessão — `anamnese/page.tsx:1144`.

**Arquivos:** `src/app/anamnese/validation.ts` (regras), `src/app/anamnese/page.tsx` (tela).

**Conceitos:** funções puras, objetos e `Record`, validação condicional, debounce, refs e rolagem, estado da interface.

**Validações e situações inválidas.** Campo obrigatório vazio; opção "Outro" sem texto; data de nascimento futura; datas de medidas incoerentes; arquivo de exame ausente quando "Sim"; falha de rede no salvamento (o pop-up de "Salvar e sair" não deixa sair sem salvar e mostra o erro).

**Como testar.** Entre como cliente com a anamnese não concluída → informe um nome, digite uma data de nascimento futura e clique em "Próximo Passo". Rode `npm test` para ver as 8 etapas validadas automaticamente.

**Evidências:** `07` e `08`.

---

### 2.3 Pagamento — máscaras, validação do cartão, cupom e total

**O que faz.** Na tela de assinatura, os campos são formatados enquanto a pessoa digita; o cartão é validado campo a campo; um cupom de desconto recalcula o total na hora; as opções de parcelamento mudam conforme o plano e o valor.

**Como funciona.**
1. **Máscaras:** CPF (`000.000.000-00`), número do cartão (grupos de 4), validade (`MM/AA`) e CVV (só dígitos) — `pagamento/page.tsx:464-495`.
2. **Bandeira do cartão** detectada pelo início do número (Visa, Mastercard, Elo, Amex, Hipercard) com expressões regulares — `pagamento/page.tsx:498`.
3. **Validação do cartão** (`validarFormularioCartao`): 16 dígitos; nome com nome e sobrenome; validade no formato `MM/AA`, mês de 01 a 12 e não vencida; CVV de 3 ou 4 dígitos; CPF com 11 dígitos e sem repetição; CEP com 8 dígitos; número do endereço. Cada erro aparece abaixo do campo e a tela foca o primeiro campo inválido — `pagamento/page.tsx:529-620`.
4. **Validações gerais** antes de cobrar: nome, e-mail, celular com DDD, CPF e aceite dos termos — `pagamento/page.tsx:632-661`.
5. **Cupom:** `aplicarCupom` consulta o servidor e mostra o percentual ou o erro (código vazio, inválido, expirado) — `pagamento/page.tsx:222`. O desconto e o total final são derivados em tempo real — `pagamento/page.tsx:272-277`.
6. **Parcelas:** só as quantidades permitidas por plano e com parcela mínima — `pagamento/page.tsx:509` e `src/lib/planos.ts:52` (`normalizarParcelas`).
7. O valor cobrado de verdade é **sempre recalculado no servidor** (`calcularTotal`, `src/lib/planos.ts:28`); a tela só mostra a prévia.

**Arquivos:** `src/app/pagamento/page.tsx`, `src/lib/planos.ts`.

**Conceitos:** funções, expressões regulares, estado derivado, objetos de erros por campo, arrays (`PARCELAS_PERMITIDAS`) com `filter`/`map`.

**Validações e situações inválidas.** Cupom inexistente, vazio ou sem uso disponível; cartão vencido; CVV inválido; nome sem sobrenome; CEP incompleto; termos não aceitos; plano de upgrade incorreto.

**Como testar.** Abra `/pagamento?plano=trimestral` → preencha nome, e-mail, celular e CPF (veja a máscara) → digite um cupom inexistente (erro) → na aba "Crédito" preencha o cartão com `4111 1111 1111 1111`, validade `01/20` e CVV `000`, marque o aceite e clique em "Concluir Assinatura Segura" (erros nos campos, nada é enviado).

**Evidências:** `12`, `13` e `14`.

---

### 2.4 Calendário — datas e horários livres para a consulta

**O que faz.** Ao agendar a consulta, a tela sugere as **próximas datas com horário livre** (já descontando consultas marcadas e a agenda da profissional) e bloqueia os horários ocupados ou fora da regra de antecedência.

**Como funciona.**
1. `slotsDraLais` é um array com os horários oferecidos — `calendario/page.tsx:70`.
2. `isHorarioOcupado(data, horário)` decide se um horário está indisponível: antecedência mínima, ciclo de retorno de 4 semanas e horários já ocupados (`some`) — `calendario/page.tsx:409`.
3. `proximasDatasLivres` percorre os próximos dias e junta, para cada um, os horários livres (`filter`), limitando a 6 datas — `calendario/page.tsx:457`.
4. Clicar em uma data sugerida preenche a data e escolhe o primeiro horário livre; os botões de horário mudam de estado (selecionado, ocupado).
5. Os eventos do mês são agrupados por dia com `reduce` — `calendario/page.tsx:674`.

**Arquivos:** `src/app/dashboard/calendario/page.tsx`.

**Conceitos:** `useMemo`/`useCallback`, arrays, `filter`/`some`/`reduce`, regras de negócio no cliente (a regra final é reaplicada no servidor).

**Validações e situações inválidas.** Data anterior à antecedência mínima ("Horários preenchidos nesta data. Próximos horários livres a partir de …"); nenhum horário escolhido; horário já ocupado — `calendario/page.tsx:545-572`.

**Como testar.** Entre como cliente → *Calendário* → "Agendar Minha Consulta Agora" → clique em outra data sugerida e em outro horário → altere o campo de data para um dia muito próximo (horários ficam "Ocupado" e aparece o aviso).

**Evidências:** `09`, `10` e `11`.

---

## 3. Matriz de evidências

| Requisito | Funcionalidade relacionada | Arquivo(s) | Evidência |
|---|---|---|---|
| Manipulação do DOM | Diário: lista renderizada a partir do estado; compressão de foto via `<canvas>` criado com `document.createElement`. Anamnese: rolagem até o primeiro erro com `scrollIntoView` | `diario/page.tsx:307,450` e `:40`; `anamnese/page.tsx:1071` | Imagens `01`, `03`, `08`; no código, as linhas indicadas |
| Tratamento de eventos | `onChange`/`onClick`/`onSubmit` nos filtros, formulários e botões; tecla Esc (`keydown`); debounce do rascunho | `diario/page.tsx:180,405,425`; `anamnese/page.tsx:946,516`; `pagamento/page.tsx:632`; `calendario/page.tsx:545` | Imagens `02`, `04`, `10`; código nas linhas indicadas |
| Validação de formulários | Anamnese (`validarEtapa`), cartão (`validarFormularioCartao`), diário (alimento) e calendário (data/horário) | `anamnese/validation.ts:152`; `pagamento/page.tsx:529,632`; `diario/page.tsx:227-238`; `calendario/page.tsx:545-572` | Imagens `05`, `08`, `11`, `14`; `npm test` (casos de validação) |
| Alteração dinâmica da interface | Filtros e estado vazio; autocomplete; toast; total com cupom; horários que ficam "Ocupado"; selo de rascunho salvo | `diario/page.tsx:295-306,450`; `pagamento/page.tsx:272-277`; `calendario/page.tsx:409,457` | Imagens `02`, `03`, `04`, `06`, `10`, `11`, `13` |
| Uso de funções | `validarEtapa`, `calcularTotal`, `normalizarParcelas`, `somarMeses`, `handleCpf`, `detectarBandeira`, `isHorarioOcupado` | `anamnese/validation.ts:152`; `lib/planos.ts:28,52,70`; `pagamento/page.tsx:484,498`; `calendario/page.tsx:409` | `npm test` (funções puras testadas); código nas linhas indicadas |
| Uso de arrays | `historico` (registros), `bancoAlimentos`, `slotsDraLais`, `PARCELAS_PERMITIDAS`, lista de erros por campo | `diario/page.tsx:111-126`; `calendario/page.tsx:70`; `lib/planos.ts:39` | Imagens `01`, `04`, `09`; código nas linhas indicadas |
| Métodos de iteração | `filter` (filtros e sugestões), `map` (grupos e listas), `sort` (ordem cronológica), `Set` (datas únicas), `some` (horário ocupado), `reduce` (eventos por dia), `forEach` | `diario/page.tsx:118,295,303,307`; `calendario/page.tsx:409,457,674`; `pagamento/page.tsx:509-518` | Imagens `02`, `03`, `09`; código nas linhas indicadas |
| Tratamento de situações inválidas | Alimento em branco; filtros sem resultado; data de nascimento futura; cartão vencido/CVV inválido; cupom inexistente; data fora da antecedência mínima; falha ao salvar rascunho | `diario/page.tsx:231-238,450`; `anamnese/validation.ts:162`; `pagamento/page.tsx:222-262,529-620`; `calendario/page.tsx:545-572` | Imagens `03`, `05`, `08`, `11`, `12`, `14` |

---

## 4. Validações implementadas (resumo)

| Tela | Validação |
|---|---|
| Diário | Alimento obrigatório, sem espaços em branco e com ao menos 2 letras |
| Anamnese | Campos obrigatórios por etapa; texto quando "Outro"; nível do TEA; detalhes condicionais; datas coerentes; horários de refeição; arquivo de exame quando "Sim" |
| Pagamento | Nome, e-mail, celular com DDD, CPF; cartão (número, nome e sobrenome, validade, CVV, CPF, CEP, número); cupom; aceite dos termos |
| Calendário | Data com antecedência mínima; horário escolhido e livre |

## 5. Situações inválidas tratadas (resumo)

1. Registrar um alimento em branco → mensagem no campo, nada é salvo.
2. Combinação de filtros sem resultado → estado vazio explicativo.
3. Avançar na anamnese com campos obrigatórios vazios ou com data futura → campos destacados, aviso e rolagem até o primeiro erro.
4. Sair da anamnese sem conseguir salvar → o pop-up avisa e não encerra a sessão.
5. Cartão vencido, CVV inválido, nome sem sobrenome, CEP incompleto → erro abaixo de cada campo; nada é enviado ao servidor.
6. Cupom inexistente ou sem uso disponível → mensagem ao lado do campo, total inalterado.
7. Escolher data muito próxima ou horário ocupado no calendário → horários bloqueados e aviso com a primeira data possível.

## 6. Evidências de funcionamento

As capturas estão em `docs/evidencias/etapa-04/`. Os dados mostrados são de teste.

| Arquivo | O que mostra |
|---|---|
| `01-diario-listagem.jpg` | Diário com linha do tempo e contadores por degrau |
| `02-diario-filtro-refeicao.jpg` | Filtro "Almoço" aplicado |
| `03-diario-filtros-sem-resultado.jpg` | Filtros combinados sem resultado (estado vazio) |
| `04-diario-autocomplete.jpg` | Sugestões de alimento ao digitar "Ma" |
| `05-diario-validacao-campo-vazio.jpg` | Mensagem de erro com alimento em branco |
| `06-diario-registro-adicionado.jpg` | Registro adicionado, contador atualizado e aviso de sucesso |
| `07-anamnese-etapa-1.jpg` | Etapa 1 da anamnese, com o botão "Salvar e Sair da Conta" |
| `08-anamnese-validacao-erros.jpg` | Data futura e campos obrigatórios destacados, aviso e selo de rascunho |
| `09-calendario-horarios-livres.jpg` | Próximas datas livres e horários disponíveis |
| `10-calendario-selecao.jpg` | Nova data e novo horário selecionados |
| `11-calendario-data-invalida.jpg` | Data fora da antecedência: horários "Ocupado" e aviso |
| `12-pagamento-cupom-invalido.jpg` | CPF com máscara e cupom inexistente |
| `13-pagamento-cupom-aplicado.jpg` | Cupom de 15% aplicado e total recalculado |
| `14-pagamento-validacao-cartao.jpg` | Bandeira detectada e erros nos campos do cartão |

## 7. Testes automatizados

`npm test` executa `tests/etapa-04.test.ts` com o executor nativo do Node.js (`node:test`). São **14 casos**:
- `validarEtapa`: etapa vazia, etapa válida, data de nascimento futura/antiga, "Outro" sem texto, horários de refeição e as 8 etapas com dados válidos;
- `calcularTotal`: preço de tabela, cupom com arredondamento, crédito de upgrade e total nunca negativo;
- `normalizarParcelas`: quantidades permitidas por plano, valores vazios/inválidos e parcela mínima;
- `somarMeses` e `diasEntre`: último dia do mês e diferença em dias.

## 8. Limitações conhecidas

- Os filtros do diário não ficam salvos ao recarregar a página.
- As máscaras do pagamento são funções internas do componente; por isso são verificadas na tela (evidências `12` a `14`) e não em `npm test`.
- Alguns cupons pré-definidos no navegador servem apenas para exibir a prévia do desconto; o valor realmente cobrado é sempre calculado no servidor a partir dos cupons cadastrados.
