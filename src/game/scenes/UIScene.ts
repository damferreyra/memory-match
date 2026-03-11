import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, REGISTRY_KEYS, SCENE_KEYS } from '../constants';
import { OVERLAY_BACKDROP_ALPHA, OVERLAY_DEPTH, OVERLAY_PANEL_HEIGHT, OVERLAY_PANEL_WIDTH } from '../config/ui';
import { ROUND_CONFIGS } from '../config/rounds';

const PLATFORM_RETURN_URL = typeof import.meta !== 'undefined'
	? (import.meta as unknown as { env?: { VITE_PLATFORM_URL?: string } }).env?.VITE_PLATFORM_URL
	: undefined;

type RoundCompletePayload = {
	round: number;
	roundScore: number;
	totalScore: number;
	isLastRound: boolean;
};

type GameOverPayload = {
	totalScore: number;
};

export class UIScene extends Phaser.Scene {
	private activePanel: Phaser.GameObjects.Container | null = null;
	private boundGameScene: Phaser.Scene | null = null;

	constructor() {
		super({ key: SCENE_KEYS.UI });
	}

	create(): void {
		this.bindToGameSceneEvents();
	}

	update(): void {
		if (this.scene.isActive(SCENE_KEYS.GAME)) {
			this.bindToGameSceneEvents();
		}
	}

	private bindToGameSceneEvents(): void {
		const gameScene = this.scene.get(SCENE_KEYS.GAME) as Phaser.Scene;
		if (this.boundGameScene === gameScene) {
			return;
		}

		if (this.boundGameScene) {
			this.boundGameScene.events.off('roundComplete');
			this.boundGameScene.events.off('gameOver');
		}

		this.boundGameScene = gameScene;

		gameScene.events.on('roundComplete', (payload: RoundCompletePayload) => {
			this.showRoundCompletePanel(payload);
		});

		gameScene.events.on('gameOver', (payload: GameOverPayload) => {
			this.showGameOverPanel(payload);
		});
	}

	private clearPanel(): void {
		if (this.activePanel) {
			this.activePanel.destroy(true);
			this.activePanel = null;
		}
	}

