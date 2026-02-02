import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FieldToolbar } from '@/components/pdf-builder/FieldToolbar';
import { FieldType } from '@/lib/types/template';

// Mock de lucide-react para evitar problemas con los iconos en el entorno de test
vi.mock('lucide-react', () => ({
  FileSignature: () => <svg data-testid="icon-signature" />,
  Type: () => <svg data-testid="icon-text" />,
  Calendar: () => <svg data-testid="icon-date" />,
  CheckSquare: () => <svg data-testid="icon-checkbox" />,
  PenTool: () => <svg data-testid="icon-initials" />,
}));

describe('FieldToolbar Component', () => {
  it('debe renderizar correctamente el título', () => {
    const mockOnAddField = vi.fn();
    render(<FieldToolbar onAddField={mockOnAddField} />);

    expect(screen.getByText('Agregar Campo')).toBeDefined();
  });

  it('debe renderizar todos los botones de tipos de campo', () => {
    const mockOnAddField = vi.fn();
    render(<FieldToolbar onAddField={mockOnAddField} />);

    expect(screen.getByText('Firma')).toBeDefined();
    expect(screen.getByText('Texto')).toBeDefined();
    expect(screen.getByText('Fecha')).toBeDefined();
    expect(screen.getByText('Checkbox')).toBeDefined();
    expect(screen.getByText('Iniciales')).toBeDefined();
  });

  it('debe llamar a onAddField con el tipo correcto al hacer clic', () => {
    const mockOnAddField = vi.fn();
    render(<FieldToolbar onAddField={mockOnAddField} />);

    // Simular clic en el botón de "Texto"
    const textButton = screen.getByText('Texto');
    fireEvent.click(textButton);

    // Verificar que se llamó a la función con FieldType.TEXT
    expect(mockOnAddField).toHaveBeenCalledTimes(1);
    expect(mockOnAddField).toHaveBeenCalledWith(FieldType.TEXT);
  });
});
