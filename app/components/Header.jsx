"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useSettings } from "@/app/context/SettingsContext";
import styles from "./Header.module.css";

const ROLE_METADATA = {
  super_admin: { name: "Super Admin", color: "#f59e0b", icon: "👑" },
  owner: { name: "Owner", color: "#10b981", icon: "🏢" },
  manajer_area: { name: "Manager Area", color: "#8b5cf6", icon: "🗺️" },
  kepala_toko: { name: "Kepala Toko", color: "#06b6d4", icon: "🏪" },
  kasir: { name: "Kasir", color: "#3b82f6", icon: "💳" },
  gudang: { name: "Gudang", color: "#f97316", icon: "📦" },
  finance: { name: "Finance", color: "#ec4899", icon: "💰" },
  digital_marketing: { name: "Marketing", color: "#14b8a6", icon: "📢" },
  audit: { name: "Audit", color: "#6b7280", icon: "🛡️" },
};

const ADMIN_NAVIGATION_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/admin/dashboard", icon: "📊", permission: "dashboard.view" },
  { id: "panduan", label: "Pusat Panduan & SOP", href: "/admin/panduan", icon: "📚", isPublicForAdmin: true },
  { id: "produk", label: "Katalog Laptop", href: "/admin/produk", icon: "💻", permission: "products.view" },
  { id: "pesanan", label: "Penjualan & POS", href: "/admin/pesanan", icon: "🛍️", permission: "sales.view" },
  { id: "serials", label: "Serial Number & IMEI", href: "/admin/serials", icon: "🏷️", permission: "serials.view" },
  { id: "approvals", label: "Approval Otorisasi", href: "/admin/approvals", icon: "📝", permission: "approval.view" },
  { id: "servis", label: "Tiket Servis", href: "/admin/servis", icon: "🔧", permission: "service.view" },
  { id: "audit-logs", label: "Audit Trail", href: "/admin/audit-logs", icon: "🛡️", permission: "audit.view" },
  { id: "roles", label: "Role & Izin (RBAC)", href: "/admin/roles", icon: "🔑", permission: "roles.view" },
  { id: "admins", label: "Staf & Hak Akses", href: "/admin/admins", icon: "👥", permission: "users.view" },
  { id: "customers", label: "Pelanggan Terdaftar", href: "/admin/customers", icon: "👤", permission: "users.view" },
  { id: "settings", label: "Konfigurasi Web", href: "/admin/settings", icon: "⚙️", permission: "settings.manage" },
  { id: "heroslider", label: "Setting Hero Slider", href: "/admin/heroslider", icon: "🖼️", permission: "settings.manage" },
  { id: "layanan", label: "Servis & Reparasi", href: "/admin/layanan", icon: "🔧", permission: "marketing.view" },
  { id: "artikel", label: "Tips & Artikel", href: "/admin/artikel", icon: "📰", permission: "marketing.view" },
  { id: "progres", label: "Progres Web", href: "/admin/progres", icon: "🚀", superAdminOnly: true },
];

