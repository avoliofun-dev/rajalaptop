"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { VERSION_HISTORY, COMPLETED_MODULES, ROADMAP_ITEMS } from "@/lib/progressData";

const CREDENTIALS_MATRIX = [
  { role: "Owner", name: "Bapak Hendra (Owner)", email: "owner@rajalaptop.com", scope: "ALL", desc: "Akses penuh omzet, valuasi stok, profit, dan approval level tinggi" },
  { role: "Super Admin", name: "Super Administrator", email: "admin@example.com", scope: "ALL", desc: "Administrator sistem teknis, RBAC, konfigurasi web & progres" },
  { role: "Manager Area", name: "Budi Santoso", email: "manager@rajalaptop.com", scope: "AREA", desc: "Supervisi regional Jawa Tengah (Pekalongan, Solo, Semarang)" },
  { role: "Kepala Toko", name: "Agus Pratama", email: "kepalatoko@rajalaptop.com", scope: "STORE", desc: "Supervisi cabang Raja Laptop Pekalongan & approval kasir" },
  { role: "Kasir", name: "Siti Rahma", email: "kasir@rajalaptop.com", scope: "OWN", desc: "POS kasir toko, buat pesanan, permohonan diskon (scope data sendiri)" },
  { role: "Gudang", name: "Doni Setiawan", email: "gudang@rajalaptop.com", scope: "STORE", desc: "Penerimaan barang distributor, mutasi nomor serial & stock opname" },
  { role: "Finance", name: "Rina Kusuma", email: "finance@rajalaptop.com", scope: "ALL", desc: "Verifikasi kasir, approval refund, pencatatan beban biaya operasional" },
  { role: "Digital Marketing", name: "Dimas Anggara", email: "marketing@rajalaptop.com", scope: "ALL", desc: "Banner promosi, voucher diskon, analitik produk laptop bestseller" },
  { role: "Audit", name: "Ahmad Zulkarnain", email: "audit@rajalaptop.com", scope: "ALL (RO)", desc: "Pemeriksaan kepatuhan, pengawasan forensik jejak audit trail" },
];

