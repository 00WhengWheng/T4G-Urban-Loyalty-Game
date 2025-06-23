import Phaser from 'phaser';
import { GameConfig } from '../types';

// Minimal Phaser Scene implementation
export class DefaultScene extends Phaser.Scene {
  private config: GameConfig;
  private gameEngine: any;
  private score: number = 0;

  constructor(config: GameConfig, gameEngine: any) {
    // Pass scene config to Phaser.Scene
    super({ key: config.id });
    this.config = config;
    this.gameEngine = gameEngine;
  }

  preload(): void {
    console.log('Preloading assets for:', this.config.name);
    // Add a simple colored rectangle as a placeholder
    this.load.image('placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
  }

  create(): void {
    console.log('Creating scene for:', this.config.name);
    
    // Add a simple background
    const graphics = this.add.graphics();
    graphics.fillStyle(0x2563eb); // Blue background
    graphics.fillRect(0, 0, this.scale.width, this.scale.height);
    
    // Add title text
    const titleText = this.add.text(
      this.scale.width / 2, 
      this.scale.height / 2 - 50, 
      this.config.name, 
      {
        fontSize: '32px',
        color: '#ffffff',
        fontFamily: 'Arial'
      }
    ).setOrigin(0.5);

    // Add score text
    const scoreText = this.add.text(
      this.scale.width / 2, 
      this.scale.height / 2 + 50, 
      `Score: ${this.score}`, 
      {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial'
      }
    ).setOrigin(0.5);

    // Add click to increase score
    this.input.on('pointerdown', () => {
      this.updateScore(this.score + 10);
      scoreText.setText(`Score: ${this.score}`);
    });
  }

  update(): void {
    // Simple update - nothing needed for now
  }

  public updateScore(newScore: number): void {
    this.score = newScore;
    this.gameEngine?.updateScore?.(newScore);
  }

  public getScore(): number {
    return this.score;
  }

  public destroy(): void {
    console.log('Scene destroyed');
    super.destroy();
  }
}

export default DefaultScene;
