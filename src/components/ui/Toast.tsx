"use client";

import { useUi } from "@/state/ui";
import styles from "./Toast.module.css";

export function Toast() {
  const { toasts } = useUi();

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <div key={toast.id} className={styles.toast}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
