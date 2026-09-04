import { useEffect, useRef } from "react";
import { CalendarClock } from "lucide-react";
import { DAY_MS, startOfDay } from "@/lib/date";
import { isNoteDone } from "@/lib/board/status";
import { barGeometry, isOverdue, type TimelineRow } from "@/lib/board/timeline";
import { cn } from "@/lib/utils";
import { noteBg } from "@/components/note/note-style";
import { GROUP_HEIGHT, ROW_HEIGHT } from "./TimelineNoteList";
import { MIN_BAR_WIDTH, MONTH_SHORT, WEEKDAY_INITIAL } from "./timeline-scale";
import type { NoteRange } from "@/lib/board/timeline";
import type { Column, Note } from "@/lib/board/model";

/** Acima desta largura de dia cabe o nome do mês; abaixo, só a inicial. */
const WIDTH_FOR_MONTH_LABEL = 96;
/** Abaixo desta largura o cabeçalho mostra apenas o número do dia. */
const WIDTH_FOR_WEEKDAY_LABEL = 40;

const isWeekend = (day: Date) => day.getDay() === 0 || day.getDay() === 6;

/** Grade da direita: o cabeçalho de datas e as barras arrastáveis. */
export function TimelineGrid({
  rows,
  columns,
  days,
  today,
  rangeStart,
  pixelsPerDay,
  collapsed,
  accentOf,
  draggingNoteId,
  isDragging,
  displayRange,
  onDayResolver,
  onStartDrag,
  onOpenNote,
}: {
  rows: TimelineRow[];
  columns: Column[];
  days: Date[];
  today: number;
  rangeStart: number;
  pixelsPerDay: number;
  collapsed: Record<string, boolean>;
  accentOf: (column: Column) => string | null;
  draggingNoteId: string | null;
  isDragging: boolean;
  displayRange: (note: Note) => NoteRange | null;
  onDayResolver: (resolver: (clientX: number) => number) => void;
  onStartDrag: (event: React.PointerEvent, note: Note, mode: "move" | "start" | "end") => void;
  onOpenNote: (id: string) => void;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const gridWidth = days.length * pixelsPerDay;

  // O arraste precisa converter posição de tela em dia, e só a grade conhece a
  // própria rolagem — por isso ela entrega a conversão pronta a quem arrasta.
  useEffect(() => {
    onDayResolver((clientX) => {
      const element = gridRef.current;
      if (!element) return today;
      const bounds = element.getBoundingClientRect();
      const x = clientX - bounds.left + element.scrollLeft;
      return rangeStart + Math.floor(x / pixelsPerDay) * DAY_MS;
    });
  }, [onDayResolver, rangeStart, pixelsPerDay, today]);

  return (
    <div ref={gridRef} className="scroll-thin min-w-0 flex-1 overflow-auto">
      <div style={{ width: gridWidth }}>
        <div className="sticky top-0 z-10 flex h-12 border-b border-border bg-background">
          {days.map((day) => {
            const isToday = startOfDay(day).getTime() === today;
            const isFirstOfMonth = day.getDate() === 1;
            const showsLabel = isFirstOfMonth || pixelsPerDay >= WIDTH_FOR_WEEKDAY_LABEL;
            const showsMonth = isFirstOfMonth || pixelsPerDay >= WIDTH_FOR_MONTH_LABEL;

            return (
              <div
                key={day.getTime()}
                style={{ width: pixelsPerDay }}
                className={cn(
                  "flex shrink-0 flex-col items-center justify-center border-r border-border/40 text-[10px] text-muted-foreground",
                  isWeekend(day) && "bg-muted/40",
                  isToday && "bg-primary/10 font-semibold text-foreground",
                )}
              >
                {showsLabel && (
                  <span className="truncate">
                    {showsMonth ? MONTH_SHORT[day.getMonth()] : WEEKDAY_INITIAL[day.getDay()]}
                  </span>
                )}
                <span>{day.getDate()}</span>
              </div>
            );
          })}
        </div>

        {rows.map(({ column, notes }) => {
          const accent = accentOf(column);
          return (
            <div key={column.id}>
              <div
                className={cn("border-b border-border/60 bg-muted/30", GROUP_HEIGHT)}
                style={accent ? { background: `${accent}1a` } : undefined}
              />

              {!collapsed[column.id] &&
                notes.map((note) => {
                  const range = displayRange(note);
                  const done = isNoteDone(note, columns);
                  const overdue = isOverdue(range, today, done);
                  const bar = range
                    ? barGeometry(range, rangeStart, pixelsPerDay, MIN_BAR_WIDTH)
                    : null;

                  return (
                    <div
                      key={note.id}
                      className={cn("relative border-b border-border/40", ROW_HEIGHT)}
                      style={{ width: gridWidth }}
                    >
                      <div className="pointer-events-none absolute inset-0 flex">
                        {days.map((day) => (
                          <div
                            key={day.getTime()}
                            style={{ width: pixelsPerDay }}
                            className={cn(
                              "shrink-0 border-r border-border/30",
                              isWeekend(day) && "bg-muted/30",
                              startOfDay(day).getTime() === today && "bg-primary/5",
                            )}
                          />
                        ))}
                      </div>

                      {bar && (
                        <div
                          onPointerDown={(event) => onStartDrag(event, note, "move")}
                          onClick={() => !isDragging && onOpenNote(note.id)}
                          title={note.title}
                          style={{
                            left: bar.left,
                            width: bar.width,
                            ...(note.colorHex ? { background: note.colorHex } : {}),
                          }}
                          className={cn(
                            "absolute top-1 flex h-12 cursor-grab items-center gap-1 rounded-md border border-border/60 px-2 shadow-sm",
                            !note.colorHex && noteBg[note.color],
                            done && "opacity-60",
                            overdue && "ring-2 ring-destructive/60",
                            draggingNoteId === note.id && "cursor-grabbing ring-2 ring-ring",
                          )}
                        >
                          <span
                            onPointerDown={(event) => onStartDrag(event, note, "start")}
                            className="absolute left-0 top-0 h-full w-1.5 cursor-ew-resize rounded-l-md hover:bg-foreground/20"
                          />
                          <span
                            className={cn(
                              "line-clamp-2 min-w-0 flex-1 text-[11px] font-medium leading-tight",
                              done && "line-through",
                            )}
                          >
                            {note.title || "Sem título"}
                          </span>
                          {overdue && (
                            <CalendarClock className="h-3 w-3 shrink-0 text-destructive" />
                          )}
                          <span
                            onPointerDown={(event) => onStartDrag(event, note, "end")}
                            className="absolute right-0 top-0 h-full w-1.5 cursor-ew-resize rounded-r-md hover:bg-foreground/20"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
