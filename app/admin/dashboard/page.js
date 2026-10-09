"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const formatRupiah = (num) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(num) || 0);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", color: "var(--text-muted)" }}>
        Memuat data dashboard terotorisasi...
      </div>
    );
  }

  const role = data?.role || "super_admin";
  const metrics = data?.metrics || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Welcome Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, hsla(220, 90%, 56%, 0.15) 0%, hsla(260, 80%, 60%, 0.15) 100%)",
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--radius-lg)",
          padding: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "var(--clr-primary)" }}>
            Portal Eksekutif & Operasional
          </span>
          <h1 style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text-contrast)", marginTop: "2px" }}>
            Selamat Datang, {data?.userName || "Staf"}
          </h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            Peran: <strong style={{ color: "var(--clr-primary)" }}>{data?.roleName || role}</strong> • Scope Akses:{" "}
            <strong>{data?.defaultScope || "STORE"}</strong>
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link
            href="/admin/approvals"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--glass-border)",
              color: "var(--text-contrast)",
              padding: "0.55rem 1rem",
              borderRadius: "var(--radius-md)",
              fontSize: "0.8rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>📝</span>
            <span>Approval</span>
          </Link>
          <Link
            href="/admin/serials"
            style={{
              background: "var(--clr-primary)",
              color: "#fff",
              padding: "0.55rem 1rem",
              borderRadius: "var(--radius-md)",
              fontSize: "0.8rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🏷️</span>
            <span>Serial Unit</span>
          </Link>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. ROLE OWNER DASHBOARD                                  */}
      {/* ======================================================== */}
      {role === "owner" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", padding: "1.25rem", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>TOTAL OMZET PERUSAHAAN</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#10b981", marginTop: "4px" }}>
                {formatRupiah(metrics.total_sales)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Akumulasi seluruh cabang</div>
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", padding: "1.25rem", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>ESTIMASI LABA KOTOR (~17.5%)</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#3b82f6", marginTop: "4px" }}>
                {formatRupiah(metrics.estimated_profit)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Gross profit margin laptop</div>
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", padding: "1.25rem", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>VALUASI TOTAL STOK</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#d97706", marginTop: "4px" }}>
                {formatRupiah(metrics.total_stock_value)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Nilai aset laptop di gudang/toko</div>
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", padding: "1.25rem", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>PERSETUJUAN MENUNGGU</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ef4444", marginTop: "4px" }}>
                {metrics.pending_approvals || 0} Tiket
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Memerlukan approval eksekutif</div>
            </div>
          </div>

          {/* Branch Performance Comparison */}
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)", padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-contrast)", marginBottom: "1rem" }}>
              Performa Penjualan Antar Cabang
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--glass-border)", color: "var(--text-muted)" }}>
                  <th style={{ textAlign: "left", padding: "0.6rem 0" }}>Cabang Toko</th>
                  <th style={{ textAlign: "center", padding: "0.6rem 0" }}>Jumlah Transaksi</th>
                  <th style={{ textAlign: "right", padding: "0.6rem 0" }}>Total Omzet</th>
                </tr>
              </thead>
              <tbody>
                {data?.branchPerformance?.map((b) => (
                  <tr key={b.id} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                    <td style={{ padding: "0.75rem 0", fontWeight: 600, color: "var(--text-contrast)" }}>{b.name}</td>
                    <td style={{ textAlign: "center", padding: "0.75rem 0" }}>{b.orders_count} Pesanan</td>
                    <td style={{ textAlign: "right", padding: "0.75rem 0", color: "#10b981", fontWeight: 700 }}>
                      {formatRupiah(b.sales_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* 2. ROLE MANAGER AREA DASHBOARD                           */}
      {/* ======================================================== */}
      {role === "manajer_area" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", padding: "1.25rem", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>OMZET REGIONAL AREA</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#8b5cf6", marginTop: "4px" }}>
                {formatRupiah(metrics.area_sales)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Dari {metrics.assigned_stores_count} toko penugasan</div>
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", padding: "1.25rem", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>TOTAL TRANSAKSI AREA</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-contrast)", marginTop: "4px" }}>
                {metrics.area_orders || 0} Pesanan
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Penjualan regional</div>
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", padding: "1.25rem", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>APPROVAL AREA PENDING</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f59e0b", marginTop: "4px" }}>
                {metrics.pending_approvals || 0} Permohonan
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Diskon & mutasi stok</div>
            </div>
          </div>

          <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)", padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-contrast)", marginBottom: "1rem" }}>
              Perbandingan Toko dalam Wilayah Area Anda
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--glass-border)", color: "var(--text-muted)" }}>
                  <th style={{ textAlign: "left", padding: "0.6rem 0" }}>Nama Cabang</th>
                  <th style={{ textAlign: "center", padding: "0.6rem 0" }}>Transaksi</th>
                  <th style={{ textAlign: "right", padding: "0.6rem 0" }}>Omzet Penjualan</th>
                </tr>
              </thead>
              <tbody>
                {data?.branchComparison?.map((b) => (
                  <tr key={b.id} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                    <td style={{ padding: "0.75rem 0", fontWeight: 600, color: "var(--text-contrast)" }}>{b.name}</td>
                    <td style={{ textAlign: "center", padding: "0.75rem 0" }}>{b.orders} Unit</td>
                    <td style={{ textAlign: "right", padding: "0.75rem 0", color: "#8b5cf6", fontWeight: 700 }}>
                      {formatRupiah(b.sales)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* 3. ROLE KEPALA TOKO DASHBOARD                            */}
      {/* ======================================================== */}
      {role === "kepala_toko" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", padding: "1.25rem", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>OMZET TOKO ANDA</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#6366f1", marginTop: "4px" }}>
                {formatRupiah(metrics.store_sales)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Cabang {data?.storeId}</div>
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", padding: "1.25rem", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>TOTAL PENJUALAN TOKO</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-contrast)", marginTop: "4px" }}>
                {metrics.store_orders || 0} Transaksi
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Penjualan kasir toko</div>
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", padding: "1.25rem", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>PERMOHONAN APPROVAL</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f59e0b", marginTop: "4px" }}>
                {metrics.pending_approvals || 0} Tiket
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Diskon kasir & refund</div>
            </div>
          </div>

          <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)", padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-contrast)", marginBottom: "1rem" }}>
              Performa Kasir Toko
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--glass-border)", color: "var(--text-muted)" }}>
                  <th style={{ textAlign: "left", padding: "0.6rem 0" }}>Nama Kasir</th>
                  <th style={{ textAlign: "center", padding: "0.6rem 0" }}>Transaksi Berhasil</th>
                  <th style={{ textAlign: "right", padding: "0.6rem 0" }}>Total Penjualan</th>
                </tr>
              </thead>
              <tbody>
                {data?.cashierPerformance?.map((c, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                    <td style={{ padding: "0.75rem 0", fontWeight: 600, color: "var(--text-contrast)" }}>{c.cashier_name}</td>
                    <td style={{ textAlign: "center", padding: "0.75rem 0" }}>{c.transactions_count} Struk</td>
                    <td style={{ textAlign: "right", padding: "0.75rem 0", color: "#6366f1", fontWeight: 700 }}>
                      {formatRupiah(c.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* 4. ROLE KASIR DASHBOARD                                  */}
      {/* ======================================================== */}
      {role === "kasir" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", padding: "1.25rem", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>PENJUALAN SAYA HARI INI</span>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#10b981", marginTop: "4px" }}>
                {formatRupiah(metrics.today_sales)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Total transaksi kasir Anda</div>
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", padding: "1.25rem", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>STRUK TERCETAK</span>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-contrast)", marginTop: "4px" }}>
                {metrics.today_transactions || 0} Transaksi
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Pelanggan terlayani</div>
            </div>
          </div>

          <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-contrast)" }}>
                Transaksi Terakhir Saya
              </h3>
              <Link href="/admin/pesanan" style={{ fontSize: "0.8rem", color: "var(--clr-primary)", fontWeight: 700 }}>
                Buka POS Kasir ➔
              </Link>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--glass-border)", color: "var(--text-muted)" }}>
                  <th style={{ textAlign: "left", padding: "0.6rem 0" }}>No. Faktur</th>
                  <th style={{ textAlign: "left", padding: "0.6rem 0" }}>Pelanggan</th>
                  <th style={{ textAlign: "left", padding: "0.6rem 0" }}>Produk</th>
                  <th style={{ textAlign: "right", padding: "0.6rem 0" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentTransactions?.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                    <td style={{ padding: "0.75rem 0", fontWeight: 700, color: "var(--clr-primary)" }}>{t.id}</td>
                    <td style={{ padding: "0.75rem 0", color: "var(--text-contrast)" }}>{t.customer}</td>
                    <td style={{ padding: "0.75rem 0", color: "var(--text-secondary)" }}>{t.product}</td>
                    <td style={{ textAlign: "right", padding: "0.75rem 0", fontWeight: 700, color: "#10b981" }}>
                      {formatRupiah(t.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* 5. ROLE GUDANG DASHBOARD                                 */}
      {/* ======================================================== */}
      {role === "gudang" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", padding: "1.25rem", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>SERIAL NUMBER TERSEDIA</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#d97706", marginTop: "4px" }}>
                {metrics.serials_in_stock || 0} Unit
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Siap didistribusikan / dijual</div>
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", padding: "1.25rem", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>STOK KRITIS (MENIPIS)</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ef4444", marginTop: "4px" }}>
                {metrics.low_stock_products || 0} SKU
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Stok kurang dari 3 unit</div>
            </div>
          </div>

          <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)", padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-contrast)", marginBottom: "1rem" }}>
              Peringatan Stok Kritis (Perlu Restock)
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--glass-border)", color: "var(--text-muted)" }}>
                  <th style={{ textAlign: "left", padding: "0.6rem 0" }}>Produk Laptop</th>
                  <th style={{ textAlign: "left", padding: "0.6rem 0" }}>Brand</th>
                  <th style={{ textAlign: "center", padding: "0.6rem 0" }}>Sisa Fisik</th>
                  <th style={{ textAlign: "right", padding: "0.6rem 0" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.lowStock?.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                    <td style={{ padding: "0.75rem 0", fontWeight: 600, color: "var(--text-contrast)" }}>{p.name}</td>
                    <td style={{ padding: "0.75rem 0", color: "var(--text-secondary)" }}>{p.brand}</td>
                    <td style={{ textAlign: "center", padding: "0.75rem 0", fontWeight: 800, color: "#ef4444" }}>
                      {p.stock} Unit
                    </td>
                    <td style={{ textAlign: "right", padding: "0.75rem 0" }}>
                      <span style={{ background: "hsla(0, 80%, 58%, 0.15)", color: "#ef4444", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700 }}>
                        Perlu Restock
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* 6. ROLE FINANCE DASHBOARD                                */}
      {/* ======================================================== */}
      {role === "finance" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", padding: "1.25rem", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>TOTAL PENERIMAAN / SALES</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#10b981", marginTop: "4px" }}>
                {formatRupiah(metrics.total_income)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Kas masuk terverifikasi</div>
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", padding: "1.25rem", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>TOTAL BIAYA & EXPENSES</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ef4444", marginTop: "4px" }}>
                {formatRupiah(metrics.total_expenses)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Biaya operasional & utilitas</div>
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", padding: "1.25rem", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>ARUS KAS BERSIH (NET CASH FLOW)</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#3b82f6", marginTop: "4px" }}>
                {formatRupiah(metrics.net_cash_flow)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Net operating cash flow</div>
            </div>
          </div>

          <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)", padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-contrast)", marginBottom: "1rem" }}>
              Riwayat Pengeluaran Operasional (Expenses)
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--glass-border)", color: "var(--text-muted)" }}>
                  <th style={{ textAlign: "left", padding: "0.6rem 0" }}>Tanggal</th>
                  <th style={{ textAlign: "left", padding: "0.6rem 0" }}>Kategori</th>
                  <th style={{ textAlign: "left", padding: "0.6rem 0" }}>Deskripsi</th>
                  <th style={{ textAlign: "right", padding: "0.6rem 0" }}>Nominal</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentExpenses?.map((ex) => (
                  <tr key={ex.id} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                    <td style={{ padding: "0.75rem 0", color: "var(--text-muted)" }}>{ex.date}</td>
                    <td style={{ padding: "0.75rem 0", fontWeight: 600, color: "var(--text-contrast)" }}>{ex.category}</td>
                    <td style={{ padding: "0.75rem 0", color: "var(--text-secondary)" }}>{ex.description}</td>
                    <td style={{ textAlign: "right", padding: "0.75rem 0", fontWeight: 700, color: "#ef4444" }}>
                      {formatRupiah(ex.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* 7. ROLE AUDIT DASHBOARD                                  */}
      {/* ======================================================== */}
      {role === "audit" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", padding: "1.25rem", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>TOTAL REKAMAN AUDIT TRAIL</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#3b82f6", marginTop: "4px" }}>
                {metrics.total_audit_logs || 0} Event
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Tercatat di server log</div>
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", padding: "1.25rem", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>PERCOBAAN GAGAL / DITOLAK</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ef4444", marginTop: "4px" }}>
                {metrics.failed_attempts || 0} Terdeteksi
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Scope violation & auth fails</div>
            </div>
          </div>

          <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-contrast)" }}>
                Aktivitas Audit Terbaru (Forensik)
              </h3>
              <Link href="/admin/audit-logs" style={{ fontSize: "0.8rem", color: "var(--clr-primary)", fontWeight: 700 }}>
                Buka Seluruh Audit Trail ➔
              </Link>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--glass-border)", color: "var(--text-muted)" }}>
                  <th style={{ textAlign: "left", padding: "0.6rem 0" }}>Waktu</th>
                  <th style={{ textAlign: "left", padding: "0.6rem 0" }}>Pengguna</th>
                  <th style={{ textAlign: "left", padding: "0.6rem 0" }}>Aksi</th>
                  <th style={{ textAlign: "right", padding: "0.6rem 0" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentLogs?.slice(0, 6).map((log) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                    <td style={{ padding: "0.75rem 0", color: "var(--text-muted)" }}>
                      {new Date(log.created_at).toLocaleString("id-ID")}
                    </td>
                    <td style={{ padding: "0.75rem 0", fontWeight: 600, color: "var(--text-contrast)" }}>
                      {log.user_name || log.user_email} ({log.role})
                    </td>
                    <td style={{ padding: "0.75rem 0", color: "var(--clr-primary)", fontWeight: 700 }}>{log.action}</td>
                    <td style={{ textAlign: "right", padding: "0.75rem 0" }}>
                      <span style={{ color: log.status === "SUCCESS" ? "#10b981" : "#ef4444", fontWeight: 800 }}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* 8. SUPER ADMIN / DEFAULT DASHBOARD                       */}
      {/* ======================================================== */}
      {role === "super_admin" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", padding: "1.25rem", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>TOTAL PENJUALAN</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#10b981", marginTop: "4px" }}>
                {formatRupiah(metrics.total_sales)}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Semua channel & kasir</div>
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", padding: "1.25rem", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>PESANAN PENDING</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#3b82f6", marginTop: "4px" }}>
                {metrics.pending_orders} Pesanan
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Perlu diproses toko</div>
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", padding: "1.25rem", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>TIKET SERVIS AKTIF</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f59e0b", marginTop: "4px" }}>
                {metrics.active_services} Unit
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Sedang ditangani teknisi</div>
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", padding: "1.25rem", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700 }}>APPROVAL PENDING</span>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#ef4444", marginTop: "4px" }}>
                {metrics.pending_approvals} Tiket
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>Menunggu persetujuan</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)", padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-contrast)", marginBottom: "1rem" }}>
                Pesanan Terkini
              </h3>
              {data?.recentOrders?.map((o) => (
                <div key={o.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid var(--glass-border)", fontSize: "0.85rem" }}>
                  <div>
                    <strong style={{ color: "var(--clr-primary)" }}>{o.id}</strong>
                    <div style={{ color: "var(--text-contrast)" }}>{o.customer}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, color: "#10b981" }}>{formatRupiah(o.total)}</div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{o.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)", padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-contrast)", marginBottom: "1rem" }}>
                Stok Laptop Kritis
              </h3>
              {data?.lowStock?.map((p) => (
                <div key={p.name} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid var(--glass-border)", fontSize: "0.85rem" }}>
                  <div style={{ color: "var(--text-contrast)", fontWeight: 600 }}>{p.name}</div>
                  <span style={{ color: "#ef4444", fontWeight: 800 }}>{p.stock} Unit</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
