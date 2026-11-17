'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';

// ============================================================================
// BRAND & DESIGN SYSTEM TOKENS (Gusteau's Kitchen)
// ============================================================================
// Brand Palette:
//   Cream: #FAF6EE (Background)
//   Charcoal: #2B2623 (Text, primary action buttons)
//   Copper: #B4693A (Brand accent, active nav, highlights)
//   Herb Green: #5E8B5A (Secondary accent)
// Reserved Status Colors:
//   Blue: New / Pending (#2563EB)
//   Amber: Preparing (#D97706)
//   Green: Ready / Served (#10B981)
//   Red: Overdue, Allergy, Payment Pending (#DC2626)
//   Purple: Takeaway (#7C3AED)

export type RoleMode = 'chef' | 'waiter';
export type OrderStatus = 'new' | 'preparing' | 'ready' | 'served';
export type OrderType = 'dine-in' | 'takeaway';
export type TableStatus = 'empty' | 'seated' | 'waiting' | 'ready' | 'pending';
export type PaymentMethod = 'cash' | 'card' | 'telebirr';

export interface Modifier {
  id: string;
  name: string;
  type: 'addition' | 'removal' | 'allergy';
  priceDelta?: number;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl: string;
  category: string;
  modifiers?: Modifier[];
}

export interface OrderTicket {
  id: string;
  orderNumber: string;
  type: OrderType;
  tableNumber?: string;
  placedAt: number; // timestamp in ms
  startedAt?: number;
  readyAt?: number;
  status: OrderStatus;
  items: OrderItem[];
  notes?: string;
  isOverdue?: boolean;
  isNewArrival?: boolean;
  paymentStatus: 'paid' | 'pending';
  waiterName?: string;
  claimedBy?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  price: number;
  imageUrl: string;
  popular?: boolean;
  availableModifiers: Modifier[];
}

// ============================================================================
// WEB AUDIO API SOUND SYSTEM (Zero External Dependencies)
// ============================================================================
class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initContext() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Crisp Parisian kitchen dual chime for New Orders
  playNewOrder() {
    if (!this.enabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Primary chime (587.33 Hz - D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Higher chime (880 Hz - A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.15);
      gain2.gain.setValueAtTime(0.3, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.85);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Celebratory ascending tri-tone chime for Ready Orders
  playOrderReady() {
    if (!this.enabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.2, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.5);
      });
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Warning buzz for overdue or critical alert
  playWarning() {
    if (!this.enabled) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Audio autoplay policy fallback
    }
  }
}

const sounds = new SoundEffects();

// ============================================================================
// INITIAL MOCK DATA (High quality Parisian Bistro dishes & real orders)
// ============================================================================
const MENU_DATABASE: MenuItem[] = [
  {
    id: 'm1',
    name: 'Margherita (16 Inch)',
    category: 'Pizza',
    subcategory: 'Classic Pizzas',
    price: 29.0,
    imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&q=80',
    availableModifiers: [
      { id: 'm1-1', name: 'Extra Mozzarella', type: 'addition', priceDelta: 2.5 },
      { id: 'm1-2', name: 'No Basil', type: 'removal' },
      { id: 'm1-3', name: 'Gluten-Free Crust', type: 'addition', priceDelta: 3.5 },
    ],
  },
  {
    id: 'm2',
    name: 'BBQ Chicken Pizza',
    category: 'Pizza',
    subcategory: 'Meat Lovers Pizzas',
    price: 32.98,
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80',
    availableModifiers: [
      { id: 'm2-1', name: 'No Red Onion', type: 'removal' },
      { id: 'm2-2', name: 'Extra BBQ Glaze', type: 'addition', priceDelta: 1.0 },
      { id: 'm2-3', name: 'Allergy: Peanuts', type: 'allergy' },
    ],
  },
  {
    id: 'm3',
    name: 'Veggie Supreme',
    category: 'Pizza',
    subcategory: 'Veggie Pizzas',
    price: 24.99,
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=400&q=80',
    popular: true,
    availableModifiers: [
      { id: 'm3-1', name: 'No Bell Peppers', type: 'removal' },
      { id: 'm3-2', name: 'Add Black Olives', type: 'addition', priceDelta: 1.5 },
      { id: 'm3-3', name: 'Vegan Cheese', type: 'addition', priceDelta: 2.0 },
    ],
  },
  {
    id: 'm4',
    name: 'Pesto Delight',
    category: 'Pizza',
    subcategory: 'Veggie Pizzas',
    price: 26.5,
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80',
    availableModifiers: [
      { id: 'm4-1', name: 'Allergy: Pine Nuts', type: 'allergy' },
      { id: 'm4-2', name: 'Add Sun-Dried Tomato', type: 'addition', priceDelta: 2.0 },
    ],
  },
  {
    id: 'm5',
    name: 'Truffle & Prosciutto',
    category: 'Pizza',
    subcategory: 'Artisan Pizzas',
    price: 34.0,
    imageUrl: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=400&q=80',
    availableModifiers: [
      { id: 'm5-1', name: 'Extra Truffle Oil', type: 'addition', priceDelta: 3.0 },
      { id: 'm5-2', name: 'Crispy Prosciutto on side', type: 'addition' },
    ],
  },
  {
    id: 'm6',
    name: 'Detroit-Style Square',
    category: 'Pizza',
    subcategory: 'Thick Crust Pizzas',
    price: 28.5,
    imageUrl: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=400&q=80',
    availableModifiers: [
      { id: 'm6-1', name: 'Extra Caramelized Edges', type: 'addition' },
    ],
  },
  {
    id: 'm7',
    name: 'California Pizza',
    category: 'Pizza',
    subcategory: 'Flatbread Pizzas',
    price: 19.99,
    imageUrl: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?auto=format&fit=crop&w=400&q=80',
    availableModifiers: [
      { id: 'm7-1', name: 'Add Arugula', type: 'addition', priceDelta: 1.5 },
      { id: 'm7-2', name: 'No Red Onion', type: 'removal' },
    ],
  },
  {
    id: 'm8',
    name: 'Bianca Pizza',
    category: 'Pizza',
    subcategory: 'White Pizzas',
    price: 22.0,
    imageUrl: 'https://images.unsplash.com/photo-1528137871618-79d2761e3fd5?auto=format&fit=crop&w=400&q=80',
    availableModifiers: [
      { id: 'm8-1', name: 'Extra Roasted Garlic', type: 'addition', priceDelta: 1.0 },
    ],
  },
  {
    id: 'm9',
    name: 'Half Roasted Chicken',
    category: 'Steak',
    subcategory: 'Rotisserie Bistro',
    price: 27.5,
    imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=400&q=80',
    availableModifiers: [
      { id: 'm9-1', name: 'Herb Butter Glaze', type: 'addition', priceDelta: 1.5 },
      { id: 'm9-2', name: 'Crispy Skin Well-Done', type: 'addition' },
    ],
  },
  {
    id: 'm10',
    name: 'Charred Ribeye Steak',
    category: 'Steak',
    subcategory: 'Prime Cuts',
    price: 42.0,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80',
    popular: true,
    availableModifiers: [
      { id: 'm10-1', name: 'Medium Rare', type: 'addition' },
      { id: 'm10-2', name: 'Black Truffle Butter', type: 'addition', priceDelta: 3.5 },
      { id: 'm10-3', name: 'No Garlic Salt', type: 'removal' },
    ],
  },
  {
    id: 'm11',
    name: 'Truffle Tagliatelle',
    category: 'Pasta',
    subcategory: 'Handmade Pasta',
    price: 28.0,
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281682?auto=format&fit=crop&w=400&q=80',
    availableModifiers: [
      { id: 'm11-1', name: 'Fresh Shaved Truffle', type: 'addition', priceDelta: 5.0 },
      { id: 'm11-2', name: 'Extra Aged Parmigiano', type: 'addition', priceDelta: 2.0 },
    ],
  },
  {
    id: 'm12',
    name: 'Bistro Green Garden Salad',
    category: 'Salad',
    subcategory: 'Fresh Salads',
    price: 16.5,
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
    availableModifiers: [
      { id: 'm12-1', name: 'Dressing on the Side', type: 'addition' },
      { id: 'm12-2', name: 'No Onion', type: 'removal' },
      { id: 'm12-3', name: 'Allergy: Walnuts', type: 'allergy' },
    ],
  },
  {
    id: 'm13',
    name: 'Wild Mushroom Risotto',
    category: 'Rice',
    subcategory: 'Risottos',
    price: 23.0,
    imageUrl: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=400&q=80',
    availableModifiers: [
      { id: 'm13-1', name: 'Herb Garnish', type: 'addition' },
    ],
  },
  {
    id: 'm14',
    name: 'Parisian Ratatouille Bowl',
    category: 'Noodle',
    subcategory: 'Chef Signature',
    price: 25.0,
    imageUrl: 'https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?auto=format&fit=crop&w=400&q=80',
    popular: true,
    availableModifiers: [
      { id: 'm14-1', name: 'Extra Provençal Herbs', type: 'addition', priceDelta: 1.0 },
    ],
  },
];

