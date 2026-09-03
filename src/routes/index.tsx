import { createFileRoute } from "@tanstack/react-router";
import { Calendar, ChevronRight, FileText, Folder, GanttChartSquare, Layers, LayoutGrid, Zap } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppSidebar } from "@/components/kanban/AppSidebar";
import { AutomationsPanel } from "@/components/kanban/AutomationsPanel";
import { CalendarView } from "@/components/kanban/CalendarView";
import { FiltersMenu, emptyFilters, type Filters } from "@/components/kanban/FiltersMenu";
import { InboxList } from "@/components/kanban/InboxList";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { TimelineView } from "@/components/kanban/TimelineView";
import { NoteFocusView } from "@/components/kanban/NoteFocusView";
import { NotificationsMenu } from "@/components/kanban/NotificationsMenu";
import { UserMenu } from "@/components/kanban/UserMenu";
import {
  boardActions,
  useActiveFile,
  useActiveProject,
  useBoardHydrated,
  useFileColumns,
  useFileTags,
} from "@/stores/board";
import { hydrateNoteAppearance } from "@/stores/noteAppearance";
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
  const [timelineView, setTimelineView] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const allTags = Array.from(
    new Set([
      ...(fileTags ?? []).map((t) => t.name),
      ...(activeProject?.files ?? []).flatMap((f) => f.notes).flatMap((n) => n.tags),
    ]),
  ).sort();


  const projectFiles = activeProject?.files;
  const allNotes = useMemo(() => (projectFiles ?? []).flatMap((f) => f.notes), [projectFiles]);

  const matches = useCallback((n: Note) => {
    if (archivedView) {
      if (!n.archived) return false;
    } else if (!filters.showArchived && n.archived) return false;
    const q = filters.query.trim().toLowerCase();
    if (
      q &&
      !`${n.title} ${stripHtml(n.content)} ${stripHtml(n.contentBelow ?? "")} ${n.tags.join(" ")}`
        .toLowerCase()
        .includes(q)
    )
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
      {!hydrated ? null : (
        <>
          <AppSidebar
            collapsed={collapsed}
            onToggleCollapsed={() => setCollapsed((v) => !v)}
            inboxOpen={inboxOpen}
            onToggleInbox={() => setInboxOpen((v) => !v)}
            onGoHome={() => {
              setArchivedView(false);
              setCalendarView(false);
              setTimelineView(false);
              setActiveNoteId(null);
            }}
            archivedView={archivedView}
            onToggleArchivedView={() => {
              setCalendarView(false);
              setTimelineView(false);
              setArchivedView((v) => !v);
            }}
            calendarView={calendarView}
            onToggleCalendarView={() => {
              setArchivedView(false);
              setTimelineView(false);
              setCalendarView((v) => !v);
            }}
            timelineView={timelineView}
            onToggleTimelineView={() => {
              setArchivedView(false);
              setCalendarView(false);
              setTimelineView((v) => !v);
            }}
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
                <div className="mr-1 flex items-center gap-0.5 rounded-md border border-border p-0.5">
                  {([
                    { key: "kanban", label: "Kanban", icon: LayoutGrid },
                    { key: "timeline", label: "Linha do tempo", icon: GanttChartSquare },
                    { key: "calendar", label: "Calendário", icon: Calendar },
                  ] as const).map((v) => {
                    const active =
                      v.key === "kanban"
                        ? !calendarView && !timelineView && !archivedView
                        : v.key === "timeline"
                          ? timelineView
                          : calendarView;
                    const Icon = v.icon;
                    return (
                      <button
                        key={v.key}
                        onClick={() => {
                          setArchivedView(false);
                          setTimelineView(v.key === "timeline");
                          setCalendarView(v.key === "calendar");
                        }}
                        className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors ${
                          active
                            ? "bg-accent text-foreground"
                            : "text-muted-foreground hover:bg-accent/60"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {v.label}
                      </button>
                    );
                  })}
                </div>
                <FiltersMenu filters={filters} allTags={allTags} onChange={setFilters} />
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


            {automationsOpen && <AutomationsPanel allTags={allTags} />}

            <div className="flex min-h-0 flex-1">
              {timelineView ? (
                <TimelineView
                  notes={activeFile?.notes.filter(matches) ?? []}
                  columns={fileColumns ?? []}
                  projectId={activeProject?.id ?? null}
                  onOpenNote={openNote}
                  onChangeRange={(id, startDate, deadline) =>
                    boardActions.updateNote(id, { startDate, deadline })
                  }
                />
              ) : calendarView ? (
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
              ) : (
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
              <NoteFocusView
                note={activeNote}
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
