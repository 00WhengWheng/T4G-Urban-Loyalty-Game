import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gamepad2, 
  Trophy, 
  Clock, 
  Star, 
  Zap, 
  Brain,
  Target,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  XCircle,
  Award,
  TrendingUp,
  Users,
  Filter,
  Search
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ProgressBar } from '../components/ui/ProgressBar';
import { toast } from 'sonner';

// Mock games data
const mockGames = [
  {
    id: '1',
    title: 'Quiz Cultura Generale',
    description: 'Metti alla prova le tue conoscenze',
    game_type: 'quiz',
    difficulty_level: 2,
    points_per_completion: 25,
    max_attempts_per_user: 3,
    time_limit_seconds: 180,
    is_active: true,
    tenant: { business_name: 'Bar Central' },
    game_data: {
      questions: [
        {
          question: 'Qual è la capitale d\'Italia?',
          options: ['Milano', 'Roma', 'Napoli', 'Torino'],
          correctAnswer: 1
        },
        {
          question: 'Chi ha scritto la Divina Commedia?',
          options: ['Petrarca', 'Boccaccio', 'Dante', 'Manzoni'],
          correctAnswer: 2
        },
        {
          question: 'In che anno è finita la Seconda Guerra Mondiale?',
          options: ['1944', '1945', '1946', '1947'],
          correctAnswer: 1
        }
      ]
    },
    stats: {
      total_attempts: 127,
      average_score: 2.1,
      completion_rate: 68
    }
  },
  {
    id: '2',
    title: 'Reaction Speed Test',
    description: 'Quanto sono veloci i tuoi riflessi?',
    game_type: 'reaction',
    difficulty_level: 1,
    points_per_completion: 15,
    max_attempts_per_user: 5,
    time_limit_seconds: 60,
    is_active: true,
    tenant: { business_name: 'TechStore Plus' },
    game_data: {
      rounds: 5,
      targetTime: 300 // ms
    },
    stats: {
      total_attempts: 89,
      average_score: 287,
      completion_rate: 82
    }
  },
  {
    id: '3',
    title: 'Quiz Gastronomia',
    description: 'Tutto sulla cucina italiana',
    game_type: 'quiz',
    difficulty_level: 3,
    points_per_completion: 35,
    max_attempts_per_user: 2,
    time_limit_seconds: 240,
    is_active: true,
    tenant: { business_name: 'Pizzeria Roma' },
    game_data: {
      questions: [
        {
          question: 'Quale ingrediente NON fa parte della pizza Margherita?',
          options: ['Pomodoro', 'Mozzarella', 'Basilico', 'Prosciutto'],
          correctAnswer: 3
        },
        {
          question: 'Da quale regione proviene il Parmigiano Reggiano?',
          options: ['Lazio', 'Emilia-Romagna', 'Lombardia', 'Veneto'],
          correctAnswer: 1
        }
      ]
    },
    stats: {
      total_attempts: 45,
      average_score: 1.6,
      completion_rate: 54
    }
  }
];

