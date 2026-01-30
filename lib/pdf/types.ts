// Remover FieldType duplicado, importarlo del tipo original
import type { FieldType } from '@/lib/types/template';
import type { PDFCoordinates, ScreenCoordinates } from './coordinates';

/**
 * Estado del campo en el formulario
 */
export interface FieldState {
  id: string;
  type: FieldType;
  position: ScreenCoordinates & { page: number };
  value?: string | boolean;
  isSelected?: boolean;
  isDragging?: boolean;
}

/**
 * Información de la página PDF cargada
 */
export interface LoadedPage {
  pageNumber: number;
  width: number;
  height: number;
  scale: number;
}

// Re-exportar para conveniencia
export type { FieldType };
