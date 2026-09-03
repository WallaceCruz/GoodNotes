import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/react";
import { Fragment, type Node as PMNode } from "@tiptap/pm/model";
import { TextSelection } from "@tiptap/pm/state";
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
  MoreHorizontal,
  PanelTop,
  Rows3,
  TableCellsMerge,
  TableCellsSplit,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Info = { table: PMNode; pos: number; rowIndex: number; cellIndex: number };

/**
 * Tudo que a UI mostra sai de um único snapshot, recalculado nas transações do
 * editor: posição (coordenadas de tela, a UI é `fixed`) e o que a seleção atual
 * permite. Derivar isso no render leria uma seleção defasada, porque nem toda
 * mudança de seleção move a tabela — e portanto nem toda mudança re-renderiza.
 */
type Snap = {
  key: string;
  top: number;
  left: number;
  bottom: number;
  vw: number;
  vh: number;
  canRowUp: boolean;
  canRowDown: boolean;
  canColLeft: boolean;
  canColRight: boolean;
  canMerge: boolean;
  canSplit: boolean;
};

const BAR_H = 30;
const GAP = 6;
const MENU_W = 248;

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

function hasHeaderRow(table: PMNode): boolean {
  return table.firstChild?.firstChild?.type.name === "tableHeader";
}

/**
 * Área realmente visível do editor: o ancestral que recorta (o card tem altura
 * máxima com rolagem). Sem isso a barra continuaria apontando para uma tabela
 * já rolada para fora do card.
 */
function clipBounds(container: HTMLElement | null): DOMRect | null {
  if (!container) return null;
  for (let el = container.parentElement; el; el = el.parentElement) {
    const style = getComputedStyle(el);
    if (/(auto|scroll|hidden)/.test(`${style.overflowY} ${style.overflowX}`))
      return el.getBoundingClientRect();
  }
  return container.getBoundingClientRect();
}

