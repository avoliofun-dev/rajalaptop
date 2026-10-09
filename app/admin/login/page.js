"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/app/components/ThemeToggle";
import styles from "../../login/auth.module.css";

export default function AdminAuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // State Step 2: Verifikasi OTP WhatsApp
  const [step, setStep] = useState(1); // 1 = Login credentials, 2 = Verify OTP
  const [sessionToken, setSessionToken] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [directWaLink, setDirectWaLink] = useState(null);
  const [helperOtpCode, setHelperOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    fetch("/api/auth/admin/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.admin) router.replace("/admin/dashboard");
      })
      .catch(() => {});
  }, [router]);

  // Timer countdown untuk kirim ulang OTP
  useEffect(() => {
    let timer = null;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Harap isi email dan kata sandi.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal masuk.");
        setLoading(false);
        return;
      }

      if (data.requireOtp) {
        setSessionToken(data.sessionToken);
        setMaskedPhone(data.phone || "WhatsApp Anda");
        setDirectWaLink(data.directWaLink || null);
        if (data.debugOtpCode) setHelperOtpCode(data.debugOtpCode);
        setStep(2);
        setSuccessMsg(data.message || "Kode OTP 6-digit telah dikirim ke nomor WhatsApp Anda.");
        setResendCooldown(45); // Cooldown 45 detik
        setLoading(false);
        return;
      }

      // Fallback jika direct session
      window.dispatchEvent(new Event("authStateChange"));
      router.push("/admin/dashboard");
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setError("Masukkan 6 digit kode OTP WhatsApp yang valid.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/admin/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          otp: otpCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Kode OTP tidak valid.");
        setLoading(false);
        return;
      }

      setSuccessMsg("✓ Verifikasi OTP berhasil! Mengalihkan ke Dashboard...");
      window.dispatchEvent(new Event("authStateChange"));
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 700);
    } catch {
      setError("Gagal memverifikasi kode OTP. Silakan periksa koneksi Anda.");
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/admin/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          action: "RESEND",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal mengirim ulang OTP.");
        setLoading(false);
        return;
      }
      setSuccessMsg("✓ Kode OTP baru telah dikirimkan ulang ke WhatsApp Anda.");
      if (data.directWaLink) setDirectWaLink(data.directWaLink);
      if (data.debugOtpCode) setHelperOtpCode(data.debugOtpCode);
      setResendCooldown(45);
    } catch {
      setError("Terjadi kesalahan saat meminta kode baru.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div
        className={styles.bannerSide}
        style={{ backgroundImage: `url('/images/admin-banner.jpg')` }}
      >
        <div className={styles.bannerOverlay} />

        <div className={styles.bannerContent}>
          <div className={styles.bannerTop}>
            <Link href="/" className={styles.bannerBrand}>
              <span>👑</span>
              <span>Raja<span style={{ color: "var(--clr-primary)" }}>Admin</span></span>
            </Link>
            <span
              className={styles.brandBadge}
              style={{ background: "rgba(168, 85, 247, 0.25)", borderColor: "#a855f7" }}
            >
              Staff & Engineer Portal
            </span>
          </div>

          <div className={styles.bannerMiddle}>
            <h2 className={styles.bannerTitle}>
              Pusat Kendali & <br />
              <span
                className={styles.bannerTitleHighlight}
                style={{
                  background: "linear-gradient(90deg, #a855f7, #60a5fa, #38bdf8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Manajemen Sistem
              </span>
            </h2>
            <p className={styles.bannerDesc}>
              Akses terenkripsi khusus staf internal RajaLaptop: inventaris stok barang, antrian tiket teknisi, pemrosesan order, dan konfigurasi toko.
            </p>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>🛡️</span>
                <div>
                  <strong>Role-Based Access Control</strong>
                  <div style={{ fontSize: "0.76rem", opacity: 0.85 }}>
                    Super Admin, Inventory Manager, Sales/CS, dan Teknisi Hardware
                  </div>
                </div>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>🔒</span>
                <div>
                  <strong>Autentikasi Terpisah dari Customer</strong>
                  <div style={{ fontSize: "0.76rem", opacity: 0.85 }}>
                    Session admin tidak dapat dipakai di portal pelanggan
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.bannerBottom}>
            <div>Internal Corporate Gateway</div>
            <div>v2.4 LTS</div>
          </div>
        </div>
      </div>

      <div className={styles.formSide}>
        <div className={styles.formTopBar}>
          <Link href="/" className={styles.backHomeLink}>
            <span>←</span> Website Utama
          </Link>
          <ThemeToggle />
        </div>

        <div className={styles.formCard}>
          <div className={styles.formHeader} style={{ marginBottom: "0.85rem" }}>
            <span className={`${styles.portalBadge} ${styles.portalBadgeAdmin}`}>
              Portal Internal Staf & Admin
            </span>
            <h1 className={styles.formTitle}>Masuk ke Panel Admin</h1>
            <p className={styles.formSubtitle}>
              Silakan masuk dengan akun staf yang terdaftar di sistem.
            </p>
          </div>

          {error && (
            <div className={styles.alertError} style={{ padding: "0.55rem 0.85rem", marginBottom: "0.75rem" }}>
              <span>⚠️</span>
              <div>{error}</div>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                color: "#10b981",
                padding: "0.6rem 0.85rem",
                borderRadius: "var(--radius-md)",
                fontSize: "0.82rem",
                marginBottom: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span>💬</span>
              <div>{successMsg}</div>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleLogin}>
              <div className={styles.formGroup} style={{ marginBottom: "0.55rem" }}>
                <label className={styles.label}>Email Staf</label>
                <div className={styles.inputWrapper}>
                  <input
                    type="email"
                    placeholder="admin@rajalaptop.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.input}
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className={styles.formGroup} style={{ marginBottom: "0.85rem" }}>
                <label className={styles.label}>Kata Sandi</label>
                <div className={styles.inputWrapper}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${styles.input} ${styles.inputWithIcon}`}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.togglePasswordBtn}
                    aria-label={showPassword ? "Sembunyikan sandi" : "Lihat sandi"}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={styles.submitBtn}
                style={{ padding: "0.7rem 1rem" }}
              >
                {loading ? "Memvalidasi Akun..." : "Lanjut Verifikasi OTP WhatsApp →"}
              </button>
            </form>
          ) : (
            /* STEP 2: VERIFIKASI OTP WHATSAPP */
            <form onSubmit={handleVerifyOtp}>
              <div
                style={{
                  background: "rgba(37, 211, 102, 0.08)",
                  border: "1px solid rgba(37, 211, 102, 0.3)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.85rem 1rem",
                  marginBottom: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "1.2rem" }}>🟢</span>
                  <strong style={{ fontSize: "0.88rem", color: "var(--text-contrast)" }}>
                    WhatsApp Security Guard Active
                  </strong>
                </div>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  Kode verifikasi 6 digit telah dikirimkan ke nomor WhatsApp <strong>{maskedPhone}</strong>.
                </p>

                {helperOtpCode && (
                  <div
                    style={{
                      marginTop: "0.6rem",
                      background: "rgba(0, 0, 0, 0.25)",
                      border: "1px dashed rgba(37, 211, 102, 0.5)",
                      borderRadius: "var(--radius-sm)",
                      padding: "0.5rem 0.75rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.5rem",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Kode OTP Terkirim: </span>
                      <strong style={{ fontSize: "0.95rem", color: "#10b981", letterSpacing: "1px" }}>{helperOtpCode}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOtpCode(helperOtpCode)}
                      style={{
                        background: "rgba(16, 185, 129, 0.2)",
                        border: "1px solid #10b981",
                        color: "#10b981",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Tempel Otomatis
                    </button>
                  </div>
                )}

                {directWaLink && (
                  <div style={{ marginTop: "0.6rem" }}>
                    <a
                      href={directWaLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.75rem",
                        color: "#25D366",
                        fontWeight: 700,
                        textDecoration: "underline",
                      }}
                    >
                      <span>💬</span> Buka WhatsApp & Salin Kode
                    </a>
                  </div>
                )}
              </div>

              <div className={styles.formGroup} style={{ marginBottom: "1rem" }}>
                <label className={styles.label} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Masukkan 6-Digit Kode OTP</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--clr-primary)", fontWeight: 700 }}>
                    Berlaku 5 Menit
                  </span>
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="Contoh: 849201"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                    className={styles.input}
                    style={{
                      textAlign: "center",
                      letterSpacing: "0.35em",
                      fontSize: "1.3rem",
                      fontWeight: 800,
                    }}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className={styles.submitBtn}
                style={{
                  padding: "0.75rem 1rem",
                  background: otpCode.length === 6 ? "linear-gradient(135deg, #10b981, #059669)" : undefined,
                  borderColor: otpCode.length === 6 ? "#10b981" : undefined,
                }}
              >
                {loading ? "Memverifikasi Kode OTP..." : "✓ Konfirmasi & Masuk Panel Dashboard"}
              </button>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "1rem",
                  fontSize: "0.78rem",
                }}
              >
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading || resendCooldown > 0}
                  style={{
                    background: "none",
                    border: "none",
                    color: resendCooldown > 0 ? "var(--text-muted)" : "var(--clr-primary)",
                    cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    padding: 0,
                  }}
                >
                  {resendCooldown > 0 ? `Kirim ulang OTP (${resendCooldown}s)` : "🔄 Kirim Ulang OTP WA"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtpCode("");
                    setError("");
                    setSuccessMsg("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    textDecoration: "underline",
                    padding: 0,
                  }}
                >
                  Ganti Akun / Sandi
                </button>
              </div>
            </form>
          )}
        </div>

        <div className={styles.formFooter}>
          Panel Administrasi Resmi RajaLaptop
        </div>
      </div>
    </div>
  );
}
