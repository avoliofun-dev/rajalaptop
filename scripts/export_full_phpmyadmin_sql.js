// scripts/export_full_phpmyadmin_sql.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: 'rajalaptop',
    port: Number(process.env.MYSQL_PORT) || 3306,
  });

  const header = `-- =========================================================================
-- DATABASE RAJALAPTOP DUMP FOR PHPMYADMIN
-- Website + Admin Dashboard Full-Stack Database
-- Source of Truth: ELS_Pricelist_28-09-2026.sql + rajalaptop application
-- Generated: ${new Date().toISOString()}
-- =========================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

CREATE DATABASE IF NOT EXISTS \`rajalaptop\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`rajalaptop\`;
`;

  let out = header;

  const [tables] = await conn.query('SHOW FULL TABLES WHERE Table_type != "VIEW"');
  for (const t of tables) {
    const tableName = Object.values(t)[0];
    console.log('Exporting table:', tableName);

    out += `\n-- ---------------------------------------------------------\n`;
    out += `-- Struktur tabel \`${tableName}\`\n`;
    out += `-- ---------------------------------------------------------\n`;

    const [[createTable]] = await conn.query(`SHOW CREATE TABLE \`${tableName}\``);
    out += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
    out += `${createTable['Create Table']};\n\n`;

    const [rows] = await conn.query(`SELECT * FROM \`${tableName}\``);
    if (rows.length > 0) {
      out += `-- Dumping data untuk tabel \`${tableName}\` (${rows.length} rows)\n`;
      const cols = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
      
      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const valuesStr = batch.map(r => {
          const vals = Object.values(r).map(v => {
            if (v === null) return 'NULL';
            if (typeof v === 'number') return v;
            if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
            return `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
          });
          return `(${vals.join(', ')})`;
        }).join(',\n');

        out += `INSERT INTO \`${tableName}\` (${cols}) VALUES\n${valuesStr};\n\n`;
      }
    }
  }

  out += `\n-- ---------------------------------------------------------\n`;
  out += `-- View \`vw_dashboard_metrics\`\n`;
  out += `-- ---------------------------------------------------------\n`;
  out += `CREATE OR REPLACE VIEW \`vw_dashboard_metrics\` AS
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

  const dest = path.join(__dirname, '..', 'rajalaptop_phpmyadmin.sql');
  fs.writeFileSync(dest, out, 'utf8');
  console.log('Complete SQL dump written to:', dest);

  await conn.end();
}

main().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});
