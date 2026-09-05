import { useState } from "react";
import { ExternalLink, Eye, EyeOff, ShieldAlert, Trash2 } from "lucide-react";
import { AI_MODELS, useAiSettings } from "@/lib/ai/settings";
import { cn } from "@/lib/utils";

/**
 * Onde a chave da API é configurada.
 *
 * O aviso sobre onde a chave fica não é letra miúda escondida: quem coloca uma
 * credencial num app precisa saber onde ela vai parar antes de colar, não
 * depois.
 */
export function AssistantSettings({ onDone }: { onDone: () => void }) {
  const { settings, update, clearKey, configured } = useAiSettings();
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <label htmlFor="ai-key" className="text-[13px] font-semibold">
          Chave da API da Anthropic
        </label>
        <div className="mt-1.5 flex items-center gap-1.5">
          <input
            id="ai-key"
            type={visible ? "text" : "password"}
            value={settings.apiKey}
            onChange={(event) => update({ apiKey: event.target.value })}
            placeholder="sk-ant-..."
            spellCheck={false}
            autoComplete="off"
            className="min-w-0 flex-1 rounded-md border border-border bg-background px-2.5 py-2 font-mono text-[12px] outline-none focus:border-primary"
          />
          <button
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ocultar chave" : "Mostrar chave"}
            className="shrink-0 rounded-md p-2 text-muted-foreground hover:bg-accent"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          {configured && (
            <button
              onClick={clearKey}
              aria-label="Remover chave"
              title="Remover chave"
              className="shrink-0 rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        <a
          href="https://console.anthropic.com/settings/keys"
          target="_blank"
          rel="noreferrer noopener"
          className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
        >
          Criar uma chave no console da Anthropic
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
        <p className="text-[11px] leading-relaxed text-foreground/80">
          A chave fica <strong>neste navegador</strong>, porque o Goodnotes não tem servidor. Ela é
          enviada apenas para a API da Anthropic — mas qualquer extensão ou script que rode nesta
          página consegue lê-la. Use uma chave com limite de gasto e remova-a se este computador for
          compartilhado.
        </p>
      </div>

      <div>
        <p className="text-[13px] font-semibold">Modelo</p>
        <div className="mt-1.5 flex flex-col gap-1">
          {AI_MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => update({ model: model.id })}
              className={cn(
                "rounded-lg border px-3 py-2 text-left transition-colors",
                settings.model === model.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-accent",
              )}
            >
              <span className="block text-[13px] font-medium">{model.label}</span>
              <span className="block text-[11px] text-muted-foreground">{model.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onDone}
        disabled={!configured}
        className="rounded-lg bg-primary px-4 py-2.5 text-[13px] font-medium text-primary-foreground disabled:opacity-50"
      >
        {configured ? "Começar a conversar" : "Cole uma chave para continuar"}
      </button>
    </div>
  );
}
