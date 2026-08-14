import { useRef } from "react";
import { cn } from "@/lib/utils";

export function CardResizeHandle({
  height,
  defaultHeight,
  min = 96,
  max = 900,
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

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    start.current = { y: e.clientY, h: height ?? defaultHeight };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!start.current) return;
    const next = Math.min(max, Math.max(min, start.current.h + (e.clientY - start.current.y)));
    onChange(Math.round(next));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    start.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div
      role="separator"
      aria-label="Redimensionar altura do card"
      title="Arraste para redimensionar (duplo clique para restaurar)"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onReset();
      }}
      className={cn(
        "flex h-3 cursor-ns-resize items-center justify-center opacity-0 transition-opacity group-hover:opacity-100",
        className,
      )}
    >
      <span className="h-1 w-10 rounded-full bg-foreground/20" />
    </div>
  );
}
