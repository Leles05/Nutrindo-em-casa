/**
 * Gerador de Documentos Clínicos e PDFs Timbrados da Nutricionista
 * Plataforma Nutrindo em Casa • Dra. Laís Leles (CRN-8 18878)
 */

export interface MetaDocumento {
  id?: string;
  texto: string;
  concluida?: boolean;
}

export interface RefeicaoDocumento {
  nome: string;
  horario?: string;
  seguro?: string;
  parecido?: string;
  exposicao?: string;
}

export interface ReceitaDocumento {
  id?: string;
  titulo: string;
  descricao?: string;
  textura?: string;
  tempoPreparo?: string;
  rendimento?: string;
  ingredientes: string[];
  modoPreparo: string[];
  estrategiaSensorial?: string;
}

export interface DadosDocumentoTimbrado {
  tipo: "devolutiva" | "plano";
  paciente?: string;
  email?: string;
  crianca?: string;
  idadeCrianca?: string;
  data?: string;
  semanaRef?: string;
  // Campos específicos da Devolutiva
  devolutiva?: {
    titulo?: string;
    parecerClinico?: string;
    alimentosAlvo?: string[];
    metas?: MetaDocumento[];
  };
  // Campos específicos do Plano Alimentar & Prato Seguro
  orientacaoPrato?: string;
  composicaoPrato?: {
    conforto: number;
    ponte: number;
    desafio: number;
  };
  refeicoes?: RefeicaoDocumento[];
  receitas?: ReceitaDocumento[];
}

