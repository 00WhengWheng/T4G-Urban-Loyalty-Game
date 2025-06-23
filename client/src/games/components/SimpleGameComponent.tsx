import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Trophy, Clock, Zap } from 'lucide-react';
import { GameConfig, GameResult } from '../types';
import { createSimpleGame } from '../SimpleGames';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { toast } from 'sonner';

interface SimpleGameComponentProps {
  config: GameConfig;
  onGameEnd?: (result: GameResult) => void;
  onScoreUpdate?: (score: number) => void;
  className?: string;
}

export const SimpleGameComponent: React.FC<SimpleGameComponentProps> = ({
  config,
  onGameEnd,
  onScoreUpdate,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<any>(null);
  const startTimeRef = useRef<number | null>(null);
  
  const [gameState, setGameState] = useState({
    isPlaying: false,
    isPaused: false,
    score: 0,
    timeRemaining: config.maxDuration,
  });
  const [gameStarted, setGameStarted] = useState(false);

  const handleScoreUpdate = useCallback((score: number) => {
    setGameState(prev => ({ ...prev, score }));
    onScoreUpdate?.(score);
  }, [onScoreUpdate]);

  const handleGameEnd = useCallback((result: any) => {
    const endTime = Date.now();
    const duration = startTimeRef.current ? (endTime - startTimeRef.current) / 1000 : 0;
    
    const gameResult: GameResult = {
      ...result,
      duration,
      bonus: duration < config.maxDuration * 0.5 ? { type: 'time', multiplier: 1.5 } : undefined
    };

    setGameStarted(false);
    setGameState(prev => ({ ...prev, isPlaying: false, isPaused: false }));
    onGameEnd?.(gameResult);
    toast.success(`Game completed! Score: ${gameResult.score}`);
  }, [config.maxDuration, onGameEnd]);

  const initializeGame = useCallback(() => {
    if (!canvasRef.current) return;

    try {
      gameRef.current = createSimpleGame(
        config.type,
        canvasRef.current,
        config,
        handleScoreUpdate,
        handleGameEnd
      );
    } catch (error) {
      console.error('Failed to initialize game:', error);
      toast.error('Failed to initialize game');
    }
  }, [config, handleScoreUpdate, handleGameEnd]);

  const startGame = useCallback(() => {
    if (!gameRef.current) {
      initializeGame();
    }
    
    if (gameRef.current) {
      startTimeRef.current = Date.now();
      gameRef.current.start();
      setGameStarted(true);
      setGameState(prev => ({ 
        ...prev, 
        isPlaying: true, 
        isPaused: false,
        score: 0,
        timeRemaining: config.maxDuration
      }));
      
      // Start countdown timer
      const timer = setInterval(() => {
        setGameState(prev => {
          const newTimeRemaining = prev.timeRemaining - 1;
          if (newTimeRemaining <= 0) {
            clearInterval(timer);
            if (gameRef.current) {
              gameRef.current.stop();
            }
            return { ...prev, timeRemaining: 0, isPlaying: false };
          }
          return { ...prev, timeRemaining: newTimeRemaining };
        });
      }, 1000);
    }
  }, [config.maxDuration, initializeGame]);

  const stopGame = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.stop();
    }
    setGameStarted(false);
    setGameState(prev => ({ ...prev, isPlaying: false, isPaused: false }));
  }, []);

  const restartGame = useCallback(() => {
    stopGame();
    setTimeout(() => {
      initializeGame();
      startGame();
    }, 100);
  }, [stopGame, initializeGame, startGame]);

  useEffect(() => {
    initializeGame();
    
    return () => {
      if (gameRef.current) {
        gameRef.current.stop();
      }
    };
  }, [initializeGame]);

  const renderGameControls = () => (
    <div className="flex items-center justify-center gap-2 mb-4">
      {!gameStarted ? (
        <Button
          onClick={startGame}
          className="flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          Start Game
        </Button>
      ) : (
        <>
          <Button
            onClick={stopGame}
            className="flex items-center gap-2"
            variant="secondary"
          >
            <Pause className="w-4 h-4" />
            Stop
          </Button>
          <Button
            onClick={restartGame}
            className="flex items-center gap-2"
            variant="outline"
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
          <Clock className="w-4 h-4 text-green-500" />
          <span className="font-medium">{gameState.timeRemaining}s</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="w-4 h-4 text-blue-500" />
          <span className="font-medium">Target: {config.targetScore}</span>
        </div>
      </div>
      <Badge variant={gameState.isPlaying ? 'success' : 'default'}>
        {gameState.isPlaying ? 'Playing' : 'Ready'}
      </Badge>
    </div>
  );

  return (
    <div className={`${className}`}>
      {renderGameInfo()}
      {renderGameControls()}
      
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full border-2 border-gray-300 rounded-lg bg-gray-900"
          style={{ 
            maxWidth: '800px', 
            height: 'auto',
            aspectRatio: '4/3'
          }}
        />
        
        {!gameStarted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
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
          </div>
        )}
      </div>
      
      <div className="mt-4 text-sm text-gray-600 text-center">
        {config.controls.touch && "Touch/Tap to jump • "}
        {config.controls.keyboard && "Space or ↑ to jump • "}
        Avoid red obstacles • Collect yellow coins
      </div>
    </div>
  );
};

export default SimpleGameComponent;
