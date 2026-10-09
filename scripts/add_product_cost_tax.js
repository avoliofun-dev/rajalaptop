const { pool } = require('../lib/db');

async function migrate() {
  console.log('--- Migrating products table for cost_price & tax ---');
  const [cols] = await pool.query('SHOW COLUMNS FROM products');
  const existing = cols.map((c) => c.Field);

  if (!existing.includes('cost_price')) {
    await pool.query('ALTER TABLE products ADD COLUMN cost_price DECIMAL(15,2) DEFAULT 0.00 AFTER price');
    console.log('✓ Added cost_price column (DECIMAL 15,2)');
  } else {
    console.log('• cost_price column already exists');
  }

  if (!existing.includes('tax_rate')) {
    await pool.query('ALTER TABLE products ADD COLUMN tax_rate DECIMAL(5,2) DEFAULT 0.00 AFTER cost_price');
    console.log('✓ Added tax_rate column (DECIMAL 5,2)');
  } else {
    console.log('• tax_rate column already exists');
  }

  if (!existing.includes('tax_type')) {
    await pool.query("ALTER TABLE products ADD COLUMN tax_type VARCHAR(20) DEFAULT 'none' AFTER tax_rate");
    console.log('✓ Added tax_type column (VARCHAR 20)');
  } else {
    console.log('• tax_type column already exists');
  }

  console.log('Migration completed successfully!');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
