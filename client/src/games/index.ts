// Game Types and Configurations
export * from './types';
export * from './config';

// Game Engine
export { GameEngine } from './engine/GameEngine';

// Game Components
export { SimpleGameComponent } from './components/SimpleGameComponent';
export { PhaserGameComponent } from './components/PhaserGameComponent';

// Simple Games (Canvas-based)
export { createSimpleGame, SimpleUrbanRunner } from './SimpleGames';

// Game Scenes (Phaser-based)
export { BaseScene, DefaultScene } from './scenes';

// Mini-games
export * from './mini-games/urban-runner/UrbanRunnerScene';

// Game Store
export { useGameStore } from './store/gameStore';

// Fix for TypeScript module resolution
export type { GameConfig, GameResult, GameState, GameEvents } from './types';
