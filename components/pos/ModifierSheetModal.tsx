'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { MenuItem, Modifier } from '../../types/pos';
import { Icons } from '../ui/Icons';

interface ModifierSheetModalProps {
  item: MenuItem | null;
  tableLabel: string;
  onClose: () => void;
  onConfirmAdd: (payload: {
    menuItem: MenuItem;
    quantity: number;
    selectedModifiers: Modifier[];
    specialRequest: string;
    unitPrice: number;
  }) => void;
}

const COMMON_ALLERGIES: Modifier[] = [
  { id: 'allergy-peanuts', name: 'Allergy: Peanuts', type: 'allergy' },
  { id: 'allergy-dairy', name: 'Allergy: Dairy', type: 'allergy' },
  { id: 'allergy-gluten', name: 'Allergy: Gluten', type: 'allergy' },
  { id: 'allergy-shellfish', name: 'Allergy: Shellfish', type: 'allergy' },
];

const QUICK_REQUEST_PRESETS = [
  'Sauce on the side',
  'Extra hot',
  'No salt',
  'Cut in half',
  'Serve with appetizers',
];

export const ModifierSheetModal: React.FC<ModifierSheetModalProps> = ({
  item,
  tableLabel,
  onClose,
  onConfirmAdd,
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedModifierIds, setSelectedModifierIds] = useState<Set<string>>(new Set());
  const [specialRequest, setSpecialRequest] = useState<string>('');
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
    if (!item) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [item, onClose]);

  const allAvailableModifiers = useMemo(() => {
    if (!item) return [];
    const existingNames = new Set(item.availableModifiers.map((m) => m.name.toLowerCase()));
    const extraAllergies = COMMON_ALLERGIES.filter(
      (a) => !existingNames.has(a.name.toLowerCase())
    );
    return [...item.availableModifiers, ...extraAllergies];
  }, [item]);

  if (!item) return null;

  const additions = allAvailableModifiers.filter((m) => m.type === 'addition');
  const removals = allAvailableModifiers.filter((m) => m.type === 'removal');
  const allergies = allAvailableModifiers.filter((m) => m.type === 'allergy');

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

  const selectedModifiers = allAvailableModifiers.filter((m) =>
    selectedModifierIds.has(m.id)
  );
  const modifierPriceDelta = selectedModifiers.reduce(
    (sum, mod) => sum + (mod.priceDelta || 0),
    0
  );
  const unitPrice = item.price + modifierPriceDelta;
  const lineTotal = unitPrice * quantity;

  const appendQuickPreset = (preset: string) => {
    setSpecialRequest((prev) => {
      if (!prev.trim()) return preset;
      if (prev.toLowerCase().includes(preset.toLowerCase())) return prev;
      return `${prev.trim()}, ${preset}`;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmAdd({
      menuItem: item,
      quantity,
      selectedModifiers,
      specialRequest: specialRequest.trim(),
      unitPrice,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modifier-sheet-title"
      className="fixed inset-0 z-50 bg-[#2B2623]/45 flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-5"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FAF6EE] w-full sm:max-w-lg h-[90vh] sm:h-[92vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* DRAWER HEADER */}
        <div className="bg-white px-6 py-5 shadow-[0_2px_12px_-4px_rgba(43,38,35,0.06)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative w-14 h-14 rounded-full overflow-hidden ring-4 ring-[#FAF6EE] flex-shrink-0 bg-stone-100">
              {!imgError ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  sizes="56px"
                  className="object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icons.PlateFallback color="#B4693A" />
                </div>
              )}
            </div>
            <div className="min-w-0 space-y-0.5">
              <span className="inline-block text-[11px] uppercase font-bold tracking-wider text-[#B4693A]">
                {tableLabel}
              </span>
              <h3
                id="modifier-sheet-title"
                className="text-xl font-extrabold text-[#2B2623] tracking-tight truncate"
              >
                {item.name}
              </h3>
              <p className="text-xs text-stone-500 font-normal">
                {item.subcategory} · ${item.price.toFixed(2)} base
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close customization drawer"
            className="w-11 h-11 rounded-xl bg-[#F4EFE6] hover:bg-[#EAE2D4] text-stone-600 hover:text-[#2B2623] flex items-center justify-center font-bold text-base cursor-pointer flex-shrink-0 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A]"
          >
            ✕
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* QUANTITY STEPPER */}
          <div className="bistro-surface rounded-2xl p-5 flex items-center justify-between">
            <div>
              <span className="text-base font-bold text-[#2B2623] block">Portions</span>
              <span className="text-xs text-stone-500">How many for the table?</span>
            </div>
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="w-12 h-12 rounded-xl bg-[#F4EFE6] hover:bg-[#EAE2D4] text-[#2B2623] font-bold flex items-center justify-center cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A]"
              >
                <Icons.Minus />
              </button>
              <span className="w-8 text-center font-mono text-xl font-extrabold text-[#2B2623] tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
                className="w-12 h-12 rounded-xl bg-[#2B2623] hover:bg-[#3D3632] text-white font-bold flex items-center justify-center cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A]"
              >
                <Icons.Plus />
              </button>
            </div>
          </div>

          {/* ADDITIONS / PREFERENCES */}
          {additions.length > 0 && (
            <section className="bistro-surface rounded-2xl p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Additions &amp; Preparation
                </h4>
                <span className="text-[11px] text-stone-400">Optional</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {additions.map((mod) => {
                  const active = selectedModifierIds.has(mod.id);
                  return (
                    <button
                      type="button"
                      key={mod.id}
                      onClick={() => toggleModifier(mod.id)}
                      aria-pressed={active}
                      className={`min-h-[48px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] ${
                        active
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-emerald-50/70 text-emerald-900 hover:bg-emerald-100/80 border border-emerald-200/60'
                      }`}
                    >
                      <span>{active ? '✓' : '+'}</span>
                      <span>{mod.name}</span>
                      {mod.priceDelta ? (
                        <span
                          className={`font-mono text-xs ${
                            active ? 'text-emerald-100' : 'text-emerald-700'
                          }`}
                        >
                          +${mod.priceDelta.toFixed(2)}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* REMOVALS */}
          {removals.length > 0 && (
            <section className="bistro-surface rounded-2xl p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700">
                  Hold Ingredients
                </h4>
                <span className="text-[11px] text-stone-400">No charge</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {removals.map((mod) => {
                  const active = selectedModifierIds.has(mod.id);
                  return (
                    <button
                      type="button"
                      key={mod.id}
                      onClick={() => toggleModifier(mod.id)}
                      aria-pressed={active}
                      className={`min-h-[48px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] ${
                        active
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'bg-rose-50/70 text-rose-800 hover:bg-rose-100/80 border border-rose-200/50'
                      }`}
                    >
                      <span>✕</span>
                      <span>{mod.name}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ALLERGY WARNINGS */}
          <section className="bistro-surface rounded-2xl p-5 space-y-3.5">
            <div className="flex items-center gap-2 text-rose-700">
              <Icons.AlertTriangle />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Allergy Alerts (Flagged for Chefs)
              </h4>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {allergies.map((mod) => {
                const active = selectedModifierIds.has(mod.id);
                return (
                  <button
                    type="button"
                    key={mod.id}
                    onClick={() => toggleModifier(mod.id)}
                    aria-pressed={active}
                    className={`min-h-[48px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] ${
                      active
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'bg-[#FAF6EE] text-rose-700 hover:bg-rose-50 border border-rose-200/50'
                    }`}
                  >
                    <Icons.AlertTriangle />
                    <span>{mod.name}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* SPECIAL REQUEST / KITCHEN NOTE */}
          <section className="bistro-surface rounded-2xl p-5 space-y-3.5">
            <label
              htmlFor="special-request-input"
              className="text-xs font-bold uppercase tracking-wider text-[#2B2623] block"
            >
              Special Request for the Chef
            </label>

            <div className="flex flex-wrap gap-2">
              {QUICK_REQUEST_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => appendQuickPreset(preset)}
                  className="px-3.5 py-2 rounded-xl bg-[#F4EFE6] hover:bg-[#EAE2D4] text-stone-700 text-xs font-medium cursor-pointer transition-colors duration-150"
                >
                  + {preset}
                </button>
              ))}
            </div>

            <textarea
              id="special-request-input"
              rows={3}
              value={specialRequest}
              onChange={(e) => setSpecialRequest(e.target.value)}
              placeholder="Write a quick note for the kitchen—e.g. extra crispy crust, or bring this out with the starters..."
              className="w-full rounded-xl bg-[#F4EFE6] px-4 py-3 text-sm text-[#2B2623] placeholder-stone-400 leading-relaxed transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B4693A]"
            />
          </section>
        </div>

        {/* STICKY FOOTER: Ghost Cancel + Single Primary Submit */}
        <div className="bg-white px-6 py-5 shadow-[0_-2px_16px_-4px_rgba(43,38,35,0.06)] flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-16 px-5 rounded-xl text-stone-500 hover:text-[#2B2623] hover:bg-[#F4EFE6] font-semibold text-sm cursor-pointer transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 h-16 rounded-xl bg-[#2B2623] hover:bg-[#3D3632] hover:-translate-y-0.5 active:translate-y-0 text-white font-bold text-base flex items-center justify-between px-6 shadow-sm cursor-pointer transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] focus-visible:ring-offset-2"
          >
            <span className="flex items-center gap-2">
              <Icons.Plus />
              <span>Add to {tableLabel}</span>
            </span>
            <span className="font-mono text-lg bg-white/15 px-3 py-1 rounded-lg">
              ${lineTotal.toFixed(2)}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
