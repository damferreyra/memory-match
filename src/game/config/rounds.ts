export interface RoundConfig {
	round: number;
	timeLimit: number; // seconds
	peekDuration: number; // seconds all cards are visible at round start
}

export const ROUND_CONFIGS: RoundConfig[] = [
	{ round: 1, timeLimit: 60, peekDuration: 1.5 },
	{ round: 2, timeLimit: 45, peekDuration: 1.0 },
	{ round: 3, timeLimit: 30, peekDuration: 0.5 },
];
