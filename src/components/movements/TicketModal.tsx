'use client';

import React from 'react';
import { Printer, X, FileText, CheckCircle, FileDown, LogOut } from 'lucide-react';
import { TicketSalida } from '@/types';

interface TicketModalProps {
  ticket: TicketSalida | null;
  onClose: () => void;
}

export function TicketModal({ ticket, onClose }: TicketModalProps) {
  if (!ticket) return null;

  const handlePrintPdf = () => {
    const printContent = document.getElementById('printable-ticket');
    if (!printContent) {
      window.print();
      return;
    }

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      const prevTitle = document.title;
      document.title = `Ticket_${ticket.folio_vale}`;
      window.print();
      document.title = prevTitle;
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Ticket_${ticket.folio_vale}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #0f172a;
            background: #ffffff;
            padding: 32px;
          }
          .ticket-box {
            max-width: 640px;
            margin: 0 auto;
            border: 2px solid #0f172a;
            border-radius: 12px;
            padding: 28px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .badge {
            display: inline-block;
            background: #f59e0b;
            color: #000;
            font-weight: 900;
            font-size: 11px;
            padding: 4px 12px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
            border: 1px solid #000;
            margin-bottom: 6px;
          }
          .title {
            font-size: 26px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .subtitle {
            font-size: 12px;
            color: #475569;
            margin-top: 2px;
          }
          .folio {
            display: inline-block;
            margin-top: 10px;
            padding: 6px 14px;
            background: #f1f5f9;
            border: 1.5px solid #0f172a;
            border-radius: 6px;
            font-family: monospace;
            font-weight: 900;
            font-size: 14px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 20px;
            font-size: 13px;
          }
          .meta-label { color: #64748b; display: block; font-size: 11px; text-transform: uppercase; font-weight: 700; }
          .meta-val { font-weight: 800; color: #0f172a; font-size: 14px; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border: 1.5px solid #0f172a;
          }
          th {
            background: #e2e8f0;
            color: #0f172a;
            text-transform: uppercase;
            font-size: 11px;
            font-weight: 900;
            padding: 10px 12px;
            border-bottom: 1.5px solid #0f172a;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #cbd5e1;
            font-size: 13px;
          }
          .text-right { text-align: right; }
          .qty-row td {
            background: #fef3c7;
            font-weight: 900;
            font-size: 15px;
          }
          .info-box {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 14px 16px;
            margin-bottom: 28px;
            font-size: 13px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px dashed #e2e8f0;
          }
          .info-row:last-child { border-bottom: none; }
          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 48px;
            text-align: center;
            font-size: 12px;
          }
          .sig-line {
            border-top: 1.5px solid #0f172a;
            padding-top: 8px;
          }
          .footer {
            text-align: center;
            font-size: 11px;
            color: #64748b;
            margin-top: 24px;
            padding-top: 12px;
            border-top: 1px solid #cbd5e1;
          }
          @media print {
            body { padding: 0; }
            .ticket-box { border: 2px solid #000; }
          }
        </style>
      </head>
      <body>
        <div class="ticket-box">
          <div class="header">
            <div class="badge">Comprobante Oficial de Almacén</div>
            <div class="title">FactoryStock</div>
            <div class="subtitle">Control de Inventario de Almacén Industrial &bull; Planta de Manufactura</div>
            <div class="folio">FOLIO VALE: ${ticket.folio_vale}</div>
          </div>

          <div class="meta-grid">
            <div>
              <span class="meta-label">Fecha de Entrega</span>
              <span class="meta-val">${ticket.fecha}</span>
            </div>
            <div>
              <span class="meta-label">Hora de Registro</span>
              <span class="meta-val">${ticket.hora}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align:left;">Concepto</th>
                <th class="text-right">Detalle</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>SKU / Clave</td>
                <td class="text-right" style="font-family:monospace;font-weight:800;">${ticket.producto_sku}</td>
              </tr>
              <tr>
                <td>Material / Producto</td>
                <td class="text-right" style="font-weight:800;">${ticket.producto_nombre}</td>
              </tr>
              <tr class="qty-row">
                <td>Cantidad Entregada</td>
                <td class="text-right">${ticket.cantidad} ${ticket.unidad_medida}</td>
              </tr>
              <tr>
                <td>Ubicación Almacén</td>
                <td class="text-right" style="font-family:monospace;font-weight:700;">${ticket.ubicacion_anaquel}</td>
              </tr>
            </tbody>
          </table>

          <div class="info-box">
            <div class="info-row">
              <span>Área Solicitante:</span>
              <strong>${ticket.area_solicitante}</strong>
            </div>
            <div class="info-row">
              <span>Responsable que Recibe:</span>
              <strong>${ticket.responsable_recibe}</strong>
            </div>
            <div class="info-row">
              <span>Orden de Trabajo / Motivo:</span>
              <strong style="font-family:monospace;">${ticket.motivo_orden_trabajo}</strong>
            </div>
            <div class="info-row">
              <span>Almacenista que Entrega:</span>
              <strong>${ticket.usuario_almacenista}</strong>
            </div>
          </div>

          <div class="signatures">
            <div class="sig-line">
              <strong>${ticket.usuario_almacenista}</strong>
              <div>Entrega (Almacén)</div>
            </div>
            <div class="sig-line">
              <strong>${ticket.responsable_recibe}</strong>
              <div>Recibe (Conformidad)</div>
            </div>
          </div>

          <div class="footer">
            Documento de control interno inmutable &bull; Generado automáticamente por FactoryStock
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 250);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:p-0 print:bg-white">
      {/* Contenedor del Ticket */}
      <div className="bg-slate-900 border-2 border-violet-500/60 w-full max-w-lg rounded-tl-3xl rounded-br-3xl overflow-hidden shadow-2xl print:border-none print:shadow-none print:w-full print:max-w-none print:text-black print:bg-white">
        
        {/* Cabecera modal (oculta al imprimir) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950 print:hidden">
          <div className="flex items-center gap-2 text-emerald-400 font-black text-sm uppercase tracking-wide">
            <CheckCircle className="w-5 h-5" />
            <span>Ticket de Salida Generado</span>
          </div>
          <button
            onClick={onClose}
            title="Salir del Ticket"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-black rounded-tl-lg rounded-br-lg transition-colors shadow-md"
          >
            <X className="w-4 h-4" />
            <span>Salir</span>
          </button>
        </div>

        {/* CONTENIDO DEL TICKET IMPRIMIBLE */}
        <div id="printable-ticket" className="p-8 space-y-6 text-slate-100 print:text-black print:p-6">
          
          {/* Encabezado Industrial */}
          <div className="text-center border-b border-slate-700 pb-4 print:border-black">
            <div className="inline-block bg-amber-400 text-slate-950 font-black text-xs px-3 py-0.5 rounded tracking-widest uppercase mb-1 print:border print:border-black">
              Comprobante Oficial de Almacén
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white print:text-black uppercase">
              FactoryStock
            </h1>
            <p className="text-xs text-slate-300 print:text-gray-600">
              Control de Inventario de Almacén Industrial &bull; Planta de Manufactura
            </p>
            <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1 bg-slate-800 rounded-md border border-amber-400/50 text-xs font-mono font-black text-amber-300 print:bg-gray-100 print:text-black print:border-black">
              <FileText className="w-3.5 h-3.5" />
              FOLIO VALE: {ticket.folio_vale}
            </div>
          </div>

          {/* Datos de Emisión */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 print:bg-gray-50 print:border-gray-300">
            <div>
              <span className="text-slate-300 print:text-gray-600 block">Fecha de Entrega:</span>
              <strong className="text-white print:text-black text-sm">{ticket.fecha}</strong>
            </div>
            <div>
              <span className="text-slate-300 print:text-gray-600 block">Hora de Registro:</span>
              <strong className="text-white print:text-black text-sm">{ticket.hora}</strong>
            </div>
          </div>

          {/* Detalle del Material Entregado */}
          <div className="border border-slate-700 rounded-lg overflow-hidden print:border-black">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white uppercase tracking-wider print:bg-gray-200 print:text-black">
                  <th className="p-2.5 font-black">Concepto</th>
                  <th className="p-2.5 font-black text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-300">
                <tr>
                  <td className="p-2.5 text-slate-300 print:text-gray-700">SKU / Clave</td>
                  <td className="p-2.5 font-mono font-black text-white print:text-black text-right">
                    {ticket.producto_sku}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-300 print:text-gray-700">Material / Producto</td>
                  <td className="p-2.5 font-bold text-white print:text-black text-right">
                    {ticket.producto_nombre}
                  </td>
                </tr>
                <tr className="bg-slate-950/60 print:bg-gray-100">
                  <td className="p-2.5 font-black text-white print:text-black">Cantidad Entregada</td>
                  <td className="p-2.5 font-black text-amber-300 print:text-black text-base text-right">
                    {ticket.cantidad} {ticket.unidad_medida}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-300 print:text-gray-700">Ubicación Almacén</td>
                  <td className="p-2.5 font-mono font-bold text-white print:text-black text-right">
                    {ticket.ubicacion_anaquel}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Trazabilidad y Destino */}
          <div className="space-y-2 text-xs bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 print:bg-white print:border-gray-300">
            <div className="flex justify-between">
              <span className="text-slate-300 print:text-gray-600">Área Solicitante:</span>
              <strong className="text-white print:text-black">{ticket.area_solicitante}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300 print:text-gray-600">Responsable que Recibe:</span>
              <strong className="text-white print:text-black">{ticket.responsable_recibe}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300 print:text-gray-600">Orden de Trabajo / Motivo:</span>
              <strong className="text-amber-300 print:text-black font-mono">{ticket.motivo_orden_trabajo}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-300 print:text-gray-600">Almacenista que Entrega:</span>
              <strong className="text-white print:text-black">{ticket.usuario_almacenista}</strong>
            </div>
          </div>

          {/* Firmas de Conformidad */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs print:pt-12">
            <div className="border-t border-slate-600 pt-2 print:border-black">
              <p className="font-bold text-white print:text-black">{ticket.usuario_almacenista}</p>
              <p className="text-[10px] text-slate-300 print:text-gray-600">Entrega (Almacén)</p>
            </div>
            <div className="border-t border-slate-600 pt-2 print:border-black">
              <p className="font-bold text-white print:text-black">{ticket.responsable_recibe}</p>
              <p className="text-[10px] text-slate-300 print:text-gray-600">Recibe (Conformidad)</p>
            </div>
          </div>

          {/* Pie de ticket */}
          <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-800 print:border-gray-300 print:text-gray-500">
            Documento de control interno inmutable &bull; Generado automáticamente por FactoryStock
          </div>

        </div>

        {/* Acciones del Modal (oculto al imprimir) */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-950 border-t border-slate-800 print:hidden">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-500 border border-rose-400/60 rounded-tl-xl rounded-br-xl transition-colors shadow-lg shadow-rose-950/50"
          >
            <LogOut className="w-4 h-4" />
            <span>Salir del Ticket</span>
          </button>

          <button
            onClick={handlePrintPdf}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 border border-amber-200 rounded-tl-xl rounded-br-xl transition-colors shadow-lg shadow-amber-400/30"
          >
            <Printer className="w-4 h-4" />
            <FileDown className="w-4 h-4" />
            <span>Imprimir / Guardar PDF</span>
          </button>
        </div>

      </div>
    </div>
  );
}
