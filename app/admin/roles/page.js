"use client";

import { useState, useEffect } from "react";

export default function RolesManagementPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    defaultScope: "STORE",
    permissions: [],
  });

  const loadRoles = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/roles");
      if (res.ok) {
        const json = await res.json();
        setRoles(json.roles || []);
        setPermissions(json.availablePermissions || []);
      }
    } catch (err) {
      console.error("Gagal memuat roles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const openCreateModal = () => {
    setEditingRole(null);
    setFormData({
      name: "",
      description: "",
      defaultScope: "STORE",
      permissions: ["dashboard.view", "products.view"],
    });
    setShowModal(true);
  };

  const openEditModal = (role) => {
    setEditingRole(role);
    setFormData({
      id: role.id,
      name: role.name,
      description: role.description || "",
      defaultScope: role.default_scope,
      permissions: (role.permissions || []).map((p) => p.slug),
    });
    setShowModal(true);
  };

  const togglePermission = (slug) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(slug);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== slug)
          : [...prev.permissions, slug],
      };
    });
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    const isEdit = Boolean(editingRole);
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch("/api/roles", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Gagal menyimpan role");
        return;
      }
      alert(`Role ${formData.name} berhasil disimpan!`);
      setShowModal(false);
      await loadRoles();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDeleteRole = async (role) => {
    if (!confirm(`Hapus custom role "${role.name}"?`)) return;
    try {
      const res = await fetch(`/api/roles?id=${role.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Gagal menghapus role");
        return;
      }
      alert("Role berhasil dihapus!");
      await loadRoles();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // Group permissions by module
  const permsByModule = permissions.reduce((acc, p) => {
    acc[p.module] = acc[p.module] || [];
    acc[p.module].push(p);
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-contrast)", marginBottom: "4px" }}>
            Manajemen Role & Hak Akses Granular (RBAC)
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Definisikan role standar dan kustom dengan izin granular berbasis Resource, Action, dan Scope akses data.
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
          + Buat Custom Role Baru
        </button>
      </div>

      {/* Roles Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
        {loading ? (
          <div style={{ padding: "2rem", color: "var(--text-muted)" }}>Memuat role...</div>
        ) : (
          roles.map((r) => {
            return (
              <div
                key={r.id}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "1rem",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                    <div>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-contrast)" }}>
                        {r.name}
                      </h3>
                      <code style={{ fontSize: "0.75rem", color: "var(--clr-primary)" }}>{r.slug}</code>
                    </div>

                    <span
                      style={{
                        background: r.is_system ? "hsla(220, 90%, 56%, 0.15)" : "hsla(140, 70%, 45%, 0.15)",
                        color: r.is_system ? "var(--clr-primary)" : "#10b981",
                        fontSize: "0.68rem",
                        padding: "2px 8px",
                        borderRadius: "var(--radius-full)",
                        fontWeight: 800,
                      }}
                    >
                      {r.is_system ? "System" : "Custom"}
                    </span>
                  </div>

                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.75rem", minHeight: "2.4em" }}>
                    {r.description || "Tidak ada deskripsi"}
                  </p>

                  <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    <span>📍 Default Scope:</span>
                    <strong style={{ color: "var(--text-contrast)" }}>{r.default_scope}</strong>
                  </div>

                  <div style={{ marginTop: "0.75rem", borderTop: "1px solid var(--glass-border)", paddingTop: "0.75rem" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, marginBottom: "6px" }}>
                      IZIN GRANULAR ({r.permissions?.length || 0})
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", maxHeight: "100px", overflowY: "auto" }}>
                      {r.permissions?.slice(0, 12).map((p) => (
                        <span
                          key={p.slug}
                          style={{
                            background: "var(--bg-surface)",
                            border: "1px solid var(--glass-border)",
                            color: "var(--text-secondary)",
                            padding: "1px 6px",
                            borderRadius: "3px",
                            fontSize: "0.68rem",
                          }}
                        >
                          {p.slug}
                        </span>
                      ))}
                      {r.permissions?.length > 12 && (
                        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                          +{r.permissions.length - 12} lainnya
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", borderTop: "1px solid var(--glass-border)", paddingTop: "0.75rem" }}>
                  <button
                    onClick={() => openEditModal(r)}
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "1px solid var(--clr-primary)",
                      color: "var(--clr-primary)",
                      padding: "0.45rem",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Ubah Izin
                  </button>
                  {!r.is_system && (
                    <button
                      onClick={() => handleDeleteRole(r)}
                      style={{
                        background: "hsla(0, 80%, 58%, 0.15)",
                        border: "1px solid var(--clr-danger)",
                        color: "#ff8b8b",
                        padding: "0.45rem 0.75rem",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.78rem",
                        cursor: "pointer",
                      }}
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Form Role & Permissions */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "grid",
            placeItems: "center",
            zIndex: 999,
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-lg)",
              padding: "1.75rem",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-contrast)" }}>
                {editingRole ? `Konfigurasi Izin: ${editingRole.name}` : "Buat Custom Role Baru"}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}>✕</button>
            </div>

            <form onSubmit={handleSaveRole} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Nama Role *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Contoh: Supervisor Toko"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", color: "var(--text-contrast)", border: "1px solid var(--glass-border)" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Scope Akses Default *
                  </label>
                  <select
                    value={formData.defaultScope}
                    onChange={(e) => setFormData({ ...formData, defaultScope: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", color: "var(--text-contrast)", border: "1px solid var(--glass-border)" }}
                  >
                    <option value="ALL">ALL (Seluruh Data Perusahaan)</option>
                    <option value="AREA">AREA (Toko dalam Regional Area Tertentu)</option>
                    <option value="STORE">STORE (Hanya Toko Cabang Penugasan)</option>
                    <option value="OWN">OWN (Hanya Transaksi Pribadi / Kasir)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Deskripsi Tanggung Jawab
                </label>
                <input
                  type="text"
                  placeholder="Penjelasan fungsi dan wewenang role ini..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", color: "var(--text-contrast)", border: "1px solid var(--glass-border)" }}
                />
              </div>

              {/* Granular Permissions Checkboxes Grouped by Module */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-contrast)" }}>
                    Izin Granular (Permissions)
                  </label>
                  <span style={{ fontSize: "0.72rem", color: "var(--clr-primary)", fontWeight: 700 }}>
                    {formData.permissions.length} dipilih
                  </span>
                </div>

                <div
                  style={{
                    maxHeight: "300px",
                    overflowY: "auto",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "0.75rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  {Object.entries(permsByModule).map(([modName, pList]) => (
                    <div key={modName}>
                      <div style={{ fontSize: "0.72rem", textTransform: "uppercase", fontWeight: 800, color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                        MODUL: {modName}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "6px" }}>
                        {pList.map((p) => {
                          const checked = formData.permissions.includes(p.slug);
                          return (
                            <label
                              key={p.slug}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "0.78rem",
                                color: checked ? "var(--text-contrast)" : "var(--text-secondary)",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                background: checked ? "hsla(220, 90%, 56%, 0.12)" : "transparent",
                                cursor: "pointer",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePermission(p.slug)}
                              />
                              <div>
                                <strong>{p.slug}</strong>
                                <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{p.description}</div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: "transparent", border: "1px solid var(--glass-border)", color: "var(--text-secondary)", padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", cursor: "pointer" }}>Batal</button>
                <button type="submit" style={{ background: "var(--clr-primary)", border: "none", color: "#fff", padding: "0.5rem 1.25rem", borderRadius: "var(--radius-md)", fontWeight: 700, cursor: "pointer" }}>Simpan Konfigurasi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
