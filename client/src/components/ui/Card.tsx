import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

// Card Component
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  hover = false,
  padding = 'none'
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div className={clsx(
      'bg-white rounded-xl shadow-sm border border-gray-200',
      hover && 'hover:shadow-md transition-shadow duration-200',
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
};