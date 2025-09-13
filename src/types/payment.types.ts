export interface PaymentMethod {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  icon: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderPayment {
  id: string;
  orderId: string;
  paymentMethodId: string;
  amount: number;
  paymentDate: Date;
  notes?: string;
  waiterId?: string;
  createdAt: Date;
}

export interface PaymentRequest {
  orderId: string;
  paymentMethodId: string;
  amount: number;
  notes?: string;
}

export interface CashReport {
  payment_method: string;
  total_amount: number;
  order_count: number;
  method_icon: string;
  method_color: string;
}

export interface PaidOrderReport {
  order_number: string;
  customer_name: string;
  space_name: string;
  total_amount: number;
  payment_method: string;
  payment_date: Date;
  waiter_name: string;
  items_count: number;
}

export interface SalesByHour {
  hour_of_day: number;
  total_amount: number;
  order_count: number;
}

export interface TodaySummary {
  total_orders: number;
  total_amount: number;
  payment_methods: Array<{
    method: string;
    amount: number;
    count: number;
    icon: string;
    color: string;
  }>;
}

export interface PaymentSummary {
  payment_method: string;
  icon: string;
  color: string;
  total_orders: number;
  total_amount: number;
  average_amount: number;
}











