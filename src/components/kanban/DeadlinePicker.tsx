import { CalendarClock, Clock, X } from "lucide-react";
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

const DEFAULT_TIME = { h: 23, m: 59 };

function withTime(date: Date, h: number, m: number) {
  const x = new Date(date);
  x.setHours(h, m, 0, 0);
  return x.getTime();
}

function timeOf(value: number | null) {
  if (!value) return DEFAULT_TIME;
  const d = new Date(value);
  return { h: d.getHours(), m: d.getMinutes() };
}

function toTimeInput(value: number | null) {
  const { h, m } = timeOf(value);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
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
  const { h, m } = timeOf(value);

  const setTime = (raw: string) => {
    const [hh, mm] = raw.split(":").map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return;
    onChange(withTime(value ? new Date(value) : new Date(), hh!, mm!));
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
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
                  onChange(withTime(d, h, m));
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
              onChange(d ? withTime(d, h, m) : null);
              setOpen(false);
            }}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="time"
          aria-label="Horário do prazo"
          value={toTimeInput(value)}
          onChange={(e) => setTime(e.target.value)}
          className="w-[4.5rem] bg-transparent text-xs outline-none"
        />
      </div>

      {value && (
        <>
          <button
            aria-label="Remover prazo"
            onClick={() => onChange(null)}
            className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-accent"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  );
}
