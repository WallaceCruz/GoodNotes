import type { StateStorage } from "zustand/middleware";

/**
 * Storage adapter for Zustand's `persist` middleware that is safe to import
 * from code that also renders on the server (TanStack Start does SSR).
 * `localStorage` doesn't exist there, so every method checks for `window`
 * first instead of letting the reference error propagate.
 *
 * A write that fails (quota exceeded) is reported once and otherwise
 * swallowed: losing a persisted preference should never crash the app.
 */
export function createSsrSafeStorage(logLabel: string): StateStorage {
  let reportedFailure = false;
  return {
    getItem: (name) => (typeof window === "undefined" ? null : window.localStorage.getItem(name)),
    setItem: (name, value) => {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(name, value);
        reportedFailure = false;
      } catch (error) {
        if (reportedFailure) return;
        reportedFailure = true;
        console.error(
          `[${logLabel}] não foi possível salvar (armazenamento cheio?). As alterações seguem só nesta sessão.`,
          error,
        );
      }
    },
    removeItem: (name) => {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(name);
    },
  };
}
