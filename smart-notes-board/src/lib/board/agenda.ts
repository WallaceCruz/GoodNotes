import { DAY_MS, startOfDay } from "@/lib/date";
import { isNoteDone } from "@/lib/board/status";
import { compareByUrgency } from "@/lib/board/triage";
import type { Column, Note } from "@/lib/board/model";

/**
 * A agenda: as notas organizadas como um app de tarefas as mostraria.
 *
 * Uma lista corrida de notas não responde a pergunta que se faz no celular —
 * "o que preciso fazer agora?". Agrupar por prazo responde: o que venceu, o
 * que é de hoje, o que dá para deixar. Concluídas vão para o fim, porque
 * servem de registro, não de tarefa.
 */

export type AgendaGroup = {
  key: string;
  label: string;
  notes: Note[];
  /** Grupos de atraso pedem destaque; o resto é informação neutra. */
  urgent?: boolean;
};

const BUCKETS = [
  { key: "atrasadas", label: "Atrasadas", urgent: true },
  { key: "hoje", label: "Hoje" },
  { key: "amanha", label: "Amanhã" },
  { key: "semana", label: "Próximos 7 dias" },
  { key: "depois", label: "Mais tarde" },
  { key: "sem-prazo", label: "Sem prazo" },
] as const;

type BucketKey = (typeof BUCKETS)[number]["key"];

/** Em qual faixa da agenda um prazo cai. */
function bucketOf(deadline: number | null, today: number): BucketKey {
  if (deadline === null) return "sem-prazo";

  const dia = startOfDay(deadline).getTime();
  const diff = Math.round((dia - today) / DAY_MS);

  if (diff < 0) return "atrasadas";
  if (diff === 0) return "hoje";
  if (diff === 1) return "amanha";
  if (diff <= 7) return "semana";
  return "depois";
}

/**
 * Agrupa as notas ativas por prazo e devolve só os grupos que têm conteúdo —
 * uma seção vazia na tela é ruído.
 */
export function agendaGroups(
  notes: Note[],
  columns: Column[],
  now: number = Date.now(),
): AgendaGroup[] {
  const today = startOfDay(now).getTime();
  const porFaixa = new Map<BucketKey, Note[]>();
  const concluidas: Note[] = [];

  for (const note of notes) {
    if (note.archived) continue;
    if (isNoteDone(note, columns)) {
      concluidas.push(note);
      continue;
    }
    const chave = bucketOf(note.deadline, today);
    porFaixa.set(chave, [...(porFaixa.get(chave) ?? []), note]);
  }

  const grupos: AgendaGroup[] = BUCKETS.flatMap((bucket) => {
    const lista = porFaixa.get(bucket.key);
    if (!lista?.length) return [];
    return [
      {
        key: bucket.key,
        label: bucket.label,
        notes: [...lista].sort(compareByUrgency),
        ...("urgent" in bucket ? { urgent: bucket.urgent } : {}),
      },
    ];
  });

  if (concluidas.length) {
    grupos.push({
      key: "concluidas",
      label: "Concluídas",
      notes: [...concluidas].sort((a, b) => b.updatedAt - a.updatedAt),
    });
  }
  return grupos;
}
