"use client";

import { ShoppingCart, Minus, Plus, Trash2, ListOrdered, ChevronDown } from "lucide-react";
import styles from "./CartDrawer.module.css";
import { useCart } from "@/state/cart";
import { useOrders } from "@/state/orders";
import { useUi } from "@/state/ui";
import { Button } from "@/components/ui/Button";
import { useState, useMemo } from "react";

const formatMoney = (value: number) =>
  `$${value.toLocaleString("es-CO")}`;

export function CartDrawer() {
  const { items, total, add, decrement, remove, clear } = useCart();
  const { orders, isLoading, refresh } = useOrders();
  const { openPaymentModal } = useUi();

  const sortedOrders = useMemo(() => {
    const getTimestamp = (order: import("@/lib/types").Order) => {
      // 1) Prefer createdAt full timestamp
      if (order.createdAt) {
        const t = Date.parse(order.createdAt);
        if (!Number.isNaN(t)) return t;
      }

      // 2) Combine date + time if exist separately
      const dateStr = (order as any).date || (order as any).fecha;
      const timeStr = (order as any).time;
      if (dateStr && timeStr) {
        const composed = `${dateStr}T${timeStr}${timeStr.length === 5 ? ":00" : ""}`;
        const t = Date.parse(composed);
        if (!Number.isNaN(t)) return t;
      }

      // 3) Fallback to timestamp embedded in id (e.g., ORD-<ms>)
      const idNum = Number(String(order.id).split("-").pop());
      if (!Number.isNaN(idNum)) return idNum;

      return 0;
    };

    return [...orders].sort((a, b) => getTimestamp(b) - getTimestamp(a));
  }, [orders]);

  return (
    <aside className={styles.drawer}>
      {/* Carrito Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Carrito</h2>
      </div>

      {/* Lista de Items */}
      <div className={styles.list}>
        {items.length === 0 ? (
          <div className={styles.empty}>
            <ShoppingCart size={48} className={styles.emptyIcon} />
            <p>Vacío</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className={styles.row}>
              <div className={styles.itemInfo}>
                <p className={styles.name}>{item.name}</p>
                <p className={styles.price}>{formatMoney(item.price)} x {item.quantity}</p>
              </div>
              <div className={styles.controls}>
                <div className={styles.qtyControls}>
                  <button onClick={() => decrement(item.id)} aria-label="Restar">
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => add(item)} aria-label="Sumar">
                    +
                  </button>
                </div>
                <button className={styles.deleteBtn} onClick={() => remove(item.id)} aria-label="Eliminar">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sección Pedidos Recientes */}
      {/* Sección Pedidos Recientes (base de datos) */}
      <div className={styles.ordersSection}>
        <div className={styles.ordersHeader}>
          <div className="flex items-center gap-2">
            <ListOrdered size={16} />
            <span>PEDIDOS RECIENTES</span>
          </div>
          <button
            onClick={() => void refresh()}
            className={styles.refreshBtn}
            title="Actualizar"
            disabled={isLoading}
          >
            ↻
          </button>
        </div>
        <div className={styles.ordersList}>
          {isLoading ? (
            <p className={styles.ordersEmpty}>Cargando...</p>
          ) : orders.length === 0 ? (
            <p className={styles.ordersEmpty}>Sin pedidos recientes</p>
          ) : (
            sortedOrders.map((order) => <OrderCard key={order.id} order={order} />)
          )}
        </div>
      </div>

      {/* Footer con Total y Botones */}
      <div className={styles.footer}>
        <div className={styles.totalRow}>
          <span>Total:</span>
          <strong>{formatMoney(total)}</strong>
        </div>
        <div className={styles.actions}>
          <button 
            className={styles.vaciarBtn} 
            onClick={clear}
            disabled={items.length === 0}
          >
            Vaciar
          </button>
          <button 
            className={styles.cobrarBtn} 
            onClick={() => openPaymentModal()}
            disabled={items.length === 0}
          >
            Cobrar
          </button>
        </div>
      </div>
    </aside>
  );
}

function OrderCard({ order }: { order: import("@/lib/types").Order }) {
  const { toggleStatus } = useOrders();
  const { openPaymentModal } = useUi();
  const [expanded, setExpanded] = useState(false);

  // Parse items safely
  const items = useMemo(() => {
    try {
      if (typeof order.items === "string") return JSON.parse(order.items);
      return order.items || [];
    } catch (e) {
      return [];
    }
  }, [order.items]);

  const payClass = order.statusPayment === "Pagado" ? styles.btnSuccess : styles.btnDanger;
  const delClass = order.statusDelivery === "Entregado" ? styles.btnSuccess : styles.btnWarning;

  return (
    <div 
      className={`${styles.orderCard} ${expanded ? styles.expanded : ""}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className={styles.orderHeader}>
        <div className={styles.clientInfo}>
          <ChevronDown size={12} className={expanded ? "rotate-180 transition-transform" : "transition-transform"} />
          <span className={styles.clientName}>{order.client || "Cliente"}</span>
        </div>
        <span className={styles.orderTime}>
          {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""}
        </span>
      </div>

      {expanded && (
        <div className={styles.orderDetails} onClick={(e) => e.stopPropagation()}>
          {items.length === 0 ? (
            <p className={styles.noDetails}>Sin detalle</p>
          ) : (
            items.map((i: any, idx: number) => (
              <div key={idx} className={styles.detailItem}>
                <span>{i.nombre}</span>
                <strong>x{i.cantidad}</strong>
              </div>
            ))
          )}
        </div>
      )}

      <div className={styles.orderFooter}>
        <strong className={styles.orderTotal}>{formatMoney(order.total)}</strong>
        <div className={styles.tags}>
          <button 
            className={`${styles.statusBtn} ${payClass}`}
            onClick={(e) => {
              e.stopPropagation();
              openPaymentModal(order);
            }}
          >
            {order.statusPayment || "Pendiente"}
          </button>
          <button 
            className={`${styles.statusBtn} ${delClass}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleStatus(order.id, "delivery", order.statusDelivery !== "Entregado");
            }}
          >
            {order.statusDelivery || "Pendiente"}
          </button>
        </div>
      </div>
    </div>
  );
}
