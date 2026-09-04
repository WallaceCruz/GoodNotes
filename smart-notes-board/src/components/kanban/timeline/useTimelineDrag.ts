import { useCallback, useRef, useState } from "react";
import { DAY_MS } from "@/lib/date";
import { noteRange } from "@/lib/board/notes";
import type { NoteRange } from "@/lib/board/timeline";
import type { Note } from "@/lib/board/model";

/**
 * O que o arraste está fazendo com a barra: movendo inteira, esticando por uma
 * das pontas, ou desenhando uma nova a partir de uma nota sem prazo.
 */
type DragMode = "move" | "start" | "end" | "new";

type DragState = {
  noteId: string;
  mode: DragMode;
  originX: number;
  start: number;
  end: number;
};

/**
 * Arrastar barras na linha do tempo.
 *
 * A conta é sempre a mesma — quantos dias o cursor andou — e só o que ela move
 * muda conforme o modo. Manter isso num hook deixa a grade cuidando de desenhar
 * e este arquivo cuidando de "para onde a nota vai".
 *
 * O intervalo em edição vive num estado separado (`preview`) e só é gravado ao
 * soltar: assim arrastar não dispara uma escrita por quadro de animação.
 */
export function useTimelineDrag({
  pixelsPerDay,
  today,
  onCommit,
}: {
  pixelsPerDay: number;
  today: number;
  onCommit: (noteId: string, start: number, end: number) => void;
}) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [preview, setPreview] = useState<NoteRange | null>(null);
  const dayAtRef = useRef<(clientX: number) => number>(() => today);

  /** A grade informa como converter uma posição de tela em dia. */
  const setDayResolver = useCallback((resolver: (clientX: number) => number) => {
    dayAtRef.current = resolver;
  }, []);

  const rangeFor = (state: DragState, clientX: number): NoteRange => {
    if (state.mode === "new") {
      const day = dayAtRef.current(clientX);
      return { start: day, end: day + DAY_MS };
    }
    const delta = Math.round((clientX - state.originX) / pixelsPerDay) * DAY_MS;
    if (state.mode === "move") return { start: state.start + delta, end: state.end + delta };
    if (state.mode === "start")
      return { start: Math.min(state.start + delta, state.end), end: state.end };
    return { start: state.start, end: Math.max(state.end + delta, state.start) };
  };

  const begin = (event: React.PointerEvent, note: Note, mode: DragMode) => {
    event.preventDefault();
    event.stopPropagation();
    const range = noteRange(note) ?? { start: today, end: today + DAY_MS };
    setDrag({ noteId: note.id, mode, originX: event.clientX, ...range });
    try {
      (event.target as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      /* sem captura o arraste ainda funciona enquanto o cursor ficar na grade */
    }
  };

  const move = (event: React.PointerEvent) => {
    if (drag) setPreview(rangeFor(drag, event.clientX));
  };

  const end = (event: React.PointerEvent) => {
    if (!drag) return;
    const next = preview ?? rangeFor(drag, event.clientX);
    onCommit(drag.noteId, next.start, next.end);
    setDrag(null);
    setPreview(null);
  };

  const cancel = () => {
    setDrag(null);
    setPreview(null);
  };

  /** O intervalo que a nota deve mostrar agora — o provisório vence o gravado. */
  const displayRange = (note: Note): NoteRange | null =>
    drag?.noteId === note.id && preview ? preview : noteRange(note);

  return {
    draggingNoteId: drag?.noteId ?? null,
    isDragging: drag !== null,
    setDayResolver,
    begin,
    move,
    end,
    cancel,
    displayRange,
  };
}
