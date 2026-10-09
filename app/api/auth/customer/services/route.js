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
    const customerPhone = customer.phone ? customer.phone.replace(/[^0-9]/g, '') : '';

    // Ambil tiket servis milik customer berdasarkan kecocokan nomor HP atau nama
    let services = [];
    if (customer.phone) {
      const [serviceRows] = await pool.query(
        `SELECT * FROM services 
         WHERE phone = ? 
            OR REPLACE(REPLACE(REPLACE(phone, '-', ''), ' ', ''), '+62', '0') LIKE ?
            OR customer = ?
         ORDER BY created_at DESC`,
        [customer.phone, `%${customerPhone.slice(-8)}%`, customer.name]
      );
      services = serviceRows || [];
    }

    // Ambil perangkat bergaransi milik customer dari product_serials
    // Cocokkan melalui customer_id ATAU orders yang email/phone-nya sama
    const [warrantyRows] = await pool.query(
      `SELECT ps.id, ps.serial_number, ps.warranty_months, ps.warranty_expiry, ps.status,
              p.name as product_name, p.brand, o.id as order_id, o.created_at as order_date
       FROM product_serials ps
       LEFT JOIN products p ON ps.product_id = p.id
       LEFT JOIN orders o ON ps.sale_order_id = o.id
       WHERE ps.customer_id = ? 
          OR (o.email = ? AND ? != '')
          OR (o.phone = ? AND ? != '')
       ORDER BY ps.created_at DESC`,
      [customer.id, customer.email, customer.email || '', customer.phone, customer.phone || '']
    );

    return NextResponse.json({
      success: true,
      services,
      warranties: warrantyRows || []
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
