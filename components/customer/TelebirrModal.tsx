'use client';

import React, { useState } from 'react';
import { Language } from '../../types/customer';
import { CUSTOMER_TRANSLATIONS } from '../../data/customer-menu';
import { Icons } from '../ui/Icons';

interface TelebirrModalProps {
  amountETB: number;
  phone: string;
  orderNumber: string;
  onSuccess: () => void;
  onCancel: () => void;
  lang: Language;
}

export const TelebirrModal: React.FC<TelebirrModalProps> = ({
  amountETB,
  phone,
  orderNumber,
  onSuccess,
  onCancel,
  lang,
}) => {
  const t = CUSTOMER_TRANSLATIONS[lang];
  const [pin, setPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'prompt' | 'processing' | 'success'>('prompt');

  const handleAuthorize = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setStep('processing');

    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onSuccess();
      }, 900);
    }, 1800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#2B2623]/65 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-stone-200">
        {/* TELEBIRR OFFICIAL STYLE HEADER */}
        <div className="bg-[#0072BC] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-extrabold text-[#0072BC] text-sm shadow-xs">
              tb
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">telebirr</h3>
              <p className="text-[11px] text-cyan-100">Ethiopian Telecom Mobile Money</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel Telebirr payment"
            className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold hover:bg-white/30 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-5">
          {step === 'prompt' && (
            <form onSubmit={handleAuthorize} className="space-y-4">
              {/* TRANSACTION DETAILS */}
              <div className="bg-[#FAF6EE] rounded-2xl p-4 border border-stone-200/60 space-y-2 text-xs">
                <div className="flex justify-between text-stone-500">
                  <span>Merchant:</span>
                  <span className="font-bold text-[#2B2623]">Gusteau&apos;s Kitchen</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Order Ref:</span>
                  <span className="font-mono font-bold text-[#2B2623]">{orderNumber}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Paying From:</span>
                  <span className="font-mono font-bold text-[#2B2623]">{phone || '0911223344'}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-stone-200 text-sm font-extrabold text-[#2B2623]">
                  <span>Total Amount:</span>
                  <span className="font-mono text-lg text-[#0072BC]">
                    {amountETB.toLocaleString()} ETB
                  </span>
                </div>
              </div>

              {/* PIN INPUT */}
              <div className="space-y-1.5">
                <label htmlFor="telebirr-pin" className="text-xs font-bold text-[#2B2623] block">
                  Enter 4-Digit Telebirr PIN:
                </label>
                <input
                  id="telebirr-pin"
                  type="password"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-12 text-center font-mono tracking-widest text-2xl bg-stone-50 rounded-xl border border-stone-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0072BC]"
                />
                <p className="text-[11px] text-stone-400 text-center">
                  Secured by Telebirr multi-factor authentication
                </p>
              </div>

              {/* CONFIRM BUTTON */}
              <button
                type="submit"
                disabled={pin.length < 4}
                className="w-full h-13 rounded-2xl bg-[#0072BC] hover:bg-[#005B96] disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer min-h-[52px]"
              >
                <span>Authorize &amp; Pay {amountETB.toLocaleString()} ETB</span>
              </button>
            </form>
          )}

          {step === 'processing' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full border-4 border-[#0072BC] border-t-transparent animate-spin mx-auto" />
              <div>
                <h4 className="font-extrabold text-base text-[#2B2623]">Authorizing with Telebirr...</h4>
                <p className="text-xs text-stone-500 mt-1">Verifying encrypted payment token...</p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mx-auto shadow-xs">
                ✓
              </div>
              <div>
                <h4 className="font-extrabold text-base text-emerald-900">Payment Successful!</h4>
                <p className="text-xs text-stone-500 mt-1">
                  {amountETB.toLocaleString()} ETB paid. Firing your order to the kitchen now...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
