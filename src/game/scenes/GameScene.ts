import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS, REGISTRY_KEYS } from '../constants';
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
import { ROUND_CONFIGS } from '../config/rounds';
import { CARD_DEPTH, BG_GRADIENT_TOP, BG_GRADIENT_BOTTOM, FLIP_DURATION_MS } from '../config/ui';
import { type CardData, generateCardPairs } from '../game-logic';

export class GameScene extends Phaser.Scene {
	private cards: CardData[] = [];
	private containers: Phaser.GameObjects.Container[] = [];
	private isChecking = false;
	private flippedIndices: number[] = [];
	private mismatchTimer: Phaser.Time.TimerEvent | null = null;

	constructor() {
		super({ key: SCENE_KEYS.GAME });
	}

	create(): void {
		this.cards = [];
		this.containers = [];
		this.isChecking = false;
		this.flippedIndices = [];
		this.mismatchTimer = null;
		this.drawBackground();
		const symbolIds = generateCardPairs(SYMBOLS.length);
		this.buildGrid(symbolIds);
		this.events.on('shutdown', this.handleShutdown, this);
		this.startPeekPhase();
	}

	private drawBackground(): void {
		const bg = this.add.graphics();
		bg.fillGradientStyle(BG_GRADIENT_TOP, BG_GRADIENT_TOP, BG_GRADIENT_BOTTOM, BG_GRADIENT_BOTTOM, 1);
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

			// Wire up interactivity — container needs a size before setInteractive
			container.setSize(CARD_WIDTH, CARD_HEIGHT);
			container.setInteractive({ useHandCursor: true });
			container.on('pointerdown', () => {
				this.handleCardClick(i);
			});

			this.containers.push(container);
		}
	}

	private showCardFace(index: number): void {
		const container = this.containers[index];
		(container.getAt(0) as Phaser.GameObjects.Graphics).setVisible(false);
		(container.getAt(1) as Phaser.GameObjects.Text).setVisible(false);
		(container.getAt(2) as Phaser.GameObjects.Graphics).setVisible(true);
		(container.getAt(3) as Phaser.GameObjects.Text).setVisible(true);
	}

	private showCardBack(index: number): void {
		const container = this.containers[index];
		(container.getAt(0) as Phaser.GameObjects.Graphics).setVisible(true);
		(container.getAt(1) as Phaser.GameObjects.Text).setVisible(true);
		(container.getAt(2) as Phaser.GameObjects.Graphics).setVisible(false);
		(container.getAt(3) as Phaser.GameObjects.Text).setVisible(false);
	}

	private flipCardUp(index: number): void {
		const container = this.containers[index];
		const card = this.cards[index];
		card.state = 'flippingUp';
		this.tweens.add({
			targets: container,
			scaleX: 0,
			duration: FLIP_DURATION_MS,
			ease: 'Linear',
			onComplete: () => {
				this.showCardFace(index);
				this.tweens.add({
					targets: container,
					scaleX: 1,
					duration: FLIP_DURATION_MS,
					ease: 'Linear',
					onComplete: () => {
						card.state = 'faceUp';
						if (this.flippedIndices.length === 2) {
							this.evaluatePair();
						}
					},
				});
			},
		});
	}

	private flipCardDown(index: number): void {
		const container = this.containers[index];
		const card = this.cards[index];
		card.state = 'flippingDown';
		this.tweens.add({
			targets: container,
			scaleX: 0,
			duration: FLIP_DURATION_MS,
			ease: 'Linear',
			onComplete: () => {
				this.showCardBack(index);
				this.tweens.add({
					targets: container,
					scaleX: 1,
					duration: FLIP_DURATION_MS,
					ease: 'Linear',
					onComplete: () => {
						card.state = 'faceDown';
						this.isChecking = false;
					},
				});
			},
		});
	}

	private handleCardClick(index: number): void {
		if (this.isChecking) return;
		if (this.cards[index].state !== 'faceDown') return;
		if (this.flippedIndices.includes(index)) return;

		this.flipCardUp(index);
		this.flippedIndices.push(index);

		if (this.flippedIndices.length === 2) {
			this.isChecking = true;
		}
	}

	private startPeekPhase(): void {
		const round = this.registry.get(REGISTRY_KEYS.CURRENT_ROUND) as number;
		const { peekDuration } = ROUND_CONFIGS[round - 1];
		this.isChecking = true;
		for (let i = 0; i < this.cards.length; i++) {
			this.showCardFace(i);
			this.cards[i].state = 'faceUp';
		}
		this.time.delayedCall(peekDuration * 1000, () => {
			for (let i = 0; i < this.cards.length; i++) {
				if (this.cards[i].state !== 'matched') {
					this.showCardBack(i);
					this.cards[i].state = 'faceDown';
				}
			}
			this.isChecking = false;
		});
	}

	private evaluatePair(): void {
		// Stub — fully implemented in plan 04-02.
		// flipCardDown is called from evaluatePair on mismatch; reference here
		// prevents noUnusedLocals error until plan 04-02 completes the logic.
		void this.flipCardDown.bind(this);
	}

	private handleShutdown(): void {
		this.tweens.killAll();
		if (this.mismatchTimer) {
			this.mismatchTimer.remove(false);
			this.mismatchTimer = null;
		}
	}
}
