import { useState } from "react";
import { ExternalLink, Eye, EyeOff, Loader2, RefreshCw, ShieldAlert, Trash2 } from "lucide-react";
import { describeError, listModels } from "@/lib/ai/assistant";
import { PROVIDERS, providerInfo } from "@/lib/ai/providers";
import { useAiSettings } from "@/lib/ai/settings";
import { cn } from "@/lib/utils";

/**
 * Onde as chaves e os modelos são configurados.
 *
 * Uma chave por provedor, guardadas juntas: quem configurou os três troca entre
 * eles sem colar nada de novo. O aviso sobre onde elas ficam não é letra miúda
 * escondida — quem coloca uma credencial num app precisa saber onde ela vai
 * parar antes de colar, não depois.
 */
export function AssistantSettings({ onDone }: { onDone: () => void }) {
  const { settings, apiKey, model, setProvider, setKey, setModel, configured } = useAiSettings();
  const [visible, setVisible] = useState(false);
  const [catalogo, setCatalogo] = useState<string[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const provedor = providerInfo(settings.provider);
  // Enquanto o catálogo real não chega, as sugestões seguram a escolha.
  const modelos = catalogo ?? provedor.fallbackModels;

  const buscarModelos = async () => {
    setBuscando(true);
    setErro(null);
    try {
      setCatalogo(await listModels(settings.provider, apiKey));
    } catch (e) {
      setErro(describeError(e));
      setCatalogo(null);
    } finally {
      setBuscando(false);
    }
  };

  const trocarProvedor = (id: (typeof PROVIDERS)[number]["id"]) => {
    setProvider(id);
    setCatalogo(null);
    setErro(null);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <p className="text-[13px] font-semibold">Provedor</p>
        <div className="mt-1.5 flex gap-1">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => trocarProvedor(p.id)}
              className={cn(
                "flex-1 rounded-lg border px-2 py-2 text-center transition-colors",
                settings.provider === p.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-accent",
              )}
            >
              <span className="block text-[13px] font-medium">{p.label}</span>
              <span className="block text-[10px] text-muted-foreground">
                {settings.keys[p.id].trim() ? "configurado" : "sem chave"}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="ai-key" className="text-[13px] font-semibold">
          Chave da API — {provedor.label}
        </label>
        <div className="mt-1.5 flex items-center gap-1.5">
          <input
            id="ai-key"
            type={visible ? "text" : "password"}
            value={apiKey}
            onChange={(event) => setKey(settings.provider, event.target.value)}
            placeholder={provedor.keyPlaceholder}
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
              onClick={() => setKey(settings.provider, "")}
              aria-label="Remover chave"
              title="Remover chave"
              className="shrink-0 rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        <a
          href={provedor.keysUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
        >
          Criar uma chave no {provedor.keysLabel}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <div className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
        <p className="text-[11px] leading-relaxed text-foreground/80">
          As chaves ficam <strong>neste navegador</strong>, porque o Goodnotes não tem servidor.
          Cada uma é enviada apenas para o provedor dela — mas qualquer extensão ou script que rode
          nesta página consegue lê-las. Use chaves com limite de gasto e remova-as se este
          computador for compartilhado.
        </p>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <p className="flex-1 text-[13px] font-semibold">Modelo</p>
          <button
            onClick={() => void buscarModelos()}
            disabled={!configured || buscando}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent disabled:opacity-40"
          >
            {buscando ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            {catalogo ? "Atualizar lista" : "Buscar modelos"}
          </button>
        </div>

        {/* Os nomes de modelo mudam com frequência: a lista real vem da conta
            de quem usa, e o campo aceita um id digitado para quem tem acesso a
            algo que ainda não aparece. */}
        <select
          value={modelos.includes(model) ? model : ""}
          onChange={(event) => setModel(settings.provider, event.target.value)}
          aria-label="Modelo"
          className="mt-1.5 w-full rounded-md border border-border bg-background px-2.5 py-2 text-[12px] outline-none focus:border-primary"
        >
          {!modelos.includes(model) && <option value="">{model} (digitado)</option>}
          {modelos.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>

        <input
          value={model}
          onChange={(event) => setModel(settings.provider, event.target.value)}
          placeholder="ou digite o id do modelo"
          spellCheck={false}
          aria-label="Id do modelo"
          className="mt-1.5 w-full rounded-md border border-border bg-background px-2.5 py-1.5 font-mono text-[11px] outline-none focus:border-primary"
        />

        {erro && <p className="mt-1.5 text-[11px] text-destructive">{erro}</p>}
        {!catalogo && !erro && (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            A lista acima é uma sugestão. Busque os modelos para ver o que sua chave alcança.
          </p>
        )}
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
