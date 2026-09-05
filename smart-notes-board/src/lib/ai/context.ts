import { stripHtml } from "@/lib/html";
import { formatDate } from "@/lib/date";
import type { BoardFile, Note } from "@/lib/board/model";

/**
 * O que o assistente enxerga.
 *
 * O modelo não recebe o quadro inteiro por padrão: uma nota aberta é o assunto
 * quase sempre, e mandar tudo custa tokens e dilui a atenção. O escopo é
 * explícito — a nota, ou o arquivo — e a interface mostra qual está valendo.
 */

export type AiScope =
  { kind: "note"; note: Note } | { kind: "file"; file: BoardFile } | { kind: "none" };

/** Rótulo do escopo, para o usuário saber sobre o que está conversando. */
export function scopeLabel(scope: AiScope): { title: string; hint: string } | null {
  if (scope.kind === "note") {
    return { title: scope.note.title || "Nota sem título", hint: "Nota atual" };
  }
  if (scope.kind === "file") {
    return { title: scope.file.name, hint: "Arquivo atual" };
  }
  return null;
}

function describeNote(note: Note, detailed: boolean): string {
  const partes = [`## ${note.title || "Sem título"}`];

  if (note.deadline) partes.push(`Prazo: ${formatDate(note.deadline)}`);
  if (note.priority) partes.push(`Prioridade: ${note.priority}`);
  if (note.tags.length) partes.push(`Etiquetas: ${note.tags.join(", ")}`);

  const corpo = stripHtml(note.content).trim();
  if (corpo) partes.push(corpo);

  if (!detailed) return partes.join("\n");

  const abaixo = stripHtml(note.contentBelow ?? "").trim();
  if (abaixo) partes.push(abaixo);

  if (note.checklist.length) {
    partes.push(
      "Checklist:\n" + note.checklist.map((i) => `- [${i.done ? "x" : " "}] ${i.text}`).join("\n"),
    );
  }
  if (note.comments.length) {
    partes.push("Comentários:\n" + note.comments.map((c) => `- ${c.author}: ${c.text}`).join("\n"));
  }
  if (note.attachments.length) {
    partes.push("Anexos: " + note.attachments.map((a) => a.name).join(", "));
  }
  return partes.join("\n");
}

/** O texto que descreve o escopo, pronto para entrar no prompt. */
export function describeScope(scope: AiScope): string {
  if (scope.kind === "note") return describeNote(scope.note, true);

  if (scope.kind === "file") {
    const ativas = scope.file.notes.filter((note) => !note.archived);
    if (ativas.length === 0) return `# ${scope.file.name}\n\n(sem notas)`;
    return [
      `# ${scope.file.name}`,
      `${ativas.length} nota(s):`,
      ...ativas.map((note) => describeNote(note, false)),
    ].join("\n\n");
  }
  return "";
}

/**
 * Notas que a pessoa escolheu a mais, além do escopo automático.
 *
 * Vão detalhadas: se alguém foi ao trabalho de selecionar uma nota, quer que o
 * modelo leia o conteúdo dela, não só o título.
 */
export function describeExtras(notes: Note[]): string {
  if (notes.length === 0) return "";
  return [
    `# Notas escolhidas (${notes.length})`,
    ...notes.map((note) => describeNote(note, true)),
  ].join("\n\n");
}

export const SYSTEM_PROMPT = `Você é o assistente do Goodnotes, um app de notas autoadesivas em kanban.

Ajuda quem usa a escrever, revisar, resumir, organizar e criar notas. Responde
em português do Brasil, salvo se a pessoa escrever em outro idioma.

Diretrizes:
- Vá direto ao ponto. Quem pergunta está no meio do trabalho.
- Quando o contexto de uma nota ou arquivo for fornecido, baseie a resposta
  nele. Se a resposta não estiver ali, diga isso em vez de inventar.
- Para criar notas, use a ferramenta criar_nota — não escreva a nota na
  resposta pedindo que copiem.
- Formate com markdown simples quando ajudar a ler.`;
