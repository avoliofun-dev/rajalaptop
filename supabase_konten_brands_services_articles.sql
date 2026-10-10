-- ==============================================================================
-- SKRIP SQL SUPABASE: TABEL KONTEN LENGKAP (BRANDS, LAYANAN, ARTIKEL)
-- Proyek: Raja Laptop
-- ==============================================================================
-- Cara Menjalankan:
-- 1. Buka Supabase Dashboard -> Masuk ke project Anda.
-- 2. Pilih menu "SQL Editor" -> Klik "New Query".
-- 3. Paste seluruh skrip SQL di bawah ini, lalu klik "RUN".
-- ==============================================================================

-- ==============================================================================
-- 1. TABEL BRAND RESMI & OFFICIAL PARTNER
-- ==============================================================================
CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT '💻',
  "desc" TEXT DEFAULT 'Official Partner',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pastikan kolom tabel brands lengkap
ALTER TABLE brands ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '💻';
ALTER TABLE brands ADD COLUMN IF NOT EXISTS "desc" TEXT DEFAULT 'Official Partner';

-- Masukkan 8 Brand Resmi Mitra Awal
INSERT INTO brands (name, icon, "desc") VALUES
('ASUS', '💻', 'Official Partner'),
('Lenovo', '⚡', 'Authorized Dealer'),
('Apple', '🍏', 'Official Reseller'),
('MSI', '🐲', 'Gaming Partner'),
('HP', '💼', 'Authorized Partner'),
('Acer', '🔥', 'Official Partner'),
('Dell', '🏢', 'Enterprise Dealer'),
('Axioo', '🇮🇩', 'Lokal Partner')
ON CONFLICT (name) DO UPDATE SET
  icon = EXCLUDED.icon,
  "desc" = EXCLUDED."desc";

-- ==============================================================================
-- 2. TABEL SERVIS & REPARASI (LAYANAN TOKO)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS store_services (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  "desc" TEXT,
  badge TEXT DEFAULT 'Layanan Resmi',
  duration TEXT DEFAULT '1-2 Hari',
  warranty TEXT DEFAULT '1 Bulan',
  price_text TEXT DEFAULT 'Hubungi Kami',
  features TEXT,
  sort_order INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pastikan kolom tabel store_services lengkap
ALTER TABLE store_services ADD COLUMN IF NOT EXISTS "desc" TEXT;
ALTER TABLE store_services ADD COLUMN IF NOT EXISTS badge TEXT DEFAULT 'Layanan Resmi';
ALTER TABLE store_services ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT '1-2 Hari';
ALTER TABLE store_services ADD COLUMN IF NOT EXISTS warranty TEXT DEFAULT '1 Bulan';
ALTER TABLE store_services ADD COLUMN IF NOT EXISTS price_text TEXT DEFAULT 'Hubungi Kami';
ALTER TABLE store_services ADD COLUMN IF NOT EXISTS features TEXT;
ALTER TABLE store_services ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 1;
ALTER TABLE store_services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE store_services ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Masukkan Data Layanan Servis Awal
INSERT INTO store_services (id, title, badge, duration, warranty, price_text, "desc", features, sort_order) VALUES
('srv-1', 'Ganti Pasta & Pembersihan', 'Bisa Ditunggu', '30-45 Menit', '1 Bulan', 'Mulai Rp 75.000', 'Pembersihan kipas, heatsink, dan penggantian thermal paste berkualitas tinggi (Noctua / Grizzly) agar suhu laptop dingin dan tidak overheating.', 'Thermal paste premium, Pembersihan debu total, Pengecekan temperatur', 1),
('srv-2', 'Upgrade RAM & SSD NVMe', 'Garansi Resmi', '15-30 Menit', '1-3 Tahun', 'Biaya Pasang Gratis', 'Percepat performa laptop untuk multitasking dan gaming. Kompatibilitas dijamin 100% dan migrasi data/Windows aman tanpa hilang file.', 'SSD NVMe Gen3/Gen4, RAM DDR4/DDR5, Kloning OS & data aman', 2),
('srv-3', 'Servis Mesin & Motherboard', 'Teknisi Senior', '1-3 Hari', '3 Bulan', 'Cek Gratis', 'Perbaikan laptop mati total, kena air, korsleting, no display, atau kerusakan IC power. Pengecekan awal gratis tanpa biaya pembatalan.', 'Peralatan osiloskop modern, Komponen original, Garansi perbaikan nyata', 3),
('srv-4', 'Ganti Baterai, Keyboard & LCD', 'Part Original', '1-2 Jam', '6 Bulan', 'Sesuai Tipe Laptop', 'Penggantian spare part layar pecah, garis-garis, tombol keyboard macet, atau baterai drop cepat habis dengan suku cadang bergaransi resmi.', 'Layar IPS/OLED original, Baterai certified tahan lama, Keyboard empuk presisi', 4)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  badge = EXCLUDED.badge,
  duration = EXCLUDED.duration,
  warranty = EXCLUDED.warranty,
  price_text = EXCLUDED.price_text,
  "desc" = EXCLUDED."desc",
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order;

-- ==============================================================================
-- 3. TABEL TIPS & ARTIKEL EDUKASI
-- ==============================================================================
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

-- Masukkan Contoh Artikel Edukasi Awal
INSERT INTO articles (id, title, slug, category, author, readTime, summary, content, imageUrl, is_published) VALUES
('art-1', 'Panduan Memilih Laptop Gaming 2026: RTX 4050 vs RTX 4060', 'panduan-laptop-gaming-2026', 'Tips & Panduan', 'Tim Tekno Raja', '5 Menit', 'Simak perbandingan performa FPS, efisiensi daya, dan rekomendasi laptop gaming terbaik untuk budget 12-20 jutaan.', 'Di tahun 2026, kartu grafis arsitektur Ada Lovelace masih menjadi standar emas gaming 1080p dan 1440p. Memilih antara RTX 4050 dan 4060 sangat bergantung pada resolusi target dan VRAM 6GB vs 8GB...', 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&auto=format&fit=crop&q=80', TRUE),
('art-2', '5 Tanda Laptop Perlu Repasta Thermal & Pembersihan Total', 'tanda-laptop-perlu-repasta', 'Perawatan & Servis', 'Master Teknisi', '4 Menit', 'Suhu tembus 90°C saat idle? Kipas mendesing keras? Ketahui bahaya thermal throttling sebelum merusak chipset prosesor.', 'Thermal paste memiliki masa pakai efektif 12 hingga 18 bulan. Jika laptop sering dipakai render atau gaming berat, pasta pendingin akan mengering dan mengeras...', 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&auto=format&fit=crop&q=80', TRUE),
('art-3', 'Review Lengkap ASUS ROG Zephyrus G16 OLED: Bodi Tipis, Performa Monster', 'review-rog-zephyrus-g16', 'Review Laptop', 'Redaksi RajaLaptop', '6 Menit', 'Laptop gaming impian konten kreator dengan layar ROG Nebula OLED 240Hz, sasis aluminium CNC, dan speaker paling bertenaga di kelasnya.', 'ASUS berhasil membuktikan bahwa laptop gaming bertenaga tinggi tidak harus tebal dan berat. Zephyrus G16 hadir dengan ketebalan di bawah 1.5 cm...', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&auto=format&fit=crop&q=80', TRUE)
ON CONFLICT (id) DO NOTHING;
