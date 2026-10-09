"use client";

import { useSettings } from "@/app/context/SettingsContext";
import Link from "next/link";
import styles from "./PromoBanner.module.css";

export default function PromoBanner() {
  const { settings } = useSettings();

  // Jika promo bar dinonaktifkan di pengaturan atau tidak ada teks, jangan tampilkan
  if (!settings?.promoBarActive || !settings?.promoBarText) {
    return null;
  }

  return (
    <div className={styles.bannerWrapper}>
      <div className={styles.bannerContainer}>
        <div className={styles.bannerContent}>
          <span className={styles.badge}>
            <span className={styles.pulseDot} />
            🎁 PROMO TOKO
          </span>
          <p className={styles.bannerText}>
            {settings.promoBarText}
          </p>
        </div>
        <div className={styles.bannerActions}>
          <a href="#katalog" className={styles.actionBtn}>
            Lihat Produk Promo ➔
          </a>
        </div>
      </div>
    </div>
  );
}
