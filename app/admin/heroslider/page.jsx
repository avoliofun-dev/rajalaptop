"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const DEFAULT_SLIDES = [
  {
    id: "slide-1",
    tag: "PROMO SPESIAL GAMING 2026",
    title: "ROG & Predator Series",
    highlight: "Diskon Up to 35%",
    desc: "Performa maksimal RTX 40 & Intel Gen 14th / Ryzen 8000. Dapatkan bonus mouse gaming + bag pack original.",
    ctaText: "Beli Sekarang",
    ctaLink: "#katalog",
    secondaryText: "Cek Spesifikasi",
    secondaryLink: "#layanan",
    badge: "Garansi Resmi 2 Tahun",
    color: "#3b82f6",
    imageUrl: "",
    mockupSub: "RTX 4090 / i9-14900HX",
    mockupBadge: "🔥 240Hz OLED Display"
  },
  {
    id: "slide-2",
    tag: "PRODUCTIVITY & ULTRABOOK",
    title: "Zenbook & ThinkPad Pro",
    highlight: "Cashback Rp 1.500.000",
    desc: "Bodi tipis, baterai tahan hingga 18 jam, layar OLED 2.8K 120Hz. Cocok untuk profesional & kreator konten.",
    ctaText: "Jelajahi Seri",
    ctaLink: "#katalog",
    secondaryText: "Konsultasi Gratis",
    secondaryLink: "#layanan",
    badge: "Free Office Original",
    color: "#8b5cf6",
    imageUrl: "",
    mockupSub: "Ultra 7 / OLED 2.8K",
    mockupBadge: "⚡ 18 Jam Baterai"
  },
  {
    id: "slide-3",
    tag: "SERVICE & UPGRADE RESMI",
    title: "Service Express & Upgrade RAM/SSD",
    highlight: "Bisa Ditunggu 30 Menit",
    desc: "Perawatan laptop berkala, repasta thermal grizzly, upgrade SSD NVMe & RAM garansi resmi teknisi berpengalaman.",
    ctaText: "Konsultasi Servis",
    ctaLink: "#layanan",
    secondaryText: "Hubungi Teknisi",
    secondaryLink: "#layanan",
    badge: "Teknisi Bersertifikat",
    color: "#10b981",
    imageUrl: "",
    mockupSub: "Upgrade RAM & SSD Ekspres",
    mockupBadge: "🔧 Bergaransi Resmi"
  }
];

const PRESET_COLORS = [
  { name: "Biru ROG", hex: "#3b82f6" },
  { name: "Ungu Pro", hex: "#8b5cf6" },
  { name: "Amber Gold", hex: "#f59e0b" },
  { name: "Hijau Emerald", hex: "#10b981" },
  { name: "Merah Crimson", hex: "#ef4444" },
  { name: "Cyan Neo", hex: "#06b6d4" },
  { name: "Pink Cyber", hex: "#ec4899" },
];

