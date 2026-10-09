-- ==============================================================================
-- SKEMA SUPABASE LENGKAP - RAJA LAPTOP
-- ==============================================================================
-- Jalankan skrip ini langsung di Supabase SQL Editor:
-- https://supabase.com/dashboard -> Project -> SQL Editor -> New Query
-- ==============================================================================

-- 1. TABEL PENGATURAN TOKO & SITUS
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL ADMIN & STAF
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

-- 3. TABEL PELANGGAN
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT,
  tier TEXT DEFAULT 'Member',
  points INTEGER DEFAULT 0,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL KATALOG PRODUK
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT,
  name TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT 'Lainnya',
  category TEXT NOT NULL DEFAULT 'gaming',
  price NUMERIC(15,2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(15,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  tax_type TEXT DEFAULT 'none',
  original_price NUMERIC(15,2),
  "originalPrice" NUMERIC(15,2),
  discount INTEGER DEFAULT 0,
  stock INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  specs TEXT,
  emoji TEXT DEFAULT '💻',
  rating NUMERIC(3,1) DEFAULT 5.0,
  sold INTEGER DEFAULT 0,
  image_url TEXT,
  images TEXT,
  description TEXT,
  processor TEXT,
  ram_gb INTEGER,
  storage_gb INTEGER,
  display_spec TEXT,
  operating_system TEXT,
  warranty TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_brand ON products (brand);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products (status);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products (stock);

-- 5. TABEL TRANSAKSI & PESANAN
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  product TEXT NOT NULL,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'Diproses',
  kurir TEXT,
  resi TEXT,
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

-- 6. TABEL TIKET SERVIS
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  customer TEXT NOT NULL,
  phone TEXT,
  unit TEXT NOT NULL,
  issue TEXT NOT NULL,
  tech TEXT NOT NULL,
  stage TEXT DEFAULT 'Diagnosa & Cek',
  priority TEXT DEFAULT 'Normal',
  date TEXT,
  cost NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABEL BRAND MITRA RESMI
CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT '💻',
  "desc" TEXT DEFAULT 'Official Partner',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABEL ARTIKEL & REVIEW
CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  tag TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  date TEXT,
  author TEXT,
  read_time TEXT,
  icon TEXT DEFAULT '💻',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABEL TESTIMONI PELANGGAN
CREATE TABLE IF NOT EXISTS testimonials (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  rating INTEGER DEFAULT 5,
  text TEXT NOT NULL,
  avatar TEXT DEFAULT '👤',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABEL LAYANAN TOKO
CREATE TABLE IF NOT EXISTS store_services (
  id SERIAL PRIMARY KEY,
  icon TEXT DEFAULT '🔧',
  title TEXT NOT NULL,
  "desc" TEXT,
  badge TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TABEL LOKASI CABANG
CREATE TABLE IF NOT EXISTS branches (
  id SERIAL PRIMARY KEY,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  hours TEXT,
  maps_url TEXT,
  is_hq BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- KEBIJAKAN ROW LEVEL SECURITY (RLS)
-- Aktifkan RLS dan izinkan pembacaan publik (SELECT) untuk pengunjung website
-- ==============================================================================

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Izinkan publik membaca data konten website (Read-only untuk anon/pengunjung)
CREATE POLICY "Public Read Settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);
CREATE POLICY "Public Read Brands" ON brands FOR SELECT USING (true);
CREATE POLICY "Public Read Articles" ON articles FOR SELECT USING (true);
CREATE POLICY "Public Read Testimonials" ON testimonials FOR SELECT USING (true);
CREATE POLICY "Public Read Store Services" ON store_services FOR SELECT USING (true);
CREATE POLICY "Public Read Branches" ON branches FOR SELECT USING (true);

-- Izinkan publik membuat order checkout
CREATE POLICY "Public Insert Orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Orders" ON orders FOR SELECT USING (true);

-- Izinkan publik/customer registrasi
CREATE POLICY "Public Register Customer" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Read Customer" ON customers FOR SELECT USING (true);
