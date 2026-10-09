"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import ProductCard from "@/app/components/ProductCard";
import Footer from "@/app/components/Footer";
import FloatWA from "@/app/components/FloatWA";
import Toast from "@/app/components/Toast";
import styles from "./KatalogPage.module.css";

const ITEMS_PER_PAGE = 12;

export default function KatalogPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state (mirroring admin filters)
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [ramFilter, setRamFilter] = useState("all");
  const [ssdFilter, setSsdFilter] = useState("all");
  const [processorFilter, setProcessorFilter] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [currentPage, setCurrentPage] = useState(1);

  // Load products from API
  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          if (!ignore) {
            setProducts(Array.isArray(data) ? data : []);
          }
        } else {
          if (!ignore) setProducts([]);
        }
      } catch (err) {
        console.error("Gagal memuat produk dari database:", err);
        if (!ignore) setProducts([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  // Available brands dynamically extracted
  const availableBrands = useMemo(() => {
    const brandsSet = new Set(["ASUS", "Lenovo", "Apple", "MSI", "HP", "Acer", "Dell", "Axioo", "Logitech"]);
    products.forEach((p) => {
      if (p.brand && p.brand.trim()) {
        brandsSet.add(p.brand.trim());
      }
    });
    return Array.from(brandsSet).sort((a, b) => a.localeCompare(b));
  }, [products]);

  // Filtered & Sorted products calculation
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();

    const result = products.filter((p) => {
      // 1. Search query
      const matchesSearch =
        !q ||
        (p.name || "").toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q) ||
        (p.specs || "").toLowerCase().includes(q);

      // 2. Category
      const matchesCategory =
        categoryFilter === "all" ||
        (p.category || "").toLowerCase() === categoryFilter.toLowerCase();

      // 3. Brand
      const matchesBrand =
        brandFilter === "all" ||
        (p.brand || "").toLowerCase() === brandFilter.toLowerCase();

      // Specs full string
      const fullText = `${p.name || ""} ${p.specs || ""}`.toLowerCase();

      // 4. RAM
      let matchesRam = true;
      if (ramFilter === "8GB") matchesRam = /\b8\s*gb\b/i.test(fullText);
      else if (ramFilter === "16GB") matchesRam = /\b16\s*gb\b/i.test(fullText);
      else if (ramFilter === "32GB") matchesRam = /\b32\s*gb\b/i.test(fullText);
      else if (ramFilter === "64GB") matchesRam = /\b64\s*gb\b/i.test(fullText);

      // 5. SSD / Storage
      let matchesSsd = true;
      if (ssdFilter === "256GB") matchesSsd = /\b256\s*gb\b/i.test(fullText);
      else if (ssdFilter === "512GB") matchesSsd = /\b512\s*gb\b/i.test(fullText);
      else if (ssdFilter === "1TB") matchesSsd = /\b1\s*tb\b|\b1024\s*gb\b/i.test(fullText);
      else if (ssdFilter === "2TB") matchesSsd = /\b2\s*tb\b|\b2048\s*gb\b/i.test(fullText);

      // 6. Processor
      let matchesProc = true;
      if (processorFilter === "intel_ultra") {
        matchesProc = /ultra/i.test(fullText);
      } else if (processorFilter === "intel_core") {
        matchesProc = /\b(core\s*i[3579]|i[3579]-|intel\s*core\s*i)/i.test(fullText);
      } else if (processorFilter === "amd_ryzen") {
        matchesProc = /\b(ryzen|amd)/i.test(fullText);
      } else if (processorFilter === "apple_m") {
        matchesProc = /\b(apple\s*m|m[1234]\b)/i.test(fullText);
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesBrand &&
        matchesRam &&
        matchesSsd &&
        matchesProc
      );
    });

    // Sorting
    result.sort((a, b) => {
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;
      const soldA = Number(a.sold) || 0;
      const soldB = Number(b.sold) || 0;
      const ratingA = Number(a.rating) || 0;
      const ratingB = Number(b.rating) || 0;
      const discA = Number(a.discount) || 0;
      const discB = Number(b.discount) || 0;

      if (sortBy === "price_asc") return priceA - priceB;
      if (sortBy === "price_desc") return priceB - priceA;
      if (sortBy === "discount_desc") return discB - discA;
      if (sortBy === "rating_desc") return ratingB - ratingA;
      // Default: popular (sold count desc)
      return soldB - soldA;
    });

    return result;
  }, [
    products,
    search,
    categoryFilter,
    brandFilter,
    ramFilter,
    ssdFilter,
    processorFilter,
    sortBy,
  ]);

  const handleSearchChange = (val) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleCategoryChange = (val) => {
    setCategoryFilter(val);
    setCurrentPage(1);
  };

  const handleBrandChange = (val) => {
    setBrandFilter(val);
    setCurrentPage(1);
  };

  const handleRamChange = (val) => {
    setRamFilter(val);
    setCurrentPage(1);
  };

  const handleSsdChange = (val) => {
    setSsdFilter(val);
    setCurrentPage(1);
  };

  const handleProcessorChange = (val) => {
    setProcessorFilter(val);
    setCurrentPage(1);
  };

  const handleSortChange = (val) => {
    setSortBy(val);
    setCurrentPage(1);
  };

  // Filter count indicator
  const activeFilterCount =
    (categoryFilter !== "all" ? 1 : 0) +
    (brandFilter !== "all" ? 1 : 0) +
    (ramFilter !== "all" ? 1 : 0) +
    (ssdFilter !== "all" ? 1 : 0) +
    (processorFilter !== "all" ? 1 : 0) +
    (search.trim() ? 1 : 0);

  const resetAllFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setBrandFilter("all");
    setRamFilter("all");
    setSsdFilter("all");
    setProcessorFilter("all");
    setSortBy("popular");
    setCurrentPage(1);
  };

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  return (
    <>
      <main className={styles.container}>
        {/* Breadcrumb & Title */}
        <div className={styles.headerSection}>
          <div className={styles.breadcrumb}>
            <Link href="/">Beranda</Link>
            <span>/</span>
            <span>Katalog Produk</span>
          </div>

          <div className={styles.titleRow}>
            <div>
              <h1 className={styles.pageTitle}>
                <span>💻</span> Katalog Laptop & Komputer
              </h1>
              <p className={styles.pageDesc}>
                Pilihan lengkap unit laptop baru, ultrabook, PC gaming, dan aksesoris bergaransi resmi.
              </p>
            </div>
          </div>
        </div>

        {/* ── Filter Card (Sama seperti filter Admin) ── */}
        <div className={styles.filterCard}>
          {/* Row 1: Search & Sorting */}
          <div className={styles.searchRow}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Cari laptop, spesifikasi (RTX, i7, OLED, M3)..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            <div className={styles.sortBox}>
              <select
                className={styles.sortSelect}
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                aria-label="Urutkan Produk"
              >
                <option value="popular">🔥 Terpopuler / Terlaris</option>
                <option value="price_asc">💰 Harga Terendah</option>
                <option value="price_desc">💎 Harga Tertinggi</option>
                <option value="discount_desc">🏷️ Diskon Terbesar</option>
                <option value="rating_desc">⭐ Rating Tertinggi</option>
              </select>
            </div>
          </div>

          {/* Row 2: 5 Dropdown Filters (Kategori, Brand, RAM, SSD, Processor) */}
          <div className={styles.filtersGrid}>
            {/* Kategori */}
            <div className={styles.filterCol}>
              <label className={styles.filterLabel}>Kategori</label>
              <select
                className={styles.selectInput}
                value={categoryFilter}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="all">Semua Kategori</option>
                <option value="gaming">Laptop Gaming</option>
                <option value="kerja">Kerja & Bisnis</option>
                <option value="ultrabook">Ultrabook Tipis</option>
                <option value="pc">PC & Desktop</option>
                <option value="aksesoris">Aksesoris</option>
              </select>
            </div>

            {/* Brand / Merek */}
            <div className={styles.filterCol}>
              <label className={styles.filterLabel}>Merek (Brand)</label>
              <select
                className={styles.selectInput}
                value={brandFilter}
                onChange={(e) => handleBrandChange(e.target.value)}
              >
                <option value="all">Semua Merek</option>
                {availableBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Kapasitas RAM */}
            <div className={styles.filterCol}>
              <label className={styles.filterLabel}>Kapasitas RAM</label>
              <select
                className={styles.selectInput}
                value={ramFilter}
                onChange={(e) => handleRamChange(e.target.value)}
              >
                <option value="all">Semua RAM</option>
                <option value="8GB">8 GB RAM</option>
                <option value="16GB">16 GB RAM</option>
                <option value="32GB">32 GB RAM</option>
                <option value="64GB">64 GB RAM</option>
              </select>
            </div>

            {/* Storage SSD */}
            <div className={styles.filterCol}>
              <label className={styles.filterLabel}>Storage / SSD</label>
              <select
                className={styles.selectInput}
                value={ssdFilter}
                onChange={(e) => handleSsdChange(e.target.value)}
              >
                <option value="all">Semua SSD</option>
                <option value="256GB">256 GB SSD</option>
                <option value="512GB">512 GB SSD</option>
                <option value="1TB">1 TB SSD</option>
                <option value="2TB">2 TB SSD</option>
              </select>
            </div>

            {/* Tipe Prosesor */}
            <div className={styles.filterCol}>
              <label className={styles.filterLabel}>Tipe Prosesor</label>
              <select
                className={styles.selectInput}
                value={processorFilter}
                onChange={(e) => handleProcessorChange(e.target.value)}
              >
                <option value="all">Semua Prosesor</option>
                <option value="intel_core">Intel Core (i3/i5/i7/i9)</option>
                <option value="intel_ultra">Intel Core Ultra</option>
                <option value="amd_ryzen">AMD Ryzen Series</option>
                <option value="apple_m">Apple Silicon (M-Series)</option>
              </select>
            </div>
          </div>

          {/* Row 3: Filter Info & Reset Button */}
          <div className={styles.filterSummary}>
            <div>
              Menampilkan{" "}
              <strong style={{ color: "var(--text-contrast)" }}>
                {filteredProducts.length}
              </strong>{" "}
              produk unit
              {activeFilterCount > 0 && (
                <span className={styles.activeFiltersBadge}>
                  ({activeFilterCount} filter aktif)
                </span>
              )}
            </div>

            {activeFilterCount > 0 && (
              <button
                className={styles.resetBtn}
                onClick={resetAllFilters}
              >
                ✕ Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* ── Products Grid ── */}
        {loading ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>⏳</div>
            <h3 className={styles.emptyTitle}>Memuat Katalog Produk...</h3>
            <p className={styles.emptyText}>Mengambil data laptop dan aksesoris resmi.</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔍</div>
            <h3 className={styles.emptyTitle}>Produk Tidak Ditemukan</h3>
            <p className={styles.emptyText}>
              Tidak ada produk yang cocok dengan kombinasi filter yang dipilih. Silakan ubah filter atau kata kunci pencarian Anda.
            </p>
            <button className={styles.resetBtn} onClick={resetAllFilters}>
              Reset Semua Filter
            </button>
          </div>
        ) : (
          <>
            <div className={styles.productGrid}>
              {paginatedProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  ‹ Sebelumnya
                </button>

                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pg) => {
                  // Only show current, first, last, and near pages
                  if (
                    pg === 1 ||
                    pg === totalPages ||
                    (pg >= currentPage - 1 && pg <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pg}
                        className={`${styles.pageBtn} ${
                          currentPage === pg ? styles.active : ""
                        }`}
                        onClick={() => setCurrentPage(pg)}
                      >
                        {pg}
                      </button>
                    );
                  }
                  if (pg === currentPage - 2 || pg === currentPage + 2) {
                    return <span key={pg} style={{ color: "var(--text-muted)", padding: "0 4px" }}>…</span>;
                  }
                  return null;
                })}

                <button
                  className={styles.pageBtn}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Berikutnya ›
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
      <FloatWA />
      <Toast />
    </>
  );
}
