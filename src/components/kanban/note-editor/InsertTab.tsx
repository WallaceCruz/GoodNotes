import { useRef, useState } from "react";
import { Film, GripVertical, ImagePlus, Link2, ListChecks } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";
import {
  BLOCK_DRAG_MIME,
  TEXT_BLOCKS,
  insertBlock,
  insertMediaFiles,
  insertMediaUrl,
  insertTable,
} from "../editor-blocks";
import { BlockRow, Group } from "./panel-controls";
import type { Note } from "@/lib/board-types";

const TABLE_ROWS = 5;
const TABLE_COLS = 8;

const dragBlock = (kind: string) => (event: React.DragEvent) => {
  event.dataTransfer.setData(BLOCK_DRAG_MIME, kind);
  event.dataTransfer.effectAllowed = "copy";
};

/** Catálogo do que dá para colocar dentro da nota: blocos, mídia, linha e tabela. */
export function InsertTab({
  note,
  editor,
  enabled,
  run,
  onChange,
}: {
  note: Note;
  editor: Editor | null | undefined;
  enabled: boolean;
  run: (command: (editor: Editor) => void) => () => void;
  onChange: (patch: Partial<Note>) => void;
}) {
  const [grid, setGrid] = useState<{ rows: number; cols: number } | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const mediaInput = useRef<HTMLInputElement>(null);

  const pickMedia = (files: FileList | null) => {
    if (editor && !editor.isDestroyed) void insertMediaFiles(editor, files);
  };

  return (
    <>
      <div className="space-y-1.5">
        {TEXT_BLOCKS.map(({ kind, label, icon }) => (
          <BlockRow
            key={kind}
            label={label}
            icon={icon}
            enabled={enabled}
            onClick={run((ed) => insertBlock(ed, kind))}
            onDragStart={dragBlock(kind)}
          />
        ))}
        <BlockRow
          label="Imagem"
          icon={ImagePlus}
          enabled={enabled}
          onClick={() => imageInput.current?.click()}
        />
        <BlockRow
          label="GIF ou vídeo"
          icon={Film}
          enabled={enabled}
          onClick={() => mediaInput.current?.click()}
        />
        <BlockRow
          label="Mídia por link"
          icon={Link2}
          enabled={enabled}
          onClick={run((ed) => {
            const url = window.prompt("Cole o link do GIF ou vídeo (https://...)");
            if (url?.trim()) insertMediaUrl(ed, url);
          })}
        />
      </div>

      <Group title="Da nota">
        <button
          onClick={() => onChange({ showChecklist: !note.showChecklist })}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-[13px] transition-colors",
            note.showChecklist
              ? "border-primary bg-primary/10"
              : "border-border bg-card hover:bg-accent",
          )}
        >
          <ListChecks className="h-4 w-4 shrink-0 text-muted-foreground" />
          Checklist
          <span className="ml-auto text-[11px] text-muted-foreground">
            {note.showChecklist ? "visível" : "oculto"}
          </span>
        </button>
      </Group>

      <Group title="Inserir linha">
        <div
          draggable={enabled}
          onDragStart={dragBlock("divider")}
          onClick={run((ed) => insertBlock(ed, "divider"))}
          className={cn(
            "flex items-center gap-2.5 rounded-lg border border-border bg-card px-2.5 py-3 transition-colors",
            enabled ? "cursor-grab hover:bg-accent active:cursor-grabbing" : "opacity-40",
          )}
        >
          <span className="h-px flex-1 bg-foreground/30" />
          <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
        </div>
      </Group>

      <Group title="Inserir tabela">
        <p className="-mt-1 mb-2 text-[11px] text-muted-foreground">
          {grid
            ? `${grid.rows} linha(s) × ${grid.cols} coluna(s)`
            : "Insira uma tabela com o número destacado de linhas e colunas."}
        </p>
        <div
          className="grid grid-cols-8 gap-1"
          onMouseLeave={() => setGrid(null)}
          onDragStart={dragBlock("table")}
          draggable={enabled}
        >
          {Array.from({ length: TABLE_ROWS * TABLE_COLS }, (_, index) => {
            const rows = Math.floor(index / TABLE_COLS) + 1;
            const cols = (index % TABLE_COLS) + 1;
            const highlighted = !!grid && rows <= grid.rows && cols <= grid.cols;
            return (
              <button
                key={index}
                type="button"
                aria-label={`Tabela ${rows} por ${cols}`}
                disabled={!enabled}
                onMouseEnter={() => setGrid({ rows, cols })}
                onMouseDown={(e) => e.preventDefault()}
                onClick={run((ed) => insertTable(ed, rows, cols))}
                className={cn(
                  "h-6 rounded-md border transition-colors disabled:opacity-40",
                  highlighted ? "border-primary bg-primary/60" : "border-border bg-muted",
                )}
              />
            );
          })}
        </div>
      </Group>

      <input
        ref={imageInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          pickMedia(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={mediaInput}
        type="file"
        accept="video/*,image/gif"
        multiple
        hidden
        onChange={(e) => {
          pickMedia(e.target.files);
          e.target.value = "";
        }}
      />
    </>
  );
}
