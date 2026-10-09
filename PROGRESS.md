# Progress Log Proyek – Raja Laptop Web & Enterprise RBAC System

Dokumen ini mencatat rekam jejak versi, pencapaian milestone, fitur yang telah berhasil diimplementasikan, serta daftar fitur yang belum atau direncanakan untuk tahap pengembangan berikutnya.

---

## 📌 Riwayat Versi Proyek (Version History)

| Versi | Tanggal | Status | Sorotan Utama (Milestones) |
| :--- | :--- | :---: | :--- |
| **v1.1.0** | 2026-09-28 | Selesai | **Fondasi Inti, Database & Enterprise RBAC**: Inisialisasi Next.js 16 + React 19, database MySQL rajalaptop, 430 katalog laptop ELS, arsitektur multi-store/multi-area, 9 role bisnis, 52 granular permissions, server-side API guard, approval flow, tracking nomor serial & IMEI, audit log kebal manipulasi, dashboard adaptif, dan otomasi 55 test. |
| **v1.2.0** | 2026-09-29 | Selesai | **Katalog, Kasir POS & Finansial**: Kurasi katalog beranda, format Rupiah konsisten, checkout cart publik, terminal kasir POS ritel, multi-gambar & lightbox produk, kalkulator laba bersih/margin live, konfigurasi pajak (PPN 11%, 12%, Non-PPN), dan profil Data Diri Admin. |
| **v1.3.0** | 2026-09-30 | Selesai | **Payment Gateway & QRIS Dinamis**: Generator QRIS dinamis Standar Bank Indonesia (EMVCo/ASPI & CRC16), Virtual Account multi-bank (BCA, Mandiri, BRI, BNI), simulasi callback verifikasi instan real-time (`/api/payment/simulate`), sinkronisasi status pembayaran pesanan pelanggan, dan integrasi modal bayar di keranjang & kasir. |
| **v1.4.0** | 2026-09-30 | Selesai | **WhatsApp Notification Gateway, POS Hardware Scanner & Footer Setting**: WhatsApp Business API Gateway untuk pengiriman otomatis nomor resi, faktur nota, tiket servis, dan alert approval sensitif ke Kepala Toko; integrasi hardware laser/bluetooth barcode scanner kasir; serta panel mandiri pengaturan konten footer web (`/admin/footer`). |
| **v1.5.0** (Saat ini) | 2026-09-30 | **Aktif / Rilis (v1.5)** | **2FA Real-Time WhatsApp OTP Login Admin & Proteksi Privasi Customer**: Pengamanan berlapis login admin dengan OTP 6-digit real-time via WhatsApp (`/api/auth/admin/verify-otp`) lengkap dengan direct WhatsApp link & tombol tempel instan; eliminasi tombol progres/ukuran dari antarmuka publik customer; perapian menu navigasi portal customer; dan pemutakhiran live monitor progres admin (`/admin/progres`). |
| **v1.6.0** | Rencana | Roadmap Mendatang | **Split Payment, Ekspor Keuangan & RMA Servis**: Pembayaran sebagian tunai + non-tunai, cetak faktur PDF & ekspor Excel (.xlsx), serta portal publik pelacakan servis mandiri dan klaim garansi RMA vendor resmi. |

---

## ✅ Fitur yang Sudah Berhasil (Completed Features)

### 1. Fondasi RBAC & Scope Data Server-Side (`v1.1.0`)
- **9 Role Standar Sesuai Struktur Bisnis Penjualan Laptop**:
  1. `Owner` (Scope: `ALL`) – Akses penuh laporan omzet, profit, valuasi stok, cabang, dan approval level tinggi.
  2. `Super Admin` (Scope: `ALL`) – Administrator teknis sistem, konfigurasi, user, store, area, dan custom role.
  3. `Manager Area` (Scope: `AREA`) – Supervisi toko-toko dalam area regionalnya (misal: Jawa Tengah), persetujuan diskon/mutasi antar cabang.
  4. `Kepala Toko` (Scope: `STORE`) – Supervisi cabang penugasan (misal: Pekalongan), monitor kinerja kasir, approve diskon/refund lokal.
  5. `Kasir` (Scope: `OWN`) – POS kasir, scan produk, buat pesanan, cetak struk, ajukan permohonan diskon (tanpa akses menu finance).
  6. `Gudang` (Scope: `STORE`) – Penerimaan barang distributor, mutasi stok, pelacakan nomor serial/IMEI, stock opname.
  7. `Finance` (Scope: `ALL`) – Verifikasi kas, pencatatan biaya operasional (*expenses*), arus kas (*cash flow*), approval refund dana.
  8. `Digital Marketing` (Scope: `ALL`) – Pengelolaan konten promosi produk, banner, voucher diskon, analitik kampanye.
  9. `Audit` (Scope: `ALL`, *Read-Only*) – Pemeriksaan kepatuhan, penelusuran forensik jejak audit log, verifikasi transaksi.
