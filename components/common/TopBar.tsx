'use client';

import React from 'react';
import Image from 'next/image';
import { RoleMode } from '../../types/pos';
import { Icons } from '../ui/Icons';

interface TopBarProps {
  role: RoleMode;
  onSetRole: (role: RoleMode) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isConnected: boolean;
  onToggleConnection: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  newCount: number;
  onSimulateOrder: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  role,
  onSetRole,
  searchQuery,
  onSearchChange,
  isConnected,
  onToggleConnection,
  soundEnabled,
  onToggleSound,
  newCount,
  onSimulateOrder,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#FAF6EE]/90 backdrop-blur-md border-b border-stone-200/60 px-4 sm:px-6 py-3">
      {/* Skip to Content accessible link (WCAG 2.2 AA) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#2B2623] focus:text-white focus:rounded-full focus:shadow-lg focus:outline-none"
      >
        Skip to main content
      </a>

      <div className="max-w-[1680px] mx-auto flex items-center justify-between gap-4">
        {/* LEFT: BRAND LOGO */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#2B2623] flex items-center justify-center shadow-sm">
            <Icons.SpoonLogo />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-bold text-[#2B2623] tracking-tight leading-none">
              Gusteau&apos;s Kitchen
            </h1>
            <span className="text-[11px] text-[#B4693A] font-semibold">
              {role === 'chef' ? 'Chef Display System (KDS)' : 'Waitstaff Point-of-Sale'}
            </span>
          </div>
        </div>

        {/* CENTER: SEARCH INPUT FORM WITH ACCESSIBLE SEMANTICS (Section 15.1) */}
        <form
          role="search"
          onSubmit={(e) => e.preventDefault()}
          className="flex-1 max-w-md mx-2 sm:mx-4"
        >
          <label htmlFor="order-search" className="sr-only">
            Search orders by table number or ticket ID
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-4" aria-hidden="true">
              <Icons.Search />
            </span>
            <input
              id="order-search"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search table or order # (e.g. #F0945, Table 16)..."
              className="w-full bg-white border border-stone-200 rounded-full pl-11 pr-4 py-2.5 text-sm text-[#2B2623] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#B4693A] focus:border-transparent transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search input"
                className="absolute right-3 text-stone-400 hover:text-stone-600 text-xs cursor-pointer p-1"
              >
                ✕
              </button>
            )}
          </div>
        </form>

        {/* RIGHT: CONTROLS, AUDIO TOGGLE, ROLE SWITCHER & PROFILE CHIP */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Real-time Connection Status Dot */}
          <button
            type="button"
            onClick={onToggleConnection}
            aria-label={`SignalR connection: ${isConnected ? 'Online' : 'Offline'}. Click to toggle.`}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-700 shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span>{isConnected ? 'Live' : 'Offline'}</span>
          </button>

          {/* Audio Chime Mute/Unmute */}
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute kitchen audio chimes' : 'Unmute kitchen audio chimes'}
            aria-pressed={soundEnabled}
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] ${
              soundEnabled
                ? 'bg-white border-stone-200 text-[#B4693A]'
                : 'bg-stone-200 border-stone-300 text-stone-400'
            }`}
          >
            <Icons.SoundWave on={soundEnabled} />
          </button>

          {/* Notification Bell with live counter */}
          <button
            type="button"
            onClick={onSimulateOrder}
            aria-label={`Notifications: ${newCount} new orders. Click to simulate incoming ticket.`}
            className="relative w-10 h-10 rounded-full bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 flex items-center justify-center transition-all cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A]"
          >
            <Icons.Bell />
            {newCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white animate-bounce"
              >
                {newCount}
              </span>
            )}
          </button>

          {/* ROLE MODE SWITCHER (Chef vs Waiter) */}
          <div
            className="bg-stone-200/80 p-1 rounded-full flex items-center"
            role="group"
            aria-label="Role selector"
          >
            <button
              type="button"
              onClick={() => onSetRole('chef')}
              aria-pressed={role === 'chef'}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B2623] ${
                role === 'chef'
                  ? 'bg-[#2B2623] text-white shadow-sm'
                  : 'text-stone-700 hover:text-black'
              }`}
            >
              👨‍🍳 Kitchen
            </button>
            <button
              type="button"
              onClick={() => onSetRole('waiter')}
              aria-pressed={role === 'waiter'}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B2623] ${
                role === 'waiter'
                  ? 'bg-[#2B2623] text-white shadow-sm'
                  : 'text-stone-700 hover:text-black'
              }`}
            >
              🛎️ Waitstaff
            </button>
          </div>

          {/* Profile Avatar Chip using Next.js Image */}
          <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-stone-300/80">
            <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-[#B4693A]/50">
              <Image
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                alt={role === 'chef' ? 'Chef Auguste' : 'Sakib Mahamud'}
                fill
                sizes="36px"
                className="object-cover"
              />
            </div>
            <div className="text-left text-xs leading-tight">
              <span className="font-bold text-[#2B2623] block">
                {role === 'chef' ? 'Chef Auguste' : 'Sakib Mahamud'}
              </span>
              <span className="text-[10px] text-stone-600">
                {role === 'chef' ? 'Head Chef' : 'Lead Server'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
