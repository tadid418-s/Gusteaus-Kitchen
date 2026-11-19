'use client';

import React, { useState, useMemo, memo } from 'react';
import { OrderTicket, RoleMode } from '../../types/pos';
import { DishStatusPhoto } from '../ui/DishStatusPhoto';
import { TimerBadge } from '../ui/TimerBadge';
import { Icons } from '../ui/Icons';

interface OrderCardProps {
  order: OrderTicket;
  role: RoleMode;
  isSelected?: boolean;
  featured?: boolean;
  onSelect: () => void;
  onAdvanceStage: (orderId: string) => void;
  onClaimDelivery?: (orderId: string) => void;
}

const OrderCardComponent: React.FC<OrderCardProps> = ({
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

  // Lighter, modern top accent bars
  const topAccentClass = order.isOverdue
    ? 'border-t-4 border-t-rose-400'
    : isNew
    ? 'border-t-4 border-t-sky-400 animate-pulse-new'
    : isPreparing
    ? 'border-t-4 border-t-amber-300'
    : 'border-t-4 border-t-emerald-400';

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

  // Flatten and categorize modifiers
  const { allAllergies, standardModifiers, orderSpecialRequests } = useMemo(() => {
    const allMods = order.items.flatMap((item) => item.modifiers || []);
    const allergies = allMods.filter((m) => m.type === 'allergy');
    const standards = allMods.filter((m) => m.type !== 'allergy');
    const reqs = order.items
      .filter((item) => Boolean(item.specialRequest))
      .map((item) => `${item.name}: ${item.specialRequest}`);

    return {
      allAllergies: allergies,
      standardModifiers: standards,
      orderSpecialRequests: reqs,
    };
  }, [order.items]);

  const hasModifiersOrNotes = Boolean(
    allAllergies.length > 0 ||
      standardModifiers.length > 0 ||
      orderSpecialRequests.length > 0 ||
      order.notes
  );

  return (
    <article
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      aria-label={`Order ticket ${order.orderNumber} for ${order.tableNumber || 'Takeaway customer'}, status ${order.status}`}
      onKeyDown={handleKeyDown}
      onClick={onSelect}
      className={`group relative flex flex-col justify-between h-[340px] bistro-surface bistro-surface-hover rounded-2xl p-5 sm:p-5.5 cursor-pointer hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF6EE] ${topAccentClass} ${
        isSelected ? 'ring-2 ring-[#B4693A] ring-offset-2 ring-offset-[#FAF6EE]' : ''
      }`}
    >
      <div>
        {/* CARD TOP BAR (Fixed 28px height) */}
        <div className="flex items-center justify-between gap-2.5 h-7 mb-3">
          <div className="flex items-center gap-2 truncate">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide truncate ${
                order.type === 'takeaway'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                  : 'bg-[#FAF6EE] text-[#2B2623] border border-stone-200/50'
              }`}
            >
              {order.type === 'takeaway' ? 'Takeaway · Paid' : order.tableNumber || 'Dine-in'}
            </span>
            <span className="text-xs font-mono text-stone-400">{order.orderNumber}</span>
          </div>
          <TimerBadge placedAt={order.placedAt} />
        </div>

        {/* HERO PHOTO + DISH TITLE (Fixed 68px height) */}
        <div className="flex items-center gap-3.5 my-1 h-[68px]">
          <div className="relative flex-shrink-0">
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
                className="absolute -bottom-1 -right-1 bg-[#2B2623] text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs"
              >
                x{heroItem.quantity}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-0.5">
            <h4
              title={heroItem?.name}
              className="text-base sm:text-lg font-extrabold text-[#2B2623] tracking-tight leading-snug line-clamp-2"
            >
              {heroItem?.quantity}x {heroItem?.name}
            </h4>
            {order.items.length > 1 ? (
              <p className="text-xs font-semibold text-[#B4693A] truncate">
                +{order.items.length - 1} more dish{order.items.length - 1 > 1 ? 'es' : ''} ({totalItemCount} total)
              </p>
            ) : (
              <p className="text-xs text-stone-400 font-normal truncate">
                {heroItem?.category || 'Single dish'}
              </p>
            )}
            {order.waiterName && (
              <p className="text-[11px] text-stone-400 font-normal truncate">Server · {order.waiterName}</p>
            )}
          </div>
        </div>

        {/* STANDARDIZED MODIFIERS SLOT (Strictly 88px tall so 2nd additions never expand the card) */}
        <div className="h-[88px] max-h-[88px] my-2.5 p-2.5 rounded-xl bg-stone-50/80 border border-stone-200/50 flex flex-col justify-start overflow-y-auto scrollbar-thin space-y-1.5">
          {hasModifiersOrNotes ? (
            <>
              {/* Allergy alert badges first */}
              {allAllergies.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {allAllergies.map((allergy) => (
                    <span
                      key={allergy.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500 text-white shadow-2xs"
                    >
                      <Icons.AlertTriangle />
                      <span>{allergy.name.toUpperCase()}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Additions & Removals chips */}
              {standardModifiers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {standardModifiers.map((mod) => (
                    <span
                      key={mod.id}
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                        mod.type === 'removal'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200/50'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      }`}
                    >
                      {mod.type === 'removal' ? '✕' : '+'} {mod.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Special Requests */}
              {orderSpecialRequests.length > 0 && (
                <p className="text-[11px] italic text-amber-900 leading-tight truncate" title={orderSpecialRequests.join(', ')}>
                  <span className="font-semibold not-italic">Req:</span> &ldquo;{orderSpecialRequests.join(', ')}&rdquo;
                </p>
              )}

              {/* General Order Notes */}
              {order.notes && (
                <p className="text-[11px] italic text-stone-500 leading-tight truncate" title={order.notes}>
                  <span className="font-semibold not-italic">Note:</span> &ldquo;{order.notes}&rdquo;
                </p>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-[11px] text-stone-400 italic">
              Standard bistro recipe · No custom notes
            </div>
          )}
        </div>
      </div>

      {/* FULL-WIDTH STANDARDIZED ACTION/STATUS BAR (Exact 56px height across every card) */}
      <div className="mt-2">
        {role === 'chef' ? (
          isNew ? (
            <button
              type="button"
              onClick={handleActionClick}
              disabled={isUpdating}
              aria-label={`Start preparing ticket ${order.orderNumber}`}
              className="w-full h-14 rounded-xl bg-sky-500 hover:bg-sky-600 hover:-translate-y-0.5 active:translate-y-0 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all duration-200 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] focus-visible:ring-offset-2"
            >
              <Icons.ChefHat />
              <span>{isUpdating ? 'Firing order...' : 'Start Preparing'}</span>
            </button>
          ) : isPreparing ? (
            <button
              type="button"
              onClick={handleActionClick}
              disabled={isUpdating}
              aria-label={`Mark ticket ${order.orderNumber} as ready for pickup`}
              className="w-full h-14 rounded-xl bg-amber-500 hover:bg-amber-600 hover:-translate-y-0.5 active:translate-y-0 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all duration-200 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] focus-visible:ring-offset-2"
            >
              <Icons.Check />
              <span>{isUpdating ? 'Plating...' : 'Mark Ready'}</span>
            </button>
          ) : (
            <div className="w-full h-14 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-semibold text-xs flex items-center justify-center gap-2">
              <Icons.Check />
              <span>Waiting on the pass for a runner</span>
            </div>
          )
        ) : isReady ? (
          <button
            type="button"
            onClick={handleActionClick}
            disabled={isUpdating}
            aria-label={`Claim delivery for order ${order.orderNumber}`}
            className="w-full h-14 rounded-xl bg-emerald-500 hover:bg-emerald-600 hover:-translate-y-0.5 active:translate-y-0 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all duration-200 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] focus-visible:ring-offset-2"
          >
            <Icons.PackageCheck />
            <span>{isUpdating ? 'Claiming...' : 'Claim Delivery'}</span>
          </button>
        ) : order.paymentStatus === 'paid' ? (
          <div className="w-full h-14 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-semibold text-xs flex items-center justify-center gap-2">
            <Icons.Check />
            <span>Settled via {(order.paymentMethod || 'cash').toUpperCase()} · Tap for receipt</span>
          </div>
        ) : order.status === 'served' ? (
          <div className="w-full h-14 rounded-xl bg-rose-50 text-rose-700 border border-rose-200/60 font-semibold text-xs flex items-center justify-center gap-2">
            <Icons.CreditCard />
            <span>At table · Tap to settle &amp; print receipt</span>
          </div>
        ) : (
          <div className="w-full h-14 rounded-xl bg-[#FAF6EE] text-stone-500 border border-stone-200/50 font-medium text-xs flex items-center justify-center gap-2">
            <Icons.Clock />
            <span>{isPreparing ? 'On the fire in kitchen' : 'Queued with kitchen'}</span>
          </div>
        )}
      </div>
    </article>
  );
};

export const OrderCard = memo(OrderCardComponent);
