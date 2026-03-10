export const CARD_WIDTH = 140;
export const CARD_HEIGHT = 140;
export const CARD_CORNER_RADIUS = 12;
export const CARD_BACK_COLOR = 0x2c3e50; // dark blue-gray
export const CARD_BACK_BORDER = 0x1a252f;
export const CARD_MATCHED_TINT = 0x888888;

export const SYMBOLS = ['★', '♦', '♠', '♥', '✿', '♪', '▲', '●'] as const;
export type Symbol = (typeof SYMBOLS)[number];

// One color per symbol — hex integers
export const SYMBOL_COLORS: Record<Symbol, number> = {
	'★': 0xf39c12,
	'♦': 0xe74c3c,
	'♠': 0x8e44ad,
	'♥': 0xe91e8c,
	'✿': 0x27ae60,
	'♪': 0x2980b9,
	'▲': 0xf1c40f,
	'●': 0x16a085,
};

export const SYMBOL_FONT_SIZE = 52;
export const CARD_QUESTION_FONT_SIZE = 48; // '?' shown on card back
export const CARD_BORDER_WIDTH = 2; // stroke width for card outlines
export const CARD_FACE_BG = 0xffffff; // white face background
export const CARD_FACE_BORDER = 0xcccccc;
