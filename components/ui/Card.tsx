import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hover = false }) => {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl shadow-lg p-6 border border-gray-200',
        hover && 'transition-transform duration-200 hover:scale-105 hover:shadow-xl',
        className
      )}
    >
      {children}
    </div>
  );
};

