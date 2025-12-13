export type StockValue = number | "" | null;

export type CategoryKey = string;

export interface Category {
  key: CategoryKey;
  icon: string;
  label: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: StockValue;
  category: CategoryKey;
  unit: "und" | "g" | "ml" | string;
  consumePerSale: number;
  image?: string | null;
  isCoffee?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface PaymentBreakdown {
  cash: number;
  nequi: number;
  daviplata: number;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  client?: string;
  statusPayment: "Pagado" | "Pendiente";
  statusDelivery: "Pendiente" | "Entregado" | "Cancelado" | string;
  payment?: PaymentBreakdown;
  createdAt?: string;
}

export interface Settings {
  name: string;
  nit: string;
  customGoal: number;
}

export interface ReportSummary {
  todayTotal: number;
  base: number;
  expenses: number;
  totalInBox: number;
}

export interface TopProduct {
  name: string;
  quantity: number;
}

export interface WeeklyPoint {
  label: string;
  value: number;
}

export interface HourlyPoint {
  hour: string;
  value: number;
}

export interface ReportsPayload {
  summary: ReportSummary;
  payments: PaymentBreakdown;
  topProducts: TopProduct[];
  weekly: WeeklyPoint[];
  hourly: HourlyPoint[];
}

export interface ApiResult<T> {
  status: "success" | "error";
  message?: string;
  data?: T;
}
