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
  preset: process.env.NEXT_PUBLIC_CLOUDINARY_PRESET ?? "pasmi_preset",
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
    res.data = res.data.map((order) => {
      const rawPayment = (order as any).payment;
      let parsedPayment: any = undefined;

      if (typeof rawPayment === "string") {
        try {
          parsedPayment = JSON.parse(rawPayment);
        } catch {
          parsedPayment = rawPayment ? { method: rawPayment } : undefined;
        }
      } else if (rawPayment && typeof rawPayment === "object") {
        parsedPayment = rawPayment;
      }

      const asNumber = (value: any) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : undefined;
      };

      // Acumular montos por método desde distintos formatos
      let cash = asNumber(
        order.cash ??
          (parsedPayment as any)?.cash ??
          (order as any).efectivo ??
          (order as any).p_efectivo,
      );
      let nequi = asNumber(
        order.nequi ??
          (parsedPayment as any)?.nequi ??
          (order as any).p_nequi,
      );
      let davi = asNumber(
        order.davi ??
          (parsedPayment as any)?.daviplata ??
          (parsedPayment as any)?.davi ??
          (order as any).daviplata ??
          (order as any).p_daviplata,
      );

      // Si viene como arreglo [{method,value}]
      if (Array.isArray(parsedPayment)) {
        for (const p of parsedPayment) {
          const val = asNumber((p as any).value ?? (p as any).monto);
          const method = String((p as any).method ?? (p as any).medio ?? "").toLowerCase();
          if (!Number.isFinite(val)) continue;
          if (method.includes("nequi")) nequi = (nequi ?? 0) + (val as number);
          else if (method.includes("davi")) davi = (davi ?? 0) + (val as number);
          else cash = (cash ?? 0) + (val as number);
        }
      }

      // Si viene como objeto con totales
      if (parsedPayment && typeof parsedPayment === "object" && !Array.isArray(parsedPayment)) {
        const valCash = asNumber((parsedPayment as any).cash);
        const valNequi = asNumber((parsedPayment as any).nequi);
        const valDavi = asNumber((parsedPayment as any).daviplata ?? (parsedPayment as any).davi);
        cash = valCash ?? cash;
        nequi = valNequi ?? nequi;
        davi = valDavi ?? davi;
      }

      const hasData =
        Number.isFinite(cash) ||
        Number.isFinite(nequi) ||
        Number.isFinite(davi);

      const payment = hasData
        ? {
            cash: Number.isFinite(cash) ? (cash as number) : 0,
            nequi: Number.isFinite(nequi) ? (nequi as number) : 0,
            daviplata: Number.isFinite(davi) ? (davi as number) : 0,
          }
        : undefined;

      const paymentMethod =
        (order as any).paymentMethod ||
        (order as any).payMethod ||
        (order as any).method ||
        (order as any).metodo ||
        (order as any).medio ||
        (typeof parsedPayment === "object"
          ? (parsedPayment as any)?.method ?? (parsedPayment as any)?.medio
          : undefined);

      return {
        ...order,
        payment,
        paymentMethod,
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
      createdAt: (() => {
        const timeStr = typeof order.time === "string" ? order.time : "";
        const idTimestamp = Number(String(order.id ?? "").split("-").pop());
        const idDate = Number.isFinite(idTimestamp) ? new Date(idTimestamp) : null;
        const dateStrFromId = idDate
          ? idDate.toISOString().split("T")[0]
          : null;

        const dateStr =
          typeof order.date === "string"
            ? order.date
            : typeof (order as any).fecha === "string"
            ? (order as any).fecha
            : dateStrFromId ?? new Date().toISOString().split("T")[0];

        if (order.createdAt) return order.createdAt;

        if (dateStr && timeStr) {
          return `${dateStr}T${timeStr}${timeStr.length === 5 ? ":00" : ""}`;
        }

        if (dateStr) {
          return `${dateStr}T00:00:00`;
        }

        return idDate ? idDate.toISOString() : new Date().toISOString();
      })(),
      };
    });
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
  return fetchJson<
    ApiResult<{
      goal?: number;
      meta?: number;
      smartGoal?: number;
      combos?: Array<{ combo: string; count: number }>;
      hourly?: Array<{ hour: string; value?: number; sales?: number; total?: number }>;
    }>
  >(url);
}

type DailyFinancialsResponse = {
  base?: number;
  expenses?: number | any[];
  totalInBox?: number;
  todayTotal?: number;
  cash?: number;
  nequi?: number;
  davi?: number;
  coffeeStock?: number;
};

export async function getDailyFinancials(date?: string) {
  const query = date ? `&date=${date}` : "";
  const url = `${getApiUrl()}?action=getDailyFinancials${query}`;
  return fetchJson<ApiResult<DailyFinancialsResponse>>(url);
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
  // Guardamos en la hoja tanto img como i para ser compatibles con el prototipo
  i?: string | null;
  unit: Product["unit"];
  consume: number;
  isCoffee?: boolean;
}) {
  const body = {
    ...payload,
    img: payload.img ?? payload.i ?? null,
    i: payload.img ?? payload.i ?? null,
  };
  return postAction<unknown>("addProduct", body);
}

export async function updateProduct(payload: {
  id: string;
  name: string;
  price: number;
  qty: StockValue;
  cat: string;
  img?: string | null;
  i?: string | null;
  unit: Product["unit"];
  consume: number;
  isCoffee?: boolean;
}) {
  const body = {
    ...payload,
    img: payload.img ?? payload.i ?? null,
    i: payload.img ?? payload.i ?? null,
  };
  return postAction<unknown>("updateProduct", body);
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
