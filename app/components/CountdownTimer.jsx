"use client";

import { useState, useEffect } from "react";
import styles from "./CountdownTimer.module.css";

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 14,
    minutes: 32,
    seconds: 45
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div className={styles.timerWrapper} suppressHydrationWarning>
      <span className={styles.timerLabel}>Berakhir Dalam:</span>
      <div className={styles.boxes} suppressHydrationWarning>
        <div className={styles.box}>
          <span className={styles.num} suppressHydrationWarning>{pad(timeLeft.hours)}</span>
          <span className={styles.unit}>Jam</span>
        </div>
        <span className={styles.colon}>:</span>
        <div className={styles.box}>
          <span className={styles.num} suppressHydrationWarning>{pad(timeLeft.minutes)}</span>
          <span className={styles.unit}>Mnt</span>
        </div>
        <span className={styles.colon}>:</span>
        <div className={styles.box}>
          <span className={styles.num} suppressHydrationWarning>{pad(timeLeft.seconds)}</span>
          <span className={styles.unit}>Dtk</span>
        </div>
      </div>
    </div>
  );
}
