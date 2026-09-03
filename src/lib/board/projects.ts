import {
  nativeColumns,
  uid,
  type BoardFile,
  type BoardState,
  type Project,
} from "@/lib/board-types";

/**
 * Projetos e arquivos. Os resolvedores abaixo são a *única* definição de "qual
 * projeto/arquivo está ativo": a UI e as ações usam a mesma regra, então o que
 * a tela mostra e o que a escrita altera nunca divergem.
 */

export function resolveProject(state: BoardState, projectId: string | null): Project | undefined {
  return (
    state.projects.find((p) => p.id === projectId) ??
    state.projects.find((p) => !p.archived) ??
    state.projects[0]
  );
}

export function resolveFile(project: Project | undefined, fileId: string | null): BoardFile | undefined {
  return (
    project?.files.find((f) => f.id === fileId) ??
    project?.files.find((f) => !f.archived) ??
    project?.files[0]
  );
}

/** Aplica `fn` ao arquivo ativo, preservando o resto do estado. */
export function mapActiveFile(
  state: BoardState,
  projectId: string | null,
  fileId: string | null,
  fn: (file: BoardFile) => BoardFile,
): BoardState {
  const project = resolveProject(state, projectId);
  const file = resolveFile(project, fileId);
  if (!project || !file) return state;
  return {
    projects: state.projects.map((p) =>
      p.id !== project.id
        ? p
        : { ...p, files: p.files.map((f) => (f.id === file.id ? fn(f) : f)) },
    ),
  };
}

export function addProject(state: BoardState): BoardState {
  return {
    projects: [
      ...state.projects,
      { id: uid(), name: "Novo projeto", files: [], archived: false } satisfies Project,
    ],
  };
}

export function renameProject(state: BoardState, id: string, name: string): BoardState {
  return { projects: state.projects.map((p) => (p.id === id ? { ...p, name } : p)) };
}

export function removeProject(state: BoardState, id: string): BoardState {
  return { projects: state.projects.filter((p) => p.id !== id) };
}

export function setProjectArchived(state: BoardState, id: string, archived: boolean): BoardState {
  return { projects: state.projects.map((p) => (p.id === id ? { ...p, archived } : p)) };
}

export function createFile(name = "Novo arquivo"): BoardFile {
  return {
    id: uid(),
    name,
    columns: nativeColumns(),
    notes: [],
    tags: [],
    automations: [],
    archived: false,
  };
}

export function addFile(state: BoardState, projectId: string, file: BoardFile): BoardState {
  return {
    projects: state.projects.map((p) =>
      p.id === projectId ? { ...p, files: [...p.files, file] } : p,
    ),
  };
}

function mapFile(
  state: BoardState,
  pid: string,
  fid: string,
  fn: (f: BoardFile) => BoardFile,
): BoardState {
  return {
    projects: state.projects.map((p) =>
      p.id !== pid ? p : { ...p, files: p.files.map((f) => (f.id === fid ? fn(f) : f)) },
    ),
  };
}

export function renameFile(state: BoardState, pid: string, fid: string, name: string): BoardState {
  return mapFile(state, pid, fid, (f) => ({ ...f, name }));
}

export function setFileArchived(
  state: BoardState,
  pid: string,
  fid: string,
  archived: boolean,
): BoardState {
  return mapFile(state, pid, fid, (f) => ({ ...f, archived }));
}

export function removeFile(state: BoardState, pid: string, fid: string): BoardState {
  return {
    projects: state.projects.map((p) =>
      p.id !== pid ? p : { ...p, files: p.files.filter((f) => f.id !== fid) },
    ),
  };
}
