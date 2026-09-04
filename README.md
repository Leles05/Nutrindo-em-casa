# Nutrindo em Casa

## Descrição da Aplicação
A Nutrindo em casa é uma plataforma web híbrida que une um ambiente educacional (cursos de saúde e nutrição) com um sistema de acompanhamento clínico para crianças com seletividade alimentar, TEA ou outras questões que exijam o acompanhamento. A aplicação ensina os pais da criança a como cuidar do filho nesse quesito, integrando o consumo de videoaulas, o preenchimento de anamnese, o chat com a nutricionista e o agendamento da primeira consulta em um único ecossistema.

## Problema que a Aplicação Resolve
Atualmente, pais de crianças com necessidades especiais gastam cerca de 3 mil reais por mês para terem acompanhamentos nutricionais. Dessa forma, estamos fazendo com que os pais consigam economizar dinheiro e aprender a cuidar dos filhos. O paciente compra o programa por uma plataforma externa (como Hotmart), preenche a anamnese via formulários e realiza o agendamento. A Nutrindo em casa diminui os processos e ensina os pais a cuidar das crianças. Dessa forma, deixando mais acessível para pais cuidarem de suas crianças com necessidades especiais.

## Tecnologias Utilizadas
* **Front-end:** React 19, Next.js 16 (App Router), Tailwind CSS 4 e TypeScript.
* **Back-end:** Node.js, por meio das rotas de API do Next.js (`src/app/api`).
* **Banco de Dados:** PostgreSQL (previsto na proposta; nesta etapa as telas ainda usam dados simulados).

## Como executar
```bash
npm install
npm run dev                  # abre em http://localhost:3000
```

## Funcionalidades Planejadas (Escopo Total)
*Atenção: O projeto encontra-se em desenvolvimento (Etapa 03). As funcionalidades abaixo representam o escopo total planejado para a entrega final.*
* **Módulo de Autenticação:** Login seguro, recuperação e redefinição de senha.
* **Coleta de Anamnese:** Formulário clínico para triagem do paciente.
* **Agendamento Integrado:** Interface de calendário para visualização e marcação de consultas.
* **Área de Membros (Cursos):** Player educacional para os pais assistirem aos módulos de nutrição.
* **Diário Alimentar:** Área para registro rápido de novos alimentos introduzidos.

## Limitações Conhecidas (Fase Atual)
* **Mock Data (Dados Simulados):** as interfaces ainda não possuem integração real com o banco de dados. O sistema opera com dados estáticos para validação de layout e fluxo (UX/UI), sem persistência.

## Documentação
* `docs/proposta.md`: proposta e especificação do projeto (Etapa 01).
* `docs/etapa-03.md`: relatório da interface responsiva, com as evidências em `docs/evidencias/etapa-03/`.

---

## Entrega - Etapa 02 (Protótipo Estrutural com HTML Semântico)

### 1. Funcionalidades Implementadas (Interfaces)
* **Autenticação (Mock):** Fluxo de entrada com formulário de login (e-mail e senha) e botões de provedores sociais (Google/Facebook).
* **Recuperação de Acesso:** Telas interativas para solicitação de redefinição de senha e criação de nova credencial, com validação de força de senha em tempo real.
* **Dashboard (Visão Geral):** Painel inicial da área logada contendo saudação dinâmica baseada no relógio do cliente, visualização de progresso educacional (Cursos) e listagem tática de compromissos via calendário.

### 2. Páginas Criadas
1. **`/` (Login):** Interface de autenticação principal.
2. **`/esqueci-senha`:** Interface para captura de e-mail de recuperação.
3. **`/redefinir-senha/[token]`:** Rota dinâmica para digitação e validação de nova senha.
4. **`/dashboard`:** Painel principal (Início) da mãe com barra de navegação lateral fixa (Single Page Application view).

### 3. Decisões relacionadas à estrutura HTML Semântica
O projeto foi desenvolvido garantindo alta acessibilidade (a11y) e semântica web estrutural:
* **Estruturação de Layout:** Utilização das tags `<main>` para o conteúdo principal, `<aside>` para a barra lateral de navegação no dashboard, e `<header>` para o cabeçalho das páginas, garantindo que leitores de tela compreendam as regiões e hierarquias da página.
* **Navegação e Agrupamento:** Uso de `<nav>` para os links do menu lateral e `<section>` para separar visualmente e semanticamente os blocos de conteúdo no painel principal (Cursos, Calendário e Diário Alimentar).
* **Formulários e Acessibilidade:** Todos os formulários utilizam a tag `<form>`, e os campos de entrada (`<input>`) estão explicitamente associados às suas respectivas descrições usando a propriedade `<label htmlFor="...">` combinada com o atributo `id`, cumprindo as diretrizes WCAG e otimizando a experiência de navegação por teclado e leitores de tela.


---

## Entrega - Etapa 03 (Interface Responsiva com CSS)
* **Telas documentadas:** Login (`/`), Dashboard (`/dashboard`) e Formulário de Anamnese (`/anamnese`), em oito etapas navegáveis.
* **Responsividade:** Tailwind CSS (mobile-first) com Flexbox e Grid, nos breakpoints `sm` (640px), `md` (768px) e `lg` (1024px).
* **Evidências:** 9 capturas (3 telas × desktop 1440×900, tablet 768×1024 e smartphone 390×844) em `docs/evidencias/etapa-03/`.
* **Relatório:** `docs/etapa-03.md` (viewports, breakpoints, decisões e onde está o CSS).
