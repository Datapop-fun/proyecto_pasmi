import clsx from "classnames";
import styles from "./Badge.module.css";

type BadgeProps = {
  children: React.ReactNode;
  tone?: "info" | "success" | "warn";
  className?: string;
};

export function Badge({ children, tone = "info", className }: BadgeProps) {
  return <span className={clsx(styles.badge, styles[tone], className)}>{children}</span>;
}
