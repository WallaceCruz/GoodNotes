# Política de Segurança

## Versões com suporte

O projeto é mantido na branch `main`. Correções de segurança vão para a versão
mais recente.

## Relatando uma vulnerabilidade

**Não abra uma issue pública para vulnerabilidades.**

Use o canal privado do GitHub —
[Security Advisories](https://github.com/WallaceCruz/GoodNotes/security/advisories/new) —
descrevendo o problema, como reproduzir e o impacto que você enxerga.

A resposta costuma vir em até 7 dias.

## Contexto que ajuda a calibrar

O Goodnotes roda inteiramente no navegador: não há servidor, banco de dados,
autenticação nem chamadas a serviços externos. Os dados ficam no
`localStorage` da máquina de quem usa.

Isso concentra a superfície de ataque em duas áreas, que são as de maior
interesse num relato:

- **Injeção de HTML/script** através do conteúdo das notas. O conteúdo do editor
  é sanitizado com [DOMPurify](https://github.com/cure53/DOMPurify) antes de
  qualquer inserção no DOM — falhas nesse caminho são relevantes.
- **Dependências** com vulnerabilidades conhecidas.

Como não há servidor, não existem endpoints, sessões ou credenciais a atacar.
