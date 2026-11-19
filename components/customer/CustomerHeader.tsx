'use client';

import React from 'react';
import { Language } from '../../types/customer';
import { CUSTOMER_TRANSLATIONS } from '../../data/customer-menu';
import { Icons } from '../ui/Icons';

interface CustomerHeaderProps {
  orderType: 'dine-in' | 'takeaway';
  tableNumber?: string;
  lang: Language;
  onToggleLang: () => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenStaff?: () => void;
}

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({
  orderType,
  tableNumber,
  lang,
  onToggleLang,
  cartCount,
  onOpenCart,
  onOpenStaff,
}) => {
  const t = CUSTOMER_TRANSLATIONS[lang];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/60 shadow-[0_2px_12px_-4px_rgba(43,38,35,0.05)] px-4 sm:px-6 py-3.5">
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
        {/* BRAND LOGO & TITLE */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#2B2623] flex items-center justify-center text-white shadow-xs flex-shrink-0">
            <Icons.SpoonLogo />
          </div>
          <div className="min-w-0 leading-tight">
            <h1 className="text-base sm:text-lg font-extrabold text-[#2B2623] tracking-tight truncate">
              {t.brandName}
            </h1>
            <p className="text-[11px] text-[#B4693A] font-medium truncate">
              {orderType === 'dine-in' ? (tableNumber ? `${tableNumber} · Dine-in` : 'Dine-in') : 'Takeaway'}
            </p>
          </div>
        </div>

        {/* ORDER CONTEXT CHIP & ACTION CONTROLS */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* LOCKED TABLE BADGE OR TAKEAWAY CHIP */}
          {orderType === 'dine-in' && tableNumber ? (
            <div
              title={t.lockedTableNote}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80 text-xs font-bold shadow-2xs"
            >
              <span className="text-[11px]">🔒</span>
              <span className="tracking-wide">{tableNumber}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200/60 text-xs font-bold">
              <span>🥡</span>
              <span>{t.takeaway}</span>
            </div>
          )}

          {/* AMHARIC / ENGLISH TOGGLE */}
          <button
            type="button"
            onClick={onToggleLang}
            aria-label={`Switch language to ${lang === 'en' ? 'Amharic' : 'English'}`}
            className="h-9 px-2.5 rounded-xl bg-[#FAF6EE] hover:bg-[#EFE7D8] text-xs font-extrabold text-[#2B2623] border border-stone-200/60 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <span>{lang === 'en' ? 'አማ' : 'EN'}</span>
          </button>

          {/* STAFF LINK (IF OFFERED) */}
          {onOpenStaff && (
            <button
              type="button"
              onClick={onOpenStaff}
              title={t.staffKitchenLink}
              className="hidden sm:flex h-9 px-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-[#2B2623] text-xs font-semibold items-center gap-1 transition-colors cursor-pointer"
            >
              <Icons.ChefHat />
              <span className="text-[11px]">Staff</span>
            </button>
          )}

          {/* CART ICON WITH LIVE BADGE */}
          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`${t.cartTab} with ${cartCount} items`}
            className="relative w-10 h-10 rounded-xl bg-[#2B2623] text-white flex items-center justify-center transition-all duration-150 cursor-pointer shadow-xs active:scale-95"
          >
            <Icons.ShoppingBag />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#B4693A] text-white font-mono font-extrabold text-[11px] flex items-center justify-center ring-2 ring-white animate-bounce-short">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
