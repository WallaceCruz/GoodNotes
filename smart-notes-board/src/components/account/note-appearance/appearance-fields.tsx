import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/** Escolha única entre poucas opções curtas, como tamanho ou tipografia. */
export function ChipGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs transition-colors",
            value === option.value
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground hover:bg-accent",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Campo de opção com rótulo em cima — o formato das colunas de ajustes. */
export function ChipField<T extends string>({
  label,
  ...chips
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <ChipGroup {...chips} />
    </div>
  );
}

/**
 * Cor opcional: `null` significa "herdar do tema", e por isso o botão de limpar
 * só aparece quando há uma cor escolhida para descartar.
 */
export function ColorField({
  label,
  hint,
  value,
  fallback,
  onChange,
}: {
  label: string;
  hint: string;
  value: string | null;
  /** Cor mostrada no seletor enquanto nenhuma foi escolhida. */
  fallback: string;
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={label}
          value={value ?? fallback}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
        />
        <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
          {value ?? hint}
        </span>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
          >
            limpar
          </button>
        )}
      </div>
    </div>
  );
}

/** Linha de liga/desliga com explicação — o formato das opções de comportamento. */
export function ToggleField({
  label,
  hint,
  checked,
  onChange,
  boxed = false,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Emoldurada, quando a opção não é mais uma da lista e sim um modo à parte. */
  boxed?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between",
        boxed
          ? "rounded-lg border border-border bg-muted/40 px-4 py-3"
          : "border-t border-border pt-4",
      )}
    >
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
