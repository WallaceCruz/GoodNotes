/**
 * Acesso ao `localStorage` do navegador.
 *
 * Toda leitura passa por um `parse` que decide se o dado gravado ainda serve —
 * o conteúdo do armazenamento é entrada externa (o usuário pode editá-lo, uma
 * versão antiga pode ter gravado outro formato), então nada aqui confia no que
 * leu. Toda escrita tolera cota estourada: perder uma preferência não pode
 * derrubar a ação que o usuário acabou de fazer.
 *
 * O cache de snapshot existe para `useSyncExternalStore`: ele exige que duas
 * leituras seguidas do mesmo dado devolvam a *mesma* referência, senão o React
 * re-renderiza em laço.
 */

type Snapshot = { raw: string | null; value: unknown };

const snapshots = new Map<string, Snapshot>();
const listeners = new Map<string, Set<() => void>>();
const failedKeys = new Set<string>();

const hasWindow = () => typeof window !== "undefined";

function notify(key: string) {
  for (const listener of listeners.get(key) ?? []) listener();
}

/** Avisa quem está ouvindo esta chave — em qualquer aba e nesta também. */
export function subscribeToKey(key: string, listener: () => void): () => void {
  const set = listeners.get(key) ?? new Set();
  set.add(listener);
  listeners.set(key, set);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== key) return;
    snapshots.delete(key);
    listener();
  };
  if (hasWindow()) window.addEventListener("storage", onStorage);

  return () => {
    set.delete(listener);
    if (set.size === 0) listeners.delete(key);
    if (hasWindow()) window.removeEventListener("storage", onStorage);
  };
}

/**
 * Lê e valida. Devolve sempre a mesma referência enquanto o texto gravado não
 * mudar, e cai no `fallback` se o dado estiver ausente, corrompido ou fora do
 * formato esperado.
 */
export function readJson<T>(key: string, parse: (raw: unknown) => T | null, fallback: T): T {
  if (!hasWindow()) return fallback;

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return fallback;
  }

  const cached = snapshots.get(key);
  if (cached && cached.raw === raw) return cached.value as T;

  let value = fallback;
  if (raw !== null) {
    try {
      value = parse(JSON.parse(raw)) ?? fallback;
    } catch {
      value = fallback;
    }
  }
  snapshots.set(key, { raw, value });
  return value;
}

export function readRaw(key: string): string | null {
  if (!hasWindow()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Grava texto já pronto. Falha de cota é reportada uma vez por chave. */
export function writeRaw(key: string, raw: string, label: string): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(key, raw);
    failedKeys.delete(key);
  } catch (error) {
    if (!failedKeys.has(key)) {
      failedKeys.add(key);
      console.error(
        `[${label}] não foi possível salvar (armazenamento cheio?). As alterações seguem só nesta sessão.`,
        error,
      );
    }
  }
  notify(key);
}

/** Grava um valor estruturado e avisa os assinantes. */
export function writeJson(key: string, value: unknown, label: string): void {
  if (!hasWindow()) return;
  const raw = JSON.stringify(value);
  snapshots.set(key, { raw, value });
  writeRaw(key, raw, label);
}

export function removeKey(key: string): void {
  if (!hasWindow()) return;
  snapshots.delete(key);
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* remover é o melhor esforço: se falhar, o valor antigo continua valendo */
  }
  notify(key);
}
