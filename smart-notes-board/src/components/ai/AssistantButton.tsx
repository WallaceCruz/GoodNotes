import { useState } from "react";
import { AssistantPanel } from "./AssistantPanel";
import type { AiScope } from "@/lib/ai/context";
import { cn } from "@/lib/utils";

/**
 * O botão que abre o assistente.
 *
 * Fica flutuando sobre o conteúdo porque a ajuda é pedida no meio do trabalho,
 * não a partir de um menu: quem está escrevendo uma nota não vai procurar o
 * assistente numa aba.
 */
export function AssistantButton({ scope, className }: { scope: AiScope; className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir assistente"
        className={cn(
          "flex items-center gap-2 rounded-full border border-border bg-popover/95 py-1.5 pl-2 pr-3.5 text-[13px] font-medium shadow-lg backdrop-blur transition hover:shadow-xl active:scale-95",
          className,
        )}
      >
        {/* O anel é desenhado com gradiente cônico: um círculo colorido com o
            miolo vazado, sem depender de imagem. */}
        <span
          aria-hidden
          className="h-5 w-5 shrink-0 rounded-full"
          style={{
            background: "conic-gradient(from 210deg, #2563eb, #7c3aed, #db2777, #f59e0b, #2563eb)",
            mask: "radial-gradient(circle, transparent 42%, black 44%)",
            WebkitMask: "radial-gradient(circle, transparent 42%, black 44%)",
          }}
        />
        Assistente
      </button>

      {open && <AssistantPanel scope={scope} onClose={() => setOpen(false)} />}
    </>
  );
}
