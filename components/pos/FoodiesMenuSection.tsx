'use client';

import React, { useState, memo } from 'react';
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
    <div className="space-y-6">
      {/* ACTIVE TABLE BANNER FOR ORDER ENTRY */}
      <div className="bistro-surface rounded-2xl px-6 py-5 flex items-center justify-between flex-wrap gap-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#B4693A] border border-amber-200/50 flex items-center justify-center flex-shrink-0">
            <Icons.TableMap />
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] uppercase tracking-widest font-bold text-[#B4693A] block">
              Step 02 · Bistro Menu
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#2B2623] tracking-tight">
              {activeTableLabel ? (
                <>
                  Ordering for <span className="text-[#B4693A]">{activeTableLabel}</span>
                </>
              ) : (
                'Pick a table before ringing in dishes'
              )}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onChangeTable}
          className="px-5 py-3 rounded-xl bg-[#FAF6EE] hover:bg-[#EFE8DC] text-[#2B2623] text-xs font-bold transition-all duration-200 ease-in-out cursor-pointer min-h-[46px] border border-stone-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] focus-visible:ring-offset-2"
        >
          {activeTableLabel ? 'Switch Table' : 'Choose Table →'}
        </button>
      </div>

      {/* Category Chips Bar */}
      <div
        className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none"
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
              className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-200 ease-in-out cursor-pointer min-h-[46px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF6EE] ${
                isActive
                  ? 'bg-[#2B2623] text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:text-[#2B2623] hover:-translate-y-0.5 border border-stone-200/60 shadow-2xs'
              }`}
            >
              <span>{cat}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                  isActive ? 'bg-white/15 text-white' : 'bg-[#FAF6EE] text-stone-500'
                }`}
              >
                {count < 10 ? `0${count}` : count}
              </span>
            </button>
          );
        })}
      </div>

      {/* UNIFORM, CONSISTENT FOOD CARDS GRID */}
      <div
        id={`category-panel-${selectedCategory}`}
        role="tabpanel"
        aria-label={`${selectedCategory} dishes`}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
      >
        {filteredItems.map((item) => (
          <MenuItemCard key={item.id} item={item} onSelectDish={onSelectDish} />
        ))}
      </div>
    </div>
  );
};

const MenuItemCardComponent: React.FC<{
  item: MenuItem;
  onSelectDish: (item: MenuItem) => void;
}> = ({ item, onSelectDish }) => {
  const [imgError, setImgError] = useState(false);
  const isFeatured = Boolean(item.popular);

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
      className="group relative bistro-surface bistro-surface-hover rounded-2xl p-5 sm:p-5.5 flex flex-col justify-between h-full cursor-pointer hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF6EE]"
    >
      {/* TOP TAG ROW (Guarantees identical baseline height across all cards) */}
      <div className="flex items-center justify-between gap-2 h-6">
        {isFeatured ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60 text-[10px] font-bold uppercase tracking-wider">
            ★ Favorite
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-stone-50 text-stone-500 border border-stone-200/50 text-[10px] font-semibold uppercase tracking-wider">
            {item.subcategory}
          </span>
        )}
        <span className="text-[11px] text-stone-400 font-mono">
          {item.availableModifiers.length} mods
        </span>
      </div>

      {/* DISH PHOTO (Uniform circle with subtle ring) */}
      <div className="flex justify-center my-3.5">
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden shadow-xs ring-4 ring-[#FAF6EE] group-hover:ring-[#B4693A]/20 transition-all duration-200 bg-stone-100 flex-shrink-0">
          {!imgError ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="(max-width: 640px) 112px, 128px"
              className="object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-stone-100">
              <Icons.PlateFallback color="#B4693A" />
            </div>
          )}
        </div>
      </div>

      {/* DISH TITLE & SUBCATEGORY (Standardized heights) */}
      <div className="text-center space-y-1 my-1">
        <h4
          title={item.name}
          className="font-extrabold text-base text-[#2B2623] tracking-tight leading-snug line-clamp-1 group-hover:text-[#B4693A] transition-colors"
        >
          {item.name}
        </h4>
        <p className="text-xs text-stone-400 font-normal line-clamp-1">
          {item.subcategory}
        </p>
      </div>

      {/* BOTTOM ACTION ROW */}
      <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-stone-100">
        <span className="font-extrabold text-base sm:text-lg text-[#2B2623] font-mono">
          ${item.price.toFixed(2)}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectDish(item);
          }}
          aria-label={`Customize and add ${item.name} to order ticket`}
          className="px-3.5 py-2 rounded-xl bg-stone-50 group-hover:bg-[#2B2623] text-stone-700 group-hover:text-white border border-stone-200/60 text-xs font-bold flex items-center gap-1.5 transition-all duration-200 ease-in-out cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A]"
        >
          <Icons.Plus />
          <span>Customize</span>
        </button>
      </div>
    </article>
  );
};

const MenuItemCard = memo(MenuItemCardComponent);
