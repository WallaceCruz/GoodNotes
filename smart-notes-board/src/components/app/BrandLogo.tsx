import { cn } from "@/lib/utils";

/**
 * Marca do SaaS "Goodnotes".
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
          {/* Linhas escritas na nota */}
          <rect x="6.6" y="9.4" width="8.4" height="1.5" rx="0.75" className="fill-primary" />
          <rect x="6.6" y="12.5" width="8.4" height="1.5" rx="0.75" className="fill-primary" />
          <rect x="6.6" y="15.6" width="5.2" height="1.5" rx="0.75" className="fill-primary/55" />
        </svg>
      </span>
      {!compact && (
        <span className="min-w-0 select-none text-[15px] font-semibold leading-none tracking-tight text-foreground">
          Good<span className="text-primary">notes</span>
        </span>
      )}
    </div>
  );
}
