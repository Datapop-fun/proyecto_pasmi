import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PASMI POS Next",
  description: "Reescritura de PASMI POS en Next.js + React + TypeScript.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
