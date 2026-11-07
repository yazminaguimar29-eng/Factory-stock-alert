// ==========================================
// FACTORYSTOCK — SERVICIO DE ENVÍO DE CORREOS (NODEMAILER)
// ==========================================
import nodemailer from 'nodemailer';
import { Producto, TipoAlerta } from '@/types';

interface EmailAlertParams {
  producto: Producto;
  tipoAlerta: TipoAlerta;
}

/**
 * Crea el transporter de Nodemailer basado en variables de entorno.
 */
function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.ethereal.email';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!user || !pass) {
    // Si no hay credenciales SMTP configuradas, retornamos null para simular el envío
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Envía una notificación de alerta automática industrial por correo a ADMIN_EMAIL y COMPRAS_EMAIL.
 */
export async function sendInventoryAlertEmail({ producto, tipoAlerta }: EmailAlertParams): Promise<{ sent: boolean; recipients: string }> {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@factorystock.com';
  const comprasEmail = process.env.COMPRAS_EMAIL || 'compras@factorystock.com';
  const recipients = `${adminEmail}, ${comprasEmail}`;

  const esCritica = tipoAlerta === 'STOCK_BAJO';
  const subject = esCritica
    ? `🚨 [ALERTA ROJA - FACTORYSTOCK] Stock Crítico: SKU ${producto.codigo_sku} (${producto.nombre})`
    : `⚠️ [ALERTA AMARILLA - FACTORYSTOCK] Sobrestock Detectado: SKU ${producto.codigo_sku} (${producto.nombre})`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f1f5f9; padding: 24px; }
        .card { background-color: #1e293b; border-radius: 8px; border: 1px solid #334155; max-width: 600px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5); }
        .header { background-color: ${esCritica ? '#991b1b' : '#b45309'}; color: #ffffff; padding: 20px 24px; }
        .header h1 { margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 24px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 24px; }
        th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #334155; font-size: 14px; }
        th { color: #94a3b8; width: 40%; font-weight: 600; }
        td { color: #f8fafc; font-weight: 500; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; background: ${esCritica ? '#ef4444' : '#f59e0b'}; color: #000; }
        .footer { padding: 16px 24px; background-color: #0b1120; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #1e293b; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>${esCritica ? '🚨 ALERTA CRÍTICA DE ALMACÉN' : '⚠️ AVISO DE SOBRESTOCK'}</h1>
          <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">FactoryStock — Sistema de Control de Inventario Industrial</p>
        </div>
        <div class="content">
          <p style="margin-top: 0; font-size: 15px; line-height: 1.5;">
            ${esCritica
              ? `El material <strong>${producto.nombre}</strong> ha alcanzado o está por debajo de su nivel mínimo de seguridad. Se requiere acción inmediata del departamento de Compras para evitar paros de línea.`
              : `El material <strong>${producto.nombre}</strong> ha superado su nivel máximo de referencia en almacén.`}
          </p>

          <table>
            <tr>
              <th>SKU / Código</th>
              <td><strong>${producto.codigo_sku}</strong></td>
            </tr>
            <tr>
              <th>Material</th>
              <td>${producto.nombre}</td>
            </tr>
            <tr>
              <th>Categoría</th>
              <td>${producto.categoria}</td>
            </tr>
            <tr>
              <th>Stock Actual</th>
              <td><span class="badge">${producto.stock_actual} ${producto.unidad_medida}</span></td>
            </tr>
            <tr>
              <th>${esCritica ? 'Stock Mínimo Permitido' : 'Stock Máximo de Referencia'}</th>
              <td>${esCritica ? producto.stock_min : producto.stock_max} ${producto.unidad_medida}</td>
            </tr>
            <tr>
              <th>Ubicación Física</th>
              <td><code>${producto.ubicacion_anaquel}</code></td>
            </tr>
            <tr>
              <th>Proveedor Habitual</th>
              <td>${producto.proveedor_principal || 'No especificado'}</td>
            </tr>
          </table>

          <div style="background-color: #0f172a; padding: 12px 16px; border-left: 4px solid ${esCritica ? '#ef4444' : '#f59e0b'}; border-radius: 4px; font-size: 13px; color: #cbd5e1;">
            <strong>Recomendación Operativa:</strong> ${esCritica
              ? 'Verificar requisición de compra inmediata y confirmar fecha de entrega con el proveedor.'
              : 'Verificar plan de producción para programar consumo antes de recepcionar más órdenes.'}
          </div>
        </div>
        <div class="footer">
          Notificación automática enviada a: ${recipients}<br/>
          Generada por FactoryStock © ${new Date().getFullYear()} — Planta de Producción
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.log(`[SIMULACIÓN NODEMAILER] Correo de alerta (${tipoAlerta}) generado para ${recipients} (SKU: ${producto.codigo_sku}). Credenciales SMTP no configuradas en .env.local.`);
      return { sent: true, recipients };
    }

    const fromAddress = process.env.SMTP_FROM || `"FactoryStock Alertas" <${process.env.SMTP_USER}>`;
    await transporter.sendMail({
      from: fromAddress,
      to: recipients,
      subject,
      html,
    });

    console.log(`[NODEMAILER] Correo de alerta enviado exitosamente a: ${recipients}`);
    return { sent: true, recipients };
  } catch (error) {
    console.error('[NODEMAILER ERROR] Error al enviar correo de alerta:', error);
    return { sent: false, recipients };
  }
}
