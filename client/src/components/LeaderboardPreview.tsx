import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Card } from './ui/Card';

// Leaderboard Preview Component
interface TopUser {
  id: number;
  username: string;
  points: number;
  level: number;
}

interface LeaderboardPreviewProps {
  topUsers: TopUser[];
}

export const LeaderboardPreview: React.FC<LeaderboardPreviewProps> = ({ topUsers }) => {
  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${position}`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Top Players</h3>
            <Link 
              to="/leaderboard"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Vedi classifica
            </Link>
          </div>
          
          {topUsers.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Classifica non disponibile</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topUsers.map((user, index) => (
                <div 
                  key={user.id} 
                  className={`flex items-center space-x-3 p-3 rounded-lg ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' :
                    index === 1 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200' :
                    index === 2 ? 'bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200' :
                    'bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 flex items-center justify-center">
                    <span className="text-lg font-bold">
                      {getMedalIcon(index + 1)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      Livello {user.level}
                    </p>
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    {user.points.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Link 
              to="/leaderboard"
              className="w-full bg-primary-50 text-primary-700 hover:bg-primary-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Visualizza Classifica Completa
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};