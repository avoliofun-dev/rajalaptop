"use client";

import Link from "next/link";
import { useSettings } from "@/app/context/SettingsContext";

export default function Footer() {
  const { settings } = useSettings();
  const storeName = settings?.storeName || "RajaLaptop";

  return (
    <footer style={{
      background: "var(--topbar-bg)",
      borderTop: "1px solid var(--glass-border)",
      padding: "3.5rem 0 2rem",
      color: "var(--text-secondary)",
      fontSize: "0.85rem",
      overflowX: "hidden"
    }}>
      <div className="container" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
        gap: "2.5rem",
        marginBottom: "2.5rem"
      }}>
        {/* Col 1 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {settings?.logoUrl ? (
            <Link href="/" style={{ textDecoration: "none", display: "inline-block" }}>
              <img
                key={settings.logoUrl}
                src={settings.logoUrl}
                alt={storeName}
                style={{
                  maxHeight: "48px",
                  maxWidth: "190px",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                  display: "block",
                  filter: "drop-shadow(0 0 1.5px rgba(255, 255, 255, 0.6))",
                }}
              />
            </Link>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-contrast)" }}>
              <span>👑</span>
              <span suppressHydrationWarning>
                {storeName.startsWith("Raja") ? (
                  <>
                    {storeName.slice(0, 4)}
                    <span style={{ color: "var(--clr-primary)" }}>{storeName.slice(4)}</span>
                  </>
                ) : (
                  <span style={{ color: "var(--clr-primary)" }}>{storeName}</span>
                )}
              </span>
            </div>
          )}
          <p style={{ lineHeight: 1.6 }}>
            {settings?.tagline || "Pusat penjualan laptop gaming, ultrabook, workstation, dan aksesoris resmi terbesar di Jawa Tengah & DIY."}
          </p>
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginTop: "0.35rem", flexWrap: "wrap" }}>
            {[
              {
                id: "instagram",
                name: "Instagram",
                icon: "📸",
                url: settings?.instagramUrl || "https://instagram.com/rajalaptop",
                bg: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
              },
              {
                id: "youtube",
                name: "YouTube",
                icon: "▶️",
                url: settings?.youtubeUrl || "https://youtube.com/@rajalaptop",
                bg: "#ff0000",
              },
              {
                id: "tiktok",
                name: "TikTok",
                icon: "🎵",
                url: settings?.tiktokUrl || "https://tiktok.com/@rajalaptop",
                bg: "#000000",
              },
              {
                id: "facebook",
                name: "Facebook",
                icon: "📘",
                url: settings?.facebookUrl || "https://facebook.com/rajalaptop",
                bg: "#1877f2",
              },
            ].map((medsos) => {
              if (!medsos.url) return null;
              return (
                <a
                  key={medsos.id}
                  href={medsos.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Kunjungi kami di ${medsos.name}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    color: "var(--text-contrast)",
                    fontSize: "1.1rem",
                    textDecoration: "none",
                    transition: "all var(--t-fast)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.borderColor = "var(--clr-primary)";
                    e.currentTarget.style.boxShadow = "0 4px 12px var(--clr-primary-glow)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.borderColor = "var(--glass-border)";
                    e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  }}
                >
                  {medsos.icon}
                </a>
              );
            })}
          </div>
        </div>

        {/* Col 2 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <strong style={{ color: "var(--text-contrast)", fontSize: "0.95rem", marginBottom: "0.4rem" }}>Produk Populer</strong>
          {(settings?.footerPopularProducts
            ? settings.footerPopularProducts.split("\n").filter((l) => l.trim())
            : [
                "Laptop Gaming RTX 40",
                "Ultrabook Intel Evo",
                "Apple MacBook Series",
                "PC Custom High-End",
                "Monitor 144Hz & 240Hz",
              ]
          ).map((item, idx) => (
            <a key={idx} href="#katalog" style={{ color: "inherit", textDecoration: "none" }}>
              {item}
            </a>
          ))}
        </div>

        {/* Col 3 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <strong style={{ color: "var(--text-contrast)", fontSize: "0.95rem", marginBottom: "0.4rem" }}>Layanan & Bantuan</strong>
          {(settings?.footerServices
            ? settings.footerServices.split("\n").filter((l) => l.trim() && !l.toLowerCase().includes("tukar tambah") && !l.toLowerCase().includes("cabang") && !l.toLowerCase().includes("lokasi toko"))
            : [
                "Service Center Express",
                "Cek Status Garansi",
                "Konsultasi Spesifikasi Laptop",
                "Panduan Belanja Online",
                "Blog & Review Gadget",
              ]
          ).map((item, idx) => (
            <a key={idx} href="#layanan" style={{ color: "inherit", textDecoration: "none" }}>
              {item}
            </a>
          ))}
        </div>

        {/* Col 4 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <strong style={{ color: "var(--text-contrast)", fontSize: "0.95rem", marginBottom: "0.4rem" }}>Metode Pembayaran</strong>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
            {settings?.footerPaymentNote ||
              "BCA, Mandiri, BNI, BRI, QRIS, GoPay, OVO, ShopeePay, Kredivo, Akulaku, serta Cicilan 0% Kartu Kredit hingga 24 Bulan."}
          </p>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginTop: "0.5rem"
          }}>
            {(settings?.footerPaymentBadges
              ? settings.footerPaymentBadges.split(",").map((b) => b.trim()).filter(Boolean)
              : ["💳 BCA", "💳 Mandiri", "📱 QRIS", "⚡ Cicilan 0%"]
            ).map((badge, idx) => (
              <span key={idx} style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--glass-border)",
                padding: "4px 8px",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.75rem",
                color: "var(--text-contrast)",
                fontWeight: 600
              }}>
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{
        borderTop: "1px solid var(--glass-border)",
        paddingTop: "1.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem",
        fontSize: "0.8rem",
        color: "var(--text-muted)"
      }}>
        <p>
          © 2026 {storeName} Indonesia. {settings?.footerCopyrightText || "Hak Cipta Dilindungi Undang-Undang."}
        </p>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <a href="#" style={{ color: "inherit", textDecoration: "none" }}>
            {settings?.footerPrivacyText || "Kebijakan Privasi"}
          </a>
          <a href="#" style={{ color: "inherit", textDecoration: "none" }}>
            {settings?.footerTermsText || "Syarat & Ketentuan"}
          </a>
        </div>
      </div>
    </footer>
  );
}
