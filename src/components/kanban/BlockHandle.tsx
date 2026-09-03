import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import { GripVertical, Plus } from "lucide-react";

type Spot = { top: number; pos: number };

/**
 * Alça de bloco no estilo Notion/Craft: aparece na margem esquerda do bloco sob
 * o cursor, insere um parágrafo abaixo (+) e arrasta o bloco inteiro (⠿).
 *
 * O arraste é o mecanismo nativo do ProseMirror: seleciona o nó e entrega o
 * slice em `view.dragging`, então o próprio editor cuida do drop, do cursor de
 * destino e do desfazer.
 */
export function BlockHandle({
  editor,
  containerRef,
}: {
  editor: Editor | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [spot, setSpot] = useState<Spot | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!editor || editor.isDestroyed || !container) return;

    const locate = (e: MouseEvent) => {
      if (editor.isDestroyed) return;
      const view = editor.view;
      const found = view.posAtCoords({ left: e.clientX, top: e.clientY });
      const box = containerRef.current?.getBoundingClientRect();
      if (!found || !box) {
        setSpot(null);
        return;
      }
      const $pos = view.state.doc.resolve(found.inside >= 0 ? found.inside : found.pos);
      const blockPos = $pos.depth > 0 ? $pos.before(1) : null;
      if (blockPos === null) {
        setSpot(null);
        return;
      }
      const dom = view.nodeDOM(blockPos);
      if (!(dom instanceof HTMLElement)) {
        setSpot(null);
        return;
      }
      const top = dom.getBoundingClientRect().top - box.top;
      setSpot((prev) => (prev && prev.pos === blockPos && prev.top === top ? prev : { top, pos: blockPos }));
    };

    const clear = () => setSpot(null);
    container.addEventListener("mousemove", locate);
    container.addEventListener("mouseleave", clear);
    return () => {
      container.removeEventListener("mousemove", locate);
      container.removeEventListener("mouseleave", clear);
    };
  }, [editor, containerRef]);

  if (!editor || !spot) return null;

  // A posição foi medida no mousemove; o documento pode ter mudado desde então
  // (digitação, automação), e `NodeSelection.create` lança em posição inválida.
  const selectBlock = () => {
    try {
      const { doc, tr } = editor.state;
      if (spot.pos >= doc.content.size) return null;
      const selection = NodeSelection.create(doc, spot.pos);
      editor.view.dispatch(tr.setSelection(selection));
      return selection;
    } catch {
      setSpot(null);
      return null;
    }
  };

  return (
    <div
      className="absolute z-10 flex items-center gap-0.5"
      style={{ top: spot.top, left: 0 }}
      contentEditable={false}
    >
      <button
        type="button"
        aria-label="Inserir bloco abaixo"
        title="Inserir bloco abaixo"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          const node = editor.state.doc.nodeAt(spot.pos);
          editor
            .chain()
            .focus()
            .insertContentAt(spot.pos + (node?.nodeSize ?? 0), { type: "paragraph" })
            .run();
        }}
        className="rounded p-0.5 text-foreground/30 transition-colors hover:bg-foreground/10 hover:text-foreground/70"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        draggable
        aria-label="Arrastar bloco"
        title="Arraste para reordenar o bloco"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => selectBlock()}
        onDragStart={(e) => {
          const selection = selectBlock();
          if (!selection) {
            e.preventDefault();
            return;
          }
          const dom = editor.view.nodeDOM(spot.pos);
          if (dom instanceof HTMLElement) e.dataTransfer.setDragImage(dom, 0, 0);
          e.dataTransfer.effectAllowed = "move";
          // Firefox só inicia o arraste se algum dado for definido.
          e.dataTransfer.setData("text/plain", "");
          editor.view.dragging = { slice: selection.content(), move: true };
        }}
        onDragEnd={() => {
          editor.view.dragging = null;
          setSpot(null);
        }}
        className="cursor-grab rounded p-0.5 text-foreground/30 transition-colors hover:bg-foreground/10 hover:text-foreground/70 active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
