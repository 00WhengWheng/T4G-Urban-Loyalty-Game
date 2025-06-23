import Phaser from 'phaser';
import { GameConfig } from '../../types';

interface Vehicle {
  sprite: Phaser.Physics.Arcade.Sprite;
  direction: 'north' | 'south' | 'east' | 'west';
  speed: number;
  waitTime: number;
}

interface TrafficLight {
  sprite: Phaser.GameObjects.Sprite;
  state: 'red' | 'yellow' | 'green';
  direction: 'horizontal' | 'vertical';
  timer: number;
  x: number;
  y: number;
}

export class TrafficMasterScene extends Phaser.Scene {
  private config: GameConfig;
  private gameEngine: any;
  private vehicles: Vehicle[] = [];
  private trafficLights: TrafficLight[] = [];
  private gameTimer: any;
  private scoreText: any;
  private timeText: any;
  private accidentsText: any;
  private gameSpeed: number = 1;
  private isGameRunning: boolean = false;
  private accidents: number = 0;
  private vehiclesServed: number = 0;
  private spawnTimer: number = 0;
  private intersections: { x: number; y: number }[] = [];

  constructor(config: GameConfig, gameEngine: any) {
    super({ key: config.id });
    this.config = config;
    this.gameEngine = gameEngine;
  }

  preload(): void {
    this.createColoredRectangles();
    console.log('Traffic Master: Assets loaded');
  }

  create(): void {
    console.log('Traffic Master: Creating game scene');
    
    this.createBackground();
    this.createTrafficLights();
    this.createUI();
    this.setupInput();
    this.setupGameTimer();
    this.setupIntersections();
    
    this.isGameRunning = true;
    console.log('Traffic Master: Game scene created');
  }

  update(time: number, delta: number): void {
    if (!this.isGameRunning) return;

    this.updateVehicles(delta);
    this.updateTrafficLights(delta);
    this.spawnVehicles(delta);
    this.checkCollisions();
    this.checkTrafficViolations();
    this.updateUI();
  }

  private createColoredRectangles(): void {
    const graphics = this.add?.graphics();
    if (!graphics) return;

    // Car sprite (blue rectangle)
    graphics.fillStyle(0x0066cc);
    graphics.fillRect(0, 0, 30, 20);
    graphics.generateTexture('car-horizontal', 30, 20);

    // Car sprite vertical (blue rectangle)
    graphics.clear();
    graphics.fillStyle(0x0066cc);
    graphics.fillRect(0, 0, 20, 30);
    graphics.generateTexture('car-vertical', 20, 30);

    // Truck sprite (orange rectangle)
    graphics.clear();
    graphics.fillStyle(0xff6600);
    graphics.fillRect(0, 0, 40, 25);
    graphics.generateTexture('truck-horizontal', 40, 25);

    // Truck sprite vertical
    graphics.clear();
    graphics.fillStyle(0xff6600);
    graphics.fillRect(0, 0, 25, 40);
    graphics.generateTexture('truck-vertical', 25, 40);

    // Traffic light sprites
    graphics.clear();
    graphics.fillStyle(0x333333);
    graphics.fillRect(0, 0, 20, 60);
    graphics.fillStyle(0xff0000); // Red light
    graphics.fillCircle(10, 15, 8);
    graphics.generateTexture('traffic-light-red', 20, 60);

    graphics.clear();
    graphics.fillStyle(0x333333);
    graphics.fillRect(0, 0, 20, 60);
    graphics.fillStyle(0xffff00); // Yellow light
    graphics.fillCircle(10, 30, 8);
    graphics.generateTexture('traffic-light-yellow', 20, 60);

    graphics.clear();
    graphics.fillStyle(0x333333);
    graphics.fillRect(0, 0, 20, 60);
    graphics.fillStyle(0x00ff00); // Green light
    graphics.fillCircle(10, 45, 8);
    graphics.generateTexture('traffic-light-green', 20, 60);

    // Road background
    graphics.clear();
    graphics.fillStyle(0x666666);
    graphics.fillRect(0, 0, 800, 600);
    
    // Road markings
    graphics.lineStyle(4, 0xffffff);
    // Horizontal roads
    graphics.lineBetween(0, 200, 800, 200);
    graphics.lineBetween(0, 400, 800, 400);
    // Vertical roads
    graphics.lineBetween(200, 0, 200, 600);
    graphics.lineBetween(400, 0, 400, 600);
    graphics.lineBetween(600, 0, 600, 600);
    
    graphics.generateTexture('road-network', 800, 600);
  }

  private createBackground(): void {
    if (this.add?.image) {
      const bg = this.add.image(400, 300, 'road-network');
      bg.setDisplaySize(800, 600);
    }
  }

