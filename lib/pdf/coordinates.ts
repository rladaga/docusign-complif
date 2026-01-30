export interface Dimensions {
  width: number;
  height: number;
}

export interface Rect extends Dimensions {
  x: number;
  y: number;
}

export interface PageInfo extends Dimensions {
  scale?: number; // El zoom que usaste en el Builder (ej: 1.5)
}

/**
 * Convierte coordenadas de Pantalla (Top-Left) a PDF (Bottom-Left)
 * y ajusta la escala.
 */
export function screenToPDF(rect: Rect, page: PageInfo): Rect {
  // 1. Definir la escala. Si no se pasa, asumimos 1.5 que es el default de tu Builder.
  // IMPORTANTE: Si cambias el scale en el Builder, tenés que cambiarlo acá.
  const scale = page.scale || 1.5;

  // 2. Des-escalar (volver al tamaño real del PDF en puntos)
  const realX = rect.x / scale;
  const realY = rect.y / scale;
  const realWidth = rect.width / scale;
  const realHeight = rect.height / scale;

  // 3. Invertir el eje Y
  // En PDF: Y = AlturaPagina - Y_Pantalla - AlturaObjeto
  const pdfY = page.height - realY - realHeight;

  return {
    x: realX,
    y: pdfY,
    width: realWidth,
    height: realHeight,
  };
}
