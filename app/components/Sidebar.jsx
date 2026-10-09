"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSettings } from "@/app/context/SettingsContext";
import styles from "./Sidebar.module.css";

const CUSTOMER_NAV = [
  {
    section: "Belanja",
    items: [
      {
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        ),
        label: "Beranda",
        href: "/",
      },
      {
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        ),
        label: "Katalog Produk",
        href: "/produk",
      },
      {
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
        ),
        label: "Keranjang Belanja",
        href: "/cart",
        isCart: true,
      },
      {
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        ),
        label: "Pesanan Saya",
        href: "/profil/pesanan",
      },
    ],
  },
  {
    section: "Layanan Pelanggan",
    items: [
      {
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        ),
        label: "Servis & Reparasi",
        href: "/#layanan",
      },
      {
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        ),
        label: "Tips & Artikel",
        href: "/#artikel",
      },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const { settings } = useSettings();
  const [theme, setTheme] = useState("dark");
  const [mounted, setMounted] = useState(false);

  /* ── Theme management ── */
  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
      const saved = localStorage.getItem("rajalaptop_theme") || "dark";
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    });

    const onThemeChange = (e) => {
      if (e.detail) setTheme(e.detail);
    };
    window.addEventListener("themeChange", onThemeChange);
    return () => window.removeEventListener("themeChange", onThemeChange);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("rajalaptop_theme", next);
    document.documentElement.setAttribute("data-theme", next);
    window.dispatchEvent(new CustomEvent("themeChange", { detail: next }));
  };

  /* ── Customer Auth Status ── */
  useEffect(() => {
    let ignore = false;
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/customer/me");
        if (res.ok) {
          const data = await res.json();
          if (!ignore) setCurrentUser(data.user || null);
          return;
        }
        if (!ignore) setCurrentUser(null);
      } catch {
        if (!ignore) setCurrentUser(null);
      }
    };

    queueMicrotask(() => {
      fetchUser();
    });

    const handleAuth = () => fetchUser();
    window.addEventListener("authStateChange", handleAuth);
    window.addEventListener("focus", handleAuth);
    return () => {
      ignore = true;
      window.removeEventListener("authStateChange", handleAuth);
      window.removeEventListener("focus", handleAuth);
    };
  }, []);

  /* ── Cart Quantity Sync (Hanya aktif jika sudah login) ── */
  useEffect(() => {
    const updateCount = (e) => {
      if (currentUser) {
        setCartCount(e.detail ?? 0);
      } else {
        setCartCount(0);
      }
    };
    const incCount = () => {
      if (currentUser) {
        setCartCount((prev) => prev + 1);
      } else {
        setCartCount(0);
      }
    };

    queueMicrotask(() => {
      if (currentUser) {
        try {
          const items = JSON.parse(localStorage.getItem("rajalaptop_cart") || "[]");
          const total = items.reduce((acc, it) => acc + (it.qty || 1), 0);
          setCartCount(total);
        } catch {
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    });

    window.addEventListener("cartUpdate", updateCount);
    window.addEventListener("cartIncrement", incCount);
    return () => {
      window.removeEventListener("cartUpdate", updateCount);
      window.removeEventListener("cartIncrement", incCount);
    };
  }, [currentUser]);

  /* ── Close on route change on mobile (hanya saat route benar-benar berpindah) ── */
  const prevPathRef = useRef(pathname);
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      onClose?.();
    }
  }, [pathname, onClose]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/customer/logout", { method: "POST" });
    } catch {}
    setCurrentUser(null);
    setCartCount(0);
    window.dispatchEvent(new Event("authStateChange"));
    window.dispatchEvent(new CustomEvent("cartUpdate", { detail: 0 }));
    window.dispatchEvent(
      new CustomEvent("showToast", { detail: "Berhasil keluar dari akun." })
    );
    onClose?.();
  };

  const storeName = settings?.storeName || "RajaLaptop";
  const isLight = theme === "light";
  const userInitial = currentUser?.name
    ? currentUser.name.charAt(0).toUpperCase()
    : "U";

  // Keranjang hanya berisi kuantitas jika user login
  const displayCartCount = currentUser ? cartCount : 0;

  return (
    <>
      {/* Overlay on mobile */}
      {isOpen && (
        <div
          className={styles.overlay}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}
        aria-label="Navigasi Pelanggan"
      >
        {/* ── Header Sidebar ── */}
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.sidebarLogo} onClick={onClose}>
            {settings?.logoUrl ? (
              <img
                key={settings.logoUrl}
                src={settings.logoUrl}
                alt={storeName}
                className={styles.sidebarLogoImg}
                style={{
                  maxHeight: "52px",
                  maxWidth: "185px",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            ) : (
              <>
                <span className={styles.logoIcon}>👑</span>
                <span className={styles.logoText} suppressHydrationWarning>
                  {storeName.startsWith("Raja") ? (
                    <>
                      {storeName.slice(0, 4)}
                      <span className={styles.logoAccent}>{storeName.slice(4)}</span>
                    </>
                  ) : (
                    <span className={styles.logoAccent}>{storeName}</span>
                  )}
                </span>
              </>
            )}
          </Link>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Tutup menu"
          >
            ✕
          </button>
        </div>

        {/* ── Status Akun Pelanggan (Hanya muncul jika sudah login) ── */}
        {currentUser && (
          <div className={styles.userSection}>
            <div className={styles.customerCard}>
              <div className={styles.customerAvatar}>{userInitial}</div>
              <div className={styles.customerInfo}>
                <strong>{currentUser.name}</strong>
                <small>{currentUser.email || "Pelanggan Terdaftar"}</small>
              </div>
              <Link
                href="/profil"
                className={styles.portalPill}
                onClick={onClose}
                title="Buka Portal Pelanggan"
              >
                Portal
              </Link>
            </div>
          </div>
        )}

        {/* ── Navigasi Customer ── */}
        <nav className={styles.nav}>
          {CUSTOMER_NAV.map((grp) => (
            <div key={grp.section} className={styles.navGroup}>
              <p className={styles.groupLabel}>{grp.section}</p>
              <ul className={styles.navList}>
                {grp.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.label} className={styles.navItem}>
                      <Link
                        href={item.href}
                        className={`${styles.navLink} ${
                          isActive ? styles.active : ""
                        }`}
                        onClick={onClose}
                      >
                        <span className={styles.navIcon}>{item.icon}</span>
                        <span className={styles.navLabel}>{item.label}</span>

                        {item.isCart && displayCartCount > 0 && (
                          <span className={styles.cartCountBadge}>
                            {displayCartCount}
                          </span>
                        )}

                        {item.badge && (
                          <span
                            style={{
                              marginLeft: "auto",
                              fontSize: "0.68rem",
                              fontWeight: 800,
                              padding: "0.15rem 0.5rem",
                              borderRadius: "9999px",
                              background: "rgba(59, 130, 246, 0.15)",
                              color: "#3b82f6",
                              border: "1px solid rgba(59, 130, 246, 0.3)",
                              letterSpacing: "0.02em",
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* ── Menu Khusus Pelanggan Terdaftar ── */}
          {currentUser && (
            <div className={styles.navGroup}>
              <p className={styles.groupLabel}>Akun Saya</p>
              <ul className={styles.navList}>

                <li className={styles.navItem}>
                  <Link
                    href="/profil"
                    className={`${styles.navLink} ${
                      pathname === "/profil" ? styles.active : ""
                    }`}
                    onClick={onClose}
                  >
                    <span className={styles.navIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    </span>
                    <span className={styles.navLabel}>Profil & Alamat</span>
                  </Link>
                </li>
                <li className={styles.navItem}>
                  <button
                    className={`${styles.navLink} ${styles.logoutBtn}`}
                    onClick={handleLogout}
                  >
                    <span className={styles.navIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                    </span>
                    <span className={styles.navLabel}>Keluar Akun</span>
                  </button>
                </li>
              </ul>
            </div>
          )}

          {/* ── Fitur Mode Gelap / Terang (Di dalam Menu Navigasi) ── */}
          {mounted && (
            <div className={styles.navGroup}>
              <p className={styles.groupLabel}>Tampilan</p>
              <ul className={styles.navList}>
                <li className={styles.navItem}>
                  <button
                    className={styles.navLink}
                    onClick={toggleTheme}
                    aria-label="Ganti mode gelap/terang"
                  >
                    <span className={styles.navIcon}>
                      {isLight ? "☀️" : "🌙"}
                    </span>
                    <span className={styles.navLabel}>
                      {isLight ? "Mode Terang" : "Mode Gelap"}
                    </span>
                    <span className={styles.themeSwitch} data-on={isLight} />
                  </button>
                </li>
              </ul>
            </div>
          )}
        </nav>

        {/* ── Footer Sidebar ── */}
        <div className={styles.sidebarFooter}>
          <a
            href={`https://wa.me/${
              settings?.whatsappNumber || "6281234567890"
            }`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.waBtn}
          >
            <span>💬</span> Chat WhatsApp CS
          </a>

          <p className={styles.footerNote}>© 2026 {storeName}</p>
        </div>
      </aside>
    </>
  );
}
