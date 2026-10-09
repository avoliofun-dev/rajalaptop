// app/api/auth/customer/orders/route.js
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCustomerFromCookies } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getCustomerFromCookies();
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ambil detail pelanggan untuk pencocokan email atau nomor telepon
    const [customerRows] = await pool.query('SELECT id, email, phone FROM customers WHERE id = ?', [session.id]);
    if (!customerRows || customerRows.length === 0) {
      return NextResponse.json({ error: 'Pelanggan tidak ditemukan' }, { status: 404 });
    }

    const customer = customerRows[0];
    const email = customer.email;
    const phone = customer.phone;

    // Ambil pesanan milik pelanggan ini berdasarkan email atau nomor telepon
    const [orders] = await pool.query(
      `SELECT * FROM orders 
       WHERE email = ? OR (phone != '' AND phone IS NOT NULL AND phone = ?)
       ORDER BY created_at DESC, id DESC`,
      [email, phone]
    );

    return NextResponse.json({ success: true, orders: orders || [] });
  } catch (error) {
    console.error('GET /api/auth/customer/orders error:', error);
    return NextResponse.json({ error: 'Gagal mengambil riwayat pesanan' }, { status: 500 });
  }
}
