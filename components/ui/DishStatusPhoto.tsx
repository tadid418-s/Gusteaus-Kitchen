'use client';

import React, { useState } from 'react';
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

export const DishStatusPhoto: React.FC<DishStatusPhotoProps> = ({
  imageUrl,
  name,
  status,
  size = 'md',
  isOverdue,
}) => {
  const [hasError, setHasError] = useState(false);

  // Status Ring Color Tokens matching section 2 of doc
  let ringColor = 'border-blue-500 ring-blue-100';
  if (isOverdue) {
    ringColor = 'border-red-500 ring-red-200 animate-pulse';
  } else if (status === 'preparing') {
    ringColor = 'border-amber-500 ring-amber-100';
  } else if (status === 'ready' || status === 'served') {
    ringColor = 'border-emerald-500 ring-emerald-100';
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
        className={`${dimensionClasses} relative rounded-full overflow-hidden border-2 p-0.5 ring-4 shadow-sm transition-all duration-300 bg-white ${ringColor}`}
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
              color={isOverdue ? '#DC2626' : status === 'preparing' ? '#D97706' : '#2563EB'}
            />
          </div>
        )}
      </div>
    </div>
  );
};
