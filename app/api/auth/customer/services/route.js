// app/api/auth/customer/services/route.js
import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCustomerFromCookies } from '@/lib/auth';

// GET: Ambil tiket servis & perangkat garansi milik customer yang sedang login
export async function GET(request) {
  try {
    const session = await getCustomerFromCookies();
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [customerRows] = await pool.query(
      'SELECT id, name, email, phone FROM customers WHERE id = ?',
      [session.id]
    );

    if (!customerRows || customerRows.length === 0) {
      return NextResponse.json({ error: 'Pelanggan tidak ditemukan' }, { status: 404 });
    }

    const customer = customerRows[0];

    // Ambil tiket servis milik customer dari Supabase
    const { supabaseAdmin } = await import("@/lib/supabase");
    let services = [];
    try {
      let query = supabaseAdmin.from('services').select('*').order('created_at', { ascending: false });
      if (customer.phone) {
        query = query.or(`phone.eq.${customer.phone},customer.eq.${customer.name}`);
      } else {
        query = query.eq('customer', customer.name);
      }
      const { data } = await query;
      services = data || [];
    } catch {}

    return NextResponse.json({
      success: true,
      services,
      warranties: []
    });
  } catch (error) {
    console.error('GET /api/auth/customer/services error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data servis & garansi' }, { status: 500 });
  }
}

// POST: Booking antrean servis baru oleh customer
export async function POST(request) {
  try {
    const session = await getCustomerFromCookies();
    if (!session?.id) {
      return NextResponse.json({ error: 'Silakan login terlebih dahulu' }, { status: 401 });
    }

    const [customerRows] = await pool.query(
      'SELECT id, name, email, phone FROM customers WHERE id = ?',
      [session.id]
    );

    if (!customerRows || customerRows.length === 0) {
      return NextResponse.json({ error: 'Pelanggan tidak ditemukan' }, { status: 404 });
    }

    const customer = customerRows[0];
    const body = await request.json();
    const { unit, issue, branch } = body;

    if (!unit || !issue) {
      return NextResponse.json({ error: 'Tipe laptop dan kendala wajib diisi' }, { status: 400 });
    }

    const ticketId = `SVC-${Date.now().toString().slice(-6)}`;
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

    await pool.query(
      `INSERT INTO services (id, customer, phone, unit, issue, tech, stage, priority, date, cost)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ticketId,
        customer.name,
        customer.phone || '-',
        unit,
        branch ? `[${branch}] ${issue}` : issue,
        'Menunggu Teknisi',
        'Unit Diterima',
        'Normal',
        dateStr,
        0
      ]
    );

    return NextResponse.json({
      success: true,
      ticketId,
      message: 'Booking antrean servis berhasil dibuat!'
    });
  } catch (error) {
    console.error('POST /api/auth/customer/services error:', error);
    return NextResponse.json({ error: 'Gagal membuat booking servis' }, { status: 500 });
  }
}
