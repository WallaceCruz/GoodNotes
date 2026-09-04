import type { StateStorage } from "zustand/middleware";
import { readRaw, removeKey, writeRaw } from "./local-storage";

/**
 * Ponte entre o `persist` do Zustand e o armazenamento local do app.
 *
 * O middleware trabalha com texto já serializado, então aqui só repassamos —
 * as garantias (SSR sem `window`, cota estourada que não derruba a sessão)
 * vêm de `local-storage`, as mesmas que os hooks de preferência usam.
 */
export function createSsrSafeStorage(logLabel: string): StateStorage {
  return {
    getItem: (name) => readRaw(name),
    setItem: (name, value) => writeRaw(name, value, logLabel),
    removeItem: (name) => removeKey(name),
  };
}
