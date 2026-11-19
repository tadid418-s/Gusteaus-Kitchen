'use client';

import React, { useState, useEffect, memo } from 'react';
import Image from 'next/image';
import { OrderTicket, RoleMode, PaymentMethod } from '../../types/pos';
import { formatClockTime } from '../../lib/utils';
import { Icons } from '../ui/Icons';

interface OrderDetailPanelProps {
  order: OrderTicket | null;
  role: RoleMode;
  onClose?: () => void;
  onAdvanceStage: (orderId: string) => void;
  onClaimDelivery?: (orderId: string) => void;
  onSubmitDraftOrder?: (orderId: string) => void;
  onOpenReceipt: (method: PaymentMethod) => void;
  onCompletePayment: (orderId: string, method: PaymentMethod) => void;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onClearOrder: () => void;
  onChangeTable?: () => void;
}

const OrderDetailPanelComponent: React.FC<OrderDetailPanelProps> = ({
  order,
  role,
  onClose,
  onAdvanceStage,
  onClaimDelivery,
  onSubmitDraftOrder,
  onOpenReceipt,
  onCompletePayment,
  onUpdateQuantity,
  onClearOrder,
  onChangeTable,
}) => {
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (order?.paymentMethod) {
      setSelectedPayment(order.paymentMethod);
    }
  }, [order?.id, order?.paymentMethod]);

  if (!order) {
    return (
      <div className="bistro-surface rounded-2xl p-8 h-full flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#FAF6EE] flex items-center justify-center text-stone-400 mb-5">
          <Icons.TableMap />
        </div>
        <h4 className="text-xl font-extrabold text-[#2B2623] tracking-tight">
          Ready when you are
        </h4>
        <p className="text-sm text-stone-500 max-w-xs mt-2 leading-relaxed">
          {role === 'waiter'
            ? 'Select a dining table on the left to start building an order, or tap any live ticket.'
            : 'Tap any kitchen ticket to see its full timing, allergies, and chef notes.'}
        </p>
      </div>
    );
  }

  const subtotal = order.items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const tax = subtotal * 0.15;
  const donation = order.type === 'dine-in' && order.items.length > 0 ? 5.99 : 0.0;
  const total = subtotal + tax + donation;

  const isDraft = order.status === 'draft';
  const isInKitchen = order.status === 'new' || order.status === 'preparing';
  const isReadyOrServed = order.status === 'ready' || order.status === 'served';
  const isPaid = order.paymentStatus === 'paid';

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onCompletePayment(order.id, selectedPayment);
    }, 350);
  };

  const handleSubmitDraft = () => {
    if (!onSubmitDraftOrder || order.items.length === 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onSubmitDraftOrder(order.id);
    }, 250);
  };

  return (
    <div className="bistro-surface rounded-2xl p-6 sm:p-7 flex flex-col justify-between h-full">
      {/* HEADER */}
      <div>
        <div className="flex items-start justify-between pb-5 border-b border-stone-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-2xl font-extrabold text-[#2B2623] tracking-tight">
                {order.tableNumber ? order.tableNumber : 'Takeaway'}
              </h3>
              {isDraft && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200/60">
                  Draft
                </span>
              )}
              {isPaid && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  Paid
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <p className="text-xs text-stone-400 font-mono">{order.orderNumber}</p>
              {role === 'waiter' && isDraft && onChangeTable && (
                <button
                  type="button"
                  onClick={onChangeTable}
                  className="text-xs font-semibold text-[#B4693A] hover:underline cursor-pointer"
                >
                  Switch table
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onClearOrder}
              aria-label={`Clear or cancel order ${order.orderNumber}`}
              className="w-10 h-10 rounded-xl hover:bg-red-50 text-stone-400 hover:text-red-600 flex items-center justify-center transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A]"
            >
              <Icons.Trash />
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close order details modal"
                className="lg:hidden w-10 h-10 rounded-xl bg-[#F4EFE6] text-stone-600 flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A]"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* TIMELINE STRIP */}
        {!isDraft && (
          <div className="my-5 py-3 px-4 bg-[#FAF6EE] rounded-xl flex items-center justify-between text-xs font-mono text-stone-500">
            <div>
              <span className="block font-sans text-[10px] uppercase tracking-wider text-stone-400">
                Placed
              </span>
              <span className="font-bold text-[#2B2623]" suppressHydrationWarning>
                {formatClockTime(order.placedAt)}
              </span>
            </div>
            <span className="text-stone-300">&rarr;</span>
            <div>
              <span className="block font-sans text-[10px] uppercase tracking-wider text-stone-400">
                Started
              </span>
              <span className="font-bold text-[#2B2623]" suppressHydrationWarning>
                {order.startedAt ? formatClockTime(order.startedAt) : 'Waiting'}
              </span>
            </div>
            <span className="text-stone-300">&rarr;</span>
            <div>
              <span className="block font-sans text-[10px] uppercase tracking-wider text-stone-400">
                Ready
              </span>
              <span className="font-bold text-[#2B2623]" suppressHydrationWarning>
                {order.readyAt ? formatClockTime(order.readyAt) : 'In prep'}
              </span>
            </div>
          </div>
        )}

        {/* ORDERED ITEMS LIST (clean whisper-thin dividers + hover row tint) */}
        <div className="my-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Items ({order.items.reduce((s, i) => s + i.quantity, 0)})
            </span>
            <span className="text-xs font-bold text-[#B4693A]">
              {isDraft
                ? 'Building ticket'
                : order.status === 'ready'
                ? 'Ready on the pass'
                : order.status === 'preparing'
                ? 'On the fire'
                : order.status === 'new'
                ? 'Queued'
                : 'Served'}
            </span>
          </div>

          {order.items.length === 0 ? (
            <div className="py-12 px-6 text-center rounded-xl bg-[#FAF6EE] space-y-2">
              <p className="text-sm font-bold text-[#2B2623]">The ticket is blank</p>
              <p className="text-xs text-stone-500 leading-relaxed">
                Tap any dish from the menu to customize modifiers and start building{' '}
                {order.tableNumber || 'this order'}.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100 max-h-[250px] overflow-y-auto -mx-2 px-2">
              {order.items.map((item) => (
                <OrderItemRow
                  key={item.id}
                  item={item}
                  canEdit={role === 'waiter' && !isPaid}
                  onUpdateQuantity={onUpdateQuantity}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER AREA */}
      <div className="mt-4 pt-5 border-t border-stone-100 space-y-5">
        {role === 'waiter' ? (
          <>
            {/* PAYMENT SUMMARY */}
            <div className="space-y-2 text-xs text-stone-500">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono text-[#2B2623]">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (15%)</span>
                <span className="font-mono text-[#2B2623]">${tax.toFixed(2)}</span>
              </div>
              {donation > 0 && (
                <div className="flex justify-between">
                  <span>Community kitchen</span>
                  <span className="font-mono text-stone-600">${donation.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline text-base font-extrabold text-[#2B2623] pt-3 border-t border-stone-100">
                <span>Total</span>
                <span className="font-mono text-xl">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* STAGE-SPECIFIC WAITER CONTROLS (Strict 1 Primary Action Hierarchy) */}
            {isDraft ? (
              <div className="space-y-3">
                <p className="text-xs text-center text-stone-400">
                  Payment &amp; receipt unlock once the kitchen plates the order.
                </p>
                <button
                  type="button"
                  onClick={handleSubmitDraft}
                  disabled={order.items.length === 0 || isProcessing}
                  aria-label={`Send order ${order.orderNumber} to kitchen`}
                  className="w-full h-16 rounded-xl bg-[#2B2623] hover:bg-[#3D3632] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:hover:translate-y-0 disabled:cursor-not-allowed text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-sm transition-all duration-200 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] focus-visible:ring-offset-2"
                >
                  <Icons.ChefHat />
                  <span>
                    {isProcessing
                      ? 'Firing to kitchen...'
                      : `Send Order to Kitchen (${order.items.reduce((s, i) => s + i.quantity, 0)})`}
                  </span>
                </button>
              </div>
            ) : isInKitchen ? (
              <div className="p-4 rounded-xl bg-[#FAF6EE] text-stone-600 space-y-1.5 text-xs leading-relaxed">
                <div className="font-bold text-[#2B2623] flex items-center gap-2 text-sm">
                  <Icons.Clock />
                  <span>
                    {order.status === 'new'
                      ? 'Waiting on the chef to pick up'
                      : 'Currently on the burners'}
                  </span>
                </div>
                <p>
                  As soon as the kitchen marks this ticket ready, payment choices and receipt printing will unlock right here.
                </p>
              </div>
            ) : isReadyOrServed ? (
              <div className="space-y-4">
                {/* Ready Banner with secondary Claim button */}
                {order.status === 'ready' && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/60 flex items-center justify-between gap-3">
                    <div className="text-xs text-emerald-950">
                      <span className="font-bold block">Hot &amp; ready on the pass</span>
                      <span className="text-emerald-700">Grab it before it cools.</span>
                    </div>
                    {onClaimDelivery && (
                      <button
                        type="button"
                        onClick={() => onClaimDelivery(order.id)}
                        className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all duration-200 cursor-pointer flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A]"
                      >
                        Claim Delivery
                      </button>
                    )}
                  </div>
                )}

                {/* PAYMENT METHOD SELECTOR */}
                <div>
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-2.5">
                    Payment Method
                  </span>
                  <div
                    className="grid grid-cols-3 gap-2.5"
                    role="radiogroup"
                    aria-label="Payment method"
                  >
                    {(['cash', 'card', 'telebirr'] as PaymentMethod[]).map((method) => {
                      const active = selectedPayment === method;
                      return (
                        <button
                          key={method}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setSelectedPayment(method)}
                          className={`p-3 rounded-xl text-center flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-200 ease-in-out min-h-[68px] justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] focus-visible:ring-offset-2 ${
                            active
                              ? 'bg-[#2B2623] text-white shadow-sm'
                              : 'bg-[#FAF6EE] text-stone-600 hover:bg-[#EFE8DB] hover:text-[#2B2623]'
                          }`}
                        >
                          {method === 'cash' ? (
                            <Icons.Cash />
                          ) : method === 'card' ? (
                            <Icons.CreditCard />
                          ) : (
                            <Icons.MobilePhone />
                          )}
                          <span className="text-xs font-bold capitalize">{method}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ACTION ROW: Secondary Print Receipt + Primary Pay */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenReceipt(selectedPayment)}
                    aria-label={`Print customer receipt for ${order.orderNumber}`}
                    className={`h-14 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 ease-in-out cursor-pointer min-h-[58px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] focus-visible:ring-offset-2 ${
                      isPaid
                        ? 'w-full bg-[#2B2623] hover:bg-[#3D3632] text-white shadow-sm'
                        : 'flex-1 bg-[#F4EFE6] hover:bg-[#EAE2D4] text-[#2B2623]'
                    }`}
                  >
                    <Icons.Print />
                    <span>Print Receipt</span>
                  </button>

                  {!isPaid && (
                    <button
                      type="button"
                      onClick={handlePay}
                      disabled={isProcessing}
                      aria-label={`Confirm payment via ${selectedPayment}`}
                      className="flex-[1.4] h-14 rounded-xl bg-emerald-500 hover:bg-emerald-600 hover:-translate-y-0.5 active:translate-y-0 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all duration-200 ease-in-out cursor-pointer min-h-[58px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] focus-visible:ring-offset-2"
                    >
                      <Icons.Check />
                      <span>
                        {isProcessing
                          ? 'Settling...'
                          : `Pay via ${selectedPayment.toUpperCase()}`}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          /* KITCHEN CHEF ACTIONS ONLY */
          <div className="space-y-4">
            <div className="p-4 bg-[#FAF6EE] rounded-xl text-xs text-stone-600 leading-relaxed border border-stone-200/50">
              <span className="font-bold text-[#2B2623] block mb-1">Kitchen Notes</span>
              <p>{order.notes || 'Standard bistro preparation—no extra notes from the floor.'}</p>
            </div>

            {order.status === 'new' ? (
              <button
                type="button"
                onClick={() => onAdvanceStage(order.id)}
                aria-label={`Start ticket ${order.orderNumber}`}
                className="w-full h-16 rounded-xl bg-sky-500 hover:bg-sky-600 hover:-translate-y-0.5 active:translate-y-0 text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-xs transition-all duration-200 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] focus-visible:ring-offset-2"
              >
                <Icons.ChefHat />
                <span>Start Preparing Ticket</span>
              </button>
            ) : order.status === 'preparing' ? (
              <button
                type="button"
                onClick={() => onAdvanceStage(order.id)}
                aria-label={`Mark ticket ${order.orderNumber} as ready`}
                className="w-full h-16 rounded-xl bg-amber-500 hover:bg-amber-600 hover:-translate-y-0.5 active:translate-y-0 text-white font-bold text-base flex items-center justify-center gap-2.5 shadow-xs transition-all duration-200 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] focus-visible:ring-offset-2"
              >
                <Icons.Check />
                <span>Mark Dish Ready</span>
              </button>
            ) : (
              <div className="w-full h-14 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-bold text-sm flex items-center justify-center gap-2">
                <Icons.Check />
                <span>Plated &amp; waiting on the pass</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const OrderItemRowComponent: React.FC<{
  item: OrderTicket['items'][0];
  canEdit: boolean;
  onUpdateQuantity: (itemId: string, delta: number) => void;
}> = ({ item, canEdit, onUpdateQuantity }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex items-start justify-between gap-3 py-3.5 px-2 rounded-xl text-sm hover:bg-[#FAF6EE] transition-colors duration-150">
      <div className="flex items-start gap-3 min-w-0">
        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 shadow-xs">
          {!imgError ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="40px"
              className="object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-stone-100">
              <Icons.PlateFallback color="#78716C" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-[#2B2623] truncate leading-snug">
            {item.quantity}x {item.name}
          </div>
          {item.modifiers && item.modifiers.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {item.modifiers.map((mod) => (
                <span
                  key={mod.id}
                  className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                    mod.type === 'allergy'
                      ? 'bg-rose-500 text-white shadow-2xs'
                      : mod.type === 'removal'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200/50'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  }`}
                >
                  {mod.name}
                </span>
              ))}
            </div>
          )}
          {item.specialRequest && (
            <p className="text-[11px] italic text-stone-500 mt-1 leading-relaxed">
              &ldquo;{item.specialRequest}&rdquo;
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-shrink-0">
        <span className="font-mono font-semibold text-[#2B2623]">
          ${(item.price * item.quantity).toFixed(2)}
        </span>
        {canEdit && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.id, -1)}
              aria-label={`Decrease quantity of ${item.name}`}
              className="w-7 h-7 rounded-lg bg-[#F4EFE6] hover:bg-[#E7DFD1] text-[#2B2623] flex items-center justify-center text-xs font-bold cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A]"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.id, 1)}
              aria-label={`Increase quantity of ${item.name}`}
              className="w-7 h-7 rounded-lg bg-[#F4EFE6] hover:bg-[#E7DFD1] text-[#2B2623] flex items-center justify-center text-xs font-bold cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A]"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const OrderItemRow = memo(OrderItemRowComponent);
export const OrderDetailPanel = memo(OrderDetailPanelComponent);
