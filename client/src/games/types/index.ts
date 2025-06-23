export interface GameResult {
  gameId: string;
  score: number;
  duration: number; // in seconds
  completed: boolean;
  bonus?: {
    type: 'time' | 'accuracy' | 'combo';
    multiplier: number;
  };
  metadata?: Record<string, any>;
}

export interface GameConfig {
  id: string;
  name: string;
  description: string;
  type: GameType;
  difficulty: GameDifficulty;
  maxDuration: number; // in seconds
  targetScore: number;
  rewards: GameRewards;
  assets: GameAssets;
  controls: GameControls;
  mobile: MobileConfig;
}

export type GameType = 
  | 'urban-runner' 
  | 'trash-collector' 
  | 'traffic-master' 
  | 'building-climber' 
  | 'bus-driver' 
  | 'pizza-delivery'
  | 'street-art'
  | 'city-planner';

export type GameDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface GameRewards {
  basePoints: number;
  bonusMultiplier: number;
  tokens: number;
  achievements?: string[];
}

export interface GameAssets {
  sprites: string[];
  audio: string[];
  textures: string[];
  backgrounds: string[];
}

export interface GameControls {
  touch: boolean;
  keyboard: boolean;
  mouse: boolean;
  gestures?: string[];
}

export interface MobileConfig {
  orientation: 'portrait' | 'landscape' | 'auto';
  scalingMode: 'fit' | 'fill' | 'fixed';
  virtualControls: boolean;
}

export interface GameState {
  currentGame: string | null;
  isPlaying: boolean;
  isPaused: boolean;
  score: number;
  timeRemaining: number;
  lives: number;
  level: number;
  gameData?: Record<string, any>;
}

export interface PhaserGameInstance {
  game: Phaser.Game | null;
  scene: Phaser.Scene | null;
  destroy: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
}

export interface GameEvents {
  onGameStart: () => void;
  onGameEnd: (result: GameResult) => void;
  onGamePause: () => void;
  onGameResume: () => void;
  onScoreUpdate: (score: number) => void;
  onLevelUp: (level: number) => void;
  onAchievement: (achievement: string) => void;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  score: number;
  duration: number;
  gameId: string;
  timestamp: Date;
  rank: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: AchievementCondition;
  reward: {
    points: number;
    tokens: number;
  };
}

export interface AchievementCondition {
  type: 'score' | 'time' | 'completion' | 'streak' | 'level';
  target: number;
  gameId?: string;
}
