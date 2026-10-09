-- ==============================================================================
-- UPDATE KOLOM & SEED DATA ADMIN LENGKAP - SUPABASE
-- ==============================================================================
-- Error "column status of relation admin_users does not exist" terjadi karena
-- tabel admin_users sebelumnya dibuat tanpa kolom status, phone, atau avatar.
-- Skrip ini otomatis menambahkan kolom yang kurang terlebih dahulu!
-- ==============================================================================

-- 1. Tambahkan kolom yang kurang jika belum ada di tabel admin_users
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'kasir';
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Masukkan data 9 role staf admin
INSERT INTO admin_users (id, name, email, password_hash, role, status, phone, avatar) VALUES
-- Super Admin Utama (Akun Anda)
('admin-1', 'Makacin (Super Admin)', 'avoliofun@gmail.com', '$2b$10$eOBCjk/6ECxVCW5vlIB42OdB9PBFC4XHWCRvU5Ca.L3KCcEkRKbrK', 'super_admin', 'active', '085122669011', '/uploads/avatars/1790689059076-753-WhatsApp_Image_2026-09-29_at_1.jpeg'),

-- Super Admin Cadangan (admin@example.com / password: admin123)
('admin-super', 'Super Admin (Demo)', 'admin@example.com', '$2b$10$6YjjR4hNQZzZ/eDB6bA/dObb1mDuPDcSiOyG38tNSCQupCCDIeK/q', 'super_admin', 'active', '081234567890', NULL),

-- Owner Toko (password: admin123)
('admin-owner', 'Mochamad Solichin (Owner)', 'owner@rajalaptop.com', '$2b$10$6YjjR4hNQZzZ/eDB6bA/dObb1mDuPDcSiOyG38tNSCQupCCDIeK/q', 'owner', 'active', '081299887766', NULL),

-- Manajer Area (password: admin123)
('admin-area', 'Agus Pratama (Manajer Area)', 'manager@rajalaptop.com', '$2b$10$6YjjR4hNQZzZ/eDB6bA/dObb1mDuPDcSiOyG38tNSCQupCCDIeK/q', 'manajer_area', 'active', '081388776655', NULL),

-- Kepala Toko (password: admin123)
('admin-kepala-toko', 'Doni Setiawan (Kepala Toko)', 'kepalatoko@rajalaptop.com', '$2b$10$6YjjR4hNQZzZ/eDB6bA/dObb1mDuPDcSiOyG38tNSCQupCCDIeK/q', 'kepala_toko', 'active', '081277665544', NULL),

-- Kasir (password: admin123)
('admin-kasir', 'Siti Rahma (Kasir)', 'kasir@rajalaptop.com', '$2b$10$6YjjR4hNQZzZ/eDB6bA/dObb1mDuPDcSiOyG38tNSCQupCCDIeK/q', 'kasir', 'active', '085122669011', '/uploads/avatars/1790680428617-409-WhatsApp_Image_2026-07-27_at_1.jpeg'),

-- Finance (password: admin123)
('admin-finance', 'Bambang Sudiro (Finance)', 'finance@rajalaptop.com', '$2b$10$6YjjR4hNQZzZ/eDB6bA/dObb1mDuPDcSiOyG38tNSCQupCCDIeK/q', 'finance', 'active', '081266554433', NULL),

-- Staf Gudang (password: admin123)
('admin-gudang', 'Joko Susilo (Gudang)', 'gudang@rajalaptop.com', '$2b$10$6YjjR4hNQZzZ/eDB6bA/dObb1mDuPDcSiOyG38tNSCQupCCDIeK/q', 'gudang', 'active', '081355443322', NULL),

-- Audit (password: admin123)
('admin-audit', 'Dewi Lestari (Audit)', 'audit@rajalaptop.com', '$2b$10$6YjjR4hNQZzZ/eDB6bA/dObb1mDuPDcSiOyG38tNSCQupCCDIeK/q', 'audit', 'active', '081244332211', NULL),

-- Digital Marketing (password: admin123)
('admin-marketing', 'Rina Sasmita (Digital Marketing)', 'marketing@rajalaptop.com', '$2b$10$6YjjR4hNQZzZ/eDB6bA/dObb1mDuPDcSiOyG38tNSCQupCCDIeK/q', 'digital_marketing', 'active', '081333221100', NULL)

ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  phone = EXCLUDED.phone,
  avatar = EXCLUDED.avatar,
  updated_at = NOW();
