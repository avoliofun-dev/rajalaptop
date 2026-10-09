// app/api/auth/admin/verify-otp/route.js
import { NextResponse } from 'next/server';
import { verifyAdminOtp, resendAdminOtp } from '@/lib/adminOtpStore';
import { signAdminToken, setAdminCookie } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import { sendWhatsAppNotification, buildAdminLoginOtpMsg } from '@/lib/whatsappGateway';
import { getSettings } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { sessionToken, otp, action } = body;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Sesi OTP tidak ditemukan atau telah kedaluwarsa.' },
        { status: 400 }
      );
    }

    // Aksi 1: Kirim Ulang OTP WhatsApp
    if (action === 'RESEND') {
      const resendResult = resendAdminOtp(sessionToken);
      if (!resendResult) {
        return NextResponse.json(
          { error: 'Sesi telah kedaluwarsa. Silakan masukkan email dan sandi kembali.' },
          { status: 400 }
        );
      }

      const settings = (await getSettings()) || {};
      const storeName = settings.storeName || 'RajaLaptop';

      const waMessage = buildAdminLoginOtpMsg({
        code: resendResult.code,
        name: resendResult.session.name,
        storeName,
      });

      let waResult = null;
      try {
        waResult = await sendWhatsAppNotification({
          phone: resendResult.session.phone,
          message: waMessage,
          type: 'ADMIN_OTP_RESEND',
        });
      } catch (err) {
        console.error('Gagal kirim ulang OTP WA:', err);
      }

      await recordAuditLog({
        request,
        user: { email: resendResult.session.email, role: resendResult.session.role },
        action: 'LOGIN_OTP_RESENT',
        module: 'AUTH',
        status: 'SUCCESS',
        details: `Kode OTP baru dikirim ulang via WhatsApp ke ${resendResult.session.phone}`,
      });

      return NextResponse.json({
        success: true,
        message: 'Kode OTP WhatsApp baru berhasil dikirimkan!',
        expiresAt: resendResult.expiresAt,
        directWaLink: waResult?.directLink || null,
        debugOtpCode: resendResult.code,
      });
    }

    // Aksi 2: Verifikasi Kode OTP
    if (!otp || String(otp).trim().length !== 6) {
      return NextResponse.json(
        { error: 'Masukkan 6 digit kode OTP WhatsApp yang valid.' },
        { status: 400 }
      );
    }

    const verification = verifyAdminOtp(sessionToken, otp);
    if (!verification.valid) {
      await recordAuditLog({
        request,
        user: { sessionToken },
        action: 'LOGIN_OTP_FAILED',
        module: 'AUTH',
        status: 'FAILED',
        reason: verification.error,
      });

      return NextResponse.json(
        { error: verification.error, remaining: verification.remaining },
        { status: 400 }
      );
    }

    const admin = verification.adminData;
    const safeUser = {
      id: admin.adminId,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      phone: admin.phone,
      status: 'active',
    };

    // Terbitkan JWT Admin Session & Simpan di Cookie HttpOnly
    const token = await signAdminToken(safeUser);
    await setAdminCookie(token);

    await recordAuditLog({
      request,
      user: safeUser,
      action: 'LOGIN_SUCCESS_2FA_WA',
      module: 'AUTH',
      status: 'SUCCESS',
      details: `Staf ${safeUser.name} (${safeUser.role}) berhasil lolos verifikasi OTP WhatsApp real-time`,
    });

    return NextResponse.json({
      ok: true,
      success: true,
      user: safeUser,
      message: 'Verifikasi OTP WhatsApp berhasil. Mengalihkan ke dashboard...',
    });
  } catch (error) {
    console.error('API /api/auth/admin/verify-otp error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memverifikasi kode OTP.' },
      { status: 500 }
    );
  }
}
