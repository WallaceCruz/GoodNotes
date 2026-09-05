import {
  AlignLeft,
  BookOpen,
  Brain,
  CircleCheck,
  Files,
  Globe,
  Lightbulb,
  Map,
  PenLine,
  SpellCheck,
  Telescope,
  ZoomIn,
  type LucideIcon,
} from "lucide-react";

/**
 * Os atalhos que o painel oferece antes da primeira mensagem.
 *
 * Cada um é só um prompt pronto: quem chega sem saber o que pedir vê o que dá
 * para fazer, e quem já sabe ignora e escreve. O ícone próprio de cada um faz
 * a lista ser varrida pelo desenho, não lida linha a linha.
 */
export type Suggestion = {
  id: string;
  label: string;
  icon: LucideIcon;
  prompt: string;
  /** Precisa de uma nota ou arquivo em contexto para fazer sentido. */
  needsScope: boolean;
};

export const SUGGESTIONS: Suggestion[] = [
  {
    id: "resumo",
    label: "Criar um resumo",
    icon: AlignLeft,
    prompt: "Resuma o conteúdo em contexto nos pontos essenciais.",
    needsScope: true,
  },
  {
    id: "clareza",
    label: "Melhorar clareza",
    icon: Lightbulb,
    prompt: "Reescreva o texto em contexto com mais clareza, mantendo o sentido e o tom.",
    needsScope: true,
  },
  {
    id: "ortografia",
    label: "Melhorar ortografia e gramática",
    icon: SpellCheck,
    prompt: "Corrija ortografia, gramática e pontuação do texto em contexto. Liste o que mudou.",
    needsScope: true,
  },
  {
    id: "traduzir",
    label: "Traduzir",
    icon: Globe,
    prompt: "Traduza o conteúdo em contexto para inglês.",
    needsScope: true,
  },
  {
    id: "estilo",
    label: "Analisar estilo de escrita",
    icon: PenLine,
    prompt: "Analise o estilo de escrita do conteúdo em contexto: tom, ritmo e vícios.",
    needsScope: true,
  },
  {
    id: "acoes",
    label: "Encontrar itens de ação",
    icon: CircleCheck,
    prompt:
      "Liste os itens de ação do conteúdo em contexto, com responsável e prazo quando houver.",
    needsScope: true,
  },
  {
    id: "lacunas",
    label: "Expandir áreas fracas",
    icon: ZoomIn,
    prompt: "Aponte as partes vagas ou incompletas do conteúdo em contexto e sugira como melhorar.",
    needsScope: true,
  },
  {
    id: "temas",
    label: "Sugerir temas relacionados",
    icon: Map,
    prompt: "Sugira temas relacionados ao conteúdo em contexto que valeria explorar.",
    needsScope: true,
  },
  {
    id: "ideias",
    label: "Gerar ideias",
    icon: Brain,
    prompt: "Gere ideias sobre o conteúdo em contexto e crie uma nota para cada uma que valer.",
    needsScope: true,
  },
  {
    id: "relacionadas",
    label: "Encontrar notas relacionadas",
    icon: Files,
    prompt:
      "Entre as notas deste arquivo, aponte as que se relacionam com o conteúdo em contexto e por quê.",
    needsScope: true,
  },
  {
    id: "pesquisar",
    label: "Pesquisar um tema",
    icon: BookOpen,
    prompt: "Explique o tema a seguir e crie uma nota com o resultado: ",
    needsScope: false,
  },
  {
    id: "visao-geral",
    label: "Obter uma visão geral",
    icon: Telescope,
    prompt: "Dê uma visão geral do que está em contexto: temas, prazos e o que precisa de atenção.",
    needsScope: true,
  },
];
