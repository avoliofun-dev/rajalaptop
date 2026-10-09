"use client";

import { useState, useMemo } from "react";

const ROLE_GUIDES = [
  {
    role: "semua",
    title: "Gambaran Arsitektur & Visi Sistem",
    badge: "Semua Staf & Manajemen",
    color: "#3b82f6",
    icon: "🌐",
    desc: "Panduan fondasi ekosistem Raja Laptop V1.10 yang mengintegrasikan Web Publik, Portal Member, Kasir POS, dan Admin Panel.",
    sections: [
      {
        heading: "1. Visi Platform (Digital Business OS)",
        content: `Raja Laptop bukan sekadar web e-commerce atau landing page katalog statis, melainkan Digital Business Operating System untuk ritel komputer profesional (terinspirasi dari platform benchmark seperti ELS.ID).
Sistem ini memusatkan seluruh rantai bisnis:
• Website Publik: Katalog produk, filter spesifikasi laptop, perbandingan unit, artikel tips & edukasi, promo, testimoni, dan profil cabang toko.
• Member & Customer Portal: Registrasi akun, reward poin belanja, histori pesanan, pelacakan tiket servis, dan data diri.
• Admin & Operasional: Kasir POS, pelacakan Serial Number/IMEI per unit laptop, persetujuan diskon berjenjang (Approval), manajemen staf dan hak akses (RBAC), serta audit log menyeluruh.`,
      },
      {
        heading: "2. Struktur Data & Integrasi Supabase",
        content: `Seluruh data tersentralisasi secara cloud di Supabase PostgreSQL:
• products: Data spesifikasi laptop, harga, diskon, stok gudang, dan gambar.
• serial_numbers: Pelacakan unik tiap unit fisik laptop beserta masa garansi resminya.
• orders & order_items: Transaksi kasir POS dan belanja online dengan nomor nota resmi.
• service_tickets: Pelacakan perbaikan laptop mulai dari diagnosa, sparepart, hingga selesai.
• customers: Akun pelanggan yang mendaftar di web, level keanggotaan (Member/VIP), serta saldo poin.
• admin_users & roles: Kredensial staf internal terenkripsi dengan izin bertingkat (RBAC).`,
      },
    ],
  },
  {
    role: "kasir",
    title: "SOP & Panduan Peran Kasir (Frontliner POS)",
    badge: "Frontliner Penjualan & Ritel",
    color: "#10b981",
    icon: "🛒",
    desc: "Instruksi kerja harian kasir untuk transaksi POS, cek stok laptop, dan penanganan permohonan diskon.",
    sections: [
      {
        heading: "1. Transaksi Penjualan & Kasir POS (/admin/pesanan)",
        content: `• Pencarian Unit & Cek Stok: Selalu pastikan stok fisik laptop tersedia dan cocok dengan data di sistem sebelum mencetak nota.
• Pindai / Pilih Serial Number: Laptop bernilai tinggi wajib diinput nomor serinya pada saat checkout agar riwayat garansi pembeli langsung terdata.
• Menautkan Member Customer: Tanyakan nomor HP atau email pembeli. Jika sudah mendaftar di web, transaksi akan otomatis menambah Poin Reward pelanggan.`,
      },
      {
        heading: "2. Aturan Diskon Khusus & Void Transaksi (/admin/approvals)",
        content: `• Batasan Wewenang Diskon: Kasir dilarang memotong harga di luar promo resmi tanpa persetujuan.
• Mengajukan Approval Diskon: Jika pelanggan melakukan negosiasi harga atau pembelian paket, klik 'Ajukan Diskon' di sistem. Permohonan akan otomatis masuk ke antrean persetujuan Kepala Toko atau Owner.
• Pembatalan Nota (Void): Nota yang sudah terbit tidak dapat dihapus sepihak. Wajib meminta otorisasi supervisor jika terjadi salah input.`,
      },
      {
        heading: "3. Penerimaan Tiket Servis Awal (/admin/servis)",
        content: `• Input data pemilik laptop (Nama, No HP WhatsApp).
• Catat keluhan unit secara mendetail (misal: bluescreen, engsel patah, keyboard error) dan periksa kondisi fisik kelengkapan (charger, tas).
• Berikan nomor tiket servis kepada customer untuk dapat mereka lacak langsung di portal website.`,
      },
    ],
  },
  {
    role: "gudang",
    title: "SOP & Panduan Peran Gudang (Inventory & Serial)",
    badge: "Logistik & Pergudangan",
    color: "#f97316",
    icon: "📦",
    desc: "Panduan penerimaan unit laptop baru, barcode Serial/IMEI, kartu garansi, dan mutasi barang cabang.",
    sections: [
      {
        heading: "1. Penerimaan Barang Masuk & Input Serial (/admin/serials)",
        content: `• Serial Number & IMEI Unik: Setiap unit laptop yang masuk dari distributor/vendor wajib didaftarkan Serial Number (S/N) resminya ke dalam sistem.
• Satu Unit Satu Serial: Tidak ada unit laptop yang beredar tanpa nomor seri terdaftar. Masa garansi pabrikan (biasanya 12-24 bulan) otomatis aktif sejak tanggal penerimaan.
• Status Unit: Pastikan status di awal adalah 'IN_STOCK' dengan alokasi toko cabang yang tepat.`,
      },
      {
        heading: "2. Mutasi Stok Antar Cabang (Stock Transfer)",
        content: `• Ketika cabang lain meminta suplai unit, buat permohonan mutasi di menu Serial Number.
• Status unit akan berubah menjadi 'IN_TRANSIT' hingga kepala toko cabang tujuan memverifikasi fisik unit dan menerima serah terima di sistem.`,
      },
      {
        heading: "3. Verifikasi Barang Servis & Retur",
        content: `• Unit laptop yang masuk ruang servis atau diretur dari pelanggan akan diubah status serinya menjadi 'IN_SERVICE' atau 'RETURNED' agar tidak tertukar dengan stok laptop baru yang siap jual.`,
      },
    ],
  },
  {
    role: "teknisi",
    title: "SOP & Panduan Peran Teknisi (Service Center)",
    badge: "Laboratorium Servis & Maintenance",
    color: "#06b6d4",
    icon: "🔧",
    desc: "Prosedur diagnosa kerusakan, estimasi biaya sparepart, update status perbaikan, dan uji fungsi QC.",
    sections: [
      {
        heading: "1. Pengelolaan Tiket Servis (/admin/servis)",
        content: `• Diagnosa Awal: Cek keluhan pelanggan pada tiket. Lakukan pemeriksaan hardware (RAM, SSD, Motherboard, Display) dan software.
• Update Status Berkala: Ganti status tiket secara real-time (Diagnosa -> Menunggu Sparepart -> Pengerjaan -> QC Selesai -> Siap Diambil). Pelanggan dapat memantau status ini langsung dari smartphone mereka!
• Catatan Teknisi: Selalu tuliskan rincian pengerjaan teknis dan komponen yang diganti.`,
      },
      {
        heading: "2. Estimasi Biaya & Persetujuan Pelanggan",
        content: `• Jika biaya servis atau harga sparepart melebihi estimasi awal di nota masuk, hubungi pelanggan via kontak WhatsApp yang tertera sebelum memasang part pengganti.`,
      },
    ],
  },
  {
    role: "kepala_toko",
    title: "Panduan Kepala Toko & Manajer Area (Supervisi Toko)",
    badge: "Supervisi Toko & Regional",
    color: "#a855f7",
    icon: "🏪",
    desc: "Wewenang otorisasi diskon cabang, pengawasan kasir, audit stok fisik, dan kepuasan pelanggan.",
    sections: [
      {
        heading: "1. Otorisasi & Keputusan Approval (/admin/approvals)",
        content: `• Memeriksa setiap permohonan diskon dari kasir: evaluasi margin profit produk sebelum menekan tombol 'Approve'.
• Jika menolak permohonan, sertakan alasan yang edukatif di kolom catatan agar kasir memahami alasannya.`,
      },
      {
        heading: "2. Monitoring Penjualan Harian & Pelanggan Baru",
        content: `• Tinjau laporan penjualan toko cabang hari ini di menu Penjualan & POS.
• Pantau pertumbuhan pendaftar member di menu 'Pelanggan Terdaftar' (/admin/customers) untuk evaluasi performa CRM toko.`,
      },
    ],
  },
  {
    role: "owner",
    title: "Executive & Owner Guide (Strategi Bisnis)",
    badge: "Direksi & Pemilik Bisnis",
    color: "#f59e0b",
    icon: "👑",
    desc: "Pemantauan analitik omset, performa cabang, audit keamanan, dan pengembangan bisnis jangka panjang.",
    sections: [
      {
        heading: "1. Executive Dashboard & Indikator Kunci (/admin/dashboard)",
        content: `• Omzet Penjualan & Tren: Pantau grafik pendapatan kotor, jumlah transaksi laptop terjual, dan tiket servis yang selesai.
• Stok Kritis & Fast-Moving: Evaluasi laptop merek apa yang paling laris dan unit mana yang perputarannya lambat (dead stock).`,
      },
      {
        heading: "2. Tata Kelola Hak Akses (RBAC) & Audit Trail",
        content: `• Pencegahan Fraud: Seluruh tindakan finansial, perubahan harga, diskon, hingga login staf terekam di menu Audit Trail (/admin/audit-logs).
• Manajemen Hak Akses: Kendalikan izin masing-masing staf via menu 'Staf & Hak Akses' (/admin/admins) dan 'Role & Izin' (/admin/roles) tanpa membagikan akses penuh.`,
      },
      {
        heading: "3. Branding & Konten Web Publik",
        content: `• Kendalikan banner promosi unggulan via 'Setting Hero Slider' dan informasi operasional cabang via 'Konfigurasi Web'.`,
      },
    ],
  },
  {
    role: "super_admin",
    title: "Technical & Developer Guide (Arsitektur Kode & Supabase)",
    badge: "IT & Software Engineering",
    color: "#ec4899",
    icon: "⚡",
    desc: "Panduan arsitektur Next.js 16 (App Router), Supabase client, RBAC middleware, dan integrasi GitHub.",
    sections: [
      {
        heading: "1. Tech Stack & Struktur Direktori",
        content: `• Framework: Next.js 16 (Turbopack, React 19).
• Database: Supabase PostgreSQL (Cloud) dengan integrasi lib/supabase.js & lib/db.js.
• State & Style: CSS Modules, Glassmorphism design system dengan CSS custom properties.
• Routing: App Router (app/admin untuk dashboard internal, app/api untuk REST endpoint, dan root app/ untuk web publik).`,
      },
      {
        heading: "2. Mekanisme Keamanan (apiGuard & RBAC)",
        content: `• Setiap endpoint admin dilindungi oleh guardApi(request, requiredPermission, { module }).
• Autentikasi menggunakan cookie sesi terenkripsi (admin_session) yang diverifikasi terhadap tabel admin_users.
• Super Admin dan Owner memiliki bypass hak akses menyeluruh.`,
      },
      {
        heading: "3. Alur Sinkronisasi GitHub & Deployment",
        content: `• Repository: avoliofun-dev/rajalaptop.git (branch main).
• Setiap perubahan kode secara otomatis di-commit dan di-push ke remote repository.
• Menggunakan GitHub Desktop: buka File -> Add Local Repository dan pilih folder projek ini.`,
      },
    ],
  },
];

