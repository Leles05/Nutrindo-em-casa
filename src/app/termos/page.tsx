import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, FileText, CheckCircle2 } from "lucide-react";
import { TERMOS_DATA, TERMOS_VERSAO } from "@/lib/termos";

export const metadata = {
  title: "Termos de Uso • Nutrindo em Casa",
  description:
    "Termos de Uso, condições de assinatura, pagamento, renovação automática, garantia de 7 dias e tratamento de dados da plataforma Nutrindo em Casa.",
};

interface Secao {
  titulo: string;
  destaque?: boolean;
  paragrafos?: string[];
  itens?: string[];
  rodape?: string;
}

/**
 * ATENÇÃO: ao alterar qualquer texto abaixo, suba TERMOS_VERSAO em src/lib/termos.ts.
 * Assim todos os clientes voltam a ver a janela de aceite no próximo acesso.
 */
const SECOES: Secao[] = [
  {
    titulo: "1. Objeto e natureza do serviço",
    paragrafos: [
      "O Nutrindo em Casa é uma plataforma de apoio e acompanhamento nutricional pediátrico voltada ao manejo da seletividade alimentar na infância, conduzida sob responsabilidade técnica da nutricionista Dra. Laís Leles (CRN-8 18878).",
      "Os serviços incluem, conforme o plano contratado:",
    ],
    itens: [
      "Anamnese clínica digital com avaliação de 56 parâmetros comportamentais e sensoriais;",
      "Consultas online individuais de acolhimento e retorno com a Dra. Laís Leles;",
      "Diário da Escada do Comer, devolutivas clínicas semanais e metas alimentares personalizadas;",
      "Módulo de Prato Seguro, receitas sensoriais, videoaulas e materiais educativos.",
    ],
  },
  {
    titulo: "2. Cadastro, conta e responsável legal",
    paragrafos: [
      "A plataforma é destinada a pais, mães ou responsáveis legais maiores de 18 anos, que contratam o serviço em benefício de uma criança sob sua guarda.",
    ],
    itens: [
      "Você declara que as informações fornecidas (inclusive as respostas da anamnese) são verdadeiras, completas e atualizadas. Elas orientam a conduta nutricional e informações incorretas podem comprometer o acompanhamento;",
      "O acesso é pessoal e intransferível. A senha é de sua responsabilidade e não deve ser compartilhada. Comunique-nos imediatamente se suspeitar de uso indevido da sua conta;",
      "Cada assinatura atende a uma família. O acesso por login com Google segue as mesmas regras.",
    ],
  },
  {
    titulo: "3. Planos, preços e formas de pagamento",
    paragrafos: [
      "Há três planos: Mensal (ciclo de 1 mês), Trimestral (3 meses) e Anual (12 meses). Os preços vigentes, em reais, são exibidos no momento da contratação e prevalecem sobre qualquer valor divulgado anteriormente.",
    ],
    itens: [
      "Pix: pagamento à vista. A cobrança do ciclo seguinte é gerada automaticamente e enviada ao seu e-mail;",
      "Cartão de crédito: à vista ou parcelado sem juros, nas quantidades de parcelas oferecidas para cada plano. No parcelamento, o valor total da compra é aprovado de uma só vez no limite do cartão e dividido na fatura conforme as regras da sua operadora;",
      "Cupons de desconto são pessoais, têm validade e limite de uso, não são acumulativos e valem apenas para a compra em que foram aplicados. As renovações seguem o preço de tabela vigente do plano;",
      "Os pagamentos são processados pelo Asaas, instituição de pagamento. O Nutrindo em Casa não armazena o número completo nem o código de segurança (CVV) do seu cartão; guardamos apenas um identificador seguro (token) fornecido pelo processador, usado exclusivamente para a renovação da sua assinatura.",
    ],
  },
  {
    titulo: "4. Renovação automática",
    destaque: true,
    paragrafos: [
      "Ao final de cada ciclo, a assinatura é renovada automaticamente, pelo mesmo plano e pelo preço de tabela então vigente, para garantir a continuidade do acompanhamento.",
    ],
    itens: [
      "Cartão de crédito: a nova cobrança é feita no mesmo cartão usado na contratação, parcelada na mesma quantidade de parcelas escolhida originalmente. Enviamos um aviso por e-mail 7 dias antes da renovação;",
      "Pix: o Asaas gera a cobrança do novo ciclo e a envia ao seu e-mail, para pagamento até o vencimento;",
      "Se a cobrança no cartão não for aprovada, tentamos novamente nos dias seguintes (até 3 tentativas) e avisamos por e-mail. Sem sucesso, o acesso é suspenso até a regularização, que pode ser feita com uma nova assinatura;",
      "Alterações de preço serão comunicadas por e-mail com antecedência mínima de 30 dias da renovação, e você poderá cancelar antes de ser cobrado(a).",
    ],
  },
  {
    titulo: "5. Garantia de 7 dias com devolução integral",
    destaque: true,
    paragrafos: [
      "Em respeito ao art. 49 do Código de Defesa do Consumidor, você tem 7 dias a partir da confirmação do pagamento para desistir da contratação, com devolução de 100% do valor pago, sem burocracia.",
      "Para solicitar, escreva para contato@nutrindoemcasa.com.br ou use o suporte da plataforma. O estorno é feito pelo mesmo meio de pagamento; o prazo para o valor aparecer na fatura ou na conta depende da operadora do cartão ou do banco.",
    ],
  },
  {
    titulo: "6. Cancelamento e mudança de plano",
    paragrafos: [
      "Você pode cancelar a renovação automática a qualquer momento, sem multa ou taxa de rescisão, em Configurações > Assinatura, ou pelo e-mail contato@nutrindoemcasa.com.br. O acesso continua até o último dia do período já pago.",
    ],
    itens: [
      "O cancelamento interrompe as renovações futuras. Valores já pagos, inclusive parcelas que ainda constem na fatura do seu cartão, não são devolvidos fora do prazo de garantia de 7 dias, pois o ciclo contratado permanece disponível até o fim;",
      "Upgrade do Plano Trimestral para o Anual: o crédito concedido é o informado na tela de contratação, e a nova assinatura substitui a anterior, evitando cobrança em duplicidade.",
    ],
  },
  {
    titulo: "7. Consultas online e reagendamento",
    paragrafos: [
      "As consultas são realizadas por videoconferência (Google Meet), com duração média de 50 a 60 minutos.",
    ],
    itens: [
      "O agendamento da 1ª consulta fica disponível após o envio da anamnese, e as consultas de retorno seguem o intervalo previsto no seu plano;",
      "Os horários mostrados na plataforma acompanham a agenda da Dra. Laís. Ao marcar, você recebe um convite do Google Agenda, com o link da sala do Google Meet, no e-mail da sua conta;",
      "É possível reagendar sem custo, com antecedência mínima de 24 horas, solicitando pelo e-mail contato@nutrindoemcasa.com.br;",
      "Há tolerância de 15 minutos de atraso. É indispensável a participação de ao menos um dos responsáveis pela alimentação da criança.",
    ],
  },
  {
    titulo: "8. Natureza do serviço e limitações clínicas",
    paragrafos: [
      "O trabalho é de natureza nutricional, comportamental e de terapia alimentar. Os resultados dependem da adesão da família às orientações e variam de criança para criança; não há garantia de resultado clínico específico.",
      "O serviço não substitui o acompanhamento do médico pediatra, exames periódicos ou o atendimento de emergência (como reações alérgicas graves, desidratação ou engasgo). Nesses casos, procure assistência médica imediata.",
    ],
  },
  {
    titulo: "9. Dados pessoais, dados de saúde e sigilo",
    paragrafos: [
      "O tratamento dos seus dados e dos dados da criança segue a Lei Geral de Proteção de Dados (Lei nº 13.709/2018) e a nossa Política de Privacidade. Dados de saúde e alimentares de crianças são dados sensíveis e só são tratados com o consentimento específico e em destaque de pelo menos um dos pais ou do responsável legal, que você registra ao aceitar estes termos e pode revogar a qualquer momento.",
      "As informações são protegidas pelo sigilo profissional do nutricionista e usadas apenas pela Dra. Laís Leles e por equipe autorizada, para o acompanhamento nutricional. Não vendemos nem compartilhamos dados para publicidade. Prestadores de serviço (pagamentos, hospedagem, e-mail e agenda) tratam dados em nosso nome, sob contrato e para as finalidades descritas na Política de Privacidade.",
      "Guardamos o registro do seu aceite (versão dos termos, data, horário, endereço IP e navegador) como comprovação do consentimento.",
    ],
  },
  {
    titulo: "10. Conteúdo e propriedade intelectual",
    paragrafos: [
      "Videoaulas, materiais, receitas, devolutivas e demais conteúdos da plataforma são protegidos por direitos autorais. Concedemos a você uma licença pessoal, limitada, revogável e intransferível para uso familiar durante a vigência da assinatura.",
      "É proibido copiar, gravar, divulgar, redistribuir ou revender os conteúdos, bem como compartilhar o acesso com outras famílias.",
    ],
  },
  {
    titulo: "11. Uso adequado e suspensão",
    paragrafos: [
      "Não é permitido fraudar pagamentos, usar dados de terceiros sem autorização, tentar burlar a segurança da plataforma ou utilizá-la para fins ilícitos. O descumprimento pode levar à suspensão ou ao encerramento do acesso, com aviso ao responsável sempre que possível.",
    ],
  },
  {
    titulo: "12. Disponibilidade e responsabilidade",
    paragrafos: [
      "Empregamos esforços razoáveis para manter a plataforma disponível, mas podem ocorrer interrupções para manutenção ou por falhas de terceiros (internet, provedores de infraestrutura). Nada nestes termos limita os direitos que a lei garante ao consumidor.",
    ],
  },
  {
    titulo: "13. Alterações destes termos",
    paragrafos: [
      "Podemos atualizar estes termos. Sempre que houver uma nova versão, ela será apresentada no seu próximo acesso e será necessário um novo aceite para continuar usando a plataforma. As versões aceitas ficam registradas.",
    ],
  },
  {
    titulo: "14. Lei aplicável e foro",
    paragrafos: [
      "Estes termos são regidos pelas leis brasileiras, em especial o Código de Defesa do Consumidor (Lei nº 8.078/1990) e a LGPD. Fica eleito o foro do domicílio do consumidor para dirimir eventuais controvérsias.",
    ],
  },
  {
    titulo: "15. Contato",
    paragrafos: [
      "Fornecedor do serviço: LAIS VIEIRA DE LIMA LELES LTDA (nome fantasia: Nutricionista Laís Leles), CNPJ 65.024.114/0001-17, com sede na Rua Dom Pedro I, nº 1013, apto 401, Cond. Green Valley, bairro Água Verde, Curitiba/PR, CEP 80620-130.",
      "Dúvidas, solicitações de cancelamento, reembolso ou exercício de direitos sobre dados: contato@nutrindoemcasa.com.br. Responsável técnica e encarregada de dados: Dra. Laís Leles (CRN-8 18878). Atendimento online para todo o Brasil.",
    ],
  },
];

