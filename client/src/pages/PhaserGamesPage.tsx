import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gamepad2, 
  Trophy, 
  Clock, 
  Star, 
  Zap, 
  Target,
  Play,
  Filter,
  Search,
  X,
  Award,
  TrendingUp,
  Users
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from 'sonner';

// Import new game system
import { 
  SimpleGameComponent, 
  GameConfig, 
  GameResult, 
  GAME_CONFIGS, 
  getAllGameConfigs, 
  getGamesByDifficulty,
  useGameStore 
} from '../games';

interface GameCardProps {
  config: GameConfig;
  onPlay: (config: GameConfig) => void;
  userStats?: {
    bestScore: number;
    totalPlayed: number;
    lastPlayed?: Date;
  };
}

const GameCard: React.FC<GameCardProps> = ({ config, onPlay, userStats }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      case 'expert': return 'error';
      default: return 'default';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '🟢';
      case 'medium': return '🟡';
      case 'hard': return '🔴';
      case 'expert': return '🟣';
      default: return '⚪';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-6 h-full flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{config.name}</h3>
            <p className="text-gray-600 text-sm mb-3">{config.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={getDifficultyColor(config.difficulty) as any}>
              {getDifficultyIcon(config.difficulty)} {config.difficulty}
            </Badge>
            <Badge variant="info">
              {config.rewards.tokens} tokens
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-500" />
            <span>Target: {config.targetScore}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-500" />
            <span>{config.maxDuration}s</span>
          </div>
          {userStats && (
            <>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span>Best: {userStats.bestScore}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-purple-500" />
                <span>Played: {userStats.totalPlayed}</span>
              </div>
            </>
          )}
        </div>

        <div className="mt-auto">
          <Button
            onClick={() => onPlay(config)}
            className="w-full flex items-center justify-center gap-2"
            variant="primary"
          >
            <Play className="w-4 h-4" />
            Play Game
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

export const PhaserGamesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addGameResult, unlockAchievement, checkAchievements, getGameStats } = useGameStore();
  
  const [selectedGame, setSelectedGame] = useState<GameConfig | null>(null);
  const [filteredGames, setFilteredGames] = useState<GameConfig[]>(getAllGameConfigs());
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter games based on search and difficulty
  useEffect(() => {
    let games = getAllGameConfigs();

    if (searchTerm) {
      games = games.filter(game => 
        game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (difficultyFilter) {
      games = getGamesByDifficulty(difficultyFilter);
    }

    setFilteredGames(games);
  }, [searchTerm, difficultyFilter]);

  const handleGameEnd = (result: GameResult) => {
    // Add result to store
    addGameResult(result);

    // Check for new achievements
    const newAchievements = checkAchievements(result);
    newAchievements.forEach((achievement: any) => {
      unlockAchievement(achievement);
      toast.success(`Achievement unlocked: ${achievement.name}!`, {
        description: achievement.description
      });
    });

    // Show result
    toast.success(
      `Game completed! Score: ${result.score}${result.bonus ? ` (Bonus: ${result.bonus.type})` : ''}`,
      {
        description: `Duration: ${Math.round(result.duration)}s • Tokens earned: ${Math.floor(result.score / 100)}`
      }
    );

    // Go back to game selection
    setSelectedGame(null);
  };

  const handleScoreUpdate = (score: number) => {
    // Real-time score updates could be sent to backend here
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDifficultyFilter('');
    setShowFilters(false);
  };

  if (selectedGame) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedGame.name}</h1>
              <p className="text-gray-600">{selectedGame.description}</p>
            </div>
            <Button
              onClick={() => setSelectedGame(null)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Back to Games
            </Button>
          </div>

          <SimpleGameComponent
            config={selectedGame}
            onGameEnd={handleGameEnd}
            onScoreUpdate={handleScoreUpdate}
            className="mb-8"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Gamepad2 className="w-8 h-8 text-blue-600" />
                Urban Games
              </h1>
              <p className="text-gray-600 mt-1">Play mini-games and earn tokens!</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="info" className="text-lg px-3 py-1">
                <Trophy className="w-4 h-4 mr-1" />
                {useGameStore.getState().totalTokensEarned} tokens
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search games..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? "primary" : "outline"}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Filter Options */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-white rounded-lg border border-gray-200"
            >
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Difficulty:</span>
                  {['easy', 'medium', 'hard', 'expert'].map(difficulty => (
                    <Button
                      key={difficulty}
                      size="sm"
                      variant={difficultyFilter === difficulty ? "primary" : "outline"}
                      onClick={() => setDifficultyFilter(difficultyFilter === difficulty ? '' : difficulty)}
                    >
                      {difficulty}
                    </Button>
                  ))}
                </div>
                {(searchTerm || difficultyFilter) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearFilters}
                    className="flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((config) => (
            <GameCard
              key={config.id}
              config={config}
              onPlay={setSelectedGame}
              userStats={getGameStats(config.id)}
            />
          ))}
        </div>

        {filteredGames.length === 0 && (
          <div className="text-center py-12">
            <Gamepad2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No games found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhaserGamesPage;
