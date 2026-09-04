import { useCallback, useEffect, useState } from "react";

/** Formato de identificação do alvo do arrasto: `dia`, `dia|hora` ou `dia|hora|minuto`. */
export type DropTargetKey = string;

/**
 * Arrastar uma nota para um horário.
 *
 * O calendário usa arrasto nativo do HTML (e não o dnd-kit do quadro) porque
 * o alvo é uma célula de grade, não uma lista ordenável. Isso obriga a ouvir
 * eventos na janela para saber onde o ponteiro está e quando o arrasto acaba —
 * detalhe que fica todo aqui dentro em vez de espalhado pela tela.
 */
export function useCalendarDrag() {
  const [target, setTarget] = useState<DropTargetKey | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isDragging) return;
    const followPointer = (event: DragEvent) => setPointer({ x: event.clientX, y: event.clientY });
    const finish = () => {
      setIsDragging(false);
      setTarget(null);
    };
    window.addEventListener("dragover", followPointer);
    window.addEventListener("dragend", finish);
    window.addEventListener("drop", finish);
    return () => {
      window.removeEventListener("dragover", followPointer);
      window.removeEventListener("dragend", finish);
      window.removeEventListener("drop", finish);
    };
  }, [isDragging]);

  /** Passado para cada nota arrastável: registra o id e liga o rastro do cursor. */
  const startDragging = useCallback(
    (noteId: string) => (event: React.DragEvent) => {
      event.dataTransfer.setData("text/note-id", noteId);
      setIsDragging(true);
    },
    [],
  );

  /** Encerra o arrasto e devolve o id da nota solta, se houver. */
  const finishDrop = useCallback((event: React.DragEvent): string | null => {
    event.preventDefault();
    event.stopPropagation();
    setTarget(null);
    setIsDragging(false);
    return event.dataTransfer.getData("text/note-id") || null;
  }, []);

  const clearTargetIfMatches = useCallback(
    (prefix: string) => setTarget((current) => (current?.startsWith(prefix) ? null : current)),
    [],
  );

  return {
    target,
    setTarget,
    clearTargetIfMatches,
    isDragging,
    pointer,
    startDragging,
    finishDrop,
  };
}
