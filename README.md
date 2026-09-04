# Goodnotes

Um quadro kanban de notas autoadesivas que roda inteiramente no navegador. Sem
servidor, sem conta, sem cadastro: o quadro vive no armazenamento local da
máquina e abre pronto para uso.

O mesmo conjunto de notas é apresentado de quatro formas — quadro kanban,
calendário, linha do tempo e, no celular, um baralho de cartas que se percorre
deslizando.

## Como rodar

Requer [Node.js](https://nodejs.org) 20 ou superior.

```bash
git clone https://github.com/WallaceCruz/goodnotes.git
cd goodnotes/smart-notes-board
npm install
npm run dev
```

A aplicação sobe em `http://localhost:5173`.

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento com recarga automática |
| `npm run build` | Build de produção |
| `npm run preview` | Serve o build para conferência |
| `npm run lint` | ESLint em todo o código |
| `npm run format` | Prettier em todo o código |

Não há passo de configuração: sem `.env`, sem banco, sem chave de API.

## O que o app faz

- **Quadro kanban** com colunas do fluxo (Backlog, Research, Discovery, Em
  andamento, Em revisão, Concluído), arrastar e soltar, e colunas próprias.
- **Editor rico** em cada nota: títulos, listas, código, citações, imagens com
  ampliação, e tabelas com barra de comandos própria.
- **Calendário** e **linha do tempo**, onde arrastar uma barra muda as datas da
  nota.
- **Etiquetas, prioridades, responsáveis, prazos e checklists**, todos
  refletidos nos filtros.
- **Seleção em massa** com exclusão desfazível.
- **Aparência configurável** das notas — estilo, cantos, sombra, borda,
  tipografia e cores — por conta ou por projeto.
- **Tema claro e escuro**, seguindo o sistema por padrão.
- **Versão mobile própria**: em telas pequenas o kanban dá lugar a um baralho de
  cartas ordenado por urgência.

## Como o código é organizado

```
smart-notes-board/
├── src/
│   ├── lib/           utilidades genéricas (datas, html, texto, id…)
│   │   └── board/     o domínio: funções puras sobre o quadro
│   ├── components/
│   │   ├── kanban/    quadro, colunas, calendário, linha do tempo
│   │   ├── editor/    editor de texto rico e seus complementos
│   │   ├── note/      a nota e suas partes, compartilhadas entre telas
│   │   ├── mobile/    a experiência de celular
│   │   └── ui/        primitivas de interface (shadcn/ui)
│   ├── stores/        estado global (Zustand)
│   ├── hooks/         hooks reutilizáveis
│   └── routes/        rotas da aplicação
└── ...
```

A regra que orienta a divisão: **`src/lib/board/` não importa React**. Toda
decisão de negócio — o que é uma nota atrasada, para onde ela vai ao ser
concluída, quais notas um filtro deixa passar — é função pura sobre dados,
legível e testável sem montar tela. Os componentes decidem apresentação; o
domínio decide regra.

## Feito com

[React 19](https://react.dev) · [TanStack Start](https://tanstack.com/start) ·
[TypeScript](https://www.typescriptlang.org) · [Vite](https://vite.dev) ·
[Tailwind CSS v4](https://tailwindcss.com) · [Zustand](https://zustand.docs.pmnd.rs) ·
[Tiptap](https://tiptap.dev) · [dnd-kit](https://dndkit.com) ·
[shadcn/ui](https://ui.shadcn.com)

## Contribuindo

Contribuições são bem-vindas — veja o [guia de contribuição](CONTRIBUTING.md) e
o [código de conduta](CODE_OF_CONDUCT.md).

## Licença

[MIT](LICENSE).
