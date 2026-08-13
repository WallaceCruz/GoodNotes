import { CalendarDays, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Note } from "@/lib/board-types";
import { cn } from "@/lib/utils";
import { noteBg, noteLabel, stripHtml } from "./note-style";
import { DeadlineBadge, PriorityBadge } from "./NoteMeta";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const dayKey = (d: number | Date) => {
  const date = new Date(d);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

const dateFromKey = (k: string) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y!, m!, d!, 12, 0, 0, 0);
};

type ViewMode = "day" | "week" | "month";

const VIEW_LABEL: Record<ViewMode, string> = { day: "Dia", week: "Semana", month: "Mês" };

export function CalendarView({
  notes,
  onOpenNote,
  selectedDay,
  onSelectDay,
  onCreateNote,
  onSetDeadline,
}: {
  notes: Note[];
  onOpenNote: (id: string) => void;
  selectedDay: string | null;
  onSelectDay: (key: string) => void;
  onCreateNote: (deadline: number) => void;
  onSetDeadline: (noteId: string, deadline: number) => void;
}) {
  const today = new Date();
  const selected = selectedDay ?? dayKey(today);
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [view, setView] = useState<ViewMode>("month");
  const [showWith, setShowWith] = useState(true);
  const [showWithout, setShowWithout] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewNote = notes.find((n) => n.id === previewId) ?? null;

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: DragEvent) => setPointer({ x: e.clientX, y: e.clientY });
    const onEnd = () => {
      setDragging(false);
      setDragOverKey(null);
    };
    window.addEventListener("dragover", onMove);
    window.addEventListener("dragend", onEnd);
    window.addEventListener("drop", onEnd);
    return () => {
      window.removeEventListener("dragover", onMove);
      window.removeEventListener("dragend", onEnd);
      window.removeEventListener("drop", onEnd);
    };
  }, [dragging]);


  const visible = useMemo(
    () => notes.filter((n) => (n.archived ? showArchived : true)),
    [notes, showArchived],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, Note[]>();
    if (!showWith) return map;
    for (const n of visible) {
      if (!n.deadline) continue;
      const k = dayKey(n.deadline);
      map.set(k, [...(map.get(k) ?? []), n]);
    }
    return map;
  }, [visible, showWith]);

  const days = useMemo(() => {
    if (view === "day") return [dateFromKey(selected)];
    const base = view === "week" ? dateFromKey(selected) : new Date(cursor);
    if (view === "week") {
      const start = new Date(base);
      start.setDate(base.getDate() - base.getDay());
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
      });
    }
    const first = new Date(base.getFullYear(), base.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor, view, selected]);

  const selectedNotes = (byDay.get(selected) ?? []).sort(
    (a, b) => (a.deadline ?? 0) - (b.deadline ?? 0),
  );
  const withoutDeadline = showWithout ? visible.filter((n) => !n.deadline) : [];

  const move = (delta: number) => {
    if (view === "month") {
      setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
      return;
    }
    const d = dateFromKey(selected);
    d.setDate(d.getDate() + delta * (view === "week" ? 7 : 1));
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
    onSelectDay(dayKey(d));
  };

  const headerLabel =
    view === "day"
      ? dateFromKey(selected).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : `${MONTHS[(view === "week" ? dateFromKey(selected) : cursor).getMonth()]} ${(view === "week" ? dateFromKey(selected) : cursor).getFullYear()}`;

  const handleDrop = (k: string) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverKey(null);
    const id = e.dataTransfer.getData("text/note-id");
    if (id) onSetDeadline(id, dateFromKey(k).getTime());
  };

  const filterChip = (label: string, on: boolean, toggle: () => void) => (
    <button
      key={label}
      onClick={toggle}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
        on
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border text-muted-foreground hover:bg-accent",
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold capitalize">{headerLabel}</h2>

          <div className="ml-2 flex items-center gap-0.5 rounded-md border border-border p-0.5">
            {(Object.keys(VIEW_LABEL) as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "rounded px-2 py-1 text-[11px] transition-colors",
                  view === v
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                {VIEW_LABEL[v]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {filterChip("Com prazo", showWith, () => setShowWith((v) => !v))}
            {filterChip("Sem prazo", showWithout, () => setShowWithout((v) => !v))}
            {filterChip("Arquivadas", showArchived, () => setShowArchived((v) => !v))}
          </div>

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => onCreateNote(dateFromKey(selected).getTime())}
              className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              Nova nota neste dia
            </button>
            <button
              onClick={() => move(-1)}
              aria-label="Anterior"
              className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-accent"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
                onSelectDay(dayKey(today));
              }}
              className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
            >
              Hoje
            </button>
            <button
              onClick={() => move(1)}
              aria-label="Próximo"
              className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-accent"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {view !== "day" && (
          <div className={cn("grid gap-1 pb-1", "grid-cols-7")}>
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-[11px] font-medium text-muted-foreground">
                {w}
              </div>
            ))}
          </div>
        )}

        <div
          className={cn(
            "scroll-thin grid min-h-0 flex-1 content-start gap-1 overflow-y-auto",
            view === "day"
              ? "grid-cols-1 auto-rows-[minmax(20rem,1fr)]"
              : view === "week"
                ? "grid-cols-7 auto-rows-[minmax(16rem,1fr)]"
                : "grid-cols-7 auto-rows-[minmax(5.5rem,1fr)]",
          )}
        >
          {days.map((d) => {
            const k = dayKey(d);
            const items = byDay.get(k) ?? [];
            const outside = view === "month" && d.getMonth() !== cursor.getMonth();
            const isToday = k === dayKey(today);
            const limit = view === "month" ? 2 : 8;
            return (
              <button
                key={k}
                onClick={() => onSelectDay(k)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverKey(k);
                }}
                onDragLeave={() => setDragOverKey((c) => (c === k ? null : c))}
                onDrop={handleDrop(k)}
                className={cn(
                  "flex min-h-[5rem] flex-col gap-1 rounded-md border border-border p-1.5 text-left transition-colors hover:bg-accent",
                  outside && "opacity-40",
                  selected === k && "border-primary bg-primary/5",
                  dragOverKey === k && "border-primary bg-primary/10 ring-2 ring-ring/50",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium",
                    isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  {d.getDate()}
                </span>
                {items.slice(0, limit).map((n) => (
                  <span
                    key={n.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/note-id", n.id);
                      setDragging(true);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewId(n.id);
                    }}
                    title={noteLabel[n.color]}
                    className={cn(
                      "cursor-grab truncate rounded border border-border/60 px-1 py-0.5 text-[10px] text-foreground active:cursor-grabbing",
                      n.kind === "notepad" ? "bg-card" : noteBg[n.color],
                    )}
                  >
                    {n.title || "Sem título"}
                  </span>
                ))}
                {items.length > limit && (
                  <span className="text-[10px] text-muted-foreground">
                    +{items.length - limit} mais
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <aside className="scroll-thin w-80 shrink-0 overflow-y-auto border-l border-border p-4">
        <h3 className="text-sm font-semibold capitalize">
          {dateFromKey(selected).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {selectedNotes.length} nota(s) com prazo neste dia
        </p>

        <button
          onClick={() => onCreateNote(dateFromKey(selected).getTime())}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground hover:bg-accent"
        >
          <Plus className="h-3.5 w-3.5" />
          Criar nota para este dia
        </button>

        <div className="mt-3 space-y-2">
          {selectedNotes.length === 0 && (
            <p className="text-xs text-muted-foreground">Nenhum prazo para este dia.</p>
          )}
          {selectedNotes.map((n) => (
            <button
              key={n.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/note-id", n.id);
                setDragging(true);
              }}
              onClick={() => setPreviewId(n.id)}
              className={cn(
                "block w-full rounded-md border border-border/60 p-2 text-left transition-shadow hover:shadow-md",
                n.kind === "notepad" ? "bg-card" : noteBg[n.color],
              )}
            >
              <p className="text-sm font-medium leading-snug">{n.title || "Sem título"}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                {n.priority && <PriorityBadge priority={n.priority} />}
                {n.deadline && <DeadlineBadge deadline={n.deadline} />}
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {stripHtml(n.content)}
              </p>
            </button>
          ))}
        </div>

        {withoutDeadline.length > 0 && (
          <>
            <h4 className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sem prazo ({withoutDeadline.length}) — arraste para um dia
            </h4>
            <div className="mt-2 space-y-1">
              {withoutDeadline.slice(0, 20).map((n) => (
                <button
                  key={n.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/note-id", n.id);
                    setDragging(true);
                  }}
                  onClick={() => setPreviewId(n.id)}
                  className={cn(
                    "block w-full cursor-grab truncate rounded-md border border-border/60 px-2 py-1.5 text-left text-xs text-foreground hover:shadow-md active:cursor-grabbing",
                    n.kind === "notepad" ? "bg-card" : noteBg[n.color],
                  )}
                >
                  {n.title || "Sem título"}
                </button>
              ))}
            </div>
          </>
        )}
      </aside>

      {dragging && (
        <div
          className="pointer-events-none fixed z-50 rounded-md border border-primary bg-popover px-2 py-1 text-[11px] font-medium text-foreground shadow-lg"
          style={{ left: pointer.x + 14, top: pointer.y + 14 }}
        >
          {dragOverKey
            ? `Prazo: ${dateFromKey(dragOverKey).toLocaleDateString("pt-BR", {
                weekday: "short",
                day: "2-digit",
                month: "long",
              })}`
            : "Solte sobre um dia"}
        </div>
      )}

      {previewNote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-6 backdrop-blur-sm"
          onClick={() => setPreviewId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-xl border border-border/60 p-6 shadow-2xl",
              previewNote.kind === "notepad" ? "bg-card" : noteBg[previewNote.color],
            )}
          >
            <button
              onClick={() => setPreviewId(null)}
              aria-label="Fechar visualização"
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="pr-8 text-xl font-bold leading-snug">
              {previewNote.title || "Sem título"}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {previewNote.priority && <PriorityBadge priority={previewNote.priority} />}
              {previewNote.deadline && <DeadlineBadge deadline={previewNote.deadline} />}
              {previewNote.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-foreground/15 px-2 py-0.5 text-[10px]"
                >
                  {t}
                </span>
              ))}
            </div>
            <div
              className="prose-sm mt-4 text-sm leading-relaxed [&_img]:my-2 [&_img]:max-h-64 [&_img]:rounded-md"
              dangerouslySetInnerHTML={{ __html: previewNote.content }}
            />
            {previewNote.checklist.length > 0 && (
              <ul className="mt-4 space-y-1 text-sm">
                {previewNote.checklist.map((i) => (
                  <li key={i.id} className={cn(i.done && "text-muted-foreground line-through")}>
                    {i.done ? "☑" : "☐"} {i.text}
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => {
                onOpenNote(previewNote.id);
                setPreviewId(null);
              }}
              className="mt-5 rounded-md border border-foreground/20 bg-background/70 px-3 py-1.5 text-xs font-medium hover:bg-background"
            >
              Abrir detalhes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
