"use client";

import { useState, useEffect, useMemo } from "react";

export default function CustomersAdminPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/customers");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || "Gagal memuat data pelanggan", "error");
      }
    } catch (err) {
      console.error("Gagal mengambil data pelanggan:", err);
      showToast("Terjadi kesalahan jaringan", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Yakin ingin menghapus customer "${name || id}"? Data yang sudah dihapus tidak dapat dipulihkan.`)) {
      return;
    }

    try {
      setDeletingId(id);
      const res = await fetch(`/api/admin/customers?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Pelanggan ${name} berhasil dihapus`);
        setCustomers((prev) => prev.filter((c) => c.id !== id));
        if (selectedCustomer?.id === id) setSelectedCustomer(null);
      } else {
        showToast(data.error || "Gagal menghapus pelanggan", "error");
      }
    } catch (err) {
      showToast("Kesalahan sistem saat menghapus", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // Filter & Search
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        !search ||
        (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
        (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
        (c.phone && c.phone.includes(search)) ||
        (c.id && c.id.toLowerCase().includes(search.toLowerCase()));

      const matchTier = tierFilter === "all" || (c.tier && c.tier.toLowerCase() === tierFilter.toLowerCase());

      return matchSearch && matchTier;
    });
  }, [customers, search, tierFilter]);

  // Quick stats
  const stats = useMemo(() => {
    const total = customers.length;
    const vipCount = customers.filter((c) => (c.tier || "").toLowerCase() === "vip").length;
    const memberCount = customers.filter((c) => (c.tier || "").toLowerCase() !== "vip").length;
    const totalPoints = customers.reduce((acc, curr) => acc + (Number(curr.points) || 0), 0);
    return { total, vipCount, memberCount, totalPoints };
  }, [customers]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Toast Alert */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "1.5rem",
            right: "1.5rem",
            zIndex: 9999,
            padding: "0.85rem 1.25rem",
            borderRadius: "10px",
            background: toast.type === "error" ? "rgba(239, 68, 68, 0.95)" : "rgba(16, 185, 129, 0.95)",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "0.9rem",
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            backdropFilter: "blur(8px)",
          }}
        >
          <span>{toast.type === "error" ? "⚠️" : "✅"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-contrast)", marginBottom: "4px" }}>
            Pelanggan Terdaftar
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Daftar customer & member yang telah membuat akun melalui website Raja Laptop.
          </p>
        </div>

        <button
          onClick={loadCustomers}
          disabled={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid var(--border-color)",
            color: "var(--text-contrast)",
            padding: "0.55rem 1.1rem",
            borderRadius: "8px",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <span style={{ transform: loading ? "rotate(180deg)" : "none", transition: "transform 0.5s ease" }}>🔄</span>
          {loading ? "Memperbarui..." : "Segarkan"}
        </button>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
        }}
      >
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            padding: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "10px",
              background: "rgba(59, 130, 246, 0.15)",
              color: "#3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.4rem",
            }}
          >
            👥
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Total Customer
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-contrast)" }}>
              {stats.total}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            padding: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "10px",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.4rem",
            }}
          >
            ⭐
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Member Reguler
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-contrast)" }}>
              {stats.memberCount}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            padding: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "10px",
              background: "rgba(245, 158, 11, 0.15)",
              color: "#f59e0b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.4rem",
            }}
          >
            👑
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Member VIP
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-contrast)" }}>
              {stats.vipCount}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            borderRadius: "12px",
            padding: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "10px",
              background: "rgba(168, 85, 247, 0.15)",
              color: "#a855f7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.4rem",
            }}
          >
            💎
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Total Poin Reward
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-contrast)" }}>
              {stats.totalPoints.toLocaleString("id-ID")}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          padding: "1rem 1.25rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: "0.75rem", flex: 1, minWidth: "260px" }}>
          <div style={{ position: "relative", width: "100%" }}>
            <span
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Cari berdasarkan nama, email, nomor HP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "0.6rem 1rem 0.6rem 2.4rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                background: "rgba(0, 0, 0, 0.2)",
                color: "var(--text-contrast)",
                fontSize: "0.875rem",
                outline: "none",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Tier:</label>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              background: "var(--bg-surface)",
              color: "var(--text-contrast)",
              fontSize: "0.875rem",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">Semua Status Tier</option>
            <option value="Member">Member Reguler</option>
            <option value="VIP">Member VIP</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "0.875rem",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--border-color)",
                  background: "rgba(255, 255, 255, 0.02)",
                  color: "var(--text-muted)",
                }}
              >
                <th style={{ padding: "0.9rem 1.25rem", fontWeight: 600 }}>Pelanggan</th>
                <th style={{ padding: "0.9rem 1.25rem", fontWeight: 600 }}>Kontak & WhatsApp</th>
                <th style={{ padding: "0.9rem 1.25rem", fontWeight: 600 }}>Tier Akun</th>
                <th style={{ padding: "0.9rem 1.25rem", fontWeight: 600 }}>Poin</th>
                <th style={{ padding: "0.9rem 1.25rem", fontWeight: 600 }}>Tanggal Daftar</th>
                <th style={{ padding: "0.9rem 1.25rem", fontWeight: 600, textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                    <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>⏳</div>
                    Memuat daftar pelanggan dari database...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: "3.5rem 1rem", textAlign: "center", color: "var(--text-muted)" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>👥</div>
                    <div style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px" }}>
                      Tidak ada pelanggan ditemukan
                    </div>
                    <div style={{ fontSize: "0.8rem" }}>
                      {search || tierFilter !== "all"
                        ? "Coba ubah kata kunci pencarian atau filter yang Anda gunakan."
                        : "Belum ada pelanggan yang mendaftar akun di website."}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const isVIP = (c.tier || "").toLowerCase() === "vip";
                  return (
                    <tr
                      key={c.id}
                      style={{
                        borderBottom: "1px solid var(--border-color)",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {/* Name & Avatar */}
                      <td style={{ padding: "0.9rem 1.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              background: isVIP
                                ? "linear-gradient(135deg, #f59e0b, #d97706)"
                                : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                              color: "#ffffff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "0.85rem",
                              flexShrink: 0,
                            }}
                          >
                            {(c.name || "C").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--text-contrast)" }}>
                              {c.name || "Tanpa Nama"}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                              {c.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td style={{ padding: "0.9rem 1.25rem", color: "var(--text-secondary)" }}>
                        {c.phone ? (
                          <a
                            href={`https://wa.me/${c.phone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#10b981",
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <span>💬</span>
                            <span>{c.phone}</span>
                          </a>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>-</span>
                        )}
                      </td>

                      {/* Tier Badge */}
                      <td style={{ padding: "0.9rem 1.25rem" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "0.25rem 0.65rem",
                            borderRadius: "999px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            background: isVIP ? "rgba(245, 158, 11, 0.15)" : "rgba(59, 130, 246, 0.15)",
                            color: isVIP ? "#f59e0b" : "#60a5fa",
                            border: `1px solid ${isVIP ? "rgba(245, 158, 11, 0.3)" : "rgba(59, 130, 246, 0.3)"}`,
                          }}
                        >
                          {isVIP ? "👑 VIP" : "⭐ Member"}
                        </span>
                      </td>

                      {/* Points */}
                      <td style={{ padding: "0.9rem 1.25rem" }}>
                        <span style={{ fontWeight: 700, color: "var(--text-contrast)" }}>
                          {(Number(c.points) || 0).toLocaleString("id-ID")}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "4px" }}>
                          pts
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: "0.9rem 1.25rem", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                        {formatDate(c.created_at)}
                      </td>

                      {/* Action */}
                      <td style={{ padding: "0.9rem 1.25rem", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                          <button
                            onClick={() => setSelectedCustomer(c)}
                            title="Lihat Detail Pelanggan"
                            style={{
                              background: "rgba(255, 255, 255, 0.05)",
                              border: "1px solid var(--border-color)",
                              color: "var(--text-contrast)",
                              padding: "0.35rem 0.65rem",
                              borderRadius: "6px",
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            👁️ Detail
                          </button>

                          <button
                            onClick={() => handleDelete(c.id, c.name)}
                            disabled={deletingId === c.id}
                            title="Hapus Akun Pelanggan"
                            style={{
                              background: "rgba(239, 68, 68, 0.1)",
                              border: "1px solid rgba(239, 68, 68, 0.25)",
                              color: "#ef4444",
                              padding: "0.35rem 0.65rem",
                              borderRadius: "6px",
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              cursor: deletingId === c.id ? "not-allowed" : "pointer",
                            }}
                          >
                            {deletingId === c.id ? "..." : "🗑️"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Pelanggan */}
      {selectedCustomer && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            style={{
              background: "var(--bg-surface, #18181b)",
              border: "1px solid var(--border-color, #27272a)",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "520px",
              padding: "1.75rem",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background:
                      (selectedCustomer.tier || "").toLowerCase() === "vip"
                        ? "linear-gradient(135deg, #f59e0b, #d97706)"
                        : "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                  }}
                >
                  {(selectedCustomer.name || "C").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-contrast)", margin: 0 }}>
                    {selectedCustomer.name || "Pelanggan Tanpa Nama"}
                  </h3>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    ID: {selectedCustomer.id}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: "1.3rem",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Info Items */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                background: "rgba(255, 255, 255, 0.02)",
                padding: "1rem",
                borderRadius: "10px",
                border: "1px solid var(--border-color)",
              }}
            >
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "2px" }}>Email</div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-contrast)", wordBreak: "break-all" }}>
                  {selectedCustomer.email || "-"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "2px" }}>Nomor Handphone</div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-contrast)" }}>
                  {selectedCustomer.phone || "-"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "2px" }}>Status Keanggotaan</div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: (selectedCustomer.tier || "").toLowerCase() === "vip" ? "#f59e0b" : "#3b82f6" }}>
                  {selectedCustomer.tier || "Member"}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "2px" }}>Akumulasi Poin</div>
                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-contrast)" }}>
                  {(Number(selectedCustomer.points) || 0).toLocaleString("id-ID")} Poin
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>Alamat Pengiriman / Domisili:</div>
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                  fontSize: "0.85rem",
                  color: selectedCustomer.address ? "var(--text-contrast)" : "var(--text-muted)",
                }}
              >
                {selectedCustomer.address || "Belum ada data alamat yang dicatat."}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "2px" }}>Waktu Registrasi Akun:</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                {formatDate(selectedCustomer.created_at)}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              {selectedCustomer.phone && (
                <a
                  href={`https://wa.me/${selectedCustomer.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "#10b981",
                    color: "#ffffff",
                    textDecoration: "none",
                    padding: "0.55rem 1rem",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  💬 Hubungi via WhatsApp
                </a>
              )}
              <button
                onClick={() => setSelectedCustomer(null)}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-contrast)",
                  padding: "0.55rem 1.1rem",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
