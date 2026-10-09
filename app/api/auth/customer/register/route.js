import { NextResponse } from 'next/server';
import {
  createCustomer,
  getCustomerByEmail,
  sanitizeCustomer,
} from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const password = String(body.password || '');

    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Harap lengkapi semua kolom pendaftaran.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Kata sandi minimal harus 6 karakter.' },
        { status: 400 }
      );
    }

    const existing = await getCustomerByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar. Silakan masuk atau gunakan email lain.' },
        { status: 409 }
      );
    }

    const customer = await createCustomer({
      name,
      email,
      phone,
      passwordHash: hashPassword(password),
    });

    return NextResponse.json({
      ok: true,
      user: sanitizeCustomer(customer),
    });
  } catch (error) {
    console.error('customer register error:', error.message || error);
    const msg = error.message && error.message.includes('fetch failed')
      ? 'Gagal terhubung ke database Supabase. Pastikan URL & Key di .env.local sudah benar dan aktif.'
      : (error.message || 'Gagal mendaftar. Terjadi kesalahan pada database.');
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
