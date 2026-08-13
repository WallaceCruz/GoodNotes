import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AccountLayout } from "@/components/account/AccountLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  MINUTES_BEFORE_OPTIONS,
  minutesBeforeLabel,
  useNotificationSettings,
} from "@/hooks/useNotificationSettings";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações - Sticky Flow" },
      {
        name: "description",
        content:
          "Ajuste lembretes de prazo, notificações e preferências do seu quadro de notas no Sticky Flow.",
      },
      { property: "og:title", content: "Configurações - Sticky Flow" },
      {
        property: "og:description",
        content: "Preferências de notificações e lembretes do Sticky Flow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConfiguracoesPage,
});

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-border py-4 last:border-0">
      <div className="min-w-0">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function ConfiguracoesPage() {
  const { settings, update, reset } = useNotificationSettings();

  return (
    <AccountLayout title="Configurações" description="Notificações, lembretes e preferências.">
      <section className="rounded-lg border border-border bg-background px-6 py-2">
        <Row label="Notificações" hint="Ativar avisos de prazos e lembretes.">
          <Switch
            checked={settings.enabled}
            onCheckedChange={(v) => update({ enabled: v })}
          />
        </Row>
        <Row label="Avisar com antecedência" hint="Quantos dias antes do prazo avisar.">
          <Select
            value={String(settings.daysBefore)}
            onValueChange={(v) => update({ daysBefore: Number(v) })}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 5, 7].map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {d} {d === 1 ? "dia" : "dias"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
        <Row label="Lembretes por horário" hint="Avisos para prazos com hora definida.">
          <Switch
            checked={settings.timeReminders}
            onCheckedChange={(v) => update({ timeReminders: v })}
          />
        </Row>
        <Row label="Minutos antes" hint="Antecedência do lembrete por horário.">
          <Select
            value={String(settings.minutesBefore)}
            onValueChange={(v) => update({ minutesBefore: Number(v) })}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MINUTES_BEFORE_OPTIONS.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {minutesBeforeLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
        <Row label="Notas atrasadas" hint="Destacar notas com prazo vencido.">
          <Switch
            checked={settings.notifyOverdue}
            onCheckedChange={(v) => update({ notifyOverdue: v })}
          />
        </Row>
        <Row label="Mostrar toasts" hint="Exibir avisos flutuantes na tela.">
          <Switch
            checked={settings.showToasts}
            onCheckedChange={(v) => update({ showToasts: v })}
          />
        </Row>
        <Row label="Somente alta prioridade" hint="Notificar apenas urgente e alta.">
          <Switch
            checked={settings.onlyHighPriority}
            onCheckedChange={(v) => update({ onlyHighPriority: v })}
          />
        </Row>
        <Row label="Modo silencioso" hint="Pausar temporariamente todas as notificações.">
          <Switch
            checked={settings.quietMode}
            onCheckedChange={(v) => update({ quietMode: v })}
          />
        </Row>
      </section>

      <div className="flex items-center justify-end gap-3">
        <span className="mr-auto text-xs text-muted-foreground">
          Preferências salvas automaticamente neste navegador.
        </span>
        <Button
          variant="outline"
          onClick={() => {
            reset();
            toast("Preferências restauradas");
          }}
        >
          Restaurar padrões
        </Button>
        <Button onClick={() => toast.success("Configurações salvas")}>Salvar agora</Button>
      </div>
    </AccountLayout>
  );
}
