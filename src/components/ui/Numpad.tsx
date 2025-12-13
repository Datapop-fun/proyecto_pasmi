"use client";

import { Delete } from "lucide-react";
import styles from "./Numpad.module.css";

type Props = {
  onInput: (value: string) => void;
  onBackspace: () => void;
};

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["000", "0", "del"],
];

export function Numpad({ onInput, onBackspace }: Props) {
  return (
    <div className={styles.grid}>
      {KEYS.flat().map((key) => {
        if (key === "del") {
          return (
            <button
              key={key}
              type="button"
              className={`${styles.key} ${styles.deleteKey}`}
              onClick={onBackspace}
            >
              <Delete size={24} />
            </button>
          );
        }
        return (
          <button
            key={key}
            type="button"
            className={`${styles.key} ${key === "000" ? styles.specialKey : ""}`}
            onClick={() => onInput(key)}
          >
            {key}
          </button>
        );
      })}
    </div>
  );
}
