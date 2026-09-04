import { dayKey } from "@/lib/date";
import { byDeadline, hasConflict } from "@/lib/board/calendar";
import { cn } from "@/lib/utils";
import { CalendarNoteChip } from "./CalendarNoteChip";
import { WEEKDAYS } from "./calendar-ui";
import type { Note } from "@/lib/board/model";

/** Quantas notas cabem numa célula do mês antes de virar "+N mais". */
const VISIBLE_PER_DAY = 2;

/** Grade do mês: seis semanas de células que aceitam nota solta em cima. */
export function MonthGrid({
  days,
  monthOf,
  selectedKey,
  todayKey,
  notesByDayKey,
  conflicts,
  dropTarget,
  onSelectDay,
  onDragEnter,
  onDragLeave,
  onDrop,
  onDragStartNote,
  onPreviewNote,
}: {
  days: Date[];
  monthOf: Date;
  selectedKey: string;
  todayKey: string;
  notesByDayKey: Map<string, Note[]>;
  conflicts: Set<number>;
  dropTarget: string | null;
  onSelectDay: (key: string) => void;
  onDragEnter: (key: string) => void;
  onDragLeave: (key: string) => void;
  onDrop: (key: string) => (event: React.DragEvent) => void;
  onDragStartNote: (noteId: string) => (event: React.DragEvent) => void;
  onPreviewNote: (noteId: string) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-7 gap-1 pb-1">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday} className="text-center text-[11px] font-medium text-muted-foreground">
            {weekday}
          </div>
        ))}
      </div>

      <div className="scroll-thin grid min-h-0 flex-1 auto-rows-[minmax(5.5rem,1fr)] grid-cols-7 content-start gap-1 overflow-y-auto">
        {days.map((day) => {
          const key = dayKey(day);
          const notes = [...(notesByDayKey.get(key) ?? [])].sort(byDeadline);
          const outsideMonth = day.getMonth() !== monthOf.getMonth();

          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              onClick={() => onSelectDay(key)}
              onKeyDown={(e) => e.key === "Enter" && onSelectDay(key)}
              onDragOver={(e) => {
                e.preventDefault();
                onDragEnter(key);
              }}
              onDragLeave={() => onDragLeave(key)}
              onDrop={onDrop(key)}
              className={cn(
                "flex min-h-[5rem] cursor-pointer flex-col gap-1 rounded-md border border-border p-1.5 text-left transition-colors hover:bg-accent",
                outsideMonth && "opacity-40",
                selectedKey === key && "border-primary bg-primary/5",
                dropTarget === key &&
                  "scale-[1.02] border-primary bg-primary/15 shadow-lg ring-2 ring-primary",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium",
                  key === todayKey ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {day.getDate()}
              </span>

              {notes.slice(0, VISIBLE_PER_DAY).map((note) => (
                <CalendarNoteChip
                  key={note.id}
                  note={note}
                  conflicting={hasConflict(note, conflicts)}
                  onDragStart={onDragStartNote(note.id)}
                  onSelect={() => onPreviewNote(note.id)}
                />
              ))}

              {notes.length > VISIBLE_PER_DAY && (
                <span className="text-[10px] text-muted-foreground">
                  +{notes.length - VISIBLE_PER_DAY} mais
                </span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
