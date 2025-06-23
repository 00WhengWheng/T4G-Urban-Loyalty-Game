export interface GameAssets {
  sprites: Record<string, string>;
  audio: Record<string, string>;
  fonts: Record<string, string>;
  atlases: Record<string, { png: string; json: string }>;
}

export class AssetManager {
  private static instance: AssetManager;
  private loadedAssets: Set<string> = new Set();
  private assetManifest: Record<string, GameAssets> = {};

  static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  registerGameAssets(gameId: string, assets: GameAssets): void {
    this.assetManifest[gameId] = assets;
  }

  async preloadGameAssets(scene: Phaser.Scene, gameId: string): Promise<void> {
    const assets = this.assetManifest[gameId];
    if (!assets) {
      console.warn(`No assets registered for game: ${gameId}`);
      return;
    }

    return new Promise((resolve, reject) => {
      const loadPromises: Promise<void>[] = [];

      // Load sprites
      Object.entries(assets.sprites).forEach(([key, path]) => {
        if (!this.loadedAssets.has(key)) {
          scene.load.image(key, path);
          this.loadedAssets.add(key);
        }
      });

      // Load audio
      Object.entries(assets.audio).forEach(([key, path]) => {
        if (!this.loadedAssets.has(key)) {
          scene.load.audio(key, path);
          this.loadedAssets.add(key);
        }
      });

      // Load texture atlases
      Object.entries(assets.atlases).forEach(([key, atlas]) => {
        if (!this.loadedAssets.has(key)) {
          scene.load.atlas(key, atlas.png, atlas.json);
          this.loadedAssets.add(key);
        }
      });

      scene.load.on('complete', () => {
        resolve();
      });

      scene.load.on('loaderror', (file: any) => {
        console.error(`Failed to load asset: ${file.src}`);
        reject(new Error(`Failed to load asset: ${file.src}`));
      });

      scene.load.start();
    });
  }

  createFallbackAssets(scene: Phaser.Scene): void {
    // Create simple colored rectangles as fallbacks
    const graphics = scene.add.graphics();
    
    // Player sprite fallback
    graphics.fillStyle(0x00ff00);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture('player_fallback', 32, 32);
    
    // Obstacle sprite fallback
    graphics.clear();
    graphics.fillStyle(0xff0000);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture('obstacle_fallback', 32, 32);
    
    // Coin sprite fallback
    graphics.clear();
    graphics.fillStyle(0xffff00);
    graphics.fillCircle(16, 16, 12);
    graphics.generateTexture('coin_fallback', 32, 32);
    
    graphics.destroy();
  }
}