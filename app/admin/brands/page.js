"use client";

import { useState, useEffect } from "react";

const EMOJI_PRESETS = [
  "💻", "⚡", "🍏", "🐲", "💼", "🔥", "🏢", "🇮🇩", "🎮", "🚀", "👑", "🎯", "🛡️", "⭐", "💎", "🖥️", "⌨️", "🎧", "📱", "✨"
];

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(true);
  const [editingBrand, setEditingBrand] = useState(null);
  const [selectedIcon, setSelectedIcon] = useState("");
  const [saving, setSaving] = useState(false);

  const loadBrands = async () => {
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
          user?.permissionSlugs?.includes("settings.manage") ||
          user?.permissionSlugs?.includes("marketing.update")
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

      const res = await fetch("/api/brands");
      if (res.ok) {
        const data = await res.json();
        setBrands(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Gagal memuat brands:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const openEditModal = (b) => {
    setEditingBrand(b);
    setSelectedIcon(b.icon || "💻");
  };

  const handleSaveIcon = async (e) => {
    e.preventDefault();
    if (!editingBrand) return;
    setSaving(true);

    try {
      const res = await fetch("/api/brands", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingBrand.id,
          name: editingBrand.name,
          icon: selectedIcon,
          desc: editingBrand.desc || "Official Partner"
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah ikon");

      alert(`Ikon untuk brand "${editingBrand.name}" berhasil diubah menjadi ${selectedIcon}!`);
      setEditingBrand(null);
      await loadBrands();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!authorized) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <h2 style={{ color: "var(--clr-danger)" }}>⛔ Akses Dibatasi</h2>
        <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
          Hanya <strong>Super Admin, Owner, dan Digital Marketing</strong> yang berwenang mengubah ikon Brand Resmi.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "4px" }}>
          <span style={{ fontSize: "1.4rem" }}>🏷️</span>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-contrast)" }}>
            Brand Resmi & Official Partner
          </h1>
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Semua unit 100% Bergaransi Resmi Distributor Indonesia (TAM, Datascrip, Synnex, dll). Klik brand di bawah untuk mengganti ikon merk.
        </p>
      </div>

      {/* Grid Brand Cards */}
      {loading ? (
        <div style={{ padding: "2rem", color: "var(--text-muted)" }}>Memuat daftar brand...</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          {brands.map((b) => (
            <div
              key={b.id || b.name}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-lg)",
                padding: "1.25rem 1rem",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem",
                position: "relative",
              }}
            >
              <div
                style={{
                  fontSize: "2.5rem",
                  lineHeight: 1,
                  padding: "0.5rem",
                  background: "var(--bg-card)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--glass-border)",
                  width: "60px",
                  height: "60px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {b.icon || "💻"}
              </div>

              <strong style={{ fontSize: "1.05rem", color: "var(--text-contrast)" }}>
                {b.name}
              </strong>

              <span style={{ fontSize: "0.75rem", color: "var(--clr-primary)", fontWeight: 600 }}>
                {b.desc || "Official Partner"}
              </span>

              <button
                type="button"
                onClick={() => openEditModal(b)}
                style={{
                  marginTop: "0.5rem",
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  background: "var(--clr-primary)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "opacity var(--t-fast)",
                }}
              >
                🎨 Ganti Ikon Merk
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Ubah Ikon */}
      {editingBrand && (
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
          onClick={() => setEditingBrand(null)}
        >
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-lg)",
              padding: "1.75rem",
              width: "100%",
              maxWidth: "460px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-contrast)" }}>
                Ganti Ikon: {editingBrand.name}
              </h2>
              <button
                type="button"
                onClick={() => setEditingBrand(null)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveIcon} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Preview Ikon Terpilih */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "1rem",
                  padding: "1rem",
                  background: "var(--bg-card)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--glass-border)",
                }}
              >
                <span style={{ fontSize: "3rem" }}>{selectedIcon}</span>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Pratinjau Merk</div>
                  <strong style={{ fontSize: "1.1rem", color: "var(--text-contrast)" }}>{editingBrand.name}</strong>
                </div>
              </div>

              {/* Pilihan Cepat Preset Emoji */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px" }}>
                  Pilih dari Ikon Populer:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "6px" }}>
                  {EMOJI_PRESETS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedIcon(emoji)}
                      style={{
                        padding: "0.4rem 0",
                        fontSize: "1.3rem",
                        background: selectedIcon === emoji ? "var(--clr-primary)" : "var(--bg-card)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all var(--t-fast)",
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Manual Emoji / Simbol */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Atau Ketik Ikon Manual (Emoji / Simbol Text):
                </label>
                <input
                  type="text"
                  value={selectedIcon}
                  onChange={(e) => setSelectedIcon(e.target.value)}
                  placeholder="Ketik atau tempel emoji di sini..."
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.8rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-contrast)",
                    fontSize: "1rem",
                    textAlign: "center",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setEditingBrand(null)}
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
                  disabled={saving || !selectedIcon}
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
                  {saving ? "Menyimpan..." : "Simpan Ikon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
