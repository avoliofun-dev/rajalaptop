"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ThemeToggle from "@/app/components/ThemeToggle";
import styles from "./auth.module.css";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    // If admin or customer is already logged in, redirect away
    fetch("/api/auth/admin/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.admin) router.replace("/admin/dashboard");
      })
      .catch(() => {});

    fetch("/api/auth/customer/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) router.replace("/profil");
      })
      .catch(() => {});

    const registered = searchParams.get("registered");
    const registeredEmail = searchParams.get("email");
    if (registered === "success") {
      setSuccessMsg("Pendaftaran akun berhasil! Silakan masukkan kata sandi Anda untuk masuk.");
      if (registeredEmail) setEmail(registeredEmail);
    }
  }, [searchParams, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Harap isi email dan kata sandi.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/customer/login", {
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
      window.dispatchEvent(new Event("authStateChange"));
      router.push("/profil");
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div
        className={styles.bannerSide}
        style={{ backgroundImage: `url('/images/auth-banner.jpg')` }}
      >
        <div className={styles.bannerOverlay} />

        <div className={styles.bannerContent}>
          <div className={styles.bannerTop}>
            <Link href="/" className={styles.bannerBrand}>
              <span>👑</span>
              <span>Raja<span style={{ color: "var(--clr-primary)" }}>Laptop</span></span>
            </Link>
            <span className={styles.brandBadge}>Official Store</span>
          </div>

          <div className={styles.bannerMiddle}>
            <h2 className={styles.bannerTitle}>
              Pusat Laptop & Servis <br />
              <span className={styles.bannerTitleHighlight}>Terpercaya #1</span>
            </h2>
            <p className={styles.bannerDesc}>
              Akses akun member Anda untuk memantau status servis unit, klaim garansi resmi, dan tukar poin reward belanja.
            </p>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>🛡️</span>
                <div>
                  <strong>Garansi Resmi 100%</strong>
                  <div style={{ fontSize: "0.76rem", opacity: 0.85 }}>Jaminan unit original bergaransi resmi distributor</div>
                </div>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>⚡</span>
                <div>
                  <strong>Live Service Tracker</strong>
                  <div style={{ fontSize: "0.76rem", opacity: 0.85 }}>Pantau progres diagnosa & pergantian sparepart real-time</div>
                </div>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>🎁</span>
                <div>
                  <strong>Cashback & Poin Member</strong>
                  <div style={{ fontSize: "0.76rem", opacity: 0.85 }}>Kumpulkan poin setiap transaksi servis maupun pembelian</div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.bannerBottom}>
            <div>⭐ <strong>4.9 / 5.0</strong> dari 12.000+ pelanggan setia</div>
            <div>Jawa Tengah & DIY</div>
          </div>
        </div>
      </div>

      <div className={styles.formSide}>
        <div className={styles.formTopBar}>
          <Link href="/" className={styles.backHomeLink}>
            <span>←</span> Beranda
          </Link>
          <ThemeToggle />
        </div>

        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <span className={`${styles.portalBadge} ${styles.portalBadgeCustomer}`}>
              Customer Portal
            </span>
            <h1 className={styles.formTitle}>Masuk ke Akun Anda</h1>
            <p className={styles.formSubtitle}>
              Selamat datang kembali! Silakan masukkan akun member Anda.
            </p>
          </div>

          {successMsg && (
            <div className={styles.alertSuccess}>
              <span>✅</span>
              <div>{successMsg}</div>
            </div>
          )}

          {error && (
            <div className={styles.alertError}>
              <span>⚠️</span>
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Alamat Email</label>
              <div className={styles.inputWrapper}>
                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.label}>
                <span>Kata Sandi</span>
              </div>
              <div className={styles.inputWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan kata sandi"
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

            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? "Memproses Masuk..." : "Masuk Sekarang →"}
            </button>
          </form>

          <p className={styles.switchAuthLink}>
            Belum punya akun member?{" "}
            <Link href="/register">Daftar Sekarang</Link>
          </p>
        </div>

        <div className={styles.formFooter}>
          © 2026 RajaLaptop Indonesia. Hak Cipta Dilindungi.
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>Memuat...</div>}>
      <LoginForm />
    </Suspense>
  );
}