- **52 Granular Permissions**: Terpusat pada tabel `permissions` dan pivot `role_permissions` (berbasis `resource.action`).
- **Server-Side API Guard (`lib/apiGuard.js`)**: Evaluasi izin dan scope dilakukan di backend pada setiap request; menolak direct API call ilegal dengan respons HTTP 401/403.
- **Pencegahan Eskalasi Wewenang (*Anti-Privilege Escalation*)**:
  - Pengguna tidak dapat mengubah rolenya sendiri.
  - Role non-SuperAdmin tidak dapat mengangkat user menjadi SuperAdmin/Owner.
  - Akun Owner kebal dari pengubahan/penghapusan oleh staf lain.
  - Pemohon dilarang keras menyetujui (*self-approve*) tiket approval miliknya sendiri.

### 2. Multi-Store & Multi-Area Architecture (`v1.1.0`)
- **Wilayah (`areas`)**: Regionalisasi operasional (`Jawa Tengah`, `DI Yogyakarta`, `Kantor Pusat Sentral`).
- **Toko Cabang (`stores`)**: Pemisahan data per fisik cabang (`Pekalongan`, `Yogyakarta Gejayan`, `Semarang Pemuda`, `Solo Slamet Riyadi`, `Gudang Pusat Sentral`).
- **Penugasan User**: Tabel `user_stores` dan `user_areas` untuk isolasi scope multi-tenant.

### 3. Integritas Transaksi Penjualan Atomik (Atomic POS Transaction) (`v1.1.0`)
- Alur `app/api/orders/route.js`: Menggunakan `BEGIN TRANSACTION` ➔ `INSERT ORDER` ➔ `DECREMENT STOCK` ➔ `LOG STOCK_MOVEMENT` ➔ `UPDATE SERIAL STATUS` ➔ `WRITE AUDIT LOG` ➔ `COMMIT` (atau `ROLLBACK` jika salah satu langkah gagal).
- Mencegah kondisi anomali (uang masuk stok tidak berkurang, atau stok berkurang pesanan gagal tercatat).

### 4. Pelacakan Siklus Hidup Nomor Serial & IMEI Laptop (`v1.1.0`)
- Struktur tabel `product_serials` dan `serial_movements`.
- Pelacakan penuh setiap fisik unit: `SUPPLIER` ➔ `PURCHASE` ➔ `WAREHOUSE` ➔ `STORE` ➔ `SALE` ➔ `CUSTOMER` ➔ `WARRANTY`.
- UI pelacakan visual dengan audit trail riwayat mutasi per unit laptop (`/admin/serials`).

### 5. Sistem Approval Generic Terintegrasi (`v1.1.0`)
- Tabel `approval_requests` dan `approval_actions`.
- Tipe request: `DISCOUNT_OVER_LIMIT`, `STOCK_ADJUSTMENT`, `REFUND_ORDER`, `EXPENSE_CLAIM`, `PRICE_OVERRIDE`.
- Hierarki persetujuan berjenjang: Kasir ➔ Kepala Toko ➔ Manager Area ➔ Owner.

### 6. Audit Trail Kebal Manipulasi (*Append-Only Audit Log*) (`v1.1.0`)
- Tabel `audit_logs` merekam actor, role, target resource, action, status, reason, IP address, user-agent, dan diff perubahan.
- **Proteksi Mutlak**: Trigger database MySQL dan API guard secara mutlak menolak operasi `DELETE` dan `UPDATE` pada tabel ini.
- Tampilan antarmuka penelusuran forensik terfilter di `/admin/audit-logs`.

