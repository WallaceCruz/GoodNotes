import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import { Check, GripVertical, Plus } from "lucide-react";
import {
  BLOCK_MENU_GROUPS,
  MEDIA_ACTIONS,
  applyBlock,
  blockEntry,
  blockKindAt,
  insertMediaFiles,
  insertMediaUrl,
  type BlockKind,
  type MediaKind,
} from "@/components/editor/editor-blocks";
import { cn } from "@/lib/utils";

type Spot = { top: number; pos: number };

/**
 * Alça de bloco no estilo Notion/Craft: aparece na margem esquerda do bloco sob
 * o cursor. O `+` abre o catálogo inteiro — títulos, listas, checklist, citação,
 * código, divisor, tabela, mídia e link — e o ⠿ arrasta o bloco inteiro.
 *
 * O arraste é o mecanismo nativo do ProseMirror: seleciona o nó e entrega o
 * slice em `view.dragging`, então o próprio editor cuida do drop, do cursor de
 * destino e do desfazer.
 */
export function BlockHandle({
  editor,
  containerRef,
  compact = false,
}: {
  editor: Editor | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  compact?: boolean;
}) {
  const [spot, setSpot] = useState<Spot | null>(null);
  const [menuAberto, setMenuAberto] = useState(false);
  /** Arraste em curso: de onde saiu e onde a linha de destino está desenhada. */
  const [arraste, setArraste] = useState<{ from: number; insertAt: number; y: number } | null>(
    null,
  );
  const maisRef = useRef<HTMLButtonElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const mediaInput = useRef<HTMLInputElement>(null);

  // Com o menu aberto — ou no meio de um arraste — o ponteiro sai do editor e
  // cairia no `mouseleave`, que apagaria a âncora justamente enquanto ela está
  // sendo usada. Congela até terminar.
  const congeladoRef = useRef(false);
  congeladoRef.current = menuAberto || arraste !== null;

  useEffect(() => {
    const container = containerRef.current;
    if (!editor || editor.isDestroyed || !container) return;

    const locate = (e: MouseEvent) => {
      if (editor.isDestroyed || congeladoRef.current) return;
      const view = editor.view;
      const found = view.posAtCoords({ left: e.clientX, top: e.clientY });
      const box = containerRef.current?.getBoundingClientRect();
      if (!found || !box) {
        setSpot(null);
        return;
      }
      // `inside` já é a posição *antes* do nó sob o ponteiro. Para um bloco de
      // nível 1 ela resolve na raiz (depth 0) e é a própria posição procurada;
      // dentro de uma lista ou tabela, `before(1)` sobe até o bloco que a contém.
      const raw = found.inside >= 0 ? found.inside : found.pos;
      const $pos = view.state.doc.resolve(raw);
      const blockPos = $pos.depth > 0 ? $pos.before(1) : raw;
      if (!view.state.doc.nodeAt(blockPos)) {
        setSpot(null);
        return;
      }
      const dom = view.nodeDOM(blockPos);
      if (!(dom instanceof HTMLElement)) {
        setSpot(null);
        return;
      }
      const top = dom.getBoundingClientRect().top - box.top;
      setSpot((prev) =>
        prev && prev.pos === blockPos && prev.top === top ? prev : { top, pos: blockPos },
      );
    };

    const clear = () => {
      if (!congeladoRef.current) setSpot(null);
    };
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

  /**
   * Onde o bloco cairia se solto neste ponto.
   *
   * Metade de cima do bloco sob o ponteiro: antes dele. Metade de baixo: depois.
   * É o mesmo critério do Notion, e é o que torna previsível soltar entre dois
   * blocos vizinhos.
   */
  const destino = (clientX: number, clientY: number) => {
    const view = editor.view;
    const caixa = containerRef.current?.getBoundingClientRect();
    const achado = view.posAtCoords({ left: clientX, top: clientY });
    if (!achado || !caixa) return null;

    const bruto = achado.inside >= 0 ? achado.inside : achado.pos;
    const $pos = view.state.doc.resolve(bruto);
    const blocoPos = $pos.depth > 0 ? $pos.before(1) : bruto;
    const bloco = view.state.doc.nodeAt(blocoPos);
    const dom = view.nodeDOM(blocoPos);
    if (!bloco || !(dom instanceof HTMLElement)) return null;

    const r = dom.getBoundingClientRect();
    const depois = clientY > r.top + r.height / 2;
    return {
      insertAt: depois ? blocoPos + bloco.nodeSize : blocoPos,
      y: (depois ? r.bottom : r.top) - caixa.top,
    };
  };

  /** Tira o bloco de onde está e o põe no destino, numa transação só. */
  const soltar = (from: number, insertAt: number) => {
    const { doc, tr } = editor.state;
    const bloco = doc.nodeAt(from);
    if (!bloco) return;
    // Soltar dentro de si mesmo é ficar onde está.
    if (insertAt >= from && insertAt <= from + bloco.nodeSize) return;
    tr.delete(from, from + bloco.nodeSize);
    tr.insert(tr.mapping.map(insertAt), bloco);
    editor.view.dispatch(tr);
  };

  const fechar = () => setMenuAberto(false);

  const escolherBloco = (kind: BlockKind) => {
    applyBlock(editor, kind, spot.pos);
    fechar();
  };

  const escolherMidia = (kind: MediaKind) => {
    if (kind === "image") {
      imageInput.current?.click();
      return;
    }
    if (kind === "video") {
      mediaInput.current?.click();
      return;
    }
    if (kind === "mediaUrl") {
      const url = window.prompt("Cole o link do GIF ou vídeo (https://...)");
      if (url?.trim()) insertMediaUrl(editor, url);
      fechar();
      return;
    }
    const url = window.prompt("Cole o endereço do link (https://...)");
    if (url?.trim()) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
    }
    fechar();
  };

  const receberArquivos = (files: FileList | null) => {
    if (!editor.isDestroyed) void insertMediaFiles(editor, files);
    fechar();
  };

  const icone = compact ? "h-3 w-3" : "h-3.5 w-3.5";
  const botao =
    "rounded p-0.5 text-foreground/30 transition-colors hover:bg-foreground/10 hover:text-foreground/70";

  return (
    <>
      <div
        className="absolute z-10 flex items-center gap-0.5"
        style={{ top: spot.top, left: 0 }}
        contentEditable={false}
        // O card do quadro arrasta pelo cabeçalho; sem isto o dnd-kit engoliria
        // o gesto nestes botões antes de ele virar um clique.
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          ref={maisRef}
          type="button"
          aria-label="Opções de bloco"
          aria-expanded={menuAberto}
          title="Transformar este bloco ou inserir outro"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setMenuAberto((aberto) => !aberto)}
          className={cn(botao, menuAberto && "bg-foreground/10 text-foreground/70")}
        >
          <Plus className={icone} />
        </button>
        <button
          type="button"
          aria-label="Arrastar bloco"
          title="Arraste para reordenar o bloco"
          // Arraste por eventos de ponteiro, e não pelo HTML5 drag-and-drop: o
          // nativo não existe no toque, e este quadro também roda no celular.
          // Um ponteiro capturado entrega move e up aqui mesmo, no dedo ou no rato.
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.setPointerCapture(e.pointerId);
            selectBlock();
            setArraste({ from: spot.pos, insertAt: spot.pos, y: spot.top });
          }}
          onPointerMove={(e) => {
            if (!arraste) return;
            const alvo = destino(e.clientX, e.clientY);
            if (alvo) setArraste({ ...arraste, ...alvo });
          }}
          onPointerUp={(e) => {
            e.currentTarget.releasePointerCapture(e.pointerId);
            if (arraste) soltar(arraste.from, arraste.insertAt);
            setArraste(null);
            setSpot(null);
          }}
          onPointerCancel={() => {
            setArraste(null);
            setSpot(null);
          }}
          className={cn(
            botao,
            "touch-none cursor-grab active:cursor-grabbing",
            arraste && "bg-foreground/10 text-foreground/70",
          )}
        >
          <GripVertical className={icone} />
        </button>
      </div>

      {arraste && (
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 right-0 z-20 h-0.5 rounded-full bg-primary"
          style={{ top: arraste.y }}
        />
      )}

      {menuAberto && maisRef.current && (
        <BlockMenu
          anchor={maisRef.current.getBoundingClientRect()}
          atual={blockKindAt(editor, spot.pos)}
          onBlock={escolherBloco}
          onMedia={escolherMidia}
          onClose={fechar}
        />
      )}

      <input
        ref={imageInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          receberArquivos(e.target.files);
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
          receberArquivos(e.target.files);
          e.target.value = "";
        }}
      />
    </>
  );
}

