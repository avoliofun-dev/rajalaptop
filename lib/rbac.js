// lib/rbac.js
const { supabaseAdmin, isSupabaseConfigured } = require('./supabase');
const { pool } = require('./db');

// Default fallback permissions strictly per role if database query fails
const ROLE_DEFAULT_PERMISSIONS = {
  super_admin: [
    'dashboard.view', 'dashboard.financial', 'products.view', 'products.create', 'products.update', 'products.delete',
    'sales.view', 'sales.create', 'sales.update', 'sales.cancel', 'sales.discount', 'sales.refund',
    'stock.view', 'stock.receive', 'stock.transfer', 'stock.adjust', 'stock.opname',
    'serials.view', 'serials.manage', 'purchase.view', 'purchase.create', 'purchase.approve',
    'finance.view', 'finance.create', 'finance.approve', 'finance.export',
    'service.view', 'service.manage', 'users.view', 'users.create', 'users.update', 'users.disable',
    'roles.view', 'roles.create', 'roles.update', 'roles.delete', 'stores.manage',
    'marketing.view', 'marketing.create', 'marketing.update', 'marketing.publish',
    'reports.sales', 'reports.stock', 'reports.finance', 'reports.audit',
    'audit.view', 'audit.export', 'approval.view', 'approval.create', 'approval.approve', 'approval.reject',
    'settings.manage'
  ],
  owner: [
    'dashboard.view', 'dashboard.financial', 'products.view', 'sales.view',
    'stock.view', 'serials.view', 'purchase.view', 'finance.view',
    'service.view', 'users.view', 'roles.view', 'marketing.view',
    'reports.sales', 'reports.stock', 'reports.finance', 'reports.audit',
    'audit.view', 'audit.export', 'approval.view', 'approval.approve', 'approval.reject'
  ],
  manajer_area: [
    'dashboard.view', 'dashboard.financial', 'products.view', 'sales.view', 'sales.discount',
    'stock.view', 'stock.transfer', 'stock.adjust', 'stock.opname', 'serials.view',
    'purchase.view', 'service.view', 'users.view', 'reports.sales', 'reports.stock',
    'approval.view', 'approval.approve', 'approval.reject'
  ],
  kepala_toko: [
    'dashboard.view', 'products.view', 'sales.view', 'sales.create', 'sales.update',
    'sales.discount', 'sales.refund', 'stock.view', 'stock.transfer', 'stock.adjust',
    'stock.opname', 'serials.view', 'service.view', 'service.manage', 'users.view',
    'reports.sales', 'reports.stock', 'approval.view', 'approval.create', 'approval.approve', 'approval.reject'
  ],
  kasir: [
    'dashboard.view', 'products.view', 'sales.view', 'sales.create',
    'sales.discount', 'serials.view', 'approval.view', 'approval.create'
  ],
  gudang: [
    'dashboard.view', 'products.view', 'stock.view', 'stock.receive',
    'stock.transfer', 'stock.adjust', 'stock.opname', 'serials.view',
    'serials.manage', 'reports.stock', 'approval.view', 'approval.create'
  ],
  finance: [
    'dashboard.view', 'dashboard.financial', 'sales.view', 'sales.refund',
    'purchase.view', 'finance.view', 'finance.create', 'finance.approve',
    'finance.export', 'reports.sales', 'reports.finance', 'approval.view',
    'approval.approve', 'approval.reject'
  ],
  digital_marketing: [
    'dashboard.view', 'products.view', 'marketing.view', 'marketing.create',
    'marketing.update', 'marketing.publish', 'reports.sales'
  ],
  audit: [
    'dashboard.view', 'dashboard.financial', 'products.view', 'sales.view',
    'stock.view', 'serials.view', 'purchase.view', 'finance.view',
    'service.view', 'users.view', 'roles.view', 'reports.sales',
    'reports.stock', 'reports.finance', 'reports.audit', 'audit.view',
    'audit.export', 'approval.view'
  ]
};

/**
 * Loads complete user RBAC context:
 * - Admin user profile
 * - Role details & default scope
 * - Assigned permissions list with scopes
 * - Assigned store IDs and area IDs
 */
