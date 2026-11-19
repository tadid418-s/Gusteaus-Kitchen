'use client';

import React, { useState, memo } from 'react';
import Image from 'next/image';
import { OrderStatus } from '../../types/pos';
import { Icons } from './Icons';

interface DishStatusPhotoProps {
  imageUrl?: string;
  name: string;
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
  isOverdue?: boolean;
}

const DishStatusPhotoComponent: React.FC<DishStatusPhotoProps> = ({
  imageUrl,
  name,
  status,
  size = 'md',
  isOverdue,
}) => {
  const [hasError, setHasError] = useState(false);

  // Modern soft pastel status rings
  let ringColor = 'border-sky-400 ring-sky-100';
  if (isOverdue) {
    ringColor = 'border-rose-400 ring-rose-100 animate-pulse';
  } else if (status === 'preparing') {
    ringColor = 'border-amber-300 ring-amber-100';
  } else if (status === 'ready' || status === 'served') {
    ringColor = 'border-emerald-400 ring-emerald-100';
  }

  const dimensionClasses = {
    sm: 'w-10 h-10',
    md: 'w-20 h-20 sm:w-24 sm:h-24',
    lg: 'w-28 h-28 sm:w-32 sm:h-32',
  }[size];

  const imageSizes = {
    sm: '40px',
    md: '(max-width: 640px) 80px, 96px',
    lg: '(max-width: 640px) 112px, 128px',
  }[size];

  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0">
      <div
        className={`${dimensionClasses} relative rounded-full overflow-hidden border-2 p-0.5 ring-4 shadow-2xs transition-all duration-300 bg-white ${ringColor}`}
      >
        {!hasError && imageUrl ? (
          <div className="relative w-full h-full rounded-full overflow-hidden">
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes={imageSizes}
              className="object-cover rounded-full"
              onError={() => setHasError(true)}
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-stone-100 rounded-full">
            <Icons.PlateFallback
              color={isOverdue ? '#F43F5E' : status === 'preparing' ? '#F59E0B' : '#38BDF8'}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export const DishStatusPhoto = memo(DishStatusPhotoComponent);
