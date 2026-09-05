import type { BoardFile, Note, NoteAttachment } from "@/lib/board/model";

/**
 * Anexos das notas — apenas os metadados.
 *
 * O arquivo em si é responsabilidade de `lib/attachment-files.ts`. Este módulo
 * só decide o que a nota registra, e por isso continua sendo função pura sobre
 * dados, testável sem navegador.
 */

function mapNote(file: BoardFile, noteId: string, change: (note: Note) => Note): BoardFile {
  return {
    ...file,
    notes: file.notes.map((note) => (note.id === noteId ? change(note) : note)),
  };
}

export function addAttachment(
  file: BoardFile,
  noteId: string,
  attachment: NoteAttachment,
): BoardFile {
  return mapNote(file, noteId, (note) => ({
    ...note,
    attachments: [...note.attachments, attachment],
  }));
}

export function removeAttachment(file: BoardFile, noteId: string, attachmentId: string): BoardFile {
  return mapNote(file, noteId, (note) => ({
    ...note,
    attachments: note.attachments.filter((a) => a.id !== attachmentId),
  }));
}

const UNIDADES = ["B", "KB", "MB", "GB"];

/** Tamanho legível: 1536 vira "1,5 KB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1) return "0 B";
  const escala = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), UNIDADES.length - 1);
  const valor = bytes / Math.pow(1024, escala);
  const casas = valor < 10 && escala > 0 ? 1 : 0;
  return `${valor.toFixed(casas).replace(".", ",")} ${UNIDADES[escala]}`;
}
