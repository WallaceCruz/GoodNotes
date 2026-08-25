import { CalendarClock, ChevronDown, ChevronRight, GanttChartSquare } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import {
  DAY_MS,
  effectiveStatus,
  initials,
  noteAssignees,
  noteRange,
  type Column,
  type Note,
} from "@/lib/board-types";
import { useNoteAppearance } from "@/hooks/useNoteAppearance";
import { cn } from "@/lib/utils";
import { noteBg } from "./note-style";
import { PriorityBadge } from "./NoteMeta";

type Scale = "day" | "week" | "month";

const SCALES: { value: Scale; label: string; px: number; days: number }[] = [
  { value: "day", label: "Dia", px: 96, days: 14 },
  { value: "week", label: "Semana", px: 40, days: 42 },
  { value: "month", label: "Mês", px: 16, days: 120 },
];

const WEEKDAY = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTH_SHORT = [
  "jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez",
];

const startOfDay = (d: number | Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};

type DragState = {
  id: string;
  mode: "move" | "start" | "end" | "new";
  originX: number;
  start: number;
  end: number;
};

export function TimelineView({
  notes,
  columns,
  projectId,
  onOpenNote,
  onChangeRange,
}: {
  notes: Note[];
  columns: Column[];
  projectId?: string | null;
  onOpenNote: (id: string, mode?: "view" | "edit") => void;
  onChangeRange: (id: string, startDate: number, deadline: number) => void;
}) {
  const { appearance } = useNoteAppearance(projectId ?? null);
  const [scale, setScale] = useState<Scale>("week");
  const [anchor, setAnchor] = useState(() => startOfDay(Date.now()));
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [drag, setDrag] = useState<DragState | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const cfg = SCALES.find((s) => s.value === scale)!;
  const rangeStart = anchor - Math.floor(cfg.days / 3) * DAY_MS;
  const days = useMemo(
    () => Array.from({ length: cfg.days }, (_, i) => new Date(rangeStart + i * DAY_MS)),
    [cfg.days, rangeStart],
  );
  const gridWidth = cfg.days * cfg.px;
  const today = startOfDay(Date.now());

  const groups = useMemo(
    () =>
      columns.map((c) => ({
        column: c,
        rows: notes
          .filter((n) => n.columnId === c.id)
          .sort((a, b) => {
            const ra = noteRange(a);
            const rb = noteRange(b);
            if (!ra || !rb) return 0;
            return ra.start - rb.start;
          }),
      })),
    [columns, notes],
  );

  const unscheduled = notes.filter((n) => !noteRange(n));

  const accentOf = (c: Column) =>
    appearance.nativeColumnColors && c.native ? appearance.columnColors[c.native] : null;

  const dayFromClientX = (clientX: number) => {
    const el = gridRef.current;
    if (!el) return today;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left + el.scrollLeft;
    return rangeStart + Math.floor(x / cfg.px) * DAY_MS;
  };

  const beginDrag = (
    e: React.PointerEvent,
    note: Note,
    mode: DragState["mode"],
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const range = noteRange(note) ?? { start: today, end: today + DAY_MS };
    setDrag({ id: note.id, mode, originX: e.clientX, start: range.start, end: range.end });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const computeDrag = (state: DragState, clientX: number) => {
    if (state.mode === "new") {
      const day = dayFromClientX(clientX);
      return { start: day, end: day + DAY_MS };
    }
    const deltaDays = Math.round((clientX - state.originX) / cfg.px);
    const delta = deltaDays * DAY_MS;
    if (state.mode === "move") return { start: state.start + delta, end: state.end + delta };
    if (state.mode === "start")
      return { start: Math.min(state.start + delta, state.end), end: state.end };
    return { start: state.start, end: Math.max(state.end + delta, state.start) };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const next = computeDrag(drag, e.clientX);
    setDrag({ ...drag, ...{ preview: next } } as DragState & { preview?: unknown });
    setPreview(next);
  };

  const [preview, setPreview] = useState<{ start: number; end: number } | null>(null);

  const endDrag = (e: React.PointerEvent) => {
    if (!drag) return;
    const next = preview ?? computeDrag(drag, e.clientX);
    onChangeRange(drag.id, next.start, next.end);
    setDrag(null);
    setPreview(null);
  };

  const rangeOf = (note: Note) => {
    if (drag?.id === note.id && preview) return preview;
    return noteRange(note);
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-canvas">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2">
        <GanttChartSquare className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Linha do tempo</span>
        <div className="ml-2 flex items-center gap-1 rounded-md border border-border p-0.5">
          {SCALES.map((s) => (
            <button
              key={s.value}
              onClick={() => setScale(s.value)}
              className={cn(
                "rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent",
                scale === s.value && "bg-accent font-medium text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAnchor((a) => a - Math.round(cfg.days / 2) * DAY_MS)}
            className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
          >
            Anterior
          </button>
          <button
            onClick={() => setAnchor(startOfDay(Date.now()))}
            className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
          >
            Hoje
          </button>
          <button
            onClick={() => setAnchor((a) => a + Math.round(cfg.days / 2) * DAY_MS)}
            className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
          >
            Próximo
          </button>
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          Arraste as barras para mover; use as pontas para ajustar início e prazo.
        </span>
      </div>

      {unscheduled.length > 0 && (
        <div className="flex items-start gap-2 border-b border-border bg-muted/30 px-4 py-2">
          <span className="mt-1 shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Sem prazo
          </span>
          <div className="flex flex-wrap gap-1.5">
            {unscheduled.map((n) => (
              <button
                key={n.id}
                onPointerDown={(e) => beginDrag(e, n, "new")}
                onDoubleClick={() => onOpenNote(n.id)}
                className={cn(
                  "max-w-56 truncate rounded-full border border-border px-2 py-1 text-[11px]",
                  noteBg[n.color],
                )}
                title="Arraste para a grade para agendar"
              >
                {n.title || "Sem título"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className="flex min-h-0 flex-1"
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={() => {
          setDrag(null);
          setPreview(null);
        }}
      >
        {/* Coluna fixa de notas */}
        <div className="scroll-thin w-64 shrink-0 overflow-y-auto border-r border-border bg-background">
          <div className="sticky top-0 z-10 h-12 border-b border-border bg-background px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Notas
          </div>
          {groups.map(({ column, rows }) => (
            <div key={column.id}>
              <button
                onClick={() =>
                  setCollapsed((c) => ({ ...c, [column.id]: !c[column.id] }))
                }
                className="flex h-9 w-full items-center gap-1.5 border-b border-border/60 px-2 text-xs font-medium text-foreground hover:bg-accent"
              >
                {collapsed[column.id] ? (
                  <ChevronRight className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
                <span
                  className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40"
                  style={accentOf(column) ? { background: accentOf(column)! } : undefined}
                />
                <span className="truncate">{column.title}</span>
                <span className="ml-auto text-[11px] text-muted-foreground">{rows.length}</span>
              </button>
              {!collapsed[column.id] &&
                rows.map((n) => {
                  const done = effectiveStatus(n, columns) === "done";
                  return (
                    <button
                      key={n.id}
                      onClick={() => onOpenNote(n.id)}
                      className="flex h-11 w-full items-center gap-2 border-b border-border/40 px-3 text-left hover:bg-accent"
                    >
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate text-xs",
                          done && "text-muted-foreground line-through",
                        )}
                      >
                        {n.title || "Sem título"}
                      </span>
                      <span className="flex -space-x-1.5">
                        {noteAssignees(n)
                          .slice(0, 3)
                          .map((a) => (
                            <span
                              key={a}
                              title={a}
                              className="flex h-5 w-5 items-center justify-center rounded-full border border-background bg-muted text-[9px] font-medium"
                            >
                              {initials(a)}
                            </span>
                          ))}
                      </span>
                      {n.priority && <PriorityBadge priority={n.priority} />}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>

        {/* Grade */}
        <div ref={gridRef} className="scroll-thin min-w-0 flex-1 overflow-auto">
          <div style={{ width: gridWidth }}>
            {/* Cabeçalho de datas */}
            <div className="sticky top-0 z-10 flex h-12 border-b border-border bg-background">
              {days.map((d) => {
                const isToday = startOfDay(d) === today;
                const first = d.getDate() === 1;
                return (
                  <div
                    key={d.getTime()}
                    style={{ width: cfg.px }}
                    className={cn(
                      "flex shrink-0 flex-col items-center justify-center border-r border-border/40 text-[10px] text-muted-foreground",
                      (d.getDay() === 0 || d.getDay() === 6) && "bg-muted/40",
                      isToday && "bg-primary/10 font-semibold text-foreground",
                    )}
                  >
                    {(first || cfg.px >= 40) && (
                      <span className="truncate">
                        {first || cfg.px >= 96 ? MONTH_SHORT[d.getMonth()] : WEEKDAY[d.getDay()]}
                      </span>
                    )}
                    <span>{d.getDate()}</span>
                  </div>
                );
              })}
            </div>

            {groups.map(({ column, rows }) => (
              <div key={column.id}>
                <div
                  className="h-9 border-b border-border/60 bg-muted/30"
                  style={
                    accentOf(column) ? { background: `${accentOf(column)}1a` } : undefined
                  }
                />
                {!collapsed[column.id] &&
                  rows.map((n) => {
                    const r = rangeOf(n);
                    const done = effectiveStatus(n, columns) === "done";
                    const late = r ? r.end < today && !done : false;
                    const left = r ? ((r.start - rangeStart) / DAY_MS) * cfg.px : 0;
                    const width = r
                      ? Math.max(cfg.px * 0.6, ((r.end - r.start) / DAY_MS) * cfg.px)
                      : 0;
                    return (
                      <div
                        key={n.id}
                        className="relative h-11 border-b border-border/40"
                        style={{ width: gridWidth }}
                      >
                        <div className="pointer-events-none absolute inset-0 flex">
                          {days.map((d) => (
                            <div
                              key={d.getTime()}
                              style={{ width: cfg.px }}
                              className={cn(
                                "shrink-0 border-r border-border/30",
                                (d.getDay() === 0 || d.getDay() === 6) && "bg-muted/30",
                                startOfDay(d) === today && "bg-primary/5",
                              )}
                            />
                          ))}
                        </div>
                        {r && (
                          <div
                            onPointerDown={(e) => beginDrag(e, n, "move")}
                            onClick={() => !drag && onOpenNote(n.id)}
                            style={{
                              left,
                              width,
                              ...(n.colorHex ? { background: n.colorHex } : {}),
                            }}
                            className={cn(
                              "absolute top-1.5 flex h-8 cursor-grab items-center gap-1 rounded-md border border-border/60 px-2 shadow-sm",
                              !n.colorHex && noteBg[n.color],
                              done && "opacity-60",
                              late && "ring-2 ring-destructive/60",
                              drag?.id === n.id && "cursor-grabbing ring-2 ring-ring",
                            )}
                            title={n.title}
                          >
                            <span
                              onPointerDown={(e) => beginDrag(e, n, "start")}
                              className="absolute left-0 top-0 h-full w-1.5 cursor-ew-resize rounded-l-md hover:bg-foreground/20"
                            />
                            <span
                              className={cn(
                                "min-w-0 flex-1 truncate text-[11px] font-medium",
                                done && "line-through",
                              )}
                            >
                              {n.title || "Sem título"}
                            </span>
                            {late && <CalendarClock className="h-3 w-3 text-destructive" />}
                            <span
                              onPointerDown={(e) => beginDrag(e, n, "end")}
                              className="absolute right-0 top-0 h-full w-1.5 cursor-ew-resize rounded-r-md hover:bg-foreground/20"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            ))}

            {/* Linha do hoje */}
            <div
              className="pointer-events-none absolute"
              style={{ left: ((today - rangeStart) / DAY_MS) * cfg.px }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
