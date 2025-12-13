"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Store, Package, BarChart3, Settings } from "lucide-react";
import clsx from "classnames";
import styles from "./Nav.module.css";

const LOGO_URL = "https://ia600704.us.archive.org/15/items/logo-pasmi-nuevo-mesa-de-trabajo-1/Logo%20Pasmi%20nuevo_Mesa%20de%20trabajo%201.png";

const NAV_ITEMS = [
  { href: "/vender", label: "Vender", icon: Store },
  { href: "/inventario", label: "Inventario", icon: Package },
  { href: "/informes", label: "Informes", icon: BarChart3 },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>
        <Image 
          src={LOGO_URL} 
          alt="PASMI" 
          width={48}
          height={48}
          className={styles.logo}
          unoptimized
        />
      </div>
      <div className={styles.links}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(styles.link, active && styles.active)}
            >
              <Icon size={24} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

