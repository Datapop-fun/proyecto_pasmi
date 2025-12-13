import type { Category, Settings } from "./types";

export const CATEGORY_CATALOG: Category[] = [
  { key: "PARA CALMAR EL FRÍO", icon: "coffee", label: "Para calmar el frío" },
  { key: "PARA REFRESCAR", icon: "snowflake", label: "Para refrescar" },
  { key: "PARA ACOMPAÑAR", icon: "croissant", label: "Para acompañar" },
  { key: "PARA EL BRUNCH", icon: "utensils", label: "Para el brunch" },
  { key: "MÉTODOS DE CAFÉ", icon: "filter", label: "Métodos de café" },
  { key: "Tienda (Panadería)", icon: "store", label: "Tienda · Panadería" },
  { key: "Tienda (Bebidas)", icon: "cup-soda", label: "Tienda · Bebidas" },
  { key: "Tienda (Snacks)", icon: "cookie", label: "Tienda · Snacks" },
  { key: "Tienda (Dulces)", icon: "candy", label: "Tienda · Dulces" },
];

export const DEFAULT_SETTINGS: Settings = {
  name: "",
  nit: "",
  customGoal: 0,
};

export const COLOR_TOKENS = {
  primary: "#A3320B",
  text: "#3D2C2A",
  background: "#F8F7F5",
};
