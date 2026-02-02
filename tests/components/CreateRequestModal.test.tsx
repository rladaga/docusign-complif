import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreateRequestModal } from '@/components/signature-flow/CreateRequestModal';
import { useTemplateStore } from '@/lib/store/template-store';
import { useSchemaStore } from '@/lib/store/schema-store';
import { useSignatureStore } from '@/lib/store/signature-store';
import { Faculty } from '@/lib/types';

describe('CreateRequestModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    useTemplateStore.getState().reset();
    useTemplateStore.getState().createTemplate('acc-1', 'Test Template', 'url', 'file.pdf', 1);
    useTemplateStore.getState().addSigner('Signer 1');

    const template = useTemplateStore.getState().currentTemplate!;

    useSchemaStore.setState({
      schemas: [
        {
          id: 's1',
          accountId: 'acc-1',
          name: 'S1',
          groups: [{ id: 'g1', name: 'Group A', schemaId: 's1', createdAt: new Date() }],
          rules: [
            {
              id: 'r1',
              schemaId: 's1',
              faculty: Faculty.APPROVE_WIRE,
              combinations: [
                {
                  id: 'c1',
                  ruleId: 'r1',
                  requirements: [{ groupId: 'g1', count: 1 }],
                  description: '1 from Group A',
                },
              ],
              createdAt: new Date(),
            },
          ],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      activeSchemaId: 's1',
      signers: [],
    });

    useSignatureStore.setState({ requests: [] });
  });

  it('should render correctly', () => {
    const template = useTemplateStore.getState().currentTemplate!;
    render(
      <CreateRequestModal template={template} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    expect(screen.getByText('Enviar Documento')).toBeDefined();
    expect(screen.getByText('Signer 1')).toBeDefined();
  });

  it('should handle form submission', () => {
    const template = useTemplateStore.getState().currentTemplate!;
    render(
      <CreateRequestModal template={template} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    // Fill signer info
    const nameInputs = screen.getAllByPlaceholderText('Nombre completo');
    fireEvent.change(nameInputs[0], { target: { value: 'John Doe' } });

    const emailInputs = screen.getAllByPlaceholderText('email@ejemplo.com');
    fireEvent.change(emailInputs[0], { target: { value: 'john@example.com' } });

    // Select Group (Required for real combinatorics check)
    const groupOption = screen.getByText('Group A');
    const groupSelect = groupOption.closest('select');
    if (groupSelect) {
      fireEvent.change(groupSelect, { target: { value: 'g1' } });
    }

    // Submit
    const submitBtn = screen.getByText('Crear Solicitud');
    fireEvent.click(submitBtn);

    expect(mockOnSuccess).toHaveBeenCalled();
  });
});
