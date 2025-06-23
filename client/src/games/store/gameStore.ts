import { create } from 'zustand';
import { GameResult, GameState, Achievement, LeaderboardEntry } from '../types';

interface GameStore {
  // Game state
  currentGameState: GameState;
  gameHistory: GameResult[];
  achievements: Achievement[];
  leaderboard: LeaderboardEntry[];
  
  // User stats
  totalScore: number;
  totalGamesPlayed: number;
  totalTokensEarned: number;
  favoriteGame: string | null;
  
  // Actions
  updateGameState: (state: Partial<GameState>) => void;
  addGameResult: (result: GameResult) => void;
  unlockAchievement: (achievement: Achievement) => void;
  updateLeaderboard: (entries: LeaderboardEntry[]) => void;
  resetGameState: () => void;
  
  // Stats calculations
  getGameStats: (gameId?: string) => {
    totalPlayed: number;
    bestScore: number;
    averageScore: number;
    totalTokens: number;
  };
  
  // Achievements
  checkAchievements: (result: GameResult) => Achievement[];
}

const initialGameState: GameState = {
  currentGame: null,
  isPlaying: false,
  isPaused: false,
  score: 0,
  timeRemaining: 0,
  lives: 3,
  level: 1,
};

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  currentGameState: initialGameState,
  gameHistory: [],
  achievements: [],
  leaderboard: [],
  totalScore: 0,
  totalGamesPlayed: 0,
  totalTokensEarned: 0,
  favoriteGame: null,

  // Actions
  updateGameState: (state) =>
    set((prev) => ({
      currentGameState: { ...prev.currentGameState, ...state },
    })),

  addGameResult: (result) =>
    set((prev) => {
      const newHistory = [...prev.gameHistory, result];
      const newTotalScore = prev.totalScore + result.score;
      const newTotalGames = prev.totalGamesPlayed + 1;
      const tokensEarned = Math.floor(result.score / 100) + (result.bonus?.multiplier || 0) * 2;
      const newTotalTokens = prev.totalTokensEarned + tokensEarned;

      // Calculate favorite game
      const gameCounts = newHistory.reduce((acc, game) => {
        acc[game.gameId] = (acc[game.gameId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const favoriteGame = Object.entries(gameCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

      return {
        gameHistory: newHistory,
        totalScore: newTotalScore,
        totalGamesPlayed: newTotalGames,
        totalTokensEarned: newTotalTokens,
        favoriteGame,
      };
    }),

  unlockAchievement: (achievement) =>
    set((prev) => ({
      achievements: [...prev.achievements, achievement],
      totalTokensEarned: prev.totalTokensEarned + achievement.reward.tokens,
    })),

  updateLeaderboard: (entries) =>
    set(() => ({
      leaderboard: entries,
    })),

  resetGameState: () =>
    set(() => ({
      currentGameState: initialGameState,
    })),

  // Stats calculations
  getGameStats: (gameId) => {
    const state = get();
    const relevantGames = gameId
      ? state.gameHistory.filter((game) => game.gameId === gameId)
      : state.gameHistory;

    const totalPlayed = relevantGames.length;
    const scores = relevantGames.map((game) => game.score);
    const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const averageScore = scores.length > 0 
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0;
    const totalTokens = relevantGames.reduce((sum, game) => 
      sum + Math.floor(game.score / 100) + (game.bonus?.multiplier || 0) * 2, 0
    );

    return {
      totalPlayed,
      bestScore,
      averageScore,
      totalTokens,
    };
  },

  // Achievement checking
  checkAchievements: (result) => {
    const state = get();
    const newAchievements: Achievement[] = [];

    // Example achievement checks
    const stats = state.getGameStats(result.gameId);
    
    // First completion achievement
    if (stats.totalPlayed === 1) {
      newAchievements.push({
        id: `first-${result.gameId}`,
        name: 'First Steps',
        description: `Complete your first ${result.gameId} game`,
        icon: '🎯',
        condition: { type: 'completion', target: 1, gameId: result.gameId },
        reward: { points: 50, tokens: 2 },
      });
    }

    // High score achievements
    if (result.score >= 1000 && !state.achievements.find(a => a.id === 'high-scorer')) {
      newAchievements.push({
        id: 'high-scorer',
        name: 'High Scorer',
        description: 'Score 1000 points in any game',
        icon: '🏆',
        condition: { type: 'score', target: 1000 },
        reward: { points: 100, tokens: 5 },
      });
    }

    // Speed achievements
    if (result.duration < 30 && result.completed) {
      newAchievements.push({
        id: 'speed-demon',
        name: 'Speed Demon',
        description: 'Complete a game in under 30 seconds',
        icon: '⚡',
        condition: { type: 'time', target: 30 },
        reward: { points: 75, tokens: 3 },
      });
    }

    // Streak achievements
    const recentGames = state.gameHistory.slice(-5);
    if (recentGames.length === 5 && recentGames.every(g => g.completed)) {
      newAchievements.push({
        id: 'streak-master',
        name: 'Streak Master',
        description: 'Complete 5 games in a row',
        icon: '🔥',
        condition: { type: 'streak', target: 5 },
        reward: { points: 150, tokens: 7 },
      });
    }

    return newAchievements;
  },
}));