export default function GuideAdminPage() {
  const [selectedRole, setSelectedRole] = useState("semua");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  // Active guide
  const activeGuide = useMemo(() => {
    return ROLE_GUIDES.find((g) => g.role === selectedRole) || ROLE_GUIDES[0];
  }, [selectedRole]);

  // Filter sections by search
  const filteredSections = useMemo(() => {
    if (!search.trim()) return activeGuide.sections;
    const q = search.toLowerCase();
    return activeGuide.sections.filter(
      (sec) =>
        sec.heading.toLowerCase().includes(q) ||
        sec.content.toLowerCase().includes(q)
    );
  }, [activeGuide, search]);

  // Generate plain text for export
  const generateExportText = () => {
    let text = `=========================================================\n`;
    text += `MODUL PANDUAN & EDUKASI SISTEM RAJA LAPTOP V1.10\n`;
    text += `Peran / Modul: ${activeGuide.title} (${activeGuide.badge})\n`;
    text += `Tanggal Unduh: ${new Date().toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
    text += `=========================================================\n\n`;
    text += `DESKRIPSI UMUM:\n${activeGuide.desc}\n\n`;
    text += `---------------------------------------------------------\n`;

    activeGuide.sections.forEach((sec, idx) => {
      text += `\n[BAGIAN ${idx + 1}] ${sec.heading}\n`;
      text += `---------------------------------------------------------\n`;
      text += `${sec.content}\n\n`;
    });

    text += `=========================================================\n`;
    text += `Dokumentasi Internal Raja Laptop - Dilindungi Hak Cipta\n`;
    return text;
  };

  // Generate complete all-roles export text
  const generateAllExportText = () => {
    let text = `=========================================================\n`;
    text += `BUKU PANDUAN LENGKAP ARSITEKTUR & SOP RAJA LAPTOP V1.10\n`;
    text += `Platform E-Commerce & Retail Management System\n`;
    text += `Tanggal Unduh: ${new Date().toLocaleDateString("id-ID")}\n`;
    text += `=========================================================\n\n`;

    ROLE_GUIDES.forEach((guide, gIdx) => {
      text += `\n#########################################################\n`;
      text += `BAB ${gIdx + 1}: ${guide.title.toUpperCase()}\n`;
      text += `Target Audiens: ${guide.badge}\n`;
      text += `Deskripsi: ${guide.desc}\n`;
      text += `#########################################################\n\n`;

      guide.sections.forEach((sec) => {
        text += `>>> ${sec.heading}\n`;
        text += `${sec.content}\n\n`;
      });
    });

    return text;
  };

  // Download as TXT file
  const handleDownload = (all = false) => {
    const content = all ? generateAllExportText() : generateExportText();
    const filename = all
      ? `Buku_Panduan_Lengkap_RajaLaptop_V1.10.txt`
      : `Panduan_${activeGuide.role.toUpperCase()}_RajaLaptop.txt`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy to clipboard
  const handleCopy = () => {
    const content = generateExportText();
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Print view
  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "4px" }}>
            <span style={{ fontSize: "1.5rem" }}>📚</span>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-contrast)", margin: 0 }}>
              Pusat Panduan & Edukasi Sistem
            </h1>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Materi panduan operasional, SOP divisi, dan arsitektur sistem Raja Laptop untuk semua peran admin.
          </p>
        </div>

        {/* Action Export Buttons */}
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <button
            onClick={handleCopy}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid var(--border-color)",
              color: "var(--text-contrast)",
              padding: "0.55rem 1rem",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <span>{copied ? "✅" : "📋"}</span>
            <span>{copied ? "Tersalin!" : "Salin Teks"}</span>
          </button>

          <button
            onClick={handlePrint}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid var(--border-color)",
              color: "var(--text-contrast)",
              padding: "0.55rem 1rem",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <span>🖨️</span>
            <span>Cetak / PDF</span>
          </button>

          <button
            onClick={() => handleDownload(false)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "rgba(59, 130, 246, 0.15)",
              border: "1px solid #3b82f6",
              color: "#60a5fa",
              padding: "0.55rem 1rem",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <span>📥</span>
            <span>Export Bab Ini (.txt)</span>
          </button>

          <button
            onClick={() => handleDownload(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "var(--clr-primary, #2563eb)",
              border: "none",
              color: "#ffffff",
              padding: "0.55rem 1.1rem",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
            }}
          >
            <span>📦</span>
            <span>Export Seluruh Buku Panduan</span>
          </button>
        </div>
      </div>

      {/* Role Navigation Pills */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          overflowX: "auto",
          paddingBottom: "0.5rem",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        {ROLE_GUIDES.map((g) => {
          const isSelected = selectedRole === g.role;
          return (
            <button
              key={g.role}
              onClick={() => {
                setSelectedRole(g.role);
                setSearch("");
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.6rem 1.1rem",
                borderRadius: "30px",
                border: isSelected ? `1.5px solid ${g.color}` : "1px solid var(--border-color)",
                background: isSelected ? `${g.color}22` : "var(--bg-surface)",
                color: isSelected ? "#ffffff" : "var(--text-secondary)",
                fontSize: "0.85rem",
                fontWeight: isSelected ? 700 : 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
            >
              <span>{g.icon}</span>
              <span>{g.badge}</span>
            </button>
          );
        })}
      </div>

      {/* Main Guide Content Card */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: `1px solid var(--border-color)`,
          borderRadius: "14px",
          padding: "1.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        {/* Banner Info Peran */}
        <div
          style={{
            padding: "1.25rem",
            borderRadius: "10px",
            background: `${activeGuide.color}15`,
            border: `1px solid ${activeGuide.color}44`,
            display: "flex",
            alignItems: "flex-start",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: activeGuide.color,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              flexShrink: 0,
            }}
          >
            {activeGuide.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "4px" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-contrast)", margin: 0 }}>
                {activeGuide.title}
              </h2>
              <span
                style={{
                  background: activeGuide.color,
                  color: "#fff",
                  fontSize: "0.7rem",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  fontWeight: 800,
                }}
              >
                {activeGuide.badge}
              </span>
            </div>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
              {activeGuide.desc}
            </p>
          </div>
        </div>

        {/* Search in Content */}
        <div style={{ position: "relative", maxWidth: "450px" }}>
          <span
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="Cari topik atau kata kunci dalam modul ini..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.55rem 1rem 0.55rem 2.3rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              background: "rgba(0, 0, 0, 0.2)",
              color: "var(--text-contrast)",
              fontSize: "0.85rem",
              outline: "none",
            }}
          />
        </div>

        {/* Sections Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {filteredSections.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)" }}>
              Tidak ditemukan materi yang cocok dengan pencarian &quot;{search}&quot;.
            </div>
          ) : (
            filteredSections.map((sec, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  padding: "1.4rem",
                }}
              >
                <h3
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: "var(--text-contrast)",
                    marginBottom: "0.85rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span style={{ color: activeGuide.color }}>●</span>
                  {sec.heading}
                </h3>
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.7,
                    whiteSpace: "pre-line",
                  }}
                >
                  {sec.content}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
