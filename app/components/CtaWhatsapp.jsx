"use client";

import { useSettings } from "@/app/context/SettingsContext";

export default function CtaWhatsapp() {
  const { settings } = useSettings();
  const storeName = settings?.storeName || "RajaLaptop";
  const waNumber = settings?.whatsappNumber || "6281234567890";

  return (
    <section className="container" style={{ padding: "2rem 0 3.5rem" }}>
      <div style={{
        background: "linear-gradient(135deg, hsl(220, 35%, 15%) 0%, hsl(220, 45%, 22%) 100%)",
        border: "1px solid var(--clr-primary-glow)",
        borderRadius: "var(--radius-xl)",
        padding: "3rem 1.5rem",
        textAlign: "center",
        boxShadow: "var(--shadow-glow)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.25rem",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "hsla(142, 70%, 42%, 0.15)",
          color: "hsl(142, 75%, 45%)",
          border: "1px solid hsla(142, 70%, 42%, 0.35)",
          fontSize: "0.8rem",
          fontWeight: 700,
          padding: "4px 14px",
          borderRadius: "var(--radius-full)"
        }}>
          💬 Customer Care 24/7
        </div>

        <h2 style={{
          fontSize: "clamp(1.5rem, 3.5vw, 2.3rem)",
          fontWeight: 800,
          color: "#ffffff",
          maxWidth: "680px",
          lineHeight: 1.25
        }}>
          Butuh Rekomendasi Laptop Sesuai Kebutuhan & Budget Anda?
        </h2>

        <p style={{
          color: "rgba(255, 255, 255, 0.85)",
          fontSize: "0.95rem",
          maxWidth: "560px",
          lineHeight: 1.6
        }}>
          Konsultasikan langsung dengan tim konsultan hardware {storeName} via WhatsApp. Gratis, tanpa biaya, dan dapatkan penawaran diskon khusus hari ini.
        </p>

        <a
          href={`https://wa.me/${waNumber}?text=Halo%20${encodeURIComponent(storeName)},%20saya%20ingin%20konsultasi%20pembelian%20laptop`}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.6rem",
            background: "var(--clr-wa)",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "0.95rem",
            padding: "0.85rem 2rem",
            borderRadius: "var(--radius-full)",
            boxShadow: "0 4px 20px hsla(142, 70%, 42%, 0.4)",
            transition: "transform var(--t-fast)",
            textDecoration: "none"
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>💬</span>
          Chat WhatsApp Sekarang
        </a>
      </div>
    </section>
  );
}
