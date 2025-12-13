"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, Calculator, TrendingDown, Wallet, AlertTriangle, Star } from "lucide-react";
import clsx from "classnames";
import confetti from "canvas-confetti";
import styles from "./informes.module.css";
import { PaymentDonutChart, WeeklyTrendChart } from "@/components/informes/Charts";
import { getInsights, getDailyFinancials, getReports, getProducts } from "@/lib/api";
import type { PaymentBreakdown, Product, ReportsPayload } from "@/lib/types";

const formatMoney = (val: number) => `$${Math.round(val).toLocaleString("es-CO")}`;

// --- WIDGETS ---

function SummaryCard({ title, value, sub, type, icon: Icon }: any) {
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
        {Icon && <Icon size={16} />}
        {title}
      </div>
      <div className={styles.metricValue}>{value === 0 && type !== 'blue' ? "$0" : formatMoney(value)}</div>
      {sub && <div className={styles.metricSub}>{sub}</div>}
    </div>
  );
}

function MissionBar({ percent, meta }: { percent: number; meta: number }) {
  const visualPercent = Math.min(Math.max(percent, 0), 100);

  return (
    <div className={styles.missionBar}>
      <div className={styles.missionHeader}>
        <div>
          <span className={styles.missionLabel}>Misión del día</span>
          <h3 className={styles.missionTitle}>Superar Promedio Semanal</h3>
          <p className="text-xs opacity-80 mt-1 italic">¡Vamos por el objetivo!</p>
        </div>
        <div className={styles.missionMeta}>
          <div className={styles.missionPercent}>{percent}%</div>
          <div>Meta: {formatMoney(meta)}</div>
        </div>
      </div>
      
      <div className={styles.progressTrack}>
        <div 
          className={styles.progressBar} 
          style={{ width: `${visualPercent}%` }}
        />
      </div>
    </div>
  );
}

