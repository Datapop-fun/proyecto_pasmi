"use client";

import { useMemo, useState, useEffect } from "react";
import { X, Banknote, Smartphone, CreditCard, CheckCircle, Clock } from "lucide-react";
import styles from "./PaymentModal.module.css";
import { Numpad } from "@/components/ui/Numpad";
import { useCart } from "@/state/cart";
import { useUi } from "@/state/ui";
import { recordSale, settleOrder, getReports } from "@/lib/api";
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
  const [fetchedPayment, setFetchedPayment] = useState<{ cash: number; nequi: number; daviplata: number } | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);

  const total = settlingOrder ? settlingOrder.total : cartTotal;
  const viewOnly = !!settlingOrder && settlingOrder.statusPayment === "Pagado";

  // Reset y Setup cuando abre
  useEffect(() => {
    if (!open) return;

    const payment = settlingOrder?.payment || fetchedPayment || undefined;
    const isPaid = settlingOrder?.statusPayment === "Pagado";
    const methodHint = (settlingOrder as any)?.paymentMethod;
    const totalFromOrder = settlingOrder?.total ?? total;

    setClient(settlingOrder ? settlingOrder.client || "Cliente" : "");

    if (isPaid && payment) {
      const cashVal = Number(payment.cash || 0) || 0;
      const nequiVal = Number(payment.nequi || 0) || 0;
      const daviVal = Number(payment.daviplata || 0) || 0;

      setCash(cashVal);
      setNequi(nequiVal);
      setDavi(daviVal);

      // Seleccionar automáticamente el medio con mayor valor para indicar el pago principal
      const paymentOptions: Array<{ method: PaymentMethod; value: number }> = [
        { method: "cash", value: cashVal },
        { method: "nequi", value: nequiVal },
        { method: "davi", value: daviVal },
      ];
      const mainMethod =
        paymentOptions.reduce((max, current) =>
          current.value > max.value ? current : max,
        paymentOptions[0]).method;
      setActiveInput(mainMethod);
    } else if (isPaid && methodHint) {
      // Si solo conocemos el método principal, asignamos el total a ese medio.
      const hint = String(methodHint).toLowerCase();
      const cashVal = hint.includes("cash") || hint.includes("efec") ? totalFromOrder : 0;
      const nequiVal = hint.includes("nequi") ? totalFromOrder : 0;
      const daviVal = hint.includes("davi") ? totalFromOrder : 0;

      setCash(cashVal);
      setNequi(nequiVal);
      setDavi(daviVal);

      const mainMethod: PaymentMethod =
        cashVal ? "cash" : nequiVal ? "nequi" : "davi";
      setActiveInput(mainMethod);
    } else {
      setCash(0);
      setNequi(0);
      setDavi(0);
      setActiveInput("cash");
    }
  }, [
    open,
    settlingOrder?.id,
    settlingOrder?.statusPayment,
    settlingOrder?.payment?.cash,
    settlingOrder?.payment?.nequi,
    settlingOrder?.payment?.daviplata,
    settlingOrder?.paymentMethod,
    fetchedPayment,
  ]);

  // Intentar recuperar detalle de pago desde reportes si no viene en la orden
  useEffect(() => {
    if (!open) {
      setFetchedPayment(null);
      return;
    }

    const isPaid = settlingOrder?.statusPayment === "Pagado";
    const hasPayment =
      settlingOrder?.payment &&
      Object.values(settlingOrder.payment).some((v) => (v as number) > 0);
    if (!settlingOrder || !isPaid || hasPayment || fetchedPayment || loadingPayment) return;

    const getOrderDate = () => {
      if (settlingOrder.createdAt) return settlingOrder.createdAt.split("T")[0];
      const idTs = Number(String(settlingOrder.id).split("-").pop());
      if (Number.isFinite(idTs)) return new Date(idTs).toISOString().split("T")[0];
      return new Date().toISOString().split("T")[0];
    };

    const orderDate = getOrderDate();

    const parseItems = (val: any) => {
      try {
        const arr = typeof val === "string" ? JSON.parse(val) : val || [];
        if (!Array.isArray(arr)) return [];
        return arr.map((i: any) => ({
          name: String(i.nombre ?? i.name ?? i.producto ?? ""),
          qty: Number(i.cantidad ?? i.qty ?? i.quantity ?? i.q) || 0,
          price: Number(i.precio_unitario ?? i.price ?? i.precio ?? 0) || 0,
        }));
      } catch {
        return [];
      }
    };

    const signature = (items: any): string => {
      const parsed = parseItems(items)
        .filter((i) => i.name)
        .map((i) => `${i.name}|${i.qty}|${i.price}`);
      parsed.sort();
      return parsed.join(";");
    };

    const orderSignature = signature(settlingOrder.items);

    const fetchPayment = async () => {
      try {
        setLoadingPayment(true);
        // Buscar en reportes del día y en todos los reportes
        const candidates = [];
        const resByDate = await getReports(orderDate);
        candidates.push(resByDate);
        const resAll = await getReports();
        candidates.push(resAll);

        // Unificar listas para búsquedas por firma
        const combined: any[] = [];
        for (const res of candidates) {
          const list = Array.isArray(res)
            ? res
            : Array.isArray((res as any)?.data)
            ? (res as any).data
            : [];
          combined.push(...list);
        }

        // 0) Si tenemos firma de ítems, buscamos coincidencia exacta de firma
        if (orderSignature) {
          const sigMatch = combined.find((r) => signature(r.items) === orderSignature);
          if (sigMatch) {
            setFetchedPayment({
              cash: Number(sigMatch.cash ?? 0) || 0,
              nequi: Number(sigMatch.nequi ?? 0) || 0,
              daviplata: Number(sigMatch.davi ?? sigMatch.daviplata ?? 0) || 0,
            });
            return;
          }
        }

        // 1) Intentos por cada respuesta (se mantiene prioridad por fecha primero)
        for (const res of candidates) {
          const list = Array.isArray(res)
            ? res
            : Array.isArray((res as any)?.data)
            ? (res as any).data
            : [];

          // 1) Intento estricto: misma firma de ítems y total
          const strictMatch = list.find((r: any) => {
            const totalMatch = Number(r.total ?? 0) === Number(settlingOrder.total ?? 0);
            if (!totalMatch) return false;
            const sig = signature(r.items);
            if (orderSignature && sig) return sig === orderSignature;
            return false;
          });

          if (strictMatch) {
            setFetchedPayment({
              cash: Number(strictMatch.cash ?? 0) || 0,
              nequi: Number(strictMatch.nequi ?? 0) || 0,
              daviplata: Number(strictMatch.davi ?? strictMatch.daviplata ?? 0) || 0,
            });
            return;
          }

          // 2) Fallback: mejor registro con el mismo total (misma fecha)
          const sameTotal = list.filter(
            (r: any) => Number(r.total ?? 0) === Number(settlingOrder.total ?? 0),
          );

          // Priorizar:
          // a) mismo total y suma exacta, con nequi/davi > 0
          const exactCard = sameTotal.find((r: any) => {
            const cash = Number(r.cash ?? 0) || 0;
            const nequi = Number(r.nequi ?? 0) || 0;
            const davi = Number(r.davi ?? r.daviplata ?? 0) || 0;
            const sum = cash + nequi + davi;
            return sum === Number(settlingOrder.total ?? 0) && (nequi > 0 || davi > 0);
          });

          if (exactCard) {
            setFetchedPayment({
              cash: Number(exactCard.cash ?? 0) || 0,
              nequi: Number(exactCard.nequi ?? 0) || 0,
              daviplata: Number(exactCard.davi ?? exactCard.daviplata ?? 0) || 0,
            });
            return;
          }

          // b) Cualquiera con nequi/davi > 0
          const anyCard = sameTotal.find((r: any) => {
            const nequi = Number(r.nequi ?? 0) || 0;
            const davi = Number(r.davi ?? r.daviplata ?? 0) || 0;
            return nequi > 0 || davi > 0;
          });
          if (anyCard) {
            setFetchedPayment({
              cash: Number(anyCard.cash ?? 0) || 0,
              nequi: Number(anyCard.nequi ?? 0) || 0,
              daviplata: Number(anyCard.davi ?? anyCard.daviplata ?? 0) || 0,
            });
            return;
          }

          // c) Mejor registro con suma más cercana (efectivo)
          const scored = sameTotal
            .map((r: any) => {
              const cash = Number(r.cash ?? 0) || 0;
              const nequi = Number(r.nequi ?? 0) || 0;
              const davi = Number(r.davi ?? r.daviplata ?? 0) || 0;
              const nonZero = [cash, nequi, davi].filter((v) => v > 0).length;
              const sum = cash + nequi + davi;
              const sumDiff = Math.abs(sum - Number(settlingOrder.total ?? 0));
              const score = nonZero * 100 - sumDiff;
              return { cash, nequi, davi, score };
            })
            .sort((a, b) => b.score - a.score);

          const best = scored[0];
          if (best) {
            setFetchedPayment({
              cash: best.cash,
              nequi: best.nequi,
              daviplata: best.davi,
            });
            return;
          }
        }
      } catch {
        // Silenciar: solo es un intento de enriquecer el detalle
      } finally {
        setLoadingPayment(false);
      }
    };

    void fetchPayment();
  }, [open, settlingOrder, fetchedPayment, loadingPayment]);

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
    if (viewOnly) return;
    switch (method) {
      case "cash": setCash(value); break;
      case "nequi": setNequi(value); break;
      case "davi": setDavi(value); break;
    }
  };

  const handleNumpadInput = (key: string) => {
    if (viewOnly) return;
    const current = getInputValue(activeInput).toString();
    const newValue = current === "0" ? key : current + key;
    setInputValue(activeInput, Number(newValue) || 0);
  };

  const handleNumpadBackspace = () => {
    if (viewOnly) return;
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
            <h3 className={styles.title}>
              {viewOnly ? "Detalle de Pago" : settlingOrder ? "Cobrar Deuda" : "Cobrar"}
            </h3>
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
              disabled={!!settlingOrder || viewOnly} 
              className={!!settlingOrder || viewOnly ? "opacity-50 cursor-not-allowed" : ""}
            />
          </div>

          <div className={styles.paymentMethods}>
            <button
              type="button"
              className={`${styles.paymentBox} ${activeInput === "cash" ? styles.active : ""}`}
              onClick={() => !viewOnly && setActiveInput("cash")}
              disabled={viewOnly}
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
              onClick={() => !viewOnly && setActiveInput("nequi")}
              disabled={viewOnly}
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
              onClick={() => !viewOnly && setActiveInput("davi")}
              disabled={viewOnly}
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

        {!viewOnly && (
          <Numpad onInput={handleNumpadInput} onBackspace={handleNumpadBackspace} />
        )}

        <div className={styles.actions}>
          {viewOnly ? (
            <button
              type="button"
              className={`${styles.confirmBtn} ${styles.confirmPaid}`}
              onClick={onClose}
            >
              <span>Cerrar</span>
              <CheckCircle size={20} />
            </button>
          ) : (
            <button
              type="button"
              className={`${styles.confirmBtn} ${isDebtBtn ? styles.confirmPending : styles.confirmPaid}`}
              onClick={handleConfirm}
              disabled={(!settlingOrder && items.length === 0) || submitting}
            >
              <span>{isDebtBtn ? "Guardar Pendiente (Deuda)" : "Confirmar Venta"}</span>
              {isDebtBtn ? <Clock size={20} /> : <CheckCircle size={20} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
