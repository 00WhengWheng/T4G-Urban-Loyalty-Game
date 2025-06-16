import React from 'react';
import { clsx } from 'clsx';

// Loading Spinner Component
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex items-center justify-center">
      <div className={clsx(
        'animate-spin rounded-full border-2 border-gray-200 border-t-primary-600',
        sizes[size]
      )}></div>
    </div>
  );
};