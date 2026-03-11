export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 768;

export const SCENE_KEYS = {
	BOOT: 'BootScene',
	MENU: 'MenuScene',
	GAME: 'GameScene',
	UI: 'UIScene',
} as const;

export const REGISTRY_KEYS = {
	CURRENT_ROUND: 'currentRound',
	TOTAL_SCORE: 'totalScore',
	TOTAL_ROUNDS: 'totalRounds',
} as const;
