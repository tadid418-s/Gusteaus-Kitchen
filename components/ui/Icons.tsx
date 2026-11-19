import React from 'react';

const BASE_STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const Icons = {
  SpoonLogo: () => (
    <svg aria-hidden="true" className="w-5 h-5 text-white" viewBox="0 0 24 24" {...BASE_STROKE}>
      <path d="M12 3c-2.6 0-4.5 2.5-4.5 5.5 0 2.5 1.5 4.7 3.7 5.3V21h1.6v-7.2c2.2-.6 3.7-2.8 3.7-5.3C16.5 5.5 14.6 3 12 3z" />
    </svg>
  ),
  ChefHat: () => (
    <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" {...BASE_STROKE}>
      <path d="M6 13.8a4.5 4.5 0 0 1-2.6-4.1 4.5 4.5 0 0 1 7.2-3.6 4.5 4.5 0 0 1 6.8 0 4.5 4.5 0 0 1 7.2 3.6 4.5 4.5 0 0 1-2.6 4.1" />
      <path d="M6 17h12a2 2 0 0 1 2 2v2H4v-2a2 2 0 0 1 2-2z" />
      <line x1="6" y1="14" x2="18" y2="14" />
    </svg>
  ),
  Bell: () => (
    <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" {...BASE_STROKE}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Search: () => (
    <svg aria-hidden="true" className="w-4 h-4 text-stone-400" viewBox="0 0 24 24" {...BASE_STROKE}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Clock: () => (
    <svg aria-hidden="true" className="w-3.5 h-3.5" viewBox="0 0 24 24" {...BASE_STROKE}>
      <circle cx="12" cy="12" r="9.5" />
      <polyline points="12 6.5 12 12 15.5 14" />
    </svg>
  ),
  OrdersGrid: () => (
    <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" {...BASE_STROKE}>
      <rect x="3" y="3" width="7" height="7" rx="1.75" />
      <rect x="14" y="3" width="7" height="7" rx="1.75" />
      <rect x="14" y="14" width="7" height="7" rx="1.75" />
      <rect x="3" y="14" width="7" height="7" rx="1.75" />
    </svg>
  ),
  TableMap: () => (
    <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" {...BASE_STROKE}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="12" y1="5" x2="12" y2="19" />
    </svg>
  ),
  MenuBook: () => (
    <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" {...BASE_STROKE}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  CalendarShifts: () => (
    <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" {...BASE_STROKE}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Settings: () => (
    <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" {...BASE_STROKE}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Logout: () => (
    <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" {...BASE_STROKE}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Trash: () => (
    <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" {...BASE_STROKE}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Print: () => (
    <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24" {...BASE_STROKE}>
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24" {...BASE_STROKE}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24" {...BASE_STROKE}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  AlertTriangle: () => (
    <svg aria-hidden="true" className="w-3.5 h-3.5" viewBox="0 0 24 24" {...BASE_STROKE}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Plus: () => (
    <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24" {...BASE_STROKE}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Minus: () => (
    <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24" {...BASE_STROKE}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Check: () => (
    <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24" {...BASE_STROKE}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  PackageCheck: () => (
    <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" {...BASE_STROKE}>
      <path d="m16 16 2 2 4-4" />
      <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />
      <path d="m7.5 4.27 9 5.15" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" y1="22" x2="12" y2="12" />
    </svg>
  ),
  PlateFallback: ({ color = '#78716C' }: { color?: string }) => (
    <svg aria-hidden="true" className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="12" cy="12" r="5.5" strokeDasharray="2 2.5" />
    </svg>
  ),
  Cash: () => (
    <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" {...BASE_STROKE}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  ),
  CreditCard: () => (
    <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" {...BASE_STROKE}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  MobilePhone: () => (
    <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" {...BASE_STROKE}>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  SoundWave: ({ on }: { on: boolean }) => (
    <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24" {...BASE_STROKE}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      {on ? (
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
      ) : (
        <line x1="23" y1="9" x2="17" y2="15" />
      )}
    </svg>
  ),
  ShoppingBag: () => (
    <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" {...BASE_STROKE}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  QrCode: () => (
    <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" {...BASE_STROKE}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M14 14h2v2h-2z" />
      <path d="M18 14h3v3h-3z" />
      <path d="M14 18h3v3h-3z" />
      <path d="M19 19h2v2h-2z" />
    </svg>
  ),
  Utensils: () => (
    <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" {...BASE_STROKE}>
      <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
      <path d="M15 11v11" />
      <path d="M5 2v4a3 3 0 0 0 3 3 3 3 0 0 0 3-3V2" />
      <path d="M8 9v13" />
    </svg>
  ),
  Receipt: () => (
    <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" {...BASE_STROKE}>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
    </svg>
  ),
  Heart: ({ filled }: { filled?: boolean }) => (
    <svg
      aria-hidden="true"
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  ),
  Close: () => (
    <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24" {...BASE_STROKE}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  ArrowBack: () => (
    <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24" {...BASE_STROKE}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
};
