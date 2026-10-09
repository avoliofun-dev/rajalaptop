"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/app/context/SettingsContext";

export default function Layanan() {
  const { settings } = useSettings();
  const storeName = settings?.storeName || "RajaLaptop";
  const waNumber = settings?.whatsappNumber || "6281234567890";

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function loadServices() {
      try {
        const res = await fetch("/api/store-services");
        if (res.ok) {
          const data = await res.json();
          if (!ignore && Array.isArray(data)) {
            setServices(data);
          }
        }
      } catch (err) {
        console.error("Gagal memuat layanan dari Supabase:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadServices();
    return () => {
      ignore = true;
    };
  }, []);

  if (loading || services.length === 0) {
    return null;
  }

  return (
    <section id="layanan" className="container" style={{ padding: "3rem 0 4rem", maxWidth: "100%" }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">Layanan Unggulan {storeName}</h2>
          <p className="section-sub">Dukungan purnajual lengkap dari teknisi bersertifikat resmi.</p>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))",
        gap: "1.5rem",
        width: "100%"
      }}>
        {services.map((s, idx) => (
          <div key={s.id || idx} style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-lg)",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.85rem",
            position: "relative",
            minWidth: 0
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span style={{ fontSize: "2.2rem" }}>{s.icon || "🔧"}</span>
              {s.badge && (
                <span style={{
                  background: "hsla(220, 90%, 56%, 0.15)",
                  color: "var(--clr-primary)",
                  border: "1px solid hsla(220, 90%, 56%, 0.3)",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "var(--radius-full)"
                }}>
                  {s.badge}
                </span>
              )}
            </div>

            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-contrast)" }}>
              {s.title}
            </h3>

            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {s.desc}
            </p>

            <a
              href={`https://wa.me/${waNumber}?text=Halo%20${encodeURIComponent(storeName)},%20saya%20mau%20konsultasi%20layanan%20${encodeURIComponent(s.title || "")}`}
              target="_blank"
              rel="noreferrer"
              style={{
                marginTop: "auto",
                color: "var(--clr-primary)",
                fontSize: "0.85rem",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              Hubungi Teknisi →
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
