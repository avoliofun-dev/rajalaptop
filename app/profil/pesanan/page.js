"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Footer from "@/app/components/Footer";
import FloatWA from "@/app/components/FloatWA";
import Toast from "@/app/components/Toast";
import QRISDynamicModal from "@/app/components/QRISDynamicModal";
import styles from "./PesananCustomer.module.css";

function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(number) || 0);
}

function getStatusBadge(status, paymentStatus) {
  const s = (status || "").toLowerCase();
  const ps = (paymentStatus || "").toLowerCase();

  if (s === "selesai") {
    return { label: "Selesai", bg: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "rgba(16, 185, 129, 0.3)" };
  }
  if (s.includes("kirim") || s.includes("proses")) {
    return { label: "Diproses / Dikirim", bg: "rgba(59, 130, 246, 0.15)", color: "#3b82f6", border: "rgba(59, 130, 246, 0.3)" };
  }
  if (s.includes("batal")) {
    return { label: "Dibatalkan", bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444", border: "rgba(239, 68, 68, 0.3)" };
  }
  if (ps === "paid") {
    return { label: "Lunas / Diproses", bg: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "rgba(16, 185, 129, 0.3)" };
  }
  return { label: "Menunggu Pembayaran", bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", border: "rgba(245, 158, 11, 0.3)" };
}

export default function CustomerPesananPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [qrisOrder, setQrisOrder] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const [authRes, ordersRes] = await Promise.all([
          fetch("/api/auth/customer/me"),
          fetch("/api/auth/customer/orders"),
        ]);

        if (!authRes.ok) {
          router.replace("/login?next=/profil/pesanan");
          return;
        }

        const authData = await authRes.json();
        if (!ignore && authData.user) {
          setUser(authData.user);
        }

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          if (!ignore && Array.isArray(ordersData.orders)) {
            setOrders(ordersData.orders);
          }
        }
      } catch (err) {
        console.error("Gagal load pesanan:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, [router]);

  const filteredOrders = orders.filter((o) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      (o.id || "").toLowerCase().includes(q) ||
      (o.product || "").toLowerCase().includes(q) ||
      (o.kurir || "").toLowerCase().includes(q);

    if (!matchSearch) return false;

    if (activeTab === "all") return true;
    const st = (o.status || "").toLowerCase();
    const ps = (o.payment_status || "").toLowerCase();

    if (activeTab === "pending") return ps !== "paid" && !st.includes("batal") && !st.includes("selesai");
    if (activeTab === "processing") return (ps === "paid" || st.includes("proses") || st.includes("kirim")) && st !== "selesai";
    if (activeTab === "completed") return st === "selesai";
    if (activeTab === "cancelled") return st.includes("batal");
    return true;
  });

  return (
    <>
      <div className={styles.container}>
        {/* ── Breadcrumb ── */}
        <nav className={styles.breadcrumb}>
          <Link href="/" className={styles.breadcrumbLink}>Beranda</Link>
          <span>/</span>
          <Link href="/profil" className={styles.breadcrumbLink}>Akun Saya</Link>
          <span>/</span>
          <span className={styles.breadcrumbCurrent}>Riwayat Pesanan</span>
        </nav>

        {/* ── Header Banner ── */}
        <div className={styles.headerBanner}>
          <div className={styles.headerInfo}>
            <div className={styles.headerIcon}>🛍️</div>
            <div>
              <h1 className={styles.headerTitle}>Pesanan Saya</h1>
              <p className={styles.headerSubtitle}>
                Pantau status pembayaran, pengiriman ekspedisi, dan riwayat faktur belanja Anda di RajaLaptop.
              </p>
            </div>
          </div>
          <div className={styles.headerNav}>
            <Link href="/profil" className={styles.secondaryBtn}>
              👤 Profil Akun
            </Link>
            <Link href="/produk" className={styles.primaryBtn}>
              🛒 Belanja Lagi
            </Link>
          </div>
        </div>

        {/* ── Filter & Search Toolbar ── */}
        <div className={styles.toolbar}>
          <div className={styles.tabsWrapper}>
            {[
              { id: "all", label: "Semua", count: orders.length },
              {
                id: "pending",
                label: "Menunggu Bayar",
                count: orders.filter((o) => (o.payment_status || "").toLowerCase() !== "paid" && !(o.status || "").toLowerCase().includes("batal") && (o.status || "").toLowerCase() !== "selesai").length,
              },
              {
                id: "processing",
                label: "Diproses",
                count: orders.filter((o) => ((o.payment_status || "").toLowerCase() === "paid" || (o.status || "").toLowerCase().includes("proses") || (o.status || "").toLowerCase().includes("kirim")) && (o.status || "").toLowerCase() !== "selesai").length,
              },
              {
                id: "completed",
                label: "Selesai",
                count: orders.filter((o) => (o.status || "").toLowerCase() === "selesai").length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`${styles.tabBtn} ${activeTab === tab.id ? styles.activeTab : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.label}</span>
                <span className={styles.tabBadge}>{tab.count}</span>
              </button>
            ))}
          </div>

          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Cari no. faktur atau laptop..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className={styles.clearSearchBtn}>
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ── Orders Content ── */}
        {loading ? (
          <div className={styles.emptyCard}>
            <div className={styles.spinnerIcon}>⏳</div>
            <h3>Memuat Pesanan...</h3>
            <p>Mengambil data transaksi belanja resmi Anda.</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className={styles.emptyCard}>
            <div className={styles.emptyIcon}>📦</div>
            <h3>Belum Ada Pesanan {activeTab !== "all" ? `dengan Status Ini` : ""}</h3>
            <p>
              {activeTab === "all"
                ? "Anda belum pernah melakukan pemesanan unit laptop atau aksesoris. Jelajahi katalog kami untuk penawaran terbaik!"
                : "Tidak ada transaksi yang cocok dengan filter yang Anda pilih."}
            </p>
            <Link href="/produk" className={styles.primaryBtn} style={{ marginTop: "1rem" }}>
              Mulai Belanja Sekarang →
            </Link>
          </div>
        ) : (
          <div className={styles.ordersList}>
            {filteredOrders.map((order) => {
              const badge = getStatusBadge(order.status, order.payment_status);
              const isUnpaid = (order.payment_status || "").toLowerCase() !== "paid" && !(order.status || "").toLowerCase().includes("batal");

              return (
                <div key={order.id} className={styles.orderCard}>
                  {/* Card Header */}
                  <div className={styles.cardHeader}>
                    <div className={styles.headerLeft}>
                      <span className={styles.invoiceBadge}>#{order.id}</span>
                      <span className={styles.orderDate}>{order.date || "-"}</span>
                      {order.kurir && (
                        <span className={styles.courierTag}>🚚 {order.kurir}</span>
                      )}
                    </div>
                    <div>
                      <span
                        className={styles.statusBadge}
                        style={{
                          background: badge.bg,
                          color: badge.color,
                          borderColor: badge.border,
                        }}
                      >
                        ● {badge.label}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className={styles.cardBody}>
                    <div className={styles.productInfo}>
                      <div className={styles.productIcon}>💻</div>
                      <div>
                        <h4 className={styles.productName}>{order.product}</h4>
                        <div className={styles.metaRow}>
                          <span>Metode: <strong>{order.payment_method || "Online"}</strong></span>
                          {order.resi && order.resi !== "-" && (
                            <span>Resi Ekspedisi: <strong style={{ color: "var(--clr-primary)" }}>{order.resi}</strong></span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={styles.priceSection}>
                      <div className={styles.priceLabel}>Total Tagihan</div>
                      <div className={styles.priceValue}>{formatRupiah(order.total)}</div>
                      {order.discount_amount > 0 && (
                        <div className={styles.discountBadge}>
                          Hemat {formatRupiah(order.discount_amount)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className={styles.cardFooter}>
                    <div className={styles.footerHelp}>
                      {isUnpaid ? (
                        <span style={{ color: "#f59e0b", fontSize: "0.82rem", fontWeight: 600 }}>
                          ⚠️ Harap segera selesaikan pembayaran untuk verifikasi pengiriman.
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                          🛡️ Unit dilindungi garansi resmi RajaLaptop.
                        </span>
                      )}
                    </div>

                    <div className={styles.actionButtons}>
                      {/* Tombol Bayar jika masih pending */}
                      {isUnpaid && order.payment_method?.toLowerCase().includes("qris") && (
                        <button
                          type="button"
                          className={styles.payBtn}
                          onClick={() => setQrisOrder(order)}
                        >
                          📲 Bayar Sekarang (QRIS)
                        </button>
                      )}

                      <button
                        type="button"
                        className={styles.detailBtn}
                        onClick={() => setSelectedOrder(order)}
                      >
                        📄 Lihat Rincian Faktur
                      </button>

                      <a
                        href={`https://wa.me/6289646618000?text=${encodeURIComponent(
                          `Halo RajaLaptop, saya ingin menanyakan pesanan #${order.id} atas nama ${order.customer}.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.waBtn}
                      >
                        💬 Bantuan CS
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── MODAL: DETAIL FAKTUR NOTA RESMI ── */}
        {selectedOrder && (
          <div className={styles.modalOverlay} onClick={() => setSelectedOrder(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              {/* Modal Top */}
              <div className={styles.modalHeader}>
                <div>
                  <h3 className={styles.modalTitle}>Faktur Pembelian Resmi</h3>
                  <p className={styles.modalSubtitle}>No. Pesanan #{selectedOrder.id}</p>
                </div>
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={() => setSelectedOrder(null)}
                >
                  ✕
                </button>
              </div>

              {/* Status Box */}
              <div className={styles.modalStatusBox}>
                <div>
                  <span className={styles.labelMuted}>Status Pesanan</span>
                  <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text-contrast)" }}>
                    {selectedOrder.status || "Diproses"}
                  </div>
                </div>
                <div>
                  <span className={styles.labelMuted}>Status Pembayaran</span>
                  <div style={{ fontWeight: 800, fontSize: "1.05rem", color: selectedOrder.payment_status === "PAID" ? "#10b981" : "#f59e0b" }}>
                    {selectedOrder.payment_status === "PAID" ? "LUNAS (PAID)" : "BELUM LUNAS"}
                  </div>
                </div>
              </div>

              {/* 2-Column Info */}
              <div className={styles.infoGrid}>
                <div className={styles.infoBox}>
                  <div className={styles.infoBoxTitle}>Informasi Penerima</div>
                  <div className={styles.infoRow}>
                    <span>Nama:</span>
                    <strong>{selectedOrder.customer}</strong>
                  </div>
                  {selectedOrder.phone && (
                    <div className={styles.infoRow}>
                      <span>No. WhatsApp:</span>
                      <span>{selectedOrder.phone}</span>
                    </div>
                  )}
                  {selectedOrder.email && (
                    <div className={styles.infoRow}>
                      <span>Email:</span>
                      <span>{selectedOrder.email}</span>
                    </div>
                  )}
                </div>

                <div className={styles.infoBox}>
                  <div className={styles.infoBoxTitle}>Pengiriman & Transaksi</div>
                  <div className={styles.infoRow}>
                    <span>Tanggal:</span>
                    <span>{selectedOrder.date}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span>Metode:</span>
                    <strong>{selectedOrder.payment_method || "POS/Transfer"}</strong>
                  </div>
                  <div className={styles.infoRow}>
                    <span>Ekspedisi:</span>
                    <span>{selectedOrder.kurir || "-"}</span>
                  </div>
                  {selectedOrder.resi && selectedOrder.resi !== "-" && (
                    <div className={styles.infoRow}>
                      <span>No. Resi:</span>
                      <strong style={{ color: "var(--clr-primary)" }}>{selectedOrder.resi}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Section */}
              <div className={styles.itemsSection}>
                <div className={styles.itemsHeader}>
                  <span>Item Produk</span>
                  <span>Total</span>
                </div>
                <div className={styles.itemRow}>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--text-contrast)", fontSize: "0.95rem" }}>
                      {selectedOrder.product}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                      Garansi Resmi Distributor & Garansi Toko RajaLaptop
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, color: "var(--text-contrast)" }}>
                    {formatRupiah(selectedOrder.total + (Number(selectedOrder.discount_amount) || 0))}
                  </div>
                </div>
              </div>

              {/* Summary Totals */}
              <div className={styles.summaryTotals}>
                {selectedOrder.discount_amount > 0 && (
                  <div className={styles.summaryRow} style={{ color: "#ef4444" }}>
                    <span>Diskon Pembelian:</span>
                    <span>-{formatRupiah(selectedOrder.discount_amount)}</span>
                  </div>
                )}
                <div className={styles.summaryRowTotal}>
                  <span>Total Pembayaran:</span>
                  <span style={{ color: "var(--clr-primary)" }}>{formatRupiah(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.printBtn}
                  onClick={() => window.print()}
                >
                  🖨️ Cetak Bukti Pembelian
                </button>
                <button
                  type="button"
                  className={styles.closeModalBtn}
                  onClick={() => setSelectedOrder(null)}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── QRIS Dynamic Modal Customer ── */}
        {qrisOrder && (
          <QRISDynamicModal
            order={qrisOrder}
            onClose={() => setQrisOrder(null)}
          />
        )}
      </div>

      <Footer />
      <FloatWA />
      <Toast />
    </>
  );
}
