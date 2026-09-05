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
      author: n.author ?? "Produto",
      assignee: n.assignee ?? n.author ?? null,
      assignees: n.assignees ?? ((n.assignee ?? n.author) ? [(n.assignee ?? n.author)!] : []),
      updatedAt: n.updatedAt ?? minutes(60 + i * 30),
      tags: n.tags ?? [],
      checklist: n.checklist ?? [],
      comments: (n.comments ?? []).map((c) => ({ ...c, id: uid() })),
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
        name: "Exemplo",
        archived: false,
        files: [
          makeFile("Primeiros passos", [
            {
              title: "Arraste esta nota para outra coluna",
              content:
                "<p>As colunas do fluxo vão de <strong>Backlog</strong> a <strong>Concluído</strong>. Mover uma nota até Concluído já a marca como feita.</p>",
              color: "rose",
              tags: ["comece-aqui"],
              author: "Produto",
              updatedAt: minutes(12),
              priority: "urgent",
              deadline: days(2),
              checklist: [
                { id: uid(), text: "Arrastar uma nota entre colunas", done: true },
                { id: uid(), text: "Marcar um item da checklist", done: false },
              ],
              comments: [
                {
                  id: "",
                  author: "Design",
                  text: "O Inbox agora mostra só os comentários do time, não o texto das notas.",
                  createdAt: minutes(30),
                },
                {
                  id: "",
                  author: "Engenharia",
                  text: "Isso aqui é um comentário. Clique no ícone de mensagem no rodapé da nota para responder.",
                  createdAt: minutes(8),
                },
              ],
            },
            {
              title: "Escreva com formatação, imagens e tabelas",
              content:
                "<p>Clique numa nota para abrir o editor. Ele aceita títulos, listas, código, imagens e tabelas — digite <code>/</code> para ver os blocos.</p>",
              color: "amber",
              tags: ["editor"],
              author: "Design",
              updatedAt: minutes(48),
              priority: "high",
              comments: [
                {
                  id: "",
                  author: "Produto",
                  text: "Vale documentar os atalhos do editor num guia à parte.",
                  createdAt: minutes(95),
                },
              ],
            },
            {
              title: "Organize por etiquetas e prioridade",
              content:
                "<p>Etiquetas e prioridades alimentam os filtros do topo. Uma nota pode ter quantas etiquetas você quiser.</p>",
              color: "lime",
              tags: ["organização", "filtros"],
              author: "Produto",
              updatedAt: minutes(120),
              priority: "medium",
            },
            {
              title: "Veja o mesmo quadro como calendário ou linha do tempo",
              content:
                "<p>Notas com prazo aparecem no <strong>Calendário</strong> e na <strong>Linha do tempo</strong>, onde dá para arrastar a barra e mudar as datas.</p>",
              color: "violet",
              tags: ["visões"],
              author: "Produto",
              updatedAt: minutes(180),
              priority: "low",
              comments: [
                {
                  id: "",
                  author: "QA",
                  text: "Testei arrastar a barra na linha do tempo e as datas mudaram certinho.",
                  createdAt: minutes(150),
                },
              ],
            },
            {
              title: "No celular, o quadro vira um baralho de cartas",
              content:
                "<p>Em telas pequenas as notas viram um deck: deslize para percorrer a fila, ordenada por urgência.</p>",
              color: "sky",
              tags: ["mobile"],
              author: "Design",
              updatedAt: minutes(240),
            },
          ]),
          makeFile("Ideias", [
            {
              title: "Personalize a aparência das notas",
              content:
                "<p>Em Configurações dá para trocar estilo, cantos, sombra, borda e tipografia — por conta ou por projeto.</p>",
              color: "peach",
              tags: ["aparência"],
              author: "Design",
              updatedAt: minutes(300),
            },
            {
              title: "Tudo fica gravado no seu navegador",
              content:
                "<p>Não há servidor nem conta: o quadro vive no armazenamento local desta máquina.</p>",
              color: "amber",
              tags: ["dados"],
              author: "Engenharia",
              updatedAt: minutes(420),
            },
          ]),
        ],
      },
    ],
  };
}
