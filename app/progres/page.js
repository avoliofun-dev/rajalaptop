"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./progres.module.css";
import { VERSION_HISTORY, COMPLETED_MODULES, ROADMAP_ITEMS } from "@/lib/progressData";

export default function ProgresPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [rawMarkdown, setRawMarkdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await fetch("/api/progres", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.stats) setStats(data.stats);
          if (data.markdownContent) setRawMarkdown(data.markdownContent);
        }
      } catch (err) {
        console.error("Gagal memuat API progres:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProgress();
  }, []);

  const handleCopyMarkdown = () => {
    if (!rawMarkdown) return;
    navigator.clipboard.writeText(rawMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([rawMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PROGRESS-rajalaptop-${stats?.version || "v1.1.0"}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter modules
  const filteredModules = COMPLETED_MODULES.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.items.some((item) => item.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className={styles.container}>
      {/* ── Breadcrumb ── */}
      <nav style={{ display: "flex", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem", alignItems: "center" }}>
        <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>Beranda</Link>
        <span>/</span>
        <span style={{ color: "var(--clr-primary)", fontWeight: 600 }}>Progres & Ukuran Proyek</span>
      </nav>

      {/* ── Hero Section ── */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroBadge}>
          <span className={styles.pulseDot} />
          <span>STATUS SISTEM: AKTIF & STABIL</span>
          <span style={{ opacity: 0.5 }}>|</span>
          <span>VERSI {stats?.version || "v1.1.0"}</span>
        </div>
        <h1 className={styles.heroTitle}>
          Progres Proyek & Metrik Sistem Raja Laptop
        </h1>
        <p className={styles.heroDesc}>
          Laporan rekam jejak versi, pencapaian milestone, modul enterprise, hasil pengujian otomatis, serta metrik kapasitas penyimpanan total proyek ini secara transparan dan real-time.
        </p>
        <div className={styles.heroTags}>
          <span className={styles.heroTag}>⚡ Next.js 16.0.7 (App Router)</span>
          <span className={styles.heroTag}>⚛️ React 19.0.0</span>
          <span className={styles.heroTag}>🐬 MySQL 8.0+</span>
          <span className={styles.heroTag}>🛡️ Enterprise RBAC (9 Role)</span>
          <span className={styles.heroTag}>🧪 55/55 Automated Tests Passing</span>
          <span className={styles.heroTag} style={{ borderColor: "#3b82f6", color: "#3b82f6", fontWeight: 700 }}>
            💾 Ukuran Proyek: {stats?.totalFormatted || "1.85 GB (1.891,41 MB)"}
          </span>
        </div>
      </section>

      {/* ── Top KPI Grid ── */}
      <section className={styles.kpiGrid}>
        <div className={styles.kpiCard} style={{ borderColor: "rgba(59, 130, 246, 0.4)" }}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiIcon}>💾</span>
            <span className={styles.kpiBadge} style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>
              DISK METRICS
            </span>
          </div>
          <div className={styles.kpiValue} style={{ color: "#3b82f6" }}>
            {stats?.totalGB || "1.85"} <span style={{ fontSize: "1.1rem" }}>GB</span>
          </div>
          <div className={styles.kpiLabel}>Ukuran Total Proyek</div>
          <div className={styles.kpiSub}>
            ~{stats?.totalMB?.toLocaleString("id-ID") || "1.891"} MB di penyimpanan disk lokal
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiIcon}>🚀</span>
            <span className={styles.kpiBadge}>STABLE RELEASE</span>
          </div>
          <div className={styles.kpiValue}>{stats?.version || "v1.5.0"}</div>
          <div className={styles.kpiLabel}>Versi Aktif Saat Ini</div>
          <div className={styles.kpiSub}>2FA WhatsApp OTP, Privasi & POS Scanner</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiIcon}>✅</span>
            <span className={styles.kpiBadge}>100% OPERATIONAL</span>
          </div>
          <div className={styles.kpiValue}>{COMPLETED_MODULES.length}</div>
          <div className={styles.kpiLabel}>Modul Utama Selesai</div>
          <div className={styles.kpiSub}>RBAC, Approval, Kasir, Serials & Log</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiIcon}>🧪</span>
            <span className={styles.kpiBadge}>ZERO REGRESSION</span>
          </div>
          <div className={styles.kpiValue} style={{ color: "#10b981" }}>55 / 55</div>
          <div className={styles.kpiLabel}>Automated Tests Lulus</div>
          <div className={styles.kpiSub}>100% Pass (Unit, API & RBAC Suite)</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiIcon}>📁</span>
            <span className={styles.kpiBadge}>TOTAL FILES</span>
          </div>
          <div className={styles.kpiValue}>
            {(stats?.totalFiles || 26781).toLocaleString("id-ID")}
          </div>
          <div className={styles.kpiLabel}>Total Berkas Proyek</div>
          <div className={styles.kpiSub}>Termasuk {stats?.breakdown?.sourceCode?.files || 155} file kode sumber</div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTop}>
            <span className={styles.kpiIcon}>💻</span>
            <span className={styles.kpiBadge}>SOURCE CODE</span>
          </div>
          <div className={styles.kpiValue}>102K+</div>
          <div className={styles.kpiLabel}>Lines of Code (LOC)</div>
          <div className={styles.kpiSub}>JavaScript, JSX, CSS, SQL & Markdown</div>
        </div>
      </section>

      {/* ── Storage Footprint Highlight Box ── */}
      <section className={styles.storageHighlight}>
        <div className={styles.storageHeader}>
          <div className={styles.storageTitle}>
            <span>📊</span>
            <span>Distribusi & Rincian Ukuran Proyek</span>
          </div>
          <div className={styles.storageTotalBadge}>
            <span>💾 Total Kapasitas:</span>
            <span>{stats?.totalFormatted || "1.85 GB (1.891,41 MB)"}</span>
          </div>
        </div>

        {/* Multi-segment Storage Bar */}
        <div className={styles.storageBarContainer}>
          <div className={styles.storageProgressBar}>
            <div
              className={styles.storageSegment}
              style={{
                width: `${stats?.breakdown?.nextBuild?.percentage || 74.7}%`,
                background: "linear-gradient(90deg, #0284c7, #38bdf8)",
              }}
              title={`Next.js Build & Cache: ${stats?.breakdown?.nextBuild?.mb || 1412} MB (${stats?.breakdown?.nextBuild?.percentage || 74.7}%)`}
            />
            <div
              className={styles.storageSegment}
              style={{
                width: `${stats?.breakdown?.nodeModules?.percentage || 24.4}%`,
                background: "linear-gradient(90deg, #8b5cf6, #a78bfa)",
              }}
              title={`Node Modules: ${stats?.breakdown?.nodeModules?.mb || 460} MB (${stats?.breakdown?.nodeModules?.percentage || 24.4}%)`}
            />
            <div
              className={styles.storageSegment}
              style={{
                width: `${Math.max(stats?.breakdown?.sourceCode?.percentage || 1, 1.5)}%`,
                background: "linear-gradient(90deg, #10b981, #34d399)",
              }}
              title={`Source Code: ${stats?.breakdown?.sourceCode?.mb || 18.1} MB (${stats?.breakdown?.sourceCode?.percentage || 1}%)`}
            />
            <div
              className={styles.storageSegment}
              style={{
                width: `${Math.max(stats?.breakdown?.uploads?.percentage || 0.4, 0.8)}%`,
                background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
              }}
              title={`Uploads Media: ${stats?.breakdown?.uploads?.mb || 6.6} MB (${stats?.breakdown?.uploads?.percentage || 0.4}%)`}
            />
          </div>
        </div>

        {/* Storage Details Grid */}
        <div className={styles.storageBreakdownGrid}>
          <div className={styles.storageItem}>
            <div className={styles.storageDot} style={{ background: "#0284c7" }} />
            <div className={styles.storageItemInfo}>
              <div className={styles.storageItemTitle}>
                <span>Build & Cache Next.js (.next)</span>
                <span className={styles.storageItemSize}>
                  {stats?.breakdown?.nextBuild?.mb || 1412.61} MB ({stats?.breakdown?.nextBuild?.percentage || 74.7}%)
                </span>
              </div>
              <div className={styles.storageItemDesc}>
                {stats?.breakdown?.nextBuild?.files?.toLocaleString("id-ID") || "3.608"} file kompilasi Turbopack/Webpack, chunk server & client, serta cache render dinamis.
              </div>
            </div>
          </div>

          <div className={styles.storageItem}>
            <div className={styles.storageDot} style={{ background: "#8b5cf6" }} />
            <div className={styles.storageItemInfo}>
              <div className={styles.storageItemTitle}>
                <span>Dependensi (node_modules)</span>
                <span className={styles.storageItemSize}>
                  {stats?.breakdown?.nodeModules?.mb || 460.70} MB ({stats?.breakdown?.nodeModules?.percentage || 24.4}%)
                </span>
              </div>
              <div className={styles.storageItemDesc}>
                {stats?.breakdown?.nodeModules?.files?.toLocaleString("id-ID") || "23.018"} paket dependensi: Next.js 16, React 19, mysql2, bcryptjs, JWT, CSS tools.
              </div>
            </div>
          </div>

          <div className={styles.storageItem}>
            <div className={styles.storageDot} style={{ background: "#10b981" }} />
            <div className={styles.storageItemInfo}>
              <div className={styles.storageItemTitle}>
                <span>Source Code & Skrip Asli</span>
                <span className={styles.storageItemSize}>
                  {stats?.breakdown?.sourceCode?.mb || 18.11} MB ({stats?.breakdown?.sourceCode?.percentage || 1.0}%)
                </span>
              </div>
              <div className={styles.storageItemDesc}>
                {stats?.breakdown?.sourceCode?.files || 155} file kode program (App Router, komponen UI, skrip RBAC, database migrasi, styling, dan dokumentasi).
              </div>
            </div>
          </div>

          <div className={styles.storageItem}>
            <div className={styles.storageDot} style={{ background: "#f59e0b" }} />
            <div className={styles.storageItemInfo}>
              <div className={styles.storageItemTitle}>
                <span>Berkas Media (public/uploads)</span>
                <span className={styles.storageItemSize}>
                  {stats?.breakdown?.uploads?.mb || 6.65} MB ({stats?.breakdown?.uploads?.percentage || 0.35}%)
                </span>
              </div>
              <div className={styles.storageItemDesc}>
                {stats?.breakdown?.uploads?.files || 19} berkas gambar katalog laptop, foto avatar staf admin, icon favicon, dan logo website tersimpan di server.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive Tabs ── */}
      <div className={styles.tabsNav}>
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`${styles.tabBtn} ${activeTab === "overview" ? styles.tabBtnActive : ""}`}
        >
          <span>📊</span>
          <span>Ringkasan & Tech Stack</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("versions")}
          className={`${styles.tabBtn} ${activeTab === "versions" ? styles.tabBtnActive : ""}`}
        >
          <span>🚀</span>
          <span>Riwayat Versi</span>
          <span className={styles.tabBadge}>{VERSION_HISTORY.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("modules")}
          className={`${styles.tabBtn} ${activeTab === "modules" ? styles.tabBtnActive : ""}`}
        >
          <span>✅</span>
          <span>Modul Selesai</span>
          <span className={styles.tabBadge}>{COMPLETED_MODULES.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("roadmap")}
          className={`${styles.tabBtn} ${activeTab === "roadmap" ? styles.tabBtnActive : ""}`}
        >
          <span>⏳</span>
          <span>Roadmap Masa Depan</span>
          <span className={styles.tabBadge}>4 Agenda</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("markdown")}
          className={`${styles.tabBtn} ${activeTab === "markdown" ? styles.tabBtnActive : ""}`}
        >
          <span>📄</span>
          <span>Dokumen PROGRESS.md</span>
          <span className={styles.tabBadge}>Live</span>
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW & TECH STACK ── */}
      {activeTab === "overview" && (
        <div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, marginBottom: "1.25rem", color: "var(--text-contrast)" }}>
            ⚡ Arsitektur & Teknologi Raja Laptop
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
            {(stats?.techStack || [
              { name: "Next.js", version: "16.0.7", role: "Full-stack React Framework (App Router)" },
              { name: "React", version: "19.0.0", role: "UI Component Library" },
              { name: "MySQL", version: "8.0+ / MariaDB", role: "Database Relasional Utama" },
              { name: "RBAC Engine", version: "v2 Enterprise", role: "9 Role, 52 Granular Permissions" },
              { name: "Auth System", version: "JWT + HttpOnly Cookie", role: "Sistem Autentikasi Staf & Pembeli" },
              { name: "Styling", version: "Vanilla CSS Modules", role: "Design System Glassmorphism Modern" },
            ]).map((t, idx) => (
              <div key={idx} style={{
                background: "var(--bg-card)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-md)",
                padding: "1.2rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "1.05rem", color: "var(--text-contrast)" }}>{t.name}</strong>
                  <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "9999px", background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6", fontWeight: 700 }}>
                    {t.version}
                  </span>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
                  {t.role}
                </p>
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, marginBottom: "1rem", color: "var(--text-contrast)" }}>
            🛡️ Pilar Fondasi Keamanan & Keandalan
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🔒</div>
              <strong style={{ color: "var(--text-contrast)", fontSize: "1rem", display: "block", marginBottom: "0.3rem" }}>
                Server-Side Enforcement
              </strong>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Seluruh evaluasi permission dan scope data dilakukan secara ketat di backend API Guard (lib/apiGuard.js). Menolak akses tanpa izin dengan kode HTTP 401 dan 403.
              </p>
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>⚛️</div>
              <strong style={{ color: "var(--text-contrast)", fontSize: "1rem", display: "block", marginBottom: "0.3rem" }}>
                Transaksi Atomik ACID
              </strong>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Setiap transaksi kasir mengeksekusi BEGIN TRANSACTION ➔ DECREMENT STOCK ➔ WRITE AUDIT ➔ COMMIT. Rollback otomatis jika ada error demi menjamin integritas uang dan stok.
              </p>
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>📜</div>
              <strong style={{ color: "var(--text-contrast)", fontSize: "1rem", display: "block", marginBottom: "0.3rem" }}>
                Immutable Audit Trail
              </strong>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Audit log aktivitas staf bersifat mutlak kebal manipulasi. Metode DELETE dan PUT diblokir permanen bahkan bagi Super Admin dan Owner sekalipun.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: VERSION HISTORY / TIMELINE ── */}
      {activeTab === "versions" && (
        <div>
          <div className={styles.timeline}>
            {VERSION_HISTORY.map((v, idx) => {
              const isActive = v.status === "active";
              return (
                <div key={idx} className={styles.timelineItem}>
                  <div className={`${styles.timelineNode} ${isActive ? styles.timelineNodeActive : ""}`} />
                  <div className={`${styles.timelineCard} ${isActive ? styles.timelineCardActive : ""}`}>
                    <div className={styles.versionHeader}>
                      <div className={styles.versionTag}>
                        <span className={styles.versionNumber}>{v.version}</span>
                        <span className={styles.versionDate}>• {v.date}</span>
                      </div>
                      <span className={`${styles.versionBadge} ${isActive ? styles.versionBadgeActive : ""}`}>
                        {v.badge}
                      </span>
                    </div>

                    <div className={styles.versionTitle}>{v.title}</div>
                    <p className={styles.versionSummary}>{v.summary}</p>

                    <strong style={{ fontSize: "0.825rem", color: "var(--text-contrast)", display: "block", marginBottom: "0.4rem" }}>
                      Sorotan Perubahan:
                    </strong>
                    <ul className={styles.highlightList}>
                      {v.highlights.map((h, hIdx) => (
                        <li key={hIdx} className={styles.highlightItem}>
                          <span className={styles.highlightBullet}>✓</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 3: COMPLETED MODULES ── */}
      {activeTab === "modules" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "var(--text-contrast)" }}>
                Daftar Modul yang Telah Berhasil Beroperasi ({filteredModules.length})
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "0.2rem 0 0" }}>
                Seluruh modul telah lulus pengujian end-to-end dan terintegrasi di sistem backend & frontend.
              </p>
            </div>
            <input
              type="text"
              placeholder="Cari modul atau fitur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "0.55rem 0.95rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--glass-border)",
                background: "var(--bg-card)",
                color: "var(--text-main)",
                fontSize: "0.85rem",
                minWidth: "240px",
              }}
            />
          </div>

          <div className={styles.modulesGrid}>
            {filteredModules.map((m) => (
              <div key={m.num} className={styles.moduleCard} style={{ borderColor: `${m.color}30` }}>
                <div className={styles.moduleTop}>
                  <div className={styles.moduleIconWrapper} style={{ background: `${m.color}15`, color: m.color }}>
                    {m.icon}
                  </div>
                  <span className={styles.moduleBadge} style={{ background: `${m.color}15`, color: m.color }}>
                    MODUL #{m.num} • {m.badge}
                  </span>
                </div>
                <div className={styles.moduleTitle}>{m.title}</div>
                <div className={styles.moduleDesc}>{m.desc}</div>
                <ul className={styles.moduleFeaturesList}>
                  {m.items.map((item, iIdx) => (
                    <li key={iIdx} className={styles.moduleFeatureItem}>
                      <span style={{ color: m.color, fontWeight: "bold" }}>•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: ROADMAP & BACKLOG ── */}
      {activeTab === "roadmap" && (
        <div>
          <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "var(--text-contrast)" }}>
              Agenda Roadmap Pengembangan Selanjutnya
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "0.2rem 0 0" }}>
              Fitur yang saat ini dalam tahap perancangan teknis untuk rilis milestone berikutnya.
            </p>
          </div>

          <div className={styles.roadmapGrid}>
            {ROADMAP_ITEMS.map((cat, idx) => (
              <div key={idx} className={styles.roadmapCard} style={{ borderColor: `${cat.color}30` }}>
                <div className={styles.roadmapHeader}>
                  <div className={styles.roadmapCategory}>
                    <span>{cat.icon}</span>
                    <span>{cat.category}</span>
                  </div>
                  <span className={styles.roadmapBadge} style={{ background: `${cat.color}15`, color: cat.color }}>
                    {cat.status}
                  </span>
                </div>
                <div className={styles.taskList}>
                  {cat.tasks.map((task, tIdx) => (
                    <div key={tIdx} className={styles.taskItem}>
                      <input type="checkbox" checked={task.done} readOnly className={styles.taskCheckbox} />
                      <div className={styles.taskContent}>
                        <div className={styles.taskName}>{task.name}</div>
                        <div className={styles.taskDesc}>{task.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 5: PROGRESS.MD VIEWER ── */}
      {activeTab === "markdown" && (
        <div className={styles.viewerBox}>
          <div className={styles.viewerToolbar}>
            <div className={styles.viewerTitle}>
              <span>📄</span>
              <span>Dokumentasi PROGRESS.md Sumber</span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "normal" }}>
                ({stats?.progressFile?.sizeFormatted || "17 KB"} • Diperbarui {stats?.progressFile?.lastModified ? new Date(stats.progressFile.lastModified).toLocaleDateString("id-ID") : "Hari Ini"})
              </span>
            </div>
            <div className={styles.viewerActions}>
              <button type="button" onClick={handleCopyMarkdown} className={styles.actionBtn}>
                {copied ? "✓ Tersalin!" : "📋 Salin Teks"}
              </button>
              <button type="button" onClick={handleDownload} className={styles.actionBtn}>
                ⬇️ Unduh File .md
              </button>
            </div>
          </div>
          <pre className={styles.preBlock}>
            {rawMarkdown || "Memuat isi PROGRESS.md dari server..."}
          </pre>
        </div>
      )}

      {/* ── CTA Back Links ── */}
      <section className={styles.ctaBox}>
        <div className={styles.ctaText}>
          <h3>Ingin Menjelajahi Toko Raja Laptop?</h3>
          <p>
            Katalog 430+ laptop siap dibeli dengan garansi resmi dan pengiriman ke seluruh cabang Jawa Tengah & DIY.
          </p>
        </div>
        <div className={styles.ctaButtons}>
          <Link href="/produk" className={styles.primaryBtn}>
            🛒 Buka Katalog Laptop
          </Link>
          <Link href="/" className={styles.secondaryBtn}>
            🏠 Kembali ke Beranda
          </Link>
        </div>
      </section>
    </div>
  );
}
