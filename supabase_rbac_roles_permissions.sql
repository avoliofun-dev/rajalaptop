-- ==============================================================================
-- SKEMA & SEED ROLE, HAK AKSES (PERMISSIONS), DAN ADMIN USERS DI SUPABASE
-- Sistem RBAC Enterprise: Raja Laptop
-- ==============================================================================
-- Cara pakai:
-- 1. Buka Supabase Dashboard -> Masuk ke project Anda.
-- 2. Pilih menu "SQL Editor" -> Buat "New Query".
-- 3. Paste seluruh isi file ini, lalu klik "RUN".
-- ==============================================================================

-- 1. TABEL AREAS (Wilayah Operasional)
CREATE TABLE IF NOT EXISTS areas (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL STORES (Cabang Toko & Gudang)
CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  area_id TEXT NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'store', -- store, warehouse, headquarters
  address TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL ROLES (Master Peran Staf/Admin)
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  default_scope TEXT NOT NULL DEFAULT 'STORE', -- ALL, AREA, STORE, OWN
  is_system BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL PERMISSIONS (Daftar Izin & Fitur Sistem)
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL PIVOT ROLE_PERMISSIONS (Hak Akses Setiap Role)
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id TEXT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'STORE', -- ALL, AREA, STORE, OWN
  PRIMARY KEY (role_id, permission_id)
);

-- 6. PASTIKAN TABEL ADMIN_USERS MEMILIKI KOLOM LENGKAP
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'kasir',
  role_id TEXT,
  primary_store_id TEXT DEFAULT 'store-pekalongan',
  primary_area_id TEXT DEFAULT 'area-jateng',
  status TEXT NOT NULL DEFAULT 'active',
  phone TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role_id TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS primary_store_id TEXT DEFAULT 'store-pekalongan';
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS primary_area_id TEXT DEFAULT 'area-jateng';
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- 7. TABEL ASSIGNMENT CABANG & WILAYAH UNTUK USER
CREATE TABLE IF NOT EXISTS user_stores (
  user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, store_id)
);

CREATE TABLE IF NOT EXISTS user_areas (
  user_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  area_id TEXT NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, area_id)
);

