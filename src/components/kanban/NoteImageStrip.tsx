import { ImagePlus, Link2, Trash2, Upload } from "lucide-react";
import { useRef } from "react";
import type { NoteImage } from "@/lib/board-types";

export function NoteImageStrip({
  images,
  onAdd,
  onUpdate,
  onRemove,
  compact = false,
}: {
  images: NoteImage[];
  onAdd: (url: string, link?: string) => void;
  onUpdate: (id: string, patch: Partial<NoteImage>) => void;
  onRemove: (id: string) => void;
  compact?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const readFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => onAdd(String(reader.result));
      reader.readAsDataURL(file);
    });
  };

  const askUrl = () => {
    const url = window.prompt("Cole a URL da imagem");
    if (url?.trim()) onAdd(url.trim());
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPaste={(e) => {
        const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
        const file = item?.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = () => onAdd(String(reader.result));
          reader.readAsDataURL(file);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        readFiles(e.dataTransfer.files);
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5">
          {images.map((img) => (
            <figure
              key={img.id}
              className="group/img relative overflow-hidden rounded-md border border-border/50"
            >
              {img.link ? (
                <a href={img.link} target="_blank" rel="noreferrer noopener">
                  <img
                    src={img.url}
                    alt="Imagem da nota"
                    loading="lazy"
                    className={compact ? "h-20 w-full object-cover" : "h-24 w-full object-cover"}
                  />
                </a>
              ) : (
                <img
                  src={img.url}
                  alt="Imagem da nota"
                  loading="lazy"
                  className={compact ? "h-20 w-full object-cover" : "h-24 w-full object-cover"}
                />
              )}
              <div className="flex items-center gap-1 bg-background/80 px-1 py-0.5">
                <Link2 className="h-3 w-3 shrink-0 text-muted-foreground" />
                <input
                  value={img.link}
                  onChange={(e) => onUpdate(img.id, { link: e.target.value })}
                  placeholder="https://link"
                  aria-label="Link da imagem"
                  className="w-full bg-transparent text-[10px] outline-none"
                />
                <button aria-label="Remover imagem" onClick={() => onRemove(img.id)}>
                  <Trash2 className="h-3 w-3 text-foreground/50" />
                </button>
              </div>
            </figure>
          ))}
        </div>
      )}

      <div className="mt-1.5 flex items-center gap-1">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1 rounded-md border border-dashed border-foreground/25 px-1.5 py-0.5 text-[10px] text-foreground/60 hover:bg-foreground/5"
        >
          <Upload className="h-3 w-3" />
          Enviar imagem
        </button>
        <button
          onClick={askUrl}
          aria-label="Adicionar imagem por URL"
          className="flex items-center gap-1 rounded-md border border-dashed border-foreground/25 px-1.5 py-0.5 text-[10px] text-foreground/60 hover:bg-foreground/5"
        >
          <ImagePlus className="h-3 w-3" />
          URL
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => readFiles(e.target.files)}
        />
      </div>
    </div>
  );
}
