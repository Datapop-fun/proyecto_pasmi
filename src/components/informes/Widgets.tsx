"use client";

import clsx from "classnames";
import { TrendingUp, AlertTriangle, TrendingDown, DollarSign } from "lucide-react";
import styles from "../../app/(pos)/informes/informes.module.css";

type SummaryCardProps = {
  title: string;
  value: number;
  sub?: string;
  type: "blue" | "red" | "green";
  icon?: any;
};

const formatMoney = (val: number) => `$${val.toLocaleString("es-CO")}`;

export function SummaryCard({ title, value, sub, type, icon: Icon }: SummaryCardProps) {
  const colorClass = 
    type === "blue" ? styles.cardBlue :
    type === "red" ? styles.cardRed :
    styles.cardGreen;
    
  const textClass = 
    type === "blue" ? styles.blueText :
    type === "red" ? styles.redText :
    styles.greenText;

  return (
    <div className={clsx(styles.cardMetric, colorClass)}>
      <div className={clsx(styles.metricTitle, textClass)}>
        {Icon && <Icon size={14} />}
        {title}
      </div>
      <div className={styles.metricValue}>{value === 0 && type !== 'blue' ? "$0" : formatMoney(value)}</div>
      {sub && <div className={styles.metricSub}>{sub}</div>}
    </div>
  );
}

type MissionBarProps = {
  percent: number;
  meta: number;
};

export function MissionBar({ percent, meta }: MissionBarProps) {
  return (
    <div className={styles.missionBar}>
      <div className={styles.missionHeader}>
        <div>
          <span className={styles.missionLabel}>Misión del día</span>
          <h3 className={styles.missionTitle}>Superar Promedio Semanal</h3>
        </div>
        <div className={styles.missionMeta}>
          <div className={styles.missionPercent}>{percent}%</div>
          <div>Meta: {formatMoney(meta)}</div>
        </div>
      </div>
      
      <div className={styles.progressTrack}>
        <div 
          className={styles.progressBar} 
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      
      <div className={styles.missionFooter}>
        {percent >= 100 ? "¡Excelente trabajo! Objetivo cumplido." : "¡Vamos por el objetivo!"}
      </div>
    </div>
  );
}

// Ventas Hoy Big Card
export function SalesTodayCard({ value }: { value: number }) {
  const date = new Date().toLocaleDateString("es-CO", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const capDate = date.charAt(0).toUpperCase() + date.slice(1);

  return (
    <div className={styles.salesCard}>
      <div className={styles.salesTitle}>Ventas de Hoy</div>
      <div className={styles.salesValue}>{formatMoney(value)}</div>
      <div className={styles.salesDate}>
        📅 {capDate}
      </div>
    </div>
  );
}

export function TopProductsList({ products }: { products: { name: string; qty: number }[] }) {
  return (
    <div className={styles.topCard}>
      <div className={styles.cardHeader}>Top Productos</div>
      <div className={styles.topList}>
        {products.length === 0 ? <p className="text-gray-400 text-sm">Sin datos</p> : 
          products.map((p, i) => (
            <div key={i} className={styles.topItem}>
              <div>
                <span className={styles.topRank}>#{i + 1}</span>
                <span className={styles.topName}>{p.name}</span>
              </div>
              <span className={styles.topQty}>{p.qty} und</span>
            </div>
          ))
        }
      </div>
    </div>
  );
}

export function StockAlertsList({ products }: { products: any[] }) {
  // Filtramos stock crítico (<= 5)
  // Asumimos que products es Product[]
  const critical = products.filter(p => {
      if (p.stock === null || p.stock === "") return false;
      return Number(p.stock) <= 5;
  }).slice(0, 5); // Max 5 alertas

  return (
    <div className={styles.alertsCard}>
      <div className={clsx(styles.cardHeader, "flex items-center gap-2 !text-red-600")}>
        <AlertTriangle size={16} />
        Alertas Stock
      </div>
      <div className={styles.alertsList}>
        {critical.length === 0 ? <p className="text-green-500 text-sm">Stock saludable</p> : 
          critical.map(p => (
            <div key={p.id} className={styles.alertItem}>
              <span className={styles.alertName}>{p.name}</span>
              <span className={styles.alertBadge}>{p.stock}</span>
            </div>
          ))
        }
      </div>
    </div>
  );
}