const INITIAL_ORDERS: OrderTicket[] = [
  {
    id: 'ord-1',
    orderNumber: '#F0945',
    type: 'dine-in',
    tableNumber: 'Table 16',
    placedAt: Date.now() - 4 * 60 * 1000, // 4 mins ago
    status: 'new',
    items: [
      {
        id: 'item-1',
        name: 'Margherita (16 Inch)',
        quantity: 1,
        price: 29.0,
        imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&q=80',
        category: 'Pizza',
        modifiers: [
          { id: 'mod-1', name: 'Extra Mozzarella', type: 'addition' },
          { id: 'mod-2', name: 'No Basil', type: 'removal' },
        ],
      },
      {
        id: 'item-2',
        name: 'Veggie Supreme',
        quantity: 2,
        price: 24.99,
        imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=400&q=80',
        category: 'Pizza',
        modifiers: [
          { id: 'mod-3', name: 'No Onion', type: 'removal' },
        ],
      },
      {
        id: 'item-3',
        name: 'BBQ Chicken Pizza',
        quantity: 1,
        price: 32.98,
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80',
        category: 'Pizza',
      },
    ],
    notes: 'Please fire all pizzas together. Table has guests catching a show.',
    paymentStatus: 'pending',
    waiterName: 'Jean-Luc',
    isNewArrival: true,
  },
  {
    id: 'ord-2',
    orderNumber: '#F0949',
    type: 'dine-in',
    tableNumber: 'Table 24',
    placedAt: Date.now() - 17 * 60 * 1000, // 17 mins ago (Orange threshold)
    startedAt: Date.now() - 12 * 60 * 1000,
    status: 'preparing',
    items: [
      {
        id: 'item-4',
        name: 'Charred Ribeye Steak',
        quantity: 2,
        price: 42.0,
        imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80',
        category: 'Steak',
        modifiers: [
          { id: 'mod-4', name: 'Medium Rare', type: 'addition' },
          { id: 'mod-5', name: 'Black Truffle Butter', type: 'addition' },
          { id: 'mod-6', name: 'Allergy: Peanuts', type: 'allergy' },
        ],
      },
    ],
    notes: 'Severe nut allergy on guest 2. Kitchen sanitization required.',
    paymentStatus: 'pending',
    waiterName: 'Colette',
  },
  {
    id: 'ord-3',
    orderNumber: '#F0956',
    type: 'dine-in',
    tableNumber: 'Table 09',
    placedAt: Date.now() - 22 * 60 * 1000,
    startedAt: Date.now() - 16 * 60 * 1000,
    readyAt: Date.now() - 2 * 60 * 1000,
    status: 'ready',
    items: [
      {
        id: 'item-5',
        name: 'Bistro Green Garden Salad',
        quantity: 1,
        price: 16.5,
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80',
        category: 'Salad',
        modifiers: [
          { id: 'mod-7', name: 'Dressing on the Side', type: 'addition' },
        ],
      },
      {
        id: 'item-6',
        name: 'Truffle Tagliatelle',
        quantity: 1,
        price: 28.0,
        imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281682?auto=format&fit=crop&w=400&q=80',
        category: 'Pasta',
        modifiers: [
          { id: 'mod-8', name: 'Extra Aged Parmigiano', type: 'addition' },
        ],
      },
    ],
    paymentStatus: 'pending',
    waiterName: 'Linguini',
  },
  {
    id: 'ord-4',
    orderNumber: '#T0811',
    type: 'takeaway',
    placedAt: Date.now() - 27 * 60 * 1000, // 27 mins ago (Overdue / Flashing Red!)
    startedAt: Date.now() - 19 * 60 * 1000,
    status: 'preparing',
    items: [
      {
        id: 'item-7',
        name: 'Half Roasted Chicken',
        quantity: 2,
        price: 27.5,
        imageUrl: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=400&q=80',
        category: 'Steak',
        modifiers: [
          { id: 'mod-9', name: 'Crispy Skin Well-Done', type: 'addition' },
          { id: 'mod-10', name: 'No Garlic Salt', type: 'removal' },
        ],
      },
    ],
    notes: 'Takeaway courier waiting at pass counter.',
    paymentStatus: 'paid',
    isOverdue: true,
  },
  {
    id: 'ord-5',
    orderNumber: '#F0942',
    type: 'dine-in',
    tableNumber: 'Table 26',
    placedAt: Date.now() - 10 * 60 * 1000,
    status: 'new',
    items: [
      {
        id: 'item-8',
        name: 'Veggie Supreme',
        quantity: 2,
        price: 24.99,
        imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=400&q=80',
        category: 'Pizza',
      },
      {
        id: 'item-9',
        name: 'Margherita (16 Inch)',
        quantity: 1,
        price: 29.0,
        imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&q=80',
        category: 'Pizza',
      },
      {
        id: 'item-10',
        name: 'BBQ Chicken',
        quantity: 2,
        price: 32.98,
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80',
        category: 'Pizza',
      },
      {
        id: 'item-11',
        name: 'California Pizza',
        quantity: 2,
        price: 19.99,
        imageUrl: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?auto=format&fit=crop&w=400&q=80',
        category: 'Pizza',
      },
    ],
    paymentStatus: 'pending',
    waiterName: 'Sakib Mahamud',
  },
];

const INITIAL_TABLES: { id: string; label: string; status: TableStatus; seats: number; currentOrderId?: string }[] = [
  { id: 't1', label: 'Table 01', status: 'empty', seats: 2 },
  { id: 't2', label: 'Table 02', status: 'seated', seats: 4 },
  { id: 't9', label: 'Table 09', status: 'ready', seats: 4, currentOrderId: 'ord-3' }, // Green pulsing!
  { id: 't12', label: 'Table 12', status: 'waiting', seats: 6 },
  { id: 't16', label: 'Table 16', status: 'waiting', seats: 4, currentOrderId: 'ord-1' },
  { id: 't24', label: 'Table 24', status: 'waiting', seats: 2, currentOrderId: 'ord-2' },
  { id: 't26', label: 'Table 26', status: 'pending', seats: 8, currentOrderId: 'ord-5' }, // Payment pending!
  { id: 't27', label: 'Table 27', status: 'empty', seats: 4 },
  { id: 't28', label: 'Table 28', status: 'seated', seats: 2 },
  { id: 't29', label: 'Table 29', status: 'empty', seats: 4 },
  { id: 't30', label: 'Table 30', status: 'empty', seats: 6 },
  { id: 't31', label: 'Table 31', status: 'waiting', seats: 2 },
];

