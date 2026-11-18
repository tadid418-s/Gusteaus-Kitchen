'use client';

import React from 'react';
import { TableInfo } from '../../types/pos';
import { Icons } from '../ui/Icons';

interface TableMapViewProps {
  tables: TableInfo[];
  selectedTableId?: string;
  onSelectTable: (tableId: string) => void;
  onStartTakeawayOrder?: () => void;
}

export const TableMapView: React.FC<TableMapViewProps> = ({
  tables,
  selectedTableId,
  onSelectTable,
  onStartTakeawayOrder,
}) => {
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-stone-200/60">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <span className="text-[11px] uppercase font-bold tracking-wider text-[#B4693A] block">
            Step 1 &bull; Select Dining Table
          </span>
          <h3 className="text-xl font-bold text-[#2B2623]">Floor Plan &amp; Table Status</h3>
          <p className="text-xs text-stone-500">
            Tap an empty/seated table to take a new order, or tap a green Ready table to serve &amp; pay
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {onStartTakeawayOrder && (
            <button
              type="button"
              onClick={onStartTakeawayOrder}
              className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors min-h-[44px]"
            >
              <Icons.Plus />
              <span>New Takeaway Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div
        className="flex items-center gap-4 text-xs flex-wrap mb-4 pb-3 border-b border-stone-100"
        aria-label="Floor plan color legend"
      >
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-stone-300" /> Empty (Start Order)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500" /> Seated / Ordering
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-400" /> Cooking in Kitchen
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" /> Ready to Serve &amp; Pay
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500" /> Bill Pending
        </span>
      </div>

      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
        role="region"
        aria-label="Dining room tables"
      >
        {tables.map((table) => {
          let bgClass = 'bg-stone-100 text-stone-600 border-stone-200 hover:border-stone-400';
          let pulseClass = '';

          if (table.status === 'seated') {
            bgClass = 'bg-blue-50 text-blue-800 border-blue-300 hover:border-blue-500';
          } else if (table.status === 'waiting') {
            bgClass = 'bg-amber-50 text-amber-800 border-amber-300 hover:border-amber-500';
          } else if (table.status === 'ready') {
            bgClass = 'bg-emerald-100 text-emerald-900 border-emerald-400 hover:border-emerald-600';
            pulseClass = 'animate-pulse-ready ring-4 ring-emerald-300/60';
          } else if (table.status === 'pending') {
            bgClass = 'bg-red-50 text-red-800 border-red-300 hover:border-red-500';
          }

          const isSelected = selectedTableId === table.id;

          const statusText =
            table.status === 'empty'
              ? 'Tap to Order'
              : table.status === 'seated'
              ? 'Ordering'
              : table.status === 'waiting'
              ? 'Cooking'
              : table.status === 'ready'
              ? 'Serve & Pay'
              : 'Payment Pending';

          return (
            <button
              type="button"
              key={table.id}
              onClick={() => onSelectTable(table.id)}
              aria-label={`${table.label}, ${table.seats} seats, status: ${statusText}`}
              aria-pressed={isSelected}
              className={`min-h-[115px] rounded-2xl p-3 border-2 flex flex-col justify-between items-center text-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B4693A] ${bgClass} ${pulseClass} ${
                isSelected ? 'ring-4 ring-[#B4693A] scale-105 shadow-md' : 'hover:scale-[1.02]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                  {table.seats} Seats
                </span>
                {table.status === 'ready' && (
                  <span
                    aria-hidden="true"
                    className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"
                  />
                )}
              </div>

              <div className="font-bold text-base sm:text-lg">{table.label}</div>

              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/85 shadow-2xs">
                {table.status === 'ready'
                  ? '🛎️ Ready!'
                  : table.status === 'pending'
                  ? '💳 Pay Now'
                  : statusText}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
