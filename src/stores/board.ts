import { create } from "zustand";
import type {
  AutomationType,
  BoardFile,
  BoardState,
  Column,
  Note,
  NoteColor,
  NoteImage,
  NoteKind,
} from "@/lib/board-types";
import * as automations from "@/lib/board/automations";
import * as checklist from "@/lib/board/checklist";
import * as columns from "@/lib/board/columns";
import * as notes from "@/lib/board/notes";
import * as projects from "@/lib/board/projects";
import * as tags from "@/lib/board/tags";
import { createBoardSaver, loadState } from "@/lib/board/persistence";
import { createInitialState } from "@/lib/board/seed";

/**
 * Estado do quadro.
 *
 * As regras continuam nos módulos puros de `@/lib/board/*`; aqui só existe o
 * armazenamento e a seleção do que está ativo. As ações ficam agrupadas em
 * `actions` porque essa referência nunca muda — quem só age (a maioria dos
 * componentes) importa `boardActions` e não assina nada, então editar uma nota
 * não re-renderiza quem apenas tinha um botão.
 */

export type BoardActions = {
  hydrate: () => void;
  selectProject: (id: string | null) => void;
  selectFile: (projectId: string, fileId: string) => void;

  addProject: () => void;
  renameProject: (id: string, name: string) => void;
  removeProject: (id: string) => void;
  setProjectArchived: (id: string, archived: boolean) => void;

  addFile: (projectId: string) => void;
  renameFile: (projectId: string, fileId: string, name: string) => void;
  removeFile: (projectId: string, fileId: string) => void;
  setFileArchived: (projectId: string, fileId: string, archived: boolean) => void;

  addColumn: () => void;
  renameColumn: (columnId: string, title: string) => void;
  setColumnColor: (columnId: string, color: NoteColor | null) => void;
  duplicateColumn: (columnId: string) => void;
  removeColumn: (columnId: string) => void;
  restoreColumn: (column: Column, notes: Note[]) => void;
  reorderColumn: (activeId: string, overId: string) => void;
  moveColumnBy: (columnId: string, delta: number) => void;

  addAutomation: (type: AutomationType, value: string, columnId: string) => void;
  toggleAutomation: (id: string) => void;
  removeAutomation: (id: string) => void;

  addNote: (columnId: string, kind?: NoteKind) => string;
  updateNote: (noteId: string, patch: Partial<Note>) => void;
  setNoteArchived: (noteId: string, archived: boolean) => void;
  setNotePinned: (noteId: string, pinned: boolean) => void;
  removeNote: (noteId: string) => void;
  restoreNote: (note: Note) => void;
  duplicateNote: (noteId: string) => string | null;
  reorderNote: (activeId: string, overId: string) => void;
  moveNote: (noteId: string, columnId: string, beforeNoteId?: string) => void;
  setNoteDone: (noteId: string, done: boolean) => void;

  addTag: (name: string, color: NoteColor) => void;
  renameTag: (oldName: string, newName: string) => void;
  setTagColor: (name: string, color: NoteColor) => void;
  removeTag: (name: string) => void;

  addChecklistItem: (noteId: string, text: string) => void;
  updateChecklistItem: (
    noteId: string,
    itemId: string,
    patch: { text?: string; done?: boolean },
  ) => void;
  removeChecklistItem: (noteId: string, itemId: string) => void;

  addImage: (noteId: string, url: string, link?: string) => void;
  updateImage: (noteId: string, imageId: string, patch: Partial<NoteImage>) => void;
  removeImage: (noteId: string, imageId: string) => void;
};

type BoardSlice = {
  data: BoardState;
  hydrated: boolean;
  projectId: string | null;
  fileId: string | null;
  actions: BoardActions;
};

