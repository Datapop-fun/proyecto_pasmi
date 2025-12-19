"use client";

import { useState, useEffect, useCallback } from "react";
import { LogOut, Coffee, Settings as SettingsIcon, DollarSign, Target, Building } from "lucide-react";
import styles from "./ajustes.module.css";
import { useUi } from "@/state/ui";
import {
  addExpense,
  setBase,
  updateCoffeeStock,
  getSettings,
  updateSettings,
  getDailyFinancials,
} from "@/lib/api";
import { useAuth } from "@/state/auth";

const toLocalYmd = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const pickNumber = (...values: Array<unknown>) => {
  for (const v of values) {
    if (v === null || v === undefined) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
};

export default function AjustesPage() {
  const { showToast } = useUi();
  const { logout } = useAuth();
  
  // Estados
  const [baseVal, setBaseVal] = useState("0");
  const [expDesc, setExpDesc] = useState("");
  const [expVal, setExpVal] = useState(0);
  const [coffee, setCoffee] = useState(0);
  const [coffeeStock, setCoffeeStock] = useState(0);
  const [businessName, setBusinessName] = useState("");
  const [businessNit, setBusinessNit] = useState("");
  const [manualGoal, setManualGoal] = useState(0);
  const [smartGoal, setSmartGoal] = useState(0);
  const [expenses, setExpenses] = useState<Array<{ desc: string; val: number }>>([]);
  const [loading, setLoading] = useState(true);

  const applyFinancials = useCallback(
    (financialData: any, fallbackCoffee?: number) => {
      if (!financialData) {
        if (typeof fallbackCoffee === "number") setCoffeeStock(fallbackCoffee);
        setExpenses([]);
        setBaseVal("0");
        return;
      }

      const expensesData = (financialData as any).expenses;
      const parsedExpenses =
        Array.isArray(expensesData)
          ? expensesData
              .map((e: any) => ({
                desc:
                  typeof e?.desc === "string"
                    ? e.desc
                    : String(e?.desc ?? "Egreso"),
                val: Number(e?.val ?? e?.value ?? 0),
              }))
              .filter((e: any) => Number.isFinite(e.val))
          : typeof expensesData === "number"
          ? [{ desc: "Total del dia", val: expensesData }]
          : [];
      setExpenses(parsedExpenses);

      const baseFromSheet = pickNumber(
        financialData?.base,
        financialData?.baseTotal,
        financialData?.base_total,
        financialData?.cashBase,
        financialData?.cajaBase,
      );
      const baseValue = Number.isFinite(baseFromSheet as number) ? (baseFromSheet as number) : 0;
      setBaseVal(String(baseValue));

      const coffeeFromSheet = financialData?.coffeeStock;
      if (typeof coffeeFromSheet === "number") {
        setCoffeeStock(coffeeFromSheet);
      } else if (typeof fallbackCoffee === "number") {
        setCoffeeStock(fallbackCoffee);
      }
    },
    [],
  );

  const refreshFinancials = useCallback(
    async (fallbackCoffee?: number) => {
      try {
        const today = toLocalYmd();
        const res = await getDailyFinancials(today);
        const financialData = res && "data" in res ? (res as any).data : res;
        applyFinancials(financialData, fallbackCoffee);
      } catch {
        // Silenciar error en refresco
      }
    },
    [applyFinancials],
  );

  useEffect(() => {
    const loadSettings = async () => {
      try {
        type SettingsData = Awaited<ReturnType<typeof getSettings>>;

        const [settingsData, financials] = await Promise.all([
          getSettings().catch(() => ({})),
          getDailyFinancials(toLocalYmd()).catch(() => null),
        ]);

        const settings = (settingsData || {}) as SettingsData;
        const financialData =
          financials && "data" in financials ? (financials as any).data : financials;

        applyFinancials(financialData, settings.coffeeStock);
        setBusinessName(settings.name || "");
        setBusinessNit(settings.nit || "");
        setManualGoal(settings.customGoal || 0);
        setSmartGoal(settings.smartGoal || 40318);
      } catch {
        // Usar valores por defecto
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleLogout = () => {
    if (confirm("¿Cerrar Sesión Segura?")) {
      logout();
    }
  };

  const handleBase = async () => {
    try {
      const parsedBase = Number(baseVal);
      if (!Number.isFinite(parsedBase)) {
        showToast("Ingresa un valor válido");
        return;
      }
      await setBase({ value: parsedBase, date: toLocalYmd() });
      await refreshFinancials();
      showToast("Base guardada");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Error guardando base");
    }
  };

  const handleExpense = async () => {
    if (!expDesc || expVal <= 0) {
      showToast("Completa descripción y valor");
      return;
    }
    try {
      await addExpense({ desc: expDesc, value: expVal, date: toLocalYmd() });
      showToast("Egreso guardado");
      setExpDesc("");
      setExpVal(0);
      await refreshFinancials();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Error guardando egreso");
    }
  };

  const handleCoffee = async () => {
    if (coffee <= 0) {
      showToast("Valor inválido");
      return;
    }
    try {
      await updateCoffeeStock({ value: coffee, add: true });
      setCoffeeStock((prev) => prev + coffee);
      showToast("Stock de café actualizado");
      setCoffee(0);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Error actualizando café");
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateSettings({ name: businessName, nit: businessNit, customGoal: manualGoal });
      showToast("Configuración guardada");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Error guardando");
    }
  };

  if (loading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Panel de Control</p>
          <h1>Ajustes del negocio</h1>
          <p className={styles.subtitle}>Administra caja base, egresos, metas y stock de café.</p>
        </div>
      </header>

      <div className={styles.grid}>
        {/* Columna Izquierda: Gestión de Dinero */}
        <div className={styles.column}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <SettingsIcon size={16} />
              <span>Gestión de Dinero</span>
            </div>
            
            <div className={styles.field}>
              <label>Total Caja Base (inicio de día)</label>
              <div className={styles.inputRow}>
                <input
                  type="number"
                  value={baseVal}
                  onChange={(e) => setBaseVal(e.target.value)}
                  placeholder="0"
                />
                <button className={styles.primaryBtn} onClick={handleBase}>
                  Guardar
                </button>
              </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.field}>
              <label>Registrar Egreso (Gasto Diario)</label>
              <div className={styles.expenseRow}>
                <input
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="Descripción (Ej: Hielo)"
                />
                <input
                  type="number"
                  value={expVal || ""}
                  onChange={(e) => setExpVal(Number(e.target.value) || 0)}
                  placeholder="Valor"
                  className={styles.expenseValue}
                />
              </div>
              <button className={styles.expenseBtn} onClick={handleExpense}>
                Registrar Egreso
              </button>
            </div>

            <div className={styles.divider} />

            <div className={styles.expenseList}>
              <label>Egresos de Hoy</label>
              {expenses.length === 0 ? (
                <p className={styles.noExpenses}>Sin egresos hoy</p>
              ) : (
                <ul className={styles.expenseItems}>
                  {expenses.map((e, idx) => (
                    <li key={`${e.desc}-${idx}`} className={styles.expenseItem}>
                      <span>{e.desc}</span>
                      <span className={styles.expenseItemValue}>
                        ${e.val.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha */}
        <div className={styles.column}>
          {/* Datos del Negocio */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Building size={16} />
              <span>Datos del Negocio</span>
            </div>
            
            <div className={styles.field}>
              <label>Nombre del Comercio</label>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ej: Café Pasmi"
              />
            </div>

            <div className={styles.field}>
              <label>NIT / RUT</label>
              <input
                value={businessNit}
                onChange={(e) => setBusinessNit(e.target.value)}
                placeholder="Ej: 900.123.456"
              />
            </div>
          </div>

          {/* Metas de Venta */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Target size={16} />
              <span>Metas de Venta</span>
            </div>
            
            <div className={styles.metaRow}>
              <span>Meta Inteligente</span>
              <strong className={styles.metaValue}>${smartGoal.toLocaleString()}</strong>
            </div>

          <div className={styles.field}>
            <label>Meta Manual</label>
            <input
              type="number"
              value={manualGoal || ""}
              onChange={(e) => setManualGoal(Number(e.target.value) || 0)}
              placeholder="0 = Usar Inteligente"
            />
          </div>

            <button className={styles.primaryBtn} onClick={handleSaveSettings}>
              Guardar Metas
            </button>
          </div>

          {/* Bolsa de Café */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Coffee size={16} />
              <span>Bolsa de Café</span>
            </div>
            
            <div className={styles.coffeeStock}>
              <span>Disponible:</span>
              <strong>{coffeeStock}g</strong>
            </div>

            <div className={styles.coffeeRow}>
              <input
                type="number"
                value={coffee || ""}
                onChange={(e) => setCoffee(Number(e.target.value) || 0)}
                placeholder="Gramos a sumar (Ej: 500)"
              />
              <button className={styles.primaryBtn} onClick={handleCoffee}>
                Recargar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Botón Cerrar Sesión */}
      <button className={styles.logoutBtn} onClick={handleLogout}>
        <LogOut size={20} />
        Cerrar Sesión
      </button>
    </section>
  );
}
