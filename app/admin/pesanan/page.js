"use client";

import { useState, useEffect, useMemo } from "react";
import QRISDynamicModal from "@/app/components/QRISDynamicModal";
import { useSettings } from "@/app/context/SettingsContext";

export default function AdminPesananPage() {
  const { settings } = useSettings();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // POS State
  const [showPosModal, setShowPosModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [posSearch, setPosSearch] = useState("");
  const [posCategory, setPosCategory] = useState("all");

  // POS Cart State
  const [posCart, setPosCart] = useState([]);
  const [customerName, setCustomerName] = useState("Pelanggan Umum");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedStore, setSelectedStore] = useState("store-pekalongan");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Tunai");
  const [cashReceived, setCashReceived] = useState("");
  const [isProcessingSale, setIsProcessingSale] = useState(false);

  // Struk / Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [adminQrisOrder, setAdminQrisOrder] = useState(null);

  // Read Detail Modal for Cashier
  const [detailProduct, setDetailProduct] = useState(null);
  const [detailActiveImgIndex, setDetailActiveImgIndex] = useState(0);

  // Hardware Barcode & Serial Scanner State
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scannedCode, setScannedCode] = useState("");
  const [scannerNotification, setScannerNotification] = useState("");

  // Hardware Scanner: trigger scan simulation or handle USB barcode keyboard input
  const handleHardwareScan = (barcode) => {
    const code = (barcode || scannedCode).trim();
    if (!code) return;

    // Cari produk berdasarkan ID, nama, atau serial
    const found = products.find(
      (p) =>
        p.id.toLowerCase() === code.toLowerCase() ||
        p.name.toLowerCase().includes(code.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase() === code.toLowerCase())
    );

    if (found) {
      addToPosCart(found);
      setScannerNotification(`✓ Produk "${found.name}" berhasil di-scan masuk ke keranjang kasir!`);
      setScannedCode("");
      setTimeout(() => setScannerNotification(""), 3500);
    } else {
      setScannerNotification(`⚠️ Barcode/Serial "${code}" tidak ditemukan pada katalog.`);
      setTimeout(() => setScannerNotification(""), 3500);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data || []);
      }
    } catch (e) {
      console.error("Gagal load pesanan:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadProductsForPos = async () => {
    if (products.length > 0) return;
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data || []);
      }
    } catch (e) {
      console.error("Gagal load produk untuk POS:", e);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const openPosModal = () => {
    setShowPosModal(true);
    loadProductsForPos();
  };

  const updateStatus = async (id, newStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
    try {
      await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      loadOrders();
    } catch (e) {
      console.error("Gagal update status pesanan:", e);
    }
  };

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesFilter = filter === "all" || o.status === filter;
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (o.id && o.id.toLowerCase().includes(q)) ||
        (o.customer && o.customer.toLowerCase().includes(q)) ||
        (o.phone && o.phone.toLowerCase().includes(q)) ||
        (o.product && o.product.toLowerCase().includes(q));
      return matchesFilter && matchesSearch;
    });
  }, [orders, filter, searchTerm]);

  // POS Product Filtering
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = posCategory === "all" || p.category === posCategory;
      const q = posSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.specs && p.specs.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [products, posCategory, posSearch]);

  // Add Product to POS Cart
  const addToPosCart = (product) => {
    if (product.stock <= 0) {
      alert("Stok unit habis!");
      return;
    }

    setPosCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.id === product.id);
      if (existingIdx >= 0) {
        const item = prev[existingIdx];
        if (item.qty >= product.stock) {
          alert(`Maksimal stok tersedia adalah ${product.stock} unit.`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIdx] = { ...item, qty: item.qty + 1 };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            brand: product.brand,
            price: Number(product.price) || 0,
            stock: product.stock,
            image_url: product.image_url || (Array.isArray(product.images) && product.images[0]) || null,
            emoji: product.emoji || "💻",
            qty: 1,
            serialNumber: "",
          },
        ];
      }
    });
  };

  const updateCartQty = (id, delta) => {
    setPosCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.qty + delta;
            if (nextQty > item.stock) {
              alert(`Maksimal stok tersedia adalah ${item.stock} unit.`);
              return item;
            }
            return { ...item, qty: nextQty };
          }
          return item;
        })
        .filter((item) => item.qty > 0);
    });
  };

  const removeCartItem = (id) => {
    setPosCart((prev) => prev.filter((it) => it.id !== id));
  };

  // Cart Calculations
  const cartSubtotal = posCart.reduce((sum, it) => sum + it.price * it.qty, 0);
  const cartDiscount = Math.max(0, Number(discountAmount) || 0);
  const cartTotal = Math.max(0, cartSubtotal - cartDiscount);

  const cashReceivedNum = Number(cashReceived) || 0;
  const cashChange = Math.max(0, cashReceivedNum - cartTotal);

  // Submit POS Transaction
  const handleProcessSale = async (e) => {
    e.preventDefault();
    if (posCart.length === 0) {
      alert("Keranjang kasir masih kosong! Tambahkan minimal 1 produk.");
      return;
    }

    if (paymentMethod === "Tunai" && cashReceivedNum < cartTotal && cartTotal > 0) {
      alert(`Uang tunai yang diterima (Rp ${cashReceivedNum.toLocaleString("id-ID")}) kurang dari total tagihan (Rp ${cartTotal.toLocaleString("id-ID")})!`);
      return;
    }

    setIsProcessingSale(true);

    try {
      const productSummary = posCart.map((it) => `${it.qty}x ${it.name}`).join(", ");
      const serials = posCart.map((it) => it.serialNumber).filter(Boolean);

      const payload = {
        customer: customerName || "Pelanggan POS",
        phone: customerPhone || "-",
        email: customerEmail || "",
        product: productSummary,
        items: posCart.map((it) => ({
          productId: it.id,
          name: it.name,
          qty: it.qty,
          price: it.price,
        })),
        total: cartTotal,
        discountAmount: cartDiscount,
        storeId: selectedStore,
        status: "Selesai",
        kurir: `Kasir POS (${paymentMethod})`,
        paymentMethod: paymentMethod === "QRIS / Transfer" ? "QRIS Dinamis" : paymentMethod,
        resi: `POS-${Date.now().toString().slice(-6)}`,
        serialNumbers: serials,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const receiptData = {
          ...data.order,
          items: posCart,
          subtotal: cartSubtotal,
          discount: cartDiscount,
          paymentMethod,
          cashReceived: paymentMethod === "Tunai" ? cashReceivedNum : cartTotal,
          cashChange: paymentMethod === "Tunai" ? cashChange : 0,
        };

        setShowPosModal(false);
        // Reset Cart
        setPosCart([]);
        setCustomerName("Pelanggan Umum");
        setCustomerPhone("");
        setCustomerEmail("");
        setDiscountAmount(0);
        setCashReceived("");
        loadOrders();

        if (paymentMethod === "QRIS / Transfer") {
          setAdminQrisOrder({ ...data.order, receiptData });
        } else {
          setActiveReceipt(receiptData);
        }
      } else {
        alert(data.error || "Gagal memproses transaksi kasir.");
      }
    } catch (err) {
      console.error("Error POS transaction:", err);
      alert("Terjadi kesalahan saat memproses transaksi: " + err.message);
    } finally {
      setIsProcessingSale(false);
    }
  };

  const formatRupiah = (val) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val || 0);

  const getWaReceiptUrl = (rec) => {
    if (!rec) return "#";
    const text = `*NOTA PENJUALAN RESMI RAJA LAPTOP*
No. Faktur: ${rec.id}
Tanggal: ${rec.date}
Kasir: ${rec.cashier_name || "Kasir"}
Cabang: ${rec.store_name || rec.store_id || "Pekalongan"}
------------------------------------
Pelanggan: ${rec.customer} (${rec.phone || "-"})
Produk:
${rec.product}

Subtotal: ${formatRupiah(rec.total + (rec.discount_amount || 0))}
Diskon: ${formatRupiah(rec.discount_amount || 0)}
*TOTAL BAYAR: ${formatRupiah(rec.total)}*
Metode: ${rec.kurir || "POS Kasir Langsung"}
------------------------------------
Terima kasih telah berbelanja di Raja Laptop.
Garansi resmi distributor 100% Original BNIB.`;

    const phone = (rec.phone || "").replace(/[^0-9]/g, "");
    const cleanPhone = phone.startsWith("0") ? "62" + phone.slice(1) : phone;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>

      {/* Filter and Search Bar */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", flex: 1 }}>
          {["all", "Menunggu Bayar", "Perlu Dikemas", "Diproses", "Sedang Dikirim", "Selesai"].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid",
                borderColor: filter === st ? "var(--clr-primary)" : "var(--glass-border)",
                background: filter === st ? "var(--clr-primary)" : "var(--bg-surface)",
                color: filter === st ? "#fff" : "var(--text-secondary)",
                fontWeight: 600,
                fontSize: "0.8rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {st === "all" ? "Semua Status" : st}
            </button>
          ))}
        </div>

        <div style={{ minWidth: "0" }}>
          <input
            type="text"
            placeholder="🔍 Cari no. faktur, nama pembeli..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem 0.9rem",
              background: "var(--bg-card)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-contrast)",
              fontSize: "0.85rem",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Orders Table */}
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--glass-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        padding: "1rem"
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--glass-border)", color: "var(--text-secondary)" }}>
              <th style={{ padding: "0.9rem 1.25rem" }}>No. Faktur</th>
              <th style={{ padding: "0.9rem 1rem" }}>Pelanggan</th>
              <th style={{ padding: "0.9rem 1rem" }}>Produk</th>
              <th style={{ padding: "0.9rem 1rem" }}>Total Tagihan</th>
              <th style={{ padding: "0.9rem 1rem" }}>Channel / Kurir</th>
              <th style={{ padding: "0.9rem 1rem" }}>Status</th>
              <th style={{ padding: "0.9rem 1.25rem", textAlign: "right" }}>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                  Memuat pesanan dari database MySQL...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                  Tidak ada pesanan ditemukan
                </td>
              </tr>
            ) : (
              filteredOrders.map((o) => (
                <tr key={o.id} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                  <td style={{ padding: "1rem 1.25rem", fontWeight: 700, color: "var(--text-contrast)" }}>
                    <span style={{ color: "var(--clr-primary)" }}>{o.id}</span>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 400 }}>{o.date}</span>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <strong style={{ color: "var(--text-contrast)" }}>{o.customer}</strong>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)" }}>{o.phone || o.email || "-"}</span>
                  </td>
                  <td style={{ padding: "1rem", color: "var(--text-secondary)", maxWidth: "280px" }}>
                    {o.product}
                  </td>
                  <td style={{ padding: "1rem", fontWeight: 800, color: "var(--text-contrast)" }}>
                    {formatRupiah(o.total)}
                    {o.discount_amount > 0 && (
                      <span style={{ display: "block", fontSize: "0.7rem", color: "var(--clr-danger)" }}>
                        Diskon: -{formatRupiah(o.discount_amount)}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "1rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    <div style={{ fontWeight: 600, color: "var(--text-contrast)" }}>{o.kurir || "Kasir"}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "3px" }}>
                      <span style={{
                        fontSize: "0.68rem",
                        padding: "1px 6px",
                        borderRadius: "var(--radius-sm)",
                        fontWeight: 700,
                        background: o.payment_status === "PAID" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                        color: o.payment_status === "PAID" ? "var(--clr-success)" : "var(--clr-accent)",
                        border: `1px solid ${o.payment_status === "PAID" ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"}`
                      }}>
                        {o.payment_status === "PAID" ? "✓ LUNAS" : "BELUM LUNAS"}
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        {o.payment_method || "Tunai"}
                      </span>
                    </div>
                    {o.store_name && <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>📍 {o.store_name}</span>}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span style={{
                      padding: "3px 8px",
                      borderRadius: "var(--radius-full)",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      background: o.status === "Selesai" ? "hsla(145, 60%, 45%, 0.15)" : o.status === "Sedang Dikirim" ? "hsla(220, 90%, 56%, 0.15)" : "hsla(35, 100%, 55%, 0.15)",
                      color: o.status === "Selesai" ? "var(--clr-success)" : o.status === "Sedang Dikirim" ? "var(--clr-primary)" : "var(--clr-accent)"
                    }}>
                      {o.status}
                    </span>
                  </td>
                  <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end", alignItems: "center" }}>
                      {o.payment_status !== "PAID" && (
                        <button
                          onClick={() => setAdminQrisOrder(o)}
                          title="Tampilkan QRIS Dinamis Pelanggan"
                          style={{
                            background: "rgba(14, 165, 233, 0.15)",
                            border: "1px solid rgba(14, 165, 233, 0.4)",
                            color: "#38bdf8",
                            padding: "0.3rem 0.6rem",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          📱 QRIS
                        </button>
                      )}

                      <button
                        onClick={() => setActiveReceipt(o)}
                        title="Lihat / Cetak Struk"
                        style={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--glass-border)",
                          color: "var(--text-contrast)",
                          padding: "0.3rem 0.6rem",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        🖨️ Struk
                      </button>

                      <select
                        value={o.status}
                        onChange={(e) => updateStatus(o.id, e.target.value)}
                        style={{
                          padding: "0.3rem 0.6rem",
                          background: "var(--bg-card)",
                          border: "1px solid var(--glass-border)",
                          borderRadius: "var(--radius-sm)",
                          color: "var(--text-contrast)",
                          fontSize: "0.75rem",
                          outline: "none",
                        }}
                      >
                        <option value="Menunggu Bayar">Menunggu Bayar</option>
                        <option value="Perlu Dikemas">Perlu Dikemas</option>
                        <option value="Diproses">Diproses</option>
                        <option value="Sedang Dikirim">Sedang Dikirim</option>
                        <option value="Selesai">Selesai</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL: TERMINAL POS KASIR TRANSAKSI BARU ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {showPosModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          zIndex: 9999,
        }}>
          <div style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-xl)",
            width: "100%",
            maxWidth: "1150px",
            height: "92vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "var(--shadow-lg)",
          }}>
            {/* Header POS */}
            <div style={{
              padding: "1rem 1.5rem",
              background: "var(--bg-card)",
              borderBottom: "1px solid var(--glass-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.5rem" }}>🛒</span>
                <div>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-contrast)" }}>
                    Terminal Kasir POS — Raja Laptop
                  </h2>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Transaksi penjualan langsung, deduksi stok otomatis & cetak nota
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowPosModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.3rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* 2-Column POS Body */}
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.2fr 0.9fr", overflow: "hidden" }}>
              {/* Left Column: Pilih Produk Katalog */}
              <div style={{
                padding: "1.25rem",
                borderRight: "1px solid var(--glass-border)",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                overflowY: "auto",
              }}>
                {/* Hardware Barcode & Serial Scanner Bar */}
                <div style={{
                  background: isScannerActive ? "hsla(220, 90%, 56%, 0.12)" : "var(--bg-card)",
                  border: `1.5px solid ${isScannerActive ? "var(--clr-primary)" : "var(--glass-border)"}`,
                  borderRadius: "var(--radius-md)",
                  padding: "0.75rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                  transition: "all var(--t-fast)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span style={{ fontSize: "1.2rem" }}>📟</span>
                    <div>
                      <strong style={{ fontSize: "0.82rem", color: "var(--text-contrast)", display: "block" }}>
                        Hardware Barcode & Serial Scanner
                      </strong>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                        {isScannerActive
                          ? "🟢 Scanner Siap: Arahkan barcode fisik atau tekan Enter setelah scan"
                          : "Support USB / Bluetooth Laser Barcode Scanner & Kamera"}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                    <input
                      type="text"
                      placeholder="Scan Barcode / Serial..."
                      value={scannedCode}
                      onChange={(e) => setScannedCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleHardwareScan(scannedCode);
                        }
                      }}
                      onFocus={() => setIsScannerActive(true)}
                      onBlur={() => !scannedCode && setIsScannerActive(false)}
                      style={{
                        padding: "0.4rem 0.75rem",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--text-contrast)",
                        fontSize: "0.8rem",
                        width: "180px",
                        outline: "none"
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleHardwareScan(scannedCode)}
                      style={{
                        padding: "0.4rem 0.85rem",
                        background: "var(--clr-primary)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Scan Unit
                    </button>
                  </div>
                </div>

                {/* Scanner Toast Alert Notification */}
                {scannerNotification && (
                  <div style={{
                    padding: "0.55rem 0.85rem",
                    background: scannerNotification.startsWith("✓") ? "hsla(145, 60%, 45%, 0.15)" : "hsla(0, 80%, 58%, 0.15)",
                    border: `1px solid ${scannerNotification.startsWith("✓") ? "var(--clr-success)" : "var(--clr-danger)"}`,
                    color: scannerNotification.startsWith("✓") ? "var(--clr-success)" : "var(--clr-danger)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}>
                    {scannerNotification}
                  </div>
                )}

                {/* Search & Category Filter */}
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    placeholder="🔍 Cari laptop, PC, brand..."
                    value={posSearch}
                    onChange={(e) => setPosSearch(e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: "200px",
                      padding: "0.6rem 0.9rem",
                      background: "var(--bg-card)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-contrast)",
                      fontSize: "0.85rem",
                      outline: "none",
                    }}
                  />
                  <select
                    value={posCategory}
                    onChange={(e) => setPosCategory(e.target.value)}
                    style={{
                      padding: "0.6rem 0.9rem",
                      background: "var(--bg-card)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-contrast)",
                      fontSize: "0.85rem",
                      outline: "none",
                    }}
                  >
                    <option value="all">Semua Kategori</option>
                    <option value="gaming">Laptop Gaming</option>
                    <option value="kerja">Kerja & Bisnis</option>
                    <option value="ultrabook">Ultrabook Tipis</option>
                    <option value="pc">PC & Desktop</option>
                    <option value="aksesoris">Aksesoris</option>
                  </select>
                </div>

                {/* Product List */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: "0.75rem",
                  overflowY: "auto",
                  paddingRight: "4px",
                }}>
                  {loadingProducts ? (
                    <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                      Memuat katalog laptop untuk kasir...
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                      Produk tidak ditemukan
                    </div>
                  ) : (
                    filteredProducts.map((p) => {
                      const img = p.image_url || (Array.isArray(p.images) && p.images[0]) || null;
                      const isOutOfStock = p.stock <= 0;

                      return (
                        <div
                          key={p.id}
                          onClick={() => !isOutOfStock && addToPosCart(p)}
                          style={{
                            background: "var(--bg-card)",
                            border: "1px solid var(--glass-border)",
                            borderRadius: "var(--radius-md)",
                            padding: "0.75rem",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            cursor: isOutOfStock ? "not-allowed" : "pointer",
                            opacity: isOutOfStock ? 0.5 : 1,
                            transition: "all var(--t-fast)",
                          }}
                        >
                          <div>
                            <div style={{
                              width: "100%",
                              height: "90px",
                              background: "var(--bg-card-inner)",
                              borderRadius: "var(--radius-sm)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden",
                              marginBottom: "0.5rem",
                            }}>
                              {img ? (
                                <img src={img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                              ) : (
                                <span style={{ fontSize: "2.2rem" }}>{p.emoji || "💻"}</span>
                              )}
                            </div>

                            <span style={{ fontSize: "0.7rem", color: "var(--clr-primary)", fontWeight: 700 }}>
                              {p.brand}
                            </span>
                            <h4 style={{
                              fontSize: "0.82rem",
                              fontWeight: 700,
                              color: "var(--text-contrast)",
                              lineHeight: 1.3,
                              marginBottom: "0.3rem",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}>
                              {p.name}
                            </h4>
                          </div>

                          <div style={{ marginTop: "0.5rem" }}>
                            <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--clr-accent)" }}>
                              {formatRupiah(p.price)}
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                              <span style={{
                                fontSize: "0.7rem",
                                color: isOutOfStock ? "var(--clr-danger)" : "var(--clr-success)",
                                fontWeight: 700,
                              }}>
                                {isOutOfStock ? "Habis (0)" : `Stok: ${p.stock}`}
                              </span>
                              <span style={{
                                fontSize: "0.72rem",
                                background: isOutOfStock ? "transparent" : "var(--clr-primary)",
                                color: isOutOfStock ? "var(--text-muted)" : "#fff",
                                padding: "2px 8px",
                                borderRadius: "var(--radius-sm)",
                                fontWeight: 700,
                              }}>
                                {isOutOfStock ? "✕" : "+ Pilih"}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailProduct(p);
                                setDetailActiveImgIndex(0);
                              }}
                              style={{
                                width: "100%",
                                marginTop: "6px",
                                padding: "4px 8px",
                                background: "var(--bg-surface)",
                                border: "1px solid var(--glass-border)",
                                borderRadius: "var(--radius-sm)",
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                color: "var(--text-secondary)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                                transition: "all var(--t-fast)"
                              }}
                            >
                              🔍 Baca Detail Spesifikasi
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Keranjang Kasir & Pembayaran */}
              <div style={{
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                overflowY: "auto",
                background: "var(--bg-surface)",
              }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {/* Customer Information */}
                  <div style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "0.85rem",
                  }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.5rem" }}>
                      👤 INFORMASI PELANGGAN & CABANG
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                      <input
                        type="text"
                        placeholder="Nama Pembeli *"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                        style={{
                          padding: "0.45rem 0.75rem",
                          background: "var(--bg-surface)",
                          border: "1px solid var(--glass-border)",
                          borderRadius: "var(--radius-sm)",
                          color: "var(--text-contrast)",
                          fontSize: "0.8rem",
                          outline: "none",
                        }}
                      />
                      <input
                        type="tel"
                        placeholder="No. WhatsApp / HP"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        style={{
                          padding: "0.45rem 0.75rem",
                          background: "var(--bg-surface)",
                          border: "1px solid var(--glass-border)",
                          borderRadius: "var(--radius-sm)",
                          color: "var(--text-contrast)",
                          fontSize: "0.8rem",
                          outline: "none",
                        }}
                      />
                    </div>
                    <div style={{ marginTop: "0.5rem" }}>
                      <select
                        value={selectedStore}
                        onChange={(e) => setSelectedStore(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.45rem 0.75rem",
                          background: "var(--bg-surface)",
                          border: "1px solid var(--glass-border)",
                          borderRadius: "var(--radius-sm)",
                          color: "var(--text-contrast)",
                          fontSize: "0.8rem",
                          outline: "none",
                        }}
                      >
                        <option value="store-pekalongan">Toko Cabang Pekalongan (Sentral)</option>
                        <option value="store-gejayan">Toko Cabang Yogyakarta (Gejayan)</option>
                        <option value="store-semarang">Toko Cabang Semarang (Pemuda)</option>
                        <option value="store-solo">Toko Cabang Solo (Slamet Riyadi)</option>
                      </select>
                    </div>
                  </div>

                  {/* Cart Items */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-contrast)" }}>
                        Daftar Belanja ({posCart.length} Item)
                      </span>
                      {posCart.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setPosCart([])}
                          style={{ background: "none", border: "none", color: "var(--clr-danger)", fontSize: "0.75rem", cursor: "pointer" }}
                        >
                          Kosongkan Keranjang
                        </button>
                      )}
                    </div>

                    <div style={{
                      maxHeight: "180px",
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}>
                      {posCart.length === 0 ? (
                        <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem", border: "1px dashed var(--glass-border)", borderRadius: "var(--radius-md)" }}>
                          Belum ada produk dipilih. Klik produk di katalog untuk menambahkan ke kasir.
                        </div>
                      ) : (
                        posCart.map((it) => (
                          <div
                            key={it.id}
                            style={{
                              background: "var(--bg-card)",
                              border: "1px solid var(--glass-border)",
                              borderRadius: "var(--radius-sm)",
                              padding: "0.6rem 0.75rem",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0, marginRight: "0.5rem" }}>
                              <strong style={{ display: "block", fontSize: "0.82rem", color: "var(--text-contrast)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {it.name}
                              </strong>
                              <span style={{ fontSize: "0.75rem", color: "var(--clr-primary)", fontWeight: 700 }}>
                                {formatRupiah(it.price)}
                              </span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                              <button
                                type="button"
                                onClick={() => updateCartQty(it.id, -1)}
                                style={{ width: "24px", height: "24px", borderRadius: "4px", border: "1px solid var(--glass-border)", background: "var(--bg-surface)", color: "var(--text-contrast)", cursor: "pointer", fontWeight: 700 }}
                              >
                                -
                              </button>
                              <span style={{ minWidth: "20px", textAlign: "center", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-contrast)" }}>
                                {it.qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateCartQty(it.id, 1)}
                                style={{ width: "24px", height: "24px", borderRadius: "4px", border: "1px solid var(--glass-border)", background: "var(--bg-surface)", color: "var(--text-contrast)", cursor: "pointer", fontWeight: 700 }}
                              >
                                +
                              </button>
                              <button
                                type="button"
                                onClick={() => removeCartItem(it.id)}
                                style={{ background: "none", border: "none", color: "var(--clr-danger)", cursor: "pointer", fontSize: "0.9rem", marginLeft: "4px" }}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Payment Method & Discount */}
                  <div style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-md)",
                    padding: "0.85rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Diskon Kasir (Rp):</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                        style={{
                          width: "120px",
                          padding: "0.35rem 0.6rem",
                          background: "var(--bg-surface)",
                          border: "1px solid var(--glass-border)",
                          borderRadius: "var(--radius-sm)",
                          color: "var(--text-contrast)",
                          textAlign: "right",
                          fontSize: "0.8rem",
                          outline: "none",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Metode Bayar:</span>
                      <div style={{ display: "flex", gap: "0.3rem" }}>
                        {["Tunai", "QRIS / Transfer", "Debit EDC"].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setPaymentMethod(m)}
                            style={{
                              padding: "0.3rem 0.6rem",
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid",
                              borderColor: paymentMethod === m ? "var(--clr-primary)" : "var(--glass-border)",
                              background: paymentMethod === m ? "var(--clr-primary)" : "var(--bg-surface)",
                              color: paymentMethod === m ? "#fff" : "var(--text-secondary)",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    {paymentMethod === "Tunai" && (
                      <div style={{
                        marginTop: "0.3rem",
                        paddingTop: "0.5rem",
                        borderTop: "1px dashed var(--glass-border)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.4rem",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Uang Diterima:</span>
                          <input
                            type="number"
                            placeholder="Contoh: 15000000"
                            value={cashReceived}
                            onChange={(e) => setCashReceived(e.target.value)}
                            style={{
                              width: "140px",
                              padding: "0.35rem 0.6rem",
                              background: "var(--bg-surface)",
                              border: "1px solid var(--glass-border)",
                              borderRadius: "var(--radius-sm)",
                              color: "var(--text-contrast)",
                              textAlign: "right",
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              outline: "none",
                            }}
                          />
                        </div>

                        {cashReceivedNum > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "0.8rem", color: "var(--clr-success)", fontWeight: 700 }}>Kembalian:</span>
                            <span style={{ fontSize: "0.95rem", color: "var(--clr-success)", fontWeight: 800 }}>
                              {formatRupiah(cashChange)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Total & Checkout Button */}
                <div style={{
                  marginTop: "1rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid var(--glass-border)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>TOTAL PEMBAYARAN</span>
                      <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--clr-primary)" }}>
                        {formatRupiah(cartTotal)}
                      </div>
                    </div>
                    {cartDiscount > 0 && (
                      <span style={{ fontSize: "0.75rem", color: "var(--clr-danger)", fontWeight: 700 }}>
                        Hemat: {formatRupiah(cartDiscount)}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleProcessSale}
                    disabled={isProcessingSale || posCart.length === 0}
                    className="btn-primary"
                    style={{
                      width: "100%",
                      padding: "0.85rem",
                      fontSize: "1rem",
                      fontWeight: 800,
                      justifyContent: "center",
                      cursor: isProcessingSale || posCart.length === 0 ? "not-allowed" : "pointer",
                      opacity: isProcessingSale || posCart.length === 0 ? 0.6 : 1,
                    }}
                  >
                    {isProcessingSale ? "⏳ Memproses Transaksi..." : "💳 Selesaikan & Cetak Struk"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL: CETAK STRUK THERMAL NOTA PENJUALAN ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeReceipt && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          zIndex: 99999,
        }}>
          <div style={{
            background: "#fff",
            color: "#111827",
            borderRadius: "var(--radius-xl)",
            width: "100%",
            maxWidth: "620px",
            maxHeight: "92vh",
            overflowY: "auto",
            padding: "2rem 2.25rem",
            boxShadow: "0 25px 60px rgba(0,0,0,0.45)",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
            fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
          }}>
            {/* Nota Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              borderBottom: "2px solid #e5e7eb",
              paddingBottom: "1.25rem",
              gap: "1rem",
            }}>
              <div>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 900, margin: 0, letterSpacing: "0.5px", color: "#111827" }}>
                  {(settings?.storeName || "RAJA LAPTOP").toUpperCase()}
                </h2>
                <p style={{ fontSize: "0.82rem", margin: "4px 0 2px", color: "#4b5563", fontWeight: 500 }}>
                  {settings?.tagline || "Pusat Laptop & Komputer Terpercaya Jateng - DIY"}
                </p>
                <p style={{ fontSize: "0.78rem", margin: 0, color: "#6b7280" }}>
                  📞 WA: +{settings?.whatsappNumber || "6289646618000"} | ✉️ {settings?.supportEmail || "support@rajalaptop.com"}
                </p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <span style={{
                  display: "inline-block",
                  background: "#f3f4f6",
                  color: "#1f2937",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  letterSpacing: "1px",
                }}>
                  NOTA PENJUALAN
                </span>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1d4ed8", marginTop: "6px" }}>
                  #{activeReceipt.id}
                </div>
              </div>
            </div>

            {/* 2-Column Info: Faktur & Pelanggan */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.25rem",
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "var(--radius-md)",
              padding: "1rem 1.25rem",
              fontSize: "0.82rem",
              lineHeight: 1.6,
            }}>
              <div>
                <div style={{ color: "#6b7280", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                  Informasi Transaksi
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#4b5563" }}>Waktu / Tanggal:</span>
                  <strong>{activeReceipt.date}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#4b5563" }}>Kasir / Operator:</span>
                  <strong>{activeReceipt.cashier_name || "Kasir Toko"}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#4b5563" }}>Metode / Channel:</span>
                  <span style={{ fontWeight: 600, color: "#059669" }}>{activeReceipt.kurir || "POS Kasir"}</span>
                </div>
              </div>

              <div>
                <div style={{ color: "#6b7280", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                  Pelanggan (Buyer)
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#4b5563" }}>Nama:</span>
                  <strong>{activeReceipt.customer}</strong>
                </div>
                {activeReceipt.phone && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#4b5563" }}>No. Telepon/WA:</span>
                    <span>{activeReceipt.phone}</span>
                  </div>
                )}
                {activeReceipt.email && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#4b5563" }}>Email:</span>
                    <span>{activeReceipt.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Rincian Produk / Item */}
            <div style={{ border: "1px solid #e5e7eb", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
              <div style={{
                background: "#f3f4f6",
                padding: "0.6rem 1rem",
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.78rem",
                fontWeight: 800,
                color: "#374151",
                borderBottom: "1px solid #e5e7eb",
              }}>
                <span>DESKRIPSI ITEM / PRODUK</span>
                <span>SUBTOTAL</span>
              </div>
              <div style={{ padding: "0.85rem 1rem", background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#111827", lineHeight: 1.4 }}>
                    {activeReceipt.product}
                    {activeReceipt.specs && (
                      <div style={{ fontSize: "0.76rem", color: "#6b7280", fontWeight: 400, marginTop: "3px" }}>
                        {activeReceipt.specs}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#111827", whiteSpace: "nowrap" }}>
                    {formatRupiah(activeReceipt.total + (Number(activeReceipt.discount_amount) || 0))}
                  </div>
                </div>
              </div>
            </div>

            {/* Rekapitulasi Total */}
            <div style={{
              background: "#f9fafb",
              borderRadius: "var(--radius-md)",
              padding: "0.9rem 1.25rem",
              border: "1px solid #e5e7eb",
              fontSize: "0.85rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
            }}>
              {Number(activeReceipt.discount_amount) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#dc2626", fontWeight: 600 }}>
                  <span>Diskon Khusus Transaksi:</span>
                  <span>-{formatRupiah(activeReceipt.discount_amount)}</span>
                </div>
              )}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: Number(activeReceipt.discount_amount) > 0 ? "0.4rem" : "0",
                borderTop: Number(activeReceipt.discount_amount) > 0 ? "1px dashed #d1d5db" : "none",
                fontSize: "1.15rem",
                fontWeight: 900,
                color: "#111827",
              }}>
                <span>TOTAL AKHIR:</span>
                <span style={{ color: "#1d4ed8" }}>{formatRupiah(activeReceipt.total)}</span>
              </div>
            </div>

            {/* Footer Nota Garansi */}
            <div style={{
              textAlign: "center",
              fontSize: "0.74rem",
              color: "#6b7280",
              lineHeight: 1.5,
              borderTop: "1px dashed #d1d5db",
              paddingTop: "0.85rem",
            }}>
              <p style={{ margin: "2px 0" }}>
                🛡️ Barang yang sudah dibeli dijamin 100% garansi resmi sesuai masa garansi distributor.
              </p>
              <p style={{ margin: "2px 0", fontWeight: 700, color: "#374151" }}>
                Simpan nota resmi ini atau nomor faktur sebagai bukti sah klaim garansi di seluruh cabang kami.
              </p>
              <p style={{ margin: "6px 0 0", letterSpacing: "2px", fontWeight: 800, color: "#9ca3af" }}>
                *** TERIMA KASIH ATAS KUNJUNGAN ANDA ***
              </p>
            </div>

            {/* Actions Bar */}
            <div style={{
              display: "grid",
              gridTemplateColumns: activeReceipt.phone ? "1fr 1fr 100px" : "1fr 100px",
              gap: "0.75rem",
              marginTop: "0.5rem",
            }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  padding: "0.75rem 1rem",
                  background: "#111827",
                  color: "#fff",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                  transition: "background 0.15s",
                }}
              >
                🖨️ Cetak Nota (Print)
              </button>

              {activeReceipt.phone && (
                <a
                  href={getWaReceiptUrl(activeReceipt)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: "0.75rem 1rem",
                    background: "#25D366",
                    color: "#fff",
                    borderRadius: "var(--radius-md)",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                  }}
                >
                  💬 Kirim WhatsApp
                </a>
              )}

              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                style={{
                  padding: "0.75rem 1rem",
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "1px solid #d1d5db",
                  borderRadius: "var(--radius-md)",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL: QRIS DINAMIS KASIR POS ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {adminQrisOrder && (
        <QRISDynamicModal
          order={adminQrisOrder}
          onClose={() => {
            const rc = adminQrisOrder.receiptData || adminQrisOrder;
            setAdminQrisOrder(null);
            setActiveReceipt(rc);
          }}
          onSuccessPayment={(updatedOrder) => {
            const rc = {
              ...(adminQrisOrder.receiptData || adminQrisOrder),
              ...updatedOrder,
              payment_status: "PAID",
            };
            setAdminQrisOrder(null);
            setActiveReceipt(rc);
            loadOrders();
          }}
        />
      )}

      {/* Modal Detail Produk untuk Kasir */}
      {detailProduct && (() => {
        const images = Array.isArray(detailProduct.images) && detailProduct.images.length > 0
          ? detailProduct.images
          : (typeof detailProduct.images === "string" && detailProduct.images.startsWith("[")
            ? (() => { try { return JSON.parse(detailProduct.images); } catch { return []; } })()
            : (detailProduct.image_url ? [detailProduct.image_url] : []));
        const currentImg = images[detailActiveImgIndex] || detailProduct.image_url || null;
        const isOutOfStock = detailProduct.stock <= 0;

        return (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
              zIndex: 10001,
            }}
            onClick={() => setDetailProduct(null)}
          >
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-xl)",
                width: "100%",
                maxWidth: "680px",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "var(--shadow-lg)",
                display: "flex",
                flexDirection: "column",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{
                padding: "1.2rem 1.5rem",
                borderBottom: "1px solid var(--glass-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--bg-card)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.25rem" }}>🔍</span>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-contrast)" }}>
                      Detail Produk & Spesifikasi (POS Kasir)
                    </h3>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      Informasi lengkap untuk panduan kasir & penjelasan ke pelanggan
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDetailProduct(null)}
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--glass-border)",
                    color: "var(--text-muted)",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "1rem"
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Photos Gallery */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center" }}>
                  <div style={{
                    width: "100%",
                    maxHeight: "260px",
                    height: "230px",
                    background: "var(--bg-card-inner)",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--glass-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    position: "relative"
                  }}>
                    {currentImg ? (
                      <img
                        src={currentImg}
                        alt={detailProduct.name}
                        style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    ) : (
                      <span style={{ fontSize: "4.5rem" }}>{detailProduct.emoji || "💻"}</span>
                    )}
                    {images.length > 1 && (
                      <span style={{
                        position: "absolute",
                        bottom: "8px",
                        right: "8px",
                        background: "rgba(0,0,0,0.7)",
                        color: "#fff",
                        padding: "2px 8px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.72rem",
                        fontWeight: 700
                      }}>
                        Foto {detailActiveImgIndex + 1} dari {images.length}
                      </span>
                    )}
                  </div>

                  {/* Thumbnail Strip */}
                  {images.length > 1 && (
                    <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", width: "100%", paddingBottom: "4px" }}>
                      {images.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setDetailActiveImgIndex(idx)}
                          style={{
                            width: "60px",
                            height: "50px",
                            borderRadius: "var(--radius-sm)",
                            border: detailActiveImgIndex === idx ? "2px solid var(--clr-primary)" : "1px solid var(--glass-border)",
                            padding: "2px",
                            background: "var(--bg-card)",
                            cursor: "pointer",
                            flexShrink: 0,
                            overflow: "hidden"
                          }}
                        >
                          <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "2px" }} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Header Info */}
                <div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                    <span style={{
                      background: "hsla(220, 90%, 56%, 0.15)",
                      color: "var(--clr-primary)",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      textTransform: "uppercase"
                    }}>
                      {detailProduct.brand}
                    </span>
                    <span style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--glass-border)",
                      color: "var(--text-secondary)",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.75rem",
                      textTransform: "capitalize"
                    }}>
                      Kategori: {detailProduct.category}
                    </span>
                    <span style={{
                      background: isOutOfStock ? "hsla(0, 80%, 58%, 0.15)" : "hsla(142, 70%, 45%, 0.15)",
                      color: isOutOfStock ? "var(--clr-danger)" : "var(--clr-success)",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.75rem",
                      fontWeight: 700
                    }}>
                      {isOutOfStock ? "Stok Habis" : `Tersedia: ${detailProduct.stock} unit`}
                    </span>
                  </div>

                  <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-contrast)", lineHeight: 1.3 }}>
                    {detailProduct.name}
                  </h2>

                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--clr-accent)" }}>
                      {formatRupiah(detailProduct.price)}
                    </span>
                    {detailProduct.discount > 0 && (
                      <>
                        <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", textDecoration: "line-through" }}>
                          {formatRupiah(Math.round(detailProduct.price / (1 - detailProduct.discount / 100)))}
                        </span>
                        <span style={{
                          background: "hsla(0, 80%, 58%, 0.15)",
                          color: "var(--clr-danger)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontWeight: 800,
                          fontSize: "0.75rem"
                        }}>
                          Diskon {detailProduct.discount}%
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Specification Details Box */}
                <div style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.6rem"
                }}>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-contrast)", borderBottom: "1px solid var(--glass-border)", paddingBottom: "0.4rem" }}>
                    📋 Rincian Spesifikasi Teknis
                  </h4>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {detailProduct.specs || "Belum ada detail spesifikasi spesifik untuk produk ini."}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: "1rem 1.5rem",
                background: "var(--bg-card)",
                borderTop: "1px solid var(--glass-border)",
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem"
              }}>
                <button
                  type="button"
                  onClick={() => setDetailProduct(null)}
                  style={{
                    padding: "0.65rem 1.25rem",
                    background: "transparent",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-secondary)",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer"
                  }}
                >
                  Tutup
                </button>
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => {
                    addToPosCart(detailProduct);
                    setDetailProduct(null);
                  }}
                  style={{
                    padding: "0.65rem 1.5rem",
                    background: isOutOfStock ? "var(--bg-card)" : "var(--clr-primary)",
                    border: "none",
                    borderRadius: "var(--radius-md)",
                    color: isOutOfStock ? "var(--text-muted)" : "#fff",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: isOutOfStock ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                >
                  🛒 + Masukkan ke Keranjang Kasir
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
