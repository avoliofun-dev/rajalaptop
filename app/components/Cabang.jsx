"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/app/context/SettingsContext";

export default function Cabang() {
  const { settings } = useSettings();
  const storeName = settings?.storeName || "RajaLaptop";

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function loadBranches() {
      try {
        const res = await fetch("/api/branches");
        if (res.ok) {
          const data = await res.json();
          if (!ignore && Array.isArray(data)) {
            setBranches(data);
          }
        }
      } catch (err) {
        console.error("Gagal memuat cabang dari Supabase:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadBranches();
    return () => {
      ignore = true;
    };
  }, []);

  if (loading || branches.length === 0) {
    return null;
  }

  return (
    <section id="cabang" className="container" style={{ padding: "3rem 0 4rem", maxWidth: "100%" }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">Lokasi Toko & Service Center</h2>
          <p className="section-sub">Kunjungi cabang {storeName} terdekat untuk mencoba unit demo secara langsung.</p>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
        gap: "1.5rem",
        width: "100%"
      }}>
        {branches.map((b, i) => (
          <div key={b.id || i} style={{
            background: "var(--bg-surface)",
            border: b.is_hq || b.isHQ ? "1px solid var(--clr-primary)" : "1px solid var(--glass-border)",
            borderRadius: "var(--radius-lg)",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.8rem",
            position: "relative",
            minWidth: 0
          }}>
            {(b.is_hq || b.isHQ) && (
              <span style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                background: "var(--clr-primary)",
                color: "#fff",
                fontSize: "0.65rem",
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: "var(--radius-full)"
              }}>
                HEAD OFFICE
              </span>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.3rem" }}>📍</span>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-contrast)" }}>
                {b.city}
              </h3>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {b.address}
            </p>

            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              {b.phone && <div>📞 {b.phone}</div>}
              {b.hours && <div>⏰ {b.hours}</div>}
            </div>

            {(b.maps_url || b.mapsUrl) && (
              <a
                href={b.maps_url || b.mapsUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  marginTop: "0.5rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "var(--clr-primary)",
                  fontSize: "0.85rem",
                  fontWeight: 600
                }}
              >
                Buka di Google Maps ↗
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
