import { StickyPreview } from "./StickyPreview";
import { cn } from "@/lib/utils";
import { NOTE_STYLE_OPTIONS, type NoteAppearance, type NoteStyle } from "@/lib/note-appearance";
import type { NoteColor } from "@/lib/board/model";

/**
 * Cada estilo aparece na cor que melhor o revela: o degradê de pôr do sol some
 * no âmbar padrão, e o vidro precisa de um fundo frio para se ler como vidro.
 */
const STYLE_PREVIEW_COLOR: Partial<Record<NoteStyle, NoteColor>> = {
  glass: "sky",
  outline: "mint",
  neon: "violet",
  duo: "peach",
  radial: "teal",
  sunset: "coral",
  paper: "sand",
};

/** Grade de estilos, cada um mostrado como a nota que vai virar. */
export function StylePicker({
  appearance,
  onSelect,
}: {
  appearance: NoteAppearance;
  onSelect: (style: NoteStyle) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {NOTE_STYLE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onSelect(option.value)}
          className={cn(
            "rounded-lg border p-2 text-left transition-colors",
            appearance.style === option.value
              ? "border-foreground bg-accent/50"
              : "border-border hover:bg-accent/30",
          )}
        >
          <StickyPreview
            appearance={{ ...appearance, style: option.value }}
            color={STYLE_PREVIEW_COLOR[option.value] ?? "amber"}
            compact
          />
          <p className="mt-2 text-xs font-medium">{option.label}</p>
          <p className="text-[11px] text-muted-foreground">{option.hint}</p>
        </button>
      ))}
    </div>
  );
}