/** Posição do início do conteúdo de uma célula, dada a tabela e sua posição no doc. */
function cellStart(table: PMNode, tablePos: number, rowIdx: number, cellIdx: number): number {
  let p = tablePos + 1;
  for (let i = 0; i < rowIdx; i++) p += table.child(i).nodeSize;
  const row = table.child(rowIdx);
  p += 1;
  for (let i = 0; i < cellIdx; i++) p += row.child(i).nodeSize;
  return p + 1;
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
  const [snap, setSnap] = useState<Snap | null>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // A UI flutuante vive fora do `.note-prose`: lá dentro o `max-width: 100%` do
  // conteúdo espremeria o menu contra o âncora e o overflow o cortaria.
  useEffect(() => {
    const dialog = containerRef.current?.closest<HTMLElement>("[role='dialog']");
    setHost(dialog ?? document.body);
  }, [containerRef]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const update = () => {
      // Só o editor em foco mostra a barra: a nota aberta em outra camada (modal)
      // guarda a seleção na tabela e deixaria um controle órfão sobre a tela.
      const info = editor.isDestroyed || !editor.isFocused ? null : tableInfo(editor);
      if (!info) {
        setSnap(null);
        setOpen(false);
        return;
      }
      const { from } = editor.state.selection;
      const dom = editor.view.domAtPos(from).node as globalThis.Node;
      const el = (dom.nodeType === 3 ? dom.parentElement : (dom as HTMLElement)) ?? null;
      const table = el?.closest("table") as HTMLElement | null;
      const bounds = clipBounds(containerRef.current);
      if (!table || !bounds) {
        setSnap(null);
        return;
      }
      const r = table.getBoundingClientRect();
      // Tabela rolada para fora da nota (ou da tela): esconde os controles.
      const vh = window.innerHeight;
      if (r.bottom < bounds.top || r.top > bounds.bottom || r.bottom < 0 || r.top > vh) {
        setSnap(null);
        return;
      }
      // A linha de cabeçalho não desce para o meio da tabela.
      const firstBody = hasHeaderRow(info.table) ? 1 : 0;
      const cols = info.table.firstChild?.childCount ?? 1;
      const next: Omit<Snap, "key"> = {
        top: r.top,
        left: r.left,
        bottom: r.bottom,
        vw: window.innerWidth,
        vh,
        canRowUp: info.rowIndex > firstBody,
        canRowDown: info.rowIndex >= firstBody && info.rowIndex < info.table.childCount - 1,
        canColLeft: info.cellIndex > 0,
        canColRight: info.cellIndex < cols - 1,
        canMerge: editor.can().mergeCells(),
        canSplit: editor.can().splitCell(),
      };
      const key = Object.values(next).join("|");
      setSnap((prev) => (prev?.key === key ? prev : { key, ...next }));
    };
    update();
    editor.on("transaction", update);
    editor.on("selectionUpdate", update);
    editor.on("focus", update);
    editor.on("blur", update);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      editor.off("transaction", update);
      editor.off("selectionUpdate", update);
      editor.off("focus", update);
      editor.off("blur", update);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [editor, containerRef]);

  // Fecha no clique fora e no Esc. O `data-floating-menu` avisa a página de foco
  // da nota para não tratar esse Esc como "fechar a nota".
  useEffect(() => {
    if (!open) return;
    const inside = (t: EventTarget | null) =>
      barRef.current?.contains(t as globalThis.Node) ||
      menuRef.current?.contains(t as globalThis.Node);
    const onDown = (e: PointerEvent) => {
      if (!inside(e.target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      e.preventDefault();
      setOpen(false);
      editor?.commands.focus();
    };
    document.addEventListener("pointerdown", onDown, true);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open, editor]);

  if (!editor || !snap || !host) return null;

  const move = (axis: "row" | "col", dir: -1 | 1) => {
    const info = tableInfo(editor);
    if (!info) return;
    const { table, pos, rowIndex, cellIndex } = info;
    const firstBody = hasHeaderRow(table) ? 1 : 0;
    let next: PMNode;
    let row = rowIndex;
    let cell = cellIndex;
    if (axis === "row") {
      const target = rowIndex + dir;
      if (target < firstBody || target >= table.childCount) return;
      next = swapChildren(table, rowIndex, target);
      row = target;
    } else {
      const target = cellIndex + dir;
      if (target < 0 || target >= (table.firstChild?.childCount ?? 0)) return;
      const rows: PMNode[] = [];
      table.forEach((r) => rows.push(swapChildren(r, cellIndex, target)));
      next = table.type.create(table.attrs, Fragment.fromArray(rows), table.marks);
      cell = target;
    }
    const tr = editor.state.tr.replaceWith(pos, pos + table.nodeSize, next);
    // Segue a célula até a nova posição: sem isso o cursor sai da tabela e a
    // barra some no meio de uma sequência de movimentos.
    tr.setSelection(TextSelection.near(tr.doc.resolve(cellStart(next, pos, row, cell))));
    editor.view.dispatch(tr);
    editor.commands.focus();
  };

  const run = (fn: () => void, close = false) => {
    fn();
    if (close) setOpen(false);
  };

  const item = (
    label: string,
    Icon: typeof Rows3,
    action: () => void,
    { danger = false, disabled = false } = {},
  ) => (
    <button
      key={label}
      type="button"
      disabled={disabled}
      // Mantém a seleção dentro da tabela: sem isso o clique tira o foco do editor.
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.stopPropagation();
        action();
      }}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors",
        "disabled:pointer-events-none disabled:opacity-40",
        danger ? "text-destructive hover:bg-destructive/10" : "text-foreground hover:bg-accent",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", danger ? "" : "text-muted-foreground")} />
      {label}
    </button>
  );

  const group = (title: string) => (
    <p className="px-2 pb-0.5 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {title}
    </p>
  );

  const barTop =
    snap.top - BAR_H - GAP >= 8
      ? snap.top - BAR_H - GAP
      : Math.min(snap.bottom + GAP, snap.vh - BAR_H - 8);
  const barLeft = Math.max(8, Math.min(snap.left, snap.vw - MENU_W - 8));
  const spaceBelow = snap.vh - (barTop + BAR_H + 4) - 8;
  const spaceAbove = barTop - 12;
  const openUp = spaceBelow < 260 && spaceAbove > spaceBelow;
  const menuMaxH = Math.max(180, Math.min(440, openUp ? spaceAbove : spaceBelow));

  const barBtn = (label: string, Icon: typeof Rows3, action: () => void, active = false) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => {
        e.stopPropagation();
        action();
      }}
      className={cn(
        "rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        active && "bg-accent text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );

  return createPortal(
    <>
      <div
        ref={barRef}
        role="toolbar"
        aria-label="Ferramentas da tabela"
        style={{ position: "fixed", top: barTop, left: barLeft, height: BAR_H }}
        className="z-50 flex items-center gap-0.5 rounded-lg border border-border bg-popover/95 px-1 shadow-md backdrop-blur"
      >
        <span className="px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Tabela
        </span>
        {barBtn("Inserir linha abaixo", BetweenVerticalEnd, () =>
          editor.chain().focus().addRowAfter().run(),
        )}
        {barBtn("Inserir coluna à direita", BetweenHorizontalEnd, () =>
          editor.chain().focus().addColumnAfter().run(),
        )}
        <span className="mx-0.5 h-4 w-px bg-border" />
        {barBtn("Mais opções da tabela", MoreHorizontal, () => setOpen((v) => !v), open)}
      </div>

      {open && (
        <div
          ref={menuRef}
          data-floating-menu=""
          role="dialog"
          aria-label="Opções da tabela"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            left: barLeft,
            width: MENU_W,
            maxHeight: menuMaxH,
            ...(openUp ? { bottom: snap.vh - barTop + 4 } : { top: barTop + BAR_H + 4 }),
          }}
          className="scroll-thin z-50 overflow-y-auto rounded-xl border border-border bg-popover p-1.5 shadow-lg"
        >
          <div className="flex items-center justify-between px-1.5 py-1">
            <span className="text-[13px] font-semibold">Opções da tabela</span>
            <button
              type="button"
              aria-label="Fechar"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setOpen(false)}
              className="rounded-full p-0.5 text-muted-foreground hover:bg-accent"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {group("Linha")}
          {item("Inserir acima", BetweenVerticalStart, () =>
            run(() => editor.chain().focus().addRowBefore().run()),
          )}
          {item("Inserir abaixo", BetweenVerticalEnd, () =>
            run(() => editor.chain().focus().addRowAfter().run()),
          )}
          {item("Mover para cima", ArrowUp, () => move("row", -1), { disabled: !snap.canRowUp })}
          {item("Mover para baixo", ArrowDown, () => move("row", 1), {
            disabled: !snap.canRowDown,
          })}
          {item("Excluir linha", Rows3, () => run(() => editor.chain().focus().deleteRow().run()), {
            danger: true,
          })}

          <div className="my-1 h-px bg-border" />

          {group("Coluna")}
          {item("Inserir à esquerda", BetweenHorizontalStart, () =>
            run(() => editor.chain().focus().addColumnBefore().run()),
          )}
          {item("Inserir à direita", BetweenHorizontalEnd, () =>
            run(() => editor.chain().focus().addColumnAfter().run()),
          )}
          {item("Mover para a esquerda", ArrowLeft, () => move("col", -1), {
            disabled: !snap.canColLeft,
          })}
          {item("Mover para a direita", ArrowRight, () => move("col", 1), {
            disabled: !snap.canColRight,
          })}
          {item(
            "Excluir coluna",
            Columns3,
            () => run(() => editor.chain().focus().deleteColumn().run()),
            { danger: true },
          )}

          <div className="my-1 h-px bg-border" />

          {group("Células")}
          {item(
            "Mesclar células",
            TableCellsMerge,
            () => run(() => editor.chain().focus().mergeCells().run()),
            { disabled: !snap.canMerge },
          )}
          {item(
            "Dividir célula",
            TableCellsSplit,
            () => run(() => editor.chain().focus().splitCell().run()),
            { disabled: !snap.canSplit },
          )}
          {item("Alternar cabeçalho", PanelTop, () =>
            run(() => editor.chain().focus().toggleHeaderRow().run()),
          )}

          <div className="my-1 h-px bg-border" />

          {item(
            "Excluir tabela",
            Trash2,
            () => run(() => editor.chain().focus().deleteTable().run(), true),
            { danger: true },
          )}
        </div>
      )}
    </>,
    host,
  );
}
