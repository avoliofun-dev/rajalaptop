// lib/serials.js
const { pool } = require('./db');
const { recordAuditLog } = require('./audit');

/**
 * Registers a new laptop serial number upon purchase/receipt.
 */
async function registerLaptopSerial({
  productId,
  serialNumber,
  imei = null,
  supplierId = null,
  purchaseOrderId = null,
  storeId = null,
  warrantyMonths = 24,
  actorUser,
  request = null,
}) {
  const id = `sn-${Date.now()}-${Math.floor(10 + Math.random() * 90)}`;
  const cleanSn = String(serialNumber || '').trim();
  const effStoreId = storeId || actorUser.primaryStoreId || 'warehouse-pusat';

  await pool.query(
    `INSERT INTO product_serials 
    (id, product_id, serial_number, imei, supplier_id, purchase_order_id, current_store_id, status, warranty_months)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'IN_STOCK', ?)`,
    [id, productId, cleanSn, imei || null, supplierId || null, purchaseOrderId || null, effStoreId, warrantyMonths]
  );

  // Record initial movement: SUPPLIER -> WAREHOUSE/STORE
  await pool.query(
    `INSERT INTO serial_movements 
    (serial_id, from_location_type, from_location_id, to_location_type, to_location_id, movement_type, reference_id, actor_id, notes)
    VALUES (?, 'SUPPLIER', ?, 'WAREHOUSE', ?, 'PURCHASE_RECEIPT', ?, ?, 'Penerimaan unit laptop baru dari distributor')`,
    [id, supplierId ? String(supplierId) : 'SUPPLIER', effStoreId, purchaseOrderId, actorUser.id]
  );

  await recordAuditLog({
    request,
    user: actorUser,
    action: 'REGISTER_LAPTOP_SERIAL',
    module: 'INVENTORY',
    resourceType: 'PRODUCT_SERIAL',
    resourceId: cleanSn,
    newValue: { productId, serialNumber: cleanSn, storeId: effStoreId },
    storeId: effStoreId,
    status: 'SUCCESS',
    details: `Registrasi serial number laptop ${cleanSn} di ${effStoreId}`,
  });

  const [created] = await pool.query('SELECT * FROM product_serials WHERE id = ?', [id]);
  return created[0];
}

/**
 * Transfers a laptop unit between warehouse and store.
 */
async function transferLaptopSerial({
  serialId,
  toStoreId,
  actorUser,
  notes = '',
  request = null,
}) {
  const [serials] = await pool.query('SELECT * FROM product_serials WHERE id = ? OR serial_number = ?', [serialId, serialId]);
  if (!serials || serials.length === 0) {
    throw new Error('Serial number laptop tidak ditemukan');
  }

  const serial = serials[0];
  const fromStoreId = serial.current_store_id;

  await pool.query(
    `UPDATE product_serials SET current_store_id = ?, status = 'IN_STOCK' WHERE id = ?`,
    [toStoreId, serial.id]
  );

  await pool.query(
    `INSERT INTO serial_movements 
    (serial_id, from_location_type, from_location_id, to_location_type, to_location_id, movement_type, reference_id, actor_id, notes)
    VALUES (?, 'STORE', ?, 'STORE', ?, 'INTERNAL_TRANSFER', NULL, ?, ?)`,
    [serial.id, fromStoreId, toStoreId, actorUser.id, notes || 'Mutasi internal antar cabang']
  );

  await recordAuditLog({
    request,
    user: actorUser,
    action: 'TRANSFER_LAPTOP_SERIAL',
    module: 'INVENTORY',
    resourceType: 'PRODUCT_SERIAL',
    resourceId: serial.serial_number,
    oldValue: { storeId: fromStoreId },
    newValue: { storeId: toStoreId, notes },
    storeId: toStoreId,
    status: 'SUCCESS',
    details: `Transfer laptop SN ${serial.serial_number} dari ${fromStoreId} ke ${toStoreId}`,
  });

  return { success: true, serialId: serial.id, fromStoreId, toStoreId };
}

/**
 * Marks a laptop serial number as sold during POS sale transaction.
 */
async function markLaptopSold({
  serialNumber,
  orderId,
  customerId = null,
  actorUser,
  warrantyMonths = 24,
}) {
  const [serials] = await pool.query(
    `SELECT * FROM product_serials WHERE serial_number = ? AND status = 'IN_STOCK'`,
    [serialNumber]
  );

  if (!serials || serials.length === 0) {
    throw new Error(`Serial number ${serialNumber} tidak tersedia atau sudah terjual`);
  }

  const serial = serials[0];
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + Number(warrantyMonths));

  await pool.query(
    `UPDATE product_serials 
     SET status = 'SOLD', sale_order_id = ?, customer_id = ?, warranty_expiry = ? 
     WHERE id = ?`,
    [orderId, customerId, expiryDate.toISOString().slice(0, 10), serial.id]
  );

  await pool.query(
    `INSERT INTO serial_movements 
    (serial_id, from_location_type, from_location_id, to_location_type, to_location_id, movement_type, reference_id, actor_id, notes)
    VALUES (?, 'STORE', ?, 'CUSTOMER', ?, 'SALE', ?, ?, 'Penjualan laptop ke pelanggan')`,
    [serial.id, serial.current_store_id, customerId || 'CUSTOMER', orderId, actorUser.id]
  );

  return true;
}

/**
 * Retrieves laptop serials with full movement history.
 */
async function getLaptopSerials(filters = {}, userContext) {
  let query = `
    SELECT ps.*, p.name as product_name, p.brand as product_brand, p.category as product_category,
           s.name as store_name
    FROM product_serials ps
    LEFT JOIN products p ON p.id = ps.product_id
    LEFT JOIN stores s ON s.id = ps.current_store_id
    WHERE 1=1
  `;
  const params = [];

  if (filters.status) {
    query += ` AND ps.status = ?`;
    params.push(filters.status);
  }
  if (filters.search) {
    query += ` AND (ps.serial_number LIKE ? OR ps.imei LIKE ? OR p.name LIKE ?)`;
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }

  if (userContext && !userContext.isOwner && !userContext.isSuperAdmin) {
    if (userContext.defaultScope === 'STORE') {
      query += ` AND ps.current_store_id IN (?)`;
      params.push(userContext.storeIds.length ? userContext.storeIds : ['__none__']);
    } else if (userContext.defaultScope === 'AREA') {
      const allowedStores = Array.from(new Set([...userContext.storeIds, ...userContext.areaStoreIds]));
      query += ` AND ps.current_store_id IN (?)`;
      params.push(allowedStores.length ? allowedStores : ['__none__']);
    }
  }

  query += ` ORDER BY ps.created_at DESC LIMIT 100`;
  const [rows] = await pool.query(query, params);
  return rows;
}

async function getSerialMovements(serialId) {
  const [rows] = await pool.query(
    `SELECT sm.*, u.name as actor_name 
     FROM serial_movements sm
     LEFT JOIN admin_users u ON u.id = sm.actor_id
     WHERE sm.serial_id = ?
     ORDER BY sm.created_at ASC`,
    [serialId]
  );
  return rows;
}

module.exports = {
  registerLaptopSerial,
  transferLaptopSerial,
  markLaptopSold,
  getLaptopSerials,
  getSerialMovements,
};
