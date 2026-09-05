/**
 * Os atalhos que o painel oferece antes da primeira mensagem.
 *
 * Cada um é só um prompt pronto: quem chega sem saber o que pedir vê o que dá
 * para fazer, e quem já sabe ignora e escreve. O texto vai como se a pessoa
 * tivesse digitado, então o modelo não precisa de tratamento especial.
 */
export type Suggestion = {
  id: string;
  label: string;
  prompt: string;
  /** Precisa de uma nota ou arquivo em contexto para fazer sentido. */
  needsScope: boolean;
};

export const SUGGESTIONS: Suggestion[] = [
  {
    id: "resumo",
    label: "Criar um resumo",
    prompt: "Resuma o conteúdo em contexto nos pontos essenciais.",
    needsScope: true,
  },
  {
    id: "clareza",
    label: "Melhorar clareza",
    prompt: "Reescreva o texto em contexto com mais clareza, mantendo o sentido e o tom.",
    needsScope: true,
  },
  {
    id: "ortografia",
    label: "Melhorar ortografia e gramática",
    prompt: "Corrija ortografia, gramática e pontuação do texto em contexto. Liste o que mudou.",
    needsScope: true,
  },
  {
    id: "traduzir",
    label: "Traduzir",
    prompt: "Traduza o conteúdo em contexto para inglês.",
    needsScope: true,
  },
  {
    id: "acoes",
    label: "Encontrar itens de ação",
    prompt:
      "Liste os itens de ação do conteúdo em contexto, com responsável e prazo quando houver.",
    needsScope: true,
  },
  {
    id: "lacunas",
    label: "Expandir áreas fracas",
    prompt: "Aponte as partes vagas ou incompletas do conteúdo em contexto e sugira como melhorar.",
    needsScope: true,
  },
  {
    id: "temas",
    label: "Sugerir temas relacionados",
    prompt: "Sugira temas relacionados ao conteúdo em contexto que valeria explorar.",
    needsScope: true,
  },
  {
    id: "ideias",
    label: "Gerar ideias",
    prompt: "Gere ideias sobre o conteúdo em contexto e crie uma nota para cada uma que valer.",
    needsScope: true,
  },
  {
    id: "visao-geral",
    label: "Obter uma visão geral",
    prompt: "Dê uma visão geral do que está em contexto: temas, prazos e o que precisa de atenção.",
    needsScope: true,
  },
  {
    id: "nova-nota",
    label: "Criar uma nota",
    prompt: "Crie uma nota para ",
    needsScope: false,
  },
];
