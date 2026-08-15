import type { BoardStore } from "@/hooks/useBoardStore";

/**
 * O objeto `store` muda de identidade a cada edição do quadro, o que faria
 * `React.memo` falhar em todos os cards. As ações do store são estáveis em
 * comportamento (usam `setState` funcional), então comparamos apenas o que
 * realmente afeta a renderização: o arquivo atual e a lista de tags.
 */
export function sameStoreView(a: BoardStore, b: BoardStore) {
  return a.file?.id === b.file?.id && a.file?.tags === b.file?.tags;
}
