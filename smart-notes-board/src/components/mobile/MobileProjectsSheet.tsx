import { Check, FileText, Folder, Plus, X } from "lucide-react";
import { boardActions, useActiveFileId, useActiveProject, useProjects } from "@/stores/board";
import { cn } from "@/lib/utils";

/**
 * Projetos e arquivos, numa folha que sobe de baixo.
 *
 * No desktop isso é a barra lateral; no celular ela não cabe em permanência.
 * Como folha, aparece só quando pedida e devolve a tela inteira ao conteúdo —
 * e o alvo de toque de cada arquivo pode ser generoso.
 */
export function MobileProjectsSheet({ onClose }: { onClose: () => void }) {
  const projects = useProjects();
  const activeProject = useActiveProject();
  const activeFileId = useActiveFileId();

  const abrir = (projectId: string, fileId: string) => {
    boardActions.selectFile(projectId, fileId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        aria-label="Fechar projetos"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
      />

      <div className="relative max-h-[75vh] overflow-hidden rounded-t-2xl border-t border-border bg-background pb-[env(safe-area-inset-bottom)] shadow-2xl">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Folder className="h-4 w-4 text-muted-foreground" />
          <h2 className="flex-1 text-sm font-semibold">Projetos</h2>
          <button onClick={onClose} aria-label="Fechar" className="p-1 text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="scroll-thin max-h-[calc(75vh-7rem)] overflow-y-auto">
          {projects
            .filter((project) => !project.archived)
            .map((project) => (
              <section key={project.id}>
                <h3 className="flex items-center gap-1.5 px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Folder className="h-3 w-3" />
                  {project.name}
                </h3>
                <ul>
                  {project.files
                    .filter((file) => !file.archived)
                    .map((file) => (
                      <li key={file.id}>
                        <button
                          onClick={() => abrir(project.id, file.id)}
                          className={cn(
                            "flex w-full items-center gap-3 px-4 py-3 text-left",
                            activeFileId === file.id && "bg-accent",
                          )}
                        >
                          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate text-[15px]">{file.name}</span>
                          {activeFileId === file.id && (
                            <Check className="h-4 w-4 shrink-0 text-primary" />
                          )}
                        </button>
                      </li>
                    ))}
                </ul>
              </section>
            ))}
        </div>

        <div className="border-t border-border p-3">
          <button
            onClick={() => {
              if (activeProject) boardActions.addFile(activeProject.id);
              onClose();
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Novo arquivo
          </button>
        </div>
      </div>
    </div>
  );
}
