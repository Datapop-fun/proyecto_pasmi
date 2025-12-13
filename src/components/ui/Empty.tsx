import styles from "./Empty.module.css";

type EmptyProps = {
  message: string;
};

export function Empty({ message }: EmptyProps) {
  return (
    <div className={styles.empty}>
      <span>{message}</span>
    </div>
  );
}
