"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "../components/ThemeToggle";
import { useSettings } from "@/app/context/SettingsContext";
import styles from "./AdminLayout.module.css";

const ROLE_METADATA = {
  owner: { name: "Owner", badge: "Pemilik Bisnis", color: "#f59e0b", icon: "👑" },
  super_admin: { name: "Super Admin", badge: "Teknis & Sistem", color: "#3b82f6", icon: "⚡" },
  manajer_area: { name: "Manager Area", badge: "Regional Manager", color: "#8b5cf6", icon: "🏢" },
  kepala_toko: { name: "Kepala Toko", badge: "Store Manager", color: "#6366f1", icon: "🏪" },
  kasir: { name: "Kasir", badge: "POS & Sales", color: "#10b981", icon: "🛒" },
  gudang: { name: "Gudang", badge: "Inventory & SN", color: "#d97706", icon: "📦" },
  finance: { name: "Finance", badge: "Keuangan & Kas", color: "#ef4444", icon: "💰" },
  digital_marketing: { name: "Marketing", badge: "Kampanye & Promo", color: "#ec4899", icon: "📣" },
  audit: { name: "Audit", badge: "Pengawasan (RO)", color: "#6b7280", icon: "🛡️" },
};

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { settings } = useSettings();
  const [adminUser, setAdminUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const storeName = settings?.storeName || "RajaLaptop";
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setAuthReady(true);
      return;
    }

    let cancelled = false;
    const fetchAdminMe = async () => {
      try {
        const res = await fetch(`/api/auth/admin/me?t=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (!res.ok) {
          router.replace("/admin/login");
          return;
        }
        const data = await res.json();
        if (cancelled || !data.user) return;
        setAdminUser(data.user);
        setAuthReady(true);
      } catch {
        router.replace("/admin/login");
      }
    };

    fetchAdminMe();
    window.addEventListener("authStateChange", fetchAdminMe);

    return () => {
      cancelled = true;
      window.removeEventListener("authStateChange", fetchAdminMe);
    };
  }, [router, isLoginPage]);

  useEffect(() => {
    setSidebarOpen(false);
    setProfileDropdownOpen(false);
  }, [pathname]);

  // Click outside to close profile popup
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    if (profileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileDropdownOpen]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/admin/logout", { method: "POST" });
    } catch {}
    router.push("/admin/login");
  };

  // State untuk search topbar aktif & kompak
  const [topbarSearchQuery, setTopbarSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutsideSearch = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideSearch);
    return () => document.removeEventListener("mousedown", handleClickOutsideSearch);
  }, []);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!authReady || !adminUser) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "var(--text-muted)" }}>
        Memuat RBAC Admin Panel...
      </div>
    );
  }

  const roleMeta = ROLE_METADATA[adminUser.role] || {
    name: adminUser.roleName || adminUser.role,
    badge: adminUser.defaultScope || "Staff",
    color: "#3b82f6",
    icon: "👤",
  };

  // Master navigation grouped by categories with required permission mapping
  const navigationGroups = [
    {
      group: "Utama",
      items: [
        { id: "dashboard", label: "Dashboard", href: "/admin/dashboard", icon: "📊", permission: "dashboard.view" },
      ],
    },
    {
      group: "Operasional & Transaksi",
      items: [
        { id: "produk", label: "Katalog Laptop", href: "/admin/produk", icon: "💻", permission: "products.view" },
        { id: "pesanan", label: "Penjualan & POS", href: "/admin/pesanan", icon: "🛍️", permission: "sales.view" },
        { id: "serials", label: "Serial & IMEI", href: "/admin/serials", icon: "🏷️", permission: "serials.view" },
        { id: "approvals", label: "Approval Otorisasi", href: "/admin/approvals", icon: "📝", permission: "approval.view" },
        { id: "servis", label: "Tiket Servis", href: "/admin/servis", icon: "🔧", permission: "service.view" },
      ],
    },
    {
      group: "Pengguna & Keanggotaan",
      items: [
        { id: "customers", label: "Pelanggan Terdaftar", href: "/admin/customers", icon: "👤", permission: "users.view" },
        { id: "admins", label: "Staf & Hak Akses", href: "/admin/admins", icon: "👥", permission: "users.view" },
        { id: "roles", label: "Role & Izin (RBAC)", href: "/admin/roles", icon: "🔑", permission: "roles.view" },
      ],
    },
    {
      group: "Pengaturan & Konten",
      items: [
        { id: "settings", label: "Konfigurasi Web", href: "/admin/settings", icon: "⚙️", permission: "settings.manage" },
        { id: "heroslider", label: "Hero Slider", href: "/admin/heroslider", icon: "🖼️", permission: "settings.manage" },
        { id: "footer", label: "Footer Info", href: "/admin/footer", icon: "👣", permission: "settings.manage" },
      ],
    },
    {
      group: "Sistem & Keamanan",
      items: [
        { id: "audit-logs", label: "Audit Trail", href: "/admin/audit-logs", icon: "🛡️", permission: "audit.view" },
        { id: "progres", label: "Progres Web", href: "/admin/progres", icon: "🚀", superAdminOnly: true },
      ],
    },
  ];

  // Helper check permission for an item
  const canAccessItem = (item) => {
    if (item.superAdminOnly) {
      return Boolean(adminUser.isSuperAdmin || adminUser.role === "super_admin" || adminUser.isOwner || adminUser.role === "owner");
    }
    if (adminUser.isSuperAdmin || adminUser.role === "super_admin") return true;
    return Boolean(adminUser.permissionSlugs && adminUser.permissionSlugs.includes(item.permission));
  };

  // Filter groups keeping only visible items and non-empty groups
  const visibleGroups = navigationGroups
    .map((grp) => ({
      ...grp,
      items: grp.items.filter(canAccessItem),
    }))
    .filter((grp) => grp.items.length > 0);

  const totalVisibleMenus = visibleGroups.reduce((acc, g) => acc + g.items.length, 0);

  return (
    <div className={styles.container}>
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}>
        <div className={styles.sidebarInner}>
          {/* Logo Header */}
          <div
            style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid var(--glass-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <Link
              href="/admin/dashboard"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                textDecoration: "none",
                flex: 1,
                minWidth: 0,
              }}
              title={storeName}
            >
              {settings?.logoUrl ? (
                <img
                  key={settings.logoUrl}
                  src={settings.logoUrl}
                  alt={storeName}
                  style={{
                    maxHeight: "44px",
                    maxWidth: "155px",
                    width: "auto",
                    height: "auto",
                    objectFit: "contain",
                    display: "block",
                    filter: "drop-shadow(0 0 1.5px rgba(255, 255, 255, 0.6)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.35))",
                    transition: "transform var(--t-fast)",
                  }}
                />
              ) : (
                <>
                  <span>{roleMeta.icon}</span>
                  <span
                    suppressHydrationWarning
                    style={{
                      fontSize: "1.15rem",
                      fontWeight: 800,
                      color: "var(--text-contrast)",
                    }}
                  >
                    {storeName.startsWith("Raja") ? (
                      <>
                        {storeName.slice(0, 4)}
                        <span style={{ color: "var(--clr-primary)" }}>Admin</span>
                      </>
                    ) : (
                      <span style={{ color: "var(--clr-primary)" }}>{storeName}</span>
                    )}
                  </span>
                </>
              )}
            </Link>
            <span
              style={{
                fontSize: "0.65rem",
                background: "hsla(220, 90%, 56%, 0.15)",
                color: "var(--clr-primary)",
                padding: "2px 6px",
                borderRadius: "4px",
                fontWeight: 700,
              }}
            >
              RBAC v5
            </span>
          </div>

          {/* Active Role & Scope Card */}
          <div
            style={{
              margin: "1rem 1rem 0.5rem",
              padding: "0.85rem",
              background: "var(--bg-card)",
              border: `1px solid ${roleMeta.color}`,
              borderRadius: "var(--radius-md)",
              boxShadow: `0 0 10px ${roleMeta.color}33`,
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Role Anda
              </span>
              <span
                style={{
                  background: roleMeta.color,
                  color: "#fff",
                  fontSize: "0.65rem",
                  padding: "2px 6px",
                  borderRadius: "var(--radius-full)",
                  fontWeight: 800,
                }}
              >
                {roleMeta.name}
              </span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
              <span>📍 Scope: <strong>{adminUser.defaultScope}</strong></span>
            </div>
            {adminUser.stores && adminUser.stores.length > 0 && (
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "3px" }}>
                Cabang: {adminUser.stores[0].name}
              </div>
            )}
          </div>

          {/* Dynamic Navigation Grouped */}
          <nav style={{ padding: "0.5rem 0.85rem 1rem", flex: 1, display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto" }}>
            {visibleGroups.map((group, grpIdx) => (
              <div key={group.group} style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <div
                  style={{
                    fontSize: "0.68rem",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    padding: "0.25rem 0.6rem",
                    fontWeight: 800,
                    letterSpacing: "0.6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{group.group}</span>
                  {grpIdx === 0 && (
                    <span style={{ fontSize: "0.65rem", opacity: 0.7 }}>({totalVisibleMenus} menu)</span>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          padding: "0.6rem 0.85rem",
                          borderRadius: "var(--radius-md)",
                          fontSize: "0.85rem",
                          fontWeight: isActive ? 700 : 500,
                          background: isActive ? "var(--clr-primary)" : "transparent",
                          color: isActive ? "#fff" : "var(--text-secondary)",
                          transition: "all var(--t-fast)",
                        }}
                      >
                        <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User Profile & Logout */}
          <div
            style={{
              padding: "1rem 1.25rem",
              borderTop: "1px solid var(--glass-border)",
              background: "var(--bg-surface)",
              marginTop: "auto",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.6rem" }}>
              {adminUser.avatar ? (
                <img
                  src={adminUser.avatar}
                  alt={adminUser.name}
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: `1.5px solid ${roleMeta.color}`,
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: roleMeta.color,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.85rem",
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {adminUser.name ? adminUser.name.charAt(0).toUpperCase() : "A"}
                </div>
              )}
              <div style={{ overflow: "hidden", minWidth: 0, flex: 1 }}>
                <strong style={{ display: "block", fontSize: "0.85rem", color: "var(--text-contrast)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {adminUser.name}
                </strong>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{adminUser.email}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Link
                href="/"
                style={{
                  flex: 1,
                  textAlign: "center",
                  background: "var(--bg-card)",
                  border: "1px solid var(--glass-border)",
                  padding: "0.4rem",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                }}
              >
                Lihat Toko
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  flex: 1,
                  background: "hsla(0, 80%, 58%, 0.15)",
                  border: "1px solid var(--clr-danger)",
                  color: "#ff8b8b",
                  padding: "0.4rem",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className={styles.mainWrapper}>
        <header className={styles.topbar}>
          {/* Sisi Kiri: Toggle mobile & Judul Halaman Aktif (data header web dihapus) */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              className={styles.mobileToggle}
              onClick={() => setSidebarOpen((p) => !p)}
              aria-label="Buka Menu Admin"
            >
              ☰
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
              {(() => {
                const current =
                  navigationItems.find((item) => pathname === item.href) ||
                  (pathname?.startsWith("/admin/datadiri")
                    ? { label: "Data Diri Admin", icon: "👤" }
                    : { label: "Admin Panel", icon: "💻" });
                return (
                  <>
                    <span style={{ fontSize: "1.1rem" }}>{current.icon}</span>
                    <h2
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 800,
                        color: "var(--text-contrast)",
                        margin: 0,
                        letterSpacing: "-0.2px",
                      }}
                    >
                      {current.label}
                    </h2>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Sisi Kanan: Search Bar Aktif (Kompak) & Profil Pengguna */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            {/* Search Input Aktif & Kompak */}
            <div style={{ position: "relative" }} ref={searchContainerRef}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "var(--bg-card)",
                  border: `1px solid ${searchFocused ? "var(--clr-primary)" : "var(--glass-border)"}`,
                  borderRadius: "var(--radius-full)",
                  padding: "0.25rem 0.65rem",
                  gap: "0.35rem",
                  boxShadow: searchFocused ? "0 0 0 2px rgba(59, 130, 246, 0.2)" : "none",
                  transition: "all var(--t-fast)",
                  width: "195px",
                }}
              >
                <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>🔍</span>
                <input
                  type="text"
                  placeholder="Cari menu... (Enter)"
                  value={topbarSearchQuery}
                  onChange={(e) => setTopbarSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onKeyDown={(e) => {
                    const q = topbarSearchQuery.toLowerCase().trim();
                    const matches = visibleMenus.filter((m) =>
                      m.label.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)
                    );
                    if (e.key === "Enter" && matches.length > 0) {
                      router.push(matches[0].href);
                      setSearchFocused(false);
                      setTopbarSearchQuery("");
                    } else if (e.key === "Escape") {
                      setSearchFocused(false);
                    }
                  }}
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    color: "var(--text-contrast)",
                    fontSize: "0.75rem",
                    width: "100%",
                  }}
                />
                {topbarSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setTopbarSearchQuery("")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: "0.7rem",
                      padding: 0,
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Dropdown Hasil Pencarian Menu */}
              {searchFocused && topbarSearchQuery.trim() && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    right: 0,
                    width: "230px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
                    zIndex: 1100,
                    overflow: "hidden",
                    padding: "0.35rem",
                  }}
                >
                  {(() => {
                    const q = topbarSearchQuery.toLowerCase().trim();
                    const matches = visibleMenus.filter((m) =>
                      m.label.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)
                    );
                    return (
                      <>
                        <div
                          style={{
                            fontSize: "0.62rem",
                            color: "var(--text-muted)",
                            padding: "0.25rem 0.5rem",
                            textTransform: "uppercase",
                            fontWeight: 700,
                          }}
                        >
                          Menu Ditemukan ({matches.length})
                        </div>
                        {matches.length > 0 ? (
                          matches.map((item) => (
                            <Link
                              key={item.id}
                              href={item.href}
                              onClick={() => {
                                setSearchFocused(false);
                                setTopbarSearchQuery("");
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.45rem",
                                padding: "0.4rem 0.55rem",
                                borderRadius: "var(--radius-sm)",
                                fontSize: "0.78rem",
                                color: "var(--text-contrast)",
                                textDecoration: "none",
                                fontWeight: 600,
                                transition: "background var(--t-fast)",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              <span style={{ fontSize: "0.9rem" }}>{item.icon}</span>
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {item.label}
                              </span>
                            </Link>
                          ))
                        ) : (
                          <div style={{ padding: "0.6rem 0.5rem", textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            Menu tidak ditemukan
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Profile Menu Trigger & Popup */}
            <div style={{ display: "flex", alignItems: "center", position: "relative" }} ref={profileMenuRef}>
              {/* Profile Trigger Button */}
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                aria-expanded={profileDropdownOpen}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.55rem",
                  padding: "0.2rem 0.6rem 0.2rem 0.25rem",
                  background: profileDropdownOpen ? "var(--bg-hover)" : "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-full)",
                  cursor: "pointer",
                  transition: "all var(--t-fast)",
                  color: "var(--text-contrast)",
                }}
                title="Profil Pengguna & Opsi"
              >
                {adminUser.avatar ? (
                  <img
                    key={adminUser.avatar}
                    src={adminUser.avatar}
                    alt={adminUser.name}
                    referrerPolicy="no-referrer"
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: `2px solid ${roleMeta.color}`,
                      boxShadow: `0 0 10px ${roleMeta.color}50`,
                      flexShrink: 0,
                      display: "block",
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${roleMeta.color}, #3b82f6)`,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.85rem",
                      fontWeight: 900,
                      boxShadow: `0 0 10px ${roleMeta.color}40`,
                      flexShrink: 0,
                    }}
                  >
                    {adminUser.name ? adminUser.name.charAt(0).toUpperCase() : "A"}
                  </div>
                )}

                <div style={{ textAlign: "left", display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, lineHeight: 1.2 }}>
                    {adminUser.name || "Admin"}
                  </span>
                  <span style={{ fontSize: "0.68rem", color: roleMeta.color, fontWeight: 700 }}>
                    {roleMeta.name}
                  </span>
                </div>

                <span
                  style={{
                    fontSize: "0.65rem",
                    color: "var(--text-muted)",
                    transition: "transform 0.2s ease",
                    transform: profileDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                    marginLeft: "2px",
                  }}
                >
                  ▼
                </span>
              </button>

            {/* Profile Dropdown Popup */}
            {profileDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: "290px",
                  maxHeight: "calc(100vh - 75px)",
                  overflowY: "auto",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "0 14px 40px rgba(0,0,0,0.4), 0 0 0 1px var(--glass-border)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  zIndex: 1000,
                  padding: "0.7rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  scrollbarWidth: "thin",
                }}
              >
                {/* 1. Mini Profil Ringkas */}
                <div style={{
                  padding: "0.5rem 0.65rem",
                  background: "var(--bg-card)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--glass-border)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem"
                }}>
                  {adminUser.avatar ? (
                    <img
                      src={adminUser.avatar}
                      alt={adminUser.name}
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: `1.5px solid ${roleMeta.color}`,
                        boxShadow: `0 2px 8px ${roleMeta.color}40`,
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${roleMeta.color}, #3b82f6)`,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1rem",
                        fontWeight: 900,
                        flexShrink: 0,
                        boxShadow: `0 2px 8px ${roleMeta.color}40`
                      }}
                    >
                      {adminUser.name ? adminUser.name.charAt(0).toUpperCase() : "A"}
                    </div>
                  )}
                  <div style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 800,
                      fontSize: "0.84rem",
                      color: "var(--text-contrast)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      {adminUser.name}
                    </div>
                    <div style={{ display: "flex", gap: "4px", alignItems: "center", marginTop: "2px" }}>
                      <span style={{
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        color: roleMeta.color,
                        background: `${roleMeta.color}15`,
                        border: `1px solid ${roleMeta.color}40`,
                        padding: "0 5px",
                        borderRadius: "3px",
                        whiteSpace: "nowrap"
                      }}>
                        {roleMeta.icon} {roleMeta.name}
                      </span>
                      <span style={{
                        fontSize: "0.62rem",
                        color: "var(--text-muted)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}>
                        {adminUser.defaultScope || "Global"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Menu Utama Profil */}
                <Link
                  href="/admin/datadiri"
                  onClick={() => setProfileDropdownOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.55rem",
                    padding: "0.45rem 0.65rem",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: pathname === "/admin/datadiri" ? "var(--clr-primary)" : "var(--text-contrast)",
                    textDecoration: "none",
                    background: pathname === "/admin/datadiri" ? "var(--bg-card)" : "transparent",
                    border: "1px solid",
                    borderColor: pathname === "/admin/datadiri" ? "var(--glass-border)" : "transparent",
                    transition: "background var(--t-fast)"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = pathname === "/admin/datadiri" ? "var(--bg-card)" : "transparent")}
                >
                  <span style={{ fontSize: "1rem" }}>👤</span>
                  <span style={{ flex: 1 }}>Lihat Profil Admin</span>
                  <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>→</span>
                </Link>

                <div style={{ height: "1px", background: "var(--glass-border)" }} />

                {/* 3. Menu Akses Ringkas (2-Column Grid agar semua menu terlihat langsung) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <div style={{
                    fontSize: "0.64rem",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    padding: "0 0.2rem",
                    fontWeight: 800,
                    letterSpacing: "0.5px"
                  }}>
                    Menu Akses ({visibleMenus.length})
                  </div>

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "4px",
                  }}>
                    {visibleMenus.map((menu) => {
                      const isCurrent = pathname === menu.href;
                      return (
                        <Link
                          key={menu.id}
                          href={menu.href}
                          onClick={() => setProfileDropdownOpen(false)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            padding: "0.35rem 0.45rem",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "0.72rem",
                            fontWeight: isCurrent ? 700 : 500,
                            color: isCurrent ? "var(--clr-primary)" : "var(--text-contrast)",
                            textDecoration: "none",
                            background: isCurrent ? "var(--bg-card)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${isCurrent ? "var(--clr-primary)40" : "var(--glass-border)"}`,
                            transition: "all var(--t-fast)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = isCurrent ? "var(--bg-card)" : "rgba(255,255,255,0.03)")}
                          title={menu.label}
                        >
                          <span style={{ fontSize: "0.85rem", flexShrink: 0 }}>{menu.icon}</span>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                            {menu.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div style={{ height: "1px", background: "var(--glass-border)" }} />

                {/* 4. Toko Publik & Pengaturan Tema (Compact Row) */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.35rem 0.55rem",
                  background: "var(--bg-card)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--glass-border)",
                  gap: "0.5rem"
                }}>
                  <Link
                    href="/"
                    target="_blank"
                    onClick={() => setProfileDropdownOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      fontSize: "0.74rem",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      textDecoration: "none",
                    }}
                    title="Buka Website Toko Publik"
                  >
                    <span>🌐</span>
                    <span>Toko Publik ↗</span>
                  </Link>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <ThemeToggle />
                  </div>
                </div>

                {/* 5. Keluar Akun (Logout) Ringkas */}
                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    handleLogout();
                  }}
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
                    transition: "all var(--t-fast)"
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "hsla(0, 80%, 58%, 0.22)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "hsla(0, 80%, 58%, 0.12)")}
                >
                  <span style={{ fontSize: "0.95rem" }}>🚪</span>
                  <span>Keluar Akun (Logout)</span>
                </button>
              </div>
            )}
          </div>
          </div>
        </header>

        <main className={styles.mainContent}>{children}</main>
      </div>
    </div>
  );
}
