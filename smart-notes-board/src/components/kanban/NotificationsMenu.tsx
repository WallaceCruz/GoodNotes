import { Bell, BellOff, CalendarClock, Settings2 } from "lucide-react";
import { allComments } from "@/lib/board/comments";
import { CommentFeed } from "@/components/note/CommentFeed";
import { useEffect, useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { minutesBeforeLabel, useNotificationSettings } from "@/hooks/useNotificationSettings";
import type { Note } from "@/lib/board/model";
import { cn } from "@/lib/utils";
import { deadlineInfo } from "@/components/note/note-style";
import { NotificationSettingsDialog } from "./NotificationSettingsDialog";
import { DeadlineBadge, PriorityBadge } from "@/components/note/NoteMeta";

export function NotificationsMenu({
  notes,
  withInbox = false,
  onSelect,
}: {
  notes: Note[];
  /**
   * Traz os comentários do time para dentro do painel, numa aba.
   *
   * Serve ao celular, onde não há espaço para um painel de Inbox permanente. No
   * desktop o Inbox já ocupa a coluna da esquerda, e repeti-lo aqui seria dizer
   * a mesma coisa duas vezes na mesma tela.
   */
  withInbox?: boolean;
  onSelect: (id: string) => void;
}) {
  const { settings, update, reset } = useNotificationSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aba, setAba] = useState<"prazos" | "inbox">("prazos");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const alerts = useMemo(() => {
    if (!settings.enabled) return [];
    return notes
      .filter((n) => !n.archived && n.deadline)
      .filter((n) =>
        settings.onlyHighPriority ? n.priority === "urgent" || n.priority === "high" : true,
      )
      .map((n) => ({ note: n, info: deadlineInfo(n.deadline)! }))
      .filter((x) =>
        x.info.diff < 0 ? settings.notifyOverdue : x.info.diff <= settings.daysBefore,
      )
      .sort((a, b) => a.info.diff - b.info.diff);
  }, [notes, settings]);

  const imminent = useMemo(() => {
    if (!settings.enabled || !settings.timeReminders) return [];
    const windowMs = settings.minutesBefore * 60_000;
    return alerts
      .map((a) => ({ ...a, minutesLeft: Math.round((a.note.deadline! - now) / 60_000) }))
      .filter((a) => a.note.deadline! - now >= 0 && a.note.deadline! - now <= windowMs)
      .sort((a, b) => a.minutesLeft - b.minutesLeft);
  }, [alerts, now, settings]);

  const comentarios = useMemo(() => (withInbox ? allComments(notes) : []), [withInbox, notes]);

  const imminentIds = new Set(imminent.map((a) => a.note.id));
  const overdue = alerts.filter((a) => a.info.diff < 0);
  const upcoming = alerts.filter((a) => a.info.diff >= 0 && !imminentIds.has(a.note.id));

  const renderItem = ({ note }: { note: Note }) => (
    <button
      key={note.id}
      onClick={() => onSelect(note.id)}
      className="flex w-full flex-col items-start gap-1 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent"
    >
      <span className="line-clamp-1 text-sm font-medium">{note.title || "Sem título"}</span>
      <span className="flex flex-wrap items-center gap-1">
        {note.priority && <PriorityBadge priority={note.priority} />}
        {note.deadline && <DeadlineBadge deadline={note.deadline} />}
      </span>
    </button>
  );

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <button
            aria-label="Notificações de prazo"
            title="Notificações de prazo"
            className="relative rounded-md p-1.5 text-muted-foreground hover:bg-accent"
          >
            {settings.enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            {alerts.length > 0 && (
              <span
                className={cn(
                  "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold",
                  overdue.length
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-primary text-primary-foreground",
                )}
              >
                {alerts.length}
              </span>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            {/* O cabeçalho descreve a aba aberta: falar de prazos enquanto se
                lê comentários seria legenda de outra coisa. */}
            <div>
              <p className="text-sm font-semibold">
                {aba === "inbox" ? "Comentários do time" : "Lembretes de prazo"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {aba === "inbox"
                  ? "Toque num comentário para abrir a nota"
                  : settings.enabled
                    ? `Avisando ${settings.daysBefore} ${settings.daysBefore === 1 ? "dia" : "dias"} antes${
                        settings.timeReminders
                          ? ` · ${minutesBeforeLabel(settings.minutesBefore)} antes do horário`
                          : ""
                      }`
                    : "Lembretes desativados"}
              </p>
            </div>
            <button
              onClick={() => setSettingsOpen(true)}
              hidden={aba === "inbox"}
              aria-label="Configurações de lembretes"
              title="Configurações de lembretes"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </div>

          {withInbox && (
            <div className="flex gap-0.5 border-b border-border p-1">
              {(
                [
                  ["prazos", "Notificações", alerts.length],
                  ["inbox", "Inbox", comentarios.length],
                ] as const
              ).map(([id, rotulo, contagem]) => (
                <button
                  key={id}
                  onClick={() => setAba(id)}
                  aria-pressed={aba === id}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[12px] font-medium transition-colors",
                    aba === id
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {rotulo}
                  {contagem > 0 && (
                    <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums">
                      {contagem}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {withInbox && aba === "inbox" ? (
            <div className="scroll-thin max-h-80 overflow-y-auto">
              <CommentFeed
                entries={comentarios}
                compact
                emptyTitle="Nenhum comentário ainda"
                emptyHint="Abra uma nota e use o campo Comentários."
                onSelect={onSelect}
              />
            </div>
          ) : (
            <div className="scroll-thin max-h-80 overflow-y-auto p-1.5">
              {alerts.length === 0 && (
                <div className="flex flex-col items-center gap-1 px-3 py-8 text-center">
                  <CalendarClock className="h-6 w-6 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    {settings.enabled
                      ? "Nenhum prazo próximo."
                      : "Ative os lembretes nas configurações."}
                  </p>
                </div>
              )}

              {imminent.length > 0 && (
                <>
                  <p className="px-2 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wide text-primary">
                    Agora ({imminent.length})
                  </p>
                  {imminent.map((a) => (
                    <button
                      key={a.note.id}
                      onClick={() => onSelect(a.note.id)}
                      className="flex w-full flex-col items-start gap-1 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent"
                    >
                      <span className="line-clamp-1 text-sm font-medium">
                        {a.note.title || "Sem título"}
                      </span>
                      <span className="rounded-full border border-primary/50 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium">
                        Vence em {a.minutesLeft} min
                      </span>
                    </button>
                  ))}
                </>
              )}

              {overdue.length > 0 && (
                <>
                  <p className="px-2 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wide text-destructive">
                    Atrasadas ({overdue.length})
                  </p>
                  {overdue.map(renderItem)}
                </>
              )}

              {upcoming.length > 0 && (
                <>
                  <p className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Próximas ({upcoming.length})
                  </p>
                  {upcoming.map(renderItem)}
                </>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>

      <NotificationSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onChange={update}
        onReset={reset}
      />
    </>
  );
}