  private setupIntersections(): void {
    this.intersections = [
      { x: 200, y: 200 }, { x: 400, y: 200 }, { x: 600, y: 200 },
      { x: 200, y: 400 }, { x: 400, y: 400 }, { x: 600, y: 400 }
    ];
  }

  private createTrafficLights(): void {
    this.intersections.forEach((intersection, index) => {
      // Create traffic lights for each intersection
      const horizontalLight: TrafficLight = {
        sprite: this.add.sprite(intersection.x - 30, intersection.y, 'traffic-light-red'),
        state: index % 2 === 0 ? 'red' : 'green',
        direction: 'horizontal',
        timer: Math.random() * 3000 + 2000,
        x: intersection.x,
        y: intersection.y
      };

      const verticalLight: TrafficLight = {
        sprite: this.add.sprite(intersection.x, intersection.y - 30, 'traffic-light-red'),
        state: index % 2 === 0 ? 'green' : 'red',
        direction: 'vertical',
        timer: Math.random() * 3000 + 2000,
        x: intersection.x,
        y: intersection.y
      };

      this.trafficLights.push(horizontalLight, verticalLight);
      this.updateTrafficLightSprite(horizontalLight);
      this.updateTrafficLightSprite(verticalLight);
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

      this.accidentsText = this.add.text(16, 84, 'Accidents: 0', {
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 8, y: 4 }
      });

      // Instructions
      this.add.text(400, 50, 'Click traffic lights to change them!', {
        fontSize: '16px',
        color: '#ffff00',
        backgroundColor: '#000000',
        padding: { x: 8, y: 4 }
      }).setOrigin(0.5);
    }
  }

