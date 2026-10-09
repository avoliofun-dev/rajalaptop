// lib/apiGuard.js
import { NextResponse } from 'next/server';
import { getAdminFromCookies } from './auth';
import { getUserRbacContext, hasPermission, isScopeAllowed } from './rbac';
import { recordAuditLog } from './audit';

/**
 * Server-side guard to authenticate and authorize Next.js API requests.
 *
 * @param {Request} request - Next.js Request object
 * @param {string|string[]} requiredPermission - Permission slug or array of acceptable slugs
 * @param {object} options - Optional { module, targetStoreId, targetAreaId, targetUserId }
 * @returns {Promise<{ allowed: boolean, response?: NextResponse, user?: object }>}
 */
export async function guardApi(request, requiredPermission, options = {}) {
  try {
    const session = await getAdminFromCookies();
    if (!session || !session.id) {
      return {
        allowed: false,
        response: NextResponse.json(
          { error: 'Autentikasi diperlukan. Silakan login kembali.', code: 'UNAUTHORIZED' },
          { status: 401 }
        ),
      };
    }

    const user = await getUserRbacContext(session.id);
    if (!user) {
      return {
        allowed: false,
        response: NextResponse.json(
          { error: 'User tidak ditemukan atau sesi kadaluarsa.', code: 'USER_NOT_FOUND' },
          { status: 401 }
        ),
      };
    }

    if (user.status !== 'active') {
      await recordAuditLog({
        request,
        user,
        action: 'INACTIVE_USER_BLOCKED',
        module: options.module || 'AUTH',
        status: 'FAILED',
        reason: 'Percobaan akses oleh akun nonaktif',
      });

      return {
        allowed: false,
        response: NextResponse.json(
          { error: 'Akun Anda telah dinonaktifkan oleh administrator.', code: 'ACCOUNT_INACTIVE' },
          { status: 403 }
        ),
      };
    }

    // Permission checking
    if (requiredPermission) {
      const perms = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
      const hasAny = perms.some((p) => hasPermission(user, p));

      if (!hasAny) {
        await recordAuditLog({
          request,
          user,
          action: 'PERMISSION_DENIED',
          module: options.module || 'RBAC',
          resourceType: 'PERMISSION',
          resourceId: perms.join('|'),
          status: 'FAILED',
          reason: `Role '${user.role}' tidak memiliki izin '${perms.join(' atau ')}'`,
        });

        return {
          allowed: false,
          response: NextResponse.json(
            {
              error: `Akses ditolak: Anda tidak memiliki izin '${perms.join(' / ')}'.`,
              code: 'FORBIDDEN',
              required: perms,
              userRole: user.role,
            },
            { status: 403 }
          ),
        };
      }

      // Scope checking if target resource context is provided
      if (options.targetStoreId || options.targetAreaId || options.targetUserId) {
        const firstPerm = perms[0];
        const allowedScope = isScopeAllowed(user, firstPerm, {
          storeId: options.targetStoreId,
          areaId: options.targetAreaId,
          userId: options.targetUserId,
          cashierId: options.targetUserId,
        });

        if (!allowedScope) {
          await recordAuditLog({
            request,
            user,
            action: 'SCOPE_VIOLATION',
            module: options.module || 'RBAC',
            resourceType: 'SCOPE',
            resourceId: options.targetStoreId || options.targetAreaId || options.targetUserId,
            status: 'FAILED',
            reason: `Data di luar jangkauan scope '${user.defaultScope}'`,
          });

          return {
            allowed: false,
            response: NextResponse.json(
              {
                error: 'Akses ditolak: Anda tidak berwenang mengakses data di luar cabang atau area penugasan Anda.',
                code: 'SCOPE_RESTRICTED',
              },
              { status: 403 }
            ),
          };
        }
      }
    }

    return { allowed: true, user };
  } catch (error) {
    console.error('guardApi error:', error);
    return {
      allowed: false,
      response: NextResponse.json(
        { error: 'Kesalahan otorisasi internal server.', details: error.message },
        { status: 500 }
      ),
    };
  }
}
