import type { Column, NativeColumnKey, Note, NoteStatus } from "@/lib/board/model";
import { nativeKeyOf } from "./native-columns";

/**
 * O status que a nota realmente tem, considerando onde ela está.
 *
 * É a única regra do app que combina duas fontes — a coluna e a escolha manual
 * do usuário — então ganha um módulo próprio em vez de ficar escondida entre
 * definições de tipo.
 */

/**
 * Status que a coluna nativa sugere quando a nota não tem um status próprio
 * definido manualmente — backlog/research/discovery ainda não começaram
 * (pendente), doing/validação estão em andamento, concluído fecha o ciclo.
 */
const NATIVE_STATUS_DEFAULT: Record<NativeColumnKey, NoteStatus> = {
  backlog: "pending",
  research: "pending",
  discovery: "pending",
  doing: "doing",
  validation: "doing",
  done: "done",
};

/**
 * Status efetivo considerando a coluna. "Concluído" sempre fecha a nota,
 * independente do que estava marcado antes; as demais colunas nativas só
 * *sugerem* um status — se o usuário já escolheu um manualmente (ex.: "Não
 * concluído", "Reagendado"), essa escolha continua valendo.
 */
export function effectiveStatus(
  note: Pick<Note, "status" | "columnId">,
  columns: Column[],
): NoteStatus | null {
  const key = nativeKeyOf(columns, note.columnId);
  if (key === "done") return "done";
  if (key) return note.status ?? NATIVE_STATUS_DEFAULT[key];
  return note.status;
}

/**
 * Atalho para a pergunta mais repetida sobre uma nota. Estava escrita à mão em
 * quatro telas, sempre como `effectiveStatus(...) === "done"`.
 */
export function isNoteDone(note: Pick<Note, "status" | "columnId">, columns: Column[]): boolean {
  return effectiveStatus(note, columns) === "done";
}
