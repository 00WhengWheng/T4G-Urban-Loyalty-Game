import { GameConfig } from './types';

export const GAME_CONFIGS: Record<string, GameConfig> = {
  'urban-runner': {
    id: 'urban-runner',
    name: 'Urban Runner',
    description: 'Run through the city, avoid obstacles and collect coins!',
    type: 'urban-runner',
    difficulty: 'medium',
    maxDuration: 120, // 2 minutes
    targetScore: 1000,
    rewards: {
      basePoints: 100,
      bonusMultiplier: 1.5,
      tokens: 5,
      achievements: ['first-run', 'speed-demon', 'coin-collector']
    },
    assets: {
      sprites: ['player', 'obstacles', 'coins', 'buildings'],
      audio: ['jump', 'collect', 'background'],
      textures: ['city-bg', 'road', 'sidewalk'],
      backgrounds: ['city-skyline']
    },
    controls: {
      touch: true,
      keyboard: true,
      mouse: false,
      gestures: ['tap', 'swipe-up', 'swipe-down']
    },
    mobile: {
      orientation: 'landscape',
      scalingMode: 'fit',
      virtualControls: true
    }
  },
  'traffic-master': {
    id: 'traffic-master',
    name: 'Traffic Master',
    description: 'Control traffic lights to prevent crashes and keep the city moving!',
    type: 'traffic-master',
    difficulty: 'hard',
    maxDuration: 180,
    targetScore: 1500,
    rewards: {
      basePoints: 150,
      bonusMultiplier: 2.0,
      tokens: 7,
      achievements: ['traffic-controller', 'zero-accidents', 'flow-master']
    },
    assets: {
      sprites: ['cars', 'trucks', 'bikes', 'traffic-lights'],
      audio: ['car-horn', 'brakes', 'light-switch'],
      textures: ['intersection', 'roads'],
      backgrounds: ['city-intersection']
    },
    controls: {
      touch: true,
      keyboard: true,
      mouse: true,
      gestures: ['tap']
    },
    mobile: {
      orientation: 'landscape',
      scalingMode: 'fit',
      virtualControls: false
    }
  },
  'building-climber': {
    id: 'building-climber',
    name: 'Skyscraper Challenge',
    description: 'Climb to the top of the tallest building in the city!',
    type: 'building-climber',
    difficulty: 'expert',
    maxDuration: 150,
    targetScore: 2000,
    rewards: {
      basePoints: 200,
      bonusMultiplier: 2.5,
      tokens: 10,
      achievements: ['high-climber', 'fearless', 'city-top']
    },
    assets: {
      sprites: ['climber', 'building-parts', 'obstacles', 'power-ups'],
      audio: ['climb', 'fall', 'reach-top'],
      textures: ['building-exterior', 'windows', 'ledges'],
      backgrounds: ['city-heights']
    },
    controls: {
      touch: true,
      keyboard: true,
      mouse: false,
      gestures: ['tap', 'swipe-left', 'swipe-right']
    },
    mobile: {
      orientation: 'portrait',
      scalingMode: 'fit',
      virtualControls: true
    }
  },
  'bus-driver': {
    id: 'bus-driver',
    name: 'City Bus Driver',
    description: 'Pick up passengers and navigate through busy city streets!',
    type: 'bus-driver',
    difficulty: 'medium',
    maxDuration: 120,
    targetScore: 1200,
    rewards: {
      basePoints: 120,
      bonusMultiplier: 1.8,
      tokens: 6,
      achievements: ['safe-driver', 'punctual', 'passenger-hero']
    },
    assets: {
      sprites: ['bus', 'passengers', 'bus-stops', 'traffic'],
      audio: ['engine', 'door-open', 'passenger-thanks'],
      textures: ['city-streets', 'bus-interior'],
      backgrounds: ['urban-routes']
    },
    controls: {
      touch: true,
      keyboard: true,
      mouse: false,
      gestures: ['tap', 'swipe']
    },
    mobile: {
      orientation: 'landscape',
      scalingMode: 'fit',
      virtualControls: true
    }
  },
  'pizza-delivery': {
    id: 'pizza-delivery',
    name: 'Pizza Rush',
    description: 'Deliver hot pizzas across the city before they get cold!',
    type: 'pizza-delivery',
    difficulty: 'medium',
    maxDuration: 100,
    targetScore: 900,
    rewards: {
      basePoints: 90,
      bonusMultiplier: 1.6,
      tokens: 5,
      achievements: ['speed-delivery', 'hot-pizza', 'customer-favorite']
    },
    assets: {
      sprites: ['delivery-bike', 'pizza-boxes', 'houses', 'roads'],
      audio: ['bike-engine', 'doorbell', 'delivery-success'],
      textures: ['neighborhood', 'restaurant'],
      backgrounds: ['residential-area']
    },
    controls: {
      touch: true,
      keyboard: true,
      mouse: false,
      gestures: ['tap', 'tilt']
    },
    mobile: {
      orientation: 'landscape',
      scalingMode: 'fit',
      virtualControls: true
    }
  },
  'trash-collector': {
    id: 'trash-collector',
    name: 'Eco Warrior',
    description: 'Clean up the city by collecting and sorting trash into recycling bins!',
    type: 'trash-collector',
    difficulty: 'medium',
    maxDuration: 180, // 3 minutes
    targetScore: 1000,
    rewards: {
      basePoints: 120,
      bonusMultiplier: 1.7,
      tokens: 6,
      achievements: ['eco-warrior', 'recycling-master', 'city-cleaner']
    },
    assets: {
      sprites: ['player', 'trash-items', 'recycling-bins', 'power-ups'],
      audio: ['collect', 'deposit', 'power-up', 'full-bin'],
      textures: ['city-streets', 'buildings', 'parks'],
      backgrounds: ['urban-environment']
    },
    controls: {
      touch: true,
      keyboard: true,
      mouse: false,
      gestures: ['tap', 'swipe']
    },
    mobile: {
      orientation: 'landscape',
      scalingMode: 'fit',
      virtualControls: true
    },
    backgroundColor: '#4a5d4a',
    physics: {
      gravity: { x: 0, y: 0 }
    }
  }
};

