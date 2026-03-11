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
	CARD_MATCHED_TINT,
	SYMBOLS,
	SYMBOL_COLORS,
	SYMBOL_FONT_SIZE,
} from '../config/cards';
import type { Symbol as CardSymbol } from '../config/cards';
import { GRID_LAYOUT, getCardPosition } from '../config/grid';
import { ROUND_CONFIGS } from '../config/rounds';
import {
	CARD_DEPTH,
	HUD_DEPTH,
	HUD_HEIGHT,
	TIMER_BAR_WIDTH,
	TIMER_BAR_HEIGHT,
	TIMER_COLOR_NORMAL,
	TIMER_COLOR_URGENT,
	TIMER_URGENT_THRESHOLD,
	SCORE_FONT_SIZE,
	BG_GRADIENT_TOP,
	BG_GRADIENT_BOTTOM,
	FLIP_DURATION_MS,
	MISMATCH_HOLD_MS,
	HUD_TEXT_Y,
	HUD_ROUND_X,
	HUD_SCORE_X,
	HUD_BAR_Y,
	HUD_COUNTDOWN_Y,
	HUD_BAR_BG_COLOR,
	HUD_BAR_BG_ALPHA,
} from '../config/ui';
import { type CardData, computeMatchScore, computeTimeBonus, generateCardPairs, isMatch } from '../game-logic';

export class GameScene extends Phaser.Scene {
	private cards: CardData[] = [];
	private containers: Phaser.GameObjects.Container[] = [];
	private isChecking = false;
	private flippedIndices: number[] = [];
	private mismatchTimer: Phaser.Time.TimerEvent | null = null;
	private timerEvent: Phaser.Time.TimerEvent | null = null;
	private timeLimit = 0;
	private timeRemaining = 0;
	private timerIsUrgent = false;
	private currentStreak = 0;
	private roundScore = 0;
	private scoreText!: Phaser.GameObjects.Text;
	private countdownText!: Phaser.GameObjects.Text;
	private timerBarFill!: Phaser.GameObjects.Rectangle;

	constructor() {
		super({ key: SCENE_KEYS.GAME });
	}

	create(): void {
		this.cards = [];
		this.containers = [];
		this.isChecking = false;
		this.flippedIndices = [];
		this.mismatchTimer = null;
		this.currentStreak = 0;
		this.roundScore = 0;
		this.drawBackground();
		this.buildHud();
		const symbolIds = generateCardPairs(SYMBOLS.length);
		this.buildGrid(symbolIds);
		this.events.on('shutdown', this.handleShutdown, this);
		this.startPeekPhase();
	}

	private buildHud(): void {
		const round = this.registry.get(REGISTRY_KEYS.CURRENT_ROUND) as number;
		const totalScore = this.registry.get(REGISTRY_KEYS.TOTAL_SCORE) as number;
		const { timeLimit } = ROUND_CONFIGS[round - 1];
		const mins = Math.floor(timeLimit / 60);
		const secs = timeLimit % 60;

		// Separator line (draw once — never redrawn)
		const sep = this.add.graphics();
		sep.lineStyle(1, 0x444466, 0.6);
		sep.beginPath();
		sep.moveTo(0, HUD_HEIGHT);
		sep.lineTo(GAME_WIDTH, HUD_HEIGHT);
		sep.strokePath();
		sep.setDepth(HUD_DEPTH);

		// Round label — left-aligned
		this.add
			.text(HUD_ROUND_X, HUD_TEXT_Y, `Round ${round} / 3`, {
				fontSize: `${SCORE_FONT_SIZE}px`,
				fontFamily: 'Arial, sans-serif',
				color: '#ffffff',
			})
			.setOrigin(0, 0.5)
			.setDepth(HUD_DEPTH);

		// Score text — right-aligned, stored as field for live updates
		this.scoreText = this.add
			.text(HUD_SCORE_X, HUD_TEXT_Y, `Score: ${totalScore}`, {
				fontSize: `${SCORE_FONT_SIZE}px`,
				fontFamily: 'Arial, sans-serif',
				color: '#ffffff',
			})
			.setOrigin(1, 0.5)
			.setDepth(HUD_DEPTH);

		// Timer bar background (centered, full width)
		this.add
			.rectangle(GAME_WIDTH / 2, HUD_BAR_Y, TIMER_BAR_WIDTH, TIMER_BAR_HEIGHT, HUD_BAR_BG_COLOR, HUD_BAR_BG_ALPHA)
			.setDepth(HUD_DEPTH)
			.setOrigin(0.5, 0.5);

		// Timer bar fill — origin (0, 0.5) so it shrinks from the right
		this.timerBarFill = this.add
			.rectangle(
				GAME_WIDTH / 2 - TIMER_BAR_WIDTH / 2,
				HUD_BAR_Y,
				TIMER_BAR_WIDTH,
				TIMER_BAR_HEIGHT,
				TIMER_COLOR_NORMAL,
			)
			.setDepth(HUD_DEPTH)
			.setOrigin(0, 0.5);

		// Countdown text — centered below bar
		this.countdownText = this.add
			.text(GAME_WIDTH / 2, HUD_COUNTDOWN_Y, `${mins}:${secs.toString().padStart(2, '0')}`, {
				fontSize: `${SCORE_FONT_SIZE}px`,
				fontFamily: 'Arial, sans-serif',
				color: '#ffffff',
			})
			.setOrigin(0.5, 0)
			.setDepth(HUD_DEPTH);
	}

