import { useMemo, useState } from "react";
import { CalendarDays, Check, FileText, Layers, ListChecks, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  boardActions,
  useActiveFile,
  useActiveFileId,
  useActiveProject,
  useFileColumns,
  useProjects,
} from "@/stores/board";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/app/UserMenu";
import { MobileCalendar } from "./MobileCalendar";
import { MobileNoteList } from "./MobileNoteList";
import { MobileNoteScreen } from "./MobileNoteScreen";

type MobileTab = "tarefas" | "calendario";

const TABS = [
  { id: "tarefas", label: "Tarefas", icon: ListChecks },
  { id: "calendario", label: "Calendário", icon: CalendarDays },
] as const satisfies ReadonlyArray<{ id: MobileTab; label: string; icon: typeof ListChecks }>;

/**
 * O app no celular.
 *
 * Não é o quadro espremido: colunas lado a lado exigem largura que o telefone
 * não tem, e arrastar cards entre elas com o polegar é impreciso. Aqui as notas
 * viram uma agenda de tarefas, agrupada por prazo, com um calendário ao lado —
 * o fluxo do kanban continua acessível pelo campo "Coluna" na tela da nota.
 */
export function MobileApp() {
  const [tab, setTab] = useState<MobileTab>("tarefas");
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);

  const projects = useProjects();
  const activeProject = useActiveProject();
  const activeFile = useActiveFile();
  const activeFileId = useActiveFileId();
  const columns = useFileColumns();

  const notes = useMemo(() => activeFile?.notes ?? [], [activeFile]);
  const openNote = notes.find((note) => note.id === openNoteId) ?? null;

  const createNote = () => {
    const columnId = columns[0]?.id;
    if (!columnId) return;
    setOpenNoteId(boardActions.addNote(columnId));
  };

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground">
      <header className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 text-left">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {activeFile?.name ?? "Sem arquivo"}
              </span>
              <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-[70vh] w-64 overflow-y-auto">
            {projects
              .filter((project) => !project.archived)
              .map((project) => (
                <div key={project.id}>
                  <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    {project.name}
                  </DropdownMenuLabel>
                  {project.files
                    .filter((file) => !file.archived)
                    .map((file) => (
                      <DropdownMenuItem
                        key={file.id}
                        onClick={() => boardActions.selectFile(project.id, file.id)}
                      >
                        <FileText className="h-4 w-4" />
                        <span className="flex-1 truncate">{file.name}</span>
                        {activeFileId === file.id && <Check className="h-4 w-4" />}
                      </DropdownMenuItem>
                    ))}
                  <DropdownMenuSeparator />
                </div>
              ))}
            <DropdownMenuItem
              onClick={() => activeProject && boardActions.addFile(activeProject.id)}
            >
              <Plus className="h-4 w-4" />
              Novo arquivo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <UserMenu />
      </header>

      {tab === "tarefas" ? (
        <MobileNoteList notes={notes} columns={columns} onOpenNote={setOpenNoteId} />
      ) : (
        <MobileCalendar notes={notes} columns={columns} onOpenNote={setOpenNoteId} />
      )}

      {/*
        Barra flutuante: solta do rodapé, ela deixa a lista correr por baixo em
        vez de terminar numa borda dura, e o polegar alcança as ações sem
        esticar até o fim da tela. O respiro embaixo respeita a área segura do
        aparelho.
      */}
      <nav className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border/70 bg-popover/90 p-1.5 shadow-lg backdrop-blur-md">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-colors",
                tab === id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}

          <span className="mx-0.5 h-6 w-px bg-border" />

          <button
            onClick={createNote}
            aria-label="Nova nota"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {openNote && <MobileNoteScreen note={openNote} onClose={() => setOpenNoteId(null)} />}
    </div>
  );
}
