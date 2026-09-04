import { Search, X } from "lucide-react";

/**
 * Busca e criação no mesmo campo. O Enter faz o que estiver à mão: cria a tag
 * que não existe, ou marca a primeira da lista.
 */
export function TagSearchField({
  query,
  onChangeQuery,
  onSubmit,
}: {
  query: string;
  onChangeQuery: (query: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
      <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <input
        autoFocus
        value={query}
        onChange={(event) => onChangeQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit();
          }
          // Esc limpa a busca antes de fechar o painel: um Esc, uma etapa.
          if (event.key === "Escape" && query) {
            event.preventDefault();
            onChangeQuery("");
          }
        }}
        placeholder="Buscar ou criar tag…"
        aria-label="Buscar ou criar tag"
        className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
      />
      {query && (
        <button
          aria-label="Limpar busca"
          onClick={() => onChangeQuery("")}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
