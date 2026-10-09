// app/api/admins/route.js
import { NextResponse } from 'next/server';
import { guardApi } from '@/lib/apiGuard';
import { pool } from '@/lib/db';
import { recordAuditLog } from '@/lib/audit';
import bcrypt from 'bcryptjs';

// GET all admins (scoped to allowed store/area if not Super Admin / Owner)
export async function GET(request) {
  const auth = await guardApi(request, 'users.view', { module: 'USERS' });
  if (!auth.allowed) return auth.response;

  try {
    let query = `
      SELECT u.id, u.name, u.email, u.role, u.role_id, u.status, u.phone, u.avatar,
             u.primary_store_id, u.primary_area_id, u.created_at,
             r.name as role_name,
             s.name as store_name,
             a.name as area_name
      FROM admin_users u
      LEFT JOIN roles r ON r.id = u.role_id OR r.slug = u.role
      LEFT JOIN stores s ON s.id = u.primary_store_id
      LEFT JOIN areas a ON a.id = u.primary_area_id
      WHERE 1=1
    `;
    const params = [];

    // Scope filtering
    if (!auth.user.isOwner && !auth.user.isSuperAdmin) {
      if (auth.user.defaultScope === 'STORE') {
        query += ` AND u.primary_store_id IN (?)`;
        params.push(auth.user.storeIds.length ? auth.user.storeIds : ['__none__']);
      } else if (auth.user.defaultScope === 'AREA') {
        const allowedStores = Array.from(new Set([...auth.user.storeIds, ...auth.user.areaStoreIds]));
        query += ` AND (u.primary_area_id IN (?) OR u.primary_store_id IN (?))`;
        params.push(
          auth.user.areaIds.length ? auth.user.areaIds : ['__none__'],
          allowedStores.length ? allowedStores : ['__none__']
        );
      }
    }

    query += ` ORDER BY u.created_at DESC`;
    const [admins] = await pool.query(query, params);

    return NextResponse.json({ success: true, admins });
  } catch (error) {
    console.error('GET /api/admins error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data admin' }, { status: 500 });
  }
}

