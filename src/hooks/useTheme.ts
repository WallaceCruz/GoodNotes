import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";
const KEY = "kanban.theme";

function apply(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

function read(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const initial = read();
    setThemeState(initial);
    apply(initial);
    const onChange = (e: Event) => {
      const next = (e as CustomEvent<Theme>).detail;
      if (next === "light" || next === "dark") setThemeState(next);
    };
    window.addEventListener("kanban-theme", onChange);
    return () => window.removeEventListener("kanban-theme", onChange);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    window.localStorage.setItem(KEY, next);
    apply(next);
    setThemeState(next);
    window.dispatchEvent(new CustomEvent("kanban-theme", { detail: next }));
  }, []);

  const toggleTheme = useCallback(
    () => setTheme(read() === "dark" ? "light" : "dark"),
    [setTheme],
  );

  return { theme, setTheme, toggleTheme, isDark: theme === "dark" };
}