const MENU_W = 208;
const MENU_H = 288;
const MARGEM = 8;

/**
 * O catálogo aberto pelo `+`.
 *
 * Vai num portal com posição fixa, e não dentro do editor: a nota rola no
 * próprio card (`overflow-y: auto`), e ali dentro o menu era recortado a 68px
 * de altura — sobrava a primeira linha.
 */
function BlockMenu({
  anchor,
  atual,
  onBlock,
  onMedia,
  onClose,
}: {
  anchor: DOMRect;
  /** O tipo do bloco sob a alça, marcado na lista. */
  atual: BlockKind | null;
  onBlock: (kind: BlockKind) => void;
  onMedia: (kind: MediaKind) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Abre para baixo; sobe quando não há espaço, e nunca passa da borda direita.
  const cabeAbaixo = anchor.bottom + MENU_H + MARGEM <= window.innerHeight;
  const top = cabeAbaixo
    ? anchor.bottom + 4
    : Math.max(MARGEM, Math.min(anchor.top - MENU_H - 4, window.innerHeight - MENU_H - MARGEM));
  const left = Math.max(MARGEM, Math.min(anchor.left, window.innerWidth - MENU_W - MARGEM));

  useEffect(() => {
    const foraDaLista = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const pelaTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    // `capture`: o editor também escuta cliques, e sem isto ele reposicionaria
    // o cursor antes de o menu saber que deve fechar.
    document.addEventListener("mousedown", foraDaLista, true);
    document.addEventListener("keydown", pelaTecla);
    return () => {
      document.removeEventListener("mousedown", foraDaLista, true);
      document.removeEventListener("keydown", pelaTecla);
    };
  }, [onClose]);

  const item =
    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] text-popover-foreground transition-colors hover:bg-accent";

  return createPortal(
    <div
      ref={ref}
      contentEditable={false}
      onMouseDown={(e) => e.preventDefault()}
      onPointerDown={(e) => e.stopPropagation()}
      className="scroll-thin fixed z-50 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-lg"
      style={{ top, left, width: MENU_W, maxHeight: MENU_H }}
    >
      {BLOCK_MENU_GROUPS.map((grupo) => (
        <section key={grupo.title}>
          <h4 className="px-2 pb-0.5 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {grupo.title}
          </h4>
          {grupo.kinds.map((kind) => {
            const { label, icon: Icon } = blockEntry(kind);
            const ativo = atual === kind;
            return (
              <button
                key={kind}
                type="button"
                aria-current={ativo}
                onClick={() => onBlock(kind)}
                className={item}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {label}
                {ativo && <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-primary" />}
              </button>
            );
          })}
        </section>
      ))}

      <section>
        <h4 className="px-2 pb-0.5 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Mídia e links
        </h4>
        {MEDIA_ACTIONS.map(({ kind, label, icon: Icon }) => (
          <button key={kind} type="button" onClick={() => onMedia(kind)} className={item}>
            <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {label}
          </button>
        ))}
      </section>
    </div>,
    document.body,
  );
}
