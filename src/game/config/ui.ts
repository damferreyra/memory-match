// Depth layering (always use these — never inline numbers)
export const CARD_DEPTH = 10;
export const HUD_DEPTH = 20;
export const OVERLAY_DEPTH = 30; // round-complete and game-over panels

// HUD
export const HUD_HEIGHT = 70;
export const TIMER_BAR_WIDTH = 400;
export const TIMER_BAR_HEIGHT = 18;
export const SCORE_FONT_SIZE = 22;
export const TIMER_COLOR_NORMAL = 0x27ae60;
export const TIMER_COLOR_URGENT = 0xe74c3c; // switch when < 10s remaining
export const TIMER_URGENT_THRESHOLD = 10; // seconds

// Overlays (centered panels)
export const OVERLAY_PANEL_WIDTH = 440;
export const OVERLAY_PANEL_HEIGHT = 280;
export const OVERLAY_BACKDROP_ALPHA = 0.65;

// Flip animation
export const FLIP_DURATION_MS = 150; // ms for each half of the scaleX tween
export const MISMATCH_HOLD_MS = 800; // ms before flipping unmatched cards back

// Streak
export const STREAK_BONUS_PER_MATCH = 50;
export const STREAK_BONUS_MAX = 200;
export const BASE_MATCH_SCORE = 100;
export const TIME_BONUS_PER_SECOND = 10;

// Background
export const BG_GRADIENT_TOP = 0x1a1a2e;
export const BG_GRADIENT_BOTTOM = 0x16213e;

// HUD positional layout (within the 70px HUD strip)
export const HUD_TEXT_Y = 35; // vertical center of HUD strip
export const HUD_ROUND_X = 20; // left edge for round label
export const HUD_SCORE_X = 1004; // right edge for score (= GAME_WIDTH - 20; literal avoids import cycle)
export const HUD_BAR_Y = 28; // timer bar vertical center
export const HUD_COUNTDOWN_Y = 46; // countdown text top (below bar center + half bar height)

// Timer bar background
export const HUD_BAR_BG_COLOR = 0x000000;
export const HUD_BAR_BG_ALPHA = 0.4;
