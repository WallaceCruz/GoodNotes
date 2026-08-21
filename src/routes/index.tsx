import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, FileText, Folder, Layers, Zap } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { AppSidebar } from "@/components/kanban/AppSidebar";
import { AutomationsPanel } from "@/components/kanban/AutomationsPanel";
import { CalendarView } from "@/components/kanban/CalendarView";
import { FiltersMenu, emptyFilters, type Filters } from "@/components/kanban/FiltersMenu";
import { InboxList } from "@/components/kanban/InboxList";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { NoteFocusView } from "@/components/kanban/NoteFocusView";
import { NotificationsMenu } from "@/components/kanban/NotificationsMenu";
import { UserMenu } from "@/components/kanban/UserMenu";
import { useBoardStore } from "@/hooks/useBoardStore";
import { useWorkspaces } from "@/hooks/useWorkspaces";


import type { Note } from "@/lib/board-types";
import { stripHtml } from "@/components/kanban/note-style";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sticky Flow - Kanban de notas autoadesivas" },
      {
        name: "description",
        content:
          "Organize projetos, arquivos e notas autoadesivas em um kanban com automações, prazos, prioridades, checklists e arquivamento.",
      },
      { property: "og:title", content: "Sticky Flow - Kanban de notas autoadesivas" },
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
  const store = useBoardStore();
  const workspaces = useWorkspaces();

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState<"view" | "edit">("view");
  const openNote = useCallback((id: string, mode: "view" | "edit" = "view") => {
    setFocusMode(mode);
    setActiveNoteId(id);
  }, []);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [collapsed, setCollapsed] = useState(false);
  const [automationsOpen, setAutomationsOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(true);
  const [archivedView, setArchivedView] = useState(false);
  const [calendarView, setCalendarView] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const allTags = Array.from(
    new Set([
      ...(store.file?.tags ?? []).map((t) => t.name),
      ...(store.project?.files ?? []).flatMap((f) => f.notes).flatMap((n) => n.tags),
    ]),
  ).sort();


  const projectFiles = store.project?.files;
  const allNotes = useMemo(() => (projectFiles ?? []).flatMap((f) => f.notes), [projectFiles]);

  const matches = useCallback((n: Note) => {
    if (archivedView) {
      if (!n.archived) return false;
    } else if (!filters.showArchived && n.archived) return false;
    const q = filters.query.trim().toLowerCase();
    if (q && !`${n.title} ${stripHtml(n.content)} ${n.tags.join(" ")}`.toLowerCase().includes(q))
      return false;
    if (filters.colors.length > 0 && !filters.colors.includes(n.color)) return false;
    if (filters.priorities.length > 0 && !(n.priority && filters.priorities.includes(n.priority)))
      return false;
    if (filters.tags.length > 0 && !filters.tags.every((t) => n.tags.includes(t))) return false;
    return true;
  }, [archivedView, filters]);

  const inboxNotes = useMemo(
    () => allNotes.filter(matches).sort((a, b) => b.updatedAt - a.updatedAt),
    [allNotes, matches],
  );

  const highlightIds = useMemo(() => selectedDay
    ? new Set(
        allNotes
          .filter((n) => {
            if (!n.deadline) return false;
            const d = new Date(n.deadline);
            return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === selectedDay;
          })
          .map((n) => n.id),
      )
    : undefined, [selectedDay, allNotes]);

  const activeNote = allNotes.find((n) => n.id === activeNoteId) ?? null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {!store.hydrated ? null : (
        <>
          <AppSidebar
            store={store}
            collapsed={collapsed}
            onToggleCollapsed={() => setCollapsed((v) => !v)}
            inboxOpen={inboxOpen}
            onToggleInbox={() => setInboxOpen((v) => !v)}
            onGoHome={() => {
              setArchivedView(false);
              setCalendarView(false);
              setActiveNoteId(null);
            }}
            archivedView={archivedView}
            onToggleArchivedView={() => {
              setCalendarView(false);
              setArchivedView((v) => !v);
            }}
            calendarView={calendarView}
            onToggleCalendarView={() => {
              setArchivedView(false);
              setCalendarView((v) => !v);
            }}
          />

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{workspaces.active.name}</span>

              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <Folder className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{store.project?.name ?? "-"}</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h1 className="font-semibold">{store.file?.name ?? "Sem arquivo"}</h1>
              {archivedView && (
                <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                  Vendo arquivadas
                </span>
              )}
              {!calendarView && selectedDay && (
                <button
                  onClick={() => setSelectedDay(null)}
                  className="rounded-full border border-primary bg-primary/10 px-2 py-0.5 text-[11px] text-foreground"
                >
                  Dia do calendário: {new Date(
                    Number(selectedDay.split("-")[0]),
                    Number(selectedDay.split("-")[1]),
                    Number(selectedDay.split("-")[2]),
                  ).toLocaleDateString("pt-BR")} · limpar
                </button>
              )}
              <div className="ml-auto flex items-center gap-1.5">
                <FiltersMenu filters={filters} allTags={allTags} store={store} onChange={setFilters} />
                <button
                  onClick={() => setAutomationsOpen((v) => !v)}
                  className={`flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent ${
                    automationsOpen ? "bg-accent text-foreground" : ""
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  Automações
                </button>
                <NotificationsMenu notes={allNotes} onSelect={setActiveNoteId} />
                <UserMenu />
              </div>
            </header>


            {automationsOpen && <AutomationsPanel store={store} allTags={allTags} />}

            <div className="flex min-h-0 flex-1">
              {calendarView ? (
                <CalendarView
                  notes={store.file?.notes ?? []}
                  onOpenNote={openNote}
                  selectedDay={selectedDay}
                  onSelectDay={setSelectedDay}
                  onCreateNote={(deadline) => {
                    const columnId = store.file?.columns[0]?.id;
                    if (!columnId) return;
                    const id = store.addNote(columnId, "sticky");
                    store.updateNote(id, { deadline });
                    setActiveNoteId(id);
                  }}
                  onSetDeadline={(id, deadline) => store.updateNote(id, { deadline })}
                />
              ) : (
                <>
                  {inboxOpen && (
                    <InboxList notes={inboxNotes} activeId={activeNoteId} onSelect={setActiveNoteId} />
                  )}
                  <KanbanBoard
                    store={store}
                    activeNoteId={activeNoteId}
                    onOpenNote={openNote}
                    matches={matches}
                    highlightIds={highlightIds}
                  />
                </>
              )}
            </div>

            {activeNote && (
              <NoteFocusView
                note={activeNote}
                store={store}
                mode={focusMode}
                onClose={() => setActiveNoteId(null)}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