  private setupInput(): void {
    if (this.input) {
      this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        this.handleTrafficLightClick(pointer.x, pointer.y);
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

  private updateVehicles(delta: number): void {
    this.vehicles.forEach((vehicle, index) => {
      if (!vehicle.sprite.active) return;

      const canMove = this.canVehicleMove(vehicle);
      
      if (canMove) {
        vehicle.waitTime = 0;
        this.moveVehicle(vehicle, delta);
      } else {
        vehicle.waitTime += delta;
        vehicle.sprite.setVelocity(0, 0);
      }

      // Remove vehicles that are off-screen
      if (this.isVehicleOffScreen(vehicle)) {
        this.vehiclesServed++;
        this.updateScore(10); // Bonus for vehicle successfully passing through
        vehicle.sprite.destroy();
        this.vehicles.splice(index, 1);
      }
    });
  }

  private canVehicleMove(vehicle: Vehicle): boolean {
    const { x, y } = vehicle.sprite;
    
    // Check if vehicle is at an intersection
    for (const intersection of this.intersections) {
      const distanceToIntersection = Phaser.Math.Distance.Between(x, y, intersection.x, intersection.y);
      
      if (distanceToIntersection < 50) {
        // Find the relevant traffic light
        const relevantLight = this.trafficLights.find(light => 
          light.x === intersection.x && 
          light.y === intersection.y &&
          ((vehicle.direction === 'east' || vehicle.direction === 'west') ? 
           light.direction === 'horizontal' : light.direction === 'vertical')
        );
        
        if (relevantLight && relevantLight.state === 'red') {
          return false;
        }
      }
    }

    return true;
  }

  private moveVehicle(vehicle: Vehicle, delta: number): void {
    const speed = vehicle.speed * this.gameSpeed;
    
    switch (vehicle.direction) {
      case 'east':
        vehicle.sprite.setVelocityX(speed);
        vehicle.sprite.setVelocityY(0);
        break;
      case 'west':
        vehicle.sprite.setVelocityX(-speed);
        vehicle.sprite.setVelocityY(0);
        break;
      case 'north':
        vehicle.sprite.setVelocityX(0);
        vehicle.sprite.setVelocityY(-speed);
        break;
      case 'south':
        vehicle.sprite.setVelocityX(0);
        vehicle.sprite.setVelocityY(speed);
        break;
    }
  }

  private updateTrafficLights(delta: number): void {
    this.trafficLights.forEach(light => {
      light.timer -= delta;
      
      if (light.timer <= 0) {
        this.cycleTrafficLight(light);
      }
    });
  }

  private cycleTrafficLight(light: TrafficLight): void {
    switch (light.state) {
      case 'green':
        light.state = 'yellow';
        light.timer = 1000; // Yellow for 1 second
        break;
      case 'yellow':
        light.state = 'red';
        light.timer = Math.random() * 4000 + 3000; // Red for 3-7 seconds
        break;
      case 'red':
        light.state = 'green';
        light.timer = Math.random() * 5000 + 4000; // Green for 4-9 seconds
        break;
    }
    
    this.updateTrafficLightSprite(light);
  }

  private updateTrafficLightSprite(light: TrafficLight): void {
    const texture = `traffic-light-${light.state}`;
    light.sprite.setTexture(texture);
  }

  private spawnVehicles(delta: number): void {
    this.spawnTimer += delta;
    
    if (this.spawnTimer > 2000) { // Spawn every 2 seconds
      this.spawnTimer = 0;
      
      if (this.vehicles.length < 12) { // Limit concurrent vehicles
        this.createRandomVehicle();
      }
    }
  }

  private createRandomVehicle(): void {
    if (!this.physics?.add) return;

    const spawnPoints = [
      { x: -30, y: 200, direction: 'east' as const, texture: 'car-horizontal' },
      { x: 830, y: 200, direction: 'west' as const, texture: 'car-horizontal' },
      { x: -30, y: 400, direction: 'east' as const, texture: 'truck-horizontal' },
      { x: 830, y: 400, direction: 'west' as const, texture: 'truck-horizontal' },
      { x: 200, y: -30, direction: 'south' as const, texture: 'car-vertical' },
      { x: 200, y: 630, direction: 'north' as const, texture: 'car-vertical' },
      { x: 400, y: -30, direction: 'south' as const, texture: 'truck-vertical' },
      { x: 400, y: 630, direction: 'north' as const, texture: 'truck-vertical' },
      { x: 600, y: -30, direction: 'south' as const, texture: 'car-vertical' },
      { x: 600, y: 630, direction: 'north' as const, texture: 'car-vertical' }
    ];

    const spawnPoint = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    const vehicleSprite = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, spawnPoint.texture);
    
    const vehicle: Vehicle = {
      sprite: vehicleSprite,
      direction: spawnPoint.direction,
      speed: Math.random() * 50 + 80, // Speed between 80-130
      waitTime: 0
    };

    this.vehicles.push(vehicle);
  }

  private handleTrafficLightClick(clickX: number, clickY: number): void {
    this.trafficLights.forEach(light => {
      const distance = Phaser.Math.Distance.Between(
        clickX, clickY, 
        light.sprite.x, light.sprite.y
      );
      
      if (distance < 30) {
        // Toggle traffic light
        if (light.state === 'red') {
          light.state = 'green';
          light.timer = 4000;
        } else if (light.state === 'green') {
          light.state = 'red';
          light.timer = 3000;
        }
        this.updateTrafficLightSprite(light);
        this.updateScore(5); // Bonus for manual control
      }
    });
  }

  private checkCollisions(): void {
    for (let i = 0; i < this.vehicles.length; i++) {
      for (let j = i + 1; j < this.vehicles.length; j++) {
        const vehicle1 = this.vehicles[i];
        const vehicle2 = this.vehicles[j];
        
        if (this.checkVehicleCollision(vehicle1, vehicle2)) {
          this.handleAccident(vehicle1, vehicle2);
        }
      }
    }
  }

  private checkVehicleCollision(vehicle1: Vehicle, vehicle2: Vehicle): boolean {
    const distance = Phaser.Math.Distance.Between(
      vehicle1.sprite.x, vehicle1.sprite.y,
      vehicle2.sprite.x, vehicle2.sprite.y
    );
    
    return distance < 40; // Collision threshold
  }

  private checkTrafficViolations(): void {
    this.vehicles.forEach(vehicle => {
      if (vehicle.waitTime > 10000) { // Vehicle waiting too long
        this.updateScore(-5); // Penalty for traffic jam
        vehicle.waitTime = 0; // Reset to avoid repeated penalties
      }
    });
  }

  private handleAccident(vehicle1: Vehicle, vehicle2: Vehicle): void {
    this.accidents++;
    this.updateScore(-20); // Heavy penalty for accidents
    
    // Remove crashed vehicles
    vehicle1.sprite.destroy();
    vehicle2.sprite.destroy();
    
    this.vehicles = this.vehicles.filter(v => 
      v.sprite !== vehicle1.sprite && v.sprite !== vehicle2.sprite
    );

    // Create explosion effect
    this.createExplosionEffect(vehicle1.sprite.x, vehicle1.sprite.y);
  }

  private createExplosionEffect(x: number, y: number): void {
    if (this.add?.graphics) {
      const explosion = this.add.graphics();
      explosion.fillStyle(0xff4444);
      explosion.fillCircle(x, y, 30);
      
      this.time.delayedCall(500, () => {
        explosion.destroy();
      });
    }
  }

  private isVehicleOffScreen(vehicle: Vehicle): boolean {
    const { x, y } = vehicle.sprite;
    return x < -50 || x > 850 || y < -50 || y > 650;
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
    
    if (this.accidentsText) {
      this.accidentsText.setText(`Accidents: ${this.accidents}`);
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
        accidents: this.accidents,
        vehiclesServed: this.vehiclesServed,
        efficiency: this.vehiclesServed / Math.max(1, this.accidents + this.vehiclesServed)
      }
    };
    
    this.gameEngine.endGame(gameResult);
  }
}