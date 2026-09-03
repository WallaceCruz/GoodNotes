import { collectTags, ensureNativeColumns, type BoardState } from "@/lib/board-types";
import { withOrder } from "./notes";
import { createInitialState } from "./seed";

const STORAGE_KEY = "sticky-kanban-v1";

/**
 * Versão do formato gravado. `normalize` preenche o que faltar em qualquer
 * versão anterior, então subir este número serve para registrar a migração —
 * a leitura continua aceitando arquivos antigos sem versão.
 */
const SCHEMA_VERSION = 2;

type Persisted = BoardState & { version?: number };

/**
 * Completa campos ausentes de estados gravados por versões anteriores. É a
 * fronteira entre "dado do disco" (imprevisível) e o resto do app, que pode
 * assumir a forma completa.
 */
export function normalize(state: BoardState): BoardState {
  return {
    projects: (state.projects ?? []).map((p) => ({
      ...p,
      archived: p.archived ?? false,
      files: (p.files ?? []).map((f) => ({
        ...f,
        archived: f.archived ?? false,
        columns: ensureNativeColumns(f.columns ?? []),
        automations: f.automations ?? [],
        tags: collectTags((f.notes ?? []).flatMap((n) => n.tags ?? []), f.tags ?? []),
        notes: withOrder(f.notes ?? []).map((n) => ({
          ...n,
          contentBelow: n.contentBelow ?? "",
          tags: n.tags ?? [],
          checklist: n.checklist ?? [],
          images: n.images ?? [],
          priority: n.priority ?? null,
          status: n.status ?? null,
          category: n.category ?? null,
          deadline: n.deadline ?? null,
          archived: n.archived ?? false,
          pinned: n.pinned ?? false,
          kind: n.kind ?? "sticky",
          assignee: n.assignee ?? n.author ?? null,
          assignees: n.assignees?.length ? n.assignees : n.assignee ? [n.assignee] : [],
          showChecklist: n.showChecklist ?? (n.checklist?.length ?? 0) > 0,
        })),
      })),
    })),
  };
}

/** Lê o quadro gravado; qualquer falha cai no estado inicial em vez de quebrar. */
export function loadState(): BoardState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    return normalize(JSON.parse(raw) as Persisted);
  } catch {
    return createInitialState();
  }
}

export type BoardSaver = {
  /** Agenda a gravação; chamadas seguidas colapsam numa só. */
  save: (state: BoardState) => void;
  /** Grava agora o que estiver pendente (fechar a aba, trocar de contexto). */
  flush: () => void;
  cancel: () => void;
};

/**
 * Gravação adiada: digitar uma frase inteira gera uma única serialização em vez
 * de uma por tecla — o estado carrega imagens em base64, então `JSON.stringify`
 * a cada tecla trava a interface.
 *
 * Estourar a cota do localStorage não pode derrubar a sessão: o erro é
 * reportado uma vez e o app segue com o estado em memória.
 */
export function createBoardSaver(delay = 500): BoardSaver {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: BoardState | null = null;
  let reportedFailure = false;

  const write = () => {
    if (!pending) return;
    const snapshot = pending;
    pending = null;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...snapshot, version: SCHEMA_VERSION } satisfies Persisted),
      );
      reportedFailure = false;
    } catch (error) {
      if (!reportedFailure) {
        reportedFailure = true;
        console.error(
          "[quadro] não foi possível salvar (armazenamento cheio?). As alterações seguem só nesta sessão.",
          error,
        );
      }
    }
  };

  return {
    save(state) {
      pending = state;
      if (timer) clearTimeout(timer);
      timer = setTimeout(write, delay);
    },
    flush() {
      if (timer) clearTimeout(timer);
      timer = undefined;
      write();
    },
    cancel() {
      if (timer) clearTimeout(timer);
      timer = undefined;
      pending = null;
    },
  };
}
