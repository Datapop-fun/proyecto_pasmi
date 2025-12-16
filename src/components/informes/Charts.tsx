"use client";

import dynamic from "next/dynamic";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  BarElement,
} from "chart.js";

// Registrar componentes globalmente (safe en top level client module)
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  BarElement
);

// Dynamic imports para evitar SSR error con Canvas
const Line = dynamic(() => import("react-chartjs-2").then((mod) => mod.Line), {
  ssr: false,
});
const Doughnut = dynamic(
  () => import("react-chartjs-2").then((mod) => mod.Doughnut),
  { ssr: false }
);
const Bar = dynamic(() => import("react-chartjs-2").then((mod) => mod.Bar), {
  ssr: false,
});

type WeeklyTrendProps = {
  labels: string[];
  data: number[];
};

export function WeeklyTrendChart({ labels, data }: WeeklyTrendProps) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 10 },
          callback: function (_: any, idx: number) {
            return labels[idx] ?? "";
          },
        },
      },
      y: {
        border: { display: false },
        grid: { color: "#f1f5f9" },
        ticks: { font: { size: 10 }, beginAtZero: true },
        suggestedMin: 0,
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  };

  const chartData = {
    labels,
    datasets: [
      {
        fill: true,
        label: "Ventas",
        data,
        borderColor: "#c2410c", // Naranja quemado del tema
        backgroundColor: "rgba(234, 88, 12, 0.1)", // Naranja transparente
        tension: 0.4, // Curva suave
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  return <Line options={options} data={chartData} />;
}

type PaymentDonutProps = {
  cash: number;
  nequi: number;
  davi: number;
};

export function PaymentDonutChart({ cash, nequi, davi }: PaymentDonutProps) {
  const data = {
    labels: ["Efectivo", "Nequi", "Daviplata"],
    datasets: [
      {
        data: [cash, nequi, davi],
        backgroundColor: [
          "#22c55e", // Green
          "#ec4899", // Pink (Nequi)
          "#f97316", // Orange (Davi)
        ],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    cutout: "70%",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const val = context.raw;
            return `$${val.toLocaleString("es-CO")}`;
          },
        },
      },
    },
    maintainAspectRatio: false,
  };

  return <Doughnut data={data} options={options} />;
}

type HourlyBarProps = {
  labels: string[];
  data: number[];
};

export function HourlyBarChart({ labels, data }: HourlyBarProps) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.raw} ventas`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#f1f5f9" },
        ticks: { stepSize: 1, font: { size: 10 } },
      },
    },
  };

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: "rgba(163, 50, 11, 0.7)",
        borderRadius: 6,
      },
    ],
  };

  return <Bar options={options} data={chartData} />;
}
