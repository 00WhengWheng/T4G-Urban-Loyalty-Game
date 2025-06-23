import { GameConfig } from '../../types';
import { BaseScene } from '../../scenes/DefaultScene';

export class UrbanRunnerScene extends BaseScene {
  private player: any;
  private obstacles: any[] = [];
  private coins: any[] = [];
  private cursors: any;
  private gameTimer: any;
  private scoreText: any;
  private livesText: any;
  private gameSpeed: number = 200;
  private isGameRunning: boolean = false;

  constructor(config: GameConfig, gameEngine: any) {
    super(config, gameEngine);
  }

  preload(): void {
    // Create simple colored rectangles as placeholders for sprites
    this.createColoredRectangles();
    console.log('Urban Runner: Assets loaded');
  }

  create(): void {
    console.log('Urban Runner: Creating game scene');
    
    // Create game world
    this.createBackground();
    this.createPlayer();
    this.createUI();
    this.setupInput();
    this.setupGameTimer();
    
    this.isGameRunning = true;
    console.log('Urban Runner: Game scene created');
  }

  update(): void {
    if (!this.isGameRunning) return;

    this.updatePlayer();
    this.updateObstacles();
    this.updateCoins();
    this.checkCollisions();
    this.spawnGameObjects();
  }

  private createColoredRectangles(): void {
    // Create colored rectangles as sprite placeholders
    const graphics = this.add?.graphics();
    if (!graphics) return;

    // Player sprite (blue rectangle)
    graphics.fillStyle(0x0099ff);
    graphics.fillRect(0, 0, 32, 48);
    graphics.generateTexture('player', 32, 48);

    // Obstacle sprite (red rectangle)
    graphics.clear();
    graphics.fillStyle(0xff3300);
    graphics.fillRect(0, 0, 40, 40);
    graphics.generateTexture('obstacle', 40, 40);

    // Coin sprite (yellow circle)
    graphics.clear();
    graphics.fillStyle(0xffff00);
    graphics.fillCircle(16, 16, 16);
    graphics.generateTexture('coin', 32, 32);

    // Background elements
    graphics.clear();
    graphics.fillStyle(0x666666);
    graphics.fillRect(0, 0, 800, 600);
    graphics.generateTexture('road', 800, 600);
  }

  private createBackground(): void {
    if (this.add?.image) {
      // Add road background
      const bg = this.add.image(400, 300, 'road');
      bg.setDisplaySize(800, 600);
    }
  }

  private createPlayer(): void {
    if (this.add?.sprite && this.physics?.add) {
      this.player = this.physics.add.sprite(100, 500, 'player');
      this.player.setCollideWorldBounds(true);
      this.player.setBounce(0.2);
      
      // Player physics
      this.player.body.setGravityY(300);
    }
  }

  private createUI(): void {
    if (this.add?.text) {
      this.scoreText = this.add.text(16, 16, 'Score: 0', {
        fontSize: '24px',
        color: '#ffffff'
      });
      
      this.livesText = this.add.text(16, 50, 'Lives: 3', {
        fontSize: '24px',
        color: '#ffffff'
      });
    }
  }

  private setupInput(): void {
    // Keyboard input
    if (this.input?.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
    }

    // Touch/mouse input for jumping
    if (this.input) {
      this.input.on('pointerdown', () => {
        this.playerJump();
      });
    }
  }

  private setupGameTimer(): void {
    if (this.time?.addEvent) {
      this.gameTimer = this.time.addEvent({
        delay: this.config.maxDuration * 1000,
        callback: this.endGame,
        callbackScope: this
      });
    }
  }

  private updatePlayer(): void {
    if (!this.player || !this.cursors) return;

    // Horizontal movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);
    } else {
      this.player.setVelocityX(0);
    }

    // Jumping
    if (this.cursors.up.isDown && this.player.body.touching.down) {
      this.playerJump();
    }
  }

  private playerJump(): void {
    if (this.player && this.player.body.touching.down) {
      this.player.setVelocityY(-330);
    }
  }

  private updateObstacles(): void {
    this.obstacles.forEach((obstacle, index) => {
      obstacle.x -= this.gameSpeed * 0.016; // 60 FPS assumption
      
      if (obstacle.x < -50) {
        obstacle.destroy();
        this.obstacles.splice(index, 1);
      }
    });
  }

  private updateCoins(): void {
    this.coins.forEach((coin, index) => {
      coin.x -= this.gameSpeed * 0.016;
      
      if (coin.x < -50) {
        coin.destroy();
        this.coins.splice(index, 1);
      }
    });
  }

  private spawnGameObjects(): void {
    // Spawn obstacles randomly
    if (Math.random() < 0.02 && this.physics?.add) {
      const obstacle = this.physics.add.sprite(850, 500, 'obstacle');
      this.obstacles.push(obstacle);
    }

    // Spawn coins randomly
    if (Math.random() < 0.03 && this.physics?.add) {
      const coin = this.physics.add.sprite(850, Math.random() * 400 + 100, 'coin');
      this.coins.push(coin);
    }
  }

  private checkCollisions(): void {
    if (!this.player) return;

    // Check obstacle collisions
    this.obstacles.forEach((obstacle, index) => {
      if (this.checkOverlap(this.player, obstacle)) {
        this.hitObstacle();
        obstacle.destroy();
        this.obstacles.splice(index, 1);
      }
    });

    // Check coin collection
    this.coins.forEach((coin, index) => {
      if (this.checkOverlap(this.player, coin)) {
        this.collectCoin();
        coin.destroy();
        this.coins.splice(index, 1);
      }
    });
  }

  private checkOverlap(obj1: any, obj2: any): boolean {
    if (!obj1 || !obj2) return false;
    
    const bounds1 = obj1.getBounds ? obj1.getBounds() : { x: obj1.x - 16, y: obj1.y - 24, width: 32, height: 48 };
    const bounds2 = obj2.getBounds ? obj2.getBounds() : { x: obj2.x - 20, y: obj2.y - 20, width: 40, height: 40 };
    
    return bounds1.x < bounds2.x + bounds2.width &&
           bounds1.x + bounds1.width > bounds2.x &&
           bounds1.y < bounds2.y + bounds2.height &&
           bounds1.y + bounds1.height > bounds2.y;
  }

  private hitObstacle(): void {
    const currentState = this.gameEngine.getGameState();
    const newLives = currentState.lives - 1;
    
    if (this.livesText) {
      this.livesText.setText(`Lives: ${newLives}`);
    }
    
    if (newLives <= 0) {
      this.endGame();
    }
  }

  private collectCoin(): void {
    const currentState = this.gameEngine.getGameState();
    const newScore = currentState.score + 10;
    
    this.gameEngine.updateScore(newScore);
    
    if (this.scoreText) {
      this.scoreText.setText(`Score: ${newScore}`);
    }
  }

  private endGame(): void {
    this.isGameRunning = false;
    
    const finalState = this.gameEngine.getGameState();
    const gameResult = {
      gameId: this.config.id,
      score: finalState.score,
      duration: this.config.maxDuration - (this.gameTimer?.getRemainingSeconds() || 0),
      completed: true,
      metadata: {
        level: finalState.level,
        obstaclesHit: 3 - finalState.lives
      }
    };
    
    this.gameEngine.endGame(gameResult);
  }
}
