import React from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { ProgressBar } from './ui/ProgressBar';

// Challenge Progress Component
interface ChallengeProgressProps {
  challengeId: string;
  title: string;
  description: string;
  progress: number;
  totalSteps: number;
  participantsCount: number;
  daysRemaining?: number;
  isActive: boolean;
}

export const ChallengeProgress: React.FC<ChallengeProgressProps> = ({
  challengeId,
  title,
  description,
  progress,
  totalSteps,
  participantsCount,
  daysRemaining,
  isActive
}) => {
  const progressPercentage = (progress / totalSteps) * 100;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900">{title}</h4>
          <Badge 
            variant={isActive ? 'success' : daysRemaining && daysRemaining <= 2 ? 'warning' : 'info'}
            size="sm"
          >
            {isActive ? 'Attiva' : daysRemaining ? `${daysRemaining} giorni` : 'Terminata'}
          </Badge>
        </div>
        
        <p className="text-sm text-gray-600 mb-3">{description}</p>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progresso</span>
            <span className="font-medium">{progress}/{totalSteps}</span>
          </div>
          <ProgressBar progress={progressPercentage} color="blue" />
        </div>
        
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center text-sm text-gray-500">
            <Users className="w-4 h-4 mr-1" />
            <span>{participantsCount} partecipanti</span>
          </div>
          <Link 
            to={`/challenges/${challengeId}`}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            {progressPercentage === 100 ? 'Completata' : 'Continua →'}
          </Link>
        </div>
      </div>
    </Card>
  );
};