export default function AdminHeroSliderPage() {
  const [slides, setSlides] = useState([]);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [authorized, setAuthorized] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3500);
  };

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Cek hak akses
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
            setLoading(false);
            return;
          }
        } else {
          setAuthorized(false);
          setLoading(false);
          return;
        }

        // 2. Ambil data settings
        const res = await fetch("/api/settings", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.heroSlides) && data.heroSlides.length > 0) {
            setSlides(data.heroSlides);
          } else {
            setSlides(DEFAULT_SLIDES);
          }
        } else {
          setSlides(DEFAULT_SLIDES);
        }
      } catch (err) {
        setSlides(DEFAULT_SLIDES);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const activeSlide = slides[activeSlideIdx] || slides[0] || {};

  const handleUpdateActiveSlide = (field, value) => {
    setSlides((prev) => {
      const copy = [...prev];
      copy[activeSlideIdx] = {
        ...copy[activeSlideIdx],
        [field]: value,
      };
      return copy;
    });
  };

  const handleAddSlide = () => {
    const newSlide = {
      id: "slide-" + Date.now(),
      tag: "PROMO TERBARU " + new Date().getFullYear(),
      title: "Laptop Series Terbaru",
      highlight: "Diskon Menarik Hari Ini",
      desc: "Dapatkan performa andal dengan harga terbaik dan bonus aksesoris original resmi.",
      ctaText: "Beli Sekarang",
      ctaLink: "#katalog",
      secondaryText: "Cek Spesifikasi",
      secondaryLink: "#layanan",
      badge: "Garansi Resmi Distributor",
      color: "#3b82f6",
      imageUrl: "",
      mockupSub: "Spesifikasi Flagship",
      mockupBadge: "🔥 Promo Terbatas"
    };

    setSlides((prev) => [...prev, newSlide]);
    setActiveSlideIdx(slides.length);
    showToast("Slide baru berhasil ditambahkan! Silakan lengkapi detail dan simpan.");
  };

  const handleDeleteSlide = (idxToDelete) => {
    if (slides.length <= 1) {
      alert("Harus ada minimal 1 slide hero!");
      return;
    }
    if (!confirm(`Hapus slide #${idxToDelete + 1} "${slides[idxToDelete]?.title}"?`)) return;

    setSlides((prev) => prev.filter((_, i) => i !== idxToDelete));
    if (activeSlideIdx >= idxToDelete && activeSlideIdx > 0) {
      setActiveSlideIdx((p) => p - 1);
    }
    showToast("Slide berhasil dihapus. Jangan lupa klik 'Simpan Perubahan'.", "info");
  };

  const handleMoveSlide = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= slides.length) return;

    setSlides((prev) => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
    setActiveSlideIdx(targetIdx);
  };

  const handleUploadSlideImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 5MB");
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "heroslider");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah gambar banner");

      handleUpdateActiveSlide("imageUrl", data.url);
      showToast("Gambar banner slide berhasil diunggah!");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heroSlides: slides }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan perubahan");
      }

      const result = await res.json();
      if (typeof window !== "undefined") {
        if (result.settings) {
          localStorage.setItem("rajalaptop_web_settings", JSON.stringify(result.settings));
        }
        window.dispatchEvent(new Event("settingsUpdated"));
      }

      showToast("✅ Pengaturan Hero Slider berhasil disimpan ke website utama!");
    } catch (err) {
      alert("Gagal menyimpan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefault = () => {
    if (confirm("Kembalikan slider ke slide bawaan awal (3 slide default)?")) {
      setSlides(DEFAULT_SLIDES);
      setActiveSlideIdx(0);
      showToast("Slide dikembalikan ke template awal. Klik 'Simpan Perubahan' untuk menerapkan.", "info");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "var(--text-muted)" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.85rem" }}>⏳</div>
        <p>Memuat konfigurasi Hero Slider...</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div style={{ padding: "3rem 1.5rem", maxWidth: "600px", margin: "2rem auto", textAlign: "center", background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--clr-danger)" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🚫</div>
        <h2 style={{ color: "var(--clr-danger)", marginBottom: "0.5rem" }}>Akses Dibatasi</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          Anda tidak memiliki izin <code>settings.manage</code> untuk mengelola Hero Slider website.
        </p>
        <Link href="/admin/dashboard" className="btn-primary" style={{ padding: "0.55rem 1.25rem", fontSize: "0.85rem" }}>
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "4rem" }}>
      {/* Toast Notification */}
      {toast.show && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            background: toast.type === "info" ? "#1e293b" : "hsl(145, 60%, 40%)",
            color: "#fff",
            padding: "0.85rem 1.4rem",
            borderRadius: "var(--radius-md)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            fontSize: "0.88rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            animation: "slideInRight 0.25s ease-out",
          }}
        >
          <span>{toast.type === "info" ? "ℹ️" : "✨"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.75rem",
          paddingBottom: "1.25rem",
          borderBottom: "1px solid var(--glass-border)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span style={{ fontSize: "1.6rem" }}>🖼️</span>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-contrast)", margin: 0 }}>
              Setting Hero Slider Beranda
            </h1>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
            Kelola slide banner promosi utama beranda, teks sorotan, tombol CTA, serta unggah gambar banner kustom.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleResetDefault}
            style={{
              padding: "0.6rem 1rem",
              background: "var(--bg-card)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-secondary)",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            🔄 Reset Default
          </button>
          <button
            type="button"
            onClick={handleAddSlide}
            style={{
              padding: "0.6rem 1.15rem",
              background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              border: "none",
              borderRadius: "var(--radius-md)",
              color: "#fff",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(59, 130, 246, 0.35)",
            }}
          >
            ➕ Tambah Slide
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            style={{
              padding: "0.6rem 1.4rem",
              background: "linear-gradient(135deg, #10b981, #059669)",
              border: "none",
              borderRadius: "var(--radius-md)",
              color: "#fff",
              fontSize: "0.84rem",
              fontWeight: 800,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
            }}
          >
            {saving ? "⏳ Menyimpan..." : "💾 Simpan Perubahan"}
          </button>
        </div>
      </div>

      {/* Main Grid: Left Tabs / Selector, Right Edit Form & Live Preview */}
      <div style={{ display: "grid", gridTemplateColumns: "310px 1fr", gap: "1.75rem", alignItems: "start" }}>
        
        {/* LEFT COLUMN: Slide Tabs List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Daftar Slide ({slides.length})
          </div>

          {slides.map((s, idx) => {
            const isSelected = idx === activeSlideIdx;
            return (
              <div
                key={s.id || idx}
                onClick={() => setActiveSlideIdx(idx)}
                style={{
                  background: isSelected ? "var(--bg-card)" : "var(--bg-surface)",
                  border: isSelected ? `2px solid ${s.color || "var(--clr-primary)"}` : "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "0.85rem 1rem",
                  cursor: "pointer",
                  transition: "all var(--t-fast)",
                  boxShadow: isSelected ? `0 0 16px ${s.color || "var(--clr-primary)"}25` : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: s.color || "#3b82f6",
                        boxShadow: `0 0 8px ${s.color || "#3b82f6"}`,
                      }}
                    />
                    <strong style={{ fontSize: "0.86rem", color: isSelected ? "var(--text-contrast)" : "var(--text-primary)" }}>
                      Slide #{idx + 1}
                    </strong>
                  </div>

                  {/* Ordering & Delete Buttons */}
                  <div style={{ display: "flex", alignItems: "center", gap: "3px" }} onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveSlide(idx, -1)}
                      title="Geser ke atas"
                      style={{
                        background: "transparent",
                        border: "1px solid var(--glass-border)",
                        color: idx === 0 ? "var(--text-muted)" : "var(--text-secondary)",
                        borderRadius: "4px",
                        padding: "2px 6px",
                        fontSize: "0.72rem",
                        cursor: idx === 0 ? "default" : "pointer",
                      }}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={idx === slides.length - 1}
                      onClick={() => handleMoveSlide(idx, 1)}
                      title="Geser ke bawah"
                      style={{
                        background: "transparent",
                        border: "1px solid var(--glass-border)",
                        color: idx === slides.length - 1 ? "var(--text-muted)" : "var(--text-secondary)",
                        borderRadius: "4px",
                        padding: "2px 6px",
                        fontSize: "0.72rem",
                        cursor: idx === slides.length - 1 ? "default" : "pointer",
                      }}
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSlide(idx)}
                      title="Hapus slide ini"
                      style={{
                        background: "hsla(0, 80%, 58%, 0.12)",
                        border: "1px solid hsla(0, 80%, 58%, 0.25)",
                        color: "var(--clr-danger)",
                        borderRadius: "4px",
                        padding: "2px 6px",
                        fontSize: "0.72rem",
                        cursor: "pointer",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-contrast)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {s.title || "Untitled Slide"}
                </div>
                <div style={{ fontSize: "0.72rem", color: s.color || "var(--clr-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px" }}>
                  {s.highlight || "Tanpa Highlight"}
                </div>

                {s.imageUrl && (
                  <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    <span>🖼️ Gambar:</span>
                    <span style={{ color: "#38bdf8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.imageUrl.split("/").pop()}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={handleAddSlide}
            style={{
              padding: "0.75rem",
              background: "var(--glass-bg)",
              border: "1px dashed var(--glass-border)",
              borderRadius: "var(--radius-lg)",
              color: "var(--clr-primary)",
              fontSize: "0.84rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all var(--t-fast)",
            }}
          >
            ➕ Tambah Slide Baru
          </button>
        </div>

        {/* RIGHT COLUMN: Active Slide Editor & Live Preview */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          
          {/* Card Form Editor */}
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-xl)",
              padding: "1.5rem",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", paddingBottom: "0.85rem", borderBottom: "1px solid var(--glass-border)" }}>
              <div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-contrast)", margin: 0 }}>
                  Edit Konten: Slide #{activeSlideIdx + 1}
                </h2>
                <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                  Perubahan akan langsung tercermin pada simulasi di bawah
                </span>
              </div>
              <span
                style={{
                  background: `${activeSlide.color || "#3b82f6"}20`,
                  color: activeSlide.color || "#3b82f6",
                  border: `1px solid ${activeSlide.color || "#3b82f6"}40`,
                  padding: "3px 10px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                }}
              >
                Slide Aktif
              </span>
            </div>

            {/* 1. Upload Gambar Banner */}
            <div
              style={{
                marginBottom: "1.5rem",
                padding: "1.25rem",
                background: "var(--bg-card)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--glass-border)",
              }}
            >
              <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "var(--text-contrast)", marginBottom: "0.35rem" }}>
                🖼️ Gambar Banner Slide (Upload dari Laptop/HP)
              </label>
              <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", margin: "0 0 0.85rem 0" }}>
                Jika gambar diunggah, banner slide akan menampilkan gambar kustom tersebut. Jika dikosongkan, slide otomatis menggunakan mockup animasi CSS laptop 3D bawaan.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: activeSlide.imageUrl ? "180px 1fr" : "1fr", gap: "1rem", alignItems: "center" }}>
                {activeSlide.imageUrl && (
                  <div style={{ position: "relative", width: "100%", height: "110px", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--glass-border)", background: "#0b0f19" }}>
                    <img
                      src={activeSlide.imageUrl}
                      alt="Banner Preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateActiveSlide("imageUrl", "")}
                      title="Hapus gambar ini"
                      style={{
                        position: "absolute",
                        top: "6px",
                        right: "6px",
                        background: "rgba(239, 68, 68, 0.85)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "50%",
                        width: "24px",
                        height: "24px",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      padding: "0.65rem 1.25rem",
                      background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                      color: "#fff",
                      borderRadius: "var(--radius-md)",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: uploadingImage ? "not-allowed" : "pointer",
                      width: "fit-content",
                      boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
                    }}
                  >
                    <span>{uploadingImage ? "⏳ Mengunggah..." : "📁 Pilih File Gambar (Maks 5MB)"}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/jpg"
                      onChange={handleUploadSlideImage}
                      disabled={uploadingImage}
                      style={{ display: "none" }}
                    />
                  </label>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Atau URL Gambar:</span>
                    <input
                      type="text"
                      value={activeSlide.imageUrl || ""}
                      onChange={(e) => handleUpdateActiveSlide("imageUrl", e.target.value)}
                      placeholder="https://... atau /uploads/heroslider/..."
                      style={{
                        flex: 1,
                        padding: "0.35rem 0.65rem",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--text-primary)",
                        fontSize: "0.78rem",
                      }}
                    />
                  </div>

                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    💡 Rekomendasi: Rasio 16:9 atau 16:10 (misal: 1280x720 atau 800x500 px) dengan format WebP atau PNG.
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Form Teks & Konten */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-contrast)", marginBottom: "0.3rem" }}>
                  Tag Badge Atas
                </label>
                <input
                  type="text"
                  value={activeSlide.tag || ""}
                  onChange={(e) => handleUpdateActiveSlide("tag", e.target.value)}
                  placeholder="Contoh: PROMO SPESIAL GAMING 2026"
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.8rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-primary)",
                    fontSize: "0.84rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-contrast)", marginBottom: "0.3rem" }}>
                  Badge Jaminan / Garansi
                </label>
                <input
                  type="text"
                  value={activeSlide.badge || ""}
                  onChange={(e) => handleUpdateActiveSlide("badge", e.target.value)}
                  placeholder="Contoh: Garansi Resmi 2 Tahun"
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.8rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-primary)",
                    fontSize: "0.84rem",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-contrast)", marginBottom: "0.3rem" }}>
                  Judul Utama
                </label>
                <input
                  type="text"
                  value={activeSlide.title || ""}
                  onChange={(e) => handleUpdateActiveSlide("title", e.target.value)}
                  placeholder="Contoh: ROG & Predator Series"
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.8rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-primary)",
                    fontSize: "0.84rem",
                    fontWeight: 700,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-contrast)", marginBottom: "0.3rem" }}>
                  Teks Highlight (Berwarna Aksen)
                </label>
                <input
                  type="text"
                  value={activeSlide.highlight || ""}
                  onChange={(e) => handleUpdateActiveSlide("highlight", e.target.value)}
                  placeholder="Contoh: Diskon Up to 35%"
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.8rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-sm)",
                    color: activeSlide.color || "var(--clr-primary)",
                    fontSize: "0.84rem",
                    fontWeight: 700,
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-contrast)", marginBottom: "0.3rem" }}>
                Deskripsi Singkat
              </label>
              <textarea
                rows={2}
                value={activeSlide.desc || ""}
                onChange={(e) => handleUpdateActiveSlide("desc", e.target.value)}
                placeholder="Deskripsi spesifikasi, penawaran bonus, dll."
                style={{
                  width: "100%",
                  padding: "0.55rem 0.8rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-primary)",
                  fontSize: "0.84rem",
                  lineHeight: 1.5,
                  resize: "vertical",
                }}
              />
            </div>

            {/* 3. Tombol CTA */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.85rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-contrast)", marginBottom: "0.3rem" }}>
                  Teks Tombol 1
                </label>
                <input
                  type="text"
                  value={activeSlide.ctaText || ""}
                  onChange={(e) => handleUpdateActiveSlide("ctaText", e.target.value)}
                  placeholder="Beli Sekarang"
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.65rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-primary)",
                    fontSize: "0.8rem",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-contrast)", marginBottom: "0.3rem" }}>
                  Link Tombol 1
                </label>
                <input
                  type="text"
                  value={activeSlide.ctaLink || ""}
                  onChange={(e) => handleUpdateActiveSlide("ctaLink", e.target.value)}
                  placeholder="#katalog atau /produk"
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.65rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-primary)",
                    fontSize: "0.8rem",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-contrast)", marginBottom: "0.3rem" }}>
                  Teks Tombol 2
                </label>
                <input
                  type="text"
                  value={activeSlide.secondaryText || ""}
                  onChange={(e) => handleUpdateActiveSlide("secondaryText", e.target.value)}
                  placeholder="Cek Spesifikasi"
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.65rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-primary)",
                    fontSize: "0.8rem",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-contrast)", marginBottom: "0.3rem" }}>
                  Link Tombol 2
                </label>
                <input
                  type="text"
                  value={activeSlide.secondaryLink || ""}
                  onChange={(e) => handleUpdateActiveSlide("secondaryLink", e.target.value)}
                  placeholder="#layanan"
                  style={{
                    width: "100%",
                    padding: "0.45rem 0.65rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-primary)",
                    fontSize: "0.8rem",
                  }}
                />
              </div>
            </div>

            {/* 4. Warna Aksen Slide */}
            <div>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-contrast)", marginBottom: "0.4rem" }}>
                Warna Tema Aksen Slide
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => handleUpdateActiveSlide("color", c.hex)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.35rem 0.75rem",
                      background: activeSlide.color === c.hex ? `${c.hex}30` : "var(--bg-card)",
                      border: `1.5px solid ${activeSlide.color === c.hex ? c.hex : "var(--glass-border)"}`,
                      borderRadius: "var(--radius-full)",
                      color: "var(--text-primary)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: c.hex }} />
                    {c.name}
                  </button>
                ))}

                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginLeft: "auto" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Custom HEX:</span>
                  <input
                    type="color"
                    value={activeSlide.color || "#3b82f6"}
                    onChange={(e) => handleUpdateActiveSlide("color", e.target.value)}
                    style={{ width: "32px", height: "30px", border: "none", background: "transparent", cursor: "pointer" }}
                  />
                  <input
                    type="text"
                    value={activeSlide.color || "#3b82f6"}
                    onChange={(e) => handleUpdateActiveSlide("color", e.target.value)}
                    style={{
                      width: "80px",
                      padding: "0.3rem 0.5rem",
                      background: "var(--bg-card)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.75rem",
                      color: "var(--text-primary)",
                      fontWeight: 700,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SIMULASI LIVE PRATINJAU SLIDER */}
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-xl)",
              padding: "1.5rem",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.1rem" }}>👁️</span>
                <strong style={{ fontSize: "0.95rem", color: "var(--text-contrast)" }}>
                  Simulasi Live Pratinjau (Slide #{activeSlideIdx + 1})
                </strong>
              </div>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                Tampilan real-time persis seperti di beranda toko
              </span>
            </div>

            {/* Mockup Container */}
            <div
              style={{
                background: "radial-gradient(circle at 75% 25%, hsla(220, 90%, 56%, 0.12) 0%, transparent 60%), radial-gradient(circle at 20% 80%, hsla(35, 100%, 55%, 0.06) 0%, transparent 50%), #0a0e17",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-lg)",
                padding: "1.75rem 2rem",
                display: "grid",
                gridTemplateColumns: "1.1fr 0.9fr",
                alignItems: "center",
                gap: "1.5rem",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Left Content */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid var(--glass-border)",
                    color: activeSlide.color || "var(--clr-primary)",
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    padding: "0.25rem 0.75rem",
                    borderRadius: "9999px",
                    width: "fit-content",
                  }}
                >
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: activeSlide.color || "var(--clr-primary)" }} />
                  {activeSlide.tag || "PROMO TAG"}
                </div>

                <div style={{ fontSize: "1.45rem", fontWeight: 800, lineHeight: 1.2, color: "#fff" }}>
                  {activeSlide.title} <br />
                  <span style={{ color: activeSlide.color || "#38bdf8" }}>{activeSlide.highlight}</span>
                </div>

                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                  {activeSlide.desc}
                </p>

                <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.25rem" }}>
                  <span
                    style={{
                      background: activeSlide.color || "var(--clr-primary)",
                      color: "#fff",
                      padding: "0.45rem 1rem",
                      borderRadius: "9999px",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                    }}
                  >
                    {activeSlide.ctaText || "Beli Sekarang"} →
                  </span>
                  <span
                    style={{
                      background: "transparent",
                      border: "1px solid var(--glass-border)",
                      color: "#fff",
                      padding: "0.45rem 1rem",
                      borderRadius: "9999px",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                    }}
                  >
                    {activeSlide.secondaryText || "Cek Spesifikasi"}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  <span>🛡️ <strong>{activeSlide.badge || "Garansi Resmi"}</strong></span>
                  <span>•</span>
                  <span>⚡ <strong>Same-Day Delivery</strong></span>
                </div>
              </div>

              {/* Right Visual (Custom Image OR Laptop Mockup) */}
              <div
                style={{
                  background: "#111827",
                  border: `1.5px solid ${activeSlide.color || "var(--glass-border)"}`,
                  borderRadius: "var(--radius-lg)",
                  padding: "1rem",
                  boxShadow: `0 8px 30px ${activeSlide.color || "#3b82f6"}20`,
                  textAlign: "center",
                }}
              >
                {activeSlide.imageUrl ? (
                  <div style={{ borderRadius: "var(--radius-sm)", overflow: "hidden", aspectRatio: "16/10", background: "#000" }}>
                    <img
                      src={activeSlide.imageUrl}
                      alt="Banner Preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "16/10",
                        background: "#090d16",
                        border: "2px solid #1f293d",
                        borderRadius: "8px 8px 0 0",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          width: "80px",
                          height: "80px",
                          borderRadius: "50%",
                          background: activeSlide.color || "#3b82f6",
                          filter: "blur(40px)",
                          opacity: 0.35,
                        }}
                      />
                      <div style={{ position: "relative", zIndex: 2 }}>
                        <div style={{ fontSize: "0.7rem", color: "#93c5fd", fontWeight: 700, textTransform: "uppercase" }}>
                          Laptop Flagship
                        </div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#fff", marginTop: "2px" }}>
                          {activeSlide.mockupSub || "RTX 4090 / i9-14900HX"}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "var(--clr-accent)", fontWeight: 600, marginTop: "2px" }}>
                          {activeSlide.mockupBadge || "🔥 240Hz OLED Display"}
                        </div>
                      </div>
                    </div>
                    <div style={{ width: "100%", height: "8px", background: "#1e293b", borderRadius: "0 0 8px 8px" }} />
                  </div>
                )}

                {/* Slider Indicator Preview */}
                <div style={{ display: "flex", justifyContent: "center", gap: "0.4rem", marginTop: "0.75rem" }}>
                  {slides.map((_, i) => (
                    <span
                      key={i}
                      style={{
                        width: i === activeSlideIdx ? "26px" : "16px",
                        height: "4px",
                        borderRadius: "2px",
                        background: i === activeSlideIdx ? (activeSlide.color || "var(--clr-primary)") : "var(--glass-border)",
                        transition: "all var(--t-fast)",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Save Action */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "var(--bg-card)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-lg)",
              padding: "1rem 1.5rem",
            }}
          >
            <div>
              <strong style={{ display: "block", color: "var(--text-contrast)", fontSize: "0.9rem" }}>
                Sudah selesai mengatur slider?
              </strong>
              <span style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                Total {slides.length} slide akan aktif dan ditampilkan berurutan di beranda toko.
              </span>
            </div>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              style={{
                padding: "0.7rem 1.6rem",
                background: "linear-gradient(135deg, #10b981, #059669)",
                border: "none",
                borderRadius: "var(--radius-md)",
                color: "#fff",
                fontSize: "0.88rem",
                fontWeight: 800,
                cursor: saving ? "not-allowed" : "pointer",
                boxShadow: "0 4px 16px rgba(16, 185, 129, 0.4)",
              }}
            >
              {saving ? "⏳ Menyimpan..." : "💾 Simpan Perubahan Sekarang"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
