'use client';

import React, { useState, useEffect, memo } from 'react';
import { Icons } from './Icons';

interface TimerBadgeProps {
  placedAt: number;
}

const TimerBadgeComponent: React.FC<TimerBadgeProps> = ({ placedAt }) => {
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

  let pillClasses = 'bg-[#FAF6EE] text-stone-600 border border-stone-200/50';
  if (minutes >= 25) {
    pillClasses = 'bg-rose-50 text-rose-700 border border-rose-200/70 animate-flash-red font-bold';
  } else if (minutes >= 15) {
    pillClasses = 'bg-amber-50 text-amber-800 border border-amber-200/70 font-semibold';
  }

  return (
    <span
      suppressHydrationWarning
      aria-label={`Elapsed time: ${minutes} minutes and ${seconds} seconds`}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono tabular-nums transition-colors duration-200 shadow-2xs ${pillClasses}`}
    >
      <Icons.Clock />
      <span suppressHydrationWarning>{timeFormatted}</span>
    </span>
  );
};

export const TimerBadge = memo(TimerBadgeComponent);
