import { stripHtml } from "@/lib/html";
import type { Note, NoteColor, Priority } from "@/lib/board-types";

/**
 * Quais notas aparecem.
 *
 * Antes o tipo morava no componente do menu e a regra dentro da rota, então
 * quem quisesse filtrar em outro lugar (uma exportação, um relatório, um teste)
 * teria que importar tela. Aqui a decisão é uma função pura sobre `Note`.
 */
export type Filters = {
  query: string;
  colors: NoteColor[];
  tags: string[];
  priorities: Priority[];
  showArchived: boolean;
};

export const emptyFilters: Filters = {
  query: "",
  colors: [],
  tags: [],
  priorities: [],
  showArchived: false,
};

/** Quantos critérios estão ativos — o número que o botão de filtros exibe. */
export function activeFilterCount(filters: Filters): number {
  return (
    (filters.query.trim() ? 1 : 0) +
    filters.colors.length +
    filters.tags.length +
    filters.priorities.length +
    (filters.showArchived ? 1 : 0)
  );
}

/** Texto onde a busca procura: título, corpo, complemento e tags. */
function searchableText(note: Note): string {
  return [note.title, stripHtml(note.content), stripHtml(note.contentBelow ?? ""), ...note.tags]
    .join(" ")
    .toLowerCase();
}

/**
 * A tela de arquivadas inverte o critério: lá o arquivamento é o que se procura,
 * e não o que se esconde.
 */
export function matchesFilters(
  note: Note,
  filters: Filters,
  { archivedOnly = false }: { archivedOnly?: boolean } = {},
): boolean {
  if (archivedOnly ? !note.archived : note.archived && !filters.showArchived) return false;

  const query = filters.query.trim().toLowerCase();
  if (query && !searchableText(note).includes(query)) return false;

  if (filters.colors.length > 0 && !filters.colors.includes(note.color)) return false;

  if (filters.priorities.length > 0) {
    if (!note.priority || !filters.priorities.includes(note.priority)) return false;
  }

  // Várias tags selecionadas restringem: a nota precisa ter todas.
  if (filters.tags.length > 0 && !filters.tags.every((tag) => note.tags.includes(tag))) {
    return false;
  }

  return true;
}
