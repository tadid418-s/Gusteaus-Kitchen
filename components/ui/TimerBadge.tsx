'use client';

import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

interface TimerBadgeProps {
  placedAt: number;
}

export const TimerBadge: React.FC<TimerBadgeProps> = ({ placedAt }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    const update = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - placedAt) / 1000)));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [placedAt]);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timeFormatted = `${minutes}m ${seconds.toString().padStart(2, '0')}s`;

  let pillClasses = 'bg-stone-100 text-stone-600 border border-stone-200';
  if (minutes >= 25) {
    pillClasses = 'bg-red-50 text-red-700 border border-red-400 animate-flash-red font-bold';
  } else if (minutes >= 15) {
    pillClasses = 'bg-amber-50 text-amber-800 border border-amber-300 font-semibold';
  }

  return (
    <span
      suppressHydrationWarning
      aria-label={`Elapsed time: ${minutes} minutes and ${seconds} seconds`}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono tabular-nums transition-colors ${pillClasses}`}
    >
      <Icons.Clock />
      <span suppressHydrationWarning>{timeFormatted}</span>
    </span>
  );
};
