"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./Profil.module.css";

export default function ProfilCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    tier: "Member",
    points: 0,
    created_at: null,
  });

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Password Form State
  const [passForm, setPassForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passSaving, setPassSaving] = useState(false);
  const [passSuccess, setPassSuccess] = useState("");
  const [passError, setPassError] = useState("");

  // Fetch customer profile
  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      try {
        const res = await fetch("/api/auth/customer/me");
        if (!res.ok) {
          router.replace("/login?next=/profil");
          return;
        }
        const data = await res.json();
        if (!cancelled && data.user) {
          setUser(data.user);
          setProfileForm({
            name: data.user.name || "",
            phone: data.user.phone || "",
            address: data.user.address || "",
          });
        }
      } catch {
        router.replace("/login?next=/profil");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Handle Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess("");
    setProfileError("");

    try {
      const res = await fetch("/api/auth/customer/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileForm.name,
          phone: profileForm.phone,
          address: profileForm.address,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui profil.");
      }

      setUser((prev) => ({
        ...prev,
        ...data.user,
      }));
      setProfileSuccess("Profil akun Anda berhasil diperbarui!");
      window.dispatchEvent(new Event("authStateChange"));
      window.dispatchEvent(
        new CustomEvent("showToast", { detail: "✅ Profil akun berhasil disimpan." })
      );
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Password Update
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPassSaving(true);
    setPassSuccess("");
    setPassError("");

    if (passForm.newPassword !== passForm.confirmPassword) {
      setPassError("Konfirmasi password baru tidak cocok.");
      setPassSaving(false);
      return;
    }

    if (passForm.newPassword.length < 6) {
      setPassError("Password baru harus minimal 6 karakter.");
      setPassSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/customer/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passForm.currentPassword,
          newPassword: passForm.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengubah password.");
      }

      setPassSuccess("Password akun Anda berhasil diperbarui.");
      setPassForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      window.dispatchEvent(
        new CustomEvent("showToast", { detail: "🔑 Password berhasil diperbarui!" })
      );
    } catch (err) {
      setPassError(err.message);
    } finally {
      setPassSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/customer/logout", { method: "POST" });
    } catch {}
    window.dispatchEvent(new Event("authStateChange"));
    router.push("/");
  };

  if (loading) {
    return (
      <div className={styles.container} style={{ textAlign: "center", padding: "5rem 0" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
          Memuat data profil akun...
        </p>
      </div>
    );
  }

  const initial = user.name ? user.name.charAt(0).toUpperCase() : "👤";
  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Member Terdaftar";

  return (
    <div className={styles.container}>
      {/* ── Breadcrumb ── */}
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/" className={styles.breadcrumbLink}>
          Beranda
        </Link>
        <span>/</span>
        <Link href="/profil" className={styles.breadcrumbLink}>
          Portal Pelanggan
        </Link>
        <span>/</span>
        <span className={styles.breadcrumbCurrent}>Pengaturan Profil</span>
      </nav>

      {/* ── Hero Profile Card ── */}
      <section className={styles.profileHero}>
        <div className={styles.heroLeft}>
          <div className={styles.avatar}>{initial}</div>
          <div>
            <h1 className={styles.userName}>
              {user.name}
              <span className={styles.tierBadge}>👑 {user.tier}</span>
            </h1>
            <p className={styles.userEmail}>{user.email}</p>
          </div>
        </div>

        <div className={styles.heroActions}>
          <Link href="/profil/pesanan" className={styles.portalBtn} style={{ background: "var(--clr-primary)", color: "#fff", borderColor: "var(--clr-primary)" }}>
            <span>🛍️</span> Pesanan Saya
          </Link>
          <Link href="/cart" className={styles.portalBtn}>
            <span>🛒</span> Keranjang
          </Link>
          <button onClick={handleLogout} className={styles.logoutBtn} title="Keluar dari akun">
            <span>🚪</span> Keluar
          </button>
        </div>
      </section>

      {/* ── Main Two-Column Grid ── */}
      <div className={styles.contentGrid}>
        {/* Left Column: Form Settings */}
        <div>
          {/* Section 1: Profil Akun */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>
                  <span>👤</span> Data Profil Akun
                </h2>
                <p className={styles.cardSubtitle}>
                  Informasi identitas dan kontak akun pelanggan Anda
                </p>
              </div>
            </div>

            {profileSuccess && (
              <div className={styles.alertSuccess}>
                <span>✓</span> {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className={styles.alertError}>
                <span>⚠️</span> {profileError}
              </div>
            )}

            <form onSubmit={handleUpdateProfile}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="prof-name">
                  Nama Lengkap
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>📝</span>
                  <input
                    id="prof-name"
                    type="text"
                    className={styles.input}
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Nama lengkap Anda"
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="prof-email">
                  Alamat Email (Akun)
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>✉️</span>
                  <input
                    id="prof-email"
                    type="email"
                    className={`${styles.input} ${styles.inputDisabled}`}
                    value={user.email}
                    disabled
                  />
                </div>
                <p className={styles.helperText}>
                  Email digunakan sebagai identitas akun login dan tidak dapat diubah secara langsung.
                </p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="prof-phone">
                  Nomor Telepon / WhatsApp
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>📱</span>
                  <input
                    id="prof-phone"
                    type="tel"
                    className={styles.input}
                    value={profileForm.phone}
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="Contoh: 0812-3456-7890"
                  />
                </div>
                <p className={styles.helperText}>
                  Digunakan teknisi untuk konfirmasi status servis dan konfirmasi pesanan toko.
                </p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="prof-address">
                  Alamat Pengiriman Utama
                </label>
                <textarea
                  id="prof-address"
                  className={styles.textarea}
                  value={profileForm.address}
                  onChange={(e) =>
                    setProfileForm((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="Alamat lengkap (Jalan, No. Rumah, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten, Kode Pos)"
                />
                <p className={styles.helperText}>
                  Alamat ini otomatis digunakan saat Anda checkout laptop atau aksesoris.
                </p>
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={profileSaving}
              >
                {profileSaving ? "Menyimpan Perubahan..." : "💾 Simpan Perubahan Profil"}
              </button>
            </form>
          </div>

          {/* Section 2: Keamanan & Password */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>
                  <span>🔒</span> Keamanan & Password
                </h2>
                <p className={styles.cardSubtitle}>
                  Perbarui kata sandi untuk melindungi keamanan akun Anda
                </p>
              </div>
            </div>

            {passSuccess && (
              <div className={styles.alertSuccess}>
                <span>✓</span> {passSuccess}
              </div>
            )}
            {passError && (
              <div className={styles.alertError}>
                <span>⚠️</span> {passError}
              </div>
            )}

            <form onSubmit={handleUpdatePassword}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="prof-curpass">
                  Password Saat Ini
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>🔑</span>
                  <input
                    id="prof-curpass"
                    type={showCurrentPass ? "text" : "password"}
                    className={styles.input}
                    value={passForm.currentPassword}
                    onChange={(e) =>
                      setPassForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                    }
                    placeholder="Masukkan password saat ini"
                    required
                  />
                  <button
                    type="button"
                    className={styles.togglePassBtn}
                    onClick={() => setShowCurrentPass((p) => !p)}
                    aria-label="Toggle password visibility"
                  >
                    {showCurrentPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="prof-newpass">
                  Password Baru
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>✨</span>
                  <input
                    id="prof-newpass"
                    type={showNewPass ? "text" : "password"}
                    className={styles.input}
                    value={passForm.newPassword}
                    onChange={(e) =>
                      setPassForm((prev) => ({ ...prev, newPassword: e.target.value }))
                    }
                    placeholder="Minimal 6 karakter"
                    required
                  />
                  <button
                    type="button"
                    className={styles.togglePassBtn}
                    onClick={() => setShowNewPass((p) => !p)}
                    aria-label="Toggle password visibility"
                  >
                    {showNewPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="prof-confpass">
                  Ulangi Password Baru
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>✨</span>
                  <input
                    id="prof-confpass"
                    type={showConfirmPass ? "text" : "password"}
                    className={styles.input}
                    value={passForm.confirmPassword}
                    onChange={(e) =>
                      setPassForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                    }
                    placeholder="Ketik ulang password baru"
                    required
                  />
                  <button
                    type="button"
                    className={styles.togglePassBtn}
                    onClick={() => setShowConfirmPass((p) => !p)}
                    aria-label="Toggle password visibility"
                  >
                    {showConfirmPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={passSaving}
              >
                {passSaving ? "Memperbarui Password..." : "🔒 Perbarui Password"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Status Akun & Keanggotaan */}
        <div>
          <div className={styles.sideCard}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-contrast)" }}>
              ⭐ Status Keanggotaan
            </h3>

            <div className={styles.membershipStats}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Tier Member</span>
                <span className={styles.statValue} style={{ color: "var(--clr-accent)" }}>
                  👑 {user.tier}
                </span>
              </div>

              <div className={styles.statItem}>
                <span className={styles.statLabel}>Poin Reward</span>
                <span className={styles.statValue} style={{ color: "var(--clr-primary)" }}>
                  ⭐ {Number(user.points || 0).toLocaleString("id-ID")}
                </span>
              </div>

              <div className={styles.statItem}>
                <span className={styles.statLabel}>Bergabung Sejak</span>
                <span className={styles.statValue} style={{ fontSize: "0.85rem" }}>
                  {joinedDate}
                </span>
              </div>

              <div className={styles.statItem}>
                <span className={styles.statLabel}>Status Akun</span>
                <span className={styles.statValue} style={{ color: "var(--clr-success)" }}>
                  ● Aktif Terverifikasi
                </span>
              </div>
            </div>
          </div>

          <div className={styles.sideCard}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-contrast)" }}>
              🎁 Keuntungan Akun Anda
            </h3>

            <div className={styles.benefitList}>
              <div className={styles.benefitItem}>
                <span>🛡️</span>
                <span>Garansi resmi tersimpan otomatis di sistem RajaLaptop.</span>
              </div>
              <div className={styles.benefitItem}>
                <span>🔧</span>
                <span>Pantau progress servis dan klaim garansi laptop secara live.</span>
              </div>
              <div className={styles.benefitItem}>
                <span>⚡</span>
                <span>Prioritas konsultasi teknisi spesialis dan optimasi hardware.</span>
              </div>
              <div className={styles.benefitItem}>
                <span>🎟️</span>
                <span>Kumpulkan poin reward di setiap transaksi belanja.</span>
              </div>
            </div>

            <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--glass-border)" }}>
              <Link
                href="/profil/pesanan"
                style={{
                  display: "block",
                  textAlign: "center",
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  padding: "0.65rem",
                  borderRadius: "var(--radius-md)",
                  color: "var(--clr-primary)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  textDecoration: "none"
                }}
              >
                Lihat Riwayat & Status Pesanan Saya →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
