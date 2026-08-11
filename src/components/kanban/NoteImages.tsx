import { ImagePlus, Link2, Trash2 } from "lucide-react";
import { useState } from "react";
import type { NoteImage } from "@/lib/board-types";

export function NoteImages({
  images,
  onAdd,
  onUpdate,
  onRemove,
}: {
  images: NoteImage[];
  onAdd: (url: string, link: string) => void;
  onUpdate: (id: string, patch: Partial<NoteImage>) => void;
  onRemove: (id: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [link, setLink] = useState("");

  const add = () => {
    const u = url.trim();
    if (!u) return;
    onAdd(u, link.trim());
    setUrl("");
    setLink("");
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onAdd(String(reader.result), "");
    reader.readAsDataURL(file);
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
        Imagens
      </p>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {images.map((img) => (
          <figure key={img.id} className="group/img relative overflow-hidden rounded-md border border-border/60">
            {img.link ? (
              <a href={img.link} target="_blank" rel="noreferrer noopener">
                <img src={img.url} alt="Imagem da nota" loading="lazy" className="h-24 w-full object-cover" />
              </a>
            ) : (
              <img src={img.url} alt="Imagem da nota" loading="lazy" className="h-24 w-full object-cover" />
            )}
            <div className="flex items-center gap-1 bg-background/80 px-1 py-0.5">
              <Link2 className="h-3 w-3 text-muted-foreground" />
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

      <div className="mt-2 space-y-1">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL da imagem"
          aria-label="URL da imagem"
          className="w-full rounded-md border border-border/60 bg-background/40 px-2 py-1 text-[11px] outline-none"
        />
        <div className="flex items-center gap-1">
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Link ao clicar (opcional)"
            aria-label="Link da nova imagem"
            className="w-full rounded-md border border-border/60 bg-background/40 px-2 py-1 text-[11px] outline-none"
          />
          <button onClick={add} aria-label="Adicionar imagem" className="text-foreground/60">
            <ImagePlus className="h-4 w-4" />
          </button>
        </div>
        <label className="flex cursor-pointer items-center gap-1 text-[10px] text-muted-foreground">
          ou enviar do computador
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <span className="rounded border border-border px-1.5 py-0.5">Escolher arquivo</span>
        </label>
      </div>
    </div>
  );
}
