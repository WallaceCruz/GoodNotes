import { useCallback, useEffect, useState } from "react";
import { DEFAULT_CATEGORIES, type CategoryDef } from "@/lib/board-types";

const KEY = "sticky-categories-v1";

function read(): CategoryDef[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as (CategoryDef & { emoji?: string })[];
    return Array.isArray(parsed)
      ? parsed
          .filter((c) => c && typeof c.id === "string" && typeof c.name === "string")
          .map((c) => ({ id: c.id, name: c.name, icon: c.icon ?? "tag" }))
      : [];
  } catch {
    return [];
  }
}


/** Categorias padrão + personalizadas do usuário (persistidas localmente). */
export function useCategories() {
  const [custom, setCustom] = useState<CategoryDef[]>([]);

  useEffect(() => {
    setCustom(read());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setCustom(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: CategoryDef[]) => {
    setCustom(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const addCategory = useCallback(
    (name: string, icon: string) => {
      const clean = name.trim();
      if (!clean) return null;
      const id = `c_${clean.toLowerCase().replace(/\s+/g, "-")}_${Math.random()
        .toString(36)
        .slice(2, 6)}`;
      const cat: CategoryDef = { id, icon: icon || "tag", name: clean };
      persist([...read(), cat]);
      return cat;
    },
    [persist],
  );


  const removeCategory = useCallback(
    (id: string) => persist(read().filter((c) => c.id !== id)),
    [persist],
  );

  const categories = [...DEFAULT_CATEGORIES, ...custom];
  const findCategory = (id: string | null | undefined) =>
    id ? (categories.find((c) => c.id === id) ?? null) : null;

  return { categories, custom, addCategory, removeCategory, findCategory };
}