export const DIFFICULTY_SETTINGS = {
  easy: {
    timeMultiplier: 1.2,
    scoreMultiplier: 0.8,
    obstacleSpeed: 0.7,
    helpText: 'Perfect for beginners!'
  },
  medium: {
    timeMultiplier: 1.0,
    scoreMultiplier: 1.0,
    obstacleSpeed: 1.0,
    helpText: 'Balanced challenge'
  },
  hard: {
    timeMultiplier: 0.8,
    scoreMultiplier: 1.3,
    obstacleSpeed: 1.4,
    helpText: 'For experienced players'
  },
  expert: {
    timeMultiplier: 0.6,
    scoreMultiplier: 1.6,
    obstacleSpeed: 1.8,
    helpText: 'Ultimate challenge!'
  }
};

export const ACHIEVEMENT_DEFINITIONS = {
  'first-run': {
    id: 'first-run',
    name: 'First Steps',
    description: 'Complete your first urban runner game',
    icon: '🏃',
    condition: { type: 'completion', target: 1, gameId: 'urban-runner' },
    reward: { points: 50, tokens: 2 }
  },
  'speed-demon': {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Complete urban runner in under 60 seconds',
    icon: '⚡',
    condition: { type: 'time', target: 60, gameId: 'urban-runner' },
    reward: { points: 100, tokens: 5 }
  },
  'coin-collector': {
    id: 'coin-collector',
    name: 'Coin Collector',
    description: 'Collect 100 coins in a single game',
    icon: '🪙',
    condition: { type: 'score', target: 100 },
    reward: { points: 75, tokens: 3 }
  },
  'eco-warrior': {
    id: 'eco-warrior',
    name: 'Eco Warrior',
    description: 'Clean up the entire city',
    icon: '🌱',
    condition: { type: 'completion', target: 1, gameId: 'trash-collector' },
    reward: { points: 60, tokens: 3 }
  },
  'traffic-controller': {
    id: 'traffic-controller',
    name: 'Traffic Controller',
    description: 'Manage traffic without any accidents',
    icon: '🚦',
    condition: { type: 'completion', target: 1, gameId: 'traffic-master' },
    reward: { points: 120, tokens: 6 }
  },
  'recycling-master': {
    id: 'recycling-master',
    name: 'Recycling Master',
    description: 'Sort 100 items correctly into recycling bins',
    icon: '♻️',
    condition: { type: 'score', target: 1000, gameId: 'trash-collector' },
    reward: { points: 100, tokens: 5 }
  },
  'city-cleaner': {
    id: 'city-cleaner',
    name: 'City Cleaner',
    description: 'Achieve 90% recycling efficiency',
    icon: '🏙️',
    condition: { type: 'score', target: 1500, gameId: 'trash-collector' },
    reward: { points: 150, tokens: 7 }
  }
} as const;

export function getGameConfig(gameId: string): GameConfig | null {
  return GAME_CONFIGS[gameId] || null;
}

export function getAllGameConfigs(): GameConfig[] {
  return Object.values(GAME_CONFIGS);
}

export function getGamesByDifficulty(difficulty: string): GameConfig[] {
  return Object.values(GAME_CONFIGS).filter(config => config.difficulty === difficulty);
}
