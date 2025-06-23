import { GameConfig, GameResult, GameState, PhaserGameInstance, GameEvents } from '../types';
import { AssetManager } from '../assets/AssetManager';

export class GameEngine {
  private static instance: GameEngine;
  private currentGame: PhaserGameInstance | null = null;
  private gameState: GameState;
  private eventCallbacks: Partial<GameEvents> = {};
  private assetManager: AssetManager;
  private performanceMonitor: PerformanceMonitor;

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
    this.assetManager = AssetManager.getInstance();
    this.performanceMonitor = new PerformanceMonitor();
  }

  static getInstance(): GameEngine {
    if (!GameEngine.instance) {
      GameEngine.instance = new GameEngine();
    }
    return GameEngine.instance;
  }

  async initializeGame(config: GameConfig, containerId: string): Promise<void> {
    try {
      this.performanceMonitor.startTiming('gameInit');
      
      // Clean up any existing game
      await this.destroyCurrentGame();

      // Validate environment
      if (typeof window === 'undefined') {
        throw new Error('Game engine requires browser environment');
      }

      // Import Phaser with error handling
      const Phaser = await this.loadPhaser();
      
      // Create optimized game configuration
      const gameConfig = this.createGameConfig(Phaser, config, containerId);
      
      // Create the game instance with error handling
      const game = new Phaser.Game(gameConfig);
      
      // Wrap game instance
      this.currentGame = {
        game,
        scene: null,
        destroy: () => this.destroyGame(game),
        pause: () => this.pauseGame(),
        resume: () => this.resumeGame(),
        restart: () => this.restartGame(config, containerId),
      };

      this.gameState.currentGame = config.id;
      
      // Load the appropriate scene
      await this.loadGameScene(config, game);
      
      // Setup performance monitoring
      this.performanceMonitor.endTiming('gameInit');
      this.setupPerformanceMonitoring(game);
      
    } catch (error) {
      this.performanceMonitor.endTiming('gameInit');
      console.error('Failed to initialize game:', error);
      throw new Error(`Game initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async loadPhaser(): Promise<typeof import('phaser')> {
    try {
      return await import('phaser');
    } catch (error) {
      console.error('Failed to load Phaser.js:', error);
      throw new Error('Failed to load Phaser.js library. Please check your internet connection.');
    }
  }

  private createGameConfig(Phaser: any, config: GameConfig, containerId: string): any {
    const isMobile = this.isMobile();
    
    return {
      type: Phaser.AUTO,
      parent: containerId,
      width: this.getGameWidth(),
      height: this.getGameHeight(),
      backgroundColor: config.backgroundColor || '#2c3e50',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { 
            y: config.physics?.gravity?.y ?? (config.type === 'urban-runner' ? 500 : 0), 
            x: config.physics?.gravity?.x ?? 0 
          },
          debug: process.env.NODE_ENV === 'development'
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
        activePointers: isMobile ? 3 : 1,
        smoothFactor: isMobile ? 0.2 : 0,
      },
      audio: {
        disableWebAudio: false,
      },
      render: {
        antialias: true,
        pixelArt: false,
        roundPixels: true,
      },
      fps: {
        target: 60,
        forceSetTimeOut: false,
      },
      scene: [],
    };
  }

  private async loadGameScene(config: GameConfig, game: any): Promise<void> {
    try {
      let SceneClass;
      
      // Dynamic scene loading with fallback strategy
      switch (config.type) {
        case 'urban-runner':
          SceneClass = await this.loadSceneWithFallback(
            () => import('../mini-games/urban-runner/UrbanRunnerScene'),
            'UrbanRunnerScene'
          );
          break;
        case 'trash-collector':
          SceneClass = await this.loadSceneWithFallback(
            () => import('../mini-games/trash-collector/TrashCollectorScene'),
            'TrashCollectorScene'
          );
          break;
        case 'traffic-master':
          SceneClass = await this.loadSceneWithFallback(
            () => import('../mini-games/traffic-master/TrafficMasterScene'),
            'TrafficMasterScene'
          );
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
      await this.loadFallbackScene(config, game);
    }
  }

  private async loadSceneWithFallback(
    sceneLoader: () => Promise<any>, 
    sceneClassName: string
  ): Promise<any> {
    try {
      const module = await sceneLoader();
      return module[sceneClassName];
    } catch (error) {
      console.warn(`Failed to load ${sceneClassName}, using fallback`);
      const { DefaultScene } = await import('../scenes/DefaultScene');
      return DefaultScene;
    }
  }

  private async loadFallbackScene(config: GameConfig, game: any): Promise<void> {
    try {
      const { DefaultScene } = await import('../scenes/DefaultScene');
      const scene = new DefaultScene(config, this);
      game.scene.add(config.id, scene);
      game.scene.start(config.id);
      this.currentGame!.scene = scene;
    } catch (fallbackError) {
      console.error('Failed to load fallback scene:', fallbackError);
      throw new Error('Unable to load any game scene');
    }
  }

  private setupPerformanceMonitoring(game: any): void {
    if (process.env.NODE_ENV === 'development') {
      // Monitor FPS
      game.events.on('step', () => {
        this.performanceMonitor.recordFPS(game.loop.actualFps);
      });
    }
  }

  // Enhanced mobile detection and optimization
  isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
    const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
    const isMobileScreen = window.innerWidth <= 768;
    const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    return isMobileUA || (isMobileScreen && hasTouchSupport);
  }

  private getGameWidth(): number {
    if (typeof window === 'undefined') return 800;
    
    if (this.isMobile()) {
      return Math.min(window.innerWidth, 800);
    }
    return 800;
  }

  private getGameHeight(): number {
    if (typeof window === 'undefined') return 600;
    
    if (this.isMobile()) {
      return Math.min(window.innerHeight * 0.8, 600);
    }
    return 600;
  }

  // Game state management
  getGameState(): GameState {
    return { ...this.gameState };
  }

  updateScore(newScore: number): void {
    this.gameState.score = newScore;
    this.notifyCallbacks('onScoreUpdate', newScore);
  }

  updateTimeRemaining(time: number): void {
    this.gameState.timeRemaining = time;
    // Note: onTimeUpdate not in GameEvents interface, handle internally
  }

  updateLives(lives: number): void {
    this.gameState.lives = lives;
    // Note: onLivesUpdate not in GameEvents interface, handle internally
  }

  // Game control methods
  async pauseGame(): Promise<void> {
    if (this.currentGame?.game && this.gameState.currentGame) {
      this.gameState.isPaused = true;
      this.currentGame.game.scene.pause(this.gameState.currentGame);
      this.notifyCallbacks('onGamePause');
    }
  }

  async resumeGame(): Promise<void> {
    if (this.currentGame?.game && this.gameState.currentGame) {
      this.gameState.isPaused = false;
      this.currentGame.game.scene.resume(this.gameState.currentGame);
      this.notifyCallbacks('onGameResume');
    }
  }

  async restartGame(config: GameConfig, containerId: string): Promise<void> {
    await this.destroyCurrentGame();
    this.resetGameState();
    await this.initializeGame(config, containerId);
  }

  async destroyCurrentGame(): Promise<void> {
    if (this.currentGame) {
      try {
        if (this.currentGame.game) {
          this.currentGame.game.destroy(true);
        }
      } catch (error) {
        console.warn('Error destroying game:', error);
      }
      this.currentGame = null;
    }
    this.resetGameState();
  }

  private destroyGame(game: any): void {
    try {
      if (game && !game.isDestroyed) {
        game.destroy(true);
      }
    } catch (error) {
      console.warn('Error in destroyGame:', error);
    }
  }

  private resetGameState(): void {
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

  // Event handling
  on<K extends keyof GameEvents>(event: K, callback: GameEvents[K]): void {
    this.eventCallbacks[event] = callback;
  }

  off(event: keyof GameEvents): void {
    delete this.eventCallbacks[event];
  }

  private notifyCallbacks<K extends keyof GameEvents>(event: K, data?: any): void {
    const callback = this.eventCallbacks[event];
    if (callback) {
      try {
        (callback as any)(data);
      } catch (error) {
        console.error(`Error in event callback ${event}:`, error);
      }
    }
  }

  // Game end handling
  endGame(result: GameResult): void {
    this.gameState.isPlaying = false;
    this.notifyCallbacks('onGameEnd', result);
  }

  // Start game
  startGame(): void {
    this.gameState.isPlaying = true;
    this.gameState.isPaused = false;
    this.notifyCallbacks('onGameStart');
  }

  // Asset loading integration
  async preloadAssets(config: GameConfig): Promise<void> {
    try {
      // Note: Asset manager expects scene, skip for now
      console.log('Asset preloading requested for:', config.id);
    } catch (error) {
      console.warn('Failed to preload assets:', error);
      // Game can still run without preloaded assets
    }
  }

  // Performance monitoring access
  getPerformanceMetrics(): any {
    return {
      timings: this.performanceMonitor.getTimings(),
      averageFPS: this.performanceMonitor.getAverageFPS(),
      metrics: this.performanceMonitor.getTimings()
    };
  }
}

class PerformanceMonitor {
  private timings: Map<string, number> = new Map();
  private fpsHistory: number[] = [];

  startTiming(label: string): void {
    this.timings.set(label, performance.now());
  }

  endTiming(label: string): number {
    const start = this.timings.get(label);
    if (start) {
      const duration = performance.now() - start;
      console.log(`${label}: ${duration.toFixed(2)}ms`);
      this.timings.delete(label);
      return duration;
    }
    return 0;
  }

  recordFPS(fps: number): void {
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > 60) {
      this.fpsHistory.shift();
    }
    
    // Warn if FPS is consistently low
    if (this.fpsHistory.length === 60) {
      const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / 60;
      if (avgFPS < 30) {
        console.warn('Low FPS detected:', avgFPS);
      }
    }
  }

  getTimings(): Map<string, number> {
    return this.timings;
  }

  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 0;
    return this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
  }

  getMetrics(): { averageFPS: number; timingsCount: number } {
    return {
      averageFPS: this.getAverageFPS(),
      timingsCount: this.timings.size
    };
  }
}