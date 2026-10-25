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
