"use client";

import { Pencil, Trash2 } from "lucide-react";
import styles from "./InventoryList.module.css";
import { useProducts } from "@/state/products";
import { useUi } from "@/state/ui";
import { deleteProduct } from "@/lib/api";
import type { Product } from "@/lib/types";

type Props = {
  onEdit: (product: Product) => void;
};

const formatStock = (p: Product) => {
  const infinite = p.stock === "" || p.stock === null;
  const unit = p.unit === "und" ? "und" : p.unit;
  if (infinite) {
    return { text: "Ilimitado", color: "blue" };
  }
  const stock = Number(p.stock);
  if (stock <= 1) {
    return { text: `${stock} ${unit}`, color: "red" };
  }
  if (stock <= 5) {
    return { text: `${stock} ${unit}`, color: "orange" };
  }
  return { text: `${stock} ${unit}`, color: "green" };
};

export function InventoryList({ onEdit }: Props) {
  const { products, loading, error, refresh } = useProducts();
  const { showToast } = useUi();

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar producto?")) return;
    try {
      await deleteProduct({ id });
      showToast("Eliminado");
      void refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Error eliminando");
    }
  };

  if (loading) return <div className={styles.state}>Cargando inventario...</div>;
  if (error) return <div className={styles.state}>Error: {error}</div>;
  if (products.length === 0) return <div className={styles.state}>Sin productos</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Producto / Stock</span>
        <span className={styles.headerActions}>Acciones</span>
      </div>
      <div className={styles.list}>
        {products.map((p) => {
          const stockInfo = formatStock(p);
          const rawImage =
            p.image ??
            (p as any).img ??
            (p as any).i ??
            (p as any).imgUrl ??
            (p as any).img_url ??
            (p as any).imageUrl ??
            (p as any).image_url;
          const imgSrc = rawImage || `https://placehold.co/50x50/A3320B/FFFFFF?text=${p.name.substring(0, 2)}`;
          const consume = p.consumePerSale ?? 1;
          
          return (
            <div key={p.id} className={styles.row}>
              <div className={styles.productInfo}>
                <img
                  src={imgSrc}
                  alt={p.name}
                  className={styles.productImage}
                  width={40}
                  height={40}
                  loading="lazy"
                />
                <div className={styles.productDetails}>
                  <p className={styles.name}>{p.name}</p>
                  <p className={styles.meta}>
                    <span className={styles.category}>{p.category}</span>
                    <span className={styles.separator}>•</span>
                    <span>Stock: </span>
                    <span className={styles[stockInfo.color]}>{stockInfo.text}</span>
                    {consume > 1 && (
                      <span className={styles.consume}> (-{consume}/vta)</span>
                    )}
                  </p>
                </div>
              </div>
              <div className={styles.actions}>
                <button 
                  onClick={() => onEdit(p)} 
                  aria-label="Editar"
                  className={styles.editBtn}
                >
                  <Pencil size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(p.id)} 
                  aria-label="Eliminar"
                  className={styles.deleteBtn}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
