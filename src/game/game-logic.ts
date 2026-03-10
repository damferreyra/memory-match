import {
	BASE_MATCH_SCORE,
	STREAK_BONUS_MAX,
	STREAK_BONUS_PER_MATCH,
	TIME_BONUS_PER_SECOND,
} from './config/ui';

export type CardState = 'faceDown' | 'flippingUp' | 'faceUp' | 'flippingDown' | 'matched';

export interface CardData {
	id: number; // unique 0..15
	symbolId: number; // 0..7 (which symbol/color pair)
	state: CardState;
}

// Fisher-Yates shuffle — mutates and returns for convenience
export function shuffle<T>(array: T[]): T[] {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

// Returns array of 16 symbolIds [0,0,1,1,...,7,7] shuffled
export function generateCardPairs(symbolCount: number): number[] {
	const pairs = Array.from({ length: symbolCount }, (_, i) => [i, i]).flat();
	return shuffle(pairs);
}

// Returns true if two card symbolIds match
export function isMatch(symbolA: number, symbolB: number): boolean {
	return symbolA === symbolB;
}

// Compute score for a match (streak bonus capped at STREAK_BONUS_MAX)
export function computeMatchScore(streakCount: number): number {
	const bonus = Math.min(streakCount * STREAK_BONUS_PER_MATCH, STREAK_BONUS_MAX);
	return BASE_MATCH_SCORE + bonus;
}

// Compute time bonus at round end
export function computeTimeBonus(secondsRemaining: number): number {
	return Math.floor(secondsRemaining) * TIME_BONUS_PER_SECOND;
}
