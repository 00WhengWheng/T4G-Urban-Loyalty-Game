import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, MapPin, Gamepad2, QrCode, Trophy, Share2, Clock, TrendingUp, Users } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';

// Welcome Header Component
interface WelcomeHeaderProps {
  user: any;
  level: number;
  points: number;
  progressToNextLevel: number;
}

export const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({
  user,
  level,
  points,
  progressToNextLevel
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buongiorno';
    if (hour < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  };

  const getUserTitle = (level: number) => {
    if (level <= 2) return 'Novizio';
    if (level <= 5) return 'Esploratore';
    if (level <= 10) return 'Veterano';
    return 'Maestro';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                {user?.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt="Avatar" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {getGreeting()}, {user?.first_name || user?.username || 'Utente'}!
                </h1>
                <p className="text-primary-100">
                  {getUserTitle(level)} • Livello {level} • {points.toLocaleString()} punti
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold">{points.toLocaleString()}</div>
              <div className="text-primary-200 text-sm">Punti Totali</div>
            </div>
          </div>
          
          {/* Level Progress */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-primary-100">Progresso verso il livello {level + 1}</span>
              <span className="text-white font-medium">{Math.round(progressToNextLevel)}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <motion.div
                className="bg-white rounded-full h-2"
                initial={{ width: 0 }}
                animate={{ width: `${progressToNextLevel}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};