import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Fragment, type Node as PMNode } from "@tiptap/pm/model";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Columns3,
  Grip,
  Rows3,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Info = { table: PMNode; pos: number; rowIndex: number; cellIndex: number };

function tableInfo(editor: Editor): Info | null {
  const { $from } = editor.state.selection;
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type.name === "table") {
      return {
        table: $from.node(d),
        pos: $from.before(d),
        rowIndex: $from.index(d),
        cellIndex: $from.index(d + 1),
      };
    }
  }
  return null;
}

function swapChildren(node: PMNode, a: number, b: number): PMNode {
  const kids: PMNode[] = [];
  node.forEach((child) => kids.push(child));
  const first = kids[a];
  const second = kids[b];
  if (!first || !second) return node;
  kids[a] = second;
  kids[b] = first;
  return node.type.create(node.attrs, Fragment.fromArray(kids), node.marks);
}

export function TableMenu({
  editor,
  containerRef,
}: {
  editor: Editor | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const update = () => {
      if (editor.isDestroyed || !editor.isActive("table")) {
        setAnchor(null);
        setOpen(false);
        return;
      }
      const { from } = editor.state.selection;
      const dom = editor.view.domAtPos(from).node as globalThis.Node;
      const el = (dom.nodeType === 3 ? dom.parentElement : (dom as HTMLElement)) ?? null;
      const cell = el?.closest("td,th") as HTMLElement | null;
      const box = containerRef.current?.getBoundingClientRect();
      if (!cell || !box) {
        setAnchor(null);
        return;
      }
      const r = cell.getBoundingClientRect();
      setAnchor({ top: r.top - box.top + 2, left: r.right - box.left - 18 });
    };
    update();
    editor.on("transaction", update);
    editor.on("selectionUpdate", update);
    return () => {
      editor.off("transaction", update);
      editor.off("selectionUpdate", update);
    };
  }, [editor, containerRef]);

  if (!editor || !anchor) return null;

  const move = (axis: "row" | "col", dir: -1 | 1) => {
    const info = tableInfo(editor);
    if (!info) return;
    const { table, pos, rowIndex, cellIndex } = info;
    let next: PMNode;
    if (axis === "row") {
      const target = rowIndex + dir;
      if (target < 0 || target >= table.childCount) return;
      next = swapChildren(table, rowIndex, target);
    } else {
      const target = cellIndex + dir;
      const rows: PMNode[] = [];
      let ok = true;
      table.forEach((row) => {
        if (target < 0 || target >= row.childCount) ok = false;
        rows.push(swapChildren(row, cellIndex, target));
      });
      if (!ok) return;
      next = table.type.create(table.attrs, Fragment.fromArray(rows), table.marks);
    }
    const tr = editor.state.tr.replaceWith(pos, pos + table.nodeSize, next);
    editor.view.dispatch(tr);
    editor.commands.focus();
  };

  const item = (
    label: string,
    Icon: typeof Rows3,
    action: () => void,
    danger = false,
  ) => (
    <button
      key={label}
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        action();
      }}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
        danger
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-accent",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", danger ? "" : "text-muted-foreground")} />
      {label}
    </button>
  );

  return (
    <div className="absolute z-30" style={{ top: anchor.top, left: anchor.left }}>
      <button
        type="button"
        aria-label="Opções da tabela"
        title="Opções da tabela"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={cn(
          "flex h-5 w-4 items-center justify-center rounded border border-border bg-popover text-muted-foreground shadow-sm hover:text-foreground",
          open && "text-foreground",
        )}
      >
        <Grip className="h-3 w-3" />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-6 top-0 w-60 rounded-xl border border-border bg-popover p-2 shadow-lg"
        >
          <div className="mb-1 flex items-center justify-between px-1 pb-1">
            <span className="text-sm font-semibold">Tabela</span>
            <button
              type="button"
              aria-label="Fechar"
              onClick={() => setOpen(false)}
              className="rounded-full p-0.5 text-muted-foreground hover:bg-accent"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {item("Linha", Rows3, () => editor.chain().focus().addRowAfter().run())}
            {item("Coluna", Columns3, () => editor.chain().focus().addColumnAfter().run())}
          </div>

          <div className="my-1.5 h-px bg-border" />

          <div className="space-y-0.5">
            {item("Mover Linha para Cima", ArrowUp, () => move("row", -1))}
            {item("Mover Linha para Baixo", ArrowDown, () => move("row", 1))}
            {item("Mover Coluna para a Esquerda", ArrowLeft, () => move("col", -1))}
            {item("Mover Coluna para a Direita", ArrowRight, () => move("col", 1))}
            {item("Mesclar / Dividir células", Grip, () =>
              editor.chain().focus().mergeOrSplit().run(),
            )}
            {item("Alternar cabeçalho", Rows3, () =>
              editor.chain().focus().toggleHeaderRow().run(),
            )}
          </div>

          <div className="my-1.5 h-px bg-border" />

          <div className="space-y-0.5">
            {item("Excluir Linha", Rows3, () => editor.chain().focus().deleteRow().run(), true)}
            {item(
              "Excluir Coluna",
              Columns3,
              () => editor.chain().focus().deleteColumn().run(),
              true,
            )}
            {item(
              "Excluir Tabela",
              Trash2,
              () => {
                editor.chain().focus().deleteTable().run();
                setOpen(false);
              },
              true,
            )}
          </div>
        </div>
      )}
    </div>
  );
}
