import { BellRing, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  MINUTES_BEFORE_OPTIONS,
  minutesBeforeLabel,
  type NotificationSettings,
} from "@/hooks/useNotificationSettings";
import { cn } from "@/lib/utils";

function Row({
  title,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-[11px] leading-snug text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}

export function NotificationSettingsDialog({
  open,
  onOpenChange,
  settings,
  onChange,
  onReset,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  settings: NotificationSettings;
  onChange: (patch: Partial<NotificationSettings>) => void;
  onReset: () => void;
}) {
  const off = !settings.enabled;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-primary" />
            Configurações de lembretes
          </DialogTitle>
          <DialogDescription>
            Escolha como e quando você quer ser avisado sobre os prazos das notas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Row
            title="Lembretes de prazo"
            description="Ativa todos os avisos de deadline das notas."
            checked={settings.enabled}
            onCheckedChange={(v) => onChange({ enabled: v })}
          />

          <div className="rounded-lg border border-border px-3 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Avisar com antecedência</p>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">
                {settings.daysBefore} {settings.daysBefore === 1 ? "dia" : "dias"}
              </span>
            </div>
            <p className="mb-3 text-[11px] text-muted-foreground">
              Notas com prazo dentro desse período aparecem no sino de notificações.
            </p>
            <Slider
              value={[settings.daysBefore]}
              min={1}
              max={14}
              step={1}
              disabled={off}
              onValueChange={(v) => onChange({ daysBefore: v[0] ?? 1 })}
            />
          </div>

          <Row
            title="Lembretes por horário"
            description="Avisa também no horário exato do prazo, não só no dia."
            checked={settings.timeReminders}
            onCheckedChange={(v) => onChange({ timeReminders: v })}
            disabled={off}
          />

          <div className="rounded-lg border border-border px-3 py-3">
            <p className="text-sm font-medium">Avisar antes do horário</p>
            <p className="mb-2 text-[11px] text-muted-foreground">
              Quantos minutos antes do horário do prazo você quer ser avisado.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {MINUTES_BEFORE_OPTIONS.map((m) => (
                <button
                  key={m}
                  disabled={off || !settings.timeReminders}
                  onClick={() => onChange({ minutesBefore: m })}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] transition-colors disabled:opacity-50",
                    settings.minutesBefore === m
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:bg-accent",
                  )}
                >
                  {minutesBeforeLabel(m)}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border px-3 py-3">
            <p className="text-sm font-medium">Canais de notificação</p>
            <p className="mb-2 text-[11px] text-muted-foreground">
              Escolha onde você quer receber os lembretes.
            </p>
            <div className="space-y-2">
              <label className="flex items-center justify-between gap-4 text-sm">
                <span className="text-[13px]">Notificação no app</span>
                <Switch
                  checked={settings.channelApp}
                  disabled={off}
                  onCheckedChange={(v) => onChange({ channelApp: v })}
                />
              </label>
              <label className="flex items-center justify-between gap-4 text-sm">
                <span className="text-[13px]">E-mail</span>
                <Switch
                  checked={settings.channelEmail}
                  disabled={off}
                  onCheckedChange={(v) => onChange({ channelEmail: v })}
                />
              </label>
              {settings.channelEmail && (
                <input
                  type="email"
                  value={settings.emailAddress}
                  disabled={off}
                  onChange={(e) => onChange({ emailAddress: e.target.value })}
                  placeholder="seu@email.com"
                  className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring/40"
                />
              )}
            </div>
          </div>

          <Row
            title="Avisar notas atrasadas"
            description="Mantém no topo as notas cujo prazo já venceu."
            checked={settings.notifyOverdue}
            onCheckedChange={(v) => onChange({ notifyOverdue: v })}
            disabled={off}
          />
          <Row
            title="Somente prioridade alta"
            description="Recebe lembretes apenas de notas urgentes ou de alta prioridade."
            checked={settings.onlyHighPriority}
            onCheckedChange={(v) => onChange({ onlyHighPriority: v })}
            disabled={off}
          />
        </div>

        <DialogFooter className="sm:justify-between">
          <button
            onClick={() => {
              onReset();
              toast.success("Configurações restauradas");
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar padrão
          </button>
          <button
            onClick={() => {
              onOpenChange(false);
              toast.success("Preferências de lembrete salvas");
            }}
            className="rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Concluído
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
