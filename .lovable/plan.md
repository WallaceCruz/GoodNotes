# Visualização Linha do Tempo (Timeline / Gantt)

Nova visualização ao lado de Kanban e Calendário, mostrando as notas como barras em uma linha do tempo horizontal.

## Como o usuário usa

- Na sidebar, novo item "Linha do tempo" (ícone de barras), junto de Home, Calendário e Arquivados. Alternar entre as visualizações mantém projeto/arquivo e filtros ativos.
- Escala selecionável: Dia, Semana, Mês (padrão Semana). Botões "Hoje", anterior/próximo e zoom simples.
- Cada nota com prazo vira uma barra: início = data de início (novo campo) ou, se ausente, um dia antes do prazo; fim = prazo.
- Linha vertical marcando "hoje". Barras atrasadas ganham destaque em vermelho; concluídas ficam esmaecidas com risco.
- Agrupamento das linhas por coluna do kanban (Backlog, Research, Discovery, Em andamento, Em revisão, Concluído), com grupos recolhíveis e a cor da coluna aplicada quando o modo colorido está ativo.
- Painel esquerdo fixo com título da nota, avatares dos responsáveis, badge de status e prioridade; área direita rolável com as barras.
- Interações: clicar na barra abre a nota (modo visualização); arrastar a barra move as datas; arrastar as pontas ajusta início ou prazo. Tudo salvo no store.
- Notas sem prazo aparecem em uma faixa "Sem prazo" no topo; arrastar de lá para a grade define as datas.

```text
+----------------------+---------------------------------------------+
| Nota / responsável   | Ago 25   26   27   28   29   30   31        |
+----------------------+---------------------------------------------+
| ▸ Em andamento                                                     |
|   Revisar copy       |        [=======]                            |
|   Setup analytics    |             [=====|hoje==]                  |
| ▸ Concluído                                                        |
|   Wireframes         | [====]                                      |
+----------------------+---------------------------------------------+
```

## Melhorias no Kanban incluídas

- Barra de seleção de visualização no topo (Kanban / Linha do tempo / Calendário) para trocar sem depender só da sidebar.
- Os filtros existentes (busca, cores, prioridades, etiquetas, arquivadas) passam a valer também na linha do tempo.

## Detalhes técnicos

- `src/lib/board-types.ts`: adicionar `startDate?: number | null` em `Note` e helper `noteRange(note)` que resolve início/fim com fallback.
- `src/hooks/useBoardStore.ts`: aceitar `startDate` no `updateNote` e migrar notas existentes (campo opcional, sem quebra de dados salvos).
- Novo `src/components/kanban/TimelineView.tsx` (grade calculada com `date-fns`-livre, apenas Date nativo), mais `TimelineBar.tsx` para arraste/redimensionamento com pointer events (sem dnd-kit, para evitar conflito com o quadro).
- `src/routes/index.tsx`: substituir os booleanos `calendarView`/`archivedView` por um estado `view: "kanban" | "timeline" | "calendar" | "archived"` e renderizar a nova visualização; `AppSidebar` atualizado para o mesmo estado (colapsada e expandida).
- Reuso de `note-style.ts` (cores, prazos), `NoteMeta` (badges) e `useNoteAppearance` (cores das colunas nativas). Estilos por tokens semânticos em `src/styles.css`, compatíveis com dark mode.
