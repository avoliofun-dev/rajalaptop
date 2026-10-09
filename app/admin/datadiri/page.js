"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const ROLE_METADATA = {
  owner: {
    name: "Owner",
    badge: "Pemilik Bisnis",
    color: "#f59e0b",
    icon: "👑",
    division: "Direksi & Pemilik Perusahaan",
    desc: "Akses penuh tanpa batas ke seluruh data keuangan, analitik performa cabang, inventaris, dan approval level tinggi.",
  },
  super_admin: {
    name: "Super Admin",
    badge: "Teknis & Sistem",
    color: "#3b82f6",
    icon: "⚡",
    division: "Divisi IT & Infrastruktur Sistem",
    desc: "Administrator teknis sistem, manajemen akun pengguna, konfigurasi toko multi-cabang, dan pengawasan sistem.",
  },
  manajer_area: {
    name: "Manager Area",
    badge: "Regional Manager",
    color: "#8b5cf6",
    icon: "🏢",
    division: "Manajemen Operasional Regional",
    desc: "Supervisi operasional seluruh cabang dalam wilayah regional, approval diskon khusus, dan mutasi stok antar toko.",
  },
  kepala_toko: {
    name: "Kepala Toko",
    badge: "Store Manager",
    color: "#6366f1",
    icon: "🏪",
    division: "Operasional Toko Cabang",
    desc: "Pimpinan operasional harian cabang toko fisik, supervisi staf kasir dan gudang, serta otorisasi transaksi lokal.",
  },
  kasir: {
    name: "Kasir",
    badge: "POS & Sales",
    color: "#10b981",
    icon: "🛒",
    division: "Frontliner & Penjualan Ritel",
    desc: "Layanan kasir terminal POS, pembuatan transaksi tunai/non-tunai, pencetakan struk nota, dan pengajuan diskon.",
  },
  gudang: {
    name: "Gudang",
    badge: "Inventory & SN",
    color: "#d97706",
    icon: "📦",
    division: "Logistik & Pergudangan",
    desc: "Penerimaan barang distributor, mutasi stok, pelacakan nomor serial laptop/IMEI, dan stock opname fisik.",
  },
  finance: {
    name: "Finance",
    badge: "Keuangan & Kas",
    color: "#ef4444",
    icon: "💰",
    division: "Keuangan & Akuntansi",
    desc: "Pencatatan kas masuk/keluar, verifikasi pembayaran, pencatatan beban operasional, dan rekonsiliasi keuangan.",
  },
  digital_marketing: {
    name: "Marketing",
    badge: "Kampanye & Promo",
    color: "#ec4899",
    icon: "📣",
    division: "Pemasaran & Konten Digital",
    desc: "Pengelolaan banner promosi, katalog produk unggulan, voucher diskon pelanggan, dan analitik kampanye ritel.",
  },
  audit: {
    name: "Audit",
    badge: "Pengawasan (RO)",
    color: "#6b7280",
    icon: "🛡️",
    division: "Kepatuhan & Pengawasan Internal",
    desc: "Pemeriksaan integritas transaksi, penelusuran forensik audit log sistem kebal manipulasi, dan laporan kepatuhan.",
  },
};

const SCOPE_EXPLANATION = {
  ALL: {
    title: "Seluruh Perusahaan (ALL)",
    desc: "Memiliki wewenang mengakses data dari seluruh cabang toko dan area regional secara sentral tanpa pembatasan wilayah.",
    color: "#f59e0b",
  },
  AREA: {
    title: "Wilayah Regional (AREA)",
    desc: "Wewenang terspesialisasi untuk mengelola dan memantau seluruh toko cabang yang berada di dalam area penugasan regionalnya.",
    color: "#8b5cf6",
  },
  STORE: {
    title: "Toko Cabang (STORE)",
    desc: "Wewenang dibatasi khusus pada data operasional toko cabang penugasan (tidak dapat melihat atau mengubah cabang lain).",
    color: "#3b82f6",
  },
  OWN: {
    title: "Pribadi / Milik Sendiri (OWN)",
    desc: "Wewenang data terisolasi secara ketat hanya pada data transaksi yang dibuat atau ditangani secara langsung oleh staf ini.",
    color: "#10b981",
  },
};

