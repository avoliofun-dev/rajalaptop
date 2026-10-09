// scripts/seed_supabase.js
// Skrip untuk mengisi data awal ke Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Baca kredensial dari .env.local atau .env.supabase
function loadEnv() {
  const envFiles = ['.env.local', '.env.supabase', '.env'];
  for (const f of envFiles) {
    const fullPath = path.join(__dirname, '..', f);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eq = trimmed.indexOf('=');
          if (eq > 0) {
            const key = trimmed.slice(0, eq).trim();
            const val = trimmed.slice(eq + 1).trim();
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-id')) {
  console.error('❌ Supabase belum dikonfigurasi di .env.local atau .env.supabase!');
  console.error('Silakan isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY terlebih dahulu.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🚀 Memulai migrasi & seeding data ke Supabase...');

  // 1. Settings
  console.log('1. Mengisi settings...');
  const settings = [
    { key: 'storeName', value: 'Raja Laptop Pekalongan', description: 'Nama toko' },
    { key: 'tagline', value: 'Pusat Komputer & Laptop Terpercaya Jawa Tengah & DIY', description: 'Slogan' },
    { key: 'metaDescription', value: 'Toko resmi laptop gaming, ultrabook, PC rakitan, dan service center bergaransi resmi.', description: 'Meta description' },
    { key: 'promoBarActive', value: 'true', description: 'Status banner promo' },
    { key: 'promoBarText', value: '📦 Gratis Ongkir untuk pembelian di atas Rp 500.000 ke seluruh Jawa Tengah & DIY!', description: 'Teks banner promo' },
    { key: 'whatsappNumber', value: '6289646618000', description: 'Nomor WhatsApp resmi' },
    { key: 'phoneOffice', value: '(0274) 556789', description: 'Telepon kantor' },
    { key: 'supportEmail', value: 'support@rajalaptop.com', description: 'Email bantuan' },
    { key: 'openingHours', value: 'Senin – Minggu: 09.00 – 21.00 WIB', description: 'Jam operasional' },
    { key: 'mainAddress', value: 'Jl. Gejayan (Affandi) No. 45B, Caturtunggal, Depok, Sleman, Yogyakarta', description: 'Alamat toko pusat' },
    { key: 'maintenanceMode', value: 'false', description: 'Mode pemeliharaan' }
  ];
  for (const s of settings) {
    await supabase.from('settings').upsert(s, { onConflict: 'key' });
  }

  // 2. Brands
  console.log('2. Mengisi brands mitra resmi...');
  const brands = [
    { name: 'ASUS ROG', icon: '🔴', desc: 'Official Partner' },
    { name: 'Lenovo Legion', icon: '⚡', desc: 'Authorized Dealer' },
    { name: 'Apple', icon: '🍏', desc: 'Original Reseller' },
    { name: 'MSI Gaming', icon: '🐉', desc: 'Titan Gold Partner' },
    { name: 'HP Omen', icon: '💎', desc: 'Official Store' },
    { name: 'Acer Predator', icon: '🛡️', desc: 'Premium Retailer' },
    { name: 'Dell Alienware', icon: '👽', desc: 'Certified Vendor' },
    { name: 'Logitech G', icon: '🎮', desc: 'Gear Partner' }
  ];
  for (const b of brands) {
    await supabase.from('brands').upsert(b, { onConflict: 'name' });
  }

  // 3. Layanan Toko
  console.log('3. Mengisi store_services...');
  const services = [
    { icon: '🔧', title: 'Service Express & Upgrade', desc: 'Ganti SSD NVMe, RAM, baterai, thermal paste grizzly. Bisa ditunggu 30-60 menit langsung jadi!', badge: 'Bisa Ditunggu', sort_order: 1 },
    { icon: '⚡', title: 'Instalasi & Optimasi Sistem', desc: 'Clean install Windows resmi, update driver OEM terbaru, pembersihan malware, dan kalibrasi performa laptop.', badge: 'Garansi Sistem', sort_order: 2 },
    { icon: '🖥️', title: 'Custom Build PC Gaming/Office', desc: 'Konsultasi spek sesuai budget, cable management rapi profesional, stress test 24 jam dengan Furmark & Cinebench.', badge: 'Free Rakit & Instalasi', sort_order: 3 },
    { icon: '🚚', title: 'Layanan Antar Jemput Service', desc: 'Sibuk tidak sempat ke toko? Tim kurir siap jemput laptop bermasalah Anda dan antar kembali setelah selesai.', badge: 'Area Kota Gratis', sort_order: 4 }
  ];
  await supabase.from('store_services').upsert(services);

  // 4. Artikel
  console.log('4. Mengisi articles...');
  const articles = [
    {
      tag: 'TIPS & TRIK',
      title: 'Panduan Memilih Laptop Coding & Data Science di Tahun 2026',
      summary: 'Simak spesifikasi RAM minimal, kebutuhan prosesor AI NPU, dan pemilihan display yang nyaman untuk jam kerja lama.',
      date: '24 Sep 2026',
      author: 'Tim Tekno',
      read_time: '4 mnt baca',
      icon: '💻'
    },
    {
      tag: 'HARDWARE REVIEW',
      title: 'RTX 4060 vs RTX 4070 Mobile: Mana yang Paling Worth It?',
      summary: 'Benchmarking 10 game AAA terbaru pada resolusi 1440p dengan DLSS 3.5 & Frame Generation.',
      date: '20 Sep 2026',
      author: 'Lab Benchmark',
      read_time: '6 mnt baca',
      icon: '🎮'
    },
    {
      tag: 'MAINTENANCE',
      title: 'Tanda-Tanda Thermal Paste Laptop Kering & Kapan Harus Repaste',
      summary: 'Cegah overheat dan thermal throttling pada CPU dengan perawatan berkala setiap 8-12 bulan.',
      date: '15 Sep 2026',
      author: 'Teknisi Senior',
      read_time: '3 mnt baca',
      icon: '🔥'
    }
  ];
  await supabase.from('articles').upsert(articles);

  // 5. Testimoni
  console.log('5. Mengisi testimonials...');
  const testimonials = [
    {
      name: 'Dimas Anggara',
      role: 'Fullstack Developer',
      rating: 5,
      text: 'Beli ThinkPad X1 Carbon di sini. Pelayanan ramah banget, bonus tas original dan langsung dibantu instalasi dual-boot Linux. Sangat recommended!',
      avatar: '👨‍💻'
    },
    {
      name: 'Siti Rahmawati',
      role: 'Content Creator & Video Editor',
      rating: 5,
      text: 'Trade-in laptop lama ke ROG Zephyrus G16 di sini nilainya dihargai paling adil dibanding toko lain. Proses cuma 20 menit, data lama dibantu backup gratis!',
      avatar: '👩‍🎨'
    },
    {
      name: 'Budi Prasetyo',
      role: 'Arsitek & 3D Visualizer',
      rating: 5,
      text: 'Rakit PC Workstation untuk rendering lumion dan blender. Cable management super rapi, suhu adem, teknisi paham spek yang dibutuhkan untuk arsitektur.',
      avatar: '👷‍♂️'
    }
  ];
  await supabase.from('testimonials').upsert(testimonials);

  // 6. Cabang
  console.log('6. Mengisi branches...');
  const branches = [
    {
      city: 'Yogyakarta (Pusat)',
      address: 'Jl. Gejayan (Affandi) No. 45B, Caturtunggal, Depok, Sleman',
      phone: '(0274) 556789 / 0812-1111-2222',
      hours: 'Senin – Minggu: 09.00 – 21.00 WIB',
      maps_url: 'https://maps.google.com/?q=Yogyakarta',
      is_hq: true,
      sort_order: 1
    },
    {
      city: 'Semarang',
      address: 'Jl. MT Haryono No. 120, Simpang Lima, Semarang Tengah',
      phone: '(024) 8451234 / 0812-3333-4444',
      hours: 'Senin – Minggu: 10.00 – 21.00 WIB',
      maps_url: 'https://maps.google.com/?q=Semarang',
      is_hq: false,
      sort_order: 2
    },
    {
      city: 'Solo (Surakarta)',
      address: 'Jl. Slamet Riyadi No. 280, Purwosari, Laweyan, Solo',
      phone: '(0271) 712999 / 0812-5555-6666',
      hours: 'Senin – Minggu: 10.00 – 21.00 WIB',
      maps_url: 'https://maps.google.com/?q=Solo',
      is_hq: false,
      sort_order: 3
    }
  ];
  await supabase.from('branches').upsert(branches);

  // 7. Produk Awal
  console.log('7. Mengisi catalog products...');
  const products = [
    {
      id: "prod-1",
      sku: "ASUS-ROG-G16-2025",
      name: "ASUS ROG Zephyrus G16 (2025)",
      brand: "ASUS",
      category: "gaming",
      price: 26999000,
      original_price: 31999000,
      originalPrice: 31999000,
      discount: 15,
      stock: 8,
      status: "active",
      specs: "Intel Core Ultra 9, RTX 4070 8GB, 32GB RAM, 1TB SSD",
      emoji: "💻",
      rating: 4.9,
      sold: 45
    },
    {
      id: "prod-2",
      sku: "LEN-LEGION-5I-G9",
      name: "Lenovo Legion Pro 5i Gen 9",
      brand: "Lenovo",
      category: "gaming",
      price: 21499000,
      original_price: 24999000,
      originalPrice: 24999000,
      discount: 14,
      stock: 12,
      status: "active",
      specs: "Core i7-14700HX, RTX 4060 8GB 140W, 16GB DDR5, 1TB SSD",
      emoji: "⚡",
      rating: 4.8,
      sold: 82
    },
    {
      id: "prod-3",
      sku: "APP-MBA-M3-15",
      name: "MacBook Air M3 15-inch",
      brand: "Apple",
      category: "ultrabook",
      price: 18799000,
      original_price: 20999000,
      originalPrice: 20999000,
      discount: 10,
      stock: 5,
      status: "active",
      specs: "Apple M3 8-Core CPU, 10-Core GPU, 16GB RAM, 512GB SSD",
      emoji: "🍏",
      rating: 5.0,
      sold: 110
    },
    {
      id: "prod-4",
      sku: "ACR-HELIOS-NEO-16",
      name: "Acer Predator Helios Neo 16",
      brand: "Acer",
      category: "gaming",
      price: 17299000,
      original_price: 19999000,
      originalPrice: 19999000,
      discount: 13,
      stock: 6,
      status: "active",
      specs: "Core i7-13700HX, RTX 4050 6GB, 16GB DDR5, 512GB NVMe",
      emoji: "🔥",
      rating: 4.7,
      sold: 39
    },
    {
      id: "prod-5",
      sku: "MSI-RAIDER-GE78",
      name: "MSI Raider GE78 HX Smart Touch",
      brand: "MSI",
      category: "gaming",
      price: 38999000,
      original_price: 42000000,
      originalPrice: 42000000,
      discount: 7,
      stock: 2,
      status: "active",
      specs: "Core i9-14900HX, RTX 4080 12GB, 32GB RAM, 2TB SSD",
      emoji: "🐲",
      rating: 4.9,
      sold: 23
    },
    {
      id: "prod-6",
      sku: "LEN-THINKPAD-X1-G12",
      name: "Lenovo ThinkPad X1 Carbon Gen 12",
      brand: "Lenovo",
      category: "kerja",
      price: 24500000,
      original_price: 24500000,
      originalPrice: 24500000,
      discount: 0,
      stock: 3,
      status: "active",
      specs: "Core Ultra 7 155H, Intel Arc Graphics, 32GB RAM, 1TB SSD",
      emoji: "💼",
      rating: 4.9,
      sold: 94
    }
  ];
  for (const p of products) {
    await supabase.from('products').upsert(p, { onConflict: 'id' });
  }

  // 8. Admin Users
  console.log('8. Mengisi admin users...');
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admins = [
    { id: 'admin-super', name: 'Super Admin', email: 'admin@example.com', password_hash: passwordHash, role: 'super_admin' },
    { id: 'admin-kasir', name: 'Siti Rahma (Kasir)', email: 'kasir@rajalaptop.com', password_hash: passwordHash, role: 'kasir' },
    { id: 'admin-finance', name: 'Bambang Sudiro (Finance)', email: 'finance@rajalaptop.com', password_hash: passwordHash, role: 'finance' },
    { id: 'admin-area', name: 'Agus Pratama (Manajer Area)', email: 'manager@rajalaptop.com', password_hash: passwordHash, role: 'manajer_area' },
    { id: 'admin-owner', name: 'Mochamad Solichin (Owner)', email: 'owner@rajalaptop.com', password_hash: passwordHash, role: 'owner' }
  ];
  for (const a of admins) {
    await supabase.from('admin_users').upsert(a, { onConflict: 'id' });
  }

  console.log('✅ Berhasil migrasi & seeding data ke Supabase!');
}

main().catch((err) => {
  console.error('❌ Error saat seeding:', err);
  process.exit(1);
});
