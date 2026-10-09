// app/api/stock/upload/route.js
import { NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import { pool } from '@/lib/db';
import { guardApi } from '@/lib/apiGuard';
import { recordAuditLog } from '@/lib/audit';

/**
 * POST /api/stock/upload
 * Guarded: Only Gudang or Super Admin ('stock.receive' or 'stock.adjust')
 */
export async function POST(request) {
  const auth = await guardApi(request, ['stock.receive', 'stock.adjust'], { module: 'STOCK' });
  if (!auth.allowed) return auth.response;

  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdfParse(buffer);
    const lines = data.text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const updatePromises = [];
    for (const line of lines) {
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length < 2) continue;
      const [id, stockStr] = parts;
      const stock = parseInt(stockStr, 10);
      if (Number.isNaN(stock)) continue;
      updatePromises.push(pool.execute('UPDATE products SET stock = ? WHERE id = ?', [stock, id]));
    }
    const results = await Promise.all(updatePromises);

    await recordAuditLog({
      request,
      user: auth.user,
      action: 'BATCH_STOCK_UPLOAD',
      module: 'STOCK',
      resourceType: 'STOCK_BATCH',
      status: 'SUCCESS',
      details: `Upload PDF batch penyesuaian stok (${results.length} produk diupdate)`,
    });

    return NextResponse.json({ message: 'Stock updated', updated: results.length });
  } catch (err) {
    console.error('Stock upload error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
