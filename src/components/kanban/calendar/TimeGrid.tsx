import { Fragment, useEffect, useRef } from "react";
import { dayKey, formatTime } from "@/lib/date";
import { hasConflict } from "@/lib/board/calendar";
import { cn } from "@/lib/utils";
import { CalendarNoteChip } from "./CalendarNoteChip";
import { WEEKDAYS } from "./MonthGrid";
import type { Note } from "@/lib/board-types";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

/** Altura de uma hora, em px, usada para abrir a grade já perto do horário atual. */
const HOUR_HEIGHT_PX = 56;

/** Onde uma marca fica dentro da faixa de uma hora. */
const minuteOffset = (minute: number) => `${(minute / 60) * 100}%`;

/** Grade de dia/semana com faixas de hora que aceitam nota solta num minuto exato. */
export function TimeGrid({
  days,
  view,
  selectedKey,
  todayKey,
  now,
  notesByDayKey,
  conflicts,
  dropTarget,
  snapMinuteFrom,
  onSelectDay,
  onDragEnterSlot,
  onDragLeaveSlot,
  onDropSlot,
  onDragStartNote,
  onPreviewNote,
}: {
  days: Date[];
  view: "day" | "week";
  selectedKey: string;
  todayKey: string;
  now: Date;
  notesByDayKey: Map<string, Note[]>;
  conflicts: Set<number>;
  dropTarget: string | null;
  snapMinuteFrom: (event: React.DragEvent) => number;
  onSelectDay: (key: string) => void;
  onDragEnterSlot: (slotKey: string, minute: number) => void;
  onDragLeaveSlot: (slotKey: string) => void;
  onDropSlot: (key: string, hour: number) => (event: React.DragEvent) => void;
  onDragStartNote: (noteId: string) => (event: React.DragEvent) => void;
  onPreviewNote: (noteId: string) => void;
}) {
  const gridRef = useRef<HTMLDivElement | null>(null);

  // Abrir sempre à meia-noite esconderia o horário de trabalho; começar duas
  // horas antes do agora deixa o contexto imediato visível.
  useEffect(() => {
    gridRef.current?.scrollTo({
      top: Math.max(0, (new Date().getHours() - 2) * HOUR_HEIGHT_PX),
      behavior: "smooth",
    });
  }, [view]);

  const rowHeight = view === "week" ? "h-24" : "h-14";

  return (
    <div
      ref={gridRef}
      className="scroll-thin min-h-0 flex-1 overflow-y-auto rounded-md border border-border"
    >
      <div
        className="grid"
        style={{ gridTemplateColumns: `4rem repeat(${days.length}, minmax(0, 1fr))` }}
      >
        <div className="sticky top-0 z-10 border-b border-border bg-background" />
        {days.map((day) => {
          const key = dayKey(day);
          return (
            <button
              key={`head-${key}`}
              onClick={() => onSelectDay(key)}
              className={cn(
                "sticky top-0 z-10 border-b border-l border-border bg-background px-2 py-1.5 text-center",
                selectedKey === key && "bg-primary/5",
              )}
            >
              <span className="text-[11px] text-muted-foreground">{WEEKDAYS[day.getDay()]}</span>
              <span
                className={cn(
                  "mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  key === todayKey ? "bg-primary text-primary-foreground" : "text-foreground",
                )}
              >
                {day.getDate()}
              </span>
            </button>
          );
        })}

        {HOURS.map((hour) => (
          <Fragment key={hour}>
            <div
              className={cn(
                "relative border-b border-border pr-2 pt-1 text-right text-[10px] tabular-nums text-muted-foreground",
                rowHeight,
                now.getHours() === hour && "text-destructive",
              )}
            >
              {String(hour).padStart(2, "0")}:00
              {now.getHours() === hour && (
                <span
                  className="pointer-events-none absolute right-1 z-20 -translate-y-1/2 rounded-sm bg-destructive px-1 text-[9px] font-semibold tabular-nums text-white"
                  style={{ top: minuteOffset(now.getMinutes()) }}
                >
                  {formatTime(now)}
                </span>
              )}
            </div>

            {days.map((day) => {
              const key = dayKey(day);
              const slotKey = `${key}|${hour}`;
              const notes = (notesByDayKey.get(key) ?? []).filter(
                (note) => new Date(note.deadline!).getHours() === hour,
              );
              const isDropTarget = dropTarget?.startsWith(`${slotKey}|`) ?? false;
              const dropMinute = isDropTarget ? Number(dropTarget!.split("|")[2] ?? 0) : 0;
              const isCurrentHour = key === dayKey(now) && hour === now.getHours();

              return (
                <div
                  key={slotKey}
                  onClick={() => onSelectDay(key)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    onDragEnterSlot(slotKey, snapMinuteFrom(e));
                  }}
                  onDragLeave={() => onDragLeaveSlot(slotKey)}
                  onDrop={onDropSlot(key, hour)}
                  className={cn(
                    "relative space-y-0.5 overflow-hidden border-b border-l border-border p-0.5 transition-colors hover:bg-accent/50",
                    rowHeight,
                    selectedKey === key && "bg-primary/5",
                    isDropTarget && "bg-primary/15 ring-2 ring-inset ring-primary",
                  )}
                >
                  {isCurrentHour && (
                    <span
                      aria-label={`Horário atual ${formatTime(now)}`}
                      className="pointer-events-none absolute inset-x-0 z-20 -translate-y-1/2 border-t-2 border-destructive"
                      style={{ top: minuteOffset(now.getMinutes()) }}
                    >
                      <span className="absolute -left-[3px] -top-[5px] block h-2 w-2 rounded-full bg-destructive" />
                    </span>
                  )}

                  {/* Mostra em que minuto a nota vai cair antes de soltar. */}
                  {isDropTarget && (
                    <span
                      className="pointer-events-none absolute inset-x-0 z-10 flex items-center gap-1 border-t-2 border-primary"
                      style={{ top: minuteOffset(dropMinute) }}
                    >
                      <span className="rounded-sm bg-primary px-1 text-[9px] font-semibold tabular-nums text-primary-foreground">
                        {String(hour).padStart(2, "0")}:{String(dropMinute).padStart(2, "0")}
                      </span>
                    </span>
                  )}

                  {notes.map((note) => (
                    <CalendarNoteChip
                      key={note.id}
                      note={note}
                      conflicting={hasConflict(note, conflicts)}
                      onDragStart={onDragStartNote(note.id)}
                      onSelect={() => onPreviewNote(note.id)}
                    />
                  ))}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
