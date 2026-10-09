// app/api/payment/simulate/route.js
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCustomerFromCookies } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, method, action } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID wajib diisi' }, { status: 400 });
    }

    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    const order = rows[0];

    // Optional: verification of customer session or public simulation for customer order
    const session = await getCustomerFromCookies();

    if (action === 'cancel') {
      await pool.query(
        "UPDATE orders SET payment_status = 'CANCELLED', status = 'Dibatalkan' WHERE id = ?",
        [orderId]
      );
      return NextResponse.json({
        success: true,
        message: `Pesanan #${orderId} telah dibatalkan.`,
        order: { ...order, payment_status: 'CANCELLED', status: 'Dibatalkan' }
      });
    }

    // Default action: pay / simulate payment success
    const paymentRef = `GATEWAY-PAY-${Date.now().toString().slice(-8)}`;
    const now = new Date();

    await pool.query(
      `UPDATE orders SET 
        payment_status = 'PAID', 
        payment_method = COALESCE(?, payment_method, 'QRIS Dinamis'),
        payment_ref = ?,
        paid_at = ?,
        status = 'Diproses'
       WHERE id = ?`,
      [method || order.payment_method || 'QRIS Dinamis', paymentRef, now, orderId]
    );

    const [updatedRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    const updatedOrder = updatedRows[0];

    return NextResponse.json({
      success: true,
      message: `Pembayaran pesanan #${orderId} berhasil dikonfirmasi secara real-time!`,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Payment simulation error:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses simulasi pembayaran' }, { status: 500 });
  }
}
