"use client";

import { useMemo, useState, useEffect } from "react";
import { X, Banknote, Smartphone, CreditCard, CheckCircle, Clock } from "lucide-react";
import styles from "./PaymentModal.module.css";
import { Numpad } from "@/components/ui/Numpad";
import { useCart } from "@/state/cart";
import { useUi } from "@/state/ui";
import { recordSale, settleOrder } from "@/lib/api";
import { useProducts } from "@/state/products";
import { useOrders } from "@/state/orders";
import type { Order } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  settlingOrder?: Order | null;
};

type PaymentMethod = "cash" | "nequi" | "davi";

const formatMoney = (value: number) =>
  `$${value.toLocaleString("es-CO")}`;

export function PaymentModal({ open, onClose, settlingOrder }: Props) {
  const { items, total: cartTotal, clear } = useCart();
  const { showToast } = useUi();
  const { applySale, refresh: refreshProducts } = useProducts();
  const { refresh: refreshOrders, updateOrder } = useOrders();
  
  const [cash, setCash] = useState(0);
  const [nequi, setNequi] = useState(0);
  const [davi, setDavi] = useState(0);
  const [client, setClient] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeInput, setActiveInput] = useState<PaymentMethod>("cash");

  const total = settlingOrder ? settlingOrder.total : cartTotal;

  // Reset y Setup cuando abre
  useEffect(() => {
    if (open) {
      setCash(0);
      setNequi(0);
      setDavi(0);
      setActiveInput("cash");
      if (settlingOrder) {
        setClient(settlingOrder.client || "Cliente");
      } else {
        setClient("");
      }
    }
  }, [open, settlingOrder]);

  const paid = cash + nequi + davi;
  const change = paid - total;
  const finalCash = useMemo(() => {
    if (change > 0 && cash >= change) return cash - change;
    return cash;
  }, [cash, change]);
  const isPaid = paid >= total;

  const getInputValue = (method: PaymentMethod) => {
    switch (method) {
      case "cash": return cash;
      case "nequi": return nequi;
      case "davi": return davi;
    }
  };

  const setInputValue = (method: PaymentMethod, value: number) => {
    switch (method) {
      case "cash": setCash(value); break;
      case "nequi": setNequi(value); break;
      case "davi": setDavi(value); break;
    }
  };

  const handleNumpadInput = (key: string) => {
    const current = getInputValue(activeInput).toString();
    const newValue = current === "0" ? key : current + key;
    setInputValue(activeInput, Number(newValue) || 0);
  };

  const handleNumpadBackspace = () => {
    const current = getInputValue(activeInput).toString();
    const newValue = current.slice(0, -1);
    setInputValue(activeInput, Number(newValue) || 0);
  };

  const handleConfirm = async () => {
    // Si NO es deuda, validamos carrito vacío
    if (!settlingOrder && items.length === 0) {
      showToast("Agrega productos primero");
      return;
    }

    // Si ES deuda, validamos pago completo
    if (settlingOrder && !isPaid) {
      showToast("Para liquidar, el pago debe ser completo");
      return;
    }

    try {
      setSubmitting(true);

      if (settlingOrder) {
        // LIQUIDAR DEUDA
        await settleOrder({
          id: settlingOrder.id,
          payment: { cash: finalCash, nequi, daviplata: davi },
        });
        updateOrder(settlingOrder.id, {
          statusPayment: "Pagado",
          payment: { cash: finalCash, nequi, daviplata: davi },
        });
        showToast("¡Deuda Pagada Correctamente!");
      } else {
        // VENTA NUEVA
        await recordSale({
          items: items.map((i) => ({
            id: i.id,
            nombre: i.name,
            cantidad: i.quantity,
            precio_unitario: i.price,
          })),
          total,
          payment: { cash: finalCash, nequi, daviplata: davi },
          client: client || "Cliente",
          statusPayment: isPaid ? "Pagado" : "Pendiente",
          statusDelivery: "Pendiente",
          createdAt: new Date().toISOString(),
        });
        applySale(items);
        clear();
        showToast(isPaid ? "¡Venta Exitosa!" : "¡Pedido Guardado (Pendiente)!");
      }

      onClose();
      void refreshProducts();
      void refreshOrders();
      
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Error al procesar");
    } finally {
      setSubmitting(false);
    }
  };

  const isDebtBtn = !isPaid; // Botón azul/pendiente si falta plata

  if (!open) return null;

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <header className={styles.header}>
          <div>
            <h3 className={styles.title}>{settlingOrder ? "Cobrar Deuda" : "Cobrar"}</h3>
            <p className={styles.total}>Total: <span>{formatMoney(total)}</span></p>
          </div>
          <button
            className={styles.close}
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </header>

        <div className={styles.form}>
          <div className={styles.clientInput}>
            <input
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Nombre Cliente / Mesa"
              disabled={!!settlingOrder} 
              className={!!settlingOrder ? "opacity-50 cursor-not-allowed" : ""}
            />
          </div>

          <div className={styles.paymentMethods}>
            <button
              type="button"
              className={`${styles.paymentBox} ${activeInput === "cash" ? styles.active : ""}`}
              onClick={() => setActiveInput("cash")}
            >
              <div className={styles.paymentIcon}>
                <Banknote size={20} className={styles.iconCash} />
                <span>Efectivo</span>
              </div>
              <span className={styles.paymentValue}>{cash || "0"}</span>
            </button>

            <button
              type="button"
              className={`${styles.paymentBox} ${activeInput === "nequi" ? styles.active : ""}`}
              onClick={() => setActiveInput("nequi")}
            >
              <div className={styles.paymentIcon}>
                <Smartphone size={20} className={styles.iconNequi} />
                <span>Nequi</span>
              </div>
              <span className={styles.paymentValue}>{nequi || "0"}</span>
            </button>

            <button
              type="button"
              className={`${styles.paymentBox} ${activeInput === "davi" ? styles.active : ""}`}
              onClick={() => setActiveInput("davi")}
            >
              <div className={styles.paymentIcon}>
                <CreditCard size={20} className={styles.iconDavi} />
                <span>Daviplata</span>
              </div>
              <span className={styles.paymentValue}>{davi || "0"}</span>
            </button>
          </div>

          <div className={styles.changeRow}>
            <span>Vueltas (Cambio):</span>
            <strong>{formatMoney(Math.max(change, 0))}</strong>
          </div>
        </div>

        <Numpad onInput={handleNumpadInput} onBackspace={handleNumpadBackspace} />

        <div className={styles.actions}>
          <button
            type="button"
            className={`${styles.confirmBtn} ${isDebtBtn ? styles.confirmPending : styles.confirmPaid}`}
            onClick={handleConfirm}
            disabled={(!settlingOrder && items.length === 0) || submitting}
          >
            <span>{isDebtBtn ? "Guardar Pendiente (Deuda)" : "Confirmar Venta"}</span>
            {isDebtBtn ? <Clock size={20} /> : <CheckCircle size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
