/**
 * Geração de identificadores locais.
 *
 * Existia uma cópia disto em `board-types`, outra em `useTeams` e uma terceira
 * embutida em `useWorkspaces` — três formatos ligeiramente diferentes para a
 * mesma necessidade. Uma função só mantém o formato previsível em todo o app.
 */
export function uid(prefix?: string): string {
  const value = Math.random().toString(36).slice(2, 10);
  return prefix ? `${prefix}_${value}` : value;
}