async function getUserRbacContext(userId) {
  if (!userId) return null;

  try {
    let user = null;

    // 1. Ambil data admin dari Supabase
    if (isSupabaseConfigured()) {
      const { data, error } = await supabaseAdmin
        .from('admin_users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        user = data;
      }
    }

    // Fallback jika belum dari Supabase (misal via pool MySQL)
    if (!user) {
      try {
        const [userRows] = await pool.query(
          `SELECT u.id, u.name, u.email, u.phone, u.avatar, u.role, u.role_id, u.status, u.primary_store_id, u.primary_area_id,
                  u.created_at, u.last_login_at
           FROM admin_users u
           WHERE u.id = ?`,
          [userId]
        );
        if (userRows && userRows.length > 0) user = userRows[0];
      } catch {}
    }

    if (!user) return null;

    const effectiveRoleSlug = user.role || 'kasir';
    const effectiveStatus = user.status || 'active';

    // 2. Fetch permissions dari Supabase
    let permissions = [];
    let defaultScope = 'STORE';
    let roleName = effectiveRoleSlug;

    if (isSupabaseConfigured()) {
      try {
        // Cari role di Supabase
        const { data: roleData } = await supabaseAdmin
          .from('roles')
          .select('id, slug, name, default_scope')
          .or(`slug.eq.${effectiveRoleSlug},id.eq.${user.role_id || 'none'}`)
          .maybeSingle();

        if (roleData) {
          defaultScope = roleData.default_scope || defaultScope;
          roleName = roleData.name || roleName;

          // Ambil permissions yang terhubung via role_permissions
          const { data: rolePerms } = await supabaseAdmin
            .from('role_permissions')
            .select(`
              scope,
              permissions (
                id,
                slug,
                module,
                action,
                description
              )
            `)
            .eq('role_id', roleData.id);

          if (rolePerms && rolePerms.length > 0) {
            permissions = rolePerms
              .filter(rp => rp.permissions)
              .map(rp => ({
                slug: rp.permissions.slug,
                module: rp.permissions.module,
                action: rp.permissions.action,
                scope: rp.scope || defaultScope
              }));
          }
        }
      } catch (err) {
        console.warn('Gagal query RBAC dari Supabase:', err.message);
      }
    }

    // Fallback query MySQL jika Supabase tidak mengembalikan permissions
    if (permissions.length === 0) {
      try {
        const [permRows] = await pool.query(
          `SELECT p.slug, p.module, p.action, rp.scope
           FROM permissions p
           INNER JOIN role_permissions rp ON rp.permission_id = p.id
           INNER JOIN roles r ON r.id = rp.role_id
           WHERE r.slug = ? OR r.id = ?`,
          [effectiveRoleSlug, user.role_id || '']
        );
        if (permRows && permRows.length > 0) {
          permissions = permRows.map(p => ({
            slug: p.slug,
            module: p.module,
            action: p.action,
            scope: p.scope || 'ALL'
          }));
        }
      } catch {}
    }

    // JIKA PERMISSION MASIH KOSONG, GUNAKAN FALLBACK KHUSUS PER ROLE (BUKAN SEMUA AKSES!)
    const fallbackPerms = ROLE_DEFAULT_PERMISSIONS[effectiveRoleSlug] || ROLE_DEFAULT_PERMISSIONS.kasir;
    const permissionSlugs = permissions.length > 0
      ? permissions.map(p => p.slug)
      : fallbackPerms;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || null,
      avatar: user.avatar || null,
      createdAt: user.created_at || null,
      lastLoginAt: user.last_login_at || null,
      role: effectiveRoleSlug,
      roleName: effectiveRoleSlug === 'super_admin' ? 'Super Admin' : (roleName || user.role),
      status: effectiveStatus,
      defaultScope: user.default_scope || defaultScope,
      permissions: permissions.length > 0
        ? permissions
        : fallbackPerms.map(s => ({ slug: s, module: 'AUTO', action: 'ALLOW', scope: defaultScope })),
      permissionSlugs,
      stores: [{ id: 'store-pekalongan', name: 'Raja Laptop Pekalongan' }],
      storeIds: ['store-pekalongan'],
      areas: [{ id: 'area-jateng', name: 'Jawa Tengah' }],
      areaIds: ['area-jateng'],
      areaStoreIds: ['store-pekalongan'],
      primaryStoreId: user.primary_store_id || 'store-pekalongan',
      primaryAreaId: user.primary_area_id || 'area-jateng',
      isOwner: effectiveRoleSlug === 'owner',
      isSuperAdmin: effectiveRoleSlug === 'super_admin',
    };
  } catch (error) {
    console.error('getUserRbacContext error:', error.message);
    return null;
  }
}

/**
 * Validates whether user context possesses the given permission.
 */
function hasPermission(userContext, permissionSlug) {
  if (!userContext || userContext.status !== 'active') return false;
  // Super admin and Owner have all permissions
  if (userContext.isSuperAdmin || userContext.isOwner) return true;
  return Array.isArray(userContext.permissionSlugs) && userContext.permissionSlugs.includes(permissionSlug);
}

/**
 * Validates scope authorization on a specific target resource.
 */
