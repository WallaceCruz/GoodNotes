import { useMemo, useState } from "react";
import { useLocalStore } from "@/hooks/useLocalStore";
import { useNow } from "@/hooks/useNow";
import { addDays, dateFromDayKey, dayKey, endOfDay, formatTime, withTime } from "@/lib/date";
import {
  byDeadline,
  calendarDays,
  findDeadlineConflicts,
  notesByDay,
  type CalendarViewMode,
} from "@/lib/board/calendar";
import { CalendarSidebar } from "./calendar/CalendarSidebar";
import { CalendarToolbar, SNAP_OPTIONS, type CalendarFilters } from "./calendar/CalendarToolbar";
import { MonthGrid } from "./calendar/MonthGrid";
import { NotePreviewDialog } from "./calendar/NotePreviewDialog";
import { TimeGrid } from "./calendar/TimeGrid";
import { useCalendarDrag } from "./calendar/useCalendarDrag";
import type { Note } from "@/lib/board-types";

const SNAP_KEY = "sticky-flow:calendar-snap";

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

const DEFAULT_FILTERS: CalendarFilters = {
  withDeadline: true,
  withoutDeadline: true,
  archived: false,
};

/**
 * Calendário de prazos: mostra as notas no dia (e na hora) em que vencem e
 * permite remarcar arrastando.
 *
 * Aqui só ficam a coordenação e o estado da tela; a grade, a barra lateral, o
 * cabeçalho e a prévia são componentes próprios, e as regras (que dias mostrar,
 * o que colide com o quê) vêm de `lib/board/calendar`.
 */
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
  const todayKey = dayKey(today);
  const selectedKey = selectedDay ?? todayKey;

  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [view, setView] = useState<CalendarViewMode>("month");
  const [filters, setFilters] = useState<CalendarFilters>(DEFAULT_FILTERS);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const now = useNow();
  const drag = useCalendarDrag();

  const { value: snap, setValue: setSnap } = useLocalStore({
    key: SNAP_KEY,
    fallback: 15,
    parse: (raw) => (typeof raw === "number" && SNAP_OPTIONS.includes(raw) ? raw : null),
    label: "calendário",
  });

  const visibleNotes = useMemo(
    () => notes.filter((note) => (note.archived ? filters.archived : true)),
    [notes, filters.archived],
  );

  const notesByDayKey = useMemo(
    () => (filters.withDeadline ? notesByDay(visibleNotes) : new Map<string, Note[]>()),
    [visibleNotes, filters.withDeadline],
  );

  const conflicts = useMemo(() => findDeadlineConflicts(visibleNotes), [visibleNotes]);

  const days = useMemo(() => calendarDays(view, selectedKey, cursor), [view, selectedKey, cursor]);

  const notesOfSelectedDay = useMemo(
    () => [...(notesByDayKey.get(selectedKey) ?? [])].sort(byDeadline),
    [notesByDayKey, selectedKey],
  );

  const withoutDeadline = useMemo(
    () => (filters.withoutDeadline ? visibleNotes.filter((note) => !note.deadline) : []),
    [visibleNotes, filters.withoutDeadline],
  );

  const previewNote = notes.find((note) => note.id === previewId) ?? null;

  /** Instante representado por uma célula: o fim do dia, se não houver hora. */
  const slotTime = (key: string, hour: number | null, minute = 0) => {
    const day = dateFromDayKey(key);
    return hour === null ? endOfDay(day).getTime() : withTime(day, hour, minute);
  };

  /** Minuto correspondente à altura em que o cursor soltou dentro da faixa. */
  const snapMinuteFrom = (event: React.DragEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const ratio = Math.min(0.999, Math.max(0, (event.clientY - rect.top) / rect.height));
    return Math.min(60 - snap, Math.max(0, Math.round((ratio * 60) / snap) * snap));
  };

  const dropOn =
    (key: string, hour: number | null = null) =>
    (event: React.DragEvent) => {
      const minute = hour === null ? 0 : snapMinuteFrom(event);
      const noteId = drag.finishDrop(event);
      if (noteId) onSetDeadline(noteId, slotTime(key, hour, minute));
    };

  const move = (delta: number) => {
    if (view === "month") {
      setCursor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
      return;
    }
    const target = addDays(dateFromDayKey(selectedKey), delta * (view === "week" ? 7 : 1));
    setCursor(new Date(target.getFullYear(), target.getMonth(), 1));
    onSelectDay(dayKey(target));
  };

  const title =
    view === "day"
      ? dateFromDayKey(selectedKey).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : (() => {
          const reference = view === "week" ? dateFromDayKey(selectedKey) : cursor;
          return `${MONTHS[reference.getMonth()]} ${reference.getFullYear()}`;
        })();

  /** Rótulo que segue o cursor durante o arrasto, dizendo onde a nota vai cair. */
  const dragLabel = () => {
    if (!drag.target) return "Solte sobre um dia";
    const [key, hour, minute] = drag.target.split("|");
    const moment = new Date(
      slotTime(key!, hour === undefined ? null : Number(hour), Number(minute ?? 0)),
    );
    const date = moment.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "long",
    });
    return `Prazo: ${date} · ${formatTime(moment)}`;
  };

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <CalendarToolbar
          title={title}
          view={view}
          onChangeView={setView}
          filters={filters}
          onChangeFilters={setFilters}
          snap={snap}
          onChangeSnap={setSnap}
          conflictCount={conflicts.size}
          onCreateNote={() => onCreateNote(slotTime(selectedKey, null))}
          onMove={move}
          onGoToday={() => {
            setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
            onSelectDay(todayKey);
          }}
        />

        {view === "month" ? (
          <MonthGrid
            days={days}
            monthOf={cursor}
            selectedKey={selectedKey}
            todayKey={todayKey}
            notesByDayKey={notesByDayKey}
            conflicts={conflicts}
            dropTarget={drag.target}
            onSelectDay={onSelectDay}
            onDragEnter={drag.setTarget}
            onDragLeave={drag.clearTargetIfMatches}
            onDrop={(key) => dropOn(key)}
            onDragStartNote={drag.startDragging}
            onPreviewNote={setPreviewId}
          />
        ) : (
          <TimeGrid
            days={days}
            view={view}
            selectedKey={selectedKey}
            todayKey={todayKey}
            now={now}
            notesByDayKey={notesByDayKey}
            conflicts={conflicts}
            dropTarget={drag.target}
            snapMinuteFrom={snapMinuteFrom}
            onSelectDay={onSelectDay}
            onDragEnterSlot={(slotKey, minute) => drag.setTarget(`${slotKey}|${minute}`)}
            onDragLeaveSlot={(slotKey) => drag.clearTargetIfMatches(`${slotKey}|`)}
            onDropSlot={dropOn}
            onDragStartNote={drag.startDragging}
            onPreviewNote={setPreviewId}
          />
        )}
      </div>

      <CalendarSidebar
        selectedKey={selectedKey}
        notesOfDay={notesOfSelectedDay}
        withoutDeadline={withoutDeadline}
        conflicts={conflicts}
        onCreateNote={() => onCreateNote(slotTime(selectedKey, null))}
        onDragStartNote={drag.startDragging}
        onPreviewNote={setPreviewId}
      />

      {drag.isDragging && (
        <div
          className="pointer-events-none fixed z-50 rounded-md border border-primary bg-popover px-2 py-1 text-[11px] font-medium text-foreground shadow-lg"
          style={{ left: drag.pointer.x + 14, top: drag.pointer.y + 14 }}
        >
          {dragLabel()}
        </div>
      )}

      {previewNote && (
        <NotePreviewDialog
          note={previewNote}
          onClose={() => setPreviewId(null)}
          onOpenDetails={() => {
            onOpenNote(previewNote.id);
            setPreviewId(null);
          }}
        />
      )}
    </div>
  );
}
