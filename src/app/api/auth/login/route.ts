// ==========================================
// FACTORYSTOCK — API: LOGIN
// ==========================================
import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { verifyPassword, signToken, setSessionCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Debe ingresar correo y contraseña.' },
        { status: 400 }
      );
    }

    const usuario = await dataStore.getUsuarioByEmail(email);
    if (!usuario) {
      return NextResponse.json(
        { error: 'El correo o contraseña son incorrectos.' },
        { status: 401 }
      );
    }

    const passwordValida = await verifyPassword(password, usuario.password_hash);
    if (!passwordValida) {
      return NextResponse.json(
        { error: 'El correo o contraseña son incorrectos.' },
        { status: 401 }
      );
    }

    const userPayload = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      area: usuario.area,
    };

    const token = await signToken(userPayload);
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: userPayload,
      message: 'Inicio de sesión exitoso',
    });
  } catch (error: any) {
    console.error('Error en /api/auth/login:', error);
    return NextResponse.json(
      { error: 'No fue posible comunicarse con el servidor. Intente nuevamente.' },
      { status: 500 }
    );
  }
}
