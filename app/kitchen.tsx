'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  RoleMode,
  OrderTicket,
  MenuItem,
  PaymentMethod,
} from '../types/pos';
import { sounds } from '../lib/sound';
import { MENU_DATABASE, INITIAL_ORDERS, INITIAL_TABLES } from '../data/mock-data';
import { Icons } from '../components/ui/Icons';
import { OrderCard } from '../components/kds/OrderCard';
import { TableMapView } from '../components/pos/TableMapView';
import { FoodiesMenuSection } from '../components/pos/FoodiesMenuSection';
import { OrderDetailPanel } from '../components/pos/OrderDetailPanel';
import { TopBar } from '../components/common/TopBar';
import { LeftSidebar } from '../components/common/LeftSidebar';

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
  const [tables] = useState(INITIAL_TABLES);
  const [selectedTableId, setSelectedTableId] = useState<string>('t16');

  // Menu Category State
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string>('Pizza');

  // Connection Simulation (SignalR dot)
  const [isConnected, setIsConnected] = useState<boolean>(true);

  // Audio system state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tablet modal drawer visibility
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  // Sync sound manager enabled state
  useEffect(() => {
    sounds.enabled = soundEnabled;
  }, [soundEnabled]);

  // Modal Escape key accessibility listener (WCAG 2.2 AA)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileDetailOpen) {
        setIsMobileDetailOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileDetailOpen]);

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
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNumber = o.orderNumber.toLowerCase().includes(q);
        const matchTable = o.tableNumber?.toLowerCase().includes(q) ?? false;
        if (!matchNumber && !matchTable) return false;
      }

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
          imageUrl:
            'https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?auto=format&fit=crop&w=400&q=80',
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
      {/* OFFLINE BANNER (Section 6.1) */}
      {!isConnected && (
        <div
          role="status"
          aria-live="polite"
          className="bg-red-600 text-white px-4 py-2 text-center text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" aria-hidden="true" />
          <span>Offline &bull; Reconnecting to Gusteau&apos;s SignalR Hub... Auto-retry running silently</span>
          <button
            type="button"
            onClick={() => setIsConnected(true)}
            className="ml-3 underline font-bold hover:text-stone-100 cursor-pointer"
          >
            Force Reconnect
          </button>
        </div>
      )}

      {/* ACCESSIBLE TOP BAR */}
      <TopBar
        role={role}
        onSetRole={setRole}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isConnected={isConnected}
        onToggleConnection={() => setIsConnected(!isConnected)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        newCount={counts.new}
        onSimulateOrder={handleSimulateNewOrder}
      />

      {/* MAIN LAYOUT WRAPPER (Responsive 3-Column / Tablet Ergonomics) */}
      <div className="flex-1 max-w-[1680px] w-full mx-auto p-3 sm:p-5 flex gap-4 overflow-hidden">
        {/* LEFT SIDEBAR NAVIGATION */}
        <LeftSidebar
          role={role}
          waiterActiveTab={waiterActiveTab}
          onSelectTab={(tab) => {
            if (role === 'waiter') setWaiterActiveTab(tab);
          }}
          onShowToast={showToast}
        />

        {/* CENTER CONTENT REGION - MAIN LANDMARK (WCAG 2.2 AA) */}
        <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col gap-4 min-w-0 overflow-y-auto focus:outline-none">
          {/* TOP FILTER CHIPS BAR */}
          <div className="flex items-center justify-between flex-wrap gap-3 bg-white/70 backdrop-blur-sm p-3 rounded-2xl border border-stone-200/70">
            <div
              className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1"
              role="group"
              aria-label="Order filters"
            >
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mr-1">
                Filter:
              </span>
              <button
                type="button"
                onClick={() => setOrderFilter('all')}
                aria-pressed={orderFilter === 'all'}
                aria-label={`Show all ${counts.all} orders`}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B2623] ${
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
                type="button"
                onClick={() => setOrderFilter('dine-in')}
                aria-pressed={orderFilter === 'dine-in'}
                aria-label={`Show ${counts.dineIn} Dine In orders`}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B2623] ${
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
                type="button"
                onClick={() => setOrderFilter('takeaway')}
                aria-pressed={orderFilter === 'takeaway'}
                aria-label={`Show ${counts.takeaway} Take Away orders`}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B2623] ${
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
                type="button"
                onClick={() => setOrderFilter('ready')}
                aria-pressed={orderFilter === 'ready'}
                aria-label={`Show ${counts.ready} Ready to Serve orders`}
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B2623] ${
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

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSimulateNewOrder}
                aria-label="Simulate incoming real-time ticket"
                className="px-3 py-1.5 rounded-full bg-[#B4693A] hover:bg-[#9c572c] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#B4693A]/50"
              >
                <Icons.Plus />
                <span>Simulate Order</span>
              </button>

              {/* Tablet detail drawer toggle button */}
              <button
                type="button"
                onClick={() => setIsMobileDetailOpen(true)}
                aria-label={`View selected ticket details for order ${selectedOrder?.orderNumber}`}
                className="lg:hidden px-3 py-1.5 rounded-full bg-[#2B2623] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-400"
              >
                <span>View Ticket ({selectedOrder?.orderNumber})</span>
              </button>
            </div>
          </div>

          {/* CHEF MODE: 3-COLUMN KITCHEN KANBAN */}
          {role === 'chef' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 flex-1">
              {/* COLUMN 1: NEW / PENDING */}
              <section
                aria-label="New and pending tickets"
                className="bg-stone-100/70 rounded-3xl p-4 flex flex-col gap-3 border border-stone-200/80"
              >
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" aria-hidden="true" />
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
              </section>

              {/* COLUMN 2: PREPARING (AMBER) */}
              <section
                aria-label="Actively cooking tickets"
                className="bg-stone-100/70 rounded-3xl p-4 flex flex-col gap-3 border border-stone-200/80"
              >
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" aria-hidden="true" />
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
              </section>

              {/* COLUMN 3: READY FOR PICKUP (GREEN) */}
              <section
                aria-label="Tickets ready for pickup or serving"
                className="bg-stone-100/70 rounded-3xl p-4 flex flex-col gap-3 border border-stone-200/80"
              >
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" aria-hidden="true" />
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
              </section>
            </div>
          ) : (
            /* WAITER MODE: DUAL VIEW (Order Line + Foodies Menu OR Table Map) */
            <div className="space-y-5">
              {/* UPPER SECTION: ORDER LINE HORIZONTAL CAROUSEL */}
              <section
                aria-label="Order line queue"
                className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/80 shadow-sm"
              >
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
                      type="button"
                      onClick={() => setOrderFilter('all')}
                      aria-label="View all orders in queue"
                      className="w-8 h-8 rounded-full border border-stone-200 hover:bg-stone-50 flex items-center justify-center text-stone-600 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                    >
                      <Icons.ChevronLeft />
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderFilter('ready')}
                      aria-label="View ready orders in queue"
                      className="w-8 h-8 rounded-full border border-stone-200 hover:bg-stone-50 flex items-center justify-center text-stone-600 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                    >
                      <Icons.ChevronRight />
                    </button>
                  </div>
                </div>

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
                      type="button"
                      onClick={() => setWaiterActiveTab('orders')}
                      aria-pressed={waiterActiveTab !== 'tables'}
                      className={`text-lg sm:text-xl font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] ${
                        waiterActiveTab !== 'tables'
                          ? 'text-[#2B2623] underline decoration-[#B4693A] decoration-4 underline-offset-8'
                          : 'text-stone-400 hover:text-stone-600'
                      }`}
                    >
                      Foodies Menu (POS)
                    </button>
                    <span className="text-stone-300" aria-hidden="true">|</span>
                    <button
                      type="button"
                      onClick={() => setWaiterActiveTab('tables')}
                      aria-pressed={waiterActiveTab === 'tables'}
                      className={`text-lg sm:text-xl font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] ${
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

        {/* RIGHT SIDEBAR: ORDER DETAIL & CHECKOUT PANEL (Desktop View) */}
        <aside
          aria-label="Order Inspector and Bill Details"
          className="hidden lg:block w-[360px] xl:w-[400px] flex-shrink-0"
        >
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

      {/* TABLET / MOBILE BOTTOM SHEET MODAL (WCAG 2.2 AA Focus & Escape Trap) */}
      {isMobileDetailOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Order Details"
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

      {/* GLOBAL TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#2B2623] text-white px-5 py-3 rounded-full text-sm font-semibold shadow-xl flex items-center gap-3 border border-stone-700 animate-in fade-in slide-in-from-bottom-2"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#B4693A] animate-ping" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
