// app/api/auth/admin/me/route.js
import { NextResponse } from 'next/server';
import { getAdminFromCookies } from '@/lib/auth';
import { getUserRbacContext } from '@/lib/rbac';
import { pool } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getAdminFromCookies();
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userContext = await getUserRbacContext(session.id);
    if (!userContext || userContext.status !== 'active') {
      return NextResponse.json({ error: 'Sesi tidak valid atau akun dinonaktifkan' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: userContext,
      admin: userContext,
    });
  } catch (error) {
    console.error('admin me error:', error.message);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PUT(request) {
  try {
    const session = await getAdminFromCookies();
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, avatar, currentPassword, newPassword } = body;

    // Fetch existing user to verify password if password change is requested
    const [rows] = await pool.query('SELECT * FROM admin_users WHERE id = ?', [session.id]);
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }
    const currentUser = rows[0];

    const fields = [];
    const updateParams = [];

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Nama lengkap wajib diisi' }, { status: 400 });
      }
      fields.push('name = ?');
      updateParams.push(name.trim());
    }

    if (phone !== undefined) {
      fields.push('phone = ?');
      updateParams.push(phone ? phone.trim() : null);
    }

    if (avatar !== undefined) {
      fields.push('avatar = ?');
      updateParams.push(avatar || null);
    }

    if (newPassword && newPassword.trim()) {
      if (newPassword.trim().length < 6) {
        return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 });
      }
      if (!currentPassword) {
        return NextResponse.json({ error: 'Password saat ini harus diisi untuk konfirmasi perubahan password' }, { status: 400 });
      }
      const existingHash = currentUser.password_hash || currentUser.password;
      const match = await bcrypt.compare(currentPassword, existingHash);
      if (!match) {
        return NextResponse.json({ error: 'Password saat ini yang Anda masukkan salah' }, { status: 400 });
      }
      const hashed = await bcrypt.hash(newPassword.trim(), 10);
      fields.push('password_hash = ?');
      updateParams.push(hashed);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data yang diperbarui' }, { status: 400 });
    }

    updateParams.push(session.id);
    await pool.query(
      `UPDATE admin_users SET ${fields.join(', ')} WHERE id = ?`,
      updateParams
    );

    const updatedContext = await getUserRbacContext(session.id);
    return NextResponse.json({
      success: true,
      message: 'Data diri berhasil diperbarui!',
      user: updatedContext,
    });
  } catch (error) {
    console.error('PUT /api/auth/admin/me error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem saat memperbarui data diri' }, { status: 500 });
  }
}
