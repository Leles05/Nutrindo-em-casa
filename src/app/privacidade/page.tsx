import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Shield, Lock, FileText, CheckCircle2, HeartHandshake, UserCheck } from "lucide-react";

export const metadata = {
  title: "Política de Privacidade • Nutrindo em Casa",
  description: "Política de Privacidade e Tratamento de Dados Pessoais e Pediátricos (LGPD) da plataforma Nutrindo em Casa e Dra. Laís Leles (CRN-8 18878).",
};

export default function PaginaPrivacidade() {
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
            <Shield className="h-3.5 w-3.5" />
            <span>Conformidade com a LGPD (Lei nº 13.709/2018)</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#3D5A45] tracking-tight">
            Política de Privacidade & Proteção de Dados Clínicos
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            A sua privacidade e a segurança dos dados do seu filho são prioridades inegociáveis para a plataforma <strong>Nutrindo em Casa</strong> e para a nutricionista responsável técnica, <strong>Dra. Laís Leles (CRN-8 18878)</strong>. Este documento esclarece de forma transparente como coletamos, utilizamos, armazenamos e protegemos as informações fornecidas pelas famílias.
          </p>

          <p className="text-[11px] text-slate-400">
            Última atualização: Outubro de 2026 • Versão 2.4
          </p>
        </div>

        {/* SEÇÕES EM CARDS ESTRUTURADOS */}
        <div className="space-y-6">

          {/* SEÇÃO 1 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <UserCheck className="h-5 w-5 text-[#4C6C54]" />
              <span>1. Dados Pessoais Coletados e Finalidade</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Para viabilizar o plano terapêutico alimentar e o acompanhamento nutricional personalizado, coletamos os seguintes tipos de dados:
            </p>
            <ul className="text-xs sm:text-sm text-slate-600 space-y-2 list-disc pl-5 leading-relaxed">
              <li>
                <strong>Dados dos Responsáveis:</strong> Nome completo, e-mail, telefone/WhatsApp, CPF (exigido para emissão de recibos e faturas legais) e dados de cobrança processados via gateway criptografado.
              </li>
              <li>
                <strong>Dados Pediátricos Sensíveis da Criança:</strong> Nome da criança, idade, data de nascimento, histórico alimentar, anamnese clínica de 56 parâmetros (rotina de mastigação, tolerâncias texturais, aversões sensoriais, seletividade alimentar) e registros diários de refeições.
              </li>
              <li>
                <strong>Dados de Login Social (Google):</strong> Ao optar pelo login com Google, coletamos apenas seu e-mail e nome público para autenticação segura, sem acesso a contatos, arquivos do Google Drive ou dados privados não autorizados.
              </li>
            </ul>
          </div>

          {/* SEÇÃO 2 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <HeartHandshake className="h-5 w-5 text-[#4C6C54]" />
              <span>2. Tratamento de Dados de Crianças e Consentimento (Art. 14 da LGPD)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              O tratamento de dados pessoais de crianças e adolescentes é realizado estritamente no seu melhor interesse e mediante o consentimento específico e em destaque dado por pelo menos um dos pais ou pelo responsável legal no momento do cadastro e preenchimento da Anamnese.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Os dados clínicos e alimentares são utilizados exclusivamente pela <strong>Dra. Laís Leles</strong> e sua equipe autorizada para elaboração de condutas alimentares, devolutivas semanais, prescrição do método do Prato Seguro e orientações em consultas online pelo Google Meet.
            </p>
          </div>

          {/* SEÇÃO 3 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <Lock className="h-5 w-5 text-[#4C6C54]" />
              <span>3. Sigilo Profissional e Segurança da Informação</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Todas as informações fornecidas estão protegidas pelo <strong>Sigilo Profissional do Nutricionista</strong>, em total conformidade com o Código de Ética do Conselho Federal de Nutricionistas (CFN) e do CRN-8.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Utilizamos tecnologias de ponta em segurança da informação:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-700">Criptografia em trânsito (HTTPS / TLS 1.3) e em repouso nos bancos de dados PostgreSQL.</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-700">Políticas de Row Level Security (RLS), garantindo que apenas a família e a nutricionista acessem o prontuário.</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-700">Processamento de pagamentos 100% em conformidade com o padrão PCI-DSS via gateway Asaas.</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-700">Proibição total de venda, repasse ou compartilhamento de dados com redes de publicidade.</span>
              </div>
            </div>
          </div>

          {/* SEÇÃO 4 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <FileText className="h-5 w-5 text-[#4C6C54]" />
              <span>4. Direitos do Titular (Pais e Responsáveis)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Em cumprimento ao Artigo 18 da LGPD, o responsável legal tem o direito de, a qualquer momento:
            </p>
            <ul className="text-xs sm:text-sm text-slate-600 space-y-1.5 list-disc pl-5 leading-relaxed">
              <li>Confirmar a existência de tratamento e acessar os dados clínicos do prontuário;</li>
              <li>Solicitar a correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>Revisar as respostas da Anamnese através do modo de visualização na plataforma;</li>
              <li>Solicitar a eliminação dos dados tratados com consentimento, ressalvadas as obrigações legais de guarda de prontuário médico/nutricional (Resolução CFN);</li>
              <li>Revogar o consentimento ou encerrar a assinatura.</li>
            </ul>
          </div>

          {/* SEÇÃO 5 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <Shield className="h-5 w-5 text-[#4C6C54]" />
              <span>5. Canal de Atendimento e Encarregado de Dados (DPO)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Caso tenha dúvidas sobre esta política, deseje atualizar suas informações ou exercer qualquer direito relativo aos seus dados, entre em contato diretamente pelo canal oficial:
            </p>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs sm:text-sm text-slate-700 space-y-1">
              <p><strong>Encarregada de Proteção de Dados:</strong> Dra. Laís Leles (CRN-8 18878)</p>
              <p><strong>E-mail Direto:</strong> metodonutrindoemcasa@gmail.com</p>
              <p><strong>Suporte ao Aluno:</strong> contato@nutrindoemcasa.com.br</p>
              <p><strong>Localidade:</strong> Curitiba / PR — Atendimento Online em todo o Brasil</p>
            </div>
          </div>

        </div>

      </main>

      {/* RODAPÉ */}
      <footer className="w-full bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Nutrindo em Casa • Dra. Laís Leles • CRN-8 18878</p>
          <div className="flex items-center gap-4">
            <Link href="/termos" className="hover:text-slate-800 transition-colors">Termos de Uso</Link>
            <span>•</span>
            <Link href="/" className="hover:text-slate-800 transition-colors">Página Inicial</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
