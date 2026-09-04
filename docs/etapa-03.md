# Etapa 03 — Interface Responsiva com CSS

## 1. Interfaces Apresentadas
Foram selecionadas as 3 principais interfaces do fluxo do sistema para documentação de responsividade:
* **Tela 01:** Autenticação (Login) - Rota `/`
* **Tela 02:** Dashboard Principal (Área Logada) - Rota `/dashboard`
* **Tela 03:** Formulário de Anamnese (Wizard) - Rota `/anamnese`

## 2. Viewports Utilizados
As evidências capturadas cobrem os três cenários exigidos e estão salvas no diretório `/docs/evidencias/etapa-03/`:
* **Desktop:** 1440 × 900 px
* **Tablet:** 768 × 1024 px
* **Smartphone:** 390 × 844 px

## 3. Breakpoints Utilizados
O projeto utiliza o framework Tailwind CSS, adotando a metodologia *Mobile-First*. Os breakpoints acionados nas interfaces foram:
* `sm` (Mínimo de 640px)
* `md` (Mínimo de 768px)
* `lg` (Mínimo de 1024px)

## 4. Principais Decisões de Responsividade
Para garantir a legibilidade e usabilidade em múltiplos dispositivos, as seguintes estratégias CSS foram aplicadas:
* **Grid Fluido:** Na tela de Dashboard, a matriz de layout usa `grid-cols-1` em smartphones (empilhando os Cursos e o Calendário sobre o Diário Alimentar) e expande para `lg:grid-cols-3` em telas maiores.
* **Flexbox Oculto:** Ocultação de elementos não-essenciais em telas pequenas usando `hidden sm:block` (exemplo: a logo e a label de "Rascunho salvo" na barra da Anamnese).
* **Campos Expansivos:** Os inputs dos formulários foram desenhados com `w-full`, permitindo que consumam 100% da largura disponível em smartphones e se reorganizem em pares lado a lado no desktop (`md:grid-cols-2`).

## 5. Localização dos Arquivos CSS
A responsividade foi construída através de CSS Utility-First. As lógicas de media queries, Flexbox e Grid estão encapsuladas diretamente nas classes dos componentes React (arquivos `.tsx` no diretório `src/app/`). A estilização base e diretivas do framework encontram-se no arquivo `src/app/globals.css`.