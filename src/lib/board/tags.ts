import type { BoardFile, NoteColor, TagDef } from "@/lib/board-types";

/** Etiquetas do arquivo — sempre em minúsculas e sem duplicatas. */

export function addTag(file: BoardFile, name: string, color: NoteColor): BoardFile {
  const clean = name.trim().toLowerCase();
  if (!clean || file.tags.some((t) => t.name === clean)) return file;
  return { ...file, tags: [...file.tags, { name: clean, color } satisfies TagDef] };
}

/** Renomear propaga para as notas e para as automações que citam a etiqueta. */
export function renameTag(file: BoardFile, oldName: string, newName: string): BoardFile {
  const clean = newName.trim().toLowerCase();
  if (!clean || clean === oldName) return file;
  return {
    ...file,
    tags: file.tags
      .map((t) => (t.name === oldName ? { ...t, name: clean } : t))
      .filter((t, i, arr) => arr.findIndex((x) => x.name === t.name) === i),
    notes: file.notes.map((n) =>
      n.tags.includes(oldName)
        ? { ...n, tags: Array.from(new Set(n.tags.map((t) => (t === oldName ? clean : t)))) }
        : n,
    ),
    automations: file.automations.map((a) =>
      a.type === "tag" && a.value === oldName ? { ...a, value: clean } : a,
    ),
  };
}

export function setTagColor(file: BoardFile, name: string, color: NoteColor): BoardFile {
  return { ...file, tags: file.tags.map((t) => (t.name === name ? { ...t, color } : t)) };
}

export function removeTag(file: BoardFile, name: string): BoardFile {
  return {
    ...file,
    tags: file.tags.filter((t) => t.name !== name),
    notes: file.notes.map((n) =>
      n.tags.includes(name) ? { ...n, tags: n.tags.filter((t) => t !== name) } : n,
    ),
    automations: file.automations.filter((a) => !(a.type === "tag" && a.value === name)),
  };
}
