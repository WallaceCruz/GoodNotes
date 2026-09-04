import { useMemo, useState } from "react";
import { DAY_MS, startOfDay } from "@/lib/date";
import { timelineRows, unscheduledNotes } from "@/lib/board/timeline";
import { useNoteAppearance } from "@/stores/note-appearance";
import { TimelineGrid } from "./timeline/TimelineGrid";
import { TimelineNoteList } from "./timeline/TimelineNoteList";
import { TimelineToolbar } from "./timeline/TimelineToolbar";
import { UnscheduledStrip } from "./timeline/UnscheduledStrip";
import { scaleConfig, type TimelineScale } from "./timeline/timeline-scale";
import { useTimelineDrag } from "./timeline/useTimelineDrag";
import type { Column, Note } from "@/lib/board/model";

/**
 * Linha do tempo: as notas como barras num calendário contínuo.
 *
 * Aqui ficam só o período visível e a ligação entre as partes — a coluna fixa
 * de nomes, a grade de datas, a faixa das notas sem prazo e o arraste. Quem
 * decide onde cada barra começa é `lib/board/timeline`.
 */
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
  const [scale, setScale] = useState<TimelineScale>("week");
  const [anchor, setAnchor] = useState(() => startOfDay(Date.now()).getTime());
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const config = scaleConfig(scale);
  const today = startOfDay(Date.now()).getTime();

  // O período começa antes da âncora para que "hoje" caia no primeiro terço da
  // tela — o passado recente continua à vista sem precisar rolar para trás.
  const rangeStart = anchor - Math.floor(config.days / 3) * DAY_MS;
  const days = useMemo(
    () => Array.from({ length: config.days }, (_, index) => new Date(rangeStart + index * DAY_MS)),
    [config.days, rangeStart],
  );

  const rows = useMemo(() => timelineRows(notes, columns), [notes, columns]);
  const unscheduled = useMemo(() => unscheduledNotes(notes), [notes]);

  const drag = useTimelineDrag({
    pixelsPerDay: config.pixelsPerDay,
    today,
    onCommit: onChangeRange,
  });

  const accentOf = (column: Column) =>
    appearance.nativeColumnColors && column.native ? appearance.columnColors[column.native] : null;

  const toggleColumn = (columnId: string) =>
    setCollapsed((current) => ({ ...current, [columnId]: !current[columnId] }));

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-canvas">
      <TimelineToolbar
        scale={scale}
        onChangeScale={setScale}
        onMove={(direction) =>
          setAnchor((current) => current + direction * Math.round(config.days / 2) * DAY_MS)
        }
        onGoToday={() => setAnchor(startOfDay(Date.now()).getTime())}
      />

      <UnscheduledStrip
        notes={unscheduled}
        onStartDrag={(event, note) => drag.begin(event, note, "new")}
        onOpenNote={onOpenNote}
      />

      <div
        className="flex min-h-0 flex-1"
        onPointerMove={drag.move}
        onPointerUp={drag.end}
        onPointerCancel={drag.cancel}
      >
        <TimelineNoteList
          rows={rows}
          columns={columns}
          collapsed={collapsed}
          accentOf={accentOf}
          onToggleColumn={toggleColumn}
          onOpenNote={onOpenNote}
        />

        <TimelineGrid
          rows={rows}
          columns={columns}
          days={days}
          today={today}
          rangeStart={rangeStart}
          pixelsPerDay={config.pixelsPerDay}
          collapsed={collapsed}
          accentOf={accentOf}
          draggingNoteId={drag.draggingNoteId}
          isDragging={drag.isDragging}
          displayRange={drag.displayRange}
          onDayResolver={drag.setDayResolver}
          onStartDrag={(event, note, mode) => drag.begin(event, note, mode)}
          onOpenNote={onOpenNote}
        />
      </div>
    </div>
  );
}
