import { GameConfig } from './types';

// Simple game implementations that can work without Phaser initially
export class SimpleUrbanRunner {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: any;
  private animationId: number | null = null;
  private onScoreUpdate: (score: number) => void;
  private onGameEnd: (result: any) => void;

  constructor(
    canvas: HTMLCanvasElement, 
    config: GameConfig,
    onScoreUpdate: (score: number) => void,
    onGameEnd: (result: any) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameEnd = onGameEnd;
    
    this.gameState = {
      player: { x: 100, y: 400, width: 32, height: 48, velocityY: 0 },
      obstacles: [],
      coins: [],
      score: 0,
      isPlaying: false,
      gameSpeed: 2,
      gravity: 0.5,
      jumpPower: -12
    };

    this.setupCanvas();
    this.setupInput();
  }

  private setupCanvas() {
    this.canvas.width = 800;
    this.canvas.height = 600;
    this.canvas.style.background = '#87CEEB';
  }

  private setupInput() {
    const handleJump = () => {
      if (this.gameState.player.y >= 400) {
        this.gameState.player.velocityY = this.gameState.jumpPower;
      }
    };

    // Touch/mouse input
    this.canvas.addEventListener('click', handleJump);
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleJump();
    });

    // Keyboard input
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      }
    });
  }

  start() {
    this.gameState.isPlaying = true;
    this.gameLoop();
  }

  stop() {
    this.gameState.isPlaying = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private gameLoop() {
    if (!this.gameState.isPlaying) return;

    this.update();
    this.render();
    
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  private update() {
    // Update player physics
    this.gameState.player.velocityY += this.gameState.gravity;
    this.gameState.player.y += this.gameState.player.velocityY;

    // Keep player on ground
    if (this.gameState.player.y > 400) {
      this.gameState.player.y = 400;
      this.gameState.player.velocityY = 0;
    }

    // Spawn obstacles
    if (Math.random() < 0.02) {
      this.gameState.obstacles.push({
        x: this.canvas.width,
        y: 420,
        width: 40,
        height: 40
      });
    }

    // Spawn coins
    if (Math.random() < 0.03) {
      this.gameState.coins.push({
        x: this.canvas.width,
        y: Math.random() * 200 + 200,
        width: 24,
        height: 24
      });
    }

    // Update obstacles
    this.gameState.obstacles = this.gameState.obstacles.filter((obstacle: any) => {
      obstacle.x -= this.gameState.gameSpeed;
      return obstacle.x > -obstacle.width;
    });

    // Update coins
    this.gameState.coins = this.gameState.coins.filter((coin: any) => {
      coin.x -= this.gameState.gameSpeed;
      return coin.x > -coin.width;
    });

    // Check collisions
    this.checkCollisions();
  }

  private checkCollisions() {
    const player = this.gameState.player;

    // Obstacle collisions
    this.gameState.obstacles.forEach((obstacle: any, index: number) => {
      if (this.isColliding(player, obstacle)) {
        this.endGame();
      }
    });

    // Coin collections
    this.gameState.coins = this.gameState.coins.filter((coin: any) => {
      if (this.isColliding(player, coin)) {
        this.gameState.score += 10;
        this.onScoreUpdate(this.gameState.score);
        return false;
      }
      return true;
    });
  }

  private isColliding(obj1: any, obj2: any): boolean {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
  }

  private render() {
    // Clear canvas
    this.ctx.fillStyle = '#87CEEB';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw ground
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(0, 460, this.canvas.width, 140);

    // Draw player
    this.ctx.fillStyle = '#0099ff';
    this.ctx.fillRect(
      this.gameState.player.x,
      this.gameState.player.y,
      this.gameState.player.width,
      this.gameState.player.height
    );

    // Draw obstacles
    this.ctx.fillStyle = '#ff3300';
    this.gameState.obstacles.forEach((obstacle: any) => {
      this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });

    // Draw coins
    this.ctx.fillStyle = '#ffff00';
    this.gameState.coins.forEach((coin: any) => {
      this.ctx.beginPath();
      this.ctx.arc(
        coin.x + coin.width / 2,
        coin.y + coin.height / 2,
        coin.width / 2,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
    });

    // Draw score
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`Score: ${this.gameState.score}`, 20, 40);
    
    // Draw instructions
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText('Click or press Space to jump!', 20, this.canvas.height - 20);
  }

  private endGame() {
    this.stop();
    const result = {
      gameId: 'urban-runner',
      score: this.gameState.score,
      duration: 0, // Will be calculated by parent
      completed: true
    };
    this.onGameEnd(result);
  }
}

// Export game factory
export const createSimpleGame = (
  gameType: string,
  canvas: HTMLCanvasElement,
  config: GameConfig,
  onScoreUpdate: (score: number) => void,
  onGameEnd: (result: any) => void
) => {
  switch (gameType) {
    case 'urban-runner':
      return new SimpleUrbanRunner(canvas, config, onScoreUpdate, onGameEnd);
    default:
      return new SimpleUrbanRunner(canvas, config, onScoreUpdate, onGameEnd);
  }
};
