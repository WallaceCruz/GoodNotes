import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Maximize2, Pencil, Trash2 } from "lucide-react";
import { readAsDataUrl } from "@/components/editor/editor-blocks";

/** Espaço mínimo acima da imagem para a barra caber sem sair da área visível. */
const ROOM_ABOVE = 48;

type Anchor = { image: HTMLImageElement; top: number; left: number; above: boolean };

/**
 * Posição do nó da imagem no documento.
 *
 * Procurar o nó pela `src` — como esta barra fazia antes — encontra sempre a
 * *primeira* ocorrência: numa nota com a mesma imagem repetida (um logo, uma
 * captura reaproveitada), excluir a terceira apagava a primeira. `posAtDOM`
 * traduz o elemento clicado na posição exata dele, sem ambiguidade.
 */
function imagePos(editor: Editor, image: HTMLImageElement): number | null {
  try {
    const pos = editor.view.posAtDOM(image, 0);
    if (editor.state.doc.nodeAt(pos)?.type.name === "image") return pos;
    // Dependendo de onde o nó começa, a posição devolvida é a de dentro dele.
    if (pos > 0 && editor.state.doc.nodeAt(pos - 1)?.type.name === "image") return pos - 1;
    return null;
  } catch {
    return null;
  }
}

/**
 * Ferramentas da imagem sob o cursor: ampliar, substituir e excluir.
 *
 * A barra fica *acima* da imagem, e não dentro do canto dela. Colada por cima,
 * o cursor pousava na própria barra ao se aproximar da imagem — a partir daí o
 * elemento sob o ponteiro não era mais a imagem, e o controle deixava tanto de
 * atualizar para a imagem seguinte quanto de sumir quando o cursor saía.
 */
export function ImageToolbar({
  editor,
  containerRef,
  onZoom,
}: {
  editor: Editor | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onZoom: (src: string) => void;
}) {
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!editor || editor.isDestroyed || !container) return;

    const show = (image: HTMLImageElement) => {
      const box = containerRef.current?.getBoundingClientRect();
      if (!box) return;
      const rect = image.getBoundingClientRect();
      // Sem espaço acima (imagem no topo do documento), a barra desce para
      // dentro da imagem em vez de sair da área visível.
      const above = rect.top - box.top >= ROOM_ABOVE;
      const next: Anchor = {
        image,
        top: rect.top - box.top,
        left: rect.right - box.left,
        above,
      };
      setAnchor((current) =>
        current && current.image === image && current.top === next.top ? current : next,
      );
    };

    const track = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "IMG") {
        show(target as HTMLImageElement);
        return;
      }
      // Sobre a própria barra, mantém: senão ela sumiria justo ao ser usada.
      if (target?.closest("[data-img-tools]")) return;
      setAnchor(null);
    };

    const clear = () => setAnchor(null);

    container.addEventListener("mousemove", track);
    // Toque não tem `hover`: o toque na imagem é o que revela as ferramentas.
    container.addEventListener("click", track);
    container.addEventListener("mouseleave", clear);
    // Rolar move a imagem sem gerar `mousemove`, e a barra ficava pendurada
    // sobre o conteúdo que passou por baixo. Captura para pegar a rolagem de
    // qualquer ancestral, não só da janela.
    window.addEventListener("scroll", clear, true);
    window.addEventListener("resize", clear);

    return () => {
      container.removeEventListener("mousemove", track);
      container.removeEventListener("click", track);
      container.removeEventListener("mouseleave", clear);
      window.removeEventListener("scroll", clear, true);
      window.removeEventListener("resize", clear);
    };
  }, [editor, containerRef]);

  // A imagem pode sair do documento por outro caminho (desfazer, uma edição no
  // painel lateral); conferir na hora de desenhar evita a barra pendurada sobre
  // um elemento que já não existe, sem precisar de um efeito que observe isso.
  const visible = anchor?.image.isConnected ? anchor : null;

  const withImage = (run: (pos: number, size: number) => void) => {
    if (!editor || editor.isDestroyed || !anchor) return;
    const pos = imagePos(editor, anchor.image);
    const node = pos === null ? null : editor.state.doc.nodeAt(pos);
    if (pos === null || !node) return;
    run(pos, node.nodeSize);
  };

  const removeImage = () => {
    withImage((pos, size) => {
      editor
        ?.chain()
        .deleteRange({ from: pos, to: pos + size })
        .run();
    });
    setAnchor(null);
  };

  const replaceImage = async (file: File) => {
    const image = replaceTargetRef.current;
    if (!editor || editor.isDestroyed || !image) return;
    const url = await readAsDataUrl(file);
    const pos = imagePos(editor, image);
    const node = pos === null ? null : editor.state.doc.nodeAt(pos);
    if (pos === null || !node) return;
    editor
      .chain()
      .insertContentAt(
        { from: pos, to: pos + node.nodeSize },
        { type: "image", attrs: { src: url } },
      )
      .run();
    setAnchor(null);
  };

  return (
    <>
      {visible && (
        <div
          data-img-tools
          className="absolute z-20 flex items-center gap-0.5 rounded-lg border border-border bg-popover/95 p-1 shadow-md backdrop-blur"
          style={{
            top: visible.top,
            left: visible.left,
            // O deslocamento vem da própria altura da barra: um valor fixo em
            // pixels erra por alguns pontos e ela acaba encostando na imagem,
            // que é justamente o que faz o cursor pousar nela.
            transform: visible.above
              ? "translate(-100%, calc(-100% - 6px))"
              : "translate(-100%, 6px)",
          }}
        >
          <button
            type="button"
            aria-label="Ampliar imagem"
            title="Ampliar"
            onClick={() => onZoom(visible.image.src)}
            className="flex h-8 w-8 items-center justify-center rounded text-foreground/70 hover:bg-foreground/10"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Substituir imagem"
            title="Substituir"
            onClick={() => {
              replaceTargetRef.current = visible.image;
              replaceInputRef.current?.click();
            }}
            className="flex h-8 w-8 items-center justify-center rounded text-foreground/70 hover:bg-foreground/10"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Excluir imagem"
            title="Excluir"
            onClick={removeImage}
            className="flex h-8 w-8 items-center justify-center rounded text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void replaceImage(file);
          e.target.value = "";
        }}
      />
    </>
  );
}
