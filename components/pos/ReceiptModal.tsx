'use client';

import React, { useEffect } from 'react';
import { OrderTicket, PaymentMethod } from '../../types/pos';
import { Icons } from '../ui/Icons';

interface ReceiptModalProps {
  order: OrderTicket | null;
  paymentMethod: PaymentMethod;
  onClose: () => void;
  onConfirmPrint: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  paymentMethod,
  onClose,
  onConfirmPrint,
}) => {
  useEffect(() => {
    if (!order) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [order, onClose]);

  if (!order) return null;

  const subtotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * 0.15;
  const donation = order.type === 'dine-in' ? 5.99 : 0;
  const total = subtotal + tax + donation;
  const methodLabel = (order.paymentMethod || paymentMethod).toUpperCase();

  const handlePrint = () => {
    onConfirmPrint();
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
      className="fixed inset-0 z-50 bg-[#2B2623]/45 flex items-center justify-center p-5"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* TOP HEADER */}
        <div className="bg-[#2B2623] text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icons.Print />
            <h3 id="receipt-modal-title" className="font-bold text-base tracking-tight">
              Guest Receipt
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close receipt preview"
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A]"
          >
            ✕
          </button>
        </div>

        {/* THERMAL RECEIPT PAPER */}
        <div className="p-6 overflow-y-auto bg-[#FAF6EE]">
          <div className="bg-white rounded-xl p-6 shadow-sm font-mono text-xs text-stone-700 space-y-5">
            {/* Bistro Brand Header */}
            <div className="text-center border-b border-dashed border-stone-200 pb-5 space-y-1">
              <div className="w-11 h-11 rounded-xl bg-[#2B2623] text-white mx-auto flex items-center justify-center mb-3">
                <Icons.SpoonLogo />
              </div>
              <div className="font-sans text-xl font-extrabold text-[#2B2623] tracking-tight">
                Gusteau&apos;s Kitchen
              </div>
              <p className="text-[11px] text-stone-400">14 Rue de la Gastronomie, Paris</p>
              <p className="text-[11px] text-stone-400">+251 11 555 0194</p>
            </div>

            {/* Meta info */}
            <div className="grid grid-cols-2 gap-y-1.5 text-[11px] border-b border-dashed border-stone-200 pb-4">
              <span className="text-stone-400">Order #</span>
              <span className="text-right font-bold text-[#2B2623]">{order.orderNumber}</span>

              <span className="text-stone-400">Table</span>
              <span className="text-right font-bold text-[#2B2623]">
                {order.tableNumber || 'Takeaway Counter'}
              </span>

              <span className="text-stone-400">Server</span>
              <span className="text-right">{order.waiterName || 'Sakib Mahamud'}</span>

              <span className="text-stone-400">Date</span>
              <span className="text-right" suppressHydrationWarning>
                {new Date().toLocaleDateString()}{' '}
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Line Items */}
            <div className="space-y-3 border-b border-dashed border-stone-200 pb-4">
              {order.items.map((item) => (
                <div key={item.id} className="space-y-1">
                  <div className="flex justify-between font-bold text-[#2B2623]">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  {item.modifiers && item.modifiers.length > 0 && (
                    <div className="pl-3 text-[10px] text-stone-500">
                      {item.modifiers.map((m) => m.name).join(', ')}
                    </div>
                  )}
                  {item.specialRequest && (
                    <div className="pl-3 text-[10px] italic text-stone-400">
                      Note: {item.specialRequest}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-stone-500">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>VAT / Tax (15%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              {donation > 0 && (
                <div className="flex justify-between text-stone-400">
                  <span>Community Kitchen</span>
                  <span>${donation.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-[#2B2623] pt-3 border-t border-stone-200">
                <span>TOTAL</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method Stamp */}
            <div className="pt-2 text-center">
              <div
                className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wider ${
                  order.paymentStatus === 'paid'
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-amber-50 text-amber-800'
                }`}
              >
                {order.paymentStatus === 'paid'
                  ? `✓ PAID · ${methodLabel}`
                  : `METHOD · ${methodLabel}`}
              </div>
              <p className="text-[11px] text-stone-400 mt-4 font-sans leading-relaxed">
                Merci! Anyone can cook, but only the fearless can be great.
              </p>
            </div>
          </div>
        </div>

        {/* ACTIONS: Ghost Close + Single Primary Print */}
        <div className="bg-white px-6 py-5 shadow-[0_-2px_12px_-4px_rgba(43,38,35,0.06)] flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 h-14 rounded-xl text-stone-500 hover:text-[#2B2623] hover:bg-[#F4EFE6] font-semibold text-sm cursor-pointer transition-colors duration-200"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 h-14 rounded-xl bg-[#2B2623] hover:bg-[#3D3632] hover:-translate-y-0.5 active:translate-y-0 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] focus-visible:ring-offset-2"
          >
            <Icons.Print />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
