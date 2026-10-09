// app/api/serials/route.js
import { NextResponse } from 'next/server';
import { guardApi } from '@/lib/apiGuard';
import { getLaptopSerials, registerLaptopSerial, transferLaptopSerial, getSerialMovements } from '@/lib/serials';

export async function GET(request) {
  const auth = await guardApi(request, 'serials.view', { module: 'INVENTORY' });
  if (!auth.allowed) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const serialId = searchParams.get('serial_id');

    if (serialId) {
      const movements = await getSerialMovements(serialId);
      return NextResponse.json({ success: true, movements });
    }

    const filters = {
      status: searchParams.get('status'),
      search: searchParams.get('search'),
    };

    const serials = await getLaptopSerials(filters, auth.user);
    return NextResponse.json({ success: true, serials });
  } catch (error) {
    console.error('GET /api/serials error:', error);
    return NextResponse.json({ error: error.message || 'Gagal mengambil data serial number' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await guardApi(request, 'serials.manage', { module: 'INVENTORY' });
  if (!auth.allowed) return auth.response;

  try {
    const body = await request.json();
    const { productId, serialNumber, imei, supplierId, purchaseOrderId, storeId, warrantyMonths } = body;

    if (!productId || !serialNumber) {
      return NextResponse.json({ error: 'Produk dan Serial Number wajib diisi' }, { status: 400 });
    }

    const serial = await registerLaptopSerial({
      productId,
      serialNumber,
      imei,
      supplierId,
      purchaseOrderId,
      storeId,
      warrantyMonths,
      actorUser: auth.user,
      request,
    });

    return NextResponse.json({ success: true, serial });
  } catch (error) {
    console.error('POST /api/serials error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Serial number tersebut sudah terdaftar di sistem' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Gagal mendaftarkan serial number' }, { status: 500 });
  }
}

export async function PUT(request) {
  const auth = await guardApi(request, ['serials.manage', 'stock.transfer'], { module: 'INVENTORY' });
  if (!auth.allowed) return auth.response;

  try {
    const body = await request.json();
    const { serialId, toStoreId, notes } = body;

    if (!serialId || !toStoreId) {
      return NextResponse.json({ error: 'Serial ID dan Toko Tujuan wajib diisi' }, { status: 400 });
    }

    const result = await transferLaptopSerial({
      serialId,
      toStoreId,
      actorUser: auth.user,
      notes,
      request,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('PUT /api/serials error:', error);
    return NextResponse.json({ error: error.message || 'Gagal memutasi serial number' }, { status: 500 });
  }
}
