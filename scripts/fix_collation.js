const { pool } = require('../lib/db');

async function fixCollation() {
  const [tables] = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'rajalaptop' AND table_type = 'BASE TABLE'");
  for (const t of tables) {
    const tbl = t.TABLE_NAME || t.table_name;
    console.log(`Converting ${tbl} to utf8mb4_unicode_ci...`);
    await pool.query(`ALTER TABLE \`${tbl}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  }
  console.log('All tables converted to utf8mb4_unicode_ci successfully!');
  process.exit(0);
}

fixCollation().catch(err => {
  console.error(err);
  process.exit(1);
});
