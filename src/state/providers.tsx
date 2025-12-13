"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "./auth";
import { SettingsProvider } from "./settings";
import { ProductsProvider } from "./products";
import { CartProvider } from "./cart";
import { UiProvider } from "./ui";
import { OrdersProvider } from "./orders";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <UiProvider>
      <AuthProvider>
        <SettingsProvider>
          <ProductsProvider>
            <CartProvider>
              <OrdersProvider>{children}</OrdersProvider>
            </CartProvider>
          </ProductsProvider>
        </SettingsProvider>
      </AuthProvider>
    </UiProvider>
  );
}