// ============================================================================
// SVG ICONS (Clean, lightweight, zero dependencies, responsive)
// ============================================================================
const Icons = {
  SpoonLogo: () => (
    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.5 2 6 5.5 6 9.5c0 3.2 2.1 5.9 5 6.4V21a1 1 0 0 0 2 0v-5.1c2.9-.5 5-3.2 5-6.4C18 5.5 15.5 2 12 2zm0 12c-2.2 0-4-2-4-4.5S9.8 5 12 5s4 2 4 4.5-1.8 4.5-4 4.5z" />
    </svg>
  ),
  ChefHat: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 13.8a4.5 4.5 0 0 1-2.6-4.1 4.5 4.5 0 0 1 7.2-3.6 4.5 4.5 0 0 1 6.8 0 4.5 4.5 0 0 1 7.2 3.6 4.5 4.5 0 0 1-2.6 4.1" />
      <path d="M6 17h12a2 2 0 0 1 2 2v2H4v-2a2 2 0 0 1 2-2z" />
      <line x1="6" y1="14" x2="18" y2="14" />
    </svg>
  ),
  Bell: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Search: () => (
    <svg className="w-4 h-4 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  OrdersGrid: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
    </svg>
  ),
  TableMap: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="12" y1="6" x2="12" y2="18" />
    </svg>
  ),
  MenuBook: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  CalendarShifts: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Print: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  AlertTriangle: () => (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Minus: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Check: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  PackageCheck: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 16 2 2 4-4" />
      <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />
      <path d="m7.5 4.27 9 5.15" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" y1="22" x2="12" y2="12" />
    </svg>
  ),
  PlateFallback: ({ color = '#78716C' }: { color?: string }) => (
    <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" strokeDasharray="2 2" />
      <path d="M12 8v4l3 3" />
    </svg>
  ),
  Cash: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  ),
  CreditCard: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  MobilePhone: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  SoundWave: ({ on }: { on: boolean }) => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      {on ? (
        <>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
        </>
      ) : (
        <line x1="23" y1="9" x2="17" y2="15" />
      )}
    </svg>
  ),
};

