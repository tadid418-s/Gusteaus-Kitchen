'use client';

import React from 'react';
import { RoleMode } from '../../types/pos';
import { Icons } from '../ui/Icons';

interface LeftSidebarProps {
  role: RoleMode;
  waiterActiveTab: 'orders' | 'menu' | 'tables';
  onSelectTab: (tab: 'orders' | 'menu' | 'tables') => void;
  onShowToast: (msg: string) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  role,
  waiterActiveTab,
  onSelectTab,
  onShowToast,
}) => {
  return (
    <nav
      aria-label="Sidebar Navigation"
      className="hidden md:flex flex-col justify-between items-center bistro-surface rounded-2xl p-3.5 w-[72px] flex-shrink-0"
    >
      {/* Top navigation tabs */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onSelectTab('orders')}
          aria-label="Orders Line & Kanban Board"
          aria-pressed={role === 'chef' || waiterActiveTab === 'orders'}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] focus-visible:ring-offset-2 ${
            role === 'chef' || waiterActiveTab === 'orders'
              ? 'bg-[#2B2623] text-white shadow-sm'
              : 'text-stone-400 hover:bg-[#F4EFE6] hover:text-[#2B2623]'
          }`}
        >
          <Icons.OrdersGrid />
        </button>

        {role === 'waiter' && (
          <>
            <button
              type="button"
              onClick={() => onSelectTab('tables')}
              aria-label="Dining Room Table Map"
              aria-pressed={waiterActiveTab === 'tables'}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] focus-visible:ring-offset-2 ${
                waiterActiveTab === 'tables'
                  ? 'bg-[#2B2623] text-white shadow-sm'
                  : 'text-stone-400 hover:bg-[#F4EFE6] hover:text-[#2B2623]'
              }`}
            >
              <Icons.TableMap />
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('menu')}
              aria-label="Foodies Menu & POS Catalog"
              aria-pressed={waiterActiveTab === 'menu'}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] focus-visible:ring-offset-2 ${
                waiterActiveTab === 'menu'
                  ? 'bg-[#2B2623] text-white shadow-sm'
                  : 'text-stone-400 hover:bg-[#F4EFE6] hover:text-[#2B2623]'
              }`}
            >
              <Icons.MenuBook />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => onShowToast('Evening shift: 4 line cooks and 3 servers on the floor.')}
          aria-label="Staff Shifts & Schedule"
          className="w-12 h-12 rounded-xl flex items-center justify-center text-stone-400 hover:bg-[#F4EFE6] hover:text-[#2B2623] transition-all duration-200 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] focus-visible:ring-offset-2"
        >
          <Icons.CalendarShifts />
        </button>
      </div>

      {/* Bottom Settings & Shift Handover */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onShowToast('Display preset: Bistro Daylight high-legibility mode.')}
          aria-label="POS Display Settings"
          className="w-12 h-12 rounded-xl flex items-center justify-center text-stone-400 hover:bg-[#F4EFE6] hover:text-[#2B2623] transition-all duration-200 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] focus-visible:ring-offset-2"
        >
          <Icons.Settings />
        </button>

        <button
          type="button"
          onClick={() => onShowToast('Shift handover logged. Ready for the next server.')}
          aria-label="Shift Handover & Logout"
          className="w-12 h-12 rounded-xl flex items-center justify-center text-stone-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] focus-visible:ring-offset-2"
        >
          <Icons.Logout />
        </button>
      </div>
    </nav>
  );
};
