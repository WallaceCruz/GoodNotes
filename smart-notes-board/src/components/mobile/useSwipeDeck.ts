import { useCallback, useEffect, useRef, useState } from "react";

/** Distância mínima, em px, para o gesto virar troca de card em vez de voltar. */
const COMMIT_DISTANCE = 88;

/** Enquanto o dedo se move mais na vertical do que na horizontal, é rolagem. */
const DIRECTION_LOCK = 12;

/** Abaixo disso o dedo não andou: foi toque, não arraste. */
const TAP_TOLERANCE = 8;

/** Nas pontas o card ainda anda, mas pesado — sinaliza que não há mais deck. */
const EDGE_RESISTANCE = 0.35;

/**
 * Capturar o ponteiro mantém os eventos chegando mesmo se o dedo sair do card,
 * mas é um conforto, não um requisito: o navegador recusa a captura se aquele
 * `pointerId` já não estiver ativo, e uma exceção aqui abortaria o gesto no
 * meio. Falhar em silêncio deixa o arraste funcionando sem a captura.
 */
function capturePointer(event: React.PointerEvent) {
  try {
    event.currentTarget.setPointerCapture(event.pointerId);
  } catch {
    /* segue sem captura */
  }
}

function releasePointer(event: React.PointerEvent) {
  try {
    event.currentTarget.releasePointerCapture(event.pointerId);
  } catch {
    /* nada a liberar */
  }
}

export type SwipeDeck = {
  index: number;
  /** Deslocamento horizontal atual do card do topo, em px. */
  offset: number;
  dragging: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  goTo: (index: number) => void;
  next: () => void;
  previous: () => void;
  /** Handlers para o card do topo. */
  handlers: {
    onPointerDown: (event: React.PointerEvent) => void;
    onPointerMove: (event: React.PointerEvent) => void;
    onPointerUp: (event: React.PointerEvent) => void;
    onPointerCancel: (event: React.PointerEvent) => void;
  };
};

/**
 * Navegação por gesto numa pilha de cards.
 *
 * O swipe aqui **não altera a nota** — só troca qual card está na frente.
 * Gesto é impreciso e irreversível por natureza; deixar que ele conclua ou mova
 * uma tarefa transformaria um deslize acidental no bolso em perda de trabalho.
 * As ações ficam em botões, onde erram menos.
 *
 * O mesmo gesto que arrasta também precisa distinguir um toque simples (abrir a
 * nota), senão todo swipe terminaria abrindo a tela de detalhe. Por isso o
 * `onTap` é decidido aqui, pela distância percorrida, e não por um `onClick` no
 * card — que dispararia nos dois casos.
 *
 * Setas do teclado fazem o mesmo caminho, para quem navega sem toque.
 */
export function useSwipeDeck(
  total: number,
  options: { onTap?: (index: number) => void } = {},
): SwipeDeck {
  const { onTap } = options;
  const [index, setIndex] = useState(0);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const gesture = useRef<{ x: number; y: number; horizontal: boolean | null } | null>(null);
  // O valor que decide o commit precisa ser o do último `pointermove`, não o do
  // último render — daí o espelho em ref.
  const offsetRef = useRef(0);

  // O deck encurta quando uma nota é concluída: sem isto o índice ficaria
  // apontando para além do fim e a tela mostraria o estado vazio por engano.
  useEffect(() => {
    setIndex((current) => Math.min(current, Math.max(0, total - 1)));
  }, [total]);

  const canGoBack = index > 0;
  const canGoForward = index < total - 1;

  const setOffsetValue = (value: number) => {
    offsetRef.current = value;
    setOffset(value);
  };

  const goTo = useCallback(
    (target: number) => {
      setOffsetValue(0);
      setIndex(Math.min(Math.max(target, 0), Math.max(0, total - 1)));
    },
    [total],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const previous = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") previous();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [next, previous]);

  const onPointerDown = (event: React.PointerEvent) => {
    // Só o arraste primário; um clique com o botão direito não move o deck.
    if (event.pointerType === "mouse" && event.button !== 0) return;
    gesture.current = { x: event.clientX, y: event.clientY, horizontal: null };
    setDragging(true);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const start = gesture.current;
    if (!start) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;

    // Decide uma vez se o gesto é horizontal (deck) ou vertical (rolar o texto).
    if (start.horizontal === null) {
      if (Math.abs(dx) < DIRECTION_LOCK && Math.abs(dy) < DIRECTION_LOCK) return;
      start.horizontal = Math.abs(dx) > Math.abs(dy);
      if (!start.horizontal) {
        gesture.current = null;
        setDragging(false);
        setOffsetValue(0);
        return;
      }
      capturePointer(event);
    }

    const blocked = (dx < 0 && !canGoForward) || (dx > 0 && !canGoBack);
    setOffsetValue(blocked ? dx * EDGE_RESISTANCE : dx);
  };

  const finishGesture = (event: React.PointerEvent) => {
    const start = gesture.current;
    if (!start) return;
    releasePointer(event);
    gesture.current = null;
    setDragging(false);

    const travelled = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    if (start.horizontal === null && travelled < TAP_TOLERANCE) {
      setOffsetValue(0);
      onTap?.(index);
      return;
    }

    const current = offsetRef.current;
    if (current <= -COMMIT_DISTANCE && canGoForward) next();
    else if (current >= COMMIT_DISTANCE && canGoBack) previous();
    else setOffsetValue(0);
  };

  return {
    index,
    offset,
    dragging,
    canGoBack,
    canGoForward,
    goTo,
    next,
    previous,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finishGesture,
      onPointerCancel: finishGesture,
    },
  };
}
