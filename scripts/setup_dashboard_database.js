// scripts/setup_dashboard_database.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('Connecting to MySQL on localhost:3306...');
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    port: Number(process.env.MYSQL_PORT) || 3306,
    multipleStatements: true,
  });

  console.log('Ensuring database rajalaptop exists...');
  await conn.query(`CREATE DATABASE IF NOT EXISTS rajalaptop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await conn.query(`USE rajalaptop;`);

  console.log('1. Setting up settings table & data...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS settings (
      \`key\` VARCHAR(100) PRIMARY KEY,
      \`value\` TEXT,
      \`description\` VARCHAR(255),
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const initialSettings = [
    { key: 'storeName', value: 'Raja Laptop Pekalongan', description: 'Nama toko yang ditampilkan di UI' },
    { key: 'tagline', value: 'Pusat Komputer & Laptop Terpercaya Jawa Tengah & DIY', description: 'Slogan toko' },
    { key: 'metaDescription', value: 'Toko resmi laptop gaming, ultrabook, PC rakitan, dan service center bergaransi resmi.', description: 'Meta description untuk SEO' },
    { key: 'promoBarActive', value: 'true', description: 'Apakah bar promo ditampilkan?' },
    { key: 'promoBarText', value: '📦 Gratis Ongkir untuk pembelian di atas Rp 500.000 ke seluruh Jawa Tengah & DIY!', description: 'Teks bar promo' },
    { key: 'whatsappNumber', value: '6289646618000', description: 'Nomor WA layanan' },
    { key: 'phoneOffice', value: '(0274) 556789', description: 'Telepon kantor' },
    { key: 'supportEmail', value: 'support@rajalaptop.com', description: 'Email bantuan' },
    { key: 'openingHours', value: 'Senin – Minggu: 09.00 – 21.00 WIB', description: 'Jam operasional' },
    { key: 'mainAddress', value: 'Jl. Gejayan (Affandi) No. 45B, Caturtunggal, Depok, Sleman, Yogyakarta', description: 'Alamat utama toko' },
    { key: 'maintenanceMode', value: 'false', description: 'Apakah situs dalam mode perawatan?' }
  ];

  for (const s of initialSettings) {
    await conn.query(
      `INSERT INTO settings (\`key\`, \`value\`, \`description\`) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE \`description\` = VALUES(\`description\`);`,
      [s.key, s.value, s.description]
    );
  }

  console.log('2. Setting up admin_users table & roles...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'kasir',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Ensure role column is VARCHAR(50) so all 9 roles can be saved without ENUM restriction
  try {
    await conn.query(`ALTER TABLE admin_users MODIFY COLUMN id VARCHAR(64) NOT NULL;`);
    await conn.query(`ALTER TABLE admin_users MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT 'kasir';`);
  } catch (e) {
    console.log('admin_users column note:', e.message);
  }

  const defaultPasswordHash = await bcrypt.hash('admin123', 10);
  const sampleAdmins = [
    { id: 'admin-super', name: 'Super Admin', email: 'admin@example.com', role: 'super_admin' },
    { id: 'admin-kasir', name: 'Siti Rahma (Kasir)', email: 'kasir@rajalaptop.com', role: 'kasir' },
    { id: 'admin-finance', name: 'Bambang Sudiro (Finance)', email: 'finance@rajalaptop.com', role: 'finance' },
    { id: 'admin-area', name: 'Agus Pratama (Manajer Area)', email: 'manager@rajalaptop.com', role: 'manajer_area' },
    { id: 'admin-gudang', name: 'Joko Susilo (Gudang)', email: 'gudang@rajalaptop.com', role: 'gudang' },
    { id: 'admin-audit', name: 'Dewi Lestari (Audit)', email: 'audit@rajalaptop.com', role: 'audit' },
    { id: 'admin-marketing', name: 'Rina Sasmita (Digital Marketing)', email: 'marketing@rajalaptop.com', role: 'digital_marketing' },
    { id: 'admin-owner', name: 'Mochamad Solichin (Owner)', email: 'owner@rajalaptop.com', role: 'owner' },
    { id: 'admin-kepala-toko', name: 'Doni Setiawan (Kepala Toko)', email: 'kepalatoko@rajalaptop.com', role: 'kepala_toko' }
  ];

  for (const adm of sampleAdmins) {
    await conn.query(
      `INSERT INTO admin_users (id, name, email, password_hash, role)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role);`,
      [adm.id, adm.name, adm.email, defaultPasswordHash, adm.role]
    );
  }

  console.log('3. Setting up brands table...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS brands (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const initialBrands = [
    'Acer', 'Apple', 'Asus', 'Avita', 'HP', 'Huawei', 
    'Infinix', 'Lenovo', 'MSI', 'Polytron', 'SPC', 'Tecno', 'Logitech', 'Keychron', 'Lainnya'
  ];
  for (const b of initialBrands) {
    await conn.query(`INSERT IGNORE INTO brands (name) VALUES (?);`, [b]);
  }

  console.log('4. Setting up categories table...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL UNIQUE,
      slug VARCHAR(150) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const initialCategories = [
    { name: 'Laptop Gaming', slug: 'gaming' },
    { name: 'Ultrabook & Tipis', slug: 'ultrabook' },
    { name: 'Laptop Bisnis & Kerja', slug: 'kerja' },
    { name: 'Aksesoris & Peripheral', slug: 'aksesoris' },
    { name: 'PC Desktop & Rakitan', slug: 'pc-rakitan' },
    { name: 'Service & Sparepart', slug: 'service' }
  ];
  for (const c of initialCategories) {
    await conn.query(`INSERT IGNORE INTO categories (name, slug) VALUES (?, ?);`, [c.name, c.slug]);
  }

  console.log('5. Setting up products table...');
  // Modify or create products table with all required columns
  await conn.query(`
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(64) PRIMARY KEY,
      sku VARCHAR(100) NULL,
      name VARCHAR(255) NOT NULL,
      brand VARCHAR(150) NOT NULL DEFAULT 'Lainnya',
      category VARCHAR(150) NOT NULL DEFAULT 'gaming',
      price DECIMAL(15,2) NOT NULL DEFAULT 0,
      original_price DECIMAL(15,2) NULL,
      originalPrice DECIMAL(15,2) NULL,
      discount INT NOT NULL DEFAULT 0,
      stock INT NOT NULL DEFAULT 0,
      status VARCHAR(50) NOT NULL DEFAULT 'active',
      specs TEXT NULL,
      emoji VARCHAR(20) NULL DEFAULT '💻',
      rating DECIMAL(3,1) DEFAULT 5.0,
      sold INT DEFAULT 0,
      image_url VARCHAR(511) NULL,
      description TEXT NULL,
      processor VARCHAR(255) NULL,
      ram_gb INT NULL,
      storage_gb INT NULL,
      display_spec VARCHAR(255) NULL,
      operating_system VARCHAR(100) NULL,
      warranty VARCHAR(255) NULL,
      source_page INT NULL,
      raw_source LONGTEXT NULL,
      needs_review TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_brand (brand),
      INDEX idx_category (category),
      INDEX idx_stock (stock)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Ensure missing columns exist in case products already existed with fewer columns
  const [pCols] = await conn.query(`DESCRIBE products`);
  const existingPColNames = pCols.map(c => c.Field);
  const neededCols = [
    { name: 'sku', def: 'VARCHAR(100) NULL' },
    { name: 'brand', def: "VARCHAR(150) NOT NULL DEFAULT 'Lainnya'" },
    { name: 'category', def: "VARCHAR(150) NOT NULL DEFAULT 'gaming'" },
    { name: 'original_price', def: 'DECIMAL(15,2) NULL' },
    { name: 'originalPrice', def: 'DECIMAL(15,2) NULL' },
    { name: 'discount', def: 'INT NOT NULL DEFAULT 0' },
    { name: 'status', def: "VARCHAR(50) NOT NULL DEFAULT 'active'" },
    { name: 'specs', def: 'TEXT NULL' },
    { name: 'emoji', def: "VARCHAR(20) NULL DEFAULT '💻'" },
    { name: 'rating', def: 'DECIMAL(3,1) DEFAULT 5.0' },
    { name: 'sold', def: 'INT DEFAULT 0' },
    { name: 'processor', def: 'VARCHAR(255) NULL' },
    { name: 'ram_gb', def: 'INT NULL' },
    { name: 'storage_gb', def: 'INT NULL' },
    { name: 'display_spec', def: 'VARCHAR(255) NULL' },
    { name: 'operating_system', def: 'VARCHAR(100) NULL' },
    { name: 'warranty', def: 'VARCHAR(255) NULL' },
    { name: 'source_page', def: 'INT NULL' },
    { name: 'raw_source', def: 'LONGTEXT NULL' },
    { name: 'needs_review', def: 'TINYINT(1) DEFAULT 0' },
  ];

  for (const nc of neededCols) {
    if (!existingPColNames.includes(nc.name)) {
      try {
        await conn.query(`ALTER TABLE products ADD COLUMN ${nc.name} ${nc.def};`);
        console.log(`Added column ${nc.name} to products table.`);
      } catch (e) {
        console.log(`Notice adding ${nc.name}:`, e.message);
      }
    }
  }

  // Modify id to VARCHAR(64) if it was numeric
  try {
    await conn.query(`ALTER TABLE products MODIFY COLUMN id VARCHAR(64) NOT NULL;`);
  } catch (e) {}

  // Insert Core Featured Products (from database.json)
  const coreProducts = [
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
      sku: "LEN-LEGION-PRO5I-G9",
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
      sku: "APL-MBA-M3-15",
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
      stock: 2, // Low stock alert on dashboard
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
      stock: 1, // Critical low stock alert on dashboard
      status: "active",
      specs: "Core Ultra 7 155H, Intel Arc Graphics, 32GB RAM, 1TB SSD",
      emoji: "💼",
      rating: 4.9,
      sold: 94
    },
    {
      id: "prod-7",
      sku: "ASUS-ZENBOOK-S13",
      name: "ASUS Zenbook S 13 OLED (UX5304)",
      brand: "ASUS",
      category: "ultrabook",
      price: 19999000,
      original_price: 21500000,
      originalPrice: 21500000,
      discount: 7,
      stock: 4,
      status: "active",
      specs: "Hanya 1kg tipis 1cm, Layar 2.8K Lumina OLED, 16GB / 1TB",
      emoji: "💎",
      rating: 4.8,
      sold: 67
    },
    {
      id: "prod-8",
      sku: "LOG-GPRO-X2",
      name: "Logitech G PRO X Superlight 2 Wireless",
      brand: "Logitech",
      category: "aksesoris",
      price: 2150000,
      original_price: 2150000,
      originalPrice: 2150000,
      discount: 0,
      stock: 3, // Low stock alert on dashboard
      status: "active",
      specs: "Berat 60g, HERO 2 Sensor 32K DPI, 95 Jam Baterai",
      emoji: "🖱️",
      rating: 4.9,
      sold: 230
    }
  ];

  for (const p of coreProducts) {
    await conn.query(
      `INSERT INTO products (
        id, sku, name, brand, category, price, original_price, originalPrice, 
        discount, stock, status, specs, emoji, rating, sold
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        name = VALUES(name),
        price = VALUES(price),
        stock = VALUES(stock),
        original_price = VALUES(original_price),
        originalPrice = VALUES(originalPrice),
        discount = VALUES(discount),
        specs = VALUES(specs),
        status = VALUES(status);`,
      [
        p.id, p.sku, p.name, p.brand, p.category, p.price, p.original_price, p.originalPrice,
        p.discount, p.stock, p.status, p.specs, p.emoji, p.rating, p.sold
      ]
    );
  }

  console.log('6. Importing ELS Catalog Items into catalog_items & products...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS catalog_items (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      brand_id INT UNSIGNED NULL,
      name VARCHAR(255) NOT NULL,
      price BIGINT UNSIGNED NOT NULL,
      ram_gb INT UNSIGNED NULL,
      storage_gb INT UNSIGNED NULL,
      processor VARCHAR(255) NULL,
      display_spec VARCHAR(255) NULL,
      operating_system VARCHAR(100) NULL,
      warranty VARCHAR(500) NULL,
      source_page INT UNSIGNED NOT NULL,
      raw_source LONGTEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_brand (brand_id),
      INDEX idx_name (name),
      INDEX idx_price (price),
      INDEX idx_page (source_page)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS import_pages (
      page_no INT PRIMARY KEY,
      raw_text LONGTEXT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Check if els_pricelist_2026_09_28 database exists to copy 430 items
  try {
    const [chk] = await conn.query(`SELECT COUNT(*) as c FROM catalog_items`);
    if (chk[0].c === 0) {
      console.log('Copying catalog_items from els_pricelist_2026_09_28...');
      await conn.query(`
        INSERT INTO catalog_items (id, brand_id, name, price, ram_gb, storage_gb, processor, display_spec, operating_system, warranty, source_page, raw_source, created_at)
        SELECT id, brand_id, name, price, ram_gb, storage_gb, processor, display_spec, operating_system, warranty, source_page, raw_source, created_at
        FROM els_pricelist_2026_09_28.catalog_items;
      `);
      await conn.query(`
        INSERT IGNORE INTO import_pages (page_no, raw_text)
        SELECT page_no, raw_text FROM els_pricelist_2026_09_28.import_pages;
      `);
      console.log('Copied 430 items into rajalaptop.catalog_items.');
    } else {
      console.log(`catalog_items already has ${chk[0].c} items.`);
    }

    // Also populate products from catalog_items if not already populated
    const [prodCnt] = await conn.query(`SELECT COUNT(*) as c FROM products`);
    if (prodCnt[0].c < 50) {
      console.log('Populating products catalog from catalog_items...');
      await conn.query(`
        INSERT IGNORE INTO products (
          id, sku, name, brand, category, price, original_price, originalPrice, 
          discount, stock, status, specs, emoji, rating, sold, processor, ram_gb, 
          storage_gb, display_spec, operating_system, warranty, source_page, raw_source, needs_review
        )
        SELECT 
          CONCAT('els-', ci.id) AS id,
          CONCAT('SKU-ELS-', LPAD(ci.id, 4, '0')) AS sku,
          ci.name,
          COALESCE(b.name, 'Lainnya') AS brand,
          CASE 
            WHEN LOWER(ci.name) LIKE '%gaming%' OR LOWER(ci.raw_source) LIKE '%rtx%' THEN 'gaming'
            WHEN LOWER(ci.name) LIKE '%air%' OR LOWER(ci.name) LIKE '%zenbook%' OR LOWER(ci.name) LIKE '%slim%' THEN 'ultrabook'
            WHEN LOWER(ci.name) LIKE '%thinkpad%' OR LOWER(ci.name) LIKE '%probook%' OR LOWER(ci.name) LIKE '%expertbook%' THEN 'kerja'
            ELSE 'gaming'
          END AS category,
          ci.price,
          ROUND(ci.price * 1.08) AS original_price,
          ROUND(ci.price * 1.08) AS originalPrice,
          8 AS discount,
          FLOOR(3 + (RAND() * 15)) AS stock,
          'active' AS status,
          CONCAT_WS(' | ', ci.processor, IF(ci.ram_gb IS NOT NULL, CONCAT(ci.ram_gb, 'GB RAM'), NULL), IF(ci.storage_gb IS NOT NULL, CONCAT(ci.storage_gb, 'GB SSD'), NULL), ci.display_spec) AS specs,
          '💻' AS emoji,
          ROUND(4.5 + (RAND() * 0.5), 1) AS rating,
          FLOOR(RAND() * 30) AS sold,
          ci.processor,
          ci.ram_gb,
          ci.storage_gb,
          ci.display_spec,
          ci.operating_system,
          ci.warranty,
          ci.source_page,
          ci.raw_source,
          0 AS needs_review
        FROM catalog_items ci
        LEFT JOIN brands b ON b.id = ci.brand_id;
      `);
      console.log('Populated products from catalog_items.');
    }
  } catch (e) {
    console.log('ELS copy notice:', e.message);
  }

  console.log('7. Setting up orders table & data...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(50) PRIMARY KEY,
      customer VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NULL,
      email VARCHAR(255) NULL,
      product TEXT NOT NULL,
      total DECIMAL(15,2) NOT NULL DEFAULT 0,
      status VARCHAR(50) NOT NULL DEFAULT 'Diproses',
      kurir VARCHAR(100) NULL,
      resi VARCHAR(100) NULL,
      date VARCHAR(100) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status),
      INDEX idx_customer (customer)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const sampleOrders = [
    { id: "RL-8812", customer: "Dimas Anggara", phone: "0812-9876-5432", email: "dimas.anggara@gmail.com", product: "ASUS ROG Zephyrus G16 (2025)", total: 26999000, status: "Sedang Dikirim", kurir: "J&T Express", resi: "JT98214470912", date: "24 Sep 2026, 14:20 WIB" },
    { id: "RL-8813", customer: "Rizky Ramadhan", phone: "0813-1122-3344", email: "rizky.ramadhan@gmail.com", product: "Lenovo Legion Pro 5i Gen 9", total: 21499000, status: "Perlu Dikemas", kurir: "SiCepat REG", resi: "SC99182371", date: "25 Sep 2026, 09:15 WIB" },
    { id: "RL-8814", customer: "Aulia Nurfadilah", phone: "0857-4455-6677", email: "aulia.nurfadilah@gmail.com", product: "MacBook Air M3 15-inch", total: 18799000, status: "Menunggu Bayar", kurir: "JNE YES", resi: "JNE7788991", date: "26 Sep 2026, 11:00 WIB" },
    { id: "RL-8815", customer: "Budi Santoso", phone: "0819-8877-6655", email: "budi.santoso@yahoo.com", product: "Keychron Q1 Pro Wireless", total: 2890000, status: "Selesai", kurir: "GoSend Instant", resi: "GOSEND-2309", date: "23 Sep 2026, 16:45 WIB" },
    { id: "RL-8816", customer: "Hendri Saputra", phone: "0812-3344-5566", email: "hendri.saputra@gmail.com", product: "Acer Predator Helios Neo 16", total: 17299000, status: "Perlu Dikemas", kurir: "J&T Express", resi: "JT98214470988", date: "27 Sep 2026, 10:30 WIB" },
    { id: "RL-8817", customer: "Mega Utami", phone: "0821-5566-7788", email: "mega.utami@gmail.com", product: "ASUS Zenbook S 13 OLED (UX5304)", total: 19999000, status: "Sedang Dikirim", kurir: "SiCepat REG", resi: "SC99182390", date: "27 Sep 2026, 15:10 WIB" }
  ];

  for (const o of sampleOrders) {
    await conn.query(
      `INSERT INTO orders (id, customer, phone, email, product, total, status, kurir, resi, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         status = VALUES(status),
         total = VALUES(total),
         kurir = VALUES(kurir),
         resi = VALUES(resi);`,
      [o.id, o.customer, o.phone, o.email, o.product, o.total, o.status, o.kurir, o.resi, o.date]
    );
  }

  console.log('8. Setting up services table & data...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS services (
      id VARCHAR(50) PRIMARY KEY,
      customer VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NULL,
      unit VARCHAR(255) NOT NULL,
      issue TEXT NOT NULL,
      tech VARCHAR(100) NOT NULL,
      stage VARCHAR(100) NOT NULL DEFAULT 'Diagnosa & Cek',
      priority VARCHAR(50) NOT NULL DEFAULT 'Normal',
      date VARCHAR(100) NULL,
      cost DECIMAL(15,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_stage (stage),
      INDEX idx_tech (tech)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const sampleServices = [
    { id: "SVC-0925-41", customer: "Dimas Anggara", phone: "0812-9876-5432", unit: "Lenovo Legion Pro 5i", issue: "Repaste Thermal Grizzly & Pembersihan Debu", tech: "Rian S. (#04)", stage: "Pengerjaan Servis", priority: "Tinggi", date: "25 Sep 2026", cost: 250000 },
    { id: "SVC-0924-12", customer: "Hendri Saputra", phone: "0812-3344-5566", unit: "ASUS TUF Gaming F15", issue: "Upgrade Dual Channel RAM 32GB + SSD 1TB", tech: "Andi W. (#02)", stage: "Siap Diambil", priority: "Sedang", date: "24 Sep 2026", cost: 1450000 },
    { id: "SVC-0923-09", customer: "Mega Utami", phone: "0821-5566-7788", unit: "MacBook Air M1", issue: "Penggantian Baterai Kembung Original Apple", tech: "Rian S. (#04)", stage: "Diagnosa & Cek", priority: "Tinggi", date: "23 Sep 2026", cost: 1850000 },
    { id: "SVC-0925-10", customer: "Budi Santoso", phone: "0819-8877-6655", unit: "Acer Nitro 5", issue: "Ganti Fan Cooler Kanan Berisik & Install Ulang Windows 11", tech: "Andi W. (#02)", stage: "Pengerjaan Servis", priority: "Sedang", date: "26 Sep 2026", cost: 350000 }
  ];

  for (const s of sampleServices) {
    await conn.query(
      `INSERT INTO services (id, customer, phone, unit, issue, tech, stage, priority, date, cost)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         stage = VALUES(stage),
         priority = VALUES(priority),
         tech = VALUES(tech),
         cost = VALUES(cost);`,
      [s.id, s.customer, s.phone, s.unit, s.issue, s.tech, s.stage, s.priority, s.date, s.cost]
    );
  }

  console.log('9. Setting up customers table & data...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(50) NULL,
      password_hash VARCHAR(255) NULL,
      tier VARCHAR(50) DEFAULT 'Member',
      points INT UNSIGNED DEFAULT 0,
      address TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  try {
    await conn.query(`ALTER TABLE customers MODIFY COLUMN id VARCHAR(64) NOT NULL;`);
  } catch (e) {}
  try {
    await conn.query(`ALTER TABLE customers ADD COLUMN address TEXT NULL;`);
  } catch (e) {}

  const sampleCustomers = [
    { id: 'cust-1', name: 'Dimas Anggara', email: 'dimas.anggara@gmail.com', phone: '0812-9876-5432', tier: 'VIP Gold', points: 450, address: 'Jl. Malioboro No. 12, Yogyakarta' },
    { id: 'cust-2', name: 'Rizky Ramadhan', email: 'rizky.ramadhan@gmail.com', phone: '0813-1122-3344', tier: 'Member', points: 120, address: 'Jl. Kaliurang KM 5, Sleman' },
    { id: 'cust-3', name: 'Aulia Nurfadilah', email: 'aulia.nurfadilah@gmail.com', phone: '0857-4455-6677', tier: 'VIP Platinum', points: 890, address: 'Jl. Pemuda No. 45, Semarang' },
    { id: 'cust-4', name: 'Budi Santoso', email: 'budi.santoso@yahoo.com', phone: '0819-8877-6655', tier: 'Member', points: 50, address: 'Jl. Urip Sumoharjo No. 88, Solo' }
  ];

  for (const c of sampleCustomers) {
    await conn.query(
      `INSERT INTO customers (id, name, email, phone, tier, points, address)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         name = VALUES(name),
         phone = VALUES(phone),
         tier = VALUES(tier),
         points = VALUES(points);`,
      [c.id, c.name, c.email, c.phone, c.tier, c.points, c.address]
    );
  }

  console.log('10. Setting up suppliers table & data...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(200) NOT NULL UNIQUE,
      contact_name VARCHAR(150) NULL,
      phone VARCHAR(50) NULL,
      email VARCHAR(150) NULL,
      address TEXT NULL,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const sampleSuppliers = [
    { name: 'PT Synnex Metrodata Indonesia', contact_name: 'David Wibowo', phone: '021-29345000', email: 'sales@synnexmetrodata.com', address: 'APL Tower Lt. 42, Jl. Letjen S. Parman, Jakarta Barat' },
    { name: 'PT Astrindo Senayasa', contact_name: 'Hendrik Tan', phone: '021-6121111', email: 'distribusi@astrindo.co.id', address: 'Komp. Ruko Mangga Dua Mall No. 15, Jakarta Pusat' },
    { name: 'PT Datascrip Indonesia', contact_name: 'Irwan Santoso', phone: '021-6544567', email: 'info@datascrip.co.id', address: 'Kawasan Niaga Selatan Blok B-12, Kemayoran, Jakarta Pusat' },
    { name: 'PT Nusantara Jaya Teknologi', contact_name: 'Siska Handayani', phone: '021-62301234', email: 'contact@njt.co.id', address: 'Harco Mangga Dua Plaza Blok A No. 8, Jakarta' }
  ];

  for (const sup of sampleSuppliers) {
    await conn.query(
      `INSERT IGNORE INTO suppliers (name, contact_name, phone, email, address)
       VALUES (?, ?, ?, ?, ?);`,
      [sup.name, sup.contact_name, sup.phone, sup.email, sup.address]
    );
  }

  console.log('11. Setting up purchase_orders & stock_movements...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id VARCHAR(50) PRIMARY KEY,
      supplier_name VARCHAR(200) NOT NULL,
      order_date DATE NOT NULL,
      total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
      status VARCHAR(50) NOT NULL DEFAULT 'received',
      payment_status VARCHAR(50) NOT NULL DEFAULT 'paid',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    INSERT IGNORE INTO purchase_orders (id, supplier_name, order_date, total_amount, status, payment_status) VALUES
    ('PO-202609-01', 'PT Synnex Metrodata Indonesia', '2026-09-10', 145000000, 'received', 'paid'),
    ('PO-202609-02', 'PT Astrindo Senayasa', '2026-09-15', 89500000, 'received', 'paid'),
    ('PO-202609-03', 'PT Datascrip Indonesia', '2026-09-22', 112000000, 'received', 'paid');
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      product_id VARCHAR(64) NULL,
      product_name VARCHAR(255) NOT NULL,
      quantity_change INT NOT NULL,
      movement_type ENUM('purchase','sale','adjustment','return') NOT NULL,
      reference_id VARCHAR(50) NULL,
      note TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_product (product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    INSERT IGNORE INTO stock_movements (id, product_id, product_name, quantity_change, movement_type, reference_id, note) VALUES
    (1, 'prod-1', 'ASUS ROG Zephyrus G16 (2025)', 10, 'purchase', 'PO-202609-01', 'Restock dari distributor resmi'),
    (2, 'prod-1', 'ASUS ROG Zephyrus G16 (2025)', -1, 'sale', 'RL-8812', 'Penjualan ke Dimas Anggara'),
    (3, 'prod-2', 'Lenovo Legion Pro 5i Gen 9', -1, 'sale', 'RL-8813', 'Penjualan ke Rizky Ramadhan'),
    (4, 'prod-5', 'MSI Raider GE78 HX', -1, 'sale', 'RL-8810', 'Penjualan offline store'),
    (5, 'prod-6', 'Lenovo ThinkPad X1 Carbon Gen 12', -2, 'sale', 'RL-8809', 'Pembelian corporate B2B');
  `);

  console.log('12. Setting up expenses & audit_logs...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      category VARCHAR(100) NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      description TEXT NOT NULL,
      date DATE NOT NULL,
      user_name VARCHAR(100) DEFAULT 'Finance',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    INSERT IGNORE INTO expenses (id, category, amount, description, date, user_name) VALUES
    (1, 'Listrik & Utilitas', 3850000, 'Tagihan Listrik PLN Toko Gejayan & Semarang', '2026-09-05', 'Bambang Sudiro'),
    (2, 'Internet & Server', 1500000, 'Dedicated Fiber Optic Indihome Bizz 100Mbps', '2026-09-05', 'Bambang Sudiro'),
    (3, 'Packaging & Logistik', 850000, 'Bubble wrap tebal, kardus packing laptop, lakban fragile', '2026-09-12', 'Joko Susilo'),
    (4, 'Iklan Digital', 4500000, 'Meta Ads & Google Ads Promo September Laptop Gaming', '2026-09-15', 'Rina Sasmita');
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_email VARCHAR(255) NOT NULL,
      user_name VARCHAR(255) NULL,
      role VARCHAR(50) NOT NULL,
      action VARCHAR(100) NOT NULL,
      module VARCHAR(100) NOT NULL,
      details TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    INSERT IGNORE INTO audit_logs (id, user_email, user_name, role, action, module, details) VALUES
    (1, 'admin@example.com', 'Super Admin', 'super_admin', 'UPDATE_SETTINGS', 'SETTINGS', 'Perubahan nomor WhatsApp dan alamat operasional'),
    (2, 'kasir@rajalaptop.com', 'Siti Rahma', 'kasir', 'CREATE_ORDER', 'POS', 'Membuat pesanan RL-8812 ASUS ROG Zephyrus'),
    (3, 'finance@rajalaptop.com', 'Bambang Sudiro', 'finance', 'PAYMENT_VERIFIED', 'ORDERS', 'Verifikasi transfer lunas pesanan RL-8812');
  `);

  console.log('13. Creating SQL View: vw_dashboard_metrics...');
  await conn.query(`
    CREATE OR REPLACE VIEW vw_dashboard_metrics AS
    SELECT 
      (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status IN ('Sedang Dikirim', 'Perlu Dikemas', 'Selesai', 'Diproses')) AS total_sales,
      (SELECT COUNT(*) FROM orders WHERE status IN ('Perlu Dikemas', 'Menunggu Bayar', 'Diproses')) AS pending_orders,
      (SELECT COUNT(*) FROM services WHERE stage NOT IN ('Siap Diambil', 'Selesai')) AS active_services,
      (SELECT COUNT(*) FROM products) AS total_products,
      (SELECT COUNT(*) FROM products WHERE stock <= 3) AS low_stock_products,
      (SELECT COUNT(*) FROM customers) AS total_customers,
      (SELECT COUNT(*) FROM suppliers) AS total_suppliers;
  `);

  const [metrics] = await conn.query(`SELECT * FROM vw_dashboard_metrics;`);
  console.log('Live Dashboard Metrics from MySQL:', metrics[0]);

  // Export full rajalaptop_phpmyadmin.sql for user reference & phpMyAdmin import
  console.log('Generating rajalaptop_phpmyadmin.sql in project root...');
  const sqlDumpScript = `
-- =========================================================================
-- DATABASE RAJALAPTOP DUMP FOR PHPMYADMIN
-- Website & Admin Dashboard Real Database
-- Compatible with MySQL 8.x / MariaDB
-- Source of Truth: ELS_Pricelist_28-09-2026.sql + rajalaptop application
-- =========================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

CREATE DATABASE IF NOT EXISTS \`rajalaptop\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`rajalaptop\`;

-- 1. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS \`settings\` (
  \`key\` VARCHAR(100) PRIMARY KEY,
  \`value\` TEXT,
  \`description\` VARCHAR(255),
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO \`settings\` (\`key\`, \`value\`, \`description\`) VALUES
('storeName', 'Raja Laptop Pekalongan', 'Nama toko yang ditampilkan di UI'),
('tagline', 'Pusat Komputer & Laptop Terpercaya Jawa Tengah & DIY', 'Slogan toko'),
('metaDescription', 'Toko resmi laptop gaming, ultrabook, PC rakitan, dan service center bergaransi resmi.', 'Meta description untuk SEO'),
('promoBarActive', 'true', 'Apakah bar promo ditampilkan?'),
('promoBarText', '📦 Gratis Ongkir untuk pembelian di atas Rp 500.000 ke seluruh Jawa Tengah & DIY!', 'Teks bar promo'),
('whatsappNumber', '6289646618000', 'Nomor WA layanan'),
('phoneOffice', '(0274) 556789', 'Telepon kantor'),
('supportEmail', 'support@rajalaptop.com', 'Email bantuan'),
('openingHours', 'Senin – Minggu: 09.00 – 21.00 WIB', 'Jam operasional'),
('mainAddress', 'Jl. Gejayan (Affandi) No. 45B, Caturtunggal, Depok, Sleman, Yogyakarta', 'Alamat utama toko'),
('maintenanceMode', 'false', 'Apakah situs dalam mode perawatan?')
ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`), \`description\` = VALUES(\`description\`);

-- 2. ADMIN USERS TABLE & ROLES
CREATE TABLE IF NOT EXISTS \`admin_users\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`email\` VARCHAR(255) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`role\` VARCHAR(50) NOT NULL DEFAULT 'kasir',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO \`admin_users\` (\`id\`, \`name\`, \`email\`, \`password_hash\`, \`role\`) VALUES
('admin-super', 'Super Admin', 'admin@example.com', '${defaultPasswordHash}', 'super_admin'),
('admin-kasir', 'Siti Rahma (Kasir)', 'kasir@rajalaptop.com', '${defaultPasswordHash}', 'kasir'),
('admin-finance', 'Bambang Sudiro (Finance)', 'finance@rajalaptop.com', '${defaultPasswordHash}', 'finance'),
('admin-area', 'Agus Pratama (Manajer Area)', 'manager@rajalaptop.com', '${defaultPasswordHash}', 'manajer_area'),
('admin-gudang', 'Joko Susilo (Gudang)', 'gudang@rajalaptop.com', '${defaultPasswordHash}', 'gudang'),
('admin-audit', 'Dewi Lestari (Audit)', 'audit@rajalaptop.com', '${defaultPasswordHash}', 'audit'),
('admin-marketing', 'Rina Sasmita (Digital Marketing)', 'marketing@rajalaptop.com', '${defaultPasswordHash}', 'digital_marketing'),
('admin-owner', 'Mochamad Solichin (Owner)', 'owner@rajalaptop.com', '${defaultPasswordHash}', 'owner'),
('admin-kepala-toko', 'Doni Setiawan (Kepala Toko)', 'kepalatoko@rajalaptop.com', '${defaultPasswordHash}', 'kepala_toko')
ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`role\` = VALUES(\`role\`);

-- 3. BRANDS TABLE
CREATE TABLE IF NOT EXISTS \`brands\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(150) NOT NULL UNIQUE,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO \`brands\` (\`name\`) VALUES
('Acer'), ('Apple'), ('Asus'), ('Avita'), ('HP'), ('Huawei'),
('Infinix'), ('Lenovo'), ('MSI'), ('Polytron'), ('SPC'), ('Tecno'), ('Logitech'), ('Keychron'), ('Lainnya');

-- 4. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS \`categories\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(150) NOT NULL UNIQUE,
  \`slug\` VARCHAR(150) NOT NULL UNIQUE,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO \`categories\` (\`name\`, \`slug\`) VALUES
('Laptop Gaming', 'gaming'),
('Ultrabook & Tipis', 'ultrabook'),
('Laptop Bisnis & Kerja', 'kerja'),
('Aksesoris & Peripheral', 'aksesoris'),
('PC Desktop & Rakitan', 'pc-rakitan'),
('Service & Sparepart', 'service');

-- 5. PRODUCTS TABLE (Connected to Website Catalog & Admin Dashboard)
CREATE TABLE IF NOT EXISTS \`products\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`sku\` VARCHAR(100) NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`brand\` VARCHAR(150) NOT NULL DEFAULT 'Lainnya',
  \`category\` VARCHAR(150) NOT NULL DEFAULT 'gaming',
  \`price\` DECIMAL(15,2) NOT NULL DEFAULT 0,
  \`original_price\` DECIMAL(15,2) NULL,
  \`originalPrice\` DECIMAL(15,2) NULL,
  \`discount\` INT NOT NULL DEFAULT 0,
  \`stock\` INT NOT NULL DEFAULT 0,
  \`status\` VARCHAR(50) NOT NULL DEFAULT 'active',
  \`specs\` TEXT NULL,
  \`emoji\` VARCHAR(20) NULL DEFAULT '💻',
  \`rating\` DECIMAL(3,1) DEFAULT 5.0,
  \`sold\` INT DEFAULT 0,
  \`image_url\` VARCHAR(511) NULL,
  \`description\` TEXT NULL,
  \`processor\` VARCHAR(255) NULL,
  \`ram_gb\` INT NULL,
  \`storage_gb\` INT NULL,
  \`display_spec\` VARCHAR(255) NULL,
  \`operating_system\` VARCHAR(100) NULL,
  \`warranty\` VARCHAR(255) NULL,
  \`source_page\` INT NULL,
  \`raw_source\` LONGTEXT NULL,
  \`needs_review\` TINYINT(1) DEFAULT 0,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_brand\` (\`brand\`),
  INDEX \`idx_category\` (\`category\`),
  INDEX \`idx_stock\` (\`stock\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. ORDERS TABLE (Sales & POS Orders displayed on Admin Dashboard)
CREATE TABLE IF NOT EXISTS \`orders\` (
  \`id\` VARCHAR(50) PRIMARY KEY,
  \`customer\` VARCHAR(255) NOT NULL,
  \`phone\` VARCHAR(50) NULL,
  \`email\` VARCHAR(255) NULL,
  \`product\` TEXT NOT NULL,
  \`total\` DECIMAL(15,2) NOT NULL DEFAULT 0,
  \`status\` VARCHAR(50) NOT NULL DEFAULT 'Diproses',
  \`kurir\` VARCHAR(100) NULL,
  \`resi\` VARCHAR(100) NULL,
  \`date\` VARCHAR(100) NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_status\` (\`status\`),
  INDEX \`idx_customer\` (\`customer\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO \`orders\` (\`id\`, \`customer\`, \`phone\`, \`email\`, \`product\`, \`total\`, \`status\`, \`kurir\`, \`resi\`, \`date\`) VALUES
('RL-8812', 'Dimas Anggara', '0812-9876-5432', 'dimas.anggara@gmail.com', 'ASUS ROG Zephyrus G16 (2025)', 26999000, 'Sedang Dikirim', 'J&T Express', 'JT98214470912', '24 Sep 2026, 14:20 WIB'),
('RL-8813', 'Rizky Ramadhan', '0813-1122-3344', 'rizky.ramadhan@gmail.com', 'Lenovo Legion Pro 5i Gen 9', 21499000, 'Perlu Dikemas', 'SiCepat REG', 'SC99182371', '25 Sep 2026, 09:15 WIB'),
('RL-8814', 'Aulia Nurfadilah', '0857-4455-6677', 'aulia.nurfadilah@gmail.com', 'MacBook Air M3 15-inch', 18799000, 'Menunggu Bayar', 'JNE YES', 'JNE7788991', '26 Sep 2026, 11:00 WIB'),
('RL-8815', 'Budi Santoso', '0819-8877-6655', 'budi.santoso@yahoo.com', 'Keychron Q1 Pro Wireless', 2890000, 'Selesai', 'GoSend Instant', 'GOSEND-2309', '23 Sep 2026, 16:45 WIB'),
('RL-8816', 'Hendri Saputra', '0812-3344-5566', 'hendri.saputra@gmail.com', 'Acer Predator Helios Neo 16', 17299000, 'Perlu Dikemas', 'J&T Express', 'JT98214470988', '27 Sep 2026, 10:30 WIB'),
('RL-8817', 'Mega Utami', '0821-5566-7788', 'mega.utami@gmail.com', 'ASUS Zenbook S 13 OLED (UX5304)', 19999000, 'Sedang Dikirim', 'SiCepat REG', 'SC99182390', '27 Sep 2026, 15:10 WIB')
ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`), \`total\` = VALUES(\`total\`);

-- 7. SERVICES TABLE (Active Service Tickets displayed on Admin Dashboard)
CREATE TABLE IF NOT EXISTS \`services\` (
  \`id\` VARCHAR(50) PRIMARY KEY,
  \`customer\` VARCHAR(255) NOT NULL,
  \`phone\` VARCHAR(50) NULL,
  \`unit\` VARCHAR(255) NOT NULL,
  \`issue\` TEXT NOT NULL,
  \`tech\` VARCHAR(100) NOT NULL,
  \`stage\` VARCHAR(100) NOT NULL DEFAULT 'Diagnosa & Cek',
  \`priority\` VARCHAR(50) NOT NULL DEFAULT 'Normal',
  \`date\` VARCHAR(100) NULL,
  \`cost\` DECIMAL(15,2) DEFAULT 0,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_stage\` (\`stage\`),
  INDEX \`idx_tech\` (\`tech\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO \`services\` (\`id\`, \`customer\`, \`phone\`, \`unit\`, \`issue\`, \`tech\`, \`stage\`, \`priority\`, \`date\`, \`cost\`) VALUES
('SVC-0925-41', 'Dimas Anggara', '0812-9876-5432', 'Lenovo Legion Pro 5i', 'Repaste Thermal Grizzly & Pembersihan Debu', 'Rian S. (#04)', 'Pengerjaan Servis', 'Tinggi', '25 Sep 2026', 250000),
('SVC-0924-12', 'Hendri Saputra', '0812-3344-5566', 'ASUS TUF Gaming F15', 'Upgrade Dual Channel RAM 32GB + SSD 1TB', 'Andi W. (#02)', 'Siap Diambil', 'Sedang', '24 Sep 2026', 1450000),
('SVC-0923-09', 'Mega Utami', '0821-5566-7788', 'MacBook Air M1', 'Penggantian Baterai Kembung Original Apple', 'Rian S. (#04)', 'Diagnosa & Cek', 'Tinggi', '23 Sep 2026', 1850000),
('SVC-0925-10', 'Budi Santoso', '0819-8877-6655', 'Acer Nitro 5', 'Ganti Fan Cooler Kanan Berisik & Install Ulang Windows 11', 'Andi W. (#02)', 'Pengerjaan Servis', 'Sedang', '26 Sep 2026', 350000)
ON DUPLICATE KEY UPDATE \`stage\` = VALUES(\`stage\`), \`tech\` = VALUES(\`tech\`);

-- 8. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS \`customers\` (
  \`id\` VARCHAR(64) PRIMARY KEY,
  \`name\` VARCHAR(255) NOT NULL,
  \`email\` VARCHAR(255) NOT NULL UNIQUE,
  \`phone\` VARCHAR(50) NULL,
  \`password_hash\` VARCHAR(255) NULL,
  \`tier\` VARCHAR(50) DEFAULT 'Member',
  \`points\` INT UNSIGNED DEFAULT 0,
  \`address\` TEXT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO \`customers\` (\`id\`, \`name\`, \`email\`, \`phone\`, \`tier\`, \`points\`, \`address\`) VALUES
('cust-1', 'Dimas Anggara', 'dimas.anggara@gmail.com', '0812-9876-5432', 'VIP Gold', 450, 'Jl. Malioboro No. 12, Yogyakarta'),
('cust-2', 'Rizky Ramadhan', 'rizky.ramadhan@gmail.com', '0813-1122-3344', 'Member', 120, 'Jl. Kaliurang KM 5, Sleman'),
('cust-3', 'Aulia Nurfadilah', 'aulia.nurfadilah@gmail.com', '0857-4455-6677', 'VIP Platinum', 890, 'Jl. Pemuda No. 45, Semarang'),
('cust-4', 'Budi Santoso', 'budi.santoso@yahoo.com', '0819-8877-6655', 'Member', 50, 'Jl. Urip Sumoharjo No. 88, Solo')
ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`tier\` = VALUES(\`tier\`);

-- 9. SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS \`suppliers\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(200) NOT NULL UNIQUE,
  \`contact_name\` VARCHAR(150) NULL,
  \`phone\` VARCHAR(50) NULL,
  \`email\` VARCHAR(150) NULL,
  \`address\` TEXT NULL,
  \`status\` VARCHAR(50) DEFAULT 'active',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO \`suppliers\` (\`name\`, \`contact_name\`, \`phone\`, \`email\`, \`address\`) VALUES
('PT Synnex Metrodata Indonesia', 'David Wibowo', '021-29345000', 'sales@synnexmetrodata.com', 'APL Tower Lt. 42, Jl. Letjen S. Parman, Jakarta Barat'),
('PT Astrindo Senayasa', 'Hendrik Tan', '021-6121111', 'distribusi@astrindo.co.id', 'Komp. Ruko Mangga Dua Mall No. 15, Jakarta Pusat'),
('PT Datascrip Indonesia', 'Irwan Santoso', '021-6544567', 'info@datascrip.co.id', 'Kawasan Niaga Selatan Blok B-12, Kemayoran, Jakarta Pusat'),
('PT Nusantara Jaya Teknologi', 'Siska Handayani', '021-62301234', 'contact@njt.co.id', 'Harco Mangga Dua Plaza Blok A No. 8, Jakarta');

-- 10. PURCHASE ORDERS TABLE
CREATE TABLE IF NOT EXISTS \`purchase_orders\` (
  \`id\` VARCHAR(50) PRIMARY KEY,
  \`supplier_name\` VARCHAR(200) NOT NULL,
  \`order_date\` DATE NOT NULL,
  \`total_amount\` DECIMAL(15,2) NOT NULL DEFAULT 0,
  \`status\` VARCHAR(50) NOT NULL DEFAULT 'received',
  \`payment_status\` VARCHAR(50) NOT NULL DEFAULT 'paid',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO \`purchase_orders\` (\`id\`, \`supplier_name\`, \`order_date\`, \`total_amount\`, \`status\`, \`payment_status\`) VALUES
('PO-202609-01', 'PT Synnex Metrodata Indonesia', '2026-09-10', 145000000, 'received', 'paid'),
('PO-202609-02', 'PT Astrindo Senayasa', '2026-09-15', 89500000, 'received', 'paid'),
('PO-202609-03', 'PT Datascrip Indonesia', '2026-09-22', 112000000, 'received', 'paid');

-- 11. STOCK MOVEMENTS TABLE
CREATE TABLE IF NOT EXISTS \`stock_movements\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`product_id\` VARCHAR(64) NULL,
  \`product_name\` VARCHAR(255) NOT NULL,
  \`quantity_change\` INT NOT NULL,
  \`movement_type\` ENUM('purchase','sale','adjustment','return') NOT NULL,
  \`reference_id\` VARCHAR(50) NULL,
  \`note\` TEXT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_product\` (\`product_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO \`stock_movements\` (\`id\`, \`product_id\`, \`product_name\`, \`quantity_change\`, \`movement_type\`, \`reference_id\`, \`note\`) VALUES
(1, 'prod-1', 'ASUS ROG Zephyrus G16 (2025)', 10, 'purchase', 'PO-202609-01', 'Restock dari distributor resmi'),
(2, 'prod-1', 'ASUS ROG Zephyrus G16 (2025)', -1, 'sale', 'RL-8812', 'Penjualan ke Dimas Anggara'),
(3, 'prod-2', 'Lenovo Legion Pro 5i Gen 9', -1, 'sale', 'RL-8813', 'Penjualan ke Rizky Ramadhan'),
(4, 'prod-5', 'MSI Raider GE78 HX', -1, 'sale', 'RL-8810', 'Penjualan offline store'),
(5, 'prod-6', 'Lenovo ThinkPad X1 Carbon Gen 12', -2, 'sale', 'RL-8809', 'Pembelian corporate B2B');

-- 12. EXPENSES TABLE (Finance)
CREATE TABLE IF NOT EXISTS \`expenses\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`category\` VARCHAR(100) NOT NULL,
  \`amount\` DECIMAL(15,2) NOT NULL,
  \`description\` TEXT NOT NULL,
  \`date\` DATE NOT NULL,
  \`user_name\` VARCHAR(100) DEFAULT 'Finance',
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO \`expenses\` (\`id\`, \`category\`, \`amount\`, \`description\`, \`date\`, \`user_name\`) VALUES
(1, 'Listrik & Utilitas', 3850000, 'Tagihan Listrik PLN Toko Gejayan & Semarang', '2026-09-05', 'Bambang Sudiro'),
(2, 'Internet & Server', 1500000, 'Dedicated Fiber Optic Indihome Bizz 100Mbps', '2026-09-05', 'Bambang Sudiro'),
(3, 'Packaging & Logistik', 850000, 'Bubble wrap tebal, kardus packing laptop, lakban fragile', '2026-09-12', 'Joko Susilo'),
(4, 'Iklan Digital', 4500000, 'Meta Ads & Google Ads Promo September Laptop Gaming', '2026-09-15', 'Rina Sasmita');

-- 13. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS \`audit_logs\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`user_email\` VARCHAR(255) NOT NULL,
  \`user_name\` VARCHAR(255) NULL,
  \`role\` VARCHAR(50) NOT NULL,
  \`action\` VARCHAR(100) NOT NULL,
  \`module\` VARCHAR(100) NOT NULL,
  \`details\` TEXT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO \`audit_logs\` (\`id\`, \`user_email\`, \`user_name\`, \`role\`, \`action\`, \`module\`, \`details\`) VALUES
(1, 'admin@example.com', 'Super Admin', 'super_admin', 'UPDATE_SETTINGS', 'SETTINGS', 'Perubahan nomor WhatsApp dan alamat operasional'),
(2, 'kasir@rajalaptop.com', 'Siti Rahma', 'kasir', 'CREATE_ORDER', 'POS', 'Membuat pesanan RL-8812 ASUS ROG Zephyrus'),
(3, 'finance@rajalaptop.com', 'Bambang Sudiro', 'finance', 'PAYMENT_VERIFIED', 'ORDERS', 'Verifikasi transfer lunas pesanan RL-8812');

-- 14. VIEW FOR LIVE DASHBOARD METRICS
CREATE OR REPLACE VIEW \`vw_dashboard_metrics\` AS
SELECT 
  (SELECT COALESCE(SUM(total), 0) FROM \`orders\` WHERE status IN ('Sedang Dikirim', 'Perlu Dikemas', 'Selesai', 'Diproses')) AS total_sales,
  (SELECT COUNT(*) FROM \`orders\` WHERE status IN ('Perlu Dikemas', 'Menunggu Bayar', 'Diproses')) AS pending_orders,
  (SELECT COUNT(*) FROM \`services\` WHERE stage NOT IN ('Siap Diambil', 'Selesai')) AS active_services,
  (SELECT COUNT(*) FROM \`products\`) AS total_products,
  (SELECT COUNT(*) FROM \`products\` WHERE stock <= 3) AS low_stock_products,
  (SELECT COUNT(*) FROM \`customers\`) AS total_customers,
  (SELECT COUNT(*) FROM \`suppliers\`) AS total_suppliers;

SET FOREIGN_KEY_CHECKS=1;
`;

  fs.writeFileSync(path.join(__dirname, '..', 'rajalaptop_phpmyadmin.sql'), sqlDumpScript, 'utf8');
  console.log('Saved rajalaptop_phpmyadmin.sql successfully.');

  await conn.end();
  console.log('Database setup completed successfully!');
}

main().catch(err => {
  console.error('Migration script failed:', err);
  process.exit(1);
});
