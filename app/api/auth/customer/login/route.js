import { NextResponse } from 'next/server';
import { getCustomerByEmail, sanitizeCustomer } from '@/lib/db';
import {
  verifyPassword,
  signCustomerToken,
  setCustomerCookie,
} from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Harap isi email dan kata sandi.' },
        { status: 400 }
      );
    }

    const customer = await getCustomerByEmail(email);
    if (!customer || !verifyPassword(password, customer.password_hash)) {
      return NextResponse.json(
        { error: 'Email atau kata sandi salah.' },
        { status: 401 }
      );
    }

    const safe = sanitizeCustomer(customer);
    const token = await signCustomerToken(safe);
    await setCustomerCookie(token);

    return NextResponse.json({ ok: true, user: safe });
  } catch (error) {
    console.error('customer login error:', error.message || error);
    const msg = error.message && error.message.includes('fetch failed')
      ? 'Gagal terhubung ke database Supabase. Pastikan URL & Key di .env.local sudah benar dan aktif.'
      : (error.message || 'Gagal masuk. Terjadi kesalahan pada database.');
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
