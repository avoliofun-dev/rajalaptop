import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import { getAdminById, getAdminByEmail, getAdminFromCookies, updateProductStock } from '@/lib/db';
import { verifyAdminToken } from '@/lib/auth';

/**
 * Expected request body (JSON):
 * {
 *   "pdfBase64": "<base64 encoded PDF>"
 * }
 *
 * The PDF should contain lines with two columns separated by commas or whitespace:
 *   productId,stock
 *   prod-123 10
 * The handler will update each product's stock accordingly.
 */
export async function POST(request) {
  try {
    // Verify admin session via cookie
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pdfBase64 } = await request.json();
    if (!pdfBase64) {
      return NextResponse.json({ error: 'pdfBase64 is required' }, { status: 400 });
    }

    const dataBuffer = Buffer.from(pdfBase64, 'base64');
    const pdfData = await pdf(dataBuffer);
    const text = pdfData.text || '';

    const lines = text.split(/\r?\n/).filter(l => l.trim());
    const results = [];
    for (const line of lines) {
      // Split by comma first, fallback to whitespace
      const parts = line.includes(',') ? line.split(',') : line.split(/\s+/);
      if (parts.length < 2) continue;
      const id = parts[0].trim();
      const stock = Number(parts[1].trim());
      if (!id || Number.isNaN(stock)) continue;
      try {
        const updated = await updateProductStock(id, stock);
        results.push({ id, stock, status: 'ok', product: updated });
      } catch (e) {
        results.push({ id, stock, status: 'error', message: e.message });
      }
    }

    return NextResponse.json({ ok: true, updated: results });
  } catch (error) {
    console.error('upload-stock error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
