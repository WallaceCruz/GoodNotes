import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { noteSurface, notepadSurface } from "@/components/kanban/note-appearance";
import { useBoardStore } from "@/hooks/useBoardStore";
import {
  NOTE_ALIGN_OPTIONS,
  NOTE_CORNER_OPTIONS,
  NOTE_FONT_OPTIONS,
  NOTE_SHADOW_OPTIONS,
  NOTE_SIZE_OPTIONS,
  NOTE_STYLE_OPTIONS,
  NOTEPAD_STYLE_OPTIONS,
  DEFAULT_COLUMN_COLORS,
  useNoteAppearance,
  type NoteAppearance,
} from "@/hooks/useNoteAppearance";
import { NATIVE_COLUMNS } from "@/lib/board-types";
import { cn } from "@/lib/utils";

const ACCOUNT = "__account__";

function StickyPreview({
  appearance,
  color = "amber",
  compact = false,
}: {
  appearance: NoteAppearance;
  color?: "amber" | "sky" | "mint";
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

function NotepadPreview({
  appearance,
  compact = false,
}: {
  appearance: NoteAppearance;
  compact?: boolean;
}) {
  const surface = notepadSurface(appearance, { tilt: !compact });
  return (
    <div
      style={surface.style}
      className={cn(
        "relative overflow-hidden border border-border/80 text-foreground",
        compact ? "h-20 w-full" : "w-full",
        surface.className,
      )}
    >
      <p className="note-title-color text-[1.15em] font-bold leading-tight">Bloco de notas</p>
      <p className="mt-1 opacity-75">Anotações da reunião</p>
      {!compact && <p className="mt-1 opacity-60">Definir escopo, prazos e responsáveis.</p>}
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

function ColorField({
  label,
  hint,
  value,
  fallback,
  onChange,
}: {
  label: string;
  hint: string;
  value: string | null;
  fallback: string;
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={label}
          value={value ?? fallback}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
        />
        <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
          {value ?? hint}
        </span>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
          >
            limpar
          </button>
        )}
      </div>
    </div>
  );
}

export function NoteAppearanceSection() {
  const store = useBoardStore();
  const [target, setTarget] = useState<string>(ACCOUNT);
  const projects = store.state.projects.filter((p) => !p.archived);
  const projectId = target === ACCOUNT ? null : target;
  const { appearance, hasProjectOverride, update, reset, setProjectOverride } =
    useNoteAppearance(projectId);
  const editingLocked = Boolean(projectId) && !hasProjectOverride;

  const set = (patch: Partial<NoteAppearance>) => {
    if (editingLocked) {
      toast("Ative a personalização deste projeto para editar");
      return;
    }
    update(patch);
  };

  return (
    <section className="space-y-6 rounded-lg border border-border bg-background p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Aparência das notas</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Estilos das notas autoadesivas e dos blocos de notas, por conta ou por projeto.
          </p>
        </div>
        <div className="w-60">
          <Label className="text-xs">Aplicar em</Label>
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ACCOUNT}>Padrão da conta</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {projectId && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
          <div>
            <Label className="text-sm font-medium">Personalizar este projeto</Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Desligado, o projeto herda o padrão da conta.
            </p>
          </div>
          <Switch
            checked={hasProjectOverride}
            onCheckedChange={(v) => {
              setProjectOverride(v);
              toast(v ? "Projeto com aparência própria" : "Projeto herdando o padrão da conta");
            }}
          />
        </div>
      )}

      <div className="grid gap-4 rounded-lg border border-dashed border-border bg-muted/30 p-5 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Nota autoadesiva
          </p>
          <StickyPreview appearance={appearance} />
        </div>
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Bloco de notas
          </p>
          <NotepadPreview appearance={appearance} />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs">Estilo da nota autoadesiva</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {NOTE_STYLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set({ style: opt.value })}
              className={cn(
                "rounded-lg border p-2 text-left transition-colors",
                appearance.style === opt.value
                  ? "border-foreground bg-accent/50"
                  : "border-border hover:bg-accent/30",
              )}
            >
              <StickyPreview
                appearance={{ ...appearance, style: opt.value }}
                color={opt.value === "glass" ? "sky" : opt.value === "outline" ? "mint" : "amber"}
                compact
              />
              <p className="mt-2 text-xs font-medium">{opt.label}</p>
              <p className="text-[11px] text-muted-foreground">{opt.hint}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs">Estilo do bloco de notas</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {NOTEPAD_STYLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set({ notepadStyle: opt.value })}
              className={cn(
                "rounded-lg border p-2 text-left transition-colors",
                appearance.notepadStyle === opt.value
                  ? "border-foreground bg-accent/50"
                  : "border-border hover:bg-accent/30",
              )}
            >
              <NotepadPreview appearance={{ ...appearance, notepadStyle: opt.value }} compact />
              <p className="mt-2 text-xs font-medium">{opt.label}</p>
              <p className="text-[11px] text-muted-foreground">{opt.hint}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label className="text-xs">Tamanho</Label>
          <Chips
            value={appearance.size}
            options={NOTE_SIZE_OPTIONS}
            onChange={(size) => set({ size })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Alinhamento do conteúdo</Label>
          <Chips
            value={appearance.align}
            options={NOTE_ALIGN_OPTIONS}
            onChange={(align) => set({ align })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Cantos</Label>
          <Chips
            value={appearance.corners}
            options={NOTE_CORNER_OPTIONS}
            onChange={(corners) => set({ corners })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Sombra</Label>
          <Chips
            value={appearance.shadow}
            options={NOTE_SHADOW_OPTIONS}
            onChange={(shadow) => set({ shadow })}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Tipografia</Label>
          <Chips
            value={appearance.font}
            options={NOTE_FONT_OPTIONS}
            onChange={(font) => set({ font })}
          />
        </div>
      </div>

      <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
        <ColorField
          label="Cor de fundo"
          hint="Cor da própria nota"
          value={appearance.bgColor}
          fallback="#fde68a"
          onChange={(bgColor) => set({ bgColor })}
        />
        <ColorField
          label="Cor do título"
          hint="Herdada do tema"
          value={appearance.titleColor}
          fallback="#1f2937"
          onChange={(titleColor) => set({ titleColor })}
        />
        <ColorField
          label="Cor da fita / margem"
          hint="Usada nos estilos Fita e Margem"
          value={appearance.accentColor}
          fallback="#ffffff"
          onChange={(accentColor) => set({ accentColor })}
        />
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div>
          <Label className="text-sm font-medium">Inclinação natural</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Leve rotação alternada, como post-its colados à mão.
          </p>
        </div>
        <Switch checked={appearance.tilt} onCheckedChange={(tilt) => set({ tilt })} />
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div>
          <Label className="text-sm font-medium">Colunas nativas coloridas</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Backlog cinza, Research rosa, Discovery roxo, Em andamento azul, Em revisão âmbar e
            Concluído verde. Desligado, as colunas ficam sem cor.
          </p>
        </div>
        <Switch
          checked={appearance.nativeColumnColors}
          onCheckedChange={(nativeColumnColors) => set({ nativeColumnColors })}
        />
      </div>

      {appearance.nativeColumnColors && (
        <div className="rounded-lg border border-border p-4">
          <Label className="text-sm font-medium">Cores das colunas nativas</Label>
          <p className="mt-0.5 mb-3 text-xs text-muted-foreground">
            Ajuste a cor de cada coluna do fluxo.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {NATIVE_COLUMNS.map((c) => {
              const value = appearance.columnColors[c.key] ?? DEFAULT_COLUMN_COLORS[c.key];
              return (
                <div key={c.key} className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label={`Cor da coluna ${c.title}`}
                    value={value}
                    onChange={(e) =>
                      set({
                        columnColors: { ...appearance.columnColors, [c.key]: e.target.value },
                      })
                    }
                    className="h-8 w-10 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0.5"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{c.title}</p>
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
                set({ columnColors: { ...DEFAULT_COLUMN_COLORS } });
                toast("Cores das colunas restauradas");
              }}
            >
              Restaurar cores das colunas
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            reset();
            toast(projectId ? "Projeto restaurado ao padrão da conta" : "Aparência restaurada");
          }}
        >
          Restaurar aparência padrão
        </Button>
      </div>
    </section>
  );
}
