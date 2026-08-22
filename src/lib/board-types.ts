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
  | "slate";

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

export const STATUS_CLASS: Record<NoteStatus, string> = {
  done: "border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  doing: "border-blue-500/50 bg-blue-500/15 text-blue-700 dark:text-blue-300",
  pending: "border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300",
  undone: "border-destructive/50 bg-destructive/15 text-destructive",
  rescheduled: "border-purple-500/50 bg-purple-500/15 text-purple-700 dark:text-purple-300",
};

export type CategoryDef = { id: string; emoji: string; name: string };

export const DEFAULT_CATEGORIES: CategoryDef[] = [
  { id: "casa", emoji: "🏠", name: "Casa" },
  { id: "trabalho", emoji: "💼", name: "Trabalho" },
  { id: "estudos", emoji: "📚", name: "Estudos" },
  { id: "autocuidado", emoji: "🧘", name: "Autocuidado" },
  { id: "exercicio", emoji: "🏃", name: "Exercício" },
  { id: "alimentacao", emoji: "🍎", name: "Alimentação" },
  { id: "sono", emoji: "😴", name: "Sono" },
  { id: "saude", emoji: "💊", name: "Saúde" },
  { id: "social", emoji: "👥", name: "Social" },
  { id: "relacionamentos", emoji: "❤️", name: "Relacionamentos" },
  { id: "familia", emoji: "👨‍👩‍👧", name: "Família" },
  { id: "compras", emoji: "🛒", name: "Compras" },
  { id: "transporte", emoji: "🚗", name: "Transporte" },
  { id: "financas", emoji: "💰", name: "Finanças" },
  { id: "domesticas", emoji: "🧹", name: "Tarefas domésticas" },
  { id: "criatividade", emoji: "🎨", name: "Criatividade" },
  { id: "lazer", emoji: "🎮", name: "Lazer" },
  { id: "tecnologia", emoji: "📱", name: "Tecnologia" },
  { id: "externas", emoji: "🌳", name: "Atividades externas" },
  { id: "relaxamento", emoji: "🧘‍♂️", name: "Relaxamento" },
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

export type NoteKind = "sticky" | "notepad";

export const NOTE_KIND_LABEL: Record<NoteKind, string> = {
  sticky: "Nota autoadesiva",
  notepad: "Bloco de notas",
};

export type Note = {
  id: string;
  columnId: string;
  kind: NoteKind;
  title: string;
  content: string;
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
  archived: boolean;
  pinned?: boolean;
  order: number;
  height?: number | null;
};


export type TagDef = {
  name: string;
  color: NoteColor;
};

export const TAG_PALETTE: NoteColor[] = NOTE_COLORS;

export function tagColorOf(tags: TagDef[], name: string): NoteColor {
  return tags.find((t) => t.name === name)?.color ?? "slate";
}

export type NativeColumnKey =
  | "backlog"
  | "research"
  | "discovery"
  | "doing"
  | "validation"
  | "done";

export const NATIVE_COLUMNS: Array<{ key: NativeColumnKey; title: string }> = [
  { key: "backlog", title: "Backlog" },
  { key: "research", title: "Research" },
  { key: "discovery", title: "Discovery" },
  { key: "doing", title: "Em andamento" },
  { key: "validation", title: "Em revisão" },
  { key: "done", title: "Concluído" },
];

/** Paleta fixa das colunas nativas (usada quando o usuário liga "colunas coloridas"). */
export const NATIVE_COLUMN_THEME: Record<
  NativeColumnKey,
  { bar: string; header: string; body: string; border: string; icon: string }
> = {
  backlog: {
    bar: "bg-neutral-400",
    header: "bg-neutral-500/12",
    body: "bg-neutral-500/[0.06]",
    border: "border-neutral-500/30",
    icon: "text-neutral-500",
  },
  research: {
    bar: "bg-pink-400",
    header: "bg-pink-500/12",
    body: "bg-pink-500/[0.06]",
    border: "border-pink-500/30",
    icon: "text-pink-500",
  },
  discovery: {
    bar: "bg-purple-400",
    header: "bg-purple-500/12",
    body: "bg-purple-500/[0.06]",
    border: "border-purple-500/30",
    icon: "text-purple-500",
  },
  doing: {
    bar: "bg-blue-400",
    header: "bg-blue-500/12",
    body: "bg-blue-500/[0.06]",
    border: "border-blue-500/30",
    icon: "text-blue-500",
  },
  validation: {
    bar: "bg-amber-400",
    header: "bg-amber-500/12",
    body: "bg-amber-500/[0.06]",
    border: "border-amber-500/30",
    icon: "text-amber-500",
  },
  done: {
    bar: "bg-emerald-400",
    header: "bg-emerald-500/12",
    body: "bg-emerald-500/[0.06]",
    border: "border-emerald-500/30",
    icon: "text-emerald-500",
  },
};

// Títulos antigos que devem ser reaproveitados como colunas nativas.
const LEGACY_TITLE_MAP: Record<string, NativeColumnKey> = {
  backlog: "backlog",
  research: "research",
  discovery: "discovery",
  fazendo: "doing",
  "em andamento": "doing",
  "doing": "doing",
  "validação": "validation",
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

// Garante que todo quadro tenha as colunas nativas (não excluíveis), na ordem correta.
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
  const natives: Column[] = NATIVE_COLUMNS.map(
    (def) =>
      marked.find((c) => c.native === def.key) ?? { id: uid(), title: def.title, native: def.key },
  );
  const others = marked.filter((c) => !c.native);
  return [...natives, ...others];
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

export const uid = () => Math.random().toString(36).slice(2, 10);

const minutes = (m: number) => Date.now() - m * 60_000;
const days = (d: number) => Date.now() + d * 86_400_000;

const defaultColumns = (): Column[] => nativeColumns();

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

function makeFile(name: string, seed: Array<Partial<Note>>): BoardFile {
  const columns = defaultColumns();
  return {
    id: uid(),
    name,
    columns,
    automations: [],
    archived: false,
    tags: collectTags(seed.flatMap((n) => n.tags ?? [])),
    notes: seed.map((n, i) => ({
      id: uid(),
      columnId: columns[Math.min(i % 3, 2)]!.id,
      kind: n.kind ?? "sticky",
      title: n.title ?? "Nova nota",
      content: n.content ?? "",
      color: n.color ?? "rose",
      author: n.author ?? "Walle Dev",
      assignee: n.assignee ?? n.author ?? null,
      updatedAt: n.updatedAt ?? minutes(60 + i * 30),
      tags: n.tags ?? [],
      checklist: n.checklist ?? [],
      showChecklist: (n.checklist?.length ?? 0) > 0,
      images: n.images ?? [],
      priority: n.priority ?? null,
      status: n.status ?? null,
      category: n.category ?? null,
      deadline: n.deadline ?? null,
      archived: n.archived ?? false,
      order: i,
    })),
  };
}

export function createInitialState(): BoardState {
  return {
    projects: [
      {
        id: uid(),
        name: "Checkout",
        archived: false,
        files: [
          makeFile("Checkout do Usuário", [
            {
              title: "PTI8708 - Revisão de Bundles 2026 - Onda 1",
              content:
                "<p>Revisar os bundles priorizados para a primeira onda de 2026 e alinhar com o time de pricing.</p>",
              color: "rose",
              tags: ["pricing", "bundles"],
              author: "Walle Dev",
              updatedAt: minutes(12),
              priority: "urgent",
              deadline: days(2),
              checklist: [
                { id: uid(), text: "Listar bundles ativos", done: true },
                { id: uid(), text: "Aprovar com pricing", done: false },
              ],
            },
            {
              title: "Allan sugeriu reorganizar os requisitos do checkout offline",
              content:
                "<p>Detectei duplicidade entre dois requisitos funcionais e uma regra de negócio.</p>",
              color: "amber",
              tags: ["checkout"],
              author: "Agente Allan",
              updatedAt: minutes(48),
              priority: "high",
            },
            {
              title: "Marina comentou no épico de Onboarding Mobile",
              content:
                "<p>Precisamos incluir Jurídico como dependência antes de fechar esse escopo.</p>",
              color: "lime",
              tags: ["mobile", "jurídico"],
              author: "Marina Costa",
              updatedAt: minutes(120),
              priority: "medium",
            },
            {
              title: "Angelina respondeu sobre a User Story de recuperação de senha",
              content:
                "<p>Revisei os critérios de aceitação e faltam cenários para tentativa expirada e link reutilizado.</p>",
              color: "violet",
              tags: ["user story"],
              author: "Agente Angelina",
              updatedAt: minutes(180),
              priority: "low",
            },
            {
              title: "Bruno encontrou lacunas nos casos de teste",
              content:
                "<p>Os cenários de falha do login social ainda não foram refletidos nos casos de teste vinculados.</p>",
              color: "sky",
              tags: ["qa", "checkout"],
              author: "Agente Bruno",
              updatedAt: minutes(240),
            },
          ]),
          makeFile("COR", [
            {
              title: "Paula comentou no requisito não funcional de auditoria",
              content:
                "<p>Precisamos explicitar retenção de logs por 12 meses para atender compliance interno.</p>",
              color: "peach",
              tags: ["compliance"],
              author: "Paula Mendes",
              updatedAt: minutes(300),
            },
            {
              title: "Thiago pediu ajuste na iniciativa Expansão Mobile 2026",
              content:
                "<p>Vamos quebrar esse bloco em dois épicos menores: onboarding e pagamentos.</p>",
              color: "amber",
              tags: ["mobile"],
              author: "Thiago Ghisi",
              updatedAt: minutes(420),
            },
          ]),
        ],
      },
    ],
  };
}
