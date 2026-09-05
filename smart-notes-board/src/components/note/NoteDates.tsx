import { formatDate, formatDateTime, timeAgo } from "@/lib/date";
import { cn } from "@/lib/utils";

/**
 * Quando a nota nasceu e quando mudou pela última vez.
 *
 * A edição vem em tempo relativo, que é o que se quer saber de relance ("há 2
 * h"); a criação vem como data, que é o que se quer saber por extenso. As duas
 * datas completas ficam no título, para quem precisar do horário exato.
 */
export function NoteDates({
  createdAt,
  updatedAt,
  className,
}: {
  createdAt: number;
  updatedAt: number;
  className?: string;
}) {
  return (
    <span
      title={`Criada em ${formatDateTime(createdAt)}\nEditada em ${formatDateTime(updatedAt)}`}
      className={cn(
        "flex shrink-0 items-center gap-1 text-[10px] tabular-nums text-foreground/45",
        className,
      )}
    >
      <span>{formatDate(createdAt)}</span>
      <span aria-hidden>·</span>
      <span>editada {timeAgo(updatedAt)}</span>
    </span>
  );
}
