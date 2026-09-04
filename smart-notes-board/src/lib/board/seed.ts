import { uid } from "@/lib/id";
import { type BoardFile, type BoardState, type Note } from "@/lib/board/model";
import { nativeColumns } from "@/lib/board/native-columns";
import { collectTags } from "@/lib/board/tags";

/**
 * Quadro de exemplo do primeiro acesso. Fica separado dos tipos porque é dado,
 * não contrato: mudar o conteúdo daqui não deve tocar em nada que o app importa.
 */

const minutes = (m: number) => Date.now() - m * 60_000;
const days = (d: number) => Date.now() + d * 86_400_000;

const defaultColumns = () => nativeColumns();

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
      title: n.title ?? "Nova nota",
      content: n.content ?? "",
      color: n.color ?? "rose",
      author: n.author ?? "Walle Dev",
      assignee: n.assignee ?? n.author ?? null,
      assignees: n.assignees ?? ((n.assignee ?? n.author) ? [(n.assignee ?? n.author)!] : []),
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
