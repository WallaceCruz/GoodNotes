import { uid } from "@/lib/id";
import type { BoardFile, Comment, Note } from "@/lib/board/model";

/**
 * Comentários do time nas notas.
 *
 * O Inbox mostra a conversa do arquivo, não o que está escrito nas notas: quem
 * comentou, o que disse e em qual nota. Por isso o módulo devolve o comentário
 * sempre acompanhado da nota a que pertence — sem isso, a tela teria que
 * cruzar as duas coisas por conta própria.
 */

/** Um comentário com a nota em que foi feito. */
export type CommentEntry = { comment: Comment; note: Note };

function mapNote(file: BoardFile, noteId: string, change: (note: Note) => Note): BoardFile {
  return {
    ...file,
    notes: file.notes.map((note) => (note.id === noteId ? change(note) : note)),
  };
}

/** Texto em branco não vira comentário. */
export function addComment(
  file: BoardFile,
  noteId: string,
  author: string,
  text: string,
): BoardFile {
  const clean = text.trim();
  if (!clean) return file;

  const comment: Comment = { id: uid(), author, text: clean, createdAt: Date.now() };
  return mapNote(file, noteId, (note) => ({
    ...note,
    comments: [...note.comments, comment],
  }));
}

export function removeComment(file: BoardFile, noteId: string, commentId: string): BoardFile {
  return mapNote(file, noteId, (note) => ({
    ...note,
    comments: note.comments.filter((comment) => comment.id !== commentId),
  }));
}

export function commentCount(note: Note): number {
  return note.comments.length;
}

/** Toda a conversa do arquivo, do mais recente para o mais antigo. */
export function allComments(notes: Note[]): CommentEntry[] {
  return notes
    .flatMap((note) => note.comments.map((comment) => ({ comment, note })))
    .sort((a, b) => b.comment.createdAt - a.comment.createdAt);
}

/** Busca por autor, texto do comentário ou título da nota comentada. */
export function matchesQuery(entry: CommentEntry, query: string): boolean {
  const term = query.trim().toLowerCase();
  if (!term) return true;
  return `${entry.comment.author} ${entry.comment.text} ${entry.note.title}`
    .toLowerCase()
    .includes(term);
}