// Games Page Component
export const GamesPage: React.FC = () => {
  const { user, updateUserPoints } = useAuthStore();
  const [searchParams] = useSearchParams();
  const gameType = searchParams.get('type');
  const [games, setGames] = useState(mockGames);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>(gameType || 'all');
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [userAttempts, setUserAttempts] = useState<Record<string, number>>({
    '1': 1, '2': 2, '3': 0
  });

  // Filter games
  const filteredGames = games.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         game.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || game.game_type === selectedFilter;
    return matchesSearch && matchesFilter && game.is_active;
  });

  const getDifficultyColor = (level: number) => {
    switch (level) {
      case 1: return 'text-green-600 bg-green-100';
      case 2: return 'text-orange-600 bg-orange-100';
      case 3: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyLabel = (level: number) => {
    switch (level) {
      case 1: return 'Facile';
      case 2: return 'Medio';
      case 3: return 'Difficile';
      default: return 'Base';
    }
  };

  const getGameIcon = (type: string) => {
    switch (type) {
      case 'quiz': return Brain;
      case 'reaction': return Zap;
      case 'memory': return Target;
      default: return Gamepad2;
    }
  };

  const handlePlayGame = (game: any) => {
    const attemptsUsed = userAttempts[game.id] || 0;
    if (attemptsUsed >= game.max_attempts_per_user) {
      toast.error('Hai esaurito i tentativi disponibili per questo gioco');
      return;
    }
    setSelectedGame(game);
  };

  const handleGameComplete = (gameId: string, points: number) => {
    setUserAttempts(prev => ({
      ...prev,
      [gameId]: (prev[gameId] || 0) + 1
    }));
    updateUserPoints(points);
    setSelectedGame(null);
    toast.success(`Hai guadagnato ${points} punti!`);
  };

  if (selectedGame) {
    if (selectedGame.game_type === 'quiz') {
      return <QuizGame game={selectedGame} onComplete={handleGameComplete} onClose={() => setSelectedGame(null)} />;
    } else if (selectedGame.game_type === 'reaction') {
      return <ReactionGame game={selectedGame} onComplete={handleGameComplete} onClose={() => setSelectedGame(null)} />;
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quick Games</h1>
        <p className="text-gray-600">Gioca, divertiti e guadagna punti</p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Cerca giochi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="flex space-x-2">
          {[
            { value: 'all', label: 'Tutti' },
            { value: 'quiz', label: 'Quiz' },
            { value: 'reaction', label: 'Reazione' },
            { value: 'memory', label: 'Memoria' }
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedFilter(filter.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === filter.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="text-center p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Gamepad2 className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">127</h3>
          <p className="text-sm text-gray-600">Giochi Completati</p>
        </Card>
        <Card className="text-center p-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">2,450</h3>
          <p className="text-sm text-gray-600">Punti da Giochi</p>
        </Card>
        <Card className="text-center p-6">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Star className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">8.2</h3>
          <p className="text-sm text-gray-600">Punteggio Medio</p>
        </Card>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGames.map((game, index) => {
          const IconComponent = getGameIcon(game.game_type);
          const attemptsUsed = userAttempts[game.id] || 0;
          const attemptsRemaining = game.max_attempts_per_user - attemptsUsed;

          return (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{game.title}</h3>
                        <p className="text-sm text-gray-500">{game.tenant.business_name}</p>
                      </div>
                    </div>
                    <Badge className={getDifficultyColor(game.difficulty_level)} size="sm">
                      {getDifficultyLabel(game.difficulty_level)}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4">{game.description}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Trophy className="w-4 h-4 text-orange-500" />
                      <span className="text-gray-600">{game.points_per_completion} punti</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-600">{Math.floor(game.time_limit_seconds / 60)}min</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-green-500" />
                      <span className="text-gray-600">{game.stats.total_attempts} giocatori</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-600">{game.stats.completion_rate}% successo</span>
                    </div>
                  </div>

                  {/* Attempts */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Tentativi</span>
                      <span className="font-medium">
                        {attemptsUsed}/{game.max_attempts_per_user}
                      </span>
                    </div>
                    <ProgressBar 
                      progress={(attemptsUsed / game.max_attempts_per_user) * 100} 
                      color={attemptsRemaining > 0 ? 'blue' : 'red'}
                    />
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => handlePlayGame(game)}
                    disabled={attemptsRemaining === 0}
                    className="w-full"
                    variant={attemptsRemaining === 0 ? 'outline' : 'primary'}
                  >
                    {attemptsRemaining === 0 ? (
                      'Tentativi Esauriti'
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Gioca ({attemptsRemaining} rimanenti)
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredGames.length === 0 && (
        <div className="text-center py-12">
          <Gamepad2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun gioco trovato</h3>
          <p className="text-gray-500">Prova a cambiare i filtri di ricerca</p>
        </div>
      )}
    </div>
  );
};

// Quiz Game Component
interface QuizGameProps {
  game: any;
  onComplete: (gameId: string, points: number) => void;
  onClose: () => void;
}

export const QuizGame: React.FC<QuizGameProps> = ({ game, onComplete, onClose }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(game.time_limit_seconds);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGameEnded, setIsGameEnded] = useState(false);
  const [score, setScore] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();

  const questions = game.game_data.questions;
  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (isGameStarted && !isGameEnded && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !isGameEnded) {
      handleGameEnd();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, isGameStarted, isGameEnded]);

  const startGame = () => {
    setIsGameStarted(true);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleGameEnd();
    }
  };

  const handleGameEnd = () => {
    setIsGameEnded(true);
    
    // Calculate score
    let correctAnswers = 0;
    selectedAnswers.forEach((answer, index) => {
      if (answer === questions[index].correctAnswer) {
        correctAnswers++;
      }
    });
    
    setScore(correctAnswers);
    
    // Calculate points based on performance
    const percentage = (correctAnswers / questions.length) * 100;
    let pointsEarned = 0;
    
    if (percentage >= 80) pointsEarned = game.points_per_completion;
    else if (percentage >= 60) pointsEarned = Math.floor(game.points_per_completion * 0.7);
    else if (percentage >= 40) pointsEarned = Math.floor(game.points_per_completion * 0.5);
    
    setTimeout(() => {
      onComplete(game.id, pointsEarned);
    }, 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isGameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="text-center p-8">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{game.title}</h2>
            <p className="text-gray-600 mb-6">{game.description}</p>
            
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Round:</span>
                <span className="font-medium">{totalRounds}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Obiettivo:</span>
                <span className="font-medium">{'<'}{targetTime}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Punti disponibili:</span>
                <span className="font-medium">{game.points_per_completion}</span>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                💡 Clicca il cerchio verde il più velocemente possibile quando appare!
              </p>
            </div>

            <div className="space-y-3">
              <Button onClick={startGame} className="w-full">
                <Play className="w-4 h-4 mr-2" />
                Inizia Test
              </Button>
              <Button onClick={onClose} variant="outline" className="w-full">
                Annulla
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (isGameEnded) {
    const validTimes = reactionTimes.filter(time => time > 0);
    const avgTime = validTimes.length > 0 ? validTimes.reduce((a, b) => a + b, 0) / validTimes.length : 1000;
    const bestTime = validTimes.length > 0 ? Math.min(...validTimes) : 1000;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="text-center p-8">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              avgTime <= targetTime ? 'bg-green-100' : 'bg-orange-100'
            }`}>
              {avgTime <= targetTime ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <Clock className="w-8 h-8 text-orange-600" />
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Completato!</h2>
            <p className="text-gray-600 mb-6">I tuoi tempi di reazione</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <div className="text-sm text-gray-600">Tempo Medio</div>
                <div className="text-2xl font-bold text-primary-600">
                  {Math.round(avgTime)}ms
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Migliore</div>
                <div className="text-lg font-semibold text-green-600">
                  {Math.round(bestTime)}ms
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Round Completati</div>
                <div className="text-lg font-semibold">
                  {validTimes.length}/{totalRounds}
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              Tornando alla lista giochi...
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Game playing interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 relative" onClick={handleClick}>
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white">
        <Button onClick={onClose} variant="outline" size="sm" className="text-white border-white">
          <X className="w-4 h-4 mr-2" />
          Esci
        </Button>
        <div className="text-center">
          <div className="text-lg font-bold">Round {currentRound + 1}/{totalRounds}</div>
          {reactionTimes.length > 0 && (
            <div className="text-sm opacity-75">
              Ultimo: {Math.round(reactionTimes[reactionTimes.length - 1])}ms
            </div>
          )}
        </div>
        <div className="w-16"> {/* Spacer */}</div>
      </div>

      {/* Game Area */}
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-white">
          {gameState === 'waiting' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-2xl font-bold mb-4">Preparati...</div>
              <div className="text-lg opacity-75">Il cerchio apparirà presto</div>
            </motion.div>
          )}

          {gameState === 'click' && showTarget && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-32 h-32 bg-green-500 rounded-full cursor-pointer shadow-lg hover:bg-green-400 transition-colors"
            />
          )}

          {gameState === 'too_early' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="text-2xl font-bold mb-4 text-red-400">Troppo presto!</div>
              <div className="text-lg opacity-75">Aspetta il cerchio verde</div>
            </motion.div>
          )}

          {gameState === 'ready' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="text-2xl font-bold mb-4 text-green-400">Ottimo!</div>
              <div className="text-lg opacity-75">
                {Math.round(reactionTimes[reactionTimes.length - 1])}ms
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Instructions */}
      {gameState === 'waiting' && (
        <div className="absolute bottom-8 left-4 right-4 text-center text-white opacity-75">
          <p className="text-sm">Clicca ovunque quando vedi il cerchio verde</p>
        </div>
      )}
    </div>
  );
};
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="text-center p-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{game.title}</h2>
            <p className="text-gray-600 mb-6">{game.description}</p>
            
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Domande:</span>
                <span className="font-medium">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tempo limite:</span>
                <span className="font-medium">{formatTime(game.time_limit_seconds)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Punti disponibili:</span>
                <span className="font-medium">{game.points_per_completion}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={startGame} className="w-full">
                <Play className="w-4 h-4 mr-2" />
                Inizia Quiz
              </Button>
              <Button onClick={onClose} variant="outline" className="w-full">
                Annulla
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (isGameEnded) {
    const percentage = (score / questions.length) * 100;
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="text-center p-8">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              percentage >= 60 ? 'bg-green-100' : 'bg-orange-100'
            }`}>
              {percentage >= 60 ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <XCircle className="w-8 h-8 text-orange-600" />
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Completato!</h2>
            <p className="text-gray-600 mb-6">
              Hai risposto correttamente a {score} su {questions.length} domande
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="text-3xl font-bold text-primary-600">
                {Math.round(percentage)}%
              </div>
              <ProgressBar progress={percentage} color={percentage >= 60 ? 'green' : 'orange'} />
            </div>

            <div className="text-sm text-gray-500">
              Tornando alla lista giochi...
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button onClick={onClose} variant="outline" size="sm">
            <X className="w-4 h-4 mr-2" />
            Esci
          </Button>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">{formatTime(timeLeft)}</div>
            <div className="text-sm text-gray-500">
              {currentQuestionIndex + 1} di {questions.length}
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            timeLeft > 30 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {timeLeft > 30 ? 'In tempo' : 'Affrettati!'}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <ProgressBar progress={((currentQuestionIndex + 1) / questions.length) * 100} />
        </div>

        {/* Question */}
        <Card className="p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {currentQuestion.question}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option: string, index: number) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  selectedAnswers[currentQuestionIndex] === index
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedAnswers[currentQuestionIndex] === index
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedAnswers[currentQuestionIndex] === index && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="font-medium">{option}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              onClick={handleNextQuestion}
              disabled={selectedAnswers[currentQuestionIndex] === undefined}
              className="min-w-[120px]"
            >
              {currentQuestionIndex === questions.length - 1 ? 'Termina' : 'Avanti'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

// Reaction Game Component
interface ReactionGameProps {
  game: any;
  onComplete: (gameId: string, points: number) => void;
  onClose: () => void;
}

export const ReactionGame: React.FC<ReactionGameProps> = ({ game, onComplete, onClose }) => {
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGameEnded, setIsGameEnded] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [waitingForClick, setWaitingForClick] = useState(false);
  const [showTarget, setShowTarget] = useState(false);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [clickStartTime, setClickStartTime] = useState(0);
  const [gameState, setGameState] = useState<'waiting' | 'ready' | 'click' | 'too_early'>('waiting');

  const totalRounds = game.game_data.rounds;
  const targetTime = game.game_data.targetTime;

  const startGame = () => {
    setIsGameStarted(true);
    startRound();
  };

  const startRound = () => {
    setGameState('waiting');
    setShowTarget(false);
    
    // Random delay between 1-4 seconds
    const delay = Math.random() * 3000 + 1000;
    
    setTimeout(() => {
      setGameState('click');
      setShowTarget(true);
      setClickStartTime(Date.now());
      setWaitingForClick(true);
    }, delay);
  };

  const handleClick = () => {
    if (gameState === 'waiting') {
      // Clicked too early
      setGameState('too_early');
      setTimeout(() => {
        if (currentRound < totalRounds - 1) {
          setCurrentRound(prev => prev + 1);
          startRound();
        } else {
          endGame();
        }
      }, 1500);
      return;
    }

    if (gameState === 'click' && waitingForClick) {
      const reactionTime = Date.now() - clickStartTime;
      setReactionTimes(prev => [...prev, reactionTime]);
      setWaitingForClick(false);
      setShowTarget(false);
      setGameState('ready');

      setTimeout(() => {
        if (currentRound < totalRounds - 1) {
          setCurrentRound(prev => prev + 1);
          startRound();
        } else {
          endGame();
        }
      }, 1000);
    }
  };

  const endGame = () => {
    setIsGameEnded(true);
    
    // Calculate average reaction time
    const validTimes = reactionTimes.filter(time => time > 0);
    const avgTime = validTimes.length > 0 ? validTimes.reduce((a, b) => a + b, 0) / validTimes.length : 1000;
    
    // Calculate points based on performance
    let pointsEarned = 0;
    if (avgTime <= targetTime) {
      pointsEarned = game.points_per_completion;
    } else if (avgTime <= targetTime * 1.5) {
      pointsEarned = Math.floor(game.points_per_completion * 0.7);
    } else if (avgTime <= targetTime * 2) {
      pointsEarned = Math.floor(game.points_per_completion * 0.5);
    }
    
    setTimeout(() => {
      onComplete(game.id, pointsEarned);
    }, 2000);
  };

  if (!isGameStarted) {