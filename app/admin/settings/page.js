"use client";

import { useState, useEffect } from "react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    storeName: "RajaLaptop",
    tagline: "Pusat Komputer & Laptop Terpercaya Jawa Tengah & DIY",
    metaDescription: "Toko resmi laptop gaming, ultrabook, PC rakitan, dan service center bergaransi resmi.",
    promoBarActive: true,
    promoBarText: "📦 Gratis Ongkir untuk pembelian di atas Rp 500.000 ke seluruh Jawa Tengah & DIY!",
    whatsappNumber: "6281234567890",
    phoneOffice: "(0274) 556789",
    supportEmail: "support@rajalaptop.com",
    openingHours: "Senin – Minggu: 09.00 – 21.00 WIB",
    mainAddress: "Jl. Gejayan (Affandi) No. 45B, Caturtunggal, Depok, Sleman, Yogyakarta",
    maintenanceMode: false,
    logoUrl: "",
    faviconUrl: "",
    topbarPhotoUrl: "",
    instagramUrl: "https://instagram.com/rajalaptop",
    youtubeUrl: "https://youtube.com/@rajalaptop",
    tiktokUrl: "https://tiktok.com/@rajalaptop",
    facebookUrl: "https://facebook.com/rajalaptop"
  });

  const [savedToast, setSavedToast] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authorized, setAuthorized] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Load and check authorization strictly
  useEffect(() => {
    async function checkAuthAndFetch() {
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
          setSettings(data);
        }
      } catch (err) {
        console.error("Gagal mengambil data setting dari database:", err);
      } finally {
        setCheckingAuth(false);
      }
    }
    checkAuthAndFetch();
  }, []);

  const handleUploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file logo maksimal 5MB");
      return;
    }
    try {
      setUploadingLogo(true);
      setUploadError("");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "logo");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah logo");
      setSettings((prev) => ({ ...prev, logoUrl: data.url }));
    } catch (err) {
      setUploadError(err.message);
      alert(err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleUploadFavicon = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran file favicon maksimal 2MB");
      return;
    }
    try {
      setUploadingFavicon(true);
      setUploadError("");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "favicon");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah favicon");
      setSettings((prev) => ({ ...prev, faviconUrl: data.url }));
    } catch (err) {
      setUploadError(err.message);
      alert(err.message);
    } finally {
      setUploadingFavicon(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        if (typeof window !== "undefined") {
          localStorage.setItem("rajalaptop_web_settings", JSON.stringify(data.settings));
          window.dispatchEvent(new Event("settingsUpdated"));
        }
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 3500);
      } else {
        alert("Gagal menyimpan ke database server.");
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      alert("Terjadi kesalahan koneksi saat menyimpan pengaturan.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", color: "var(--text-muted)" }}>
        Memeriksa hak akses konfigurasi...
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
            Anda tidak memiliki izin (<code>settings.manage</code>) untuk mengelola Konfigurasi Web toko. Silakan hubungi Administrator Utama.
          </p>
          <a href="/admin/dashboard" className="btn-primary" style={{ padding: "0.6rem 1.25rem", fontSize: "0.85rem", textDecoration: "none", display: "inline-block" }}>
            Kembali ke Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "860px" }}>
      {/* Toast Notification */}
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
          fontSize: "0.9rem"
        }}>
          💾 Pengaturan Website berhasil disimpan!
        </div>
      )}

      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-contrast)" }}>
          Pengaturan Website (Setting Web)
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Konfigurasi identitas toko, pengumuman promo, nomor kontak WhatsApp, dan informasi operasional.
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
        
        {/* Seksi 1: Identitas Toko & SEO */}
        <div style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--radius-lg)",
          padding: "1.75rem"
        }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-contrast)", marginBottom: "0.4rem" }}>
            🏪 Identitas Toko & Metadata SEO
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
            Informasi umum yang tampil pada header, title tab browser, dan mesin pencari.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                Nama Website / Toko
              </label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.9rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-contrast)",
                  outline: "none",
                  fontSize: "0.85rem"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                Slogan / Tagline
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.9rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-contrast)",
                  outline: "none",
                  fontSize: "0.85rem"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                Deskripsi Meta SEO
              </label>
              <textarea
                rows={2}
                value={settings.metaDescription}
                onChange={(e) => setSettings({ ...settings, metaDescription: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.9rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-contrast)",
                  outline: "none",
                  fontSize: "0.85rem",
                  resize: "vertical"
                }}
              />
            </div>

            {/* Upload Logo Website */}
            <div
              style={{
                marginTop: "0.5rem",
                padding: "1.25rem",
                background: "var(--bg-card)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-lg)",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-contrast)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span>🖼️</span>
                    <span>Logo Utama Website (Khusus Ditampilkan di Header)</span>
                  </h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    Foto / logo resmi toko yang tampil di baris navigasi Header utama website.
                  </p>
                </div>

                {settings.logoUrl && (
                  <span style={{ fontSize: "0.72rem", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", padding: "2px 8px", borderRadius: "4px", fontWeight: 700 }}>
                    ✓ Logo Kustom Terpasang
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: "1.25rem", alignItems: "center", flexWrap: "wrap" }}>
                {/* Logo Preview Container */}
                <div
                  style={{
                    minWidth: "160px",
                    height: "64px",
                    padding: "0.5rem 1rem",
                    background: "rgba(0,0,0,0.25)",
                    border: "1px dashed var(--glass-border)",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {settings.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt="Logo Website Preview"
                      style={{ maxHeight: "48px", maxWidth: "160px", objectFit: "contain" }}
                    />
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                      Belum ada logo (default teks)
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1, minWidth: "220px" }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                    <label
                      style={{
                        padding: "0.45rem 1rem",
                        background: "var(--clr-primary)",
                        color: "#fff",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        cursor: uploadingLogo ? "not-allowed" : "pointer",
                        opacity: uploadingLogo ? 0.6 : 1,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        transition: "all var(--t-fast)",
                      }}
                    >
                      <span>📤</span>
                      <span>{uploadingLogo ? "Mengunggah Logo..." : settings.logoUrl ? "Ganti File Logo" : "Unggah Logo"}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        onChange={handleUploadLogo}
                        disabled={uploadingLogo}
                        style={{ display: "none" }}
                      />
                    </label>

                    {settings.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setSettings((prev) => ({ ...prev, logoUrl: "" }))}
                        style={{
                          padding: "0.45rem 0.85rem",
                          background: "hsla(0, 80%, 58%, 0.12)",
                          border: "1px solid hsla(0, 80%, 58%, 0.3)",
                          color: "var(--clr-danger)",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Hapus Logo
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Atau masukkan URL gambar logo eksternal..."
                    value={settings.logoUrl || ""}
                    onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.45rem 0.75rem",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-contrast)",
                      fontSize: "0.78rem",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Upload Favicon Browser */}
            <div
              style={{
                padding: "1.25rem",
                background: "var(--bg-card)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-lg)",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-contrast)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span>🌐</span>
                    <span>Favicon Browser (Ikon Tab Browser)</span>
                  </h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    Ikon kecil yang muncul di sebelah judul halaman pada tab browser (PNG, ICO, SVG).
                  </p>
                </div>

                {settings.faviconUrl && (
                  <span style={{ fontSize: "0.72rem", background: "rgba(16, 185, 129, 0.15)", color: "#10b981", padding: "2px 8px", borderRadius: "4px", fontWeight: 700 }}>
                    ✓ Favicon Terpasang
                  </span>
                )}
              </div>

              <div style={{ display: "flex", gap: "1.25rem", alignItems: "center", flexWrap: "wrap" }}>
                {/* Browser Tab Preview Simulation */}
                <div
                  style={{
                    padding: "0.5rem 0.85rem",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    minWidth: "160px",
                  }}
                >
                  {settings.faviconUrl ? (
                    <img
                      src={settings.faviconUrl}
                      alt="Favicon Preview"
                      style={{ width: "22px", height: "22px", objectFit: "contain", borderRadius: "2px" }}
                    />
                  ) : (
                    <span style={{ fontSize: "1rem" }}>💻</span>
                  )}
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-contrast)", whiteSpace: "nowrap" }}>
                    {settings.storeName || "RajaLaptop"}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1, minWidth: "220px" }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                    <label
                      style={{
                        padding: "0.45rem 1rem",
                        background: "var(--clr-primary)",
                        color: "#fff",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        cursor: uploadingFavicon ? "not-allowed" : "pointer",
                        opacity: uploadingFavicon ? 0.6 : 1,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        transition: "all var(--t-fast)",
                      }}
                    >
                      <span>📤</span>
                      <span>{uploadingFavicon ? "Mengunggah Favicon..." : settings.faviconUrl ? "Ganti Favicon" : "Unggah Favicon"}</span>
                      <input
                        type="file"
                        accept="image/x-icon,image/png,image/svg+xml,image/webp"
                        onChange={handleUploadFavicon}
                        disabled={uploadingFavicon}
                        style={{ display: "none" }}
                      />
                    </label>

                    {settings.faviconUrl && (
                      <button
                        type="button"
                        onClick={() => setSettings((prev) => ({ ...prev, faviconUrl: "" }))}
                        style={{
                          padding: "0.45rem 0.85rem",
                          background: "hsla(0, 80%, 58%, 0.12)",
                          border: "1px solid hsla(0, 80%, 58%, 0.3)",
                          color: "var(--clr-danger)",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Hapus Favicon
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Atau masukkan URL favicon langsung..."
                    value={settings.faviconUrl || ""}
                    onChange={(e) => setSettings({ ...settings, faviconUrl: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.45rem 0.75rem",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-contrast)",
                      fontSize: "0.78rem",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seksi 2: Banner Pengumuman & Promo Konten Beranda */}
        <div style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--radius-lg)",
          padding: "1.75rem"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-contrast)" }}>
                📢 Banner Pengumuman & Promo Konten Beranda
              </h2>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                Banner promosi yang tampil di konten halaman beranda website (dapat diaktifkan atau dinonaktifkan sewaktu-waktu).
              </p>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={settings.promoBarActive}
                onChange={(e) => setSettings({ ...settings, promoBarActive: e.target.checked })}
              />
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-contrast)" }}>
                {settings.promoBarActive ? "Aktif" : "Nonaktif"}
              </span>
            </label>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
              Teks Banner Promo Beranda
            </label>
            <input
              type="text"
              value={settings.promoBarText}
              onChange={(e) => setSettings({ ...settings, promoBarText: e.target.value })}
              style={{
                width: "100%",
                padding: "0.65rem 0.9rem",
                background: "var(--bg-card)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-contrast)",
                outline: "none",
                fontSize: "0.85rem"
              }}
            />
          </div>
        </div>

        {/* Seksi 3: Kontak WhatsApp & Dukungan CS */}
        <div style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--radius-lg)",
          padding: "1.75rem"
        }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-contrast)", marginBottom: "0.4rem" }}>
            📞 Kontak WhatsApp & Pelayanan Pelanggan
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
            Nomor tujuan saat pelanggan mengklik tombol WhatsApp atau konsultasi servis.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                Nomor WhatsApp Toko (format 628xxx)
              </label>
              <input
                type="text"
                value={settings.whatsappNumber}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.9rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-contrast)",
                  outline: "none",
                  fontSize: "0.85rem"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                Nomor Telepon Kantor
              </label>
              <input
                type="text"
                value={settings.phoneOffice}
                onChange={(e) => setSettings({ ...settings, phoneOffice: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.9rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-contrast)",
                  outline: "none",
                  fontSize: "0.85rem"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                Email Support / Bantuan
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.9rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-contrast)",
                  outline: "none",
                  fontSize: "0.85rem"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                Jam Operasional
              </label>
              <input
                type="text"
                value={settings.openingHours}
                onChange={(e) => setSettings({ ...settings, openingHours: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.9rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-contrast)",
                  outline: "none",
                  fontSize: "0.85rem"
                }}
              />
            </div>
          </div>
        </div>

        {/* Seksi: Tautan Media Sosial Resmi */}
        <div style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--radius-lg)",
          padding: "1.75rem"
        }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-contrast)", marginBottom: "0.4rem" }}>
            🌐 Tautan Media Sosial Resmi (Footer Customer)
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "1.25rem" }}>
            Kelola URL akun media sosial resmi toko yang tampil pada footer customer agar pelanggan dapat langsung terhubung.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                <span>📸</span> Link Instagram
              </label>
              <input
                type="url"
                placeholder="https://instagram.com/namatoko"
                value={settings.instagramUrl || ""}
                onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.9rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-contrast)",
                  outline: "none",
                  fontSize: "0.85rem"
                }}
              />
            </div>

            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                <span>▶️</span> Link YouTube Channel
              </label>
              <input
                type="url"
                placeholder="https://youtube.com/@namatoko"
                value={settings.youtubeUrl || ""}
                onChange={(e) => setSettings({ ...settings, youtubeUrl: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.9rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-contrast)",
                  outline: "none",
                  fontSize: "0.85rem"
                }}
              />
            </div>

            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                <span>🎵</span> Link TikTok
              </label>
              <input
                type="url"
                placeholder="https://tiktok.com/@namatoko"
                value={settings.tiktokUrl || ""}
                onChange={(e) => setSettings({ ...settings, tiktokUrl: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.9rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-contrast)",
                  outline: "none",
                  fontSize: "0.85rem"
                }}
              />
            </div>

            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                <span>📘</span> Link Facebook Halaman / Group
              </label>
              <input
                type="url"
                placeholder="https://facebook.com/namatoko"
                value={settings.facebookUrl || ""}
                onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.9rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-contrast)",
                  outline: "none",
                  fontSize: "0.85rem"
                }}
              />
            </div>
          </div>
        </div>

        {/* Seksi 4: Maintenance Mode */}
        <div style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--radius-lg)",
          padding: "1.75rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-contrast)" }}>
              🚧 Mode Pemeliharaan (Maintenance Mode)
            </h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Aktifkan jika sistem sedang dilakukan pembaruan database atau perbaikan darurat.
            </p>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
            />
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: settings.maintenanceMode ? "var(--clr-danger)" : "var(--text-secondary)" }}>
              {settings.maintenanceMode ? "Mode Aktif (Toko Tutup Sementara)" : "Normal (Online)"}
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: "0.85rem 2rem", fontSize: "0.95rem" }}
          >
            💾 Simpan Semua Pengaturan Website
          </button>
        </div>

      </form>
    </div>
  );
}
