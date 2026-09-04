import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NATIVE_COLUMNS } from "@/lib/board/native-columns";
import { DEFAULT_COLUMN_COLORS, type NoteAppearance } from "@/lib/note-appearance";

/** Cor de cada coluna do fluxo, com o valor padrão como ponto de retorno. */
export function NativeColumnColors({
  columnColors,
  onChange,
}: {
  columnColors: NoteAppearance["columnColors"];
  onChange: (columnColors: NoteAppearance["columnColors"]) => void;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <Label className="text-sm font-medium">Cores das colunas nativas</Label>
      <p className="mb-3 mt-0.5 text-xs text-muted-foreground">
        Ajuste a cor de cada coluna do fluxo.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {NATIVE_COLUMNS.map((column) => {
          const value = columnColors[column.key] ?? DEFAULT_COLUMN_COLORS[column.key];
          return (
            <div key={column.key} className="flex items-center gap-2">
              <input
                type="color"
                aria-label={`Cor da coluna ${column.title}`}
                value={value}
                onChange={(event) =>
                  onChange({ ...columnColors, [column.key]: event.target.value })
                }
                className="h-8 w-10 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0.5"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{column.title}</p>
                <p className="text-[11px] text-muted-foreground">{value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onChange({ ...DEFAULT_COLUMN_COLORS });
            toast("Cores das colunas restauradas");
          }}
        >
          Restaurar cores das colunas
        </Button>
      </div>
    </div>
  );
}
