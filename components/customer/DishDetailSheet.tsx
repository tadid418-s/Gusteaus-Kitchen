'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { CustomerMenuItem, Language } from '../../types/customer';
import { Modifier } from '../../types/pos';
import { CUSTOMER_TRANSLATIONS } from '../../data/customer-menu';
import { Icons } from '../ui/Icons';

interface DishDetailSheetProps {
  item: CustomerMenuItem | null;
  onClose: () => void;
  onAddToCart: (payload: {
    item: CustomerMenuItem;
    quantity: number;
    selectedModifiers: Modifier[];
    specialRequest: string;
    unitPriceETB: number;
  }) => void;
  lang: Language;
}

export const DishDetailSheet: React.FC<DishDetailSheetProps> = ({
  item,
  onClose,
  onAddToCart,
  lang,
}) => {
  const t = CUSTOMER_TRANSLATIONS[lang];
  const [quantity, setQuantity] = useState(1);
  const [selectedModifierIds, setSelectedModifierIds] = useState<Set<string>>(new Set());
  const [specialRequest, setSpecialRequest] = useState('');
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (item) {
      setQuantity(1);
      setSelectedModifierIds(new Set());
      setSpecialRequest('');
      setImgError(false);
    }
  }, [item]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && item) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [item, onClose]);

  if (!item) return null;

  const toggleModifier = (modId: string) => {
    setSelectedModifierIds((prev) => {
      const next = new Set(prev);
      if (next.has(modId)) {
        next.delete(modId);
      } else {
        next.add(modId);
      }
      return next;
    });
  };

  const additions = item.availableModifiers.filter((m) => m.type === 'addition');
  const removals = item.availableModifiers.filter((m) => m.type === 'removal');
  const allergies = item.availableModifiers.filter((m) => m.type === 'allergy');

  const selectedModifiers = item.availableModifiers.filter((m) =>
    selectedModifierIds.has(m.id)
  );

  const modifiersDeltaETB = selectedModifiers.reduce(
    (sum, m) => sum + (m.priceDelta ? Math.round(m.priceDelta * (item.priceETB / item.usdPrice > 0 ? 1 : 25)) : 0),
    0
  );

  const unitPriceETB = item.priceETB + modifiersDeltaETB;
  const lineTotalETB = unitPriceETB * quantity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddToCart({
      item,
      quantity,
      selectedModifiers,
      specialRequest: specialRequest.trim(),
      unitPriceETB,
    });
    onClose();
  };

  const displayName = lang === 'am' && item.nameAm ? item.nameAm : item.name;
  const displayDesc = lang === 'am' && item.descriptionAm ? item.descriptionAm : item.description;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dish-detail-title"
      className="fixed inset-0 z-50 bg-[#2B2623]/55 backdrop-blur-xs flex items-end justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FAF6EE] w-full max-w-lg max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up"
      >
        {/* DRAG / CLOSE HEADER */}
        <div className="relative w-full h-48 sm:h-56 bg-stone-100 flex-shrink-0 overflow-hidden">
          {!imgError ? (
            <Image
              src={item.imageUrl}
              alt={displayName}
              fill
              sizes="(max-width: 640px) 100vw, 512px"
              className="object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-stone-200">
              <Icons.PlateFallback color="#B4693A" />
            </div>
          )}

          {/* CLOSE BUTTON */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center text-sm font-bold backdrop-blur-xs transition-colors cursor-pointer"
          >
            ✕
          </button>

          {/* BADGES */}
          {item.popular && (
            <div className="absolute bottom-3 left-4 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold uppercase tracking-wider shadow-sm">
              ★ {t.popularBadge}
            </div>
          )}
        </div>

        {/* SCROLLABLE DETAIL BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* TITLE & DESCRIPTION */}
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <h3 id="dish-detail-title" className="text-xl sm:text-2xl font-extrabold text-[#2B2623] tracking-tight">
                {displayName}
              </h3>
              <span className="font-mono text-xl font-extrabold text-[#B4693A] whitespace-nowrap">
                {item.priceETB.toLocaleString()} ETB
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
              {displayDesc}
            </p>

            {/* DIETARY TAGS */}
            {item.dietary.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {item.dietary.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                  >
                    {d === 'tsom' ? '✝️ Tsom' : d === 'spicy' ? '🌶️ Spicy' : `🌱 ${d}`}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* QUANTITY STEPPER */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200/60 flex items-center justify-between shadow-2xs">
            <span className="text-sm font-bold text-[#2B2623]">{t.portions}</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="w-10 h-10 rounded-xl bg-[#FAF6EE] hover:bg-[#EFE7D8] text-[#2B2623] font-bold flex items-center justify-center transition-colors cursor-pointer text-sm"
              >
                <Icons.Minus />
              </button>
              <span className="w-8 text-center font-mono font-extrabold text-lg text-[#2B2623]">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
                className="w-10 h-10 rounded-xl bg-[#2B2623] hover:bg-[#3C3531] text-white font-bold flex items-center justify-center transition-colors cursor-pointer text-sm"
              >
                <Icons.Plus />
              </button>
            </div>
          </div>

          {/* ADDITIONS / UPGRADES */}
          {additions.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-stone-200/60 space-y-3 shadow-2xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                {t.additionsTitle}
              </h4>
              <div className="flex flex-wrap gap-2">
                {additions.map((mod) => {
                  const active = selectedModifierIds.has(mod.id);
                  const delta = mod.priceDelta ? Math.round(mod.priceDelta * (item.priceETB / item.usdPrice > 0 ? 1 : 25)) : 0;
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => toggleModifier(mod.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 min-h-[44px] ${
                        active
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200/60'
                      }`}
                    >
                      <span>{active ? '✓' : '+'}</span>
                      <span>{mod.name}</span>
                      {delta > 0 && (
                        <span className={`font-mono text-[11px] ${active ? 'text-emerald-100' : 'text-emerald-700'}`}>
                          (+{delta} ETB)
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* REMOVALS */}
          {removals.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-stone-200/60 space-y-3 shadow-2xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700">
                {t.removalsTitle}
              </h4>
              <div className="flex flex-wrap gap-2">
                {removals.map((mod) => {
                  const active = selectedModifierIds.has(mod.id);
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => toggleModifier(mod.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 min-h-[44px] ${
                        active
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/50'
                      }`}
                    >
                      <span>✕</span>
                      <span>{mod.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ALLERGIES */}
          {allergies.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-stone-200/60 space-y-3 shadow-2xs">
              <div className="flex items-center gap-1.5 text-rose-700">
                <Icons.AlertTriangle />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  {t.allergiesTitle}
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {allergies.map((mod) => {
                  const active = selectedModifierIds.has(mod.id);
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => toggleModifier(mod.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 min-h-[44px] ${
                        active
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-[#FAF6EE] text-rose-700 hover:bg-rose-50 border border-rose-200/60'
                      }`}
                    >
                      <Icons.AlertTriangle />
                      <span>{mod.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SPECIAL INSTRUCTIONS */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200/60 space-y-2 shadow-2xs">
            <label htmlFor="customer-special-req" className="text-xs font-bold uppercase tracking-wider text-[#2B2623] block">
              {t.specialInstructions}
            </label>
            <textarea
              id="customer-special-req"
              rows={2}
              maxLength={150}
              value={specialRequest}
              onChange={(e) => setSpecialRequest(e.target.value)}
              placeholder={t.specialInstructionsPlaceholder}
              className="w-full bg-[#FAF6EE] rounded-xl p-3 text-xs sm:text-sm text-[#2B2623] placeholder-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B4693A] resize-none border border-stone-200/60"
            />
            <div className="text-right text-[10px] text-stone-400 font-mono">
              {specialRequest.length}/150
            </div>
          </div>
        </div>

        {/* STICKY BOTTOM BUTTON IN THUMB ZONE */}
        <div className="bg-white px-5 py-4 border-t border-stone-200/60 shadow-[0_-4px_20px_-4px_rgba(43,38,35,0.06)] flex items-center gap-3">
          <button
            type="submit"
            className="flex-1 h-14 rounded-2xl bg-[#2B2623] hover:bg-[#3C3531] active:scale-[0.99] text-white font-extrabold text-sm flex items-center justify-between px-6 shadow-sm transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A]"
          >
            <span>{t.addToCart}</span>
            <span className="font-mono text-base font-extrabold text-[#F4EFE6]">
              {lineTotalETB.toLocaleString()} ETB
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
