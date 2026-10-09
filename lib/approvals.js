// lib/approvals.js
const { pool } = require('./db');
const { recordAuditLog } = require('./audit');

/**
 * Creates an approval request.
 */
async function createApprovalRequest({
  requestType,
  requesterUser,
  storeId = null,
  areaId = null,
  referenceType = null,
  referenceId = null,
  oldValue = null,
  newValue = null,
  reason,
  notes = null,
  request = null,
}) {
  const id = `APPR-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const effStoreId = storeId || requesterUser.primaryStoreId || null;
  const effAreaId = areaId || requesterUser.primaryAreaId || null;

  const oldStr = oldValue ? (typeof oldValue === 'string' ? oldValue : JSON.stringify(oldValue)) : null;
  const newStr = newValue ? (typeof newValue === 'string' ? newValue : JSON.stringify(newValue)) : null;

  await pool.query(
    `INSERT INTO approval_requests
    (id, request_type, requester_id, store_id, area_id, status, reference_type, reference_id, old_value, new_value, reason, notes)
    VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, ?, ?)`,
    [
      id,
      requestType,
      requesterUser.id,
      effStoreId,
      effAreaId,
      referenceType,
      referenceId,
      oldStr,
      newStr,
      reason,
      notes
    ]
  );

  // Record action
  await pool.query(
    `INSERT INTO approval_actions (request_id, actor_id, action, notes) VALUES (?, ?, 'SUBMIT', ?)`,
    [id, requesterUser.id, reason]
  );

  // Record audit log
  await recordAuditLog({
    request,
    user: requesterUser,
    action: `SUBMIT_APPROVAL_${requestType}`,
    module: 'APPROVAL',
    resourceType: 'APPROVAL_REQUEST',
    resourceId: id,
    newValue: { requestType, reason, referenceId, storeId: effStoreId },
    storeId: effStoreId,
    areaId: effAreaId,
    status: 'SUCCESS',
    details: `Pengajuan approval ${requestType} (#${id}) untuk ref ${referenceId || '-'}`,
  });

  const [created] = await pool.query('SELECT * FROM approval_requests WHERE id = ?', [id]);
  return created[0];
}

/**
 * Decides (Approve / Reject / Cancel) an approval request.
 */
async function decideApprovalRequest({
  requestId,
  decision, // 'APPROVE' | 'REJECT' | 'CANCEL'
  actorUser,
  notes = '',
  request = null,
}) {
  const [rows] = await pool.query('SELECT * FROM approval_requests WHERE id = ?', [requestId]);
  if (!rows || rows.length === 0) {
    throw new Error('Permohonan approval tidak ditemukan');
  }

  const approval = rows[0];
  if (approval.status !== 'PENDING') {
    throw new Error(`Permohonan sudah berstatus ${approval.status}`);
  }

  // Cancel can only be done by requester or super admin
  if (decision === 'CANCEL') {
    if (approval.requester_id !== actorUser.id && !actorUser.isSuperAdmin) {
      throw new Error('Hanya pemohon atau Super Admin yang dapat membatalkan pengajuan ini');
    }
  } else {
    // Prevent self-approval (Privilege Escalation protection)
    if (approval.requester_id === actorUser.id && !actorUser.isSuperAdmin) {
      throw new Error('Tidak diperbolehkan menyetujui (self-approve) permohonan yang diajukan sendiri');
    }
  }

  const nextStatus = decision === 'APPROVE' ? 'APPROVED' : (decision === 'REJECT' ? 'REJECTED' : 'CANCELLED');

  await pool.query(
    `UPDATE approval_requests 
     SET status = ?, approved_by = ?, approved_at = NOW(), notes = ?
     WHERE id = ?`,
    [nextStatus, actorUser.id, notes || null, requestId]
  );

  await pool.query(
    `INSERT INTO approval_actions (request_id, actor_id, action, notes) VALUES (?, ?, ?, ?)`,
    [requestId, actorUser.id, decision, notes]
  );

  // If APPROVED, execute corresponding business side-effects if applicable
  if (decision === 'APPROVE') {
    await applyApprovalEffect(approval);
  }

  // Record audit log
  await recordAuditLog({
    request,
    user: actorUser,
    action: `${decision}_APPROVAL_${approval.request_type}`,
    module: 'APPROVAL',
    resourceType: 'APPROVAL_REQUEST',
    resourceId: requestId,
    oldValue: { status: 'PENDING' },
    newValue: { status: nextStatus, approvedBy: actorUser.name, notes },
    storeId: approval.store_id,
    areaId: approval.area_id,
    status: 'SUCCESS',
    details: `${decision} approval ${approval.request_type} (${requestId}) oleh ${actorUser.name}`,
  });

  const [updated] = await pool.query('SELECT * FROM approval_requests WHERE id = ?', [requestId]);
  return updated[0];
}

