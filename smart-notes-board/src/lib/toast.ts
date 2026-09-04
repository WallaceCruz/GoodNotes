import { toast } from "sonner";

/**
 * Aviso de ação concluída com a saída de emergência junto.
 *
 * Excluir uma nota, apagar uma coluna, limpar uma seleção, concluir uma tarefa:
 * cinco telas montavam este mesmo aviso à mão, e o rótulo "Desfazer" era texto
 * solto em cada uma — bastava traduzir o app para uma delas ficar para trás.
 *
 * Deixar o desfazer no aviso (em vez de um diálogo de confirmação antes) é a
 * escolha deliberada do app: não interrompe quem tem certeza e ainda protege
 * quem errou.
 */
export function toastUndo(
  message: string,
  undo: () => void,
  options: { description?: string | undefined } = {},
): void {
  toast.success(message, {
    description: options.description,
    action: { label: "Desfazer", onClick: undo },
  });
}
