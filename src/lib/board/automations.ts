import { uid } from "@/lib/id";
import {
  matchesAutomation,
  type Automation,
  type AutomationType,
  type BoardFile,
} from "@/lib/board-types";

export function addAutomation(
  file: BoardFile,
  type: AutomationType,
  value: string,
  columnId: string,
): BoardFile {
  return {
    ...file,
    automations: [
      ...file.automations,
      { id: uid(), type, value, columnId, enabled: true } satisfies Automation,
    ],
  };
}

export function toggleAutomation(file: BoardFile, id: string): BoardFile {
  return {
    ...file,
    automations: file.automations.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
  };
}

export function removeAutomation(file: BoardFile, id: string): BoardFile {
  return { ...file, automations: file.automations.filter((a) => a.id !== id) };
}

/**
 * Notas que as regras ativas querem mover, no formato `noteId -> columnId`.
 * Separado da aplicação para que o efeito no React possa sair cedo quando não
 * há nada a fazer — sem isso, toda edição dispararia uma nova atualização.
 */
export function pendingAutomationMoves(file: BoardFile): Map<string, string> {
  const moves = new Map<string, string>();
  const rules = file.automations.filter((r) => r.enabled);
  if (rules.length === 0) return moves;
  for (const note of file.notes) {
    if (note.archived) continue;
    for (const rule of rules) {
      if (!file.columns.some((c) => c.id === rule.columnId)) continue;
      if (matchesAutomation(rule, note) && note.columnId !== rule.columnId) {
        moves.set(note.id, rule.columnId);
        break;
      }
    }
  }
  return moves;
}

export function applyAutomationMoves(file: BoardFile, moves: Map<string, string>): BoardFile {
  return {
    ...file,
    notes: file.notes.map((n) => (moves.has(n.id) ? { ...n, columnId: moves.get(n.id)! } : n)),
  };
}
