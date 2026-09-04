import { useCallback, useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";

/**
 * Mantém o painel em sincronia com a seleção do editor.
 *
 * O estado "negrito está ligado?" vive dentro do Tiptap, e mover o cursor não
 * re-renderiza o painel por conta própria — sem assinar os eventos do editor,
 * os botões mostrariam o estado da seleção anterior.
 *
 * Devolve também um `run` que só executa comandos num editor vivo: o painel
 * continua montado por um instante depois que o editor é destruído.
 */
export function useEditorSelection(editor?: Editor | null) {
  const [, forceRender] = useState(0);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const rerender = () => forceRender((tick) => tick + 1);
    editor.on("transaction", rerender);
    editor.on("selectionUpdate", rerender);
    return () => {
      editor.off("transaction", rerender);
      editor.off("selectionUpdate", rerender);
    };
  }, [editor]);

  const run = useCallback(
    (command: (editor: Editor) => void) => () => {
      if (editor && !editor.isDestroyed) command(editor);
    },
    [editor],
  );

  const isActive = useCallback(
    (name: string, attributes?: Record<string, unknown>) =>
      editor?.isActive(name, attributes) ?? false,
    [editor],
  );

  return { run, isActive, enabled: !!editor };
}
