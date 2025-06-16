import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

// Daily Streak Component
interface DailyStreakProps {
  currentStreak: number;
  longestStreak: number;
  isStreakActive: boolean;
}

export const DailyStreak: React.FC<DailyStreakProps> = ({
  currentStreak,
  longestStreak,
  isStreakActive
}) => {
  return (
    <Card>
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
          🔥
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Striscia Giornaliera
        </h3>
        <p className="text-3xl font-bold text-orange-600 mb-2">
          {currentStreak} {currentStreak === 1 ? 'giorno' : 'giorni'}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Record: {longestStreak} giorni
        </p>
        
        {isStreakActive ? (
          <Badge variant="success">Attiva oggi!</Badge>
        ) : (
          <Badge variant="warning">Guadagna punti per continuare</Badge>
        )}
      </div>
    </Card>
  );
};