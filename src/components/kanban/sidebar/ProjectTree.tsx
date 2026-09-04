import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
} from "lucide-react";
import { boardActions, useActiveFileId, useProjects } from "@/stores/board";
import { cn } from "@/lib/utils";
import { ACTION, ICON, NameTooltip, ROW } from "./sidebar-ui";
import type { BoardFile, Project } from "@/lib/board-types";

/**
 * Um projeto entra na lista se ele mesmo casa com a busca ou se algum arquivo
 * dele casa — senão digitar o nome de um arquivo esconderia o projeto que o
 * contém.
 */
function matchesProject(project: Project, term: string): boolean {
  if (!term) return true;
  return (
    project.name.toLowerCase().includes(term) ||
    project.files.some((file) => file.name.toLowerCase().includes(term))
  );
}

function matchesFile(file: BoardFile, term: string): boolean {
  return !term || file.name.toLowerCase().includes(term);
}

/** Árvore de projetos e arquivos, com renomear, arquivar e excluir na linha. */
export function ProjectTree({ query, showArchived }: { query: string; showArchived: boolean }) {
  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({});
  const projects = useProjects();
  const activeFileId = useActiveFileId();

  const term = query.trim().toLowerCase();
  // Durante uma busca tudo fica aberto: esconder o resultado dentro de um
  // projeto recolhido faria a busca parecer quebrada.
  const isExpanded = (id: string) => (term ? true : (collapsedIds[id] ?? true));

  const visibleProjects = projects
    .filter((project) => showArchived || !project.archived)
    .filter((project) => matchesProject(project, term));

  return (
    <>
      <div className="mt-5 flex items-center justify-between px-4">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Meus projetos
        </span>
        <button
          onClick={boardActions.addProject}
          aria-label="Adicionar projeto"
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="scroll-thin mt-1 flex-1 overflow-y-auto px-2 pb-4">
        {visibleProjects.map((project) => {
          const expanded = isExpanded(project.id);
          const hasActiveFile = project.files.some((file) => activeFileId === file.id);
          const files = project.files
            .filter((file) => showArchived || !file.archived)
            .filter((file) => matchesFile(file, term));

          return (
            <div key={project.id} className={cn("mt-0.5", project.archived && "opacity-60")}>
              <div
                className={cn(
                  ROW,
                  "hover:bg-sidebar-accent/70",
                  hasActiveFile && "bg-sidebar-accent/40",
                )}
              >
                <button
                  onClick={() =>
                    setCollapsedIds((current) => ({ ...current, [project.id]: !expanded }))
                  }
                  aria-label={expanded ? "Recolher projeto" : "Expandir projeto"}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
                >
                  {expanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                {expanded ? (
                  <FolderOpen className={cn(ICON, "text-muted-foreground")} />
                ) : (
                  <Folder className={cn(ICON, "text-muted-foreground")} />
                )}
                <NameTooltip name={project.name}>
                  <input
                    value={project.name}
                    onChange={(e) => boardActions.renameProject(project.id, e.target.value)}
                    title={project.name}
                    className="min-w-0 flex-1 truncate bg-transparent text-sm font-medium outline-none"
                  />
                </NameTooltip>
                <button
                  onClick={() => boardActions.addFile(project.id)}
                  aria-label="Adicionar arquivo"
                  className={ACTION}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => boardActions.setProjectArchived(project.id, !project.archived)}
                  aria-label={project.archived ? "Restaurar projeto" : "Arquivar projeto"}
                  className={ACTION}
                >
                  {project.archived ? (
                    <ArchiveRestore className="h-3.5 w-3.5" />
                  ) : (
                    <Archive className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  onClick={() => boardActions.removeProject(project.id)}
                  aria-label="Excluir projeto"
                  className={ACTION}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {expanded &&
                files.map((file) => {
                  const selected = activeFileId === file.id;
                  return (
                    <div
                      key={file.id}
                      onClick={() => boardActions.selectFile(project.id, file.id)}
                      className={cn(
                        ROW,
                        "relative ml-6 w-[calc(100%-1.5rem)] cursor-pointer hover:bg-sidebar-accent/70",
                        selected &&
                          "bg-sidebar-accent font-medium text-foreground before:absolute before:bottom-1.5 before:left-0 before:top-1.5 before:w-0.5 before:rounded-full before:bg-primary",
                        file.archived && "opacity-60",
                      )}
                    >
                      <FileText
                        className={cn(ICON, selected ? "text-primary" : "text-muted-foreground")}
                      />
                      <NameTooltip name={file.name}>
                        <input
                          value={file.name}
                          onChange={(e) =>
                            boardActions.renameFile(project.id, file.id, e.target.value)
                          }
                          title={file.name}
                          className="min-w-0 flex-1 truncate bg-transparent outline-none"
                        />
                      </NameTooltip>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          boardActions.setFileArchived(project.id, file.id, !file.archived);
                        }}
                        aria-label={file.archived ? "Restaurar arquivo" : "Arquivar arquivo"}
                        className={ACTION}
                      >
                        {file.archived ? (
                          <ArchiveRestore className="h-3.5 w-3.5" />
                        ) : (
                          <Archive className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          boardActions.removeFile(project.id, file.id);
                        }}
                        aria-label="Excluir arquivo"
                        className={ACTION}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>
    </>
  );
}
