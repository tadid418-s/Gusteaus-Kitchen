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
    <header className="sticky top-0 z-30 bg-white shadow-[0_2px_16px_-4px_rgba(43,38,35,0.06)] px-5 sm:px-8 py-4">
      {/* Skip to Content accessible link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:px-5 focus:py-2.5 focus:bg-[#2B2623] focus:text-white focus:rounded-xl focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#B4693A]"
      >
        Skip to main content
      </a>

      <div className="max-w-[1680px] mx-auto flex items-center justify-between gap-5">
        {/* LEFT: BRAND LOGO */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#2B2623] flex items-center justify-center shadow-sm">
            <Icons.SpoonLogo />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-extrabold text-[#2B2623] tracking-tight leading-none">
              Gusteau&apos;s Kitchen
            </h1>
            <span className="text-xs text-[#B4693A] font-medium mt-1 block">
              {role === 'chef' ? 'Kitchen Display' : 'Dining Room & POS'}
            </span>
          </div>
        </div>

        {/* CENTER: CLEAN SOFT-FILLED SEARCH INPUT (no harsh border) */}
        <form
          role="search"
          onSubmit={(e) => e.preventDefault()}
          className="flex-1 max-w-md mx-2 sm:mx-6"
        >
          <label htmlFor="order-search" className="sr-only">
            Search orders by table number or ticket ID
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-4 pointer-events-none" aria-hidden="true">
              <Icons.Search />
            </span>
            <input
              id="order-search"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Find a table or ticket # (e.g. Table 16, #F0945)..."
              className="w-full bg-[#F4EFE6] rounded-xl pl-11 pr-10 py-3 text-sm text-[#2B2623] placeholder-stone-400 transition-all duration-200 ease-in-out hover:bg-[#EDE6DA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B4693A]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search input"
                className="absolute right-3 w-7 h-7 rounded-lg text-stone-400 hover:text-[#2B2623] hover:bg-stone-200/70 flex items-center justify-center text-xs cursor-pointer transition-colors duration-150"
              >
                ✕
              </button>
            )}
          </div>
        </form>

        {/* RIGHT: STATUS, AUDIO, ROLE SWITCHER & PROFILE */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* SignalR Live Status */}
          <button
            type="button"
            onClick={onToggleConnection}
            aria-label={`SignalR connection: ${isConnected ? 'Online' : 'Offline'}. Click to toggle.`}
            className="hidden md:flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#F4EFE6] hover:bg-[#EAE2D4] text-xs font-semibold text-stone-700 cursor-pointer transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] focus-visible:ring-offset-2"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span>{isConnected ? 'Live' : 'Offline'}</span>
          </button>

          {/* Audio Chime Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute kitchen audio chimes' : 'Unmute kitchen audio chimes'}
            aria-pressed={soundEnabled}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] focus-visible:ring-offset-2 ${
              soundEnabled
                ? 'bg-[#F4EFE6] text-[#B4693A] hover:bg-[#EAE2D4]'
                : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
            }`}
          >
            <Icons.SoundWave on={soundEnabled} />
          </button>

          {/* Notification Bell */}
          <button
            type="button"
            onClick={onSimulateOrder}
            aria-label={`Notifications: ${newCount} new orders. Click to simulate incoming ticket.`}
            className="relative w-11 h-11 rounded-xl bg-[#F4EFE6] text-stone-700 hover:bg-[#EAE2D4] hover:-translate-y-0.5 flex items-center justify-center transition-all duration-200 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] focus-visible:ring-offset-2"
          >
            <Icons.Bell />
            {newCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white"
              >
                {newCount}
              </span>
            )}
          </button>

          {/* ROLE MODE SWITCHER */}
          <div
            className="bg-[#F4EFE6] p-1 rounded-xl flex items-center gap-1"
            role="group"
            aria-label="Role selector"
          >
            <button
              type="button"
              onClick={() => onSetRole('chef')}
              aria-pressed={role === 'chef'}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] ${
                role === 'chef'
                  ? 'bg-[#2B2623] text-white shadow-sm'
                  : 'text-stone-600 hover:text-[#2B2623]'
              }`}
            >
              Kitchen
            </button>
            <button
              type="button"
              onClick={() => onSetRole('waiter')}
              aria-pressed={role === 'waiter'}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] ${
                role === 'waiter'
                  ? 'bg-[#2B2623] text-white shadow-sm'
                  : 'text-stone-600 hover:text-[#2B2623]'
              }`}
            >
              Waitstaff
            </button>
          </div>

          {/* Profile Avatar Chip */}
          <div className="hidden sm:flex items-center gap-3 pl-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-sm">
              <Image
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                alt={role === 'chef' ? 'Chef Auguste' : 'Sakib Mahamud'}
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
            <div className="text-left leading-tight">
              <span className="text-xs font-bold text-[#2B2623] block">
                {role === 'chef' ? 'Chef Auguste' : 'Sakib Mahamud'}
              </span>
              <span className="text-[11px] text-stone-500 font-normal">
                {role === 'chef' ? 'Head Chef' : 'Lead Server'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