export const useBoard = create<BoardSlice>()((set, get) => {
  /** Aplica uma operação de domínio ao arquivo ativo. */
  const onFile = (fn: (file: BoardFile) => BoardFile) =>
    set((s) => ({ data: projects.mapActiveFile(s.data, s.projectId, s.fileId, fn) }));

  return {
    data: createInitialState(),
    hydrated: false,
    projectId: null,
    fileId: null,

    actions: {
      // Só no cliente e depois da montagem: ler o armazenamento durante o SSR
      // faria o HTML do servidor divergir do primeiro render do navegador.
      hydrate: () => set({ data: loadState(), hydrated: true }),
      selectProject: (id) => set({ projectId: id }),
      selectFile: (projectId, fileId) => set({ projectId, fileId }),

      addProject: () => set((s) => ({ data: projects.addProject(s.data) })),
      renameProject: (id, name) => set((s) => ({ data: projects.renameProject(s.data, id, name) })),
      removeProject: (id) => set((s) => ({ data: projects.removeProject(s.data, id) })),
      setProjectArchived: (id, archived) =>
        set((s) => ({ data: projects.setProjectArchived(s.data, id, archived) })),

      addFile: (projectId) => {
        const file = projects.createFile();
        set((s) => ({
          data: projects.addFile(s.data, projectId, file),
          projectId,
          fileId: file.id,
        }));
      },
      renameFile: (projectId, fileId, name) =>
        set((s) => ({ data: projects.renameFile(s.data, projectId, fileId, name) })),
      removeFile: (projectId, fileId) =>
        set((s) => ({ data: projects.removeFile(s.data, projectId, fileId) })),
      setFileArchived: (projectId, fileId, archived) =>
        set((s) => ({ data: projects.setFileArchived(s.data, projectId, fileId, archived) })),

      addColumn: () => onFile(columns.addColumn),
      renameColumn: (columnId, title) => onFile((f) => columns.renameColumn(f, columnId, title)),
      setColumnColor: (columnId, color) => onFile((f) => columns.setColumnColor(f, columnId, color)),
      duplicateColumn: (columnId) => onFile((f) => columns.duplicateColumn(f, columnId)),
      removeColumn: (columnId) => onFile((f) => columns.removeColumn(f, columnId)),
      restoreColumn: (column, restored) =>
        onFile((f) => columns.restoreColumn(f, column, restored)),
      reorderColumn: (activeId, overId) => onFile((f) => columns.reorderColumn(f, activeId, overId)),
      moveColumnBy: (columnId, delta) => onFile((f) => columns.moveColumnBy(f, columnId, delta)),

      addAutomation: (type, value, columnId) =>
        onFile((f) => automations.addAutomation(f, type, value, columnId)),
      toggleAutomation: (id) => onFile((f) => automations.toggleAutomation(f, id)),
      removeAutomation: (id) => onFile((f) => automations.removeAutomation(f, id)),

      addNote: (columnId, kind = "sticky") => {
        const note = notes.createNote(columnId, kind);
        onFile((f) => notes.addNote(f, note));
        return note.id;
      },
      updateNote: (noteId, patch) => onFile((f) => notes.patchNote(f, noteId, patch)),
      setNoteArchived: (noteId, archived) => onFile((f) => notes.patchNote(f, noteId, { archived })),
      setNotePinned: (noteId, pinned) => onFile((f) => notes.patchNote(f, noteId, { pinned })),
      removeNote: (noteId) => onFile((f) => notes.removeNote(f, noteId)),
      restoreNote: (note) => onFile((f) => notes.restoreNote(f, note)),
      duplicateNote: (noteId) => {
        let created: string | null = null;
        onFile((f) => {
          const result = notes.duplicateNote(f, noteId);
          created = result.id;
          return result.file;
        });
        return created;
      },
      reorderNote: (activeId, overId) => onFile((f) => notes.reorderNote(f, activeId, overId)),
      moveNote: (noteId, columnId, beforeNoteId) =>
        onFile((f) => notes.moveNote(f, noteId, columnId, beforeNoteId)),
      setNoteDone: (noteId, done) => onFile((f) => notes.setNoteDone(f, noteId, done)),

      addTag: (name, color) => onFile((f) => tags.addTag(f, name, color)),
      renameTag: (oldName, newName) => onFile((f) => tags.renameTag(f, oldName, newName)),
      setTagColor: (name, color) => onFile((f) => tags.setTagColor(f, name, color)),
      removeTag: (name) => onFile((f) => tags.removeTag(f, name)),

      addChecklistItem: (noteId, text) => onFile((f) => checklist.addChecklistItem(f, noteId, text)),
      updateChecklistItem: (noteId, itemId, patch) =>
        onFile((f) => checklist.updateChecklistItem(f, noteId, itemId, patch)),
      removeChecklistItem: (noteId, itemId) =>
        onFile((f) => checklist.removeChecklistItem(f, noteId, itemId)),

      addImage: (noteId, url, link = "") => onFile((f) => checklist.addImage(f, noteId, url, link)),
      updateImage: (noteId, imageId, patch) =>
        onFile((f) => checklist.updateImage(f, noteId, imageId, patch)),
      removeImage: (noteId, imageId) => onFile((f) => checklist.removeImage(f, noteId, imageId)),
    },
  };
});