### 7. Dashboard Adaptif Multi-Role (`v1.1.0`)
- Tampilan KPI, quick actions, dan widget laporan yang menyesuaikan secara otomatis dengan role dan scope pengguna saat login.

### 8. Otomasi Pengujian Sistem (Automated Test Suite) (`v1.1.0`)
- Skrip pengujian `scripts/test_rbac.js` menjalankan 55 skenario pengujian unit & integrasi untuk memvalidasi RBAC, scope, anti-escalation, dan alur transaksi tanpa kegagalan (100% lulus).

### 9. Perbaikan Kurasi Beranda & Format Rupiah (`v1.2.0`)
- Kurasi 8 produk terbaik di beranda mencegah penumpukan data berat dari 400+ katalog.
- Standardisasi pemformatan angka mata uang Rupiah (`Rp XX.XXX.XXX`) di seluruh form dan tabel.

### 10. Terminal POS Kasir & Multi-Image Produk (`v1.2.0`)
- Modul POS kasir lengkap di admin: scan produk, quantity picker, diskon, dan metode pembayaran.
- Fitur multi-gambar produk, pratinjau galeri foto, dan modal lightbox resolusi tinggi.

### 11. HPP Modal, Opsi Tarif Pajak & Kalkulator Laba Margin Live (`v1.2.0`)
- Input Harga Modal (HPP) otomatis terhitung ke margin laba kotor.
- Pengaturan tarif pajak fleksibel (Bebas Pajak 0%, PPN 11%, PPN 12%, atau kustom %) dengan skema inclusive/exclusive.
- Kartu analitik laba bersih real-time pada formulir input produk.

### 12. Dossier Profil & Manajemen Data Diri Admin (`v1.2.0`)
- Halaman profil mandiri staf di `/admin/datadiri` dengan dukungan upload foto profil dan ganti kata sandi.

### 13. Payment Gateway QRIS Dinamis Standar Bank Indonesia (`v1.3.0`)
- Generator QRIS dinamis berbasis standar EMVCo MPM, ASPI, dan checksum CRC16 presisi (`lib/qris.js`).
- Virtual Account multi-bank (BCA, Mandiri, BRI, BNI) dengan masa berlaku 24 jam.
- Simulasi callback webhook instan untuk pengujian otomatis pembayaran (`/api/payment/simulate`).
- Sinkronisasi status bayar pesanan lunas di portal pelanggan (`/portal`) dan kasir admin (`/admin/pesanan`).

### 14. WhatsApp Notification Gateway Otomatis (`v1.4.0`)
- Notifikasi nomor resi pengiriman dan konfirmasi pesanan pelanggan otomatis terkirim ke WhatsApp.
- Pembaruan status nota servis laptop langsung terkirim ke WhatsApp pemilik.
- WhatsApp Alert Approval otomatis ke WhatsApp Kepala Toko saat ada permohonan diskon kasir.

### 15. Hardware Barcode & Serial Scanner Kasir POS (`v1.4.0`)
- Deteksi langsung input laser scanner USB dan Bluetooth untuk memasukkan unit laptop ke keranjang kasir seketika.

### 16. Panel Pengaturan Konten Footer Mandiri (`v1.4.0`)
- Antarmuka kustomisasi footer toko `/admin/footer` untuk mengatur link sosial media, info pembayaran, bantuan, dan hak cipta.

### 17. Otentikasi Berlapis 2FA Real-Time WhatsApp OTP Login Admin (`v1.5.0`)
- Pengamanan ketat login admin menggunakan kode verifikasi 6 digit yang dikirimkan secara instan via WhatsApp Gateway (`/api/auth/admin/verify-otp`).
- Masa aktif 5 menit, proteksi batas percobaan salah, tombol cooldown kirim ulang, serta tautan langsung buka chat WhatsApp.
- Kotak bantuan kode OTP dan tombol "Tempel Otomatis" untuk kelancaran pengujian lokal tanpa hambatan.

