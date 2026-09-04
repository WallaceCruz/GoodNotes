import { forwardRef } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BetweenHorizontalEnd,
  BetweenHorizontalStart,
  BetweenVerticalEnd,
  BetweenVerticalStart,
  Columns3,
  PanelTop,
  Rows3,
  TableCellsMerge,
  TableCellsSplit,
  Trash2,
  X,
} from "lucide-react";
import type { Editor } from "@tiptap/react";
import { moveInTable } from "./table-doc";
import { MenuGroupLabel, MenuItem, MenuSeparator } from "./table-controls";
import { BAR_HEIGHT, MENU_WIDTH, type TableMenuPlacement } from "./table-placement";
import type { TableAnchor } from "./useTableAnchor";

/** Menu suspenso com todos os comandos de linha, coluna, células e tabela. */
export const TableOptionsMenu = forwardRef<
  HTMLDivElement,
  {
    editor: Editor;
    anchor: TableAnchor;
    placement: TableMenuPlacement;
    onClose: () => void;
  }
>(function TableOptionsMenu({ editor, anchor, placement, onClose }, ref) {
  const command = (run: (chain: ReturnType<Editor["chain"]>) => { run: () => boolean }) => {
    return () => run(editor.chain().focus()).run();
  };

  return (
    <div
      ref={ref}
      // Avisa a página de foco da nota para não tratar o Esc como "fechar a nota".
      data-floating-menu=""
      role="dialog"
      aria-label="Opções da tabela"
      onClick={(event) => event.stopPropagation()}
      style={{
        position: "fixed",
        left: placement.barLeft,
        width: MENU_WIDTH,
        maxHeight: placement.menuMaxHeight,
        ...(placement.openUp
          ? { bottom: anchor.viewportHeight - placement.barTop + 4 }
          : { top: placement.barTop + BAR_HEIGHT + 4 }),
      }}
      className="scroll-thin z-50 overflow-y-auto rounded-xl border border-border bg-popover p-1.5 shadow-lg"
    >
      <div className="flex items-center justify-between px-1.5 py-1">
        <span className="text-[13px] font-semibold">Opções da tabela</span>
        <button
          type="button"
          aria-label="Fechar"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onClose}
          className="rounded-full p-0.5 text-muted-foreground hover:bg-accent"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <MenuGroupLabel>Linha</MenuGroupLabel>
      <MenuItem
        label="Inserir acima"
        icon={BetweenVerticalStart}
        onSelect={command((c) => c.addRowBefore())}
      />
      <MenuItem
        label="Inserir abaixo"
        icon={BetweenVerticalEnd}
        onSelect={command((c) => c.addRowAfter())}
      />
      <MenuItem
        label="Mover para cima"
        icon={ArrowUp}
        disabled={!anchor.canRowUp}
        onSelect={() => moveInTable(editor, "row", -1)}
      />
      <MenuItem
        label="Mover para baixo"
        icon={ArrowDown}
        disabled={!anchor.canRowDown}
        onSelect={() => moveInTable(editor, "row", 1)}
      />
      <MenuItem
        label="Excluir linha"
        icon={Rows3}
        danger
        onSelect={command((c) => c.deleteRow())}
      />

      <MenuSeparator />

      <MenuGroupLabel>Coluna</MenuGroupLabel>
      <MenuItem
        label="Inserir à esquerda"
        icon={BetweenHorizontalStart}
        onSelect={command((c) => c.addColumnBefore())}
      />
      <MenuItem
        label="Inserir à direita"
        icon={BetweenHorizontalEnd}
        onSelect={command((c) => c.addColumnAfter())}
      />
      <MenuItem
        label="Mover para a esquerda"
        icon={ArrowLeft}
        disabled={!anchor.canColumnLeft}
        onSelect={() => moveInTable(editor, "column", -1)}
      />
      <MenuItem
        label="Mover para a direita"
        icon={ArrowRight}
        disabled={!anchor.canColumnRight}
        onSelect={() => moveInTable(editor, "column", 1)}
      />
      <MenuItem
        label="Excluir coluna"
        icon={Columns3}
        danger
        onSelect={command((c) => c.deleteColumn())}
      />

      <MenuSeparator />

      <MenuGroupLabel>Células</MenuGroupLabel>
      <MenuItem
        label="Mesclar células"
        icon={TableCellsMerge}
        disabled={!anchor.canMerge}
        onSelect={command((c) => c.mergeCells())}
      />
      <MenuItem
        label="Dividir célula"
        icon={TableCellsSplit}
        disabled={!anchor.canSplit}
        onSelect={command((c) => c.splitCell())}
      />
      <MenuItem
        label="Alternar cabeçalho"
        icon={PanelTop}
        onSelect={command((c) => c.toggleHeaderRow())}
      />

      <MenuSeparator />

      {/* Sem tabela não há menu: este é o único comando que se fecha sozinho. */}
      <MenuItem
        label="Excluir tabela"
        icon={Trash2}
        danger
        onSelect={() => {
          editor.chain().focus().deleteTable().run();
          onClose();
        }}
      />
    </div>
  );
});
