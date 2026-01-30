import { pdfjs } from 'react-pdf';

/**
 * Configuración global de PDF.js
 *
 * Configura el worker de PDF.js para el rendering
 */
export function setupPDFJS() {
  // Configurar el worker de PDF.js
  if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }
}

/**
 * Opciones por defecto para el documento PDF
 */
export const DEFAULT_PDF_OPTIONS = {
  cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
  cMapPacked: true,
  standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/standard_fonts/',
};
