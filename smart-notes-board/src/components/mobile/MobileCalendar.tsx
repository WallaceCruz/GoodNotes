import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { byDeadline, calendarDays, notesByDay } from "@/lib/board/calendar";
import { isNoteDone } from "@/lib/board/status";
import { matchesFilters, type Filters } from "@/lib/board/filters";
import { boardActions } from "@/stores/board";
import { toastUndo } from "@/lib/toast";
import { dayKey, formatTime } from "@/lib/date";
import { WEEKDAYS } from "@/components/kanban/calendar/calendar-ui";
import { noteBg } from "@/components/note/note-style";
import { cn } from "@/lib/utils";
import type { Column, Note } from "@/lib/board/model";

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/**
 * O calendário no celular.
 *
 * A grade do desktop tem faixas de hora e arrastar entre dias — nada disso
 * cabe no polegar. Aqui o mês é só um seletor: pontos indicam onde há prazo, e
 * o dia escolhido abre a lista embaixo, no mesmo formato de tarefa do resto do
 * app.
 */
export function MobileCalendar({
  notes,
  columns,
  filters,
  onOpenNote,
}: {
  notes: Note[];
  columns: Column[];
  /** Mesmos filtros do cabeçalho: aplicá-los aqui evita que o ponto no dia
      prometa uma nota que a lista de baixo não mostra. */
  filters: Filters;
  onOpenNote: (id: string) => void;
}) {
  const hoje = dayKey(new Date());
  const [cursor, setCursor] = useState(() => new Date());
  const [selecionado, setSelecionado] = useState(hoje);

  const ativas = useMemo(
    () => notes.filter((note) => !note.archived && matchesFilters(note, filters)),
    [notes, filters],
  );
  const porDia = useMemo(() => notesByDay(ativas), [ativas]);
  const dias = useMemo(() => calendarDays("month", selecionado, cursor), [selecionado, cursor]);

  const doDia = useMemo(
    () => [...(porDia.get(selecionado) ?? [])].sort(byDeadline),
    [porDia, selecionado],
  );

  const mudarMes = (delta: number) =>
    setCursor((atual) => new Date(atual.getFullYear(), atual.getMonth() + delta, 1));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-1 px-4 pb-2">
        <h2 className="flex-1 text-sm font-semibold">
          {/* Só o mês recebe maiúscula: `capitalize` no CSS pegaria o "de" também. */}
          <span className="capitalize">{MESES[cursor.getMonth()]}</span> de {cursor.getFullYear()}
        </h2>
        <button
          onClick={() => {
            setCursor(new Date());
            setSelecionado(hoje);
          }}
          className="rounded-full px-3 py-1 text-xs text-muted-foreground"
        >
          Hoje
        </button>
        <button
          onClick={() => mudarMes(-1)}
          aria-label="Mês anterior"
          className="rounded-full p-2 text-muted-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => mudarMes(1)}
          aria-label="Próximo mês"
          className="rounded-full p-2 text-muted-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="shrink-0 px-2">
        <div className="grid grid-cols-7">
          {WEEKDAYS.map((dia) => (
            <span key={dia} className="py-1 text-center text-[10px] text-muted-foreground">
              {dia}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {dias.map((dia) => {
            const chave = dayKey(dia);
            const doMes = dia.getMonth() === cursor.getMonth();
            const quantidade = porDia.get(chave)?.length ?? 0;
            return (
              <button
                key={chave}
                onClick={() => setSelecionado(chave)}
                aria-label={`${dia.getDate()} — ${quantidade} nota(s)`}
                aria-pressed={selecionado === chave}
                className="flex flex-col items-center gap-0.5 py-1.5"
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-[13px] tabular-nums transition",
                    !doMes && "text-muted-foreground/40",
                    chave === hoje && selecionado !== chave && "font-bold text-primary",
                    selecionado === chave && "bg-primary font-semibold text-primary-foreground",
                  )}
                >
                  {dia.getDate()}
                </span>
                {/* Ponto discreto: diz que o dia tem prazo sem competir com o número. */}
                <span
                  className={cn(
                    "h-1 w-1 rounded-full",
                    quantidade > 0 && selecionado !== chave ? "bg-primary" : "bg-transparent",
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="scroll-thin mt-1 min-h-0 flex-1 overflow-y-auto border-t border-border pb-36">
        {doDia.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            Nenhuma nota com prazo neste dia.
          </p>
        ) : (
          <ul>
            {doDia.map((note) => {
              const done = isNoteDone(note, columns);
              return (
                <li key={note.id} className="flex items-stretch gap-3 px-4">
                  <button
                    onClick={() => {
                      boardActions.setNoteDone(note.id, !done);
                      if (!done) {
                        toastUndo(`"${note.title || "Nota"}" concluída`, () =>
                          boardActions.setNoteDone(note.id, false),
                        );
                      }
                    }}
                    aria-label={done ? `Reabrir ${note.title}` : `Concluir ${note.title}`}
                    className="flex shrink-0 items-center py-3"
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full border-2 transition",
                        done
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-foreground/25",
                      )}
                    >
                      {done && <Check className="h-3.5 w-3.5" />}
                    </span>
                  </button>

                  <button
                    onClick={() => onOpenNote(note.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 border-b border-border/70 py-3 text-left"
                  >
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-[15px] leading-snug",
                          done && "text-muted-foreground line-through",
                        )}
                      >
                        {note.title || "Sem título"}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className={cn("h-2 w-2 shrink-0 rounded-full", noteBg[note.color])} />
                        {note.deadline && (
                          <span className="tabular-nums">{formatTime(note.deadline)}</span>
                        )}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
