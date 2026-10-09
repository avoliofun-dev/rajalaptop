"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/app/components/ThemeToggle";
import styles from "../login/auth.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    agree: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setError("Harap lengkapi semua kolom pendaftaran.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Kata sandi minimal harus 6 karakter.");
      return;
    }
    if (!formData.agree) {
      setError("Anda harus menyetujui syarat & ketentuan.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal mendaftar.");
        setLoading(false);
        return;
      }
      router.push(`/login?registered=success&email=${encodeURIComponent(formData.email)}`);
    } catch {
      setError("Tidak dapat terhubung ke server. Coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* ─── KIRI: Foto & Banner Visual (1 Bagian) ─── */}
      <div
        className={styles.bannerSide}
        style={{ backgroundImage: `url('/images/auth-banner.jpg')` }}
      >
        <div className={styles.bannerOverlay} />

        <div className={styles.bannerContent}>
          {/* Top Branding */}
          <div className={styles.bannerTop}>
            <Link href="/" className={styles.bannerBrand}>
              <span>👑</span>
              <span>Raja<span style={{ color: "var(--clr-primary)" }}>Laptop</span></span>
            </Link>
            <span className={styles.brandBadge}>Member Rewards</span>
          </div>

          {/* Middle Content */}
          <div className={styles.bannerMiddle}>
            <h2 className={styles.bannerTitle}>
              Gabung Jadi Member <br />
              <span className={styles.bannerTitleHighlight}>RajaLaptop VIP</span>
            </h2>
            <p className={styles.bannerDesc}>
              Dapatkan welcome voucher hingga Rp 100.000, 500 bonus poin belanja, dan kemudahan klaim garansi tanpa nota fisik.
            </p>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>💎</span>
                <div>
                  <strong>Bonus 500 Poin Selamat Datang</strong>
                  <div style={{ fontSize: "0.76rem", opacity: 0.85 }}>Dapat langsung ditukar diskon sparepart atau aksesoris</div>
                </div>
              </div>

              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>📜</span>
                <div>
                  <strong>E-Warranty Tanpa Kertas</strong>
                  <div style={{ fontSize: "0.76rem", opacity: 0.85 }}>Data serial number laptop Anda tersimpan aman digital</div>
                </div>
              </div>

              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>🔔</span>
                <div>
                  <strong>Notifikasi Servis Berkala</strong>
                  <div style={{ fontSize: "0.76rem", opacity: 0.85 }}>Pemberitahuan penggantian thermal paste & deep cleaning</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Badge */}
          <div className={styles.bannerBottom}>
            <div>🔒 Enkripsi Data Pelanggan Aman 256-bit</div>
            <div>Official Authorized Store</div>
          </div>
        </div>
      </div>

      {/* ─── KANAN: Form Register Customer (1 Bagian, No Scroll) ─── */}
      <div className={styles.formSide}>
        {/* Top bar controls */}
        <div className={styles.formTopBar}>
          <Link href="/" className={styles.backHomeLink}>
            <span>←</span> Beranda
          </Link>
          <ThemeToggle />
        </div>

        {/* Form Card */}
        <div className={styles.formCard}>
          <div className={styles.formHeader} style={{ marginBottom: "0.9rem" }}>
            <span className={`${styles.portalBadge} ${styles.portalBadgeCustomer}`}>
              👤 Pendaftaran Member Baru
            </span>
            <h1 className={styles.formTitle}>Buat Akun Member</h1>
            <p className={styles.formSubtitle}>
              Isi data diri untuk menikmati layanan servis & belanja terbaik.
            </p>
          </div>

          {/* Alert Error */}
          {error && (
            <div className={styles.alertError} style={{ marginBottom: "0.75rem", padding: "0.55rem 0.85rem" }}>
              <span>⚠️</span>
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup} style={{ marginBottom: "0.65rem" }}>
              <label className={styles.label}>Nama Lengkap</label>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  placeholder="Contoh: Dimas Anggara"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "0.6rem", marginBottom: "0.65rem" }}>
              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                <label className={styles.label}>Email</label>
                <div className={styles.inputWrapper}>
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={styles.input}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                <label className={styles.label}>WhatsApp / HP</label>
                <div className={styles.inputWrapper}>
                  <input
                    type="tel"
                    placeholder="08xxxxxxxxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={styles.input}
                    required
                  />
                </div>
              </div>
            </div>

            <div className={styles.formGroup} style={{ marginBottom: "0.65rem" }}>
              <label className={styles.label}>Kata Sandi Baru</label>
              <div className={styles.inputWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`${styles.input} ${styles.inputWithIcon}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.togglePasswordBtn}
                  aria-label={showPassword ? "Sembunyikan sandi" : "Lihat sandi"}
                  title={showPassword ? "Sembunyikan sandi" : "Lihat sandi"}
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

            <label style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.5rem",
              fontSize: "0.78rem",
              color: "var(--text-secondary)",
              cursor: "pointer",
              margin: "0.6rem 0"
            }}>
              <input
                type="checkbox"
                checked={formData.agree}
                onChange={(e) => setFormData({ ...formData, agree: e.target.checked })}
                style={{ marginTop: "2px" }}
              />
              <span>
                Saya menyetujui <a href="#" style={{ color: "var(--clr-primary)", fontWeight: 600 }}>Syarat & Ketentuan</a> serta Kebijakan Privasi RajaLaptop.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className={styles.submitBtn}
            >
              {loading ? "Mendaftarkan Akun..." : "Daftar Akun Member →"}
            </button>
          </form>

          <p className={styles.switchAuthLink} style={{ marginTop: "0.75rem" }}>
            Sudah punya akun?{" "}
            <Link href="/login">
              Masuk di sini
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className={styles.formFooter}>
          Setelah mendaftar, Anda akan dialihkan ke halaman login untuk masuk.
        </div>
      </div>
    </div>
  );
}
