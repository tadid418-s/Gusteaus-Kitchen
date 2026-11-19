'use client';

import React from 'react';
import { Language } from '../../types/customer';
import { CUSTOMER_TRANSLATIONS } from '../../data/customer-menu';
import { Icons } from '../ui/Icons';

interface FloatingCartBarProps {
  itemCount: number;
  totalETB: number;
  onOpenCart: () => void;
  lang: Language;
}

export const FloatingCartBar: React.FC<FloatingCartBarProps> = ({
  itemCount,
  totalETB,
  onOpenCart,
  lang,
}) => {
  const t = CUSTOMER_TRANSLATIONS[lang];

  if (itemCount === 0) return null;

  return (
    <aside
      aria-label="Floating cart summary"
      className="fixed bottom-[72px] left-0 right-0 z-30 px-4 pointer-events-none"
    >
      <div className="max-w-md mx-auto pointer-events-auto">
        <button
          type="button"
          onClick={onOpenCart}
          className="w-full h-14 rounded-2xl bg-[#2B2623] hover:bg-[#3C3531] active:scale-[0.99] text-white px-5 flex items-center justify-between shadow-[0_8px_30px_rgba(43,38,35,0.25)] transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] focus-visible:ring-offset-2"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center font-mono font-bold text-xs">
              {itemCount}
            </div>
            <div className="text-left leading-tight">
              <span className="text-xs uppercase tracking-wider text-stone-300 font-semibold block">
                {itemCount === 1 ? '1 item' : `${itemCount} items`}
              </span>
              <span className="text-sm font-extrabold font-mono text-[#F4EFE6]">
                {totalETB.toLocaleString()} ETB
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
            <span>{t.viewCart}</span>
            <Icons.ChevronRight />
          </div>
        </button>
      </div>
    </aside>
  );
};
