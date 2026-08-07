# Kanban de Notas Autoadesivas

App de quadro kanban com notas estilo post-it, inspirado no layout de três painéis da imagem enviada: sidebar de projetos, inbox de notas e área de trabalho.

## Layout

```text
+-------------+------------------+---------------------------------+
| Sidebar     | Inbox            | Quadro Kanban                   |
| workspace   | lista de notas   | Backlog | Fazendo | Feito | +   |
| projetos    | recentes com     | [nota]  | [nota]  |       |     |
| > arquivos  | autor, trecho    | [nota]  |         |       |     |
+-------------+------------------+---------------------------------+
```

- Breadcrumb no topo (Workspace > Projeto > Arquivo).
- Sidebar recolhível com árvore: projetos expansíveis, arquivos dentro de cada projeto, botão de adicionar.
- Inbox: lista de notas recentes do projeto/arquivo selecionado, com título, trecho e horário relativo; clicar abre a nota.

## Funcionalidades

Quadro
- Colunas padrão: Backlog, Fazendo, Feito.
- Adicionar, renomear e excluir colunas.
- Criar notas autoadesivas em qualquer coluna; arrastar entre colunas e reordenar.
- Paleta de cores por nota (rosa, amarelo, verde, azul, lilás, laranja).

Notas
- Editor com formatação: negrito, itálico, sublinhado, tachado, títulos H1–H3, lista com marcadores e lista numerada.
- Subnotas autoadesivas: cada nota pode conter notas-filhas menores, criadas e editadas dentro do painel da nota.
- Excluir nota e subnota.

Projetos e arquivos
- Criar/renomear/excluir projetos e arquivos.
- Cada arquivo tem seu próprio quadro kanban.

Persistência
- Tudo salvo no navegador (localStorage), sem login. Dados de exemplo iniciais reproduzindo o conteúdo da imagem para o quadro não começar vazio.

## Design

Tema claro e sóbrio como a referência: fundo levemente quente, superfícies brancas, bordas finas, cantos suaves, tipografia sem serifa compacta. Canvas com textura pontilhada sutil atrás das colunas. Notas com cor pastel de fundo, sombra baixa e barra de título discreta. Todas as cores como tokens semânticos em `src/styles.css`.

## Detalhes técnicos

- Rota única `/` (substitui o placeholder) com estado de seleção projeto/arquivo em memória.
- Estado global em um hook `useBoardStore` com reducer + persistência em localStorage, hidratado após montagem para evitar mismatch de SSR.
- Drag and drop com `@dnd-kit/core` + `@dnd-kit/sortable`.
- Editor de texto rico com `@tiptap/react` (StarterKit + Underline), leve e compatível com o runtime.
- Componentes: `AppSidebar`, `ProjectTree`, `InboxList`, `KanbanBoard`, `KanbanColumn`, `StickyNote`, `NoteEditorPanel`, `SubNoteList`, `ColorPicker`.
- Metadados de head próprios na rota inicial (título, descrição, og/twitter).
