"use client";

import { useState, useEffect } from "react";

export default function BrandShowcase() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function loadBrands() {
      try {
        const res = await fetch(`/api/brands?t=${Date.now()}`, { cache: "no-store" });
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
        {brands.map((b, i) => {
          const isImg =
            typeof b.icon === "string" &&
            (b.icon.startsWith("http://") ||
              b.icon.startsWith("https://") ||
              b.icon.startsWith("/") ||
              b.icon.startsWith("data:image/") ||
              b.icon.includes("/uploads/"));

          return (
            <div
              key={b.id || i}
              style={{
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
                minWidth: 0,
              }}
            >
              <div
                style={{
                  height: "42px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  maxWidth: "100%",
                }}
              >
                {isImg ? (
                  <img
                    src={b.icon}
                    alt={b.name}
                    style={{
                      maxHeight: "38px",
                      maxWidth: "85px",
                      objectFit: "contain",
                      display: "block",
                      filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.15))",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: "1.8rem", lineHeight: 1 }}>{b.icon || "💻"}</span>
                )}
              </div>
              <strong style={{ fontSize: "0.9rem", color: "var(--text-contrast)" }}>{b.name}</strong>
              <span style={{ fontSize: "0.72rem", color: "var(--clr-primary)" }}>{b.desc || "Official Partner"}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
