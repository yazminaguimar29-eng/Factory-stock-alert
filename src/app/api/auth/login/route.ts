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

    // Registrar en la Bitácora de Auditoría
    try {
      const userAgent = request.headers.get('user-agent') || 'Dispositivo desconocido';
      const forwarded = request.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

      await dataStore.appendAuditLog({
        usuario_nombre: usuario.nombre,
        usuario_email: usuario.email,
        usuario_rol: usuario.rol,
        tipo_accion: 'INICIO_SESION',
        detalles: `Inicio de sesión exitoso en el sistema de almacén (Área: ${usuario.area})`,
        dispositivo: userAgent.slice(0, 80),
        ip,
      });
    } catch (e) {
      console.warn('No se pudo registrar log de auditoría:', e);
    }

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
