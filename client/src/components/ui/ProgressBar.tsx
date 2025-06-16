import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

// Progress Bar Component
interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'orange' | 'purple';
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  className,
  size = 'md',
  color = 'blue',
  showLabel = false
}) => {
  const sizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const colors = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    orange: 'bg-orange-600',
    purple: 'bg-purple-600',
  };

  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={clsx('w-full', className)}>
      <div className={clsx(
        'bg-gray-200 rounded-full overflow-hidden',
        sizes[size]
      )}>
        <motion.div
          className={clsx('rounded-full', colors[color])}
          style={{ width: `${clampedProgress}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 mt-1">
          <span>0%</span>
          <span>{Math.round(clampedProgress)}%</span>
          <span>100%</span>
        </div>
      )}
    </div>
  );
};