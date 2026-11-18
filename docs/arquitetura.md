# Arquitetura — Nutrindo em Casa

Documento vivo: descreve **como a aplicação está construída hoje**, as decisões técnicas e o que mudou em relação à proposta inicial (`docs/proposta.md`).

## 1. Visão geral

Plataforma web de acompanhamento nutricional infantil: a família faz a assinatura, preenche a anamnese, registra o diário alimentar, agenda a consulta, conversa com a nutricionista e assiste às aulas. A nutricionista usa um painel próprio.

```mermaid
flowchart LR
    subgraph Navegador
        UI["Páginas React (Next.js)"]
    end
    subgraph Vercel
        API["Rotas de API<br/>/api/* (Node.js)"]
        CRON["Cron diário<br/>/api/cron/renovacoes"]
    end
    subgraph Supabase
        AUTH["Auth (JWT)"]
        DB[("PostgreSQL")]
    end
    UI -- "fetch + Bearer token" --> API
    API -- "service role (só servidor)" --> DB
    API --> AUTH
    API -- "cobranças, Pix, cartão" --> ASAAS["Asaas"]
    ASAAS -- "webhook" --> API
    API -- "e-mails" --> RESEND["Resend"]
    API -- "agenda da nutricionista" --> GCAL["Google Agenda / Meet"]
    CRON --> API
```

## 2. Tecnologias

| Camada | Tecnologia | Para quê |
|---|---|---|
| Interface | React 19, Next.js 16 (App Router), TypeScript, Tailwind CSS 4 | Páginas, estado e estilo |
| Servidor | Rotas de API do Next.js (Node.js) | Endpoints REST em `src/app/api` |
| Banco e login | Supabase (PostgreSQL + Auth) | Dados e identidade (JWT) |
| Pagamentos | Asaas | Pix, cartão (à vista e parcelado), renovação |
| E-mail | Resend | Boas-vindas e avisos de renovação |
| Agenda | Google Calendar API | Eventos, sala do Meet e horários ocupados |
| Hospedagem | Vercel | Deploy a cada push em `main` e cron diário |
| Testes | `node:test` (Node.js) | Regras puras de validação e cálculo (`tests/`) |

## 3. Organização do código

```
src/
├── app/                    # Páginas (App Router) e rotas de API
│   ├── api/                # Endpoints REST (um route.ts por recurso)
│   ├── anamnese/           # Formulário clínico em 8 etapas (+ validation.ts)
│   ├── dashboard/          # Área da família: diário, calendário, chat, cursos...
│   ├── nutri/              # Painel e prontuários da nutricionista
│   ├── pagamento/          # Checkout (Pix e cartão)
│   └── login, termos, privacidade, criar-senha, ...
├── components/             # Componentes compartilhados (TermosGate, Sidebar, ...)
├── hooks/useAuthGuard.ts   # Proteção de páginas e encerramento de sessão
└── lib/                    # Regras de negócio e integrações (sem tela)
    ├── auth.ts             # Valida o token no servidor, papel (nutri/cliente)
    ├── planos.ts           # Fonte única de preços e parcelas
    ├── asaas.ts            # Cliente da API do Asaas
    ├── cupons.ts, renovacao.ts, parcelado.ts, assinatura.ts
    ├── googleAgenda.ts, agendaSync.ts   # Integração com a agenda
    ├── email.ts, termos.ts, tokenCompra.ts, rateLimit.ts
supabase/
├── schema.sql              # Esquema inicial
└── migrations/             # Alterações aplicadas em ordem (SQL)
tests/                      # Testes automatizados
docs/                       # Documentação e evidências de cada etapa
```

**Camadas.** (1) *Interface* (`app/**/page.tsx`) → (2) *Rotas de API* (`app/api/**/route.ts`: autenticam, validam a entrada e respondem JSON) → (3) *Regras e integrações* (`lib/`) → (4) *Banco* (Supabase). As regras que não dependem de tela ficam em `lib/` para poderem ser reaproveitadas e testadas.