	private createBackdrop(): Phaser.GameObjects.Rectangle {
		const backdrop = this.add
			.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, OVERLAY_BACKDROP_ALPHA)
			.setDepth(OVERLAY_DEPTH);
		return backdrop;
	}

	private showRoundCompletePanel(payload: RoundCompletePayload): void {
		this.clearPanel();

		const { round, roundScore, totalScore, isLastRound } = payload;
		const backdrop = this.createBackdrop();

		const panel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
		panel.setDepth(OVERLAY_DEPTH);

		const panelBg = this.add.rectangle(0, 0, OVERLAY_PANEL_WIDTH, OVERLAY_PANEL_HEIGHT, 0x1b1b33, 0.95);
		panelBg.setStrokeStyle(2, 0xffffff, 0.9);

		const titleText = this.add
			.text(0, -OVERLAY_PANEL_HEIGHT / 2 + 40, isLastRound ? 'You Win!' : `Round ${round} Complete`, {
				fontSize: '32px',
				fontFamily: 'Arial Black, Arial, sans-serif',
				color: '#ffffff',
				align: 'center',
			})
			.setOrigin(0.5);

		const roundScoreText = this.add
			.text(0, -10, `Round score: ${roundScore}`, {
				fontSize: '20px',
				fontFamily: 'Arial, sans-serif',
				color: '#f1f2f6',
			})
			.setOrigin(0.5);

		const totalScoreText = this.add
			.text(0, 20, `Total score: ${totalScore}`, {
				fontSize: '20px',
				fontFamily: 'Arial, sans-serif',
				color: '#f1f2f6',
			})
			.setOrigin(0.5);

		const buttonLabel = isLastRound ? 'Play Again' : 'Next Round';
		const buttonY = OVERLAY_PANEL_HEIGHT / 2 - 60;
		const buttonWidth = 220;
		const buttonHeight = 50;

		const buttonBg = this.add.rectangle(0, buttonY, buttonWidth, buttonHeight, 0xe74c3c, 1);
		buttonBg.setStrokeStyle(2, 0xffffff, 0.9);

		const buttonText = this.add
			.text(0, buttonY, buttonLabel, {
				fontSize: '24px',
				fontFamily: 'Arial Black, Arial, sans-serif',
				color: '#ffffff',
			})
			.setOrigin(0.5);

		const buttonZone = this.add.zone(0, buttonY, buttonWidth, buttonHeight).setInteractive({ useHandCursor: true });
		buttonZone.on('pointerover', () => {
			buttonBg.setFillStyle(0xff6b6b, 1);
		});
		buttonZone.on('pointerout', () => {
			buttonBg.setFillStyle(0xe74c3c, 1);
		});
		buttonZone.on('pointerdown', () => {
			backdrop.destroy(true);
			this.clearPanel();

			if (isLastRound) {
				this.registry.set(REGISTRY_KEYS.CURRENT_ROUND, 1);
				this.registry.set(REGISTRY_KEYS.TOTAL_SCORE, 0);
				this.registry.set(REGISTRY_KEYS.TOTAL_ROUNDS, ROUND_CONFIGS.length);
				this.scene.stop(SCENE_KEYS.GAME);
				this.scene.start(SCENE_KEYS.MENU);
			} else {
				this.scene.stop(SCENE_KEYS.GAME);
				this.scene.start(SCENE_KEYS.GAME);
			}
		});

		if (PLATFORM_RETURN_URL) {
			const mainX = -buttonWidth / 2 - 10;
			buttonBg.setX(mainX);
			buttonText.setX(mainX);
			buttonZone.setPosition(mainX, buttonY);
		}

		const children: Phaser.GameObjects.GameObject[] = [
			panelBg,
			titleText,
			roundScoreText,
			totalScoreText,
			buttonBg,
			buttonText,
			buttonZone,
		];

		if (PLATFORM_RETURN_URL) {
			const platformX = buttonWidth / 2 + 10;
			const platformButtonBg = this.add.rectangle(platformX, buttonY, buttonWidth, buttonHeight, 0x34495e, 1);
			platformButtonBg.setStrokeStyle(2, 0xffffff, 0.9);

			const platformButtonText = this.add
				.text(platformX, buttonY, 'Back to Platform', {
					fontSize: '20px',
					fontFamily: 'Arial Black, Arial, sans-serif',
					color: '#ffffff',
				})
				.setOrigin(0.5);

			const platformButtonZone = this.add
				.zone(platformX, buttonY, buttonWidth, buttonHeight)
				.setInteractive({ useHandCursor: true });
			platformButtonZone.on('pointerover', () => {
				platformButtonBg.setFillStyle(0x3d566e, 1);
			});
			platformButtonZone.on('pointerout', () => {
				platformButtonBg.setFillStyle(0x34495e, 1);
			});
			platformButtonZone.on('pointerdown', () => {
				if (PLATFORM_RETURN_URL) {
					window.location.href = PLATFORM_RETURN_URL;
				}
			});

			children.push(platformButtonBg, platformButtonText, platformButtonZone);
		}

		panel.add(children);
		this.activePanel = panel;
	}

	private showGameOverPanel(payload: GameOverPayload): void {
		this.clearPanel();

		const { totalScore } = payload;
		const backdrop = this.createBackdrop();

		const panel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
		panel.setDepth(OVERLAY_DEPTH);

		const panelBg = this.add.rectangle(0, 0, OVERLAY_PANEL_WIDTH, OVERLAY_PANEL_HEIGHT, 0x1b1b33, 0.95);
		panelBg.setStrokeStyle(2, 0xffffff, 0.9);

		const titleText = this.add
			.text(0, -OVERLAY_PANEL_HEIGHT / 2 + 40, "Time's Up!", {
				fontSize: '32px',
				fontFamily: 'Arial Black, Arial, sans-serif',
				color: '#ffffff',
				align: 'center',
			})
			.setOrigin(0.5);

		const totalScoreText = this.add
			.text(0, 0, `Final score: ${totalScore}`, {
				fontSize: '20px',
				fontFamily: 'Arial, sans-serif',
				color: '#f1f2f6',
			})
			.setOrigin(0.5);

		const buttonY = OVERLAY_PANEL_HEIGHT / 2 - 60;
		const buttonWidth = 220;
		const buttonHeight = 50;

		const buttonBg = this.add.rectangle(0, buttonY, buttonWidth, buttonHeight, 0xe74c3c, 1);
		buttonBg.setStrokeStyle(2, 0xffffff, 0.9);

		const buttonText = this.add
			.text(0, buttonY, 'Try Again', {
				fontSize: '24px',
				fontFamily: 'Arial Black, Arial, sans-serif',
				color: '#ffffff',
			})
			.setOrigin(0.5);

		const buttonZone = this.add.zone(0, buttonY, buttonWidth, buttonHeight).setInteractive({ useHandCursor: true });
		buttonZone.on('pointerover', () => {
			buttonBg.setFillStyle(0xff6b6b, 1);
		});
		buttonZone.on('pointerout', () => {
			buttonBg.setFillStyle(0xe74c3c, 1);
		});
		buttonZone.on('pointerdown', () => {
			backdrop.destroy(true);
			this.clearPanel();
			this.registry.set(REGISTRY_KEYS.CURRENT_ROUND, 1);
			this.registry.set(REGISTRY_KEYS.TOTAL_SCORE, 0);
			this.registry.set(REGISTRY_KEYS.TOTAL_ROUNDS, ROUND_CONFIGS.length);
			this.scene.stop(SCENE_KEYS.GAME);
			this.scene.start(SCENE_KEYS.MENU);
		});

		if (PLATFORM_RETURN_URL) {
			const mainX = -buttonWidth / 2 - 10;
			buttonBg.setX(mainX);
			buttonText.setX(mainX);
			buttonZone.setPosition(mainX, buttonY);
		}

		const children: Phaser.GameObjects.GameObject[] = [
			panelBg,
			titleText,
			totalScoreText,
			buttonBg,
			buttonText,
			buttonZone,
		];

		if (PLATFORM_RETURN_URL) {
			const platformX = buttonWidth / 2 + 10;
			const platformButtonBg = this.add.rectangle(platformX, buttonY, buttonWidth, buttonHeight, 0x34495e, 1);
			platformButtonBg.setStrokeStyle(2, 0xffffff, 0.9);

			const platformButtonText = this.add
				.text(platformX, buttonY, 'Back to Platform', {
					fontSize: '20px',
					fontFamily: 'Arial Black, Arial, sans-serif',
					color: '#ffffff',
				})
				.setOrigin(0.5);

			const platformButtonZone = this.add
				.zone(platformX, buttonY, buttonWidth, buttonHeight)
				.setInteractive({ useHandCursor: true });
			platformButtonZone.on('pointerover', () => {
				platformButtonBg.setFillStyle(0x3d566e, 1);
			});
			platformButtonZone.on('pointerout', () => {
				platformButtonBg.setFillStyle(0x34495e, 1);
			});
			platformButtonZone.on('pointerdown', () => {
				if (PLATFORM_RETURN_URL) {
					window.location.href = PLATFORM_RETURN_URL;
				}
			});

			children.push(platformButtonBg, platformButtonText, platformButtonZone);
		}

		panel.add(children);
		this.activePanel = panel;
	}
}
