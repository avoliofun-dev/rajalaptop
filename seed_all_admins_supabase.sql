-- ==============================================================================
-- DATA LENGKAP ADMIN & STAF (9 ROLE LENGKAP) - SUPABASE
-- ==============================================================================
-- Jalankan skrip ini langsung di Supabase SQL Editor:
-- https://supabase.com/dashboard -> Project -> SQL Editor -> New Query
--
-- Password untuk semua akun demo (kecuali Super Admin akun pribadi):
-- Password demo: admin123
-- ==============================================================================

-- 1. Pastikan tabel admin_users sudah ada
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'kasir',
  status TEXT NOT NULL DEFAULT 'active',
  phone TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Masukkan data semua staf & role (Gunakan ON CONFLICT agar aman jika dijalankan berulang)
INSERT INTO admin_users (id, name, email, password_hash, role, status, phone, avatar) VALUES
-- Super Admin Utama (Akun Anda)
('admin-1', 'Makacin (Super Admin)', 'avoliofun@gmail.com', '$2b$10$eOBCjk/6ECxVCW5vlIB42OdB9PBFC4XHWCRvU5Ca.L3KCcEkRKbrK', 'super_admin', 'active', '085122669011', '/uploads/avatars/1790689059076-753-WhatsApp_Image_2026-09-29_at_1.jpeg'),

-- Super Admin Cadangan (admin@example.com / admin123)
('admin-super', 'Super Admin (Demo)', 'admin@example.com', '$2b$10$6YjjR4hNQZzZ/eDB6bA/dObb1mDuPDcSiOyG38tNSCQupCCDIeK/q', 'super_admin', 'active', '081234567890', NULL),

-- Owner Toko
('admin-owner', 'Mochamad Solichin (Owner)', 'owner@rajalaptop.com', '$2b$10$6YjjR4hNQZzZ/eDB6bA/dObb1mDuPDcSiOyG38tNSCQupCCDIeK/q', 'owner', 'active', '081299887766', NULL),

-- Manajer Area
('admin-area', 'Agus Pratama (Manajer Area)', 'manager@rajalaptop.com', '$2b$10$6YjjR4hNQZzZ/eDB6bA/dObb1mDuPDcSiOyG38tNSCQupCCDIeK/q', 'manajer_area', 'active', '081388776655', NULL),

-- Kepala Toko
('admin-kepala-toko', 'Doni Setiawan (Kepala Toko)', 'kepalatoko@rajalaptop.com', '$2b$10$6YjjR4hNQZzZ/eDB6bA/dObb1mDuPDcSiOyG38tNSCQupCCDIeK/q', 'kepala_toko', 'active', '081277665544', NULL),

-- Kasir
('admin-kasir', 'Siti Rahma (Kasir)', 'kasir@rajalaptop.com', '$2b$10$6YjjR4hNQZzZ/eDB6bA/dObb1mDuPDcSiOyG38tNSCQupCCDIeK/q', 'kasir', 'active', '085122669011', '/uploads/avatars/1790680428617-409-WhatsApp_Image_2026-07-27_at_1.jpeg'),

-- Finance
('admin-finance', 'Bambang Sudiro (Finance)', 'finance@rajalaptop.com', '$2b$10$6YjjR4hNQZzZ/eDB6bA/dObb1mDuPDcSiOyG38tNSCQupCCDIeK/q', 'finance', 'active', '081266554433', NULL),

-- Staf Gudang
('admin-gudang', 'Joko Susilo (Gudang)', 'gudang@rajalaptop.com', '$2b$10$6YjjR4hNQZzZ/eDB6bA/dObb1mDuPDcSiOyG38tNSCQupCCDIeK/q', 'gudang', 'active', '081355443322', NULL),

-- Audit
('admin-audit', 'Dewi Lestari (Audit)', 'audit@rajalaptop.com', '$2b$10$6YjjR4hNQZzZ/eDB6bA/dObb1mDuPDcSiOyG38tNSCQupCCDIeK/q', 'audit', 'active', '081244332211', NULL),

-- Digital Marketing
('admin-marketing', 'Rina Sasmita (Digital Marketing)', 'marketing@rajalaptop.com', '$2b$10$6YjjR4hNQZzZ/eDB6bA/dObb1mDuPDcSiOyG38tNSCQupCCDIeK/q', 'digital_marketing', 'active', '081333221100', NULL)

ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  phone = EXCLUDED.phone,
  avatar = EXCLUDED.avatar,
  updated_at = NOW();