function isScopeAllowed(userContext, permissionSlug, target = {}) {
  if (!userContext || userContext.status !== 'active') return false;
  if (userContext.isOwner || userContext.isSuperAdmin) return true;

  const perm = (userContext.permissions || []).find(p => p.slug === permissionSlug);
  const scope = perm ? perm.scope : userContext.defaultScope;

  switch (scope) {
    case 'ALL':
      return true;

    case 'AREA':
      if (target.areaId && userContext.areaIds.includes(target.areaId)) return true;
      if (target.storeId && (userContext.storeIds.includes(target.storeId) || userContext.areaStoreIds.includes(target.storeId))) return true;
      return false;

    case 'STORE':
      if (!target.storeId) return true;
      return userContext.storeIds.includes(target.storeId);

    case 'OWN':
      if (target.userId) return target.userId === userContext.id;
      if (target.cashierId) return target.cashierId === userContext.id;
      return true;

    default:
      return false;
  }
}

/**
 * Generates SQL WHERE clause filter based on user's authorized scope.
 */
function getScopeSqlFilter(userContext, tableAlias = '') {
  if (!userContext || userContext.isOwner || userContext.isSuperAdmin) {
    return { sql: '1=1', params: [] };
  }

  const prefix = tableAlias ? `${tableAlias}.` : '';

  switch (userContext.defaultScope) {
    case 'ALL':
      return { sql: '1=1', params: [] };

    case 'AREA': {
      const allowedStores = Array.from(new Set([...userContext.storeIds, ...userContext.areaStoreIds]));
      if (allowedStores.length === 0) return { sql: '1=0', params: [] };
      return {
        sql: `${prefix}store_id IN (?)`,
        params: [allowedStores]
      };
    }

    case 'STORE': {
      if (userContext.storeIds.length === 0) return { sql: '1=0', params: [] };
      return {
        sql: `${prefix}store_id IN (?)`,
        params: [userContext.storeIds]
      };
    }

    case 'OWN': {
      return {
        sql: `(${prefix}cashier_id = ? OR ${prefix}store_id IN (?))`,
        params: [userContext.id, userContext.storeIds.length ? userContext.storeIds : ['__none__']]
      };
    }

    default:
      return { sql: '1=1', params: [] };
  }
}

/**
 * Returns all system roles with assigned permissions for management.
 */
async function getAllRolesWithPermissions() {
  if (isSupabaseConfigured()) {
    try {
      const { data: roles } = await supabaseAdmin.from('roles').select('*').order('id', { ascending: true });
      const { data: rolePerms } = await supabaseAdmin.from('role_permissions').select(`
        role_id,
        scope,
        permissions (
          slug,
          module,
          action,
          description
        )
      `);

      if (roles) {
        return roles.map(r => ({
          ...r,
          permissions: (rolePerms || [])
            .filter(rp => rp.role_id === r.id && rp.permissions)
            .map(rp => ({
              slug: rp.permissions.slug,
              scope: rp.scope,
              module: rp.permissions.module,
              action: rp.permissions.action,
              description: rp.permissions.description
            }))
        }));
      }
    } catch (e) {
      console.warn('getAllRolesWithPermissions Supabase error:', e.message);
    }
  }

  // Fallback MySQL
  try {
    const [roles] = await pool.query('SELECT * FROM roles ORDER BY id ASC');
    const [rolePerms] = await pool.query(`
      SELECT rp.role_id, rp.scope, p.slug as permission_slug, p.module, p.action, p.description
      FROM role_permissions rp
      INNER JOIN permissions p ON p.id = rp.permission_id
    `);

    return roles.map(r => ({
      ...r,
      permissions: rolePerms.filter(rp => rp.role_id === r.id).map(rp => ({
        slug: rp.permission_slug,
        scope: rp.scope,
        module: rp.module,
        action: rp.action,
        description: rp.description
      }))
    }));
  } catch {
    return [];
  }
}

/**
 * Returns all stores and areas for assignments.
 */
async function getStoresAndAreas() {
  if (isSupabaseConfigured()) {
    try {
      const { data: stores } = await supabaseAdmin.from('stores').select('*').order('name', { ascending: true });
      const { data: areas } = await supabaseAdmin.from('areas').select('*').order('name', { ascending: true });
      return { stores: stores || [], areas: areas || [] };
    } catch (e) {}
  }

  try {
    const [stores] = await pool.query('SELECT * FROM stores ORDER BY name ASC');
    const [areas] = await pool.query('SELECT * FROM areas ORDER BY name ASC');
    return { stores, areas };
  } catch {
    return { stores: [], areas: [] };
  }
}

module.exports = {
  getUserRbacContext,
  hasPermission,
  isScopeAllowed,
  getScopeSqlFilter,
  getAllRolesWithPermissions,
  getStoresAndAreas,
  ROLE_DEFAULT_PERMISSIONS,
};
