import { uid } from "@/lib/id";
import {
  collectTags,
  nativeKeyOf,
  type BoardFile,
  type Column,
  type Note,
} from "@/lib/board-types";

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
  return notes.map((n) => {
    const next = counters.get(n.columnId) ?? 0;
    counters.set(n.columnId, next + 1);
    return { ...n, order: next };
  });
}

/** Reordena pelo `order` persistido (por coluna) e reindexa. */
export function withOrder(notes: Note[]): Note[] {
  const groups = new Map<string, Array<{ n: Note; i: number }>>();
  notes.forEach((n, i) => {
    const list = groups.get(n.columnId) ?? [];
    list.push({ n, i });
    groups.set(n.columnId, list);
  });
  const out: Note[] = [];
  for (const list of groups.values()) {
    list.sort((a, b) => (a.n.order ?? a.i) - (b.n.order ?? b.i));
    out.push(...list.map((x) => x.n));
  }
  return reindex(out);
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
    assignee: "Walle Dev",
    assignees: ["Walle Dev"],
    updatedAt: Date.now(),
    tags: [],
    checklist: [],
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

/** Nota nova entra no topo da coluna. */
export function addNote(file: BoardFile, note: Note): BoardFile {
  return { ...file, notes: reindex([note, ...file.notes]) };
}

export function patchNote(file: BoardFile, noteId: string, patch: Partial<Note>): BoardFile {
  return {
    ...file,
    tags: patch.tags ? collectTags(patch.tags, file.tags) : file.tags,
    notes: file.notes.map((n) => (n.id === noteId ? { ...n, ...patch, updatedAt: Date.now() } : n)),
  };
}

export function removeNote(file: BoardFile, noteId: string): BoardFile {
  return { ...file, notes: file.notes.filter((n) => n.id !== noteId) };
}

export function restoreNote(file: BoardFile, note: Note): BoardFile {
  return { ...file, notes: reindex([note, ...file.notes]) };
}

/** Remove várias notas de uma vez (exclusão em massa). */
export function removeNotes(file: BoardFile, noteIds: string[]): BoardFile {
  const idSet = new Set(noteIds);
  return { ...file, notes: file.notes.filter((n) => !idSet.has(n.id)) };
}

/** Devolve várias notas removidas (desfazer exclusão em massa). */
export function restoreNotes(file: BoardFile, restored: Note[]): BoardFile {
  return { ...file, notes: reindex([...restored, ...file.notes]) };
}

export function duplicateNote(
  file: BoardFile,
  noteId: string,
): { file: BoardFile; id: string | null } {
  const source = file.notes.find((n) => n.id === noteId);
  if (!source) return { file, id: null };
  const clone: Note = {
    ...source,
    id: uid(),
    title: `${source.title || "Nota"} (cópia)`,
    pinned: false,
    updatedAt: Date.now(),
    order: -1,
  };
  const siblings = file.notes.filter((n) => n.columnId === source.columnId);
  const others = file.notes.filter((n) => n.columnId !== source.columnId);
  siblings.splice(siblings.findIndex((n) => n.id === noteId) + 1, 0, clone);
  return {
    file: { ...file, notes: [...others, ...siblings].map((n, i) => ({ ...n, order: i })) },
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
  const moving = file.notes.find((n) => n.id === noteId);
  if (!moving) return file;
  const rest = file.notes.filter((n) => n.id !== noteId);
  const updated = syncColumnStatus({ ...moving, columnId }, file.columns);
  const idx = beforeNoteId ? rest.findIndex((n) => n.id === beforeNoteId) : -1;
  if (idx === -1) rest.push(updated);
  else rest.splice(idx, 0, updated);
  return { ...file, notes: reindex(rest) };
}

/** Coloca a nota arrastada na posição da nota sob o cursor. */
export function reorderNote(file: BoardFile, activeId: string, overId: string): BoardFile {
  const from = file.notes.findIndex((n) => n.id === activeId);
  const to = file.notes.findIndex((n) => n.id === overId);
  if (from < 0 || to < 0 || from === to) return file;
  const columnId = file.notes[to]!.columnId;
  const notes = [...file.notes];
  const [moving] = notes.splice(from, 1);
  notes.splice(to, 0, syncColumnStatus({ ...moving!, columnId }, file.columns));
  return { ...file, notes: reindex(notes) };
}

/** Marca/desmarca como concluída, movendo de/para a coluna nativa "Concluído". */
export function setNoteDone(file: BoardFile, noteId: string, done: boolean): BoardFile {
  const doneCol = file.columns.find((c) => c.native === "done");
  const backlog = file.columns.find((c) => c.native === "backlog");
  return {
    ...file,
    notes: reindex(
      file.notes.map((n) => {
        if (n.id !== noteId) return n;
        if (done)
          return {
            ...n,
            status: "done" as const,
            columnId: doneCol?.id ?? n.columnId,
            updatedAt: Date.now(),
          };
        const leavingDone = doneCol && n.columnId === doneCol.id;
        return {
          ...n,
          status: "pending" as const,
          columnId: leavingDone ? (backlog?.id ?? n.columnId) : n.columnId,
          updatedAt: Date.now(),
        };
      }),
    ),
  };
}
