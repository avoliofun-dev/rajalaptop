// app/api/audit-logs/route.js
import { NextResponse } from 'next/server';
import { guardApi } from '@/lib/apiGuard';
import { getAuditLogs, recordAuditLog } from '@/lib/audit';

export async function GET(request) {
  const auth = await guardApi(request, 'audit.view', { module: 'AUDIT' });
  if (!auth.allowed) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const filters = {
      user_id: searchParams.get('user_id'),
      role: searchParams.get('role'),
      module: searchParams.get('module'),
      action: searchParams.get('action'),
      store_id: searchParams.get('store_id'),
      area_id: searchParams.get('area_id'),
      status: searchParams.get('status'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    };

    const data = await getAuditLogs(filters);
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error('GET /api/audit-logs error:', error);
    return NextResponse.json({ error: 'Gagal mengambil log audit' }, { status: 500 });
  }
}

// Strictly prevent any modification or deletion of audit logs (Anti-Tampering)
export async function DELETE(request) {
  const auth = await guardApi(request, null, { module: 'AUDIT' });
  if (auth.user) {
    await recordAuditLog({
      request,
      user: auth.user,
      action: 'ILLEGAL_AUDIT_DELETE_ATTEMPT',
      module: 'SECURITY',
      status: 'BLOCKED',
      reason: 'Percobaan penghapusan audit log yang dilarang keras oleh sistem',
    });
  }
  return NextResponse.json(
    { error: 'Audit log bersifat permanen (immutable) dan tidak dapat dihapus oleh role manapun, termasuk Owner dan Super Admin.' },
    { status: 403 }
  );
}

export async function PUT(request) {
  return NextResponse.json(
    { error: 'Audit log tidak dapat diubah (immutable).' },
    { status: 403 }
  );
}
