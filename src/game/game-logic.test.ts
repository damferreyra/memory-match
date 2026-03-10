import { describe, expect, it } from 'vitest';
import { generateCardPairs, isMatch, computeMatchScore, computeTimeBonus, shuffle } from './game-logic';
import { BASE_MATCH_SCORE, STREAK_BONUS_MAX, TIME_BONUS_PER_SECOND } from './config/ui';

describe('shuffle', () => {
	it('returns an array with the same length', () => {
		const arr = [1, 2, 3, 4, 5];
		const result = shuffle([...arr]);
		expect(result).toHaveLength(arr.length);
	});

	it('returns an array with the same elements', () => {
		const arr = [1, 2, 3, 4, 5];
		const result = shuffle([...arr]);
		expect(result.slice().sort()).toEqual(arr.slice().sort());
	});
});

describe('generateCardPairs', () => {
	it('returns an array of length 16 for symbolCount=8', () => {
		const pairs = generateCardPairs(8);
		expect(pairs).toHaveLength(16);
	});

	it('each symbolId 0-7 appears exactly twice', () => {
		const pairs = generateCardPairs(8);
		for (let i = 0; i < 8; i++) {
			const count = pairs.filter((id) => id === i).length;
			expect(count).toBe(2);
		}
	});
});

describe('isMatch', () => {
	it('returns true when both symbolIds are the same', () => {
		expect(isMatch(3, 3)).toBe(true);
	});

	it('returns false when symbolIds differ', () => {
		expect(isMatch(3, 5)).toBe(false);
	});
});

describe('computeMatchScore', () => {
	it('returns BASE_MATCH_SCORE + STREAK_BONUS_MAX when streak is very high (capped)', () => {
		expect(computeMatchScore(100)).toBe(BASE_MATCH_SCORE + STREAK_BONUS_MAX);
	});

	it('returns BASE_MATCH_SCORE when streak is 0 (no bonus)', () => {
		expect(computeMatchScore(0)).toBe(BASE_MATCH_SCORE);
	});
});

describe('computeTimeBonus', () => {
	it('returns 150 for 15 seconds remaining', () => {
		expect(computeTimeBonus(15)).toBe(15 * TIME_BONUS_PER_SECOND);
	});

	it('floors fractional seconds (15.9 -> 150)', () => {
		expect(computeTimeBonus(15.9)).toBe(150);
	});
});
