/**
 * O modelo do quadro: os formatos que o app manipula e o vocabulário fixo
 * (cores, prioridades, status, categorias, pessoas).
 *
 * Só definições. As regras que operam sobre estes formatos moram nos módulos
 * do assunto correspondente — `status.ts`, `native-columns.ts`, `notes.ts`,
 * `tags.ts`, `automations.ts` — porque um arquivo chamado "modelo" que também
 * decide comportamento acaba sendo importado por todo mundo por dois motivos
 * diferentes.
 */

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

/** Responsáveis de demonstração — papéis, não pessoas. */
export const MEMBERS: Member[] = [
  { id: "voce", name: "Você" },
  { id: "produto", name: "Produto" },
  { id: "design", name: "Design" },
  { id: "engenharia", name: "Engenharia" },
  { id: "qa", name: "QA" },
];

/**
 * Comentário do time numa nota.
 *
 * Vive dentro da nota — é dela que o comentário fala, e nenhuma tela precisa
 * dos comentários sem a nota junto. O Inbox os reúne de volta na hora de
 * mostrar a conversa do arquivo inteiro.
 */
export type Comment = {
  id: string;
  author: string;
  text: string;
  createdAt: number;
};

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
  comments: Comment[];
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

export type NativeColumnKey =
  "backlog" | "research" | "discovery" | "doing" | "validation" | "done";

export type Column = {
  id: string;
  title: string;
  color?: NoteColor | null;
  native?: NativeColumnKey | null;
};

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

/** Chave da coluna nativa onde a nota está (ou null para colunas personalizadas). */
