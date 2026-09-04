import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Editor } from "@tiptap/react";
import { TableToolbar } from "./table/TableToolbar";
import { TableOptionsMenu } from "./table/TableOptionsMenu";
import { placeTableMenu } from "./table/table-placement";
import { useTableAnchor } from "./table/useTableAnchor";

/**
 * A UI flutuante vive fora do `.note-prose`: lá dentro o `max-width: 100%` do
 * conteúdo espremeria o menu contra o âncora e o overflow o cortaria.
 */
function usePortalHost(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const dialog = containerRef.current?.closest<HTMLElement>("[role='dialog']");
    setHost(dialog ?? document.body);
  }, [containerRef]);
  return host;
}

/** Fecha no clique fora e no Esc, sem deixar o Esc chegar à nota. */
function useDismiss(open: boolean, editor: Editor | null, onClose: () => void) {
  const [bar, setBar] = useState<HTMLDivElement | null>(null);
  const [menu, setMenu] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const isInside = (target: EventTarget | null) =>
      bar?.contains(target as globalThis.Node) || menu?.contains(target as globalThis.Node);

    const onPointerDown = (event: PointerEvent) => {
      if (!isInside(event.target)) onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      event.preventDefault();
      onClose();
      editor?.commands.focus();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open, editor, bar, menu, onClose]);

  return { barRef: setBar, menuRef: setMenu };
}

/** Controles da tabela sob o cursor: barra fixa acima dela e menu com o resto. */
export function TableMenu({
  editor,
  containerRef,
}: {
  editor: Editor | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const host = usePortalHost(containerRef);
  const anchor = useTableAnchor(editor, containerRef);
  const { barRef, menuRef } = useDismiss(open, editor, () => setOpen(false));

  // Cursor fora de qualquer tabela: não há o que ancorar, e o menu não sobrevive.
  useEffect(() => {
    if (!anchor) setOpen(false);
  }, [anchor]);

  if (!editor || !anchor || !host) return null;

  const placement = placeTableMenu(anchor);

  return createPortal(
    <>
      <TableToolbar
        ref={barRef}
        editor={editor}
        top={placement.barTop}
        left={placement.barLeft}
        menuOpen={open}
        onToggleMenu={() => setOpen((isOpen) => !isOpen)}
      />
      {open && (
        <TableOptionsMenu
          ref={menuRef}
          editor={editor}
          anchor={anchor}
          placement={placement}
          onClose={() => setOpen(false)}
        />
      )}
    </>,
    host,
  );
}
