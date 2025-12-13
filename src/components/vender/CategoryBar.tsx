"use client";

import { useMemo } from "react";
import { 
  Coffee, 
  Snowflake, 
  Croissant, 
  Utensils, 
  Filter, 
  Store, 
  CupSoda, 
  Cookie, 
  Candy 
} from "lucide-react";
import clsx from "classnames";
import styles from "./CategoryBar.module.css";
import type { CategoryKey } from "@/lib/types";
import { useProducts } from "@/state/products";

type Props = {
  selected: CategoryKey;
  onSelect: (key: CategoryKey) => void;
};

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  coffee: Coffee,
  snowflake: Snowflake,
  croissant: Croissant,
  utensils: Utensils,
  filter: Filter,
  store: Store,
  "cup-soda": CupSoda,
  cookie: Cookie,
  candy: Candy,
};

export function CategoryBar({ selected, onSelect }: Props) {
  const { categories } = useProducts();
  const cats = useMemo(() => categories, [categories]);

  return (
    <div className={styles.bar}>
      {cats.map((cat) => {
        const Icon = ICON_MAP[cat.icon] || Coffee;
        return (
          <button
            key={cat.key}
            onClick={() => onSelect(cat.key)}
            className={clsx(styles.cat, selected === cat.key && styles.active)}
          >
            <Icon size={24} className={styles.icon} />
            <span className={styles.label}>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
}
