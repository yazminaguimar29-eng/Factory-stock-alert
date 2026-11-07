// ==========================================
// FACTORYSTOCK — API: RESTABLECER CONTRASEÑA
// ==========================================
import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, newPassword, confirmPassword } = body;

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Debe ingresar el correo y la nueva contraseña.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe tener al menos 6 caracteres.' },
        { status: 400 }
      );
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Las contraseñas no coinciden. Verifíquelas e intente de nuevo.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    // Actualiza la contraseña en dataStore y en Google Sheets cifrada con hash bcrypt
    await dataStore.resetUsuarioPassword(cleanEmail, newPassword);

    return NextResponse.json({
      success: true,
      message: '¡Contraseña restablecida exitosamente! Ya puedes iniciar sesión con tu nueva contraseña.',
    });
  } catch (error: any) {
    console.error('Error en /api/auth/reset-password:', error);
    return NextResponse.json(
      { error: error.message || 'No fue posible actualizar la contraseña. Intente nuevamente.' },
      { status: 500 }
    );
  }
}
