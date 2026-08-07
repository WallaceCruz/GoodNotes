import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createInitialState,
  uid,
  type BoardFile,
  type BoardState,
  type Note,
  type NoteColor,
  type Project,
} from "@/lib/board-types";

const STORAGE_KEY = "sticky-kanban-v1";

export function useBoardStore() {
  const [state, setState] = useState<BoardState>(() => createInitialState());
  const [hydrated, setHydrated] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw) as BoardState);
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
    state.projects.find((p) => p.id === projectId) ?? state.projects[0];
  const file: BoardFile | undefined =
    project?.files.find((f) => f.id === fileId) ?? project?.files[0];

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

  const api = useMemo(
    () => ({
      addProject: () =>
        setState((s) => ({
          projects: [
            ...s.projects,
            { id: uid(), name: "Novo projeto", files: [] } satisfies Project,
          ],
        })),
      renameProject: (id: string, name: string) =>
        setState((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, name } : p)),
        })),
      removeProject: (id: string) =>
        setState((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),
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
        })),

      addNote: (columnId: string) => {
        const note: Note = {
          id: uid(),
          columnId,
          title: "Nova nota",
          content: "",
          color: "amber",
          author: "Você",
          updatedAt: Date.now(),
          subnotes: [],
        };
        updateFile((f) => ({ ...f, notes: [note, ...f.notes] }));
        return note.id;
      },
      updateNote,
      removeNote: (noteId: string) =>
        updateFile((f) => ({ ...f, notes: f.notes.filter((n) => n.id !== noteId) })),
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

      addSubnote: (noteId: string, text: string, color: NoteColor) =>
        updateFile((f) => ({
          ...f,
          notes: f.notes.map((n) =>
            n.id === noteId
              ? {
                  ...n,
                  updatedAt: Date.now(),
                  subnotes: [...n.subnotes, { id: uid(), text, color }],
                }
              : n,
          ),
        })),
      updateSubnote: (noteId: string, subId: string, text: string) =>
        updateFile((f) => ({
          ...f,
          notes: f.notes.map((n) =>
            n.id === noteId
              ? {
                  ...n,
                  subnotes: n.subnotes.map((s) => (s.id === subId ? { ...s, text } : s)),
                }
              : n,
          ),
        })),
      removeSubnote: (noteId: string, subId: string) =>
        updateFile((f) => ({
          ...f,
          notes: f.notes.map((n) =>
            n.id === noteId
              ? { ...n, subnotes: n.subnotes.filter((s) => s.id !== subId) }
              : n,
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
