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
      className="hidden md:flex flex-col justify-between items-center bg-white rounded-3xl p-3 border border-stone-200/80 shadow-sm w-16 sm:w-18 flex-shrink-0"
    >
      {/* Top navigation tabs */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => onSelectTab('orders')}
          aria-label="Orders Line & Kanban Board"
          aria-pressed={role === 'chef' || waiterActiveTab === 'orders'}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B4693A] ${
            role === 'chef' || waiterActiveTab === 'orders'
              ? 'bg-[#2B2623] text-white shadow-sm'
              : 'text-stone-500 hover:bg-stone-100 hover:text-[#2B2623]'
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
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B4693A] ${
                waiterActiveTab === 'tables'
                  ? 'bg-[#2B2623] text-white shadow-sm'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-[#2B2623]'
              }`}
            >
              <Icons.TableMap />
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('menu')}
              aria-label="Foodies Menu & POS Catalog"
              aria-pressed={waiterActiveTab === 'menu'}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B4693A] ${
                waiterActiveTab === 'menu'
                  ? 'bg-[#2B2623] text-white shadow-sm'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-[#2B2623]'
              }`}
            >
              <Icons.MenuBook />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => onShowToast('Shift schedule: 4 chefs, 3 servers on duty')}
          aria-label="Staff Shifts & Schedule"
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-[#2B2623] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B4693A]"
        >
          <Icons.CalendarShifts />
        </button>
      </div>

      {/* Bottom Settings & Logout Controls */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onShowToast('Settings: High-contrast KDS mode enabled')}
          aria-label="POS Display Settings"
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-stone-500 hover:bg-stone-100 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-400"
        >
          <Icons.Settings />
        </button>

        <button
          type="button"
          onClick={() => onShowToast('Handover completed. Staff signed out.')}
          aria-label="Shift Handover & Logout"
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-stone-500 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-300"
        >
          <Icons.Logout />
        </button>
      </div>
    </nav>
  );
};
