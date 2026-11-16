// Registra (ou atualiza) o webhook do Nutrindo em Casa em uma conta Asaas.
//
// Uso (PowerShell) — as chaves ficam só na sua sessão e nunca são impressas:
//   $env:ASAAS_API_URL="https://api.asaas.com/v3"
//   $env:ASAAS_API_KEY="<chave da conta oficial>"
//   $env:ASAAS_WEBHOOK_TOKEN="<o MESMO valor de ASAAS_WEBHOOK_TOKEN na Vercel>"
//   node scripts/registrar_webhook_asaas.mjs
//
// Sandbox: use ASAAS_API_URL="https://api-sandbox.asaas.com/v3" e a chave do sandbox.

const URL_BASE = (process.env.ASAAS_API_URL || "").replace(/\/$/, "");
const CHAVE = process.env.ASAAS_API_KEY || "";
const TOKEN = process.env.ASAAS_WEBHOOK_TOKEN || "";
const DESTINO = process.env.WEBHOOK_URL || "https://www.nutrindoemcasa.com.br/api/asaas/webhook";
const EMAIL_AVISO = process.env.WEBHOOK_EMAIL || "contato@nutrindoemcasa.com.br";

if (!URL_BASE || !CHAVE || TOKEN.length < 32) {
  console.error("Defina ASAAS_API_URL, ASAAS_API_KEY e ASAAS_WEBHOOK_TOKEN (mínimo 32 caracteres).");
  process.exit(1);
}

const producao = !/sandbox/i.test(URL_BASE);
const headers = { access_token: CHAVE, "Content-Type": "application/json", "User-Agent": "nutrindo-em-casa" };
const chamar = async (metodo, caminho, corpo) => {
  const r = await fetch(URL_BASE + caminho, { method: metodo, headers, body: corpo ? JSON.stringify(corpo) : undefined });
  let j = null;
  try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};

console.log(`Ambiente: ${producao ? "PRODUÇÃO (dinheiro real)" : "sandbox"} — ${URL_BASE}`);

const saldo = await chamar("GET", "/finance/balance");
if (saldo.status !== 200) {
  console.error(`A chave não foi aceita nesse ambiente (HTTP ${saldo.status}). Confira se a chave e a URL são do mesmo ambiente.`);
  process.exit(1);
}
console.log("Chave válida.");

const EVENTOS = [
  "PAYMENT_CREATED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED",
  "PAYMENT_OVERDUE",
  "PAYMENT_DELETED",
  "PAYMENT_REFUNDED",
  "PAYMENT_CHARGEBACK_REQUESTED",
  "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED",
  "SUBSCRIPTION_DELETED",
  "SUBSCRIPTION_INACTIVATED",
];

const corpo = {
  name: "Nutrindo em Casa",
  url: DESTINO,
  email: EMAIL_AVISO,
  enabled: true,
  interrupted: false,
  apiVersion: 3,
  authToken: TOKEN,
  sendType: "SEQUENTIALLY",
  events: EVENTOS,
};

const lista = await chamar("GET", "/webhooks");
const existente = (lista.json?.data || []).find((w) => w.url === DESTINO);
const r = existente
  ? await chamar("PUT", `/webhooks/${existente.id}`, corpo)
  : await chamar("POST", "/webhooks", corpo);

if (r.status >= 200 && r.status < 300) {
  console.log(`${existente ? "Webhook atualizado" : "Webhook criado"}: ${DESTINO}`);
  console.log(`Eventos: ${EVENTOS.length} • fila ${r.json?.interrupted ? "PAUSADA (verifique no painel)" : "ativa"}`);
} else {
  console.error(`Falha ao registrar o webhook (HTTP ${r.status}):`, JSON.stringify(r.json?.errors || r.json));
  process.exit(1);
}
