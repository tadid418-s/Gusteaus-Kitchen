'use client';

import React, { useState } from 'react';
import { OrderTicket, RoleMode } from '../../types/pos';
import { DishStatusPhoto } from '../ui/DishStatusPhoto';
import { TimerBadge } from '../ui/TimerBadge';
import { Icons } from '../ui/Icons';

interface OrderCardProps {
  order: OrderTicket;
  role: RoleMode;
  isSelected?: boolean;
  onSelect: () => void;
  onAdvanceStage: (orderId: string) => void;
  onClaimDelivery?: (orderId: string) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  role,
  isSelected,
  onSelect,
  onAdvanceStage,
  onClaimDelivery,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const heroItem = order.items[0];
  const totalItemCount = order.items.reduce((acc, curr) => acc + curr.quantity, 0);

  const isNew = order.status === 'new';
  const isPreparing = order.status === 'preparing';
  const isReady = order.status === 'ready';

  const cardBorderClasses = order.isOverdue
    ? 'border-2 border-red-500 shadow-red-100/50'
    : isNew
    ? 'border border-blue-400 animate-pulse-new'
    : isPreparing
    ? 'border border-amber-300 hover:border-amber-400'
    : 'border border-emerald-400 shadow-emerald-50';

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUpdating) return;
    setIsUpdating(true);

    if (role === 'waiter' && isReady && onClaimDelivery) {
      onClaimDelivery(order.id);
    } else {
      onAdvanceStage(order.id);
    }

    setTimeout(() => setIsUpdating(false), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <article
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      aria-label={`Order ticket ${order.orderNumber} for ${order.tableNumber || 'Takeaway customer'}, status ${order.status}`}
      onKeyDown={handleKeyDown}
      onClick={onSelect}
      className={`group relative flex flex-col justify-between bg-white rounded-3xl p-4 sm:p-5 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B4693A] ${cardBorderClasses} ${
        isSelected ? 'ring-4 ring-[#B4693A]/30 !border-[#B4693A]' : ''
      }`}
    >
      {/* CARD TOP BAR */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${
              order.type === 'takeaway'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-amber-100 text-amber-900'
            }`}
          >
            {order.type === 'takeaway' ? 'Takeaway: Paid' : order.tableNumber || 'Dine-in'}
          </span>
          <span className="text-xs font-mono text-stone-500">{order.orderNumber}</span>
        </div>
        <TimerBadge placedAt={order.placedAt} />
      </div>

      {/* HERO PHOTO + THUMBNAILS + DISH TITLE */}
      <div className="flex items-center gap-4 my-2">
        <div className="relative">
          <DishStatusPhoto
            imageUrl={heroItem?.imageUrl}
            name={heroItem?.name || 'Dish'}
            status={order.status}
            isOverdue={order.isOverdue}
            size="md"
          />
          {heroItem && (
            <span
              aria-label={`Quantity: ${heroItem.quantity}`}
              className="absolute -bottom-1 -right-1 bg-[#2B2623] text-white text-xs font-bold px-2 py-0.5 rounded-full shadow"
            >
              x{heroItem.quantity}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-lg sm:text-xl font-bold text-[#2B2623] leading-tight line-clamp-2">
            {heroItem?.quantity}x {heroItem?.name}
          </h4>
          {order.items.length > 1 && (
            <p className="text-xs font-medium text-[#B4693A] mt-1">
              +{order.items.length - 1} more item{order.items.length - 1 > 1 ? 's' : ''} ({totalItemCount} total)
            </p>
          )}
          {order.waiterName && (
            <p className="text-xs text-stone-600 mt-0.5">Waiter: {order.waiterName}</p>
          )}
        </div>
      </div>

      {/* MODIFIERS & ALLERGY HIGHLIGHTS (Prominent for Kitchen Chefs) */}
      <div className="my-2 space-y-1.5">
        {order.items.flatMap((item) =>
          item.modifiers?.map((mod) => (
            <div key={mod.id}>
              {mod.type === 'allergy' ? (
                <div
                  role="alert"
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                  <Icons.AlertTriangle />
                  <span>{mod.name.toUpperCase()}</span>
                </div>
              ) : mod.type === 'removal' ? (
                <span className="inline-block px-2 py-0.5 mr-1 bg-red-100 text-red-700 border border-red-200 rounded-md text-xs font-medium">
                  ✕ {mod.name}
                </span>
              ) : (
                <span className="inline-block px-2 py-0.5 mr-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-xs font-medium">
                  + {mod.name}
                </span>
              )}
            </div>
          ))
        )}

        {order.notes && (
          <p className="text-xs italic text-stone-500 line-clamp-2 bg-stone-50 p-2 rounded-lg border border-stone-100">
            &ldquo;{order.notes}&rdquo;
          </p>
        )}
      </div>

      {/* FULL-WIDTH ACTION BUTTON (64px or taller touch target, WCAG compliant) */}
      <div className="mt-3 pt-2">
        {role === 'chef' ? (
          isNew ? (
            <button
              type="button"
              onClick={handleActionClick}
              disabled={isUpdating}
              aria-label={`Start preparing ticket ${order.orderNumber}`}
              className="w-full h-14 sm:h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] focus-visible:ring-4 focus-visible:ring-blue-300 text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all min-h-[56px] cursor-pointer"
            >
              <Icons.ChefHat />
              <span>{isUpdating ? 'Starting...' : 'Start Preparing'}</span>
            </button>
          ) : isPreparing ? (
            <button
              type="button"
              onClick={handleActionClick}
              disabled={isUpdating}
              aria-label={`Mark ticket ${order.orderNumber} as ready for pickup`}
              className="w-full h-14 sm:h-16 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] focus-visible:ring-4 focus-visible:ring-amber-300 text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all min-h-[56px] cursor-pointer"
            >
              <Icons.Check />
              <span>{isUpdating ? 'Marking Ready...' : 'Mark Ready'}</span>
            </button>
          ) : (
            <div className="w-full h-12 rounded-2xl bg-emerald-50 text-emerald-700 font-semibold text-sm flex items-center justify-center gap-2 border border-emerald-200">
              <Icons.Check />
              <span>Food Ready at Pass Counter</span>
            </div>
          )
        ) : (
          /* Waitstaff Mode Action */
          isReady ? (
            <button
              type="button"
              onClick={handleActionClick}
              disabled={isUpdating}
              aria-label={`Claim delivery for order ${order.orderNumber}`}
              className="w-full h-14 sm:h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] focus-visible:ring-4 focus-visible:ring-emerald-300 text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all min-h-[56px] cursor-pointer"
            >
              <Icons.PackageCheck />
              <span>{isUpdating ? 'Claiming...' : 'Claim Delivery'}</span>
            </button>
          ) : (
            <div className="w-full h-12 rounded-2xl bg-stone-100 text-stone-600 font-medium text-xs flex items-center justify-center gap-1.5 border border-stone-200">
              <Icons.Clock />
              <span>In Kitchen &bull; {isPreparing ? 'Chef Cooking' : 'Order Queued'}</span>
            </div>
          )
        )}
      </div>
    </article>
  );
};