### 18. Proteksi Privasi & Tampilan Eksklusif Pelanggan (`v1.5.0`)
- Menghilangkan tombol progres dan metrik ukuran disk (1.85 GB) dari beranda, footer, dan sidebar publik.
- Mengeliminasi menu duplikat portal pelanggan di sidebar, menyatukannya secara rapi ke grup "Akun Saya ➔ Pesanan & Servis".
- Membuka hak akses halaman Progres Web (`/admin/progres`) untuk Super Admin dan Owner.

---

## ⏳ Fitur yang Belum / Rencana Selanjutnya (Roadmap & Backlog)

### 1. Pembayaran & Kasir Lanjutan (POS Advanced)
- [x] **Integrasi Payment Gateway**: Dukungan QRIS dinamis, Virtual Account BCA/Mandiri/BRI/BNI via Payment Gateway. *(Selesai di v1.3)*
- [x] **Hardware Barcode & Serial Scanner**: Integrasi hardware USB/Bluetooth laser scanner untuk scan barcode dan serial number laptop saat transaksi kasir. *(Selesai di v1.4)*
- [ ] **Split Payment & Kasbon**: Dukungan pembayaran sebagian tunai + transfer, serta termin kredit internal. *(Target v1.6)*

### 2. Notifikasi Otomatis & Keamanan (Omnichannel & Security)
- [x] **WhatsApp Business API Gateway**: Pengiriman otomatis struk digital, nota servis, dan konfirmasi resi pengiriman laptop ke nomor WA pelanggan. *(Selesai di v1.4)*
- [x] **Notifikasi Approval Realtime**: Alert instan ke WhatsApp Kepala Toko / Manager saat kasir mengajukan permohonan diskon. *(Selesai di v1.4)*
- [x] **Two-Factor Authentication (2FA) WhatsApp OTP Admin**: Pengamanan login staf admin dengan 6 digit OTP WhatsApp real-time. *(Selesai di v1.5)*

### 3. Modul Servis Lanjutan (Service Center Management)
- [ ] **Klaim Garansi Resmi Vendor (RMA)**: Alur RMA unit servis ke service center distributor (Asus Service Center, Acer Care, Lenovo Service Center). *(Target v1.6)*
- [ ] **Pelacakan Tiket Servis Pelanggan Publik**: Halaman cek status servis mandiri oleh pelanggan menggunakan nomor nota/telepon. *(Target v1.6)*

### 4. Laporan & Ekspor Berkas (Reporting & Exports)
- [ ] **Ekspor Laporan Keuangan & Pajak**: Format Excel (.xlsx) dan PDF untuk laporan laba rugi, neraca kasir, dan rekap PPN. *(Target v1.6)*
- [x] **Cetak Thermal POS (Receipt Printing)**: Format cetak struk nota kasir dan struk WhatsApp pelanggan. *(Selesai di v1.4)*

---

## 🔐 Matriks Akun Uji Coba (Credentials Matrix)

Semua akun default memiliki kata sandi: `admin123`

| Role | Email Login | Scope | Cakupan Area/Cabang |
| :--- | :--- | :---: | :--- |
| **Owner** | `owner@rajalaptop.com` | `ALL` | Seluruh Cabang & Perusahaan |
| **Super Admin** | `admin@example.com` | `ALL` | Seluruh Sistem |
| **Manager Area** | `manager@rajalaptop.com` | `AREA` | Jawa Tengah (Pekalongan, Semarang, Solo) |
| **Kepala Toko** | `kepalatoko@rajalaptop.com` | `STORE` | Raja Laptop Pekalongan |
| **Kasir** | `kasir@rajalaptop.com` | `OWN` | Raja Laptop Pekalongan (Data Pribadi) |
| **Gudang** | `gudang@rajalaptop.com` | `STORE` | Gudang Distribusi Sentral |
| **Finance** | `finance@rajalaptop.com` | `ALL` | Arus Kas & Pengeluaran Perusahaan |
| **Digital Marketing** | `marketing@rajalaptop.com` | `ALL` | Promosi & Konten Katalog |
| **Audit** | `audit@rajalaptop.com` | `ALL` (RO) | Pengawasan & Forensik Audit Trail |

---

*Terakhir diperbarui: 2026-09-30 | Versi Proyek: v1.5.0-security-wa-otp*
