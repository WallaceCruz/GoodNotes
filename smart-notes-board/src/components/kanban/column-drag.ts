/**
 * Metadados do arraste de colunas no quadro.
 *
 * A coluna tem dois alvos de drop no mesmo `DndContext`: o corpo (recebe notas,
 * usa o próprio `column.id`) e a coluna inteira (recebe outras colunas). Por isso
 * o sortable da coluna usa um id com prefixo, e o tipo em `data` separa os dois
 * fluxos na detecção de colisão.
 */

/** Id do sortable da coluna: distinto do id do droppable que recebe as notas. */
export const columnSortableId = (columnId: string) => `col:${columnId}`;

/** Id da coluna quando o item arrastado/sobrevoado é uma coluna; `null` para notas. */
export function columnIdOf(data: Record<string, unknown> | undefined | null): string | null {
  return data && data["type"] === "column" ? String(data["columnId"]) : null;
}
