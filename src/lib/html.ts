import DOMPurify from "dompurify";

/**
 * Conteúdo rico das notas.
 *
 * O editor guarda HTML, então todo lugar que precisa de texto puro (busca,
 * prévia, "tem conteúdo?") passa por aqui em vez de repetir expressão regular.
 */

/**
 * HTML seguro para injetar na página.
 *
 * O conteúdo da nota chega do armazenamento local — que o usuário (ou um script
 * de outra aba, ou uma futura API) pode ter alterado —, então tratá-lo como
 * confiável só porque "foi o editor que gerou" é o caminho clássico para XSS.
 * A limpeza é feita por uma biblioteca dedicada em vez de expressão regular
 * própria: sanitizar HTML na mão erra em casos que ninguém antecipa.
 *
 * Sem `window` (renderização no servidor) não há como sanitizar de verdade,
 * então cai para texto puro em vez de arriscar devolver marcação intacta.
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  if (typeof window === "undefined") return stripHtml(html);
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}

/** HTML → texto puro, para busca e prévias. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tem conteúdo de verdade? O parágrafo vazio que o editor deixa não conta. */
export function hasRichContent(html: string | null | undefined): boolean {
  if (!html) return false;
  if (/<(img|table|video|hr)\b/i.test(html)) return true;
  return stripHtml(html).length > 0;
}
