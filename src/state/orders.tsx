"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getActiveOrders, updateOrderStatus } from "@/lib/api";
import type { Order } from "@/lib/types";

type OrdersContextType = {
  orders: Order[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  toggleStatus: (id: string, type: "payment" | "delivery", value: boolean) => Promise<void>;
  updateOrder: (id: string, updates: Partial<Order>) => void;
};

const OrdersContext = createContext<OrdersContextType | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = async () => {
    try {
      setIsLoading(true);
      const res = await getActiveOrders();
      if (res.data) {
        setOrders(res.data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrder = (id: string, updates: Partial<Order>) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    );
  };

  const toggleStatus = async (id: string, type: "payment" | "delivery", value: boolean) => {
    // Optimistic Update
    const oldOrders = [...orders];
    updateOrder(id, {
      [type === "payment" ? "statusPayment" : "statusDelivery"]: value
        ? (type === "payment" ? "Pagado" : "Entregado")
        : "Pendiente",
    });

    try {
      await updateOrderStatus({ id, type, value });
      // await refresh(); // No refresh inmediato para confiar en optimismo
    } catch (error) {
      console.error("Error updating status:", error);
      setOrders(oldOrders); // Rollback
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <OrdersContext.Provider value={{ orders, isLoading, refresh, toggleStatus, updateOrder }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
}
