import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { canMove, selectedTable } from "./table-doc";
import type { TableAnchorRect } from "./table-placement";

/**
 * Tudo que a UI mostra sai de um único instantâneo, recalculado nas transações
 * do editor: onde a tabela está na tela e o que a seleção atual permite. Derivar
 * isso no render leria uma seleção defasada, porque nem toda mudança de seleção
 * move a tabela — e portanto nem toda mudança re-renderiza.
 */
export type TableAnchor = TableAnchorRect & {
  /** Muda sempre que algo visível muda; segura o re-render quando nada mudou. */
  key: string;
  canRowUp: boolean;
  canRowDown: boolean;
  canColumnLeft: boolean;
  canColumnRight: boolean;
  canMerge: boolean;
  canSplit: boolean;
};

/**
 * Área realmente visível do editor: o ancestral que recorta (o card tem altura
 * máxima com rolagem). Sem isso a barra continuaria apontando para uma tabela
 * já rolada para fora do card.
 */
function clipBounds(container: HTMLElement | null): DOMRect | null {
  if (!container) return null;
  for (let element = container.parentElement; element; element = element.parentElement) {
    const style = getComputedStyle(element);
    if (/(auto|scroll|hidden)/.test(`${style.overflowY} ${style.overflowX}`)) {
      return element.getBoundingClientRect();
    }
  }
  return container.getBoundingClientRect();
}

/** Elemento `<table>` que contém o cursor do editor. */
function tableElement(editor: Editor): HTMLElement | null {
  const dom = editor.view.domAtPos(editor.state.selection.from).node as globalThis.Node;
  const element = (dom.nodeType === 3 ? dom.parentElement : (dom as HTMLElement)) ?? null;
  return element?.closest("table") ?? null;
}

export function useTableAnchor(
  editor: Editor | null,
  containerRef: React.RefObject<HTMLDivElement | null>,
): TableAnchor | null {
  const [anchor, setAnchor] = useState<TableAnchor | null>(null);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    const update = () => {
      // Só o editor em foco mostra a barra: a nota aberta em outra camada (modal)
      // guarda a seleção na tabela e deixaria um controle órfão sobre a tela.
      const selection = editor.isDestroyed || !editor.isFocused ? null : selectedTable(editor);
      const element = selection ? tableElement(editor) : null;
      const bounds = clipBounds(containerRef.current);
      if (!selection || !element || !bounds) {
        setAnchor(null);
        return;
      }

      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      // Tabela rolada para fora da nota (ou da tela): esconde os controles.
      const hidden =
        rect.bottom < bounds.top ||
        rect.top > bounds.bottom ||
        rect.bottom < 0 ||
        rect.top > viewportHeight;
      if (hidden) {
        setAnchor(null);
        return;
      }

      const next: Omit<TableAnchor, "key"> = {
        top: rect.top,
        left: rect.left,
        bottom: rect.bottom,
        viewportWidth: window.innerWidth,
        viewportHeight,
        canRowUp: canMove(selection, "row", -1),
        canRowDown: canMove(selection, "row", 1),
        canColumnLeft: canMove(selection, "column", -1),
        canColumnRight: canMove(selection, "column", 1),
        canMerge: editor.can().mergeCells(),
        canSplit: editor.can().splitCell(),
      };
      const key = Object.values(next).join("|");
      setAnchor((previous) => (previous?.key === key ? previous : { key, ...next }));
    };

    update();
    const editorEvents = ["transaction", "selectionUpdate", "focus", "blur"] as const;
    editorEvents.forEach((event) => editor.on(event, update));
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      editorEvents.forEach((event) => editor.off(event, update));
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [editor, containerRef]);

  return anchor;
}
