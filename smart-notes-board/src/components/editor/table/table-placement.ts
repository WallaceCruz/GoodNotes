/** Onde a barra e o menu da tabela cabem na tela. */

export const BAR_HEIGHT = 30;
export const MENU_WIDTH = 248;

/** Respiro entre a barra e a borda da tabela. */
const GAP = 6;

/** Margem mínima até a borda da janela. */
const EDGE = 8;

/** Abaixo disso o menu fica apertado demais para valer a pena abrir para baixo. */
const COMFORTABLE_MENU_HEIGHT = 260;

export type TableAnchorRect = {
  top: number;
  left: number;
  bottom: number;
  viewportWidth: number;
  viewportHeight: number;
};

export type TableMenuPlacement = {
  barTop: number;
  barLeft: number;
  /** O menu abre para cima quando não há espaço confortável abaixo da barra. */
  openUp: boolean;
  menuMaxHeight: number;
};

export function placeTableMenu(rect: TableAnchorRect): TableMenuPlacement {
  const above = rect.top - BAR_HEIGHT - GAP;
  const barTop =
    above >= EDGE ? above : Math.min(rect.bottom + GAP, rect.viewportHeight - BAR_HEIGHT - EDGE);
  const barLeft = Math.max(EDGE, Math.min(rect.left, rect.viewportWidth - MENU_WIDTH - EDGE));

  const spaceBelow = rect.viewportHeight - (barTop + BAR_HEIGHT + 4) - EDGE;
  const spaceAbove = barTop - 12;
  const openUp = spaceBelow < COMFORTABLE_MENU_HEIGHT && spaceAbove > spaceBelow;

  return {
    barTop,
    barLeft,
    openUp,
    menuMaxHeight: Math.max(180, Math.min(440, openUp ? spaceAbove : spaceBelow)),
  };
}
