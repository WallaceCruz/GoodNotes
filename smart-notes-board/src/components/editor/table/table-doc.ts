import { Fragment, type Node as PMNode } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";

/**
 * Onde o cursor está dentro de uma tabela.
 *
 * Este módulo é a única parte que conhece a estrutura do documento do editor:
 * quem chama pergunta "dá para mover esta linha para cima?" sem precisar saber
 * como o ProseMirror aninha tabela, linha e célula.
 */
export type TableSelection = {
  table: PMNode;
  pos: number;
  rowIndex: number;
  cellIndex: number;
};

/** A tabela que contém o cursor, ou `null` se ele estiver fora de qualquer tabela. */
export function selectedTable(editor: Editor): TableSelection | null {
  const { $from } = editor.state.selection;
  for (let depth = $from.depth; depth > 0; depth--) {
    if ($from.node(depth).type.name === "table") {
      return {
        table: $from.node(depth),
        pos: $from.before(depth),
        rowIndex: $from.index(depth),
        cellIndex: $from.index(depth + 1),
      };
    }
  }
  return null;
}

export function hasHeaderRow(table: PMNode): boolean {
  return table.firstChild?.firstChild?.type.name === "tableHeader";
}

/** Índice da primeira linha de corpo — o cabeçalho não entra na reordenação. */
export function firstBodyRow(table: PMNode): number {
  return hasHeaderRow(table) ? 1 : 0;
}

export function columnCount(table: PMNode): number {
  return table.firstChild?.childCount ?? 0;
}

/** Posição do início do conteúdo de uma célula, dada a tabela e sua posição no doc. */
function cellStart(table: PMNode, tablePos: number, rowIndex: number, cellIndex: number): number {
  let position = tablePos + 1;
  for (let i = 0; i < rowIndex; i++) position += table.child(i).nodeSize;
  const row = table.child(rowIndex);
  position += 1;
  for (let i = 0; i < cellIndex; i++) position += row.child(i).nodeSize;
  return position + 1;
}

/** Cópia do nó com dois filhos trocados de lugar. */
function withSwappedChildren(node: PMNode, a: number, b: number): PMNode {
  const children: PMNode[] = [];
  node.forEach((child) => children.push(child));
  const first = children[a];
  const second = children[b];
  if (!first || !second) return node;
  children[a] = second;
  children[b] = first;
  return node.type.create(node.attrs, Fragment.fromArray(children), node.marks);
}

export type TableAxis = "row" | "column";

/** Se a linha/coluna sob o cursor pode andar nessa direção sem sair da tabela. */
export function canMove(selection: TableSelection, axis: TableAxis, direction: -1 | 1): boolean {
  const { table, rowIndex, cellIndex } = selection;
  if (axis === "row") {
    const target = rowIndex + direction;
    return (
      rowIndex >= firstBodyRow(table) && target >= firstBodyRow(table) && target < table.childCount
    );
  }
  const target = cellIndex + direction;
  return target >= 0 && target < columnCount(table);
}

/**
 * Move a linha ou a coluna sob o cursor e leva a seleção junto — sem isso o
 * cursor sai da tabela e a barra some no meio de uma sequência de movimentos.
 */
export function moveInTable(editor: Editor, axis: TableAxis, direction: -1 | 1): void {
  const selection = selectedTable(editor);
  if (!selection || !canMove(selection, axis, direction)) return;

  const { table, pos, rowIndex, cellIndex } = selection;
  let moved: PMNode;
  let row = rowIndex;
  let cell = cellIndex;

  if (axis === "row") {
    row = rowIndex + direction;
    moved = withSwappedChildren(table, rowIndex, row);
  } else {
    cell = cellIndex + direction;
    const rows: PMNode[] = [];
    table.forEach((tableRow) => rows.push(withSwappedChildren(tableRow, cellIndex, cell)));
    moved = table.type.create(table.attrs, Fragment.fromArray(rows), table.marks);
  }

  const tr = editor.state.tr.replaceWith(pos, pos + table.nodeSize, moved);
  tr.setSelection(TextSelection.near(tr.doc.resolve(cellStart(moved, pos, row, cell))));
  editor.view.dispatch(tr);
  editor.commands.focus();
}
