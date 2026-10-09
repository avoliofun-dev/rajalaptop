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

    // Ambil pesanan milik pelanggan ini dari Supabase
    const { supabaseAdmin } = await import("@/lib/supabase");
    let ordersQuery = supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (email && phone) {
      ordersQuery = ordersQuery.or(`email.eq.${email},phone.eq.${phone}`);
    } else if (email) {
      ordersQuery = ordersQuery.eq('email', email);
    } else if (phone) {
      ordersQuery = ordersQuery.eq('phone', phone);
    }

    const { data: orders, error } = await ordersQuery;
    if (error) {
      console.error('Supabase customer orders error:', error);
      return NextResponse.json({ success: true, orders: [] });
    }

    return NextResponse.json({ success: true, orders: orders || [] });
  } catch (error) {
    console.error('GET /api/auth/customer/orders error:', error);
    return NextResponse.json({ error: 'Gagal mengambil riwayat pesanan' }, { status: 500 });
  }
}
