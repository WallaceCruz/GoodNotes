import { uid } from "@/lib/id";
import { DAY_MS } from "@/lib/date";
import { type BoardFile, type Column, type Note } from "@/lib/board/model";
import { nativeKeyOf } from "@/lib/board/native-columns";
import { collectTags } from "@/lib/board/tags";
import { escapeHtml } from "@/lib/html";

/**
 * Operações de nota. Funções puras sobre `BoardFile`: nada de React aqui, para
 * que a regra possa ser lida, reusada e testada sem montar a árvore.
 */

/** Mantém o status da nota coerente com a coluna nativa de destino. */
export function syncColumnStatus(note: Note, columns: Column[]): Note {
  const key = nativeKeyOf(columns, note.columnId);
  if (key === "done") return { ...note, status: "done" };
  if (key === "doing") return { ...note, status: "doing" };
  if (note.status === "done") return { ...note, status: null };
  return note;
}

/** Renumera `order` por coluna, mantendo a ordem atual do array. */
export function reindex(notes: Note[]): Note[] {
  const counters = new Map<string, number>();
  return notes.map((note) => {
    const next = counters.get(note.columnId) ?? 0;
    counters.set(note.columnId, next + 1);
    return { ...note, order: next };
  });
}

/** Reordena pelo `order` persistido (por coluna) e reindexa. */
export function withOrder(notes: Note[]): Note[] {
  // O índice original é o desempate: notas sem `order` mantêm a ordem em que vieram.
  const byColumn = new Map<string, Array<{ note: Note; index: number }>>();
  notes.forEach((note, index) => {
    const list = byColumn.get(note.columnId) ?? [];
    list.push({ note, index });
    byColumn.set(note.columnId, list);
  });

  const ordered: Note[] = [];
  for (const list of byColumn.values()) {
    list.sort((a, b) => (a.note.order ?? a.index) - (b.note.order ?? b.index));
    ordered.push(...list.map((entry) => entry.note));
  }
  return reindex(ordered);
}

export function createNote(columnId: string): Note {
  return {
    id: uid(),
    columnId,
    title: "Nova nota",
    content: "",
    contentBelow: "",
    color: "white",
    author: "Você",
    assignee: "Você",
    assignees: ["Você"],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: [],
    checklist: [],
    comments: [],
    attachments: [],
    showChecklist: false,
    images: [],
    priority: null,
    status: null,
    category: null,
    deadline: null,
    archived: false,
    order: -1,
  };
}

/**
 * Nota criada a partir de texto puro — o formato que o assistente devolve.
 *
 * O editor guarda HTML, então parágrafos em branco viram <p> e quebras
 * simples viram <br>; sem isso o texto chegaria numa linha só.
 */
export function fromPlainText(columnId: string, title: string, body: string, tags: string[]): Note {
  const html = body
    .split(/\n{2,}/)
    .map((paragrafo) => `<p>${escapeHtml(paragrafo).replace(/\n/g, "<br>")}</p>`)
    .join("");
  return {
    ...createNote(columnId),
    title,
    content: html,
    ...(tags.length ? { tags } : {}),
  };
}

/** Nota nova entra no topo da coluna. */
export function addNote(file: BoardFile, note: Note): BoardFile {
  return { ...file, notes: reindex([note, ...file.notes]) };
}

export function patchNote(file: BoardFile, noteId: string, patch: Partial<Note>): BoardFile {
  return {
    ...file,
    tags: patch.tags ? collectTags(patch.tags, file.tags) : file.tags,
    notes: file.notes.map((note) =>
      note.id === noteId ? { ...note, ...patch, updatedAt: Date.now() } : note,
    ),
  };
}

export function removeNote(file: BoardFile, noteId: string): BoardFile {
  return { ...file, notes: file.notes.filter((note) => note.id !== noteId) };
}

export function restoreNote(file: BoardFile, note: Note): BoardFile {
  return { ...file, notes: reindex([note, ...file.notes]) };
}

/** Remove várias notas de uma vez (exclusão em massa). */
export function removeNotes(file: BoardFile, noteIds: string[]): BoardFile {
  const idSet = new Set(noteIds);
  return { ...file, notes: file.notes.filter((note) => !idSet.has(note.id)) };
}