const formatClockTime = (timestamp?: number): string => {
  if (!timestamp) return '--:--';
  try {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
};

// ============================================================================
// COMPONENT: LIVE ELAPSED TIMER BADGE
// Tabular numerals prevent bouncing; 0-15m grey, 15-25m amber, 25m+ flashing red
// ============================================================================
const TimerBadge: React.FC<{ placedAt: number }> = ({ placedAt }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    const update = () => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - placedAt) / 1000)));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [placedAt]);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timeFormatted = `${minutes}m ${seconds.toString().padStart(2, '0')}s`;

  let pillClasses = 'bg-stone-100 text-stone-600 border border-stone-200';
  if (minutes >= 25) {
    pillClasses = 'bg-red-50 text-red-700 border border-red-400 animate-flash-red font-bold';
  } else if (minutes >= 15) {
    pillClasses = 'bg-amber-50 text-amber-800 border border-amber-300 font-semibold';
  }

  return (
    <span
      suppressHydrationWarning
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono tabular-nums transition-colors ${pillClasses}`}
    >
      <Icons.Clock />
      <span suppressHydrationWarning>{timeFormatted}</span>
    </span>
  );
};

// ============================================================================
// COMPONENT: DISH PHOTO WITH STATUS RING & ROBUST FALLBACK
// ============================================================================
const DishStatusPhoto: React.FC<{
  imageUrl?: string;
  name: string;
  status: OrderStatus;
  size?: 'sm' | 'md' | 'lg';
  isOverdue?: boolean;
}> = ({ imageUrl, name, status, size = 'md', isOverdue }) => {
  const [hasError, setHasError] = useState(false);

  // Status Ring Color Tokens
  let ringColor = 'border-blue-500 ring-blue-100';
  if (isOverdue) {
    ringColor = 'border-red-500 ring-red-200 animate-pulse';
  } else if (status === 'preparing') {
    ringColor = 'border-amber-500 ring-amber-100';
  } else if (status === 'ready' || status === 'served') {
    ringColor = 'border-emerald-500 ring-emerald-100';
  }

  const dimensionClasses = {
    sm: 'w-10 h-10',
    md: 'w-20 h-20 sm:w-24 sm:h-24',
    lg: 'w-28 h-28 sm:w-32 sm:h-32',
  }[size];

  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0">
      <div
        className={`${dimensionClasses} rounded-full overflow-hidden border-2 p-0.5 ring-4 shadow-sm transition-all duration-300 bg-white ${ringColor}`}
      >
        {!hasError && imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            onError={() => setHasError(true)}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-stone-100 rounded-full">
            <Icons.PlateFallback color={isOverdue ? '#DC2626' : status === 'preparing' ? '#D97706' : '#2563EB'} />
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: KITCHEN ORDER CARD (Photo + Color Hybrid for Chefs & Waiters)
// Minimum touch target 48x48px; Action buttons 64px or taller (Section 6.4 & 8)
// ============================================================================
const OrderCard: React.FC<{
  order: OrderTicket;
  role: RoleMode;
  isSelected?: boolean;
  onSelect: () => void;
  onAdvanceStage: (orderId: string) => void;
  onClaimDelivery?: (orderId: string) => void;
}> = ({ order, role, isSelected, onSelect, onAdvanceStage, onClaimDelivery }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const heroItem = order.items[0];
  const totalItemCount = order.items.reduce((acc, curr) => acc + curr.quantity, 0);

  // Status-driven styling
  const isNew = order.status === 'new';
  const isPreparing = order.status === 'preparing';
  const isReady = order.status === 'ready';

  const cardBorderClasses = order.isOverdue
    ? 'border-2 border-red-500 shadow-red-100/50'
    : isNew
    ? 'border border-blue-400 animate-pulse-new'
    : isPreparing
    ? 'border border-amber-300 hover:border-amber-400'
    : 'border border-emerald-400 shadow-emerald-50';

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUpdating) return;
    setIsUpdating(true);

    if (role === 'waiter' && isReady && onClaimDelivery) {
      onClaimDelivery(order.id);
    } else {
      onAdvanceStage(order.id);
    }

    setTimeout(() => setIsUpdating(false), 300);
  };

  return (
    <div
      onClick={onSelect}
      className={`group relative flex flex-col justify-between bg-white rounded-3xl p-4 sm:p-5 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md ${cardBorderClasses} ${
        isSelected ? 'ring-4 ring-[#B4693A]/30 !border-[#B4693A]' : ''
      }`}
    >
      {/* CARD TOP BAR */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${
              order.type === 'takeaway'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-amber-100 text-amber-900'
            }`}
          >
            {order.type === 'takeaway' ? 'Takeaway: Paid' : order.tableNumber || 'Dine-in'}
          </span>
          <span className="text-xs font-mono text-stone-500">{order.orderNumber}</span>
        </div>
        <TimerBadge placedAt={order.placedAt} />
      </div>

      {/* HERO PHOTO + THUMBNAILS + DISH TITLE */}
      <div className="flex items-center gap-4 my-2">
        <div className="relative">
          <DishStatusPhoto
            imageUrl={heroItem?.imageUrl}
            name={heroItem?.name || 'Dish'}
            status={order.status}
            isOverdue={order.isOverdue}
            size="md"
          />
          {heroItem && (
            <span className="absolute -bottom-1 -right-1 bg-[#2B2623] text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
              x{heroItem.quantity}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-lg sm:text-xl font-bold text-[#2B2623] leading-tight line-clamp-2">
            {heroItem?.quantity}x {heroItem?.name}
          </h4>
          {order.items.length > 1 && (
            <p className="text-xs font-medium text-[#B4693A] mt-1">
              +{order.items.length - 1} more item{order.items.length - 1 > 1 ? 's' : ''} ({totalItemCount} total)
            </p>
          )}
          {order.waiterName && (
            <p className="text-xs text-stone-600 mt-0.5">Waiter: {order.waiterName}</p>
          )}
        </div>
      </div>

      {/* MODIFIERS & ALLERGY HIGHLIGHTS (Prominent for Kitchen Chefs) */}
      <div className="my-2 space-y-1.5">
        {order.items.flatMap((item) =>
          item.modifiers?.map((mod) => (
            <div key={mod.id}>
              {mod.type === 'allergy' ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-bold shadow-sm">
                  <Icons.AlertTriangle />
                  <span>{mod.name.toUpperCase()}</span>
                </div>
              ) : mod.type === 'removal' ? (
                <span className="inline-block px-2 py-0.5 mr-1 bg-red-100 text-red-700 border border-red-200 rounded-md text-xs font-medium">
                  ✕ {mod.name}
                </span>
              ) : (
                <span className="inline-block px-2 py-0.5 mr-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-xs font-medium">
                  + {mod.name}
                </span>
              )}
            </div>
          ))
        )}

        {order.notes && (
          <p className="text-xs italic text-stone-500 line-clamp-2 bg-stone-50 p-2 rounded-lg border border-stone-100">
            &ldquo;{order.notes}&rdquo;
          </p>
        )}
      </div>

      {/* FULL-WIDTH ACTION BUTTON (64px or taller as specified in Section 6.4) */}
      <div className="mt-3 pt-2">
        {role === 'chef' ? (
          isNew ? (
            <button
              onClick={handleActionClick}
              disabled={isUpdating}
              className="w-full h-14 sm:h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all min-h-[56px]"
            >
              <Icons.ChefHat />
              <span>{isUpdating ? 'Starting...' : 'Start Preparing'}</span>
            </button>
          ) : isPreparing ? (
            <button
              onClick={handleActionClick}
              disabled={isUpdating}
              className="w-full h-14 sm:h-16 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all min-h-[56px]"
            >
              <Icons.Check />
              <span>{isUpdating ? 'Marking Ready...' : 'Mark Ready'}</span>
            </button>
          ) : (
            <div className="w-full h-12 rounded-2xl bg-emerald-50 text-emerald-700 font-semibold text-sm flex items-center justify-center gap-2 border border-emerald-200">
              <Icons.Check />
              <span>Food Ready at Pass Counter</span>
            </div>
          )
        ) : (
          // Waitstaff Mode actions
          isReady ? (
            <button
              onClick={handleActionClick}
              disabled={isUpdating}
              className="w-full h-14 sm:h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all min-h-[56px]"
            >
              <Icons.PackageCheck />
              <span>{isUpdating ? 'Claiming...' : 'Claim Delivery'}</span>
            </button>
          ) : (
            <div className="w-full h-12 rounded-2xl bg-stone-100 text-stone-600 font-medium text-xs flex items-center justify-center gap-1.5 border border-stone-200">
              <Icons.Clock />
              <span>In Kitchen &bull; {isPreparing ? 'Chef Cooking' : 'Order Queued'}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: SPATIAL TABLE MAP (Section 6.7 Waitstaff Mode)
// Colors: Grey (Empty), Blue (Seated), Yellow (Waiting for food),
// Green (Food ready to serve - pulsing!), Red (Payment pending)
// ============================================================================
const TableMapView: React.FC<{
  tables: typeof INITIAL_TABLES;
  selectedTableId?: string;
  onSelectTable: (tableId: string) => void;
}> = ({ tables, selectedTableId, onSelectTable }) => {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200/60">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-xl font-bold text-[#2B2623]">Floor Plan & Table Status</h3>
          <p className="text-xs text-stone-500">Live dining room spatial grid with state sync</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-stone-300" /> Empty
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500" /> Seated
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400" /> Cooking
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" /> Ready (Serve!)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500" /> Bill Pending
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {tables.map((table) => {
          let bgClass = 'bg-stone-100 text-stone-600 border-stone-200';
          let pulseClass = '';

          if (table.status === 'seated') {
            bgClass = 'bg-blue-50 text-blue-800 border-blue-300';
          } else if (table.status === 'waiting') {
            bgClass = 'bg-amber-50 text-amber-800 border-amber-300';
          } else if (table.status === 'ready') {
            bgClass = 'bg-emerald-100 text-emerald-900 border-emerald-400';
            pulseClass = 'animate-pulse-ready ring-4 ring-emerald-300/60';
          } else if (table.status === 'pending') {
            bgClass = 'bg-red-50 text-red-800 border-red-300';
          }

          const isSelected = selectedTableId === table.id;

          return (
            <button
              key={table.id}
              onClick={() => onSelectTable(table.id)}
              className={`min-h-[110px] rounded-2xl p-3 border-2 flex flex-col justify-between items-center text-center transition-all cursor-pointer ${bgClass} ${pulseClass} ${
                isSelected ? 'ring-4 ring-[#B4693A] scale-105 shadow-md' : 'hover:scale-[1.02]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                  {table.seats} Seats
                </span>
                {table.status === 'ready' && (
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                )}
              </div>

              <div className="font-bold text-base sm:text-lg">{table.label}</div>

              <span className="text-[11px] font-semibold capitalize px-2 py-0.5 rounded-full bg-white/80">
                {table.status === 'waiting'
                  ? 'Cooking'
                  : table.status === 'ready'
                  ? '🛎️ Serve Food'
                  : table.status === 'pending'
                  ? '💳 Pay Pending'
                  : table.status}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: FOODIES MENU SECTION (Waiters Order Entry - Section 6.6)
// Category chips + dish cards with rounded photos and + button
// ============================================================================
const FoodiesMenuSection: React.FC<{
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  menuItems: MenuItem[];
  onAddItem: (item: MenuItem) => void;
}> = ({ categories, selectedCategory, onSelectCategory, menuItems, onAddItem }) => {
  const filteredItems = menuItems.filter(
    (item) => selectedCategory === 'All' || item.category === selectedCategory
  );

  return (
    <div className="space-y-4">
      {/* Category Chips Bar with circular thumbnails & item counts */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const count = menuItems.filter((i) => cat === 'All' || i.category === cat).length;
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[48px] ${
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

      {/* Menu Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="group relative bg-white rounded-3xl p-4 border border-stone-200/70 hover:border-stone-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex justify-center my-1">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden p-1 border-2 border-stone-200 group-hover:border-[#B4693A] transition-colors">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>

            <div className="text-center mt-2">
              <h5 className="font-bold text-sm sm:text-base text-[#2B2623] leading-snug line-clamp-1">
                {item.name}
              </h5>
              <p className="text-xs text-stone-600 mt-0.5">{item.subcategory}</p>
            </div>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-100">
              <span className="font-bold text-sm sm:text-base text-[#2B2623] font-mono">
                ${item.price.toFixed(2)}
              </span>
              <button
                onClick={() => onAddItem(item)}
                aria-label={`Add ${item.name} to order`}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-stone-100 hover:bg-[#2B2623] hover:text-white text-stone-800 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <Icons.Plus />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENT: ORDER DETAIL PANEL (Right Sidebar)
// Waitstaff Mode: Bill, Ordered Items, Payment Methods (Cash, Card, Telebirr), Print Receipt, Place Order
// Kitchen Mode: Ticket timeline (Placed, Started, Ready), Itemized prep checklist, Stage action button
// ============================================================================
const OrderDetailPanel: React.FC<{
  order: OrderTicket | null;
  role: RoleMode;
  onClose?: () => void;
  onAdvanceStage: (orderId: string) => void;
  onClaimDelivery?: (orderId: string) => void;
  onPrintReceipt: () => void;
  onCompletePayment: (method: PaymentMethod) => void;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onClearOrder: () => void;
}> = ({
  order,
  role,
  onClose,
  onAdvanceStage,
  onClaimDelivery,
  onPrintReceipt,
  onCompletePayment,
  onUpdateQuantity,
  onClearOrder,
}) => {
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!order) {
    return (
      <div className="bg-white rounded-3xl p-6 h-full flex flex-col items-center justify-center text-center border border-stone-200">
        <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
          <Icons.OrdersGrid />
        </div>
        <h4 className="text-lg font-bold text-[#2B2623]">No Ticket Selected</h4>
        <p className="text-xs text-stone-500 max-w-xs mt-1">
          Tap an order card or table from the main screen to view full item details, modifiers, and actions.
        </p>
      </div>
    );
  }

  const subtotal = order.items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const tax = subtotal * 0.15;
  const donation = order.type === 'dine-in' ? 5.99 : 0.0;
  const total = subtotal + tax + donation;

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onCompletePayment(selectedPayment);
    }, 400);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-stone-200 flex flex-col justify-between h-full">
      {/* HEADER */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#2B2623]">
              {order.tableNumber ? `${order.tableNumber}` : 'Takeaway Customer'}
            </h3>
            <p className="text-xs text-stone-600 font-mono">Order {order.orderNumber}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClearOrder}
              title="Clear/Cancel Order"
              className="w-10 h-10 rounded-full hover:bg-red-50 text-stone-400 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Icons.Trash />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden w-10 h-10 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* TIMELINE STRIP (Section 6.5) */}
        <div className="my-3 py-2 px-3 bg-stone-50 rounded-2xl flex items-center justify-between text-[11px] font-mono text-stone-500">
          <div>
            <span className="block font-sans text-[10px] text-stone-400">Placed</span>
            <span className="font-semibold text-stone-700" suppressHydrationWarning>
              {formatClockTime(order.placedAt)}
            </span>
          </div>
          <span className="text-stone-300">&rarr;</span>
          <div>
            <span className="block font-sans text-[10px] text-stone-400">Started</span>
            <span className="font-semibold text-stone-700" suppressHydrationWarning>
              {order.startedAt ? formatClockTime(order.startedAt) : 'Pending'}
            </span>
          </div>
          <span className="text-stone-300">&rarr;</span>
          <div>
            <span className="block font-sans text-[10px] text-stone-400">Ready</span>
            <span className="font-semibold text-stone-700" suppressHydrationWarning>
              {order.readyAt ? formatClockTime(order.readyAt) : 'In Prep'}
            </span>
          </div>
        </div>

        {/* ORDERED ITEMS LIST */}
        <div className="my-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              Ordered Items ({order.items.length})
            </span>
            <span className="text-xs font-semibold text-[#B4693A]">
              Status: {order.status.toUpperCase()}
            </span>
          </div>

          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-stone-200">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-[#2B2623] truncate">
                      {item.quantity}x {item.name}
                    </div>
                    {item.modifiers?.map((mod) => (
                      <span
                        key={mod.id}
                        className={`inline-block text-[10px] font-semibold mr-1 px-1.5 py-0.5 rounded ${
                          mod.type === 'allergy'
                            ? 'bg-red-600 text-white'
                            : mod.type === 'removal'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {mod.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-mono font-semibold text-stone-800">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                  {role === 'waiter' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-xs"
                      >
                        -
                      </button>
                      <button
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-xs"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER AREA: WAITER VS CHEF SPECIFIC */}
      <div className="mt-4 pt-3 border-t border-stone-100 space-y-4">
        {role === 'waiter' ? (
          <>
            {/* PAYMENT SUMMARY (Waiters only) */}
            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (15%)</span>
                <span className="font-mono">${tax.toFixed(2)}</span>
              </div>
              {donation > 0 && (
                <div className="flex justify-between text-stone-500">
                  <span>Donation for community kitchen</span>
                  <span className="font-mono">${donation.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-[#2B2623] pt-1.5 border-t border-stone-200">
                <span>Total</span>
                <span className="font-mono text-lg">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* PAYMENT METHOD SELECTOR (Cash, Card, Telebirr) */}
            <div>
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
                Payment Method
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPayment('cash')}
                  className={`p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    selectedPayment === 'cash'
                      ? 'border-[#2B2623] bg-[#2B2623] text-white shadow-sm'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <Icons.Cash />
                  <span className="text-xs font-semibold">Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPayment('card')}
                  className={`p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    selectedPayment === 'card'
                      ? 'border-[#2B2623] bg-[#2B2623] text-white shadow-sm'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <Icons.CreditCard />
                  <span className="text-xs font-semibold">Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPayment('telebirr')}
                  className={`p-2.5 rounded-2xl border text-center flex flex-col items-center gap-1 cursor-pointer transition-all ${
                    selectedPayment === 'telebirr'
                      ? 'border-[#2B2623] bg-[#2B2623] text-white shadow-sm'
                      : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <Icons.MobilePhone />
                  <span className="text-xs font-semibold">Telebirr</span>
                </button>
              </div>
            </div>

            {/* WAITER ACTION BUTTONS */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPrintReceipt}
                className="flex-1 h-14 rounded-2xl border border-stone-200 hover:bg-stone-50 text-[#2B2623] font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[56px]"
              >
                <Icons.Print />
                <span>Print Receipt</span>
              </button>

              {order.status === 'ready' ? (
                <button
                  type="button"
                  onClick={() => onClaimDelivery && onClaimDelivery(order.id)}
                  className="flex-[1.5] h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer min-h-[56px]"
                >
                  <Icons.PackageCheck />
                  <span>Claim Delivery</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={isProcessing}
                  className="flex-[1.5] h-14 rounded-2xl bg-[#2B2623] hover:bg-black active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer min-h-[56px]"
                >
                  <Icons.PackageCheck />
                  <span>{isProcessing ? 'Processing...' : 'Place Order'}</span>
                </button>
              )}
            </div>
          </>
        ) : (
          /* KITCHEN CHEF ACTIONS ONLY (Payment, Print Receipt, Place Order are hidden - Section 6.5) */
          <div className="space-y-3">
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-100 text-xs text-stone-600">
              <span className="font-bold text-[#2B2623] block mb-1">Chef Checklist & Notes:</span>
              <p>{order.notes || 'No special prep notes. Prepare according to standard bistro recipe.'}</p>
            </div>

            {order.status === 'new' ? (
              <button
                type="button"
                onClick={() => onAdvanceStage(order.id)}
                className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Icons.ChefHat />
                <span>Start Preparing Ticket</span>
              </button>
            ) : order.status === 'preparing' ? (
              <button
                type="button"
                onClick={() => onAdvanceStage(order.id)}
                className="w-full h-16 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Icons.Check />
                <span>Mark Dish Ready</span>
              </button>
            ) : (
              <div className="w-full h-16 rounded-2xl bg-emerald-50 text-emerald-800 font-bold text-sm flex items-center justify-center gap-2 border border-emerald-300">
                <Icons.Check />
                <span>Ready for Waitstaff Pickup</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT: GUSTEAU'S KITCHEN & WAITER DISPLAY
// ============================================================================
export default function KitchenDashboard() {
  // Current active mode (Chef vs Waiter)
  const [role, setRole] = useState<RoleMode>('chef');

  // Navigation tab for Waitstaff mode
  const [waiterActiveTab, setWaiterActiveTab] = useState<'orders' | 'menu' | 'tables'>('orders');

  // Real-time Orders State
  const [orders, setOrders] = useState<OrderTicket[]>(INITIAL_ORDERS);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('ord-1');

  // Filter chips in Order Line
  const [orderFilter, setOrderFilter] = useState<'all' | 'dine-in' | 'takeaway' | 'ready'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Tables State
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [selectedTableId, setSelectedTableId] = useState<string>('t16');

  // Menu Category State
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string>('Pizza');

  // Connection Simulation (SignalR dot)
  const [isConnected, setIsConnected] = useState<boolean>(true);

  // Audio system state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tablet drawer visibility
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  // Sync sound manager enabled state
  useEffect(() => {
    sounds.enabled = soundEnabled;
  }, [soundEnabled]);

  // Show auto-dismissing toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Find currently selected order ticket
  const selectedOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || orders[0] || null;
  }, [orders, selectedOrderId]);

  // Filtered orders list for Order Line & Kanban
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Search matching (by order # or table #)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNumber = o.orderNumber.toLowerCase().includes(q);
        const matchTable = o.tableNumber?.toLowerCase().includes(q) ?? false;
        if (!matchNumber && !matchTable) return false;
      }

      // Filter chip matching
      if (orderFilter === 'dine-in') return o.type === 'dine-in';
      if (orderFilter === 'takeaway') return o.type === 'takeaway';
      if (orderFilter === 'ready') return o.status === 'ready';
      return true;
    });
  }, [orders, searchQuery, orderFilter]);

  // Counts for top chip filters
  const counts = useMemo(() => {
    return {
      all: orders.length,
      dineIn: orders.filter((o) => o.type === 'dine-in').length,
      takeaway: orders.filter((o) => o.type === 'takeaway').length,
      ready: orders.filter((o) => o.status === 'ready').length,
      preparing: orders.filter((o) => o.status === 'preparing').length,
      new: orders.filter((o) => o.status === 'new').length,
    };
  }, [orders]);

  // Stage advancement (New -> Preparing -> Ready -> Served)
  const handleAdvanceStage = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        if (ord.status === 'new') {
          showToast(`Started preparation on ${ord.orderNumber}`);
          return { ...ord, status: 'preparing', startedAt: Date.now(), isNewArrival: false };
        }
        if (ord.status === 'preparing') {
          sounds.playOrderReady();
          showToast(`🛎️ ${ord.tableNumber || ord.orderNumber} is READY for service!`);
          return { ...ord, status: 'ready', readyAt: Date.now() };
        }
        return ord;
      })
    );
  };

  // Waiter claiming delivery
  const handleClaimDelivery = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        showToast(`Delivered & Claimed ${ord.tableNumber || ord.orderNumber}`);
        return { ...ord, status: 'served', claimedBy: 'Sakib Mahamud' };
      })
    );
  };

  // Add Item from Menu (Waitstaff mode)
  const handleAddItemToOrder = (menuItem: MenuItem) => {
    if (!selectedOrder) return;
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== selectedOrder.id) return ord;
        const existingItem = ord.items.find((i) => i.name === menuItem.name);
        if (existingItem) {
          return {
            ...ord,
            items: ord.items.map((i) =>
              i.name === menuItem.name ? { ...i, quantity: i.quantity + 1 } : i
            ),
          };
        }
        return {
          ...ord,
          items: [
            ...ord.items,
            {
              id: `item-${Date.now()}`,
              name: menuItem.name,
              quantity: 1,
              price: menuItem.price,
              imageUrl: menuItem.imageUrl,
              category: menuItem.category,
            },
          ],
        };
      })
    );
    showToast(`Added ${menuItem.name} to ${selectedOrder.tableNumber || selectedOrder.orderNumber}`);
  };

  // Update Item Quantity in Ticket
  const handleUpdateQuantity = (itemId: string, delta: number) => {
    if (!selectedOrder) return;
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== selectedOrder.id) return ord;
        const newItems = ord.items
          .map((item) => {
            if (item.id !== itemId) return item;
            return { ...item, quantity: item.quantity + delta };
          })
          .filter((item) => item.quantity > 0);
        return { ...ord, items: newItems };
      })
    );
  };

  // Clear or cancel order
  const handleClearOrder = () => {
    if (!selectedOrder) return;
    if (confirm(`Remove ${selectedOrder.orderNumber}?`)) {
      setOrders((prev) => prev.filter((o) => o.id !== selectedOrder.id));
      showToast(`Removed order ${selectedOrder.orderNumber}`);
    }
  };

  // Simulate incoming real-time ticket (Demonstrates SignalR instant arrival, Web Audio chime, pulse)
  const handleSimulateNewOrder = () => {
    const randomTable = `Table ${Math.floor(Math.random() * 20) + 1}`;
    const randomNum = `#F0${Math.floor(Math.random() * 899) + 100}`;
    const newTicket: OrderTicket = {
      id: `ord-${Date.now()}`,
      orderNumber: randomNum,
      type: 'dine-in',
      tableNumber: randomTable,
      placedAt: Date.now(),
      status: 'new',
      isNewArrival: true,
      paymentStatus: 'pending',
      waiterName: 'Jean-Luc',
      items: [
        {
          id: `item-gen-${Date.now()}`,
          name: 'Parisian Ratatouille Bowl',
          quantity: 2,
          price: 25.0,
          imageUrl: 'https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?auto=format&fit=crop&w=400&q=80',
          category: 'Chef Signature',
          modifiers: [{ id: 'mod-rat-1', name: 'Extra Provençal Herbs', type: 'addition' }],
        },
      ],
      notes: 'New live ticket placed via guest mobile ordering.',
    };

    setOrders((prev) => [newTicket, ...prev]);
    setSelectedOrderId(newTicket.id);
    sounds.playNewOrder();
    showToast(`🔔 New Order ${randomNum} for ${randomTable} received!`);
  };

  // Categories list
  const categories = useMemo(() => {
    return ['All', 'Pizza', 'Steak', 'Pasta', 'Salad', 'Rice', 'Noodle'];
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#2B2623] flex flex-col antialiased selection:bg-[#B4693A]/20">
      {/* ==================================================================== */}
      {/* OFFLINE BANNER (Section 6.1: SignalR Connection Loss Cues) */}
      {/* ==================================================================== */}
      {!isConnected && (
        <div className="bg-red-600 text-white px-4 py-2 text-center text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all">
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
          <span>Offline &bull; Reconnecting to Gusteau&apos;s SignalR Hub... Auto-retry running silently</span>
          <button
            onClick={() => setIsConnected(true)}
            className="ml-3 underline font-bold hover:text-stone-100"
          >
            Force Reconnect
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TOP BAR (Section 6.1 & Visual Mockup) */}
      {/* Logo, Search, Notification Bell, Audio toggle, Mode Switch, Profile */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-30 bg-[#FAF6EE]/90 backdrop-blur-md border-b border-stone-200/60 px-4 sm:px-6 py-3">
        <div className="max-w-[1680px] mx-auto flex items-center justify-between gap-4">
          {/* LEFT: BRAND LOGO */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2B2623] flex items-center justify-center shadow-sm">
              <Icons.SpoonLogo />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold text-[#2B2623] tracking-tight leading-none">
                Gusteau&apos;s Kitchen
              </h1>
              <span className="text-[11px] text-[#B4693A] font-semibold">
                {role === 'chef' ? 'Chef Display System (KDS)' : 'Waitstaff Point-of-Sale'}
              </span>
            </div>
          </div>

          {/* CENTER: SEARCH INPUT PILL */}
          <div className="flex-1 max-w-md mx-2 sm:mx-4">
            <div className="relative flex items-center">
              <span className="absolute left-4">
                <Icons.Search />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search table or order # (e.g. #F0945, Table 16)..."
                className="w-full bg-white border border-stone-200 rounded-full pl-11 pr-4 py-2.5 text-sm text-[#2B2623] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#B4693A] focus:border-transparent transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-stone-400 hover:text-stone-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: CONTROLS, AUDIO TOGGLE, ROLE SWITCHER & PROFILE CHIP */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Real-time Connection Status Dot */}
            <button
              onClick={() => setIsConnected(!isConnected)}
              title={isConnected ? 'SignalR Connected (Click to test offline)' : 'SignalR Offline'}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-700 shadow-sm cursor-pointer"
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                }`}
              />
              <span>{isConnected ? 'Live' : 'Offline'}</span>
            </button>

            {/* Audio Chime Mute/Test Button */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Chimes Active' : 'Chimes Muted'}
              className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-white border-stone-200 text-[#B4693A]'
                  : 'bg-stone-200 border-stone-300 text-stone-400'
              }`}
            >
              <Icons.SoundWave on={soundEnabled} />
            </button>

            {/* Notification Bell with live count */}
            <button
              onClick={handleSimulateNewOrder}
              title="Simulate Incoming Real-Time Ticket"
              className="relative w-10 h-10 rounded-full bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 flex items-center justify-center transition-all cursor-pointer shadow-sm"
            >
              <Icons.Bell />
              {counts.new > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white animate-bounce">
                  {counts.new}
                </span>
              )}
            </button>

            {/* ROLE MODE SWITCHER (Chef vs Waiter) */}
            <div className="bg-stone-200/80 p-1 rounded-full flex items-center">
              <button
                onClick={() => setRole('chef')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  role === 'chef'
                    ? 'bg-[#2B2623] text-white shadow-sm'
                    : 'text-stone-700 hover:text-black'
                }`}
              >
                👨‍🍳 Kitchen
              </button>
              <button
                onClick={() => setRole('waiter')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  role === 'waiter'
                    ? 'bg-[#2B2623] text-white shadow-sm'
                    : 'text-stone-700 hover:text-black'
                }`}
              >
                🛎️ Waitstaff
              </button>
            </div>

            {/* Profile Avatar Chip */}
            <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-stone-300/80">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-[#B4693A]/50"
              />
              <div className="text-left text-xs leading-tight">
                <span className="font-bold text-[#2B2623] block">
                  {role === 'chef' ? 'Chef Auguste' : 'Sakib Mahamud'}
                </span>
                <span className="text-[10px] text-stone-600">
                  {role === 'chef' ? 'Head Chef' : 'Lead Server'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* MAIN LAYOUT WRAPPER (Responsive 3-Column / Tablet Ergonomics) */}
      {/* ==================================================================== */}
      <div className="flex-1 max-w-[1680px] w-full mx-auto p-3 sm:p-5 flex gap-4 overflow-hidden">
        {/* ================================================================== */}
        {/* LEFT SIDEBAR (Section 6.2 - Minimum 48x48px touch targets) */}
        {/* ================================================================== */}
        <aside className="hidden md:flex flex-col justify-between items-center bg-white rounded-3xl p-3 border border-stone-200/80 shadow-sm w-16 sm:w-18 flex-shrink-0">
          {/* Top navigation tabs */}
          <div className="space-y-4">
            <button
              onClick={() => {
                if (role === 'waiter') setWaiterActiveTab('orders');
              }}
              title="Orders Line / Kanban"
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                role === 'chef' || waiterActiveTab === 'orders'
                  ? 'bg-[#2B2623] text-white shadow-sm'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-[#2B2623]'
              }`}
            >
              <Icons.OrdersGrid />
            </button>

            {role === 'waiter' && (
              <>
                <button
                  onClick={() => setWaiterActiveTab('tables')}
                  title="Table Floor Map"
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                    waiterActiveTab === 'tables'
                      ? 'bg-[#2B2623] text-white shadow-sm'
                      : 'text-stone-500 hover:bg-stone-100 hover:text-[#2B2623]'
                  }`}
                >
                  <Icons.TableMap />
                </button>

                <button
                  onClick={() => setWaiterActiveTab('menu')}
                  title="Foodies Menu & POS"
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                    waiterActiveTab === 'menu'
                      ? 'bg-[#2B2623] text-white shadow-sm'
                      : 'text-stone-500 hover:bg-stone-100 hover:text-[#2B2623]'
                  }`}
                >
                  <Icons.MenuBook />
                </button>
              </>
            )}

            <button
              onClick={() => showToast('Shift schedule: 4 chefs, 3 servers on duty')}
              title="Schedule & Shifts"
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-[#2B2623] transition-all cursor-pointer"
            >
              <Icons.CalendarShifts />
            </button>
          </div>

          {/* Bottom Settings & Logout Controls */}
          <div className="space-y-3">
            <button
              onClick={() => showToast('Settings: High-contrast KDS mode enabled')}
              title="Settings"
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-stone-500 hover:bg-stone-100 transition-all cursor-pointer"
            >
              <Icons.Settings />
            </button>

            <button
              onClick={() => showToast('Handover completed. Staff signed out.')}
              title="Shift Handover / Logout"
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-stone-500 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer"
            >
              <Icons.Logout />
            </button>
          </div>
        </aside>

        {/* ================================================================== */}
        {/* CENTER CONTENT REGION */}
        {/* CHEF: 3-Column Kitchen Kanban (New / Preparing / Ready) */}
        {/* WAITER: Order Line + Menu OR Table Map */}
        {/* ================================================================== */}
        <main className="flex-1 flex flex-col gap-4 min-w-0 overflow-y-auto">
          {/* ---------------------------------------------------------------- */}
          {/* TOP FILTER CHIPS BAR (Section 6.3) */}
          {/* ---------------------------------------------------------------- */}
          <div className="flex items-center justify-between flex-wrap gap-3 bg-white/70 backdrop-blur-sm p-3 rounded-2xl border border-stone-200/70">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mr-1">
                Filter:
              </span>
              <button
                onClick={() => setOrderFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  orderFilter === 'all'
                    ? 'bg-[#2B2623] text-white shadow-sm'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <span>All</span>
                <span className="px-1.5 py-0.2 bg-stone-100 text-stone-700 rounded-full font-mono text-[11px]">
                  {counts.all}
                </span>
              </button>

              <button
                onClick={() => setOrderFilter('dine-in')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  orderFilter === 'dine-in'
                    ? 'bg-[#2B2623] text-white shadow-sm'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <span>Dine In</span>
                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full font-mono text-[11px]">
                  {counts.dineIn}
                </span>
              </button>

              <button
                onClick={() => setOrderFilter('takeaway')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  orderFilter === 'takeaway'
                    ? 'bg-[#2B2623] text-white shadow-sm'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <span>Take Away</span>
                <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded-full font-mono text-[11px]">
                  {counts.takeaway}
                </span>
              </button>

              <button
                onClick={() => setOrderFilter('ready')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  orderFilter === 'ready'
                    ? 'bg-[#2B2623] text-white shadow-sm'
                    : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <span>Ready to Serve</span>
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full font-mono text-[11px]">
                  {counts.ready}
                </span>
              </button>
            </div>

            {/* Quick Action: Inject Test SignalR Ticket */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSimulateNewOrder}
                className="px-3 py-1.5 rounded-full bg-[#B4693A] hover:bg-[#9c572c] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Icons.Plus />
                <span>Simulate Order</span>
              </button>

              {/* Tablet detail drawer toggle button */}
              <button
                onClick={() => setIsMobileDetailOpen(true)}
                className="lg:hidden px-3 py-1.5 rounded-full bg-[#2B2623] text-white text-xs font-bold flex items-center gap-1.5"
              >
                <span>View Ticket ({selectedOrder?.orderNumber})</span>
              </button>
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* CHEF MODE: 3-COLUMN KITCHEN KANBAN (Section 6.3) */}
          {/* Column 1: New / Pending (Blue) */}
          {/* Column 2: Preparing (Amber) */}
          {/* Column 3: Ready for Pickup (Green) */}
          {/* ---------------------------------------------------------------- */}
          {role === 'chef' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 flex-1">
              {/* COLUMN 1: NEW / PENDING */}
              <div className="bg-stone-100/70 rounded-3xl p-4 flex flex-col gap-3 border border-stone-200/80">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                    <h3 className="font-bold text-sm sm:text-base text-[#2B2623]">
                      New / Pending Tickets
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {filteredOrders.filter((o) => o.status === 'new').length}
                  </span>
                </div>

                <div className="space-y-4 overflow-y-auto">
                  {filteredOrders
                    .filter((o) => o.status === 'new')
                    .map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        role={role}
                        isSelected={selectedOrderId === order.id}
                        onSelect={() => {
                          setSelectedOrderId(order.id);
                          setIsMobileDetailOpen(true);
                        }}
                        onAdvanceStage={handleAdvanceStage}
                      />
                    ))}

                  {filteredOrders.filter((o) => o.status === 'new').length === 0 && (
                    <div className="p-8 text-center text-xs text-stone-600 bg-white/50 rounded-2xl border border-dashed border-stone-300">
                      No new incoming tickets. Click &ldquo;Simulate Order&rdquo; above to test!
                    </div>
                  )}
                </div>
              </div>

              {/* COLUMN 2: PREPARING (AMBER) */}
              <div className="bg-stone-100/70 rounded-3xl p-4 flex flex-col gap-3 border border-stone-200/80">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <h3 className="font-bold text-sm sm:text-base text-[#2B2623]">
                      Actively Cooking
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    {filteredOrders.filter((o) => o.status === 'preparing').length}
                  </span>
                </div>

                <div className="space-y-4 overflow-y-auto">
                  {filteredOrders
                    .filter((o) => o.status === 'preparing')
                    .map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        role={role}
                        isSelected={selectedOrderId === order.id}
                        onSelect={() => {
                          setSelectedOrderId(order.id);
                          setIsMobileDetailOpen(true);
                        }}
                        onAdvanceStage={handleAdvanceStage}
                      />
                    ))}

                  {filteredOrders.filter((o) => o.status === 'preparing').length === 0 && (
                    <div className="p-8 text-center text-xs text-stone-600 bg-white/50 rounded-2xl border border-dashed border-stone-300">
                      No tickets currently in the cooking line.
                    </div>
                  )}
                </div>
              </div>

              {/* COLUMN 3: READY FOR PICKUP (GREEN) */}
              <div className="bg-stone-100/70 rounded-3xl p-4 flex flex-col gap-3 border border-stone-200/80">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <h3 className="font-bold text-sm sm:text-base text-[#2B2623]">
                      Ready for Pass / Pickup
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {filteredOrders.filter((o) => o.status === 'ready').length}
                  </span>
                </div>

                <div className="space-y-4 overflow-y-auto">
                  {filteredOrders
                    .filter((o) => o.status === 'ready')
                    .map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        role={role}
                        isSelected={selectedOrderId === order.id}
                        onSelect={() => {
                          setSelectedOrderId(order.id);
                          setIsMobileDetailOpen(true);
                        }}
                        onAdvanceStage={handleAdvanceStage}
                      />
                    ))}

                  {filteredOrders.filter((o) => o.status === 'ready').length === 0 && (
                    <div className="p-8 text-center text-xs text-stone-600 bg-white/50 rounded-2xl border border-dashed border-stone-300">
                      Pass counter is clear.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ---------------------------------------------------------------- */
            /* WAITER MODE: DUAL VIEW (Order Line + Foodies Menu OR Table Map) */
            /* Exact match with user mockup image */
            /* ---------------------------------------------------------------- */
            <div className="space-y-5">
              {/* UPPER SECTION: ORDER LINE HORIZONTAL CAROUSEL */}
              <section className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#2B2623]">
                      Live Order Line
                    </h2>
                    <p className="text-xs text-stone-500">
                      Tap tickets to inspect; claim ready food directly from the queue
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setOrderFilter('all')}
                      className="w-8 h-8 rounded-full border border-stone-200 hover:bg-stone-50 flex items-center justify-center text-stone-600"
                    >
                      <Icons.ChevronLeft />
                    </button>
                    <button
                      onClick={() => setOrderFilter('ready')}
                      className="w-8 h-8 rounded-full border border-stone-200 hover:bg-stone-50 flex items-center justify-center text-stone-600"
                    >
                      <Icons.ChevronRight />
                    </button>
                  </div>
                </div>

                {/* Horizontal scrolling order cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredOrders.slice(0, 3).map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      role={role}
                      isSelected={selectedOrderId === order.id}
                      onSelect={() => {
                        setSelectedOrderId(order.id);
                        setIsMobileDetailOpen(true);
                      }}
                      onAdvanceStage={handleAdvanceStage}
                      onClaimDelivery={handleClaimDelivery}
                    />
                  ))}
                </div>
              </section>

              {/* LOWER SECTION: SWITCH BETWEEN FOODIES MENU AND TABLE MAP */}
              <section className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setWaiterActiveTab('orders')}
                      className={`text-lg sm:text-xl font-bold transition-colors cursor-pointer ${
                        waiterActiveTab !== 'tables'
                          ? 'text-[#2B2623] underline decoration-[#B4693A] decoration-4 underline-offset-8'
                          : 'text-stone-400 hover:text-stone-600'
                      }`}
                    >
                      Foodies Menu (POS)
                    </button>
                    <span className="text-stone-300">|</span>
                    <button
                      onClick={() => setWaiterActiveTab('tables')}
                      className={`text-lg sm:text-xl font-bold transition-colors cursor-pointer ${
                        waiterActiveTab === 'tables'
                          ? 'text-[#2B2623] underline decoration-[#B4693A] decoration-4 underline-offset-8'
                          : 'text-stone-400 hover:text-stone-600'
                      }`}
                    >
                      Dining Room Table Map
                    </button>
                  </div>
                </div>

                {waiterActiveTab === 'tables' ? (
                  <TableMapView
                    tables={tables}
                    selectedTableId={selectedTableId}
                    onSelectTable={(tableId) => {
                      setSelectedTableId(tableId);
                      const tableObj = tables.find((t) => t.id === tableId);
                      if (tableObj?.currentOrderId) {
                        setSelectedOrderId(tableObj.currentOrderId);
                        setIsMobileDetailOpen(true);
                      }
                    }}
                  />
                ) : (
                  <FoodiesMenuSection
                    categories={categories}
                    selectedCategory={selectedMenuCategory}
                    onSelectCategory={setSelectedMenuCategory}
                    menuItems={MENU_DATABASE}
                    onAddItem={handleAddItemToOrder}
                  />
                )}
              </section>
            </div>
          )}
        </main>

        {/* ================================================================== */}
        {/* RIGHT SIDEBAR: ORDER DETAIL & CHECKOUT PANEL (Desktop View) */}
        {/* ================================================================== */}
        <aside className="hidden lg:block w-[360px] xl:w-[400px] flex-shrink-0">
          <OrderDetailPanel
            order={selectedOrder}
            role={role}
            onAdvanceStage={handleAdvanceStage}
            onClaimDelivery={handleClaimDelivery}
            onPrintReceipt={() => showToast(`🖨️ Printing receipt for ${selectedOrder?.orderNumber}`)}
            onCompletePayment={(method) => {
              showToast(`Payment of ${selectedOrder?.orderNumber} confirmed via ${method.toUpperCase()}!`);
              if (selectedOrder) {
                setOrders((prev) =>
                  prev.map((o) => (o.id === selectedOrder.id ? { ...o, paymentStatus: 'paid' } : o))
                );
              }
            }}
            onUpdateQuantity={handleUpdateQuantity}
            onClearOrder={handleClearOrder}
          />
        </aside>
      </div>

      {/* ==================================================================== */}
      {/* TABLET / MOBILE BOTTOM SHEET MODAL (Section 6.5 Modal Behaviour) */}
      {/* Focus trapped inside; tapping backdrop closes it */}
      {/* ==================================================================== */}
      {isMobileDetailOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 lg:hidden"
          onClick={() => setIsMobileDetailOpen(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto p-4 shadow-2xl animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <OrderDetailPanel
              order={selectedOrder}
              role={role}
              onClose={() => setIsMobileDetailOpen(false)}
              onAdvanceStage={(id) => {
                handleAdvanceStage(id);
                setIsMobileDetailOpen(false);
              }}
              onClaimDelivery={(id) => {
                handleClaimDelivery(id);
                setIsMobileDetailOpen(false);
              }}
              onPrintReceipt={() => showToast(`🖨️ Printing receipt for ${selectedOrder?.orderNumber}`)}
              onCompletePayment={(method) => {
                showToast(`Payment confirmed via ${method.toUpperCase()}!`);
                setIsMobileDetailOpen(false);
              }}
              onUpdateQuantity={handleUpdateQuantity}
              onClearOrder={() => {
                handleClearOrder();
                setIsMobileDetailOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* GLOBAL TOAST NOTIFICATION */}
      {/* ==================================================================== */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#2B2623] text-white px-5 py-3 rounded-full text-sm font-semibold shadow-xl flex items-center gap-3 border border-stone-700 animate-in fade-in slide-in-from-bottom-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#B4693A] animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
