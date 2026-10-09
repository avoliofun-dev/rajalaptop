import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export const CUSTOMER_COOKIE = 'rl_customer';
export const ADMIN_COOKIE = 'rl_admin';

const CUSTOMER_AUD = 'customer';
const ADMIN_AUD = 'admin';
const TOKEN_TTL = '7d';

function getSecretKey() {
  const secret = process.env.AUTH_SECRET || 'rajalaptop-dev-secret-change-me';
  return new TextEncoder().encode(secret);
}

export function hashPassword(password) {
  return bcrypt.hashSync(String(password), 10);
}

export function verifyPassword(password, hash) {
  if (!password || !hash) return false;
  return bcrypt.compareSync(String(password), String(hash));
}

export async function signCustomerToken(payload) {
  return new SignJWT({
    id: payload.id,
    email: payload.email,
    name: payload.name,
    type: CUSTOMER_AUD,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setAudience(CUSTOMER_AUD)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(getSecretKey());
}

export async function signAdminToken(payload) {
  return new SignJWT({
    id: payload.id,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    type: ADMIN_AUD,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setAudience(ADMIN_AUD)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(getSecretKey());
}

async function verifyToken(token, audience) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { audience });
    if (payload.type !== audience) return null;
    return payload;
  } catch {
    return null;
  }
}

export function cookieOptions(maxAgeSeconds = 60 * 60 * 24 * 7) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: maxAgeSeconds,
  };
}

export async function setCustomerCookie(token) {
  const jar = await cookies();
  jar.set(CUSTOMER_COOKIE, token, cookieOptions());
}

export async function setAdminCookie(token) {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, cookieOptions());
}

export async function clearCustomerCookie() {
  const jar = await cookies();
  jar.set(CUSTOMER_COOKIE, '', { ...cookieOptions(0), maxAge: 0 });
}

export async function clearAdminCookie() {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, '', { ...cookieOptions(0), maxAge: 0 });
}

export async function getCustomerFromCookies() {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  return verifyToken(token, CUSTOMER_AUD);
}

export async function getAdminFromCookies() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  return verifyToken(token, ADMIN_AUD);
}

/** Edge-safe verify from raw cookie string (for middleware). */
export async function verifyCustomerToken(token) {
  return verifyToken(token, CUSTOMER_AUD);
}

export async function verifyAdminToken(token) {
  return verifyToken(token, ADMIN_AUD);
}
