// ==========================================
// FACTORYSTOCK — API: RECUPERACIÓN / VERIFICACIÓN DE CUENTA
// ==========================================
import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Debe ingresar su correo electrónico institucional.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const usuario = await dataStore.getUsuarioByEmail(cleanEmail);

    if (!usuario) {
      return NextResponse.json(
        { error: 'No se encontró ninguna cuenta activa con ese correo electrónico.' },
        { status: 404 }
      );
    }

    // Retornamos el nombre y correo para confirmar la identidad al usuario
    return NextResponse.json({
      success: true,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      area: usuario.area,
      message: 'Cuenta verificada exitosamente. Proceda a ingresar su nueva contraseña.',
    });
  } catch (error: any) {
    console.error('Error en /api/auth/recover:', error);
    return NextResponse.json(
      { error: 'Error al verificar la cuenta. Intente nuevamente.' },
      { status: 500 }
    );
  }
}
