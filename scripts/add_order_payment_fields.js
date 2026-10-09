const { pool } = require('../lib/db');

async function migrate() {
  console.log('--- Migrating orders table for Payment Gateway & QRIS Dinamis ---');
  const [cols] = await pool.query('SHOW COLUMNS FROM orders');
  const existing = cols.map((c) => c.Field);

  if (!existing.includes('payment_method')) {
    await pool.query("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Tunai' AFTER total");
    console.log('✓ Added payment_method column');
  } else {
    console.log('• payment_method column already exists');
  }

  if (!existing.includes('payment_status')) {
    await pool.query("ALTER TABLE orders ADD COLUMN payment_status VARCHAR(30) DEFAULT 'PAID' AFTER payment_method");
    console.log('✓ Added payment_status column');
  } else {
    console.log('• payment_status column already exists');
  }

  if (!existing.includes('payment_ref')) {
    await pool.query("ALTER TABLE orders ADD COLUMN payment_ref VARCHAR(100) NULL AFTER payment_status");
    console.log('✓ Added payment_ref column');
  } else {
    console.log('• payment_ref column already exists');
  }

  if (!existing.includes('qris_payload')) {
    await pool.query("ALTER TABLE orders ADD COLUMN qris_payload TEXT NULL AFTER payment_ref");
    console.log('✓ Added qris_payload column');
  } else {
    console.log('• qris_payload column already exists');
  }

  if (!existing.includes('paid_at')) {
    await pool.query("ALTER TABLE orders ADD COLUMN paid_at DATETIME NULL AFTER qris_payload");
    console.log('✓ Added paid_at column');
  } else {
    console.log('• paid_at column already exists');
  }

  console.log('Migration for orders payment gateway completed successfully!');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
