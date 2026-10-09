import { NextResponse } from 'next/server';
import { getAdminByEmail, sanitizeAdmin, getSettings } from '@/lib/db';
import {
  verifyPassword,
  signAdminToken,
  setAdminCookie,
} from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '@/lib/rateLimit';
import { storeAdminOtp } from '@/lib/adminOtpStore';
import { sendWhatsAppNotification, buildAdminLoginOtpMsg } from '@/lib/whatsappGateway';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    // 1. Ekstrak IP untuk Rate Limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : (request.headers.get('x-real-ip') || '127.0.0.1');
    const rateLimitKey = `admin_login:${clientIp}:${email || 'empty'}`;

    // 2. Periksa apakah IP/Email terkena blokir sementara (brute-force defense)
    const rateCheck = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      await recordAuditLog({
        request,
        user: { email, role: 'unknown' },
        action: 'LOGIN_RATE_LIMITED',
        module: 'AUTH',
        status: 'FAILED',
        reason: 'Percobaan login melebihi batas (terkunci sementara)',
        details: `Terlalu banyak percobaan login gagal dari IP ${clientIp}. Silakan coba ${rateCheck.retryAfterSec} detik lagi.`,
      });

      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan login gagal. Demi keamanan sistem, akses dikunci sementara. Silakan coba ${rateCheck.retryAfterSec} detik lagi.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateCheck.retryAfterSec) },
        }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Harap isi email dan kata sandi.' },
        { status: 400 }
      );
    }

    const admin = await getAdminByEmail(email);
    if (!admin || !verifyPassword(password, admin.password_hash)) {
      recordFailedAttempt(rateLimitKey);
      await recordAuditLog({
        request,
        user: { email, role: admin?.role || 'unknown' },
        action: 'LOGIN_FAILED',
        module: 'AUTH',
        status: 'FAILED',
        reason: 'Kombinasi email atau kata sandi tidak valid',
      });

      return NextResponse.json(
        { error: 'Email atau kata sandi tidak valid.' },
        { status: 401 }
      );
    }

    if (admin.status === 'inactive' || admin.status === 'nonaktif') {
      await recordAuditLog({
        request,
        user: admin,
        action: 'LOGIN_BLOCKED_INACTIVE',
        module: 'AUTH',
        status: 'FAILED',
        reason: 'Akun dinonaktifkan oleh administrator',
      });

      return NextResponse.json(
        { error: 'Akun admin ini telah dinonaktifkan oleh Administrator / Owner.' },
        { status: 403 }
      );
    }

    // Reset counter percobaan gagal kredensial
    resetRateLimit(rateLimitKey);

    const safe = sanitizeAdmin(admin);

    // Ambil nomor WhatsApp admin atau fallback dari konfigurasi toko
    const settings = (await getSettings()) || {};
    const storeName = settings.storeName || 'RajaLaptop';
    const adminPhone = admin.phone || settings.whatsappNumber || '081234567890';

    // Buat sesi OTP
    const { sessionToken, code, expiresAt } = storeAdminOtp({
      adminId: safe.id,
      email: safe.email,
      phone: adminPhone,
      name: safe.name,
      role: safe.role,
    });

    // Kirim notifikasi OTP via WhatsApp Gateway
    const waMessage = buildAdminLoginOtpMsg({
      code,
      name: safe.name,
      storeName,
    });

    let waResult = null;
    try {
      waResult = await sendWhatsAppNotification({
        phone: adminPhone,
        message: waMessage,
        type: 'ADMIN_OTP',
      });
    } catch (waErr) {
      console.error('Gagal dispatch WhatsApp OTP:', waErr);
    }

    await recordAuditLog({
      request,
      user: safe,
      action: 'LOGIN_OTP_DISPATCHED',
      module: 'AUTH',
      status: 'SUCCESS',
      details: `Kode OTP login WhatsApp dikirim ke ${adminPhone} untuk staf ${safe.name} (${safe.role})`,
    });

    // Mask phone number untuk tampilan keamanan (misal: 0812****7890)
    const phoneStr = String(adminPhone);
    const maskedPhone =
      phoneStr.length > 6
        ? `${phoneStr.slice(0, 4)}••••${phoneStr.slice(-4)}`
        : phoneStr;

    return NextResponse.json({
      requireOtp: true,
      sessionToken,
      expiresAt,
      phone: maskedPhone,
      adminName: safe.name,
      message: 'Kode OTP keamanan telah dikirimkan secara real-time ke nomor WhatsApp Anda.',
      directWaLink: waResult?.directLink || null, // Dukungan direct link buka chat WA langsung
      debugOtpCode: code, // Kode OTP untuk bantuan login instan di lingkungan pengembangan/lokal
    });
  } catch (error) {
    console.error('admin login error:', error.message);
    return NextResponse.json(
      { error: 'Gagal masuk. Terjadi gangguan pada server.' },
      { status: 500 }
    );
  }
}
