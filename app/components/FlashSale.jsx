"use client";

import { useState, useEffect } from "react";
import CountdownTimer from "./CountdownTimer";
import ProductCard from "./ProductCard";

export default function FlashSale() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSaleProducts() {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            // Find products that have discount > 0 and not draft
            const discounted = data.filter((p) => Number(p.discount) > 0 && p.status !== "draft");
            setProducts(discounted.slice(0, 4));
          } else {
            setProducts([]);
          }
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Gagal memuat produk Flash Sale:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    loadSaleProducts();
  }, []);

  // Jika tidak ada produk diskon di database, sembunyikan section Flash Sale
  if (!loading && products.length === 0) {
    return null;
  }

  if (loading) {
    return null;
  }

  return (
    <section id="promo" className="container" style={{ padding: "4rem 0 2rem" }}>
      <div className="section-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🔥</span>
            <h2 className="section-title">Flash Sale Terbatas</h2>
          </div>
          <p className="section-sub">Dapatkan penawaran harga termurah untuk unit terbatas minggu ini!</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <CountdownTimer />
          <a href="#katalog" className="btn-see-all">Lihat Semua Promo →</a>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "1.5rem",
        marginTop: "1.5rem"
      }}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
