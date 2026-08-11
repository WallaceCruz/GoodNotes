export type NoteColor = "rose" | "amber" | "lime" | "sky" | "violet" | "peach";

export const NOTE_COLORS: NoteColor[] = ["rose", "amber", "lime", "sky", "violet", "peach"];

export type SubStatus = "todo" | "doing" | "done";

export const SUB_STATUSES: SubStatus[] = ["todo", "doing", "done"];

export const SUB_STATUS_LABEL: Record<SubStatus, string> = {
  todo: "A fazer",
  doing: "Fazendo",
  done: "Feito",
};

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

export type SubNote = {
  id: string;
  text: string;
  color: NoteColor;
  status: SubStatus;
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
  color: NoteColor;
  author: string;
  updatedAt: number;
  tags: string[];
  subnotes: SubNote[];
  checklist: ChecklistItem[];
  images: NoteImage[];
  priority: Priority | null;
  deadline: number | null;
  archived: boolean;
};

export type Column = {
  id: string;
  title: string;
};

export type AutomationType = "tag" | "priority" | "checklist-done" | "subnotes-done";

export const AUTOMATION_LABEL: Record<AutomationType, string> = {
  tag: "Tem a tag",
  priority: "Prioridade é",
  "checklist-done": "Checklist 100% concluído",
  "subnotes-done": "Subtarefas todas em Feito",
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

const defaultColumns = (): Column[] => [
  { id: uid(), title: "Backlog" },
  { id: uid(), title: "Fazendo" },
  { id: uid(), title: "Feito" },
];

export function matchesAutomation(rule: Automation, note: Note): boolean {
  switch (rule.type) {
    case "tag":
      return note.tags.includes(rule.value);
    case "priority":
      return note.priority === rule.value;
    case "checklist-done":
      return note.checklist.length > 0 && note.checklist.every((i) => i.done);
    case "subnotes-done":
      return note.subnotes.length > 0 && note.subnotes.every((s) => s.status === "done");
    default:
      return false;
  }
}

function makeFile(name: string, seed: Array<Partial<Note>>): BoardFile {
  const columns = defaultColumns();
  return {
    id: uid(),
    name,
    columns,
    automations: [],
    archived: false,
    notes: seed.map((n, i) => ({
      id: uid(),
      columnId: columns[Math.min(i % 3, 2)]!.id,
      title: n.title ?? "Nova nota",
      content: n.content ?? "",
      color: n.color ?? "rose",
      author: n.author ?? "Walle Dev",
      updatedAt: n.updatedAt ?? minutes(60 + i * 30),
      tags: n.tags ?? [],
      subnotes: n.subnotes ?? [],
      checklist: n.checklist ?? [],
      images: n.images ?? [],
      priority: n.priority ?? null,
      deadline: n.deadline ?? null,
      archived: n.archived ?? false,
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
              subnotes: [
                { id: uid(), text: "Levantar bundles duplicados", color: "amber", status: "todo" },
                { id: uid(), text: "Validar com pricing", color: "sky", status: "doing" },
                { id: uid(), text: "Mapear onda 1", color: "lime", status: "done" },
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