export function gerarHtmlDocumentoTimbrado(dados: DadosDocumentoTimbrado): string {
  const dataHoje = dados.data || new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const nomeResponsavel = dados.paciente || "Responsável";
  const nomeCrianca = dados.crianca || "Pedro Lima";
  const idade = dados.idadeCrianca || "3 anos";
  const ehDevolutiva = dados.tipo === "devolutiva";

  const conteudoDevolutiva = dados.devolutiva || {};
  const metas = conteudoDevolutiva.metas || [];
  const alimentosAlvo = conteudoDevolutiva.alimentosAlvo || [];

  const composicao = dados.composicaoPrato || { conforto: 70, ponte: 20, desafio: 10 };

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${ehDevolutiva ? "Devolutiva Semanal" : "Plano Alimentar"} • Nutrindo em Casa</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 15mm 20mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.5;
      margin: 0;
      padding: 20px;
      font-size: 13px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #3D5A45;
      padding-bottom: 14px;
      margin-bottom: 20px;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: #3D5A45;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #64748b;
      margin: 2px 0 0 0;
    }
    .nutri-info {
      text-align: right;
    }
    .nutri-name {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }
    .nutri-crn {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      color: #3D5A45;
      background: #E8F5E9;
      border: 1px solid #c8e6c9;
      padding: 2px 8px;
      border-radius: 9999px;
      margin-top: 3px;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
      font-size: 12px;
    }
    .meta-item strong {
      color: #475569;
    }
    .doc-title-wrapper {
      margin-bottom: 18px;
    }
    .doc-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #3D5A45;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 3px 10px;
      border-radius: 6px;
      margin-bottom: 6px;
    }
    .doc-title {
      font-size: 17px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: #3D5A45;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 22px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .card-parecer {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      border-radius: 8px;
      padding: 14px 16px;
      font-size: 13px;
      line-height: 1.6;
      color: #78350f;
      white-space: pre-wrap;
    }
    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }
    .tag {
      background: #f1f5f9;
      color: #334155;
      font-weight: 600;
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
    }
    .metas-list {
      margin: 8px 0 0 0;
      padding: 0;
      list-style: none;
    }
    .meta-li {
      padding: 8px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 6px;
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 12px;
    }
    .checkbox-box {
      width: 14px;
      height: 14px;
      border: 1.5px solid #64748b;
      border-radius: 3px;
      margin-top: 2px;
      flex-shrink: 0;
    }
    .prato-seguro-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 10px;
      margin: 12px 0;
    }
    .prato-col {
      padding: 12px;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
    }
    .prato-conforto {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }
    .prato-ponte {
      background: #fffbeb;
      border-color: #fde68a;
    }
    .prato-desafio {
      background: #fdf2f8;
      border-color: #fbcfe8;
    }
    .prato-col-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .prato-conforto .prato-col-title { color: #166534; }
    .prato-ponte .prato-col-title { color: #854d0e; }
    .prato-desafio .prato-col-title { color: #9d174d; }
    .prato-col-desc {
      font-size: 11px;
      color: #475569;
      line-height: 1.4;
    }
    .refeicao-item {
      padding: 10px 14px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 8px;
      page-break-inside: avoid;
    }
    .refeicao-header {
      font-weight: 700;
      font-size: 12px;
      color: #1e293b;
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .refeicao-detalhes {
      font-size: 11px;
      color: #475569;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .receita-card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 12px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .receita-title {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 4px 0;
    }
    .receita-meta {
      font-size: 10px;
      color: #64748b;
      margin-bottom: 8px;
    }
    .receita-ingredientes {
      font-size: 11px;
      margin: 6px 0;
      padding-left: 18px;
    }
    .receita-modo {
      font-size: 11px;
      margin: 6px 0;
      padding-left: 18px;
      color: #334155;
    }
    .estrategia-box {
      background: #f0fdf4;
      border-left: 3px solid #22c55e;
      padding: 6px 10px;
      font-size: 11px;
      color: #14532d;
      margin-top: 6px;
      border-radius: 4px;
    }
    .footer {
      margin-top: 35px;
      padding-top: 14px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 10px;
      color: #64748b;
      page-break-inside: avoid;
    }
    .assinatura-area {
      text-align: right;
    }
    .assinatura-linha {
      width: 180px;
      border-top: 1px solid #475569;
      margin-left: auto;
      margin-bottom: 4px;
    }
    .assinatura-nome {
      font-weight: 700;
      color: #1e293b;
    }
  </style>
</head>
<body>
  <!-- CABEÇALHO OFICIAL TIMBRADO -->
  <div class="header">
    <div>
      <h1 class="brand-title">Nutrindo em Casa</h1>
      <p class="brand-subtitle">Clínica & Consultoria de Nutrição Pediátrica Integrada</p>
    </div>
    <div class="nutri-info">
      <p class="nutri-name">Dra. Laís Leles</p>
      <span class="nutri-crn">CRN-8 18878</span>
      <p style="font-size: 10px; color: #64748b; margin: 2px 0 0 0;">Especialista em Seletividade Alimentar</p>
    </div>
  </div>

  <!-- DADOS DE IDENTIFICAÇÃO DO PACIENTE -->
  <div class="meta-box">
    <div class="meta-item"><strong>Responsável:</strong> ${nomeResponsavel}</div>
    <div class="meta-item"><strong>Criança:</strong> ${nomeCrianca} (${idade})</div>
    <div class="meta-item"><strong>Data de Emissão:</strong> ${dataHoje}</div>
    ${dados.semanaRef ? `<div class="meta-item"><strong>Referência:</strong> ${dados.semanaRef}</div>` : ""}
  </div>

  ${
    ehDevolutiva
      ? `
  <!-- ==================== DEVOLUTIVA CLÍNICA SEMANAL ==================== -->
  <div class="doc-title-wrapper">
    <span class="doc-badge">Acompanhamento Clínico Semanal</span>
    <h2 class="doc-title">${conteudoDevolutiva.titulo || "Devolutiva Semanal de Acompanhamento"}</h2>
  </div>

  <div class="section-title">🩺 Parecer Clínico & Acolhimento</div>
  <div class="card-parecer">${conteudoDevolutiva.parecerClinico || "Nenhum parecer emitido ainda."}</div>

  ${
    alimentosAlvo.length > 0
      ? `
  <div class="section-title">🎯 Alimentos-Alvo da Semana</div>
  <p style="font-size: 11px; color: #64748b; margin: 0 0 6px 0;">Alimentos selecionados para exposição sensorial gentil sem exigência de mastigação/ingestão imediata:</p>
  <div class="tags-container">
    ${alimentosAlvo.map((a) => `<span class="tag">🥕 ${a}</span>`).join("")}
  </div>
  `
      : ""
  }

  ${
    metas.length > 0
      ? `
  <div class="section-title">📋 Metas Práticas & Desafios da Família</div>
  <ul class="metas-list">
    ${metas
      .map(
        (m) => `
      <li class="meta-li">
        <div class="checkbox-box"></div>
        <span>${m.texto}</span>
      </li>
    `
      )
      .join("")}
  </ul>
  `
      : ""
  }
  `
      : `
  <!-- ==================== PLANO ALIMENTAR & PRATO SEGURO ==================== -->
  <div class="doc-title-wrapper">
    <span class="doc-badge">Prescrição Nutricional Pediátrica</span>
    <h2 class="doc-title">Estrutura do Prato Seguro & Plano Alimentar</h2>
  </div>

  <div class="section-title">🛡️ Orientação Clínica & Regra de Ouro</div>
  <div class="card-parecer">${
    dados.orientacaoPrato ||
    "Acolhimento e previsibilidade: quem decide o que e onde servir são os pais; o que e o quanto comer é escolha da criança."
  }</div>

  <div class="section-title">🍽️ Método do Prato Seguro (Distribuição Sensorial)</div>
  <div class="prato-seguro-grid">
    <div class="prato-col prato-conforto">
      <div class="prato-col-title">🌿 ${composicao.conforto}% Conforto (Seguro)</div>
      <div class="prato-col-desc">Alimentos que a criança já come com tranquilidade. Garante saciedade e remove o pânico.</div>
    </div>
    <div class="prato-col prato-ponte">
      <div class="prato-col-title">🌉 ${composicao.ponte}% Ponte (Parecido)</div>
      <div class="prato-col-desc">Variações sutis de cor, textura ou formato que conectam o conforto ao novo.</div>
    </div>
    <div class="prato-col prato-desafio">
      <div class="prato-col-title">🌟 ${composicao.desafio}% Desafio (Exposição)</div>
      <div class="prato-col-desc">Porção mínima (ex: 1 fatia ou pratinho de apoio) sem pressão para experimentar.</div>
    </div>
  </div>

  ${
    dados.refeicoes && dados.refeicoes.length > 0
      ? `
  <div class="section-title">🥣 Sugestões de Refeições Estruturadas</div>
  ${dados.refeicoes
    .map(
      (r) => `
    <div class="refeicao-item">
      <div class="refeicao-header">
        <span>${r.nome}</span>
        ${r.horario ? `<span style="font-size: 11px; color: #64748b;">${r.horario}</span>` : ""}
      </div>
      <div class="refeicao-detalhes">
        <div><strong>Seguro:</strong> ${r.seguro || "—"}</div>
        <div><strong>Ponte:</strong> ${r.parecido || "—"}</div>
        <div><strong>Desafio:</strong> ${r.exposicao || "—"}</div>
      </div>
    </div>
  `
    )
    .join("")}
  `
      : ""
  }

  ${
    dados.receitas && dados.receitas.length > 0
      ? `
  <div class="section-title" style="page-break-before: auto;">🍲 Receitas Terapêuticas Recomendadas</div>
  ${dados.receitas
    .map(
      (rec) => `
    <div class="receita-card">
      <h3 class="receita-title">${rec.titulo}</h3>
      <div class="receita-meta">
        ${rec.textura ? `<span>Textura: <strong>${rec.textura}</strong></span> • ` : ""}
        ${rec.tempoPreparo ? `<span>Preparo: ${rec.tempoPreparo}</span> • ` : ""}
        ${rec.rendimento ? `<span>Rendimento: ${rec.rendimento}</span>` : ""}
      </div>
      <strong>Ingredientes:</strong>
      <ul class="receita-ingredientes">
        ${rec.ingredientes.map((i) => `<li>${i}</li>`).join("")}
      </ul>
      <strong>Modo de Preparo:</strong>
      <ol class="receita-modo">
        ${rec.modoPreparo.map((p) => `<li>${p.replace(/^\\d+\\.\\s*/, "")}</li>`).join("")}
      </ol>
      ${
        rec.estrategiaSensorial
          ? `
      <div class="estrategia-box">
        <strong>💡 Estratégia Sensorial:</strong> ${rec.estrategiaSensorial}
      </div>
      `
          : ""
      }
    </div>
  `
    )
    .join("")}
  `
      : ""
  }
  `
  }

  <!-- RODAPÉ OFICIAL & ASSINATURA -->
  <div class="footer">
    <div>
      <p style="margin: 0; font-weight: 600;">Nutrindo em Casa • Plataforma de Apoio à Seletividade Alimentar</p>
      <p style="margin: 2px 0 0 0;">Documento gerado em ${dataHoje} • Contato: metodonutrindoemcasa@gmail.com</p>
    </div>
    <div class="assinatura-area">
      <div class="assinatura-linha"></div>
      <div class="assinatura-nome">Dra. Laís Leles</div>
      <div style="font-size: 9px; color: #64748b;">Nutricionista Clínica Pediátrica • CRN-8 18878</div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Dispara a impressão limpa do documento timbrado (ou salva como PDF via diálogo de impressão nativo)
 */
export function imprimirDocumentoTimbrado(dados: DadosDocumentoTimbrado) {
  if (typeof window === "undefined") return;

  try {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      throw new Error("Não foi possível acessar o contexto de impressão.");
    }

    const html = gerarHtmlDocumentoTimbrado(dados);
    doc.open();
    doc.write(html);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      try {
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn("Aviso ao disparar impressão via iframe:", err);
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 400);
  } catch (err) {
    console.warn("Fallback para janela de impressão:", err);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(gerarHtmlDocumentoTimbrado(dados));
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
      }, 500);
    }
  }
}

