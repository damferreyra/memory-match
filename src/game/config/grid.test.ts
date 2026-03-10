import { describe, expect, it } from 'vitest';
import { getCardPosition, GRID_LAYOUT } from './grid';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

describe('getCardPosition', () => {
	it('index 0 returns coords within canvas bounds', () => {
		const pos = getCardPosition(0, GRID_LAYOUT);
		expect(pos.x).toBeGreaterThan(0);
		expect(pos.x).toBeLessThan(GAME_WIDTH);
		expect(pos.y).toBeGreaterThan(0);
		expect(pos.y).toBeLessThan(GAME_HEIGHT);
	});

	it('index 15 returns coords within canvas bounds', () => {
		const pos = getCardPosition(15, GRID_LAYOUT);
		expect(pos.x).toBeLessThan(GAME_WIDTH);
		expect(pos.y).toBeLessThan(GAME_HEIGHT);
	});

	it('all 16 positions (indices 0-15) are distinct', () => {
		const positions = Array.from({ length: 16 }, (_, i) => getCardPosition(i, GRID_LAYOUT));
		const keys = positions.map((p) => `${p.x},${p.y}`);
		const unique = new Set(keys);
		expect(unique.size).toBe(16);
	});

	it('no position exceeds GAME_WIDTH or GAME_HEIGHT', () => {
		for (let i = 0; i < 16; i++) {
			const pos = getCardPosition(i, GRID_LAYOUT);
			expect(pos.x).toBeLessThanOrEqual(GAME_WIDTH);
			expect(pos.y).toBeLessThanOrEqual(GAME_HEIGHT);
		}
	});
});
