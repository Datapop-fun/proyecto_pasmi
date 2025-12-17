"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, Calculator, TrendingDown, Wallet, AlertTriangle, Star, Clock } from "lucide-react";
import clsx from "classnames";
import confetti from "canvas-confetti";
import styles from "./informes.module.css";
import { PaymentDonutChart, WeeklyTrendChart, HourlyBarChart } from "@/components/informes/Charts";
import { getInsights, getDailyFinancials, getReports, getProducts } from "@/lib/api";
import type { HourlyPoint, PaymentBreakdown, Product, ReportsPayload } from "@/lib/types";

const formatMoney = (val: number) => `$${Math.round(val).toLocaleString("es-CO")}`;

// --- WIDGETS ---

function SummaryCard({ title, value, sub, type, icon: Icon }: any) {
  const colorClass =
    type === "blue" ? styles.cardBlue : type === "red" ? styles.cardRed : styles.cardGreen;

  const textClass = type === "blue" ? styles.blueText : type === "red" ? styles.redText : styles.greenText;

  return (
    <div className={clsx(styles.cardMetric, colorClass)}>
      <div className={clsx(styles.metricTitle, textClass)}>
        {Icon && <Icon size={16} />}
        {title}
      </div>
      <div className={styles.metricValue}>{value === 0 && type !== "blue" ? "$0" : formatMoney(value)}</div>
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
          <span className={styles.missionLabel}>Mision del dia</span>
          <h3 className={styles.missionTitle}>Superar Promedio Semanal</h3>
          <p className="text-xs opacity-80 mt-1 italic">Vamos por el objetivo!</p>
        </div>
        <div className={styles.missionMeta}>
          <div className={styles.missionPercent}>{percent}%</div>
          <div>Meta: {formatMoney(meta)}</div>
        </div>
      </div>

      <div className={styles.progressTrack}>
        <div className={styles.progressBar} style={{ width: `${visualPercent}%` }} />
      </div>
    </div>
  );
}

function SalesTodayCard({ value }: { value: number }) {
  const [dateStr, setDateStr] = useState("");
  useEffect(() => {
    const date = new Date().toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    setDateStr(date.charAt(0).toUpperCase() + date.slice(1));
  }, []);

  return (
    <div className={styles.salesCard}>
      <div className={styles.salesTitle}>Ventas de Hoy</div>
      <div className={styles.salesValue}>{formatMoney(value)}</div>
      <div className={styles.salesDate}>
        <Calendar size={14} className="mr-1" /> {dateStr}
      </div>
    </div>
  );
}

