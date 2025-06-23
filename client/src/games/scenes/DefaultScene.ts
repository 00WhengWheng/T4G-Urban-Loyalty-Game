/// <reference path="../types/phaser.d.ts" />
import { GameConfig } from '../types';

export abstract class BaseScene {
  protected config: GameConfig;
  protected gameEngine: any;
  
  constructor(config: GameConfig, gameEngine: any) {
    this.config = config;
    this.gameEngine = gameEngine;
  }

  abstract preload(): void;
  abstract create(): void;
  abstract update(): void;

  protected loadAssets(): void {
    // Basic asset loading implementation
    if (this.config.assets.sprites.length > 0) {
      console.log('Loading sprites:', this.config.assets.sprites);
    }
  }

  protected setupInput(): void {
    // Basic input setup for mobile and desktop
    console.log('Setting up input controls');
  }

  protected startGameTimer(): void {
    // Game timer implementation
    console.log('Starting game timer');
  }
}

export class DefaultScene extends BaseScene {
  private score: number = 0;
  private gameObjects: any[] = [];

  preload(): void {
    this.loadAssets();
  }

  create(): void {
    this.setupInput();
    this.startGameTimer();
    
    // Create basic game elements
    this.createBackground();
    this.createUI();
  }

  update(): void {
    // Game update loop
    this.updateGameObjects();
  }

  private createBackground(): void {
    // Create a simple background
    console.log('Creating background');
  }

  private createUI(): void {
    // Create UI elements
    console.log('Creating UI');
  }

  private updateGameObjects(): void {
    // Update game objects
    this.gameObjects.forEach(obj => {
      if (obj.update) {
        obj.update();
      }
    });
  }

  protected updateScore(points: number): void {
    this.score += points;
    this.gameEngine.updateScore(this.score);
  }
}
