import { uid } from "@/lib/id";
import type { Column, NativeColumnKey } from "@/lib/board/model";

/**
 * As colunas fixas do fluxo: quais existem, como criá-las e como reconhecer a
 * que uma nota pertence.
 *
 * Vivia dentro do módulo de tipos, misturado ao modelo. É um assunto próprio —
 * "qual é o fluxo padrão do quadro" — e tanto as regras de nota quanto as de
 * coluna dependem dele, então ficar num módulo folha evita que uma importe a
 * outra em círculo.
 */

export const NATIVE_COLUMNS: Array<{ key: NativeColumnKey; title: string }> = [
  { key: "backlog", title: "Backlog" },
  { key: "research", title: "Research" },
  { key: "discovery", title: "Discovery" },
  { key: "doing", title: "Em andamento" },
  { key: "validation", title: "Em revisão" },
  { key: "done", title: "Concluído" },
];

export const nativeColumns = (): Column[] =>
  NATIVE_COLUMNS.map((c) => ({ id: uid(), title: c.title, native: c.key }));

// Títulos antigos que devem ser reaproveitados como colunas nativas.
const LEGACY_TITLE_MAP: Record<string, NativeColumnKey> = {
  backlog: "backlog",
  research: "research",
  discovery: "discovery",
  fazendo: "doing",
  "em andamento": "doing",
  doing: "doing",
  validação: "validation",
  validacao: "validation",
  "em revisão": "validation",
  "em revisao": "validation",
  revisão: "validation",
  feito: "done",
  concluído: "done",
  concluido: "done",
  "concluído (done)": "done",
  done: "done",
};

export function ensureNativeColumns(columns: Column[]): Column[] {
  const taken = new Set<NativeColumnKey>();
  const marked = columns.map((c) => {
    const key = c.native ?? LEGACY_TITLE_MAP[c.title.trim().toLowerCase()];
    if (key && !taken.has(key)) {
      taken.add(key);
      const def = NATIVE_COLUMNS.find((n) => n.key === key)!;
      return { ...c, native: key, title: def.title };
    }
    return { ...c, native: null };
  });
  const missing: Column[] = NATIVE_COLUMNS.filter((def) => !taken.has(def.key)).map((def) => ({
    id: uid(),
    title: def.title,
    native: def.key,
  }));
  return [...missing, ...marked];
}

export function nativeKeyOf(columns: Column[], columnId: string): NativeColumnKey | null {
  return columns.find((c) => c.id === columnId)?.native ?? null;
}
