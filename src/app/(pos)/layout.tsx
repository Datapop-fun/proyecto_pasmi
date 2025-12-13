"use client";

import type { ReactNode } from "react";
import styles from "./pos-layout.module.css";
import { Nav } from "@/components/Nav";
import { AppProviders } from "@/state/providers";
import { LoginScreen } from "@/components/LoginScreen";
import { useUi } from "@/state/ui";
import { Toast } from "@/components/ui/Toast";
import { CartDrawer } from "@/components/vender/CartDrawer";
import { PaymentModal } from "@/components/vender/PaymentModal";
import { useAuth } from "@/state/auth";

function PosContent({ children }: { children: ReactNode }) {
  const { isLoggedIn, hydrated } = useAuth();
  const { paymentModal, closePaymentModal } = useUi();

  if (!hydrated) {
    return null; // Evitar flash de contenido
  }

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  return (
    <div className={styles.shell}>
      <Nav />
      <main className={styles.main}>{children}</main>
      <CartDrawer />
      <PaymentModal 
        open={paymentModal.open} 
        onClose={closePaymentModal} 
        settlingOrder={paymentModal.settleOrder}
      />
      <Toast />
    </div>
  );
}

export default function PosLayout({ children }: { children: ReactNode }) {
  return (
    <AppProviders>
      <PosContent>{children}</PosContent>
    </AppProviders>
  );
}
