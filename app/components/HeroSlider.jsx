"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/app/context/SettingsContext";
import styles from "./HeroSlider.module.css";

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const { settings } = useSettings();
  const storeName = settings?.storeName || "RajaLaptop";
  const tagline = settings?.tagline || "Pusat Komputer & Laptop Terpercaya";
  const metaDesc = settings?.metaDescription || "Toko resmi laptop gaming, ultrabook, PC rakitan, dan service center bergaransi resmi.";

  // Slides are taken directly from Supabase settings (heroSlides)
  const activeSlides = (Array.isArray(settings?.heroSlides) && settings.heroSlides.length > 0)
    ? settings.heroSlides
    : [
        {
          tag: "OFFICIAL STORE",
          title: storeName,
          highlight: tagline,
          desc: metaDesc,
          ctaText: "Lihat Katalog",
          ctaLink: "#katalog",
          secondaryText: "Hubungi Kami",
          secondaryLink: "#layanan",
          badge: "Garansi Resmi Distributor",
          color: "#3b82f6"
        }
      ];

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % activeSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  const slide = activeSlides[current] || activeSlides[0];

  return (
    <section className={styles.heroSection}>
      <div className={`container ${styles.heroContainer}`}>
        <div className={styles.heroContent}>
          <div className={styles.tagBadge}>
            <span className={styles.dot}></span>
            {slide.tag || "OFFICIAL STORE"}
          </div>
          <h1 className={styles.heroTitle}>
            {slide.title} <br className={styles.desktopBr} />
            <span className={styles.gradientText}>{slide.highlight}</span>
          </h1>

          {/* Custom Banner Image on Mobile if provided */}
          {slide.imageUrl && (
            <div className={styles.mobileBannerImageWrapper}>
              <img src={slide.imageUrl} alt={slide.title} className={styles.mobileBannerImage} />
            </div>
          )}

          <p className={styles.heroDesc}>{slide.desc}</p>
          
          <div className={styles.heroCtas}>
            <a href={slide.ctaLink || "#katalog"} className="btn-primary">
              {slide.ctaText || "Beli Sekarang"} →
            </a>
            <a href={slide.secondaryLink || "#layanan"} className="btn-outline">
              {slide.secondaryText || "Cek Spesifikasi"}
            </a>
          </div>

          {/* Mobile Slider Controls */}
          {activeSlides.length > 1 && (
            <div className={`${styles.sliderControls} ${styles.mobileSliderControls}`}>
              {activeSlides.map((_, idx) => (
                <button
                  key={idx}
                  className={`${styles.indicator} ${idx === current ? styles.active : ""}`}
                  onClick={() => setCurrent(idx)}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          )}

          <div className={styles.heroPerks}>
            <div className={styles.perkItem}>
              <span className={styles.perkIcon}>🛡️</span>
              <div>
                <strong>{slide.badge || "Garansi Resmi 2 Tahun"}</strong>
                <p>100% Produk Original & Bersegel</p>
              </div>
            </div>
            <div className={styles.perkItem}>
              <span className={styles.perkIcon}>⚡</span>
              <div>
                <strong>Same-Day Delivery</strong>
                <p>Area Pengiriman Cepat & Terpercaya</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.visualCard} style={{ borderColor: slide.color || "#3b82f6" }}>
            {slide.imageUrl ? (
              <div className={styles.customImageContainer}>
                <img
                  src={slide.imageUrl}
                  alt={slide.title}
                  className={styles.slideCustomImage}
                />
              </div>
            ) : (
              <div className={styles.laptopMockup}>
                <div className={styles.screen}>
                  <div className={styles.screenGlow} style={{ background: slide.color || "#3b82f6" }}></div>
                  <div className={styles.screenContent}>
                    <div className={styles.brandTag}>{storeName} Flagship</div>
                    <div className={styles.productCode}>{slide.mockupSub || "Pusat Laptop Resmi"}</div>
                    <div className={styles.fpsMeter}>{slide.mockupBadge || "🔥 Unit Bergaransi"}</div>
                  </div>
                </div>
                <div className={styles.keyboardBase}></div>
              </div>
            )}

            {activeSlides.length > 1 && (
              <div className={styles.sliderControls}>
                {activeSlides.map((_, idx) => (
                  <button
                    key={idx}
                    className={`${styles.indicator} ${idx === current ? styles.active : ""}`}
                    onClick={() => setCurrent(idx)}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