export default function ProgresWebPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("milestones"); // milestones | modules | roadmap | matrix | raw
  const [searchQuery, setSearchQuery] = useState("");
  const [rawContent, setRawContent] = useState("");
  const [lastModified, setLastModified] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [copiedText, setCopiedText] = useState("");
  const [stats, setStats] = useState(null);
  const [versionsList, setVersionsList] = useState(VERSION_HISTORY);
  const [modulesList, setModulesList] = useState(COMPLETED_MODULES);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleCopy = (text, label) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedText(text);
      showToast(`✓ Berhasil disalin: ${label}`);
      setTimeout(() => setCopiedText(""), 2000);
    }
  };

  // Verifikasi otorisasi Super Admin
  useEffect(() => {
    let cancelled = false;
    async function checkAuthAndLoad() {
      try {
        const res = await fetch("/api/auth/admin/me");
        if (!res.ok) {
          router.replace("/admin/login");
          return;
        }
        const data = await res.json();
        if (cancelled) return;

        const user = data.user;
        setCurrentUser(user);

        const isAuthorized = Boolean(
          user?.isSuperAdmin || user?.role === "super_admin" || user?.isOwner || user?.role === "owner"
        );
        setIsSuperAdmin(isAuthorized);

        if (isAuthorized) {
          // Ambil konten PROGRESS.md dan data versi/modul (dari MySQL atau fallback)
          try {
            const progRes = await fetch("/api/admin/progres");
            if (progRes.ok) {
              const progData = await progRes.json();
              if (progData.content) {
                setRawContent(progData.content);
                setLastModified(progData.lastModified);
              }
              if (progData.stats) {
                setStats(progData.stats);
              }
              if (progData.versions && progData.versions.length > 0) {
                setVersionsList(progData.versions);
              }
              if (progData.modules && progData.modules.length > 0) {
                setModulesList(progData.modules);
              }
            }
          } catch (e) {
            console.error("Gagal membaca file PROGRESS.md:", e);
          }
        }
      } catch (err) {
        console.error("Auth check error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    checkAuthAndLoad();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Filter modul berdasarkan search query
  const filteredModules = useMemo(() => {
    const list = modulesList || COMPLETED_MODULES;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.desc && m.desc.toLowerCase().includes(q)) ||
        (m.items && m.items.some((i) => i.toLowerCase().includes(q)))
    );
  }, [searchQuery, modulesList]);

  // Filter versi berdasarkan search query
  const filteredVersions = useMemo(() => {
    const list = versionsList || VERSION_HISTORY;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (v) =>
        v.version.toLowerCase().includes(q) ||
        v.title.toLowerCase().includes(q) ||
        v.summary.toLowerCase().includes(q) ||
        (v.highlights && v.highlights.some((h) => h.toLowerCase().includes(q)))
    );
  }, [searchQuery, versionsList]);

  if (loading) {
    return (
      <div style={{ minHeight: "70vh", display: "grid", placeItems: "center", color: "var(--text-muted)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🚀</div>
          <div>Memverifikasi Hak Akses Super Admin...</div>
        </div>
      </div>
    );
  }

  // Jika bukan Super Admin, tampilkan layar Access Denied
  if (!isSuperAdmin) {
    return (
      <div style={{ padding: "2.5rem 1.5rem", maxWidth: "700px", margin: "4rem auto", textAlign: "center" }}>
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-xl)",
            padding: "3rem 2rem",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🚫</div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--clr-danger)", margin: "0 0 0.75rem" }}>
            Akses Ditolak (Khusus Super Admin)
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6, margin: "0 auto 2rem", maxWidth: "480px" }}>
            Halaman <strong>Progres Web</strong> merupakan menu internal khusus bagi Administrator Sistem Utama (Super Admin) untuk mengawasi milestone, roadmap, dan integritas arsitektur teknis sistem Raja Laptop.
          </p>
          <div style={{ display: "inline-flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
            <Link
              href="/admin/dashboard"
              className="btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.5rem",
                fontSize: "0.9rem",
              }}
            >
              <span>📊</span> Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1280px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 9999,
            background: "#0f172a",
            color: "#fff",
            border: "1px solid var(--clr-primary)",
            padding: "0.75rem 1.25rem",
            borderRadius: "var(--radius-md)",
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            fontSize: "0.85rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Header Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))",
          border: "1px solid rgba(59, 130, 246, 0.3)",
          borderRadius: "var(--radius-xl)",
          padding: "2rem",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-40px",
            right: "-40px",
            width: "220px",
            height: "220px",
            background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
              <span
                style={{
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: "#fff",
                  fontSize: "0.7rem",
                  fontWeight: 900,
                  padding: "3px 8px",
                  borderRadius: "var(--radius-sm)",
                  letterSpacing: "0.5px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                👑 SUPER ADMIN & OWNER
              </span>
              <span
                style={{
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "#10b981",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  padding: "3px 8px",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                STATUS: AKTIF & RILIS
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Versi Sistem: <strong>{stats?.version || "v1.5.0"}</strong>
              </span>
            </div>

            <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--text-contrast)", margin: "0 0 0.5rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span>🚀</span> Progres Pengembangan Website & RBAC
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0, maxWidth: "780px", lineHeight: 1.5 }}>
              Dokumentasi rekam jejak versi, pencapaian milestone fitur sistem Raja Laptop, status integritas basis data, serta backlog peta jalan pengembangan (roadmap) berikutnya.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <Link
              href="/progres"
              target="_blank"
              className="btn-outline"
              style={{ padding: "0.55rem 1rem", fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", textDecoration: "none" }}
            >
              <span>🌐</span> Buka Halaman Publik
            </Link>
            <button
              type="button"
              onClick={() => handleCopy(rawContent || JSON.stringify(VERSION_HISTORY, null, 2), "Salinan Berkas Progres")}
              className="btn-outline"
              style={{ padding: "0.55rem 1rem", fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              <span>📋</span> Salin Catatan
            </button>
            <button
              type="button"
              onClick={() => {
                const blob = new Blob([rawContent || "# Progress Raja Laptop"], { type: "text/markdown" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "PROGRESS.md";
                a.click();
                URL.revokeObjectURL(url);
                showToast("📥 File PROGRESS.md berhasil diunduh.");
              }}
              className="btn-primary"
              style={{ padding: "0.55rem 1.15rem", fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              <span>📥</span> Unduh PROGRESS.md
            </button>
          </div>
        </div>

        {/* 6 KPI Metrics Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            marginTop: "1.75rem",
          }}
        >
          <div style={{ background: "rgba(59, 130, 246, 0.12)", border: "1px solid rgba(59, 130, 246, 0.35)", padding: "1rem 1.25rem", borderRadius: "var(--radius-lg)" }}>
            <div style={{ fontSize: "0.72rem", color: "#3b82f6", textTransform: "uppercase", fontWeight: 700 }}>
              Ukuran Total Proyek
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#3b82f6", marginTop: "4px" }}>
              {stats?.totalGB || "1.85"} GB
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              ~{stats?.totalMB?.toLocaleString("id-ID") || "1.891"} MB (Lokal Disk)
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--glass-border)", padding: "1rem 1.25rem", borderRadius: "var(--radius-lg)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Total Milestone Rilis
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--clr-primary)", marginTop: "4px" }}>
              {(versionsList || VERSION_HISTORY).length} Versi
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Mulai v1.1.0 s/d {stats?.version || "v1.5.0"}
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--glass-border)", padding: "1rem 1.25rem", borderRadius: "var(--radius-lg)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Fitur Utama Selesai
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#10b981", marginTop: "4px" }}>
              {(modulesList || COMPLETED_MODULES).length} Modul
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              RBAC, POS, Serials, Approval & Log
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--glass-border)", padding: "1rem 1.25rem", borderRadius: "var(--radius-lg)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Automated Tests RBAC
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#8b5cf6", marginTop: "4px" }}>
              55 / 55
            </div>
            <div style={{ fontSize: "0.72rem", color: "#10b981", marginTop: "2px", fontWeight: 700 }}>
              ✓ 100% Lulus (0 Fail)
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--glass-border)", padding: "1rem 1.25rem", borderRadius: "var(--radius-lg)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Total Berkas
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#06b6d4", marginTop: "4px" }}>
              {(stats?.totalFiles || 26781).toLocaleString("id-ID")}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              {stats?.breakdown?.sourceCode?.files || 155} File Source Code
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--glass-border)", padding: "1rem 1.25rem", borderRadius: "var(--radius-lg)" }}>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Roadmap Backlog
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "#f59e0b", marginTop: "4px" }}>
              4 Agenda
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "2px" }}>
              Split Payment & Ekspor Keuangan (v1.6)
            </div>
          </div>
        </div>

        {/* Visual Storage Breakdown Bar */}
        <div style={{ marginTop: "1.5rem", background: "rgba(0,0,0,0.25)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-md)", padding: "0.95rem 1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            <span style={{ fontWeight: 700, color: "var(--text-contrast)" }}>💾 Alokasi Penyimpanan Proyek ({stats?.totalFormatted || "1.85 GB"})</span>
            <span>Build (.next): {stats?.breakdown?.nextBuild?.mb || 1412} MB • node_modules: {stats?.breakdown?.nodeModules?.mb || 460} MB • Source: {stats?.breakdown?.sourceCode?.mb || 18.1} MB</span>
          </div>
          <div style={{ height: "12px", width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden", display: "flex" }}>
            <div style={{ width: `${stats?.breakdown?.nextBuild?.percentage || 74.7}%`, background: "#0284c7" }} title="Next.js Build & Cache" />
            <div style={{ width: `${stats?.breakdown?.nodeModules?.percentage || 24.4}%`, background: "#8b5cf6" }} title="Node Modules Dependencies" />
            <div style={{ width: `${Math.max(stats?.breakdown?.sourceCode?.percentage || 1, 1.5)}%`, background: "#10b981" }} title="Source Code" />
            <div style={{ width: `${Math.max(stats?.breakdown?.uploads?.percentage || 0.4, 0.8)}%`, background: "#f59e0b" }} title="Uploads Media" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Search Toolbar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          background: "var(--bg-surface)",
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--radius-lg)",
          padding: "0.75rem 1rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {[
            { id: "milestones", label: "Riwayat Versi", icon: "📌", count: (versionsList || VERSION_HISTORY).length },
            { id: "modules", label: "Fitur Selesai", icon: "✅", count: (modulesList || COMPLETED_MODULES).length },
            { id: "roadmap", label: "Roadmap Mendatang", icon: "⏳", count: 4 },
            { id: "matrix", label: "Matriks Akun RBAC", icon: "🔐", count: CREDENTIALS_MATRIX.length },
            { id: "raw", label: "Berkas PROGRESS.md", icon: "📄" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "0.55rem 0.95rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid",
                  borderColor: isActive ? "var(--clr-primary)" : "transparent",
                  background: isActive ? "rgba(59, 130, 246, 0.15)" : "transparent",
                  color: isActive ? "var(--clr-primary)" : "var(--text-secondary)",
                  fontSize: "0.82rem",
                  fontWeight: isActive ? 800 : 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  transition: "all var(--t-fast)",
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    style={{
                      fontSize: "0.68rem",
                      padding: "1px 6px",
                      borderRadius: "10px",
                      background: isActive ? "var(--clr-primary)" : "rgba(255,255,255,0.08)",
                      color: isActive ? "#fff" : "var(--text-muted)",
                      fontWeight: 700,
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activeTab !== "raw" && (
          <div style={{ minWidth: "240px", flex: "1 1 240px", maxWidth: "340px" }}>
            <input
              type="text"
              placeholder="🔍 Cari fitur, versi, atau modul..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem 0.85rem",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-card)",
                border: "1px solid var(--glass-border)",
                color: "var(--text-contrast)",
                fontSize: "0.82rem",
                outline: "none",
              }}
            />
          </div>
        )}
      </div>

      {/* TAB 1: MILESTONES (Riwayat Versi) */}
      {activeTab === "milestones" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filteredVersions.map((v) => {
            const isCurrent = v.status === "active";
            const isPlanned = v.status === "planned";
            const borderColor = isCurrent
              ? "var(--clr-primary)"
              : isPlanned
              ? "#f59e0b"
              : "var(--glass-border)";
            const badgeBg = isCurrent
              ? "rgba(59, 130, 246, 0.15)"
              : isPlanned
              ? "rgba(245, 158, 11, 0.15)"
              : "rgba(16, 185, 129, 0.15)";
            const badgeColor = isCurrent ? "var(--clr-primary)" : isPlanned ? "#f59e0b" : "#10b981";

            return (
              <div
                key={v.version}
                style={{
                  background: isCurrent ? "rgba(59, 130, 246, 0.04)" : "var(--bg-surface)",
                  border: `1px solid ${borderColor}`,
                  borderRadius: "var(--radius-lg)",
                  padding: "1.5rem",
                  boxShadow: isCurrent ? "0 0 20px rgba(59, 130, 246, 0.15)" : "var(--shadow-sm)",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--text-contrast)" }}>
                      {v.version}
                    </span>
                    <span
                      style={{
                        background: badgeBg,
                        color: badgeColor,
                        border: `1px solid ${badgeColor}40`,
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: "var(--radius-full)",
                      }}
                    >
                      {v.badge}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      📅 {v.date}
                    </span>
                  </div>
                </div>

                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-contrast)", margin: "0 0 0.4rem" }}>
                  {v.title}
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5, margin: "0 0 0.85rem" }}>
                  {v.summary}
                </p>

                {v.highlights && v.highlights.length > 0 && (
                  <div style={{ background: "var(--bg-card)", padding: "0.85rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--glass-border)" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.4rem" }}>
                      Poin Pembaruan & Fitur:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.82rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      {v.highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: MODULES (Fitur Selesai) */}
      {activeTab === "modules" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1rem" }}>
          {filteredModules.map((m) => (
            <div
              key={m.num}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-lg)",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span style={{ fontSize: "1.4rem" }}>{m.icon}</span>
                  <div>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-contrast)", margin: 0 }}>
                      {m.num}. {m.title}
                    </h3>
                  </div>
                </div>
                <span
                  style={{
                    background: `${m.color}15`,
                    color: m.color,
                    border: `1px solid ${m.color}35`,
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    padding: "2px 7px",
                    borderRadius: "var(--radius-sm)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.badge}
                </span>
              </div>

              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.45 }}>
                {m.desc}
              </p>

              <div
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.75rem",
                  marginTop: "auto",
                }}
              >
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.35rem" }}>
                  Rincian Implementasi:
                </div>
                <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.78rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {m.items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: ROADMAP & BACKLOG */}
      {activeTab === "roadmap" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {ROADMAP_ITEMS.map((cat, i) => (
            <div
              key={i}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-lg)",
                padding: "1.25rem 1.5rem",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.3rem" }}>{cat.icon}</span>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-contrast)", margin: 0 }}>
                    {cat.category}
                  </h3>
                </div>
                <span
                  style={{
                    background: `${cat.color}15`,
                    color: cat.color,
                    border: `1px solid ${cat.color}35`,
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    padding: "3px 8px",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  {cat.status}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {cat.tasks.map((t, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                      padding: "0.75rem",
                      background: "var(--bg-card)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--glass-border)",
                    }}
                  >
                    <span style={{ fontSize: "1.1rem", marginTop: "-2px" }}>
                      {t.done ? "✅" : "⏳"}
                    </span>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: "0.85rem", color: "var(--text-contrast)", display: "block" }}>
                        {t.name}
                      </strong>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                        {t.desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: CREDENTIALS MATRIX */}
      {activeTab === "matrix" && (
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-lg)",
            padding: "1.25rem",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem", fontWeight: 800, color: "var(--text-contrast)" }}>
                🔐 Matriks Akun Uji Coba 9 Role Sistem
              </h3>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Kata sandi default untuk seluruh akun uji coba: <strong style={{ color: "var(--clr-primary)" }}>admin123</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy("admin123", "Kata Sandi Default: admin123")}
              className="btn-outline"
              style={{ padding: "0.4rem 0.85rem", fontSize: "0.78rem" }}
            >
              📋 Salin Password: admin123
            </button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--glass-border)", textAlign: "left", color: "var(--text-muted)" }}>
                  <th style={{ padding: "0.6rem 0.75rem" }}>Role</th>
                  <th style={{ padding: "0.6rem 0.75rem" }}>Nama Pegawai</th>
                  <th style={{ padding: "0.6rem 0.75rem" }}>Email Login</th>
                  <th style={{ padding: "0.6rem 0.75rem" }}>Scope</th>
                  <th style={{ padding: "0.6rem 0.75rem" }}>Deskripsi Tanggung Jawab</th>
                  <th style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {CREDENTIALS_MATRIX.map((c, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: "1px solid var(--glass-border)",
                      background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                    }}
                  >
                    <td style={{ padding: "0.75rem", fontWeight: 800, color: "var(--clr-primary)", whiteSpace: "nowrap" }}>
                      {c.role}
                    </td>
                    <td style={{ padding: "0.75rem", fontWeight: 700, color: "var(--text-contrast)", whiteSpace: "nowrap" }}>
                      {c.name}
                    </td>
                    <td style={{ padding: "0.75rem", fontFamily: "monospace", color: "var(--text-contrast)", whiteSpace: "nowrap" }}>
                      {c.email}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span
                        style={{
                          background: "rgba(59, 130, 246, 0.12)",
                          color: "var(--clr-primary)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                        }}
                      >
                        {c.scope}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", color: "var(--text-secondary)", maxWidth: "340px" }}>
                      {c.desc}
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "center", whiteSpace: "nowrap" }}>
                      <button
                        type="button"
                        onClick={() => handleCopy(c.email, `Email ${c.role}: ${c.email}`)}
                        className="btn-outline"
                        style={{ padding: "0.3rem 0.65rem", fontSize: "0.72rem" }}
                      >
                        {copiedText === c.email ? "✓ Tersalin" : "📋 Salin Email"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: RAW PROGRESS.MD */}
      {activeTab === "raw" && (
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-lg)",
            padding: "1.25rem",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem", fontWeight: 800, color: "var(--text-contrast)" }}>
                📄 Berkas Sumber: PROGRESS.md
              </h3>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {lastModified ? `Terakhir diperbarui: ${new Date(lastModified).toLocaleString("id-ID")}` : "Sumber: Root directory project"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(rawContent, "PROGRESS.md")}
              className="btn-primary"
              style={{ padding: "0.45rem 1rem", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              <span>📋</span> Salin Seluruh Isi
            </button>
          </div>

          <pre
            style={{
              background: "#090d16",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "var(--radius-md)",
              padding: "1.25rem",
              color: "#e2e8f0",
              fontFamily: "monospace",
              fontSize: "0.82rem",
              lineHeight: 1.6,
              overflowX: "auto",
              maxHeight: "650px",
              whiteSpace: "pre-wrap",
            }}
          >
            {rawContent || "Memuat konten berkas..."}
          </pre>
        </div>
      )}
    </div>
  );
}
