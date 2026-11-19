'use client';

import React, { memo } from 'react';
import { TableInfo } from '../../types/pos';
import { Icons } from '../ui/Icons';

interface TableMapViewProps {
  tables: TableInfo[];
  selectedTableId?: string;
  onSelectTable: (tableId: string) => void;
  onStartTakeawayOrder?: () => void;
}

const TableMapViewComponent: React.FC<TableMapViewProps> = ({
  tables,
  selectedTableId,
  onSelectTable,
  onStartTakeawayOrder,
}) => {
  return (
    <div className="bistro-surface rounded-2xl p-6 sm:p-8">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div className="space-y-1">
          <span className="text-[11px] uppercase font-bold tracking-widest text-[#B4693A] block">
            Step 01 · Dining Room
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#2B2623] tracking-tight">
            Where are your guests seated?
          </h2>
          <p className="text-sm text-stone-500 font-normal leading-relaxed">
            Pick an open table to start a fresh ticket, or tap a glowing green table to serve and settle the bill.
          </p>
        </div>

        {onStartTakeawayOrder && (
          <button
            type="button"
            onClick={onStartTakeawayOrder}
            className="px-5 py-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/60 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all duration-200 ease-in-out hover:-translate-y-0.5 min-h-[46px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] focus-visible:ring-offset-2"
          >
            <Icons.Plus />
            <span>Counter Takeaway</span>
          </button>
        )}
      </div>

      {/* Modern Status Legend (lighter tones) */}
      <div
        className="flex items-center gap-5 text-xs text-stone-500 flex-wrap mb-7 pb-5 border-b border-stone-100"
        aria-label="Floor plan color legend"
      >
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-stone-300" /> Open
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Seated
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-300" /> On the Fire
        </span>
        <span className="flex items-center gap-2 font-semibold text-emerald-700">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" /> Ready to Serve
        </span>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Check Pending
        </span>
      </div>

      {/* ASYMMETRIC BENTO FLOOR GRID (Large group tables span 2 columns) */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5"
        role="region"
        aria-label="Dining room tables"
      >
        {tables.map((table) => {
          let surfaceClass = 'bg-white text-stone-700 border border-stone-200/60 hover:bg-[#FAF6EE]';
          let pillClass = 'bg-[#FAF6EE] text-stone-500 border border-stone-200/50';
          let pulseClass = '';

          if (table.status === 'seated') {
            surfaceClass = 'bg-sky-50/70 text-sky-950 border border-sky-200/60 hover:bg-sky-100/70';
            pillClass = 'bg-white text-sky-700 border border-sky-200/60';
          } else if (table.status === 'waiting') {
            surfaceClass = 'bg-amber-50/70 text-amber-950 border border-amber-200/60 hover:bg-amber-100/70';
            pillClass = 'bg-white text-amber-800 border border-amber-200/60';
          } else if (table.status === 'ready') {
            surfaceClass = 'bg-emerald-50/80 text-emerald-950 border border-emerald-200/60 hover:bg-emerald-100/80';
            pillClass = 'bg-emerald-500 text-white shadow-2xs';
            pulseClass = 'animate-pulse-ready';
          } else if (table.status === 'pending') {
            surfaceClass = 'bg-rose-50/70 text-rose-950 border border-rose-200/60 hover:bg-rose-100/70';
            pillClass = 'bg-white text-rose-700 border border-rose-200/60';
          }

          const isSelected = selectedTableId === table.id;
          const isLargeTable = table.seats >= 6;

          const statusText =
            table.status === 'empty'
              ? 'Open'
              : table.status === 'seated'
              ? 'Ordering'
              : table.status === 'waiting'
              ? 'Cooking'
              : table.status === 'ready'
              ? 'Ready to Serve'
              : 'Settle Bill';

          return (
            <button
              type="button"
              key={table.id}
              onClick={() => onSelectTable(table.id)}
              aria-label={`${table.label}, ${table.seats} seats, status: ${statusText}`}
              aria-pressed={isSelected}
              className={`min-h-[120px] rounded-2xl p-4 sm:p-5 flex flex-col justify-between items-start text-left transition-all duration-200 ease-in-out cursor-pointer hover:-translate-y-0.5 shadow-2xs hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] focus-visible:ring-offset-2 ${surfaceClass} ${pulseClass} ${
                isLargeTable ? 'col-span-2' : 'col-span-1'
              } ${isSelected ? 'ring-2 ring-[#B4693A] ring-offset-2 ring-offset-white' : ''}`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[11px] font-medium opacity-65">
                  {isLargeTable ? `Banquet · ${table.seats} seats` : `${table.seats} seats`}
                </span>
                {table.status === 'ready' && (
                  <span
                    aria-hidden="true"
                    className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"
                  />
                )}
              </div>

              <div className="font-extrabold text-lg sm:text-xl tracking-tight my-1">
                {table.label}
              </div>

              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs ${pillClass}`}
              >
                {statusText}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const TableMapView = memo(TableMapViewComponent);
