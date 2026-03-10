import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS } from '../constants';
import {
	CARD_WIDTH,
	CARD_HEIGHT,
	CARD_CORNER_RADIUS,
	CARD_BACK_COLOR,
	CARD_BACK_BORDER,
	CARD_BORDER_WIDTH,
	CARD_FACE_BG,
	CARD_FACE_BORDER,
	CARD_QUESTION_FONT_SIZE,
	SYMBOLS,
	SYMBOL_COLORS,
	SYMBOL_FONT_SIZE,
} from '../config/cards';
import type { Symbol as CardSymbol } from '../config/cards';
import { GRID_LAYOUT, getCardPosition } from '../config/grid';
import { CARD_DEPTH } from '../config/ui';
import { type CardData, generateCardPairs } from '../game-logic';

export class GameScene extends Phaser.Scene {
	private cards: CardData[] = [];
	private containers: Phaser.GameObjects.Container[] = [];

	constructor() {
		super({ key: SCENE_KEYS.GAME });
	}

	create(): void {
		this.cards = [];
		this.containers = [];
		this.drawBackground();
		const symbolIds = generateCardPairs(SYMBOLS.length);
		this.buildGrid(symbolIds);
	}

	private drawBackground(): void {
		const bg = this.add.graphics();
		bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
		bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
	}

	private buildGrid(symbolIds: number[]): void {
		const totalCards = GRID_LAYOUT.cols * GRID_LAYOUT.rows;
		for (let i = 0; i < totalCards; i++) {
			this.cards.push({ id: i, symbolId: symbolIds[i], state: 'faceDown' });

			const pos = getCardPosition(i, GRID_LAYOUT);
			const container = this.add.container(pos.x, pos.y);
			container.setDepth(CARD_DEPTH);

			// Back face (visible by default)
			const back = this.add.graphics();
			back.fillStyle(CARD_BACK_COLOR);
			back.fillRoundedRect(
				-CARD_WIDTH / 2,
				-CARD_HEIGHT / 2,
				CARD_WIDTH,
				CARD_HEIGHT,
				CARD_CORNER_RADIUS,
			);
			back.lineStyle(CARD_BORDER_WIDTH, CARD_BACK_BORDER, 1);
			back.strokeRoundedRect(
				-CARD_WIDTH / 2,
				-CARD_HEIGHT / 2,
				CARD_WIDTH,
				CARD_HEIGHT,
				CARD_CORNER_RADIUS,
			);

			// '?' label on the back face
			const questionMark = this.add
				.text(0, 0, '?', {
					fontSize: `${CARD_QUESTION_FONT_SIZE}px`,
					fontFamily: 'Arial, sans-serif',
					color: '#ffffff',
				})
				.setOrigin(0.5);

			// Front face (hidden until flipped)
			const front = this.add.graphics();
			front.fillStyle(CARD_FACE_BG);
			front.fillRoundedRect(
				-CARD_WIDTH / 2,
				-CARD_HEIGHT / 2,
				CARD_WIDTH,
				CARD_HEIGHT,
				CARD_CORNER_RADIUS,
			);
			front.lineStyle(CARD_BORDER_WIDTH, CARD_FACE_BORDER, 1);
			front.strokeRoundedRect(
				-CARD_WIDTH / 2,
				-CARD_HEIGHT / 2,
				CARD_WIDTH,
				CARD_HEIGHT,
				CARD_CORNER_RADIUS,
			);
			front.setVisible(false);

			// Symbol text (hidden until flipped)
			const sym = SYMBOLS[symbolIds[i]] as CardSymbol;
			const hexColor = `#${SYMBOL_COLORS[sym].toString(16).padStart(6, '0')}`;
			const symbolText = this.add
				.text(0, 0, sym, {
					fontSize: `${SYMBOL_FONT_SIZE}px`,
					fontFamily: 'Arial, sans-serif',
					color: hexColor,
				})
				.setOrigin(0.5)
				.setVisible(false);

			container.add([back, questionMark, front, symbolText]);
			this.containers.push(container);
		}
	}
}
