'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  RoleMode,
  OrderTicket,
  MenuItem,
  Modifier,
  PaymentMethod,
  TableInfo,
} from '../types/pos';
import { sounds } from '../lib/sound';
import { MENU_DATABASE, INITIAL_ORDERS, INITIAL_TABLES } from '../data/mock-data';
import { Icons } from '../components/ui/Icons';
import { OrderCard } from '../components/kds/OrderCard';
import { TableMapView } from '../components/pos/TableMapView';
import { FoodiesMenuSection } from '../components/pos/FoodiesMenuSection';
import { OrderDetailPanel } from '../components/pos/OrderDetailPanel';
import { ModifierSheetModal } from '../components/pos/ModifierSheetModal';
import { ReceiptModal } from '../components/pos/ReceiptModal';
import { TopBar } from '../components/common/TopBar';
import { LeftSidebar } from '../components/common/LeftSidebar';

export default function KitchenDashboard() {
  // Current active mode (Chef vs Waiter)
  const [role, setRole] = useState<RoleMode>('waiter');

  // Navigation tab for Waitstaff mode: starts on 'tables' (Step 1: Choose Table)
  const [waiterActiveTab, setWaiterActiveTab] = useState<'orders' | 'menu' | 'tables'>('tables');

  // Real-time Orders State
  const [orders, setOrders] = useState<OrderTicket[]>(INITIAL_ORDERS);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('ord-3');

  // Filter chips in Order Line
  const [orderFilter, setOrderFilter] = useState<'all' | 'dine-in' | 'takeaway' | 'ready'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic Tables State (synced with Orders lifecycle)
  const [tables, setTables] = useState<TableInfo[]>(INITIAL_TABLES);
  const [selectedTableId, setSelectedTableId] = useState<string>('t9');

  // Menu Category State
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string>('Pizza');

  // Interactive Modifier Sheet state
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);

  // Printable Receipt Modal state
  const [receiptModalState, setReceiptModalState] = useState<{
    order: OrderTicket | null;
    method: PaymentMethod;
  }>({ order: null, method: 'cash' });

  // Connection Simulation (SignalR dot)
  const [isConnected, setIsConnected] = useState<boolean>(true);

  // Audio system state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tablet modal drawer visibility
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  useEffect(() => {
    sounds.enabled = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileDetailOpen) {
        setIsMobileDetailOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileDetailOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const selectedOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  const submittedOrders = useMemo(() => {
    return orders.filter((o) => o.status !== 'draft');
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return submittedOrders.filter((o) => {
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
  }, [submittedOrders, searchQuery, orderFilter]);

  const waiterSortedOrders = useMemo(() => {
    const priority: Record<string, number> = {
      ready: 0,
      served: 1,
      preparing: 2,
      new: 3,
    };
    return [...filteredOrders].sort(
      (a, b) => (priority[a.status] ?? 4) - (priority[b.status] ?? 4)
    );
  }, [filteredOrders]);

  const counts = useMemo(() => {
    return {
      all: submittedOrders.length,
      dineIn: submittedOrders.filter((o) => o.type === 'dine-in').length,
      takeaway: submittedOrders.filter((o) => o.type === 'takeaway').length,
      ready: submittedOrders.filter((o) => o.status === 'ready').length,
      preparing: submittedOrders.filter((o) => o.status === 'preparing').length,
      new: submittedOrders.filter((o) => o.status === 'new').length,
    };
  }, [submittedOrders]);

  const updateTableForOrder = (
    order: OrderTicket,
    newStatus: TableInfo['status'],
    clearOrderLink = false
  ) => {
    setTables((prev) =>
      prev.map((t) => {
        const matches =
          (order.tableId && t.id === order.tableId) ||
          (order.tableNumber && t.label.toLowerCase() === order.tableNumber.toLowerCase()) ||
          t.currentOrderId === order.id;
        if (!matches) return t;
        return {
          ...t,
          status: newStatus,
          currentOrderId: clearOrderLink ? undefined : order.id,
        };
      })
    );
  };

  // STEP 1 (Waitstaff): Select a Table from Floor Plan
  const handleSelectTable = (tableId: string) => {
    setSelectedTableId(tableId);
    const tableObj = tables.find((t) => t.id === tableId);
    if (!tableObj) return;

    const existingOrder = orders.find(
      (o) =>
        o.id === tableObj.currentOrderId ||
        (o.tableNumber?.toLowerCase() === tableObj.label.toLowerCase() &&
          o.paymentStatus !== 'paid')
    );

    if (existingOrder) {
      setSelectedOrderId(existingOrder.id);
      if (existingOrder.status === 'draft') {
        setWaiterActiveTab('menu');
        showToast(`Back to ${tableObj.label}'s draft ticket.`);
      } else if (existingOrder.status === 'ready' || existingOrder.status === 'served') {
        setIsMobileDetailOpen(true);
        showToast(`${tableObj.label} is ready to settle and print.`);
      } else {
        setIsMobileDetailOpen(true);
        showToast(`Checking in on ${tableObj.label} (${existingOrder.orderNumber}).`);
      }
      return;
    }

    const newOrderId = `ord-draft-${Date.now()}`;
    const randomNum = `#F0${Math.floor(Math.random() * 899) + 100}`;
    const newDraft: OrderTicket = {
      id: newOrderId,
      orderNumber: randomNum,
      type: 'dine-in',
      tableId: tableObj.id,
      tableNumber: tableObj.label,
      placedAt: Date.now(),
      status: 'draft',
      items: [],
      paymentStatus: 'pending',
      waiterName: 'Sakib Mahamud',
    };

    setOrders((prev) => [newDraft, ...prev]);
    setSelectedOrderId(newOrderId);
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId ? { ...t, status: 'seated', currentOrderId: newOrderId } : t
      )
    );
    setWaiterActiveTab('menu');
    showToast(`${tableObj.label} opened — tap any dish to customize.`);
  };

  const handleStartTakeawayOrder = () => {
    const newOrderId = `ord-ta-${Date.now()}`;
    const randomNum = `#T0${Math.floor(Math.random() * 899) + 100}`;
    const newDraft: OrderTicket = {
      id: newOrderId,
      orderNumber: randomNum,
      type: 'takeaway',
      placedAt: Date.now(),
      status: 'draft',
      items: [],
      paymentStatus: 'pending',
      waiterName: 'Sakib Mahamud',
    };

    setOrders((prev) => [newDraft, ...prev]);
    setSelectedOrderId(newOrderId);
    setWaiterActiveTab('menu');
    showToast(`Counter takeaway ${randomNum} opened — pick dishes below.`);
  };

  // STEP 2 (Waitstaff): Tap Dish on Menu -> Open Customization Drawer
  const handleSelectMenuDish = (menuItem: MenuItem) => {
    if (
      !selectedOrder ||
      selectedOrder.paymentStatus === 'paid' ||
      selectedOrder.status === 'ready' ||
      selectedOrder.status === 'served'
    ) {
      const currentTable = tables.find((t) => t.id === selectedTableId);
      if (!currentTable || currentTable.status !== 'empty') {
        setWaiterActiveTab('tables');
        showToast('Pick a table on the floor plan first.');
        return;
      }
      handleSelectTable(currentTable.id);
    }
    setCustomizingItem(menuItem);
  };

  const handleConfirmCustomizedItem = ({
    menuItem,
    quantity,
    selectedModifiers,
    specialRequest,
    unitPrice,
  }: {
    menuItem: MenuItem;
    quantity: number;
    selectedModifiers: Modifier[];
    specialRequest: string;
    unitPrice: number;
  }) => {
    if (!selectedOrder) {
      setCustomizingItem(null);
      return;
    }

    const newItemId = `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== selectedOrder.id) return ord;
        return {
          ...ord,
          items: [
            ...ord.items,
            {
              id: newItemId,
              name: menuItem.name,
              quantity,
              price: unitPrice,
              imageUrl: menuItem.imageUrl,
              category: menuItem.category,
              modifiers: selectedModifiers.length > 0 ? selectedModifiers : undefined,
              specialRequest: specialRequest || undefined,
            },
          ],
        };
      })
    );

    setCustomizingItem(null);
    showToast(
      `Added ${quantity}× ${menuItem.name} to ${
        selectedOrder.tableNumber || selectedOrder.orderNumber
      }.`
    );
  };

  // STEP 3 (Waitstaff): Send Draft Order to Kitchen
  const handleSubmitDraftOrder = (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target || target.items.length === 0) return;

    const updatedOrder: OrderTicket = {
      ...target,
      status: 'new',
      placedAt: Date.now(),
      isNewArrival: true,
    };

    setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
    updateTableForOrder(updatedOrder, 'waiting');
    sounds.playNewOrder();
    showToast(
      `Ticket ${updatedOrder.orderNumber} (${
        updatedOrder.tableNumber || 'Takeaway'
      }) fired to the kitchen.`
    );
  };

  // Stage advancement by Chef
  const handleAdvanceStage = (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;

    if (target.status === 'new') {
      const updated: OrderTicket = {
        ...target,
        status: 'preparing',
        startedAt: Date.now(),
        isNewArrival: false,
      };
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      updateTableForOrder(updated, 'waiting');
      showToast(`Ticket ${target.orderNumber} is now on the fire.`);
    } else if (target.status === 'preparing') {
      const updated: OrderTicket = {
        ...target,
        status: 'ready',
        readyAt: Date.now(),
      };
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      updateTableForOrder(updated, 'ready');
      sounds.playOrderReady();
      showToast(
        `${target.tableNumber || target.orderNumber} is hot on the pass! Runners notified.`
      );
    }
  };

  // Waiter claiming delivery
  const handleClaimDelivery = (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;

    const updated: OrderTicket = {
      ...target,
      status: 'served',
      claimedBy: 'Sakib Mahamud',
    };
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    updateTableForOrder(updated, 'pending');
    setSelectedOrderId(orderId);
    showToast(
      `Delivered to ${target.tableNumber || target.orderNumber}. Ready for payment & receipt.`
    );
  };

  // STEP 4 (Waitstaff): Confirm Payment & Open Receipt
  const handleCompletePayment = (orderId: string, method: PaymentMethod) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;

    const paidOrder: OrderTicket = {
      ...target,
      status: 'served',
      paymentStatus: 'paid',
      paymentMethod: method,
    };

    setOrders((prev) => prev.map((o) => (o.id === orderId ? paidOrder : o)));
    updateTableForOrder(paidOrder, 'empty', true);
    showToast(`Settled ${target.orderNumber} via ${method.toUpperCase()}.`);
    setReceiptModalState({ order: paidOrder, method });
  };

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

  const handleClearOrder = () => {
    if (!selectedOrder) return;
    if (confirm(`Remove ${selectedOrder.orderNumber}?`)) {
      updateTableForOrder(selectedOrder, 'empty', true);
      setOrders((prev) => prev.filter((o) => o.id !== selectedOrder.id));
      setSelectedOrderId('');
      showToast(`Cleared ticket ${selectedOrder.orderNumber}.`);
    }
  };

  const handleSimulateNewOrder = () => {
    const emptyTable = tables.find((t) => t.status === 'empty');
    const randomTable = emptyTable ? emptyTable.label : `Table ${Math.floor(Math.random() * 20) + 1}`;
    const randomNum = `#F0${Math.floor(Math.random() * 899) + 100}`;
    const newTicket: OrderTicket = {
      id: `ord-${Date.now()}`,
      orderNumber: randomNum,
      type: 'dine-in',
      tableId: emptyTable?.id,
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
          specialRequest: 'Serve piping hot with warm baguette',
        },
      ],
      notes: 'Fresh guest order from the dining room.',
    };

    setOrders((prev) => [newTicket, ...prev]);
    setSelectedOrderId(newTicket.id);
    if (emptyTable) {
      updateTableForOrder(newTicket, 'waiting');
    }
    sounds.playNewOrder();
    showToast(`New ticket ${randomNum} arrived for ${randomTable}.`);
  };

  const categories = useMemo(() => {
    return ['All', 'Pizza', 'Steak', 'Pasta', 'Salad', 'Rice', 'Noodle'];
  }, []);

  const activeWorkflowStep = useMemo(() => {
    if (selectedOrder && (selectedOrder.status === 'ready' || selectedOrder.status === 'served')) {
      return 3;
    }
    if (waiterActiveTab === 'menu' || selectedOrder?.status === 'draft') {
      return 2;
    }
    return 1;
  }, [waiterActiveTab, selectedOrder]);

  return (
    <div className="min-h-screen text-[#2B2623] flex flex-col antialiased selection:bg-[#B4693A]/20">
      {/* OFFLINE BANNER */}
      {!isConnected && (
        <div
          role="status"
          aria-live="polite"
          className="bg-red-600 text-white px-6 py-2.5 text-center text-xs sm:text-sm font-semibold flex items-center justify-center gap-3 transition-all"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" aria-hidden="true" />
          <span>Connection lost — quietly reconnecting to the kitchen hub...</span>
          <button
            type="button"
            onClick={() => setIsConnected(true)}
            className="ml-2 underline font-bold hover:text-stone-100 cursor-pointer"
          >
            Retry now
          </button>
        </div>
      )}

      {/* SOLID OPAQUE TOP BAR */}
      <TopBar
        role={role}
        onSetRole={(nextRole) => {
          setRole(nextRole);
          if (nextRole === 'chef') {
            const firstKitchenTicket = orders.find((o) => o.status !== 'draft');
            if (firstKitchenTicket) setSelectedOrderId(firstKitchenTicket.id);
          }
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isConnected={isConnected}
        onToggleConnection={() => setIsConnected(!isConnected)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        newCount={counts.new}
        onSimulateOrder={handleSimulateNewOrder}
      />

      {/* MAIN LAYOUT WRAPPER WITH GENEROUS BREATHING ROOM */}
      <div className="flex-1 max-w-[1680px] w-full mx-auto p-4 sm:p-7 flex gap-6 overflow-hidden">
        {/* LEFT SIDEBAR NAVIGATION */}
        <LeftSidebar
          role={role}
          waiterActiveTab={waiterActiveTab}
          onSelectTab={(tab) => {
            if (role === 'waiter') setWaiterActiveTab(tab);
          }}
          onShowToast={showToast}
        />

        {/* CENTER CONTENT REGION */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 flex flex-col gap-6 min-w-0 overflow-y-auto focus:outline-none pb-4"
        >
          {/* SOLID OPAQUE FILTER BAR (zero glassmorphism) */}
          <div className="bistro-surface rounded-2xl px-5 py-3.5 flex items-center justify-between flex-wrap gap-3">
            <div
              className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5"
              role="group"
              aria-label="Order filters"
            >
              <button
                type="button"
                onClick={() => setOrderFilter('all')}
                aria-pressed={orderFilter === 'all'}
                aria-label={`Show all ${counts.all} orders`}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-200 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] ${
                  orderFilter === 'all'
                    ? 'bg-[#2B2623] text-white shadow-xs'
                    : 'bg-[#F4EFE6] text-stone-600 hover:bg-[#EAE2D4] hover:text-[#2B2623]'
                }`}
              >
                <span>All</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full font-mono text-[11px] ${
                    orderFilter === 'all' ? 'bg-white/15 text-white' : 'bg-white text-stone-600'
                  }`}
                >
                  {counts.all}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setOrderFilter('dine-in')}
                aria-pressed={orderFilter === 'dine-in'}
                aria-label={`Show ${counts.dineIn} Dine In orders`}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-200 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] ${
                  orderFilter === 'dine-in'
                    ? 'bg-[#2B2623] text-white shadow-xs'
                    : 'bg-[#F4EFE6] text-stone-600 hover:bg-[#EAE2D4] hover:text-[#2B2623]'
                }`}
              >
                <span>Dine In</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full font-mono text-[11px] ${
                    orderFilter === 'dine-in' ? 'bg-white/15 text-white' : 'bg-white text-amber-800'
                  }`}
                >
                  {counts.dineIn}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setOrderFilter('takeaway')}
                aria-pressed={orderFilter === 'takeaway'}
                aria-label={`Show ${counts.takeaway} Take Away orders`}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-200 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] ${
                  orderFilter === 'takeaway'
                    ? 'bg-[#2B2623] text-white shadow-xs'
                    : 'bg-[#F4EFE6] text-stone-600 hover:bg-[#EAE2D4] hover:text-[#2B2623]'
                }`}
              >
                <span>Takeaway</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full font-mono text-[11px] ${
                    orderFilter === 'takeaway'
                      ? 'bg-white/15 text-white'
                      : 'bg-white text-purple-800'
                  }`}
                >
                  {counts.takeaway}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setOrderFilter('ready')}
                aria-pressed={orderFilter === 'ready'}
                aria-label={`Show ${counts.ready} Ready to Serve orders`}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-200 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] ${
                  orderFilter === 'ready'
                    ? 'bg-[#2B2623] text-white shadow-xs'
                    : 'bg-[#F4EFE6] text-stone-600 hover:bg-[#EAE2D4] hover:text-[#2B2623]'
                }`}
              >
                <span>Ready</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full font-mono text-[11px] ${
                    orderFilter === 'ready' ? 'bg-white/15 text-white' : 'bg-white text-emerald-700'
                  }`}
                >
                  {counts.ready}
                </span>
              </button>
            </div>

            {/* Secondary Utilities (keeps strict 1-primary-button hierarchy) */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleSimulateNewOrder}
                aria-label="Simulate incoming real-time ticket"
                className="px-4 py-2 rounded-xl bg-[#F4EFE6] hover:bg-[#EAE2D4] text-[#B4693A] text-xs font-bold flex items-center gap-1.5 transition-all duration-200 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A]"
              >
                <Icons.Plus />
                <span>Test Incoming Ticket</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMobileDetailOpen(true)}
                aria-label={`View selected ticket details for order ${selectedOrder?.orderNumber || ''}`}
                className="lg:hidden px-4 py-2 rounded-xl bg-[#2B2623] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A]"
              >
                <span>
                  {selectedOrder
                    ? `${selectedOrder.tableNumber || 'Takeaway'} (${selectedOrder.items.length})`
                    : 'Open Ticket'}
                </span>
              </button>
            </div>
          </div>

          {/* CHEF MODE: AIRY 3-COLUMN KITCHEN KANBAN */}
          {role === 'chef' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 flex-1">
              {/* COLUMN 1: INCOMING */}
              <section
                aria-label="New and pending tickets"
                className="bg-[#F2ECE1]/75 rounded-2xl p-5 flex flex-col gap-5"
              >
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" aria-hidden="true" />
                    <h2 className="font-extrabold text-base text-[#2B2623] tracking-tight">
                      Incoming
                    </h2>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-white text-sky-700 shadow-2xs">
                    {filteredOrders.filter((o) => o.status === 'new').length}
                  </span>
                </div>

                <div className="space-y-4 overflow-y-auto flex-1 pr-1">
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
                    <div className="py-14 px-6 text-center text-sm text-stone-500 leading-relaxed bg-white/70 rounded-2xl">
                      All caught up. Your kitchen orders will land here as soon as the dinner rush starts.
                    </div>
                  )}
                </div>
              </section>

              {/* COLUMN 2: ON THE FIRE */}
              <section
                aria-label="Actively cooking tickets"
                className="bg-[#F2ECE1]/75 rounded-2xl p-5 flex flex-col gap-5"
              >
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" aria-hidden="true" />
                    <h2 className="font-extrabold text-base text-[#2B2623] tracking-tight">
                      On the Fire
                    </h2>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-white text-amber-800 shadow-2xs">
                    {filteredOrders.filter((o) => o.status === 'preparing').length}
                  </span>
                </div>

                <div className="space-y-4 overflow-y-auto flex-1 pr-1">
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
                    <div className="py-14 px-6 text-center text-sm text-stone-500 leading-relaxed bg-white/70 rounded-2xl">
                      The burners are clear. Grab the next ticket from Incoming when you&apos;re ready.
                    </div>
                  )}
                </div>
              </section>

              {/* COLUMN 3: THE PASS (READY) */}
              <section
                aria-label="Tickets ready for pickup or serving"
                className="bg-[#F2ECE1]/75 rounded-2xl p-5 flex flex-col gap-5"
              >
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" aria-hidden="true" />
                    <h2 className="font-extrabold text-base text-[#2B2623] tracking-tight">
                      The Pass
                    </h2>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-white text-emerald-700 shadow-2xs">
                    {filteredOrders.filter((o) => o.status === 'ready').length}
                  </span>
                </div>

                <div className="space-y-4 overflow-y-auto flex-1 pr-1">
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
                    <div className="py-14 px-6 text-center text-sm text-stone-500 leading-relaxed bg-white/70 rounded-2xl">
                      The pass is spotless—nothing waiting for runners.
                    </div>
                  )}
                </div>
              </section>
            </div>
          ) : (
            /* WAITER MODE: GUIDED 3-STEP WORKSPACE + ASYMMETRIC LIVE PASS */
            <div className="space-y-7">
              {/* 3-STEP WORKFLOW BAR */}
              <div className="bistro-surface rounded-2xl p-2.5 flex items-center justify-between gap-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setWaiterActiveTab('tables')}
                  className={`flex-1 min-w-[145px] flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] ${
                    waiterActiveTab === 'tables'
                      ? 'bg-[#2B2623] text-white shadow-sm'
                      : 'hover:bg-[#FAF6EE] text-stone-600'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg text-xs font-extrabold flex items-center justify-center flex-shrink-0 ${
                      waiterActiveTab === 'tables'
                        ? 'bg-[#B4693A] text-white'
                        : 'bg-[#F4EFE6] text-[#2B2623]'
                    }`}
                  >
                    1
                  </span>
                  <div className="leading-tight">
                    <span className="text-xs font-bold block">Choose Table</span>
                    <span className="text-[11px] opacity-70">
                      {selectedOrder?.tableNumber || 'Dining floor'}
                    </span>
                  </div>
                </button>

                <span className="text-stone-300" aria-hidden="true">
                  &rarr;
                </span>

                <button
                  type="button"
                  onClick={() => setWaiterActiveTab('menu')}
                  className={`flex-1 min-w-[160px] flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] ${
                    waiterActiveTab === 'menu'
                      ? 'bg-[#2B2623] text-white shadow-sm'
                      : 'hover:bg-[#FAF6EE] text-stone-600'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg text-xs font-extrabold flex items-center justify-center flex-shrink-0 ${
                      waiterActiveTab === 'menu'
                        ? 'bg-[#B4693A] text-white'
                        : 'bg-[#F4EFE6] text-[#2B2623]'
                    }`}
                  >
                    2
                  </span>
                  <div className="leading-tight">
                    <span className="text-xs font-bold block">Customize &amp; Order</span>
                    <span className="text-[11px] opacity-70">Modifiers &amp; notes</span>
                  </div>
                </button>

                <span className="text-stone-300" aria-hidden="true">
                  &rarr;
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setWaiterActiveTab('orders');
                    const readyOrd = orders.find(
                      (o) => o.status === 'ready' || o.status === 'served'
                    );
                    if (readyOrd) {
                      setSelectedOrderId(readyOrd.id);
                      setIsMobileDetailOpen(true);
                    }
                  }}
                  className={`flex-1 min-w-[165px] flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ease-in-out cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A] ${
                    waiterActiveTab === 'orders' || activeWorkflowStep === 3
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'hover:bg-[#FAF6EE] text-stone-600'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg text-xs font-extrabold flex items-center justify-center flex-shrink-0 ${
                      counts.ready > 0
                        ? 'bg-emerald-400 text-emerald-950 animate-pulse'
                        : 'bg-[#F4EFE6] text-[#2B2623]'
                    }`}
                  >
                    3
                  </span>
                  <div className="leading-tight">
                    <span className="text-xs font-bold block">Serve, Pay &amp; Print</span>
                    <span className="text-[11px] opacity-80">
                      {counts.ready > 0 ? `${counts.ready} hot on pass` : 'Awaiting pass'}
                    </span>
                  </div>
                </button>
              </div>

              {/* PRIMARY WORKSPACE: TABLE MAP OR FOODIES MENU */}
              <section className="space-y-5">
                {waiterActiveTab === 'tables' ? (
                  <TableMapView
                    tables={tables}
                    selectedTableId={selectedTableId}
                    onSelectTable={handleSelectTable}
                    onStartTakeawayOrder={handleStartTakeawayOrder}
                  />
                ) : waiterActiveTab === 'menu' ? (
                  <FoodiesMenuSection
                    categories={categories}
                    selectedCategory={selectedMenuCategory}
                    onSelectCategory={setSelectedMenuCategory}
                    menuItems={MENU_DATABASE}
                    onSelectDish={handleSelectMenuDish}
                    activeTableLabel={
                      selectedOrder?.tableNumber ||
                      (selectedOrder?.type === 'takeaway' ? 'Takeaway Order' : undefined)
                    }
                    onChangeTable={() => setWaiterActiveTab('tables')}
                  />
                ) : null}
              </section>

              {/* LIVE PASS & ORDER LINE (Asymmetric Bento emphasis on first Ready ticket) */}
              <section
                aria-label="Order line queue"
                className="bistro-surface rounded-2xl p-6 sm:p-8"
              >
                <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-extrabold text-[#2B2623] tracking-tight">
                      Live Order Line
                    </h2>
                    <p className="text-sm text-stone-500 leading-relaxed">
                      Dishes ready on the pass rise to the top—tap to claim, choose payment, and print the check.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderFilter('all')}
                      aria-label="View all orders in queue"
                      className="w-10 h-10 rounded-xl bg-[#F4EFE6] hover:bg-[#EAE2D4] flex items-center justify-center text-stone-600 cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A]"
                    >
                      <Icons.ChevronLeft />
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderFilter('ready')}
                      aria-label="View ready orders in queue"
                      className="w-10 h-10 rounded-xl bg-[#F4EFE6] hover:bg-[#EAE2D4] flex items-center justify-center text-stone-600 cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B4693A]"
                    >
                      <Icons.ChevronRight />
                    </button>
                  </div>
                </div>

                {waiterSortedOrders.length === 0 ? (
                  <div className="py-16 px-8 text-center rounded-2xl bg-[#FAF6EE]">
                    <p className="text-base font-bold text-[#2B2623]">
                      Quiet floor right now.
                    </p>
                    <p className="text-sm text-stone-500 mt-1">
                      Once you send a table&apos;s order to the kitchen, you&apos;ll track every plate here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
                    {(waiterActiveTab === 'orders'
                      ? waiterSortedOrders
                      : waiterSortedOrders.slice(0, 3)
                    ).map((order) => (
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
                )}
              </section>
            </div>
          )}
        </main>

        {/* RIGHT SIDEBAR: ORDER DETAIL & CHECKOUT PANEL */}
        <aside
          aria-label="Order Inspector and Bill Details"
          className="hidden lg:block w-[370px] xl:w-[410px] flex-shrink-0"
        >
          <OrderDetailPanel
            order={selectedOrder}
            role={role}
            onAdvanceStage={handleAdvanceStage}
            onClaimDelivery={handleClaimDelivery}
            onSubmitDraftOrder={handleSubmitDraftOrder}
            onOpenReceipt={(method) => {
              if (selectedOrder) {
                setReceiptModalState({ order: selectedOrder, method });
              }
            }}
            onCompletePayment={handleCompletePayment}
            onUpdateQuantity={handleUpdateQuantity}
            onClearOrder={handleClearOrder}
            onChangeTable={() => setWaiterActiveTab('tables')}
          />
        </aside>
      </div>

      {/* TABLET / MOBILE BOTTOM SHEET MODAL */}
      {isMobileDetailOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Order Details"
          className="fixed inset-0 z-50 bg-[#2B2623]/45 flex items-end sm:items-center justify-center p-0 sm:p-5 lg:hidden"
          onClick={() => setIsMobileDetailOpen(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[88vh] overflow-y-auto shadow-2xl"
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
              onClaimDelivery={handleClaimDelivery}
              onSubmitDraftOrder={(id) => {
                handleSubmitDraftOrder(id);
                setIsMobileDetailOpen(false);
              }}
              onOpenReceipt={(method) => {
                if (selectedOrder) {
                  setIsMobileDetailOpen(false);
                  setReceiptModalState({ order: selectedOrder, method });
                }
              }}
              onCompletePayment={(id, method) => {
                handleCompletePayment(id, method);
                setIsMobileDetailOpen(false);
              }}
              onUpdateQuantity={handleUpdateQuantity}
              onClearOrder={() => {
                handleClearOrder();
                setIsMobileDetailOpen(false);
              }}
              onChangeTable={() => {
                setIsMobileDetailOpen(false);
                setWaiterActiveTab('tables');
              }}
            />
          </div>
        </div>
      )}

      {/* INTERACTIVE MODIFIER & SPECIAL REQUEST DRAWER */}
      <ModifierSheetModal
        item={customizingItem}
        tableLabel={
          selectedOrder?.tableNumber ||
          (selectedOrder?.type === 'takeaway' ? 'Takeaway Order' : 'Selected Table')
        }
        onClose={() => setCustomizingItem(null)}
        onConfirmAdd={handleConfirmCustomizedItem}
      />

      {/* PRINTABLE BISTRO RECEIPT MODAL */}
      <ReceiptModal
        order={receiptModalState.order}
        paymentMethod={receiptModalState.method}
        onClose={() => setReceiptModalState({ order: null, method: 'cash' })}
        onConfirmPrint={() =>
          showToast(`Receipt for ${receiptModalState.order?.orderNumber} sent to printer.`)
        }
      />

      {/* GLOBAL TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#2B2623] text-white px-6 py-3.5 rounded-xl text-sm font-semibold shadow-xl flex items-center gap-3"
        >
          <span className="w-2 h-2 rounded-full bg-[#B4693A] animate-ping" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
