import Phaser from 'phaser';
import { GameConfig } from '../../types';

interface TrashItem {
  sprite: Phaser.Physics.Arcade.Sprite;
  type: 'plastic' | 'paper' | 'glass' | 'organic';
  points: number;
  isCollected: boolean;
}

interface RecycleBin {
  sprite: Phaser.GameObjects.Sprite;
  type: 'plastic' | 'paper' | 'glass' | 'organic';
  x: number;
  y: number;
  capacity: number;
  currentLoad: number;
}

export class TrashCollectorScene extends Phaser.Scene {
  private config: GameConfig;
  private gameEngine: any;
  private player: any;
  private trashItems: TrashItem[] = [];
  private recycleBins: RecycleBin[] = [];
  private cursors: any;
  private wasdKeys: any;
  private gameTimer: any;
  private scoreText: any;
  private timeText: any;
  private collectedText: any;
  private powerUpText: any;
  private gameSpeed: number = 1;
  private isGameRunning: boolean = false;
  private trashCollected: number = 0;
  private playerInventory: { [key: string]: number } = {
    plastic: 0,
    paper: 0,
    glass: 0,
    organic: 0
  };
  private spawnTimer: number = 0;
  private powerUpTimer: number = 0;
  private speedBoostActive: boolean = false;
  private speedBoostTimer: number = 0;
  private magnetActive: boolean = false;
  private magnetTimer: number = 0;
  private cityAreas: { x: number; y: number; width: number; height: number }[] = [];

  constructor(config: GameConfig, gameEngine: any) {
    super({ key: config.id });
    this.config = config;
    this.gameEngine = gameEngine;
  }

  preload(): void {
    this.createColoredRectangles();
    console.log('Trash Collector: Assets loaded');
  }

  create(): void {
    console.log('Trash Collector: Creating game scene');
    
    this.createBackground();
    this.createPlayer();
    this.createRecycleBins();
    this.createUI();
    this.setupInput();
    this.setupGameTimer();
    this.setupCityAreas();
    this.spawnInitialTrash();
    
    this.isGameRunning = true;
    console.log('Trash Collector: Game scene created');
  }

  update(time: number, delta: number): void {
    if (!this.isGameRunning) return;

    this.updatePlayer();
    this.updateTrashItems();
    this.updatePowerUps(delta);
    this.spawnTrash(delta);
    this.checkTrashCollection();
    this.checkBinDeposits();
    this.updateUI();
  }

