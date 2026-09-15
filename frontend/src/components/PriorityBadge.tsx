import React from 'react';
import { Priority } from '../types/ticket';

interface PriorityBadgeProps {
  priority?: Priority | string;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority = 'P2', size = 'md' }) => {
  const p = priority.toUpperCase();

  const colorStyles: Record<string, string> = {
    P0: 'bg-red-500/20 text-[#ef4444] border-red-500/40 font-bold',
    P1: 'bg-orange-500/20 text-[#f97316] border-orange-500/40 font-semibold',
    P2: 'bg-yellow-500/20 text-[#eab308] border-yellow-500/40 font-medium',
    P3: 'bg-green-500/20 text-[#22c55e] border-green-500/40 font-medium',
  };

  const style = colorStyles[p] || colorStyles.P2;
  const sizeClasses = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center rounded-[4px] border uppercase tracking-wider ${sizeClasses} ${style}`}
    >
      {p}
    </span>
  );
};
