'use client';

import React from 'react';
import { CustomerOrder, Language } from '../../types/customer';
import { CUSTOMER_TRANSLATIONS } from '../../data/customer-menu';
import { Icons } from '../ui/Icons';

interface CustomerReceiptModalProps {
  order: CustomerOrder | null;
  onClose: () => void;
  lang: Language;
}

export const CustomerReceiptModal: React.FC<CustomerReceiptModalProps> = ({
  order,
  onClose,
  lang,
}) => {
  const t = CUSTOMER_TRANSLATIONS[lang];

  if (!order) return null;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#2B2623]/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* HEADER */}
        <div className="bg-[#2B2623] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icons.Receipt />
            <h3 className="font-extrabold text-sm">{t.receiptTitle}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close receipt"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* THERMAL PAPER BODY */}
        <div className="p-5 overflow-y-auto bg-[#FAF6EE]">
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-stone-200/60 font-mono text-xs text-stone-700 space-y-4">
            {/* BRAND HEADER */}
            <div className="text-center border-b border-dashed border-stone-200 pb-4 space-y-1">
              <div className="w-10 h-10 rounded-xl bg-[#2B2623] text-white mx-auto flex items-center justify-center mb-2">
                <Icons.SpoonLogo />
              </div>
              <div className="font-sans text-base font-extrabold text-[#2B2623]">
                {t.brandName}
              </div>
              <p className="text-[10px] text-stone-400">14 Rue de la Gastronomie, Paris</p>
              <p className="text-[10px] text-stone-400">+251 11 555 0194</p>
            </div>

            {/* META */}
            <div className="grid grid-cols-2 gap-y-1 text-[11px] border-b border-dashed border-stone-200 pb-3">
              <span className="text-stone-400">Order:</span>
              <span className="text-right font-bold text-[#2B2623]">{order.orderNumber}</span>

              <span className="text-stone-400">Type:</span>
              <span className="text-right font-bold text-[#2B2623]">
                {order.type === 'dine-in' ? order.tableNumber : 'Takeaway'}
              </span>

              {order.pickupTime && (
                <>
                  <span className="text-stone-400">Pickup:</span>
                  <span className="text-right text-[#2B2623]">{order.pickupTime}</span>
                </>
              )}

              <span className="text-stone-400">Payment:</span>
              <span className="text-right font-bold capitalize text-emerald-700">
                {order.paymentMethod} · {order.paymentStatus}
              </span>
            </div>

            {/* ITEM BREAKDOWN */}
            <div className="space-y-2 border-b border-dashed border-stone-200 pb-3">
              {order.items.map((item) => (
                <div key={item.cartItemId} className="flex justify-between items-start text-xs">
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="font-bold text-[#2B2623]">
                      {item.quantity}x {item.name}
                    </div>
                    {item.selectedModifiers.length > 0 && (
                      <div className="text-[10px] text-stone-400">
                        {item.selectedModifiers.map((m) => m.name).join(', ')}
                      </div>
                    )}
                  </div>
                  <span className="font-bold text-[#2B2623] whitespace-nowrap">
                    {(item.unitPriceETB * item.quantity).toLocaleString()} ETB
                  </span>
                </div>
              ))}
            </div>

            {/* FINANCIAL TOTALS */}
            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>{t.subtotal}</span>
                <span className="font-bold">{order.subtotalETB.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between">
                <span>{t.tax}</span>
                <span>{order.taxETB.toLocaleString()} ETB</span>
              </div>
              {order.serviceChargeETB > 0 && (
                <div className="flex justify-between">
                  <span>{t.serviceFee}</span>
                  <span>{order.serviceChargeETB.toLocaleString()} ETB</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-2 border-t border-stone-200 text-sm font-extrabold text-[#2B2623]">
                <span>{t.total}</span>
                <span className="font-mono text-base text-[#B4693A]">
                  {order.totalETB.toLocaleString()} ETB
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 h-12 rounded-xl bg-[#2B2623] hover:bg-[#3C3531] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
            >
              <Icons.Print />
              <span>{t.printReceipt}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