## 4. Autenticação e autorização

1. `POST /api/auth/login` valida e-mail/senha (ou CPF) no Supabase Auth e devolve `token` e `refresh_token`.
2. O navegador guarda o token e um interceptador (`authFetch`) coloca `Authorization: Bearer …` em toda chamada a `/api/*`, renovando a sessão uma vez se receber 401.
3. **Toda rota protegida valida o token no servidor** (`lib/auth.ts` → `exigirUsuario` / `exigirNutri`). Nada vem do navegador sem conferência: o e-mail-alvo e o papel são derivados do token.
4. O papel de nutricionista vem de `app_metadata.role` (gravável só pelo servidor), nunca de dados editáveis pelo usuário.
5. O banco só é acessado pelo servidor com a chave de serviço; os papéis públicos do Supabase (`anon`/`authenticated`) não têm acesso às tabelas.
6. `POST /api/auth/logout` revoga a sessão no servidor; o front apaga os dados locais.
7. Tentativas de login com falha têm limite por IP (40) e por conta (8) em uma janela de tempo (`lib/rateLimit.ts`).

## 5. Modelo de dados (PostgreSQL)

| Tabela | Conteúdo |
|---|---|
| `profiles` | Responsável: dados, plano, status da assinatura, renovação, aceite dos termos |
| `anamneses` | Respostas da anamnese (JSON) e se foi concluída |
| `agendamentos` | Consultas e metas (data, horário, link do Meet, id do evento no Google) |
| `diario_refeicoes` | Alimentos oferecidos, refeição, degrau da escada, observações, foto |
| `mensagens_chat` | Conversa família ↔ nutricionista (com anexos) |
| `devolutivas_semanais`, `prescricoes_plano`, `respostas_rapidas_nutri` | Material clínico da nutricionista |
| `curso_estrutura`, `materiais_aulas` | Módulos, aulas e materiais |
| `faturas` | Cobranças (Pix, cartão, parcelas) |
| `cupons` | Código, percentual (1–99%), validade e limite de uso |
| `cartoes_salvos` | Token do cartão (nunca o número) para a renovação |
| `asaas_eventos` | Eventos de webhook já processados (evita duplicidade) |
| `aceites_termos` | Trilha de auditoria do aceite (versão, data, IP, navegador) |
| `google_integracao` | Conexão com o Google da nutricionista (token só no servidor) |

As alterações do esquema estão em `supabase/migrations/` (aplicadas em ordem).

## 6. Endpoints da API

| Grupo | Endpoints | Quem acessa |
|---|---|---|
| Conta | `POST /api/auth/login`, `/refresh`, `/logout`, `/forgot-password`, `/update-password`, `/criar-senha-compra`; `GET /api/auth/me`, `/google`, `/google/callback` | Público ou logado |
| Cliente | `GET·POST /api/anamnese`, `/diario`, `/agendamentos`, `/chat`; `GET·PUT /api/configuracoes`; `GET·POST /api/termos`; `GET·PATCH /api/devolutivas`; `GET /api/cursos` | Cliente (só os próprios dados; a nutricionista também acessa) |
| Nutricionista | `GET·POST /api/nutri`; `GET·POST·DELETE /api/nutri/google`; `POST /api/cursos`; `POST·PATCH·DELETE /api/cupons` | Nutricionista |
| Pagamento | `POST /api/asaas/subscription`, `/cancel`; `GET /api/asaas/pagamento-status`; `GET /api/cupons?codigo=` (validar cupom) | Público (checkout) ou logado |
| Integrações | `POST /api/asaas/webhook` (token no cabeçalho); `GET /api/cron/renovacoes` (segredo); `GET·POST /api/google-calendar/events` | Sistemas externos |

## 7. Fluxos principais

### 7.1 Compra com Pix ou cartão