export default function PaginaTermosDeUso() {
  return (
    <div className="min-h-screen bg-[#F0EAE1] text-slate-800 font-sans flex flex-col justify-between selection:bg-[#4C6C54]/20">
      <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao Início</span>
          </Link>
          <Link href="/" className="relative h-9 w-28 block">
            <Image src="/logo-transparente.png" alt="Nutrindo em Casa" fill sizes="112px" className="object-contain" priority />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 w-full space-y-8">
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#4C6C54]/10 text-[#4C6C54] border border-[#4C6C54]/20">
            <FileText className="h-3.5 w-3.5" />
            <span>Contrato de Adesão & Termos de Serviço</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#3D5A45] tracking-tight">Termos de Uso da Plataforma Nutrindo em Casa</h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Ao contratar um plano ou usar a plataforma, você concorda com os termos abaixo, elaborados em conformidade com o Código de Defesa do
            Consumidor (Lei nº 8.078/1990), a Lei Geral de Proteção de Dados (Lei nº 13.709/2018) e o Código de Ética do Nutricionista.
          </p>
          <p className="text-[11px] text-slate-400">
            Última atualização: {TERMOS_DATA} • Versão {TERMOS_VERSAO}
          </p>
        </div>

        <div className="space-y-6">
          {SECOES.map((s) => (
            <section
              key={s.titulo}
              className={`p-6 sm:p-8 rounded-3xl border shadow-2xs space-y-3 ${
                s.destaque ? "bg-emerald-50/70 border-emerald-200" : "bg-white border-slate-200/80"
              }`}
            >
              <h2 className={`text-base sm:text-lg font-bold flex items-center gap-2.5 ${s.destaque ? "text-emerald-950" : "text-slate-900"}`}>
                {s.destaque && <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" />}
                <span>{s.titulo}</span>
              </h2>
              {s.paragrafos?.map((p, i) => (
                <p key={i} className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {p}
                </p>
              ))}
              {s.itens && (
                <ul className="text-xs sm:text-sm text-slate-600 space-y-1.5 list-disc pl-5 leading-relaxed">
                  {s.itens.map((it, i) => (
                    <li key={i}>{it}</li>
                  ))}
                </ul>
              )}
              {s.rodape && <p className="text-xs text-slate-500 leading-relaxed pt-1">{s.rodape}</p>}
            </section>
          ))}
        </div>
      </main>

      <footer className="w-full bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Nutrindo em Casa • Dra. Laís Leles • CRN-8 18878</p>
          <div className="flex items-center gap-4">
            <Link href="/privacidade" className="hover:text-slate-800 transition-colors">
              Política de Privacidade
            </Link>
            <span>•</span>
            <Link href="/" className="hover:text-slate-800 transition-colors">
              Página Inicial
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