function TopProductsList({ products }: { products: { name: string; qty: number }[] }) {
  return (
    <div className={styles.topCard}>
      <div className={styles.cardHeader}>Top Productos</div>
      <div className={styles.topList}>
        {products.length === 0 ? (
          <p className="text-gray-400 text-sm text-center mt-10">Sin datos de productos</p>
        ) : (
          products.map((p, i) => (
            <div key={i} className={styles.topItem}>
              <div>
                <span className={styles.topRank}>#{i + 1}</span>
                <span className={styles.topName}>{p.name}</span>
              </div>
              <span className={styles.topQty}>{p.qty} und</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StockAlertsList({ products }: { products: Product[] }) {
  const critical = (products || [])
    .filter((p) => {
      const stock = Number((p as any).stock ?? (p as any).s);
      return !Number.isNaN(stock) && stock <= 5;
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
            <span>Inventario OK</span>
          </div>
        ) : (
          critical.map((p) => (
            <div key={p.id} className={styles.alertItem}>
              <span className={styles.alertName}>{p.name}</span>
              <span className={styles.alertBadge}>{p.stock}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CombosTopList({ combos }: { combos: { combo: string; count: number }[] }) {
  return (
    <div className={styles.combosCard}>
      <div className={clsx(styles.cardHeader, "flex items-center gap-2 !text-yellow-700 !mb-2")}> 
        <Star size={16} />
        <span className="text-sm">Combos Top</span>
      </div>
      {combos.length === 0 ? (
        <p className="text-xs text-yellow-800 opacity-80">Sin datos suficientes</p>
      ) : (
        combos.map((c, idx) => (
          <div key={`${c.combo}-${idx}`} className={styles.comboItem}>
            <span className={styles.comboName}>{c.combo}</span>
            <span className={styles.comboCount}>Vendidos: {c.count}</span>
          </div>
        ))
      )}
    </div>
  );
}

function HourlyChartCard({ data }: { data: HourlyPoint[] }) {
  const hasData = data.length > 0;
  return (
    <div className={styles.hourlyCard}>
      <div className={clsx(styles.cardHeader, "flex items-center gap-2")}> 
        <Clock size={16} className="text-orange-600" />
        <span>Horas Pico</span>
      </div>
      <div className={styles.hourlyBody}>
        {hasData ? (
          <HourlyBarChart labels={data.map((d) => d.hour)} data={data.map((d) => d.value)} />
        ) : (
          <p className="text-sm text-gray-400">Sin datos de horas</p>
        )}
      </div>
    </div>
  );
}

// --- PAGE ---

export default function InformesPage() {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<{ goal: number; meta: number } | null>(null);
  const [financials, setFinancials] = useState<ReportsPayload["summary"] & { payments?: PaymentBreakdown } | null>(null);
  const [stockAlerts, setStockAlerts] = useState<Product[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [hourly, setHourly] = useState<HourlyPoint[]>([]);
  const [combos, setCombos] = useState<Array<{ combo: string; count: number }>>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
  const [currentDate, setCurrentDate] = useState(new Date());

  const toLocalYmd = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const getApiDate = (date: Date) => toLocalYmd(date);

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
      const [y, m, d] = e.target.value.split("-").map(Number);
      setCurrentDate(new Date(y, m - 1, d));
    }
  };

  const normalizeDate = (value?: string | Date) => {
    if (!value) return "";
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        return trimmed.slice(0, 10);
      }
      if (trimmed.includes("T")) {
        return trimmed.split("T")[0];
      }
      if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(trimmed)) {
        const [a, b, c] = trimmed.split("/");
        const year = c.length === 2 ? `20${c}` : c.padStart(4, "0");
        const month = a.padStart(2, "0");
        const day = b.padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
    }
    try {
      const d = new Date(value as any);
      return toLocalYmd(d);
    } catch {
      return String(value).slice(0, 10);
    }
  };

  const getRecordDate = (record: any) =>
    normalizeDate(record?.date ?? record?.createdAt ?? record?.fecha ?? record?.time ?? record?.created_at);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const apiDate = getApiDate(currentDate);
      try {
        const [insRes, finRes, prodRes, repRes] = await Promise.all([
          getInsights(apiDate),
          getDailyFinancials(apiDate),
          getProducts(),
          getReports(apiDate),
        ]);

        const insightsData = ((insRes as any)?.data ?? insRes ?? {}) as any;
        const parsedHourly: HourlyPoint[] = Array.isArray(insightsData.hourly)
          ? insightsData.hourly
              .map((h: any) => ({
                hour: String(h.hour ?? h.label ?? h.time ?? ""),
                value: Number(h.sales ?? h.value ?? h.total ?? 0),
              }))
              .filter((h: HourlyPoint) => h.hour)
          : [];
        setHourly(parsedHourly);
        const parsedCombos = Array.isArray(insightsData.combos)
          ? insightsData.combos
              .map((c: any) => ({
                combo: String(c.combo ?? c.name ?? c.label ?? "Combo"),
                count: Number(c.count ?? c.total ?? 0),
              }))
              .filter((c: any) => Number.isFinite(c.count))
          : [];
        setCombos(parsedCombos);

        const rawGoal = insightsData.goal;
        const rawMeta = insightsData.meta;
        const rawSmartGoal = insightsData.smartGoal ?? null;

        if (finRes?.data) {
          const expensesValue = Array.isArray(finRes.data.expenses)
            ? finRes.data.expenses.reduce((sum: number, e: any) => sum + (Number(e.val ?? e.value ?? e) || 0), 0)
            : finRes.data.expenses ?? 0;

          setFinancials({
            todayTotal: finRes.data.todayTotal ?? 0,
            base: finRes.data.base ?? 0,
            expenses: expensesValue,
            totalInBox:
              finRes.data.totalInBox ??
              (finRes.data.cash ?? 0) +
                (finRes.data.nequi ?? 0) +
                (finRes.data.davi ?? 0) +
                (finRes.data.base ?? 0) -
                expensesValue,
            payments: {
              cash: finRes.data.cash ?? 0,
              nequi: finRes.data.nequi ?? 0,
              daviplata: finRes.data.davi ?? 0,
            },
          });
        } else if (finRes && "todayTotal" in finRes) {
          setFinancials(finRes as any);
        } else {
          setFinancials(null);
        }

        const menu = prodRes?.data?.menu || [];
        const store = prodRes?.data?.store || [];
        const mergedProducts = [...(Array.isArray(menu) ? menu : []), ...(Array.isArray(store) ? store : [])];
        const normalizedAlerts: Product[] = mergedProducts.map((p: any) => ({
          id: String(p.id ?? p.ID ?? crypto.randomUUID()),
          name: String(p.name ?? p.n ?? ""),
          price: Number(p.price ?? p.p ?? 0),
          stock: (p.stock as number | "" | null) ?? (p.s as number | "" | null) ?? "",
          category: String(p.category ?? p.c ?? ""),
          unit: (p.unit as Product["unit"]) ?? (p.u as Product["unit"]) ?? "und",
          consumePerSale: Number(p.consumePerSale ?? p.k ?? 1),
          image:
            (p.image as string | null) ??
            (p.i as string | null) ??
            (p.img as string | null) ??
            (p.imgUrl as string | null) ??
            (p.img_url as string | null) ??
            (p.imageUrl as string | null) ??
            (p.image_url as string | null) ??
            null,
          isCoffee: Boolean(p.isCoffee ?? false),
        }));
        setStockAlerts(normalizedAlerts);

        const rawReports = Array.isArray(repRes) ? repRes : repRes?.data && Array.isArray(repRes.data) ? repRes.data : [];
        setReports(rawReports);

        // insights / meta
        let reportsTotalForDay = 0;
        try {
          reportsTotalForDay = rawReports
            .filter((r) => getRecordDate(r) === apiDate)
            .reduce((sum, r) => sum + (Number(r.total) || 0), 0);
        } catch {
          reportsTotalForDay = 0;
        }

        const todayTotalVal = finRes?.data?.todayTotal ?? (finRes as any)?.todayTotal ?? reportsTotalForDay ?? 0;
        if (rawGoal !== undefined && rawMeta !== undefined) {
          setInsights({ goal: rawGoal, meta: rawMeta } as any);
        } else if (rawSmartGoal) {
          const percent = rawSmartGoal ? Math.round((todayTotalVal / rawSmartGoal) * 100) : 0;
          setInsights({ goal: percent, meta: rawSmartGoal });
        } else {
          setInsights(null);
        }

        processReports(rawReports, apiDate, todayTotalVal);
      } catch (e) {
        console.error("Error loading dashboard data", e);
        setHourly([]);
        setCombos([]);
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

  function processReports(rawReports: any[], dateStr: string, todayOverride?: number) {
    try {
      const productMap: Record<string, number> = {};
      const selected = rawReports.filter((r) => getRecordDate(r) === dateStr);
      selected.forEach((r) => {
        const itemsRaw = r.items;
        const items =
          typeof itemsRaw === "string"
            ? (() => {
                try {
                  const parsed = JSON.parse(itemsRaw);
                  return Array.isArray(parsed) ? parsed : [];
                } catch {
                  return [];
                }
              })()
            : Array.isArray(itemsRaw)
            ? itemsRaw
            : [];

        items.forEach((p: any) => {
          const name = p.nombre ?? p.name;
          if (name) {
            productMap[name] = (productMap[name] || 0) + (Number(p.cantidad ?? p.qty) || 0);
          }
        });
      });
      const sorted = Object.entries(productMap)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);
      setTopProducts(sorted);

      const current = new Date(dateStr);
      const dayIdx = (current.getDay() + 6) % 7; // lunes = 0
      const start = new Date(current);
      start.setDate(current.getDate() - dayIdx);

      const weekDates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        weekDates.push(toLocalYmd(d));
      }

      const weekSet = new Set(weekDates);
      const totalsByDay = rawReports.reduce<Record<string, number>>((acc, r) => {
        const key = getRecordDate(r);
        if (!key || !weekSet.has(key)) return acc;
        const val = Number(r.total ?? r.amount ?? 0);
        acc[key] = (acc[key] ?? 0) + (Number.isFinite(val) ? val : 0);
        return acc;
      }, {});

      if (Number.isFinite(todayOverride) && (todayOverride as number) > 0) {
        totalsByDay[dateStr] = Number(todayOverride);
      }

      const labels = weekDates.map((d) => d.slice(5)); // mm-dd sin reparsear fechas
      const data = weekDates.map((d) => totalsByDay[d] ?? 0);

      setWeeklyTrend({ labels, data });
    } catch (e) {
      console.warn("Error processing reports analytics", e);
    }
  }

  const base = financials?.base || 0;
  const expenses = financials?.expenses || 0;
  const targetDate = getApiDate(currentDate);
  const selectedReports = reports.filter((r) => getRecordDate(r) === targetDate);
  const derivedPayments = selectedReports.reduce(
    (acc, r) => ({
      cash: acc.cash + (Number(r.cash ?? r.efectivo ?? 0) || 0),
      nequi: acc.nequi + (Number(r.nequi ?? 0) || 0),
      davi: acc.davi + (Number(r.davi ?? r.daviplata ?? 0) || 0),
    }),
    { cash: 0, nequi: 0, davi: 0 },
  );
  const derivedTotal = selectedReports.reduce((acc, r) => acc + (Number(r.total) || 0), 0);
  const hasSelectedReports = selectedReports.length > 0;

  const todayTotal = hasSelectedReports ? derivedTotal : financials?.todayTotal ?? derivedTotal;
  const totalBox = todayTotal + base - expenses;
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

  useEffect(() => {
    const override = todayTotal && todayTotal > 0 ? todayTotal : undefined;
    processReports(reports, getApiDate(currentDate), override);
  }, [reports, currentDate, todayTotal]);

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando dashboard...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>

        <div className={styles.dateSelector}>
          <button className={styles.dateBtn} onClick={handlePrevDay}>
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2 px-2 relative">
            <Calendar size={14} className="text-gray-400" />
            <span className="capitalize">{currentDate.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
            <input
              type="date"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              value={getApiDate(currentDate)}
              onChange={handleDateSelect}
            />
          </div>
          <button className={styles.dateBtn} onClick={handleNextDay}>
            <ChevronRight size={16} />
          </button>
        </div>
      </header>

      <div className={styles.grid}>
        <div className={styles.rowSummary}>
          <SummaryCard title="Caja Base" value={base} type="blue" icon={Wallet} />
          <SummaryCard title="Egresos Hoy" value={expenses} type="red" icon={TrendingDown} />
          <SummaryCard
            title="Total en Caja"
            value={totalBox}
            sub="(Ventas + Base - Egresos)"
            type="green"
            icon={Calculator}
          />
        </div>

        <div className={styles.areaMission}>
          {insights ? (
            <MissionBar percent={insights.goal} meta={insights.meta} />
          ) : (
            <div className={clsx(styles.missionBar, "opacity-50 flex items-center justify-center")}>
              Calculando mision...
            </div>
          )}
        </div>

        <div className={styles.columns}>
          <div className={styles.colMain}>
            <div className={styles.rowSales}>
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
                    <div className={clsx(styles.donutLabelValue, styles.textGreen)}>
                      ${(paymentsForChart.cash || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className={styles.donutLabel}>
                    <div className={styles.donutLabelTitle}>NEQUI</div>
                    <div className={clsx(styles.donutLabelValue, styles.textPink)}>
                      ${(paymentsForChart.nequi || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className={styles.donutLabel}>
                    <div className={styles.donutLabelTitle}>DAVI</div>
                    <div className={clsx(styles.donutLabelValue, styles.textOrange)}>
                      ${(paymentsForChart.davi || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.trendCard}>
              <div className={styles.cardHeader}>Tendencia Semanal</div>
              <div className="flex-1 flex items-end pb-4 px-2">
                {weeklyTrend.data.length === 0 ? (
                  <div className="text-sm text-gray-400">Sin datos historicos</div>
                ) : (
                  <WeeklyTrendChart labels={weeklyTrend.labels} data={weeklyTrend.data} />
                )}
              </div>
            </div>

            <div className={styles.hourlyCard}>
              <HourlyChartCard data={hourly} />
            </div>
          </div>

          <div className={styles.colSide}>
            <TopProductsList products={topProducts} />
            <StockAlertsList products={stockAlerts} />
            <CombosTopList combos={combos} />
          </div>
        </div>
      </div>
    </div>
  );
}
