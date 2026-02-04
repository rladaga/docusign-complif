export interface PageInfo {
  width: number;
  height: number;
  scale: number;
}

export interface Coordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Convierte coordenadas de pantalla (Top-Left) a coordenadas PDF (Bottom-Left)
 * Útil para guardar la posición de un campo en el backend.
 */
export function screenToPDF(screen: Coordinates, page: PageInfo): Coordinates {
  const { scale, height: pageHeight } = page;

  // Des-escalar dimensiones
  const width = screen.width / scale;
  const height = screen.height / scale;

  // Des-escalar X
  const x = screen.x / scale;

  // Invertir eje Y (PDF es bottom-left)
  // PDF_Y = PageHeight - Unscaled_Screen_Y - Unscaled_Height
  const y = pageHeight - screen.y / scale - height;

  return { x, y, width, height };
}

/**
 * Convierte coordenadas PDF (Bottom-Left) a coordenadas de pantalla (Top-Left)
 * Útil para renderizar los campos sobre el PDF en el navegador.
 */
export function pdfToScreen(pdf: Coordinates, page: PageInfo): Coordinates {
  const { scale, height: pageHeight } = page;

  // Escalar dimensiones
  const width = pdf.width * scale;
  const height = pdf.height * scale;

  // Escalar X
  const x = pdf.x * scale;

  // Invertir eje Y y escalar
  // Screen_Y = (PageHeight - PDF_Y - PDF_Height) * Scale
  const y = (pageHeight - pdf.y - pdf.height) * scale;

  return { x, y, width, height };
}

export function normalizeCoordinates(coords: Coordinates, page: PageInfo): Coordinates {
  const maxWidth = page.width * page.scale;
  const maxHeight = page.height * page.scale;

  let { x, y, width, height } = coords;

  // Clamp (restringir) para que no se salga de la página
  x = Math.max(0, Math.min(x, maxWidth - width));
  y = Math.max(0, Math.min(y, maxHeight - height));

  return { x, y, width, height };
}