	private startTimer(): void {
		const round = this.registry.get(REGISTRY_KEYS.CURRENT_ROUND) as number;
		this.timeLimit = ROUND_CONFIGS[round - 1].timeLimit;
		this.timeRemaining = this.timeLimit;
		this.timerIsUrgent = false;

		this.timerEvent = this.time.addEvent({
			delay: 1000,
			repeat: this.timeLimit - 1,
			callback: this.onTick,
			callbackScope: this,
		});
	}

	private onTick(): void {
		this.timeRemaining--;
		const mins = Math.floor(this.timeRemaining / 60);
		const secs = this.timeRemaining % 60;
		this.countdownText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);

		const fillWidth = (this.timeRemaining / this.timeLimit) * TIMER_BAR_WIDTH;
		this.timerBarFill.setDisplaySize(Math.max(0, fillWidth), TIMER_BAR_HEIGHT);

		if (!this.timerIsUrgent && this.timeRemaining < TIMER_URGENT_THRESHOLD) {
			this.timerIsUrgent = true;
			this.timerBarFill.setFillStyle(TIMER_COLOR_URGENT);
		}

		if (this.timeRemaining <= 0) {
			this.onTimeExpired();
		}
	}

	private onTimeExpired(): void {
		if (this.timerEvent) {
			this.timerEvent.remove(false);
			this.timerEvent = null;
		}
		this.isChecking = true;
		const totalScore = this.registry.get(REGISTRY_KEYS.TOTAL_SCORE) as number;
		this.events.emit('gameOver', { totalScore });
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
			this.startTimer();
		});
	}

	private tintContainer(container: Phaser.GameObjects.Container, tint: number): void {
		// Container does not expose setTint in Phaser's TypeScript types,
		// so tint is applied to each child that implements the Tint component.
		container.each((child: Phaser.GameObjects.GameObject) => {
			if ('setTint' in child && typeof (child as unknown as { setTint: unknown }).setTint === 'function') {
				(child as unknown as { setTint: (v: number) => void }).setTint(tint);
			}
		});
	}

	private evaluatePair(): void {
		const [indexA, indexB] = this.flippedIndices;
		const cardA = this.cards[indexA];
		const cardB = this.cards[indexB];

		if (isMatch(cardA.symbolId, cardB.symbolId)) {
			// Lock both cards as matched
			cardA.state = 'matched';
			cardB.state = 'matched';
			this.tintContainer(this.containers[indexA], CARD_MATCHED_TINT);
			this.tintContainer(this.containers[indexB], CARD_MATCHED_TINT);
			this.flippedIndices = [];
			// Scoring — immediate update on match confirmation (not after tween)
			const earned = computeMatchScore(this.currentStreak);
			this.currentStreak++;
			this.registry.inc(REGISTRY_KEYS.TOTAL_SCORE, earned);
			this.roundScore += earned;
			this.scoreText.setText(`Score: ${this.registry.get(REGISTRY_KEYS.TOTAL_SCORE) as number}`);
			this.checkForRoundCompletion();
		} else {
			// Reset streak on mismatch
			this.currentStreak = 0;
			// Schedule flip-back after hold delay
			this.mismatchTimer = this.time.delayedCall(MISMATCH_HOLD_MS, () => {
				this.flipCardDown(indexA);
				this.flipCardDown(indexB);
				this.flippedIndices = [];
				// isChecking will be reset to false inside flipCardDown's onComplete
				// Both tweens run in parallel; setting false twice is idempotent
			});
		}
	}

	private checkForRoundCompletion(): void {
		const allMatched = this.cards.every((card) => card.state === 'matched');
		if (!allMatched) {
			this.isChecking = false;
			return;
		}
		this.handleRoundWin();
	}

	private handleRoundWin(): void {
		if (this.timerEvent) {
			this.timerEvent.remove(false);
			this.timerEvent = null;
		}

		const round = this.registry.get(REGISTRY_KEYS.CURRENT_ROUND) as number;
		const totalRounds = this.registry.get(REGISTRY_KEYS.TOTAL_ROUNDS) as number | undefined;
		const isLastRound = (totalRounds ?? ROUND_CONFIGS.length) === round;

		const timeBonus = computeTimeBonus(this.timeRemaining);
		if (timeBonus > 0) {
			this.roundScore += timeBonus;
			this.registry.inc(REGISTRY_KEYS.TOTAL_SCORE, timeBonus);
			this.scoreText.setText(`Score: ${this.registry.get(REGISTRY_KEYS.TOTAL_SCORE) as number}`);
		}

		const totalScore = this.registry.get(REGISTRY_KEYS.TOTAL_SCORE) as number;

		if (!isLastRound) {
			this.registry.set(REGISTRY_KEYS.CURRENT_ROUND, round + 1);
		}

		this.isChecking = true;

		this.events.emit('roundComplete', {
			round,
			roundScore: this.roundScore,
			totalScore,
			isLastRound,
		});
	}

	private handleShutdown(): void {
		this.tweens.killAll();
		if (this.mismatchTimer) {
			this.mismatchTimer.remove(false);
			this.mismatchTimer = null;
		}
		if (this.timerEvent) {
			this.timerEvent.remove(false);
			this.timerEvent = null;
		}
	}
}
