export type NoteColor = "rose" | "amber" | "lime" | "sky" | "violet" | "peach";

export const NOTE_COLORS: NoteColor[] = ["rose", "amber", "lime", "sky", "violet", "peach"];

export type SubNote = {
  id: string;
  text: string;
  color: NoteColor;
};

export type Note = {
  id: string;
  columnId: string;
  title: string;
  content: string;
  color: NoteColor;
  author: string;
  updatedAt: number;
  subnotes: SubNote[];
};

export type Column = {
  id: string;
  title: string;
};

export type BoardFile = {
  id: string;
  name: string;
  columns: Column[];
  notes: Note[];
};

export type Project = {
  id: string;
  name: string;
  files: BoardFile[];
};

export type BoardState = {
  projects: Project[];
};

export const uid = () => Math.random().toString(36).slice(2, 10);

const minutes = (m: number) => Date.now() - m * 60_000;

const defaultColumns = (): Column[] => [
  { id: uid(), title: "Backlog" },
  { id: uid(), title: "Fazendo" },
  { id: uid(), title: "Feito" },
];

function makeFile(name: string, seed: Array<Partial<Note>>): BoardFile {
  const columns = defaultColumns();
  return {
    id: uid(),
    name,
    columns,
    notes: seed.map((n, i) => ({
      id: uid(),
      columnId: columns[Math.min(i % 3, 2)].id,
      title: n.title ?? "Nova nota",
      content: n.content ?? "",
      color: n.color ?? "rose",
      author: n.author ?? "Walle Dev",
      updatedAt: n.updatedAt ?? minutes(60 + i * 30),
      subnotes: n.subnotes ?? [],
    })),
  };
}

export function createInitialState(): BoardState {
  return {
    projects: [
      {
        id: uid(),
        name: "Checkout",
        files: [
          makeFile("Checkout do Usuário", [
            {
              title: "PTI8708 - Revisão de Bundles 2026 - Onda 1",
              content:
                "<p>Revisar os bundles priorizados para a primeira onda de 2026 e alinhar com o time de pricing.</p>",
              color: "rose",
              author: "Walle Dev",
              updatedAt: minutes(12),
              subnotes: [
                { id: uid(), text: "Levantar bundles duplicados", color: "amber" },
                { id: uid(), text: "Validar com pricing", color: "sky" },
              ],
            },
            {
              title: "Allan sugeriu reorganizar os requisitos do checkout offline",
              content:
                "<p>Detectei duplicidade entre dois requisitos funcionais e uma regra de negócio.</p>",
              color: "amber",
              author: "Agente Allan",
              updatedAt: minutes(48),
            },
            {
              title: "Marina comentou no épico de Onboarding Mobile",
              content:
                "<p>Precisamos incluir Jurídico como dependência antes de fechar esse escopo.</p>",
              color: "lime",
              author: "Marina Costa",
              updatedAt: minutes(120),
            },
            {
              title: "Angelina respondeu sobre a User Story de recuperação de senha",
              content:
                "<p>Revisei os critérios de aceitação e faltam cenários para tentativa expirada e link reutilizado.</p>",
              color: "violet",
              author: "Agente Angelina",
              updatedAt: minutes(180),
            },
            {
              title: "Bruno encontrou lacunas nos casos de teste",
              content:
                "<p>Os cenários de falha do login social ainda não foram refletidos nos casos de teste vinculados.</p>",
              color: "sky",
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
              author: "Paula Mendes",
              updatedAt: minutes(300),
            },
            {
              title: "Thiago pediu ajuste na iniciativa Expansão Mobile 2026",
              content:
                "<p>Vamos quebrar esse bloco em dois épicos menores: onboarding e pagamentos.</p>",
              color: "amber",
              author: "Thiago Ghisi",
              updatedAt: minutes(420),
            },
          ]),
        ],
      },
    ],
  };
}
