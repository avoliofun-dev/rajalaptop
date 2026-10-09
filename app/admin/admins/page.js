"use client";

import { useEffect, useState, useMemo } from "react";

const ROLE_CONFIG = {
  super_admin: {
    label: "Super Admin",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.15)",
    icon: "⚡",
    division: "IT & Infrastruktur Sistem",
    defaultScope: "ALL (Global)",
    desc: "Akses penuh seluruh modul, keamanan, dan pengaturan sistem",
    modules: ["Dashboard", "Katalog Laptop", "Penjualan & POS", "Serial/IMEI", "Approval Otorisasi", "Tiket Servis", "Audit Trail", "Role & Izin RBAC", "Staf Admin", "Pengaturan Web"],
  },
  owner: {
    label: "Owner",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.15)",
    icon: "👑",
    division: "Direksi & Pemilik Bisnis",
    defaultScope: "ALL (Global)",
    desc: "Pemilik usaha, akses penuh operasional, analitik, dan laporan",
    modules: ["Dashboard Global", "Katalog Laptop", "Penjualan & POS", "Serial/IMEI", "Approval Otorisasi", "Tiket Servis", "Audit Trail", "Staf Admin", "Pengaturan Web"],
  },
  manajer_area: {
    label: "Manajer Area",
    color: "#a855f7",
    bg: "rgba(168, 85, 247, 0.15)",
    icon: "🏢",
    division: "Operasional Regional Area",
    defaultScope: "AREA (Multi Cabang)",
    desc: "Supervisi cabang dalam area regional, mutasi stok & approval",
    modules: ["Dashboard Area", "Katalog Multi-Cabang", "Approval Diskon Area", "Mutasi Stok Antar Cabang", "Audit Trail Area"],
  },
  kepala_toko: {
    label: "Kepala Toko",
    color: "#6366f1",
    bg: "rgba(99, 102, 241, 0.15)",
    icon: "🏪",
    division: "Manajemen Toko Cabang",
    defaultScope: "STORE (Toko Cabang)",
    desc: "Mengelola toko cabang, otorisasi transaksi, staf & stok lokal",
    modules: ["Dashboard Toko", "Katalog Laptop", "Penjualan & POS", "Approval Diskon Cabang", "Serial Number Toko", "Tiket Servis Cabang"],
  },
  kasir: {
    label: "Kasir",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.15)",
    icon: "🛒",
    division: "Frontliner Penjualan Ritel",
    defaultScope: "STORE / OWN",
    desc: "Transaksi penjualan terminal POS, cetak struk & pengajuan diskon",
    modules: ["Penjualan & Kasir POS", "Katalog Laptop (Cek Stok)", "Tiket Servis Pelanggan"],
  },
  gudang: {
    label: "Gudang",
    color: "#f97316",
    bg: "rgba(249, 115, 22, 0.15)",
    icon: "📦",
    division: "Logistik & Pergudangan",
    defaultScope: "STORE / AREA",
    desc: "Penerimaan barang distributor, pelacakan serial IMEI & stock opname",
    modules: ["Katalog & Kontrol Stok", "Serial Number & IMEI Laptop", "Penerimaan Unit Servis"],
  },
  finance: {
    label: "Finance",
    color: "#ec4899",
    bg: "rgba(236, 72, 153, 0.15)",
    icon: "💰",
    division: "Keuangan & Akuntansi",
    defaultScope: "ALL / STORE",
    desc: "Keuangan, pencatatan kas masuk/keluar & laporan transaksi",
    modules: ["Dashboard Finansial", "Laporan Penjualan POS", "Rekonsiliasi Kas", "Approval Keuangan"],
  },
  audit: {
    label: "Audit",
    color: "#64748b",
    bg: "rgba(100, 116, 139, 0.15)",
    icon: "🛡️",
    division: "Kepatuhan & Pengawasan Internal",
    defaultScope: "ALL (Read Only)",
    desc: "Pemeriksaan log sistem, kepatuhan integritas stok & transaksi",
    modules: ["Audit Trail Forensik", "Pemeriksaan Mutasi Stok", "Monitoring Log Keamanan"],
  },
  digital_marketing: {
    label: "Digital Marketing",
    color: "#06b6d4",
    bg: "rgba(6, 182, 212, 0.15)",
    icon: "📣",
    division: "Pemasaran & Konten Digital",
    defaultScope: "GLOBAL",
    desc: "Katalog laptop online, promo diskon & voucher promosi",
    modules: ["Katalog Laptop Online", "Pengaturan Promo & Diskon", "Pengaturan Konten Web"],
  },
};

