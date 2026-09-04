# Contribuindo com o Goodnotes

Obrigado pelo interesse. Este guia cobre o essencial para uma contribuição
entrar sem atrito.

## Ambiente

```bash
git clone https://github.com/WallaceCruz/goodnotes.git
cd goodnotes/smart-notes-board
npm install
npm run dev
```

## Fluxo de trabalho

O repositório usa duas branches de longa duração:

| Branch | Papel |
| --- | --- |
| `main` | Estável. Só recebe merge vindo de `develop` ou correção urgente. |
| `develop` | Integração. É daqui que saem as branches de trabalho. |

1. Saia de `develop`: `git switch develop && git switch -c feat/nome-curto`
2. Faça o trabalho em commits pequenos e legíveis.
3. Abra o Pull Request **contra `develop`**.

Prefixos de branch: `feat/`, `fix/`, `docs/`, `refactor/`, `chore/`.

## Antes de abrir o PR

Rode os três, a partir de `smart-notes-board/`:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

A CI roda exatamente isso. Se passar aqui, passa lá.

## Estilo de código

- **O domínio não importa React.** Regra de negócio vive em
  `src/lib/board/` como função pura sobre dados. Componente decide
  apresentação, domínio decide regra.
- **Nomes dizem o que a coisa é.** Evite variáveis de uma letra fora de
  contadores de laço.
- **Comentário explica o porquê, não o quê.** O código já diz o que faz; o
  comentário existe para a decisão que não é óbvia.
- **Um módulo, uma responsabilidade.** Arquivo que cresce demais costuma estar
  fazendo duas coisas.
- Formatação é do Prettier — `npm run format` resolve.

## Mensagens de commit

Uma linha de resumo no imperativo, e o corpo explicando o motivo quando a
mudança não for óbvia:

```
Corrige a cor da nota branca no tema escuro

O token ficava em oklch(0.98) enquanto as demais notas desciam para 0.4x,
deixando o card ofuscante sobre o quadro escuro.
```

## Reportando problemas

Abra uma [issue](https://github.com/WallaceCruz/goodnotes/issues) descrevendo o
que aconteceu, o que era esperado e como reproduzir. Navegador e sistema
operacional ajudam bastante.
