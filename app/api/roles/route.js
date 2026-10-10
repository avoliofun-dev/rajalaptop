// app/api/roles/route.js
import { NextResponse } from 'next/server';
import { guardApi } from '@/lib/apiGuard';
import { getAllRolesWithPermissions, getStoresAndAreas } from '@/lib/rbac';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { pool } from '@/lib/db';
import { recordAuditLog } from '@/lib/audit';

export async function GET(request) {
  const auth = await guardApi(request, 'roles.view', { module: 'RBAC' });
  if (!auth.allowed) return auth.response;

  try {
    const roles = await getAllRolesWithPermissions();
    let allPermissions = [];

    if (isSupabaseConfigured()) {
      const { data } = await supabaseAdmin.from('permissions').select('*').order('module', { ascending: true });
      allPermissions = data || [];
    } else {
      const [rows] = await pool.query('SELECT * FROM permissions ORDER BY module, slug');
      allPermissions = rows || [];
    }

    const { stores, areas } = await getStoresAndAreas();

    return NextResponse.json({
      success: true,
      roles,
      availablePermissions: allPermissions,
      stores,
      areas,
    });
  } catch (error) {
    console.error('GET /api/roles error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data role & permission' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await guardApi(request, 'roles.create', { module: 'RBAC' });
  if (!auth.allowed) return auth.response;

  try {
    const body = await request.json();
    const { name, description, defaultScope = 'STORE', permissions = [] } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Nama role wajib diisi' }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const id = `role-custom-${Date.now()}`;

    if (isSupabaseConfigured()) {
      const { error: roleErr } = await supabaseAdmin.from('roles').insert([{
        id, slug, name, description: description || '', default_scope: defaultScope, is_system: false
      }]);
      if (roleErr) throw new Error(roleErr.message);

      if (Array.isArray(permissions) && permissions.length > 0) {
        const { data: permDb } = await supabaseAdmin.from('permissions').select('id, slug').in('slug', permissions);
        if (permDb && permDb.length > 0) {
          const pivotRows = permDb.map(p => ({
            role_id: id,
            permission_id: p.id,
            scope: defaultScope
          }));
          await supabaseAdmin.from('role_permissions').insert(pivotRows);
        }
      }
    } else {
      await pool.query(
        `INSERT INTO roles (id, slug, name, description, default_scope, is_system) VALUES (?, ?, ?, ?, ?, 0)`,
        [id, slug, name, description || '', defaultScope]
      );

      if (Array.isArray(permissions) && permissions.length > 0) {
        const [permDb] = await pool.query('SELECT id, slug FROM permissions WHERE slug IN (?)', [permissions]);
        for (const p of permDb) {
          await pool.query(
            `INSERT INTO role_permissions (role_id, permission_id, scope) VALUES (?, ?, ?)`,
            [id, p.id, defaultScope]
          );
        }
      }
    }

    await recordAuditLog({
      request,
      user: auth.user,
      action: 'CREATE_ROLE',
      module: 'RBAC',
      resourceType: 'ROLE',
      resourceId: id,
      newValue: { name, slug, defaultScope, permissionsCount: permissions.length },
      status: 'SUCCESS',
      details: `Pembuatan role kustom baru: ${name}`,
    });

    return NextResponse.json({ success: true, role: { id, slug, name, description, defaultScope } });
  } catch (error) {
    console.error('POST /api/roles error:', error);
    return NextResponse.json({ error: error.message || 'Gagal membuat role' }, { status: 500 });
  }
}

export async function PUT(request) {
  const auth = await guardApi(request, 'roles.update', { module: 'RBAC' });
  if (!auth.allowed) return auth.response;

  try {
    const body = await request.json();
    const { id, name, description, defaultScope, permissions } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID role wajib disertakan' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      const { data: existing } = await supabaseAdmin.from('roles').select('*').eq('id', id).maybeSingle();
      if (!existing) {
        return NextResponse.json({ error: 'Role tidak ditemukan' }, { status: 404 });
      }

      await supabaseAdmin.from('roles').update({
        name: name || existing.name,
        description: description !== undefined ? description : existing.description,
        default_scope: defaultScope || existing.default_scope,
        updated_at: new Date().toISOString()
      }).eq('id', id);

      if (Array.isArray(permissions)) {
        await supabaseAdmin.from('role_permissions').delete().eq('role_id', id);
        if (permissions.length > 0) {
          const { data: permDb } = await supabaseAdmin.from('permissions').select('id, slug').in('slug', permissions);
          if (permDb && permDb.length > 0) {
            const pivotRows = permDb.map(p => ({
              role_id: id,
              permission_id: p.id,
              scope: defaultScope || existing.default_scope
            }));
            await supabaseAdmin.from('role_permissions').insert(pivotRows);
          }
        }
      }
    } else {
      const [existing] = await pool.query('SELECT * FROM roles WHERE id = ?', [id]);
      if (!existing || existing.length === 0) {
        return NextResponse.json({ error: 'Role tidak ditemukan' }, { status: 404 });
      }
      const currentRole = existing[0];

      await pool.query(
        `UPDATE roles SET name = COALESCE(?, name), description = COALESCE(?, description), default_scope = COALESCE(?, default_scope) WHERE id = ?`,
        [name, description, defaultScope, id]
      );

      if (Array.isArray(permissions)) {
        await pool.query('DELETE FROM role_permissions WHERE role_id = ?', [id]);
        if (permissions.length > 0) {
          const [permDb] = await pool.query('SELECT id, slug FROM permissions WHERE slug IN (?)', [permissions]);
          for (const p of permDb) {
            await pool.query(
              `INSERT INTO role_permissions (role_id, permission_id, scope) VALUES (?, ?, ?)`,
              [id, p.id, defaultScope || currentRole.default_scope]
            );
          }
        }
      }
    }

    await recordAuditLog({
      request,
      user: auth.user,
      action: 'UPDATE_ROLE',
      module: 'RBAC',
      resourceType: 'ROLE',
      resourceId: id,
      newValue: { name, defaultScope, permissionsCount: permissions ? permissions.length : undefined },
      status: 'SUCCESS',
      details: `Pembaruan izin/pengaturan pada role ID ${id}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/roles error:', error);
    return NextResponse.json({ error: error.message || 'Gagal memperbarui role' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const auth = await guardApi(request, 'roles.delete', { module: 'RBAC' });
  if (!auth.allowed) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID role wajib disertakan' }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      const { data: role } = await supabaseAdmin.from('roles').select('*').eq('id', id).maybeSingle();
      if (!role) {
        return NextResponse.json({ error: 'Role tidak ditemukan' }, { status: 404 });
      }
      if (role.is_system) {
        return NextResponse.json({ error: 'Role sistem bawaan tidak boleh dihapus.' }, { status: 403 });
      }

      const { count } = await supabaseAdmin.from('admin_users').select('*', { count: 'exact', head: true }).or(`role_id.eq.${id},role.eq.${role.slug}`);
      if (count && count > 0) {
        return NextResponse.json({ error: `Tidak dapat menghapus role: masih terdapat ${count} pengguna yang menggunakan role ini.` }, { status: 400 });
      }

      await supabaseAdmin.from('role_permissions').delete().eq('role_id', id);
      await supabaseAdmin.from('roles').delete().eq('id', id);
    } else {
      const [rows] = await pool.query('SELECT * FROM roles WHERE id = ?', [id]);
      if (!rows || rows.length === 0) {
        return NextResponse.json({ error: 'Role tidak ditemukan' }, { status: 404 });
      }
      if (rows[0].is_system) {
        return NextResponse.json({ error: 'Role sistem bawaan tidak boleh dihapus.' }, { status: 403 });
      }
      const [assigned] = await pool.query('SELECT COUNT(*) as count FROM admin_users WHERE role_id = ? OR role = ?', [id, rows[0].slug]);
      if (assigned[0].count > 0) {
        return NextResponse.json({ error: `Tidak dapat menghapus role: masih terdapat ${assigned[0].count} pengguna yang menggunakan role ini.` }, { status: 400 });
      }

      await pool.query('DELETE FROM role_permissions WHERE role_id = ?', [id]);
      await pool.query('DELETE FROM roles WHERE id = ?', [id]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/roles error:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus role' }, { status: 500 });
  }
}
