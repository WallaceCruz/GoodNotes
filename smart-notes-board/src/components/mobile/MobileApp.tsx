import { useMemo, useState } from "react";
import { toastUndo } from "@/lib/toast";
import { Check, FileText, Layers, ListFilter, Plus } from "lucide-react";
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
import { isNoteDone } from "@/lib/board/status";
import { triageDeck } from "@/lib/board/triage";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/app/UserMenu";
import { DeckActions } from "./DeckActions";
import { MobileNoteList } from "./MobileNoteList";
import { MobileNoteScreen } from "./MobileNoteScreen";
import { NoteDeck } from "./NoteDeck";
import { useSwipeDeck } from "./useSwipeDeck";

type MobileTab = "deck" | "lista";

/**
 * O app no celular.
 *
 * Não é o quadro espremido: colunas lado a lado exigem largura que o telefone
 * não tem, e arrastar cards entre elas com o polegar é impreciso. O quadro vira
 * uma pilha — uma nota por vez, a mais urgente na frente — e o fluxo do kanban
 * continua acessível pelo campo "Coluna" na tela da nota.
 */
export function MobileApp() {
  const [tab, setTab] = useState<MobileTab>("deck");
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);

  const projects = useProjects();
  const activeProject = useActiveProject();
  const activeFile = useActiveFile();
  const activeFileId = useActiveFileId();
  const columns = useFileColumns();

  const notes = useMemo(() => activeFile?.notes ?? [], [activeFile]);
  const deckNotes = useMemo(() => triageDeck(notes, columns), [notes, columns]);

  const deck = useSwipeDeck(deckNotes.length, {
    onTap: (index) => {
      const tapped = deckNotes[index];
      if (tapped) setOpenNoteId(tapped.id);
    },
  });
  const activeCard = deckNotes[deck.index] ?? null;
  const activeCardDone = activeCard ? isNoteDone(activeCard, columns) : false;
  const openNote = notes.find((note) => note.id === openNoteId) ?? null;

  const createNote = () => {
    const columnId = columns[0]?.id;
    if (!columnId) return;
    setOpenNoteId(boardActions.addNote(columnId));
  };

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground">
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

      {tab === "deck" ? (
        <>
          <NoteDeck notes={deckNotes} columns={columns} deck={deck} />
          {activeCard && (
            <DeckActions
              position={deck.index + 1}
              total={deckNotes.length}
              done={activeCardDone}
              canGoBack={deck.canGoBack}
              canGoForward={deck.canGoForward}
              onPrevious={deck.previous}
              onNext={deck.next}
              onToggleDone={() => {
                boardActions.setNoteDone(activeCard.id, !activeCardDone);
                if (!activeCardDone) {
                  toastUndo(`"${activeCard.title || "Nota"}" concluída`, () =>
                    boardActions.setNoteDone(activeCard.id, false),
                  );
                }
              }}
              onOpen={() => setOpenNoteId(activeCard.id)}
            />
          )}
        </>
      ) : (
        <MobileNoteList notes={notes} columns={columns} onOpenNote={setOpenNoteId} />
      )}

      <nav className="flex shrink-0 items-center gap-1 border-t border-border px-3 pb-[env(safe-area-inset-bottom)] pt-1.5">
        {(
          [
            ["deck", "Deck", Layers],
            ["lista", "Lista", ListFilter],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] transition-colors",
              tab === id ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}

        <button
          onClick={createNote}
          aria-label="Nova nota"
          className="flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] text-muted-foreground"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Plus className="h-5 w-5" />
          </span>
          Nova
        </button>
      </nav>

      {openNote && <MobileNoteScreen note={openNote} onClose={() => setOpenNoteId(null)} />}
    </div>
  );
}
