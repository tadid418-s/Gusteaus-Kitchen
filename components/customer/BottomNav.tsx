'use client';

import React from 'react';
import { Language } from '../../types/customer';
import { CUSTOMER_TRANSLATIONS } from '../../data/customer-menu';
import { Icons } from '../ui/Icons';

export type CustomerTab = 'menu' | 'search' | 'orders' | 'cart';

interface BottomNavProps {
  activeTab: CustomerTab;
  onSelectTab: (tab: CustomerTab) => void;
  cartCount: number;
  hasActiveOrder?: boolean;
  lang: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  cartCount,
  hasActiveOrder,
  lang,
}) => {
  const t = CUSTOMER_TRANSLATIONS[lang];

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/60 shadow-[0_-4px_20px_-4px_rgba(43,38,35,0.08)] px-3 py-2"
    >
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
        {/* MENU TAB */}
        <button
          type="button"
          onClick={() => onSelectTab('menu')}
          aria-label={t.menuTab}
          aria-pressed={activeTab === 'menu'}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-150 cursor-pointer min-h-[50px] ${
            activeTab === 'menu'
              ? 'text-[#B4693A] font-bold'
              : 'text-stone-400 hover:text-stone-700 font-medium'
          }`}
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <Icons.MenuBook />
          </div>
          <span className="text-[11px] mt-1 leading-none">{t.menuTab}</span>
        </button>

        {/* SEARCH TAB */}
        <button
          type="button"
          onClick={() => onSelectTab('search')}
          aria-label={t.searchTab}
          aria-pressed={activeTab === 'search'}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-150 cursor-pointer min-h-[50px] ${
            activeTab === 'search'
              ? 'text-[#B4693A] font-bold'
              : 'text-stone-400 hover:text-stone-700 font-medium'
          }`}
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <Icons.Search />
          </div>
          <span className="text-[11px] mt-1 leading-none">{t.searchTab}</span>
        </button>

        {/* ORDERS & TRACKING TAB */}
        <button
          type="button"
          onClick={() => onSelectTab('orders')}
          aria-label={t.ordersTab}
          aria-pressed={activeTab === 'orders'}
          className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-150 cursor-pointer min-h-[50px] ${
            activeTab === 'orders'
              ? 'text-[#B4693A] font-bold'
              : 'text-stone-400 hover:text-stone-700 font-medium'
          }`}
        >
          <div className="w-5 h-5 flex items-center justify-center relative">
            <Icons.Receipt />
            {hasActiveOrder && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
            )}
          </div>
          <span className="text-[11px] mt-1 leading-none">{t.ordersTab}</span>
        </button>

        {/* CART TAB */}
        <button
          type="button"
          onClick={() => onSelectTab('cart')}
          aria-label={`${t.cartTab} (${cartCount})`}
          aria-pressed={activeTab === 'cart'}
          className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-150 cursor-pointer min-h-[50px] ${
            activeTab === 'cart'
              ? 'text-[#B4693A] font-bold'
              : 'text-stone-400 hover:text-stone-700 font-medium'
          }`}
        >
          <div className="w-5 h-5 flex items-center justify-center relative">
            <Icons.ShoppingBag />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full bg-[#B4693A] text-white font-mono text-[10px] font-bold shadow-xs">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-1 leading-none">{t.cartTab}</span>
        </button>
      </div>
    </nav>
  );
};
