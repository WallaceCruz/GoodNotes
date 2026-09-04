import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 8;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function ImageLightbox({
  images,
  index,
  onIndexChange,
  onClose,
}: {
  images: string[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const reset = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    reset();
  }, [index, reset]);

  const go = useCallback(
    (delta: number) => {
      if (images.length < 2) return;
      onIndexChange((index + delta + images.length) % images.length);
    },
    [images.length, index, onIndexChange],
  );

  const zoomAt = useCallback((factor: number, px: number, py: number) => {
    setZoom((z) => {
      const next = clamp(z * factor, MIN_ZOOM, MAX_ZOOM);
      const k = next / z;
      setOffset((o) => ({ x: px - (px - o.x) * k, y: py - (py - o.y) * k }));
      return next;
    });
  }, []);

  const zoomAtRef = useRef(zoomAt);
  zoomAtRef.current = zoomAt;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      zoomAtRef.current(Math.exp(-dy * 0.0015), e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "0") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose, reset]);

  const centerZoom = (factor: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    zoomAt(factor, (rect?.width ?? 0) / 2, (rect?.height ?? 0) / 2);
  };

  const src = images[index];
  if (!src) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className="text-sm font-medium text-muted-foreground">
          Imagem {index + 1} de {images.length}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            aria-label="Reduzir zoom"
            onClick={() => centerZoom(1 / 1.3)}
            className="rounded-md border border-border p-1.5 hover:bg-accent"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-14 text-center text-xs tabular-nums text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <button
            aria-label="Ampliar zoom"
            onClick={() => centerZoom(1.3)}
            className="rounded-md border border-border p-1.5 hover:bg-accent"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            aria-label="Redefinir zoom"
            onClick={reset}
            className="rounded-md border border-border p-1.5 hover:bg-accent"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            aria-label="Fechar visualização"
            onClick={onClose}
            className="rounded-md border border-border p-1.5 hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden"
        style={{ cursor: dragRef.current ? "grabbing" : "grab", touchAction: "none" }}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
        }}
        onPointerMove={(e) => {
          const d = dragRef.current;
          if (!d) return;
          setOffset({ x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) });
        }}
        onPointerUp={() => {
          dragRef.current = null;
        }}
        onDoubleClick={(e) => {
          const rect = containerRef.current?.getBoundingClientRect();
          if (!rect) return;
          if (zoom > 1) reset();
          else zoomAt(2, e.clientX - rect.left, e.clientY - rect.top);
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={src}
            alt={`Imagem ${index + 1} da nota`}
            draggable={false}
            className="max-h-full max-w-full select-none object-contain"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: "center center",
            }}
          />
        </div>

        {images.length > 1 && (
          <>
            <button
              aria-label="Imagem anterior"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-border bg-background/80 p-2 shadow-sm hover:bg-accent"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              aria-label="Próxima imagem"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-border bg-background/80 p-2 shadow-sm hover:bg-accent"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <footer className="flex items-center gap-2 overflow-x-auto border-t border-border px-3 py-2">
          {images.map((img, i) => (
            <button
              key={`${img.slice(0, 24)}-${i}`}
              onClick={() => onIndexChange(i)}
              aria-label={`Ver imagem ${i + 1}`}
              className={
                "h-12 w-16 shrink-0 overflow-hidden rounded border " +
                (i === index ? "border-ring ring-2 ring-ring" : "border-border opacity-70")
              }
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </footer>
      )}
    </div>
  );
}
