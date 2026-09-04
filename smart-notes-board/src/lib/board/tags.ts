import type { BoardFile, NoteColor, TagDef } from "@/lib/board/model";
import { NOTE_COLORS } from "@/lib/board/model";

/** Etiquetas do arquivo — sempre em minúsculas e sem duplicatas. */

export function addTag(file: BoardFile, name: string, color: NoteColor): BoardFile {
  const clean = name.trim().toLowerCase();
  if (!clean || file.tags.some((tag) => tag.name === clean)) return file;
  return { ...file, tags: [...file.tags, { name: clean, color } satisfies TagDef] };
}

/** Renomear propaga para as notas e para as automações que citam a etiqueta. */
export function renameTag(file: BoardFile, oldName: string, newName: string): BoardFile {
  const clean = newName.trim().toLowerCase();
  if (!clean || clean === oldName) return file;
  return {
    ...file,
    tags: file.tags
      .map((tag) => (tag.name === oldName ? { ...tag, name: clean } : tag))
      .filter((tag, index, arr) => arr.findIndex((other) => other.name === tag.name) === index),
    notes: file.notes.map((note) =>
      note.tags.includes(oldName)
        ? {
            ...note,
            tags: Array.from(new Set(note.tags.map((tag) => (tag === oldName ? clean : tag)))),
          }
        : note,
    ),
    automations: file.automations.map((automation) =>
      automation.type === "tag" && automation.value === oldName
        ? { ...automation, value: clean }
        : automation,
    ),
  };
}

export function setTagColor(file: BoardFile, name: string, color: NoteColor): BoardFile {
  return { ...file, tags: file.tags.map((tag) => (tag.name === name ? { ...tag, color } : tag)) };
}

export function removeTag(file: BoardFile, name: string): BoardFile {
  return {
    ...file,
    tags: file.tags.filter((tag) => tag.name !== name),
    notes: file.notes.map((note) =>
      note.tags.includes(name) ? { ...note, tags: note.tags.filter((tag) => tag !== name) } : note,
    ),
    automations: file.automations.filter(
      (automation) => !(automation.type === "tag" && automation.value === name),
    ),
  };
}

export function tagColorOf(tags: TagDef[], name: string): NoteColor {
  return tags.find((tag) => tag.name === name)?.color ?? "slate";
}

export function collectTags(names: string[], existing: TagDef[] = []): TagDef[] {
  const out = [...existing];
  for (const raw of names) {
    const name = raw.trim().toLowerCase();
    if (!name || out.some((tag) => tag.name === name)) continue;
    out.push({ name, color: NOTE_COLORS[out.length % NOTE_COLORS.length]! });
  }
  return out;
}
