import { GAME_WIDTH } from '../constants';
import { CARD_HEIGHT, CARD_WIDTH } from './cards';

export const GRID_COLS = 4;
export const GRID_ROWS = 4;
export const GRID_GAP = 12;

// Computed: grid is centered on the canvas
// Origin: top-left corner of the full grid (pixels)
export const GRID_ORIGIN_X =
	(GAME_WIDTH - GRID_COLS * CARD_WIDTH - (GRID_COLS - 1) * GRID_GAP) / 2;
export const GRID_ORIGIN_Y = 90; // leave room for HUD at top

export interface GridLayout {
	cols: number;
	rows: number;
	cardWidth: number;
	cardHeight: number;
	gap: number;
	originX: number;
	originY: number;
}

export const GRID_LAYOUT: GridLayout = {
	cols: GRID_COLS,
	rows: GRID_ROWS,
	cardWidth: CARD_WIDTH,
	cardHeight: CARD_HEIGHT,
	gap: GRID_GAP,
	originX: GRID_ORIGIN_X,
	originY: GRID_ORIGIN_Y,
};

// Pure function — no Phaser import
export function getCardPosition(index: number, layout: GridLayout): { x: number; y: number } {
	const col = index % layout.cols;
	const row = Math.floor(index / layout.cols);
	return {
		x: layout.originX + col * (layout.cardWidth + layout.gap) + layout.cardWidth / 2,
		y: layout.originY + row * (layout.cardHeight + layout.gap) + layout.cardHeight / 2,
	};
}
