"use client";

import { useState, useEffect } from "react";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  const [filters, setFilters] = useState({
    role: "",
    module: "",
    status: "",
    action: "",
  });

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.role) params.set("role", filters.role);
      if (filters.module) params.set("module", filters.module);
      if (filters.status) params.set("status", filters.status);
      if (filters.action) params.set("action", filters.action);

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setLogs(json.logs || []);
        setTotal(json.total || 0);
      }
    } catch (err) {
      console.error("Gagal memuat audit log:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [filters]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-contrast)", marginBottom: "4px" }}>
            Audit Trail & Log Aktivitas Sistem
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Rekam jejak forensik seluruh tindakan pengguna, transaksi keuangan, perubahan role, dan akses server.
          </p>
        </div>

        <div
          style={{
            background: "hsla(140, 70%, 45%, 0.12)",
            border: "1px solid #10b981",
            color: "#10b981",
            padding: "0.5rem 1rem",
            borderRadius: "var(--radius-md)",
            fontSize: "0.75rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>🔒</span>
          <span>Immutable: Data log tidak dapat diubah / dihapus oleh siapapun</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--radius-md)",
          padding: "1rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div>
          <label style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "2px" }}>
            Filter Role
          </label>
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            style={{
              padding: "0.45rem 0.75rem",
              background: "var(--bg-surface)",
              color: "var(--text-contrast)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.8rem",
            }}
          >
            <option value="">Semua Role</option>
            <option value="owner">Owner</option>
            <option value="super_admin">Super Admin</option>
            <option value="manajer_area">Manager Area</option>
            <option value="kepala_toko">Kepala Toko</option>
            <option value="kasir">Kasir</option>
            <option value="gudang">Gudang</option>
            <option value="finance">Finance</option>
            <option value="digital_marketing">Marketing</option>
            <option value="audit">Audit</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "2px" }}>
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            style={{
              padding: "0.45rem 0.75rem",
              background: "var(--bg-surface)",
              color: "var(--text-contrast)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.8rem",
            }}
          >
            <option value="">Semua Status</option>
            <option value="SUCCESS">SUCCESS (Berhasil)</option>
            <option value="FAILED">FAILED (Gagal/Ditolak)</option>
            <option value="BLOCKED">BLOCKED (Diblokir)</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "2px" }}>
            Modul
          </label>
          <select
            value={filters.module}
            onChange={(e) => setFilters({ ...filters, module: e.target.value })}
            style={{
              padding: "0.45rem 0.75rem",
              background: "var(--bg-surface)",
              color: "var(--text-contrast)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-sm)",
              fontSize: "0.8rem",
            }}
          >
            <option value="">Semua Modul</option>
            <option value="AUTH">AUTH</option>
            <option value="USERS">USERS</option>
            <option value="RBAC">RBAC</option>
            <option value="SALES">SALES / POS</option>
            <option value="INVENTORY">INVENTORY</option>
            <option value="APPROVAL">APPROVAL</option>
            <option value="SETTINGS">SETTINGS</option>
          </select>
        </div>

        <button
          onClick={() => setFilters({ role: "", module: "", status: "", action: "" })}
          style={{
            alignSelf: "flex-end",
            padding: "0.45rem 0.85rem",
            background: "transparent",
            border: "1px solid var(--glass-border)",
            color: "var(--text-muted)",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.75rem",
            cursor: "pointer",
          }}
        >
          Reset Filter
        </button>
      </div>

      {/* Log Table & Drawer */}
      <div style={{ display: "grid", gridTemplateColumns: selectedLog ? "1fr 380px" : "1fr", gap: "1.5rem" }}>
        <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--glass-border)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
            <thead>
              <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--glass-border)", color: "var(--text-muted)" }}>
                <th style={{ padding: "0.85rem 1rem" }}>Waktu (WIB)</th>
                <th style={{ padding: "0.85rem 1rem" }}>Pengguna & Role</th>
                <th style={{ padding: "0.85rem 1rem" }}>Aksi & Modul</th>
                <th style={{ padding: "0.85rem 1rem" }}>IP / Perangkat</th>
                <th style={{ padding: "0.85rem 1rem" }}>Status</th>
                <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                    Memuat audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                    Tidak ada catatan audit yang cocok.
                  </td>
                </tr>
              ) : (
                logs.map((item) => {
                  let statusColor = "#10b981";
                  if (item.status === "FAILED") statusColor = "#f59e0b";
                  if (item.status === "BLOCKED") statusColor = "#ef4444";

                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: "1px solid var(--glass-border)",
                        background: selectedLog?.id === item.id ? "hsla(220, 90%, 56%, 0.08)" : "transparent",
                      }}
                    >
                      <td style={{ padding: "0.85rem 1rem", whiteSpace: "nowrap" }}>
                        <span style={{ fontWeight: 600, color: "var(--text-contrast)" }}>
                          {new Date(item.created_at).toLocaleTimeString("id-ID")}
                        </span>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                          {new Date(item.created_at).toLocaleDateString("id-ID")}
                        </div>
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <strong style={{ display: "block", color: "var(--text-contrast)" }}>{item.user_name || item.user_email}</strong>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{item.role}</span>
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <code style={{ fontSize: "0.8rem", color: "var(--clr-primary)", fontWeight: 700 }}>
                          {item.action}
                        </code>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                          Modul: {item.module} {item.resource_type ? `(${item.resource_type})` : ""}
                        </div>
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span style={{ color: "var(--text-contrast)" }}>{item.ip_address || "127.0.0.1"}</span>
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.user_agent || "Browser"}
                        </div>
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span
                          style={{
                            background: `${statusColor}20`,
                            color: statusColor,
                            border: `1px solid ${statusColor}40`,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "0.7rem",
                            fontWeight: 800,
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                        <button
                          onClick={() => setSelectedLog(item)}
                          style={{
                            background: "transparent",
                            border: "1px solid var(--glass-border)",
                            color: "var(--clr-primary)",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          Inspeksi
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Inspection Drawer */}
        {selectedLog && (
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--glass-border)",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-contrast)" }}>
                Inspeksi Log #{selectedLog.id}
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div><strong>Aksi:</strong> {selectedLog.action}</div>
              <div><strong>User:</strong> {selectedLog.user_name} ({selectedLog.user_email})</div>
              <div><strong>Role:</strong> {selectedLog.role}</div>
              <div><strong>Waktu:</strong> {new Date(selectedLog.created_at).toLocaleString("id-ID")}</div>
              <div><strong>IP:</strong> {selectedLog.ip_address}</div>
              {selectedLog.details && (
                <div style={{ background: "var(--bg-surface)", padding: "0.5rem", borderRadius: "4px", marginTop: "4px" }}>
                  <strong>Keterangan:</strong> {selectedLog.details}
                </div>
              )}
              {selectedLog.reason && (
                <div style={{ color: "#ef4444" }}>
                  <strong>Alasan/Sebab:</strong> {selectedLog.reason}
                </div>
              )}
            </div>

            {selectedLog.old_value && (
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700 }}>NILAI SEBELUMNYA (OLD)</span>
                <pre style={{ background: "var(--bg-surface)", padding: "0.6rem", borderRadius: "4px", fontSize: "0.72rem", overflowX: "auto", color: "#f87171" }}>
                  {typeof selectedLog.old_value === "string" ? selectedLog.old_value : JSON.stringify(selectedLog.old_value, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.new_value && (
              <div>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700 }}>NILAI BARU (NEW)</span>
                <pre style={{ background: "var(--bg-surface)", padding: "0.6rem", borderRadius: "4px", fontSize: "0.72rem", overflowX: "auto", color: "#4ade80" }}>
                  {typeof selectedLog.new_value === "string" ? selectedLog.new_value : JSON.stringify(selectedLog.new_value, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
