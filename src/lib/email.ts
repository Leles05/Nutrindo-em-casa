/**
 * Envio de e-mails transacionais (aviso de renovação, falha de cobrança) via Resend.
 * Requer RESEND_API_KEY (e, de preferência, RESEND_FROM_EMAIL com domínio verificado).
 * Sem a chave, apenas registra no log: a cobrança em si não depende do e-mail.
 */
export async function enviarEmail(opts: { para: string; assunto: string; html: string }): Promise<boolean> {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) {
    console.warn(`[email] RESEND_API_KEY não configurada: e-mail "${opts.assunto}" não enviado.`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "Nutrindo em Casa <contato@nutrindoemcasa.com.br>",
        to: [opts.para],
        subject: opts.assunto,
        html: opts.html,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) console.error("[email] falha no envio:", res.status, (await res.text()).slice(0, 200));
    return res.ok;
  } catch (e) {
    console.error("[email] erro no envio:", e);
    return false;
  }
}

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
function esc(texto: string) {
  return texto.replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/** Layout padrão (mesma identidade visual dos demais e-mails). */
export function montarEmail(titulo: string, paragrafos: string[], botao?: { texto: string; url: string }): string {
  const corpo = paragrafos.map((p) => `<p style="font-size:14px;line-height:1.6;color:#4A5568;">${esc(p)}</p>`).join("");
  const cta = botao
    ? `<div style="text-align:center;margin:28px 0;"><a href="${esc(botao.url)}" style="background:#4C6C54;color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 28px;border-radius:12px;display:inline-block;">${esc(botao.texto)}</a></div>`
    : "";
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#F0EAE1;padding:32px 16px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #E2E8F0;">
    <div style="background:#4C6C54;padding:26px 24px;text-align:center;"><h1 style="color:#fff;font-size:22px;margin:0;">Nutrindo em Casa</h1></div>
    <div style="padding:28px;"><h2 style="font-size:18px;color:#2D3748;margin-top:0;">${esc(titulo)}</h2>${corpo}${cta}
    <p style="font-size:12px;color:#718096;">Dúvidas? Responda este e-mail ou fale com a equipe da Dra. Laís.</p></div>
  </div></div>`;
}
