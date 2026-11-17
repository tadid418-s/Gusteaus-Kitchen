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

export interface TableInfo {
  id: string;
  label: string;
  status: TableStatus;
  seats: number;
  currentOrderId?: string;
}
