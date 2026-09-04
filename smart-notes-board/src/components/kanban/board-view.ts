/**
 * Qual tela do quadro está aberta.
 *
 * Antes eram três booleanos independentes (`archivedView`, `calendarView`,
 * `timelineView`) que precisavam ser desligados à mão sempre que outro era
 * ligado — cinco lugares repetindo o mesmo reset, e nada impedindo dois ficarem
 * ligados ao mesmo tempo. Como um único valor, o estado inválido deixa de
 * existir e adicionar uma visão nova é acrescentar um membro à união.
 */
export type BoardView = "kanban" | "timeline" | "calendar" | "archived";

/** Clicar de novo na visão atual volta para o quadro. */
export function toggleBoardView(current: BoardView, target: BoardView): BoardView {
  return current === target ? "kanban" : target;
}
