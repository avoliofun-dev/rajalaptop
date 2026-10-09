// scripts/test_http_endpoints.js
async function testHttp() {
  const baseUrl = process.env.TEST_URL || 'http://localhost:3000';
  console.log('Testing HTTP Login and RBAC Session on', baseUrl);

  const testAccounts = [
    { email: 'owner@rajalaptop.com', password: 'admin123', expectedRole: 'owner' },
    { email: 'avoliofun@gmail.com', password: 'admin123', expectedRole: 'super_admin' },
    { email: 'manager@rajalaptop.com', password: 'admin123', expectedRole: 'manajer_area' },
    { email: 'kepalatoko@rajalaptop.com', password: 'admin123', expectedRole: 'kepala_toko' },
    { email: 'kasir@rajalaptop.com', password: 'admin123', expectedRole: 'kasir' },
    { email: 'gudang@rajalaptop.com', password: 'admin123', expectedRole: 'gudang' },
    { email: 'finance@rajalaptop.com', password: 'admin123', expectedRole: 'finance' },
    { email: 'marketing@rajalaptop.com', password: 'admin123', expectedRole: 'digital_marketing' },
    { email: 'audit@rajalaptop.com', password: 'admin123', expectedRole: 'audit' },
  ];

  for (const acc of testAccounts) {
    const res = await fetch(`${baseUrl}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: acc.email, password: acc.password }),
    });

    const setCookie = res.headers.get('set-cookie');
    const data = await res.json();

    if (!res.ok || !data.ok) {
      console.error(`[FAIL] Login failed for ${acc.email}:`, data);
      continue;
    }

    // Now call /api/auth/admin/me with that cookie
    const meRes = await fetch(`${baseUrl}/api/auth/admin/me`, {
      headers: { Cookie: setCookie },
    });
    const meData = await meRes.json();

    const roleMatches = meData.user && meData.user.role === acc.expectedRole;
    const hasPerms = meData.user && Array.isArray(meData.user.permissionSlugs) && meData.user.permissionSlugs.length > 0;
    const hasScope = meData.user && Boolean(meData.user.defaultScope);

    if (roleMatches && hasPerms && hasScope) {
      console.log(`[PASS] ${acc.expectedRole.toUpperCase()}: Logged in as ${meData.user.name} | Scope: ${meData.user.defaultScope} | Perms: ${meData.user.permissionSlugs.length}`);
    } else {
      console.error(`[FAIL] Mismatch for ${acc.email}:`, meData);
    }
  }

  // Test unauthorized access on protected API without cookie
  const unauthRes = await fetch(`${baseUrl}/api/audit-logs`);
  if (unauthRes.status === 401) {
    console.log('[PASS] Security Guard: Unauthorized access to /api/audit-logs correctly returned 401');
  } else {
    console.error('[FAIL] Expected 401 on /api/audit-logs but got:', unauthRes.status);
  }

  // Test illegal audit delete attempt
  const delRes = await fetch(`${baseUrl}/api/audit-logs`, { method: 'DELETE' });
  if (delRes.status === 401 || delRes.status === 403) {
    console.log('[PASS] Security Guard: Immutable audit logs correctly rejected DELETE with HTTP', delRes.status);
  } else {
    console.error('[FAIL] Expected 401/403 on DELETE /api/audit-logs but got:', delRes.status);
  }

  process.exit(0);
}

testHttp().catch(err => {
  console.error('testHttp error:', err);
  process.exit(1);
});
