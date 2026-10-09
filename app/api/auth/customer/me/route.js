import { NextResponse } from 'next/server';
import {
  getCustomerById,
  updateCustomerProfile,
  updateCustomerPassword,
  sanitizeCustomer,
} from '@/lib/db';
import {
  getCustomerFromCookies,
  verifyPassword,
  hashPassword,
  signCustomerToken,
  setCustomerCookie,
} from '@/lib/auth';

export async function GET() {
  try {
    const session = await getCustomerFromCookies();
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customer = await getCustomerById(session.id);
    if (!customer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ user: sanitizeCustomer(customer) });
  } catch (error) {
    console.error('customer me error:', error.message);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PUT(req) {
  try {
    const session = await getCustomerFromCookies();
    if (!session?.id) {
      return NextResponse.json({ error: 'Sesi login tidak valid. Silakan masuk kembali.' }, { status: 401 });
    }

    const customer = await getCustomerById(session.id);
    if (!customer) {
      return NextResponse.json({ error: 'Data pelanggan tidak ditemukan.' }, { status: 404 });
    }

    const body = await req.json();
    const { name, phone, address, currentPassword, newPassword } = body;

    // Handle password update if requested
    if (newPassword) {
      if (customer.password_hash) {
        if (!currentPassword) {
          return NextResponse.json(
            { error: 'Password saat ini harus diisi untuk mengubah password.' },
            { status: 400 }
          );
        }
        const matches = verifyPassword(currentPassword, customer.password_hash);
        if (!matches) {
          return NextResponse.json(
            { error: 'Password saat ini tidak cocok.' },
            { status: 400 }
          );
        }
      }
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'Password baru minimal 6 karakter.' },
          { status: 400 }
        );
      }
      const newHash = hashPassword(newPassword);
      await updateCustomerPassword(customer.id, newHash);
    }

    // Handle profile info update
    const updated = await updateCustomerProfile(customer.id, {
      name: name !== undefined ? name.trim() : customer.name,
      phone: phone !== undefined ? phone.trim() : customer.phone,
      address: address !== undefined ? address.trim() : customer.address,
    });

    // Refresh auth cookie if name changed
    if (name && name.trim() !== customer.name) {
      const newToken = await signCustomerToken({
        id: updated.id,
        email: updated.email,
        name: updated.name,
      });
      await setCustomerCookie(newToken);
    }

    return NextResponse.json({
      success: true,
      message: 'Profil akun berhasil diperbarui.',
      user: sanitizeCustomer(updated),
    });
  } catch (error) {
    console.error('Update customer profile error:', error.message);
    return NextResponse.json(
      { error: 'Gagal memperbarui profil: ' + error.message },
      { status: 500 }
    );
  }
}
