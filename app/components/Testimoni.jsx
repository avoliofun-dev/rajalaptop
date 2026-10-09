"use client";

import { useState, useEffect } from "react";

export default function Testimoni() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function loadTestimonials() {
      try {
        const res = await fetch("/api/testimonials");
        if (res.ok) {
          const data = await res.json();
          if (!ignore && Array.isArray(data)) {
            setReviews(data);
          }
        }
      } catch (err) {
        console.error("Gagal memuat testimoni dari Supabase:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadTestimonials();
    return () => {
      ignore = true;
    };
  }, []);

  if (loading || reviews.length === 0) {
    return null;
  }

  return (
    <section className="container" style={{ padding: "3rem 0 4rem", maxWidth: "100%" }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">Apa Kata Pelanggan Kami?</h2>
          <p className="section-sub">Ulasan nyata dari pelanggan toko.</p>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
        gap: "1.5rem",
        width: "100%"
      }}>
        {reviews.map((r, i) => (
          <div key={r.id || i} style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-lg)",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.85rem",
            minWidth: 0
          }}>
            <div style={{ color: "var(--clr-accent)", fontSize: "1.1rem" }}>
              {"★".repeat(Math.max(1, Math.min(5, Number(r.rating) || 5)))}
            </div>

            <p style={{
              fontSize: "0.88rem",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              fontStyle: "italic",
              flex: 1
            }}>
              "{r.text}"
            </p>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              paddingTop: "0.75rem",
              borderTop: "1px solid var(--glass-border)"
            }}>
              <span style={{ fontSize: "1.8rem" }}>{r.avatar || "👤"}</span>
              <div>
                <strong style={{ display: "block", color: "var(--text-contrast)", fontSize: "0.88rem" }}>{r.name}</strong>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{r.role || "Pelanggan Terverifikasi"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
