"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import styles from "./ui.module.css";

import type { Order } from "@/lib/types";

// ...

type Toast = { id: string; message: string };

type PaymentModalState = {
  open: boolean;
  settleOrder: Order | null;
};

type UiContextValue = {
  toasts: Toast[];
  showToast: (message: string) => void;
  removeToast: (id: string) => void;
  // Modal de Pago
  paymentModal: PaymentModalState;
  openPaymentModal: (settleOrder?: Order) => void;
  closePaymentModal: () => void;
};

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [paymentModal, setPaymentModal] = useState<PaymentModalState>({
    open: false,
    settleOrder: null,
  });

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message }]);
      setTimeout(() => removeToast(id), 3000);
    },
    [removeToast],
  );

  const openPaymentModal = useCallback((settleOrder?: Order) => {
    setPaymentModal({ open: true, settleOrder: settleOrder || null });
  }, []);

  const closePaymentModal = useCallback(() => {
    setPaymentModal({ open: false, settleOrder: null });
  }, []);

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      removeToast,
      paymentModal,
      openPaymentModal,
      closePaymentModal,
    }),
    [toasts, showToast, removeToast, paymentModal, openPaymentModal, closePaymentModal],
  );

  return (
    <UiContext.Provider value={value}>
      {children}
      <div className={styles.toasts}>
        {toasts.map((toast) => (
          <div key={toast.id} className={styles.toast}>
            {toast.message}
          </div>
        ))}
      </div>
    </UiContext.Provider>
  );
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi debe usarse dentro de UiProvider");
  return ctx;
}
