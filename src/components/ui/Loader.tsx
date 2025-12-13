import styles from "./Loader.module.css";

export function Loader() {
  return <span className={styles.loader} aria-label="cargando" />;
}
