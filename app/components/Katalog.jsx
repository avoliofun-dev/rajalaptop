"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import styles from "./Katalog.module.css";

const categories = [
  { id: "all", label: "🌟 Pilihan Unggulan" },
  { id: "gaming", label: "🎮 Laptop Gaming" },
  { id: "kerja", label: "💼 Kerja & Bisnis" },
  { id: "ultrabook", label: "✨ Ultrabook Tipis" },
  { id: "aksesoris", label: "🎧 Aksesoris & Gear" },
];
export default function Katalog() {
  const [activeTab, setActiveTab] = useState("all");
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDbProducts() {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const active = data.filter((p) => p.status !== "draft");
            setTotalCount(active.length);
            setProducts(active);
          } else {
            setProducts([]);
            setTotalCount(0);
          }
        } else {
          setProducts([]);
          setTotalCount(0);
        }
      } catch (err) {
        console.error("Gagal load produk database:", err);
        setProducts([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    }
    loadDbProducts();
  }, []);

  const activeProducts = products.filter((p) => p.status !== "draft");

  const filtered = (
    activeTab === "all"
      ? activeProducts
      : activeProducts.filter((item) => item.category === activeTab)
  ).slice(0, 8); // LIMIT to maximum 8 featured items on homepage!

  return (
    <section id="katalog" className="container" style={{ padding: "3rem 0 4rem" }}>
      {/* Informative Value Cards (Ringkasan Keunggulan Layanan) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "3rem",
        }}
      >
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-lg)",
            padding: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div style={{ fontSize: "2rem" }}>🛡️</div>
          <div>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-contrast)", margin: 0 }}>
              100% Garansi Resmi
            </h4>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "2px 0 0" }}>
              Garansi vendor resmi 1-3 tahun berstempel authorized distributor
            </p>
          </div>
        </div>

        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-lg)",
            padding: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div style={{ fontSize: "2rem" }}>📦</div>
          <div>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-contrast)", margin: 0 }}>
              Gratis Ongkir & Kayu
            </h4>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "2px 0 0" }}>
              Free packing kayu tebal & asuransi ke seluruh Jawa Tengah & DIY
            </p>
          </div>
        </div>

        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-lg)",
            padding: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div style={{ fontSize: "2rem" }}>⚡</div>
          <div>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-contrast)", margin: 0 }}>
              Pengiriman Cepat & Asuransi
            </h4>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "2px 0 0" }}>
              Packing kayu tebal & asuransi penuh sampai ke tangan Anda dengan aman
            </p>
          </div>
        </div>

        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-lg)",
            padding: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div style={{ fontSize: "2rem" }}>🏪</div>
          <div>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-contrast)", margin: 0 }}>
              4 Cabang Toko Fisik
            </h4>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "2px 0 0" }}>
              Pekalongan, Gejayan Jogja, Semarang, dan Solo siap dikunjungi
            </p>
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="section-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "4px" }}>
            <span style={{ fontSize: "0.75rem", background: "hsla(220, 90%, 56%, 0.15)", color: "var(--clr-primary)", padding: "2px 8px", borderRadius: "var(--radius-full)", fontWeight: 700 }}>
              Kurasi Pilihan Terbaik
            </span>
          </div>
          <h2 className="section-title">Laptop Unggulan & Rekomendasi Terlaris</h2>
          <p className="section-sub">
            {totalCount > 0
              ? `Menampilkan koleksi pilihan utama dari total ${totalCount} unit produk yang terdaftar di katalog.`
              : "Katalog produk laptop dan aksesoris resmi bergaransi."}
          </p>
        </div>

        <Link
          href="/produk"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "var(--bg-card)",
            border: "1px solid var(--glass-border)",
            color: "var(--clr-primary)",
            padding: "0.6rem 1.25rem",
            borderRadius: "var(--radius-full)",
            fontSize: "0.85rem",
            fontWeight: 700,
            textDecoration: "none",
            transition: "all 0.2s ease",
          }}
        >
          <span>{totalCount > 0 ? `Buka Katalog Lengkap (${totalCount} Unit)` : "Buka Katalog Lengkap"}</span>
          <span>➔</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className={styles.tabsContainer}>
        {categories.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tabBtn} ${activeTab === tab.id ? styles.activeTab : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid: Exactly 8 items maximum on Homepage */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-secondary)" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>
          <p>Memuat produk...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3.5rem 1.5rem",
            background: "var(--bg-card)",
            border: "1px dashed var(--glass-border)",
            borderRadius: "var(--radius-xl)",
            margin: "1rem 0",
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📦</div>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-contrast)", marginBottom: "0.5rem" }}>
            Belum Ada Produk Tersedia
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "450px", margin: "0 auto" }}>
            Stok produk saat ini sedang diperbarui. Silakan periksa kembali nanti atau hubungi kami melalui WhatsApp untuk pemesanan khusus.
          </p>
        </div>
      ) : (
        <div className={styles.productGrid}>
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Prominent CTA to Full Catalog */}
      <div
        style={{
          marginTop: "3rem",
          background: "linear-gradient(135deg, hsla(220, 90%, 56%, 0.1) 0%, hsla(260, 80%, 60%, 0.1) 100%)",
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--radius-xl)",
          padding: "2.5rem 1.5rem",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <span style={{ fontSize: "2rem" }}>💻</span>
        <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text-contrast)", margin: 0 }}>
          Mencari Seri atau Spesifikasi Laptop Lainnya?
        </h3>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", maxWidth: "560px", margin: 0 }}>
          {totalCount > 0
            ? <>Kami memiliki lebih dari <strong>{totalCount} pilihan produk</strong> dari ASUS, Lenovo, Apple, HP, Acer, MSI, Logitech, hingga PC Desktop yang lengkap dengan filter spesifikasi.</>
            : <>Jelajahi berbagai pilihan laptop dan komputer dari brand ternama dengan garansi resmi dan promo menarik.</>}
        </p>
        <Link
          href="/produk"
          style={{
            background: "var(--clr-primary)",
            color: "#fff",
            padding: "0.75rem 2rem",
            borderRadius: "var(--radius-full)",
            fontSize: "0.95rem",
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 4px 15px var(--clr-primary-glow)",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            marginTop: "0.5rem",
          }}
        >
          <span>{totalCount > 0 ? `Jelajahi Seluruh Katalog (${totalCount} Unit)` : "Jelajahi Seluruh Katalog"}</span>
          <span>➔</span>
        </Link>
      </div>
    </section>
  );
}
