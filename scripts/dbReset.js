// scripts/dbReset.js
// Reset and initialize the database with full schema, seed data, and pricelist migration.
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


(async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true,
    });

    // Drop and recreate database
    await connection.query('DROP DATABASE IF EXISTS rajalaptop');
    await connection.query('CREATE DATABASE rajalaptop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await connection.query('USE rajalaptop');

    // Helper to run a SQL file
    const runSqlFile = async (fileName) => {
      const sqlPath = path.resolve(__dirname, '..', fileName);
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await connection.query(sql);
    };

    // Execute schema, seed, and migration scripts
    await runSqlFile('01_schema.sql');
    await runSqlFile('02_seed.sql');
    await runSqlFile('03_migration_pricelist.sql');

    console.log('Database reset and initialization completed successfully.');
    await connection.end();
  } catch (err) {
    console.error('Error during DB reset:', err);
    process.exit(1);
  }
})();
