'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CustomerMenuItem,
  CartItem,
  CustomerOrder,
  Language,
  DietaryFilter,
} from '../types/customer';
import { OrderTicket, OrderStatus, PaymentMethod } from '../types/pos';
import { CUSTOMER_MENU, CUSTOMER_TRANSLATIONS } from '../data/customer-menu';
import { sounds } from '../lib/sound';
import { Icons } from '../components/ui/Icons';
import { CustomerHeader } from '../components/customer/CustomerHeader';
import { BottomNav, CustomerTab } from '../components/customer/BottomNav';
import { FloatingCartBar } from '../components/customer/FloatingCartBar';
import { DishDetailSheet } from '../components/customer/DishDetailSheet';
import { TelebirrModal } from '../components/customer/TelebirrModal';
import { CustomerReceiptModal } from '../components/customer/CustomerReceiptModal';

interface CustomerViewProps {
  initialTable?: string;
}

export function CustomerDineInView({ initialTable }: CustomerViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 1. EXTRACT & LOCK TABLE NUMBER (UNALTERABLE BY USER)
  const rawTableParam = searchParams?.get('table') || initialTable || '12';
  const lockedTableNumber = useMemo(() => {
    const trimmed = rawTableParam.trim();
    if (/^\d+$/.test(trimmed)) {
      return `Table ${trimmed.padStart(2, '0')}`;
    }
    if (/^t\d+$/i.test(trimmed)) {
      return `Table ${trimmed.replace(/^t/i, '').padStart(2, '0')}`;
    }
    return trimmed.startsWith('Table') ? trimmed : `Table ${trimmed}`;
  }, [rawTableParam]);

  // Language state
  const [lang, setLang] = useState<Language>('en');
  const t = CUSTOMER_TRANSLATIONS[lang];

  // Navigation tab
  const [activeTab, setActiveTab] = useState<CustomerTab>('menu');

  // Menu filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDietary, setSelectedDietary] = useState<DietaryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Margherita',
    'Truffle',
    'Tsom',
    'Pasta',
  ]);

  // Cart & items
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderNotes, setOrderNotes] = useState('');

  // Modals & Sheets
  const [customizingItem, setCustomizingItem] = useState<CustomerMenuItem | null>(null);
  const [showTelebirr, setShowTelebirr] = useState(false);
  const [pendingTelebirrOrder, setPendingTelebirrOrder] = useState<CustomerOrder | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<CustomerOrder | null>(null);

  // Checkout Form
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentChoice, setPaymentChoice] = useState<'telebirr' | 'card' | 'cash'>('telebirr');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Orders & Live Tracking
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  // UI feedback & toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['m1', 'm5']));

  // Rating for served orders
  const [rating, setRating] = useState<number | null>(null);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Initial Load: Language, Cart, Orders from LocalStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedLang = localStorage.getItem('gusteaus_lang') as Language;
      if (savedLang === 'en' || savedLang === 'am') setLang(savedLang);

      const savedCart = localStorage.getItem(`gusteaus_cart_${lockedTableNumber}`);
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedOrders = localStorage.getItem('gusteaus_customer_orders');
      if (savedOrders) {
        const parsed: CustomerOrder[] = JSON.parse(savedOrders);
        setOrders(parsed);
        const latest = parsed.find(
          (o) => o.tableNumber === lockedTableNumber && o.status !== 'served'
        );
        if (latest) {
          setActiveOrderId(latest.id);
        }
      }

      const savedFavs = localStorage.getItem('gusteaus_favs');
      if (savedFavs) setFavorites(new Set(JSON.parse(savedFavs)));
    } catch {
      // Ignore local storage errors
    }
  }, [lockedTableNumber]);

  // Persist Cart
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`gusteaus_cart_${lockedTableNumber}`, JSON.stringify(cart));
    } catch {}
  }, [cart, lockedTableNumber]);

  // Persist Language
  const toggleLanguage = () => {
    const next = lang === 'en' ? 'am' : 'en';
    setLang(next);
    try {
      localStorage.setItem('gusteaus_lang', next);
    } catch {}
  };

  // Toggle favorite
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast(lang === 'am' ? 'ከተወዳጆች ተሰርዟል' : 'Removed from favorites');
      } else {
        next.add(id);
        showToast(lang === 'am' ? 'ወደ ተወዳጆች ተጨምሯል' : 'Added to favorites');
      }
      try {
        localStorage.setItem('gusteaus_favs', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // Simulated live tracking progress for customer order
  useEffect(() => {
    if (!activeOrderId) return;

    const interval = setInterval(() => {
      setOrders((prev) =>
        prev.map((ord) => {
          if (ord.id === activeOrderId) {
            if (ord.status === 'new') {
              return { ...ord, status: 'preparing' };
            }
            if (ord.status === 'preparing') {
              sounds.playOrderReady();
              showToast(t.statusReadyDineIn);
              return { ...ord, status: 'ready' };
            }
          }
          return ord;
        })
      );
    }, 15000);

    return () => clearInterval(interval);
  }, [activeOrderId, t.statusReadyDineIn]);

  // Category and Dietary Lists
  const categories = useMemo(() => {
    const list = Array.from(new Set(CUSTOMER_MENU.map((m) => m.category)));
    return ['All', ...list];
  }, []);

  const dietaryFilters: { id: DietaryFilter; label: string; icon: string }[] = [
    { id: 'all', label: lang === 'am' ? 'ሁሉም' : 'All', icon: '🍽️' },
    { id: 'vegetarian', label: lang === 'am' ? 'የአትክልት' : 'Vegetarian', icon: '🌱' },
    { id: 'vegan', label: lang === 'am' ? 'ቪጋን' : 'Vegan', icon: '🌿' },
    { id: 'spicy', label: lang === 'am' ? 'የሚያቃጥል' : 'Spicy', icon: '🌶️' },
    { id: 'tsom', label: lang === 'am' ? 'የጾም' : 'Fasting (Tsom)', icon: '🥗' },
    { id: 'halal', label: lang === 'am' ? 'ሀላል' : 'Halal', icon: '✨' },
    { id: 'gluten-free', label: lang === 'am' ? 'ከግሉተን ነፃ' : 'Gluten-Free', icon: '🌾' },
  ];

  // Filtered Menu Items
  const filteredMenu = useMemo(() => {
    return CUSTOMER_MENU.filter((item) => {
      // Category match
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }
      // Dietary match
      if (selectedDietary !== 'all') {
        if (!item.dietary.includes(selectedDietary)) return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchAm = item.nameAm?.toLowerCase().includes(q) ?? false;
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchCategory = item.category.toLowerCase().includes(q);
        if (!matchName && !matchAm && !matchDesc && !matchCategory) return false;
      }
      return true;
    });
  }, [selectedCategory, selectedDietary, searchQuery]);

  // Popular / Chef's Picks
  const popularDishes = useMemo(() => {
    return CUSTOMER_MENU.filter((m) => m.popular);
  }, []);

  // Active Order object
  const activeOrder = useMemo(() => {
    return orders.find((o) => o.id === activeOrderId) || orders[0] || null;
  }, [orders, activeOrderId]);

  // Totals
  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartSubtotalETB = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPriceETB * item.quantity, 0);
  }, [cart]);

  const cartTaxETB = useMemo(() => {
    return Math.round(cartSubtotalETB * 0.15); // 15% VAT
  }, [cartSubtotalETB]);

  const cartTotalETB = cartSubtotalETB + cartTaxETB;

  // Add item to cart from Dish Detail Sheet
  const handleAddToCart = (payload: {
    item: CustomerMenuItem;
    quantity: number;
    selectedModifiers: CustomerMenuItem['availableModifiers'];
    specialRequest: string;
    unitPriceETB: number;
  }) => {
    const newCartItem: CartItem = {
      cartItemId: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      menuItemId: payload.item.id,
      name: payload.item.name,
      nameAm: payload.item.nameAm,
      category: payload.item.category,
      imageUrl: payload.item.imageUrl,
      quantity: payload.quantity,
      unitPriceETB: payload.unitPriceETB,
      selectedModifiers: payload.selectedModifiers,
      specialRequest: payload.specialRequest,
    };

    setCart((prev) => [...prev, newCartItem]);
    showToast(`${payload.quantity}x ${payload.item.name} ${lang === 'am' ? 'ተጨምሯል' : 'added to cart'}`);
  };

  // Quick Add for simple dishes
  const handleQuickAdd = (item: CustomerMenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.availableModifiers && item.availableModifiers.length > 0) {
      setCustomizingItem(item);
      return;
    }
    const newCartItem: CartItem = {
      cartItemId: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      menuItemId: item.id,
      name: item.name,
      nameAm: item.nameAm,
      category: item.category,
      imageUrl: item.imageUrl,
      quantity: 1,
      unitPriceETB: item.priceETB,
      selectedModifiers: [],
    };
    setCart((prev) => [...prev, newCartItem]);
    showToast(`1x ${item.name} ${lang === 'am' ? 'ተጨምሯል' : 'added to cart'}`);
  };

  // Steppers in Cart
  const updateCartItemQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
    showToast(lang === 'am' ? 'ምግቡ ከቅርጫት ተሰርዟል' : 'Item removed from cart');
  };

  // Submit Order Process
  const handleInitiateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsSubmittingOrder(true);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `#GK-${randomSuffix}`;
    const orderId = `ord-${Date.now()}`;

    const newOrder: CustomerOrder = {
      id: orderId,
      orderNumber,
      type: 'dine-in',
      tableNumber: lockedTableNumber,
      isTableLocked: true,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      items: [...cart],
      subtotalETB: cartSubtotalETB,
      taxETB: cartTaxETB,
      serviceChargeETB: 0,
      totalETB: cartTotalETB,
      paymentMethod: paymentChoice,
      paymentStatus: paymentChoice === 'cash' ? 'pending' : 'paid',
      placedAt: Date.now(),
      status: 'new',
      notes: orderNotes.trim() || undefined,
      estimatedMinutes: 20,
    };

    if (paymentChoice === 'telebirr') {
      setPendingTelebirrOrder(newOrder);
      setShowTelebirr(true);
      setIsSubmittingOrder(false);
      return;
    }

    // Cash or Card direct submission
    completeOrderPlacement(newOrder);
  };

  const completeOrderPlacement = (finalOrder: CustomerOrder) => {
    sounds.playNewOrder();

    setOrders((prev) => {
      const updated = [finalOrder, ...prev];
      try {
        localStorage.setItem('gusteaus_customer_orders', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Clear cart
    setCart([]);
    try {
      localStorage.removeItem(`gusteaus_cart_${lockedTableNumber}`);
    } catch {}

    setActiveOrderId(finalOrder.id);
    setIsCheckingOut(false);
    setIsSubmittingOrder(false);
    setActiveTab('orders');
    showToast(t.orderConfirmed);
  };

  // Handle Call Waiter
  const handleCallWaiter = () => {
    sounds.playNewOrder();
    setWaiterCalled(true);
    showToast(`${t.waiterCalledMsg} (${lockedTableNumber})`);
    setTimeout(() => setWaiterCalled(false), 5000);
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#2B2623] flex flex-col font-sans selection:bg-[#B4693A] selection:text-white pb-24">
      {/* 1. STICKY BRAND HEADER WITH UNALTERABLE TABLE BADGE */}
      <CustomerHeader
        orderType="dine-in"
        tableNumber={lockedTableNumber}
        lang={lang}
        onToggleLang={toggleLanguage}
        cartCount={cartItemCount}
        onOpenCart={() => {
          setIsCheckingOut(false);
          setActiveTab('cart');
        }}
        onOpenStaff={() => router.push('/?mode=staff')}
      />

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#2B2623] text-white px-4 py-2.5 rounded-full shadow-xl text-xs font-semibold flex items-center gap-2 animate-bounce-short border border-stone-700 max-w-sm text-center">
          <span className="w-2 h-2 rounded-full bg-[#5E8B5A]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 pt-3 pb-8">
        {/* =================================================================== */}
        {/* TAB 1: MENU SCREEN                                                 */}
        {/* =================================================================== */}
        {activeTab === 'menu' && (
          <div className="space-y-5">
            {/* 4.1 TABLE QR VERIFIED WELCOME BANNER */}
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#2B2623] to-[#3F3733] text-white p-5 sm:p-6 shadow-md border border-stone-800">
              <div className="absolute top-0 right-0 w-36 h-36 bg-[#B4693A]/20 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF6EE]/15 backdrop-blur-xs text-amber-200 text-xs font-bold border border-amber-300/20">
                    <span>🔒</span>
                    <span>{lockedTableNumber}</span>
                    <span className="text-amber-100/70 font-normal">· {t.welcomeDineIn}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#FAF6EE]">
                    {lang === 'am' ? 'ጉስቶው ኪችን እንኳን ደህና መጡ' : "Welcome to Gusteau's"}
                  </h2>
                  <p className="text-xs text-stone-300 max-w-md leading-relaxed">
                    {lang === 'am'
                      ? 'ምግብዎን ከመረጡ በኋላ በቀጥታ ወደዚህ ጠረጴዛ ይዘጋጅልዎታል።'
                      : 'Browse our artisanal Parisian bistro menu. Tap dishes to customize and order straight to your table.'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#B4693A]/30 border border-[#B4693A]/40 flex items-center justify-center text-amber-300 flex-shrink-0 shadow-inner">
                  <Icons.Utensils />
                </div>
              </div>
            </div>

            {/* QUICK SEARCH BAR */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Icons.Search />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'am' ? 'ምግቦችን በስም ወይም በግብአት ፈልግ...' : 'Search pasta, pizza, steak...'}
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white border border-stone-200 text-sm font-medium text-[#2B2623] placeholder-stone-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#B4693A] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <Icons.Close />
                </button>
              )}
            </div>

            {/* HORIZONTAL CATEGORY CHIPS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-stone-500 uppercase tracking-wider px-1">
                <span>{t.categories}</span>
                <span className="text-[11px] font-medium text-stone-400">
                  {filteredMenu.length} items
                </span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all duration-150 cursor-pointer shadow-2xs ${
                        isActive
                          ? 'bg-[#2B2623] text-white shadow-xs'
                          : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200/80'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DIETARY FILTER TOGGLES */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {dietaryFilters.map((diet) => {
                const isSelected = selectedDietary === diet.id;
                return (
                  <button
                    key={diet.id}
                    type="button"
                    onClick={() => setSelectedDietary(diet.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-[#B4693A] text-white shadow-2xs'
                        : 'bg-stone-100 hover:bg-stone-200/80 text-stone-600'
                    }`}
                  >
                    <span>{diet.icon}</span>
                    <span>{diet.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 4.3 POPULAR / CHEF'S PICKS HORIZONTAL STRIP */}
            {selectedCategory === 'All' && !searchQuery && popularDishes.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-extrabold text-[#2B2623] flex items-center gap-1.5">
                    <span className="text-amber-500">★</span>
                    <span>{t.popularStrip}</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-[#B4693A]">
                    {popularDishes.length} favorites
                  </span>
                </div>

                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                  {popularDishes.map((dish) => {
                    const isFav = favorites.has(dish.id);
                    return (
                      <div
                        key={dish.id}
                        onClick={() => setCustomizingItem(dish)}
                        className="w-48 flex-shrink-0 bg-white rounded-2xl p-2.5 shadow-sm hover:shadow-md border border-stone-200/70 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                      >
                        <div className="relative w-full h-28 rounded-xl overflow-hidden bg-stone-100 mb-2">
                          <Image
                            src={dish.imageUrl}
                            alt={dish.name}
                            fill
                            sizes="192px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <button
                            type="button"
                            onClick={(e) => toggleFavorite(dish.id, e)}
                            className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-xs shadow-xs"
                          >
                            <span className={isFav ? 'text-red-500' : 'text-stone-400'}>
                              {isFav ? '❤️' : '🤍'}
                            </span>
                          </button>
                          <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-[#2B2623]/80 backdrop-blur-xs text-[10px] font-bold text-amber-300">
                            ★ {t.popularBadge}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-xs font-black text-[#2B2623] truncate">
                            {lang === 'am' && dish.nameAm ? dish.nameAm : dish.name}
                          </h4>
                          <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                            {lang === 'am' && dish.descriptionAm ? dish.descriptionAm : dish.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
                          <span className="font-mono text-xs font-black text-[#B4693A]">
                            {dish.priceETB.toLocaleString()} ETB
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleQuickAdd(dish, e)}
                            className="h-7 px-2.5 rounded-lg bg-[#2B2623] text-white text-[11px] font-bold hover:bg-[#B4693A] transition-colors cursor-pointer"
                          >
                            {t.addToCart}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DISH CARD GRID */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-extrabold text-[#2B2623]">
                  {selectedCategory === 'All'
                    ? lang === 'am'
                      ? 'ሙሉ ምናሌ'
                      : 'All Bistro Dishes'
                    : selectedCategory}
                </h3>
                <span className="text-xs font-semibold text-stone-400">
                  {filteredMenu.length} {lang === 'am' ? 'ምግቦች' : 'dishes'}
                </span>
              </div>

              {filteredMenu.length === 0 ? (
                <div className="py-12 text-center bg-white rounded-3xl border border-dashed border-stone-300 p-6">
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-xl mb-3">
                    🔍
                  </div>
                  <h4 className="text-sm font-extrabold text-[#2B2623]">
                    {lang === 'am' ? 'ምንም ምግብ አልተገኘም' : 'No dishes matched'}
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                    {lang === 'am'
                      ? 'እባክዎ የተለየ ቃል ይፈልጉ ወይም ማጣሪያውን ይቀይሩ።'
                      : 'Try adjusting your search query or clear the dietary filters.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedDietary('all');
                      setSelectedCategory('All');
                    }}
                    className="mt-4 px-4 py-2 rounded-xl bg-[#2B2623] text-white text-xs font-bold cursor-pointer"
                  >
                    {lang === 'am' ? 'ሁሉንም አሳይ' : 'Reset Filters'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {filteredMenu.map((dish) => {
                    const isFav = favorites.has(dish.id);
                    return (
                      <div
                        key={dish.id}
                        onClick={() => setCustomizingItem(dish)}
                        className="bg-white rounded-2xl p-3 shadow-xs hover:shadow-md border border-stone-200/80 transition-all duration-200 cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
                      >
                        <div className="flex gap-3">
                          <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
                            <Image
                              src={dish.imageUrl}
                              alt={dish.name}
                              fill
                              sizes="96px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {dish.popular && (
                              <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-[#2B2623]/80 text-[9px] font-bold text-amber-300 backdrop-blur-2xs">
                                ★
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-1">
                                <h4 className="text-sm font-black text-[#2B2623] leading-tight truncate">
                                  {lang === 'am' && dish.nameAm ? dish.nameAm : dish.name}
                                </h4>
                                <button
                                  type="button"
                                  onClick={(e) => toggleFavorite(dish.id, e)}
                                  className="text-stone-300 hover:text-red-500 text-sm p-0.5 flex-shrink-0"
                                >
                                  {isFav ? '❤️' : '🤍'}
                                </button>
                              </div>

                              <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-snug">
                                {lang === 'am' && dish.descriptionAm
                                  ? dish.descriptionAm
                                  : dish.description}
                              </p>
                            </div>

                            {/* DIETARY TAGS */}
                            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                              {dish.dietary.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-medium capitalize"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* PRICE & ADD BUTTON */}
                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-stone-100">
                          <div>
                            <span className="text-xs text-stone-400 font-semibold uppercase tracking-wider block text-[10px]">
                              Price
                            </span>
                            <span className="font-mono text-sm font-black text-[#B4693A]">
                              {dish.priceETB.toLocaleString()} ETB
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleQuickAdd(dish, e)}
                            className="h-9 px-3.5 rounded-xl bg-[#2B2623] hover:bg-[#B4693A] text-white text-xs font-bold transition-all flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                          >
                            <span>+</span>
                            <span>{t.addToCart}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: SEARCH SCREEN                                               */}
        {/* =================================================================== */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-stone-200/80 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500">
                  <Icons.Search />
                </div>
                <h2 className="text-base font-extrabold text-[#2B2623]">{t.searchTab}</h2>
              </div>

              {/* SEARCH INPUT */}
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === 'am' ? 'ምግቦችን በስም ይፈልጉ...' : 'Type dish name, ingredient, pasta, pizza...'}
                  className="w-full pl-4 pr-10 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-sm font-medium text-[#2B2623] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#B4693A]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700"
                  >
                    <Icons.Close />
                  </button>
                )}
              </div>

              {/* RECENT SEARCHES */}
              {!searchQuery && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                    {lang === 'am' ? 'የቅርብ ጊዜ ፍለጋዎች' : 'Popular & Recent Searches'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSearchQuery(tag)}
                        className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RESULTS */}
            {searchQuery && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-stone-500 px-1">
                  {filteredMenu.length} {lang === 'am' ? 'ውጤቶች ተገኝተዋል' : 'results found'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredMenu.map((dish) => (
                    <div
                      key={dish.id}
                      onClick={() => setCustomizingItem(dish)}
                      className="bg-white rounded-2xl p-3 shadow-xs border border-stone-200 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
                          <Image src={dish.imageUrl} alt={dish.name} fill sizes="64px" className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#2B2623] truncate">
                            {lang === 'am' && dish.nameAm ? dish.nameAm : dish.name}
                          </h4>
                          <span className="text-xs font-mono font-black text-[#B4693A] block mt-0.5">
                            {dish.priceETB.toLocaleString()} ETB
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(dish, e)}
                        className="h-8 px-3 rounded-lg bg-[#2B2623] text-white text-xs font-bold hover:bg-[#B4693A] cursor-pointer flex-shrink-0"
                      >
                        +
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: CART & CHECKOUT                                             */}
        {/* =================================================================== */}
        {activeTab === 'cart' && (
          <div className="space-y-4">
            {/* IF NOT CHECKING OUT -> CART ITEMS VIEW */}
            {!isCheckingOut ? (
              <div className="space-y-4">
                {/* CART HEADER & TABLE REMINDER */}
                <div className="bg-white rounded-3xl p-5 shadow-xs border border-stone-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
                      <Icons.ShoppingBag />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-[#2B2623]">{t.cartTitle}</h2>
                      <p className="text-xs text-stone-500 font-medium">
                        {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} ·{' '}
                        <span className="font-bold text-[#2B2623]">🔒 {lockedTableNumber}</span>
                      </p>
                    </div>
                  </div>

                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(lang === 'am' ? 'ቅርጫቱን ማጽዳት ይፈልጋሉ?' : 'Clear all items in cart?')) {
                          setCart([]);
                        }
                      }}
                      className="text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer"
                    >
                      {lang === 'am' ? 'አጽዳ' : 'Clear'}
                    </button>
                  )}
                </div>

                {/* EMPTY CART STATE */}
                {cart.length === 0 ? (
                  <div className="py-14 text-center bg-white rounded-3xl border border-dashed border-stone-300 p-8 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-2xl">
                      🥡
                    </div>
                    <h3 className="text-base font-black text-[#2B2623]">{t.cartEmpty}</h3>
                    <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
                      {t.cartEmptyDesc}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('menu')}
                      className="mt-2 px-6 py-3 rounded-2xl bg-[#2B2623] hover:bg-[#3F3733] text-white text-xs font-black shadow-md cursor-pointer transition-all"
                    >
                      {t.browseMenu}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* CART ITEM LIST */}
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div
                          key={item.cartItemId}
                          className="bg-white rounded-2xl p-4 shadow-xs border border-stone-200/80 flex gap-3.5 items-start"
                        >
                          <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
                            <Image src={item.imageUrl} alt={item.name} fill sizes="80px" className="object-cover" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-extrabold text-[#2B2623] leading-snug">
                                {lang === 'am' && item.nameAm ? item.nameAm : item.name}
                              </h4>
                              <button
                                type="button"
                                onClick={() => removeCartItem(item.cartItemId)}
                                className="text-stone-400 hover:text-red-500 text-xs p-1 cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>

                            {/* SELECTED MODIFIERS */}
                            {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.selectedModifiers.map((mod) => (
                                  <span
                                    key={mod.id}
                                    className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                                      mod.type === 'removal'
                                        ? 'bg-red-50 text-red-700'
                                        : mod.type === 'allergy'
                                        ? 'bg-amber-100 text-amber-900 font-bold'
                                        : 'bg-emerald-50 text-emerald-800'
                                    }`}
                                  >
                                    {mod.type === 'removal' ? `No ${mod.name}` : mod.name}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* SPECIAL REQUEST */}
                            {item.specialRequest && (
                              <p className="text-[11px] text-[#B4693A] italic mt-1 font-medium bg-amber-50/60 px-2 py-0.5 rounded border border-amber-200/40">
                                📝 &quot;{item.specialRequest}&quot;
                              </p>
                            )}

                            {/* LINE PRICE & STEPPER */}
                            <div className="flex items-center justify-between mt-3">
                              <span className="font-mono text-xs font-black text-[#B4693A]">
                                {(item.unitPriceETB * item.quantity).toLocaleString()} ETB
                              </span>

                              <div className="flex items-center gap-2 bg-stone-100 rounded-xl p-1">
                                <button
                                  type="button"
                                  onClick={() => updateCartItemQuantity(item.cartItemId, -1)}
                                  className="w-7 h-7 rounded-lg bg-white text-stone-700 hover:bg-stone-200 text-xs font-black flex items-center justify-center cursor-pointer shadow-2xs"
                                >
                                  -
                                </button>
                                <span className="font-mono text-xs font-extrabold text-[#2B2623] px-1">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateCartItemQuantity(item.cartItemId, 1)}
                                  className="w-7 h-7 rounded-lg bg-white text-stone-700 hover:bg-stone-200 text-xs font-black flex items-center justify-center cursor-pointer shadow-2xs"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ORDER NOTE */}
                    <div className="bg-white rounded-2xl p-4 shadow-xs border border-stone-200/80 space-y-1.5">
                      <label className="text-xs font-extrabold text-[#2B2623]">
                        {lang === 'am' ? 'የትዕዛዝ ማስታወሻ (አማራጭ)' : 'Order Note for Kitchen (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder={
                          lang === 'am'
                            ? 'ምሳሌ፦ ሁሉንም በአንድ ጊዜ አምጡልን...'
                            : 'e.g. Please bring appetizers together, extra napkins...'
                        }
                        className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-[#2B2623] focus:outline-none focus:ring-2 focus:ring-[#B4693A]"
                      />
                    </div>

                    {/* PRICE BREAKDOWN */}
                    <div className="bg-white rounded-3xl p-5 shadow-xs border border-stone-200/80 space-y-2.5">
                      <div className="flex justify-between text-xs text-stone-600">
                        <span>{t.subtotal}</span>
                        <span className="font-mono font-bold text-[#2B2623]">
                          {cartSubtotalETB.toLocaleString()} ETB
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-stone-600">
                        <span>{t.tax}</span>
                        <span className="font-mono font-bold text-[#2B2623]">
                          {cartTaxETB.toLocaleString()} ETB
                        </span>
                      </div>
                      <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-black text-[#2B2623]">
                        <span>{t.total}</span>
                        <span className="font-mono text-base text-[#B4693A]">
                          {cartTotalETB.toLocaleString()} ETB
                        </span>
                      </div>
                    </div>

                    {/* CONTINUE TO CHECKOUT BUTTON */}
                    <button
                      type="button"
                      onClick={() => setIsCheckingOut(true)}
                      className="w-full h-14 rounded-2xl bg-[#2B2623] hover:bg-[#3C3531] text-white font-extrabold text-sm flex items-center justify-between px-6 shadow-lg transition-all duration-150 cursor-pointer active:scale-[0.99]"
                    >
                      <span>{t.continueToCheckout}</span>
                      <span className="font-mono text-amber-200">
                        {cartTotalETB.toLocaleString()} ETB →
                      </span>
                    </button>
                  </>
                )}
              </div>
            ) : (
              /* CHECKOUT FORM VIEW */
              <form onSubmit={handleInitiateOrder} className="space-y-4">
                {/* BACK TO CART BUTTON */}
                <button
                  type="button"
                  onClick={() => setIsCheckingOut(false)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-[#2B2623] cursor-pointer"
                >
                  <Icons.ArrowBack />
                  <span>{lang === 'am' ? 'ወደ ቅርጫት ተመለስ' : 'Back to Cart'}</span>
                </button>

                {/* 1. TABLE NUMBER (LOCKED - CANNOT ALTER) */}
                <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-5 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                      {lang === 'am' ? 'የተረጋገጠ የጠረጴዛ ቁጥር' : 'Verified QR Table (Locked)'}
                    </span>
                    <span className="text-xs font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
                      🔒 Fixed
                    </span>
                  </div>
                  <div className="text-2xl font-black text-amber-950 font-mono tracking-tight">
                    {lockedTableNumber}
                  </div>
                  <p className="text-[11px] text-amber-800 leading-tight">
                    {t.lockedTableNote}
                  </p>
                </div>

                {/* 2. GUEST CONTACT DETAILS (NAME OPTIONAL, PHONE FOR TELEBIRR) */}
                <div className="bg-white rounded-3xl p-5 shadow-xs border border-stone-200/80 space-y-3.5">
                  <h3 className="text-xs font-black text-[#2B2623] uppercase tracking-wider">
                    {lang === 'am' ? 'የእንግዳ መረጃ' : 'Guest Details'}
                  </h3>

                  <div>
                    <label className="text-xs font-bold text-stone-600 block mb-1">
                      {t.customerName}
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={t.customerNamePlaceholder}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-[#2B2623] focus:outline-none focus:ring-2 focus:ring-[#B4693A]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-600 block mb-1">
                      {t.customerPhone}
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder={t.customerPhonePlaceholder}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-[#2B2623] focus:outline-none focus:ring-2 focus:ring-[#B4693A]"
                    />
                  </div>
                </div>

                {/* 3. PAYMENT METHOD SELECTION */}
                <div className="bg-white rounded-3xl p-5 shadow-xs border border-stone-200/80 space-y-3">
                  <h3 className="text-xs font-black text-[#2B2623] uppercase tracking-wider">
                    {t.paymentMethodTitle}
                  </h3>

                  <div className="space-y-2.5">
                    {/* TELEBIRR */}
                    <label
                      onClick={() => setPaymentChoice('telebirr')}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        paymentChoice === 'telebirr'
                          ? 'border-[#0072BC] bg-[#0072BC]/5 ring-1 ring-[#0072BC]'
                          : 'border-stone-200 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#0072BC] text-white flex items-center justify-center font-bold text-xs">
                          tb
                        </div>
                        <div>
                          <span className="text-xs font-extrabold text-[#2B2623] block">
                            {t.telebirrMethod}
                          </span>
                          <span className="text-[11px] text-stone-500">
                            Instant mobile USSD push & receipt
                          </span>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentChoice === 'telebirr'}
                        onChange={() => setPaymentChoice('telebirr')}
                        className="text-[#0072BC] focus:ring-[#0072BC]"
                      />
                    </label>

                    {/* CARD */}
                    <label
                      onClick={() => setPaymentChoice('card')}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        paymentChoice === 'card'
                          ? 'border-[#B4693A] bg-[#B4693A]/5 ring-1 ring-[#B4693A]'
                          : 'border-stone-200 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center text-xs font-bold">
                          💳
                        </div>
                        <div>
                          <span className="text-xs font-extrabold text-[#2B2623] block">
                            {t.cardMethod}
                          </span>
                          <span className="text-[11px] text-stone-500">
                            Visa / Mastercard / local debit
                          </span>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentChoice === 'card'}
                        onChange={() => setPaymentChoice('card')}
                        className="text-[#B4693A] focus:ring-[#B4693A]"
                      />
                    </label>

                    {/* PAY AT TABLE (DINE-IN ONLY ALLOWS CASH/WAITER POS) */}
                    <label
                      onClick={() => setPaymentChoice('cash')}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        paymentChoice === 'cash'
                          ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                          : 'border-stone-200 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">
                          💵
                        </div>
                        <div>
                          <span className="text-xs font-extrabold text-[#2B2623] block">
                            {t.cashMethod}
                          </span>
                          <span className="text-[11px] text-stone-500">
                            Pay waiter with cash or portable POS when food is served
                          </span>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentChoice === 'cash'}
                        onChange={() => setPaymentChoice('cash')}
                        className="text-emerald-700 focus:ring-emerald-700"
                      />
                    </label>
                  </div>

                  <p className="text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-200/60 leading-relaxed">
                    💡 {t.dineInPayNotice}
                  </p>
                </div>

                {/* 4. FINAL ORDER SUMMARY & STICKY SUBMIT BUTTON */}
                <div className="bg-white rounded-3xl p-5 shadow-xs border border-stone-200/80 space-y-2">
                  <div className="flex justify-between text-xs text-stone-500">
                    <span>{cartItemCount} items for {lockedTableNumber}</span>
                    <span className="font-mono font-bold text-[#2B2623]">
                      {cartTotalETB.toLocaleString()} ETB
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingOrder}
                  className="w-full h-14 rounded-2xl bg-[#2B2623] hover:bg-[#3C3531] disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer active:scale-[0.99]"
                >
                  {isSubmittingOrder ? (
                    <span>Processing order...</span>
                  ) : (
                    <>
                      <span>{t.placeOrder}:</span>
                      <span className="font-mono text-amber-200">
                        {cartTotalETB.toLocaleString()} ETB
                      </span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: ORDERS & LIVE TRACKER                                       */}
        {/* =================================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* ACTIVE ORDER LIVE TRACKER */}
            {activeOrder ? (
              <div className="space-y-4">
                {/* ORDER HEADER CARD */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-wider text-[#B4693A]">
                        Live Kitchen Tracker
                      </span>
                    </div>
                    <span className="font-mono text-xs font-extrabold text-stone-500">
                      {activeOrder.orderNumber}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-black text-[#2B2623] tracking-tight">
                        {activeOrder.tableNumber}
                      </h2>
                      <p className="text-xs text-stone-500 font-medium">
                        {activeOrder.items.length} dishes ·{' '}
                        <span className="capitalize font-bold text-stone-700">
                          {activeOrder.paymentStatus === 'paid' ? 'Paid via ' + activeOrder.paymentMethod : 'Pay at table'}
                        </span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        Estimated
                      </span>
                      <span className="text-sm font-black font-mono text-[#2B2623]">
                        ~{activeOrder.estimatedMinutes || 20} mins
                      </span>
                    </div>
                  </div>

                  {/* 4-STAGE PROGRESS TRACKER */}
                  <div className="pt-3 pb-1">
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { key: 'new', label: t.statusReceived, icon: '📋' },
                        { key: 'preparing', label: t.statusPreparing, icon: '🔥' },
                        { key: 'ready', label: t.statusReady, icon: '🛎️' },
                        { key: 'served', label: t.statusServed, icon: '🍽️' },
                      ].map((step, idx) => {
                        const statusOrder: OrderStatus[] = ['new', 'preparing', 'ready', 'served'];
                        const currentIdx = statusOrder.indexOf(activeOrder.status);
                        const isPastOrCurrent = currentIdx >= idx;
                        const isCurrent = activeOrder.status === step.key;

                        return (
                          <div key={step.key} className="space-y-1.5 flex flex-col items-center">
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold transition-all ${
                                isCurrent
                                  ? 'bg-[#B4693A] text-white ring-4 ring-[#B4693A]/20 scale-105'
                                  : isPastOrCurrent
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-stone-100 text-stone-400'
                              }`}
                            >
                              {step.icon}
                            </div>
                            <span
                              className={`text-[11px] leading-tight block ${
                                isCurrent
                                  ? 'font-black text-[#2B2623]'
                                  : isPastOrCurrent
                                  ? 'font-bold text-stone-700'
                                  : 'text-stone-400'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* STATUS MESSAGE ACCORDING TO CURRENT STAGE */}
                    <div className="mt-4 p-3 rounded-2xl bg-stone-50 border border-stone-200/70 text-center">
                      <p className="text-xs font-bold text-[#2B2623]">
                        {activeOrder.status === 'new' && t.statusReceivedDesc}
                        {activeOrder.status === 'preparing' && t.statusPreparingDesc}
                        {activeOrder.status === 'ready' && t.statusReadyDineIn}
                        {activeOrder.status === 'served' && t.statusServedDesc}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS (CALL WAITER, ADD MORE DISHES, RECEIPT) */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleCallWaiter}
                    disabled={waiterCalled}
                    className="h-12 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-[#2B2623] text-xs font-black shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                  >
                    <span>🔔</span>
                    <span>{waiterCalled ? 'Waiter Called' : t.callWaiter}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setReceiptOrder(activeOrder);
                    }}
                    className="h-12 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-[#2B2623] text-xs font-black shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                  >
                    <Icons.Receipt />
                    <span>{t.receiptTitle}</span>
                  </button>
                </div>

                {/* ADD MORE DISHES BUTTON */}
                <button
                  type="button"
                  onClick={() => setActiveTab('menu')}
                  className="w-full h-12 rounded-2xl bg-[#FAF6EE] hover:bg-amber-100/50 border border-amber-300 text-[#B4693A] text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span>+</span>
                  <span>{t.addMoreItems}</span>
                </button>

                {/* ORDER ITEMS SUMMARY */}
                <div className="bg-white rounded-3xl p-5 shadow-xs border border-stone-200/80 space-y-3">
                  <h3 className="text-xs font-black text-[#2B2623] uppercase tracking-wider">
                    {lang === 'am' ? 'የትዕዛዝ ዝርዝር' : 'Order Dishes'}
                  </h3>
                  <div className="divide-y divide-stone-100">
                    {activeOrder.items.map((item) => (
                      <div key={item.cartItemId} className="py-2.5 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-[#2B2623]">
                            {item.quantity}x {lang === 'am' && item.nameAm ? item.nameAm : item.name}
                          </span>
                          {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                            <p className="text-[11px] text-stone-500">
                              {item.selectedModifiers.map((m) => m.name).join(', ')}
                            </p>
                          )}
                        </div>
                        <span className="font-mono text-xs font-bold text-stone-700">
                          {(item.unitPriceETB * item.quantity).toLocaleString()} ETB
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-stone-200 flex justify-between text-xs font-black text-[#2B2623]">
                    <span>{t.total}</span>
                    <span className="font-mono text-sm text-[#B4693A]">
                      {activeOrder.totalETB.toLocaleString()} ETB
                    </span>
                  </div>
                </div>

                {/* 4.12 RATING & FEEDBACK (IF SERVED) */}
                {activeOrder.status === 'served' && !ratingSubmitted && (
                  <div className="bg-white rounded-3xl p-5 shadow-md border border-amber-200/60 space-y-3 text-center">
                    <h3 className="text-sm font-black text-[#2B2623]">
                      {lang === 'am' ? 'ምግብዎን እንዴት አገኙት?' : 'How was your Gusteau meal?'}
                    </h3>
                    <p className="text-xs text-stone-500">
                      {lang === 'am' ? 'እባክዎ ደረጃ ይስጡን' : 'Rate your experience to help our chefs'}
                    </p>
                    <div className="flex items-center justify-center gap-2 py-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`text-2xl transition-transform hover:scale-125 cursor-pointer ${
                            (rating || 0) >= star ? 'text-amber-400' : 'text-stone-300'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    {rating && (
                      <div className="space-y-2 pt-2">
                        <input
                          type="text"
                          value={ratingFeedback}
                          onChange={(e) => setRatingFeedback(e.target.value)}
                          placeholder={lang === 'am' ? 'አስተያየት ካለዎት...' : 'Leave a compliment for the chefs...'}
                          className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setRatingSubmitted(true);
                            showToast(lang === 'am' ? 'ስለ አስተያየትዎ እናመሰግናለን!' : 'Thank you for your rating!');
                          }}
                          className="w-full py-2.5 rounded-xl bg-[#2B2623] text-white text-xs font-black cursor-pointer"
                        >
                          {lang === 'am' ? 'አስረክብ' : 'Submit Feedback'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* NO ACTIVE ORDERS EMPTY STATE */
              <div className="py-14 text-center bg-white rounded-3xl border border-dashed border-stone-300 p-8 space-y-3">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-2xl">
                  📋
                </div>
                <h3 className="text-base font-black text-[#2B2623]">
                  {lang === 'am' ? 'ምንም ንቁ ትዕዛዝ የለም' : 'No active orders'}
                </h3>
                <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
                  {lang === 'am'
                    ? 'ትዕዛዝ ሲሰጡ የዝግጅት ሂደቱን እዚህ መከታተል ይችላሉ።'
                    : 'When you place an order, live preparation and waiter status will appear here.'}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('menu')}
                  className="mt-2 px-6 py-3 rounded-2xl bg-[#2B2623] hover:bg-[#3F3733] text-white text-xs font-black shadow-md cursor-pointer transition-all"
                >
                  {t.browseMenu}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* FLOATING CART SUMMARY PILL (WHEN CART HAS ITEMS & USER IS ON MENU/SEARCH) */}
      {(activeTab === 'menu' || activeTab === 'search') && (
        <FloatingCartBar
          itemCount={cartItemCount}
          totalETB={cartTotalETB}
          onOpenCart={() => {
            setIsCheckingOut(false);
            setActiveTab('cart');
          }}
          lang={lang}
        />
      )}

      {/* 4.2 BOTTOM NAVIGATION (THUMB ZONE - 4 TABS ONLY) */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setIsCheckingOut(false);
          setActiveTab(tab);
        }}
        cartCount={cartItemCount}
        hasActiveOrder={Boolean(activeOrder && activeOrder.status !== 'served')}
        lang={lang}
      />

      {/* DISH DETAIL CUSTOMIZATION BOTTOM SHEET */}
      <DishDetailSheet
        item={customizingItem}
        onClose={() => setCustomizingItem(null)}
        onAddToCart={handleAddToCart}
        lang={lang}
      />

      {/* TELEBIRR MOBILE MONEY PAYMENT MODAL */}
      {showTelebirr && pendingTelebirrOrder && (
        <TelebirrModal
          amountETB={pendingTelebirrOrder.totalETB}
          phone={customerPhone || '0911223344'}
          orderNumber={pendingTelebirrOrder.orderNumber}
          onSuccess={() => {
            setShowTelebirr(false);
            completeOrderPlacement(pendingTelebirrOrder);
            setPendingTelebirrOrder(null);
          }}
          onCancel={() => {
            setShowTelebirr(false);
            setPendingTelebirrOrder(null);
          }}
          lang={lang}
        />
      )}

      {/* THERMAL RECEIPT MODAL */}
      <CustomerReceiptModal
        order={receiptOrder}
        onClose={() => setReceiptOrder(null)}
        lang={lang}
      />
    </div>
  );
}

export default function CustomerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#2B2623] animate-pulse mx-auto" />
            <p className="text-xs font-bold text-[#2B2623]">Loading Table Ordering...</p>
          </div>
        </div>
      }
    >
      <CustomerDineInView />
    </Suspense>
  );
}
