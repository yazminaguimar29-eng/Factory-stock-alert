import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // 1. Manejo de Multipart FormData
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
      }

      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Formato no permitido. Solo imágenes JPG, PNG, WebP o GIF.' },
          { status: 400 }
        );
      }

      // Validar tamaño (máximo 10 MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'La imagen excede el límite de 10 MB.' },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(file.name) || '.jpg';
      const cleanBase = path
        .basename(file.name, ext)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 30);
      const fileName = `foto_${Date.now()}_${cleanBase}${ext}`;
      const filePath = path.join(uploadsDir, fileName);

      await fs.promises.writeFile(filePath, buffer);

      const publicUrl = `/uploads/${fileName}`;
      return NextResponse.json({
        success: true,
        url: publicUrl,
        fileName,
      });
    }

    // 2. Manejo de JSON con base64 (data:image/...)
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const base64Data = body.image || body.base64;

      if (!base64Data || typeof base64Data !== 'string') {
        return NextResponse.json({ error: 'Campo de imagen base64 no proporcionado' }, { status: 400 });
      }

      // Extraer mimetype y data
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        // Si ya es una URL relativa o pública, devolverla tal cual
        if (base64Data.startsWith('/uploads/') || base64Data.startsWith('http')) {
          return NextResponse.json({ success: true, url: base64Data });
        }
        return NextResponse.json({ error: 'Formato base64 inválido' }, { status: 400 });
      }

      const mimeType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');

      let ext = '.jpg';
      if (mimeType.includes('png')) ext = '.png';
      else if (mimeType.includes('webp')) ext = '.webp';
      else if (mimeType.includes('gif')) ext = '.gif';

      const fileName = `foto_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
      const filePath = path.join(uploadsDir, fileName);

      await fs.promises.writeFile(filePath, buffer);

      const publicUrl = `/uploads/${fileName}`;
      return NextResponse.json({
        success: true,
        url: publicUrl,
        fileName,
      });
    }

    return NextResponse.json(
      { error: 'Content-Type no soportado. Debe ser multipart/form-data o application/json.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[Upload API] Error al guardar imagen:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al procesar imagen' },
      { status: 500 }
    );
  }
}
