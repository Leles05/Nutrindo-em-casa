/**
 * Permite importar módulos do projeto que usam o atalho "@/..." (e imports sem extensão) dentro dos testes do Node.
 * Uso: register("./helpers/alias-hooks.mjs", import.meta.url) e depois `await import("../src/lib/...ts")`.
 */
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const caminho = specifier.slice(2);
    const url = new URL("../../src/" + caminho + (/\.[a-z]+$/.test(caminho) ? "" : ".ts"), import.meta.url);
    return nextResolve(url.href, context);
  }
  return nextResolve(specifier, context);
}
