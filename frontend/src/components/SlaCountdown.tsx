import React from 'react';
import { useSlaCountdown } from '../hooks/useSlaCountdown';
import { Clock, AlertTriangle } from 'lucide-react';

interface SlaCountdownProps {
  deadlineIso?: string;
  isResolved?: boolean;
}

export const SlaCountdown: React.FC<SlaCountdownProps> = ({ deadlineIso, isResolved }) => {
  const { formatted, isBreached, hours } = useSlaCountdown(deadlineIso);

  if (isResolved) {
    return (
      <span className="inline-flex items-center text-xs text-slate-400">
        <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
        Met
      </span>
    );
  }

  if (!deadlineIso) {
    return <span className="text-xs text-slate-500">—</span>;
  }

  if (isBreached) {
    return (
      <span className="inline-flex items-center text-xs font-semibold text-[#ef4444] bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
        <span className="relative flex h-2 w-2 mr-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        <AlertTriangle className="w-3 h-3 mr-1 text-red-500" />
        {formatted}
      </span>
    );
  }

  // Future deadline: yellow if < 2 hours, green otherwise
  const isUrgent = hours < 2;

  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded border ${
        isUrgent
          ? 'text-[#eab308] bg-yellow-500/10 border-yellow-500/30'
          : 'text-[#22c55e] bg-green-500/10 border-green-500/30'
      }`}
    >
      <Clock className={`w-3 h-3 mr-1 ${isUrgent ? 'text-[#eab308]' : 'text-[#22c55e]'}`} />
      {formatted}
    </span>
  );
};
