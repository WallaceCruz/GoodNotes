import { noteSurface } from "@/components/note/note-appearance";
import { cn } from "@/lib/utils";
import type { NoteAppearance } from "@/lib/note-appearance";
import type { NoteColor } from "@/lib/board/model";

/**
 * Nota de exemplo com a aparência aplicada. É o único lugar da tela de conta que
 * mostra o resultado real — daí o conteúdo fixo: comparar estilos exige que só a
 * aparência mude entre um cartão e outro.
 */
export function StickyPreview({
  appearance,
  color = "amber",
  compact = false,
}: {
  appearance: NoteAppearance;
  color?: NoteColor;
  /** Versão reduzida usada dentro dos botões de escolha de estilo. */
  compact?: boolean;
}) {
  const surface = noteSurface(appearance, color, { tilt: !compact });
  return (
    <div
      style={surface.style}
      className={cn(
        "relative overflow-hidden border border-border/60 text-note-foreground",
        compact ? "h-20 w-full" : "w-full",
        surface.className,
      )}
    >
      <p className="note-title-color text-[1.15em] font-semibold leading-snug">Revisar briefing</p>
      <p className="mt-1 opacity-75">Enviar proposta para o cliente até sexta.</p>
      {!compact && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[0.85em] opacity-70">
          <span className="rounded-full border border-current/30 px-2 py-0.5">design</span>
          <span className="rounded-full border border-current/30 px-2 py-0.5">urgente</span>
        </div>
      )}
    </div>
  );
}
