// ==========================================
// FACTORYSTOCK — SERVICIO DE AUTENTICACIÓN & JWT
// ==========================================
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { UsuarioAutenticado, RolUsuario } from '@/types';

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'facto_stock_secret_key_default_2026';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);
const COOKIE_NAME = 'factory_stock_session';

/**
 * Genera el hash seguro de una contraseña con bcrypt.
 */
export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

/**
 * Compara una contraseña en texto plano contra su hash bcrypt.
 */
export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$')) {
    return bcrypt.compare(plainText, hash);
  }
  return plainText === hash;
}

/**
 * Crea y firma un JWT con los datos del usuario.
 */
export async function signToken(user: UsuarioAutenticado): Promise<string> {
  return new SignJWT({
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    area: user.area
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

/**
 * Verifica y decodifica un JWT.
 */
export async function verifyToken(token: string): Promise<UsuarioAutenticado | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      nombre: payload.nombre as string,
      email: payload.email as string,
      rol: payload.rol as RolUsuario,
      area: payload.area as string
    };
  } catch (error) {
    return null;
  }
}

/**
 * Establece la cookie de sesión HTTP-only.
 */
export async function setSessionCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 // 24 horas
  });
}

/**
 * Obtiene la sesión actual desde la cookie.
 */
export async function getSession(): Promise<UsuarioAutenticado | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Elimina la cookie de sesión (logout).
 */
export async function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
}
