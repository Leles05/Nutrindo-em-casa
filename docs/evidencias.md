# Evidências do projeto — Nutrindo em Casa

Índice central das entregas: onde está o documento de cada etapa, onde estão as evidências (capturas e testes) e como reproduzi-las. Cada etapa tem uma **tag Git** (`etapa-01`, `etapa-02`, …) que identifica a versão entregue.

## 1. Resumo por etapa

| Etapa | Tema | Documento | Evidências | Tag |
|---|---|---|---|---|
| 01 | Proposta e especificação | [`proposta.md`](proposta.md) e [`../README.md`](../README.md) | Diagrama e descrição da proposta no próprio documento | `etapa-01` |
| 02 | Protótipo estrutural em HTML semântico | Seção "Entrega - Etapa 02" do [`../README.md`](../README.md) | Páginas criadas e decisões de estrutura no README | `etapa-02` |
| 03 | Interface responsiva com CSS | [`etapa-03.md`](etapa-03.md) | [`evidencias/etapa-03/`](evidencias/etapa-03/) — 9 capturas (3 telas × 3 tamanhos) | `etapa-03` |
| 04 | Interatividade com JavaScript | [`etapa-04.md`](etapa-04.md) | [`evidencias/etapa-04/`](evidencias/etapa-04/) — 14 capturas e [`../tests/etapa-04.test.ts`](../tests/etapa-04.test.ts) — 14 testes | `etapa-04` |

Documentos de apoio: [`arquitetura.md`](arquitetura.md) (como o sistema é construído e por quê).

## 2. Etapa 03 — responsividade

Telas: Login, Painel (dashboard) e Anamnese, em três tamanhos de tela.

| Tamanho | Largura × altura | Arquivos |
|---|---|---|
| Desktop | 1440 × 900 | `desktop-tela-01.png`, `desktop-tela-02.png`, `desktop-tela-03.png` |
| Tablet | 768 × 1024 | `tablet-tela-01.png`, `tablet-tela-02.png`, `tablet-tela-03.png` |
| Smartphone | 390 × 844 | `smartphone-tela-01.png`, `smartphone-tela-02.png`, `smartphone-tela-03.png` |

Pasta: [`evidencias/etapa-03/`](evidencias/etapa-03/). Detalhes de breakpoints e decisões em [`etapa-03.md`](etapa-03.md).

## 3. Etapa 04 — interatividade

| Captura | O que comprova |
|---|---|
| [`01-diario-listagem.jpg`](evidencias/etapa-04/01-diario-listagem.jpg) | Linha do tempo e contadores por degrau |
| [`02-diario-filtro-refeicao.jpg`](evidencias/etapa-04/02-diario-filtro-refeicao.jpg) | Filtro por refeição (alteração dinâmica da lista) |
| [`03-diario-filtros-sem-resultado.jpg`](evidencias/etapa-04/03-diario-filtros-sem-resultado.jpg) | Estado vazio com filtros combinados |
| [`04-diario-autocomplete.jpg`](evidencias/etapa-04/04-diario-autocomplete.jpg) | Autocomplete de alimentos |
| [`05-diario-validacao-campo-vazio.jpg`](evidencias/etapa-04/05-diario-validacao-campo-vazio.jpg) | Validação: alimento em branco |
| [`06-diario-registro-adicionado.jpg`](evidencias/etapa-04/06-diario-registro-adicionado.jpg) | Inclusão do registro, contador e aviso de sucesso |
| [`07-anamnese-etapa-1.jpg`](evidencias/etapa-04/07-anamnese-etapa-1.jpg) | Etapa 1 da anamnese |
| [`08-anamnese-validacao-erros.jpg`](evidencias/etapa-04/08-anamnese-validacao-erros.jpg) | Campos obrigatórios e data inválida destacados |
| [`09-calendario-horarios-livres.jpg`](evidencias/etapa-04/09-calendario-horarios-livres.jpg) | Datas e horários livres |
| [`10-calendario-selecao.jpg`](evidencias/etapa-04/10-calendario-selecao.jpg) | Seleção de data e horário |
| [`11-calendario-data-invalida.jpg`](evidencias/etapa-04/11-calendario-data-invalida.jpg) | Horários bloqueados em data inválida |
| [`12-pagamento-cupom-invalido.jpg`](evidencias/etapa-04/12-pagamento-cupom-invalido.jpg) | Máscara de CPF e cupom inexistente |
| [`13-pagamento-cupom-aplicado.jpg`](evidencias/etapa-04/13-pagamento-cupom-aplicado.jpg) | Cupom aplicado e total recalculado |
| [`14-pagamento-validacao-cartao.jpg`](evidencias/etapa-04/14-pagamento-validacao-cartao.jpg) | Validação do cartão campo a campo |

A relação requisito → arquivo → evidência está na matriz de [`etapa-04.md`](etapa-04.md#3-matriz-de-evidências).

## 4. Como reproduzir

```bash
npm install
cp .env.example .env.local     # preencha as chaves
npm run dev                    # http://localhost:3000
npm test                       # testes automatizados (regras puras)
npx tsc --noEmit               # checagem de tipos
```

**Capturas de tela:** use as larguras da tabela da Etapa 03 (ferramentas do navegador → modo dispositivo) e dados de teste, nunca dados reais de pacientes. Nomeie os arquivos com número e assunto (`NN-tela-descricao.jpg`).

## 5. Qualidade (estado atual)

| Verificação | Resultado |
|---|---|
| Testes automatizados (`npm test`) | 14 testes, todos passando |
| Tipos (`npx tsc --noEmit`) | Sem erros |
| Segredos no repositório | Nenhum; apenas `.env.example` (sem valores) |
| Implantação | Vercel, a cada push em `main` |

## 6. Padrão para as próximas etapas

Para cada nova etapa:

1. `docs/etapa-NN.md` — o que foi feito, arquivos envolvidos, como testar e matriz requisito → arquivo → evidência.
2. `docs/evidencias/etapa-NN/` — capturas numeradas.
3. `tests/` — testes das regras novas (`npm test`).
4. Atualizar este índice, o `README.md` e, se a estrutura mudou, o `arquitetura.md`.
5. Criar a tag `etapa-NN` no commit final da entrega.

### Pendências já identificadas para a próxima etapa

- Documentar o contrato da API REST (entradas, saídas e códigos de erro) e padronizar as mensagens de erro.
- Testes automatizados das rotas de API.
- Separar um banco só para desenvolvimento e testes.
- Atualizar o `README.md` (funcionalidades atuais, tecnologias reais e instruções de execução).