  private createColoredRectangles(): void {
    const graphics = this.add?.graphics();
    if (!graphics) return;

    // Player sprite (green circle - eco warrior)
    graphics.fillStyle(0x00cc44);
    graphics.fillCircle(16, 16, 16);
    graphics.generateTexture('player', 32, 32);

    // Trash types
    // Plastic bottles (blue)
    graphics.clear();
    graphics.fillStyle(0x3366ff);
    graphics.fillRoundedRect(0, 0, 16, 24, 4);
    graphics.generateTexture('trash-plastic', 16, 24);

    // Paper (white/gray)
    graphics.clear();
    graphics.fillStyle(0xdddddd);
    graphics.fillRect(0, 0, 20, 16);
    graphics.generateTexture('trash-paper', 20, 16);

    // Glass bottles (green)
    graphics.clear();
    graphics.fillStyle(0x44aa44);
    graphics.fillRoundedRect(0, 0, 14, 28, 3);
    graphics.generateTexture('trash-glass', 14, 28);

    // Organic waste (brown)
    graphics.clear();
    graphics.fillStyle(0x8b4513);
    graphics.fillCircle(12, 12, 12);
    graphics.generateTexture('trash-organic', 24, 24);

    // Recycle bins
    // Plastic bin (blue)
    graphics.clear();
    graphics.fillStyle(0x0066cc);
    graphics.fillRect(0, 0, 40, 50);
    graphics.fillStyle(0x004499);
    graphics.fillRect(5, 10, 30, 35);
    graphics.generateTexture('bin-plastic', 40, 50);

    // Paper bin (white)
    graphics.clear();
    graphics.fillStyle(0xffffff);
    graphics.fillRect(0, 0, 40, 50);
    graphics.fillStyle(0xcccccc);
    graphics.fillRect(5, 10, 30, 35);
    graphics.generateTexture('bin-paper', 40, 50);

    // Glass bin (green)
    graphics.clear();
    graphics.fillStyle(0x228b22);
    graphics.fillRect(0, 0, 40, 50);
    graphics.fillStyle(0x1a6b1a);
    graphics.fillRect(5, 10, 30, 35);
    graphics.generateTexture('bin-glass', 40, 50);

    // Organic bin (brown)
    graphics.clear();
    graphics.fillStyle(0x8b4513);
    graphics.fillRect(0, 0, 40, 50);
    graphics.fillStyle(0x6b3410);
    graphics.fillRect(5, 10, 30, 35);
    graphics.generateTexture('bin-organic', 40, 50);

    // Power-ups
    // Speed boost (yellow star)
    graphics.clear();
    graphics.fillStyle(0xffff00);
    // Create star shape manually
    graphics.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 144) * Math.PI / 180;
      const x = 16 + Math.cos(angle) * 12;
      const y = 16 + Math.sin(angle) * 12;
      if (i === 0) graphics.moveTo(x, y);
      else graphics.lineTo(x, y);
    }
    graphics.closePath();
    graphics.fillPath();
    graphics.generateTexture('powerup-speed', 32, 32);

    // Magnet (purple diamond)
    graphics.clear();
    graphics.fillStyle(0x9933ff);
    graphics.fillTriangle(16, 4, 28, 16, 16, 28);
    graphics.fillTriangle(16, 4, 4, 16, 16, 28);
    graphics.generateTexture('powerup-magnet', 32, 32);

    // City background
    graphics.clear();
    graphics.fillStyle(0x4a5d4a); // Park green
    graphics.fillRect(0, 0, 800, 600);
    
    // City blocks (gray buildings)
    graphics.fillStyle(0x888888);
    graphics.fillRect(50, 50, 100, 120);
    graphics.fillRect(200, 80, 80, 100);
    graphics.fillRect(350, 40, 120, 140);
    graphics.fillRect(520, 60, 90, 110);
    graphics.fillRect(650, 45, 100, 125);
    
    graphics.fillRect(60, 300, 110, 130);
    graphics.fillRect(220, 320, 95, 100);
    graphics.fillRect(370, 290, 100, 150);
    graphics.fillRect(540, 310, 85, 120);
    graphics.fillRect(680, 295, 90, 135);

    // Parks (darker green)
    graphics.fillStyle(0x2d4a2d);
    graphics.fillRect(300, 200, 200, 100);
    graphics.fillRect(50, 480, 150, 100);
    graphics.fillRect(550, 480, 200, 100);

    // Roads (dark gray)
    graphics.fillStyle(0x444444);
    graphics.fillRect(0, 250, 800, 40); // Horizontal road
    graphics.fillRect(480, 0, 40, 600); // Vertical road

    graphics.generateTexture('city-background', 800, 600);
  }

  private createBackground(): void {
    if (this.add?.image) {
      const bg = this.add.image(400, 300, 'city-background');
      bg.setDisplaySize(800, 600);
    }
  }

  private setupCityAreas(): void {
    this.cityAreas = [
      { x: 50, y: 50, width: 100, height: 120 },   // Building areas
      { x: 200, y: 80, width: 80, height: 100 },
      { x: 350, y: 40, width: 120, height: 140 },
      { x: 520, y: 60, width: 90, height: 110 },
      { x: 650, y: 45, width: 100, height: 125 },
      { x: 60, y: 300, width: 110, height: 130 },
      { x: 220, y: 320, width: 95, height: 100 },
      { x: 370, y: 290, width: 100, height: 150 },
      { x: 540, y: 310, width: 85, height: 120 },
      { x: 680, y: 295, width: 90, height: 135 },
      { x: 300, y: 200, width: 200, height: 100 }, // Parks
      { x: 50, y: 480, width: 150, height: 100 },
      { x: 550, y: 480, width: 200, height: 100 }
    ];
  }

  private createPlayer(): void {
    if (this.add && this.physics) {
      this.player = this.physics.add.sprite(400, 300, 'player');
      this.player.setCollideWorldBounds(true);
      this.player.setDrag(300);
      this.player.setMaxVelocity(200);
    }
  }

  private createRecycleBins(): void {
    const binPositions = [
      { x: 100, y: 200, type: 'plastic' as const },
      { x: 700, y: 200, type: 'paper' as const },
      { x: 100, y: 450, type: 'glass' as const },
      { x: 700, y: 450, type: 'organic' as const }
    ];

    binPositions.forEach(pos => {
      const binSprite = this.add.sprite(pos.x, pos.y, `bin-${pos.type}`);
      
      const recycleBin: RecycleBin = {
        sprite: binSprite,
        type: pos.type,
        x: pos.x,
        y: pos.y,
        capacity: 10,
        currentLoad: 0
      };
      
      this.recycleBins.push(recycleBin);
    });
  }

  private createUI(): void {
    if (this.add?.text) {
      this.scoreText = this.add.text(16, 16, 'Score: 0', {
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 8, y: 4 }
      });
      
      this.timeText = this.add.text(16, 50, 'Time: 60s', {
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 8, y: 4 }
      });

      this.collectedText = this.add.text(16, 84, 'Collected: 0', {
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 8, y: 4 }
      });

      this.powerUpText = this.add.text(16, 118, '', {
        fontSize: '16px',
        color: '#ffff00',
        backgroundColor: '#000000',
        padding: { x: 8, y: 4 }
      });

      // Inventory display
      this.add.text(600, 16, 'Inventory:', {
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 8, y: 4 }
      });

      // Instructions
      this.add.text(400, 580, 'WASD/Arrows: Move | Collect trash and sort into correct bins!', {
        fontSize: '14px',
        color: '#ffff00',
        backgroundColor: '#000000',
        padding: { x: 8, y: 4 }
      }).setOrigin(0.5);
    }
  }

  private setupInput(): void {
    if (this.input?.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = this.input.keyboard.addKeys('W,S,A,D');
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
    if (!this.player || !this.cursors || !this.wasdKeys) return;

    const speed = this.speedBoostActive ? 300 : 200;
    
    // Movement with both arrow keys and WASD
    if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
      this.player.setAccelerationX(-speed);
    } else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
      this.player.setAccelerationX(speed);
    } else {
      this.player.setAccelerationX(0);
    }

    if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
      this.player.setAccelerationY(-speed);
    } else if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
      this.player.setAccelerationY(speed);
    } else {
      this.player.setAccelerationY(0);
    }
  }

  private updateTrashItems(): void {
    this.trashItems.forEach((trash, index) => {
      if (trash.isCollected) {
        trash.sprite.destroy();
        this.trashItems.splice(index, 1);
      }
    });
  }

  private updatePowerUps(delta: number): void {
    this.powerUpTimer += delta;
    
    // Spawn power-ups occasionally
    if (this.powerUpTimer > 15000) { // Every 15 seconds
      this.powerUpTimer = 0;
      this.spawnPowerUp();
    }

    // Update active power-ups
    if (this.speedBoostActive) {
      this.speedBoostTimer -= delta;
      if (this.speedBoostTimer <= 0) {
        this.speedBoostActive = false;
        this.powerUpText.setText('');
      } else {
        this.powerUpText.setText(`Speed Boost: ${Math.ceil(this.speedBoostTimer / 1000)}s`);
      }
    }

    if (this.magnetActive) {
      this.magnetTimer -= delta;
      if (this.magnetTimer <= 0) {
        this.magnetActive = false;
        this.powerUpText.setText('');
      } else {
        this.powerUpText.setText(`Magnet: ${Math.ceil(this.magnetTimer / 1000)}s`);
        this.attractNearbyTrash();
      }
    }
  }

  private spawnTrash(delta: number): void {
    this.spawnTimer += delta;
    
    if (this.spawnTimer > 3000 - (this.trashCollected * 100)) { // Faster spawning as game progresses
      this.spawnTimer = 0;
      
      if (this.trashItems.length < 20) { // Limit concurrent trash
        this.createRandomTrash();
      }
    }
  }

  private spawnInitialTrash(): void {
    // Spawn initial trash around the city
    for (let i = 0; i < 8; i++) {
      this.createRandomTrash();
    }
  }

  private createRandomTrash(): void {
    if (!this.physics?.add) return;

    const trashTypes = ['plastic', 'paper', 'glass', 'organic'] as const;
    const trashType = trashTypes[Math.floor(Math.random() * trashTypes.length)];
    const points = { plastic: 15, paper: 10, glass: 20, organic: 12 }[trashType];

    // Spawn in random city area
    const area = this.cityAreas[Math.floor(Math.random() * this.cityAreas.length)];
    const x = area.x + Math.random() * area.width;
    const y = area.y + Math.random() * area.height;

    const trashSprite = this.physics.add.sprite(x, y, `trash-${trashType}`);
    
    const trashItem: TrashItem = {
      sprite: trashSprite,
      type: trashType,
      points,
      isCollected: false
    };

    this.trashItems.push(trashItem);
  }

  private spawnPowerUp(): void {
    if (!this.physics?.add) return;

    const powerUpTypes = ['speed', 'magnet'];
    const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    
    const x = Math.random() * 700 + 50;
    const y = Math.random() * 500 + 50;

    const powerUpSprite = this.physics.add.sprite(x, y, `powerup-${powerUpType}`);
    
    // Auto-remove power-up after 10 seconds if not collected
    this.time.delayedCall(10000, () => {
      if (powerUpSprite.active) {
        powerUpSprite.destroy();
      }
    });

    // Check for collection
    this.physics.add.overlap(this.player, powerUpSprite, () => {
      this.collectPowerUp(powerUpType);
      powerUpSprite.destroy();
    });
  }

  private collectPowerUp(type: string): void {
    switch (type) {
      case 'speed':
        this.speedBoostActive = true;
        this.speedBoostTimer = 8000; // 8 seconds
        break;
      case 'magnet':
        this.magnetActive = true;
        this.magnetTimer = 10000; // 10 seconds
        break;
    }
    
    this.updateScore(25); // Bonus for power-up collection
  }

  private attractNearbyTrash(): void {
    if (!this.player) return;

    this.trashItems.forEach(trash => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        trash.sprite.x, trash.sprite.y
      );

      if (distance < 100) { // Magnet range
        const angle = Phaser.Math.Angle.Between(
          trash.sprite.x, trash.sprite.y,
          this.player.x, this.player.y
        );
        
        const force = 100 / (distance + 1); // Stronger when closer
        trash.sprite.setVelocity(
          Math.cos(angle) * force,
          Math.sin(angle) * force
        );
      }
    });
  }

  private checkTrashCollection(): void {
    if (!this.player) return;

    this.trashItems.forEach(trash => {
      if (trash.isCollected) return;

      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        trash.sprite.x, trash.sprite.y
      );

      if (distance < 30) {
        this.collectTrash(trash);
      }
    });
  }

  private collectTrash(trash: TrashItem): void {
    this.playerInventory[trash.type]++;
    this.trashCollected++;
    trash.isCollected = true;
    
    this.updateScore(trash.points);
    
    // Visual feedback
    this.createCollectionEffect(trash.sprite.x, trash.sprite.y);
  }

  private createCollectionEffect(x: number, y: number): void {
    if (this.add?.graphics) {
      const effect = this.add.graphics();
      effect.fillStyle(0x00ff00);
      effect.fillCircle(x, y, 20);
      effect.setAlpha(0.7);
      
      this.tweens.add({
        targets: effect,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        duration: 300,
        onComplete: () => effect.destroy()
      });
    }
  }

  private checkBinDeposits(): void {
    if (!this.player) return;

    this.recycleBins.forEach(bin => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        bin.x, bin.y
      );

      if (distance < 40 && this.playerInventory[bin.type] > 0) {
        this.depositTrash(bin);
      }
    });
  }

  private depositTrash(bin: RecycleBin): void {
    const deposited = Math.min(this.playerInventory[bin.type], bin.capacity - bin.currentLoad);
    
    if (deposited > 0) {
      this.playerInventory[bin.type] -= deposited;
      bin.currentLoad += deposited;
      
      // Bonus points for correct sorting
      const bonus = deposited * 10;
      this.updateScore(bonus);
      
      // Visual feedback
      this.createDepositEffect(bin.x, bin.y, bin.type);
      
      // Empty bin if full
      if (bin.currentLoad >= bin.capacity) {
        this.emptyBin(bin);
      }
    }
  }

  private emptyBin(bin: RecycleBin): void {
    bin.currentLoad = 0;
    
    // Big bonus for full bin
    this.updateScore(100);
    
    // Special effect for full bin
    this.createFullBinEffect(bin.x, bin.y);
  }

  private createDepositEffect(x: number, y: number, type: 'plastic' | 'paper' | 'glass' | 'organic'): void {
    const colors: Record<string, number> = {
      plastic: 0x3366ff,
      paper: 0xdddddd,
      glass: 0x44aa44,
      organic: 0x8b4513
    };

    if (this.add?.graphics) {
      const effect = this.add.graphics();
      effect.fillStyle(colors[type]);
      effect.fillRect(x - 10, y - 25, 20, 15);
      
      this.tweens.add({
        targets: effect,
        y: y - 50,
        alpha: 0,
        duration: 800,
        onComplete: () => effect.destroy()
      });
    }
  }

  private createFullBinEffect(x: number, y: number): void {
    if (this.add?.graphics) {
      const effect = this.add.graphics();
      effect.fillStyle(0xffd700); // Gold color
      // Create star shape manually
      effect.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 144) * Math.PI / 180;
        const starX = x + Math.cos(angle) * 20;
        const starY = (y - 30) + Math.sin(angle) * 20;
        if (i === 0) effect.moveTo(starX, starY);
        else effect.lineTo(starX, starY);
      }
      effect.closePath();
      effect.fillPath();
      
      this.tweens.add({
        targets: effect,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0,
        duration: 1000,
        onComplete: () => effect.destroy()
      });
    }
  }

  private updateScore(points: number): void {
    const currentState = this.gameEngine.getGameState();
    const newScore = Math.max(0, currentState.score + points);
    this.gameEngine.updateScore(newScore);
  }

  private updateUI(): void {
    const currentState = this.gameEngine.getGameState();
    const timeRemaining = Math.ceil((this.gameTimer?.getRemainingSeconds() || 0));
    
    if (this.scoreText) {
      this.scoreText.setText(`Score: ${currentState.score}`);
    }
    
    if (this.timeText) {
      this.timeText.setText(`Time: ${timeRemaining}s`);
    }
    
    if (this.collectedText) {
      this.collectedText.setText(`Collected: ${this.trashCollected}`);
    }

    // Update inventory display
    const inventoryText = `P:${this.playerInventory.plastic} Pa:${this.playerInventory.paper} G:${this.playerInventory.glass} O:${this.playerInventory.organic}`;
    
    if (this.add?.text) {
      // Find or create inventory text
      const existingInventory = this.children.getByName('inventory') as Phaser.GameObjects.Text;
      if (existingInventory) {
        existingInventory.setText(inventoryText);
      } else {
        const invText = this.add.text(600, 50, inventoryText, {
          fontSize: '14px',
          color: '#ffffff',
          backgroundColor: '#000000',
          padding: { x: 8, y: 4 }
        });
        invText.setName('inventory');
      }
    }
  }

  private endGame(): void {
    this.isGameRunning = false;
    
    // Calculate recycling efficiency
    const totalCapacity = this.recycleBins.reduce((sum, bin) => sum + bin.capacity, 0);
    const totalRecycled = this.recycleBins.reduce((sum, bin) => sum + bin.currentLoad, 0);
    const efficiency = totalRecycled / Math.max(1, this.trashCollected);
    
    const finalState = this.gameEngine.getGameState();
    const gameResult = {
      gameId: this.config.id,
      score: finalState.score,
      duration: this.config.maxDuration - (this.gameTimer?.getRemainingSeconds() || 0),
      completed: true,
      metadata: {
        trashCollected: this.trashCollected,
        recyclingEfficiency: Math.round(efficiency * 100),
        totalRecycled: totalRecycled,
        wasteTypes: { ...this.playerInventory }
      }
    };
    
    this.gameEngine.endGame(gameResult);
  }
}