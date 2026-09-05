import { useMemo, useState } from "react";
import {
  Archive,
  CalendarDays,
  Folder,
  ListChecks,
  MessageSquare,
  Plus,
  Search,
  X,
} from "lucide-react";
import { boardActions, useActiveFile, useFileColumns } from "@/stores/board";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/app/UserMenu";
import { NotificationsMenu } from "@/components/kanban/NotificationsMenu";
import { MobileArchived } from "./MobileArchived";
import { MobileCalendar } from "./MobileCalendar";
import { MobileInbox } from "./MobileInbox";
import { MobileNoteList } from "./MobileNoteList";
import { MobileNoteScreen } from "./MobileNoteScreen";
import { MobileProjectsSheet } from "./MobileProjectsSheet";

type MobileTab = "tarefas" | "calendario" | "inbox" | "arquivadas";

const TABS = [
  { id: "tarefas", label: "Tarefas", icon: ListChecks },
  { id: "calendario", label: "Calendário", icon: CalendarDays },
  { id: "inbox", label: "Inbox", icon: MessageSquare },
  { id: "arquivadas", label: "Arquivadas", icon: Archive },
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
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const activeFile = useActiveFile();
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
      <header className="shrink-0 border-b border-border px-3 pb-2 pt-2.5">
        <div className="flex items-center gap-2">
          {/* A busca ocupa a linha: e' o controle mais usado, e no polegar um
              campo largo erra menos que um icone. Sino e avatar ficam ao lado,
              como alvos redondos de tamanho confortavel. */}
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-muted px-3.5 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar nas notas"
              aria-label="Buscar nas notas"
              className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Limpar busca" className="shrink-0">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          <NotificationsMenu notes={notes} onSelect={setOpenNoteId} />
          <UserMenu />
        </div>

        {/* Com seis controles, a barra nao cabe rotulo fixo; o nome da visao
            atual vem para ca, junto do arquivo. */}
        <p className="truncate px-1 pt-1.5 text-[11px] text-muted-foreground">
          {activeFile?.name ?? "Sem arquivo"}
          <span aria-hidden> · </span>
          <span className="text-foreground/70">{TABS.find((t) => t.id === tab)?.label}</span>
        </p>
      </header>

      {tab === "tarefas" && (
        <MobileNoteList notes={notes} columns={columns} query={query} onOpenNote={setOpenNoteId} />
      )}
      {tab === "calendario" && (
        <MobileCalendar notes={notes} columns={columns} query={query} onOpenNote={setOpenNoteId} />
      )}
      {tab === "inbox" && <MobileInbox notes={notes} query={query} onOpenNote={setOpenNoteId} />}
      {tab === "arquivadas" && (
        <MobileArchived notes={notes} query={query} onOpenNote={setOpenNoteId} />
      )}

      {/*
        Barra flutuante: solta do rodapé, ela deixa a lista correr por baixo em
        vez de terminar numa borda dura, e o polegar alcança as ações sem
        esticar até o fim da tela. O respiro embaixo respeita a área segura do
        aparelho.
      */}
      <nav className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border/70 bg-popover/90 p-1.5 shadow-lg backdrop-blur-md">
          <button
            onClick={() => setProjectsOpen(true)}
            aria-label="Projetos"
            title="Projetos"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
          >
            <Folder className="h-[18px] w-[18px]" />
          </button>

          {/* Só ícones: seis rótulos não caberiam em 375px sem espremer os
              alvos de toque. O nome da visão ativa fica no cabeçalho. */}
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-label={label}
              title={label}
              aria-pressed={tab === id}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                tab === id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
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

      {projectsOpen && <MobileProjectsSheet onClose={() => setProjectsOpen(false)} />}

      {openNote && <MobileNoteScreen note={openNote} onClose={() => setOpenNoteId(null)} />}
    </div>
  );
}
