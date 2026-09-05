import { createFileRoute } from "@tanstack/react-router";
import {
  Calendar,
  ChevronRight,
  FileText,
  Folder,
  GanttChartSquare,
  Layers,
  LayoutGrid,
  MousePointerClick,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppSidebar } from "@/components/kanban/AppSidebar";
import { MobileApp } from "@/components/mobile/MobileApp";
import { AutomationsPanel } from "@/components/kanban/AutomationsPanel";
import { CalendarView } from "@/components/kanban/CalendarView";
import { FiltersMenu } from "@/components/kanban/FiltersMenu";
import { InboxList } from "@/components/kanban/InboxList";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { NoteFocusView } from "@/components/kanban/NoteFocusView";
import { NotificationsMenu } from "@/components/kanban/NotificationsMenu";
import { SelectionToolbar } from "@/components/kanban/SelectionToolbar";
import { TimelineView } from "@/components/kanban/TimelineView";
import { UserMenu } from "@/components/app/UserMenu";
import { AssistantButton } from "@/components/ai/AssistantButton";
import type { AiScope } from "@/lib/ai/context";
import { toggleBoardView, type BoardView } from "@/components/kanban/board-view";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { emptyFilters, matchesFilters, type Filters } from "@/lib/board/filters";
import { dateFromDayKey, dayKey, formatDate } from "@/lib/date";
import {
  boardActions,
  useActiveFile,
  useActiveProject,
  useBoardHydrated,
  useFileColumns,
  useFileTags,
  useSelectionMode,
} from "@/stores/board";
import { hydrateNoteAppearance } from "@/stores/note-appearance";
import type { Note } from "@/lib/board/model";
import { cn } from "@/lib/utils";

