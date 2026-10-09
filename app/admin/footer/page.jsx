"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSettings } from "@/app/context/SettingsContext";

export default function AdminFooterSettingsPage() {
  const { settings: globalSettings, refreshSettings } = useSettings();
  const [formData, setFormData] = useState({
    storeName: "RajaLaptop",
    tagline: "Pusat Komputer & Laptop Terpercaya Jawa Tengah & DIY",
    instagramUrl: "https://instagram.com/rajalaptop",
    youtubeUrl: "https://youtube.com/@rajalaptop",
    tiktokUrl: "https://tiktok.com/@rajalaptop",
    facebookUrl: "https://facebook.com/rajalaptop",
    footerPopularProducts: "Laptop Gaming RTX 40\nUltrabook Intel Evo\nApple MacBook Series\nPC Custom High-End\nMonitor 144Hz & 240Hz",
    footerServices: "Service Center Express\nCek Status Garansi\nKonsultasi Spesifikasi Laptop\nPanduan Belanja Online\nBlog & Review Gadget",
    footerPaymentNote: "BCA, Mandiri, BNI, BRI, QRIS, GoPay, OVO, ShopeePay, Kredivo, Akulaku, serta Cicilan 0% Kartu Kredit hingga 24 Bulan.",
    footerPaymentBadges: "💳 BCA, 💳 Mandiri, 📱 QRIS, ⚡ Cicilan 0%",
    footerCopyrightText: "Hak Cipta Dilindungi Undang-Undang.",
    footerPrivacyText: "Kebijakan Privasi",
    footerTermsText: "Syarat & Ketentuan",
  });

  const [loading, setLoading] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [authorized, setAuthorized] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const authRes = await fetch("/api/auth/admin/me", { cache: "no-store" });
        if (authRes.ok) {
          const authData = await authRes.json();
          const user = authData.user;
          const canManage = Boolean(
            user?.isSuperAdmin ||
            user?.role === "super_admin" ||
            user?.permissionSlugs?.includes("settings.manage")
          );
          setAuthorized(canManage);
          if (!canManage) {
            setCheckingAuth(false);
            return;
          }
        } else {
          setAuthorized(false);
          setCheckingAuth(false);
          return;
        }

        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setFormData((prev) => ({
            ...prev,
            ...data,
          }));
        }
      } catch (err) {
        console.error("Gagal memuat setting footer:", err);
      } finally {
        setCheckingAuth(false);
      }
    }
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({ ...prev, ...data.settings }));
        if (typeof window !== "undefined") {
          localStorage.setItem("rajalaptop_web_settings", JSON.stringify(data.settings));
          window.dispatchEvent(new Event("settingsUpdated"));
        }
        if (typeof refreshSettings === "function") {
          refreshSettings();
        }
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 3500);
      } else {
        alert("Gagal menyimpan ke server database.");
      }
    } catch (err) {
      console.error("Error menyimpan footer settings:", err);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", color: "var(--text-muted)" }}>
        Memeriksa hak akses pengaturan footer...
      </div>
    );
  }

  if (!authorized) {
    return (
      <div style={{ padding: "3rem 1.5rem", maxWidth: "600px", margin: "2rem auto", textAlign: "center" }}>
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-xl)", padding: "2.5rem 2rem", boxShadow: "var(--shadow-md)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🚫</div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--clr-danger)", margin: "0 0 0.5rem" }}>
            Akses Ditolak
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.5, margin: "0 auto 1.5rem" }}>
            Anda tidak memiliki izin (<code>settings.manage</code>) untuk mengelola pengaturan Footer website.
          </p>
          <Link href="/admin/dashboard" className="btn-primary" style={{ padding: "0.6rem 1.25rem", fontSize: "0.85rem", textDecoration: "none", display: "inline-block" }}>
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "1000px" }}>
      {/* Toast Alert */}
      {savedToast && (
        <div style={{
          position: "fixed",
          top: "80px",
          right: "2rem",
          background: "var(--clr-success)",
          color: "#fff",
          padding: "0.85rem 1.5rem",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-lg)",
          zIndex: 9999,
          fontWeight: 700,
          fontSize: "0.9rem",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <span>💾</span> Pengaturan Footer berhasil diperbarui ke seluruh website!
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-contrast)", display: "flex", alignItems: "center", gap: "10px" }}>
            <span>👣</span> Pengaturan Konten Footer
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
            Kelola seluruh teks, tautan sosial media, daftar produk populer, layanan, catatan metode pembayaran, dan hak cipta di footer pelanggan.
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--glass-border)",
            color: "var(--text-contrast)",
            padding: "0.6rem 1.1rem",
            borderRadius: "var(--radius-md)",
            fontSize: "0.82rem",
            fontWeight: 700,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>👁️</span> Pratinjau Footer Website →
        </Link>
      </div>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
        
        {/* Kolom 1: Profil Toko & Slogan Footer */}
        <div style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--radius-lg)",
          padding: "1.75rem",
        }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-contrast)", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>🏢</span> Kolom 1: Identitas & Deskripsi Singkat Footer
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
            Teks yang tampil di bawah logo utama toko pada bagian kiri footer.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Nama Toko / Brand
              </label>
              <input
                type="text"
                name="storeName"
                value={formData.storeName || ""}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.7rem 0.95rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-contrast)",
                  outline: "none",
                  fontSize: "0.88rem",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Deskripsi / Slogan Footer (Tagline)
              </label>
              <textarea
                rows={3}
                name="tagline"
                value={formData.tagline || ""}
                onChange={handleChange}
                placeholder="Pusat penjualan laptop gaming, ultrabook, workstation, dan aksesoris resmi terbesar..."
                style={{
                  width: "100%",
                  padding: "0.7rem 0.95rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-contrast)",
                  outline: "none",
                  fontSize: "0.88rem",
                  resize: "vertical",
                }}
              />
            </div>
          </div>
        </div>

        {/* Kolom 1 (Bawah): Tautan Media Sosial Resmi */}
        <div style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--radius-lg)",
          padding: "1.75rem",
        }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-contrast)", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>🌐</span> Tombol & Link Akun Media Sosial
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
            Ikon medsos interaktif yang dapat langsung diklik oleh pengunjung website.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                <span>📸</span> Link Instagram
              </label>
              <input
                type="url"
                name="instagramUrl"
                placeholder="https://instagram.com/akunanda"
                value={formData.instagramUrl || ""}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.7rem 0.95rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-contrast)",
                  outline: "none",
                  fontSize: "0.85rem",
                }}
              />
            </div>

            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                <span>▶️</span> Link YouTube Channel
              </label>
              <input
                type="url"
                name="youtubeUrl"
                placeholder="https://youtube.com/@channelanda"
                value={formData.youtubeUrl || ""}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.7rem 0.95rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-contrast)",
                  outline: "none",
                  fontSize: "0.85rem",
                }}
              />
            </div>

            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                <span>🎵</span> Link TikTok
              </label>
              <input
                type="url"
                name="tiktokUrl"
                placeholder="https://tiktok.com/@akunanda"
                value={formData.tiktokUrl || ""}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.7rem 0.95rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-contrast)",
                  outline: "none",
                  fontSize: "0.85rem",
                }}
              />
            </div>

            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                <span>📘</span> Link Facebook
              </label>
              <input
                type="url"
                name="facebookUrl"
                placeholder="https://facebook.com/halamananda"
                value={formData.facebookUrl || ""}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.7rem 0.95rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-contrast)",
                  outline: "none",
                  fontSize: "0.85rem",
                }}
              />
            </div>
          </div>
        </div>

        {/* Kolom 2 & 3: Produk Populer & Layanan Bantuan */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-lg)",
            padding: "1.75rem",
          }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-contrast)", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🔥</span> Kolom 2: Produk Populer
            </h2>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
              Tulis tiap produk pada baris baru (1 baris = 1 menu link).
            </p>

            <textarea
              rows={6}
              name="footerPopularProducts"
              value={formData.footerPopularProducts || ""}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.7rem 0.95rem",
                background: "var(--bg-card)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-contrast)",
                outline: "none",
                fontSize: "0.85rem",
                lineHeight: "1.5",
              }}
            />
          </div>

          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-lg)",
            padding: "1.75rem",
          }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-contrast)", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🛠️</span> Kolom 3: Layanan & Bantuan
            </h2>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
              Tulis tiap layanan pada baris baru (1 baris = 1 menu link).
            </p>

            <textarea
              rows={6}
              name="footerServices"
              value={formData.footerServices || ""}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.7rem 0.95rem",
                background: "var(--bg-card)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-contrast)",
                outline: "none",
                fontSize: "0.85rem",
                lineHeight: "1.5",
              }}
            />
          </div>
        </div>

        {/* Kolom 4: Metode Pembayaran */}
        <div style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--radius-lg)",
          padding: "1.75rem",
        }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-contrast)", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>💳</span> Kolom 4: Metode Pembayaran & Cicilan
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
            Catatan bank pendukung dan badge pembayaran yang diterima di toko.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Deskripsi Bank & Metode Pembayaran
              </label>
              <textarea
                rows={2}
                name="footerPaymentNote"
                value={formData.footerPaymentNote || ""}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.7rem 0.95rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-contrast)",
                  outline: "none",
                  fontSize: "0.85rem",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Badge Pembayaran (pisahkan dengan koma)
              </label>
              <input
                type="text"
                name="footerPaymentBadges"
                placeholder="💳 BCA, 💳 Mandiri, 📱 QRIS, ⚡ Cicilan 0%"
                value={formData.footerPaymentBadges || ""}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.7rem 0.95rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-contrast)",
                  outline: "none",
                  fontSize: "0.85rem",
                }}
              />
            </div>
          </div>
        </div>

        {/* Baris Bawah: Hak Cipta & Kebijakan */}
        <div style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--radius-lg)",
          padding: "1.75rem",
        }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-contrast)", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>⚖️</span> Baris Bawah: Teks Hak Cipta & Dokumen Legal
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
            Pemberitahuan hak cipta tahunan dan tautan kebijakan toko.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Teks Hak Cipta (Copyright)
              </label>
              <input
                type="text"
                name="footerCopyrightText"
                placeholder="Hak Cipta Dilindungi Undang-Undang."
                value={formData.footerCopyrightText || ""}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.7rem 0.95rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-contrast)",
                  outline: "none",
                  fontSize: "0.85rem",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Label Kebijakan Privasi
              </label>
              <input
                type="text"
                name="footerPrivacyText"
                value={formData.footerPrivacyText || "Kebijakan Privasi"}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.7rem 0.95rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-contrast)",
                  outline: "none",
                  fontSize: "0.85rem",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Label Syarat & Ketentuan
              </label>
              <input
                type="text"
                name="footerTermsText"
                value={formData.footerTermsText || "Syarat & Ketentuan"}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.7rem 0.95rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-contrast)",
                  outline: "none",
                  fontSize: "0.85rem",
                }}
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              padding: "0.9rem 2.25rem",
              fontSize: "0.95rem",
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            <span>{loading ? "⏳" : "💾"}</span>
            <span>{loading ? "Menyimpan Perubahan..." : "Simpan Pengaturan Footer"}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
