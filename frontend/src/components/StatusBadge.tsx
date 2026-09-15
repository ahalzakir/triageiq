import React from 'react';
import { TicketStatus } from '../types/ticket';

interface StatusBadgeProps {
  status?: TicketStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status = 'open' }) => {
  const s = status.toLowerCase();

  const styles: Record<string, { bg: string; text: string; label: string }> = {
    open: {
      bg: 'bg-blue-500/15 border-blue-500/30',
      text: 'text-blue-400',
      label: 'Open',
    },
    in_progress: {
      bg: 'bg-purple-500/15 border-purple-500/30',
      text: 'text-purple-300',
      label: 'In Progress',
    },
    escalated: {
      bg: 'bg-red-500/20 border-red-500/50 animate-pulse',
      text: 'text-red-400 font-semibold',
      label: 'Escalated',
    },
    resolved: {
      bg: 'bg-emerald-500/15 border-emerald-500/30',
      text: 'text-emerald-400',
      label: 'Resolved',
    },
  };

  const current = styles[s] || styles.open;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-[4px] border text-xs font-medium ${current.bg} ${current.text}`}
    >
      {current.label}
    </span>
  );
};