/**
 * Applies automated side effects when an approval request is approved.
 */
async function applyApprovalEffect(approval) {
  try {
    if (approval.request_type === 'DISCOUNT' && approval.reference_id) {
      // Mark discount as approved on the order
      await pool.query(
        `UPDATE orders SET discount_approved_by = ? WHERE id = ?`,
        [approval.approved_by || 'system', approval.reference_id]
      );
    } else if (approval.request_type === 'REFUND' && approval.reference_id) {
      await pool.query(
        `UPDATE orders SET refund_status = 'APPROVED', refund_approved_by = ? WHERE id = ?`,
        [approval.approved_by || 'system', approval.reference_id]
      );
    } else if (approval.request_type === 'STOCK_ADJUSTMENT' && approval.reference_id) {
      // If new_value has stock adjustment details
      const parsed = typeof approval.new_value === 'string' ? JSON.parse(approval.new_value) : approval.new_value;
      if (parsed && parsed.stock !== undefined) {
        await pool.query('UPDATE products SET stock = ? WHERE id = ?', [parsed.stock, approval.reference_id]);
      }
    }
  } catch (err) {
    console.error('applyApprovalEffect error:', err.message);
  }
}

/**
 * Retrieves approval requests filtered by status, store, type, or user scope.
 */
async function getApprovalRequests(filters = {}, userContext) {
  let query = `
    SELECT ar.*, 
           u.name as requester_name, u.email as requester_email, u.role as requester_role,
           approver.name as approver_name,
           s.name as store_name
    FROM approval_requests ar
    LEFT JOIN admin_users u ON u.id = ar.requester_id
    LEFT JOIN admin_users approver ON approver.id = ar.approved_by
    LEFT JOIN stores s ON s.id = ar.store_id
    WHERE 1=1
  `;
  const params = [];

  if (filters.status) {
    query += ` AND ar.status = ?`;
    params.push(filters.status);
  }
  if (filters.request_type) {
    query += ` AND ar.request_type = ?`;
    params.push(filters.request_type);
  }

  // Scope enforcement for approvals
  if (userContext && !userContext.isOwner && !userContext.isSuperAdmin) {
    if (userContext.defaultScope === 'STORE') {
      query += ` AND ar.store_id IN (?)`;
      params.push(userContext.storeIds.length ? userContext.storeIds : ['__none__']);
    } else if (userContext.defaultScope === 'AREA') {
      const allowedStores = Array.from(new Set([...userContext.storeIds, ...userContext.areaStoreIds]));
      query += ` AND (ar.area_id IN (?) OR ar.store_id IN (?))`;
      params.push(
        userContext.areaIds.length ? userContext.areaIds : ['__none__'],
        allowedStores.length ? allowedStores : ['__none__']
      );
    } else if (userContext.defaultScope === 'OWN') {
      query += ` AND ar.requester_id = ?`;
      params.push(userContext.id);
    }
  }

  query += ` ORDER BY ar.created_at DESC LIMIT 100`;
  const [rows] = await pool.query(query, params);
  return rows;
}

module.exports = {
  createApprovalRequest,
  decideApprovalRequest,
  getApprovalRequests,
};
