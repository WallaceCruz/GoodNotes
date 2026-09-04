import { Node, mergeAttributes } from "@tiptap/core";
import Image from "@tiptap/extension-image";

/** Extensões próprias da nota, separadas do componente que as monta. */

/** Vídeos (mp4/webm) como nó atômico arrastável dentro da nota. */
export const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return { src: { default: null } };
  },
  parseHTML() {
    return [{ tag: "video" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "video",
      mergeAttributes(HTMLAttributes, {
        controls: "true",
        playsinline: "true",
        preload: "metadata",
        class: "note-video",
      }),
    ];
  },
});

/** Imagens arrastáveis: reordenar dentro da nota (a ordem fica no HTML salvo). */
export const DraggableImage = Image.extend({ draggable: true, selectable: true });

/** Fontes das imagens presentes no HTML, na ordem em que aparecem. */
export function collectImages(html: string): string[] {
  const out: string[] = [];
  const re = /<img[^>]+src="([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) if (match[1]) out.push(match[1]);
  return out;
}