// POST create admin (Privilege escalation prevented)
export async function POST(request) {
  const auth = await guardApi(request, 'users.create', { module: 'USERS' });
  if (!auth.allowed) return auth.response;

  try {
    const body = await request.json();
    const { name, email, password, role = 'kasir', storeId, areaId, status = 'active', phone, avatar } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nama, email, dan password wajib diisi' }, { status: 400 });
    }

    // Anti-Privilege Escalation: Only Super Admin can assign Super Admin or Owner role
    if ((role === 'super_admin' || role === 'owner') && !auth.user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Hanya Super Admin yang berwenang memberikan role Super Admin atau Owner' },
        { status: 403 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const id = `admin-${Date.now()}`;
    const passwordHash = await bcrypt.hash(password, 10);

    // Resolve role_id
    const [roleRows] = await pool.query('SELECT id, slug, default_scope FROM roles WHERE slug = ? OR id = ?', [role, role]);
    const roleId = roleRows[0] ? roleRows[0].id : null;
    const roleSlug = roleRows[0] ? roleRows[0].slug : role;

    const effStoreId = storeId || auth.user.primaryStoreId || 'store-pekalongan';
    const effAreaId = areaId || auth.user.primaryAreaId || 'area-jateng';

    await pool.query(
      `INSERT INTO admin_users (id, name, email, password_hash, role, role_id, status, phone, avatar, primary_store_id, primary_area_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name.trim(), cleanEmail, passwordHash, roleSlug, roleId, status, phone || null, avatar || null, effStoreId, effAreaId]
    );

    // Register store & area assignment
    await pool.query(
      `INSERT INTO user_stores (user_id, store_id, is_primary) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE is_primary = 1`,
      [id, effStoreId]
    );
    await pool.query(
      `INSERT INTO user_areas (user_id, area_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE area_id = VALUES(area_id)`,
      [id, effAreaId]
    );

    await recordAuditLog({
      request,
      user: auth.user,
      action: 'CREATE_USER',
      module: 'USERS',
      resourceType: 'USER',
      resourceId: id,
      newValue: { name, email: cleanEmail, role: roleSlug, storeId: effStoreId, areaId: effAreaId },
      storeId: effStoreId,
      status: 'SUCCESS',
      details: `Pembuatan user admin baru: ${name} (${cleanEmail}) dengan role ${roleSlug}`,
    });

    return NextResponse.json({
      success: true,
      admin: { id, name, email: cleanEmail, role: roleSlug, storeId: effStoreId, areaId: effAreaId, status }
    });
  } catch (error) {
    console.error('POST /api/admins error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Email sudah terdaftar untuk pengguna lain' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Gagal menambahkan admin' }, { status: 500 });
  }
}

// PUT update admin (Privilege escalation prevented)
export async function PUT(request) {
  const auth = await guardApi(request, 'users.update', { module: 'USERS' });
  if (!auth.allowed) return auth.response;

  try {
    const body = await request.json();
    const { id, name, email, role, password, status, storeId, areaId, phone, avatar } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID admin wajib disertakan' }, { status: 400 });
    }

    // Fetch target admin
    const [targets] = await pool.query('SELECT * FROM admin_users WHERE id = ?', [id]);
    if (!targets || targets.length === 0) {
      return NextResponse.json({ error: 'Admin tidak ditemukan' }, { status: 404 });
    }
    const target = targets[0];

    // Anti-Escalation Rule 1: A user CANNOT change their own role!
    if (id === auth.user.id && role !== undefined && role !== target.role) {
      return NextResponse.json(
        { error: 'Keamanan: Anda tidak dapat mengubah role akun Anda sendiri.' },
        { status: 403 }
      );
    }

    // Anti-Escalation Rule 2: Cannot modify Owner unless actor is Owner
    if (target.role === 'owner' && !auth.user.isOwner) {
      return NextResponse.json(
        { error: 'Hanya Owner yang berwenang mengubah akun Owner.' },
        { status: 403 }
      );
    }

    // Anti-Escalation Rule 3: Only Super Admin can promote someone to Super Admin or Owner
    if ((role === 'super_admin' || role === 'owner') && target.role !== role && !auth.user.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Hanya Super Admin yang berwenang menetapkan role Super Admin atau Owner.' },
        { status: 403 }
      );
    }

    // Anti-Escalation Rule 4: If deactivating super_admin, verify at least one other active super_admin exists
    if (status === 'inactive' && target.role === 'super_admin') {
      const [count] = await pool.query("SELECT COUNT(*) as c FROM admin_users WHERE role = 'super_admin' AND status = 'active'");
      if (count[0].c <= 1) {
        return NextResponse.json(
          { error: 'Tidak dapat menonaktifkan satu-satunya Super Admin aktif.' },
          { status: 400 }
        );
      }
    }

    const fields = [];
    const params = [];

    if (name !== undefined) {
      fields.push('name = ?');
      params.push(String(name).trim());
    }
    if (email !== undefined) {
      fields.push('email = ?');
      params.push(String(email).trim().toLowerCase());
    }
    if (role !== undefined) {
      const [roleRows] = await pool.query('SELECT id, slug FROM roles WHERE slug = ? OR id = ?', [role, role]);
      if (roleRows[0]) {
        fields.push('role = ?', 'role_id = ?');
        params.push(roleRows[0].slug, roleRows[0].id);
      }
    }
    if (password && String(password).trim().length > 0) {
      const hash = await bcrypt.hash(String(password).trim(), 10);
      fields.push('password_hash = ?');
      params.push(hash);
    }
    if (status !== undefined) {
      fields.push('status = ?');
      params.push(status === 'inactive' ? 'inactive' : 'active');
    }
    if (storeId !== undefined) {
      fields.push('primary_store_id = ?');
      params.push(storeId);
      await pool.query(
        `INSERT INTO user_stores (user_id, store_id, is_primary) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE is_primary = 1`,
        [id, storeId]
      );
    }
    if (areaId !== undefined) {
      fields.push('primary_area_id = ?');
      params.push(areaId);
      await pool.query(
        `INSERT INTO user_areas (user_id, area_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE area_id = VALUES(area_id)`,
        [id, areaId]
      );
    }
    if (phone !== undefined) {
      fields.push('phone = ?');
      params.push(phone);
    }
    if (avatar !== undefined) {
      fields.push('avatar = ?');
      params.push(avatar || null);
    }

    if (fields.length > 0) {
      params.push(id);
      await pool.query(`UPDATE admin_users SET ${fields.join(', ')} WHERE id = ?`, params);
    }

    await recordAuditLog({
      request,
      user: auth.user,
      action: 'UPDATE_USER',
      module: 'USERS',
      resourceType: 'USER',
      resourceId: id,
      oldValue: { name: target.name, role: target.role, status: target.status, store: target.primary_store_id },
      newValue: { name, role, status, storeId, areaId },
      status: 'SUCCESS',
      details: `Pembaruan data staf: ${target.name} (${target.email})`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/admins error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Email sudah digunakan oleh akun lain' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Gagal memperbarui admin' }, { status: 500 });
  }
}

// DELETE / Disable admin
export async function DELETE(request) {
  const auth = await guardApi(request, 'users.disable', { module: 'USERS' });
  if (!auth.allowed) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID admin tidak ditemukan' }, { status: 400 });
    }

    // Anti-Escalation Rule: Cannot delete self
    if (id === auth.user.id) {
      return NextResponse.json({ error: 'Tidak dapat menghapus atau menonaktifkan akun sendiri.' }, { status: 400 });
    }

    const [targets] = await pool.query('SELECT * FROM admin_users WHERE id = ?', [id]);
    if (!targets || targets.length === 0) {
      return NextResponse.json({ error: 'Admin tidak ditemukan' }, { status: 404 });
    }
    const target = targets[0];

    // Cannot delete Owner
    if (target.role === 'owner') {
      return NextResponse.json({ error: 'Akun Owner tidak dapat dihapus.' }, { status: 403 });
    }

    // If super admin, ensure there's another active one
    if (target.role === 'super_admin') {
      const [count] = await pool.query("SELECT COUNT(*) as c FROM admin_users WHERE role = 'super_admin'");
      if (count[0].c <= 1) {
        return NextResponse.json({ error: 'Tidak dapat menghapus satu-satunya Super Admin di sistem.' }, { status: 400 });
      }
    }

    // Perform soft disable instead of hard delete to preserve foreign key & audit references
    await pool.query("UPDATE admin_users SET status = 'inactive' WHERE id = ?", [id]);

    await recordAuditLog({
      request,
      user: auth.user,
      action: 'DISABLE_USER',
      module: 'USERS',
      resourceType: 'USER',
      resourceId: id,
      status: 'SUCCESS',
      details: `Penonaktifan akun staf: ${target.name} (${target.email})`,
    });

    return NextResponse.json({ success: true, message: 'Akun berhasil dinonaktifkan' });
  } catch (error) {
    console.error('DELETE /api/admins error:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus admin' }, { status: 500 });
  }
}
