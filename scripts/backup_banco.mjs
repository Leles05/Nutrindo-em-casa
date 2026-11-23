/**
 * Backup do banco (Supabase) em arquivos JSON, para quem usa o plano gratuito (sem backup automático).
 *
 * Uso (na pasta do projeto, com o .env.local preenchido):
 *   node scripts/backup_banco.mjs
 *
 * - Só LÊ o banco (nunca altera nada).
 * - Salva em backups/AAAA-MM-DD/<tabela>.json (a pasta backups/ não vai para o Git).
 * - Os arquivos têm DADOS DE SAÚDE E PESSOAIS de clientes: guarde em local privado e protegido (pen drive/nuvem com senha),
 *   nunca em pasta pública nem em e-mail. Apague cópias antigas que não precisar mais.
 * - Não inclui: chaves do Google da agenda (google_integracao) nem registros técnicos de avisos de pagamento.
 * - As contas de login (e-mail/senha) ficam no Supabase Auth e não entram aqui; os perfis e todo o resto, sim.
 */
import fs from "node:fs";
import path from "node:path";

const TABELAS = [
  "profiles",
  "faturas",
  "aceites_termos",
  "anamneses",
  "mensagens_chat",
  "diario_refeicoes",
  "agendamentos",
  "devolutivas_semanais",
  "prescricoes_plano",
  "respostas_rapidas_nutri",
  "cupons",
  "curso_estrutura",
  "materiais_aulas",
];

const raiz = path.resolve(import.meta.dirname, "..");
const env = {};
for (const linha of fs.readFileSync(path.join(raiz, ".env.local"), "utf8").split(/\r?\n/)) {
  const t = linha.trim();
  if (!t || t.startsWith("#") || !t.includes("=")) continue;
  const i = t.indexOf("=");
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
}
const base = env.NEXT_PUBLIC_SUPABASE_URL;
const chave = env.SUPABASE_SERVICE_ROLE_KEY;
if (!base || !chave) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.");
  process.exit(1);
}

const dia = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const pasta = path.join(raiz, "backups", dia);
fs.mkdirSync(pasta, { recursive: true });

const PAGINA = 1000;
let total = 0;
let falhas = 0;
for (const tabela of TABELAS) {
  const linhas = [];
  let inicio = 0;
  let ok = true;
  for (;;) {
    const r = await fetch(`${base}/rest/v1/${tabela}?select=*`, {
      headers: { apikey: chave, Authorization: `Bearer ${chave}`, Range: `${inicio}-${inicio + PAGINA - 1}`, "Range-Unit": "items" },
    });
    if (!r.ok) {
      console.error(`  ${tabela}: ERRO ${r.status} ${(await r.text()).slice(0, 120)}`);
      ok = false;
      falhas++;
      break;
    }
    const lote = await r.json();
    linhas.push(...lote);
    if (lote.length < PAGINA) break;
    inicio += PAGINA;
  }
  if (ok) {
    fs.writeFileSync(path.join(pasta, `${tabela}.json`), JSON.stringify(linhas, null, 2));
    total += linhas.length;
    console.log(`  ${tabela}: ${linhas.length} registros`);
  }
}
console.log(`\nBackup em ${pasta}\n${total} registros salvos${falhas ? `, ${falhas} tabela(s) com erro` : ", sem erros"}.`);
process.exit(falhas ? 1 : 0);
