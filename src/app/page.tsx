"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Stethoscope, Video, Sparkles, ShieldCheck, CheckCircle2,
  ChevronRight, ChevronDown, Award, Star, ArrowRight, Play,
  BookOpen, Clock, Heart, Users, FileText, Check, Lock,
  HelpCircle, MessageCircle, Quote
} from "lucide-react";

export default function PaginaInicialLanding() {
  // Estado para acordeão do FAQ
  const [faqAberto, setFaqAberto] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setFaqAberto(faqAberto === index ? null : index);
  };

  const perguntasFrequentes = [
    {
      pergunta: "Meu filho tem muita seletividade alimentar, o método funciona para o caso dele?",
      resposta:
        "Sim. A metodologia da Dra. Laís Leles é baseada em evidências científicas e aborda as 5 fases sensoriais (tolerar, cheirar, tocar, provar e comer), respeitando o tempo individual de cada criança sem forçar ou gerar traumas."
    },
    {
      pergunta: "Como funciona a Anamnese Pediátrica de 56 perguntas?",
      resposta:
        "Assim que você entra na plataforma, você preenche um prontuário detalhado com histórico gestacional, seletividade e repertório de alimentos aceitos. A Dra. Laís utiliza essas informações para individualizar as orientações clínicas da sua família."
    },
    {
      pergunta: "Onde assisto às aulas e como funciona o suporte?",
      resposta:
        "Todas as videoaulas são gravadas em alta definição na nossa infraestrutura de streaming seguro e podem ser assistidas no computador, tablet ou celular a qualquer hora. Você também conta com lembretes diários e acompanhamento de metas."
    },
    {
      pergunta: "Como funciona a garantia de 7 dias e o cancelamento?",
      resposta:
        "Você tem 7 dias de garantia incondicional. Se não notar valor real na evolução do seu filho, basta solicitar a devolução com 1 clique direto no painel do Asaas, sem burocracia. Os planos podem ser cancelados a qualquer momento na sua aba de configurações."
    }
  ];

  const depoimentos = [
    {
      nome: "Mariana S.",
      parentesco: "mãe do Pedro (3 anos)",
      foto: "MS",
      cor: "from-[#4C6C54] to-[#689373]",
      texto:
        "O Pedro só aceitava biscoito e macarrão puro. Em 4 semanas de aplicação das técnicas da Dra. Laís, conseguimos colocar brócolis no prato de apoio sem choro! As refeições voltaram a ser um momento de paz na nossa casa."
    },
    {
      nome: "Rodrigo M.",
      parentesco: "pai da Júlia (5 anos)",
      foto: "RM",
      cor: "from-[#EB6D57] to-[#f29382]",
      texto:
        "A anamnese abriu meus olhos sobre as texturas que incomodavam a Júlia. O diário alimentar nos dá clareza diária de pequenas conquistas. Não é milagre, é método e paciência orientada."
    },
    {
      nome: "Camila V.",
      parentesco: "mãe do Lucas (2 anos)",
      foto: "CV",
      cor: "from-emerald-600 to-teal-700",
      texto:
        "Melhor investimento que fizemos. Saber o passo a passo exato do que fazer na hora do almoço tirou todo o estresse da nossa mesa. O acompanhamento da Dra. Laís é de um acolhimento raro."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F0EAE1] text-slate-800 font-sans selection:bg-[#4C6C54] selection:text-white relative">
      
      {/* ===================================================================== */}
      {/* 1. HEADER / NAVBAR SUPERIOR FIXO E MODERNO */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-50 bg-[#F0EAE1]/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 sm:h-20 flex items-center justify-between gap-4">
          
          {/* LOGO OFICIAL */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="relative h-10 w-32 sm:h-11 sm:w-36">
              <Image
                src="/logo-transparente.png"
                alt="Nutrindo em Casa"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
            <span className="hidden md:inline-block text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-[#4C6C54]/10 text-[#4C6C54] tracking-wider">
              Método Dra. Laís Leles
            </span>
          </Link>

          {/* NAVEGAÇÃO DE ÂNCORAS CENTRAL */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#metodologia" className="hover:text-[#4C6C54] transition-colors">
              Metodologia
            </a>
            <a href="#pilares" className="hover:text-[#4C6C54] transition-colors">
              Pilares
            </a>
            <a href="#depoimentos" className="hover:text-[#4C6C54] transition-colors">
              Depoimentos
            </a>
            <a href="#faq" className="hover:text-[#4C6C54] transition-colors">
              Dúvidas
            </a>
            <a href="#planos" className="hover:text-[#4C6C54] transition-colors">
              Planos
            </a>
          </nav>

          {/* BOTÕES DO CANTO DIREITO */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center py-2 px-3 sm:px-4 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              <span>Já sou Aluno</span>
              <span className="hidden sm:inline">&nbsp;(Entrar)</span>
            </Link>

            <Link
              href="/pagamento?plano=trimestral"
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3.5 sm:px-5 bg-[#4C6C54] hover:bg-[#3a5340] text-white font-extrabold text-xs rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Começar Agora</span>
              <ArrowRight className="h-3.5 w-3.5 hidden sm:inline" />
            </Link>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. HERO SECTION (IMPACTO E ACOLHIMENTO) */}
      {/* ===================================================================== */}
      <section className="pt-10 sm:pt-16 pb-12 sm:pb-16 px-4 sm:px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* COLUNA ESQUERDA: TEXTO DE IMPACTO */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* BADGE SUPERIOR */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-amber-200/90 shadow-2xs text-slate-700 text-xs font-bold">
              <div className="flex text-amber-500">
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
                <Star className="h-3.5 w-3.5 fill-current" />
              </div>
              <span className="text-[11px] font-extrabold text-slate-800">
                Método Clínico Validado • Avaliação 4.9/5 pelas famílias
              </span>
            </div>

            {/* TÍTULO PRINCIPAL */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.18]">
              Transforme a relação do seu filho com a comida de forma{" "}
              <span className="text-[#4C6C54] underline decoration-[#EB6D57]/40 decoration-wavy decoration-2">
                leve
              </span>{" "}
              e baseada em evidências.
            </h1>

            {/* SUBTÍTULO */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Acompanhamento clínico estruturado, terapia alimentar descomplicada e estratégias sensoriais práticas para vencer a seletividade alimentar infantil sem traumas.
            </p>

            {/* BOTÕES DE AÇÃO COM DEEP LINK */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <Link
                href="/pagamento?plano=trimestral"
                className="w-full sm:w-auto py-3.5 px-6 sm:px-7 bg-[#4C6C54] hover:bg-[#3a5340] active:scale-[0.99] text-white font-extrabold text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span>Conhecer Nossos Planos e Assinar</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href="#metodologia"
                className="w-full sm:w-auto py-3.5 px-6 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-sm rounded-2xl shadow-2xs hover:shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Entenda o Método</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </a>
            </div>

            {/* SELO DE CONFIANÇA RÁPIDO */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-1 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Sem fidelidade obrigatória</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Garantia incondicional de 7 dias</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#EB6D57]" />
                <span>Suporte com nutricionista</span>
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: PREVIEW VISUAL DA PLATAFORMA */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200/90 space-y-5 animate-in zoom-in-95 duration-300">
              
              {/* Header do Card Mock */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#4C6C54] to-[#689373] text-white flex items-center justify-center font-bold text-xs">
                    PL
                  </div>
                  <div>
                    <strong className="text-xs font-extrabold text-slate-800 block">Pedro Lima (3 anos)</strong>
                    <span className="text-[10px] text-emerald-700 font-bold">12 novos alimentos aceitos</span>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Em Evolução
                </span>
              </div>

              {/* Régua das 5 Fases Sensoriais */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-700">
                  <span>Jornada Sensorial do Alimento</span>
                  <span className="text-[#4C6C54]">Fase 4: Provou!</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 text-center">
                  {[
                    { label: "Tolerou", done: true },
                    { label: "Cheirou", done: true },
                    { label: "Tocou", done: true },
                    { label: "Provou", done: true },
                    { label: "Comeu", done: false }
                  ].map((step, idx) => (
                    <div
                      key={idx}
                      className={`py-1.5 rounded-lg text-[9px] font-extrabold transition-all ${
                        step.done
                          ? "bg-[#4C6C54] text-white shadow-2xs"
                          : "bg-slate-200 text-slate-400"
                      }`}
                    >
                      {step.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Card de Anamnese Vinculada */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-[#F0EAE1]/50 rounded-2xl border border-emerald-200/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-[#4C6C54] text-white flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <strong className="text-xs font-bold text-slate-800 block">Anamnese Concluída</strong>
                    <span className="text-[10px] text-slate-500">56 parâmetros avaliados pela Dra. Laís</span>
                  </div>
                </div>
                <Check className="h-4 w-4 text-emerald-600" />
              </div>

              {/* Depoimento Rápido Integrado */}
              <div className="pt-2 text-xs text-slate-600 italic bg-amber-50/70 p-3 rounded-xl border border-amber-200/60 flex items-start gap-2">
                <span className="text-amber-500 font-serif text-lg leading-none">“</span>
                <span className="text-[11px] leading-relaxed">
                  Depois de meses de angústia nas refeições, em 3 semanas com o método o Pedro experimentou brócolis e cenoura pela primeira vez sem choro!
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. BANNER DE MÉTRICAS & AUTORIDADE (ESTILO MATE ACADEMY) */}
      {/* ===================================================================== */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            
            {/* CARD MÉTRICA 1 */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-[#4C6C54]/10 text-[#4C6C54] flex items-center justify-center shrink-0">
                <ClipboardCheckIcon className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  +56
                </span>
                <strong className="text-xs sm:text-sm font-extrabold text-slate-800 block">
                  Parâmetros Clínicos
                </strong>
                <p className="text-xs text-slate-500 leading-snug">
                  Mapeamento aprofundado na Anamnese pediátrica individualizada com a família.
                </p>
              </div>
            </div>

            {/* CARD MÉTRICA 2 */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-[#EB6D57]/10 text-[#EB6D57] flex items-center justify-center shrink-0">
                <Video className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  100%
                </span>
                <strong className="text-xs sm:text-sm font-extrabold text-slate-800 block">
                  Videoaulas Práticas (Panda Video)
                </strong>
                <p className="text-xs text-slate-500 leading-snug">
                  Aulas exclusivas com a Dra. Laís ensinando estratégias de aproximação sensorial.
                </p>
              </div>
            </div>

            {/* CARD MÉTRICA 3 */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  5 Níveis
                </span>
                <strong className="text-xs sm:text-sm font-extrabold text-slate-800 block">
                  Escala de Aceitação Sensorial
                </strong>
                <p className="text-xs text-slate-500 leading-snug">
                  Acompanhamento diário das fases: tolerou, cheirou, tocou, provou e comeu.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 4. METODOLOGIA & PILARES */}
      {/* ===================================================================== */}
      <section id="metodologia" className="py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#4C6C54]">
              Metodologia Validada
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Como funciona o acompanhamento no Nutrindo em Casa?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Um passo a passo respeitoso, sem brigas na mesa e com resultados cientificamente comprovados.
            </p>
          </div>

          <div id="pilares" className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Passo 1 */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4 relative">
              <span className="h-8 w-8 rounded-full bg-[#4C6C54] text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                1
              </span>
              <h3 className="text-base font-extrabold text-slate-900">
                Anamnese Clínica Profunda
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Você responde a um formulário clínico estruturado com 56 parâmetros pediátricos: histórico gestacional, introdução alimentar, preferências sensoriais e mapeamento exato dos grupos aceitos e recusados.
              </p>
            </div>

            {/* Passo 2 */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4 relative">
              <span className="h-8 w-8 rounded-full bg-[#EB6D57] text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                2
              </span>
              <h3 className="text-base font-extrabold text-slate-900">
                Aulas Práticas & Estratégias
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Acesso imediato às videoaulas gravadas pela Dra. Laís Leles. Você aprende a preparar o prato, como apresentar novos alimentos de forma não-invasiva e como desarmar a ansiedade na hora da refeição.
              </p>
            </div>

            {/* Passo 3 */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4 relative">
              <span className="h-8 w-8 rounded-full bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                3
              </span>
              <h3 className="text-base font-extrabold text-slate-900">
                Diário Sensorial & Devolutivas
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Registre as interações do dia a dia no nosso aplicativo. Acompanhe a evolução gradual nas 5 etapas de aproximação sensorial e receba devolutivas contínuas para ajustar a rota.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 5. SEÇÃO DE APRESENTAÇÃO DA DRA. LAÍS LELES */}
      {/* ===================================================================== */}
      <section id="sobre" className="py-14 sm:py-20 px-4 sm:px-6 bg-white/70 border-y border-slate-200/80">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-10 border border-slate-200 shadow-lg grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* AVATAR / APRESENTAÇÃO VISUAL */}
            <div className="lg:col-span-4 text-center space-y-3">
              <div className="relative h-44 w-44 sm:h-52 sm:w-52 rounded-3xl mx-auto overflow-hidden bg-gradient-to-tr from-[#4C6C54] to-[#7fa488] shadow-xl border-4 border-white flex items-center justify-center">
                <span className="text-5xl font-black text-white/90">
                  Dra.
                </span>
              </div>
              <div>
                <strong className="text-base sm:text-lg font-extrabold text-slate-900 block">
                  Dra. Laís Leles
                </strong>
                <span className="text-xs text-emerald-700 font-bold">
                  Nutricionista Clínica Pediátrica
                </span>
              </div>
            </div>

            {/* CREDENCIAIS E BIO */}
            <div className="lg:col-span-8 space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4C6C54]/10 text-[#4C6C54] text-xs font-extrabold uppercase tracking-wider">
                <Stethoscope className="h-3.5 w-3.5" />
                <span>Especialista em Dificuldades Alimentares Infantis</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                “A alimentação infantil não é apenas sobre nutrientes; é sobre afeto, acolhimento e desenvolvimento sensorial.”
              </h2>

              <p>
                A <strong>Dra. Laís Leles</strong> é referência no acolhimento de famílias que convivem com seletividade alimentar severa, recusa e sensibilidade sensorial. Sua abordagem integra evidências científicas de nutrição pediátrica com psicologia do comportamento infantil.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Centenas de famílias atendidas</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Método 100% livre de punições</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Suporte a crianças neurodivergentes</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Respeito ao ritmo e autonomia da criança</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 6. PROVA SOCIAL & DEPOIMENTOS DE FAMÍLIAS */}
      {/* ===================================================================== */}
      <section id="depoimentos" className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#4C6C54]">
              Histórias Reais de Sucesso
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              O que dizem as famílias que aplicam o método
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Conquistas diárias de quem substituiu o estresse na mesa por acolhimento e técnica.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {depoimentos.map((dep, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* ESTRELAS E ÍCONE DE CITAÇÃO */}
                  <div className="flex items-center justify-between">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <Quote className="h-5 w-5 text-slate-300" />
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                    “{dep.texto}”
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-full bg-gradient-to-tr ${dep.cor} text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs`}
                  >
                    {dep.foto}
                  </div>
                  <div>
                    <strong className="text-xs font-extrabold text-slate-900 block">
                      {dep.nome}
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      {dep.parentesco}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ===================================================================== */}
      {/* 7. PERGUNTAS FREQUENTES (FAQ COM ACCORDION) */}
      {/* ===================================================================== */}
      <section id="faq" className="py-14 sm:py-20 px-4 sm:px-6 bg-white/60 border-y border-slate-200/80">
        <div className="max-w-4xl mx-auto space-y-10">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#4C6C54]">
              Perguntas Frequentes
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Tire todas as suas dúvidas sobre o Nutrindo em Casa
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Transparência completa sobre o acompanhamento, acesso às aulas e garantia.
            </p>
          </div>

          <div className="space-y-3">
            {perguntasFrequentes.map((item, index) => {
              const aberto = faqAberto === index;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition-colors"
                  >
                    <span className="font-extrabold text-xs sm:text-sm text-slate-800">
                      {item.pergunta}
                    </span>
                    <div
                      className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 ${
                        aberto ? "rotate-180 bg-[#4C6C54] text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </button>

                  {aberto && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 animate-in fade-in duration-200">
                      {item.resposta}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ===================================================================== */}
      {/* 8. PREVIEW DOS PLANOS COM DEEP LINKING PARA O CHECKOUT */}
      {/* ===================================================================== */}
      <section id="planos" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#4C6C54]">
              Planos Transparentes
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
              Escolha o plano ideal para a sua família
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Pagamentos seguros processados pelo Asaas com liberação imediata.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            
            {/* PLANO MENSAL */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Plano Mensal</h3>
                  <p className="text-xs text-slate-500">Flexibilidade para testar mês a mês</p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-3xl font-black text-slate-900">R$ 97,00</span>
                  <span className="text-xs text-slate-500">/mês</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Cobrado mensalmente</span>
                </div>

                <ul className="space-y-2 text-xs text-slate-700 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Acesso total à plataforma</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Anamnese completa com 56 parâmetros</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Diário alimentar pediátrico</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Cancele a qualquer momento</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Link
                  href="/pagamento?plano=mensal"
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Escolher Plano Mensal</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* PLANO TRIMESTRAL (MAIS ESCOLHIDO) */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-[#4C6C54] shadow-xl ring-4 ring-[#4C6C54]/10 relative flex flex-col justify-between scale-[1.02] z-10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="px-3.5 py-1 rounded-full text-[11px] font-extrabold shadow-sm tracking-wide bg-[#4C6C54] text-white">
                  Mais Escolhido pelas Famílias
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Plano Trimestral</h3>
                  <p className="text-xs text-slate-500">Tempo ideal para consolidação das rotinas</p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">R$ 79,90</span>
                    <span className="text-xs text-slate-500">/mês</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-slate-500">R$ 239,70 por trimestre</span>
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                      Economize 18%
                    </span>
                  </div>
                </div>

                <ul className="space-y-2 text-xs text-slate-700 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Todos os benefícios do Mensal</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Acompanhamento estruturado das metas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Encontro de alinhamento com especialista</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Economia de 18% no ciclo</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Link
                  href="/pagamento?plano=trimestral"
                  className="w-full py-3 px-4 bg-[#4C6C54] hover:bg-[#3a5340] text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Escolher Plano Trimestral</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* PLANO ANUAL */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-[#EB6D57] block">
                    Melhor Custo-Benefício
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900">Plano Anual</h3>
                  <p className="text-xs text-slate-500">Transformação completa de 12 meses</p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">R$ 59,90</span>
                    <span className="text-xs text-slate-500">/mês</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-slate-500">R$ 718,80 ao ano (até 12x)</span>
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                      Economize 38%
                    </span>
                  </div>
                </div>

                <ul className="space-y-2 text-xs text-slate-700 pt-2 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Todos os benefícios do Trimestral</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Prioridade máxima nas devolutivas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Acesso ilimitado a novos cursos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Menor valor mensal garantido</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Link
                  href="/pagamento?plano=anual"
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Escolher Plano Anual</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 9. FOOTER INSTITUCIONAL */}
      {/* ===================================================================== */}
      <footer className="bg-white border-t border-slate-200/90 pt-12 pb-8 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-slate-100">
            <div className="space-y-2">
              <div className="relative h-10 w-36">
                <Image
                  src="/logo-transparente.png"
                  alt="Nutrindo em Casa"
                  fill
                  className="object-contain object-left"
                />
              </div>
              <p className="text-[11px] text-slate-500 max-w-sm">
                Plataforma de acompanhamento e terapia alimentar infantil fundada pela Dra. Laís Leles.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-slate-600">
              <Link href="/login" className="hover:text-[#4C6C54] transition-colors">
                Área do Aluno (Login)
              </Link>
              <Link href="/pagamento?plano=trimestral" className="hover:text-[#4C6C54] transition-colors">
                Assinar Plano
              </Link>
              <a href="#metodologia" className="hover:text-[#4C6C54] transition-colors">
                Metodologia
              </a>
              <a href="#faq" className="hover:text-[#4C6C54] transition-colors">
                Dúvidas Frequentes
              </a>
              <Link href="/configuracoes?aba=seguranca" className="hover:text-[#4C6C54] transition-colors">
                Privacidade & LGPD
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Ambiente Seguro com tecnologia Asaas e Panda Video. Proteção integral de dados LGPD.</span>
            </div>
            <span>© {new Date().getFullYear()} Nutrindo em Casa. Todos os direitos reservados.</span>
          </div>

        </div>
      </footer>

      {/* ===================================================================== */}
      {/* 10. BOTÃO FLUTUANTE DE DÚVIDAS VIA WHATSAPP */}
      {/* ===================================================================== */}
      <div className="fixed bottom-6 right-6 z-40">
        <a
          href="https://wa.me/5511988887777?text=Ol%C3%A1!%20Gostaria%20de%20tirar%20d%C3%BAvidas%20sobre%20o%20m%C3%A9todo%20do%20Nutrindo%20em%20Casa"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white p-3 sm:px-4 sm:py-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 border border-emerald-400/40"
          title="Fale com a nossa equipe via WhatsApp"
        >
          {/* ÍCONE COM BADGE PULSANTE */}
          <div className="relative flex items-center justify-center">
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
            </span>
            <MessageCircle className="h-5 w-5 fill-white/20 stroke-white" />
          </div>

          <div className="hidden sm:block text-left pr-1">
            <span className="text-[10px] font-bold text-emerald-100 block uppercase leading-none">
              Dúvidas sobre o método?
            </span>
            <span className="text-xs font-extrabold leading-tight block">
              Fale com a equipe
            </span>
          </div>
        </a>
      </div>

    </div>
  );
}

// Ícone auxiliar de prancheta
function ClipboardCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <path d="m9 14 2 2 4-4"/>
    </svg>
  );
}