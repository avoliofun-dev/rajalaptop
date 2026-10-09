// scripts/migrate_rbac.js
const mysql = require('mysql2/promise');

async function migrate() {
  console.log('--- Starting Enterprise RBAC Migration for Raja Laptop ---');
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'rajalaptop',
    port: Number(process.env.MYSQL_PORT) || 3306,
    multipleStatements: true,
  });

  try {
    // 1. AREAS TABLE
    console.log('1. Ensuring areas table exists...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS areas (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(32) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        description VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const initialAreas = [
      { id: 'area-jateng', code: 'JATENG', name: 'Jawa Tengah', description: 'Area operasional Jawa Tengah (Pekalongan, Semarang, Solo)' },
      { id: 'area-diy', code: 'DIY', name: 'DI Yogyakarta', description: 'Area operasional DI Yogyakarta (Gejayan & sekitarnya)' },
      { id: 'area-pusat', code: 'PUSAT', name: 'Kantor Pusat & Gudang Sentral', description: 'Wilayah manajemen pusat dan distribusi utama' }
    ];
    for (const a of initialAreas) {
      await conn.query(
        `INSERT INTO areas (id, code, name, description) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);`,
        [a.id, a.code, a.name, a.description]
      );
    }

    // 2. STORES / BRANCHES TABLE
    console.log('2. Ensuring stores table exists...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(32) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        area_id VARCHAR(64) NOT NULL,
        type ENUM('store', 'warehouse', 'headquarters') DEFAULT 'store',
        address TEXT NULL,
        phone VARCHAR(50) NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_store_area (area_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const initialStores = [
      { id: 'store-pekalongan', code: 'PKL01', name: 'Raja Laptop Pekalongan', area_id: 'area-jateng', type: 'store', address: 'Jl. Hayam Wuruk No. 88, Pekalongan', phone: '0285-421999' },
      { id: 'store-gejayan', code: 'YOG01', name: 'Raja Laptop Yogyakarta Gejayan', area_id: 'area-diy', type: 'store', address: 'Jl. Gejayan (Affandi) No. 45B, Sleman, Yogyakarta', phone: '0274-556789' },
      { id: 'store-semarang', code: 'SMG01', name: 'Raja Laptop Semarang Pemuda', area_id: 'area-jateng', type: 'store', address: 'Jl. Pemuda No. 102, Semarang', phone: '024-8451234' },
      { id: 'store-solo', code: 'SLO01', name: 'Raja Laptop Solo Slamet Riyadi', area_id: 'area-jateng', type: 'store', address: 'Jl. Slamet Riyadi No. 250, Surakarta', phone: '0271-712888' },
      { id: 'warehouse-pusat', code: 'WH-CENTRAL', name: 'Gudang Distribusi Sentral Jateng-DIY', area_id: 'area-pusat', type: 'warehouse', address: 'Kawasan Pergudangan Gejayan, Sleman', phone: '0274-556790' }
    ];
    for (const s of initialStores) {
      await conn.query(
        `INSERT INTO stores (id, code, name, area_id, type, address, phone, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE name = VALUES(name), area_id = VALUES(area_id), address = VALUES(address), phone = VALUES(phone);`,
        [s.id, s.code, s.name, s.area_id, s.type, s.address, s.phone]
      );
    }

    // 3. ROLES TABLE
    console.log('3. Ensuring roles table exists...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id VARCHAR(64) PRIMARY KEY,
        slug VARCHAR(64) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        description VARCHAR(255) NULL,
        default_scope ENUM('ALL', 'AREA', 'STORE', 'OWN') NOT NULL DEFAULT 'STORE',
        is_system TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const standardRoles = [
      { id: 'role-owner', slug: 'owner', name: 'Owner', description: 'Pemilik bisnis dengan akses penuh seluruh dashboard, laporan, dan otorisasi level tinggi.', default_scope: 'ALL' },
      { id: 'role-super-admin', slug: 'super_admin', name: 'Super Admin', description: 'Administrator teknis sistem, manajemen pengguna, konfigurasi, cabang, dan master data.', default_scope: 'ALL' },
      { id: 'role-manajer-area', slug: 'manajer_area', name: 'Manager Area', description: 'Pengawas operasional dan persetujuan transaksi seluruh toko dalam area regional yang ditugaskan.', default_scope: 'AREA' },
      { id: 'role-kepala-toko', slug: 'kepala_toko', name: 'Kepala Toko', description: 'Pimpinan operasional toko cabang spesifik, persetujuan diskon, refund, dan monitoring staf.', default_scope: 'STORE' },
      { id: 'role-kasir', slug: 'kasir', name: 'Kasir', description: 'Operasional POS kasir, scan produk, pembuatan faktur penjualan, dan cetak struk.', default_scope: 'OWN' },
      { id: 'role-gudang', slug: 'gudang', name: 'Gudang', description: 'Penerimaan stok, transfer barang, mutasi serial number/IMEI, dan stock opname.', default_scope: 'STORE' },
      { id: 'role-finance', slug: 'finance', name: 'Finance', description: 'Pengelolaan kas, bank, verifikasi pembayaran, hutang/piutang, biaya, dan laporan keuangan.', default_scope: 'ALL' },
      { id: 'role-digital-marketing', slug: 'digital_marketing', name: 'Digital Marketing', description: 'Pengelolaan konten promosi, banner, voucher diskon, dan analytics kampanye produk.', default_scope: 'ALL' },
      { id: 'role-audit', slug: 'audit', name: 'Audit', description: 'Pengawas kepatuhan (Read Only) audit log, rekam jejak transaksi, dan verifikasi stok.', default_scope: 'ALL' }
    ];

    for (const r of standardRoles) {
      await conn.query(
        `INSERT INTO roles (id, slug, name, description, default_scope, is_system) VALUES (?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), default_scope = VALUES(default_scope);`,
        [r.id, r.slug, r.name, r.description, r.default_scope]
      );
    }

    // 4. PERMISSIONS TABLE
    console.log('4. Ensuring permissions table exists...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id VARCHAR(64) PRIMARY KEY,
        slug VARCHAR(100) NOT NULL UNIQUE,
        module VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        description VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_perm_module (module)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const standardPermissions = [
      // Dashboard
      { id: 'perm-dashboard-view', slug: 'dashboard.view', module: 'dashboard', action: 'view', description: 'Melihat dashboard' },
      { id: 'perm-dashboard-financial', slug: 'dashboard.financial', module: 'dashboard', action: 'view_financial', description: 'Melihat widget keuangan sensitif di dashboard (omzet, profit)' },
      
      // Products
      { id: 'perm-products-view', slug: 'products.view', module: 'products', action: 'view', description: 'Melihat daftar produk dan harga' },
      { id: 'perm-products-create', slug: 'products.create', module: 'products', action: 'create', description: 'Menambah produk baru' },
      { id: 'perm-products-update', slug: 'products.update', module: 'products', action: 'update', description: 'Mengubah informasi produk & harga' },
      { id: 'perm-products-delete', slug: 'products.delete', module: 'products', action: 'delete', description: 'Menghapus produk dari katalog' },

      // Sales & POS
      { id: 'perm-sales-view', slug: 'sales.view', module: 'sales', action: 'view', description: 'Melihat riwayat transaksi penjualan' },
      { id: 'perm-sales-create', slug: 'sales.create', module: 'sales', action: 'create', description: 'Melakukan transaksi kasir / POS' },
      { id: 'perm-sales-update', slug: 'sales.update', module: 'sales', action: 'update', description: 'Mengubah status pesanan' },
      { id: 'perm-sales-cancel', slug: 'sales.cancel', module: 'sales', action: 'cancel', description: 'Membatalkan transaksi' },
      { id: 'perm-sales-discount', slug: 'sales.discount', module: 'sales', action: 'discount', description: 'Menerapkan diskon manual kasir' },
      { id: 'perm-sales-refund', slug: 'sales.refund', module: 'sales', action: 'refund', description: 'Memproses pengembalian barang/dana' },

      // Stock & Inventory
      { id: 'perm-stock-view', slug: 'stock.view', module: 'stock', action: 'view', description: 'Melihat status stok barang' },
      { id: 'perm-stock-receive', slug: 'stock.receive', module: 'stock', action: 'receive', description: 'Menerima barang masuk dari supplier/distributor' },
      { id: 'perm-stock-transfer', slug: 'stock.transfer', module: 'stock', action: 'transfer', description: 'Mengirim/mentransfer stok antar cabang/gudang' },
      { id: 'perm-stock-adjust', slug: 'stock.adjust', module: 'stock', action: 'adjust', description: 'Penyesuaian stok selisih atau rusak' },
      { id: 'perm-stock-opname', slug: 'stock.opname', module: 'stock', action: 'opname', description: 'Melakukan stock opname fisik' },

      // Laptop Serial Numbers & IMEI
      { id: 'perm-serials-view', slug: 'serials.view', module: 'serials', action: 'view', description: 'Melihat data serial number laptop & histori pergerakan' },
      { id: 'perm-serials-manage', slug: 'serials.manage', module: 'serials', action: 'manage', description: 'Mendaftarkan dan memutasi serial number unit laptop' },

      // Purchase & Suppliers
      { id: 'perm-purchase-view', slug: 'purchase.view', module: 'purchase', action: 'view', description: 'Melihat purchase order supplier' },
      { id: 'perm-purchase-create', slug: 'purchase.create', module: 'purchase', action: 'create', description: 'Membuat purchase order baru' },
      { id: 'perm-purchase-approve', slug: 'purchase.approve', module: 'purchase', action: 'approve', description: 'Menyetujui purchase order pembelian' },

      // Finance
      { id: 'perm-finance-view', slug: 'finance.view', module: 'finance', action: 'view', description: 'Melihat data keuangan, buku kas, & rekening' },
      { id: 'perm-finance-create', slug: 'finance.create', module: 'finance', action: 'create', description: 'Mencatat pengeluaran dan pemasukan operasional' },
      { id: 'perm-finance-approve', slug: 'finance.approve', module: 'finance', action: 'approve', description: 'Menyetujui pembayaran hutang & klaim biaya' },
      { id: 'perm-finance-export', slug: 'finance.export', module: 'finance', action: 'export', description: 'Export laporan keuangan ke Excel/PDF' },

      // Service Center
      { id: 'perm-service-view', slug: 'service.view', module: 'service', action: 'view', description: 'Melihat tiket servis laptop' },
      { id: 'perm-service-manage', slug: 'service.manage', module: 'service', action: 'manage', description: 'Memperbarui status pengerjaan servis & biaya' },

      // Users & Organization
      { id: 'perm-users-view', slug: 'users.view', module: 'users', action: 'view', description: 'Melihat daftar staf/pengguna admin' },
      { id: 'perm-users-create', slug: 'users.create', module: 'users', action: 'create', description: 'Menambah staf/admin baru' },
      { id: 'perm-users-update', slug: 'users.update', module: 'users', action: 'update', description: 'Mengubah profil, role, atau toko staf' },
      { id: 'perm-users-disable', slug: 'users.disable', module: 'users', action: 'disable', description: 'Menonaktifkan akses staf' },

      // Roles & RBAC Configuration
      { id: 'perm-roles-view', slug: 'roles.view', module: 'roles', action: 'view', description: 'Melihat daftar role dan hak akses' },
      { id: 'perm-roles-create', slug: 'roles.create', module: 'roles', action: 'create', description: 'Membuat role kustom baru' },
      { id: 'perm-roles-update', slug: 'roles.update', module: 'roles', action: 'update', description: 'Memodifikasi izin permissions pada role' },
      { id: 'perm-roles-delete', slug: 'roles.delete', module: 'roles', action: 'delete', description: 'Menghapus role kustom' },

      // Branches & Areas
      { id: 'perm-stores-manage', slug: 'stores.manage', module: 'stores', action: 'manage', description: 'Mengelola data cabang toko dan area regional' },

      // Marketing
      { id: 'perm-marketing-view', slug: 'marketing.view', module: 'marketing', action: 'view', description: 'Melihat kampanye promo, banner, dan statistik pemasaran' },
      { id: 'perm-marketing-create', slug: 'marketing.create', module: 'marketing', action: 'create', description: 'Membuat banner promosi dan voucher diskon' },
      { id: 'perm-marketing-update', slug: 'marketing.update', module: 'marketing', action: 'update', description: 'Mengubah konten pemasaran dan landing page' },
      { id: 'perm-marketing-publish', slug: 'marketing.publish', module: 'marketing', action: 'publish', description: 'Menerbitkan kampanye promosi aktif' },

      // Reports
      { id: 'perm-reports-sales', slug: 'reports.sales', module: 'reports', action: 'sales', description: 'Mengakses laporan penjualan dan omzet' },
      { id: 'perm-reports-stock', slug: 'reports.stock', module: 'reports', action: 'stock', description: 'Mengakses laporan inventaris & perputaran stok' },
      { id: 'perm-reports-finance', slug: 'reports.finance', module: 'reports', action: 'finance', description: 'Mengakses laporan laba rugi & arus kas' },
      { id: 'perm-reports-audit', slug: 'reports.audit', module: 'reports', action: 'audit', description: 'Mengakses riwayat audit trail aktivitas pengguna' },

      // Audit Logs
      { id: 'perm-audit-view', slug: 'audit.view', module: 'audit', action: 'view', description: 'Membaca log audit aktivitas sistem' },
      { id: 'perm-audit-export', slug: 'audit.export', module: 'audit', action: 'export', description: 'Export log audit ke file eksternal' },

      // Approvals
      { id: 'perm-approval-view', slug: 'approval.view', module: 'approval', action: 'view', description: 'Melihat daftar permohonan approval' },
      { id: 'perm-approval-create', slug: 'approval.create', module: 'approval', action: 'create', description: 'Mengajukan permohonan persetujuan (diskon/refund/stok/biaya)' },
      { id: 'perm-approval-approve', slug: 'approval.approve', module: 'approval', action: 'approve', description: 'Menyetujui (Approve) permohonan otorisasi' },
      { id: 'perm-approval-reject', slug: 'approval.reject', module: 'approval', action: 'reject', description: 'Menolak (Reject) permohonan otorisasi' },

      // System Settings & WhatsApp
      { id: 'perm-settings-manage', slug: 'settings.manage', module: 'settings', action: 'manage', description: 'Mengubah konfigurasi situs, WhatsApp API, dan identitas toko' }
    ];

    for (const p of standardPermissions) {
      await conn.query(
        `INSERT INTO permissions (id, slug, module, action, description) VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE description = VALUES(description);`,
        [p.id, p.slug, p.module, p.action, p.description]
      );
    }

    // 5. ROLE_PERMISSIONS TABLE
    console.log('5. Ensuring role_permissions table exists...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id VARCHAR(64) NOT NULL,
        permission_id VARCHAR(64) NOT NULL,
        scope ENUM('ALL', 'AREA', 'STORE', 'OWN') NOT NULL DEFAULT 'STORE',
        PRIMARY KEY (role_id, permission_id),
        INDEX idx_rp_role (role_id),
        INDEX idx_rp_perm (permission_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Helper map to insert role permissions by slug
    const permMap = {};
    for (const p of standardPermissions) {
      permMap[p.slug] = p.id;
    }

    // Define permission sets for the 9 roles
    const rolePermissionMapping = {
      // 1. OWNER
      'role-owner': {
        scope: 'ALL',
        permissions: [
          'dashboard.view', 'dashboard.financial', 'products.view', 'sales.view',
          'stock.view', 'serials.view', 'purchase.view', 'finance.view', 'finance.reports',
          'service.view', 'users.view', 'roles.view', 'marketing.view',
          'reports.sales', 'reports.stock', 'reports.finance', 'reports.audit',
          'audit.view', 'audit.export', 'approval.view', 'approval.approve', 'approval.reject'
        ]
      },
      // 2. SUPER ADMIN
      'role-super-admin': {
        scope: 'ALL',
        permissions: Object.keys(permMap) // Full system configuration
      },
      // 3. MANAGER AREA
      'role-manajer-area': {
        scope: 'AREA',
        permissions: [
          'dashboard.view', 'dashboard.financial', 'products.view', 'sales.view', 'sales.discount',
          'stock.view', 'stock.transfer', 'stock.adjust', 'stock.opname', 'serials.view',
          'purchase.view', 'service.view', 'users.view', 'reports.sales', 'reports.stock',
          'approval.view', 'approval.approve', 'approval.reject'
        ]
      },
      // 4. KEPALA TOKO
      'role-kepala-toko': {
        scope: 'STORE',
        permissions: [
          'dashboard.view', 'products.view', 'sales.view', 'sales.create', 'sales.update',
          'sales.discount', 'sales.refund', 'stock.view', 'stock.transfer', 'stock.adjust',
          'stock.opname', 'serials.view', 'service.view', 'service.manage', 'users.view',
          'reports.sales', 'reports.stock', 'approval.view', 'approval.create', 'approval.approve', 'approval.reject'
        ]
      },
      // 5. KASIR
      'role-kasir': {
        scope: 'OWN',
        permissions: [
          'dashboard.view', 'products.view', 'sales.view', 'sales.create',
          'sales.discount', 'serials.view', 'approval.view', 'approval.create'
        ]
      },
      // 6. GUDANG
      'role-gudang': {
        scope: 'STORE',
        permissions: [
          'dashboard.view', 'products.view', 'stock.view', 'stock.receive',
          'stock.transfer', 'stock.adjust', 'stock.opname', 'serials.view',
          'serials.manage', 'reports.stock', 'approval.view', 'approval.create'
        ]
      },
      // 7. FINANCE
      'role-finance': {
        scope: 'ALL',
        permissions: [
          'dashboard.view', 'dashboard.financial', 'sales.view', 'sales.refund',
          'purchase.view', 'finance.view', 'finance.create', 'finance.approve',
          'finance.export', 'reports.sales', 'reports.finance', 'approval.view',
          'approval.approve', 'approval.reject'
        ]
      },
      // 8. DIGITAL MARKETING
      'role-digital-marketing': {
        scope: 'ALL',
        permissions: [
          'dashboard.view', 'products.view', 'marketing.view', 'marketing.create',
          'marketing.update', 'marketing.publish', 'reports.sales'
        ]
      },
      // 9. AUDIT (Read-only on all records)
      'role-audit': {
        scope: 'ALL',
        permissions: [
          'dashboard.view', 'dashboard.financial', 'products.view', 'sales.view',
          'stock.view', 'serials.view', 'purchase.view', 'finance.view',
          'service.view', 'users.view', 'roles.view', 'reports.sales',
          'reports.stock', 'reports.finance', 'reports.audit', 'audit.view',
          'audit.export', 'approval.view'
        ]
      }
    };

    for (const [roleId, config] of Object.entries(rolePermissionMapping)) {
      const allowedPermIds = config.permissions.map(s => permMap[s]).filter(Boolean);
      if (allowedPermIds.length > 0) {
        await conn.query(
          `DELETE FROM role_permissions WHERE role_id = ? AND permission_id NOT IN (?)`,
          [roleId, allowedPermIds]
        );
      }
      for (const pSlug of config.permissions) {
        const pId = permMap[pSlug];
        if (pId) {
          await conn.query(
            `INSERT INTO role_permissions (role_id, permission_id, scope) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE scope = VALUES(scope);`,
            [roleId, pId, config.scope]
          );
        }
      }
    }

    // 6. USER_STORES & USER_AREAS ASSIGNMENTS
    console.log('6. Ensuring user_stores & user_areas tables exist...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_stores (
        user_id VARCHAR(64) NOT NULL,
        store_id VARCHAR(64) NOT NULL,
        is_primary TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, store_id),
        INDEX idx_us_user (user_id),
        INDEX idx_us_store (store_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_areas (
        user_id VARCHAR(64) NOT NULL,
        area_id VARCHAR(64) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, area_id),
        INDEX idx_ua_user (user_id),
        INDEX idx_ua_area (area_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 7. SAFE ALTER ADMIN_USERS TABLE (Additive, non-destructive)
    console.log('7. Safely enriching admin_users columns...');
    const [userCols] = await conn.query(`DESCRIBE admin_users`);
    const existingUserColNames = userCols.map(c => c.Field);

    const userColAdditions = [
      { name: 'role_id', def: 'VARCHAR(64) NULL DEFAULT NULL' },
      { name: 'primary_store_id', def: "VARCHAR(64) NULL DEFAULT 'store-pekalongan'" },
      { name: 'primary_area_id', def: "VARCHAR(64) NULL DEFAULT 'area-jateng'" },
      { name: 'phone', def: 'VARCHAR(50) NULL' },
      { name: 'last_login_at', def: 'DATETIME NULL' }
    ];

    for (const c of userColAdditions) {
      if (!existingUserColNames.includes(c.name)) {
        await conn.query(`ALTER TABLE admin_users ADD COLUMN ${c.name} ${c.def};`);
        console.log(`Added column ${c.name} to admin_users.`);
      }
    }

    // Associate existing admin users with correct role_id, store_id, area_id
    const userRoleMappings = [
      { email: 'admin@example.com', role_id: 'role-super-admin', store: 'store-pekalongan', area: 'area-pusat' },
      { email: 'owner@rajalaptop.com', role_id: 'role-owner', store: 'store-pekalongan', area: 'area-pusat' },
      { email: 'manager@rajalaptop.com', role_id: 'role-manajer-area', store: 'store-pekalongan', area: 'area-jateng' },
      { email: 'audit@rajalaptop.com', role_id: 'role-audit', store: 'store-pekalongan', area: 'area-jateng' },
      { email: 'finance@rajalaptop.com', role_id: 'role-finance', store: 'store-pekalongan', area: 'area-pusat' },
      { email: 'gudang@rajalaptop.com', role_id: 'role-gudang', store: 'warehouse-pusat', area: 'area-pusat' },
      { email: 'kasir@rajalaptop.com', role_id: 'role-kasir', store: 'store-pekalongan', area: 'area-jateng' },
      { email: 'kepalatoko@rajalaptop.com', role_id: 'role-kepala-toko', store: 'store-pekalongan', area: 'area-jateng' },
      { email: 'marketing@rajalaptop.com', role_id: 'role-digital-marketing', store: 'store-pekalongan', area: 'area-pusat' },
    ];

    for (const u of userRoleMappings) {
      await conn.query(
        `UPDATE admin_users SET role_id = ?, primary_store_id = ?, primary_area_id = ? WHERE email = ?;`,
        [u.role_id, u.store, u.area, u.email]
      );
      // Also register into user_stores & user_areas
      const [usr] = await conn.query(`SELECT id FROM admin_users WHERE email = ?`, [u.email]);
      if (usr[0]) {
        await conn.query(
          `INSERT IGNORE INTO user_stores (user_id, store_id, is_primary) VALUES (?, ?, 1);`,
          [usr[0].id, u.store]
        );
        await conn.query(
          `INSERT IGNORE INTO user_areas (user_id, area_id) VALUES (?, ?);`,
          [usr[0].id, u.area]
        );
      }
    }

    // 8. SAFE ENRICH AUDIT_LOGS TABLE
    console.log('8. Safely enriching audit_logs columns...');
    const [auditCols] = await conn.query(`DESCRIBE audit_logs`);
    const existingAuditColNames = auditCols.map(c => c.Field);

    const auditColAdditions = [
      { name: 'user_id', def: 'VARCHAR(64) NULL' },
      { name: 'resource_type', def: 'VARCHAR(100) NULL' },
      { name: 'resource_id', def: 'VARCHAR(100) NULL' },
      { name: 'old_value', def: 'LONGTEXT NULL' },
      { name: 'new_value', def: 'LONGTEXT NULL' },
      { name: 'store_id', def: 'VARCHAR(64) NULL' },
      { name: 'area_id', def: 'VARCHAR(64) NULL' },
      { name: 'ip_address', def: 'VARCHAR(64) NULL' },
      { name: 'user_agent', def: 'VARCHAR(255) NULL' },
      { name: 'status', def: "VARCHAR(50) NOT NULL DEFAULT 'SUCCESS'" },
      { name: 'reason', def: 'TEXT NULL' }
    ];

    for (const c of auditColAdditions) {
      if (!existingAuditColNames.includes(c.name)) {
        await conn.query(`ALTER TABLE audit_logs ADD COLUMN ${c.name} ${c.def};`);
        console.log(`Added column ${c.name} to audit_logs.`);
      }
    }

    // 9. APPROVAL WORKFLOW TABLES
    console.log('9. Ensuring approval_requests & approval_actions tables exist...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS approval_requests (
        id VARCHAR(64) PRIMARY KEY,
        request_type ENUM('DISCOUNT', 'REFUND', 'STOCK_ADJUSTMENT', 'STOCK_TRANSFER', 'EXPENSE') NOT NULL,
        requester_id VARCHAR(64) NOT NULL,
        store_id VARCHAR(64) NULL,
        area_id VARCHAR(64) NULL,
        status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
        reference_type VARCHAR(100) NULL,
        reference_id VARCHAR(100) NULL,
        old_value LONGTEXT NULL,
        new_value LONGTEXT NULL,
        reason TEXT NOT NULL,
        notes TEXT NULL,
        approved_by VARCHAR(64) NULL,
        approved_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_appr_status (status),
        INDEX idx_appr_type (request_type),
        INDEX idx_appr_store (store_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS approval_actions (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        request_id VARCHAR(64) NOT NULL,
        actor_id VARCHAR(64) NOT NULL,
        action ENUM('SUBMIT', 'APPROVE', 'REJECT', 'CANCEL') NOT NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_act_req (request_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Insert initial sample approval request for testing
    await conn.query(`
      INSERT IGNORE INTO approval_requests 
      (id, request_type, requester_id, store_id, area_id, status, reference_type, reference_id, reason, notes, old_value, new_value)
      VALUES 
      ('APPR-001', 'DISCOUNT', 'admin-kasir', 'store-pekalongan', 'area-jateng', 'PENDING', 'ORDER', 'RL-8813', 
       'Permintaan diskon khusus mahasiswa Teknik Informatika sebesar 8%', 'Pengecekan KTM valid', '{"discount": 0}', '{"discount": 8, "amount": 1719920}'),
      ('APPR-002', 'STOCK_ADJUSTMENT', 'admin-gudang', 'warehouse-pusat', 'area-pusat', 'PENDING', 'PRODUCT', 'prod-5',
       'Penyesuaian stok unit display lecet minor pada engsel', 'Perlu re-grading ke grade B', '{"stock": 2}', '{"stock": 1, "loss_reason": "display_defect"}');
    `);

    // 10. LAPTOP SERIAL NUMBER LIFECYCLE
    console.log('10. Ensuring product_serials & serial_movements tables exist...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS product_serials (
        id VARCHAR(64) PRIMARY KEY,
        product_id VARCHAR(64) NOT NULL,
        serial_number VARCHAR(120) NOT NULL UNIQUE,
        imei VARCHAR(120) NULL,
        supplier_id INT UNSIGNED NULL,
        purchase_order_id VARCHAR(50) NULL,
        current_store_id VARCHAR(64) NULL,
        status ENUM('IN_STOCK', 'RESERVED', 'SOLD', 'DEFECTIVE', 'IN_TRANSIT', 'RETURNED') NOT NULL DEFAULT 'IN_STOCK',
        sale_order_id VARCHAR(50) NULL,
        customer_id VARCHAR(64) NULL,
        warranty_months INT DEFAULT 24,
        warranty_expiry DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_sn_product (product_id),
        INDEX idx_sn_status (status),
        INDEX idx_sn_store (current_store_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS serial_movements (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        serial_id VARCHAR(64) NOT NULL,
        from_location_type ENUM('SUPPLIER', 'WAREHOUSE', 'STORE', 'CUSTOMER') NOT NULL,
        from_location_id VARCHAR(64) NULL,
        to_location_type ENUM('WAREHOUSE', 'STORE', 'CUSTOMER', 'SUPPLIER', 'RMA') NOT NULL,
        to_location_id VARCHAR(64) NULL,
        movement_type ENUM('PURCHASE_RECEIPT', 'INTERNAL_TRANSFER', 'SALE', 'CUSTOMER_RETURN', 'SUPPLIER_RMA') NOT NULL,
        reference_id VARCHAR(64) NULL,
        actor_id VARCHAR(64) NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_sm_serial (serial_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed sample laptop serials
    const sampleSerials = [
      { id: 'sn-001', product_id: 'prod-1', sn: 'ROG-G16-2025-00192', store: 'store-pekalongan', status: 'IN_STOCK', po: 'PO-202609-01' },
      { id: 'sn-002', product_id: 'prod-1', sn: 'ROG-G16-2025-00193', store: 'store-pekalongan', status: 'IN_STOCK', po: 'PO-202609-01' },
      { id: 'sn-003', product_id: 'prod-2', sn: 'LEG-PRO5I-884102', store: 'store-pekalongan', status: 'SOLD', po: 'PO-202609-02', sale: 'RL-8813', cust: 'cust-2' },
      { id: 'sn-004', product_id: 'prod-3', sn: 'APL-MBA-M3-99381', store: 'store-gejayan', status: 'IN_STOCK', po: 'PO-202609-03' },
      { id: 'sn-005', product_id: 'prod-4', sn: 'ACR-HELIOS-55421', store: 'store-semarang', status: 'IN_STOCK', po: 'PO-202609-01' }
    ];

    for (const item of sampleSerials) {
      await conn.query(`
        INSERT INTO product_serials 
        (id, product_id, serial_number, purchase_order_id, current_store_id, status, sale_order_id, customer_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE status = VALUES(status);
      `, [item.id, item.product_id, item.sn, item.po, item.store, item.status, item.sale || null, item.cust || null]);
    }

    // 11. SAFE ENRICH ORDERS TABLE (Add store_id, cashier_id)
    console.log('11. Safely enriching orders table columns...');
    const [orderCols] = await conn.query(`DESCRIBE orders`);
    const existingOrderColNames = orderCols.map(c => c.Field);

    const orderColAdditions = [
      { name: 'store_id', def: "VARCHAR(64) NULL DEFAULT 'store-pekalongan'" },
      { name: 'cashier_id', def: "VARCHAR(64) NULL DEFAULT 'admin-kasir'" },
      { name: 'area_id', def: "VARCHAR(64) NULL DEFAULT 'area-jateng'" },
      { name: 'discount_amount', def: 'DECIMAL(15,2) DEFAULT 0' },
      { name: 'discount_approved_by', def: 'VARCHAR(64) NULL' },
      { name: 'refund_status', def: "ENUM('NONE', 'REQUESTED', 'APPROVED', 'REJECTED', 'REFUNDED') DEFAULT 'NONE'" },
      { name: 'refund_approved_by', def: 'VARCHAR(64) NULL' }
    ];

    for (const c of orderColAdditions) {
      if (!existingOrderColNames.includes(c.name)) {
        await conn.query(`ALTER TABLE orders ADD COLUMN ${c.name} ${c.def};`);
        console.log(`Added column ${c.name} to orders.`);
      }
    }

    console.log('--- Migration Completed Successfully! ---');
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  } finally {
    await conn.end();
  }
}

migrate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
