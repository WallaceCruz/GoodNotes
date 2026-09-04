import { RichNoteEditor } from "@/components/editor/RichNoteEditor";

/**
 * Texto depois do checklist. O corpo da nota fica acima da lista, então sem isto
 * não havia onde escrever conclusões e próximos passos: só restava misturá-los
 * com o texto de cima ou criar itens de checklist que não são tarefas.
 */
export function BelowChecklistNote({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (html: string) => void;
  compact?: boolean;
}) {
  return (
    <div className="mt-2 border-t border-foreground/10 pt-1.5">
      <RichNoteEditor content={value} onChange={onChange} minHeight="min-h-8" compact={compact} />
    </div>
  );
}
