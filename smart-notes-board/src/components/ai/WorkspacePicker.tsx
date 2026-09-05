import { Check, FileText, Folder, X } from "lucide-react";
import { useProjects } from "@/stores/board";
import { cn } from "@/lib/utils";
import type { BoardFile } from "@/lib/board/model";

/**
 * Escolher sobre qual arquivo a conversa fala.
 *
 * Por padrão o assistente olha o que está aberto no quadro. Isto é para quando
 * a pergunta é sobre outro lugar — sem obrigar a pessoa a sair do chat, trocar
 * de arquivo e voltar.
 */
export function WorkspacePicker({
  activeFileId,
  onSelect,
  onClose,
}: {
  activeFileId: string | null;
  onSelect: (file: BoardFile) => void;
  onClose: () => void;
}) {
  const projects = useProjects().filter((project) => !project.archived);

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-popover">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <h3 className="flex-1 text-[13px] font-semibold">Escolher workspace</h3>
        <button
          onClick={onClose}
          aria-label="Fechar seleção de workspace"
          className="rounded-md p-1 text-muted-foreground hover:bg-accent"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="scroll-thin flex-1 overflow-y-auto pb-3">
        {projects.map((project) => (
          <section key={project.id}>
            <h4 className="flex items-center gap-1.5 px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <Folder className="h-3 w-3" />
              {project.name}
            </h4>
            <ul>
              {project.files
                .filter((file) => !file.archived)
                .map((file) => (
                  <li key={file.id}>
                    <button
                      onClick={() => onSelect(file)}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-accent",
                        activeFileId === file.id && "bg-accent",
                      )}
                    >
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-[13px]">{file.name}</span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {file.notes.filter((n) => !n.archived).length} notas
                      </span>
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
    </div>
  );
}
