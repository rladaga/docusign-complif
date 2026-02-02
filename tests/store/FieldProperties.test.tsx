import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FieldProperties } from '@/components/pdf-builder/FieldProperties';
import { useTemplateStore } from '@/lib/store/template-store';
import { FieldType } from '@/lib/types';

describe('FieldProperties Component', () => {
  beforeEach(() => {
    useTemplateStore.getState().reset();
    useTemplateStore.getState().createTemplate('acc-1', 'Test', 'url', 'file.pdf', 1);
  });

  it('should render empty state when no field is selected', () => {
    render(<FieldProperties />);
    expect(screen.getByText(/Selecciona un campo/i)).toBeDefined();
  });

  it('should render properties when a field is selected', () => {
    const { addField, selectField } = useTemplateStore.getState();
    addField(FieldType.TEXT, { page: 1, x: 0, y: 0, width: 100, height: 20 }, '');
    const fieldId = useTemplateStore.getState().currentTemplate!.fields[0].id;
    selectField(fieldId);

    render(<FieldProperties />);
    expect(screen.getByText('Propiedades')).toBeDefined();
    expect(screen.getByText('Asignado a (Rol)')).toBeDefined();
  });

  it('should update field required property', () => {
    const { addField, selectField } = useTemplateStore.getState();
    addField(FieldType.TEXT, { page: 1, x: 0, y: 0, width: 100, height: 20 }, '');
    const fieldId = useTemplateStore.getState().currentTemplate!.fields[0].id;
    selectField(fieldId);

    render(<FieldProperties />);

    const checkbox = screen.getByLabelText('Obligatorio');
    fireEvent.click(checkbox);

    const updatedField = useTemplateStore.getState().currentTemplate!.fields[0];
    expect(updatedField.required).toBe(false); // Default is true, click makes it false
  });

  it('should delete field', () => {
    const { addField, selectField } = useTemplateStore.getState();
    addField(FieldType.TEXT, { page: 1, x: 0, y: 0, width: 100, height: 20 }, '');
    const fieldId = useTemplateStore.getState().currentTemplate!.fields[0].id;
    selectField(fieldId);

    render(<FieldProperties />);

    // Find delete button (Trash icon)
    const deleteBtn = screen.getByRole('button');
    fireEvent.click(deleteBtn);

    expect(useTemplateStore.getState().currentTemplate!.fields).toHaveLength(0);
  });
});
