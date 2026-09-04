import * as automations from "@/lib/board/automations";
import * as projects from "@/lib/board/projects";
import { createBoardSaver } from "@/lib/board/persistence";
import { useBoard, activeFileOf } from "./board";

/**
 * O que o quadro faz sozinho, fora do React: gravar as mudanças e aplicar as
 * automações.
 *
 * Isto vivia num bloco solto no fim do módulo do store, executado no momento em
 * que alguém o importasse — então importar o estado para ler uma nota já ligava
 * assinaturas e ouvintes de janela, e não havia como usar o store sem eles.
 * Aqui é uma partida explícita, chamada uma vez pela raiz do app.
 */

let iniciado = false;

export function startBoardEffects(): void {
  // A raiz remonta em navegação e no modo de desenvolvimento; sem esta guarda,
  // cada remontagem somaria mais um assinante gravando o mesmo estado.
  if (iniciado || typeof window === "undefined") return;
  iniciado = true;

  const saver = createBoardSaver();

  useBoard.subscribe((s, prev) => {
    if (!s.hydrated || s.data === prev.data) return;
    saver.save(s.data);

    // Automações: mover as notas que passaram a casar com alguma regra ativa.
    // A rodada seguinte não encontra nada pendente, então isto não realimenta.
    const file = activeFileOf(s);
    if (!file) return;
    const moves = automations.pendingAutomationMoves(file);
    if (moves.size > 0)
      useBoard.setState((current) => ({
        data: projects.mapActiveFile(current.data, current.projectId, current.fileId, (f) =>
          automations.applyAutomationMoves(f, moves),
        ),
      }));
  });

  const flush = () => saver.flush();
  window.addEventListener("beforeunload", flush);
  document.addEventListener("visibilitychange", flush);
}