/** Referência estável: importar não assina o store nem provoca re-render. */
export const boardActions = useBoard.getState().actions;

// ---------------------------------------------------------------------------
// Seletores. Todos devolvem objetos que já existem no estado, então a
// identidade só muda quando o dado muda de verdade.
// ---------------------------------------------------------------------------

const activeProject = (s: BoardSlice) => projects.resolveProject(s.data, s.projectId);
const activeFile = (s: BoardSlice) => projects.resolveFile(activeProject(s), s.fileId);

export const useBoardData = () => useBoard((s) => s.data);
export const useBoardHydrated = () => useBoard((s) => s.hydrated);
export const useProjects = () => useBoard((s) => s.data.projects);
export const useActiveProject = () => useBoard(activeProject);
export const useActiveFile = () => useBoard(activeFile);
export const useActiveProjectId = () => useBoard((s) => activeProject(s)?.id ?? null);
export const useActiveFileId = () => useBoard((s) => activeFile(s)?.id ?? null);
export const useFileColumns = () => useBoard((s) => activeFile(s)?.columns);
export const useFileTags = () => useBoard((s) => activeFile(s)?.tags);

/**
 * Arquivo ativo lido fora do ciclo de render — não a versão presa no
 * fechamento do último render.
 *
 * Existe para lógica que decide e age no mesmo instante, sem esperar o React
 * re-renderizar entre uma decisão e a próxima — como o `onDragOver` do drag
 * de notas: o dnd-kit remede o layout a cada quadro enquanto arrasta, e uma
 * remedição pode dispensar vários eventos antes do componente re-renderizar.
 * Uma decisão baseada num `file` capturado no closure do render anterior não
 * enxerga o movimento que acabou de ser aplicado, então repete a mesma ação —
 * e como aplicar a ação dispara nova remedição, isso realimenta a si mesmo.
 */
export function getActiveFile(): BoardFile | undefined {
  return activeFile(useBoard.getState());
}

export const useNote = (noteId: string | null) =>
  useBoard((s) => (noteId ? activeFile(s)?.notes.find((n) => n.id === noteId) : undefined));

// ---------------------------------------------------------------------------
// Efeitos do quadro, fora do React: persistência e automações reagem ao estado
// sem depender de nenhum componente estar montado.
// ---------------------------------------------------------------------------

if (typeof window !== "undefined") {
  const saver = createBoardSaver();

  useBoard.subscribe((s, prev) => {
    if (!s.hydrated || s.data === prev.data) return;
    saver.save(s.data);

    // Automações: mover as notas que passaram a casar com alguma regra ativa.
    // A rodada seguinte não encontra nada pendente, então isto não realimenta.
    const file = activeFile(s);
    if (!file) return;
    const moves = automations.pendingAutomationMoves(file);
    if (moves.size > 0)
      useBoard.setState((current) => ({
        data: projects.mapActiveFile(current.data, current.projectId, current.fileId, (f) =>
          automations.applyAutomationMoves(f, moves),
        ),
      }));
  });

  const flush = () => saver.flush();
  window.addEventListener("beforeunload", flush);
  document.addEventListener("visibilitychange", flush);
}
