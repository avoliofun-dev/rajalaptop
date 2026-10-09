import { NextResponse } from 'next/server';
import { getAdminFromCookies } from '@/lib/auth';
import { getUserRbacContext } from '@/lib/rbac';
import fs from 'fs';
import path from 'path';
import { getProjectStorageStats } from '@/lib/projectStats';

export async function GET(request) {
  try {
    const session = await getAdminFromCookies();
    if (!session || !session.id) {
      return NextResponse.json(
        { error: 'Autentikasi diperlukan. Silakan login kembali.' },
        { status: 401 }
      );
    }

    const user = await getUserRbacContext(session.id);
    const isAuthorized = Boolean(
      user && (user.isSuperAdmin || user.role === 'super_admin' || user.isOwner || user.role === 'owner')
    );
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Akses ditolak: Menu Progres Web hanya diizinkan bagi Super Admin & Owner.' },
        { status: 403 }
      );
    }

    const filePath = path.join(process.cwd(), 'PROGRESS.md');
    let content = '';
    let stat = null;
    if (fs.existsSync(filePath)) {
      content = fs.readFileSync(filePath, 'utf-8');
      stat = fs.statSync(filePath);
    }

    const stats = getProjectStorageStats();

    // Ambil data versi & modul dari database MySQL jika tersedia
    let dbVersions = null;
    let dbModules = null;
    try {
      const db = require('@/lib/db');
      const [vRows] = await db.pool.query(
        'SELECT * FROM progress_versions ORDER BY sort_order ASC'
      );
      if (vRows && vRows.length > 0) {
        dbVersions = vRows.map((r) => ({
          version: r.version,
          date: r.release_date,
          status: r.status,
          badge: r.badge,
          title: r.title,
          summary: r.summary,
          highlights: typeof r.highlights === 'string' ? JSON.parse(r.highlights) : r.highlights || [],
        }));
      }

      const [mRows] = await db.pool.query(
        'SELECT * FROM progress_modules ORDER BY num ASC'
      );
      if (mRows && mRows.length > 0) {
        dbModules = mRows.map((r) => ({
          num: r.num,
          title: r.title,
          icon: r.icon,
          badge: r.badge,
          color: r.color,
          desc: r.description,
          items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items || [],
        }));
      }
    } catch (dbErr) {
      console.warn('Gagal membaca data progres dari database:', dbErr.message);
    }

    return NextResponse.json({
      success: true,
      content,
      lastModified: stat ? stat.mtime : new Date().toISOString(),
      fileSize: stat ? stat.size : 0,
      stats,
      versions: dbVersions,
      modules: dbModules,
    });
  } catch (error) {
    console.error('API /api/admin/progres error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memuat progres web.' },
      { status: 500 }
    );
  }
}
