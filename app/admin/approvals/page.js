"use client";

import { useState, useEffect } from "react";

export default function ApprovalsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [currentUser, setCurrentUser] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    requestType: "DISCOUNT",
    reason: "",
    referenceType: "ORDER",
    referenceId: "",
    newValue: "",
  });

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/approvals");
      if (res.ok) {
        const json = await res.json();
        setRequests(json.requests || []);
      }
    } catch (err) {
      console.error("Gagal memuat approval:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch("/api/auth/admin/me");
        if (meRes.ok) {
          const meData = await meRes.json();
          setCurrentUser(meData.user);
        }
      } catch {}
      await loadApprovals();
    })();
  }, []);

  const handleDecision = async (requestId, decision) => {
    const notes = prompt(`Masukkan catatan untuk keputusan ${decision}:`) || "";
    try {
      setProcessingId(requestId);
      const res = await fetch("/api/approvals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, decision, notes }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Gagal memproses permohonan");
        return;
      }
      alert(`Permohonan #${requestId} berhasil di-${decision.toLowerCase()}`);
      await loadApprovals();
    } catch (err) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Gagal mengajukan approval");
        return;
      }
      alert("Permohonan persetujuan berhasil diajukan!");
      setShowModal(false);
      setFormData({ requestType: "DISCOUNT", reason: "", referenceType: "ORDER", referenceId: "", newValue: "" });
      await loadApprovals();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (activeTab === "ALL") return true;
    return r.status === activeTab;
  });

  const canApprove =
    currentUser?.isSuperAdmin ||
    currentUser?.isOwner ||
    currentUser?.permissionSlugs?.includes("approval.approve");

  const canCreate =
    currentUser?.isSuperAdmin ||
    currentUser?.permissionSlugs?.includes("approval.create");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-contrast)", marginBottom: "4px" }}>
            Sistem Approval & Otorisasi Transaksi
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Otorisasi berjenjang untuk diskon khusus, pengembalian dana (refund), penyesuaian stok, dan biaya operasional.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
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
            + Ajukan Approval Baru
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--glass-border)", paddingBottom: "0.75rem" }}>
        {[
          { key: "ALL", label: `Semua (${requests.length})` },
          { key: "PENDING", label: `Menunggu (${requests.filter((r) => r.status === "PENDING").length})` },
          { key: "APPROVED", label: "Disetujui" },
          { key: "REJECTED", label: "Ditolak" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "var(--radius-md)",
              border: "none",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              background: activeTab === tab.key ? "var(--clr-primary)" : "var(--bg-card)",
              color: activeTab === tab.key ? "#fff" : "var(--text-secondary)",
              transition: "all 0.2s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--glass-border)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--glass-border)", color: "var(--text-muted)" }}>
              <th style={{ padding: "0.85rem 1rem" }}>ID & Tipe</th>
              <th style={{ padding: "0.85rem 1rem" }}>Pemohon & Toko</th>
              <th style={{ padding: "0.85rem 1rem" }}>Referensi & Alasan</th>
              <th style={{ padding: "0.85rem 1rem" }}>Status</th>
              <th style={{ padding: "0.85rem 1rem" }}>Otorisasi</th>
              <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                  Memuat data permohonan...
                </td>
              </tr>
            ) : filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                  Tidak ada permohonan approval dalam status ini.
                </td>
              </tr>
            ) : (
              filteredRequests.map((r) => {
                const isPending = r.status === "PENDING";
                const isRequester = currentUser?.id === r.requester_id;
                const canDecideThis = canApprove && !isRequester;

                let badgeColor = "#f59e0b";
                if (r.status === "APPROVED") badgeColor = "#10b981";
                if (r.status === "REJECTED") badgeColor = "#ef4444";
                if (r.status === "CANCELLED") badgeColor = "#6b7280";

                return (
                  <tr key={r.id} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                    <td style={{ padding: "1rem" }}>
                      <strong style={{ display: "block", color: "var(--text-contrast)" }}>{r.id}</strong>
                      <span style={{ fontSize: "0.75rem", color: "var(--clr-primary)", fontWeight: 700 }}>
                        {r.request_type}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{ fontWeight: 600, color: "var(--text-contrast)" }}>{r.requester_name || r.requester_id}</span>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{r.store_name || "Kantor Pusat"}</div>
                    </td>
                    <td style={{ padding: "1rem", maxWidth: "300px" }}>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        <strong>Ref:</strong> {r.reference_type} #{r.reference_id || "-"}
                      </div>
                      <div style={{ fontSize: "0.8rem", marginTop: "4px", color: "var(--text-contrast)" }}>
                        {r.reason}
                      </div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span
                        style={{
                          background: `${badgeColor}20`,
                          color: badgeColor,
                          border: `1px solid ${badgeColor}40`,
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {r.approver_name ? (
                        <div>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-contrast)" }}>{r.approver_name}</span>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                            {new Date(r.approved_at || r.updated_at).toLocaleString("id-ID")}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      {isPending && canDecideThis && (
                        <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                          <button
                            disabled={processingId === r.id}
                            onClick={() => handleDecision(r.id, "APPROVE")}
                            style={{
                              background: "#10b981",
                              color: "#fff",
                              border: "none",
                              padding: "4px 10px",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Approve
                          </button>
                          <button
                            disabled={processingId === r.id}
                            onClick={() => handleDecision(r.id, "REJECT")}
                            style={{
                              background: "#ef4444",
                              color: "#fff",
                              border: "none",
                              padding: "4px 10px",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {isPending && isRequester && (
                        <button
                          disabled={processingId === r.id}
                          onClick={() => handleDecision(r.id, "CANCEL")}
                          style={{
                            background: "transparent",
                            border: "1px solid var(--text-muted)",
                            color: "var(--text-muted)",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                          }}
                        >
                          Batalkan
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Ajukan Approval Baru */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
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
              maxWidth: "480px",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-contrast)" }}>
                Form Pengajuan Approval
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.25rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Tipe Permohonan
                </label>
                <select
                  value={formData.requestType}
                  onChange={(e) => setFormData({ ...formData, requestType: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg-surface)",
                    color: "var(--text-contrast)",
                    border: "1px solid var(--glass-border)",
                  }}
                >
                  <option value="DISCOUNT">Diskon Transaksi (Sales Discount)</option>
                  <option value="REFUND">Pengembalian Dana / Barang (Refund)</option>
                  <option value="STOCK_ADJUSTMENT">Penyesuaian Stok Fisik / Cacat</option>
                  <option value="STOCK_TRANSFER">Transfer Stok Antar Cabang</option>
                  <option value="EXPENSE">Klaim Pengeluaran Toko (Expense)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Referensi ID Transaksi / Produk
                </label>
                <input
                  type="text"
                  placeholder="Contoh: RL-8813 atau prod-1"
                  value={formData.referenceId}
                  onChange={(e) => setFormData({ ...formData, referenceId: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg-surface)",
                    color: "var(--text-contrast)",
                    border: "1px solid var(--glass-border)",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Alasan Permohonan Otorisasi *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Jelaskan alasan detail mengapa membutuhkan otorisasi..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg-surface)",
                    color: "var(--text-contrast)",
                    border: "1px solid var(--glass-border)",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--glass-border)",
                    color: "var(--text-secondary)",
                    padding: "0.5rem 1rem",
                    borderRadius: "var(--radius-md)",
                    cursor: "pointer",
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    background: "var(--clr-primary)",
                    border: "none",
                    color: "#fff",
                    padding: "0.5rem 1.25rem",
                    borderRadius: "var(--radius-md)",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Kirim Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
