import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Gamepad2, QrCode, Trophy } from 'lucide-react';
import { Card } from './ui/Card';

// Quick Actions Component
export const QuickActions: React.FC = () => {
  const actions = [
    {
      title: 'Mappa',
      description: 'Esplora i commercianti',
      icon: <MapPin className="w-6 h-6" />,
      color: 'from-blue-500 to-blue-600',
      href: '/map',
    },
    {
      title: 'Quick Games',
      description: 'Gioca e guadagna',
      icon: <Gamepad2 className="w-6 h-6" />,
      color: 'from-purple-500 to-purple-600',
      href: '/games',
    },
    {
      title: 'Scansiona NFC',
      description: 'Ottieni punti istantanei',
      icon: <QrCode className="w-6 h-6" />,
      color: 'from-green-500 to-green-600',
      href: '/scan',
    },
    {
      title: 'Leaderboard',
      description: 'Sfida gli altri',
      icon: <Trophy className="w-6 h-6" />,
      color: 'from-orange-500 to-orange-600',
      href: '/leaderboard',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Link to={action.href}>
              <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="p-4 text-center">
                  <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center text-white mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};