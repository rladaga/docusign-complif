import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SignerPanel } from '@/components/pdf-builder/SignerPanel';
import { useTemplateStore } from '@/lib/store/template-store';
import { useSchemaStore } from '@/lib/store/schema-store';

describe('SignerPanel Component', () => {
  beforeEach(() => {
    useTemplateStore.getState().reset();
    useTemplateStore.getState().createTemplate('acc-1', 'Test', 'url', 'file.pdf', 1);

    // Setup schema store with a group
    useSchemaStore.setState({
      schemas: [
        {
          id: 's1',
          accountId: 'acc-1',
          name: 'S1',
          groups: [{ id: 'g1', name: 'Legal', schemaId: 's1', createdAt: new Date() }],
          rules: [],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      activeSchemaId: 's1',
    });
  });

  it('should render empty state initially', () => {
    render(<SignerPanel />);
    expect(screen.getByText('No hay roles definidos')).toBeDefined();
  });

  it('should allow adding a generic role', () => {
    render(<SignerPanel />);

    // Click Add button
    fireEvent.click(screen.getByTitle('Agregar Rol'));

    // Click Generic Role button
    fireEvent.click(screen.getByText('+ Rol Genérico (Sin Grupo)'));

    expect(useTemplateStore.getState().currentTemplate!.signers).toHaveLength(1);
    expect(screen.getByDisplayValue('Nuevo Rol')).toBeDefined();
  });

  it('should allow adding a group role', () => {
    render(<SignerPanel />);

    fireEvent.click(screen.getByTitle('Agregar Rol'));
    fireEvent.click(screen.getByText('Legal'));

    const signers = useTemplateStore.getState().currentTemplate!.signers;
    expect(signers).toHaveLength(1);
    expect(signers[0].name).toBe('Legal');
    expect(signers[0].linkedGroupId).toBe('g1');
  });

  it('should update signer name', () => {
    useTemplateStore.getState().addSigner('Signer 1');
    render(<SignerPanel />);

    const input = screen.getByDisplayValue('Signer 1');
    fireEvent.change(input, { target: { value: 'Updated Name' } });

    expect(useTemplateStore.getState().currentTemplate!.signers[0].name).toBe('Updated Name');
  });
});
