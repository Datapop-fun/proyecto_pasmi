"use client";

import { useMemo, useState, useEffect } from "react";
import styles from "./vender.module.css";
import { CategoryBar } from "@/components/vender/CategoryBar";
import { ProductGrid } from "@/components/vender/ProductGrid";
import { useProducts } from "@/state/products";


export default function VenderPage() {
  const { categories } = useProducts();
  const [selected, setSelected] = useState<string>("");

  // Set default category when categories load
  useEffect(() => {
    if (categories.length > 0 && !selected) {
      setSelected(categories[0].key);
    }
  }, [categories, selected]);

  return (
    <section className={styles.container}>
      <div className={styles.mainArea}>
        <CategoryBar selected={selected} onSelect={setSelected} />
        <div className={styles.productArea}>
          <ProductGrid category={selected} />
        </div>
      </div>
    </section>
  );
}

