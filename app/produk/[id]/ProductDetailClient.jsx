"use client";

import { useState } from "react";
import Link from "next/link";
import ProductCard from "@/app/components/ProductCard";
import styles from "./ProductDetail.module.css";

export default function ProductDetailClient({ product, relatedProducts = [], storeSettings = {} }) {
  const [activeTab, setActiveTab] = useState("specs");
  const [selectedPackage, setSelectedPackage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isCopied, setIsCopied] = useState(false);

  // Gallery multi-images state
  const rawImages = Array.isArray(product.images)
    ? product.images
    : (typeof product.images === "string" ? (() => { try { return JSON.parse(product.images); } catch { return [product.images]; } })() : []);
  
  const images = (rawImages && rawImages.filter(Boolean).length > 0)
    ? rawImages.filter(Boolean)
    : (product.image_url ? [product.image_url] : []);

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const packages = [
    {
      id: "std",
      name: "Unit Standar",
      desc: "Fullset Original Box, Charger Resmi & Kartu Garansi",
      extraPrice: 0,
    },
    {
      id: "gaming",
      name: "Paket Gamer & Work",
      desc: "Bonus Mouse Wireless Silent, Mousepad XXL, Sleeve Bag",
      extraPrice: 250000,
    },
    {
      id: "pro",
      name: "Paket Pro Performance",
      desc: "Bonus Cooling Pad RGB, Mouse Gaming, Microsoft Office 2024",
      extraPrice: 650000,
    },
  ];

  const currentExtra = packages[selectedPackage]?.extraPrice || 0;
  const unitPrice = (product.price || 0) + currentExtra;
  const totalPrice = unitPrice * quantity;

  const formatMoney = (val) => {
    if (!val && val !== 0) return "Rp 0";
    if (typeof val === "string" && val.trim().startsWith("Rp")) return val;
    const num = Number(String(val).replace(/[^0-9.-]+/g, ""));
    if (isNaN(num)) return typeof val === "string" ? val : "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handleQtyChange = (delta) => {
    const next = quantity + delta;
    if (next >= 1 && next <= (product.stock || 10)) {
      setQuantity(next);
    }
  };

  const handleAddToCart = async () => {
    try {
      const res = await fetch("/api/auth/customer/me");
      if (!res.ok) {
        window.dispatchEvent(
          new CustomEvent("showToast", {
            detail: "🔒 Silakan masuk akun terlebih dahulu untuk menggunakan keranjang!",
          })
        );
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
    } catch {
      window.location.href = "/login";
      return;
    }

    const pkgName = packages[selectedPackage]?.name;
    try {
      const existing = JSON.parse(localStorage.getItem("rajalaptop_cart") || "[]");
      const idx = existing.findIndex(
        (item) => item.productId === product.id && item.package === pkgName
      );
      if (idx >= 0) {
        existing[idx].qty = (existing[idx].qty || 1) + quantity;
      } else {
        existing.push({
          id: `item-${Date.now()}`,
          productId: product.id,
          name: product.name,
          brand: product.brand,
          emoji: product.emoji || "💻",
          package: pkgName,
          price: unitPrice,
          qty: quantity,
        });
      }
      localStorage.setItem("rajalaptop_cart", JSON.stringify(existing));
      const total = existing.reduce((acc, it) => acc + (it.qty || 1), 0);
      window.dispatchEvent(new CustomEvent("cartUpdate", { detail: total }));
    } catch {}

    window.dispatchEvent(
      new CustomEvent("showToast", {
        detail: `🛒 ${quantity}x ${product.name} (${pkgName}) dimasukkan ke keranjang!`,
      })
    );
  };

  const getWaNumber = () => {
    return storeSettings.whatsappNumber || "6281234567890";
  };

  const getWaMessage = () => {
    const pkgName = packages[selectedPackage]?.name;
    const msg = `Halo Admin RajaLaptop, saya tertarik dengan unit ini:
- *Produk:* ${product.name}
- *Brand / Kategori:* ${product.brand} / ${product.category}
- *Pilihan Paket:* ${pkgName}
- *Jumlah:* ${quantity} unit
- *Estimasi Total:* ${formatMoney(totalPrice)}
- *Link:* ${typeof window !== "undefined" ? window.location.href : ""}

Apakah stoknya masih tersedia di cabang terdekat? Terima kasih.`;
    return encodeURIComponent(msg);
  };

  const handleDirectBuy = () => {
    const waUrl = `https://wa.me/${getWaNumber()}?text=${getWaMessage()}`;
    window.open(waUrl, "_blank");
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
      window.dispatchEvent(
        new CustomEvent("showToast", {
          detail: "🔗 Link produk berhasil disalin ke clipboard!",
        })
      );
    }
  };

  const specsList = typeof product.specs === "string" ? product.specs.split(", ") : [];

  return (
    <div className={styles.container}>
      {/* Breadcrumb Navigation */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Beranda</Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        <Link href="/#katalog">Katalog</Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span style={{ textTransform: "capitalize" }}>{product.category || "Laptop"}</span>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbCurrent}>{product.name}</span>
      </nav>

      <div className={styles.mainGrid}>
        {/* Left Column: Media / Showcase */}
        <div className={styles.galleryCard}>
          {product.discount > 0 && (
            <span className={styles.discountTag}>HEMAT {product.discount}%</span>
          )}

          <div className={styles.mainPreview}>
            {images.length > 0 ? (
              <>
                <img
                  src={images[activeImageIdx] || images[0]}
                  alt={`${product.name} - Tampilan ${activeImageIdx + 1}`}
                  className={styles.mainImage}
                  onClick={() => setLightboxOpen(true)}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <span className={styles.zoomBadge} onClick={() => setLightboxOpen(true)}>
                  🔍 Perbesar
                </span>
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Foto Sebelumnya"
                      className={`${styles.navArrowBtn} ${styles.navPrev}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1));
                      }}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      aria-label="Foto Berikutnya"
                      className={`${styles.navArrowBtn} ${styles.navNext}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0));
                      }}
                    >
                      ›
                    </button>
                    <span className={styles.imageCounterBadge}>
                      {activeImageIdx + 1} / {images.length} Foto
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className={styles.mainEmoji}>{product.emoji || "💻"}</span>
            )}
          </div>

          {/* Thumbnail Previews Strip */}
          {images.length > 1 && (
            <div className={styles.thumbnailStrip}>
              {images.map((imgUrl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImageIdx(i)}
                  className={`${styles.thumbnailBtn} ${activeImageIdx === i ? styles.thumbnailBtnActive : ""}`}
                  aria-label={`Lihat Foto ${i + 1}`}
                >
                  <img
                    src={imgUrl}
                    alt={`Thumbnail ${i + 1}`}
                    className={styles.thumbnailImg}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          <div className={styles.badgesRow}>
            <div className={styles.guaranteeBadge}>
              <span className={styles.guaranteeIcon}>🛡️</span>
              <div>
                <strong>Garansi Resmi</strong>
                <div>100% Original BNIB</div>
              </div>
            </div>
            <div className={styles.guaranteeBadge}>
              <span className={styles.guaranteeIcon}>🚚</span>
              <div>
                <strong>Gratis Ongkir</strong>
                <div>Area Jateng & DIY</div>
              </div>
            </div>
            <div className={styles.guaranteeBadge}>
              <span className={styles.guaranteeIcon}>🔄</span>
              <div>
                <strong>Bisa Trade-In</strong>
                <div>Tukar laptop lama</div>
              </div>
            </div>
            <div className={styles.guaranteeBadge}>
              <span className={styles.guaranteeIcon}>🛠️</span>
              <div>
                <strong>Total Care</strong>
                <div>Free repaste & service</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Information & Order Action */}
        <div className={styles.infoCol}>
          <div className={styles.topMeta}>
            <span className={styles.brandBadge}>{product.brand}</span>
            <span className={styles.categoryBadge}>{product.category}</span>
            <button
              onClick={handleShare}
              style={{
                marginLeft: "auto",
                background: "transparent",
                border: "1px solid var(--glass-border)",
                color: "var(--text-secondary)",
                borderRadius: "var(--radius-sm)",
                padding: "4px 8px",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              {isCopied ? "✓ Disalin" : "🔗 Bagikan"}
            </button>
          </div>

          <h1 className={styles.productTitle}>{product.name}</h1>

          <div className={styles.ratingRow}>
            <div className={styles.stars}>
              ⭐ <span>{product.rating || "4.9"}</span>
            </div>
            <span className={styles.soldCount}>
              • {product.sold || "120+"} unit terjual
            </span>
            <div className={styles.stockStatus}>
              <span className={styles.stockDot}></span>
              <span>Tersedia ({product.stock || 5} stok tersisa)</span>
            </div>
          </div>

          {/* Price Box */}
          <div className={styles.priceBox}>
            <div className={styles.priceWrapper}>
              <span className={styles.mainPrice}>{formatMoney(unitPrice)}</span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className={styles.originalPrice}>
                  {formatMoney(product.originalPrice + currentExtra)}
                </span>
              )}
              {product.discount > 0 && (
                <span className={styles.saveAmount}>
                  Hemat {formatMoney((product.originalPrice || 0) - product.price)}
                </span>
              )}
            </div>
            <div className={styles.installmentNote}>
              <span>💳 Cicilan 0% mulai </span>
              <strong style={{ color: "var(--clr-primary)" }}>
                {formatMoney(Math.round(unitPrice / 12))}/bln
              </strong>
              <span> via SPayLater, Kredivo, atau Kartu Kredit</span>
            </div>
          </div>

          {/* Branch Availability */}
          <div className={styles.branchBox}>
            <div className={styles.branchTitle}>
              <span>🏬 Ketersediaan Stok Cabang:</span>
            </div>
            <div className={styles.branchList}>
              <span>📍 Gejayan (Yogyakarta): <span className={styles.branchItemReady}>Ready</span></span>
              <span>📍 Simpang Lima (Semarang): <span className={styles.branchItemReady}>Ready</span></span>
              <span>📍 Slamet Riyadi (Solo): <span className={styles.branchItemReady}>Ready</span></span>
            </div>
          </div>

          {/* Bundling Packages */}
          <div>
            <div className={styles.sectionLabel}>Pilih Paket Pembelian:</div>
            <div className={styles.packageGrid}>
              {packages.map((pkg, idx) => (
                <div
                  key={pkg.id}
                  className={`${styles.packageCard} ${selectedPackage === idx ? styles.selected : ""}`}
                  onClick={() => setSelectedPackage(idx)}
                >
                  <div className={styles.packageName}>{pkg.name}</div>
                  <div className={styles.packageDesc}>{pkg.desc}</div>
                  <div className={styles.packageExtraPrice}>
                    {pkg.extraPrice === 0 ? "Termasuk (Rp 0)" : `+ ${formatMoney(pkg.extraPrice)}`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className={styles.actionSection}>
            <div className={styles.qtyRow}>
              <span style={{ fontSize: "0.88rem", fontWeight: "600", color: "var(--text-secondary)" }}>
                Jumlah Pembelian:
              </span>
              <div className={styles.qtyCounter}>
                <button
                  type="button"
                  className={styles.qtyBtn}
                  onClick={() => handleQtyChange(-1)}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <input
                  type="text"
                  className={styles.qtyInput}
                  value={quantity}
                  readOnly
                />
                <button
                  type="button"
                  className={styles.qtyBtn}
                  onClick={() => handleQtyChange(1)}
                  disabled={quantity >= (product.stock || 10)}
                >
                  +
                </button>
              </div>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginLeft: "auto" }}>
                Subtotal: <strong style={{ color: "var(--text-contrast)" }}>{formatMoney(totalPrice)}</strong>
              </span>
            </div>

            <div className={styles.buttonsGrid}>
              <button
                type="button"
                className={styles.cartBtn}
                onClick={handleAddToCart}
              >
                <span>🛒</span> Tambah ke Keranjang
              </button>
              <button
                type="button"
                className={styles.buyNowBtn}
                onClick={handleDirectBuy}
              >
                <span>⚡</span> Beli Langsung (WhatsApp)
              </button>
            </div>

            <a
              href={`https://wa.me/${getWaNumber()}?text=${getWaMessage()}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.waBtn}
            >
              <span>💬</span> Konsultasi Spesifikasi / Nego via WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Tabs Section: Specs, Description, Warranty, Reviews */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabHeaders}>
          <button
            className={`${styles.tabBtn} ${activeTab === "specs" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("specs")}
          >
            📋 Spesifikasi Teknis
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "desc" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("desc")}
          >
            📝 Deskripsi & Fitur
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "warranty" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("warranty")}
          >
            🛡️ Garansi & Total Care
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "reviews" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            ⭐ Ulasan Pembeli ({product.sold || "120+"})
          </button>
        </div>

        <div className={styles.tabBody}>
          {activeTab === "specs" && (
            <table className={styles.specsTable}>
              <tbody>
                <tr>
                  <td className={styles.specKey}>Nama Model</td>
                  <td className={styles.specVal}>{product.name}</td>
                </tr>
                <tr>
                  <td className={styles.specKey}>Brand Pabrikan</td>
                  <td className={styles.specVal}>{product.brand} Official Indonesia</td>
                </tr>
                <tr>
                  <td className={styles.specKey}>Kategori & Seri</td>
                  <td className={styles.specVal} style={{ textTransform: "capitalize" }}>
                    {product.category} Series
                  </td>
                </tr>
                <tr>
                  <td className={styles.specKey}>Ringkasan Hardware</td>
                  <td className={styles.specVal}>{product.specs}</td>
                </tr>
                {specsList.map((item, idx) => (
                  <tr key={idx}>
                    <td className={styles.specKey}>Komponen #{idx + 1}</td>
                    <td className={styles.specVal}>{item}</td>
                  </tr>
                ))}
                <tr>
                  <td className={styles.specKey}>Sistem Operasi</td>
                  <td className={styles.specVal}>Windows 11 Home 64-bit Original + Office Home & Student Lifetime</td>
                </tr>
                <tr>
                  <td className={styles.specKey}>Garansi Resmi</td>
                  <td className={styles.specVal}>2 Tahun Garansi Resmi Sparepart & Service Nasional</td>
                </tr>
              </tbody>
            </table>
          )}

          {activeTab === "desc" && (
            <div className={styles.descProse}>
              <p>
                <strong>{product.name}</strong> dirancang untuk pengguna yang menginginkan performa tangguh, stabilitas tinggi, serta durabilitas kelas atas. Cocok untuk kebutuhan gaming intensif, rendering video 4K, data science, maupun produktivitas kerja multitasking berat.
              </p>
              <div className={styles.featureList}>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>🚀</div>
                  <div className={styles.featureTitle}>Performa Tanpa Kompromi</div>
                  <div className={styles.featureDesc}>
                    Didukung prosesor dan arsitektur mutakhir untuk respon instan dan FPS tinggi di game-game AAA terbaru.
                  </div>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>❄️</div>
                  <div className={styles.featureTitle}>Sistem Pendingin Superior</div>
                  <div className={styles.featureDesc}>
                    Teknologi dual liquid cooling dan vapor chamber menjaga suhu tetap stabil bahkan saat beban kerja 100%.
                  </div>
                </div>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}>🎨</div>
                  <div className={styles.featureTitle}>Layar Warna Akurat</div>
                  <div className={styles.featureDesc}>
                    Color gamut 100% sRGB / DCI-P3 dengan refresh rate tinggi memberikan visual yang tajam, halus, dan memanjakan mata.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "warranty" && (
            <div>
              <div className={styles.serviceBanner}>
                <div className={styles.serviceBannerTitle}>
                  <span>🌟</span> Layanan RajaLaptop Total Care
                </div>
                <div className={styles.serviceBannerDesc}>
                  Setiap pembelian laptop di RajaLaptop mendapatkan perlindungan ekstra:
                  <ul>
                    <li>Garansi Resmi Distributor Nasional selama 2 Tahun Penuh (Bukan garansi distributor tidak resmi).</li>
                    <li>Gratis 1x Repaste Thermal Paste Grizzly & Pembersihan Debu Kipas dalam 1 tahun pertama.</li>
                    <li>Layanan antar jemput klaim garansi untuk area Yogyakarta, Semarang, dan Solo.</li>
                    <li>Gratis instalasi software standar (Browser, Office, PDF Reader, Media Player, Anti-Virus).</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className={styles.reviewsList}>
              <div className={styles.reviewCard}>
                <div className={styles.reviewHeader}>
                  <span className={styles.reviewerName}>Andi Pratama — Yogyakarta</span>
                  <span className={styles.reviewDate}>2 hari yang lalu</span>
                </div>
                <div style={{ color: "var(--clr-accent)", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
                  ⭐⭐⭐⭐⭐ (Verified Buyer)
                </div>
                <div className={styles.reviewComment}>
                  Barang ori BNIB segel resmi. Pengiriman instan langsung sampai di hari yang sama ke Sleman. Laptop adem banget dipakai render Premiere dan main game lancar jaya!
                </div>
              </div>

              <div className={styles.reviewCard}>
                <div className={styles.reviewHeader}>
                  <span className={styles.reviewerName}>Budi Setiawan — Semarang</span>
                  <span className={styles.reviewDate}>5 hari yang lalu</span>
                </div>
                <div style={{ color: "var(--clr-accent)", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
                  ⭐⭐⭐⭐⭐ (Verified Buyer)
                </div>
                <div className={styles.reviewComment}>
                  Pelayanan store RajaLaptop mantap sekali! Bonus tas dan mousenya juga berkualitas. Admin WhatsApp ramah dan fast response pas konsultasi spek.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && images.length > 0 && (
        <div className={styles.lightboxModal} onClick={() => setLightboxOpen(false)}>
          <button
            type="button"
            className={styles.lightboxCloseBtn}
            onClick={() => setLightboxOpen(false)}
            aria-label="Tutup Pratinjau"
          >
            ✕
          </button>
          <div className={styles.lightboxImageWrapper} onClick={(e) => e.stopPropagation()}>
            <img
              src={images[activeImageIdx] || images[0]}
              alt={product.name}
              className={styles.lightboxImage}
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  className={`${styles.navArrowBtn} ${styles.navPrev}`}
                  style={{ width: "48px", height: "48px", fontSize: "1.5rem" }}
                  onClick={() => setActiveImageIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className={`${styles.navArrowBtn} ${styles.navNext}`}
                  style={{ width: "48px", height: "48px", fontSize: "1.5rem" }}
                  onClick={() => setActiveImageIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                >
                  ›
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div style={{ marginTop: "1rem", color: "#fff", fontSize: "0.85rem", fontWeight: 600 }}>
              Foto {activeImageIdx + 1} dari {images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
