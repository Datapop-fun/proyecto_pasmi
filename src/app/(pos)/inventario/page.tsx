"use client";

import { useState } from "react";
import styles from "../views.module.css";
import layoutStyles from "./inventario.module.css";
import { InventoryForm } from "@/components/inventario/InventoryForm";
import { InventoryList } from "@/components/inventario/InventoryList";
import type { Product } from "@/lib/types";

export default function InventarioPage() {
  const [editing, setEditing] = useState<Product | null>(null);

  return (
    <section className={styles.view}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Inventario</p>
          <h1>CRUD de productos y stock.</h1>
        </div>
      </header>
      <div className={layoutStyles.grid}>
        <InventoryForm
          editing={editing}
          onSaved={() => {
            setEditing(null);
          }}
        />
        <InventoryList onEdit={(p) => setEditing(p)} />
      </div>
    </section>
  );
}