const VIEW_TABS = [
  { view: "kanban", label: "Kanban", icon: LayoutGrid },
  { view: "timeline", label: "Linha do tempo", icon: GanttChartSquare },
  { view: "calendar", label: "Calendário", icon: Calendar },
] as const satisfies ReadonlyArray<{ view: BoardView; label: string; icon: typeof LayoutGrid }>;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Goodnotes - Kanban de notas autoadesivas" },
      {
        name: "description",
        content:
          "Organize projetos, arquivos e notas autoadesivas em um kanban com automações, prazos, prioridades, checklists e arquivamento.",
      },
      { property: "og:title", content: "Goodnotes - Kanban de notas autoadesivas" },
      {
        property: "og:description",
        content:
          "Quadro kanban com notas adesivas, automações por tag e prioridade, checklists, imagens com link e arquivamento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  // Só client-side: ler o armazenamento durante o SSR faria o HTML do servidor
  // divergir do primeiro render do navegador (o store nasce com o quadro de
  // exemplo dos dois lados até este efeito trocar pelo dado real).
  useEffect(() => {
    boardActions.hydrate();
    hydrateNoteAppearance();
  }, []);

  const hydrated = useBoardHydrated();
  const activeProject = useActiveProject();
  const activeFile = useActiveFile();
  const fileTags = useFileTags();
  const fileColumns = useFileColumns();
  const workspaces = useWorkspaces();
  const selectionMode = useSelectionMode();
  const isMobile = useIsMobile();

  const [view, setView] = useState<BoardView>("kanban");
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState<"view" | "edit">("view");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [collapsed, setCollapsed] = useState(false);
  const [automationsOpen, setAutomationsOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const openNote = useCallback((id: string, mode: "view" | "edit" = "view") => {
    setFocusMode(mode);
    setActiveNoteId(id);
  }, []);

  const goToView = useCallback((target: BoardView) => {
    setView((current) => toggleBoardView(current, target));
    setActiveNoteId(null);
  }, []);

  const projectFiles = activeProject?.files;
  const allNotes = useMemo(() => (projectFiles ?? []).flatMap((f) => f.notes), [projectFiles]);

  const allTags = useMemo(
    () =>
      Array.from(
        new Set([...(fileTags ?? []).map((t) => t.name), ...allNotes.flatMap((n) => n.tags)]),
      ).sort(),
    [fileTags, allNotes],
  );

  const matches = useCallback(
    (note: Note) => matchesFilters(note, filters, { archivedOnly: view === "archived" }),
    [view, filters],
  );

  // O Inbox mostra os comentários dessas notas, e quem ordena por data de
  // comentário é o domínio — aqui basta respeitar os filtros do quadro, para
  // que os dois painéis falem do mesmo recorte.
  const inboxNotes = useMemo(() => allNotes.filter(matches), [allNotes, matches]);

  /** Notas que vencem no dia escolhido no calendário, destacadas no quadro. */
  const highlightIds = useMemo(
    () =>
      selectedDay
        ? new Set(
            allNotes
              .filter((note) => note.deadline !== null && dayKey(note.deadline) === selectedDay)
              .map((note) => note.id),
          )
        : undefined,
    [selectedDay, allNotes],
  );

  const activeNote = allNotes.find((note) => note.id === activeNoteId) ?? null;

  // O assistente fala sobre a nota aberta; sem nenhuma aberta, sobre o arquivo.
  const aiScope: AiScope = activeNote
    ? { kind: "note", note: activeNote }
    : activeFile
      ? { kind: "file", file: activeFile }
      : { kind: "none" };
  const showsBoard = view === "kanban" || view === "archived";

  if (!hydrated) return <div className="h-screen w-full bg-background" />;

  // Telefone recebe outro app, não este espremido: colunas lado a lado não
  // cabem numa tela estreita e arrastar cards entre elas com o polegar é
  // impreciso. Ver `MobileApp` para o desenho equivalente.
  if (isMobile) return <MobileApp />;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <AppSidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
        inboxOpen={inboxOpen}
        onToggleInbox={() => setInboxOpen((v) => !v)}
        view={view}
        onSelectView={goToView}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{workspaces.active.name}</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <Folder className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{activeProject?.name ?? "-"}</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h1 className="font-semibold">{activeFile?.name ?? "Sem arquivo"}</h1>

          {view === "archived" && (
            <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
              Vendo arquivadas
            </span>
          )}

          {view !== "calendar" && selectedDay && (
            <button
              onClick={() => setSelectedDay(null)}
              className="rounded-full border border-primary bg-primary/10 px-2 py-0.5 text-[11px] text-foreground"
            >
              Dia do calendário: {formatDate(dateFromDayKey(selectedDay))} · limpar
            </button>
          )}

          <div className="ml-auto flex items-center gap-1.5">
            <div className="mr-1 flex items-center gap-0.5 rounded-md border border-border p-0.5">
              {VIEW_TABS.map(({ view: target, label, icon: Icon }) => (
                <button
                  key={target}
                  onClick={() => setView(target)}
                  className={cn(
                    "flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors",
                    view === target
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/60",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <FiltersMenu filters={filters} allTags={allTags} onChange={setFilters} />

            {/* Seleção em massa só faz sentido onde os cards estão visíveis. */}
            {showsBoard && (
              <button
                onClick={() => boardActions.toggleSelectionMode()}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent",
                  selectionMode && "bg-accent text-foreground",
                )}
              >
                <MousePointerClick className="h-3.5 w-3.5" />
                Selecionar notas
              </button>
            )}

            <button
              onClick={() => setAutomationsOpen((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent",
                automationsOpen && "bg-accent text-foreground",
              )}
            >
              <Zap className="h-3.5 w-3.5" />
              Automações
            </button>

            <NotificationsMenu notes={allNotes} onSelect={setActiveNoteId} />
            <UserMenu />
          </div>
        </header>

        {automationsOpen && <AutomationsPanel allTags={allTags} />}
        {selectionMode && showsBoard && <SelectionToolbar />}

        <div className="flex min-h-0 flex-1">
          {view === "timeline" && (
            <TimelineView
              notes={activeFile?.notes.filter(matches) ?? []}
              columns={fileColumns ?? []}
              projectId={activeProject?.id ?? null}
              onOpenNote={openNote}
              onChangeRange={(id, startDate, deadline) =>
                boardActions.updateNote(id, { startDate, deadline })
              }
            />
          )}

          {view === "calendar" && (
            <CalendarView
              notes={activeFile?.notes ?? []}
              onOpenNote={openNote}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              onCreateNote={(deadline) => {
                const columnId = fileColumns?.[0]?.id;
                if (!columnId) return;
                const id = boardActions.addNote(columnId);
                boardActions.updateNote(id, { deadline });
                setActiveNoteId(id);
              }}
              onSetDeadline={(id, deadline) => boardActions.updateNote(id, { deadline })}
            />
          )}

          {showsBoard && (
            <>
              {inboxOpen && (
                <InboxList notes={inboxNotes} activeId={activeNoteId} onSelect={setActiveNoteId} />
              )}
              <KanbanBoard
                activeNoteId={activeNoteId}
                onOpenNote={openNote}
                matches={matches}
                highlightIds={highlightIds}
              />
            </>
          )}
        </div>

        {activeNote && (
          <NoteFocusView note={activeNote} mode={focusMode} onClose={() => setActiveNoteId(null)} />
        )}

        <AssistantButton scope={aiScope} className="fixed bottom-5 right-5 z-40" />
      </div>
    </div>
  );
}
