// lib/audit.js
const { pool } = require('./db');

/**
 * Extracts client IP and User Agent from request headers.
 */
function extractClientInfo(request) {
  let ip = '127.0.0.1';
  let userAgent = 'unknown';

  if (request) {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      ip = forwarded.split(',')[0].trim();
    } else {
      ip = request.headers.get('x-real-ip') || '127.0.0.1';
    }
    userAgent = request.headers.get('user-agent') || 'unknown';
  }

  return { ip, userAgent };
}

/**
 * Inserts an immutable audit log record into MySQL audit_logs.
 * No UPDATE or DELETE operations exist for audit logs.
 */
async function recordAuditLog({
  request = null,
  user = null,
  action,
  module,
  resourceType = null,
  resourceId = null,
  oldValue = null,
  newValue = null,
  storeId = null,
  areaId = null,
  status = 'SUCCESS',
  reason = null,
  details = null,
}) {
  try {
    const { ip, userAgent } = extractClientInfo(request);

    const userId = user?.id || 'system';
    const userEmail = user?.email || 'system@rajalaptop.com';
    const userName = user?.name || 'System';
    const role = user?.role || 'system';
    const effStoreId = storeId || user?.primaryStoreId || null;
    const effAreaId = areaId || user?.primaryAreaId || null;

    const oldValStr = oldValue ? (typeof oldValue === 'string' ? oldValue : JSON.stringify(oldValue)) : null;
    const newValStr = newValue ? (typeof newValue === 'string' ? newValue : JSON.stringify(newValue)) : null;
    const detailsStr = details || `${action} on ${module || 'SYSTEM'} ${resourceId ? `(${resourceId})` : ''} - status: ${status}`;

    await pool.query(
      `INSERT INTO audit_logs 
      (user_id, user_email, user_name, role, action, module, resource_type, resource_id, old_value, new_value, store_id, area_id, ip_address, user_agent, status, reason, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        userEmail,
        userName,
        role,
        action,
        module,
        resourceType,
        resourceId ? String(resourceId) : null,
        oldValStr,
        newValStr,
        effStoreId,
        effAreaId,
        ip,
        userAgent.substring(0, 255),
        status,
        reason,
        detailsStr
      ]
    );

    return true;
  } catch (error) {
    console.error('CRITICAL: Failed to write audit log:', error.message);
    return false;
  }
}

/**
 * Filtered query for Audit Role & Super Admin view.
 */
async function getAuditLogs(filters = {}) {
  let query = `
    SELECT id, user_id, user_email, user_name, role, action, module, 
           resource_type, resource_id, old_value, new_value, store_id, area_id, 
           ip_address, user_agent, status, reason, details, created_at
    FROM audit_logs
    WHERE 1=1
  `;
  const params = [];

  if (filters.user_id) {
    query += ` AND user_id = ?`;
    params.push(filters.user_id);
  }
  if (filters.role) {
    query += ` AND role = ?`;
    params.push(filters.role);
  }
  if (filters.module) {
    query += ` AND module = ?`;
    params.push(filters.module);
  }
  if (filters.action) {
    query += ` AND action = ?`;
    params.push(filters.action);
  }
  if (filters.store_id) {
    query += ` AND store_id = ?`;
    params.push(filters.store_id);
  }
  if (filters.area_id) {
    query += ` AND area_id = ?`;
    params.push(filters.area_id);
  }
  if (filters.status) {
    query += ` AND status = ?`;
    params.push(filters.status);
  }
  if (filters.startDate) {
    query += ` AND created_at >= ?`;
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    query += ` AND created_at <= ?`;
    params.push(filters.endDate);
  }

  query += ` ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`;
  const limit = Math.min(Number(filters.limit) || 100, 500);
  const offset = Number(filters.offset) || 0;
  params.push(limit, offset);

  const [rows] = await pool.query(query, params);
  const [[countRes]] = await pool.query('SELECT COUNT(*) as total FROM audit_logs');

  return {
    total: countRes.total,
    logs: rows,
  };
}

module.exports = {
  recordAuditLog,
  getAuditLogs,
};
