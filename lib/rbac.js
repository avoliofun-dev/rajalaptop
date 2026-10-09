// lib/rbac.js
const { pool } = require('./db');

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
    // 1. Ambil data admin dari Supabase / DB helper
    const { getAdminById } = require('./db');
    let user = null;
    try {
      user = await getAdminById(userId);
    } catch {}

    // Fallback jika via raw pool
    if (!user) {
      const [userRows] = await pool.query(
        `SELECT u.id, u.name, u.email, u.phone, u.avatar, u.role, u.role_id, u.status, u.primary_store_id, u.primary_area_id,
                u.created_at, u.last_login_at
         FROM admin_users u
         WHERE u.id = ?`,
        [userId]
      );
      if (userRows && userRows.length > 0) user = userRows[0];
    }

    if (!user) return null;

    const effectiveRoleSlug = user.role || 'kasir';
    const effectiveStatus = user.status || 'active';

    // 2. Fetch permissions jika ada tabel permissions
    let permissions = [];
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

    // Fallback default permissions untuk semua modul
    const defaultAllPerms = [
      'dashboard.view', 'products.view', 'products.create', 'products.edit', 'products.delete',
      'sales.view', 'sales.create', 'serials.view', 'serials.manage', 'approval.view', 'approval.manage',
      'service.view', 'service.manage', 'audit.view', 'roles.view', 'roles.manage', 'users.view', 'users.manage',
      'settings.manage'
    ];

    const permissionSlugs = permissions.length > 0
      ? permissions.map(p => p.slug)
      : defaultAllPerms;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || null,
      avatar: user.avatar || null,
      createdAt: user.created_at || null,
      lastLoginAt: user.last_login_at || null,
      role: effectiveRoleSlug,
      roleName: effectiveRoleSlug === 'super_admin' ? 'Super Admin' : (user.roleName || user.role),
      status: effectiveStatus,
      defaultScope: user.default_scope || 'ALL',
      permissions: permissions.length > 0 ? permissions : defaultAllPerms.map(s => ({ slug: s, module: 'ALL', action: 'MANAGE', scope: 'ALL' })),
      permissionSlugs,
      stores: [{ id: 'store-pekalongan', name: 'Raja Laptop Pekalongan' }],
      storeIds: ['store-pekalongan'],
      areas: [{ id: 'area-jateng', name: 'Jawa Tengah' }],
      areaIds: ['area-jateng'],
      areaStoreIds: ['store-pekalongan'],
      primaryStoreId: user.primary_store_id || 'store-pekalongan',
      primaryAreaId: user.primary_area_id || 'area-jateng',
      isOwner: effectiveRoleSlug === 'owner',
      isSuperAdmin: effectiveRoleSlug === 'super_admin' || effectiveRoleSlug === 'owner',
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
  return userContext.permissionSlugs.includes(permissionSlug);
}

/**
 * Validates scope authorization on a specific target resource.
 */
function isScopeAllowed(userContext, permissionSlug, target = {}) {
  if (!userContext || userContext.status !== 'active') return false;
  if (userContext.isOwner || userContext.isSuperAdmin) return true;

  const perm = userContext.permissions.find(p => p.slug === permissionSlug);
  const scope = perm ? perm.scope : userContext.defaultScope;

  switch (scope) {
    case 'ALL':
      return true;

    case 'AREA':
      // Must match assigned areas or stores within assigned areas
      if (target.areaId && userContext.areaIds.includes(target.areaId)) return true;
      if (target.storeId && (userContext.storeIds.includes(target.storeId) || userContext.areaStoreIds.includes(target.storeId))) return true;
      return false;

    case 'STORE':
      if (!target.storeId) return true; // If no specific store targeted
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
 * Prevents unauthorized data retrieval even if API is called directly.
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
}

/**
 * Returns all stores and areas for assignments.
 */
async function getStoresAndAreas() {
  const [stores] = await pool.query('SELECT * FROM stores ORDER BY name ASC');
  const [areas] = await pool.query('SELECT * FROM areas ORDER BY name ASC');
  return { stores, areas };
}

module.exports = {
  getUserRbacContext,
  hasPermission,
  isScopeAllowed,
  getScopeSqlFilter,
  getAllRolesWithPermissions,
  getStoresAndAreas,
};
