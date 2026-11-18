'use client';

import React, { useState, useEffect } from 'react';
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

export const OrderDetailPanel: React.FC<OrderDetailPanelProps> = ({
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
      <div className="bg-white rounded-3xl p-6 h-full flex flex-col items-center justify-center text-center border border-stone-200">
        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
          <Icons.TableMap />
        </div>
        <h4 className="text-lg font-bold text-[#2B2623]">No Table or Ticket Selected</h4>
        <p className="text-xs text-stone-500 max-w-xs mt-1">
          {role === 'waiter'
            ? 'Step 1: Choose a table from the Table Map to begin a new order, or tap an active ticket.'
            : 'Tap an order card from the kitchen board to inspect items, allergies, and preparation notes.'}
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
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-stone-200 flex flex-col justify-between h-full">
      {/* HEADER */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-bold text-[#2B2623]">
                {order.tableNumber ? order.tableNumber : 'Takeaway Order'}
              </h3>
              {isDraft && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                  Draft
                </span>
              )}
              {isPaid && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  Paid
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-stone-600 font-mono">Order {order.orderNumber}</p>
              {role === 'waiter' && isDraft && onChangeTable && (
                <button
                  type="button"
                  onClick={onChangeTable}
                  className="text-[11px] font-semibold text-[#B4693A] hover:underline cursor-pointer"
                >
                  Change Table
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClearOrder}
              aria-label={`Clear or cancel order ${order.orderNumber}`}
              className="w-10 h-10 rounded-full hover:bg-red-50 text-stone-400 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200"
            >
              <Icons.Trash />
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close order details modal"
                className="lg:hidden w-10 h-10 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-300"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* TIMELINE STRIP */}
        {!isDraft && (
          <div className="my-3 py-2 px-3 bg-stone-50 rounded-2xl flex items-center justify-between text-[11px] font-mono text-stone-500">
            <div>
              <span className="block font-sans text-[10px] text-stone-400">Placed</span>
              <span className="font-semibold text-stone-700" suppressHydrationWarning>
                {formatClockTime(order.placedAt)}
              </span>
            </div>
            <span className="text-stone-300">&rarr;</span>
            <div>
              <span className="block font-sans text-[10px] text-stone-400">Started</span>
              <span className="font-semibold text-stone-700" suppressHydrationWarning>
                {order.startedAt ? formatClockTime(order.startedAt) : 'Pending'}
              </span>
            </div>
            <span className="text-stone-300">&rarr;</span>
            <div>
              <span className="block font-sans text-[10px] text-stone-400">Ready</span>
              <span className="font-semibold text-stone-700" suppressHydrationWarning>
                {order.readyAt ? formatClockTime(order.readyAt) : 'In Prep'}
              </span>
            </div>
          </div>
        )}

        {/* ORDERED ITEMS LIST */}
        <div className="my-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Ordered Items ({order.items.reduce((s, i) => s + i.quantity, 0)})
            </span>
            <span className="text-xs font-semibold text-[#B4693A]">
              {isDraft
                ? 'BUILDING ORDER'
                : order.status === 'ready'
                ? 'READY AT PASS'
                : order.status.toUpperCase()}
            </span>
          </div>

          {order.items.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-stone-50 border border-dashed border-stone-300 space-y-1.5">
              <p className="text-sm font-bold text-[#2B2623]">No dishes added yet</p>
              <p className="text-xs text-stone-500">
                Tap any dish in the <strong>Foodies Menu</strong> to customize modifiers &amp; add it to{' '}
                {order.tableNumber || 'this order'}.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
              {order.items.map((item) => (
                <OrderItemRow
                  key={item.id}
                  item={item}
                  role={role}
                  canEdit={role === 'waiter' && !isPaid}
                  onUpdateQuantity={onUpdateQuantity}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER AREA */}
      <div className="mt-4 pt-3 border-t border-stone-100 space-y-4">
        {role === 'waiter' ? (
          <>
            {/* PAYMENT SUMMARY */}
            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (15%)</span>
                <span className="font-mono">${tax.toFixed(2)}</span>
              </div>
              {donation > 0 && (
                <div className="flex justify-between text-stone-500">
                  <span>Donation for community kitchen</span>
                  <span className="font-mono">${donation.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-[#2B2623] pt-1.5 border-t border-stone-200">
                <span>Total</span>
                <span className="font-mono text-lg">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* STAGE-SPECIFIC WAITER CONTROLS */}
            {isDraft ? (
              /* STEP 3: SEND DRAFT ORDER TO KITCHEN */
              <div className="space-y-2.5">
                <p className="text-[11px] text-center text-stone-500 bg-stone-50 py-1.5 px-3 rounded-xl border border-stone-100">
                  Payment &amp; Receipt unlock once the Chef marks this order Ready
                </p>
                <button
                  type="button"
                  onClick={handleSubmitDraft}
                  disabled={order.items.length === 0 || isProcessing}
                  aria-label={`Send order ${order.orderNumber} to kitchen`}
                  className="w-full h-16 rounded-2xl bg-[#2B2623] hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99] text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-600"
                >
                  <Icons.ChefHat />
                  <span>
                    {isProcessing
                      ? 'Sending to Kitchen...'
                      : `Place Order to Kitchen (${order.items.reduce((s, i) => s + i.quantity, 0)})`}
                  </span>
                </button>
              </div>
            ) : isInKitchen ? (
              /* ORDER IS CURRENTLY IN THE KITCHEN */
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1 text-xs">
                <div className="font-bold flex items-center gap-1.5 text-sm">
                  <Icons.Clock />
                  <span>
                    {order.status === 'new'
                      ? 'Sent to Kitchen — Awaiting Chef'
                      : 'Chef is Preparing This Order'}
                  </span>
                </div>
                <p className="text-amber-800/80">
                  Once the Chef marks this ticket <strong>Ready</strong>, you can claim delivery, choose a payment method, and print the guest receipt here.
                </p>
              </div>
            ) : isReadyOrServed ? (
              /* STEP 4: CHEF MARKED READY -> CLAIM, CHOOSE PAYMENT METHOD & PRINT RECEIPT */
              <div className="space-y-3.5">
                {/* Ready Banner with optional Claim Delivery button */}
                {order.status === 'ready' && (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-2">
                    <div className="text-xs text-emerald-900">
                      <span className="font-bold block">🛎️ Ready at Kitchen Pass!</span>
                      <span>Food is cooked &amp; ready to serve.</span>
                    </div>
                    {onClaimDelivery && (
                      <button
                        type="button"
                        onClick={() => onClaimDelivery(order.id)}
                        className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer flex-shrink-0"
                      >
                        Claim Delivery
                      </button>
                    )}
                  </div>
                )}

                {/* PAYMENT METHOD SELECTOR (Cash, Card, Telebirr) */}
                <div>
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-2">
                    Touch to Choose Payment Method
                  </span>
                  <div
                    className="grid grid-cols-3 gap-2"
                    role="radiogroup"
                    aria-label="Payment method"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selectedPayment === 'cash'}
                      onClick={() => setSelectedPayment('cash')}
                      className={`p-3 rounded-2xl border-2 text-center flex flex-col items-center gap-1 cursor-pointer transition-all min-h-[64px] justify-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2B2623] ${
                        selectedPayment === 'cash'
                          ? 'border-[#2B2623] bg-[#2B2623] text-white shadow-sm'
                          : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <Icons.Cash />
                      <span className="text-xs font-bold">Cash</span>
                    </button>

                    <button
                      type="button"
                      role="radio"
                      aria-checked={selectedPayment === 'card'}
                      onClick={() => setSelectedPayment('card')}
                      className={`p-3 rounded-2xl border-2 text-center flex flex-col items-center gap-1 cursor-pointer transition-all min-h-[64px] justify-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2B2623] ${
                        selectedPayment === 'card'
                          ? 'border-[#2B2623] bg-[#2B2623] text-white shadow-sm'
                          : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <Icons.CreditCard />
                      <span className="text-xs font-bold">Card</span>
                    </button>

                    <button
                      type="button"
                      role="radio"
                      aria-checked={selectedPayment === 'telebirr'}
                      onClick={() => setSelectedPayment('telebirr')}
                      className={`p-3 rounded-2xl border-2 text-center flex flex-col items-center gap-1 cursor-pointer transition-all min-h-[64px] justify-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2B2623] ${
                        selectedPayment === 'telebirr'
                          ? 'border-[#2B2623] bg-[#2B2623] text-white shadow-sm'
                          : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <Icons.MobilePhone />
                      <span className="text-xs font-bold">Telebirr</span>
                    </button>
                  </div>
                </div>

                {/* CHECKOUT & PRINT RECEIPT BUTTONS */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenReceipt(selectedPayment)}
                    aria-label={`Print customer receipt for ${order.orderNumber}`}
                    className="flex-1 h-15 rounded-2xl border-2 border-stone-200 hover:bg-stone-50 text-[#2B2623] font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[60px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-300"
                  >
                    <Icons.Print />
                    <span>Print Receipt</span>
                  </button>

                  {!isPaid ? (
                    <button
                      type="button"
                      onClick={handlePay}
                      disabled={isProcessing}
                      aria-label={`Confirm payment via ${selectedPayment}`}
                      className="flex-[1.5] h-15 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer min-h-[60px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
                    >
                      <Icons.Check />
                      <span>
                        {isProcessing
                          ? 'Settling...'
                          : `Pay via ${selectedPayment.toUpperCase()}`}
                      </span>
                    </button>
                  ) : (
                    <div className="flex-[1.4] h-15 rounded-2xl bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-300 min-h-[60px]">
                      <Icons.Check />
                      <span>Paid ({(order.paymentMethod || selectedPayment).toUpperCase()})</span>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          /* KITCHEN CHEF ACTIONS ONLY (Section 6.5) */
          <div className="space-y-3">
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 text-xs text-stone-600">
              <span className="font-bold text-[#2B2623] block mb-1">Chef Checklist &amp; Notes:</span>
              <p>{order.notes || 'No special prep notes. Prepare according to standard bistro recipe.'}</p>
            </div>

            {order.status === 'new' ? (
              <button
                type="button"
                onClick={() => onAdvanceStage(order.id)}
                aria-label={`Start ticket ${order.orderNumber}`}
                className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
              >
                <Icons.ChefHat />
                <span>Start Preparing Ticket</span>
              </button>
            ) : order.status === 'preparing' ? (
              <button
                type="button"
                onClick={() => onAdvanceStage(order.id)}
                aria-label={`Mark ticket ${order.orderNumber} as ready`}
                className="w-full h-16 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
              >
                <Icons.Check />
                <span>Mark Dish Ready</span>
              </button>
            ) : (
              <div className="w-full h-16 rounded-2xl bg-emerald-50 text-emerald-800 font-bold text-sm flex items-center justify-center gap-2 border border-emerald-300">
                <Icons.Check />
                <span>Ready for Waitstaff Pickup</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const OrderItemRow: React.FC<{
  item: OrderTicket['items'][0];
  role: RoleMode;
  canEdit: boolean;
  onUpdateQuantity: (itemId: string, delta: number) => void;
}> = ({ item, canEdit, onUpdateQuantity }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <div className="flex items-start gap-2.5 min-w-0">
        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-stone-200">
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
          <div className="font-bold text-[#2B2623] truncate">
            {item.quantity}x {item.name}
          </div>
          {item.modifiers && item.modifiers.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {item.modifiers.map((mod) => (
                <span
                  key={mod.id}
                  className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    mod.type === 'allergy'
                      ? 'bg-red-600 text-white'
                      : mod.type === 'removal'
                      ? 'bg-red-50 text-red-600'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {mod.name}
                </span>
              ))}
            </div>
          )}
          {item.specialRequest && (
            <p className="text-[11px] italic text-stone-500 mt-0.5">
              Note: &ldquo;{item.specialRequest}&rdquo;
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="font-mono font-semibold text-stone-800">
          ${(item.price * item.quantity).toFixed(2)}
        </span>
        {canEdit && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.id, -1)}
              aria-label={`Decrease quantity of ${item.name}`}
              className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-xs font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.id, 1)}
              aria-label={`Increase quantity of ${item.name}`}
              className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-xs font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
