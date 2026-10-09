// app/api/admin/customers/route.js
import { NextResponse } from 'next/server';
import { guardApi } from '@/lib/apiGuard';
import { getCustomers, deleteCustomer } from '@/lib/db';
import { recordAuditLog } from '@/lib/audit';

// GET all customers
export async function GET(request) {
  const auth = await guardApi(request, ['users.view', 'sales.view'], { module: 'CUSTOMERS' });
  if (!auth.allowed) return auth.response;

  try {
    const customers = await getCustomers();
    return NextResponse.json({
      success: true,
      customers: customers || [],
      total: (customers || []).length,
    });
  } catch (error) {
    console.error('GET /api/admin/customers error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data pelanggan' }, { status: 500 });
  }
}

// DELETE customer
export async function DELETE(request) {
  const auth = await guardApi(request, ['users.manage'], { module: 'CUSTOMERS' });
  if (!auth.allowed) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID pelanggan wajib disertakan' }, { status: 400 });
    }

    const ok = await deleteCustomer(id);
    if (!ok) {
      return NextResponse.json({ error: 'Gagal menghapus data pelanggan' }, { status: 500 });
    }

    await recordAuditLog({
      request,
      user: auth.user,
      action: 'DELETE_CUSTOMER',
      module: 'CUSTOMERS',
      targetId: id,
      status: 'SUCCESS',
      details: `Menghapus akun customer ID: ${id}`,
    });

    return NextResponse.json({ success: true, message: 'Pelanggan berhasil dihapus' });
  } catch (error) {
    console.error('DELETE /api/admin/customers error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
