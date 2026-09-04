import { useCallback, useEffect, useRef, useState } from "react";
import { ZoomIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const OUTPUT_SIZE = 256;
const FRAME = 260;

export function AvatarCropDialog({
  file,
  onCancel,
  onConfirm,
}: {
  file: File | null;
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!file) {
      setSrc(null);
      setImg(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setSrc(url);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!src) return;
    const image = new Image();
    image.onload = () => setImg(image);
    image.src = src;
  }, [src]);

  // escala mínima para a imagem sempre cobrir o quadro circular
  const base = img ? Math.max(FRAME / img.width, FRAME / img.height) : 1;
  const scale = base * zoom;

  const clamp = useCallback(
    (next: { x: number; y: number }) => {
      if (!img) return next;
      const maxX = Math.max(0, (img.width * scale - FRAME) / 2);
      const maxY = Math.max(0, (img.height * scale - FRAME) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, next.x)),
        y: Math.min(maxY, Math.max(-maxY, next.y)),
      };
    },
    [img, scale],
  );

  useEffect(() => {
    setOffset((o) => clamp(o));
  }, [clamp]);

  const confirm = () => {
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const ratio = OUTPUT_SIZE / FRAME;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    ctx.imageSmoothingQuality = "high";
    const w = img.width * scale * ratio;
    const h = img.height * scale * ratio;
    ctx.drawImage(
      img,
      OUTPUT_SIZE / 2 - w / 2 + offset.x * ratio,
      OUTPUT_SIZE / 2 - h / 2 + offset.y * ratio,
      w,
      h,
    );
    onConfirm(canvas.toDataURL("image/jpeg", 0.85));
  };

  return (
    <Dialog open={!!file} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar foto</DialogTitle>
          <DialogDescription>
            Arraste para posicionar e use o zoom para enquadrar seu avatar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div
            className="relative touch-none overflow-hidden rounded-full border border-border bg-muted"
            style={{ width: FRAME, height: FRAME }}
            onPointerDown={(e) => {
              dragRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              const start = dragRef.current;
              if (!start) return;
              setOffset(clamp({ x: e.clientX - start.x, y: e.clientY - start.y }));
            }}
            onPointerUp={() => (dragRef.current = null)}
            onPointerCancel={() => (dragRef.current = null)}
          >
            {src && (
              <img
                src={src}
                alt="Pré-visualização do avatar"
                draggable={false}
                className="absolute left-1/2 top-1/2 max-w-none select-none"
                style={{
                  width: img ? img.width * scale : undefined,
                  height: img ? img.height * scale : undefined,
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                  cursor: "grab",
                }}
              />
            )}
          </div>

          <div className="flex w-full items-center gap-3">
            <ZoomIn className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.01}
              onValueChange={(v) => setZoom(v[0] ?? 1)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={confirm} disabled={!img}>
            Salvar foto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
