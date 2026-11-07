// ==========================================
// FACTORYSTOCK — API: GESTIÓN DE USUARIOS (SOLO ADMIN)
// ==========================================
import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/data-store';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado. Inicie sesión.' }, { status: 401 });
    }

    if (session.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permisos insuficientes. Solo el Administrador puede consultar usuarios.' },
        { status: 403 }
      );
    }

    const usuarios = await dataStore.getUsuarios();
    // Excluir password_hash de la respuesta
    const safeUsuarios = usuarios.map(({ password_hash, ...u }) => u);

    return NextResponse.json({ usuarios: safeUsuarios });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json(
      { error: 'No fue posible comunicarse con el servidor. Intente nuevamente.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado. Inicie sesión.' }, { status: 401 });
    }

    if (session.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permisos insuficientes. Solo el Administrador puede registrar usuarios.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { nombre, email, password, rol, area } = body;

    if (!nombre || !email || !password || !rol) {
      return NextResponse.json(
        { error: 'Nombre, email, contraseña y rol son obligatorios.' },
        { status: 400 }
      );
    }

    const rolesValidos = ['ADMIN', 'ALMACENISTA', 'JEFE_AREA'];
    if (!rolesValidos.includes(rol)) {
      return NextResponse.json(
        { error: 'El rol especificado no es válido.' },
        { status: 400 }
      );
    }

    const nuevo = await dataStore.createUsuario({
      nombre,
      email,
      password_plain: password,
      rol,
      area: area || 'Planta General',
    });

    const { password_hash, ...safeUser } = nuevo;

    return NextResponse.json({
      success: true,
      usuario: safeUser,
      message: 'Usuario creado exitosamente.',
    });
  } catch (error: any) {
    console.error('Error al crear usuario:', error);
    return NextResponse.json(
      { error: error.message || 'No fue posible crear el usuario.' },
      { status: 500 }
    );
  }
}
