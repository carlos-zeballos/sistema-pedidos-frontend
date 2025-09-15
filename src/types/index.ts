export interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'MOZO' | 'COCINERO' | 'CAJA' | 'BARRA';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  ord: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  price: number;
  type: 'COMIDA' | 'BEBIDA' | 'POSTRE' | 'COMBO' | 'ADICIONAL';
  categoryId: string;
  category?: Category;
  image?: string;
  preparationTime?: number;
  isAvailable: boolean;
  isEnabled: boolean;
  allergens: string[];
  nutritionalInfo?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface Combo {
  id: string;
  code: string;
  name: string;
  description?: string;
  basePrice: number;
  categoryId: string;
  category?: Category;
  image?: string;
  isEnabled: boolean;
  isAvailable: boolean;
  preparationTime?: number;
  maxSelections?: number;
  createdAt: Date;
  updatedAt: Date;
  components?: ComboComponent[];
}

export interface ComboComponent {
  id: string;
  comboId: string;
  type: 'PLATOS' | 'ACOMPAÑAMIENTO';
  name: string;
  description?: string;
  price: number;
  isRequired: boolean;
  isAvailable: boolean;
  maxSelections: number;
  ord: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Space {
  id: string;
  code: string;
  name: string;
  type: 'MESA' | 'BARRA' | 'DELIVERY' | 'RESERVA';
  capacity?: number;
  status: 'LIBRE' | 'OCUPADA' | 'RESERVADA' | 'MANTENIMIENTO';
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reservation {
  id: string;
  spaceId: string;
  space?: Space;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  date: Date;
  time: string;
  partySize: number;
  status: 'CONFIRMADA' | 'PENDIENTE' | 'CANCELADA' | 'COMPLETADA';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  spaceId: string;
  space?: Space;
  customerName: string;
  status: 'PENDIENTE' | 'EN_PREPARACION' | 'LISTO' | 'PAGADO' | 'CANCELADO';
  totalAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string;
  product?: Product;
  comboId?: string;
  combo?: Combo;
  name?: string;
  quantity: number;
  price: number;
  notes?: string;
  status: 'PENDIENTE' | 'EN_PREPARACION' | 'LISTO' | 'PAGADO' | 'CANCELADO';
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItemComponent {
  id: string;
  orderItemId: string;
  type: string;
  name: string;
  price: number;
  createdAt: Date;
}

// Compatibilidad con el código existente
export interface DiningTable extends Space {}

// Tipos para las vistas
export interface KitchenViewOrder extends Order {
  space: Space;
  items: OrderItem[];
}

export interface SpaceStatusView {
  id: string;
  name: string;
  type: string;
  status: string;
  hasActiveOrders: boolean;
  activeOrdersCount: number;
}

export interface TodayReservation {
  id: string;
  customerName: string;
  time: string;
  partySize: number;
  spaceName: string;
  status: string;
}

export interface PrepTimeStats {
  averagePrepTime: number;
  totalOrders: number;
  completedOrders: number;
}
