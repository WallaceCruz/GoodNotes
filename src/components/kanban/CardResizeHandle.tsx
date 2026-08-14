import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function CardResizeHandle({
  height,
  defaultHeight,
  min = 120,
  max = 1200,
  onChange,
  onReset,
  className,
}: {
  height: number | null | undefined;
  defaultHeight: number;
  min?: number;
  max?: number;
  onChange: (h: number) => void;
  onReset: () => void;
  className?: string;
}) {
  const start = useRef<{ y: number; h: number } | null>(null);
  const [resizing, setResizing] = useState(false);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    start.current = { y: e.clientY, h: height ?? defaultHeight };
    setResizing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!start.current) return;
    const next = Math.min(max, Math.max(min, start.current.h + (e.clientY - start.current.y)));
    onChange(Math.round(next));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!start.current) return;
    start.current = null;
    setResizing(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div
      role="separator"
      aria-label="Redimensionar altura do card"
      title="Arraste a ponta para redimensionar (duplo clique para restaurar)"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onReset();
      }}
      className={cn(
        "absolute bottom-0 right-0 z-20 flex h-5 w-5 cursor-nwse-resize items-end justify-end rounded-br-lg p-[3px] opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100",
        resizing && "opacity-100",
        className,
      )}
    >
      <svg viewBox="0 0 10 10" className="h-full w-full text-foreground/35" aria-hidden>
        <path
          d="M9 1 L1 9 M9 5 L5 9"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
}
