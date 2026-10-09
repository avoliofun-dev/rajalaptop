"use client";

import { useState, useEffect } from "react";

export default function BrandShowcase() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function loadBrands() {
      try {
        const res = await fetch("/api/brands");
        if (res.ok) {
          const data = await res.json();
          if (!ignore && Array.isArray(data)) {
            setBrands(data);
          }
        }
      } catch (err) {
        console.error("Gagal memuat brands dari database Supabase:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadBrands();
    return () => {
      ignore = true;
    };
  }, []);

  if (loading || brands.length === 0) {
    return null;
  }

  return (
    <section id="toko" className="container" style={{ padding: "2rem 0 3.5rem", maxWidth: "100%" }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">Brand Resmi & Official Partner</h2>
          <p className="section-sub">Semua unit 100% Bergaransi Resmi Distributor Indonesia (TAM, Datascrip, Synnex, dll).</p>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 140px), 1fr))",
        gap: "0.85rem",
        width: "100%"
      }}>
        {brands.map((b, i) => (
          <div key={b.id || i} style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-md)",
            padding: "1.1rem 0.85rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.4rem",
            transition: "all var(--t-fast)",
            cursor: "pointer",
            minWidth: 0
          }}>
            <span style={{ fontSize: "1.8rem" }}>{b.icon || "💻"}</span>
            <strong style={{ fontSize: "0.9rem", color: "var(--text-contrast)" }}>{b.name}</strong>
            <span style={{ fontSize: "0.72rem", color: "var(--clr-primary)" }}>{b.desc || "Official Partner"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
