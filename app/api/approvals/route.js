// app/api/approvals/route.js
import { NextResponse } from 'next/server';
import { guardApi } from '@/lib/apiGuard';
import { getApprovalRequests, createApprovalRequest, decideApprovalRequest } from '@/lib/approvals';

export async function GET(request) {
  const auth = await guardApi(request, 'approval.view', { module: 'APPROVAL' });
  if (!auth.allowed) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const requestType = searchParams.get('request_type');

    const requests = await getApprovalRequests({ status, request_type: requestType }, auth.user);
    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error('GET /api/approvals error:', error);
    return NextResponse.json({ error: error.message || 'Gagal memuat approval' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await guardApi(request, 'approval.create', { module: 'APPROVAL' });
  if (!auth.allowed) return auth.response;

  try {
    const body = await request.json();
    const { requestType, storeId, areaId, referenceType, referenceId, oldValue, newValue, reason, notes } = body;

    if (!requestType || !reason) {
      return NextResponse.json({ error: 'Tipe pengajuan dan alasan wajib diisi' }, { status: 400 });
    }

    const approval = await createApprovalRequest({
      requestType,
      requesterUser: auth.user,
      storeId,
      areaId,
      referenceType,
      referenceId,
      oldValue,
      newValue,
      reason,
      notes,
      request,
    });

    return NextResponse.json({ success: true, approval });
  } catch (error) {
    console.error('POST /api/approvals error:', error);
    return NextResponse.json({ error: error.message || 'Gagal membuat permohonan approval' }, { status: 500 });
  }
}

export async function PUT(request) {
  const auth = await guardApi(request, ['approval.approve', 'approval.reject'], { module: 'APPROVAL' });
  if (!auth.allowed) return auth.response;

  try {
    const body = await request.json();
    const { requestId, decision, notes } = body;

    if (!requestId || !['APPROVE', 'REJECT', 'CANCEL'].includes(decision)) {
      return NextResponse.json({ error: 'ID permohonan dan keputusan (APPROVE/REJECT/CANCEL) wajib diisi' }, { status: 400 });
    }

    const updated = await decideApprovalRequest({
      requestId,
      decision,
      actorUser: auth.user,
      notes,
      request,
    });

    return NextResponse.json({ success: true, approval: updated });
  } catch (error) {
    console.error('PUT /api/approvals error:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses permohonan approval' }, { status: 400 });
  }
}
