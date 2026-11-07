// ==========================================
// FACTORYSTOCK — API: REGISTRO DE CUENTA NUEVA
// ==========================================
import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { signToken, setSessionCookie } from '@/lib/auth';
import { RolUsuario } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, email, password, rol, area } = body;

    if (!nombre || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre, correo electrónico y contraseña son obligatorios.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { error: 'Ingrese un formato de correo electrónico válido.' },
        { status: 400 }
      );
    }

    // Verificar si ya existe
    const existing = await dataStore.getUsuarioByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta registrada con este correo electrónico.' },
        { status: 400 }
      );
    }

    // Rol y área
    const allowedRoles: RolUsuario[] = ['ALMACENISTA', 'JEFE_AREA', 'ADMIN'];
    const selectedRol: RolUsuario = allowedRoles.includes(rol) ? rol : 'ALMACENISTA';
    const selectedArea = area && area.trim() ? area.trim() : (selectedRol === 'ALMACENISTA' ? 'Almacén Central' : 'Producción Línea 1');

    // Crear usuario (dataStore hashea automáticamente la contraseña con bcrypt y la guarda cifrada en Google Sheets)
    const nuevoUsuario = await dataStore.createUsuario({
      nombre: nombre.trim(),
      email: cleanEmail,
      password_plain: password,
      rol: selectedRol,
      area: selectedArea,
    });

    const userPayload = {
      id: nuevoUsuario.id,
      nombre: nuevoUsuario.nombre,
      email: nuevoUsuario.email,
      rol: nuevoUsuario.rol,
      area: nuevoUsuario.area,
    };

    // Iniciar sesión inmediatamente
    const token = await signToken(userPayload);
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: userPayload,
      message: 'Cuenta creada exitosamente e inicio de sesión completado.',
    });
  } catch (error: any) {
    console.error('Error en /api/auth/register:', error);
    return NextResponse.json(
      { error: error.message || 'No fue posible registrar la cuenta. Intente nuevamente.' },
      { status: 500 }
    );
  }
}