export default function Header({ onMenuToggle }) {
  const [scrolled,     setScrolled]     = useState(false);
  const [cartCount,    setCartCount]    = useState(0);
  const [currentUser,  setCurrentUser]  = useState(null);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [adminOpen,    setAdminOpen]    = useState(false);
  const [adminAvatarErr, setAdminAvatarErr] = useState(false);
  const [customerAvatarErr, setCustomerAvatarErr] = useState(false);
  const profileRef = useRef(null);
  const adminRef   = useRef(null);
  const { settings } = useSettings();

  const storeName = settings?.storeName || "RajaLaptop";

  const adminRoleMeta = useMemo(() => {
    if (!currentAdmin) return null;
    return (
      ROLE_METADATA[currentAdmin.role] || {
        name: currentAdmin.roleName || currentAdmin.role || "Admin",
        color: "#3b82f6",
        icon: "👤",
      }
    );
  }, [currentAdmin]);

  const visibleAdminMenus = useMemo(() => {
    if (!currentAdmin) return [];
    return ADMIN_NAVIGATION_ITEMS.filter((item) => {
      if (item.isPublicForAdmin) return true;
      if (item.superAdminOnly) {
        return Boolean(currentAdmin.isSuperAdmin || currentAdmin.role === "super_admin" || currentAdmin.isOwner || currentAdmin.role === "owner");
      }
      if (currentAdmin.isSuperAdmin || currentAdmin.role === "super_admin") return true;
      return Boolean(currentAdmin.permissionSlugs && currentAdmin.permissionSlugs.includes(item.permission));
    });
  }, [currentAdmin]);

  useEffect(() => {
    setAdminAvatarErr(false);
  }, [currentAdmin?.avatar]);

  useEffect(() => {
    setCustomerAvatarErr(false);
  }, [currentUser?.avatar]);

  /* ── Check Auth (Admin & Customer) ── */
  const checkAuth = async () => {
    // 1. Check Admin Auth first
    try {
      const resAdmin = await fetch(`/api/auth/admin/me?t=${Date.now()}`, { cache: "no-store" });
      if (resAdmin.ok) {
        const dataAdmin = await resAdmin.json();
        if (dataAdmin.user && (dataAdmin.user.status || "active") === "active") {
          setCurrentAdmin(dataAdmin.user);
        } else {
          setCurrentAdmin(null);
        }
      } else {
        setCurrentAdmin(null);
      }
    } catch {
      setCurrentAdmin(null);
    }

    // 2. Check Customer Auth
    try {
      const resCust = await fetch(`/api/auth/customer/me?t=${Date.now()}`, { cache: "no-store" });
      if (resCust.ok) {
        const dataCust = await resCust.json();
        if (dataCust.user) setCurrentUser(dataCust.user);
        else setCurrentUser(null);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      checkAuth();
    });
    window.addEventListener("authStateChange", checkAuth);
    window.addEventListener("focus", checkAuth);
    return () => {
      window.removeEventListener("authStateChange", checkAuth);
      window.removeEventListener("focus", checkAuth);
    };
  }, []);

  /* ── Scroll shadow ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);


  /* ── Cart (hanya untuk customer login) ── */
  useEffect(() => {
    const h1 = (e) => {
      if (currentUser) setCartCount(e.detail ?? 0);
      else setCartCount(0);
    };
    const h2 = () => {
      if (currentUser) setCartCount((p) => p + 1);
      else setCartCount(0);
    };
    window.addEventListener("cartUpdate", h1);
    window.addEventListener("cartIncrement", h2);

    queueMicrotask(() => {
      if (!currentUser) {
        setCartCount(0);
      } else {
        try {
          const saved = JSON.parse(localStorage.getItem("rajalaptop_cart") || "[]");
          setCartCount(saved.reduce((sum, item) => sum + (item.qty || 1), 0));
        } catch {}
      }
    });

    return () => {
      window.removeEventListener("cartUpdate", h1);
      window.removeEventListener("cartIncrement", h2);
    };
  }, [currentUser]);

  /* ── Close profile on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (adminRef.current && !adminRef.current.contains(e.target)) {
        setAdminOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/customer/logout", { method: "POST" });
    } catch {}
    setCurrentUser(null);
    setProfileOpen(false);
    window.dispatchEvent(new Event("authStateChange"));
    window.dispatchEvent(new CustomEvent("showToast", { detail: "Berhasil keluar akun." }));
  };

  const handleAdminLogout = async () => {
    try {
      await fetch("/api/auth/admin/logout", { method: "POST" });
    } catch {}
    setCurrentAdmin(null);
    setAdminOpen(false);
    window.dispatchEvent(new Event("authStateChange"));
    window.dispatchEvent(new CustomEvent("showToast", { detail: "Sesi admin berhasil keluar." }));
  };

  const initials = currentUser?.name
    ? currentUser.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "";

  const adminInitials = currentAdmin?.name
    ? currentAdmin.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "👑";

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`} id="header">
      <div className={styles.headerInner}>
        {/* Left cluster on mobile: Hamburger + Mobile Logo */}
        <div className={styles.mobileNavCluster}>
          <button type="button" className={styles.hamburger} id="hamburger" aria-label="Buka menu" onClick={onMenuToggle}>
            <span /><span /><span />
          </button>

          <Link href="/" className={styles.mobileLogo} aria-label={storeName}>
            {settings?.logoUrl ? (
              <img
                key={settings.logoUrl}
                src={settings.logoUrl}
                alt={storeName}
                className={styles.mobileLogoImg}
                style={{
                  maxHeight: "34px",
                  maxWidth: "125px",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            ) : (
              <div className={styles.mobileLogoTextWrapper}>
                <span className={styles.mobileLogoIcon}>👑</span>
                <span className={styles.mobileLogoText} suppressHydrationWarning>
                  {storeName.startsWith("Raja") ? (
                    <>
                      {storeName.slice(0, 4)}
                      <span className={styles.mobileLogoAccent}>{storeName.slice(4)}</span>
                    </>
                  ) : (
                    <span className={styles.mobileLogoAccent}>{storeName}</span>
                  )}
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Actions */}
        <div className={styles.headerActions}>
          {/* Cart */}
          <Link href="/cart" className={styles.iconBtn} id="btn-cart" aria-label="Keranjang" title="Keranjang belanja">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {cartCount > 0 && currentUser && <span className={styles.cartBadge}>{cartCount}</span>}
          </Link>

          {/* Profile / Auth / Admin Dropdown */}
          {currentAdmin ? (
            <div className={styles.profileWrapper} ref={adminRef}>
              {/* Profile Trigger Button: Photo, Name, Role Badge, Chevron */}
              <button
                type="button"
                onClick={() => setAdminOpen((p) => !p)}
                aria-expanded={adminOpen}
                title={`Admin: ${currentAdmin.name} (${adminRoleMeta?.name || "Admin"})`}
                className={styles.adminProfileBtn}
                style={{
                  borderColor: adminRoleMeta?.color || "var(--clr-primary)",
                  boxShadow: `0 0 10px ${adminRoleMeta?.color || "var(--clr-primary)"}30`,
                }}
              >
                  {currentAdmin.avatar && !adminAvatarErr ? (
                    <img
                      key={currentAdmin.avatar}
                      src={currentAdmin.avatar}
                      alt={currentAdmin.name}
                      referrerPolicy="no-referrer"
                      className={styles.adminAvatarImg}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: `2px solid ${adminRoleMeta?.color || "var(--clr-primary)"}`,
                      }}
                      onError={() => setAdminAvatarErr(true)}
                    />
                  ) : (
                    <div
                      className={styles.adminAvatarFallback}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${adminRoleMeta?.color || "#3b82f6"}, #3b82f6)`,
                        boxShadow: `0 0 10px ${adminRoleMeta?.color || "#3b82f6"}40`,
                      }}
                    >
                      {currentAdmin.name ? currentAdmin.name.charAt(0).toUpperCase() : "A"}
                    </div>
                  )}

                  <div className={styles.adminProfileInfo}>
                    <span className={styles.adminName}>
                      {currentAdmin.name}
                    </span>
                    <span
                      className={styles.adminRoleBadge}
                      style={{ color: adminRoleMeta?.color || "var(--clr-primary)" }}
                    >
                      <span>{adminRoleMeta?.icon || "👤"}</span>
                      <span>{adminRoleMeta?.name || "Admin"}</span>
                    </span>
                  </div>

                  <span
                    className={`${styles.chevron} ${adminOpen ? styles.chevronUp : ""}`}
                    style={{ marginLeft: "2px" }}
                  >
                    ▾
                  </span>
                </button>

              {/* Exact Admin Dashboard Popup */}
              {adminOpen && (
                <div className={styles.adminDropdownPopup}>
                  {/* 1. Mini Profil Ringkas */}
                  <div
                    style={{
                      padding: "0.55rem 0.7rem",
                      background: "var(--bg-card)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--glass-border)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.65rem",
                    }}
                  >
                    {currentAdmin.avatar && !adminAvatarErr ? (
                      <img
                        key={currentAdmin.avatar}
                        src={currentAdmin.avatar}
                        alt={currentAdmin.name}
                        referrerPolicy="no-referrer"
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: `1.5px solid ${adminRoleMeta?.color || "var(--clr-primary)"}`,
                          boxShadow: `0 2px 8px ${adminRoleMeta?.color || "var(--clr-primary)"}40`,
                          flexShrink: 0,
                        }}
                        onError={() => setAdminAvatarErr(true)}
                      />
                    ) : (
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "50%",
                          background: `linear-gradient(135deg, ${adminRoleMeta?.color || "#3b82f6"}, #3b82f6)`,
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1rem",
                          fontWeight: 900,
                          flexShrink: 0,
                          boxShadow: `0 2px 8px ${adminRoleMeta?.color || "#3b82f6"}40`,
                        }}
                      >
                        {currentAdmin.name ? currentAdmin.name.charAt(0).toUpperCase() : "A"}
                      </div>
                    )}
                    <div style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: "0.86rem",
                          color: "var(--text-contrast)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {currentAdmin.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {currentAdmin.email}
                      </div>
                      <div style={{ display: "flex", gap: "4px", alignItems: "center", marginTop: "3px" }}>
                        <span
                          style={{
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            color: adminRoleMeta?.color || "var(--clr-primary)",
                            background: `${adminRoleMeta?.color || "#3b82f6"}15`,
                            border: `1px solid ${adminRoleMeta?.color || "#3b82f6"}40`,
                            padding: "1px 6px",
                            borderRadius: "3px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {adminRoleMeta?.icon} {adminRoleMeta?.name}
                        </span>
                        <span
                          style={{
                            fontSize: "0.62rem",
                            color: "var(--text-muted)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {currentAdmin.defaultScope || "Global"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Menu Utama Profil */}
                  <Link
                    href="/admin/datadiri"
                    onClick={() => setAdminOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.55rem",
                      padding: "0.45rem 0.65rem",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: "var(--text-contrast)",
                      textDecoration: "none",
                      background: "transparent",
                      border: "1px solid var(--glass-border)",
                      transition: "all var(--t-fast)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontSize: "1rem" }}>👤</span>
                    <span style={{ flex: 1 }}>Lihat Profil Admin</span>
                    <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>→</span>
                  </Link>

                  <div style={{ height: "1px", background: "var(--glass-border)", margin: "0.1rem 0" }} />

                  {/* 3. Menu Akses Ringkas (2-Column Grid Persis Dashboard) */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    <div
                      style={{
                        fontSize: "0.64rem",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        padding: "0 0.2rem",
                        fontWeight: 800,
                        letterSpacing: "0.5px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>Menu Akses ({visibleAdminMenus.length})</span>
                      <span
                        style={{
                          background: "rgba(59, 130, 246, 0.15)",
                          color: "var(--clr-primary)",
                          padding: "1px 5px",
                          borderRadius: "3px",
                          fontWeight: 700,
                        }}
                      >
                        RBAC
                      </span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "4px",
                      }}
                    >
                      {visibleAdminMenus.map((menu) => (
                        <Link
                          key={menu.id}
                          href={menu.href}
                          onClick={() => setAdminOpen(false)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            padding: "0.4rem 0.5rem",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "0.73rem",
                            fontWeight: 600,
                            color: "var(--text-contrast)",
                            textDecoration: "none",
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid var(--glass-border)",
                            transition: "all var(--t-fast)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--bg-hover)";
                            e.currentTarget.style.borderColor = "var(--clr-primary)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                            e.currentTarget.style.borderColor = "var(--glass-border)";
                          }}
                          title={menu.label}
                        >
                          <span style={{ fontSize: "0.85rem", flexShrink: 0 }}>{menu.icon}</span>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                            {menu.label}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div style={{ height: "1px", background: "var(--glass-border)", margin: "0.1rem 0" }} />

                  {/* 4. Tombol Buka Panel Dashboard */}
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setAdminOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.45rem",
                      padding: "0.45rem 0.65rem",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.76rem",
                      fontWeight: 700,
                      color: "#fff",
                      background: "linear-gradient(135deg, var(--clr-primary), #6366f1)",
                      textDecoration: "none",
                      boxShadow: "0 2px 8px rgba(59, 130, 246, 0.35)",
                      transition: "all var(--t-fast)",
                    }}
                  >
                    <span>📊</span>
                    <span>Buka Panel Dashboard</span>
                  </Link>

                  {/* 5. Keluar Sesi Admin */}
                  <button
                    type="button"
                    onClick={handleAdminLogout}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem",
                      width: "100%",
                      padding: "0.45rem 0.6rem",
                      borderRadius: "var(--radius-sm)",
                      background: "hsla(0, 80%, 58%, 0.12)",
                      border: "1px solid hsla(0, 80%, 58%, 0.3)",
                      color: "var(--clr-danger)",
                      fontSize: "0.76rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all var(--t-fast)",
                    }}
                  >
                    <span>🚪</span>
                    <span>Keluar Sesi Admin</span>
                  </button>
                </div>
              )}
            </div>
          ) : currentUser ? (
            <div className={styles.profileWrapper} ref={profileRef}>
              <button
                type="button"
                className={styles.profileBtn}
                onClick={() => setProfileOpen((p) => !p)}
                aria-expanded={profileOpen}
                title={currentUser.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.22rem 0.75rem 0.22rem 0.3rem",
                  background: profileOpen ? "var(--bg-hover)" : "var(--bg-surface)",
                  border: "1px solid var(--clr-primary)",
                  borderRadius: "var(--radius-full)",
                  cursor: "pointer",
                  transition: "all var(--t-fast)",
                }}
              >
                {currentUser.avatar && !customerAvatarErr ? (
                  <img
                    key={currentUser.avatar}
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "1.5px solid var(--clr-primary)",
                      flexShrink: 0,
                      display: "block",
                    }}
                    onError={() => setCustomerAvatarErr(true)}
                  />
                ) : (
                  <span className={styles.avatar}>
                    {initials || "👤"}
                  </span>
                )}
                <div style={{ textAlign: "left", display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
                  <span className={styles.profileName}>{currentUser.name?.split(" ")[0]}</span>
                  <span style={{ fontSize: "0.65rem", color: "var(--clr-primary)", fontWeight: 700 }}>
                    {currentUser.tier || "Pelanggan"}
                  </span>
                </div>
                <span className={`${styles.chevron} ${profileOpen ? styles.chevronUp : ""}`}>▾</span>
              </button>

              {profileOpen && (
                <div className={styles.profileDropdown}>
                  {/* Header info */}
                  <div className={styles.dropdownHeader}>
                    {currentUser.avatar && !customerAvatarErr ? (
                      <img
                        key={currentUser.avatar}
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        referrerPolicy="no-referrer"
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "1.5px solid var(--clr-primary)",
                          flexShrink: 0,
                          display: "block",
                        }}
                        onError={() => setCustomerAvatarErr(true)}
                      />
                    ) : (
                      <div className={styles.dropdownAvatar}>
                        {initials || "👤"}
                      </div>
                    )}
                    <div>
                      <p className={styles.dropdownName}>{currentUser.name}</p>
                      <p className={styles.dropdownEmail}>{currentUser.email}</p>
                      <span className={styles.dropdownRole}>
                        {currentUser.tier || "Pelanggan"}
                      </span>
                    </div>
                  </div>

                  {/* Links */}
                  <div className={styles.dropdownLinks}>
                    <Link
                      href="/profil/pesanan"
                      className={styles.dropdownLink}
                      onClick={() => setProfileOpen(false)}
                    >
                      <span>🛍️</span>
                      Pesanan Saya
                    </Link>
                    <Link
                      href="/profil"
                      className={styles.dropdownLink}
                      onClick={() => setProfileOpen(false)}
                    >
                      <span>⚙️</span>Pengaturan Profil
                    </Link>
                    <Link href="/cart" className={styles.dropdownLink} onClick={() => setProfileOpen(false)}>
                      <span>🛒</span>Keranjang Belanja
                    </Link>
                  </div>

                  {/* Logout */}
                  <button className={styles.dropdownLogout} onClick={handleLogout}>
                    <span>🚪</span> Keluar Akun
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.authButtons}>
              <Link href="/login"    className={styles.btnLogin}    id="btn-login">Masuk</Link>
              <Link href="/register" className={styles.btnRegister} id="btn-register">Daftar</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
