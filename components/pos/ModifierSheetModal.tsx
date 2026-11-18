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

  // Reset form state whenever a new menu item is opened
  useEffect(() => {
    if (item) {
      setQuantity(1);
      setSelectedModifierIds(new Set());
      setSpecialRequest('');
      setImgError(false);
    }
  }, [item]);

  // Escape key dismissal
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
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FAF6EE] w-full sm:max-w-lg h-[90vh] sm:h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden"
      >
        {/* DRAWER HEADER */}
        <div className="bg-white px-5 py-4 border-b border-stone-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#B4693A] flex-shrink-0 bg-stone-100">
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
            <div className="min-w-0">
              <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 mb-0.5">
                Customize for {tableLabel}
              </span>
              <h3
                id="modifier-sheet-title"
                className="text-lg sm:text-xl font-bold text-[#2B2623] truncate"
              >
                {item.name}
              </h3>
              <p className="text-xs text-stone-500">
                {item.subcategory} &bull; Base ${item.price.toFixed(2)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close customization drawer"
            className="w-11 h-11 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center font-bold text-base cursor-pointer flex-shrink-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-300"
          >
            ✕
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* QUANTITY STEPPER */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-[#2B2623] block">Quantity</span>
              <span className="text-xs text-stone-500">Adjust portions for this item</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="w-12 h-12 rounded-2xl bg-stone-100 hover:bg-stone-200 text-[#2B2623] font-bold flex items-center justify-center cursor-pointer active:scale-95 transition-all"
              >
                <Icons.Minus />
              </button>
              <span className="w-8 text-center font-mono text-xl font-bold text-[#2B2623] tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
                className="w-12 h-12 rounded-2xl bg-[#2B2623] hover:bg-black text-white font-bold flex items-center justify-center cursor-pointer active:scale-95 transition-all"
              >
                <Icons.Plus />
              </button>
            </div>
          </div>

          {/* ADDITIONS / PREFERENCES (GREEN) */}
          {additions.length > 0 && (
            <section className="bg-white rounded-2xl p-4 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  + Additions &amp; Preparation
                </h4>
                <span className="text-[11px] text-stone-400">Optional</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {additions.map((mod) => {
                  const active = selectedModifierIds.has(mod.id);
                  return (
                    <button
                      type="button"
                      key={mod.id}
                      onClick={() => toggleModifier(mod.id)}
                      aria-pressed={active}
                      className={`min-h-[48px] px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-semibold border-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                        active
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-emerald-50/50 text-emerald-900 border-emerald-200 hover:border-emerald-400'
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
                          (+${mod.priceDelta.toFixed(2)})
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* REMOVALS (RED) */}
          {removals.length > 0 && (
            <section className="bg-white rounded-2xl p-4 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-red-700">
                  ✕ Removals / Hold Ingredients
                </h4>
                <span className="text-[11px] text-stone-400">No charge</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {removals.map((mod) => {
                  const active = selectedModifierIds.has(mod.id);
                  return (
                    <button
                      type="button"
                      key={mod.id}
                      onClick={() => toggleModifier(mod.id)}
                      aria-pressed={active}
                      className={`min-h-[48px] px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-semibold border-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                        active
                          ? 'bg-red-600 text-white border-red-600 shadow-sm'
                          : 'bg-red-50/60 text-red-800 border-red-200 hover:border-red-400'
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

          {/* ALLERGY WARNINGS (HIGH-CONTRAST ALERT BANNER FOR CHEFS) */}
          <section className="bg-white rounded-2xl p-4 border-2 border-red-200 space-y-3">
            <div className="flex items-center gap-2 text-red-700">
              <Icons.AlertTriangle />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Allergy Alerts (Highlighted Red on Chef Screen)
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {allergies.map((mod) => {
                const active = selectedModifierIds.has(mod.id);
                return (
                  <button
                    type="button"
                    key={mod.id}
                    onClick={() => toggleModifier(mod.id)}
                    aria-pressed={active}
                    className={`min-h-[48px] px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-bold border-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                      active
                        ? 'bg-red-600 text-white border-red-700 shadow-md ring-2 ring-red-300'
                        : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
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
          <section className="bg-white rounded-2xl p-4 border border-stone-200 space-y-3">
            <label
              htmlFor="special-request-input"
              className="text-xs font-bold uppercase tracking-wider text-[#2B2623] block"
            >
              Special Request / Note to Chef
            </label>

            {/* Quick tap presets */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REQUEST_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => appendQuickPreset(preset)}
                  className="px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium cursor-pointer transition-colors"
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
              placeholder="Type custom kitchen instructions (e.g., extra crispy crust, serve kids meal first)..."
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-[#2B2623] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#B4693A] focus:bg-white"
            />
          </section>
        </div>

        {/* STICKY FOOTER SUBMIT */}
        <div className="bg-white px-5 py-4 border-t border-stone-200 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-16 px-5 rounded-2xl border border-stone-200 hover:bg-stone-100 text-stone-700 font-semibold text-sm cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 h-16 rounded-2xl bg-[#2B2623] hover:bg-black active:scale-[0.99] text-white font-bold text-base flex items-center justify-between px-5 shadow-md cursor-pointer transition-all"
          >
            <span className="flex items-center gap-2">
              <Icons.Plus />
              <span>Add to {tableLabel}</span>
            </span>
            <span className="font-mono text-lg bg-white/15 px-3 py-1 rounded-xl">
              ${lineTotal.toFixed(2)}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
