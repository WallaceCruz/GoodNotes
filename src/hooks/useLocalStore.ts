import { useCallback, useSyncExternalStore } from "react";
import { readJson, subscribeToKey, writeJson } from "@/lib/local-storage";

/**
 * Estado do usuário guardado no navegador.
 *
 * Cada preferência (workspaces, times, categorias, perfil, notificações) tinha
 * sua própria cópia do mesmo trecho: ler com try/catch, hidratar num efeito,
 * gravar, ouvir o evento `storage`. Além de repetido, era repetido *diferente* —
 * dois deles gravavam sem proteção de cota e só um sincronizava telas da mesma
 * aba. Aqui a regra é uma só, e vale para todos.
 *
 * O primeiro render devolve `fallback` (igual ao HTML do servidor) e o valor
 * gravado entra logo depois, sem divergência de hidratação.
 */
export type LocalStore<T> = {
  value: T;
  /** Aceita o próximo valor ou uma função sobre o atual, como `setState`. */
  setValue: (next: T | ((current: T) => T)) => void;
  /** `false` enquanto o primeiro render (servidor/hidratação) está no ar. */
  hydrated: boolean;
};

const subscribeNothing = () => () => {};

/** `true` só depois que o cliente assumiu o render — evita piscar o padrão. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
}

export function useLocalStore<T>({
  key,
  fallback,
  parse,
  label,
}: {
  key: string;
  fallback: T;
  /** Valida o que estava gravado; devolver `null` descarta e usa o `fallback`. */
  parse: (raw: unknown) => T | null;
  /** Nome amigável usado ao reportar falha de gravação. */
  label: string;
}): LocalStore<T> {
  const subscribe = useCallback((listener: () => void) => subscribeToKey(key, listener), [key]);
  const read = useCallback(() => readJson(key, parse, fallback), [key, parse, fallback]);
  const readFallback = useCallback(() => fallback, [fallback]);

  const value = useSyncExternalStore(subscribe, read, readFallback);
  const hydrated = useHydrated();

  const setValue = useCallback(
    (next: T | ((current: T) => T)) => {
      const resolved =
        typeof next === "function"
          ? (next as (current: T) => T)(readJson(key, parse, fallback))
          : next;
      writeJson(key, resolved, label);
    },
    [key, parse, fallback, label],
  );

  return { value, setValue, hydrated };
}
