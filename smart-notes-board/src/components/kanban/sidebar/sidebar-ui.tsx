import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Classes e peças repetidas pelas seções da barra lateral. Ficam num só lugar
 * para que projetos, arquivos e times não se desalinhem quando uma delas muda.
 */

export const ICON = "h-[18px] w-[18px] shrink-0";

export const ROW =
  "group flex min-h-9 w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors";

/** Botão de ação que só aparece quando o mouse passa pela linha. */
export const ACTION =
  "flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-sidebar-accent hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100";

/** Nomes longos são truncados na barra; o tooltip mostra o nome inteiro. */
export function NameTooltip({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <Tooltip delayDuration={400}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" className="max-w-64 break-words">
        {name || "Sem nome"}
      </TooltipContent>
    </Tooltip>
  );
}
