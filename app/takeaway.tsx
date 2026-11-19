'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  CustomerMenuItem,
  CartItem,
  CustomerOrder,
  Language,
  DietaryFilter,
} from '../types/customer';
import { OrderTicket, OrderStatus } from '../types/pos';
import { CUSTOMER_MENU, CUSTOMER_TRANSLATIONS } from '../data/customer-menu';
import { sounds } from '../lib/sound';
import { Icons } from '../components/ui/Icons';
import { CustomerHeader } from '../components/customer/CustomerHeader';
import { BottomNav, CustomerTab } from '../components/customer/BottomNav';
import { FloatingCartBar } from '../components/customer/FloatingCartBar';
import { DishDetailSheet } from '../components/customer/DishDetailSheet';
import { TelebirrModal } from '../components/customer/TelebirrModal';
import { CustomerReceiptModal } from '../components/customer/CustomerReceiptModal';

export function TakeawayView() {
  const router = useRouter();

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
    'BBQ Chicken',
    'Margherita',
    'Truffle',
    'Tsom',
  ]);

  // Cart & items
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderNotes, setOrderNotes] = useState('');

  // Modals & Sheets
  const [customizingItem, setCustomizingItem] = useState<CustomerMenuItem | null>(null);
  const [showTelebirr, setShowTelebirr] = useState(false);
  const [pendingTelebirrOrder, setPendingTelebirrOrder] = useState<CustomerOrder | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<CustomerOrder | null>(null);

  // Takeaway Checkout Specifics (Mandatory Prepayment & Pickup Details)
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [pickupSlot, setPickupSlot] = useState<string>('asap');
  const [paymentChoice, setPaymentChoice] = useState<'telebirr' | 'card'>('telebirr');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Orders & Live Tracking
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  // UI feedback & toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['m2', 'm6']));

  // Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Initial Load: Language, Cart, Orders from LocalStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedLang = localStorage.getItem('gusteaus_lang') as Language;
      if (savedLang === 'en' || savedLang === 'am') setLang(savedLang);

      const savedCart = localStorage.getItem('gusteaus_cart_takeaway');
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedOrders = localStorage.getItem('gusteaus_takeaway_orders');
      if (savedOrders) {
        const parsed: CustomerOrder[] = JSON.parse(savedOrders);
        setOrders(parsed);
        const latest = parsed.find((o) => o.type === 'takeaway' && o.status !== 'served');
        if (latest) {
          setActiveOrderId(latest.id);
        }
      }

      const savedFavs = localStorage.getItem('gusteaus_favs');
      if (savedFavs) setFavorites(new Set(JSON.parse(savedFavs)));
    } catch {
      // Ignore local storage errors
    }
  }, []);

  // Persist Cart
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('gusteaus_cart_takeaway', JSON.stringify(cart));
    } catch {}
  }, [cart]);

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

  // Simulated live tracking progress for takeaway order
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
              showToast(t.statusReadyTakeaway);
              return { ...ord, status: 'ready' };
            }
          }
          return ord;
        })
      );
    }, 15000);

    return () => clearInterval(interval);
  }, [activeOrderId, t.statusReadyTakeaway]);

  // Categories & Dietaries
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
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (selectedDietary !== 'all') {
        if (!item.dietary.includes(selectedDietary)) return false;
      }
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

  // Popular
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

  // Packaging fee for takeaway
  const packagingFeeETB = cart.length > 0 ? 50 : 0;
  const cartTotalETB = cartSubtotalETB + cartTaxETB + packagingFeeETB;

  // Add item to cart
  const handleAddToCart = (payload: {
    item: CustomerMenuItem;
    quantity: number;
    selectedModifiers: CustomerMenuItem['availableModifiers'];
    specialRequest: string;
    unitPriceETB: number;
  }) => {
    const newCartItem: CartItem = {
      cartItemId: `takeaway-cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
      cartItemId: `takeaway-cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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

  // Pickup slot label helper
  const getPickupTimeLabel = (slot: string) => {
    switch (slot) {
      case 'asap':
        return t.pickupAsap;
      case 'slot1':
        return t.pickupSlot1;
      case 'slot2':
        return t.pickupSlot2;
      case 'slot3':
        return t.pickupSlot3;
      default:
        return t.pickupAsap;
    }
  };

  // Submit Takeaway Order Process (Enforces Mandatory Prepayment)
  const handleInitiateTakeawayOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (cart.length === 0) return;

    if (!customerName.trim()) {
      setFormError(
        lang === 'am'
          ? 'እባክዎ የመቀበያ ስምዎን ያስገቡ (በካውንተሩ ለመጥራት ያስፈልጋል)'
          : 'Please enter your name for counter pickup call-out.'
      );
      return;
    }

    if (!customerPhone.trim() || customerPhone.trim().length < 9) {
      setFormError(
        lang === 'am'
          ? 'እባክዎ ትክክለኛ ስልክ ቁጥር ያስገቡ (ለቴሌብር እና መልዕክት አስፈላጊ ነው)'
          : 'Please enter a valid phone number for Telebirr / SMS pickup notification.'
      );
      return;
    }

    setIsSubmittingOrder(true);

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const orderNumber = `#TAK-${randomSuffix}`;
    const orderId = `takeaway-${Date.now()}`;

    const newOrder: CustomerOrder = {
      id: orderId,
      orderNumber,
      type: 'takeaway',
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      pickupTime: getPickupTimeLabel(pickupSlot),
      items: [...cart],
      subtotalETB: cartSubtotalETB,
      taxETB: cartTaxETB,
      serviceChargeETB: packagingFeeETB,
      totalETB: cartTotalETB,
      paymentMethod: paymentChoice,
      paymentStatus: 'paid', // Mandatory Prepaid!
      placedAt: Date.now(),
      status: 'new',
      notes: orderNotes.trim() || undefined,
      estimatedMinutes: pickupSlot === 'asap' ? 25 : 45,
    };

    if (paymentChoice === 'telebirr') {
      setPendingTelebirrOrder(newOrder);
      setShowTelebirr(true);
      setIsSubmittingOrder(false);
      return;
    }

    // If card payment: simulate 1.5s gateway processing
    setTimeout(() => {
      completeTakeawayOrderPlacement(newOrder);
    }, 1500);
  };

  const completeTakeawayOrderPlacement = (finalOrder: CustomerOrder) => {
    sounds.playNewOrder();

    setOrders((prev) => {
      const updated = [finalOrder, ...prev];
      try {
        localStorage.setItem('gusteaus_takeaway_orders', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Clear cart
    setCart([]);
    try {
      localStorage.removeItem('gusteaus_cart_takeaway');
    } catch {}

    setActiveOrderId(finalOrder.id);
    setIsCheckingOut(false);
    setIsSubmittingOrder(false);
    setActiveTab('orders');
    showToast(t.orderConfirmed);
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#2B2623] flex flex-col font-sans selection:bg-[#B4693A] selection:text-white pb-24">
      {/* 1. STICKY BRAND HEADER */}
      <CustomerHeader
        orderType="takeaway"
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
            {/* 4.1 TAKEAWAY WELCOME BANNER */}
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#2B2623] via-[#372E2A] to-[#453630] text-white p-5 sm:p-6 shadow-md border border-stone-800">
              <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-xs font-bold border border-purple-400/30">
                    <span>🥡</span>
                    <span>{t.takeaway}</span>
                    <span className="text-purple-300/80 font-normal">· Pre-order & Pick up</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#FAF6EE]">
                    {lang === 'am' ? 'የመውሰጃ ምግብ ማዘዣ' : "Takeaway & Pickup"}
                  </h2>
                  <p className="text-xs text-stone-300 max-w-md leading-relaxed">
                    {lang === 'am'
                      ? 'የሚወዱትን ምግብ ይዘዙ፣ በቴሌብር ይክፈሉ፣ ትኩስ ሲሆን ከካውንተር ይውሰዱ።'
                      : 'Pre-order your Parisian favorites with Telebirr prepayment. Collect hot and freshly packed at our pickup counter.'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-200 flex-shrink-0 shadow-inner">
                  <Icons.ShoppingBag />
                </div>
              </div>
            </div>

            {/* MANDATORY PREPAYMENT BADGE */}
            <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-3 flex items-center gap-3">
              <span className="text-base">⚡</span>
              <p className="text-xs font-bold text-blue-900 leading-snug">
                {t.prepayNotice}
              </p>
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

            {/* POPULAR / CHEF'S PICKS STRIP */}
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
        {/* TAB 3: CART & MANDATORY PREPAYMENT CHECKOUT                        */}
        {/* =================================================================== */}
        {activeTab === 'cart' && (
          <div className="space-y-4">
            {!isCheckingOut ? (
              <div className="space-y-4">
                {/* CART HEADER & TAKEAWAY CHIP */}
                <div className="bg-white rounded-3xl p-5 shadow-xs border border-stone-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-800 flex items-center justify-center font-bold">
                      <Icons.ShoppingBag />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-[#2B2623]">{t.cartTitle}</h2>
                      <p className="text-xs text-stone-500 font-medium">
                        {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} ·{' '}
                        <span className="font-bold text-purple-700">🥡 {t.takeaway}</span>
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

                            {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.selectedModifiers.map((mod) => (
                                  <span
                                    key={mod.id}
                                    className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-emerald-50 text-emerald-800"
                                  >
                                    {mod.type === 'removal' ? `No ${mod.name}` : mod.name}
                                  </span>
                                ))}
                              </div>
                            )}

                            {item.specialRequest && (
                              <p className="text-[11px] text-[#B4693A] italic mt-1 font-medium bg-amber-50/60 px-2 py-0.5 rounded border border-amber-200/40">
                                📝 &quot;{item.specialRequest}&quot;
                              </p>
                            )}

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
                            ? 'ምሳሌ፦ እባክዎ ተጨማሪ ሹካ እና ናፕኪን አድርጉልን...'
                            : 'e.g. Please pack sauces separately, extra napkins...'
                        }
                        className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-[#2B2623] focus:outline-none focus:ring-2 focus:ring-[#B4693A]"
                      />
                    </div>

                    {/* PRICE BREAKDOWN WITH PACKAGING FEE */}
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
                      <div className="flex justify-between text-xs text-stone-600">
                        <span>{t.serviceFee}</span>
                        <span className="font-mono font-bold text-[#2B2623]">
                          {packagingFeeETB.toLocaleString()} ETB
                        </span>
                      </div>
                      <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-black text-[#2B2623]">
                        <span>{t.total}</span>
                        <span className="font-mono text-base text-[#B4693A]">
                          {cartTotalETB.toLocaleString()} ETB
                        </span>
                      </div>
                    </div>

                    {/* PROCEED TO CHECKOUT BUTTON */}
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
              <form onSubmit={handleInitiateTakeawayOrder} className="space-y-4">
                <button
                  type="button"
                  onClick={() => setIsCheckingOut(false)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-[#2B2623] cursor-pointer"
                >
                  <Icons.ArrowBack />
                  <span>{lang === 'am' ? 'ወደ ቅርጫት ተመለስ' : 'Back to Cart'}</span>
                </button>

                {formError && (
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-bold text-red-700">
                    ⚠️ {formError}
                  </div>
                )}

                {/* 1. MANDATORY CONTACT DETAILS FOR TAKEAWAY */}
                <div className="bg-white rounded-3xl p-5 shadow-xs border border-stone-200/80 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-[#2B2623] uppercase tracking-wider">
                      {lang === 'am' ? 'የመውሰጃ ደንበኛ መረጃ' : 'Pickup Customer Details'}
                    </h3>
                    <span className="text-[11px] font-bold text-red-500">* Required</span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      {t.customerName} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Selamawit Desta"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-[#2B2623] focus:outline-none focus:ring-2 focus:ring-[#B4693A]"
                    />
                    <p className="text-[10px] text-stone-400 mt-1">
                      Called out at the pickup counter when ready.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      {t.customerPhone} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="0911223344..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-[#2B2623] focus:outline-none focus:ring-2 focus:ring-[#B4693A]"
                    />
                    <p className="text-[10px] text-stone-400 mt-1">
                      Used for Telebirr push approval & SMS pickup notification.
                    </p>
                  </div>
                </div>

                {/* 2. PICKUP TIME SELECTION */}
                <div className="bg-white rounded-3xl p-5 shadow-xs border border-stone-200/80 space-y-3">
                  <h3 className="text-xs font-black text-[#2B2623] uppercase tracking-wider">
                    {t.pickupTimeTitle}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { id: 'asap', label: t.pickupAsap, desc: 'Hot & ready fast' },
                      { id: 'slot1', label: t.pickupSlot1, desc: 'Estimated slot' },
                      { id: 'slot2', label: t.pickupSlot2, desc: 'Estimated slot' },
                      { id: 'slot3', label: t.pickupSlot3, desc: 'Evening pickup' },
                    ].map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setPickupSlot(slot.id)}
                        className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                          pickupSlot === slot.id
                            ? 'bg-[#2B2623] text-white border-[#2B2623] shadow-xs'
                            : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                        }`}
                      >
                        <span className="text-xs font-extrabold block">{slot.label}</span>
                        <span
                          className={`text-[10px] font-medium block mt-0.5 ${
                            pickupSlot === slot.id ? 'text-amber-200' : 'text-stone-400'
                          }`}
                        >
                          {slot.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. MANDATORY PREPAYMENT METHODS */}
                <div className="bg-white rounded-3xl p-5 shadow-xs border border-stone-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-[#2B2623] uppercase tracking-wider">
                      {t.paymentMethodTitle} (Mandatory Prepayment)
                    </h3>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      🔒 Prepay Only
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {/* TELEBIRR TILE */}
                    <label
                      onClick={() => setPaymentChoice('telebirr')}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        paymentChoice === 'telebirr'
                          ? 'border-[#0072BC] bg-[#0072BC]/5 ring-2 ring-[#0072BC]'
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
                            Instant mobile USSD push & PIN authorization
                          </span>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="takeaway_payment"
                        checked={paymentChoice === 'telebirr'}
                        onChange={() => setPaymentChoice('telebirr')}
                        className="text-[#0072BC] focus:ring-[#0072BC]"
                      />
                    </label>

                    {/* CARD TILE */}
                    <label
                      onClick={() => setPaymentChoice('card')}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        paymentChoice === 'card'
                          ? 'border-[#B4693A] bg-[#B4693A]/5 ring-2 ring-[#B4693A]'
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
                            Visa / Mastercard / EthSwitch debit
                          </span>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="takeaway_payment"
                        checked={paymentChoice === 'card'}
                        onChange={() => setPaymentChoice('card')}
                        className="text-[#B4693A] focus:ring-[#B4693A]"
                      />
                    </label>
                  </div>

                  <p className="text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-200/60 leading-relaxed">
                    💡 {t.prepayNotice}
                  </p>
                </div>

                {/* STICKY SUBMIT & PREPAY BUTTON */}
                <button
                  type="submit"
                  disabled={isSubmittingOrder}
                  className="w-full h-14 rounded-2xl bg-[#2B2623] hover:bg-[#3C3531] disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer active:scale-[0.99]"
                >
                  {isSubmittingOrder ? (
                    <span>Processing payment...</span>
                  ) : (
                    <>
                      <span>{paymentChoice === 'telebirr' ? 'Prepay via Telebirr' : 'Prepay with Card'}:</span>
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
            {activeOrder ? (
              <div className="space-y-4">
                {/* TAKEAWAY ORDER STATUS CARD */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-wider text-purple-700">
                        Takeaway Pickup Tracker
                      </span>
                    </div>
                    <span className="font-mono text-xs font-black text-stone-500">
                      {activeOrder.orderNumber}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-[#2B2623] tracking-tight font-mono">
                        {activeOrder.orderNumber}
                      </h2>
                      <p className="text-xs text-stone-500 font-medium">
                        Pickup for <span className="font-bold text-[#2B2623]">{activeOrder.customerName}</span> ·{' '}
                        <span className="text-emerald-700 font-extrabold">Paid (Prepaid)</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        Pickup Window
                      </span>
                      <span className="text-xs font-black text-[#B4693A] block">
                        {activeOrder.pickupTime}
                      </span>
                    </div>
                  </div>

                  {/* 4-STAGE PROGRESS TRACKER */}
                  <div className="pt-3 pb-1">
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { key: 'new', label: t.statusReceived, icon: '📋' },
                        { key: 'preparing', label: t.statusPreparing, icon: '🔥' },
                        { key: 'ready', label: t.statusReady, icon: '🥡' },
                        { key: 'served', label: 'Collected', icon: '✅' },
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
                        {activeOrder.status === 'ready' && t.statusReadyTakeaway}
                        {activeOrder.status === 'served' && t.statusServedDesc}
                      </p>
                    </div>

                    {/* READY BANNER FOR COUNTER PICKUP */}
                    {activeOrder.status === 'ready' && (
                      <div className="mt-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-center space-y-1">
                        <span className="text-xl">🥡</span>
                        <h4 className="text-sm font-black text-emerald-900">
                          {lang === 'am' ? 'ምግብዎ በካውንተሩ ዝግጁ ሆኗል!' : 'Your Takeaway is Ready!'}
                        </h4>
                        <p className="text-xs text-emerald-800">
                          Please show order <strong className="font-mono">{activeOrder.orderNumber}</strong> at the Gusteau counter.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ACTION BUTTON (RECEIPT) */}
                <button
                  type="button"
                  onClick={() => setReceiptOrder(activeOrder)}
                  className="w-full h-12 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-[#2B2623] text-xs font-black shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Icons.Receipt />
                  <span>{t.receiptTitle}</span>
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
              </div>
            ) : (
              <div className="py-14 text-center bg-white rounded-3xl border border-dashed border-stone-300 p-8 space-y-3">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-2xl">
                  🥡
                </div>
                <h3 className="text-base font-black text-[#2B2623]">
                  {lang === 'am' ? 'ምንም ንቁ የመውሰጃ ትዕዛዝ የለም' : 'No active takeaway orders'}
                </h3>
                <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
                  {lang === 'am'
                    ? 'ትዕዛዝ ሲሰጡ የዝግጅት ሂደቱን እዚህ መከታተል ይችላሉ።'
                    : 'When you place an order, live preparation and pickup readiness will appear here.'}
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

      {/* FLOATING CART BAR */}
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

      {/* 4.2 BOTTOM NAVIGATION */}
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

      {/* MANDATORY TELEBIRR PAYMENT MODAL */}
      {showTelebirr && pendingTelebirrOrder && (
        <TelebirrModal
          amountETB={pendingTelebirrOrder.totalETB}
          phone={customerPhone || '0911223344'}
          orderNumber={pendingTelebirrOrder.orderNumber}
          onSuccess={() => {
            setShowTelebirr(false);
            completeTakeawayOrderPlacement(pendingTelebirrOrder);
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

export default function TakeawayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#2B2623] animate-pulse mx-auto" />
            <p className="text-xs font-bold text-[#2B2623]">Loading Takeaway Ordering...</p>
          </div>
        </div>
      }
    >
      <TakeawayView />
    </Suspense>
  );
}
