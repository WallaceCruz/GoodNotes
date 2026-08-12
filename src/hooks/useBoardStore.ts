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
  type Project,
} from "@/lib/board-types";

const STORAGE_KEY = "sticky-kanban-v1";

function normalize(s: BoardState): BoardState {
  return {
    projects: (s.projects ?? []).map((p) => ({
      ...p,
      archived: p.archived ?? false,
      files: (p.files ?? []).map((f) => ({
        ...f,
        archived: f.archived ?? false,
        automations: f.automations ?? [],
        notes: (f.notes ?? []).map((n) => ({
          ...n,
          tags: n.tags ?? [],
          checklist: n.checklist ?? [],
          images: n.images ?? [],
          priority: n.priority ?? null,
          deadline: n.deadline ?? null,
          archived: n.archived ?? false,
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
          columns: [
            { id: uid(), title: "Backlog" },
            { id: uid(), title: "Fazendo" },
            { id: uid(), title: "Feito" },
          ],
          notes: [],
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
      removeColumn: (cid: string) =>
        updateFile((f) => ({
          ...f,
          columns: f.columns.filter((c) => c.id !== cid),
          notes: f.notes.filter((n) => n.columnId !== cid),
          automations: f.automations.filter((a) => a.columnId !== cid),
        })),

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

      addNote: (columnId: string) => {
        const note: Note = {
          id: uid(),
          columnId,
          title: "Nova nota",
          content: "",
          color: "amber",
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
        };
        updateFile((f) => ({ ...f, notes: [note, ...f.notes] }));
        return note.id;
      },
      updateNote,
      setNoteArchived: (noteId: string, archived: boolean) =>
        updateFile((f) => ({
          ...f,
          notes: f.notes.map((n) => (n.id === noteId ? { ...n, archived } : n)),
        })),
      removeNote: (noteId: string) =>
        updateFile((f) => ({ ...f, notes: f.notes.filter((n) => n.id !== noteId) })),
      restoreNote: (note: Note) => updateFile((f) => ({ ...f, notes: [note, ...f.notes] })),
      restoreColumn: (column: Column, notes: Note[]) =>
        updateFile((f) => ({
          ...f,
          columns: [...f.columns, column],
          notes: [...notes, ...f.notes],
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
          return { ...f, notes };
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
          return { ...f, notes: rest };
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
