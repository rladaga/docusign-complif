import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Field } from '@/lib/types/template';
import { screenToPDF } from './coordinates';

export interface SignatureInfo {
  fieldId: string;
  signerId: string;
  signerName: string;
  signerEmail: string;
  signatureDataUrl: string;
  timestamp: string;
  ip?: string;
  type: string;
}

export interface GeneratePDFOptions {
  originalPdfBytes: Uint8Array;
  fields: Field[];
  signatures: SignatureInfo[];
  includeAuditTrail?: boolean;
}

export async function generateSignedPDF(options: GeneratePDFOptions): Promise<Uint8Array> {
  const { originalPdfBytes, fields, signatures, includeAuditTrail = true } = options;

  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  const pages = pdfDoc.getPages();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const monoFont = await pdfDoc.embedFont(StandardFonts.Courier);

  for (const signature of signatures) {
    const field = fields.find((f) => f.id === signature.fieldId);
    if (!field) continue;

    const pageIndex = (field.position.page || 1) - 1;
    if (pageIndex >= pages.length) continue;

    const page = pages[pageIndex];
    const { width: pageWidth, height: pageHeight } = page.getSize();
    const rotation = page.getRotation().angle;

    // Solo procesar páginas portrait (sin rotación o rotación 0/180)
    if (rotation === 90 || rotation === 270) {
      console.warn(
        `⚠️ Página ${field.position.page} tiene rotación ${rotation}° (landscape). Esta funcionalidad no está soportada actualmente.`
      );
      continue;
    }

    const pdfCoords = screenToPDF(
      {
        x: field.position.x,
        y: field.position.y,
        width: field.position.width,
        height: field.position.height,
      },
      {
        width: pageWidth,
        height: pageHeight,
        scale: 1.5,
      }
    );

    // DIBUJAR SEGÚN TIPO
    if (signature.type === 'signature' || signature.type === 'initials') {
      try {
        const signatureImage = await pdfDoc.embedPng(signature.signatureDataUrl);
        page.drawImage(signatureImage, {
          x: pdfCoords.x,
          y: pdfCoords.y,
          width: pdfCoords.width,
          height: pdfCoords.height,
        });
      } catch (e) {
        console.error('Error dibujando imagen:', e);
      }
    } else {
      let textToDraw = signature.signatureDataUrl;
      if (signature.type === 'checkbox') {
        textToDraw = textToDraw === 'checked' ? 'X' : '';
      }

      const fontSize = 10;
      const textY = pdfCoords.y + pdfCoords.height / 2 - fontSize / 2 + 2;

      page.drawText(textToDraw, {
        x: pdfCoords.x + 2,
        y: textY,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
  }

  // 4. Agregar Audit Trail (Hoja de Certificado)
  if (includeAuditTrail && signatures.length > 0) {
    const auditPage = pdfDoc.addPage();
    const { width, height } = auditPage.getSize();
    let y = height - 50;

    // Header
    auditPage.drawText('Certificado de Finalización', {
      x: 50,
      y,
      size: 18,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.8),
    });
    y -= 30;

    const docHash = await generateDocumentHash(originalPdfBytes);
    auditPage.drawText(`Document ID (Hash): ${docHash.substring(0, 32)}...`, {
      x: 50,
      y,
      size: 10,
      font: monoFont,
      color: rgb(0.5, 0.5, 0.5),
    });
    y -= 40;

    // Tabla de eventos
    auditPage.drawText('Historial de Firmas:', { x: 50, y, size: 14, font: boldFont });
    y -= 20;

    for (const sig of signatures) {
      if (y < 100) {
        // Nueva página si se acaba el espacio
        const newPage = pdfDoc.addPage();
        y = newPage.getSize().height - 50;
      }

      // Dibujar línea de evento
      auditPage.drawText(`• Firmante: ${sig.signerName} (${sig.signerEmail})`, {
        x: 50,
        y,
        size: 10,
        font: boldFont,
      });
      y -= 15;

      auditPage.drawText(`  Fecha: ${new Date(sig.timestamp).toLocaleString()}`, {
        x: 50,
        y,
        size: 9,
        font: font,
      });
      y -= 12;

      auditPage.drawText(
        `  IP: ${sig.ip || '127.0.0.1 (Simulado)'} | Acción: ${sig.type.toUpperCase()}`,
        { x: 50, y, size: 9, font: font, color: rgb(0.4, 0.4, 0.4) }
      );
      y -= 25; // Espacio para el siguiente
    }

    // Footer
    auditPage.drawText('Powered by Complif Challenge', {
      x: 50,
      y: 30,
      size: 8,
      font: font,
      color: rgb(0.6, 0.6, 0.6),
    });
  }

  // 5. Guardar y retornar bytes
  return await pdfDoc.save();
}

/**
 * Genera un hash simple del documento para el ID (Simulado)
 */
async function generateDocumentHash(bytes: Uint8Array): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const buffer = bytes.buffer.slice(0) as ArrayBuffer;
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return 'mock-hash-' + Date.now();
}
