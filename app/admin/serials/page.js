"use client";

import { useState, useEffect } from "react";

export default function SerialsPage() {
  const [serials, setSerials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSerial, setSelectedSerial] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);

  const [newSerialForm, setNewSerialForm] = useState({
    productId: "",
    serialNumber: "",
    imei: "",
    warrantyMonths: 24,
  });

  const [transferForm, setTransferForm] = useState({
    serialId: "",
    toStoreId: "store-gejayan",
    notes: "",
  });

  const loadSerials = async () => {
    try {
      setLoading(true);
      const url = search ? `/api/serials?search=${encodeURIComponent(search)}` : "/api/serials";
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setSerials(json.serials || []);
      }
    } catch (err) {
      console.error("Gagal memuat serials:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSerials();
    // Load products and stores
    (async () => {
      try {
        const [prodRes, roleRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/roles"),
        ]);
        if (prodRes.ok) {
          const prods = await prodRes.json();
          setProducts(prods || []);
          if (prods.length > 0) {
            setNewSerialForm((p) => ({ ...p, productId: prods[0].id }));
          }
        }
        if (roleRes.ok) {
          const rData = await roleRes.json();
          setStores(rData.stores || []);
        }
      } catch {}
    })();
  }, []);

  const viewMovementHistory = async (serial) => {
    setSelectedSerial(serial);
    setLoadingMovements(true);
    try {
      const res = await fetch(`/api/serials?serial_id=${serial.id}`);
      if (res.ok) {
        const json = await res.json();
        setMovements(json.movements || []);
      }
    } catch (err) {
      console.error("Gagal memuat histori:", err);
    } finally {
      setLoadingMovements(false);
    }
  };

  const handleRegisterSerial = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/serials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSerialForm),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Gagal mendaftarkan unit laptop");
        return;
      }
      alert(`Serial Number ${newSerialForm.serialNumber} berhasil didaftarkan!`);
      setShowAddModal(false);
      setNewSerialForm({ productId: products[0]?.id || "", serialNumber: "", imei: "", warrantyMonths: 24 });
      await loadSerials();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleTransferSerial = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/serials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transferForm),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Gagal mentransfer serial");
        return;
      }
      alert("Mutasi perpindahan unit laptop berhasil dicatat!");
      setShowTransferModal(false);
      await loadSerials();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-contrast)", marginBottom: "4px" }}>
            Pelacakan Serial Number & IMEI Laptop
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Siklus hidup setiap unit laptop: Supplier ➔ Pembelian ➔ Gudang ➔ Toko ➔ Penjualan ➔ Pelanggan ➔ Garansi.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
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
          + Registrasi Serial Baru
        </button>
      </div>

      {/* Search & Actions */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Cari Serial Number, IMEI, atau Tipe Laptop..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadSerials()}
          style={{
            flex: 1,
            minWidth: "260px",
            padding: "0.65rem 1rem",
            background: "var(--bg-card)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-contrast)",
            fontSize: "0.85rem",
          }}
        />
        <button
          onClick={loadSerials}
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--glass-border)",
            color: "var(--text-contrast)",
            padding: "0.65rem 1.25rem",
            borderRadius: "var(--radius-md)",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Cari
        </button>
      </div>

      {/* Main Table & Details Drawer */}
      <div style={{ display: "grid", gridTemplateColumns: selectedSerial ? "1fr 380px" : "1fr", gap: "1.5rem" }}>
        {/* Table */}
        <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--glass-border)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--glass-border)", color: "var(--text-muted)" }}>
                <th style={{ padding: "0.85rem 1rem" }}>Serial Number</th>
                <th style={{ padding: "0.85rem 1rem" }}>Unit Laptop</th>
                <th style={{ padding: "0.85rem 1rem" }}>Lokasi Toko</th>
                <th style={{ padding: "0.85rem 1rem" }}>Status</th>
                <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                    Memuat serial number...
                  </td>
                </tr>
              ) : serials.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                    Tidak ada serial number ditemukan.
                  </td>
                </tr>
              ) : (
                serials.map((s) => {
                  let statusBadge = "#10b981";
                  if (s.status === "SOLD") statusBadge = "#3b82f6";
                  if (s.status === "DEFECTIVE") statusBadge = "#ef4444";
                  if (s.status === "IN_TRANSIT") statusBadge = "#f59e0b";

                  const isSelected = selectedSerial?.id === s.id;

                  return (
                    <tr
                      key={s.id}
                      style={{
                        borderBottom: "1px solid var(--glass-border)",
                        background: isSelected ? "hsla(220, 90%, 56%, 0.08)" : "transparent",
                      }}
                    >
                      <td style={{ padding: "1rem" }}>
                        <code style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-contrast)" }}>
                          {s.serial_number}
                        </code>
                        {s.imei && <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>IMEI: {s.imei}</div>}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <strong style={{ display: "block", color: "var(--text-contrast)" }}>{s.product_name}</strong>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{s.product_brand} • {s.product_category}</span>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span style={{ color: "var(--text-secondary)" }}>{s.store_name || "Gudang Sentral"}</span>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span
                          style={{
                            background: `${statusBadge}20`,
                            color: statusBadge,
                            border: `1px solid ${statusBadge}40`,
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                          }}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                          <button
                            onClick={() => viewMovementHistory(s)}
                            style={{
                              background: "transparent",
                              border: "1px solid var(--clr-primary)",
                              color: "var(--clr-primary)",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Riwayat
                          </button>
                          {s.status === "IN_STOCK" && (
                            <button
                              onClick={() => {
                                setTransferForm({ serialId: s.id, toStoreId: "store-gejayan", notes: "" });
                                setShowTransferModal(true);
                              }}
                              style={{
                                background: "var(--bg-surface)",
                                border: "1px solid var(--glass-border)",
                                color: "var(--text-secondary)",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "0.75rem",
                                cursor: "pointer",
                              }}
                            >
                              Mutasi
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Lifecycle Drawer */}
        {selectedSerial && (
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--glass-border)",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Audit Trail Siklus Hidup
                </span>
                <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-contrast)" }}>
                  {selectedSerial.serial_number}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSerial(null)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              Produk: <strong>{selectedSerial.product_name}</strong>
            </div>

            <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "0.75rem" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                REKAM JEJAK PERPINDAHAN FISIK
              </div>

              {loadingMovements ? (
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Memuat histori...</div>
              ) : movements.length === 0 ? (
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Belum ada catatan mutasi.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", position: "relative" }}>
                  {movements.map((m, idx) => (
                    <div
                      key={m.id}
                      style={{
                        display: "flex",
                        gap: "0.75rem",
                        fontSize: "0.78rem",
                        borderLeft: "2px solid var(--clr-primary)",
                        paddingLeft: "0.75rem",
                        marginLeft: "4px",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--text-contrast)" }}>
                          {m.movement_type}
                        </div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                          {m.from_location_type} ➔ {m.to_location_type}
                        </div>
                        {m.notes && <div style={{ color: "var(--text-secondary)", marginTop: "2px" }}>{m.notes}</div>}
                        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          {new Date(m.created_at).toLocaleString("id-ID")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Registrasi Serial Baru */}
      {showAddModal && (
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
              maxWidth: "460px",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-contrast)" }}>
                Registrasi Serial Number Unit Laptop
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleRegisterSerial} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Pilih Produk Laptop *
                </label>
                <select
                  required
                  value={newSerialForm.productId}
                  onChange={(e) => setNewSerialForm({ ...newSerialForm, productId: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", color: "var(--text-contrast)", border: "1px solid var(--glass-border)" }}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.brand})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Serial Number (SN) Fisik Unit *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Contoh: SN-ROG-2025-99812"
                  value={newSerialForm.serialNumber}
                  onChange={(e) => setNewSerialForm({ ...newSerialForm, serialNumber: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", color: "var(--text-contrast)", border: "1px solid var(--glass-border)" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  IMEI / ID Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 356891028472911"
                  value={newSerialForm.imei}
                  onChange={(e) => setNewSerialForm({ ...newSerialForm, imei: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", color: "var(--text-contrast)", border: "1px solid var(--glass-border)" }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ background: "transparent", border: "1px solid var(--glass-border)", color: "var(--text-secondary)", padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", cursor: "pointer" }}>Batal</button>
                <button type="submit" style={{ background: "var(--clr-primary)", border: "none", color: "#fff", padding: "0.5rem 1.25rem", borderRadius: "var(--radius-md)", fontWeight: 700, cursor: "pointer" }}>Simpan Unit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Mutasi Serial */}
      {showTransferModal && (
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
              maxWidth: "440px",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-contrast)" }}>
                Mutasi Fisik Laptop Antar Cabang
              </h3>
              <button onClick={() => setShowTransferModal(false)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>✕</button>
            </div>

            <form onSubmit={handleTransferSerial} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Cabang Toko / Gudang Tujuan *
                </label>
                <select
                  value={transferForm.toStoreId}
                  onChange={(e) => setTransferForm({ ...transferForm, toStoreId: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", color: "var(--text-contrast)", border: "1px solid var(--glass-border)" }}
                >
                  {stores.map((st) => (
                    <option key={st.id} value={st.id}>{st.name} ({st.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Catatan Mutasi
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Permintaan stok darurat untuk display cabang Gejayan"
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "var(--radius-md)", background: "var(--bg-surface)", color: "var(--text-contrast)", border: "1px solid var(--glass-border)" }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowTransferModal(false)} style={{ background: "transparent", border: "1px solid var(--glass-border)", color: "var(--text-secondary)", padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", cursor: "pointer" }}>Batal</button>
                <button type="submit" style={{ background: "var(--clr-primary)", border: "none", color: "#fff", padding: "0.5rem 1.25rem", borderRadius: "var(--radius-md)", fontWeight: 700, cursor: "pointer" }}>Konfirmasi Mutasi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
