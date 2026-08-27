# Proposta do Projeto: Nutrindo em casa

## 1. Nome da aplicação
Nutrindo em casa 

## 2. Descrição do problema que pretende resolver
Pais de crianças com necessidades especiais (como TEA ou seletividade alimentar severa) chegam a gastar cerca de 3 mil reais por mês para manter acompanhamentos nutricionais presenciais contínuos. Esse alto custo financeiro afasta muitas famílias do tratamento adequado. Além disso, falta no mercado uma ferramenta unificada que vá além da consulta e eduque a família. Há uma carência de soluções acessíveis que centralizem o cuidado clínico e o ensino. O projeto visa preencher essa lacuna através de uma plataforma online econômica onde, após a entrada no programa, o usuário tem acesso centralizado ao seu prontuário, agendamento de consultas de alinhamento e trilhas de aprendizagem, capacitando os pais a cuidarem da alimentação de seus filhos com independência.

## 3. Público-alvo
Pais, mães e responsáveis por crianças com seletividade alimentar, Transtorno do Espectro Autista (TEA) ou outras necessidades clínicas que exijam acompanhamento e reeducação alimentar infantil.

## 4. Objetivo principal da aplicação
Tornar o acompanhamento nutricional especializado mais acessível e unificado. A plataforma visa centralizar processos (coleta de anamnese, agendamento e chat) e integrar um ambiente educacional para ensinar e capacitar os pais a lidarem com a alimentação de seus filhos no dia a dia, gerando economia e autonomia.

## 5. Pelo menos 5 funcionalidades que a aplicação deverá possuir
1. **Autenticação de Usuários:** Login seguro e fluxo de redefinição obrigatória de senha no primeiro acesso.
2. **Coleta de Anamnese Infantil:** Formulário clínico digital contínuo com salvamento automático (rascunho), focado no histórico da criança.
3. **Agendamento Integrado:** Interface interativa de calendário para o agendamento da primeira consulta.
4. **Área de Membros (Curso):** Player de vídeo imersivo com trilhas de aprendizado modulares focadas na educação dos pais.
5. **Chat e Prontuário Digital:** Dashboard para a nutricionista ler os formulários, registrar anotações internas e se comunicar com os pais via chat.

## 6. Pelo menos 3 entidades ou conceitos importantes do domínio
1. **Usuário (Responsável e Nutricionista):** Entidade que gerencia os dados de acesso, o status de assinatura ativa e, no caso da profissional, os tokens de integração com o Google Calendar.
2. **Anamnese (Prontuário Infantil):** Estrutura clínica armazenada em formato JSON, contendo todo o mapeamento de seletividade alimentar, alergias e rotina da criança.
3. **Agendamento (Consulta):** Reserva de horário que consulta dinamicamente a disponibilidade real do Google Calendar da profissional e sincroniza o evento automaticamente.
4. **Mensagem (Chat Direto):** Sistema de comunicação bilateral entre o paciente e a nutricionista, com suporte a envio de textos e anexos (arquivos e imagens).
5. **Conteúdo (Aulas e Progresso):** Estrutura que organiza as trilhas de aprendizado (módulos e vídeos protegidos por bloqueio de domínio) e rastreia o status de conclusão do aluno.

## 7. Descrição de pelo menos 3 telas ou interfaces
1. **Tela de Login Minimalista:** Interface limpa focada em conversão, contendo campos de e-mail e senha, com botão para visualizar a senha e esqueci a senha.
2. **Formulário de Anamnese Infantil:** Tela dividida em seções (dados da criança, histórico clínico, hábitos e recordatório alimentar) com barra de progresso.
3. **Área de Aulas (Player):** Interface imersiva contendo um menu lateral recolhível com a lista de módulos e um player de vídeo central com botão para avançar para a próxima tarefa.

## 8. Descrição de pelo menos 5 operações que deverão existir na aplicação
1. **Redefinir Senha:** Atualização da credencial provisória para uma senha definitiva criada pelo usuário.
2. **Salvar Rascunho da Anamnese:** Persistência parcial dos dados inseridos no formulário clínico.
3. **Registrar Agendamento:** Escolha de um horário no calendário que cria um evento e libera o acesso às aulas.
4. **Enviar Mensagem (Chat):** Comunicação em texto entre o responsável (aluno) e a nutricionista.
5. **Atualizar Status do Prontuário:** Ação administrativa onde a profissional marca uma anamnese lida como "Revisada".

## 9. Tecnologias que pretende utilizar no cliente
* **React:** Biblioteca para construção das interfaces interativas.
* **Next.js:** Framework para estruturação e roteamento da aplicação.
* **Tailwind CSS:** Framework de estilização via classes utilitárias.
* **TypeScript:** Adição de tipagem estática para garantir a segurança dos dados manipulados no front-end.

## 10. Tecnologias que pretende utilizar no servidor
* **Node.js** operando através do Next.js API Routes.
* Autenticação baseada em **Sessões e Cookies**.

## 11. Tecnologia de persistência, caso exista
* **PostgreSQL:** Sistema gerenciador de banco de dados relacional.
* **Prisma ORM:** Ferramenta de mapeamento objeto-relacional para comunicação com o banco de dados.

## 12. Um diagrama simples mostrando a visão geral da solução

[Hotmart (Webhooks)] ---> (Criação de Usuário) ---> [Envio de E-mail de Acesso] --->
                                                          

 ---> [Login na Plataforma] ---> [Redefinição de Senha] ---> [Anamnese da Criança]
                                                          |
                                                          |
                                                          V
[Área do Curso / Chat] <--- [Pop-up de Confirmação] <--- [Agendamento no Calendário]