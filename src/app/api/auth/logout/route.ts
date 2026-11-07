// ==========================================
// FACTORYSTOCK — API: LOGOUT
// ==========================================
import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true, message: 'Sesión cerrada correctamente' });
    response.cookies.delete('factory_stock_session');
    response.cookies.set('factory_stock_session', '', {
      httpOnly: true,
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Error cerrando sesión' }, { status: 500 });
  }
}
