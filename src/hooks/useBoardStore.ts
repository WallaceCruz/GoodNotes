import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createInitialState,
  matchesAutomation,
  uid,
  type Automation,
  type AutomationType,
  type BoardFile,
  type BoardState,
  type Column,
  type Note,
  type NoteImage,
  type NoteColor,
  type NoteKind,
  type Project,
  type TagDef,
  collectTags,
  ensureNativeColumns,
  nativeColumns,
} from "@/lib/board-types";

const STORAGE_KEY = "sticky-kanban-v1";

function reindex(notes: Note[]): Note[] {
  const counters = new Map<string, number>();
  return notes.map((n) => {
    const next = counters.get(n.columnId) ?? 0;
    counters.set(n.columnId, next + 1);
    return { ...n, order: next };
  });
}

// Reordena pelo campo persistido `order` (por coluna) e reindexa para manter posições estáveis.
function withOrder(notes: Note[]): Note[] {
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


function normalize(s: BoardState): BoardState {
  return {
    projects: (s.projects ?? []).map((p) => ({
      ...p,
      archived: p.archived ?? false,
      files: (p.files ?? []).map((f) => ({
        ...f,
        archived: f.archived ?? false,
        columns: ensureNativeColumns(f.columns ?? []),
        automations: f.automations ?? [],
        tags: collectTags(
          (f.notes ?? []).flatMap((n) => n.tags ?? []),
          f.tags ?? [],
        ),
        notes: withOrder(f.notes ?? []).map((n) => ({
          ...n,
          tags: n.tags ?? [],
          checklist: n.checklist ?? [],
          images: n.images ?? [],
          priority: n.priority ?? null,
          deadline: n.deadline ?? null,
          archived: n.archived ?? false,
          pinned: n.pinned ?? false,
          kind: n.kind ?? "sticky",
          assignee: n.assignee ?? n.author ?? null,
          showChecklist: n.showChecklist ?? (n.checklist?.length ?? 0) > 0,
        })),
      })),
    })),
  };
}

export function useBoardStore() {
  const [state, setState] = useState<BoardState>(() => createInitialState());
  const [hydrated, setHydrated] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(normalize(JSON.parse(raw) as BoardState));
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const project: Project | undefined =
    state.projects.find((p) => p.id === projectId) ??
    state.projects.find((p) => !p.archived) ??
    state.projects[0];
  const file: BoardFile | undefined =
    project?.files.find((f) => f.id === fileId) ??
    project?.files.find((f) => !f.archived) ??
    project?.files[0];

  const updateFile = useCallback(
    (fn: (f: BoardFile) => BoardFile) => {
      if (!project || !file) return;
      setState((s) => ({
        projects: s.projects.map((p) =>
          p.id !== project.id
            ? p
            : { ...p, files: p.files.map((f) => (f.id === file.id ? fn(f) : f)) },
        ),
      }));
    },
    [project, file],
  );

  const updateNote = useCallback(
    (noteId: string, patch: Partial<Note>) =>
      updateFile((f) => ({
        ...f,
        tags: patch.tags ? collectTags(patch.tags, f.tags) : f.tags,
        notes: f.notes.map((n) =>
          n.id === noteId ? { ...n, ...patch, updatedAt: Date.now() } : n,
        ),
      })),
    [updateFile],
  );

  // Automações: move notas entre colunas conforme regras ativas.
  useEffect(() => {
    if (!hydrated || !file) return;
    const rules = file.automations.filter((r) => r.enabled);
    if (rules.length === 0) return;
    const moves = new Map<string, string>();
    for (const n of file.notes) {
      if (n.archived) continue;
      for (const r of rules) {
        if (!file.columns.some((c) => c.id === r.columnId)) continue;
        if (matchesAutomation(r, n) && n.columnId !== r.columnId) {
          moves.set(n.id, r.columnId);
          break;
        }
      }
    }
    if (moves.size === 0) return;
    updateFile((f) => ({
      ...f,
      notes: f.notes.map((n) => (moves.has(n.id) ? { ...n, columnId: moves.get(n.id)! } : n)),
    }));
  }, [file, hydrated, updateFile]);

  const api = useMemo(
    () => ({
      addProject: () =>
        setState((s) => ({
          projects: [
            ...s.projects,
            { id: uid(), name: "Novo projeto", files: [], archived: false } satisfies Project,
          ],
        })),
      renameProject: (id: string, name: string) =>
        setState((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, name } : p)),
        })),
      removeProject: (id: string) =>
        setState((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),
      setProjectArchived: (id: string, archived: boolean) =>
        setState((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, archived } : p)),
        })),
      addFile: (pid: string) => {
        const newFile: BoardFile = {
          id: uid(),
          name: "Novo arquivo",
          columns: nativeColumns(),
          notes: [],
          tags: [],
          automations: [],
          archived: false,
        };
        setState((s) => ({
          projects: s.projects.map((p) =>
            p.id === pid ? { ...p, files: [...p.files, newFile] } : p,
          ),
        }));
        setProjectId(pid);
        setFileId(newFile.id);
      },
      renameFile: (pid: string, fid: string, name: string) =>
        setState((s) => ({
          projects: s.projects.map((p) =>
            p.id !== pid
              ? p
              : { ...p, files: p.files.map((f) => (f.id === fid ? { ...f, name } : f)) },
          ),
        })),
      removeFile: (pid: string, fid: string) =>
        setState((s) => ({
          projects: s.projects.map((p) =>
            p.id !== pid ? p : { ...p, files: p.files.filter((f) => f.id !== fid) },
          ),
        })),
      setFileArchived: (pid: string, fid: string, archived: boolean) =>
        setState((s) => ({
          projects: s.projects.map((p) =>
            p.id !== pid
              ? p
              : { ...p, files: p.files.map((f) => (f.id === fid ? { ...f, archived } : f)) },
          ),
        })),

      addColumn: () =>
        updateFile((f) => ({
          ...f,
          columns: [...f.columns, { id: uid(), title: "Nova coluna" }],
        })),
      renameColumn: (cid: string, title: string) =>
        updateFile((f) => ({
          ...f,
          columns: f.columns.map((c) => (c.id === cid ? { ...c, title } : c)),
        })),
      setColumnColor: (cid: string, color: NoteColor | null) =>
        updateFile((f) => ({
          ...f,
          columns: f.columns.map((c) => (c.id === cid ? { ...c, color } : c)),
        })),
      duplicateColumn: (cid: string) =>
        updateFile((f) => {
          const index = f.columns.findIndex((c) => c.id === cid);
          const source = f.columns[index];
          if (!source) return f;
          const clone: Column = {
            ...source,
            id: uid(),
            native: null,
            title: `${source.title} (cópia)`,
          };
          const columns = [...f.columns];
          columns.splice(index + 1, 0, clone);
          const copies = f.notes
            .filter((n) => n.columnId === cid)
            .map((n) => ({ ...n, id: uid(), columnId: clone.id }));
          return { ...f, columns, notes: reindex([...f.notes, ...copies]) };
        }),
      removeColumn: (cid: string) =>
        updateFile((f) => {
          const target = f.columns.find((c) => c.id === cid);
          if (!target || target.native) return f;
          return {
          ...f,
          columns: f.columns.filter((c) => c.id !== cid),
          notes: f.notes.filter((n) => n.columnId !== cid),
          automations: f.automations.filter((a) => a.columnId !== cid),
          };
        }),

      addAutomation: (type: AutomationType, value: string, columnId: string) =>
        updateFile((f) => ({
          ...f,
          automations: [
            ...f.automations,
            { id: uid(), type, value, columnId, enabled: true } satisfies Automation,
          ],
        })),
      toggleAutomation: (id: string) =>
        updateFile((f) => ({
          ...f,
          automations: f.automations.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
        })),
      removeAutomation: (id: string) =>
        updateFile((f) => ({ ...f, automations: f.automations.filter((a) => a.id !== id) })),

      addNote: (columnId: string, kind: NoteKind = "sticky") => {
        const note: Note = {
          id: uid(),
          columnId,
          kind,
          title: kind === "notepad" ? "Novo bloco de notas" : "Nova nota",
          content: "",
          color: kind === "notepad" ? "slate" : "amber",
          author: "Você",
          assignee: "Walle Dev",
          updatedAt: Date.now(),
          tags: [],
          checklist: [],
          showChecklist: false,
          images: [],
          priority: null,
          deadline: null,
          archived: false,
          order: -1,
        };
        updateFile((f) => ({ ...f, notes: reindex([note, ...f.notes]) }));
        return note.id;
      },
      updateNote,
      setNoteArchived: (noteId: string, archived: boolean) =>
        updateFile((f) => ({
          ...f,
          notes: f.notes.map((n) => (n.id === noteId ? { ...n, archived } : n)),
        })),
      setNotePinned: (noteId: string, pinned: boolean) =>
        updateFile((f) => ({
          ...f,
          notes: f.notes.map((n) => (n.id === noteId ? { ...n, pinned } : n)),
        })),
      removeNote: (noteId: string) =>
        updateFile((f) => ({ ...f, notes: f.notes.filter((n) => n.id !== noteId) })),
      restoreNote: (note: Note) =>
        updateFile((f) => ({ ...f, notes: reindex([note, ...f.notes]) })),

      addTag: (name: string, color: NoteColor) =>
        updateFile((f) => {
          const clean = name.trim().toLowerCase();
          if (!clean || f.tags.some((t) => t.name === clean)) return f;
          return { ...f, tags: [...f.tags, { name: clean, color } satisfies TagDef] };
        }),
      renameTag: (oldName: string, newName: string) =>
        updateFile((f) => {
          const clean = newName.trim().toLowerCase();
          if (!clean || clean === oldName) return f;
          return {
            ...f,
            tags: f.tags
              .map((t) => (t.name === oldName ? { ...t, name: clean } : t))
              .filter((t, i, arr) => arr.findIndex((x) => x.name === t.name) === i),
            notes: f.notes.map((n) =>
              n.tags.includes(oldName)
                ? { ...n, tags: Array.from(new Set(n.tags.map((t) => (t === oldName ? clean : t)))) }
                : n,
            ),
            automations: f.automations.map((a) =>
              a.type === "tag" && a.value === oldName ? { ...a, value: clean } : a,
            ),
          };
        }),
      setTagColor: (name: string, color: NoteColor) =>
        updateFile((f) => ({
          ...f,
          tags: f.tags.map((t) => (t.name === name ? { ...t, color } : t)),
        })),
      removeTag: (name: string) =>
        updateFile((f) => ({
          ...f,
          tags: f.tags.filter((t) => t.name !== name),
          notes: f.notes.map((n) =>
            n.tags.includes(name) ? { ...n, tags: n.tags.filter((t) => t !== name) } : n,
          ),
          automations: f.automations.filter((a) => !(a.type === "tag" && a.value === name)),
        })),
      restoreColumn: (column: Column, notes: Note[]) =>
        updateFile((f) => ({
          ...f,
          columns: [...f.columns, column],
          notes: reindex([...notes, ...f.notes]),
        })),
      reorderNote: (activeId: string, overId: string) =>
        updateFile((f) => {
          const from = f.notes.findIndex((n) => n.id === activeId);
          const to = f.notes.findIndex((n) => n.id === overId);
          if (from < 0 || to < 0 || from === to) return f;
          const columnId = f.notes[to]!.columnId;
          const notes = [...f.notes];
          const [moving] = notes.splice(from, 1);
          notes.splice(to, 0, { ...moving!, columnId });
          return { ...f, notes: reindex(notes) };
        }),
      moveNote: (noteId: string, columnId: string, beforeNoteId?: string) =>
        updateFile((f) => {
          const moving = f.notes.find((n) => n.id === noteId);
          if (!moving) return f;
          const rest = f.notes.filter((n) => n.id !== noteId);
          const updated = { ...moving, columnId };
          const idx = beforeNoteId ? rest.findIndex((n) => n.id === beforeNoteId) : -1;
          if (idx === -1) rest.push(updated);
          else rest.splice(idx, 0, updated);
          return { ...f, notes: reindex(rest) };
        }),

      addChecklistItem: (noteId: string, text: string) =>
        updateFile((f) => ({
          ...f,
          notes: f.notes.map((n) =>
            n.id === noteId
              ? { ...n, checklist: [...n.checklist, { id: uid(), text, done: false }] }
              : n,
          ),
        })),
      updateChecklistItem: (
        noteId: string,
        itemId: string,
        patch: { text?: string; done?: boolean },
      ) =>
        updateFile((f) => ({
          ...f,
          notes: f.notes.map((n) =>
            n.id === noteId
              ? {
                  ...n,
                  checklist: n.checklist.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
                }
              : n,
          ),
        })),
      removeChecklistItem: (noteId: string, itemId: string) =>
        updateFile((f) => ({
          ...f,
          notes: f.notes.map((n) =>
            n.id === noteId ? { ...n, checklist: n.checklist.filter((i) => i.id !== itemId) } : n,
          ),
        })),

      addImage: (noteId: string, url: string, link = "") =>
        updateFile((f) => ({
          ...f,
          notes: f.notes.map((n) =>
            n.id === noteId ? { ...n, images: [...n.images, { id: uid(), url, link }] } : n,
          ),
        })),
      updateImage: (noteId: string, imageId: string, patch: Partial<NoteImage>) =>
        updateFile((f) => ({
          ...f,
          notes: f.notes.map((n) =>
            n.id === noteId
              ? { ...n, images: n.images.map((i) => (i.id === imageId ? { ...i, ...patch } : i)) }
              : n,
          ),
        })),
      removeImage: (noteId: string, imageId: string) =>
        updateFile((f) => ({
          ...f,
          notes: f.notes.map((n) =>
            n.id === noteId ? { ...n, images: n.images.filter((i) => i.id !== imageId) } : n,
          ),
        })),

    }),
    [updateFile, updateNote],
  );

  return {
    state,
    hydrated,
    project,
    file,
    selectProject: setProjectId,
    selectFile: (pid: string, fid: string) => {
      setProjectId(pid);
      setFileId(fid);
    },
    ...api,
  };
}

export type BoardStore = ReturnType<typeof useBoardStore>;