export default function DataDiriAdminPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ type: "", message: "" });

  // Form states for edit
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Standalone Dedicated Photo Modal State
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: "", message: "" }), 4000);
  };

  const handleOpenPhotoModal = () => {
    setPhotoUrl(user?.avatar || "");
    setShowPhotoModal(true);
  };

  const handleUploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "Ukuran foto maksimal 5MB.");
      return;
    }
    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avatars");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah foto profil");
      setPhotoUrl(data.url);
      showToast("success", "Foto berhasil diunggah! Klik 'Simpan Foto' untuk menerapkan.");
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSavePhoto = async () => {
    try {
      setSavingPhoto(true);
      const res = await fetch("/api/auth/admin/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatar: photoUrl,
          name: user?.name || name,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan foto profil");

      if (result.user) {
        setUser(result.user);
      } else {
        setUser((prev) => ({ ...prev, avatar: photoUrl }));
      }
      showToast("success", "Foto profil Anda berhasil diperbarui!");
      setShowPhotoModal(false);
      window.dispatchEvent(new Event("authStateChange"));
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setSavingPhoto(false);
    }
  };

  const loadUserData = async () => {
    try {
      const res = await fetch("/api/auth/admin/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          setName(data.user.name || "");
          setPhone(data.user.phone || "");
        }
      }
    } catch (err) {
      console.error("Gagal memuat profil admin:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const handleStartEdit = () => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast("error", "Nama lengkap wajib diisi.");
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        showToast("error", "Password baru minimal 6 karakter.");
        return;
      }
      if (newPassword !== confirmPassword) {
        showToast("error", "Konfirmasi password baru tidak cocok.");
        return;
      }
      if (!currentPassword) {
        showToast("error", "Password saat ini wajib diisi untuk verifikasi perubahan password.");
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
      };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await fetch("/api/auth/admin/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok) {
        showToast("success", result.message || "Data diri berhasil diperbarui!");
        if (result.user) {
          setUser(result.user);
          setName(result.user.name || "");
          setPhone(result.user.phone || "");
        }
        setIsEditing(false);
      } else {
        showToast("error", result.error || "Gagal memperbarui data diri.");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      showToast("error", "Terjadi kesalahan koneksi atau server.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--text-muted)" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>
        <div>Memuat berkas data diri admin...</div>
      </div>
    );
  }

  const roleMeta = ROLE_METADATA[user?.role] || {
    name: user?.roleName || user?.role || "Staff",
    badge: user?.defaultScope || "Staff",
    color: "#3b82f6",
    icon: "👤",
    division: "Staf Operasional",
    desc: "Akses operasional standar sistem.",
  };

  const scopeInfo = SCOPE_EXPLANATION[user?.defaultScope] || SCOPE_EXPLANATION.STORE;

  const formatDateIndo = (dateStr) => {
    if (!dateStr) return "28 September 2026 (Migrasi Sistem)";
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const primaryStoreName =
    user?.stores && user.stores.length > 0
      ? user.stores.map((s) => s.name).join(", ")
      : "Raja Laptop Pekalongan (Sentral)";

  const primaryAreaName =
    user?.areas && user.areas.length > 0
      ? user.areas.map((a) => a.name).join(", ")
      : "Jawa Tengah (Wilayah Pantura & Sekitarnya)";

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Toast Alert */}
      {toast.message && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 9999,
            padding: "0.85rem 1.25rem",
            background: toast.type === "success" ? "hsl(142, 70%, 45%)" : "hsl(0, 80%, 58%)",
            color: "#fff",
            borderRadius: "var(--radius-md)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            fontWeight: 700,
            fontSize: "0.88rem",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <span>{toast.type === "success" ? "✅" : "⚠️"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Navigation & Edit Action Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
            <Link
              href="/admin/dashboard"
              style={{ fontSize: "0.82rem", color: "var(--text-muted)", textDecoration: "none" }}
            >
              Dashboard
            </Link>
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>/</span>
            <span style={{ fontSize: "0.82rem", color: "var(--clr-primary)", fontWeight: 700 }}>
              {isEditing ? "Edit Data Diri" : "Data Diri Pegawai"}
            </span>
          </div>
          <h1 style={{ fontSize: "1.65rem", fontWeight: 900, color: "var(--text-contrast)" }}>
            {isEditing ? "✏️ Edit Data Diri Admin" : "📋 Berkas Data Diri & Profil Pegawai"}
          </h1>
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginTop: "3px" }}>
            {isEditing
              ? "Perbarui informasi nama lengkap, nomor WhatsApp/kontak, serta kata sandi akun Anda."
              : "Dokumen profil identitas resmi, penugasan cabang toko, serta wewenang sistem RBAC Anda."}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            onClick={handleOpenPhotoModal}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.75rem 1.25rem",
              background: "rgba(168, 85, 247, 0.15)",
              color: "#a855f7",
              border: "1px solid rgba(168, 85, 247, 0.4)",
              borderRadius: "var(--radius-md)",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all var(--t-fast)",
            }}
          >
            <span>📸</span>
            <span>Ganti Foto Profil</span>
          </button>

          {!isEditing ? (
            <button
              type="button"
              onClick={handleStartEdit}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.4rem",
                background: "var(--clr-primary)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--radius-md)",
                fontSize: "0.88rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
                transition: "all var(--t-fast)",
              }}
            >
              <span>✏️</span>
              <span>Edit Data Diri Admin</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancelEdit}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.7rem 1.25rem",
                background: "var(--bg-card)",
                color: "var(--text-secondary)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-md)",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <span>✕</span>
              <span>Batal Edit</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Dossier Card */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--radius-xl)",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          boxShadow: "var(--shadow-md)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.75rem", flexWrap: "wrap" }}>
          {/* Avatar with Glow and Quick Edit Trigger */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                style={{
                  width: "92px",
                  height: "92px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: `3px solid ${roleMeta.color}`,
                  boxShadow: `0 10px 30px ${roleMeta.color}55`,
                  display: "block",
                }}
              />
            ) : (
              <div
                style={{
                  width: "92px",
                  height: "92px",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${roleMeta.color}, #3b82f6)`,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2.4rem",
                  fontWeight: 900,
                  boxShadow: `0 10px 30px ${roleMeta.color}55`,
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
              </div>
            )}
            <button
              type="button"
              onClick={handleOpenPhotoModal}
              style={{
                position: "absolute",
                bottom: "2px",
                right: "2px",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "var(--bg-surface)",
                border: `2px solid ${roleMeta.color}`,
                color: "var(--text-contrast)",
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
                padding: 0,
              }}
              title="Ganti Foto Profil Anda"
            >
              📸
            </button>
          </div>

          {/* Identity details */}
          <div style={{ flex: 1, minWidth: "260px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--text-contrast)" }}>
                {user?.name || "Nama Pegawai"}
              </h2>
              <span
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  color: roleMeta.color,
                  background: `${roleMeta.color}15`,
                  border: `1px solid ${roleMeta.color}45`,
                  padding: "3px 10px",
                  borderRadius: "var(--radius-sm)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>{roleMeta.icon}</span>
                <span>{roleMeta.name}</span>
              </span>
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "var(--clr-success)",
                  background: "hsla(142, 70%, 45%, 0.12)",
                  border: "1px solid hsla(142, 70%, 45%, 0.3)",
                  padding: "3px 10px",
                  borderRadius: "var(--radius-sm)",
                  fontWeight: 700,
                }}
              >
                ● Akun Aktif
              </span>
            </div>

            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
              {roleMeta.division} • <strong>Raja Laptop Group</strong>
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: "1.2rem", flexWrap: "wrap", fontSize: "0.82rem", color: "var(--text-muted)" }}>
              <span>✉️ {user?.email}</span>
              <span>📞 {user?.phone || "0812-3456-7890"}</span>
              <span>📅 Terdaftar: {formatDateIndo(user?.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* 4 Stat Highlights */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "0.85rem",
            borderTop: "1px solid var(--glass-border)",
            paddingTop: "1.25rem",
          }}
        >
          <div style={{ background: "var(--bg-card)", padding: "0.85rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--glass-border)" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              🏢 Penempatan Cabang
            </span>
            <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--text-contrast)", marginTop: "4px" }}>
              {user?.stores && user.stores[0] ? user.stores[0].name : "Cabang Pekalongan"}
            </div>
          </div>

          <div style={{ background: "var(--bg-card)", padding: "0.85rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--glass-border)" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              🗺️ Wilayah Kerja
            </span>
            <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--text-contrast)", marginTop: "4px" }}>
              {user?.areas && user.areas[0] ? user.areas[0].name : "Jawa Tengah"}
            </div>
          </div>

          <div style={{ background: "var(--bg-card)", padding: "0.85rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--glass-border)" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              🛡️ Tingkat Wewenang
            </span>
            <div style={{ fontSize: "0.92rem", fontWeight: 800, color: scopeInfo.color, marginTop: "4px" }}>
              Scope {user?.defaultScope || "STORE"}
            </div>
          </div>

          <div style={{ background: "var(--bg-card)", padding: "0.85rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--glass-border)" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              🕒 Status Kesiapan
            </span>
            <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--clr-success)", marginTop: "4px" }}>
              Online & Siap Melayani
            </div>
          </div>
        </div>
      </div>

      {/* CONDITIONAL CONTENT: VIEW DOSSIER VS EDIT FORM */}
      {!isEditing ? (
        /* ================= MODE TAMPILAN BERKAS DATA DIRI ================= */
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Grid 2-Column: Biodata Pribadi & Penugasan Organisasi */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "1.5rem" }}>
            {/* Card 1: Biodata Pribadi & Kontak */}
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-xl)",
                padding: "1.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--glass-border)", paddingBottom: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span style={{ fontSize: "1.2rem" }}>👤</span>
                  <div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-contrast)" }}>
                      Identitas Pribadi & Kontak Pegawai
                    </h3>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Data identitas resmi akun yang terdaftar dalam sistem</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleStartEdit}
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--clr-primary)",
                    background: "transparent",
                    border: "none",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ✏️ Edit
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.85rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px dashed var(--glass-border)" }}>
                  <span style={{ color: "var(--text-muted)" }}>Nama Lengkap</span>
                  <strong style={{ color: "var(--text-contrast)" }}>{user?.name}</strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px dashed var(--glass-border)" }}>
                  <span style={{ color: "var(--text-muted)" }}>Alamat Email Akun</span>
                  <span style={{ color: "var(--text-contrast)", fontWeight: 600 }}>{user?.email}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px dashed var(--glass-border)" }}>
                  <span style={{ color: "var(--text-muted)" }}>Nomor WhatsApp / HP</span>
                  <span style={{ color: "var(--text-contrast)", fontWeight: 600 }}>{user?.phone || "0812-3456-7890"}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px dashed var(--glass-border)" }}>
                  <span style={{ color: "var(--text-muted)" }}>Status Kepegawaian</span>
                  <span style={{ color: "var(--clr-success)", fontWeight: 700 }}>Pegawai Internal Tetap (Aktif)</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px dashed var(--glass-border)" }}>
                  <span style={{ color: "var(--text-muted)" }}>Jam Operasional / Shift</span>
                  <span style={{ color: "var(--text-contrast)" }}>Shift Reguler (08.30 – 21.00 WIB)</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Alamat Domisili Penugasan</span>
                  <span style={{ color: "var(--text-contrast)" }}>Pekalongan / Jawa Tengah</span>
                </div>
              </div>
            </div>

            {/* Card 2: Penugasan Struktur & Scope RBAC */}
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-xl)",
                padding: "1.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", borderBottom: "1px solid var(--glass-border)", paddingBottom: "0.75rem" }}>
                <span style={{ fontSize: "1.2rem" }}>🏢</span>
                <div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-contrast)" }}>
                    Struktur Penugasan & Wewenang (RBAC)
                  </h3>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Hierarki operasional toko dan pembatasan isolasi data</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.85rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px dashed var(--glass-border)" }}>
                  <span style={{ color: "var(--text-muted)" }}>Peran Sistem (Role)</span>
                  <strong style={{ color: roleMeta.color }}>
                    {roleMeta.icon} {roleMeta.name} ({roleMeta.badge})
                  </strong>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px dashed var(--glass-border)" }}>
                  <span style={{ color: "var(--text-muted)" }}>Divisi Kerja</span>
                  <span style={{ color: "var(--text-contrast)" }}>{roleMeta.division}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px dashed var(--glass-border)" }}>
                  <span style={{ color: "var(--text-muted)" }}>Toko Fisik Cabang</span>
                  <span style={{ color: "var(--text-contrast)", fontWeight: 600 }}>{primaryStoreName}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px dashed var(--glass-border)" }}>
                  <span style={{ color: "var(--text-muted)" }}>Wilayah Regional</span>
                  <span style={{ color: "var(--text-contrast)" }}>{primaryAreaName}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Deskripsi Lingkup Akses (Data Scope Engine)</span>
                  <div
                    style={{
                      background: "var(--bg-card)",
                      border: `1px solid ${scopeInfo.color}40`,
                      borderRadius: "var(--radius-md)",
                      padding: "0.75rem",
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                    }}
                  >
                    <strong style={{ color: scopeInfo.color, display: "block", marginBottom: "2px" }}>
                      Tingkat: {scopeInfo.title}
                    </strong>
                    {scopeInfo.desc}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Keamanan Akun & Protokol Autentikasi */}
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-xl)",
              padding: "1.75rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1.25rem",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ fontSize: "1.2rem" }}>🔒</span>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-contrast)" }}>
                  Keamanan Akun & Protokol Autentikasi
                </h3>
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Kata sandi dienkripsi dengan standar <strong>Bcrypt 10 Salt Rounds</strong> dan sesi dilindungi dengan <strong>HTTP-Only JWT Token</strong>.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={handleStartEdit}
                style={{
                  padding: "0.65rem 1.25rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-contrast)",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>✏️</span>
                <span>Edit Data Diri / Password</span>
              </button>

              <Link
                href="/admin/pesanan"
                style={{
                  padding: "0.65rem 1.25rem",
                  background: "var(--clr-primary)",
                  color: "#fff",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                🛒 Terminal Kasir POS
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* ================= MODE FORM EDIT DATA DIRI ADMIN ================= */
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Section 1: Formulir Informasi Pribadi & Kontak */}
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-xl)",
              padding: "1.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            <div style={{ borderBottom: "1px solid var(--glass-border)", paddingBottom: "0.75rem" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-contrast)" }}>
                Edit Informasi Kontak & Profil Pegawai
              </h3>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Perbarui nama tampilan dan nomor WhatsApp/kontak resmi Anda.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Masukkan nama lengkap Anda"
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.9rem",
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
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                  Alamat Email (User ID Akun)
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.9rem",
                      background: "var(--bg-card-inner)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-muted)",
                      outline: "none",
                      fontSize: "0.85rem",
                      cursor: "not-allowed",
                    }}
                  />
                  <span style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    🔒 Terproteksi IT
                  </span>
                </div>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                  Email login dikelola oleh Super Admin/Owner demi keamanan audit trail.
                </span>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                  Nomor Handphone / WhatsApp
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.9rem",
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
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                  Peran & Jabatan Sistem
                </label>
                <input
                  type="text"
                  value={`${roleMeta.name} (${roleMeta.badge})`}
                  disabled
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.9rem",
                    background: "var(--bg-card-inner)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-muted)",
                    outline: "none",
                    fontSize: "0.85rem",
                    cursor: "not-allowed",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Ganti Password */}
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-xl)",
              padding: "1.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--glass-border)", paddingBottom: "0.75rem" }}>
              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-contrast)" }}>
                  Ganti Kata Sandi (Opsional)
                </h3>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Kosongkan bagian ini jika Anda tidak ingin mengubah password akun Anda saat ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                style={{
                  background: "transparent",
                  border: "1px solid var(--glass-border)",
                  padding: "4px 8px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.72rem",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                {showPassword ? "🙈 Sembunyikan" : "👁️ Tampilkan Password"}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                  Password Saat Ini
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Wajib diisi jika ubah password"
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.9rem",
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
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                  Password Baru
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.9rem",
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
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                  Konfirmasi Password Baru
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.9rem",
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

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", alignItems: "center" }}>
            <button
              type="button"
              onClick={handleCancelEdit}
              style={{
                padding: "0.75rem 1.4rem",
                background: "transparent",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-secondary)",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "0.75rem 1.8rem",
                background: "var(--clr-primary)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--radius-md)",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
              }}
            >
              <span>{saving ? "⏳" : "💾"}</span>
              <span>{saving ? "Menyimpan Data..." : "Simpan Perubahan Data Diri"}</span>
            </button>
          </div>
        </form>
      )}

      {/* ── MODAL KHUSUS: EDIT FOTO PROFIL ADMIN (TERPISAH SENDIRI) ── */}
      {showPhotoModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.78)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 1050,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !savingPhoto && !uploadingPhoto) {
              setShowPhotoModal(false);
            }
          }}
        >
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-xl)",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "1.25rem 1.5rem",
                background: `linear-gradient(135deg, ${roleMeta.color}25, var(--bg-card))`,
                borderBottom: "1px solid var(--glass-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-contrast)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>📸</span>
                  <span>Ganti Foto Profil Anda</span>
                </h3>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "3px 0 0" }}>
                  Perbarui foto avatar akun {user?.name || "Admin"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPhotoModal(false)}
                disabled={savingPhoto || uploadingPhoto}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--text-muted)",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "1rem",
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "1.75rem 1.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem" }}>
              {/* Large Avatar Preview with Glow */}
              <div style={{ position: "relative" }}>
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={user?.name || "Avatar"}
                    style={{
                      width: "110px",
                      height: "110px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: `3.5px solid ${roleMeta.color}`,
                      boxShadow: `0 8px 24px ${roleMeta.color}55`,
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "110px",
                      height: "110px",
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${roleMeta.color}, #3b82f6)`,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "2.8rem",
                      fontWeight: 900,
                      boxShadow: `0 8px 24px ${roleMeta.color}55`,
                    }}
                  >
                    {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
                  </div>
                )}

                {uploadingPhoto && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.7)",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                    }}
                  >
                    ⏳ Mengunggah...
                  </div>
                )}
              </div>

              <div style={{ textAlign: "center" }}>
                <h4 style={{ margin: "0 0 4px", fontSize: "1.05rem", fontWeight: 800, color: "var(--text-contrast)" }}>
                  {user?.name}
                </h4>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-sm)",
                      background: `${roleMeta.color}15`,
                      color: roleMeta.color,
                      fontWeight: 700,
                    }}
                  >
                    {roleMeta.name}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {user?.email}
                  </span>
                </div>
              </div>

              {/* Upload controls */}
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center", width: "100%" }}>
                <label
                  style={{
                    padding: "0.55rem 1.25rem",
                    background: "var(--clr-primary)",
                    color: "#fff",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: uploadingPhoto ? "not-allowed" : "pointer",
                    opacity: uploadingPhoto ? 0.6 : 1,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    transition: "all var(--t-fast)",
                  }}
                >
                  <span>📷</span>
                  <span>{uploadingPhoto ? "Mengunggah..." : photoUrl ? "Ganti File Foto" : "Pilih Foto Baru"}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleUploadPhoto}
                    disabled={uploadingPhoto || savingPhoto}
                    style={{ display: "none" }}
                  />
                </label>

                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => setPhotoUrl("")}
                    disabled={savingPhoto || uploadingPhoto}
                    style={{
                      padding: "0.55rem 1rem",
                      background: "hsla(0, 80%, 58%, 0.12)",
                      border: "1px solid hsla(0, 80%, 58%, 0.3)",
                      color: "var(--clr-danger)",
                      borderRadius: "var(--radius-md)",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    🗑️ Hapus Foto
                  </button>
                )}
              </div>

              {/* Optional manual URL input */}
              <div style={{ width: "100%", background: "var(--bg-card)", padding: "0.85rem", borderRadius: "var(--radius-md)", border: "1px solid var(--glass-border)" }}>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
                  Atau masukkan URL foto langsung:
                </label>
                <input
                  type="text"
                  placeholder="https://... atau /uploads/avatars/..."
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  disabled={savingPhoto || uploadingPhoto}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-contrast)",
                    fontSize: "0.8rem",
                    outline: "none",
                  }}
                />
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "4px 0 0" }}>
                  Mendukung file format JPG, PNG, atau WebP (maks. 5MB)
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "1rem 1.5rem",
                borderTop: "1px solid var(--glass-border)",
                background: "var(--bg-card)",
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
              }}
            >
              <button
                type="button"
                onClick={() => setShowPhotoModal(false)}
                disabled={savingPhoto || uploadingPhoto}
                className="btn-outline"
                style={{ padding: "0.55rem 1.1rem", fontSize: "0.82rem" }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSavePhoto}
                disabled={savingPhoto || uploadingPhoto}
                className="btn-primary"
                style={{
                  padding: "0.55rem 1.35rem",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  opacity: savingPhoto ? 0.7 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <span>💾</span>
                <span>{savingPhoto ? "Menyimpan Foto..." : "Simpan Foto Profil"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
