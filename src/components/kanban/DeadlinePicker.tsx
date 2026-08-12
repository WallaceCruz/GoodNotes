import { CalendarClock, X } from "lucide-react";
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { deadlineInfo } from "./note-style";

const QUICK = [
  { label: "Hoje", days: 0 },
  { label: "Amanhã", days: 1 },
  { label: "Em 7 dias", days: 7 },
];

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 0);
  return x.getTime();
}

export function DeadlinePicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (ts: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const info = deadlineInfo(value);

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "inline-flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs hover:bg-accent",
              info && info.diff < 0 && "border-destructive/50 text-destructive",
            )}
          >
            <CalendarClock className="h-3.5 w-3.5" />
            {info ? `${info.date} · ${info.label}` : "Definir prazo"}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-2">
          <div className="mb-2 flex flex-wrap gap-1">
            {QUICK.map((q) => (
              <button
                key={q.label}
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + q.days);
                  onChange(endOfDay(d));
                  setOpen(false);
                }}
                className="rounded-full border border-border px-2 py-0.5 text-[11px] hover:bg-accent"
              >
                {q.label}
              </button>
            ))}
          </div>
          <Calendar
            mode="single"
            selected={value ? new Date(value) : undefined}
            onSelect={(d) => {
              onChange(d ? endOfDay(d) : null);
              setOpen(false);
            }}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      {value && (
        <button
          aria-label="Remover prazo"
          onClick={() => onChange(null)}
          className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-accent"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