export interface DadosMaterialAula {
  id: string;
  titulo: string;
  modulo?: string;
  checklist?: string[];
  resumo?: string;
  dicas?: string[];
}

export function gerarHtmlMaterialAula(aula: DadosMaterialAula): string {
  const dataHoje = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const checklistItens = aula.checklist && aula.checklist.length > 0 ? aula.checklist : [
    "Identificar sinais corporais de recusa sem forçar",
    "Organizar o Prato Seguro (70% conforto, 20% ponte, 10% desafio)",
    "Respeitar o ritmo sensorial da criança",
    "Evitar distrações com telas durante a refeição",
    "Comemorar pequenas aproximações e toques no alimento",
  ];

  const resumoTexto = aula.resumo || "Este guia prático foi elaborado pela Dra. Laís Leles para apoiar sua família na aplicação das estratégias da aula em casa, com passos objetivos e checklist visual.";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Material de Apoio • ${aula.titulo}</title>
  <style>
    @page { size: A4; margin: 15mm 15mm 20mm 15mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b; background: #ffffff; line-height: 1.5; margin: 0; padding: 20px; font-size: 13px;
    }
    .header {
      display: flex; justify-content: space-between; align-items: center;
      border-bottom: 2px solid #3D5A45; padding-bottom: 14px; margin-bottom: 20px;
    }
    .brand-title { font-size: 20px; font-weight: 800; color: #3D5A45; letter-spacing: -0.5px; margin: 0; }
    .brand-subtitle { font-size: 11px; color: #64748b; margin: 2px 0 0 0; }
    .nutri-info { text-align: right; }
    .nutri-name { font-size: 13px; font-weight: 700; color: #1e293b; margin: 0; }
    .nutri-crn {
      display: inline-block; font-size: 10px; font-weight: 700; color: #3D5A45;
      background: #E8F5E9; border: 1px solid #c8e6c9; padding: 2px 8px; border-radius: 9999px; margin-top: 3px;
    }
    .badge {
      display: inline-block; font-size: 10px; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.5px; color: #3D5A45; background: #f0fdf4; border: 1px solid #bbf7d0;
      padding: 3px 10px; border-radius: 6px; margin-bottom: 6px;
    }
    .doc-title { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; }
    .doc-subtitle { font-size: 12px; color: #64748b; margin: 0 0 16px 0; }
    .card-resumo {
      background: #f8fafc; border-left: 4px solid #3D5A45; border-radius: 8px;
      padding: 14px 16px; font-size: 13px; line-height: 1.6; color: #334155; margin-bottom: 20px;
    }
    .section-title {
      font-size: 13px; font-weight: 800; color: #3D5A45; text-transform: uppercase;
      letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;
      margin-top: 22px; margin-bottom: 12px;
    }
    .checklist-item {
      padding: 10px 14px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;
      margin-bottom: 8px; display: flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 600;
    }
    .checkbox-box {
      width: 16px; height: 16px; border: 2px solid #3D5A45; border-radius: 4px; flex-shrink: 0;
    }
    .dica-box {
      background: #fffbeb; border: 1px solid #fef3c7; border-radius: 10px;
      padding: 14px; margin-top: 20px; color: #92400e; font-size: 12px; line-height: 1.5;
    }
    .footer {
      margin-top: 40px; padding-top: 14px; border-top: 1px dashed #cbd5e1;
      display: flex; justify-content: space-between; align-items: flex-end;
      font-size: 10px; color: #64748b;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="brand-title">Nutrindo em Casa</h1>
      <p class="brand-subtitle">Material de Apoio Oficial • Aulas & Treinamentos</p>
    </div>
    <div class="nutri-info">
      <p class="nutri-name">Dra. Laís Leles</p>
      <span class="nutri-crn">CRN-8 18878</span>
      <p style="font-size: 10px; color: #64748b; margin: 2px 0 0 0;">Nutricionista Especialista</p>
    </div>
  </div>

  <div>
    <span class="badge">${aula.modulo || "Módulo Prático"}</span>
    <h2 class="doc-title">${aula.titulo}</h2>
    <p class="doc-subtitle">Guia e Checklist para Aplicação da Aula em Família</p>
  </div>

  <div class="section-title">💡 Resumo & Direcionamento da Aula</div>
  <div class="card-resumo">${resumoTexto}</div>

  <div class="section-title">✅ Checklist de Aplicação Prática</div>
  <div>
    ${checklistItens.map((item) => `
      <div class="checklist-item">
        <div class="checkbox-box"></div>
        <span>${item}</span>
      </div>
    `).join("")}
  </div>

  <div class="dica-box">
    <strong>💡 Dica de Ouro da Dra. Laís:</strong> "Lembre-se de que cada degrau conta. Não force a criança a engolir — tolerar o alimento na mesa, tocar ou cheirar já são vitórias sensoriais gigantescas."
  </div>

  <div class="footer">
    <div>
      <p style="margin: 0; font-weight: 600;">Nutrindo em Casa • Acesso exclusivo a alunos e assinantes</p>
      <p style="margin: 2px 0 0 0;">Emitido em ${dataHoje} • Dra. Laís Leles (CRN-8 18878)</p>
    </div>
    <div style="text-align: right;">
      <p style="margin: 0; font-weight: 700; color: #3D5A45;">metodonutrindoemcasa@gmail.com</p>
    </div>
  </div>
</body>
</html>`;
}

export function imprimirMaterialAula(aula: DadosMaterialAula) {
  if (typeof window === "undefined") return;

  try {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) throw new Error("Contexto de impressão indisponível");

    doc.open();
    doc.write(gerarHtmlMaterialAula(aula));
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      try {
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn("Aviso na impressão:", err);
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) document.body.removeChild(iframe);
        }, 1500);
      }
    }, 400);
  } catch (err) {
    console.warn("Fallback para window.open:", err);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(gerarHtmlMaterialAula(aula));
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  }
}

// =============================================================================
// RELATÓRIO CLÍNICO DE ANAMNESE PEDIÁTRICA COMPLETA (56 PERGUNTAS)
// =============================================================================

export interface ItemAnamnesePergunta {
  numero: number;
  pergunta: string;
  resposta: string;
  pontoAtencao?: boolean;
  motivoAtencao?: string;
  sugestaoConduta?: string;
}

export interface SecaoAnamneseCompleta {
  titulo: string;
  numeroSecao: number;
  itens: ItemAnamnesePergunta[];
}

export interface DadosAnamneseCompleta {
  paciente?: string; // Nome do responsável
  email?: string;
  crianca?: string;
  idadeCrianca?: string;
  telefone?: string;
  plano?: string;
  dataPreenchimento?: string;
  pontosAtencao?: Array<{
    numero: number;
    pergunta: string;
    resposta: string;
    motivoAtencao?: string;
  }>;
  secoes?: SecaoAnamneseCompleta[];
}

export function gerarHtmlAnamneseCompleta(dados: DadosAnamneseCompleta): string {
  const dataHoje = dados.dataPreenchimento || new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const nomeResponsavel = dados.paciente || "Responsável Legal";
  const nomeCrianca = dados.crianca || "Paciente Pediátrico";
  const idade = dados.idadeCrianca || "Não informada";
  const email = dados.email || "Não informado";
  const telefone = dados.telefone || "Não informado";
  const plano = dados.plano || "Plano Trimestral";

  const secoes = dados.secoes || [];

  // Coleta pontos de atenção caso não tenham sido passados prontos
  let pontos = dados.pontosAtencao || [];
  if (pontos.length === 0 && secoes.length > 0) {
    secoes.forEach((sec) => {
      sec.itens.forEach((it) => {
        if (it.pontoAtencao) {
          pontos.push({
            numero: it.numero,
            pergunta: it.pergunta,
            resposta: it.resposta,
            motivoAtencao: it.motivoAtencao,
          });
        }
      });
    });
  }

  // Gera o HTML das 8 seções e 56 perguntas
  const secoesHtml = secoes.map((sec) => {
    const itensHtml = sec.itens.map((it) => {
      const destaqueAlerta = it.pontoAtencao
        ? `border-left: 3.5px solid #d97706; background: #fffdf5;`
        : `border-left: 3.5px solid #e2e8f0; background: #ffffff;`;

      const badgeAlerta = it.pontoAtencao
        ? `<span style="display: inline-block; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #b45309; background: #fef3c7; border: 1px solid #fde68a; padding: 2px 7px; border-radius: 9999px; margin-left: 6px;">⚠️ Ponto de Atenção</span>`
        : "";

      const motivoHtml = it.pontoAtencao && it.motivoAtencao
        ? `<div style="margin-top: 6px; padding: 6px 10px; background: #fef2f2; border-left: 2px solid #ef4444; border-radius: 4px; font-size: 11px; color: #991b1b;">
             <strong>Nota Clínica:</strong> ${it.motivoAtencao}
           </div>`
        : "";

      return `
        <div style="margin-bottom: 10px; padding: 10px 14px; border-radius: 8px; border: 1px solid #e2e8f0; ${destaqueAlerta} page-break-inside: avoid;">
          <div style="display: flex; align-items: baseline; gap: 6px; margin-bottom: 4px;">
            <span style="font-size: 11px; font-weight: 800; color: #3D5A45; background: #E8F5E9; padding: 2px 6px; border-radius: 4px;">Q${String(it.numero).padStart(2, "0")}</span>
            <span style="font-size: 12px; font-weight: 700; color: #0f172a; flex: 1;">${it.pergunta}</span>
            ${badgeAlerta}
          </div>
          <div style="font-size: 12px; color: #334155; margin-left: 32px; line-height: 1.45;">
            <strong>Resposta:</strong> <span style="color: #1e293b;">${it.resposta || "Não informado"}</span>
          </div>
          ${motivoHtml}
        </div>
      `;
    }).join("");

    return `
      <div style="margin-top: 22px; margin-bottom: 16px; page-break-inside: avoid;">
        <div style="background: #3D5A45; color: #ffffff; padding: 8px 14px; border-radius: 8px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
          <h3 style="margin: 0; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
            ${sec.titulo}
          </h3>
          <span style="font-size: 10px; font-weight: 700; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 9999px;">
            ${sec.itens.length} itens
          </span>
        </div>
        ${itensHtml}
      </div>
    `;
  }).join("");

  // Bloco de Resumo dos Pontos de Atenção
  const pontosAtencaoHtml = pontos.length > 0 ? `
    <div style="background: #fffbeb; border: 1.5px solid #f59e0b; border-radius: 12px; padding: 16px; margin-bottom: 22px; page-break-inside: avoid;">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #fde68a; padding-bottom: 8px; margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 16px;">⚠️</span>
          <h3 style="margin: 0; font-size: 13px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">
            Resumo dos Pontos de Atenção Clínica Detectados
          </h3>
        </div>
        <span style="font-size: 11px; font-weight: 800; background: #fef3c7; color: #b45309; padding: 3px 10px; border-radius: 9999px; border: 1px solid #fde68a;">
          ${pontos.length} alertas identificados
        </span>
      </div>
      <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
        ${pontos.map((p) => `
          <div style="background: #ffffff; border: 1px solid #fed7aa; border-radius: 8px; padding: 8px 12px; font-size: 11px; color: #451a03;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 3px;">
              <span style="font-weight: 800; color: #b45309;">Q${String(p.numero).padStart(2, "0")}</span>
              <span style="font-weight: 700; color: #1e293b;">${p.pergunta}</span>
            </div>
            <div style="color: #475569; margin-left: 28px;">
              <strong>Registrado:</strong> ${p.resposta}
              ${p.motivoAtencao ? ` | <span style="color: #b91c1c; font-weight: 600;">${p.motivoAtencao}</span>` : ""}
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  ` : `
    <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px; padding: 14px; margin-bottom: 22px; text-align: center; color: #166534; font-size: 12px; font-weight: 700;">
      ✅ Nenhum ponto de risco ou alerta crítico detectado nas respostas da anamnese.
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Anamnese Completa • ${nomeCrianca} • Dra. Laís Leles</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 15mm 16mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.5;
      margin: 0;
      padding: 16px;
      font-size: 12px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2.5px solid #3D5A45;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand-title {
      font-size: 19px;
      font-weight: 900;
      color: #3D5A45;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .brand-subtitle {
      font-size: 10.5px;
      color: #64748b;
      margin: 2px 0 0 0;
    }
    .nutri-info {
      text-align: right;
    }
    .nutri-name {
      font-size: 12.5px;
      font-weight: 800;
      color: #1e293b;
      margin: 0;
    }
    .nutri-crn {
      display: inline-block;
      font-size: 9.5px;
      font-weight: 800;
      color: #3D5A45;
      background: #E8F5E9;
      border: 1px solid #c8e6c9;
      padding: 2px 7px;
      border-radius: 9999px;
      margin-top: 2px;
    }
    .title-banner {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 16px;
      text-align: center;
    }
    .title-banner h1 {
      margin: 0;
      font-size: 14px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .title-banner p {
      margin: 3px 0 0 0;
      font-size: 10.5px;
      color: #64748b;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 18px;
    }
    .meta-item {
      display: flex;
      flex-direction: column;
    }
    .meta-label {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      color: #94a3b8;
      letter-spacing: 0.5px;
    }
    .meta-value {
      font-size: 11.5px;
      font-weight: 700;
      color: #1e293b;
      margin-top: 1px;
    }
    .footer {
      margin-top: 32px;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #94a3b8;
      page-break-inside: avoid;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <!-- CABEÇALHO TIMBRADO OFICIAL -->
  <div class="header">
    <div>
      <h2 class="brand-title">Nutrindo em Casa</h2>
      <p class="brand-subtitle">Terapia Alimentar & Nutrição Pediátrica Descomplicada</p>
    </div>
    <div class="nutri-info">
      <p class="nutri-name">Dra. Laís Leles</p>
      <span class="nutri-crn">CRN-8 18878</span>
    </div>
  </div>

  <!-- BANNER DO DOCUMENTO -->
  <div class="title-banner">
    <h1>Relatório Clínico de Anamnese Pediátrica Completa</h1>
    <p>Mapeamento Biopsicossocial e Sensorial dos Hábitos Alimentares (56 Perguntas Clínicas)</p>
  </div>

  <!-- GRID COM DADOS CLÍNICOS DO PACIENTE -->
  <div class="meta-grid">
    <div class="meta-item">
      <span class="meta-label">Criança / Paciente</span>
      <span class="meta-value">${nomeCrianca}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Idade</span>
      <span class="meta-value">${idade}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Responsável</span>
      <span class="meta-value">${nomeResponsavel}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Plano Vigente</span>
      <span class="meta-value" style="color: #3D5A45; font-weight: 800;">${plano}</span>
    </div>
    <div class="meta-item" style="grid-column: span 2;">
      <span class="meta-label">E-mail de Contato</span>
      <span class="meta-value">${email}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">WhatsApp</span>
      <span class="meta-value">${telefone}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Data de Emissão</span>
      <span class="meta-value">${dataHoje}</span>
    </div>
  </div>

  <!-- QUADRO DE DESTAQUE: PONTOS DE ATENÇÃO -->
  ${pontosAtencaoHtml}

  <!-- TODAS AS 8 SEÇÕES DA ANAMNESE -->
  ${secoesHtml}

  <!-- ASSINATURA & RODAPÉ OFICIAL -->
  <div class="footer">
    <div>
      <p style="margin: 0; font-weight: 700; color: #475569;">Nutrindo em Casa • Dra. Laís Leles • CRN-8 18878</p>
      <p style="margin: 2px 0 0 0;">Documento Clínico Confidencial • Uso restrito ao acompanhamento nutricional</p>
    </div>
    <div style="text-align: right;">
      <p style="margin: 0; font-weight: 700; color: #3D5A45;">metodonutrindoemcasa@gmail.com</p>
    </div>
  </div>
</body>
</html>`;
}

export function imprimirAnamneseCompleta(dados: DadosAnamneseCompleta) {
  if (typeof window === "undefined") return;

  try {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) throw new Error("Contexto de impressão indisponível");

    doc.open();
    doc.write(gerarHtmlAnamneseCompleta(dados));
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      try {
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn("Aviso na impressão:", err);
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) document.body.removeChild(iframe);
        }, 1500);
      }
    }, 400);
  } catch (err) {
    console.warn("Fallback para window.open:", err);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(gerarHtmlAnamneseCompleta(dados));
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  }
}

