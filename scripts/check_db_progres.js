const db = require('../lib/db.js');
async function run() {
  try {
    const s = await db.getSettings();
    console.log('Database connected successfully!');
    console.log('Current system version setting:', s ? s.system_version : 'Not set');
    // Also check if settings table exists and list tables
    const [tables] = await db.pool.query('SHOW TABLES');
    console.log('Tables in database:', tables.map(t => Object.values(t)[0]));
  } catch (err) {
    console.error('Database query error:', err.message);
  } finally {
    process.exit(0);
  }
}
run();
