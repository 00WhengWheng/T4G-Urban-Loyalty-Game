import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Trophy, Clock, Zap } from 'lucide-react';
import { GameEngine } from '../engine/GameEngine';
import { GameConfig, GameResult, GameState } from '../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { toast } from 'sonner';

interface PhaserGameComponentProps {
  config: GameConfig;
  onGameEnd?: (result: GameResult) => void;
  onScoreUpdate?: (score: number) => void;
  className?: string;
}

export const PhaserGameComponent: React.FC<PhaserGameComponentProps> = ({
  config,
  onGameEnd,
  onScoreUpdate,
  className = '',
}) => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    currentGame: null,
    isPlaying: false,
    isPaused: false,
    score: 0,
    timeRemaining: 0,
    lives: 3,
    level: 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  // Initialize game engine
  useEffect(() => {
    if (!gameEngineRef.current) {
      gameEngineRef.current = GameEngine.getInstance();
    }
    
    return () => {
      // Cleanup on unmount
      if (gameEngineRef.current) {
        gameEngineRef.current.destroyCurrentGame();
      }
    };
  }, []);

  // Setup game event callbacks
  useEffect(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.setEventCallbacks({
        onGameStart: () => {
          setGameStarted(true);
          setGameState(prev => ({ ...prev, isPlaying: true, isPaused: false }));
          toast.success('Game started!');
        },
        onGameEnd: (result: GameResult) => {
          setGameStarted(false);
          setGameState(prev => ({ ...prev, isPlaying: false }));
          onGameEnd?.(result);
          toast.success(`Game completed! Score: ${result.score}`);
        },
        onGamePause: () => {
          setGameState(prev => ({ ...prev, isPaused: true }));
          toast.info('Game paused');
        },
        onGameResume: () => {
          setGameState(prev => ({ ...prev, isPaused: false }));
          toast.success('Game resumed');
        },
        onScoreUpdate: (score: number) => {
          setGameState(prev => ({ ...prev, score }));
          onScoreUpdate?.(score);
        },
        onLevelUp: (level: number) => {
          setGameState(prev => ({ ...prev, level }));
          toast.success(`Level up! Level ${level}`);
        },
      });
    }
  }, [onGameEnd, onScoreUpdate]);

  const initializeGame = useCallback(async () => {
    if (!gameContainerRef.current || !gameEngineRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const containerId = `game-container-${config.id}`;
      gameContainerRef.current.id = containerId;

      await gameEngineRef.current.initializeGame(config, containerId);
      
      // Update game state
      const currentState = gameEngineRef.current.getGameState();
      setGameState(currentState);
      
      toast.success('Game loaded successfully!');
    } catch (err) {
      console.error('Failed to initialize game:', err);
      setError(err instanceof Error ? err.message : 'Failed to load game');
      toast.error('Failed to load game');
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  const startGame = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.startGame();
    }
  }, []);

  const pauseGame = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.pauseGame();
    }
  }, []);

  const resumeGame = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.resumeGame();
    }
  }, []);

  const restartGame = useCallback(async () => {
    if (!gameContainerRef.current || !gameEngineRef.current) return;

    setIsLoading(true);
    try {
      const containerId = gameContainerRef.current.id;
      await gameEngineRef.current.restartGame(config, containerId);
      setGameStarted(false);
      toast.success('Game restarted!');
    } catch (err) {
      console.error('Failed to restart game:', err);
      toast.error('Failed to restart game');
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  // Handle game initialization when config changes
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const renderGameControls = () => (
    <div className="flex items-center justify-center gap-2 mb-4">
      {!gameStarted ? (
        <Button
          onClick={startGame}
          disabled={isLoading || !!error}
          className="flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          Start Game
        </Button>
      ) : (
        <>
          {gameState.isPaused ? (
            <Button
              onClick={resumeGame}
              className="flex items-center gap-2"
              variant="primary"
            >
              <Play className="w-4 h-4" />
              Resume
            </Button>
          ) : (
            <Button
              onClick={pauseGame}
              className="flex items-center gap-2"
              variant="secondary"
            >
              <Pause className="w-4 h-4" />
              Pause
            </Button>
          )}
          <Button
            onClick={restartGame}
            className="flex items-center gap-2"
            variant="outline"
            disabled={isLoading}
          >
            <RotateCcw className="w-4 h-4" />
            Restart
          </Button>
        </>
      )}
    </div>
  );

  const renderGameInfo = () => (
    <div className="flex items-center justify-between mb-4 text-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="font-medium">{gameState.score}</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="w-4 h-4 text-blue-500" />
          <span className="font-medium">Level {gameState.level}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-green-500" />
          <span className="font-medium">{Math.ceil(gameState.timeRemaining)}s</span>
        </div>
      </div>
      <Badge variant={gameState.isPlaying ? 'success' : 'default'}>
        {gameState.isPlaying ? (gameState.isPaused ? 'Paused' : 'Playing') : 'Ready'}
      </Badge>
    </div>
  );

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 font-semibold mb-2">Game Load Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={initializeGame} variant="outline">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className={`${className}`}>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-lg"
          >
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p>Loading game...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {renderGameInfo()}
      {renderGameControls()}
      
      <div className="relative">
        <div
          ref={gameContainerRef}
          className="w-full bg-gray-900 rounded-lg overflow-hidden min-h-[400px] flex items-center justify-center"
          style={{ aspectRatio: window.innerWidth < 768 ? '4/3' : '16/9' }}
        >
          {!gameStarted && !isLoading && (
            <div className="text-center text-white">
              <h3 className="text-xl font-bold mb-2">{config.name}</h3>
              <p className="text-gray-300 mb-4">{config.description}</p>
              <div className="flex items-center justify-center gap-4 text-sm">
                <span>Difficulty: {config.difficulty}</span>
                <span>•</span>
                <span>Target: {config.targetScore} pts</span>
                <span>•</span>
                <span>Duration: {config.maxDuration}s</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhaserGameComponent;
