// ==========================================
// FACTORYSTOCK — MIDDLEWARE DE PROTECCIÓN DE RUTAS
// ==========================================
import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'facto_stock_secret_key_default_2026';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);
const COOKIE_NAME = 'factory_stock_session';

// Rutas protegidas exclusivamente para ADMIN
const ADMIN_ONLY_ROUTES = ['/reportes', '/usuarios'];

// Rutas operativas exclusivas de recepción y auditoría física (ADMIN y ALMACENISTA)
const WAREHOUSE_RESTRICTED_ROUTES = ['/entradas', '/ajustes'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorar archivos estáticos, favicon y API routes que manejan su propia autorización
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  // Si intenta acceder al login teniendo ya sesión válida, redirigir al dashboard
  if (pathname === '/login') {
    if (token) {
      try {
        await jwtVerify(token, JWT_SECRET);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch {
        // Token inválido, continuar a /login
      }
    }
    return NextResponse.next();
  }

  // Rutas de aplicación requieren token
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const rol = payload.rol as string;

    // Control de acceso para rutas exclusivas de ADMIN
    if (ADMIN_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
      if (rol !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url));
      }
    }

    // Control de acceso para rutas exclusivas de personal de almacén
    if (WAREHOUSE_RESTRICTED_ROUTES.some((route) => pathname.startsWith(route))) {
      if (rol === 'JEFE_AREA') {
        return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    // Token expirado o inválido
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
