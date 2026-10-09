// scripts/watch_push.js
// Node.js file watcher: mendeteksi perubahan lalu auto-commit & auto-push
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
let timeout = null;

console.log('🚀 [Auto-Push] File watcher aktif. Memantau perubahan file...');
console.log('Tekan CTRL + C untuk berhenti.\n');

function triggerPush() {
  try {
    const status = execSync('git status --porcelain', { cwd: rootDir, encoding: 'utf8' }).trim();
    if (!status) return;

    const time = new Date().toLocaleString('id-ID');
    console.log(`[${time}] 📝 Perubahan terdeteksi, menjalankan commit & push...`);

    execSync('git add .', { cwd: rootDir, stdio: 'inherit' });
    execSync(`git commit -m "auto: sinkronisasi per ${time}"`, { cwd: rootDir, stdio: 'inherit' });
    console.log('🚀 Mendorong ke GitHub...');
    execSync('git push origin main', { cwd: rootDir, stdio: 'inherit' });
    console.log('✅ Berhasil terpush ke GitHub!\n');
  } catch (err) {
    console.error('⚠️ Gagal auto-push:', err.message || err);
  }
}

fs.watch(rootDir, { recursive: true }, (eventType, filename) => {
  if (!filename) return;
  // Abaikan folder internal
  if (
    filename.startsWith('.git') ||
    filename.startsWith('.next') ||
    filename.startsWith('node_modules') ||
    filename.startsWith('.env')
  ) {
    return;
  }

  clearTimeout(timeout);
  // Debounce 3 detik setelah perubahan terakhir selesai
  timeout = setTimeout(triggerPush, 3000);
});
