import type {
  ApiResult,
  Order,
  PaymentBreakdown,
  Product,
  ReportsPayload,
  StockValue,
} from "./types";

const CONTENT_TYPE = { "Content-Type": "text/plain;charset=utf-8" };

const getApiUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) throw new Error("Falta configurar NEXT_PUBLIC_API_URL");
  return url;
};

export const cloudinaryConfig = {
  url: process.env.NEXT_PUBLIC_CLOUDINARY_URL ?? "",
  preset: process.env.NEXT_PUBLIC_CLOUDINARY_PRESET ?? "",
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  if (!res.ok) {
    const msg = `Error API (${res.status}): ${res.statusText}`;
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

async function postAction<T>(
  action: string,
  payload: unknown,
): Promise<ApiResult<T>> {
  const url = getApiUrl();
  return fetchJson<ApiResult<T>>(url, {
    method: "POST",
    headers: CONTENT_TYPE,
    body: JSON.stringify({ action, payload }),
  });
}

export async function getProducts() {
  const url = `${getApiUrl()}?action=getProducts`;
  return fetchJson<
    ApiResult<{ menu?: Product[]; store?: Product[] }>
  >(url);
}

export async function getActiveOrders() {
  const url = `${getApiUrl()}?action=getActiveOrders`;
  const res = await fetchJson<ApiResult<any[]>>(url);

  if (res.data) {
    res.data = res.data.map((order) => ({
      ...order,
      statusPayment:
        order.payStatus === true
          ? "Pagado"
          : order.payStatus === false
          ? "Pendiente"
          : order.statusPayment || order.paymentStatus || "Pendiente",
      statusDelivery:
        order.delStatus === true
          ? "Entregado"
          : order.delStatus === false
          ? "Pendiente"
          : order.statusDelivery || order.deliveryStatus || "Pendiente",
      createdAt: order.time
        ? `${new Date().toISOString().split("T")[0]}T${order.time}${
            order.time.length === 5 ? ":00" : ""
          }`
        : order.createdAt || new Date().toISOString(),
    }));
  }

  return res as ApiResult<Order[]>;
}

export async function getReports(date?: string) {
  const query = date ? `&date=${date}` : '';
  const url = `${getApiUrl()}?action=getReports${query}`;
  return fetchJson<ApiResult<any[]>>(url);
}

export async function getInsights(date?: string) {
  const query = date ? `&date=${date}` : '';
  const url = `${getApiUrl()}?action=getInsights${query}`;
  return fetchJson<ApiResult<{ goal: number; meta: number }>>(url);
}

export async function getDailyFinancials(date?: string) {
  const query = date ? `&date=${date}` : '';
  const url = `${getApiUrl()}?action=getDailyFinancials${query}`;
  return fetchJson<
    ApiResult<{
      base: number;
      expenses: number;
      totalInBox: number;
      todayTotal: number;
      cash: number;
      nequi: number;
      davi: number;
    }>
  >(url);
}

export async function recordSale(payload: {
  items: { id: string; nombre: string; cantidad: number; precio_unitario: number }[];
  total: number;
  payment: PaymentBreakdown;
  client: string;
  statusPayment: Order["statusPayment"];
  statusDelivery: Order["statusDelivery"];
  createdAt?: string;
}) {
  return postAction<unknown>("recordSale", payload);
}

export async function settleOrder(payload: {
  id: string;
  payment: PaymentBreakdown;
}) {
  return postAction<unknown>("settleOrder", payload);
}

export async function addExpense(payload: { desc: string; value: number }) {
  return postAction<unknown>("addExpense", payload);
}

export async function setBase(payload: { value: number }) {
  return postAction<unknown>("setBase", payload);
}

export async function updateCoffeeStock(payload: {
  value: number;
  add?: boolean;
}) {
  return postAction<{ newStock: number }>("updateCoffeeStock", payload);
}

export async function addProduct(payload: {
  name: string;
  price: number;
  qty: StockValue;
  cat: string;
  img?: string | null;
  unit: Product["unit"];
  consume: number;
  isCoffee?: boolean;
}) {
  return postAction<unknown>("addProduct", payload);
}

export async function updateProduct(payload: {
  id: string;
  name: string;
  price: number;
  qty: StockValue;
  cat: string;
  img?: string | null;
  unit: Product["unit"];
  consume: number;
  isCoffee?: boolean;
}) {
  return postAction<unknown>("updateProduct", payload);
}

export async function deleteProduct(payload: { id: string }) {
  return postAction<unknown>("deleteProduct", payload);
}

export async function getSettings() {
  const url = `${getApiUrl()}?action=getSettings`;
  const result = await fetchJson<ApiResult<{
    name?: string;
    nit?: string;
    customGoal?: number;
    smartGoal?: number;
    coffeeStock?: number;
    base?: number;
  }>>(url);
  return result.data ?? {};
}

export async function updateSettings(payload: {
  name?: string;
  nit?: string;
  customGoal?: number;
}) {
  return postAction<unknown>("updateSettings", payload);
}

export async function updateOrderStatus(payload: {
  id: string;
  type: "payment" | "delivery";
  value: boolean;
}) {
  return postAction<unknown>("updateOrderStatus", payload);
}


