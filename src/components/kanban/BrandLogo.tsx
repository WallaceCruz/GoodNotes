import { cn } from "@/lib/utils";

/**
 * Marca do SaaS "Lembrei!".
 * `compact` renderiza apenas o glifo (para a sidebar recolhida).
 */
export function BrandLogo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        aria-hidden
        className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-primary text-primary-foreground shadow-sm"
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
          {/* Nota autoadesiva com canto dobrado */}
          <path
            d="M5.5 4.5h9.2c.4 0 .8.16 1.06.44l3.3 3.36c.27.27.42.63.42 1v7.7c0 1.1-.9 2-2 2H5.5c-1.1 0-2-.9-2-2V6.5c0-1.1.9-2 2-2Z"
            className="fill-primary-foreground/90"
          />
          <path
            d="M14.7 4.52v3.28c0 .5.4.9.9.9h3.28"
            className="stroke-primary/25"
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
          {/* ponto de exclamação */}
          <rect x="11.05" y="6.6" width="1.7" height="5.6" rx="0.85" className="fill-primary" />
          <circle cx="11.9" cy="14.4" r="1" className="fill-primary" />
        </svg>
      </span>
      {!compact && (
        <span className="min-w-0 select-none text-[15px] font-semibold leading-none tracking-tight text-foreground">
          Lembrei
          <span className="text-primary">!</span>
        </span>
      )}
    </div>
  );
}
