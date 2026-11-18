'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { MenuItem } from '../../types/pos';
import { Icons } from '../ui/Icons';

interface FoodiesMenuSectionProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  menuItems: MenuItem[];
  onSelectDish: (item: MenuItem) => void;
  activeTableLabel?: string;
  onChangeTable: () => void;
}

export const FoodiesMenuSection: React.FC<FoodiesMenuSectionProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  menuItems,
  onSelectDish,
  activeTableLabel,
  onChangeTable,
}) => {
  const filteredItems = menuItems.filter(
    (item) => selectedCategory === 'All' || item.category === selectedCategory
  );

  return (
    <div className="space-y-4">
      {/* ACTIVE TABLE BANNER FOR ORDER ENTRY */}
      <div className="bg-white rounded-2xl px-4 py-3 border border-stone-200 flex items-center justify-between flex-wrap gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
            <Icons.TableMap />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-stone-400 block">
              Step 2 &bull; Tap any dish to customize &amp; add
            </span>
            <span className="text-sm sm:text-base font-bold text-[#2B2623]">
              {activeTableLabel ? (
                <>
                  Ordering for <span className="text-[#B4693A]">{activeTableLabel}</span>
                </>
              ) : (
                'No Table Selected — Pick a table to start ordering'
              )}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onChangeTable}
          className="px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-[#2B2623] text-xs font-bold transition-colors cursor-pointer min-h-[40px]"
        >
          {activeTableLabel ? 'Switch Table' : 'Choose Table First →'}
        </button>
      </div>

      {/* Category Chips Bar with item counts */}
      <div
        className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none"
        role="tablist"
        aria-label="Menu categories"
      >
        {categories.map((cat) => {
          const count = menuItems.filter((i) => cat === 'All' || i.category === cat).length;
          const isActive = selectedCategory === cat;
          return (
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`category-panel-${cat}`}
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[48px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B4693A] ${
                isActive
                  ? 'bg-[#2B2623] text-white shadow-sm'
                  : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              <span>{cat}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                }`}
              >
                {count < 10 ? `0${count}` : count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Menu Cards Grid using Next.js Image */}
      <div
        id={`category-panel-${selectedCategory}`}
        role="tabpanel"
        aria-label={`${selectedCategory} dishes`}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        {filteredItems.map((item) => (
          <MenuItemCard key={item.id} item={item} onSelectDish={onSelectDish} />
        ))}
      </div>
    </div>
  );
};

const MenuItemCard: React.FC<{ item: MenuItem; onSelectDish: (item: MenuItem) => void }> = ({
  item,
  onSelectDish,
}) => {
  const [imgError, setImgError] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectDish(item);
    }
  };

  return (
    <article
      tabIndex={0}
      role="button"
      onClick={() => onSelectDish(item)}
      onKeyDown={handleKeyDown}
      aria-label={`Customize and add ${item.name}, $${item.price.toFixed(2)}`}
      className="group relative bg-white rounded-3xl p-4 border border-stone-200/70 hover:border-[#B4693A] shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B4693A]"
    >
      <div className="flex justify-center my-1">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden p-1 border-2 border-stone-200 group-hover:border-[#B4693A] transition-colors">
          {!imgError ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 96px, 112px"
              className="object-cover rounded-full p-0.5"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-stone-100 rounded-full">
              <Icons.PlateFallback color="#B4693A" />
            </div>
          )}
        </div>
      </div>

      <div className="text-center mt-2">
        <h5 className="font-bold text-sm sm:text-base text-[#2B2623] leading-snug line-clamp-1">
          {item.name}
        </h5>
        <p className="text-xs text-stone-600 mt-0.5">{item.subcategory}</p>
        {item.availableModifiers.length > 0 && (
          <span className="inline-block text-[10px] text-[#B4693A] font-semibold mt-1">
            Tap to customize &bull; {item.availableModifiers.length} options
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-100">
        <span className="font-bold text-sm sm:text-base text-[#2B2623] font-mono">
          ${item.price.toFixed(2)}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectDish(item);
          }}
          aria-label={`Customize and add ${item.name} to order ticket`}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-stone-100 group-hover:bg-[#2B2623] group-hover:text-white text-stone-800 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B4693A]"
        >
          <Icons.Plus />
        </button>
      </div>
    </article>
  );
};
