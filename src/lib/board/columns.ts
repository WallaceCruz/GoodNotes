import { uid, type BoardFile, type Column, type Note, type NoteColor } from "@/lib/board-types";
import { reindex } from "./notes";

/** Move o item do índice `from` para o `to`, sem mutar o array original. */
export function moveAt<T>(list: T[], from: number, to: number): T[] {
  const out = [...list];
  const [moving] = out.splice(from, 1);
  out.splice(to, 0, moving!);
  return out;
}

export function addColumn(file: BoardFile): BoardFile {
  return { ...file, columns: [...file.columns, { id: uid(), title: "Nova coluna" }] };
}

export function renameColumn(file: BoardFile, cid: string, title: string): BoardFile {
  return {
    ...file,
    columns: file.columns.map((c) => (c.id === cid ? { ...c, title } : c)),
  };
}

export function setColumnColor(file: BoardFile, cid: string, color: NoteColor | null): BoardFile {
  return {
    ...file,
    columns: file.columns.map((c) => (c.id === cid ? { ...c, color } : c)),
  };
}

/** A cópia nunca é nativa: só uma coluna pode ocupar cada papel do fluxo. */
export function duplicateColumn(file: BoardFile, cid: string): BoardFile {
  const index = file.columns.findIndex((c) => c.id === cid);
  const source = file.columns[index];
  if (!source) return file;
  const clone: Column = { ...source, id: uid(), native: null, title: `${source.title} (cópia)` };
  const columns = [...file.columns];
  columns.splice(index + 1, 0, clone);
  const copies = file.notes
    .filter((n) => n.columnId === cid)
    .map((n) => ({ ...n, id: uid(), columnId: clone.id }));
  return { ...file, columns, notes: reindex([...file.notes, ...copies]) };
}

/** Colunas nativas do fluxo não são excluíveis. */
export function removeColumn(file: BoardFile, cid: string): BoardFile {
  const target = file.columns.find((c) => c.id === cid);
  if (!target || target.native) return file;
  return {
    ...file,
    columns: file.columns.filter((c) => c.id !== cid),
    notes: file.notes.filter((n) => n.columnId !== cid),
    automations: file.automations.filter((a) => a.columnId !== cid),
  };
}

export function restoreColumn(file: BoardFile, column: Column, notes: Note[]): BoardFile {
  return {
    ...file,
    columns: [...file.columns, column],
    notes: reindex([...notes, ...file.notes]),
  };
}

/** Reposiciona a coluna arrastada no índice da coluna sob o cursor. */
export function reorderColumn(file: BoardFile, activeId: string, overId: string): BoardFile {
  const from = file.columns.findIndex((c) => c.id === activeId);
  const to = file.columns.findIndex((c) => c.id === overId);
  if (from < 0 || to < 0 || from === to) return file;
  return { ...file, columns: moveAt(file.columns, from, to) };
}

/** Move a coluna uma posição para a esquerda (-1) ou direita (+1). */
export function moveColumnBy(file: BoardFile, cid: string, delta: number): BoardFile {
  const from = file.columns.findIndex((c) => c.id === cid);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= file.columns.length) return file;
  return { ...file, columns: moveAt(file.columns, from, to) };
}
