"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CATEGORY_CATALOG } from "@/lib/constants";
import { getProducts } from "@/lib/api";
import type { CartItem, Product } from "@/lib/types";

type ProductsContextValue = {
  categories: typeof CATEGORY_CATALOG;
  products: Product[];
  loading: boolean;
  error?: string;
  refresh: () => Promise<void>;
  applySale: (items: CartItem[]) => void;
  upsertLocal: (product: Product) => void;
};

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const res = await getProducts();
      const merged = [
        ...(res.data?.menu ?? []),
        ...(res.data?.store ?? []),
      ] as Array<Record<string, unknown> | Product>;
      const mapped: Product[] = merged.map((p) => {
        const rec = p as Record<string, unknown>;
        return {
          id: String(rec.id ?? (rec as any).ID ?? crypto.randomUUID()),
          name: String(rec.name ?? (rec as any).n ?? ""),
          price: Number(rec.price ?? (rec as any).p ?? 0),
          stock:
            (rec.stock as number | "" | null) ??
            ((rec as any).s as number | "" | null) ??
            "",
          category: String(rec.category ?? (rec as any).c ?? ""),
          unit:
            (rec.unit as Product["unit"]) ??
            ((rec as any).u as Product["unit"]) ??
            "und",
          consumePerSale: Number(rec.consumePerSale ?? (rec as any).k ?? 1),
          image:
            (rec.image as string | null) ??
            ((rec as any).i as string | null) ??
            ((rec as any).img as string | null) ??
            ((rec as any).imgUrl as string | null) ??
            ((rec as any).img_url as string | null) ??
            ((rec as any).imageUrl as string | null) ??
            ((rec as any).image_url as string | null) ??
            null,
          isCoffee: Boolean(rec.isCoffee ?? false),
        };
      });
      setProducts(mapped);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando productos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const applySale = useCallback((items: CartItem[]) => {
    setProducts((prev) =>
      prev.map((p) => {
        const item = items.find((i) => i.id === p.id);
        if (!item) return p;
        const isInfinite = p.stock === "" || p.stock === null;
        if (isInfinite) return p;
        const consume = item.consumePerSale ?? 1;
        return { ...p, stock: (Number(p.stock) || 0) - item.quantity * consume };
      }),
    );
  }, []);

  const upsertLocal = useCallback((product: Product) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = product;
        return next;
      }
      return [product, ...prev];
    });
  }, []);

  const value = useMemo(
    () => ({
      categories: CATEGORY_CATALOG,
      products,
      loading,
      error,
      refresh,
      applySale,
      upsertLocal,
    }),
    [products, loading, error, refresh, applySale, upsertLocal],
  );

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts debe usarse dentro de ProductsProvider");
  return ctx;
}
