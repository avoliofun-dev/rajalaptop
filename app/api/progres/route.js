import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getProjectStorageStats } from '@/lib/projectStats';

export async function GET() {
  try {
    const stats = getProjectStorageStats();

    const filePath = path.join(process.cwd(), 'PROGRESS.md');
    let markdownContent = '';
    if (fs.existsSync(filePath)) {
      markdownContent = fs.readFileSync(filePath, 'utf-8');
    }

    return NextResponse.json({
      success: true,
      stats,
      markdownContent,
      meta: {
        appName: 'Raja Laptop Enterprise System',
        currentVersion: stats.version,
        totalSizeGB: stats.totalGB,
        totalSizeMB: stats.totalMB,
        totalSizeFormatted: stats.totalFormatted,
        totalFiles: stats.totalFiles,
        testsPassed: stats.testsPassed,
        lastUpdated: stats.scannedAt,
      },
    });
  } catch (error) {
    console.error('API /api/progres error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memuat data progres proyek.' },
      { status: 500 }
    );
  }
}
