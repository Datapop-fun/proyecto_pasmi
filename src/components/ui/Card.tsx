import clsx from "classnames";
import styles from "./Card.module.css";

type CardProps = {
  className?: string;
  children: React.ReactNode;
};

export function Card({ className, children }: CardProps) {
  return <div className={clsx(styles.card, className)}>{children}</div>;
}
