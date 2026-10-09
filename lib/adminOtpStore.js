// lib/adminOtpStore.js
// Penyimpanan kode OTP login admin in-memory dengan enkripsi token sesi sementara & masa kedaluwarsa

const otpMap = new Map();
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 Menit
const MAX_VERIFY_ATTEMPTS = 4;

/**
 * Generate 6-digit angka random untuk OTP
 */
export function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Simpan OTP baru untuk sesi login admin
 */
export function storeAdminOtp({ adminId, email, phone, name, role }) {
  const code = generateOtpCode();
  const sessionToken = `otp_sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const expiresAt = Date.now() + OTP_EXPIRY_MS;

  const data = {
    adminId,
    email,
    phone,
    name,
    role,
    code,
    sessionToken,
    expiresAt,
    attempts: 0,
    createdAt: Date.now(),
  };

  otpMap.set(sessionToken, data);

  // Bersihkan OTP kadaluwarsa secara berkala
  cleanupExpiredOtps();

  return { sessionToken, code, expiresAt };
}

/**
 * Ambil data sesi OTP
 */
export function getAdminOtpSession(sessionToken) {
  if (!sessionToken) return null;
  const session = otpMap.get(sessionToken);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    otpMap.delete(sessionToken);
    return null;
  }

  return session;
}

/**
 * Verifikasi kode OTP yang dimasukkan user
 */
export function verifyAdminOtp(sessionToken, inputCode) {
  const session = getAdminOtpSession(sessionToken);
  if (!session) {
    return { valid: false, error: 'Sesi OTP tidak valid atau telah kedaluwarsa. Silakan login ulang.' };
  }

  if (session.attempts >= MAX_VERIFY_ATTEMPTS) {
    otpMap.delete(sessionToken);
    return { valid: false, error: 'Batas percobaan OTP telah terlampaui demi keamanan. Silakan login kembali.' };
  }

  const cleanInput = String(inputCode || '').trim();
  if (cleanInput !== session.code) {
    session.attempts += 1;
    const remaining = MAX_VERIFY_ATTEMPTS - session.attempts;
    return {
      valid: false,
      error: `Kode OTP WhatsApp salah. Sisa percobaan: ${remaining} kali.`,
      remaining,
    };
  }

  // Berhasil verifikasi: hapus sesi OTP
  otpMap.delete(sessionToken);
  return { valid: true, adminData: session };
}

/**
 * Reset / kirim ulang OTP
 */
export function resendAdminOtp(sessionToken) {
  const oldSession = getAdminOtpSession(sessionToken);
  if (!oldSession) {
    return null;
  }

  const newCode = generateOtpCode();
  oldSession.code = newCode;
  oldSession.expiresAt = Date.now() + OTP_EXPIRY_MS;
  oldSession.attempts = 0;
  otpMap.set(sessionToken, oldSession);

  return { sessionToken, code: newCode, expiresAt: oldSession.expiresAt, session: oldSession };
}

/**
 * Cleanup sesi yang sudah kadaluwarsa
 */
function cleanupExpiredOtps() {
  const now = Date.now();
  for (const [token, data] of otpMap.entries()) {
    if (now > data.expiresAt) {
      otpMap.delete(token);
    }
  }
}
