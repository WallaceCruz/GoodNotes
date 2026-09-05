import { cn } from "@/lib/utils";

/**
 * O símbolo do Claude.
 *
 * É um desenho próprio do glifo de raios, não o arquivo de marca da Anthropic.
 * Serve para identificar de onde vem a resposta; para material de divulgação,
 * baixe o asset oficial em anthropic.com/brand e substitua este componente.
 */
export function ClaudeMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("shrink-0", className)} fill="currentColor">
      {/* Onze raios saindo do centro, o traço característico da marca. */}
      {Array.from({ length: 11 }, (_, i) => {
        const angulo = (i * 360) / 11;
        return (
          <rect
            key={i}
            x="11.1"
            y="1.6"
            width="1.8"
            height="8.2"
            rx="0.9"
            transform={`rotate(${angulo} 12 12)`}
          />
        );
      })}
    </svg>
  );
}

/** O anel colorido do botão, com o símbolo dentro. */
export function ClaudeBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full", className)}
      style={{
        background: "conic-gradient(from 210deg, #d97757, #cc785c, #b8563f, #d97757)",
      }}
    >
      <ClaudeMark className="h-3.5 w-3.5 text-white" />
    </span>
  );
}
