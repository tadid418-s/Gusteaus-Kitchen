import { Modifier, OrderStatus, PaymentMethod } from './pos';

export type Language = 'en' | 'am';

export type DietaryFilter =
  | 'all'
  | 'vegetarian'
  | 'vegan'
  | 'spicy'
  | 'tsom'
  | 'halal'
  | 'gluten-free';

export interface CustomerMenuItem {
  id: string;
  name: string;
  nameAm?: string;
  category: string;
  categoryAm?: string;
  subcategory: string;
  priceETB: number; // Price in Ethiopian Birr
  usdPrice: number; // Original USD reference
  description: string;
  descriptionAm?: string;
  imageUrl: string;
  popular?: boolean;
  dietary: ('vegetarian' | 'vegan' | 'spicy' | 'tsom' | 'halal' | 'gluten-free')[];
  availableModifiers: Modifier[];
  isSoldOut?: boolean;
}

export interface CartItem {
  cartItemId: string; // unique instance ID in cart
  menuItemId: string;
  name: string;
  nameAm?: string;
  category: string;
  imageUrl: string;
  quantity: number;
  unitPriceETB: number;
  selectedModifiers: Modifier[];
  specialRequest?: string;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  type: 'dine-in' | 'takeaway';
  tableNumber?: string;
  isTableLocked?: boolean;
  customerName?: string;
  customerPhone?: string;
  pickupTime?: string; // e.g. "As soon as possible (~20 mins)" or "1:30 PM"
  items: CartItem[];
  subtotalETB: number;
  taxETB: number;
  serviceChargeETB: number;
  totalETB: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'pending';
  placedAt: number;
  status: OrderStatus; // 'new' | 'preparing' | 'ready' | 'served'
  notes?: string;
  estimatedMinutes?: number;
}
