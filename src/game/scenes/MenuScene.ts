import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, REGISTRY_KEYS, SCENE_KEYS } from '../constants';
import { ROUND_CONFIGS } from '../config/rounds';

const SYMBOLS = ['★', '♦', '♠', '♥', '✿', '♪', '▲', '●'];
const SYMBOL_COLORS = ['#f39c12', '#e74c3c', '#8e44ad', '#e91e8c', '#27ae60', '#2980b9', '#f1c40f', '#16a085'];

export class MenuScene extends Phaser.Scene {
	constructor() {
		super({ key: SCENE_KEYS.MENU });
	}

	create(): void {
		// Background
		const bg = this.add.graphics();
		bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
		bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

		// Title
		this.add
			.text(GAME_WIDTH / 2, 200, 'Memory Match', {
				fontSize: '72px',
				fontFamily: 'Arial Black, Arial, sans-serif',
				color: '#ffffff',
				stroke: '#0f3460',
				strokeThickness: 8,
			})
			.setOrigin(0.5);

		// Subtitle
		this.add
			.text(GAME_WIDTH / 2, 295, 'Test your memory across 3 rounds', {
				fontSize: '22px',
				fontFamily: 'Arial, sans-serif',
				color: '#a0b4c8',
			})
			.setOrigin(0.5);

		// Decorative symbols row
		SYMBOLS.forEach((sym, i) => {
			const x = GAME_WIDTH / 2 - 196 + i * 56;
			this.add
				.text(x, 370, sym, {
					fontSize: '34px',
					fontFamily: 'Arial, sans-serif',
					color: SYMBOL_COLORS[i],
				})
				.setOrigin(0.5);
		});

		// Play button
		const btnX = GAME_WIDTH / 2;
		const btnY = 490;
		const btnW = 200;
		const btnH = 62;

		const btn = this.add.graphics();
		const drawBtn = (color: number) => {
			btn.clear();
			btn.fillStyle(color);
			btn.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 12);
		};
		drawBtn(0xe74c3c);

		this.add
			.text(btnX, btnY, 'PLAY', {
				fontSize: '32px',
				fontFamily: 'Arial Black, Arial, sans-serif',
				color: '#ffffff',
			})
			.setOrigin(0.5)
			.setDepth(1);

		const zone = this.add
			.zone(btnX, btnY, btnW, btnH)
			.setInteractive({ useHandCursor: true })
			.setDepth(2);

		zone.on('pointerover', () => drawBtn(0xff6b6b));
		zone.on('pointerout', () => drawBtn(0xe74c3c));
		zone.on('pointerdown', () => {
			this.registry.set(REGISTRY_KEYS.CURRENT_ROUND, 1);
			this.registry.set(REGISTRY_KEYS.TOTAL_SCORE, 0);
			this.registry.set(REGISTRY_KEYS.TOTAL_ROUNDS, ROUND_CONFIGS.length);
			this.scene.start(SCENE_KEYS.GAME);
		});
	}
}