export default function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [currentAdminUser, setCurrentAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editAdmin, setEditAdmin] = useState(null);
  const [popupAdmin, setPopupAdmin] = useState(null);

  // Standalone Dedicated Photo Modal State
  const [photoAdmin, setPhotoAdmin] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);

  // Form State for Add
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "kasir",
    status: "active",
  });

  // Form State for Edit Data Admin (murni data diri & akun)
  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    email: "",
    role: "kasir",
    status: "active",
    password: "",
  });

  const openPhotoModal = (admin) => {
    setPhotoAdmin(admin);
    setPhotoUrl(admin.avatar || "");
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("Ukuran file foto maksimal 5MB", "error");
      return;
    }
    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avatars");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah foto profil");
      setPhotoUrl(data.url);
      showToast("Foto profil berhasil diunggah! Klik 'Simpan Foto' untuk menyimpan.");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSavePhoto = async () => {
    if (!photoAdmin) return;
    try {
      setSavingPhoto(true);
      const res = await fetch("/api/admins", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: photoAdmin.id,
          avatar: photoUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menyimpan foto profil");
      }
      setAdmins((prev) =>
        prev.map((adm) => (adm.id === photoAdmin.id ? { ...adm, avatar: photoUrl } : adm))
      );
      if (currentAdminUser && currentAdminUser.id === photoAdmin.id) {
        setCurrentAdminUser((prev) => (prev ? { ...prev, avatar: photoUrl } : null));
        window.dispatchEvent(new Event("authStateChange"));
      }
      if (popupAdmin && popupAdmin.id === photoAdmin.id) {
        setPopupAdmin((prev) => (prev ? { ...prev, avatar: photoUrl } : null));
      }
      showToast(`Foto profil "${photoAdmin.name}" berhasil diperbarui!`);
      setPhotoAdmin(null);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSavingPhoto(false);
    }
  };

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 3500);
  };

  const fetchCurrentAdmin = async () => {
    try {
      const res = await fetch("/api/auth/admin/me");
      if (res.ok) {
        const data = await res.json();
        setCurrentAdminUser(data.user);
      }
    } catch (e) {
      console.error("Gagal mendapatkan session admin:", e);
    }
  };

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admins");
      const data = await res.json();
      if (data.success) {
        setAdmins(data.admins || []);
      }
    } catch (e) {
      console.error("Gagal mengambil data admin:", e);
      showToast("Gagal memuat daftar admin dari server", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentAdmin();
    fetchAdmins();
  }, []);

  // Filtered admins
  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const matchSearch =
        (admin.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (admin.email || "").toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "all" || admin.role === roleFilter;
      const matchStatus = statusFilter === "all" || (admin.status || "active") === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [admins, search, roleFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = admins.length;
    const activeCount = admins.filter((a) => (a.status || "active") === "active").length;
    const inactiveCount = admins.filter((a) => a.status === "inactive" || a.status === "nonaktif").length;
    const superAdmins = admins.filter((a) => a.role === "super_admin" || a.role === "owner").length;
    return { total, activeCount, inactiveCount, superAdmins };
  }, [admins]);

  // Add Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menambah admin");

      showToast(`✅ Admin "${addForm.name}" berhasil ditambahkan!`);
      setAddForm({ name: "", email: "", password: "", role: "kasir", status: "active" });
      setShowAddModal(false);
      await fetchAdmins();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal (Khusus Data Akun & Role)
  const openEditModal = (admin) => {
    setEditForm({
      id: admin.id,
      name: admin.name || "",
      email: admin.email || "",
      role: admin.role || "kasir",
      status: admin.status || "active",
      password: "",
    });
    setEditAdmin(admin);
  };

  // Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        id: editForm.id,
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        status: editForm.status,
      };
      if (editAdmin?.avatar) {
        payload.avatar = editAdmin.avatar;
      }
      if (editForm.password && editForm.password.trim().length > 0) {
        payload.password = editForm.password.trim();
      }

      const res = await fetch("/api/admins", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui admin");

      showToast(`💾 Perubahan akun admin "${editForm.name}" berhasil disimpan!`);
      setEditAdmin(null);
      await fetchAdmins();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Toggle Status (Active / Inactive)
  const handleToggleStatus = async (admin) => {
    const currentStatus = admin.status || "active";
    const nextStatus = currentStatus === "active" ? "inactive" : "active";

    // Safety checks
    if (currentAdminUser && currentAdminUser.id === admin.id && nextStatus === "inactive") {
      alert("⚠️ Anda tidak dapat menonaktifkan akun yang sedang Anda gunakan saat ini.");
      return;
    }

    const actionText = nextStatus === "inactive" ? "menonaktifkan" : "mengaktifkan kembali";
    if (!confirm(`Yakin ingin ${actionText} akun admin "${admin.name}"?`)) return;

    // Optimistic UI update
    setAdmins((prev) =>
      prev.map((a) => (a.id === admin.id ? { ...a, status: nextStatus } : a))
    );

    try {
      const res = await fetch("/api/admins", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: admin.id, status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah status admin");

      const statusMsg = nextStatus === "active" ? "diaktifkan kembali" : "dinonaktifkan";
      showToast(`Status akun "${admin.name}" berhasil ${statusMsg}.`);
      await fetchAdmins();
    } catch (e) {
      showToast(e.message, "error");
      await fetchAdmins();
    }
  };

  // Delete Admin
  const handleDelete = async (id, name) => {
    if (currentAdminUser && currentAdminUser.id === id) {
      alert("⚠️ Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }

    if (!confirm(`Hapus akun admin "${name}"? Tindakan ini permanen dan tidak dapat dibatalkan.`)) return;
    try {
      const res = await fetch(`/api/admins?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus admin");

      showToast(`🗑️ Akun admin "${name}" berhasil dihapus.`);
      await fetchAdmins();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", maxWidth: "1280px", margin: "0 auto" }}>
      {/* Toast Notification */}
      {toast.message && (
        <div
          style={{
            position: "fixed",
            top: "80px",
            right: "2rem",
            background: toast.type === "error" ? "var(--clr-danger)" : "var(--clr-primary)",
            color: "#fff",
            padding: "0.85rem 1.5rem",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-lg)",
            zIndex: 9999,
            fontWeight: 600,
            fontSize: "0.875rem",
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-contrast)" }}>
              Kelola Admin & Hak Akses
            </h1>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "3px 8px",
                background: "hsla(220, 90%, 56%, 0.15)",
                color: "var(--clr-primary)",
                borderRadius: "var(--radius-full)",
                fontWeight: 700,
              }}
            >
              MySQL admin_users
            </span>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
            Kelola akun staf, kontrol status aktif/nonaktif, pembagian role (Kasir, Finance, Gudang, Owner), dan kredensial login.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
          style={{
            padding: "0.65rem 1.4rem",
            fontSize: "0.9rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontWeight: 700,
          }}
        >
          <span>+</span>
          <span>Tambah Admin Baru</span>
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "1rem",
        }}
      >
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-lg)",
            padding: "1.2rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "var(--radius-md)",
              background: "hsla(220, 90%, 56%, 0.15)",
              color: "var(--clr-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.3rem",
            }}
          >
            👥
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Total Admin
            </div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-contrast)" }}>
              {stats.total}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-lg)",
            padding: "1.2rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "var(--radius-md)",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.3rem",
            }}
          >
            🟢
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Akun Aktif
            </div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#10b981" }}>
              {stats.activeCount}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-lg)",
            padding: "1.2rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "var(--radius-md)",
              background: "rgba(239, 68, 68, 0.15)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.3rem",
            }}
          >
            ⏸️
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Akun Nonaktif
            </div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#ef4444" }}>
              {stats.inactiveCount}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--radius-lg)",
            padding: "1.2rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "var(--radius-md)",
              background: "rgba(245, 158, 11, 0.15)",
              color: "#f59e0b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.3rem",
            }}
          >
            👑
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
              Super Admin & Owner
            </div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f59e0b" }}>
              {stats.superAdmins}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--radius-lg)",
          padding: "1rem 1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ flex: 1, minWidth: "260px" }}>
          <input
            type="text"
            placeholder="🔍 Cari nama admin atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.65rem 1rem",
              background: "var(--bg-card)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-contrast)",
              fontSize: "0.85rem",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          {/* Status Filter */}
          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "0.65rem 0.9rem",
                background: "var(--bg-card)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-contrast)",
                fontSize: "0.85rem",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="all">Semua Status</option>
              <option value="active">🟢 Hanya Aktif ({stats.activeCount})</option>
              <option value="inactive">🔴 Hanya Nonaktif ({stats.inactiveCount})</option>
            </select>
          </div>

          {/* Role Filter */}
          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                padding: "0.65rem 0.9rem",
                background: "var(--bg-card)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-contrast)",
                fontSize: "0.85rem",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="all">Semua Role ({admins.length})</option>
              {Object.keys(ROLE_CONFIG).map((rk) => (
                <option key={rk} value={rk}>
                  {ROLE_CONFIG[rk].label}
                </option>
              ))}
            </select>
          </div>

          {(search || roleFilter !== "all" || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setRoleFilter("all");
                setStatusFilter("all");
              }}
              style={{
                padding: "0.65rem 0.9rem",
                background: "transparent",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-muted)",
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Admins Table */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--glass-border)", color: "var(--text-secondary)" }}>
                <th style={{ padding: "0.9rem 1.25rem" }}>Nama Admin</th>
                <th style={{ padding: "0.9rem 1rem" }}>Email Login</th>
                <th style={{ padding: "0.9rem 1rem" }}>Role & Hak Akses</th>
                <th style={{ padding: "0.9rem 1rem" }}>Status Akun</th>
                <th style={{ padding: "0.9rem 1rem" }}>Terdaftar</th>
                <th style={{ padding: "0.9rem 1.25rem", textAlign: "right" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                    Memuat data admin dari database...
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                    Tidak ada admin yang sesuai dengan kriteria pencarian / filter.
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => {
                  const roleMeta = ROLE_CONFIG[admin.role] || {
                    label: admin.role,
                    color: "var(--clr-primary)",
                    bg: "hsla(220, 90%, 56%, 0.15)",
                    desc: "Akses standar",
                  };
                  const initials = (admin.name || "A")
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();
                  const isActive = (admin.status || "active") === "active";
                  const isCurrentLoggedUser = currentAdminUser && currentAdminUser.id === admin.id;

                  return (
                    <tr
                      key={admin.id}
                      style={{
                        borderBottom: "1px solid var(--glass-border)",
                        background: !isActive ? "rgba(239, 68, 68, 0.03)" : "transparent",
                        transition: "background 0.15s ease",
                      }}
                    >
                      <td style={{ padding: "1rem 1.25rem" }}>
                        <div
                          onClick={() => setPopupAdmin(admin)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            cursor: "pointer",
                            width: "fit-content",
                          }}
                          title={`Klik untuk membuka pop-up profil ${admin.name}`}
                        >
                          {admin.avatar ? (
                            <img
                              src={admin.avatar}
                              alt={admin.name}
                              style={{
                                width: "38px",
                                height: "38px",
                                borderRadius: "var(--radius-full)",
                                objectFit: "cover",
                                border: `1px solid ${!isActive ? "#ef444444" : roleMeta.color + "55"}`,
                                flexShrink: 0,
                                boxShadow: `0 2px 8px ${roleMeta.color}25`,
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "38px",
                                height: "38px",
                                borderRadius: "var(--radius-full)",
                                background: !isActive ? "rgba(239, 68, 68, 0.15)" : roleMeta.bg,
                                color: !isActive ? "#ef4444" : roleMeta.color,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                fontSize: "0.85rem",
                                border: `1px solid ${!isActive ? "#ef444444" : roleMeta.color + "33"}`,
                                flexShrink: 0,
                                boxShadow: `0 2px 8px ${roleMeta.color}25`,
                                transition: "transform 0.15s ease",
                              }}
                            >
                              {initials}
                            </div>
                          )}
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                              <strong
                                style={{
                                  color: "var(--text-contrast)",
                                  fontSize: "0.9rem",
                                  transition: "color 0.15s ease",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--clr-primary)")}
                                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-contrast)")}
                              >
                                {admin.name}
                              </strong>
                              {isCurrentLoggedUser && (
                                <span
                                  style={{
                                    fontSize: "0.65rem",
                                    padding: "1px 6px",
                                    borderRadius: "var(--radius-full)",
                                    background: "rgba(59, 130, 246, 0.2)",
                                    color: "#3b82f6",
                                    fontWeight: 700,
                                  }}
                                >
                                  Anda
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              ID: {admin.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "1rem", color: "var(--text-secondary)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <span>✉️</span>
                          <span style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>{admin.email}</span>
                        </div>
                      </td>

                      <td style={{ padding: "1rem" }}>
                        <div>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              padding: "3px 10px",
                              borderRadius: "var(--radius-full)",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              background: roleMeta.bg,
                              color: roleMeta.color,
                              border: `1px solid ${roleMeta.color}44`,
                            }}
                          >
                            <span
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: roleMeta.color,
                              }}
                            />
                            {roleMeta.label}
                          </span>
                          <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
                            {roleMeta.desc}
                          </span>
                        </div>
                      </td>

                      {/* Status Column with Active/Inactive Badge & Toggle */}
                      <td style={{ padding: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              padding: "2px 8px",
                              borderRadius: "var(--radius-full)",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              background: isActive ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                              color: isActive ? "#10b981" : "#ef4444",
                              border: `1px solid ${isActive ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                            }}
                          >
                            <span
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: isActive ? "#10b981" : "#ef4444",
                              }}
                            />
                            {isActive ? "Aktif" : "Nonaktif"}
                          </span>

                          {/* Quick Toggle Button */}
                          <button
                            onClick={() => handleToggleStatus(admin)}
                            disabled={isCurrentLoggedUser}
                            title={
                              isCurrentLoggedUser
                                ? "Anda tidak dapat menonaktifkan akun sendiri"
                                : isActive
                                ? "Klik untuk menonaktifkan akun admin ini"
                                : "Klik untuk mengaktifkan kembali akun admin ini"
                            }
                            style={{
                              background: "var(--bg-card)",
                              border: "1px solid var(--glass-border)",
                              color: isActive ? "#f59e0b" : "#10b981",
                              padding: "3px 8px",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              cursor: isCurrentLoggedUser ? "not-allowed" : "pointer",
                              opacity: isCurrentLoggedUser ? 0.4 : 1,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                            }}
                          >
                            <span>{isActive ? "⏸️" : "▶️"}</span>
                            <span>{isActive ? "Nonaktifkan" : "Aktifkan"}</span>
                          </button>
                        </div>
                      </td>

                      <td style={{ padding: "1rem", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                        {formatDate(admin.created_at)}
                      </td>

                      <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                          <button
                            onClick={() => setPopupAdmin(admin)}
                            style={{
                              background: "rgba(59, 130, 246, 0.12)",
                              border: "1px solid rgba(59, 130, 246, 0.35)",
                              color: "#3b82f6",
                              padding: "5px 11px",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "0.75rem",
                              cursor: "pointer",
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              transition: "all 0.15s ease",
                            }}
                            title={`Buka Pop-up Profil untuk ${admin.name}`}
                          >
                            <span>👤</span>
                            <span>Pop-up Profil</span>
                          </button>
                          <button
                            onClick={() => openPhotoModal(admin)}
                            style={{
                              background: "rgba(168, 85, 247, 0.12)",
                              border: "1px solid rgba(168, 85, 247, 0.35)",
                              color: "#a855f7",
                              padding: "5px 11px",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "0.75rem",
                              cursor: "pointer",
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              transition: "all 0.15s ease",
                            }}
                            title={`Edit Foto Profil untuk ${admin.name}`}
                          >
                            <span>📸</span>
                            <span>Edit Foto</span>
                          </button>
                          <button
                            onClick={() => openEditModal(admin)}
                            style={{
                              background: "var(--bg-card)",
                              border: "1px solid var(--glass-border)",
                              color: "var(--clr-primary)",
                              padding: "5px 12px",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "0.75rem",
                              cursor: "pointer",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                            }}
                            title={`Edit Data Akun & Role ${admin.name}`}
                          >
                            <span>✏️</span>
                            <span>Edit Data</span>
                          </button>
                          <button
                            onClick={() => handleDelete(admin.id, admin.name)}
                            disabled={isCurrentLoggedUser}
                            style={{
                              background: "hsla(0, 80%, 58%, 0.1)",
                              border: "1px solid var(--clr-danger)",
                              color: "#ff8b8b",
                              padding: "5px 10px",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "0.75rem",
                              cursor: isCurrentLoggedUser ? "not-allowed" : "pointer",
                              opacity: isCurrentLoggedUser ? 0.4 : 1,
                              fontWeight: 600,
                            }}
                            title={isCurrentLoggedUser ? "Tidak dapat menghapus akun sendiri" : "Hapus Admin"}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: TAMBAH ADMIN BARU ── */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 999,
          }}
        >
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-xl)",
              width: "100%",
              maxWidth: "520px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-contrast)" }}>
                  Tambah Pengguna Admin Baru
                </h2>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Buat akun staf atau pimpinan dengan role hak akses dan status spesifik.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                  Nama Lengkap Admin <span style={{ color: "var(--clr-danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Rian Anggara"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.9rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-contrast)",
                    outline: "none",
                    fontSize: "0.85rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                  Email Login <span style={{ color: "var(--clr-danger)" }}>*</span>
                </label>
                <input
                  type="email"
                  placeholder="Contoh: rian@rajalaptop.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.9rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-contrast)",
                    outline: "none",
                    fontSize: "0.85rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                  Password Awal <span style={{ color: "var(--clr-danger)" }}>*</span>
                </label>
                <input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  required
                  minLength={6}
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.9rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-contrast)",
                    outline: "none",
                    fontSize: "0.85rem",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Role & Otoritas Akses <span style={{ color: "var(--clr-danger)" }}>*</span>
                  </label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.9rem",
                      background: "var(--bg-card)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-contrast)",
                      outline: "none",
                      fontSize: "0.85rem",
                    }}
                  >
                    {Object.keys(ROLE_CONFIG).map((rk) => (
                      <option key={rk} value={rk}>
                        {ROLE_CONFIG[rk].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Status Awal
                  </label>
                  <select
                    value={addForm.status}
                    onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.9rem",
                      background: "var(--bg-card)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-contrast)",
                      outline: "none",
                      fontSize: "0.85rem",
                    }}
                  >
                    <option value="active">🟢 Aktif</option>
                    <option value="inactive">🔴 Nonaktif</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{ flex: 1, padding: "0.75rem", opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? "Menyimpan..." : "Simpan Admin"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-outline"
                  style={{ padding: "0.75rem 1.25rem" }}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT ADMIN ── */}
      {editAdmin && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 999,
          }}
        >
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-xl)",
              width: "100%",
              maxWidth: "520px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "2rem",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-contrast)" }}>
                  Edit Data Admin
                </h2>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Perbarui nama, email, role, status aktif, atau reset password.
                </p>
              </div>
              <button
                onClick={() => setEditAdmin(null)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.9rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-contrast)",
                    outline: "none",
                    fontSize: "0.85rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                  Email Login
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.9rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-contrast)",
                    outline: "none",
                    fontSize: "0.85rem",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Role & Otoritas Akses
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.9rem",
                      background: "var(--bg-card)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-contrast)",
                      outline: "none",
                      fontSize: "0.85rem",
                    }}
                  >
                    {Object.keys(ROLE_CONFIG).map((rk) => (
                      <option key={rk} value={rk}>
                        {ROLE_CONFIG[rk].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                    Status Akun
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.9rem",
                      background: "var(--bg-card)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "var(--radius-md)",
                      color: "var(--text-contrast)",
                      outline: "none",
                      fontSize: "0.85rem",
                    }}
                  >
                    <option value="active">🟢 Aktif</option>
                    <option value="inactive">🔴 Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.3rem" }}>
                  Password Baru (Opsional)
                </label>
                <input
                  type="password"
                  placeholder="Kosongkan jika tidak ingin mengubah password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  minLength={6}
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.9rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-contrast)",
                    outline: "none",
                    fontSize: "0.85rem",
                  }}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px", display: "block" }}>
                  Hanya isi jika ingin mereset password akun admin ini.
                </span>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{ flex: 1, padding: "0.75rem", opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditAdmin(null)}
                  className="btn-outline"
                  style={{ padding: "0.75rem 1.25rem" }}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: POP-UP PROFIL SEMUA ADMIN ── */}
      {popupAdmin && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 1000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPopupAdmin(null);
          }}
        >
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-xl)",
              width: "100%",
              maxWidth: "580px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--glass-border)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header Hero Banner with Role Theme Color */}
            <div
              style={{
                padding: "1.5rem 1.75rem 1.25rem",
                background: `linear-gradient(135deg, ${(ROLE_CONFIG[popupAdmin.role] || {}).color || "#3b82f6"}25, var(--bg-card))`,
                borderBottom: "1px solid var(--glass-border)",
                position: "relative",
              }}
            >
              <button
                type="button"
                onClick={() => setPopupAdmin(null)}
                style={{
                  position: "absolute",
                  top: "1.25rem",
                  right: "1.25rem",
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
                  fontSize: "1rem",
                  fontWeight: "bold",
                }}
                title="Tutup Pop-up"
              >
                ✕
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  {popupAdmin.avatar ? (
                    <img
                      src={popupAdmin.avatar}
                      alt={popupAdmin.name}
                      style={{
                        width: "58px",
                        height: "58px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: `2.5px solid ${(ROLE_CONFIG[popupAdmin.role] || {}).color || "#3b82f6"}`,
                        boxShadow: `0 4px 16px ${(ROLE_CONFIG[popupAdmin.role] || {}).color || "#3b82f6"}60`,
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "58px",
                        height: "58px",
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${(ROLE_CONFIG[popupAdmin.role] || {}).color || "#3b82f6"}, #1d4ed8)`,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        fontSize: "1.3rem",
                        boxShadow: `0 4px 16px ${(ROLE_CONFIG[popupAdmin.role] || {}).color || "#3b82f6"}60`,
                      }}
                    >
                      {(popupAdmin.name || "A")
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => openPhotoModal(popupAdmin)}
                    style={{
                      position: "absolute",
                      bottom: "-2px",
                      right: "-2px",
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "var(--bg-surface)",
                      border: "1.5px solid var(--glass-border)",
                      color: "var(--text-contrast)",
                      fontSize: "0.7rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                      padding: 0,
                    }}
                    title="Ganti Foto Profil"
                  >
                    📸
                  </button>
                </div>

                <div style={{ flex: 1, minWidth: 0, paddingRight: "2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <h3
                      style={{
                        fontSize: "1.2rem",
                        fontWeight: 800,
                        color: "var(--text-contrast)",
                        margin: 0,
                      }}
                    >
                      {popupAdmin.name}
                    </h3>
                    {currentAdminUser && currentAdminUser.id === popupAdmin.id && (
                      <span
                        style={{
                          fontSize: "0.65rem",
                          padding: "2px 8px",
                          borderRadius: "var(--radius-full)",
                          background: "rgba(59, 130, 246, 0.2)",
                          color: "#3b82f6",
                          fontWeight: 700,
                        }}
                      >
                        Akun Anda
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.35rem", flexWrap: "wrap" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        padding: "2px 8px",
                        borderRadius: "var(--radius-full)",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        background: (ROLE_CONFIG[popupAdmin.role] || {}).bg || "rgba(59,130,246,0.15)",
                        color: (ROLE_CONFIG[popupAdmin.role] || {}).color || "#3b82f6",
                        border: `1px solid ${(ROLE_CONFIG[popupAdmin.role] || {}).color || "#3b82f6"}40`,
                      }}
                    >
                      <span>{(ROLE_CONFIG[popupAdmin.role] || {}).icon || "👤"}</span>
                      <span>{(ROLE_CONFIG[popupAdmin.role] || {}).label || popupAdmin.role}</span>
                    </span>

                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        padding: "2px 8px",
                        borderRadius: "var(--radius-full)",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        background: (popupAdmin.status || "active") === "active" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                        color: (popupAdmin.status || "active") === "active" ? "#10b981" : "#ef4444",
                        border: `1px solid ${(popupAdmin.status || "active") === "active" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: (popupAdmin.status || "active") === "active" ? "#10b981" : "#ef4444",
                        }}
                      />
                      {(popupAdmin.status || "active") === "active" ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pop-up Body Content */}
            <div style={{ padding: "1.5rem 1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* 1. Identity & Assignment Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "0.85rem",
                  background: "var(--bg-card)",
                  padding: "1rem",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--glass-border)",
                }}
              >
                <div>
                  <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    ID Staf Admin
                  </span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-contrast)", fontFamily: "monospace" }}>
                    {popupAdmin.id}
                  </span>
                </div>

                <div>
                  <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Email Akun
                  </span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--clr-primary)" }}>
                    {popupAdmin.email}
                  </span>
                </div>

                <div>
                  <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    No. Telepon / WhatsApp
                  </span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-contrast)" }}>
                    {popupAdmin.phone ? (
                      <a
                        href={`https://wa.me/${String(popupAdmin.phone).replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#10b981", textDecoration: "underline" }}
                      >
                        💬 {popupAdmin.phone}
                      </a>
                    ) : (
                      "Belum dicantumkan"
                    )}
                  </span>
                </div>

                <div>
                  <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Penugasan Cabang Toko
                  </span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-contrast)" }}>
                    🏪 {popupAdmin.store_name || "Cabang Utama (Pekalongan)"}
                  </span>
                </div>

                <div>
                  <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Wilayah / Area Regional
                  </span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-contrast)" }}>
                    🗺️ {popupAdmin.area_name || "Jawa Tengah"}
                  </span>
                </div>

                <div>
                  <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Waktu Pendaftaran
                  </span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-contrast)" }}>
                    📅 {formatDate(popupAdmin.created_at)}
                  </span>
                </div>
              </div>

              {/* 2. Role Division & Responsibility */}
              <div
                style={{
                  background: "var(--bg-card)",
                  padding: "1rem",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--glass-border)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-contrast)", textTransform: "uppercase" }}>
                    Divisi & Lingkup Tanggung Jawab
                  </span>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      color: (ROLE_CONFIG[popupAdmin.role] || {}).color || "#3b82f6",
                      background: (ROLE_CONFIG[popupAdmin.role] || {}).bg || "rgba(59,130,246,0.1)",
                      padding: "1px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    Scope: {(ROLE_CONFIG[popupAdmin.role] || {}).defaultScope || "STORE"}
                  </span>
                </div>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: (ROLE_CONFIG[popupAdmin.role] || {}).color || "#3b82f6" }}>
                  {(ROLE_CONFIG[popupAdmin.role] || {}).division || "Divisi Operasional Toko"}
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "0.3rem 0 0", lineHeight: 1.5 }}>
                  {(ROLE_CONFIG[popupAdmin.role] || {}).desc || "Staf operasional dengan hak akses spesifik sistem."}
                </p>
              </div>

              {/* 3. Allowed Accessible Modules */}
              <div
                style={{
                  background: "var(--bg-card)",
                  padding: "1rem",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--glass-border)",
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--text-contrast)",
                    textTransform: "uppercase",
                    marginBottom: "0.6rem",
                  }}
                >
                  Modul Sistem yang Diizinkan untuk Role Ini
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {((ROLE_CONFIG[popupAdmin.role] || {}).modules || ["Penjualan & POS", "Katalog Laptop"]).map((mod, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: "0.72rem",
                        padding: "3px 8px",
                        borderRadius: "var(--radius-sm)",
                        background: "rgba(16, 185, 129, 0.12)",
                        color: "#10b981",
                        border: "1px solid rgba(16, 185, 129, 0.25)",
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                      }}
                    >
                      <span>✓</span>
                      <span>{mod}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div
              style={{
                padding: "1rem 1.75rem",
                borderTop: "1px solid var(--glass-border)",
                background: "var(--bg-surface)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.75rem",
                borderRadius: "0 0 var(--radius-xl) var(--radius-xl)",
              }}
            >
              {/* Quick Status Toggle Button */}
              <button
                type="button"
                onClick={async () => {
                  const currentStatus = popupAdmin.status || "active";
                  const nextStatus = currentStatus === "active" ? "inactive" : "active";
                  await handleToggleStatus(popupAdmin);
                  setPopupAdmin((prev) => (prev ? { ...prev, status: nextStatus } : null));
                }}
                disabled={currentAdminUser && currentAdminUser.id === popupAdmin.id}
                style={{
                  background: (popupAdmin.status || "active") === "active" ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)",
                  border: `1px solid ${(popupAdmin.status || "active") === "active" ? "#f59e0b44" : "#10b98144"}`,
                  color: (popupAdmin.status || "active") === "active" ? "#f59e0b" : "#10b981",
                  padding: "0.55rem 0.9rem",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: currentAdminUser && currentAdminUser.id === popupAdmin.id ? "not-allowed" : "pointer",
                  opacity: currentAdminUser && currentAdminUser.id === popupAdmin.id ? 0.4 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <span>{(popupAdmin.status || "active") === "active" ? "⏸️" : "▶️"}</span>
                <span>{(popupAdmin.status || "active") === "active" ? "Nonaktifkan Akun" : "Aktifkan Akun"}</span>
              </button>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    const toPhoto = popupAdmin;
                    openPhotoModal(toPhoto);
                  }}
                  style={{
                    background: "rgba(168, 85, 247, 0.12)",
                    border: "1px solid rgba(168, 85, 247, 0.35)",
                    color: "#a855f7",
                    padding: "0.55rem 1rem",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                  title="Buka editor foto profil untuk admin ini"
                >
                  <span>📸</span>
                  <span>Edit Foto</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const toEdit = popupAdmin;
                    setPopupAdmin(null);
                    openEditModal(toEdit);
                  }}
                  className="btn-primary"
                  style={{
                    padding: "0.55rem 1.1rem",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <span>✏️</span>
                  <span>Edit Data</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPopupAdmin(null)}
                  className="btn-outline"
                  style={{ padding: "0.55rem 1.1rem", fontSize: "0.78rem" }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL KHUSUS: EDIT FOTO PROFIL ADMIN (TERPISAH SENDIRI) ── */}
      {photoAdmin && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.78)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 1050,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !savingPhoto && !uploadingPhoto) {
              setPhotoAdmin(null);
            }
          }}
        >
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--glass-border)",
              borderRadius: "var(--radius-xl)",
              width: "100%",
              maxWidth: "480px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--glass-border)",
              overflow: "hidden",
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "1.25rem 1.5rem",
                background: `linear-gradient(135deg, ${(ROLE_CONFIG[photoAdmin.role] || {}).color || "#a855f7"}25, var(--bg-card))`,
                borderBottom: "1px solid var(--glass-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-contrast)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span>📸</span>
                  <span>Edit Foto Profil Admin</span>
                </h3>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "3px 0 0" }}>
                  Kelola avatar untuk <strong>{photoAdmin.name}</strong> &bull; {(ROLE_CONFIG[photoAdmin.role] || {}).label || photoAdmin.role}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPhotoAdmin(null)}
                disabled={savingPhoto || uploadingPhoto}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--text-muted)",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "1rem",
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "1.75rem 1.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem" }}>
              {/* Large Avatar Preview with Glow */}
              <div style={{ position: "relative" }}>
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={photoAdmin.name}
                    style={{
                      width: "110px",
                      height: "110px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: `3.5px solid ${(ROLE_CONFIG[photoAdmin.role] || {}).color || "#a855f7"}`,
                      boxShadow: `0 8px 24px ${(ROLE_CONFIG[photoAdmin.role] || {}).color || "#a855f7"}55`,
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "110px",
                      height: "110px",
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${(ROLE_CONFIG[photoAdmin.role] || {}).color || "#a855f7"}, #3b82f6)`,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "2.8rem",
                      fontWeight: 900,
                      boxShadow: `0 8px 24px ${(ROLE_CONFIG[photoAdmin.role] || {}).color || "#a855f7"}55`,
                    }}
                  >
                    {(photoAdmin.name || "A")
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                )}

                {uploadingPhoto && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.7)",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                    }}
                  >
                    ⏳ Mengunggah...
                  </div>
                )}
              </div>

              <div style={{ textAlign: "center" }}>
                <h4 style={{ margin: "0 0 4px", fontSize: "1.05rem", fontWeight: 800, color: "var(--text-contrast)" }}>
                  {photoAdmin.name}
                </h4>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-sm)",
                      background: (ROLE_CONFIG[photoAdmin.role] || {}).bg || "rgba(168,85,247,0.15)",
                      color: (ROLE_CONFIG[photoAdmin.role] || {}).color || "#a855f7",
                      fontWeight: 700,
                    }}
                  >
                    {(ROLE_CONFIG[photoAdmin.role] || {}).label || photoAdmin.role}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {photoAdmin.email}
                  </span>
                </div>
              </div>

              {/* Upload controls */}
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center", width: "100%" }}>
                <label
                  style={{
                    padding: "0.55rem 1.25rem",
                    background: "var(--clr-primary)",
                    color: "#fff",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: uploadingPhoto ? "not-allowed" : "pointer",
                    opacity: uploadingPhoto ? 0.6 : 1,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    transition: "all var(--t-fast)",
                  }}
                >
                  <span>📷</span>
                  <span>{uploadingPhoto ? "Mengunggah..." : photoUrl ? "Ganti File Foto" : "Pilih Foto Baru"}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto || savingPhoto}
                    style={{ display: "none" }}
                  />
                </label>

                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => setPhotoUrl("")}
                    disabled={savingPhoto || uploadingPhoto}
                    style={{
                      padding: "0.55rem 1rem",
                      background: "hsla(0, 80%, 58%, 0.12)",
                      border: "1px solid hsla(0, 80%, 58%, 0.3)",
                      color: "var(--clr-danger)",
                      borderRadius: "var(--radius-md)",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    🗑️ Hapus Foto
                  </button>
                )}
              </div>

              {/* Optional manual URL input */}
              <div style={{ width: "100%", background: "var(--bg-card)", padding: "0.85rem", borderRadius: "var(--radius-md)", border: "1px solid var(--glass-border)" }}>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "4px" }}>
                  Atau masukkan URL foto profil eksternal:
                </label>
                <input
                  type="text"
                  placeholder="https://... atau /uploads/avatars/..."
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  disabled={savingPhoto || uploadingPhoto}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-contrast)",
                    fontSize: "0.8rem",
                    outline: "none",
                  }}
                />
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "4px 0 0" }}>
                  Mendukung file format JPG, PNG, atau WebP (maks. 5MB)
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "1rem 1.5rem",
                borderTop: "1px solid var(--glass-border)",
                background: "var(--bg-card)",
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
              }}
            >
              <button
                type="button"
                onClick={() => setPhotoAdmin(null)}
                disabled={savingPhoto || uploadingPhoto}
                className="btn-outline"
                style={{ padding: "0.55rem 1.1rem", fontSize: "0.82rem" }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSavePhoto}
                disabled={savingPhoto || uploadingPhoto}
                className="btn-primary"
                style={{
                  padding: "0.55rem 1.35rem",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  opacity: savingPhoto ? 0.7 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <span>💾</span>
                <span>{savingPhoto ? "Menyimpan Foto..." : "Simpan Foto Profil"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
