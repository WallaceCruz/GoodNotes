import { Palette } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NOTE_COLORS, type NoteColor } from "@/lib/board/model";
import { noteBg, noteLabel } from "@/components/note/note-style";
import { cn } from "@/lib/utils";

/** Paleta das cores de nota, para pintar uma tag. */
export function TagColorPicker({
  value,
  label,
  onPick,
}: {
  value: NoteColor;
  label: string;
  onPick: (color: NoteColor) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label={label}
          title={label}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <Palette className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-2" onClick={(e) => e.stopPropagation()}>
        <div className="grid grid-cols-6 gap-1.5">
          {NOTE_COLORS.map((color) => (
            <button
              key={color}
              aria-label={noteLabel[color]}
              title={noteLabel[color]}
              onClick={() => onPick(color)}
              className={cn(
                "h-5 w-5 rounded-full border border-border transition hover:scale-110",
                noteBg[color],
                value === color && "ring-2 ring-ring ring-offset-1 ring-offset-popover",
              )}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
