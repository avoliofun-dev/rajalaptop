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
    // 1. Fetch user & role
    const [userRows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.avatar, u.role, u.role_id, u.status, u.primary_store_id, u.primary_area_id,
              u.created_at, u.last_login_at,
              r.slug as role_slug, r.name as role_name, r.default_scope
       FROM admin_users u
       LEFT JOIN roles r ON r.id = u.role_id OR r.slug = u.role
       WHERE u.id = ?`,
      [userId]
    );

    if (!userRows || userRows.length === 0) return null;
    const user = userRows[0];

    // If role wasn't mapped by role_id, fallback to slug
    const effectiveRoleSlug = user.role_slug || user.role || 'kasir';

    // 2. Fetch permissions for this role
    const [permRows] = await pool.query(
      `SELECT p.slug, p.module, p.action, rp.scope
       FROM permissions p
       INNER JOIN role_permissions rp ON rp.permission_id = p.id
       INNER JOIN roles r ON r.id = rp.role_id
       WHERE r.slug = ? OR r.id = ?`,
      [effectiveRoleSlug, user.role_id || '']
    );

    const permissions = permRows.map(p => ({
      slug: p.slug,
      module: p.module,
      action: p.action,
      scope: p.scope || user.default_scope || 'STORE'
    }));

    const permissionSlugs = new Set(permissions.map(p => p.slug));

    // 3. Fetch assigned stores
    const [storeRows] = await pool.query(
      `SELECT s.id, s.code, s.name, s.area_id
       FROM user_stores us
       INNER JOIN stores s ON s.id = us.store_id
       WHERE us.user_id = ? AND s.is_active = 1`,
      [userId]
    );

    let assignedStores = storeRows;
    // Fallback if not populated yet
    if (assignedStores.length === 0 && user.primary_store_id) {
      const [defStore] = await pool.query('SELECT id, code, name, area_id FROM stores WHERE id = ?', [user.primary_store_id]);
      if (defStore[0]) assignedStores = defStore;
    }

    const storeIds = assignedStores.map(s => s.id);

    // 4. Fetch assigned areas
    const [areaRows] = await pool.query(
      `SELECT a.id, a.code, a.name
       FROM user_areas ua
       INNER JOIN areas a ON a.id = ua.area_id
       WHERE ua.user_id = ?`,
      [userId]
    );

    let assignedAreas = areaRows;
    if (assignedAreas.length === 0 && user.primary_area_id) {
      const [defArea] = await pool.query('SELECT id, code, name FROM areas WHERE id = ?', [user.primary_area_id]);
      if (defArea[0]) assignedAreas = defArea;
    }

    const areaIds = assignedAreas.map(a => a.id);

    // Also collect store IDs belonging to assigned areas
    let areaStoreIds = [];
    if (areaIds.length > 0) {
      const [storesInArea] = await pool.query('SELECT id FROM stores WHERE area_id IN (?)', [areaIds]);
      areaStoreIds = storesInArea.map(s => s.id);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || null,
      avatar: user.avatar || null,
      createdAt: user.created_at || null,
      lastLoginAt: user.last_login_at || null,
      role: effectiveRoleSlug,
      roleName: user.role_name || user.role,
      status: user.status,
      defaultScope: user.default_scope || 'STORE',
      permissions,
      permissionSlugs: Array.from(permissionSlugs),
      stores: assignedStores,
      storeIds,
      areas: assignedAreas,
      areaIds,
      areaStoreIds,
      primaryStoreId: user.primary_store_id || storeIds[0] || 'store-pekalongan',
      primaryAreaId: user.primary_area_id || areaIds[0] || 'area-jateng',
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
