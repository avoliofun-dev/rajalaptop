"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Footer from "@/app/components/Footer";
import FloatWA from "@/app/components/FloatWA";
import Toast from "@/app/components/Toast";
import QRISDynamicModal from "@/app/components/QRISDynamicModal";
import { useSettings } from "@/app/context/SettingsContext";
import styles from "./Cart.module.css";

export default function CartPage() {
  const { settings } = useSettings();
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [deliveryType, setDeliveryType] = useState("delivery"); // 'delivery' | 'pickup'
  const [selectedBranch, setSelectedBranch] = useState("Yogyakarta (Gejayan)");
  const [selectedPayment, setSelectedPayment] = useState("qris");

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [courier, setCourier] = useState("J&T Express (Gratis Ongkir)");

  // Voucher
  const [voucherCode, setVoucherCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [voucherApplied, setVoucherApplied] = useState(false);

  // Order & Payment state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [pendingQrisOrder, setPendingQrisOrder] = useState(null);

  // Check customer login status
  useEffect(() => {
    let ignore = false;
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/customer/me");
        if (res.ok) {
          const data = await res.json();
          if (!ignore && data.user) {
            setCurrentUser(data.user);
            setName(data.user.name || "");
            setPhone(data.user.phone || "");
            setEmail(data.user.email || "");
            setAddress(data.user.address || "");

            // Load saved cart from localStorage for logged in user
            try {
              const saved = JSON.parse(localStorage.getItem("rajalaptop_cart") || "[]");
              setItems(saved);
              const totalQty = saved.reduce((sum, item) => sum + (item.qty || 1), 0);
              window.dispatchEvent(new CustomEvent("cartUpdate", { detail: totalQty }));
            } catch {
              setItems([]);
            }
            return;
          }
        }
        if (!ignore) {
          setCurrentUser(null);
          setItems([]);
          window.dispatchEvent(new CustomEvent("cartUpdate", { detail: 0 }));
        }
      } catch {
        if (!ignore) {
          setCurrentUser(null);
          setItems([]);
          window.dispatchEvent(new CustomEvent("cartUpdate", { detail: 0 }));
        }
      } finally {
        if (!ignore) setAuthLoading(false);
      }
    }

    checkAuth();
    return () => {
      ignore = true;
    };
  }, []);

  // Sync cart counter and save to localStorage when items change (for logged in user)
  useEffect(() => {
    if (!currentUser) return;
    const totalQty = items.reduce((sum, item) => sum + (item.qty || 1), 0);
    window.dispatchEvent(new CustomEvent("cartUpdate", { detail: totalQty }));
    try {
      localStorage.setItem("rajalaptop_cart", JSON.stringify(items));
    } catch {}
  }, [items, currentUser]);

  const updateQty = (id, delta) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = (item.qty || 1) + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    window.dispatchEvent(
      new CustomEvent("showToast", {
        detail: "🗑️ Produk dihapus dari keranjang",
      })
    );
  };

  const applyVoucher = () => {
    const code = voucherCode.trim().toUpperCase();
    if (code === "HEMAT500K" || code === "RAJALAPTOP") {
      setDiscountAmount(500000);
      setVoucherApplied(true);
      window.dispatchEvent(
        new CustomEvent("showToast", {
          detail: "🎉 Voucher HEMAT500K berhasil digunakan! Diskon Rp 500.000",
        })
      );
    } else {
      window.dispatchEvent(
        new CustomEvent("showToast", {
          detail: "⚠️ Kode voucher tidak valid atau sudah kedaluwarsa.",
        })
      );
    }
  };

  const formatMoney = (val) => {
    if (val === undefined || val === null || val === "") return "Rp 0";
    if (typeof val === "string" && val.trim().startsWith("Rp")) return val;
    const num = Number(String(val).replace(/[^0-9.-]+/g, ""));
    if (isNaN(num)) return typeof val === "string" ? val : "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * (item.qty || 1), 0);
  const total = Math.max(0, subtotal - discountAmount);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      window.dispatchEvent(
        new CustomEvent("showToast", {
          detail: "Silakan masuk ke akun Anda terlebih dahulu!",
        })
      );
      return;
    }

    if (items.length === 0) {
      window.dispatchEvent(
        new CustomEvent("showToast", {
          detail: "Keranjang belanja Anda masih kosong!",
        })
      );
      return;
    }

    if (!name || !phone) {
      window.dispatchEvent(
        new CustomEvent("showToast", {
          detail: "Silakan lengkapi Nama dan No. WhatsApp!",
        })
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const productSummary = items
        .map((it) => `${it.qty || 1}x ${it.name} (${it.package || "Standar"})`)
        .join(", ");

      const kurirInfo =
        deliveryType === "pickup"
          ? `Ambil di Toko (${selectedBranch})`
          : courier;

      const paymentMethodMap = {
        qris: "QRIS Dinamis",
        bca_va: "BCA Virtual Account",
        mandiri_va: "Mandiri Virtual Account",
        cod: "Bayar di Tempat (COD / Di Toko)",
      };
      const chosenMethodLabel = paymentMethodMap[selectedPayment] || "QRIS Dinamis";

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: name,
          phone: phone,
          email: email || currentUser.email || "customer@gmail.com",
          product: productSummary,
          items: items.map((it) => ({
            productId: it.productId || it.id,
            name: it.name,
            qty: it.qty || 1,
            price: it.price,
          })),
          total: total,
          paymentMethod: chosenMethodLabel,
          status: "Menunggu Pembayaran",
          kurir: kurirInfo,
          resi: "-",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setItems([]);
        try {
          localStorage.removeItem("rajalaptop_cart");
        } catch {}
        window.dispatchEvent(new CustomEvent("cartUpdate", { detail: 0 }));

        if (selectedPayment === "qris") {
          setPendingQrisOrder(data.order);
          setShowQrisModal(true);
        } else {
          setSuccessOrder(data.order);
        }
      } else {
        throw new Error(data.error || "Gagal membuat pesanan");
      }
    } catch (err) {
      window.dispatchEvent(
        new CustomEvent("showToast", {
          detail: "Terjadi kesalahan saat memproses pesanan: " + err.message,
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWaConfirmationUrl = () => {
    if (!successOrder) return "#";
    
    // Ambil nomor WA admin dari settings database (fallback jika kosong)
    let rawWa = settings?.whatsappNumber || "6289646618000";
    let targetWa = rawWa.replace(/[^0-9]/g, "");
    if (targetWa.startsWith("0")) {
      targetWa = "62" + targetWa.slice(1);
    } else if (!targetWa.startsWith("62")) {
      targetWa = "62" + targetWa;
    }

    const isPaid = successOrder.payment_status === "PAID";
    const statusNote = isPaid 
      ? "✅ *STATUS PEMBAYARAN:* LUNAS (QRIS / Terverifikasi)"
      : "⏳ *STATUS PEMBAYARAN:* Menunggu Konfirmasi / Transfer";

    const msg = `Halo Admin ${settings?.storeName || "RajaLaptop"}, saya ingin konfirmasi pesanan:
- *No. Faktur:* ${successOrder.id}
- *Nama Pelanggan:* ${successOrder.customer}
- *No. Telepon / WA:* ${successOrder.phone}
- *Produk:* ${successOrder.product}
- *Metode / Kurir:* ${successOrder.payment_method || successOrder.kurir}
- *Total Tagihan:* ${formatMoney(successOrder.total)}
${statusNote}
${successOrder.payment_ref ? `- *Ref Transaksi:* ${successOrder.payment_ref}\n` : ""}
Mohon segera diproses untuk pengiriman. Terima kasih!`;

    return `https://wa.me/${targetWa}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <>
      <main className={styles.container}>
        <div className={styles.titleRow}>
          <h1 className={styles.pageTitle}>
            <span>🛒</span> Keranjang & Checkout
          </h1>
          <Link href="/produk" style={{ color: "var(--clr-primary)", fontSize: "0.9rem", textDecoration: "none" }}>
            ← Lanjut Belanja
          </Link>
        </div>

        {authLoading ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--text-muted)" }}>
            <p>Memeriksa status akun...</p>
          </div>
        ) : !currentUser ? (
          /* Keranjang Kosong saat customer belum login */
          <div
            style={{
              textAlign: "center",
              padding: "4rem 1.5rem",
              background: "var(--bg-surface)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--glass-border)",
              maxWidth: "580px",
              margin: "2rem auto",
            }}
          >
            <div style={{ fontSize: "4.5rem", marginBottom: "1rem" }}>🛒</div>
            <h2 style={{ color: "var(--text-contrast)", marginBottom: "0.5rem", fontSize: "1.4rem", fontWeight: "800" }}>
              Keranjang Kosong
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.75rem", fontSize: "0.9rem", lineHeight: "1.5" }}>
              Anda belum masuk ke akun pelanggan. Silakan masuk terlebih dahulu untuk melihat produk di keranjang dan melanjutkan pemesanan.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/login?next=/cart"
                style={{
                  background: "var(--clr-primary)",
                  color: "#fff",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "var(--radius-md)",
                  textDecoration: "none",
                  fontWeight: "700",
                  fontSize: "0.9rem",
                }}
              >
                🔑 Masuk Akun
              </Link>
              <Link
                href="/register?next=/cart"
                style={{
                  background: "transparent",
                  border: "1px solid var(--glass-border)",
                  color: "var(--text-primary)",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "var(--radius-md)",
                  textDecoration: "none",
                  fontWeight: "700",
                  fontSize: "0.9rem",
                }}
              >
                📝 Daftar Akun Baru
              </Link>
            </div>
          </div>
        ) : items.length === 0 && !successOrder ? (
          /* Keranjang Kosong saat user login tapi belum ada produk */
          <div
            style={{
              textAlign: "center",
              padding: "4rem 1rem",
              background: "var(--bg-surface)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--glass-border)",
            }}
          >
            <div style={{ fontSize: "4.5rem", marginBottom: "1rem" }}>🛒</div>
            <h2 style={{ color: "var(--text-contrast)", marginBottom: "0.5rem" }}>
              Keranjang Belanja Anda Kosong
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.75rem" }}>
              Temukan laptop impian, PC rakitan, dan aksesoris terbaik sekarang juga.
            </p>
            <Link
              href="/produk"
              style={{
                background: "var(--clr-primary)",
                color: "#fff",
                padding: "0.75rem 1.5rem",
                borderRadius: "var(--radius-md)",
                textDecoration: "none",
                fontWeight: "700",
                display: "inline-block",
              }}
            >
              Lihat Katalog Produk
            </Link>
          </div>
        ) : (
          <div className={styles.cartGrid}>
            {/* Left: Items + Delivery + Payment */}
            <div>
              {/* Items Card */}
              <div className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>
                  <span>📦</span> Daftar Produk ({items.reduce((s, i) => s + (i.qty || 1), 0)} item)
                </h2>

                <div className={styles.itemsList}>
                  {items.map((item) => (
                    <div key={item.id} className={styles.itemCard}>
                      <div className={styles.itemPreview}>{item.emoji || "💻"}</div>
                      <div className={styles.itemInfo}>
                        <div className={styles.itemName}>{item.name}</div>
                        <div className={styles.itemPackage}>
                          <span>Paket:</span> {item.package || "Unit Standar"}
                        </div>
                        <div className={styles.itemPrice}>
                          {formatMoney(item.price)}
                        </div>
                      </div>

                      <div className={styles.itemActions}>
                        <div className={styles.qtyBox}>
                          <button
                            type="button"
                            className={styles.qtyBtn}
                            onClick={() => updateQty(item.id, -1)}
                            disabled={item.qty <= 1}
                            title="Kurangi kuantitas"
                          >
                            -
                          </button>
                          <span className={styles.qtyNum}>{item.qty || 1}</span>
                          <button
                            type="button"
                            className={styles.qtyBtn}
                            onClick={() => updateQty(item.id, 1)}
                            title="Tambah kuantitas"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          onClick={() => removeItem(item.id)}
                          title="Hapus dari keranjang"
                        >
                          ✕ Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Choice & Recipient Information */}
              <div className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>
                  <span>🚚</span> Metode Pengambilan & Pengiriman
                </h2>

                <div className={styles.radioGroup}>
                  <label
                    className={`${styles.radioCard} ${
                      deliveryType === "delivery" ? styles.selected : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryType"
                      value="delivery"
                      checked={deliveryType === "delivery"}
                      onChange={() => setDeliveryType("delivery")}
                    />
                    <div>
                      <div className={styles.radioLabel}>
                        <span>📦</span> Kirim ke Alamat (Ekspedisi)
                      </div>
                      <div className={styles.radioSub}>
                        Packing kayu ekstra aman & proteksi garansi pengiriman resmi
                      </div>
                    </div>
                  </label>

                  <label
                    className={`${styles.radioCard} ${
                      deliveryType === "pickup" ? styles.selected : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryType"
                      value="pickup"
                      checked={deliveryType === "pickup"}
                      onChange={() => setDeliveryType("pickup")}
                    />
                    <div>
                      <div className={styles.radioLabel}>
                        <span>🏬</span> Ambil di Toko Cabang (Pickup)
                      </div>
                      <div className={styles.radioSub}>
                        Bebas antre, unboxing & free cek fisik/performa langsung di toko
                      </div>
                    </div>
                  </label>
                </div>

                {deliveryType === "pickup" ? (
                  <div style={{ marginTop: "1rem" }}>
                    <label className={styles.inputLabel}>
                      🏢 Pilih Cabang Toko untuk Pengambilan:
                    </label>
                    <div className={styles.optionsGrid}>
                      {[
                        {
                          id: "Yogyakarta (Gejayan)",
                          name: "Cabang Yogyakarta (Pusat)",
                          address: "Jl. Afandi (Gejayan) No. 28, Sleman, D.I. Yogyakarta",
                          hours: "Buka Setiap Hari: 09:00 - 21:00 WIB",
                        },
                        {
                          id: "Solo (Slamet Riyadi)",
                          name: "Cabang Solo",
                          address: "Jl. Slamet Riyadi No. 142, Laweyan, Surakarta",
                          hours: "Buka Setiap Hari: 09:00 - 21:00 WIB",
                        },
                        {
                          id: "Semarang (Simpang Lima)",
                          name: "Cabang Semarang",
                          address: "Kawasan Komersial Simpang Lima, Semarang Tengah",
                          hours: "Buka Setiap Hari: 09:30 - 21:00 WIB",
                        },
                        {
                          id: "Purwokerto (HR Bunyamin)",
                          name: "Cabang Purwokerto",
                          address: "Jl. HR Bunyamin No. 56, Grendeng, Purwokerto Utara",
                          hours: "Buka Setiap Hari: 09:00 - 20:30 WIB",
                        },
                      ].map((branch) => {
                        const isSelected = selectedBranch === branch.id;
                        return (
                          <div
                            key={branch.id}
                            className={`${styles.selectOptionCard} ${
                              isSelected ? styles.activeOption : ""
                            }`}
                            onClick={() => setSelectedBranch(branch.id)}
                          >
                            <div className={styles.optionMain}>
                              <div className={styles.optionTitle}>
                                <span>📍</span> {branch.name}
                              </div>
                              <div className={styles.optionDetail}>{branch.address}</div>
                              <div style={{ fontSize: "0.75rem", color: "var(--clr-primary)", marginTop: "2px" }}>
                                🕒 {branch.hours}
                              </div>
                            </div>
                            <div>
                              <span className={styles.optionBadge}>Siap Diambil</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: "1rem" }}>
                    <label className={styles.inputLabel}>
                      🚀 Pilih Layanan Ekspedisi Pengiriman:
                    </label>
                    <div className={styles.optionsGrid}>
                      {[
                        {
                          id: "J&T Express (Gratis Ongkir)",
                          name: "J&T Express – Reguler / Promo",
                          est: "Estimasi 1-2 Hari Kerja",
                          badge: "GRATIS ONGKIR",
                        },
                        {
                          id: "JNE Trucking / REG (Gratis Ongkir)",
                          name: "JNE Express (Reguler & Trucking)",
                          est: "Estimasi 2-3 Hari Kerja",
                          badge: "GRATIS ONGKIR",
                        },
                        {
                          id: "SiCepat Best (Gratis Ongkir)",
                          name: "SiCepat BEST (Besok Sampai Tujuan)",
                          est: "Estimasi 1 Hari Sampai",
                          badge: "PROMO ONGKIR",
                        },
                      ].map((item) => {
                        const isSelected = courier === item.id;
                        return (
                          <div
                            key={item.id}
                            className={`${styles.selectOptionCard} ${
                              isSelected ? styles.activeOption : ""
                            }`}
                            onClick={() => setCourier(item.id)}
                          >
                            <div className={styles.optionMain}>
                              <div className={styles.optionTitle}>
                                <span>🚚</span> {item.name}
                              </div>
                              <div className={styles.optionDetail}>
                                Packing Kayu + Bubble Wrap Tebal Berlapis Asuransi Kehilangan
                              </div>
                            </div>
                            <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end" }}>
                              <span className={styles.optionBadge}>{item.badge}</span>
                              <span className={styles.optionBadgeTime}>{item.est}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Form Data Penerima & Pemesan */}
                <div className={styles.customerFormBlock}>
                  <div className={styles.formHeader}>
                    <div className={styles.formHeaderTitle}>
                      <span>👤</span> Data Pemesan & Kontak Penerima
                    </div>
                    {currentUser && (
                      <span className={styles.formAutoFilledBadge}>
                        ✓ Terisi Otomatis dari Profil Akun
                      </span>
                    )}
                  </div>

                  <div className={styles.formRowDouble}>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>
                        Nama Lengkap <span className={styles.inputRequired}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nama lengkap penerima"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={styles.inputControl}
                      />
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>
                        Nomor WhatsApp (Aktif) <span className={styles.inputRequired}>*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Contoh: 081234567890"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={styles.inputControl}
                      />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>
                      Alamat Email (Untuk Bukti Nota / Faktur)
                    </label>
                    <input
                      type="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={styles.inputControl}
                    />
                  </div>

                  {deliveryType === "delivery" && (
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel}>
                        Alamat Lengkap Pengiriman <span className={styles.inputRequired}>*</span>
                      </label>
                      <textarea
                        required
                        rows="3"
                        placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota/kabupaten, kode pos..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className={styles.textareaControl}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>
                  <span>💳</span> Metode Pembayaran
                </h2>
                <div className={styles.radioGroup}>
                  {[
                    { id: "qris", label: "QRIS Dinamis Otomatis", desc: "Scan instan via GoPay, OVO, ShopeePay, BCA, Mandiri dll" },
                    { id: "bca_va", label: "BCA Virtual Account", desc: "Verifikasi pembayaran otomatis 24 jam" },
                    { id: "mandiri_va", label: "Mandiri Virtual Account", desc: "Cepat dan praktis melalui Livin' by Mandiri" },
                    { id: "cod", label: "Bayar di Tempat (COD / Di Toko)", desc: "Bayar tunai atau EDC saat menerima unit laptop" },
                  ].map((pay) => (
                    <label
                      key={pay.id}
                      className={`${styles.radioCard} ${
                        selectedPayment === pay.id ? styles.selected : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={pay.id}
                        checked={selectedPayment === pay.id}
                        onChange={() => setSelectedPayment(pay.id)}
                      />
                      <div>
                        <div className={styles.radioLabel}>{pay.label}</div>
                        <div className={styles.radioSub}>{pay.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary & Checkout Trigger */}
            <div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryTitle}>
                  <span>Ringkasan Pembelian</span>
                  <span className={styles.summaryItemCount}>
                    {items.reduce((s, i) => s + (i.qty || 1), 0)} Unit
                  </span>
                </div>

                {/* Voucher input block */}
                {!voucherApplied ? (
                  <div className={styles.voucherBox}>
                    <input
                      type="text"
                      placeholder="Kode Promo: HEMAT500K"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      className={styles.voucherInput}
                    />
                    <button
                      type="button"
                      onClick={applyVoucher}
                      className={styles.voucherBtn}
                    >
                      Klaim
                    </button>
                  </div>
                ) : (
                  <div className={styles.activeVoucherPill}>
                    <div>
                      <strong>🎉 KUPON AKTIF:</strong> {voucherCode.toUpperCase() || "HEMAT500K"} (-Rp 500.000)
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountAmount(0);
                        setVoucherApplied(false);
                        setVoucherCode("");
                      }}
                      className={styles.voucherRemoveBtn}
                    >
                      Hapus
                    </button>
                  </div>
                )}

                {/* Pricing Breakdown */}
                <div className={styles.summaryLines}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryRowLabel}>
                      <span>Subtotal Belanja</span>
                    </span>
                    <span className={styles.summaryRowVal}>{formatMoney(subtotal)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                      <span className={styles.summaryRowLabel}>
                        <span>Diskon Voucher</span>
                      </span>
                      <span className={styles.summaryRowVal}>-{formatMoney(discountAmount)}</span>
                    </div>
                  )}

                  <div className={styles.summaryRow}>
                    <span className={styles.summaryRowLabel}>
                      <span>Biaya Pengiriman</span>
                    </span>
                    <span className={styles.freeShippingTag}>GRATIS</span>
                  </div>

                  <div className={styles.summaryRow}>
                    <span className={styles.summaryRowLabel}>
                      <span>Packing Kayu & Asuransi</span>
                    </span>
                    <span className={styles.freeShippingTag}>GRATIS</span>
                  </div>
                </div>

                <div className={styles.totalDivider} />

                {/* Total tagihan */}
                <div className={styles.totalRow}>
                  <div>
                    <div className={styles.totalLabel}>Total Tagihan</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      Sudah termasuk PPN & perlindungan unit
                    </div>
                  </div>
                  <div className={styles.totalAmount}>{formatMoney(total)}</div>
                </div>

                {/* Submit Checkout Button */}
                <button
                  type="button"
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting || items.length === 0}
                  className={styles.checkoutBtn}
                >
                  {isSubmitting ? (
                    "Sedang Menyiapkan Faktur..."
                  ) : (
                    <>
                      <span>🔒 Konfirmasi & Bayar Sekarang</span>
                      <span>→</span>
                    </>
                  )}
                </button>

                {/* Trust Badges */}
                <div className={styles.trustBadges}>
                  <div className={styles.trustItem}>
                    <span>🛡️</span>
                    <span>Garansi uang kembali & unit resmi terjamin</span>
                  </div>
                  <div className={styles.trustItem}>
                    <span>📦</span>
                    <span>Free packing kayu & double bubble wrap</span>
                  </div>
                  <div className={styles.trustItem}>
                    <span>⚡</span>
                    <span>Proses pengiriman & verifikasi cepat di hari yang sama</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* QRIS Dynamic Modal */}
        {showQrisModal && pendingQrisOrder && (
          <QRISDynamicModal
            order={pendingQrisOrder}
            onClose={() => {
              setShowQrisModal(false);
              setSuccessOrder(pendingQrisOrder);
            }}
            onSuccessPayment={(updatedOrder) => {
              setShowQrisModal(false);
              setSuccessOrder(updatedOrder);
              window.dispatchEvent(
                new CustomEvent("showToast", {
                  detail: "🎉 Pembayaran QRIS Anda Berhasil Terverifikasi!",
                })
              );
            }}
          />
        )}

        {/* Success Modal */}
        {successOrder && (
          <div className={styles.modalOverlay} onClick={() => setSuccessOrder(null)}>
            <div className={styles.successModal} onClick={(e) => e.stopPropagation()}>
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSuccessOrder(null)}
                style={{
                  position: "absolute",
                  top: "14px",
                  right: "14px",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "none",
                  color: "var(--text-secondary, #94a3b8)",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1rem",
                  transition: "all 0.2s ease"
                }}
                title="Tutup Modal"
              >
                ✕
              </button>

              <div className={styles.successIcon}>
                {successOrder.payment_status === "PAID" ? "🎉" : "📋"}
              </div>
              <h2 className={styles.modalTitle}>
                {successOrder.payment_status === "PAID"
                  ? "Pembayaran Berhasil Dikonfirmasi!"
                  : "Pesanan Berhasil Dibuat!"}
              </h2>
              <p className={styles.modalSubtitle}>
                {successOrder.payment_status === "PAID"
                  ? "Pembayaran Anda telah sukses diverifikasi. Unit pesanan segera disiapkan oleh staf toko."
                  : "Terima kasih atas pesanan Anda. Silakan lanjutkan konfirmasi melalui WhatsApp resmi kami."}
              </p>

              <div className={styles.invoiceBox}>
                <div className={styles.invoiceRow}>
                  <span>No. Faktur:</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <strong style={{ color: "var(--clr-primary, #3b82f6)" }}>{successOrder.id}</strong>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(successOrder.id);
                        window.dispatchEvent(new CustomEvent("showToast", { detail: "✓ No. Faktur disalin!" }));
                      }}
                      style={{
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "none",
                        color: "var(--text-contrast, #fff)",
                        borderRadius: "4px",
                        padding: "1px 6px",
                        fontSize: "0.72rem",
                        cursor: "pointer"
                      }}
                      title="Salin No. Faktur"
                    >
                      Salin
                    </button>
                  </div>
                </div>

                <div className={styles.invoiceRow}>
                  <span>Total Tagihan:</span>
                  <strong style={{ color: "#10b981", fontSize: "1.1rem" }}>{formatMoney(successOrder.total)}</strong>
                </div>

                <div className={styles.invoiceRow}>
                  <span>Metode & Status:</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <strong>{successOrder.payment_method || successOrder.kurir}</strong>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      background: successOrder.payment_status === "PAID" ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)",
                      color: successOrder.payment_status === "PAID" ? "#10b981" : "#f59e0b",
                      border: `1px solid ${successOrder.payment_status === "PAID" ? "#10b981" : "#f59e0b"}`
                    }}>
                      {successOrder.payment_status === "PAID" ? "✓ LUNAS" : "MENUNGGU BAYAR"}
                    </span>
                  </span>
                </div>

                {successOrder.payment_ref && (
                  <div className={styles.invoiceRow}>
                    <span>Ref Payment:</span>
                    <code style={{ fontSize: "0.78rem", color: "var(--text-secondary, #94a3b8)" }}>{successOrder.payment_ref}</code>
                  </div>
                )}

                <div className={styles.invoiceRow}>
                  <span>Tujuan WhatsApp:</span>
                  <strong style={{ color: "#25D366" }}>
                    +{settings?.whatsappNumber || "6289646618000"}
                  </strong>
                </div>
              </div>

              <div className={styles.modalActions}>
                <a
                  href={getWaConfirmationUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.waConfirmBtn}
                >
                  <span>💬</span> Hubungi CS / WhatsApp Resmi
                </a>
                <div style={{ display: "flex", gap: "0.6rem" }}>
                  <Link
                    href="/profil"
                    className={styles.portalBtn}
                    style={{ flex: 1, textAlign: "center" }}
                  >
                    Buka Portal Pesanan
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSuccessOrder(null)}
                    className={styles.portalBtn}
                    style={{ background: "transparent", flex: "0 0 auto" }}
                  >
                    Selesai
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <FloatWA />
      <Toast />
    </>
  );
}
