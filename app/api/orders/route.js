// app/api/orders/route.js
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { guardApi } from "@/lib/apiGuard";
import { recordAuditLog } from "@/lib/audit";
import { markLaptopSold } from "@/lib/serials";
import { generateDynamicQRIS } from "@/lib/qris";

// GET orders (Fetch directly from Supabase)
export async function GET(request) {
  const auth = await guardApi(request, 'sales.view', { module: 'SALES' });
  if (!auth.allowed) return auth.response;

  try {
    const { getOrders } = await import("@/lib/db");
    const orders = await getOrders();
    return NextResponse.json(orders || []);
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

// POST create order (Atomic Transaction: SALE -> STOCK DEDUCTION -> MOVEMENT -> SERIAL -> AUDIT)
export async function POST(request) {
  // Check if admin user with sales.create
  const auth = await guardApi(request, 'sales.create', { module: 'SALES' });
  const isAdmin = auth.allowed;

  let customerUser = null;
  if (!isAdmin) {
    try {
      const { getCustomerFromCookies } = await import("@/lib/auth");
      customerUser = await getCustomerFromCookies();
    } catch {}
  }

  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    const body = await request.json();
    const id = body.id || `RL-${Math.floor(1000 + Math.random() * 9000)}`;
    const effStoreId = body.storeId || (isAdmin ? auth.user.primaryStoreId : 'store-pekalongan') || 'store-pekalongan';
    const effAreaId = body.areaId || (isAdmin ? auth.user.primaryAreaId : 'area-jateng') || 'area-jateng';
    const cashierId = isAdmin ? auth.user.id : null;
    const total = Number(body.total) || 0;
    const discountAmount = Number(body.discountAmount) || 0;
    const serialNumbers = Array.isArray(body.serialNumbers) ? body.serialNumbers : [];

    const dateStr =
      body.date ||
      new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date()) + ' WIB';

    const paymentMethod = body.paymentMethod || body.payment_method || (isAdmin ? 'Tunai' : 'QRIS Dinamis');
    let paymentStatus = body.paymentStatus || body.payment_status || (isAdmin ? 'PAID' : 'PENDING');
    let paymentRef = body.paymentRef || body.payment_ref || `PAY-${id}`;
    let paidAt = (paymentStatus === 'PAID') ? new Date() : null;

    // Generate Dynamic QRIS if method is QRIS or customer payment
    let qrisPayload = null;
    if (paymentMethod.toLowerCase().includes('qris') || !isAdmin) {
      const qrisData = generateDynamicQRIS({
        orderId: id,
        amount: total,
        storeName: 'RajaLaptop Pekalongan',
        city: 'Pekalongan'
      });
      qrisPayload = qrisData.rawPayload;
    }

    // 1. Insert order
    await conn.query(
      `INSERT INTO orders 
      (id, customer, phone, email, product, total, payment_method, payment_status, payment_ref, qris_payload, paid_at, status, kurir, resi, date, store_id, area_id, cashier_id, discount_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.customer || 'Pelanggan',
        body.phone || '',
        body.email || (customerUser?.email || ''),
        body.product || 'Laptop',
        total,
        paymentMethod,
        paymentStatus,
        paymentRef,
        qrisPayload,
        paidAt,
        body.status || (isAdmin ? 'Selesai' : 'Menunggu Pembayaran'),
        body.kurir || (isAdmin ? 'POS Kasir Langsung' : 'Kurir Reguler'),
        body.resi || '-',
        dateStr,
        effStoreId,
        effAreaId,
        cashierId,
        discountAmount,
      ]
    );

    // 2. Decrement stock & record movement
    const itemsToProcess = Array.isArray(body.items) && body.items.length > 0
      ? body.items
      : (body.productId ? [{ productId: body.productId, qty: body.quantity || 1 }] : []);

    for (const it of itemsToProcess) {
      const pId = it.productId || it.id;
      const qty = Number(it.qty || it.quantity) || 1;
      if (!pId) continue;

      const [prodRows] = await conn.query('SELECT id, name, stock FROM products WHERE id = ? FOR UPDATE', [pId]);
      if (prodRows.length > 0) {
        const prod = prodRows[0];
        const newStock = Math.max(0, prod.stock - qty);
        await conn.query('UPDATE products SET stock = ?, sold = sold + ? WHERE id = ?', [newStock, qty, prod.id]);

        await conn.query(
          `INSERT INTO stock_movements (product_id, product_name, quantity_change, movement_type, reference_id, note)
           VALUES (?, ?, ?, 'sale', ?, ?)`,
          [prod.id, prod.name, -qty, id, `Penjualan #${id}${isAdmin ? ` oleh ${auth.user.name}` : ' via Web Kasir'}`]
        );
      }
    }

    // 3. Update laptop serial status if serial numbers provided
    if (isAdmin && serialNumbers.length > 0) {
      for (const sn of serialNumbers) {
        await markLaptopSold({
          serialNumber: sn,
          orderId: id,
          customerId: body.customerId || null,
          actorUser: auth.user,
        });
      }
    }

    // Commit Transaction
    await conn.commit();

    // 4. Record Audit Log if admin
    if (isAdmin) {
      await recordAuditLog({
        request,
        user: auth.user,
        action: 'CREATE_SALE',
        module: 'POS',
        resourceType: 'ORDER',
        resourceId: id,
        newValue: { id, customer: body.customer, total, storeId: effStoreId },
        storeId: effStoreId,
        status: 'SUCCESS',
        details: `Transaksi POS #${id} berhasil dibuat senilai Rp ${total.toLocaleString('id-ID')}`,
      });
    }

    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    return NextResponse.json({ success: true, order: rows[0] });
  } catch (error) {
    await conn.rollback();
    console.error("POST /api/orders atomic transaction error:", error);
    return NextResponse.json({ error: error.message || "Gagal memproses transaksi penjualan" }, { status: 500 });
  } finally {
    conn.release();
  }
}

// PUT update order
export async function PUT(request) {
  const auth = await guardApi(request, 'sales.update', { module: 'SALES' });
  if (!auth.allowed) return auth.response;

  try {
    const body = await request.json();
    const { id, status, kurir, resi, payment_status, payment_method } = body;
    if (!id) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const [existing] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    const old = existing[0];
    const paidAtUpdate = (payment_status === 'PAID' && old.payment_status !== 'PAID') ? new Date() : (old.paid_at || null);

    await pool.query(
      `UPDATE orders SET 
        status = COALESCE(?, status), 
        kurir = COALESCE(?, kurir), 
        resi = COALESCE(?, resi),
        payment_status = COALESCE(?, payment_status),
        payment_method = COALESCE(?, payment_method),
        paid_at = COALESCE(?, paid_at)
       WHERE id = ?`,
      [status, kurir, resi, payment_status, payment_method, paidAtUpdate, id]
    );

    await recordAuditLog({
      request,
      user: auth.user,
      action: 'UPDATE_ORDER_STATUS',
      module: 'SALES',
      resourceType: 'ORDER',
      resourceId: id,
      oldValue: { status: old.status, resi: old.resi, payment_status: old.payment_status },
      newValue: { status, resi, payment_status },
      storeId: old.store_id,
      status: 'SUCCESS',
      details: `Update pesanan #${id} status: ${status || old.status}, payment: ${payment_status || old.payment_status}`,
    });

    const [updated] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    return NextResponse.json({ success: true, order: updated[0] });
  } catch (error) {
    console.error("PUT /api/orders error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
