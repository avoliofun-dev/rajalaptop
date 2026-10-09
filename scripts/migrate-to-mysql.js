const mysql = require('mysql2/promise');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

async function migrate() {
  console.log("Starting migration to MySQL XAMPP...");
  
  // 1. Connect to MySQL server (without DB first)
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    port: 3306,
  });

  console.log("Connected to MySQL server.");

  // 2. Create database if not exists
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`rajalaptop_db\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  console.log("Database `rajalaptop_db` ensured.");

  await connection.changeUser({ database: 'rajalaptop_db' });

  // 3. Create tables
  await connection.query(`CREATE TABLE IF NOT EXISTS \`settings\` (
    \`id\` INT PRIMARY KEY AUTO_INCREMENT,
    \`storeName\` VARCHAR(255),
    \`tagline\` VARCHAR(255),
    \`metaDescription\` TEXT,
    \`promoBarActive\` TINYINT(1) DEFAULT 1,
    \`promoBarText\` TEXT,
    \`whatsappNumber\` VARCHAR(50),
    \`phoneOffice\` VARCHAR(50),
    \`supportEmail\` VARCHAR(100),
    \`openingHours\` VARCHAR(100),
    \`mainAddress\` TEXT,
    \`maintenanceMode\` TINYINT(1) DEFAULT 0
  ) ENGINE=InnoDB;`);

  await connection.query(`CREATE TABLE IF NOT EXISTS \`products\` (
    \`id\` VARCHAR(50) PRIMARY KEY,
    \`name\` VARCHAR(255) NOT NULL,
    \`brand\` VARCHAR(100),
    \`category\` VARCHAR(50),
    \`price\` BIGINT,
    \`originalPrice\` BIGINT,
    \`discount\` INT DEFAULT 0,
    \`stock\` INT DEFAULT 0,
    \`status\` VARCHAR(20) DEFAULT 'active',
    \`specs\` TEXT,
    \`emoji\` VARCHAR(20) DEFAULT '💻',
    \`rating\` VARCHAR(10) DEFAULT '4.9',
    \`sold\` INT DEFAULT 0
  ) ENGINE=InnoDB;`);

  await connection.query(`CREATE TABLE IF NOT EXISTS \`orders\` (
    \`id\` VARCHAR(50) PRIMARY KEY,
    \`customer\` VARCHAR(150),
    \`phone\` VARCHAR(50),
    \`email\` VARCHAR(150),
    \`product\` TEXT,
    \`total\` BIGINT,
    \`status\` VARCHAR(50),
    \`kurir\` VARCHAR(100),
    \`resi\` VARCHAR(100),
    \`date\` VARCHAR(100)
  ) ENGINE=InnoDB;`);

  await connection.query(`CREATE TABLE IF NOT EXISTS \`services\` (
    \`id\` VARCHAR(50) PRIMARY KEY,
    \`customer\` VARCHAR(150),
    \`phone\` VARCHAR(50),
    \`unit\` VARCHAR(150),
    \`issue\` TEXT,
    \`tech\` VARCHAR(100),
    \`stage\` VARCHAR(100),
    \`priority\` VARCHAR(50),
    \`date\` VARCHAR(100)
  ) ENGINE=InnoDB;`);

  await connection.query(`CREATE TABLE IF NOT EXISTS \`customers\` (
    \`id\` VARCHAR(50) PRIMARY KEY,
    \`name\` VARCHAR(150) NOT NULL,
    \`email\` VARCHAR(150) NOT NULL UNIQUE,
    \`phone\` VARCHAR(50),
    \`password_hash\` VARCHAR(255) NOT NULL,
    \`tier\` VARCHAR(50) DEFAULT 'Member',
    \`points\` INT DEFAULT 0,
    \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;`);

  await connection.query(`CREATE TABLE IF NOT EXISTS \`admins\` (
    \`id\` VARCHAR(50) PRIMARY KEY,
    \`name\` VARCHAR(150) NOT NULL,
    \`email\` VARCHAR(150) NOT NULL UNIQUE,
    \`password_hash\` VARCHAR(255) NOT NULL,
    \`role\` VARCHAR(50) NOT NULL DEFAULT 'super_admin',
    \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB;`);

  console.log("Tables created successfully.");

  // Seed default admin if none exists
  // Default credentials: admin@rajalaptop.com / admin123
  const [adminCount] = await connection.query('SELECT COUNT(*) as cnt FROM admins');
  if (adminCount[0].cnt === 0) {
    const bcrypt = require('bcryptjs');
    const passwordHash = bcrypt.hashSync('admin123', 10);
    await connection.query(
      `INSERT INTO admins (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
      ['admin-1', 'Super Admin', 'admin@rajalaptop.com', passwordHash, 'super_admin']
    );
    console.log("Seeded default admin: admin@rajalaptop.com / admin123");
  }

  // 4. Migrate data from SQLite if available
  const sqliteDbPath = path.join(process.cwd(), 'data', 'rajalaptop.db');
  if (fs.existsSync(sqliteDbPath)) {
    const sqlite = new Database(sqliteDbPath);
    
    // Settings
    const [settingsCount] = await connection.query('SELECT COUNT(*) as cnt FROM settings');
    if (settingsCount[0].cnt === 0) {
      try {
        const s = sqlite.prepare('SELECT * FROM settings LIMIT 1').get();
        if (s) {
          await connection.query(
            `INSERT INTO settings (storeName, tagline, metaDescription, promoBarActive, promoBarText, whatsappNumber, phoneOffice, supportEmail, openingHours, mainAddress, maintenanceMode)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [s.storeName, s.tagline, s.metaDescription, s.promoBarActive, s.promoBarText, s.whatsappNumber, s.phoneOffice, s.supportEmail, s.openingHours, s.mainAddress, s.maintenanceMode]
          );
          console.log("Migrated settings.");
        }
      } catch (err) {
        console.log("Notice on settings:", err.message);
      }
    }

    // Products
    const [prodCount] = await connection.query('SELECT COUNT(*) as cnt FROM products');
    if (prodCount[0].cnt === 0) {
      try {
        const products = sqlite.prepare('SELECT * FROM products').all();
        for (const p of products) {
          await connection.query(
            `INSERT INTO products (id, name, brand, category, price, originalPrice, discount, stock, status, specs, emoji, rating, sold)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [p.id, p.name, p.brand, p.category, p.price, p.originalPrice, p.discount, p.stock, p.status, p.specs, p.emoji, p.rating, p.sold]
          );
        }
        console.log(`Migrated ${products.length} products.`);
      } catch (err) {
        console.log("Notice on products:", err.message);
      }
    }

    // Orders
    const [orderCount] = await connection.query('SELECT COUNT(*) as cnt FROM orders');
    if (orderCount[0].cnt === 0) {
      try {
        const orders = sqlite.prepare('SELECT * FROM orders').all();
        for (const o of orders) {
          await connection.query(
            `INSERT INTO orders (id, customer, phone, email, product, total, status, kurir, resi, date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [o.id, o.customer, o.phone, o.email, o.product, o.total, o.status, o.kurir, o.resi, o.date]
          );
        }
        console.log(`Migrated ${orders.length} orders.`);
      } catch (err) {
        console.log("Notice on orders:", err.message);
      }
    }

    // Services
    const [svcCount] = await connection.query('SELECT COUNT(*) as cnt FROM services');
    if (svcCount[0].cnt === 0) {
      try {
        const svcs = sqlite.prepare('SELECT * FROM services').all();
        for (const s of svcs) {
          await connection.query(
            `INSERT INTO services (id, customer, phone, unit, issue, tech, stage, priority, date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [s.id, s.customer, s.phone, s.unit, s.issue, s.tech, s.stage, s.priority, s.date]
          );
        }
        console.log(`Migrated ${svcs.length} services.`);
      } catch (err) {
        console.log("Notice on services:", err.message);
      }
    }

    sqlite.close();
  }

  await connection.end();
  console.log("MIGRATION_COMPLETE_SUCCESS");
}

migrate().catch(console.error);
