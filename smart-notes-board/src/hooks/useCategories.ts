import { useCallback } from "react";
import { useLocalStore } from "./useLocalStore";
import { uid } from "@/lib/id";
import { DEFAULT_CATEGORIES, type CategoryDef } from "@/lib/board/model";

const KEY = "sticky-categories-v1";
const LABEL = "categorias";

const EMPTY: CategoryDef[] = [];

/** Versões antigas gravavam `emoji` no lugar de `icon`; o padrão cobre o resto. */
function parseCategories(raw: unknown): CategoryDef[] | null {
  if (!Array.isArray(raw)) return null;
  return raw
    .filter((c): c is CategoryDef => !!c && typeof c.id === "string" && typeof c.name === "string")
    .map((c) => ({ id: c.id, name: c.name, icon: c.icon ?? "tag" }));
}

const slug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

/** Categorias padrão do app somadas às que o usuário criou. */
export function useCategories() {
  const { value: custom, setValue: setCustom } = useLocalStore({
    key: KEY,
    fallback: EMPTY,
    parse: parseCategories,
    label: LABEL,
  });

  const addCategory = useCallback(
    (name: string, icon: string) => {
      const clean = name.trim();
      if (!clean) return null;
      const category: CategoryDef = {
        id: `c_${slug(clean)}_${uid()}`,
        icon: icon || "tag",
        name: clean,
      };
      setCustom((current) => [...current, category]);
      return category;
    },
    [setCustom],
  );

  const removeCategory = useCallback(
    (id: string) => setCustom((current) => current.filter((c) => c.id !== id)),
    [setCustom],
  );

  const categories = [...DEFAULT_CATEGORIES, ...custom];
  const findCategory = (id: string | null | undefined) =>
    id ? (categories.find((c) => c.id === id) ?? null) : null;

  return { categories, custom, addCategory, removeCategory, findCategory };
}
