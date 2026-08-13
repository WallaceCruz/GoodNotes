import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { Note } from "@/lib/board-types";
import { cn } from "@/lib/utils";
import { priorityClass, stripHtml } from "./note-style";
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

const dayKey = (d: number | Date) => {
  const date = new Date(d);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

export function CalendarView({
  notes,
  onOpenNote,
}: {
  notes: Note[];
  onOpenNote: (id: string) => void;
}) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string>(dayKey(today));

  const byDay = useMemo(() => {
    const map = new Map<string, Note[]>();
    for (const n of notes) {
      if (!n.deadline) continue;
      const k = dayKey(n.deadline);
      map.set(k, [...(map.get(k) ?? []), n]);
    }
    return map;
  }, [notes]);

  const days = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const selectedNotes = (byDay.get(selected) ?? []).sort(
    (a, b) => (a.deadline ?? 0) - (b.deadline ?? 0),
  );
  const withoutDeadline = notes.filter((n) => !n.deadline);

  const move = (delta: number) =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">
            {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
          </h2>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => move(-1)}
              aria-label="Mês anterior"
              className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-accent"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
                setSelected(dayKey(today));
              }}
              className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
            >
              Hoje
            </button>
            <button
              onClick={() => move(1)}
              aria-label="Próximo mês"
              className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-accent"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 pb-1">
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-center text-[11px] font-medium text-muted-foreground">
              {w}
            </div>
          ))}
        </div>

        <div className="scroll-thin grid min-h-0 flex-1 auto-rows-[minmax(5.5rem,1fr)] grid-cols-7 content-start gap-1 overflow-y-auto">
          {days.map((d) => {
            const k = dayKey(d);
            const items = byDay.get(k) ?? [];
            const outside = d.getMonth() !== cursor.getMonth();
            const isToday = k === dayKey(today);
            return (
              <button
                key={k}
                onClick={() => setSelected(k)}
                className={cn(
                  "flex min-h-[5rem] flex-col gap-1 rounded-md border border-border p-1.5 text-left transition-colors hover:bg-accent",
                  outside && "opacity-40",
                  selected === k && "border-primary bg-primary/5",
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
                {items.slice(0, 2).map((n) => (
                  <span
                    key={n.id}
                    className={cn(
                      "truncate rounded border px-1 py-0.5 text-[10px]",
                      n.priority ? priorityClass[n.priority] : "border-border text-muted-foreground",
                    )}
                  >
                    {n.title || "Sem título"}
                  </span>
                ))}
                {items.length > 2 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{items.length - 2} mais
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <aside className="scroll-thin w-80 shrink-0 overflow-y-auto border-l border-border p-4">
        <h3 className="text-sm font-semibold">
          {new Date(
            Number(selected.split("-")[0]),
            Number(selected.split("-")[1]),
            Number(selected.split("-")[2]),
          ).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {selectedNotes.length} nota(s) com prazo neste dia
        </p>

        <div className="mt-3 space-y-2">
          {selectedNotes.length === 0 && (
            <p className="text-xs text-muted-foreground">Nenhum prazo para este dia.</p>
          )}
          {selectedNotes.map((n) => (
            <button
              key={n.id}
              onClick={() => onOpenNote(n.id)}
              className="block w-full rounded-md border border-border p-2 text-left hover:bg-accent"
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
              Sem prazo ({withoutDeadline.length})
            </h4>
            <div className="mt-2 space-y-1">
              {withoutDeadline.slice(0, 10).map((n) => (
                <button
                  key={n.id}
                  onClick={() => onOpenNote(n.id)}
                  className="block w-full truncate rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-accent"
                >
                  {n.title || "Sem título"}
                </button>
              ))}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
