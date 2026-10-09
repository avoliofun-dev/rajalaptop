const db = require('../lib/db.js');
const fs = require('fs');
const path = require('path');

async function syncProgressToDb() {
  try {
    console.log('Menyiapkan tabel progress_versions dan progress_modules di MySQL...');
    
    await db.pool.query(`
      CREATE TABLE IF NOT EXISTS progress_versions (
        version VARCHAR(20) PRIMARY KEY,
        release_date VARCHAR(50) NOT NULL,
        status ENUM('completed', 'active', 'planned') NOT NULL DEFAULT 'completed',
        badge VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        summary TEXT NOT NULL,
        highlights JSON,
        sort_order INT NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await db.pool.query(`
      CREATE TABLE IF NOT EXISTS progress_modules (
        num INT PRIMARY KEY,
        version_tag VARCHAR(20) NOT NULL DEFAULT 'v1.1',
        title VARCHAR(255) NOT NULL,
        icon VARCHAR(20) NOT NULL,
        badge VARCHAR(100) NOT NULL,
        color VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        items JSON,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ambil data dari lib/progressData.js dengan regex/JSON parsing bersih
    const rawCode = fs.readFileSync(path.join(__dirname, '../lib/progressData.js'), 'utf-8');
    
    // Simpan pengaturan versi sistem ke tabel settings
    await db.pool.query(
      "INSERT INTO settings (`key`, `value`) VALUES ('system_version', 'v1.5.0') ON DUPLICATE KEY UPDATE `value` = 'v1.5.0'"
    );
    await db.pool.query(
      "INSERT INTO settings (`key`, `value`) VALUES ('system_version_code', 'v1.5.0-security-wa-otp') ON DUPLICATE KEY UPDATE `value` = 'v1.5.0-security-wa-otp'"
    );

    // Data versi sinkronisasi
    const versions = [
      {
        version: "v1.5.0",
        release_date: "2026-09-30",
        status: "active",
        badge: "Aktif / Rilis Saat Ini (v1.5)",
        title: "2FA Real-Time WhatsApp OTP Login Admin & Proteksi Privasi Customer",
        summary: "Pengamanan berlapis autentikasi login staf admin dengan OTP 6-digit real-time via WhatsApp Gateway, link buka WA langsung, tombol tempel cepat, proteksi privasi pelanggan dengan eliminasi tombol progres publik & metrik ukuran, perapian navigasi portal customer, serta pemutakhiran live monitor progres admin.",
        highlights: [
          "Sistem Keamanan Berlapis 2FA: Verifikasi Real-time WhatsApp OTP 6-Digit saat login staf admin (/api/auth/admin/verify-otp)",
          "Pintasan WhatsApp: Tautan langsung membuka chat WA admin & tombol 'Tempel Otomatis' untuk uji coba instan",
          "Proteksi Privasi Customer: Penghapusan total tombol progres proyek & metrik ukuran disk (1.85 GB) dari beranda, navbar, dan footer publik",
          "Perapian Portal Customer: Penghapusan menu duplikat di sidebar dan konsolidasi ke 'Akun Saya ➔ Pesanan & Servis'",
          "Akses Progres Eksklusif: Halaman /admin/progres kini dapat diakses oleh Super Admin dan Owner dengan pelacakan live PROGRESS.md"
        ],
        sort_order: 1
      },
      {
        version: "v1.4.0",
        release_date: "2026-09-30",
        status: "completed",
        badge: "Selesai",
        title: "WhatsApp Notification Gateway, POS Hardware Scanner & Footer Setting",
        summary: "WhatsApp Business API Gateway untuk pengiriman otomatis notifikasi resi, faktur nota, tiket servis, dan alert approval sensitif ke Kepala Toko; integrasi hardware scanner kasir; serta panel mandiri pengaturan konten footer web.",
        highlights: [
          "WhatsApp Business API Gateway: Notifikasi otomatis untuk nomor resi pengiriman, faktur pembelian, dan nota servis (/api/whatsapp/notify)",
          "WhatsApp Alert Approval: Pengiriman notifikasi otomatis langsung ke WhatsApp Kepala Toko/Manager saat kasir meminta approval diskon",
          "Integrasi Barcode & Serial Hardware Scanner POS: Dukungan laser/bluetooth scanner USB untuk input otomatis produk ke keranjang kasir",
          "Pengaturan konten Footer mandiri di dashboard admin (/admin/footer) dengan sinkronisasi live ke halaman publik"
        ],
        sort_order: 2
      },
      {
        version: "v1.3.0",
        release_date: "2026-09-30",
        status: "completed",
        badge: "Selesai",
        title: "Payment Gateway Multi-Bank & QRIS Dinamis Standar Bank Indonesia",
        summary: "Integrasi Payment Gateway resmi dengan QRIS dinamis berbasis standar EMVCo/ASPI & CRC16 presisi, Virtual Account multi-bank (BCA, Mandiri, BRI, BNI), simulasi callback webhook instan, serta integrasi modal pembayaran di keranjang publik dan terminal POS kasir.",
        highlights: [
          "Payment Gateway QRIS Dinamis berstandar Bank Indonesia (EMVCo/ASPI) dengan auto-payload & live timer",
          "Virtual Account multi-bank otomatis (BCA, Mandiri, BRI, BNI) dengan masa berlaku 24 jam",
          "Simulasi callback webhook payment gateway real-time (/api/payment/simulate)",
          "Sinkronisasi status lunas otomatis di pesanan pelanggan dan kasir admin (/admin/pesanan)"
        ],
        sort_order: 3
      },
      {
        version: "v1.2.0",
        release_date: "2026-09-29",
        status: "completed",
        badge: "Selesai",
        title: "Katalog Unggulan, Terminal Kasir POS, HPP Modal & Profile Admin",
        summary: "Kurasi 8 produk terbaik di beranda, format Rupiah otomatis, modul kasir POS ritel lengkap, multi-gambar produk & lightbox, perhitungan Harga Modal (HPP) & opsi tarif pajak (PPN 11%, 12%, Non-PPN), serta pengelolaan profil Data Diri Admin.",
        highlights: [
          "Kurasi 8 laptop unggulan di beranda & standardisasi format Rupiah (Rp XX.XXX.XXX) di seluruh aplikasi",
          "Alur POS Kasir lengkap: scan/pilih produk, kuantiti, metode bayar (Tunai/Transfer/Debit/QRIS)",
          "Dukungan multi-gambar produk & modal lightbox resolusi tinggi pada halaman katalog",
          "Kalkulator HPP, margin laba kotor real-time, dan konfigurasi fleksibel tarif pajak PPN",
          "Dossier profil Data Diri Admin (/admin/datadiri) dengan fasilitas upload foto profil mandiri"
        ],
        sort_order: 4
      },
      {
        version: "v1.1.0",
        release_date: "2026-09-28",
        status: "completed",
        badge: "Selesai (Fondasi Awal)",
        title: "Fondasi Inti, MySQL Database & Enterprise RBAC System",
        summary: "Inisialisasi sistem Next.js 16 + React 19, database MySQL rajalaptop, impor 430 katalog laptop ELS, arsitektur multi-store/multi-area, 9 role bisnis, 52 granular permissions, server-side API guard, approval flow, tracking nomor serial & IMEI, audit log kebal manipulasi, dan otomasi 55 test.",
        highlights: [
          "Setup struktur dasar Next.js 16 App Router, React 19, dan koneksi pool MySQL",
          "9 Role Bisnis (Owner, Super Admin, Manager Area, Kepala Toko, Kasir, Gudang, Finance, Marketing, Audit)",
          "52 Granular Permissions dengan proteksi Server-Side API Guard (lib/apiGuard.js) & Anti-Privilege Escalation",
          "Multi-Store & Multi-Area: regionalisasi wilayah operasional & isolasi scope data (ALL, AREA, STORE, OWN)",
          "Transaksi POS Atomik (ACID): BEGIN -> INSERT -> DECREMENT STOCK -> LOG -> COMMIT/ROLLBACK",
          "Pelacakan siklus hidup Serial Number & IMEI laptop (/admin/serials)",
          "Sistem Approval Otorisasi berjenjang (/admin/approvals) & Audit Trail kebal manipulasi (/admin/audit-logs)",
          "55 Automated Tests lolos 100% tanpa kegagalan (scripts/test_rbac.js)"
        ],
        sort_order: 5
      },
      {
        version: "v1.6.0",
        release_date: "Rencana",
        status: "planned",
        badge: "Roadmap Mendatang",
        title: "Split Payment, Ekspor Keuangan .xlsx/.pdf & Modul RMA Servis",
        summary: "Dukungan pembayaran multi-metode (tunai + transfer), ekspor laporan keuangan dan rekap PPN format Excel & PDF, pelacakan tiket servis mandiri pelanggan, dan alur klaim garansi vendor resmi (RMA).",
        highlights: [
          "Split Payment: Kombinasi bayar tunai + non-tunai atau kasbon termin internal",
          "Ekspor Laporan Keuangan: Generate file Excel (.xlsx) dan PDF laporan laba rugi, neraca, & rekap PPN",
          "Pelacakan Servis Mandiri: Halaman publik pelanggan untuk cek perkembangan reparasi via nomor tiket",
          "Klaim Garansi RMA: Alur pengiriman dan tracking servis ke Service Center resmi vendor"
        ],
        sort_order: 6
      }
    ];

    for (const v of versions) {
      await db.pool.query(`
        INSERT INTO progress_versions (version, release_date, status, badge, title, summary, highlights, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          release_date = VALUES(release_date),
          status = VALUES(status),
          badge = VALUES(badge),
          title = VALUES(title),
          summary = VALUES(summary),
          highlights = VALUES(highlights),
          sort_order = VALUES(sort_order)
      `, [v.version, v.release_date, v.status, v.badge, v.title, v.summary, JSON.stringify(v.highlights), v.sort_order]);
    }

    console.log(`✓ Berhasil menyimpan ${versions.length} riwayat versi ke tabel MySQL progress_versions!`);

    // 18 Modul Selesai
    const modules = [
      { num: 1, version_tag: "v1.1", title: "Fondasi RBAC & Scope Data Server-Side", icon: "🛡️", badge: "Selesai 100% (v1.1)", color: "#3b82f6", description: "Sistem otorisasi berstandar enterprise dengan 9 Role, 52 Granular Permissions, dan pencegahan eskalasi wewenang (Anti-Privilege Escalation).", items: ["9 Role Bisnis: Owner, Super Admin, Manager Area, Kepala Toko, Kasir, Gudang, Finance, Marketing, Audit", "Scope Engine: ALL (Seluruh Sistem), AREA (Regional), STORE (Cabang), OWN (Data Pribadi)", "Server-Side API Guard (lib/apiGuard.js) menolak request ilegal (HTTP 401/403)", "Anti-Escalation: User dilarang ubah role sendiri, non-SuperAdmin dilarang angkat SuperAdmin, Owner kebal modifikasi staf lain"] },
      { num: 2, version_tag: "v1.1", title: "Multi-Store & Multi-Area Architecture", icon: "🏢", badge: "Selesai 100% (v1.1)", color: "#8b5cf6", description: "Pemisahan cakupan operasional multi-cabang dan regionalisasi area toko secara terisolasi.", items: ["Wilayah Regional (areas): Jawa Tengah, DI Yogyakarta, Kantor Pusat Sentral", "Cabang Toko Fisik (stores): Pekalongan, Yogyakarta Gejayan, Semarang Pemuda, Solo Slamet Riyadi, Gudang Pusat Sentral", "Tabel user_stores & user_areas untuk penugasan hak wilayah staf"] },
      { num: 3, version_tag: "v1.1", title: "Integritas Transaksi Penjualan Atomik (Atomic POS)", icon: "🛍️", badge: "Selesai 100% (v1.1)", color: "#10b981", description: "Transaksi POS berbasis database ACID transaction guna menjamin integritas stok dan uang masuk.", items: ["Alur transaksi atomik: BEGIN ➔ INSERT ORDER ➔ DECREMENT STOCK ➔ LOG MOVEMENT ➔ UPDATE SERIAL ➔ WRITE AUDIT ➔ COMMIT", "Rollback otomatis jika terjadi salah satu langkah yang gagal", "Mencegah anomali stok berkurang tanpa ada faktur tercatat"] },
      { num: 4, version_tag: "v1.1", title: "Pelacakan Siklus Hidup Nomor Serial & IMEI Laptop", icon: "🏷️", badge: "Selesai 100% (v1.1)", color: "#f59e0b", description: "Pelacakan menyeluruh unit fisik laptop dari distributor sampai garansi pembeli.", items: ["Status rantai pasok: SUPPLIER ➔ PURCHASE ➔ WAREHOUSE ➔ STORE ➔ SALE ➔ CUSTOMER ➔ WARRANTY", "Audit trail pergerakan unit per serial number dan tanggal mutasi", "Halaman pelacakan visual di /admin/serials"] },
      { num: 5, version_tag: "v1.1", title: "Sistem Approval Otorisasi Berjenjang", icon: "📝", badge: "Selesai 100% (v1.1)", color: "#06b6d4", description: "Mekanisme pengajuan dan persetujuan bertingkat untuk transaksi sensitif toko.", items: ["Tipe tiket: DISCOUNT, REFUND, STOCK_ADJUSTMENT, STOCK_TRANSFER, EXPENSE", "Alur berjenjang: Kasir ➔ Kepala Toko ➔ Manager Area / Finance ➔ Owner", "Aturan ketat: Pemohon dilarang keras menyetujui (self-approve) tiketnya sendiri"] },
      { num: 6, version_tag: "v1.1", title: "Rekam Jejak Forensik Kebal Manipulasi (Immutable Audit Log)", icon: "🔒", badge: "Selesai 100% (v1.1)", color: "#ef4444", description: "Pencatatan setiap aksi mutasi sistem yang tidak dapat diubah atau dihapus oleh siapapun.", items: ["Metadata: actor, role, modul, action, old_value, new_value, IP, User-Agent", "Metode DELETE dan PUT pada /api/audit-logs diblokir permanen (HTTP 403 Forbidden)", "Trigger MySQL dan API Guard menolak keras modifikasi histori log"] },
      { num: 7, version_tag: "v1.1", title: "Dashboard Adaptif Multi-Role", icon: "📊", badge: "Selesai 100% (v1.1)", color: "#6366f1", description: "Antarmuka dashboard dan sidebar yang menyesuaikan otomatis dengan peran dan izin pengguna.", items: ["Navigasi sidebar dinamis terfilter ketat sesuai wewenang RBAC", "Widget analitik dashboard yang berbeda untuk Owner, Manager, Kepala Toko, Kasir, Gudang, Finance", "Statistik keuangan (omzet & gross profit) hanya dapat dilihat oleh role yang berhak"] },
      { num: 8, version_tag: "v1.1", title: "Otomasi Pengujian Sistem (Automated Test Suite)", icon: "🧪", badge: "Selesai 100% (v1.1)", color: "#10b981", description: "Pengujian otomatis untuk menjamin keandalan sistem tanpa celah regresi.", items: ["55 Unit & Integration Tests (scripts/test_rbac.js) Lulus 100% (0 Fail)", "Uji login HTTP nyata untuk seluruh 9 akun, verifikasi JWT token, dan proteksi HTTP 401/403", "Verifikasi penolakan manipulasi DELETE audit log"] },
      { num: 9, version_tag: "v1.2", title: "Perbaikan Kurasi Beranda & Format Rupiah", icon: "💎", badge: "Selesai 100% (v1.2)", color: "#ec4899", description: "Kurasi 8 produk terbaik di beranda mencegah penumpukan data berat dari 400+ katalog serta standardisasi Rupiah.", items: ["Kurasi 8 produk terbaik di beranda agar load time instan dan estetika terjaga", "Standardisasi pemformatan angka mata uang Rupiah (Rp XX.XXX.XXX) di seluruh form & tabel", "Kartu pilar keunggulan toko dan banner promosi responsif"] },
      { num: 10, version_tag: "v1.2", title: "Terminal POS Kasir & Multi-Image Produk", icon: "🛒", badge: "Selesai 100% (v1.2)", color: "#14b8a6", description: "Modul POS kasir lengkap dengan scanning produk, keranjang, diskon, dan galeri multi-gambar produk.", items: ["Alur kasir lengkap: scan barcode, quantity picker, diskon, dan pilihan pembayaran", "Fitur multi-gambar produk laptop dengan upload berkas mandiri", "Komponen pratinjau galeri foto dan modal lightbox interaktif di halaman produk"] },
      { num: 11, version_tag: "v1.2", title: "HPP Modal, Opsi Tarif Pajak & Kalkulator Laba Margin Live", icon: "📈", badge: "Selesai 100% (v1.2)", color: "#f97316", description: "Penghitungan laba kotor otomatis berdasarkan Harga Pokok Penjualan (HPP) dan konfigurasi pajak PPN fleksibel.", items: ["Input Harga Modal (HPP) otomatis menghitung margin laba kotor (Nominal & Persentase)", "Pengaturan tarif pajak fleksibel (Bebas Pajak 0%, PPN 11%, PPN 12%, atau kustom %) inklusif/eksklusif", "Kartu analitik estimasi laba bersih real-time pada formulir penambahan & edit laptop"] },
      { num: 12, version_tag: "v1.2", title: "Dossier Profil & Manajemen Data Diri Admin", icon: "👤", badge: "Selesai 100% (v1.2)", color: "#0284c7", description: "Halaman profil mandiri staf admin di /admin/datadiri dengan upload foto dan sinkronisasi real-time.", items: ["Halaman profil mandiri staf di /admin/datadiri dengan dukungan ganti foto & kata sandi", "Upload avatar tersimpan di /uploads/avatars/ dengan update instan di topbar", "Dossier informasi role, izin akses modul, nomor telepon WA, dan data cabang tugas"] },
      { num: 13, version_tag: "v1.3", title: "Payment Gateway QRIS Dinamis Standar Bank Indonesia", icon: "💳", badge: "Selesai 100% (v1.3)", color: "#3b82f6", description: "Generator QRIS dinamis Standar Bank Indonesia (EMVCo/ASPI & CRC16) dan Virtual Account multi-bank.", items: ["Generator QRIS dinamis berbasis standar EMVCo MPM, ASPI, dan checksum CRC16 presisi (lib/qris.js)", "Virtual Account multi-bank (BCA, Mandiri, BRI, BNI) dengan masa berlaku 24 jam", "Simulasi callback webhook instan untuk pengujian otomatis pembayaran (/api/payment/simulate)", "Sinkronisasi status bayar pesanan lunas di portal pelanggan (/portal) dan kasir admin (/admin/pesanan)"] },
      { num: 14, version_tag: "v1.4", title: "WhatsApp Notification Gateway Otomatis", icon: "📱", badge: "Selesai 100% (v1.4)", color: "#10b981", description: "WhatsApp Business API Gateway untuk pengiriman otomatis struk faktur, nomor resi pengiriman, dan tanda terima servis.", items: ["Notifikasi nomor resi pengiriman dan konfirmasi pesanan pelanggan otomatis terkirim ke WhatsApp (/api/whatsapp/notify)", "Pembaruan status nota servis laptop langsung terkirim ke WhatsApp pemilik", "WhatsApp Alert Approval otomatis ke WhatsApp Kepala Toko saat ada permohonan diskon kasir"] },
      { num: 15, version_tag: "v1.4", title: "Hardware Barcode & Serial Scanner Kasir POS", icon: "📟", badge: "Selesai 100% (v1.4)", color: "#8b5cf6", description: "Deteksi langsung input laser/bluetooth hardware scanner USB untuk scan barcode dan serial number laptop.", items: ["Deteksi langsung input laser scanner USB dan Bluetooth untuk memasukkan unit laptop ke keranjang kasir seketika", "Pencocokan otomatis nomor barcode produk maupun Serial Number unit fisik", "Mencegah human error pengetikan nomor serial saat antrean kasir padat"] },
      { num: 16, version_tag: "v1.4", title: "Panel Pengaturan Konten Footer Mandiri", icon: "⚙️", badge: "Selesai 100% (v1.4)", color: "#f59e0b", description: "Antarmuka kustomisasi footer toko /admin/footer untuk mengatur link sosial media, info pembayaran, bantuan, dan hak cipta.", items: ["Pengaturan link medsos: Instagram, TikTok, YouTube, Facebook, WhatsApp Toko", "Konfigurasi metode pembayaran yang didukung, saluran pengiriman, dan jam buka toko", "Sinkronisasi live ke database tabel settings dan render dinamis di seluruh footer publik"] },
      { num: 17, version_tag: "v1.5", title: "Otentikasi Berlapis 2FA Real-Time WhatsApp OTP Login Admin", icon: "🔐", badge: "Selesai 100% (v1.5)", color: "#ef4444", description: "Pengamanan ketat login admin menggunakan kode verifikasi 6 digit yang dikirimkan secara instan via WhatsApp Gateway.", items: ["Verifikasi Real-time WhatsApp OTP 6-Digit saat login staf admin (/api/auth/admin/verify-otp)", "Masa aktif 5 menit, proteksi batas percobaan salah, tombol cooldown kirim ulang, serta tautan langsung buka WhatsApp", "Kotak bantuan kode OTP dan tombol 'Tempel Otomatis' untuk kelancaran pengujian lokal tanpa hambatan"] },
      { num: 18, version_tag: "v1.5", title: "Proteksi Privasi & Tampilan Eksklusif Pelanggan", icon: "🛡️", badge: "Selesai 100% (v1.5)", color: "#06b6d4", description: "Eliminasi tombol teknis dari area publik customer, penggabungan menu portal, dan akses eksklusif progres web.", items: ["Menghilangkan tombol progres dan metrik ukuran disk (1.85 GB) dari beranda, footer, dan sidebar publik", "Mengeliminasi menu duplikat portal pelanggan di sidebar, menyatukannya secara rapi ke grup 'Akun Saya ➔ Pesanan & Servis'", "Membuka hak akses halaman Progres Web (/admin/progres) untuk Super Admin dan Owner"] }
    ];

    for (const m of modules) {
      await db.pool.query(`
        INSERT INTO progress_modules (num, version_tag, title, icon, badge, color, description, items)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          version_tag = VALUES(version_tag),
          title = VALUES(title),
          icon = VALUES(icon),
          badge = VALUES(badge),
          color = VALUES(color),
          description = VALUES(description),
          items = VALUES(items)
      `, [m.num, m.version_tag, m.title, m.icon, m.badge, m.color, m.description, JSON.stringify(m.items)]);
    }

    console.log(`✓ Berhasil menyimpan ${modules.length} modul selesai ke tabel MySQL progress_modules!`);
  } catch (err) {
    console.error('Database sync error:', err.message);
  } finally {
    process.exit(0);
  }
}

syncProgressToDb();