```mermaid
sequenceDiagram
    participant F as Família (navegador)
    participant A as API (/api/asaas/subscription)
    participant S as Asaas
    participant W as Webhook (/api/asaas/webhook)
    participant D as Supabase
    F->>A: dados + plano + cupom + aceite
    A->>A: recalcula o preço no servidor (lib/planos.ts)
    A->>S: cria assinatura / compra parcelada
    S-->>A: cobrança (Pix: QR Code)
    A->>D: grava perfil e fatura
    A-->>F: QR Code (ou confirmação)
    S->>W: pagamento confirmado
    W->>D: fatura "Pago", perfil ATIVO
    W->>F: e-mail com o link de acesso
    F->>A: consulta pagamento-status (a cada 4 s)
    A-->>F: pago → criar senha e entrar
```

### 7.2 Renovação automática
O Vercel chama `GET /api/cron/renovacoes` todo dia às 12:00 UTC. A rota exige o segredo do cron, avisa por e-mail 7 dias antes e, no vencimento, cobra de novo no cartão salvo. São 3 tentativas; sem sucesso, o acesso é suspenso. A cobrança do dia é "reservada" antes de ser feita, para nunca cobrar duas vezes.

### 7.3 Agendamento sincronizado com a agenda da nutricionista
A nutricionista conecta o Google no painel. Ao marcar uma consulta, a API cria o evento com a sala do Meet e o convite para a família, e os horários que ela já tem ocupados deixam de ser oferecidos. Um índice único no banco impede duas famílias no mesmo horário.

## 8. Decisões técnicas

| Decisão | Motivo | Alternativa descartada |
|---|---|---|
| **Next.js com rotas de API** no mesmo projeto | Um único deploy, tipos compartilhados entre tela e servidor | Servidor Express separado |
| **Supabase** (Postgres + Auth) | Login, banco e e-mail de convite prontos; plano gratuito | Prisma + PostgreSQL próprio (previsto na proposta) |
| **Acesso ao banco só pelo servidor** | Evita regras de acesso no navegador e vazamento de dados de saúde | Consultas diretas do navegador com RLS |
| **Preço sempre calculado no servidor** (`lib/planos.ts`) | O navegador nunca define quanto será cobrado | Enviar o valor do front |
| **Asaas** como gateway | Pix e cartão parcelado/recorrente em um só provedor | Hotmart (previsto na proposta), Mercado Pago |
| **Webhook idempotente** (`asaas_eventos`) | Avisos podem chegar repetidos ou fora de ordem | Processar cada aviso sem registro |
| **Token JWT validado no servidor** | Sessão revogável e papéis confiáveis | Sessão por cookie (previsto na proposta) |
| **Token do cartão em tabela separada** | Nunca guardamos número ou CVV | Guardar dados do cartão |
| **Regras puras em `lib/` e `validation.ts`** | Podem ser testadas sem tela nem banco | Regras dentro dos componentes |
| **Termos com versão e aceite auditável** | Prova de consentimento (dados de saúde de crianças) | Aceite só no cadastro |

## 9. Mudanças em relação à proposta inicial

| Proposta | Hoje | Por quê |
|---|---|---|
| Prisma + PostgreSQL | Supabase (`supabase-js`) com migrações SQL | Menos infraestrutura; login e banco no mesmo serviço |
| Hotmart (webhook cria o usuário) | Checkout próprio com Asaas | Controle do fluxo, Pix e parcelamento |
| Sessão por cookies | JWT (Bearer) validado no servidor | Revogação de sessão e rotas de API simples |
| Dados simulados | Dados reais com persistência | Evolução do projeto |

## 10. Limitações e evolução

- O limitador de tentativas fica na memória de cada instância do servidor (suficiente hoje; para escala, usar um armazenamento compartilhado).
- O ambiente local usa o mesmo banco de produção; o ideal é ter um projeto Supabase só para desenvolvimento e testes.
- Há testes automatizados só para as regras puras. Faltam testes das rotas de API (contrato de entrada e saída).
- Padronizar as respostas de erro das rotas e publicar o contrato da API (OpenAPI/Postman) facilitará testes e novos clientes.
