import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { Card } from './Card';

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'yellow';
  trend?: string;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  icon, 
  color = 'blue',
  trend,
  className 
}) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
    yellow: 'from-yellow-500 to-yellow-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={clsx('relative overflow-hidden', className)}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className={clsx(
              'w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white',
              colors[color]
            )}>
              {icon}
            </div>
            {trend && (
              <span className="text-sm font-medium text-green-600">
                {trend}
              </span>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-4 translate-x-4"></div>
      </Card>
    </motion.div>
  );
};