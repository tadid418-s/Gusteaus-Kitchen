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

  // Interactive Modifier Sheet state (opens when tapping a dish on Menu)
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
    return orders.find((o) => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  // Live submitted orders (excludes waiter draft tickets not yet sent to kitchen)
  const submittedOrders = useMemo(() => {
    return orders.filter((o) => o.status !== 'draft');
  }, [orders]);

  // Filtered orders list for Order Line & Kanban
  const filteredOrders = useMemo(() => {
    const base = submittedOrders;
    return base.filter((o) => {
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

  // Sort Waitstaff Order Line so READY & SERVED (ready to pay) appear first
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

  // Counts for top chip filters
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

  // Helper: sync table status by orderId or tableNumber
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

    // Check if table already has an active order (draft or live)
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
        showToast(`Continuing draft order for ${tableObj.label}`);
      } else if (existingOrder.status === 'ready' || existingOrder.status === 'served') {
        setIsMobileDetailOpen(true);
        showToast(
          `${tableObj.label} (${existingOrder.orderNumber}) is ready for payment & receipt!`
        );
      } else {
        setIsMobileDetailOpen(true);
        showToast(`Viewing live order ${existingOrder.orderNumber} for ${tableObj.label}`);
      }
      return;
    }

    // Empty or Seated table with no order -> Create a new Draft Order and advance to Step 2 (Menu)
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
    showToast(`Step 1 done: ${tableObj.label} selected! Tap dishes to customize & add.`);
  };

  // Start a Takeaway Draft Order
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
    showToast(`Started Takeaway order ${randomNum} — tap dishes to customize & add.`);
  };

  // STEP 2 (Waitstaff): Tap Dish on Menu -> Open Interactive Customization Drawer
  const handleSelectMenuDish = (menuItem: MenuItem) => {
    // If no active order or current order is already paid/ready, ensure a table draft is selected
    if (!selectedOrder || selectedOrder.paymentStatus === 'paid' || selectedOrder.status === 'ready' || selectedOrder.status === 'served') {
      const currentTable = tables.find((t) => t.id === selectedTableId);
      if (!currentTable || currentTable.status !== 'empty') {
        setWaiterActiveTab('tables');
        showToast('Please choose a Table first before adding dishes!');
        return;
      }
      handleSelectTable(currentTable.id);
    }
    setCustomizingItem(menuItem);
  };

  // Confirm Add Customized Item from Modifier Sheet Drawer
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
      `Added ${quantity}x ${menuItem.name} to ${
        selectedOrder.tableNumber || selectedOrder.orderNumber
      }`
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
      `🔥 Order ${updatedOrder.orderNumber} (${
        updatedOrder.tableNumber || 'Takeaway'
      }) sent to Kitchen!`
    );
  };

  // Stage advancement by Chef (New -> Preparing -> Ready)
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
      showToast(`Chef started preparing ${target.orderNumber}`);
    } else if (target.status === 'preparing') {
      const updated: OrderTicket = {
        ...target,
        status: 'ready',
        readyAt: Date.now(),
      };
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      updateTableForOrder(updated, 'ready');
      sounds.playOrderReady();
      showToast(`🛎️ ${target.tableNumber || target.orderNumber} is READY! Waitstaff can now pay & print receipt.`);
    }
  };

  // Waiter claiming delivery when Chef marks order Ready
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
      `Delivered ${target.tableNumber || target.orderNumber}! Choose a payment method & print receipt.`
    );
  };

  // STEP 4 (Waitstaff): Confirm Payment Method & Settle Order
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
    showToast(
      `✓ Payment for ${target.orderNumber} confirmed via ${method.toUpperCase()}!`
    );
    // Offer immediate receipt view
    setReceiptModalState({ order: paidOrder, method });
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
      updateTableForOrder(selectedOrder, 'empty', true);
      setOrders((prev) => prev.filter((o) => o.id !== selectedOrder.id));
      setSelectedOrderId('');
      showToast(`Removed order ${selectedOrder.orderNumber}`);
    }
  };

  // Simulate incoming real-time ticket
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
      notes: 'New live ticket placed via guest mobile ordering.',
    };

    setOrders((prev) => [newTicket, ...prev]);
    setSelectedOrderId(newTicket.id);
    if (emptyTable) {
      updateTableForOrder(newTicket, 'waiting');
    }
    sounds.playNewOrder();
    showToast(`🔔 New Order ${randomNum} for ${randomTable} received!`);
  };

  // Categories list
  const categories = useMemo(() => {
    return ['All', 'Pizza', 'Steak', 'Pasta', 'Salad', 'Rice', 'Noodle'];
  }, []);

  // Determine current Waitstaff workflow step for visual stepper
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
    <div className="min-h-screen bg-[#FAF6EE] text-[#2B2623] flex flex-col antialiased selection:bg-[#B4693A]/20">
      {/* OFFLINE BANNER */}
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
        onSetRole={(nextRole) => {
          setRole(nextRole);
          if (nextRole === 'chef') {
            // Focus first non-draft ticket for chef
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

      {/* MAIN LAYOUT WRAPPER */}
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

        {/* CENTER CONTENT REGION */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 flex flex-col gap-4 min-w-0 overflow-y-auto focus:outline-none"
        >
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
                aria-label={`View selected ticket details for order ${selectedOrder?.orderNumber || ''}`}
                className="lg:hidden px-3 py-1.5 rounded-full bg-[#2B2623] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-stone-400"
              >
                <span>
                  {selectedOrder
                    ? `${selectedOrder.tableNumber || 'Takeaway'} (${selectedOrder.items.length})`
                    : 'View Ticket'}
                </span>
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
                      No new incoming tickets. Orders placed by Waitstaff appear here instantly!
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
            /* WAITER MODE: GUIDED 3-STEP ORDERING + LIVE READY QUEUE */
            <div className="space-y-5">
              {/* 3-STEP WORKFLOW BAR */}
              <div className="bg-white rounded-2xl p-2.5 border border-stone-200/80 shadow-xs flex items-center justify-between gap-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setWaiterActiveTab('tables')}
                  className={`flex-1 min-w-[140px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    waiterActiveTab === 'tables'
                      ? 'bg-[#2B2623] text-white shadow-sm'
                      : 'hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                      waiterActiveTab === 'tables'
                        ? 'bg-[#B4693A] text-white'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    1
                  </span>
                  <div className="leading-tight">
                    <span className="text-xs font-bold block">Choose Table</span>
                    <span className="text-[10px] opacity-75">
                      {selectedOrder?.tableNumber || 'Pick table'}
                    </span>
                  </div>
                </button>

                <span className="text-stone-300 font-bold" aria-hidden="true">
                  &rarr;
                </span>

                <button
                  type="button"
                  onClick={() => setWaiterActiveTab('menu')}
                  className={`flex-1 min-w-[155px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    waiterActiveTab === 'menu'
                      ? 'bg-[#2B2623] text-white shadow-sm'
                      : 'hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                      waiterActiveTab === 'menu'
                        ? 'bg-[#B4693A] text-white'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    2
                  </span>
                  <div className="leading-tight">
                    <span className="text-xs font-bold block">Customize &amp; Order</span>
                    <span className="text-[10px] opacity-75">Tap dish for modifiers</span>
                  </div>
                </button>

                <span className="text-stone-300 font-bold" aria-hidden="true">
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
                  className={`flex-1 min-w-[160px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    waiterActiveTab === 'orders' || activeWorkflowStep === 3
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                      counts.ready > 0
                        ? 'bg-emerald-400 text-emerald-950 animate-pulse'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    3
                  </span>
                  <div className="leading-tight">
                    <span className="text-xs font-bold block">Ready, Pay &amp; Receipt</span>
                    <span className="text-[10px] opacity-80">
                      {counts.ready > 0
                        ? `${counts.ready} Ready to Serve!`
                        : 'Unlock when Chef marks Ready'}
                    </span>
                  </div>
                </button>
              </div>

              {/* PRIMARY WORKSPACE: TABLE MAP OR FOODIES MENU */}
              <section className="space-y-4">
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

              {/* LIVE ORDER LINE (Always visible so Ready orders & Payment triggers are never missed) */}
              <section
                aria-label="Order line queue"
                className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/80 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#2B2623]">
                      Live Order Line &amp; Kitchen Status
                    </h2>
                    <p className="text-xs text-stone-500">
                      Orders marked <strong>Ready</strong> by the Chef appear first — tap to claim, choose payment &amp; print receipt
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
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 lg:hidden"
          onClick={() => setIsMobileDetailOpen(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[88vh] overflow-y-auto p-4 shadow-2xl animate-in slide-in-from-bottom"
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
          showToast(`🖨️ Sent receipt for ${receiptModalState.order?.orderNumber} to printer!`)
        }
      />

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
