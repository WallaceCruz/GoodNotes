import { NOTE_COLORS, type Note } from "@/lib/board/model";
import { cn } from "@/lib/utils";
import { noteBg, noteLabel } from "@/components/note/note-style";
import { Group } from "./panel-controls";

/** Cor de fundo desta nota específica e a altura que ela ocupa no quadro. */
export function StyleTab({
  note,
  onChange,
}: {
  note: Note;
  onChange: (patch: Partial<Note>) => void;
}) {
  return (
    <>
      <Group title="Cor da nota">
        <div className="flex flex-wrap gap-2">
          {NOTE_COLORS.map((color) => (
            <button
              key={color}
              aria-label={noteLabel[color]}
              title={noteLabel[color]}
              onClick={() => onChange({ color, colorHex: null })}
              className={cn(
                "h-7 w-7 rounded-full border border-border",
                noteBg[color],
                note.color === color &&
                  !note.colorHex &&
                  "ring-2 ring-ring ring-offset-2 ring-offset-background",
              )}
            />
          ))}
        </div>
      </Group>

      <Group title="Cor personalizada">
        <div className="flex items-center gap-2">
          <input
            type="color"
            aria-label="Cor personalizada da nota"
            value={note.colorHex ?? "#f4c7d6"}
            onChange={(e) => onChange({ colorHex: e.target.value })}
            className="h-9 w-16 cursor-pointer rounded-lg border border-border bg-transparent"
          />
          <span className="text-xs text-muted-foreground">
            {note.colorHex ?? "usando a paleta"}
          </span>
          {note.colorHex && (
            <button
              onClick={() => onChange({ colorHex: null })}
              className="ml-auto rounded-lg border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent"
            >
              Remover
            </button>
          )}
        </div>
      </Group>

      <Group title="Altura no quadro">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {note.height ? `${note.height}px fixos` : "ajusta ao conteúdo"}
          </span>
          {note.height && (
            <button
              onClick={() => onChange({ height: null })}
              className="ml-auto rounded-lg border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent"
            >
              Redefinir
            </button>
          )}
        </div>
      </Group>
    </>
  );
}
