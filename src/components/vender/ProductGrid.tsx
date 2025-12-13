"use client";

import { useMemo } from "react";
import { Minus } from "lucide-react";
import clsx from "classnames";
import styles from "./ProductGrid.module.css";
import type { CategoryKey } from "@/lib/types";
import { useProducts } from "@/state/products";
import { useCart } from "@/state/cart";
import { useUi } from "@/state/ui";

type Props = {
  category: CategoryKey;
};

const formatMoney = (value: number) =>
  `$${value.toLocaleString("es-CO")}`;

const getStockBadge = (stock: number | "" | null, unit: string) => {
  const isInfinite = stock === "" || stock === null;
  if (isInfinite) {
    return { text: "Prep", className: "badgeInf" };
  }
  const numStock = Number(stock);
  const unitDisplay = unit === "und" ? "" : unit;
  if (numStock <= 1) {
    return { text: `Stock: ${numStock} ${unitDisplay}`, className: "badgeCrit" };
  }
  if (numStock <= 5) {
    return { text: `Stock: ${numStock} ${unitDisplay}`, className: "badgeWarn" };
  }
  return { text: `Stock: ${numStock} ${unitDisplay}`, className: "badgeOk" };
};

export function ProductGrid({ category }: Props) {
  const { products, loading, error } = useProducts();
  const { add, decrement, items } = useCart();
  const { showToast } = useUi();

  const filtered = useMemo(
    () => products.filter((p) => p.category === category),
    [products, category],
  );

  if (loading) return <div className={styles.state}>Cargando productos...</div>;
  if (error) return <div className={styles.state}>Error: {error}</div>;
  if (filtered.length === 0) return <div className={styles.state}>Sin productos en esta categoría.</div>;

  const getCartQty = (id: string) => {
    const item = items.find((i) => i.id === id);
    return item ? item.quantity : 0;
  };

  const canAdd = (id: string, consume: number, stock: number | "" | null) => {
    const existing = items.find((i) => i.id === id);
    const qty = existing ? existing.quantity + 1 : 1;
    const isInfinite = stock === "" || stock === null;
    if (isInfinite) return true;
    return qty * consume <= stock;
  };

  const handleAdd = (product: typeof filtered[number]) => {
    const consume = product.consumePerSale ?? 1;
    const stockVal = product.stock;
    if (!canAdd(product.id, consume, stockVal)) {
      showToast(`Stock insuficiente (req: ${consume})`);
      return;
    }
    add(product);
  };

  const handleDecrement = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    decrement(productId);
  };

  return (
    <div className={styles.grid}>
      {filtered.map((product) => {
        const badge = getStockBadge(product.stock, product.unit);
        const cartQty = getCartQty(product.id);
        const imgSrc = product.image || `https://placehold.co/150x150/A3320B/FFFFFF?text=${product.name.substring(0, 3)}`;
        
        return (
          <article 
            key={product.id} 
            className={styles.card} 
            onClick={() => handleAdd(product)}
          >
            <div className={styles.media}>
              <img src={imgSrc} alt={product.name} className={styles.productImage} />
              <div className={clsx(styles.badge, styles[badge.className])}>
                {badge.text}
              </div>
              {cartQty > 0 && (
                <>
                  <div className={styles.qtyOverlay}>{cartQty}</div>
                  <button 
                    className={styles.removeBtn}
                    onClick={(e) => handleDecrement(e, product.id)}
                    aria-label="Quitar uno"
                  >
                    <Minus size={16} />
                  </button>
                </>
              )}
            </div>
            <div className={styles.info}>
              <p className={styles.name}>{product.name}</p>
              <p className={styles.price}>{formatMoney(product.price)}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
