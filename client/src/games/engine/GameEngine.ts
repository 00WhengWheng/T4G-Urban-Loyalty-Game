import { GameConfig, GameResult, GameState, PhaserGameInstance, GameEvents } from '../types';

export class GameEngine {
  private static instance: GameEngine;
  private currentGame: PhaserGameInstance | null = null;
  private gameState: GameState;
  private eventCallbacks: Partial<GameEvents> = {};

  private constructor() {
    this.gameState = {
      currentGame: null,
      isPlaying: false,
      isPaused: false,
      score: 0,
      timeRemaining: 0,
      lives: 3,
      level: 1,
    };
  }

  static getInstance(): GameEngine {
    if (!GameEngine.instance) {
      GameEngine.instance = new GameEngine();
    }
    return GameEngine.instance;
  }

  async initializeGame(config: GameConfig, containerId: string): Promise<void> {
    // Clean up any existing game
    this.destroyCurrentGame();

    try {
      // Import Phaser dynamically to avoid SSR issues
      const Phaser = await import('phaser');

      const gameConfig = {
        type: Phaser.AUTO,
        parent: containerId,
        width: this.getGameWidth(),
        height: this.getGameHeight(),
        backgroundColor: '#2c3e50',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: config.type === 'urban-runner' ? 500 : 0, x: 0 },
            debug: false
          }
        },
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          parent: containerId,
          width: this.getGameWidth(),
          height: this.getGameHeight(),
        },
        input: {
          activePointers: 3, // Support multi-touch
        },
        scene: [], // Will be populated based on game type
      };

      // Create the game instance
      const game = new Phaser.Game(gameConfig);
      
      this.currentGame = {
        game,
        scene: null,
        destroy: () => this.destroyGame(game),
        pause: () => this.pauseGame(),
        resume: () => this.resumeGame(),
        restart: () => this.restartGame(config, containerId),
      };

      this.gameState.currentGame = config.id;
      
      // Load the appropriate scene based on game type
      await this.loadGameScene(config, game);
      
    } catch (error) {
      console.error('Failed to initialize game:', error);
      throw new Error('Game initialization failed');
    }
  }

  private async loadGameScene(config: GameConfig, game: any): Promise<void> {
    try {
      let SceneClass;
      
      switch (config.type) {
        case 'urban-runner':
          try {
            const { UrbanRunnerScene } = await import('../mini-games/urban-runner/UrbanRunnerScene');
            SceneClass = UrbanRunnerScene;
          } catch {
            const { DefaultScene } = await import('../scenes/DefaultScene');
            SceneClass = DefaultScene;
          }
          break;
        case 'trash-collector':
          try {
            const { TrashCollectorScene } = await import('../mini-games/trash-collector/TrashCollectorScene');
            SceneClass = TrashCollectorScene;
          } catch {
            const { DefaultScene } = await import('../scenes/DefaultScene');
            SceneClass = DefaultScene;
          }
          break;
        default:
          const { DefaultScene } = await import('../scenes/DefaultScene');
          SceneClass = DefaultScene;
      }

      const scene = new SceneClass(config, this);
      game.scene.add(config.id, scene);
      game.scene.start(config.id);
      this.currentGame!.scene = scene;
      
    } catch (error) {
      console.error('Failed to load game scene:', error);
      // Fallback to default scene
      const { DefaultScene } = await import('../scenes/DefaultScene');
      const scene = new DefaultScene(config, this);
      game.scene.add(config.id, scene);
      game.scene.start(config.id);
      this.currentGame!.scene = scene;
    }
  }

  private getGameWidth(): number {
    if (typeof window !== 'undefined') {
      const containerWidth = Math.min(window.innerWidth - 32, 800);
      return containerWidth;
    }
    return 800;
  }

  private getGameHeight(): number {
    if (typeof window !== 'undefined') {
      const aspectRatio = window.innerWidth < 768 ? 4/3 : 16/9;
      const containerWidth = this.getGameWidth();
      return Math.min(containerWidth / aspectRatio, window.innerHeight - 200);
    }
    return 600;
  }

  startGame(): void {
    if (this.currentGame?.scene) {
      this.gameState.isPlaying = true;
      this.gameState.isPaused = false;
      this.eventCallbacks.onGameStart?.();
    }
  }

  pauseGame(): void {
    if (this.currentGame?.game && this.gameState.isPlaying) {
      this.gameState.isPaused = true;
      this.currentGame.game.scene.pause(this.gameState.currentGame!);
      this.eventCallbacks.onGamePause?.();
    }
  }

  resumeGame(): void {
    if (this.currentGame?.game && this.gameState.isPaused) {
      this.gameState.isPaused = false;
      this.currentGame.game.scene.resume(this.gameState.currentGame!);
      this.eventCallbacks.onGameResume?.();
    }
  }

  endGame(result: GameResult): void {
    this.gameState.isPlaying = false;
    this.gameState.isPaused = false;
    this.eventCallbacks.onGameEnd?.(result);
  }

  updateScore(score: number): void {
    this.gameState.score = score;
    this.eventCallbacks.onScoreUpdate?.(score);
  }

  levelUp(level: number): void {
    this.gameState.level = level;
    this.eventCallbacks.onLevelUp?.(level);
  }

  async restartGame(config: GameConfig, containerId: string): Promise<void> {
    await this.initializeGame(config, containerId);
    this.startGame();
  }

  destroyCurrentGame(): void {
    if (this.currentGame) {
      this.destroyGame(this.currentGame.game);
    }
  }

  private destroyGame(game: any): void {
    if (game && typeof game.destroy === 'function') {
      game.destroy();
    }
    this.currentGame = null;
    this.gameState = {
      currentGame: null,
      isPlaying: false,
      isPaused: false,
      score: 0,
      timeRemaining: 0,
      lives: 3,
      level: 1,
    };
  }

  getGameState(): GameState {
    return { ...this.gameState };
  }

  getCurrentGame(): PhaserGameInstance | null {
    return this.currentGame;
  }

  setEventCallbacks(callbacks: Partial<GameEvents>): void {
    this.eventCallbacks = { ...this.eventCallbacks, ...callbacks };
  }

  // Mobile-specific methods
  isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  adjustForMobile(): void {
    if (this.isMobile() && this.currentGame?.game) {
      // Enable touch input
      if (this.currentGame.game.input?.touch) {
        this.currentGame.game.input.touch.enabled = true;
      }
      
      // Adjust scale for mobile devices
      const scale = this.currentGame.game.scale;
      if (scale && scale.resize) {
        scale.resize(this.getGameWidth(), this.getGameHeight());
      }
    }
  }

  // Asset loading helpers
  preloadAssets(scene: any, assets: { sprites: string[], audio: string[], textures: string[] }): void {
    try {
      // Load sprites
      assets.sprites.forEach(sprite => {
        if (scene.load && scene.load.image) {
          scene.load.image(sprite, `/games/assets/${sprite}.png`);
        }
      });

      // Load audio
      assets.audio.forEach(audio => {
        if (scene.load && scene.load.audio) {
          scene.load.audio(audio, `/games/audio/${audio}.mp3`);
        }
      });

      // Load textures
      assets.textures.forEach(texture => {
        if (scene.load && scene.load.image) {
          scene.load.image(texture, `/games/assets/${texture}.png`);
        }
      });
    } catch (error) {
      console.error('Error preloading assets:', error);
    }
  }
}
