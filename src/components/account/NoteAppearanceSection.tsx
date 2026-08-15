import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { noteSurface } from "@/components/kanban/note-appearance";
import {
  NOTE_CORNER_OPTIONS,
  NOTE_FONT_OPTIONS,
  NOTE_SHADOW_OPTIONS,
  NOTE_STYLE_OPTIONS,
  useNoteAppearance,
  type NoteAppearance,
} from "@/hooks/useNoteAppearance";
import { cn } from "@/lib/utils";

function Preview({
  appearance,
  color,
  label,
}: {
  appearance: NoteAppearance;
  color: "amber" | "sky" | "mint";
  label: string;
}) {
  const surface = noteSurface(appearance, color, { tilt: false });
  return (
    <div
      style={surface.style}
      className={cn(
        "relative h-20 w-full overflow-hidden border border-border/60 p-2 text-note-foreground",
        surface.className,
      )}
    >
      <p className="text-[11px] font-semibold">{label}</p>
      <p className="mt-1 text-[10px] opacity-70">Revisar briefing e enviar</p>
    </div>
  );
}

function Chips<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs transition-colors",
            value === o.value
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground hover:bg-accent",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function NoteAppearanceSection() {
  const { appearance, update, reset } = useNoteAppearance();

  return (
    <section className="space-y-5 rounded-lg border border-border bg-background p-6">
      <div>
        <h2 className="text-sm font-semibold">Aparência das notas</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Escolha o estilo visual das notas autoadesivas no quadro.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {NOTE_STYLE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => update({ style: opt.value })}
            className={cn(
              "rounded-lg border p-2 text-left transition-colors",
              appearance.style === opt.value
                ? "border-foreground bg-accent/50"
                : "border-border hover:bg-accent/30",
            )}
          >
            <Preview
              appearance={{ ...appearance, style: opt.value }}
              color={opt.value === "glass" ? "sky" : opt.value === "outline" ? "mint" : "amber"}
              label={opt.label}
            />
            <p className="mt-2 text-xs font-medium">{opt.label}</p>
            <p className="text-[11px] text-muted-foreground">{opt.hint}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label className="text-xs">Cantos</Label>
          <Chips
            value={appearance.corners}
            options={NOTE_CORNER_OPTIONS}
            onChange={(corners) => update({ corners })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Sombra</Label>
          <Chips
            value={appearance.shadow}
            options={NOTE_SHADOW_OPTIONS}
            onChange={(shadow) => update({ shadow })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Tipografia</Label>
          <Chips
            value={appearance.font}
            options={NOTE_FONT_OPTIONS}
            onChange={(font) => update({ font })}
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div>
          <Label className="text-sm font-medium">Inclinação natural</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Leve rotação alternada, como post-its colados à mão.
          </p>
        </div>
        <Switch checked={appearance.tilt} onCheckedChange={(tilt) => update({ tilt })} />
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            reset();
            toast("Aparência restaurada");
          }}
        >
          Restaurar aparência padrão
        </Button>
      </div>
    </section>
  );
}
