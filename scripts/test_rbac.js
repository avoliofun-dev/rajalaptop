// scripts/test_rbac.js
const { pool } = require('../lib/db');
const { getUserRbacContext, hasPermission, isScopeAllowed } = require('../lib/rbac');
const { createApprovalRequest, decideApprovalRequest } = require('../lib/approvals');
const { registerLaptopSerial } = require('../lib/serials');

async function runRbacTests() {
  console.log('====================================================');
  console.log('RUNNING ENTERPRISE RBAC SYSTEM VALIDATION TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, failDetail = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${failDetail}`);
      failed++;
    }
  }

  try {
    // Load all 9 roles user context
    const [users] = await pool.query('SELECT id, email, role FROM admin_users');
    const userMap = {};
    for (const u of users) {
      const ctx = await getUserRbacContext(u.id);
      userMap[u.role] = ctx;
      if (ctx && ctx.role) userMap[ctx.role] = ctx;
    }

    const owner = userMap['owner'];
    const superAdmin = userMap['super_admin'];
    const managerArea = userMap['manajer_area'];
    const kepalaToko = userMap['kepala_toko'];
    const kasir = userMap['kasir'];
    const gudang = userMap['gudang'];
    const finance = userMap['finance'];
    const marketing = userMap['digital_marketing'];
    const audit = userMap['audit'];

    console.log('--- 1. OWNER ROLE TESTS ---');
    assert(hasPermission(owner, 'dashboard.view'), 'Owner can view dashboard');
    assert(hasPermission(owner, 'dashboard.financial'), 'Owner can view financial dashboard metrics');
    assert(hasPermission(owner, 'reports.finance'), 'Owner can view finance reports');
    assert(owner.defaultScope === 'ALL', 'Owner has scope ALL');
    assert(hasPermission(owner, 'products.delete'), 'Owner can manage and delete products');

    console.log('\n--- 2. SUPER ADMIN ROLE TESTS ---');
    assert(hasPermission(superAdmin, 'users.create'), 'Super Admin can create users');
    assert(hasPermission(superAdmin, 'users.update'), 'Super Admin can update users');
    assert(hasPermission(superAdmin, 'roles.create'), 'Super Admin can create custom roles');
    assert(hasPermission(superAdmin, 'settings.manage'), 'Super Admin can configure system settings');

    console.log('\n--- 3. MANAGER AREA ROLE TESTS ---');
    assert(managerArea.defaultScope === 'AREA', 'Manager Area has scope AREA');
    assert(hasPermission(managerArea, 'sales.view'), 'Manager Area can view sales');
    assert(hasPermission(managerArea, 'approval.approve'), 'Manager Area can approve requests');
    // Scope checks
    assert(
      isScopeAllowed(managerArea, 'sales.view', { storeId: 'store-pekalongan' }),
      'Manager Area can access store within assigned area (Pekalongan in Jateng)'
    );
    assert(
      !isScopeAllowed(managerArea, 'sales.view', { storeId: 'store-gejayan', areaId: 'area-diy' }),
      'Manager Area CANNOT access store outside assigned area (Gejayan in DIY)'
    );

    console.log('\n--- 4. KEPALA TOKO ROLE TESTS ---');
    assert(kepalaToko.defaultScope === 'STORE', 'Kepala Toko has scope STORE');
    assert(hasPermission(kepalaToko, 'sales.view'), 'Kepala Toko can view sales');
    assert(hasPermission(kepalaToko, 'approval.approve'), 'Kepala Toko can approve store requests');
    assert(!hasPermission(kepalaToko, 'roles.create'), 'Kepala Toko CANNOT create roles');
    assert(!hasPermission(kepalaToko, 'settings.manage'), 'Kepala Toko CANNOT manage system settings');
    // Scope checks
    assert(
      isScopeAllowed(kepalaToko, 'sales.view', { storeId: 'store-pekalongan' }),
      'Kepala Toko can access own assigned store (Pekalongan)'
    );
    assert(
      !isScopeAllowed(kepalaToko, 'sales.view', { storeId: 'store-semarang' }),
      'Kepala Toko CANNOT access other store (Semarang)'
    );

    console.log('\n--- 5. KASIR ROLE TESTS ---');
    assert(kasir.defaultScope === 'OWN', 'Kasir has scope OWN');
    assert(hasPermission(kasir, 'sales.create'), 'Kasir can perform POS sale creation');
    assert(hasPermission(kasir, 'approval.create'), 'Kasir can request discount approval');
    assert(!hasPermission(kasir, 'finance.view'), 'Kasir CANNOT view finance');
    assert(!hasPermission(kasir, 'products.update'), 'Kasir CANNOT update product prices');
    assert(!hasPermission(kasir, 'sales.cancel'), 'Kasir CANNOT cancel historical sales without approval');
    assert(!hasPermission(kasir, 'users.create'), 'Kasir CANNOT create users');

    console.log('\n--- 6. GUDANG ROLE TESTS ---');
    assert(hasPermission(gudang, 'stock.view'), 'Gudang can view stock');
    assert(hasPermission(gudang, 'stock.receive'), 'Gudang can receive stock');
    assert(hasPermission(gudang, 'stock.transfer'), 'Gudang can initiate stock transfer');
    assert(hasPermission(gudang, 'serials.manage'), 'Gudang can manage laptop serial numbers');
    assert(!hasPermission(gudang, 'finance.view'), 'Gudang CANNOT view financial data');
    assert(!hasPermission(gudang, 'finance.create'), 'Gudang CANNOT create financial expenses');

    console.log('\n--- 7. FINANCE ROLE TESTS ---');
    assert(hasPermission(finance, 'finance.view'), 'Finance can view finance');
    assert(hasPermission(finance, 'finance.create'), 'Finance can record expenses');
    assert(hasPermission(finance, 'finance.approve'), 'Finance can approve payments & refunds');
    assert(!hasPermission(finance, 'stock.receive'), 'Finance CANNOT receive inventory');
    assert(!hasPermission(finance, 'serials.manage'), 'Finance CANNOT manage laptop serial numbers');
    assert(!hasPermission(finance, 'products.update'), 'Finance CANNOT modify products');

    console.log('\n--- 8. DIGITAL MARKETING ROLE TESTS ---');
    assert(hasPermission(marketing, 'marketing.view'), 'Digital Marketing can view campaigns');
    assert(hasPermission(marketing, 'marketing.create'), 'Digital Marketing can create campaigns');
    assert(!hasPermission(marketing, 'finance.view'), 'Digital Marketing CANNOT view sensitive finance');
    assert(!hasPermission(marketing, 'users.create'), 'Digital Marketing CANNOT create users');

    console.log('\n--- 9. AUDIT ROLE (READ-ONLY) TESTS ---');
    assert(hasPermission(audit, 'audit.view'), 'Audit can view audit logs');
    assert(hasPermission(audit, 'reports.audit'), 'Audit can view audit reports');
    assert(hasPermission(audit, 'sales.view'), 'Audit can inspect sales');
    assert(!hasPermission(audit, 'sales.create'), 'Audit CANNOT create sales');
    assert(!hasPermission(audit, 'products.create'), 'Audit CANNOT create products');
    assert(!hasPermission(audit, 'products.update'), 'Audit CANNOT update products');
    assert(!hasPermission(audit, 'finance.create'), 'Audit CANNOT create financial transactions');

    console.log('\n--- 10. APPROVAL WORKFLOW & ANTI-PRIVILEGE ESCALATION TESTS ---');
    // Kasir creates approval request
    const discountReq = await createApprovalRequest({
      requestType: 'DISCOUNT',
      requesterUser: kasir,
      reason: 'Diskon mahasiswa 5%',
      referenceType: 'ORDER',
      referenceId: 'RL-TEST-01',
    });
    assert(discountReq && discountReq.status === 'PENDING', 'Kasir successfully submits discount approval request');

    // Self-approval prevention test
    let selfApproveBlocked = false;
    try {
      await decideApprovalRequest({
        requestId: discountReq.id,
        decision: 'APPROVE',
        actorUser: kasir, // Requester attempting to self-approve!
      });
    } catch (e) {
      selfApproveBlocked = true;
    }
    assert(selfApproveBlocked, 'Anti-Escalation: Kasir is BLOCKED from self-approving their own request');

    // Legitimate approval by Kepala Toko
    const approved = await decideApprovalRequest({
      requestId: discountReq.id,
      decision: 'APPROVE',
      actorUser: kepalaToko,
      notes: 'Disetujui untuk promo mahasiswa',
    });
    assert(approved.status === 'APPROVED', 'Kepala Toko successfully approves discount request');

    // Laptop Serial Lifecycle Registration test
    const testSn = `TEST-SN-${Date.now()}`;
    const registeredSerial = await registerLaptopSerial({
      productId: 'prod-1',
      serialNumber: testSn,
      actorUser: gudang,
    });
    assert(registeredSerial && registeredSerial.status === 'IN_STOCK', `Gudang successfully registered serial ${testSn}`);

    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runRbacTests();
