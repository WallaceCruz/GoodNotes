/**
 * O aviso na tela, sem saber quem o desenha.
 *
 * Doze arquivos importavam `sonner` direto e chamavam `toast.success(...)`.
 * Isso amarrava metade da interface a uma biblioteca escolhida uma vez: trocar
 * de biblioteca, mudar o rótulo "Desfazer", ou calar os avisos num teste
 * significava abrir doze arquivos e acertar todos.
 *
 * Aqui fica só o contrato. Quem desenha se registra por `setNotifier` — hoje é
 * o `<Toaster />` em `components/ui/sonner.tsx`, que é onde a biblioteca já
 * morava. Este módulo não importa nenhuma.
 */

export type NotifyOptions = { description?: string | undefined };

export type Notifier = {
  /** Aviso neutro: algo aconteceu, sem sucesso nem falha. */
  show: (message: string, options?: NotifyOptions) => void;
  success: (message: string, options?: NotifyOptions) => void;
  error: (message: string, options?: NotifyOptions) => void;
  /**
   * Ação concluída com a saída de emergência junto.
   *
   * Deixar o desfazer no aviso, em vez de um diálogo de confirmação antes, é a
   * escolha deliberada do app: não interrompe quem tem certeza e ainda protege
   * quem errou.
   */
  undo: (message: string, onUndo: () => void, options?: NotifyOptions) => void;
};

/**
 * Enquanto ninguém se registrou, os avisos somem em silêncio.
 *
 * É o que se quer no servidor e num teste: um aviso perdido não pode derrubar
 * a ação que ele estava só relatando.
 */
const silencioso: Notifier = {
  show: () => {},
  success: () => {},
  error: () => {},
  undo: () => {},
};

let atual: Notifier = silencioso;

export function setNotifier(notifier: Notifier): void {
  atual = notifier;
}

/** A referência é estável: quem importa uma vez continua falando com o atual. */
export const notify: Notifier = {
  show: (message, options) => atual.show(message, options),
  success: (message, options) => atual.success(message, options),
  error: (message, options) => atual.error(message, options),
  undo: (message, onUndo, options) => atual.undo(message, onUndo, options),
};
