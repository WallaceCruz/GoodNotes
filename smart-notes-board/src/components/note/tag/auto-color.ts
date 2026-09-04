import { NOTE_COLORS, type NoteColor } from "@/lib/board/model";

/**
 * Cor estável derivada do nome: criar uma tag não deve exigir escolher cor
 * antes, e a mesma palavra sempre volta com a mesma cor.
 */
export function autoColor(name: string): NoteColor {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return NOTE_COLORS[hash % NOTE_COLORS.length] ?? "sky";
}
