import { uid } from "@/lib/id";

export type NoteColor =
  | "rose"
  | "amber"
  | "lime"
  | "sky"
  | "violet"
  | "peach"
  | "teal"
  | "indigo"
  | "sand"
  | "mint"
  | "coral"
  | "slate"
  | "white";

export const NOTE_COLORS: NoteColor[] = [
  "rose",
  "amber",
  "lime",
  "sky",
  "violet",
  "peach",
  "teal",
  "indigo",
  "sand",
  "mint",
  "coral",
  "slate",
  "white",
];

export type Priority = "urgent" | "high" | "medium" | "low";

export const PRIORITIES: Priority[] = ["urgent", "high", "medium", "low"];

export const PRIORITY_LABEL: Record<Priority, string> = {
  urgent: "Urgente",
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

export const PRIORITY_ICON: Record<Priority, string> = {
  urgent: "🔥",
  high: "⚡",
  medium: "🔹",
  low: "🌱",
};

export type NoteStatus = "done" | "doing" | "pending" | "undone" | "rescheduled";

export const NOTE_STATUSES: NoteStatus[] = ["pending", "doing", "done", "undone", "rescheduled"];

export const STATUS_LABEL: Record<NoteStatus, string> = {
  done: "Concluído",
  doing: "Em andamento",
  pending: "Pendente",
  undone: "Não concluído",
  rescheduled: "Reagendado",
};

export const STATUS_HINT: Record<NoteStatus, string> = {
  done: "Tarefa finalizada",
  doing: "Começou, mas ainda não terminou",
  pending: "Ainda não iniciada",
  undone: "Não foi realizada",
  rescheduled: "Passou para outro horário/dia",
};

export type CategoryDef = { id: string; icon: string; name: string };

export const DEFAULT_CATEGORIES: CategoryDef[] = [
  { id: "casa", icon: "home", name: "Casa" },
  { id: "trabalho", icon: "briefcase", name: "Trabalho" },
  { id: "estudos", icon: "book", name: "Estudos" },
  { id: "autocuidado", icon: "lotus", name: "Autocuidado" },
  { id: "exercicio", icon: "run", name: "Exercício" },
  { id: "alimentacao", icon: "apple", name: "Alimentação" },
  { id: "sono", icon: "sleep", name: "Sono" },
  { id: "saude", icon: "pill", name: "Saúde" },
  { id: "social", icon: "users", name: "Social" },
  { id: "relacionamentos", icon: "heart", name: "Relacionamentos" },
  { id: "familia", icon: "family", name: "Família" },
  { id: "compras", icon: "cart", name: "Compras" },
  { id: "transporte", icon: "car", name: "Transporte" },
  { id: "financas", icon: "money", name: "Finanças" },
  { id: "domesticas", icon: "clean", name: "Tarefas domésticas" },
  { id: "criatividade", icon: "palette", name: "Criatividade" },
  { id: "lazer", icon: "game", name: "Lazer" },
  { id: "tecnologia", icon: "phone", name: "Tecnologia" },
  { id: "externas", icon: "tree", name: "Atividades externas" },
  { id: "relaxamento", icon: "leaf", name: "Relaxamento" },
];

export type Member = { id: string; name: string };

export const MEMBERS: Member[] = [
  { id: "walle", name: "Walle Dev" },
  { id: "marina", name: "Marina Costa" },
  { id: "paula", name: "Paula Mendes" },
  { id: "thiago", name: "Thiago Ghisi" },
  { id: "allan", name: "Agente Allan" },
  { id: "angelina", name: "Agente Angelina" },
  { id: "bruno", name: "Agente Bruno" },
];

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type NoteImage = {
  id: string;
  url: string;
  link: string;
};

export type Note = {
  id: string;
  columnId: string;
  title: string;
  content: string;
  /** Texto que fica depois do checklist (conclusões, observações, próximos passos). */
  contentBelow?: string;
  color: NoteColor;
  /** Cor personalizada (hex) escolhida pelo usuário; sobrepõe `color`. */
  colorHex?: string | null;
  author: string;
  assignee: string | null;
  /** Responsáveis adicionais (multi). `assignee` permanece como o primeiro da lista. */
  assignees?: string[];
  updatedAt: number;
  tags: string[];
  checklist: ChecklistItem[];
  showChecklist: boolean;
  images: NoteImage[];
  priority: Priority | null;
  status: NoteStatus | null;
  category: string | null;
  deadline: number | null;
  /** Início planejado (usado na Linha do tempo). */
  startDate?: number | null;
  archived: boolean;
  pinned?: boolean;
  order: number;
  height?: number | null;
};

export type TagDef = {
  name: string;
  color: NoteColor;
};

export function tagColorOf(tags: TagDef[], name: string): NoteColor {
  return tags.find((t) => t.name === name)?.color ?? "slate";
}

export type NativeColumnKey =
  "backlog" | "research" | "discovery" | "doing" | "validation" | "done";

export const NATIVE_COLUMNS: Array<{ key: NativeColumnKey; title: string }> = [
  { key: "backlog", title: "Backlog" },
  { key: "research", title: "Research" },
  { key: "discovery", title: "Discovery" },
  { key: "doing", title: "Em andamento" },
  { key: "validation", title: "Em revisão" },
  { key: "done", title: "Concluído" },
];

// Títulos antigos que devem ser reaproveitados como colunas nativas.
const LEGACY_TITLE_MAP: Record<string, NativeColumnKey> = {
  backlog: "backlog",
  research: "research",
  discovery: "discovery",
  fazendo: "doing",
  "em andamento": "doing",
  doing: "doing",
  validação: "validation",
  validacao: "validation",
  "em revisão": "validation",
  "em revisao": "validation",
  revisão: "validation",
  feito: "done",
  concluído: "done",
  concluido: "done",
  "concluído (done)": "done",
  done: "done",
};

export type Column = {
  id: string;
  title: string;
  color?: NoteColor | null;
  native?: NativeColumnKey | null;
};

export const nativeColumns = (): Column[] =>
  NATIVE_COLUMNS.map((c) => ({ id: uid(), title: c.title, native: c.key }));

// Garante que todo quadro tenha as colunas nativas (não excluíveis), preservando a
// ordem escolhida pelo usuário. Nativas ausentes entram no início, na ordem padrão.
export function ensureNativeColumns(columns: Column[]): Column[] {
  const taken = new Set<NativeColumnKey>();
  const marked = columns.map((c) => {
    const key = c.native ?? LEGACY_TITLE_MAP[c.title.trim().toLowerCase()];
    if (key && !taken.has(key)) {
      taken.add(key);
      const def = NATIVE_COLUMNS.find((n) => n.key === key)!;
      return { ...c, native: key, title: def.title };
    }
    return { ...c, native: null };
  });
  const missing: Column[] = NATIVE_COLUMNS.filter((def) => !taken.has(def.key)).map((def) => ({
    id: uid(),
    title: def.title,
    native: def.key,
  }));
  return [...missing, ...marked];
}

export type AutomationType = "tag" | "priority" | "checklist-done";

export const AUTOMATION_LABEL: Record<AutomationType, string> = {
  tag: "Tem a tag",
  priority: "Prioridade é",
  "checklist-done": "Checklist 100% concluído",
};

export type Automation = {
  id: string;
  type: AutomationType;
  value: string;
  columnId: string;
  enabled: boolean;
};

export type BoardFile = {
  id: string;
  name: string;
  columns: Column[];
  notes: Note[];
  tags: TagDef[];
  automations: Automation[];
  archived: boolean;
};

export type Project = {
  id: string;
  name: string;
  files: BoardFile[];
  archived: boolean;
};

export type BoardState = {
  projects: Project[];
};

export function matchesAutomation(rule: Automation, note: Note): boolean {
  switch (rule.type) {
    case "tag":
      return note.tags.includes(rule.value);
    case "priority":
      return note.priority === rule.value;
    case "checklist-done":
      return note.checklist.length > 0 && note.checklist.every((i) => i.done);
    default:
      return false;
  }
}

export function collectTags(names: string[], existing: TagDef[] = []): TagDef[] {
  const out = [...existing];
  for (const raw of names) {
    const name = raw.trim().toLowerCase();
    if (!name || out.some((t) => t.name === name)) continue;
    out.push({ name, color: NOTE_COLORS[out.length % NOTE_COLORS.length]! });
  }
  return out;
}

/** Lista de responsáveis de uma nota (compatível com o campo legado `assignee`). */
export function noteAssignees(note: Pick<Note, "assignee" | "assignees">): string[] {
  if (note.assignees?.length) return note.assignees;
  return note.assignee ? [note.assignee] : [];
}

/** Chave da coluna nativa onde a nota está (ou null para colunas personalizadas). */
export function nativeKeyOf(columns: Column[], columnId: string): NativeColumnKey | null {
  return columns.find((c) => c.id === columnId)?.native ?? null;
}

/**
 * Status que a coluna nativa sugere quando a nota não tem um status próprio
 * definido manualmente — backlog/research/discovery ainda não começaram
 * (pendente), doing/validação estão em andamento, concluído fecha o ciclo.
 */
const NATIVE_STATUS_DEFAULT: Record<NativeColumnKey, NoteStatus> = {
  backlog: "pending",
  research: "pending",
  discovery: "pending",
  doing: "doing",
  validation: "doing",
  done: "done",
};

/**
 * Status efetivo considerando a coluna. "Concluído" sempre fecha a nota,
 * independente do que estava marcado antes; as demais colunas nativas só
 * *sugerem* um status — se o usuário já escolheu um manualmente (ex.: "Não
 * concluído", "Reagendado"), essa escolha continua valendo.
 */
export function effectiveStatus(
  note: Pick<Note, "status" | "columnId">,
  columns: Column[],
): NoteStatus | null {
  const key = nativeKeyOf(columns, note.columnId);
  if (key === "done") return "done";
  if (key) return note.status ?? NATIVE_STATUS_DEFAULT[key];
  return note.status;
}

export const DAY_MS = 86_400_000;

/** Intervalo (início/fim) de uma nota para a Linha do tempo. */
export function noteRange(
  note: Pick<Note, "startDate" | "deadline">,
): { start: number; end: number } | null {
  const anchor = note.deadline ?? note.startDate ?? null;
  if (!anchor) return null;
  const end = note.deadline ?? anchor;
  const start = note.startDate ?? end - DAY_MS;
  return { start: Math.min(start, end), end: Math.max(start, end) };
}
