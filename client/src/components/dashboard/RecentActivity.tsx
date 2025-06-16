import React from 'react';
import { motion } from 'framer-motion';
import { QrCode, Gamepad2, Trophy, Share2, Clock } from 'lucide-react';
import { Card } from '../ui/Card';

// Recent Activity Component
interface Activity {
  id: number;
  type: string;
  description: string;
  points: number;
  timestamp: Date;
}

interface RecentActivityProps {
  activities: Activity[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'nfc_scan':
        return <QrCode className="w-4 h-4 text-blue-600" />;
      case 'quiz_completed':
        return <Gamepad2 className="w-4 h-4 text-purple-600" />;
      case 'challenge_joined':
        return <Trophy className="w-4 h-4 text-orange-600" />;
      case 'social_share':
        return <Share2 className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}g fa`;
    if (hours > 0) return `${hours}h fa`;
    if (minutes > 0) return `${minutes}m fa`;
    return 'Ora';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card>
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Attività Recenti</h3>
          
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nessuna attività recente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                  {activity.points > 0 && (
                    <div className="text-sm font-medium text-green-600">
                      +{activity.points}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};