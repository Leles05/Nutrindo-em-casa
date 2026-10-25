import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, FileText, CheckCircle2, ShieldCheck, Clock, Calendar, RefreshCw } from "lucide-react";

export const metadata = {
  title: "Termos de Uso • Nutrindo em Casa",
  description: "Termos de Uso, Contrato de Prestação de Serviços Nutricionais Pediátricos e Garantia de 7 Dias da plataforma Nutrindo em Casa.",
};

export default function PaginaTermosDeUso() {
  return (
    <div className="min-h-screen bg-[#F0EAE1] text-slate-800 font-sans flex flex-col justify-between selection:bg-[#4C6C54]/20">
      {/* CABEÇALHO */}
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>← Voltar ao Início</span>
          </Link>

          <Link href="/" className="relative h-9 w-28 block">
            <Image
              src="/logo-transparente.png"
              alt="Nutrindo em Casa"
              fill
              className="object-contain"
              priority
            />
          </Link>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 w-full space-y-8">
        
        {/* TÍTULO E INTRODUÇÃO */}
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#4C6C54]/10 text-[#4C6C54] border border-[#4C6C54]/20">
            <FileText className="h-3.5 w-3.5" />
            <span>Contrato de Adesão & Termos de Serviço</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#3D5A45] tracking-tight">
            Termos de Uso da Plataforma Nutrindo em Casa
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Bem-vindo(a) ao <strong>Nutrindo em Casa</strong>. Ao assinar nossos planos ou utilizar os serviços da plataforma, você concorda plenamente com os termos e condições descritos abaixo, estabelecidos em conformidade com o Código de Defesa do Consumidor (Lei nº 8.078/1990) e o Código de Ética do Nutricionista (CRN-8 18878).
          </p>

          <p className="text-[11px] text-slate-400">
            Última atualização: Outubro de 2026 • Versão 2.4
          </p>
        </div>

        {/* SEÇÕES EM CARDS */}
        <div className="space-y-6">

          {/* SEÇÃO 1 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-[#4C6C54]" />
              <span>1. Objeto e Natureza do Serviço</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              O <strong>Nutrindo em Casa</strong> é uma plataforma integrada de apoio, consultoria e intervenção nutricional pediátrica voltada ao manejo da <strong>seletividade alimentar na infância</strong>, conduzida sob responsabilidade técnica da <strong>Dra. Laís Leles (CRN-8 18878)</strong>.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Os serviços incluem:
            </p>
            <ul className="text-xs sm:text-sm text-slate-600 space-y-1.5 list-disc pl-5 leading-relaxed">
              <li>Anamnese clínica digital com avaliação de 56 parâmetros comportamentais e sensoriais;</li>
              <li>Consultas online individuais de acolhimento e retorno com a Dra. Laís Leles via Google Meet;</li>
              <li>Acesso ao Diário da Escada do Comer com registro de reações sensoriais;</li>
              <li>Devolutivas clínicas semanais personalizadas com orientações e metas alimentares práticas;</li>
              <li>Acesso ao módulo de Prato Seguro, receitas sensoriais e videoaulas educativas.</li>
            </ul>
          </div>

          {/* SEÇÃO 2: GARANTIA DE 7 DIAS */}
          <div className="bg-emerald-50/70 p-6 sm:p-8 rounded-3xl border border-emerald-200 shadow-2xs space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Garantia Legal e Incondicional</span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-emerald-950">
              2. Garantia de 7 Dias com Devolução de 100% do Valor
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Em respeito ao Artigo 49 do Código de Defesa do Consumidor e ao compromisso de confiança com a família, oferecemos <strong>7 dias de garantia incondicional</strong> a partir da data de confirmação do pagamento.
            </p>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Se dentro desse prazo você avaliar que o método não atende às necessidades da sua família, basta solicitar o reembolso através do e-mail <strong>contato@nutrindoemcasa.com.br</strong> ou pelo suporte no painel. O estorno será realizado de forma integral, sem burocracia ou retenção de valores.
            </p>
          </div>

          {/* SEÇÃO 3: PLANOS E RENOVAÇÃO */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <RefreshCw className="h-5 w-5 text-[#4C6C54]" />
              <span>3. Planos de Assinatura, Cobrança e Renovação</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              A plataforma disponibiliza três modalidades de adesão:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-xs font-bold text-slate-800 block">Plano Mensal</span>
                <p className="text-[11px] text-slate-500">Cobrança recorrente a cada 30 dias. 1 consulta de acolhimento inclusa e acompanhamento semanal contínuo na plataforma.</p>
              </div>
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-1">
                <span className="text-xs font-bold text-emerald-900 block">Plano Trimestral (Mais Escolhido)</span>
                <p className="text-[11px] text-slate-600">Ciclo estruturado de 90 dias com consultas e retornos a cada 45 dias (6 semanas), check-ins e devolutivas semanais.</p>
              </div>
              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-1">
                <span className="text-xs font-bold text-amber-950 block">Plano Anual VIP</span>
                <p className="text-[11px] text-slate-600">Acompanhamento contínuo por 12 meses com consultas mensais de acolhimento, mentorias em grupo e suporte prioritário.</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed pt-2">
              As assinaturas são renovadas automaticamente ao final do ciclo contratado para garantir a continuidade ininterrupta do acompanhamento, salvo manifestação prévia de cancelamento.
            </p>
          </div>

          {/* SEÇÃO 4: CONSULTAS E AGENDAMENTOS */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <Calendar className="h-5 w-5 text-[#4C6C54]" />
              <span>4. Política de Consultas Online e Reagendamento</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              As consultas são realizadas por videoconferência via <strong>Google Meet</strong> com duração média de 50 a 60 minutos:
            </p>
            <ul className="text-xs sm:text-sm text-slate-600 space-y-1.5 list-disc pl-5 leading-relaxed">
              <li>
                <strong>Antecedência de Agendamento:</strong> O agendamento da 1ª consulta fica disponível imediatamente após o envio da Anamnese.
              </li>
              <li>
                <strong>Remarcação sem Custo:</strong> A família pode reagendar seu horário com antecedência mínima de <strong>24 horas</strong> diretamente pelo calendário da plataforma ou pelo suporte.
              </li>
              <li>
                <strong>Tolerância e Presença:</strong> Há tolerância máxima de 15 minutos de atraso para início da sessão. É indispensável a participação de pelo menos um dos responsáveis legais pela alimentação da criança.
              </li>
            </ul>
          </div>

          {/* SEÇÃO 5: RESPONSABILIDADE E SEGURANÇA */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <Clock className="h-5 w-5 text-[#4C6C54]" />
              <span>5. Cancelamento Fácil e Sem Multa</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Você pode cancelar a renovação automática da sua assinatura a qualquer momento, sem cobrança de taxas de rescisão ou multas contratuais:
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              O cancelamento pode ser efetuado na aba <em>Configurações &gt; Faturas</em> no painel do usuário ou enviando uma mensagem para <strong>contato@nutrindoemcasa.com.br</strong>. O acesso aos recursos permanecerá ativo até o último dia do período já faturado.
            </p>
          </div>

          {/* SEÇÃO 6: LIMITAÇÕES CLÍNICAS */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <FileText className="h-5 w-5 text-[#4C6C54]" />
              <span>6. Orientações Médicas e Emergências</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              O trabalho realizado pela <strong>Nutrindo em Casa</strong> é de natureza nutricional, comportamental e terapêutica alimentar. O método não substitui o acompanhamento do médico pediatra, exames laboratoriais periódicos ou tratamentos de emergência pediátrica (anafilaxias, desidratações agudas ou aspirações respiratórias), devendo os responsáveis buscar assistência médica imediata nesses casos.
            </p>
          </div>

        </div>

      </main>

      {/* RODAPÉ */}
      <footer className="w-full bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Nutrindo em Casa • Dra. Laís Leles • CRN-8 18878</p>
          <div className="flex items-center gap-4">
            <Link href="/privacidade" className="hover:text-slate-800 transition-colors">Política de Privacidade</Link>
            <span>•</span>
            <Link href="/" className="hover:text-slate-800 transition-colors">Página Inicial</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
