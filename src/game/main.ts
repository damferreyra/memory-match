import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';

export function StartGame(containerId: string): Phaser.Game {
	return new Phaser.Game({
		type: Phaser.AUTO,
		width: GAME_WIDTH,
		height: GAME_HEIGHT,
		backgroundColor: '#1a1a2e',
		parent: containerId,
		scene: [BootScene, MenuScene, GameScene, UIScene],
	});
}
