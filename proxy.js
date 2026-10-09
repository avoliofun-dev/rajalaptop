import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const CUSTOMER_COOKIE = 'rl_customer';
const ADMIN_COOKIE = 'rl_admin';

function getSecretKey() {
  const secret = process.env.AUTH_SECRET || 'rajalaptop-dev-secret-change-me';
  return new TextEncoder().encode(secret);
}

async function isValidToken(token, audience) {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { audience });
    return payload.type === audience;
  } catch {
    return false;
  }
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  const adminToken = request.cookies.get(ADMIN_COOKIE)?.value;
  const isAdmin = await isValidToken(adminToken, 'admin');

  // If admin is logged in and visits login or register pages -> redirect to admin dashboard
  if (isAdmin && (pathname === '/admin/login' || pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/dashboard';
    return NextResponse.redirect(url);
  }

  // No portal redirection needed – customers stay on /login or /register
  // (Removed legacy portal handling)

  // Protect /profil and /profile routes: ensure customer is authenticated
  if (pathname.startsWith('/profil') || pathname.startsWith('/profile')) {
    if (isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/dashboard';
      return NextResponse.redirect(url);
    }
    const token = request.cookies.get(CUSTOMER_COOKIE)?.value;
    const ok = await isValidToken(token, 'customer');
    if (!ok) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/register',
    // '/portal/:path*' removed
    '/profil/:path*',
    '/profil',
    '/profile/:path*',
    '/profile',
    '/admin',
    '/admin/:path*'
  ],
};