-- 8. TABEL KONTEN LAYANAN TOKO (SERVIS & REPARASI)
CREATE TABLE IF NOT EXISTS store_services (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  desc TEXT,
  badge TEXT DEFAULT 'Layanan Resmi',
  duration TEXT DEFAULT '1-2 Hari',
  warranty TEXT DEFAULT '1 Bulan',
  priceText TEXT DEFAULT 'Hubungi Kami',
  features TEXT,
  sort_order INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABEL ARTIKEL & TIPS EDUKASI
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  category TEXT DEFAULT 'Tips & Panduan',
  author TEXT DEFAULT 'Admin',
  readTime TEXT DEFAULT '5 Menit',
  summary TEXT,
  content TEXT,
  imageUrl TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ==============================================================================
-- SEED DATA 1: AREAS & CABANG TOKO
-- ==============================================================================
INSERT INTO areas (id, code, name, description) VALUES
('area-jateng', 'JATENG', 'Jawa Tengah', 'Area operasional Jawa Tengah (Pekalongan, Semarang, Solo)'),
('area-diy', 'DIY', 'DI Yogyakarta', 'Area operasional DI Yogyakarta (Gejayan & sekitarnya)'),
('area-pusat', 'PUSAT', 'Kantor Pusat & Gudang Sentral', 'Wilayah manajemen pusat dan distribusi utama')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

INSERT INTO stores (id, code, name, area_id, type, address, phone, is_active) VALUES
('store-pekalongan', 'PKL01', 'Raja Laptop Pekalongan', 'area-jateng', 'store', 'Jl. Hayam Wuruk No. 88, Pekalongan', '0285-421999', TRUE),
('store-gejayan', 'YOG01', 'Raja Laptop Yogyakarta Gejayan', 'area-diy', 'store', 'Jl. Gejayan (Affandi) No. 45B, Sleman, Yogyakarta', '0274-556789', TRUE),
('store-semarang', 'SMG01', 'Raja Laptop Semarang Pemuda', 'area-jateng', 'store', 'Jl. Pemuda No. 102, Semarang', '024-8451234', TRUE),
('store-solo', 'SLO01', 'Raja Laptop Solo Slamet Riyadi', 'area-jateng', 'store', 'Jl. Slamet Riyadi No. 250, Surakarta', '0271-712888', TRUE),
('warehouse-pusat', 'WH-CENTRAL', 'Gudang Distribusi Sentral Jateng-DIY', 'area-pusat', 'warehouse', 'Kawasan Pergudangan Gejayan, Sleman', '0274-556790', TRUE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, area_id = EXCLUDED.area_id, address = EXCLUDED.address, phone = EXCLUDED.phone;

-- ==============================================================================
-- SEED DATA 2: DAFTAR 9 ROLE ADMIN
-- ==============================================================================
INSERT INTO roles (id, slug, name, description, default_scope, is_system) VALUES
('role-owner', 'owner', 'Owner', 'Pemilik bisnis dengan akses penuh seluruh dashboard, laporan omzet, dan otorisasi level tinggi.', 'ALL', TRUE),
('role-super-admin', 'super_admin', 'Super Admin', 'Administrator teknis sistem, manajemen pengguna, konfigurasi, hak akses, dan master data.', 'ALL', TRUE),
('role-manajer-area', 'manajer_area', 'Manager Area', 'Pengawas operasional dan persetujuan transaksi seluruh toko dalam regional yang ditugaskan.', 'AREA', TRUE),
('role-kepala-toko', 'kepala_toko', 'Kepala Toko', 'Pimpinan operasional toko cabang spesifik, persetujuan diskon/refund, dan monitoring staf.', 'STORE', TRUE),
('role-kasir', 'kasir', 'Kasir', 'Operasional POS kasir, scan produk, input pesanan penjualan, dan cetak struk nota.', 'OWN', TRUE),
('role-gudang', 'gudang', 'Gudang', 'Penerimaan stok, mutasi antar cabang, pendataan serial number/IMEI, dan stock opname fisik.', 'STORE', TRUE),
('role-finance', 'finance', 'Finance', 'Pengelolaan arus kas, verifikasi mutasi rekening, hutang/piutang supplier, dan laporan keuangan.', 'ALL', TRUE),
('role-digital-marketing', 'digital_marketing', 'Digital Marketing', 'Pengelolaan promo, landing page, voucher diskon, banner slider, dan analitik pemasaran.', 'ALL', TRUE),
('role-audit', 'audit', 'Audit & Compliance', 'Pengawas kepatuhan (Read-Only) seluruh log audit, riwayat transaksi, dan inventaris barang.', 'ALL', TRUE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, default_scope = EXCLUDED.default_scope;

-- ==============================================================================
-- SEED DATA 3: DAFTAR PERMISSION (HAK AKSES GRANULAR)
-- ==============================================================================
INSERT INTO permissions (id, slug, module, action, description) VALUES
-- Dashboard
('perm-dashboard-view', 'dashboard.view', 'dashboard', 'view', 'Melihat dashboard umum'),
('perm-dashboard-financial', 'dashboard.financial', 'dashboard', 'view_financial', 'Melihat widget keuangan sensitif di dashboard (omzet, profit)'),
-- Katalog Produk
('perm-products-view', 'products.view', 'products', 'view', 'Melihat daftar produk & harga'),
('perm-products-create', 'products.create', 'products', 'create', 'Menambah produk baru'),
('perm-products-update', 'products.update', 'products', 'update', 'Mengubah data produk & harga'),
('perm-products-delete', 'products.delete', 'products', 'delete', 'Menghapus produk dari katalog'),
-- Penjualan & POS Kasir
('perm-sales-view', 'sales.view', 'sales', 'view', 'Melihat riwayat transaksi penjualan'),
('perm-sales-create', 'sales.create', 'sales', 'create', 'Melakukan transaksi kasir / POS'),
('perm-sales-update', 'sales.update', 'sales', 'update', 'Mengubah status pesanan penjualan'),
('perm-sales-cancel', 'sales.cancel', 'sales', 'cancel', 'Membatalkan pesanan transaksi'),
('perm-sales-discount', 'sales.discount', 'sales', 'discount', 'Menerapkan diskon manual kasir'),
('perm-sales-refund', 'sales.refund', 'sales', 'refund', 'Memproses pengembalian barang/dana (refund)'),
-- Stok & Inventaris
('perm-stock-view', 'stock.view', 'stock', 'view', 'Melihat stok fisik barang'),
('perm-stock-receive', 'stock.receive', 'stock', 'receive', 'Menerima stok masuk dari supplier/distributor'),
('perm-stock-transfer', 'stock.transfer', 'stock', 'transfer', 'Transfer stok antar cabang/gudang'),
('perm-stock-adjust', 'stock.adjust', 'stock', 'adjust', 'Penyesuaian stok rusak/selisih'),
('perm-stock-opname', 'stock.opname', 'stock', 'opname', 'Melakukan stock opname fisik'),
-- Serial Number & IMEI Laptop
('perm-serials-view', 'serials.view', 'serials', 'view', 'Melihat histori serial number unit laptop'),
('perm-serials-manage', 'serials.manage', 'serials', 'manage', 'Input dan mutasi serial number laptop'),
-- Pembelian (Purchase Order)
('perm-purchase-view', 'purchase.view', 'purchase', 'view', 'Melihat daftar Purchase Order supplier'),
('perm-purchase-create', 'purchase.create', 'purchase', 'create', 'Membuat draft Purchase Order'),
('perm-purchase-approve', 'purchase.approve', 'purchase', 'approve', 'Menyetujui PO pembelian ke supplier'),
-- Keuangan (Finance)
('perm-finance-view', 'finance.view', 'finance', 'view', 'Melihat buku kas, bank, dan arus keuangan'),
('perm-finance-create', 'finance.create', 'finance', 'create', 'Mencatat pengeluaran & pemasukan operasional'),
('perm-finance-approve', 'finance.approve', 'finance', 'approve', 'Menyetujui klaim biaya operasional'),
('perm-finance-export', 'finance.export', 'finance', 'export', 'Export laporan keuangan'),
-- Servis
('perm-service-view', 'service.view', 'service', 'view', 'Melihat daftar tiket servis laptop'),
('perm-service-manage', 'service.manage', 'service', 'manage', 'Update status pengerjaan servis & biaya'),
-- Manajemen User & Staf
('perm-users-view', 'users.view', 'users', 'view', 'Melihat daftar staf admin'),
('perm-users-create', 'users.create', 'users', 'create', 'Menambah staf admin baru'),
('perm-users-update', 'users.update', 'users', 'update', 'Mengubah profil, role, atau cabang staf'),
('perm-users-disable', 'users.disable', 'users', 'disable', 'Menonaktifkan akun staf'),
-- Manajemen Role & RBAC
('perm-roles-view', 'roles.view', 'roles', 'view', 'Melihat daftar role & permission'),
('perm-roles-create', 'roles.create', 'roles', 'create', 'Membuat custom role baru'),
('perm-roles-update', 'roles.update', 'roles', 'update', 'Mengubah izin permission role'),
('perm-roles-delete', 'roles.delete', 'roles', 'delete', 'Menghapus custom role'),
-- Toko & Wilayah
('perm-stores-manage', 'stores.manage', 'stores', 'manage', 'Mengelola data cabang toko dan area'),
-- Marketing & Promosi
('perm-marketing-view', 'marketing.view', 'marketing', 'view', 'Melihat banner, promo, voucher'),
('perm-marketing-create', 'marketing.create', 'marketing', 'create', 'Membuat banner & promo baru'),
('perm-marketing-update', 'marketing.update', 'marketing', 'update', 'Mengubah banner promosi & konten'),
('perm-marketing-publish', 'marketing.publish', 'marketing', 'publish', 'Menerbitkan kampanye promosi'),
-- Laporan (Reports)
('perm-reports-sales', 'reports.sales', 'reports', 'sales', 'Melihat laporan penjualan dan omzet'),
('perm-reports-stock', 'reports.stock', 'reports', 'stock', 'Melihat laporan perputaran stok barang'),
('perm-reports-finance', 'reports.finance', 'reports', 'finance', 'Melihat laporan laba rugi & keuangan'),
('perm-reports-audit', 'reports.audit', 'reports', 'audit', 'Melihat laporan audit aktivitas'),
-- Audit Logs
('perm-audit-view', 'audit.view', 'audit', 'view', 'Melihat catatan audit log aktivitas pengguna'),
('perm-audit-export', 'audit.export', 'audit', 'export', 'Export catatan audit log ke file'),
-- Approval Otorisasi
('perm-approval-view', 'approval.view', 'approval', 'view', 'Melihat daftar pengajuan approval'),
('perm-approval-create', 'approval.create', 'approval', 'create', 'Mengajukan request diskon/refund/stok'),
('perm-approval-approve', 'approval.approve', 'approval', 'approve', 'Menyetujui (Approve) request persetujuan'),
('perm-approval-reject', 'approval.reject', 'approval', 'reject', 'Menolak (Reject) request persetujuan'),
-- Pengaturan Sistem
('perm-settings-manage', 'settings.manage', 'settings', 'manage', 'Mengubah pengaturan website, kontak & WA')
ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description;

-- ==============================================================================
-- SEED DATA 4: PEMETAAN AKSES TIAP ADMIN (ROLE_PERMISSIONS)
-- ==============================================================================
-- Bersihkan mapping lama untuk sinkronisasi bersih
DELETE FROM role_permissions WHERE role_id IN (
  'role-owner', 'role-super-admin', 'role-manajer-area', 'role-kepala-toko',
  'role-kasir', 'role-gudang', 'role-finance', 'role-digital-marketing', 'role-audit'
);

-- 1. OWNER (Semua laporan, ringkasan bisnis, finansial, approval level atas)
INSERT INTO role_permissions (role_id, permission_id, scope)
SELECT 'role-owner', id, 'ALL' FROM permissions WHERE slug IN (
  'dashboard.view', 'dashboard.financial', 'products.view', 'sales.view',
  'stock.view', 'serials.view', 'purchase.view', 'finance.view',
  'service.view', 'users.view', 'roles.view', 'marketing.view',
  'reports.sales', 'reports.stock', 'reports.finance', 'reports.audit',
  'audit.view', 'audit.export', 'approval.view', 'approval.approve', 'approval.reject'
);

-- 2. SUPER ADMIN (Akses penuh ke semua modul sistem)
INSERT INTO role_permissions (role_id, permission_id, scope)
SELECT 'role-super-admin', id, 'ALL' FROM permissions;

-- 3. MANAGER AREA (Operasional dan approval dalam lingkup wilayahnya)
INSERT INTO role_permissions (role_id, permission_id, scope)
SELECT 'role-manajer-area', id, 'AREA' FROM permissions WHERE slug IN (
  'dashboard.view', 'dashboard.financial', 'products.view', 'sales.view', 'sales.discount',
  'stock.view', 'stock.transfer', 'stock.adjust', 'stock.opname', 'serials.view',
  'purchase.view', 'service.view', 'users.view', 'reports.sales', 'reports.stock',
  'approval.view', 'approval.approve', 'approval.reject'
);

-- 4. KEPALA TOKO (Operasional toko cabang spesifik, approval diskon & refund)
INSERT INTO role_permissions (role_id, permission_id, scope)
SELECT 'role-kepala-toko', id, 'STORE' FROM permissions WHERE slug IN (
  'dashboard.view', 'products.view', 'sales.view', 'sales.create', 'sales.update',
  'sales.discount', 'sales.refund', 'stock.view', 'stock.transfer', 'stock.adjust',
  'stock.opname', 'serials.view', 'service.view', 'service.manage', 'users.view',
  'reports.sales', 'reports.stock', 'approval.view', 'approval.create', 'approval.approve', 'approval.reject'
);

-- 5. KASIR (Operasional POS & input transaksi sendiri)
INSERT INTO role_permissions (role_id, permission_id, scope)
SELECT 'role-kasir', id, 'OWN' FROM permissions WHERE slug IN (
  'dashboard.view', 'products.view', 'sales.view', 'sales.create',
  'sales.discount', 'serials.view', 'approval.view', 'approval.create'
);

-- 6. GUDANG (Penerimaan, mutasi fisik, opname, serial number laptop di tokonya)
INSERT INTO role_permissions (role_id, permission_id, scope)
SELECT 'role-gudang', id, 'STORE' FROM permissions WHERE slug IN (
  'dashboard.view', 'products.view', 'stock.view', 'stock.receive',
  'stock.transfer', 'stock.adjust', 'stock.opname', 'serials.view',
  'serials.manage', 'reports.stock', 'approval.view', 'approval.create'
);

-- 7. FINANCE (Keuangan, buku kas, verifikasi refund, laporan laba rugi)
INSERT INTO role_permissions (role_id, permission_id, scope)
SELECT 'role-finance', id, 'ALL' FROM permissions WHERE slug IN (
  'dashboard.view', 'dashboard.financial', 'sales.view', 'sales.refund',
  'purchase.view', 'finance.view', 'finance.create', 'finance.approve',
  'finance.export', 'reports.sales', 'reports.finance', 'approval.view',
  'approval.approve', 'approval.reject'
);

-- 8. DIGITAL MARKETING (Banner, katalog promosi, voucher diskon)
INSERT INTO role_permissions (role_id, permission_id, scope)
SELECT 'role-digital-marketing', id, 'ALL' FROM permissions WHERE slug IN (
  'dashboard.view', 'products.view', 'marketing.view', 'marketing.create',
  'marketing.update', 'marketing.publish', 'reports.sales'
);

-- 9. AUDIT (Pengawas Read-Only seluruh log dan data)
INSERT INTO role_permissions (role_id, permission_id, scope)
SELECT 'role-audit', id, 'ALL' FROM permissions WHERE slug IN (
  'dashboard.view', 'dashboard.financial', 'products.view', 'sales.view',
  'stock.view', 'serials.view', 'purchase.view', 'finance.view',
  'service.view', 'users.view', 'roles.view', 'reports.sales',
  'reports.stock', 'reports.finance', 'reports.audit', 'audit.view',
  'audit.export', 'approval.view'
);

-- ==============================================================================
-- SEED DATA 5: DATA AKUN ADMIN USERS LENGKAP (9 ROLE STAF)
-- Password default: admin123 (kecuali akun utama Makacin)
-- ==============================================================================
INSERT INTO admin_users (id, name, email, password_hash, role, role_id, primary_store_id, primary_area_id, status, phone, avatar) VALUES
-- 1. Super Admin Utama
('admin-1', 'Makacin (Super Admin)', 'avoliofun@gmail.com', '$2b$10$eOBCjk/6ECxVCW5vlIB42OdB9PBFC4XHWCRvU5Ca.L3KCcEkRKbrK', 'super_admin', 'role-super-admin', 'store-pekalongan', 'area-jateng', 'active', '085122669011', '/uploads/avatars/1790689059076-753-WhatsApp_Image_2026-09-29_at_1.jpeg'),

-- 2. Super Admin Cadangan
('admin-super', 'Super Admin (Demo)', 'admin@example.com', '$2b$10$6YjjR4hNQZzZ/eDB6bA/dObb1mDuPDcSiOyG38tNSCQupCCDIeK/q', 'super_admin', 'role-super-admin', 'store-pekalongan', 'area-jateng', 'active', '081234567890', NULL),

-- 3. Owner Toko
('admin-owner', 'Mochamad Solichin (Owner)', 'owner@rajalaptop.com', '$2b$10$6YjjR4hNQZzZ/eDB6bA/dObb1mDuPDcSiOyG38tNSCQupCCDIeK/q', 'owner', 'role-owner', 'store-pekalongan', 'area-jateng', 'active', '081299887766', NULL),

-- 4. Manajer Area
('admin-area', 'Agus Pratama (Manajer Area)', 'manager@rajalaptop.com', '$2b$10$6YjjR4hNQZzZ/eDB6bA/dObb1mDuPDcSiOyG38tNSCQupCCDIeK/q', 'manajer_area', 'role-manajer-area', 'store-pekalongan', 'area-jateng', 'active', '081388776655', NULL),

-- 5. Kepala Toko
('admin-kepala-toko', 'Doni Setiawan (Kepala Toko)', 'kepalatoko@rajalaptop.com', '$2b$10$6YjjR4hNQZzZ/eDB6bA/dObb1mDuPDcSiOyG38tNSCQupCCDIeK/q', 'kepala_toko', 'role-kepala-toko', 'store-pekalongan', 'area-jateng', 'active', '081277665544', NULL),

-- 6. Kasir
('admin-kasir', 'Siti Rahma (Kasir)', 'kasir@rajalaptop.com', '$2b$10$6YjjR4hNQZzZ/eDB6bA/dObb1mDuPDcSiOyG38tNSCQupCCDIeK/q', 'kasir', 'role-kasir', 'store-pekalongan', 'area-jateng', 'active', '085122669011', '/uploads/avatars/1790680428617-409-WhatsApp_Image_2026-07-27_at_1.jpeg'),

-- 7. Finance
('admin-finance', 'Bambang Sudiro (Finance)', 'finance@rajalaptop.com', '$2b$10$6YjjR4hNQZzZ/eDB6bA/dObb1mDuPDcSiOyG38tNSCQupCCDIeK/q', 'finance', 'role-finance', 'store-pekalongan', 'area-jateng', 'active', '081266554433', NULL),

-- 8. Staf Gudang
('admin-gudang', 'Joko Susilo (Gudang)', 'gudang@rajalaptop.com', '$2b$10$6YjjR4hNQZzZ/eDB6bA/dObb1mDuPDcSiOyG38tNSCQupCCDIeK/q', 'gudang', 'role-gudang', 'store-pekalongan', 'area-jateng', 'active', '081355443322', NULL),

-- 9. Audit
('admin-audit', 'Dewi Lestari (Audit)', 'audit@rajalaptop.com', '$2b$10$6YjjR4hNQZzZ/eDB6bA/dObb1mDuPDcSiOyG38tNSCQupCCDIeK/q', 'audit', 'role-audit', 'store-pekalongan', 'area-jateng', 'active', '081244332211', NULL),

-- 10. Digital Marketing
('admin-marketing', 'Rina Sasmita (Digital Marketing)', 'marketing@rajalaptop.com', '$2b$10$6YjjR4hNQZzZ/eDB6bA/dObb1mDuPDcSiOyG38tNSCQupCCDIeK/q', 'digital_marketing', 'role-digital-marketing', 'store-pekalongan', 'area-jateng', 'active', '081333221100', NULL)

ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  role_id = EXCLUDED.role_id,
  primary_store_id = EXCLUDED.primary_store_id,
  primary_area_id = EXCLUDED.primary_area_id,
  status = EXCLUDED.status,
  phone = EXCLUDED.phone,
  avatar = EXCLUDED.avatar,
  updated_at = NOW();

-- ==============================================================================
-- SEED DATA 6: HUBUNGKAN ADMIN DENGAN CABANG & AREA DEFAULT
-- ==============================================================================
INSERT INTO user_stores (user_id, store_id, is_primary) VALUES
('admin-1', 'store-pekalongan', TRUE),
('admin-super', 'store-pekalongan', TRUE),
('admin-owner', 'store-pekalongan', TRUE),
('admin-area', 'store-pekalongan', TRUE),
('admin-kepala-toko', 'store-pekalongan', TRUE),
('admin-kasir', 'store-pekalongan', TRUE),
('admin-finance', 'store-pekalongan', TRUE),
('admin-gudang', 'store-pekalongan', TRUE),
('admin-audit', 'store-pekalongan', TRUE),
('admin-marketing', 'store-pekalongan', TRUE)
ON CONFLICT (user_id, store_id) DO NOTHING;

INSERT INTO user_areas (user_id, area_id) VALUES
('admin-1', 'area-jateng'),
('admin-super', 'area-jateng'),
('admin-owner', 'area-jateng'),
('admin-area', 'area-jateng'),
('admin-kepala-toko', 'area-jateng'),
('admin-kasir', 'area-jateng'),
('admin-finance', 'area-jateng'),
('admin-gudang', 'area-jateng'),
('admin-audit', 'area-jateng'),
('admin-marketing', 'area-jateng')
ON CONFLICT (user_id, area_id) DO NOTHING;
