"use client";

import { useState, useEffect } from "react";

export default function Artikel() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function loadArticles() {
      try {
        const res = await fetch("/api/articles");
        if (res.ok) {
          const data = await res.json();
          if (!ignore && Array.isArray(data)) {
            setArticles(data);
          }
        }
      } catch (err) {
        console.error("Gagal memuat artikel dari Supabase:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadArticles();
    return () => {
      ignore = true;
    };
  }, []);

  if (loading || articles.length === 0) {
    return null;
  }

  return (
    <section id="artikel" className="container" style={{ padding: "3rem 0 4rem", maxWidth: "100%" }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">Artikel Edukasi & Review Gadget</h2>
          <p className="section-sub">Dapatkan wawasan teknologi terbaru, tips perawatan, dan rekomendasi spesifikasi.</p>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
        gap: "1.5rem",
        width: "100%"
      }}>
        {articles.map((art) => (
          <article key={art.id} style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            minWidth: 0
          }}>
            <div style={{
              background: "var(--bg-card-inner)",
              padding: "2rem 1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--glass-border)"
            }}>
              <span style={{ fontSize: "2.75rem" }}>{art.icon || "💻"}</span>
              {art.tag && (
                <span style={{
                  background: "hsla(35, 100%, 55%, 0.15)",
                  color: "var(--clr-accent)",
                  border: "1px solid hsla(35, 100%, 55%, 0.3)",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "var(--radius-sm)"
                }}>
                  {art.tag}
                </span>
              )}
            </div>

            <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                <span>{art.date}</span> {art.readTime || art.read_time ? `• ${art.readTime || art.read_time}` : ""}
              </div>

              <h3 style={{ fontSize: "1.02rem", fontWeight: 700, color: "var(--text-contrast)", lineHeight: 1.4, marginBottom: "0.6rem" }}>
                {art.title}
              </h3>

              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "1.25rem" }}>
                {art.summary}
              </p>

              <div style={{
                marginTop: "auto",
                paddingTop: "0.75rem",
                borderTop: "1px solid var(--glass-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "0.8rem"
              }}>
                <span style={{ color: "var(--text-muted)" }}>Oleh {art.author || "Tim Redaksi"}</span>
                <span style={{ color: "var(--clr-primary)", fontWeight: 600, cursor: "pointer" }}>Baca Selengkapnya →</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
