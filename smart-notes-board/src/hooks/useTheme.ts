import { useCallback, useEffect } from "react";
import { useLocalStore } from "./useLocalStore";

export type Theme = "light" | "dark";

/**
 * Chave nova: a anterior gravava o texto cru ("dark"), fora do formato JSON que
 * todas as outras preferências usam. Quem vier da versão antiga cai uma única
 * vez na preferência do sistema, que é o padrão desejado mesmo.
 */
const KEY = "sticky-flow:theme";

const parseTheme = (raw: unknown): Theme | null => (raw === "light" || raw === "dark" ? raw : null);

const systemTheme = (): Theme =>
  typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

function applyToDocument(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

/**
 * Tema da interface. A sincronização entre abas e entre componentes vem do
 * armazenamento compartilhado — antes isto exigia um `CustomEvent` próprio.
 */
export function useTheme() {
  const {
    value: stored,
    setValue,
    hydrated,
  } = useLocalStore<Theme | null>({
    key: KEY,
    fallback: null,
    parse: parseTheme,
    label: "tema",
  });

  // Sem escolha gravada, vale a preferência do sistema.
  const theme: Theme = stored ?? (hydrated ? systemTheme() : "light");

  useEffect(() => {
    if (hydrated) applyToDocument(theme);
  }, [theme, hydrated]);

  const setTheme = useCallback((next: Theme) => setValue(next), [setValue]);
  const toggleTheme = useCallback(
    () => setTheme(theme === "dark" ? "light" : "dark"),
    [setTheme, theme],
  );

  return { theme, setTheme, toggleTheme, isDark: theme === "dark" };
}