/** Devolve várias notas removidas (desfazer exclusão em massa). */
export function restoreNotes(file: BoardFile, restored: Note[]): BoardFile {
  return { ...file, notes: reindex([...restored, ...file.notes]) };
}

export function duplicateNote(
  file: BoardFile,
  noteId: string,
): { file: BoardFile; id: string | null } {
  const source = file.notes.find((note) => note.id === noteId);
  if (!source) return { file, id: null };
  const clone: Note = {
    ...source,
    id: uid(),
    title: `${source.title || "Nota"} (cópia)`,
    pinned: false,
    updatedAt: Date.now(),
    order: -1,
  };
  const siblings = file.notes.filter((note) => note.columnId === source.columnId);
  const others = file.notes.filter((note) => note.columnId !== source.columnId);
  siblings.splice(siblings.findIndex((note) => note.id === noteId) + 1, 0, clone);
  return {
    file: { ...file, notes: [...others, ...siblings].map((note, i) => ({ ...note, order: i })) },
    id: clone.id,
  };
}

/** Move a nota para outra coluna, opcionalmente antes de uma nota específica. */
export function moveNote(
  file: BoardFile,
  noteId: string,
  columnId: string,
  beforeNoteId?: string,
): BoardFile {
  const moving = file.notes.find((note) => note.id === noteId);
  if (!moving) return file;
  const rest = file.notes.filter((note) => note.id !== noteId);
  const updated = syncColumnStatus({ ...moving, columnId }, file.columns);
  const idx = beforeNoteId ? rest.findIndex((note) => note.id === beforeNoteId) : -1;
  if (idx === -1) rest.push(updated);
  else rest.splice(idx, 0, updated);
  return { ...file, notes: reindex(rest) };
}

/** Coloca a nota arrastada na posição da nota sob o cursor. */
export function reorderNote(file: BoardFile, activeId: string, overId: string): BoardFile {
  const from = file.notes.findIndex((note) => note.id === activeId);
  const to = file.notes.findIndex((note) => note.id === overId);
  if (from < 0 || to < 0 || from === to) return file;
  const columnId = file.notes[to]!.columnId;
  const notes = [...file.notes];
  const [moving] = notes.splice(from, 1);
  notes.splice(to, 0, syncColumnStatus({ ...moving!, columnId }, file.columns));
  return { ...file, notes: reindex(notes) };
}

/** Marca/desmarca como concluída, movendo de/para a coluna nativa "Concluído". */
export function setNoteDone(file: BoardFile, noteId: string, done: boolean): BoardFile {
  const doneCol = file.columns.find((column) => column.native === "done");
  const backlog = file.columns.find((column) => column.native === "backlog");
  return {
    ...file,
    notes: reindex(
      file.notes.map((note) => {
        if (note.id !== noteId) return note;
        if (done)
          return {
            ...note,
            status: "done" as const,
            columnId: doneCol?.id ?? note.columnId,
            updatedAt: Date.now(),
          };
        const leavingDone = doneCol && note.columnId === doneCol.id;
        return {
          ...note,
          status: "pending" as const,
          columnId: leavingDone ? (backlog?.id ?? note.columnId) : note.columnId,
          updatedAt: Date.now(),
        };
      }),
    ),
  };
}

/** Lista de responsáveis de uma nota (compatível com o campo legado `assignee`). */
export function noteAssignees(note: Pick<Note, "assignee" | "assignees">): string[] {
  if (note.assignees?.length) return note.assignees;
  return note.assignee ? [note.assignee] : [];
}

/** Intervalo (início/fim) de uma nota para a Linha do tempo. */
export function noteRange(
  note: Pick<Note, "startDate" | "deadline">,
): { start: number; end: number } | null {
  const anchor = note.deadline ?? note.startDate ?? null;
  if (!anchor) return null;
  const end = note.deadline ?? anchor;
  const start = note.startDate ?? end - DAY_MS;
  return { start: Math.min(start, end), end: Math.max(start, end) };
}
