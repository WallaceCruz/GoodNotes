import { uid } from "@/lib/id";
import { type BoardFile, type BoardState, type Project } from "@/lib/board/model";
import { nativeColumns } from "@/lib/board/native-columns";

/**
 * Projetos e arquivos. Os resolvedores abaixo são a *única* definição de "qual
 * projeto/arquivo está ativo": a UI e as ações usam a mesma regra, então o que
 * a tela mostra e o que a escrita altera nunca divergem.
 */

export function resolveProject(state: BoardState, projectId: string | null): Project | undefined {
  return (
    state.projects.find((project) => project.id === projectId) ??
    state.projects.find((project) => !project.archived) ??
    state.projects[0]
  );
}

export function resolveFile(
  project: Project | undefined,
  fileId: string | null,
): BoardFile | undefined {
  return (
    project?.files.find((file) => file.id === fileId) ??
    project?.files.find((file) => !file.archived) ??
    project?.files[0]
  );
}

/** Aplica `transform` a um arquivo identificado, preservando o resto do estado. */
function mapFile(
  state: BoardState,
  projectId: string,
  fileId: string,
  transform: (file: BoardFile) => BoardFile,
): BoardState {
  return {
    projects: state.projects.map((project) =>
      project.id !== projectId
        ? project
        : {
            ...project,
            files: project.files.map((file) => (file.id === fileId ? transform(file) : file)),
          },
    ),
  };
}

/** O mesmo, para o arquivo ativo — que os resolvedores acima decidem qual é. */
export function mapActiveFile(
  state: BoardState,
  projectId: string | null,
  fileId: string | null,
  transform: (file: BoardFile) => BoardFile,
): BoardState {
  const activeProject = resolveProject(state, projectId);
  const activeFile = resolveFile(activeProject, fileId);
  if (!activeProject || !activeFile) return state;
  return mapFile(state, activeProject.id, activeFile.id, transform);
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
  return {
    projects: state.projects.map((project) => (project.id === id ? { ...project, name } : project)),
  };
}

export function removeProject(state: BoardState, id: string): BoardState {
  return { projects: state.projects.filter((project) => project.id !== id) };
}

export function setProjectArchived(state: BoardState, id: string, archived: boolean): BoardState {
  return {
    projects: state.projects.map((project) =>
      project.id === id ? { ...project, archived } : project,
    ),
  };
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
    projects: state.projects.map((project) =>
      project.id === projectId ? { ...project, files: [...project.files, file] } : project,
    ),
  };
}

export function renameFile(
  state: BoardState,
  projectId: string,
  fileId: string,
  name: string,
): BoardState {
  return mapFile(state, projectId, fileId, (file) => ({ ...file, name }));
}

export function setFileArchived(
  state: BoardState,
  projectId: string,
  fileId: string,
  archived: boolean,
): BoardState {
  return mapFile(state, projectId, fileId, (file) => ({ ...file, archived }));
}

export function removeFile(state: BoardState, projectId: string, fileId: string): BoardState {
  return {
    projects: state.projects.map((project) =>
      project.id !== projectId
        ? project
        : { ...project, files: project.files.filter((file) => file.id !== fileId) },
    ),
  };
}
