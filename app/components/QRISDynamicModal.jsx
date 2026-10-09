"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/app/context/SettingsContext";

/**
 * QRISDynamicModal Component
 * Menampilkan Kode QRIS Dinamis Standar Bank Indonesia / ASPI
 * dengan timer kedaluwarsa 15 menit, salin invoice/payload, dan tombol simulasi pembayaran.
 */
export default function QRISDynamicModal({ order, onClose, onSuccessPayment }) {
  const { settings } = useSettings();
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 menit
  const [isSimulating, setIsSimulating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [checkStatus, setCheckStatus] = useState("IDLE"); // 'IDLE' | 'CHECKING' | 'SUCCESS'

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const formatRupiah = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // QR Code URL menggunakan API generator QR publik cepat & akurat
  const qrString = order.qris_payload || `00020101021226500014ID.CO.QRIS.WWW0118936009821${order.id}52045732530336054${order.total}5802ID5919RAJALAPTOP INDONESIA6010PEKALONGAN61055111162070703RLP6304ABCD`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrString)}&margin=10`;

  const copyPayload = () => {
    navigator.clipboard.writeText(qrString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatePayment = async () => {
    setIsSimulating(true);
    setCheckStatus("CHECKING");
    try {
      const res = await fetch("/api/payment/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          method: "QRIS Dinamis",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCheckStatus("SUCCESS");
        setTimeout(() => {
          if (onSuccessPayment) onSuccessPayment(data.order);
        }, 1200);
      } else {
        alert(data.error || "Gagal memverifikasi pembayaran");
        setCheckStatus("IDLE");
      }
    } catch (e) {
      alert("Error: " + e.message);
      setCheckStatus("IDLE");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0, 0, 0, 0.8)",
      backdropFilter: "blur(10px)",
      zIndex: 99999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
      animation: "fadeIn 0.25s ease-out"
    }}>
      <div style={{
        background: "var(--bg-surface, #1e293b)",
        border: "1px solid var(--glass-border, rgba(255,255,255,0.12))",
        borderRadius: "1.25rem",
        width: "100%",
        maxWidth: "460px",
        overflow: "hidden",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Header QRIS */}
        <div style={{
          background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
          color: "#fff",
          padding: "1.2rem 1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.3rem" }}>📱</span>
              <strong style={{ fontSize: "1.1rem", letterSpacing: "0.5px" }}>QRIS DINAMIS NASIONAL</strong>
            </div>
            <p style={{ fontSize: "0.78rem", opacity: 0.9, marginTop: "2px" }}>
              Standar Bank Indonesia • Otomatis Terverifikasi
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              color: "#fff",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              fontSize: "1.1rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "1.5rem", textAlign: "center" }}>
          {/* Order Details & Countdown */}
          <div style={{
            background: "rgba(0,0,0,0.2)",
            borderRadius: "0.75rem",
            padding: "0.75rem 1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.25rem",
            border: "1px solid var(--glass-border, rgba(255,255,255,0.08))"
          }}>
            <div style={{ textAlign: "left" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #94a3b8)", display: "block" }}>Invoice</span>
              <strong style={{ fontSize: "0.95rem", color: "var(--text-contrast, #fff)" }}>{order.id}</strong>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #94a3b8)", display: "block" }}>Sisa Waktu Bayar</span>
              <span style={{
                color: timeLeft < 120 ? "#ef4444" : "#f59e0b",
                fontWeight: 800,
                fontSize: "0.95rem"
              }}>
                ⏳ {formatTimer(timeLeft)}
              </span>
            </div>
          </div>

          {/* QR Code Container with Frame */}
          <div style={{
            background: "#fff",
            borderRadius: "1rem",
            padding: "1rem",
            display: "inline-block",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            margin: "0 auto",
            border: "2px solid #e2e8f0"
          }}>
            {/* Top Merchant Brand inside QR */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
              paddingBottom: "6px",
              borderBottom: "1px solid #f1f5f9"
            }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#1e293b", letterSpacing: "1px" }}>QRIS</span>
              <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "#64748b" }}>GPN / ASPI</span>
            </div>

            <img
              src={qrImageUrl}
              alt={`QRIS ${order.id}`}
              style={{
                width: "220px",
                height: "220px",
                display: "block",
                margin: "0 auto",
                borderRadius: "4px"
              }}
            />

            <div style={{ marginTop: "8px", fontSize: "0.75rem", fontWeight: 700, color: "#0f172a" }}>
              {settings?.storeName || "RajaLaptop"} • Merchant Resmi
            </div>
            <div style={{ fontSize: "0.65rem", color: "#64748b" }}>
              NMID: ID1026093019821
            </div>
          </div>

          {/* Tagihan Nominal */}
          <div style={{ marginTop: "1.25rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary, #94a3b8)" }}>Total Tagihan Presisi:</span>
            <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#10b981", marginTop: "2px" }}>
              {formatRupiah(order.total)}
            </div>
          </div>

          <p style={{ fontSize: "0.78rem", color: "var(--text-muted, #94a3b8)", margin: "0.75rem 0 1.25rem" }}>
            Buka aplikasi BCA Mobile, Livin Mandiri, GoPay, OVO, ShopeePay, atau DANA, lalu pilih <strong>Scan QRIS</strong>.
          </p>

          {/* Action Simulation & Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <button
              type="button"
              onClick={handleSimulatePayment}
              disabled={isSimulating || checkStatus === "SUCCESS"}
              style={{
                background: checkStatus === "SUCCESS"
                  ? "linear-gradient(135deg, #10b981, #059669)"
                  : "linear-gradient(135deg, #3b82f6, #2563eb)",
                color: "#fff",
                border: "none",
                borderRadius: "0.6rem",
                padding: "0.85rem",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: isSimulating ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
                transition: "all 0.2s ease"
              }}
            >
              {checkStatus === "CHECKING" && "⏳ Memverifikasi Pembayaran..."}
              {checkStatus === "SUCCESS" && "✅ Pembayaran Berhasil Dikonfirmasi!"}
              {checkStatus === "IDLE" && "⚡ Simulasi Sukses Bayar (Auto Callback)"}
            </button>

            <button
              type="button"
              onClick={copyPayload}
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid var(--glass-border, rgba(255,255,255,0.12))",
                color: "var(--text-contrast, #fff)",
                borderRadius: "0.6rem",
                padding: "0.6rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {copied ? "✓ String QRIS Berhasil Disalin!" : "📋 Salin String Payload QRIS"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