function SalesTodayCard({ value }: { value: number }) {
  const [dateStr, setDateStr] = useState("");
  useEffect(() => {
     const date = new Date().toLocaleDateString("es-CO", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
     setDateStr(date.charAt(0).toUpperCase() + date.slice(1));
  }, []);

  return (
    <div className={styles.salesCard}>
      <div className={styles.salesTitle}>Ventas de Hoy</div>
      <div className={styles.salesValue}>{formatMoney(value)}</div>
      <div className={styles.salesDate}>
        <Calendar size={14} className="mr-1"/> {dateStr}
      </div>
    </div>
  );
}

function TopProductsList({ products }: { products: { name: string; qty: number }[] }) {
  return (
    <div className={styles.topCard}>
      <div className={styles.cardHeader}>Top Productos</div>
      <div className={styles.topList}>
        {products.length === 0 ? <p className="text-gray-400 text-sm text-center mt-10">Sin datos de productos</p> : 
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

function StockAlertsList({ products }: { products: Product[] }) {
  const critical = (products || [])
    .filter((p) => {
      const stock = Number((p as any).stock ?? (p as any).s);
      return !isNaN(stock) && stock <= 5;
    })
    .slice(0, 5);

  return (
    <div className={styles.alertsCard}>
      <div className={clsx(styles.cardHeader, "flex items-center gap-2 !text-red-600")}>
        <AlertTriangle size={16} />
        <span className="text-sm">Alertas Stock</span>
      </div>
      <div className={styles.alertsList}>
        {critical.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-green-600 text-sm">
             <span>Stock saludable</span>
          </div>
        ) : 
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

function CombosTopList() {
    return (
        <div className={styles.combosCard}>
            <div className={clsx(styles.cardHeader, "flex items-center gap-2 !text-yellow-700 !mb-2")}>
               <Star size={16} />
               <span className="text-sm">Combos Top</span>
            </div>
            <div className={styles.comboItem}>
                <span className={styles.comboName}>Americano + Capuccino</span>
                <span className={styles.comboCount}>Vendidos: 4</span>
            </div>
        </div>
    )
}

// --- PAGE ---

export default function InformesPage() {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<{ goal: number; meta: number } | null>(null);
  const [financials, setFinancials] = useState<ReportsPayload["summary"] & { payments?: PaymentBreakdown } | null>(null);
  const [stockAlerts, setStockAlerts] = useState<Product[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  
  const [currentDate, setCurrentDate] = useState(new Date());

  const getApiDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
        const [y, m, d] = e.target.value.split('-').map(Number);
        setCurrentDate(new Date(y, m - 1, d));
    }
  };

  const todayStrDisplay = currentDate.toLocaleDateString("es-CO", { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
  });
  const capTodayStr = todayStrDisplay.charAt(0).toUpperCase() + todayStrDisplay.slice(1);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const apiDate = getApiDate(currentDate);
      console.log("Loading dashboard for date:", apiDate);
      try {
        const [insRes, finRes, prodRes, repRes] = await Promise.all([
          getInsights(apiDate),
          getDailyFinancials(apiDate),
          getProducts(),
          getReports(apiDate),
        ]);

        if (insRes?.data) setInsights(insRes.data);
        else if (insRes && "goal" in insRes) setInsights(insRes as any);
        else setInsights(null);

        if (finRes?.data) {
          setFinancials({
            todayTotal: finRes.data.todayTotal ?? 0,
            base: finRes.data.base ?? 0,
            expenses: finRes.data.expenses ?? 0,
            totalInBox:
              finRes.data.totalInBox ??
              (finRes.data.cash ?? 0) +
                (finRes.data.nequi ?? 0) +
                (finRes.data.davi ?? 0) +
                (finRes.data.base ?? 0) -
                (finRes.data.expenses ?? 0),
            payments: {
              cash: finRes.data.cash ?? 0,
              nequi: finRes.data.nequi ?? 0,
              daviplata: finRes.data.davi ?? 0,
            },
          });
        } else if (finRes && "todayTotal" in finRes) {
          setFinancials(finRes as any);
        } else setFinancials(null);

        const menu = prodRes?.data?.menu || [];
        const store = prodRes?.data?.store || [];
        const mergedProducts = [
          ...(Array.isArray(menu) ? menu : []),
          ...(Array.isArray(store) ? store : []),
        ];
        const normalizedAlerts: Product[] = mergedProducts
          .map((p: any) => ({
            id: String(p.id ?? p.ID ?? crypto.randomUUID()),
            name: String(p.name ?? p.n ?? ""),
            price: Number(p.price ?? p.p ?? 0),
            stock: (p.stock as number | "" | null) ?? (p.s as number | "" | null) ?? "",
            category: String(p.category ?? p.c ?? ""),
            unit: (p.unit as Product["unit"]) ?? (p.u as Product["unit"]) ?? "und",
            consumePerSale: Number(p.consumePerSale ?? p.k ?? 1),
            image: (p.image as string | null) ?? (p.i as string | null) ?? null,
            isCoffee: Boolean(p.isCoffee ?? false),
          }));
        setStockAlerts(normalizedAlerts);

        const rawReports = Array.isArray(repRes) ? repRes : (repRes?.data && Array.isArray(repRes.data)) ? repRes.data : [];
        setReports(rawReports);
        processReports(rawReports, apiDate);

      } catch (e) {
        console.error("Error loading dashboard data", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentDate]);

  useEffect(() => {
    const todayStr = getApiDate(new Date());
    if (insights?.goal && insights.goal >= 100 && getApiDate(currentDate) === todayStr) {
      confetti({ particleCount: 90, spread: 65, origin: { y: 0.7 } });
    }
  }, [insights, currentDate]);

  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<{labels: string[], data: number[]}>({labels:[], data:[]});

  const normalizeDate = (value?: string) => {
    if (!value) return "";
    try {
      const iso = new Date(value).toISOString();
      return iso.slice(0, 10);
    } catch {
      return String(value).slice(0, 10);
    }
  };

  function processReports(rawReports: any[], dateStr: string) {
     try {
        const productMap: Record<string, number> = {};
        const selected = rawReports.filter(
          (r) => normalizeDate(r.date) === dateStr,
        );
        selected.forEach((r) => {
          if (typeof r.items === "string") {
            try {
              const parsed = JSON.parse(r.items);
              if (Array.isArray(parsed)) {
                parsed.forEach((p: any) => {
                  if (p.nombre)
                    productMap[p.nombre] =
                      (productMap[p.nombre] || 0) + (Number(p.cantidad) || 0);
                });
              }
            } catch (e) {}
          }
        });
        const sorted = Object.entries(productMap)
            .map(([name, qty]) => ({ name, qty }))
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);
        setTopProducts(sorted);

        const last7 = rawReports
          .filter((r) => r.date)
          .filter(
            (r) =>
              new Date(normalizeDate(r.date)).getTime() <=
              new Date(dateStr).getTime(),
          )
          .sort(
            (a, b) =>
              new Date(normalizeDate(b.date)).getTime() -
              new Date(normalizeDate(a.date)).getTime(),
          )
          .slice(0, 7)
          .reverse();
        setWeeklyTrend({
            labels: last7.map(r => new Date(r.date).toLocaleDateString(undefined, {weekday:'short'})),
            data: last7.map(r => Number(r.total) || 0)
        });

     } catch (e) {
         console.warn("Error processing reports analytics", e);
     }
  }

  useEffect(() => {
    processReports(reports, getApiDate(currentDate));
  }, [reports, currentDate]);

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando dashboard...</div>;

  const base = financials?.base || 0;
  const expenses = financials?.expenses || 0;
  const targetDate = getApiDate(currentDate);
  const selectedReports = reports.filter(
    (r) => normalizeDate(r.date) === targetDate,
  );
  const derivedPayments = selectedReports.reduce(
    (acc, r) => ({
      cash: acc.cash + (Number(r.cash ?? r.efectivo ?? 0) || 0),
      nequi: acc.nequi + (Number(r.nequi ?? 0) || 0),
      davi: acc.davi + (Number(r.davi ?? r.daviplata ?? 0) || 0),
    }),
    { cash: 0, nequi: 0, davi: 0 },
  );
  const derivedTotal = selectedReports.reduce(
    (acc, r) => acc + (Number(r.total) || 0),
    0,
  );
  const hasSelectedReports = selectedReports.length > 0;

  const todayTotal = hasSelectedReports
    ? derivedTotal
    : financials?.todayTotal ?? derivedTotal;
  const totalBox =
    todayTotal + base - expenses;
  const paymentsForChart = {
    cash: hasSelectedReports
      ? derivedPayments.cash
      : financials?.payments?.cash ?? (financials as any)?.cash ?? derivedPayments.cash,
    nequi: hasSelectedReports
      ? derivedPayments.nequi
      : financials?.payments?.nequi ?? (financials as any)?.nequi ?? derivedPayments.nequi,
    davi: hasSelectedReports
      ? derivedPayments.davi
      : financials?.payments?.daviplata ?? (financials as any)?.davi ?? derivedPayments.davi,
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        
        <div className={styles.dateSelector}>
          <button className={styles.dateBtn} onClick={handlePrevDay}><ChevronLeft size={16}/></button>
          <div className="flex items-center gap-2 px-2 relative">
            <Calendar size={14} className="text-gray-400" />
            <span className="capitalize">{capTodayStr}</span>
            <input 
               type="date" 
               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
               value={getApiDate(currentDate)}
               onChange={handleDateSelect}
            />
          </div>
          <button className={styles.dateBtn} onClick={handleNextDay}><ChevronRight size={16}/></button>
        </div>
      </header>

      <div className={styles.grid}>
        <SummaryCard 
          title="Caja Base" 
          value={base} 
          type="blue" 
          icon={Wallet} 
        />
        <SummaryCard 
          title="Egresos Hoy" 
          value={expenses} 
          type="red" 
          icon={TrendingDown} 
        />
        <SummaryCard 
          title="Total en Caja" 
          value={totalBox} 
          sub="(Ventas + Base - Egresos)"
          type="green" 
          icon={Calculator} 
        />

        {insights ? (
          <MissionBar percent={insights.goal} meta={insights.meta} />
        ) : (
             <div className={clsx(styles.missionBar, "opacity-50 flex items-center justify-center")}>
                 Calculando misión...
             </div>
        )}
        
        <SalesTodayCard value={todayTotal} />
        
        <div className={styles.donutCard}>
           <div className={styles.donutContainer}>
             <PaymentDonutChart 
               cash={paymentsForChart.cash}
               nequi={paymentsForChart.nequi}
               davi={paymentsForChart.davi}
             />
           </div>
           <div className={styles.donutLabels}>
             <div className={styles.donutLabel}>
               <div className={styles.donutLabelTitle}>EFEC</div>
               <div className={clsx(styles.donutLabelValue, styles.textGreen)}>${(paymentsForChart.cash||0).toLocaleString()}</div>
             </div>
             <div className={styles.donutLabel}>
               <div className={styles.donutLabelTitle}>NEQUI</div>
               <div className={clsx(styles.donutLabelValue, styles.textPink)}>${(paymentsForChart.nequi||0).toLocaleString()}</div>
             </div>
             <div className={styles.donutLabel}>
               <div className={styles.donutLabelTitle}>DAVI</div>
               <div className={clsx(styles.donutLabelValue, styles.textOrange)}>${(paymentsForChart.davi||0).toLocaleString()}</div>
             </div>
           </div>
        </div>

        <TopProductsList products={topProducts} />

        <div className={styles.trendCard}>
          <div className={styles.cardHeader}>Tendencia Semanal</div>
           <div className="flex-1 flex items-end pb-4 px-2">
            {weeklyTrend.data.length === 0 ? (
              <div className="text-sm text-gray-400">Sin datos históricos</div>
            ) : (
              <WeeklyTrendChart 
                labels={weeklyTrend.labels}
                data={weeklyTrend.data} 
              />
            )}
           </div>
        </div>

        <div className={styles.rightColumn}>
             <StockAlertsList products={stockAlerts} />
             <CombosTopList />
        </div>
      </div>
    </div>
  );
}
