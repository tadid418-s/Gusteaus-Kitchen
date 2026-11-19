'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { CustomerDineInView } from './customer';
import { TakeawayView } from './takeaway';

const KitchenDashboard = dynamic(() => import('./kitchen'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-[#2B2623] animate-pulse flex items-center justify-center text-white shadow-md">
          <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.5 2 6 5.5 6 9.5c0 3.2 2.1 5.9 5 6.4V21a1 1 0 0 0 2 0v-5.1c2.9-.5 5-3.2 5-6.4C18 5.5 15.5 2 12 2zm0 12c-2.2 0-4-2-4-4.5S9.8 5 12 5s4 2 4 4.5-1.8 4.5-4 4.5z" />
          </svg>
        </div>
        <p className="text-base font-bold text-[#2B2623] tracking-wide">
          Loading Gusteau&apos;s Kitchen...
        </p>
      </div>
    </div>
  ),
});

function MainRouter() {
  const searchParams = useSearchParams();
  const table = searchParams?.get('table');
  const view = searchParams?.get('view');
  const mode = searchParams?.get('mode');

  // 1. DINE-IN CUSTOMER VIEW (Table QR scans e.g. ?table=12 or /customer)
  if (table || view === 'customer') {
    return <CustomerDineInView initialTable={table || '12'} />;
  }

  // 2. TAKEAWAY CUSTOMER VIEW (Online Takeaway e.g. /takeaway or ?view=takeaway)
  if (view === 'takeaway' || mode === 'takeaway') {
    return <TakeawayView />;
  }

  // 3. DEFAULT: KITCHEN DISPLAY SYSTEM & WAITSTAFF POS (the original working dashboard)
  return <KitchenDashboard />;
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center">
          <p className="text-sm font-bold text-[#2B2623]">Loading Gusteau&apos;s Kitchen...</p>
        </div>
      }
    >
      <MainRouter />
    </Suspense>
  );
}
