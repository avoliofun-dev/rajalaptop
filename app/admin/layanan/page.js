"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminLayananPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    badge: "Bisa Ditunggu",
    duration: "30-45 Menit",
    warranty: "1 Bulan",
    priceText: "Mulai Rp 75.000",
    desc: "",
    features: "",
    sort_order: 1,
  });

  const loadServices = async () => {
    try {
      setLoading(true);
      const authRes = await fetch("/api/auth/admin/me", { cache: "no-store" });
      if (authRes.ok) {
        const authData = await authRes.json();
        const user = authData.user;
        const canManage = Boolean(
          user?.isSuperAdmin ||
          user?.isOwner ||
          user?.role === "super_admin" ||
          user?.role === "owner" ||
          user?.role === "digital_marketing" ||
          user?.permissionSlugs?.includes("marketing.update") ||
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

      const res = await fetch("/api/store-services");
      if (res.ok) {
        const data = await res.json();
        setServices(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Gagal memuat layanan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const openCreateModal = () => {
    setEditingService(null);
    setFormData({
      title: "",
      badge: "Bisa Ditunggu",
      duration: "30-45 Menit",
      warranty: "1 Bulan",
      priceText: "Mulai Rp 75.000",
      desc: "",
      features: "Pembersihan total, Thermal paste premium, Pengecekan temperatur",
      sort_order: services.length + 1,
    });
    setShowModal(true);
  };

  const openEditModal = (s) => {
    setEditingService(s);
    setFormData({
      id: s.id,
      title: s.title || "",
      badge: s.badge || "",
      duration: s.duration || "",
      warranty: s.warranty || "",
      priceText: s.priceText || "",
      desc: s.desc || "",
      features: s.features || "",
      sort_order: s.sort_order || 1,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const method = editingService ? "PUT" : "POST";
    const payload = editingService ? { ...formData, id: editingService.id } : formData;

    try {
      const res = await fetch("/api/store-services", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan layanan");

      alert(`Layanan "${formData.title}" berhasil disimpan!`);
      setShowModal(false);
      await loadServices();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s) => {
    if (!confirm(`Hapus layanan "${s.title}"?`)) return;
    try {
      const res = await fetch(`/api/store-services?id=${s.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus layanan");
      alert("Layanan berhasil dihapus.");
      await loadServices();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  if (!authorized) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <h2 style={{ color: "var(--clr-danger)" }}>⛔ Akses Dibatasi</h2>
        <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
          Hanya <strong>Super Admin, Owner, dan Digital Marketing</strong> yang berwenang mengelola konten Layanan Servis.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-contrast)" }}>
            🔧 Kelola Konten Servis & Reparasi
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Atur daftar kartu layanan unggulan bengkel laptop yang ditampilkan pada landing page publik.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          style={{
            background: "var(--clr-primary)",
            color: "#fff",
            border: "none",
            padding: "0.65rem 1.25rem",
            borderRadius: "var(--radius-md)",
            fontSize: "0.85rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          + Tambah Layanan Baru
        </button>
      </div>

      {/* Grid Layanan */}
      {loading ? (
        <div style={{ padding: "2rem", color: "var(--text-muted)" }}>Memuat layanan...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
          {services.map((s) => (
            <div
              key={s.id}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-lg)",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  padding: "3px 8px",
                  borderRadius: "9999px",
                  background: "hsla(220, 90%, 56%, 0.15)",
                  color: "var(--clr-primary)",
                }}>
                  {s.badge || "Layanan"}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Urutan: #{s.sort_order || 1}
                </span>
              </div>

              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-contrast)" }}>
                {s.title}
              </h3>

              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5, flex: 1 }}>
                {s.desc}
              </p>

              <div style={{
                background: "var(--bg-card)",
                padding: "0.65rem",
                borderRadius: "var(--radius-md)",
                fontSize: "0.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                border: "1px solid var(--glass-border)"
              }}>
                <div>⏱️ <strong>Durasi:</strong> {s.duration}</div>
                <div>🛡️ <strong>Garansi:</strong> {s.warranty}</div>
                <div>💰 <strong>Biaya:</strong> <span style={{ color: "var(--clr-primary)", fontWeight: 700 }}>{s.priceText}</span></div>
                {s.features && (
                  <div style={{ marginTop: "4px", borderTop: "1px dashed var(--glass-border)", paddingTop: "4px", color: "var(--text-muted)" }}>
                    ✨ {s.features}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button
                  onClick={() => openEditModal(s)}
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    color: "var(--text-contrast)",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(s)}
                  style={{
                    flex: 1,
                    padding: "0.5rem",
                    borderRadius: "var(--radius-sm)",
                    background: "hsla(0, 80%, 58%, 0.12)",
                    border: "1px solid var(--clr-danger)",
                    color: "#ff8b8b",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  🗑️ Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-lg)",
              padding: "1.75rem",
              width: "100%",
              maxWidth: "520px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "1rem", color: "var(--text-contrast)" }}>
              {editingService ? "✏️ Edit Layanan Servis" : "➕ Tambah Layanan Servis"}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Judul Layanan *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Ganti Pasta & Pembersihan Kipas"
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.8rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-contrast)",
                    fontSize: "0.85rem",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Badge Tag
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="Bisa Ditunggu / Garansi Resmi"
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.8rem",
                      background: "var(--bg-card)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-contrast)",
                      fontSize: "0.85rem",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Urutan Tampil
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.8rem",
                      background: "var(--bg-card)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-contrast)",
                      fontSize: "0.85rem",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Estimasi Durasi
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="30-45 Menit / 1-2 Hari"
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.8rem",
                      background: "var(--bg-card)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-contrast)",
                      fontSize: "0.85rem",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Garansi Pengerjaan
                  </label>
                  <input
                    type="text"
                    value={formData.warranty}
                    onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
                    placeholder="1 Bulan / 3 Bulan"
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.8rem",
                      background: "var(--bg-card)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-contrast)",
                      fontSize: "0.85rem",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Informasi Biaya / Harga
                </label>
                <input
                  type="text"
                  value={formData.priceText}
                  onChange={(e) => setFormData({ ...formData, priceText: e.target.value })}
                  placeholder="Mulai Rp 75.000 / Gratis Pengecekan"
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.8rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-contrast)",
                    fontSize: "0.85rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Deskripsi Lengkap Layanan
                </label>
                <textarea
                  rows={3}
                  value={formData.desc}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                  placeholder="Jelaskan alur perbaikan atau servis yang dilakukan teknisi..."
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.8rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-contrast)",
                    fontSize: "0.85rem",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Fitur Poin Unggulan (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Pembersihan total, Thermal paste premium, Bebas biaya cek"
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.8rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-contrast)",
                    fontSize: "0.85rem",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: "0.65rem",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: "0.65rem",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--clr-primary)",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  {saving ? "Menyimpan..." : "Simpan Layanan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
