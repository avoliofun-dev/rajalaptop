"use client";

import { useState, useEffect } from "react";

export default function AdminServisPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadServices = async () => {
    try {
      const res = await fetch("/api/services");
      if (res.ok) {
        const data = await res.json();
        setTickets(data || []);
      }
    } catch (e) {
      console.error("Gagal load tiket servis:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const updateStage = async (id, newStage) => {
    // Optimistic UI update
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, stage: newStage } : t)));
    try {
      await fetch("/api/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, stage: newStage }),
      });
      loadServices();
    } catch (e) {
      console.error("Gagal update stage tiket servis:", e);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.4rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-contrast)" }}>
            Tiket Servis & Klaim Garansi (Modul Teknisi)
          </h1>
          <span style={{
            background: "hsla(150, 90%, 40%, 0.2)",
            color: "#10b981",
            fontSize: "0.75rem",
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: "var(--radius-full)"
          }}>
            Live: MySQL services
          </span>
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Pantau antrean perangkat diservis dari database MySQL, catat keluhan, dan perbarui tahapan perbaikan.
        </p>
      </div>

      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--glass-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden"
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--glass-border)", color: "var(--text-secondary)" }}>
              <th style={{ padding: "0.9rem 1.25rem" }}>No. Tiket</th>
              <th style={{ padding: "0.9rem 1rem" }}>Pemilik & Unit</th>
              <th style={{ padding: "0.9rem 1rem" }}>Keluhan / Pekerjaan</th>
              <th style={{ padding: "0.9rem 1rem" }}>Teknisi Bertugas</th>
              <th style={{ padding: "0.9rem 1rem" }}>Tahap Pengerjaan</th>
              <th style={{ padding: "0.9rem 1.25rem", textAlign: "right" }}>Update Tahap</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                  Memuat tiket servis dari database MySQL...
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                  Tidak ada tiket servis aktif
                </td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr key={t.id} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                  <td style={{ padding: "1rem 1.25rem", fontWeight: 700, color: "var(--clr-primary)" }}>
                    #{t.id}
                    <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 400 }}>{t.date}</span>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <strong style={{ color: "var(--text-contrast)" }}>{t.customer}</strong>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-secondary)" }}>{t.unit}</span>
                  </td>
                  <td style={{ padding: "1rem", color: "var(--text-secondary)", maxWidth: "260px" }}>{t.issue}</td>
                  <td style={{ padding: "1rem", fontWeight: 600, color: "var(--text-contrast)" }}>{t.tech}</td>
                  <td style={{ padding: "1rem" }}>
                    <span style={{
                      padding: "3px 8px",
                      borderRadius: "var(--radius-full)",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      background: t.stage === "Siap Diambil" || t.stage === "Selesai" ? "hsla(145, 60%, 45%, 0.15)" : t.stage === "Pengerjaan Servis" ? "hsla(35, 100%, 55%, 0.15)" : "hsla(220, 90%, 56%, 0.15)",
                      color: t.stage === "Siap Diambil" || t.stage === "Selesai" ? "var(--clr-success)" : t.stage === "Pengerjaan Servis" ? "var(--clr-accent)" : "var(--clr-primary)"
                    }}>
                      {t.stage}
                    </span>
                  </td>
                  <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                    <select
                      value={t.stage}
                      onChange={(e) => updateStage(t.id, e.target.value)}
                      style={{
                        padding: "0.3rem 0.6rem",
                        background: "var(--bg-card)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--text-contrast)",
                        fontSize: "0.75rem",
                        outline: "none"
                      }}
                    >
                      <option value="Unit Diterima">1. Unit Diterima</option>
                      <option value="Diagnosa & Cek">2. Diagnosa & Cek</option>
                      <option value="Pengerjaan Servis">3. Pengerjaan Servis</option>
                      <option value="Siap Diambil">4. Siap Diambil</option>
                      <option value="Selesai">5. Selesai</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
