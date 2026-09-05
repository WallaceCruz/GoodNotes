import { type BoardState } from "@/lib/board/model";
import { ensureNativeColumns } from "@/lib/board/native-columns";
import { collectTags } from "@/lib/board/tags";
import { readRaw, writeRaw } from "@/lib/local-storage";
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
        tags: collectTags(
          (f.notes ?? []).flatMap((n) => n.tags ?? []),
          f.tags ?? [],
        ),
        notes: withOrder(f.notes ?? []).map((n) => ({
          ...n,
          contentBelow: n.contentBelow ?? "",
          tags: n.tags ?? [],
          checklist: n.checklist ?? [],
          images: n.images ?? [],
          comments: n.comments ?? [],
          attachments: n.attachments ?? [],
          // Sem data de criação registrada, a última edição é a melhor aproximação.
          createdAt: n.createdAt ?? n.updatedAt ?? Date.now(),
          priority: n.priority ?? null,
          status: n.status ?? null,
          category: n.category ?? null,
          deadline: n.deadline ?? null,
          archived: n.archived ?? false,
          pinned: n.pinned ?? false,
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
  const raw = readRaw(STORAGE_KEY);
  if (!raw) return createInitialState();
  try {
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
 * A tolerância a cota estourada vem de `writeRaw`, a mesma usada pelas
 * preferências do usuário.
 */
export function createBoardSaver(delay = 500): BoardSaver {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: BoardState | null = null;

  const write = () => {
    if (!pending) return;
    const snapshot = pending;
    pending = null;
    const payload = { ...snapshot, version: SCHEMA_VERSION } satisfies Persisted;
    writeRaw(STORAGE_KEY, JSON.stringify(payload), "quadro");
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
