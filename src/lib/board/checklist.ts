import { uid } from "@/lib/id";
import {
  type BoardFile,
  type NoteImage,
} from "@/lib/board-types";

/** Itens de checklist e imagens de uma nota — coleções internas, mesma forma. */

function mapNote(file: BoardFile, noteId: string, fn: (n: BoardFile["notes"][number]) => BoardFile["notes"][number]): BoardFile {
  return { ...file, notes: file.notes.map((n) => (n.id === noteId ? fn(n) : n)) };
}

export function addChecklistItem(file: BoardFile, noteId: string, text: string): BoardFile {
  return mapNote(file, noteId, (n) => ({
    ...n,
    checklist: [...n.checklist, { id: uid(), text, done: false }],
  }));
}

export function updateChecklistItem(
  file: BoardFile,
  noteId: string,
  itemId: string,
  patch: { text?: string; done?: boolean },
): BoardFile {
  return mapNote(file, noteId, (n) => ({
    ...n,
    checklist: n.checklist.map((i) => (i.id === itemId ? { ...i, ...patch } : i)),
  }));
}

export function removeChecklistItem(file: BoardFile, noteId: string, itemId: string): BoardFile {
  return mapNote(file, noteId, (n) => ({
    ...n,
    checklist: n.checklist.filter((i) => i.id !== itemId),
  }));
}

export function addImage(file: BoardFile, noteId: string, url: string, link = ""): BoardFile {
  return mapNote(file, noteId, (n) => ({ ...n, images: [...n.images, { id: uid(), url, link }] }));
}

export function updateImage(
  file: BoardFile,
  noteId: string,
  imageId: string,
  patch: Partial<NoteImage>,
): BoardFile {
  return mapNote(file, noteId, (n) => ({
    ...n,
    images: n.images.map((i) => (i.id === imageId ? { ...i, ...patch } : i)),
  }));
}

export function removeImage(file: BoardFile, noteId: string, imageId: string): BoardFile {
  return mapNote(file, noteId, (n) => ({
    ...n,
    images: n.images.filter((i) => i.id !== imageId),
  }));
}
