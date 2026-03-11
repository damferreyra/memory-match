import Phaser from 'phaser';
import { SCENE_KEYS } from '../constants';

export class BootScene extends Phaser.Scene {
	constructor() {
		super({ key: SCENE_KEYS.BOOT });
	}

	preload(): void {
		// No external assets — all Graphics-drawn
	}

	create(): void {
		this.scene.start(SCENE_KEYS.MENU);
	}
}
