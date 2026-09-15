import { useState, useEffect } from 'react';

export interface SlaCountdownResult {
  formatted: string;
  isBreached: boolean;
  hours: number;
  minutes: number;
  seconds: number;
}

export function useSlaCountdown(deadlineIso?: string): SlaCountdownResult {
  const [result, setResult] = useState<SlaCountdownResult>(() => calculateCountdown(deadlineIso));

  useEffect(() => {
    if (!deadlineIso) return;

    // Run immediately
    setResult(calculateCountdown(deadlineIso));

    const interval = setInterval(() => {
      setResult(calculateCountdown(deadlineIso));
    }, 1000);

    return () => clearInterval(interval);
  }, [deadlineIso]);

  return result;
}

function calculateCountdown(deadlineIso?: string): SlaCountdownResult {
  if (!deadlineIso) {
    return { formatted: 'No SLA', isBreached: false, hours: 0, minutes: 0, seconds: 0 };
  }

  const deadline = new Date(deadlineIso).getTime();
  if (isNaN(deadline)) {
    return { formatted: 'Invalid SLA', isBreached: false, hours: 0, minutes: 0, seconds: 0 };
  }

  const now = Date.now();
  const diffMs = deadline - now;
  const isBreached = diffMs < 0;
  const absMs = Math.abs(diffMs);

  const totalSeconds = Math.floor(absMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let formatted = '';
  if (isBreached) {
    if (hours > 0) {
      formatted = `BREACHED ${hours}h ${minutes}m ago`;
    } else if (minutes > 0) {
      formatted = `BREACHED ${minutes}m ${seconds}s ago`;
    } else {
      formatted = `BREACHED ${seconds}s ago`;
    }
  } else {
    if (hours > 0) {
      formatted = `${hours}h ${minutes}m remaining`;
    } else if (minutes > 0) {
      formatted = `${minutes}m ${seconds}s remaining`;
    } else {
      formatted = `${seconds}s remaining`;
    }
  }

  return { formatted, isBreached, hours, minutes, seconds };
}
