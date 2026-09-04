import { forwardRef } from "react";
import { BetweenHorizontalEnd, BetweenVerticalEnd, MoreHorizontal } from "lucide-react";
import type { Editor } from "@tiptap/react";
import { ToolbarButton } from "./table-controls";
import { BAR_HEIGHT } from "./table-placement";

/** Barra fixa acima da tabela: os dois comandos mais usados e o acesso ao resto. */
export const TableToolbar = forwardRef<
  HTMLDivElement,
  {
    editor: Editor;
    top: number;
    left: number;
    menuOpen: boolean;
    onToggleMenu: () => void;
  }
>(function TableToolbar({ editor, top, left, menuOpen, onToggleMenu }, ref) {
  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label="Ferramentas da tabela"
      style={{ position: "fixed", top, left, height: BAR_HEIGHT }}
      className="z-50 flex items-center gap-0.5 rounded-lg border border-border bg-popover/95 px-1 shadow-md backdrop-blur"
    >
      <span className="px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Tabela
      </span>
      <ToolbarButton
        label="Inserir linha abaixo"
        icon={BetweenVerticalEnd}
        onSelect={() => editor.chain().focus().addRowAfter().run()}
      />
      <ToolbarButton
        label="Inserir coluna à direita"
        icon={BetweenHorizontalEnd}
        onSelect={() => editor.chain().focus().addColumnAfter().run()}
      />
      <span className="mx-0.5 h-4 w-px bg-border" />
      <ToolbarButton
        label="Mais opções da tabela"
        icon={MoreHorizontal}
        active={menuOpen}
        onSelect={onToggleMenu}
      />
    </div>
  );
});
