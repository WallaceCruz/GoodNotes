import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useProjects } from "@/stores/board";
import { hydrateNoteAppearance, useNoteAppearance } from "@/stores/note-appearance";
import {
  NOTE_ALIGN_OPTIONS,
  NOTE_BORDER_OPTIONS,
  NOTE_CORNER_OPTIONS,
  NOTE_FONT_OPTIONS,
  NOTE_SHADOW_OPTIONS,
  NOTE_SIZE_OPTIONS,
  type NoteAppearance,
} from "@/lib/note-appearance";
import { ACCOUNT_SCOPE, AppearanceScopePicker } from "./note-appearance/AppearanceScopePicker";
import { ChipField, ColorField, ToggleField } from "./note-appearance/appearance-fields";
import { NativeColumnColors } from "./note-appearance/NativeColumnColors";
import { StickyPreview } from "./note-appearance/StickyPreview";
import { StylePicker } from "./note-appearance/StylePicker";

/** Ajustes de aparência das notas, aplicáveis à conta ou a um projeto. */
export function NoteAppearanceSection() {
  // Página renderizada sem gate de hidratação: sem isto o preview mostraria o
  // padrão no primeiro paint do servidor e trocaria de repente pelo valor
  // salvo assim que o cliente carregasse — a mesma divergência que o efeito
  // em `routes/index.tsx` evita para o quadro.
  useEffect(() => {
    hydrateNoteAppearance();
  }, []);

  const [scope, setScope] = useState<string>(ACCOUNT_SCOPE);
  const projectId = scope === ACCOUNT_SCOPE ? null : scope;
  const projects = useProjects().filter((project) => !project.archived);

  const { appearance, hasProjectOverride, update, reset, setProjectOverride } =
    useNoteAppearance(projectId);

  // Um projeto que herda o padrão da conta não tem o que editar: gravar aqui
  // mudaria uma aparência que ele nem usa.
  const inheritsAccountDefault = Boolean(projectId) && !hasProjectOverride;

  const set = (patch: Partial<NoteAppearance>) => {
    if (inheritsAccountDefault) {
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
            Estilos das notas autoadesivas, por conta ou por projeto.
          </p>
        </div>
        <AppearanceScopePicker scope={scope} projects={projects} onChange={setScope} />
      </div>

      {projectId && (
        <ToggleField
          boxed
          label="Personalizar este projeto"
          hint="Desligado, o projeto herda o padrão da conta."
          checked={hasProjectOverride}
          onChange={(enabled) => {
            setProjectOverride(enabled);
            toast(enabled ? "Projeto com aparência própria" : "Projeto herdando o padrão da conta");
          }}
        />
      )}

      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-5">
        <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">
          Pré-visualização
        </p>
        <StickyPreview appearance={appearance} />
      </div>

      <div className="space-y-3">
        <Label className="text-xs">Estilo da nota autoadesiva</Label>
        <StylePicker appearance={appearance} onSelect={(style) => set({ style })} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <ChipField
          label="Tamanho"
          value={appearance.size}
          options={NOTE_SIZE_OPTIONS}
          onChange={(size) => set({ size })}
        />
        <ChipField
          label="Alinhamento do conteúdo"
          value={appearance.align}
          options={NOTE_ALIGN_OPTIONS}
          onChange={(align) => set({ align })}
        />
        <ChipField
          label="Cantos"
          value={appearance.corners}
          options={NOTE_CORNER_OPTIONS}
          onChange={(corners) => set({ corners })}
        />
        <ChipField
          label="Sombra"
          value={appearance.shadow}
          options={NOTE_SHADOW_OPTIONS}
          onChange={(shadow) => set({ shadow })}
        />
        <ChipField
          label="Borda"
          value={appearance.border}
          options={NOTE_BORDER_OPTIONS}
          onChange={(border) => set({ border })}
        />
        <ChipField
          label="Tipografia"
          value={appearance.font}
          options={NOTE_FONT_OPTIONS}
          onChange={(font) => set({ font })}
        />
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

      <ToggleField
        label="Inclinação natural"
        hint="Leve rotação alternada, como post-its colados à mão."
        checked={appearance.tilt}
        onChange={(tilt) => set({ tilt })}
      />

      <ToggleField
        label="Colunas nativas coloridas"
        hint="Backlog cinza, Research rosa, Discovery roxo, Em andamento azul, Em revisão âmbar e Concluído verde. Desligado, as colunas ficam sem cor."
        checked={appearance.nativeColumnColors}
        onChange={(nativeColumnColors) => set({ nativeColumnColors })}
      />

      {appearance.nativeColumnColors && (
        <NativeColumnColors
          columnColors={appearance.columnColors}
          onChange={(columnColors) => set({ columnColors })}
        />
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
