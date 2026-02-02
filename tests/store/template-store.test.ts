import { describe, it, expect, beforeEach } from 'vitest';
import {
  useTemplateStore,
  selectCurrentTemplate,
  selectSelectedField,
  selectCurrentPageFields,
} from '@/lib/store/template-store';
import { FieldType, SigningOrder } from '@/lib/types';

describe('Template Store', () => {
  // Resetear el store antes de cada test
  beforeEach(() => {
    useTemplateStore.getState().reset();
    useTemplateStore.setState({
      templates: [],
      currentTemplate: null,
      selectedFieldId: null,
      currentPage: 1,
      zoom: 1,
      isDragging: false,
      showGrid: false,
    });
  });

  it('debe crear un nuevo template correctamente', () => {
    const { createTemplate } = useTemplateStore.getState();

    createTemplate('acc-1', 'Contrato Test', 'data:pdf', 'test.pdf', 1);

    const { templates, currentTemplate } = useTemplateStore.getState();

    expect(templates).toHaveLength(1);
    expect(currentTemplate).toBeDefined();
    expect(currentTemplate?.name).toBe('Contrato Test');
    expect(currentTemplate?.accountId).toBe('acc-1');
  });

  it('debe cargar un template existente', () => {
    const { createTemplate, loadTemplate } = useTemplateStore.getState();
    createTemplate('acc-1', 'Template A', 'url', 'a.pdf', 1);
    const id = useTemplateStore.getState().templates[0].id;

    // Deseleccionar
    useTemplateStore.setState({ currentTemplate: null });

    loadTemplate(id);
    expect(useTemplateStore.getState().currentTemplate?.id).toBe(id);
  });

  it('debe guardar cambios en un template', () => {
    const { createTemplate, saveTemplate } = useTemplateStore.getState();
    createTemplate('acc-1', 'Original', 'url', 'file.pdf', 1);

    // Simular cambio en currentTemplate (immer lo hace en acciones, aquí modificamos el objeto ref)
    useTemplateStore.setState((state) => ({
      currentTemplate: { ...state.currentTemplate!, name: 'Modificado' },
    }));

    saveTemplate();

    const saved = useTemplateStore.getState().templates[0];
    expect(saved.name).toBe('Modificado');
    expect(saved.updatedAt).toBeDefined();
  });

  it('debe eliminar un template', () => {
    const { createTemplate, deleteTemplate } = useTemplateStore.getState();
    createTemplate('acc-1', 'To Delete', 'url', 'file.pdf', 1);
    const id = useTemplateStore.getState().templates[0].id;

    deleteTemplate(id);
    expect(useTemplateStore.getState().templates).toHaveLength(0);
    expect(useTemplateStore.getState().currentTemplate).toBeNull();
  });

  it('debe duplicar un template', () => {
    const { createTemplate, duplicateTemplate } = useTemplateStore.getState();
    createTemplate('acc-1', 'Source', 'url', 'file.pdf', 1);
    const id = useTemplateStore.getState().templates[0].id;

    duplicateTemplate(id);
    expect(useTemplateStore.getState().templates).toHaveLength(2);
    expect(useTemplateStore.getState().templates[1].name).toContain('Source (Copy)');
  });

  it('debe crear una nueva versión', () => {
    const { createTemplate, createNewVersion } = useTemplateStore.getState();
    createTemplate('acc-1', 'V1', 'url', 'file.pdf', 1);
    const id = useTemplateStore.getState().templates[0].id;

    createNewVersion(id, 'Cambios importantes');

    const templates = useTemplateStore.getState().templates;
    expect(templates).toHaveLength(2);
    const v2 = templates.find((t) => t.version === 2);
    expect(v2).toBeDefined();
    expect(v2?.previousVersionId).toBe(id);
  });

  it('debe agregar, actualizar y eliminar campos', () => {
    const { createTemplate, addField, updateField, deleteField, selectField } =
      useTemplateStore.getState();
    createTemplate('acc-1', 'Template con Campos', 'data:pdf', 'test.pdf', 1);

    // Agregar
    addField(FieldType.SIGNATURE, { page: 1, x: 100, y: 100, width: 100, height: 50 }, '');
    const fieldId = useTemplateStore.getState().currentTemplate!.fields[0].id;
    expect(useTemplateStore.getState().selectedFieldId).toBe(fieldId);

    // Actualizar
    updateField(fieldId, { required: false });
    expect(useTemplateStore.getState().currentTemplate!.fields[0].required).toBe(false);

    // Seleccionar
    selectField(null);
    expect(useTemplateStore.getState().selectedFieldId).toBeNull();
    selectField(fieldId);
    expect(useTemplateStore.getState().selectedFieldId).toBe(fieldId);

    // Eliminar
    deleteField(fieldId);
    expect(useTemplateStore.getState().currentTemplate!.fields).toHaveLength(0);
    expect(useTemplateStore.getState().selectedFieldId).toBeNull();
  });

  it('debe gestionar firmantes (add, update, delete)', () => {
    const { createTemplate, addSigner, updateSigner, deleteSigner } = useTemplateStore.getState();
    createTemplate('acc-1', 'Template Signers', 'url', 'file.pdf', 1);

    addSigner('Firmante 1');
    const signerId = useTemplateStore.getState().currentTemplate!.signers[0].id;
    expect(useTemplateStore.getState().currentTemplate!.signers).toHaveLength(1);

    updateSigner(signerId, { name: 'Juan Perez' });
    expect(useTemplateStore.getState().currentTemplate!.signers[0].name).toBe('Juan Perez');

    deleteSigner(signerId);
    expect(useTemplateStore.getState().currentTemplate!.signers).toHaveLength(0);
  });

  it('debe actualizar configuraciones (settings)', () => {
    const { createTemplate, updateSettings } = useTemplateStore.getState();
    createTemplate('acc-1', 'Settings Test', 'url', 'file.pdf', 1);

    updateSettings({ signingOrder: SigningOrder.PARALLEL });
    expect(useTemplateStore.getState().currentTemplate!.settings.signingOrder).toBe(
      SigningOrder.PARALLEL
    );
  });

  it('debe manejar acciones de UI', () => {
    const { setCurrentPage, setZoom, setIsDragging, toggleGrid } = useTemplateStore.getState();

    setCurrentPage(2);
    expect(useTemplateStore.getState().currentPage).toBe(2);

    setZoom(1.5);
    expect(useTemplateStore.getState().zoom).toBe(1.5);

    setIsDragging(true);
    expect(useTemplateStore.getState().isDragging).toBe(true);

    toggleGrid();
    expect(useTemplateStore.getState().showGrid).toBe(true);
  });

  it('debe funcionar correctamente con selectores', () => {
    const { createTemplate, addField, selectField } = useTemplateStore.getState();
    createTemplate('acc-1', 'Selector Test', 'url', 'file.pdf', 1);
    addField(FieldType.TEXT, { page: 1, x: 10, y: 10, width: 100, height: 20 }, '');
    const fieldId = useTemplateStore.getState().currentTemplate!.fields[0].id;
    selectField(fieldId);

    const state = useTemplateStore.getState();
    expect(selectCurrentTemplate(state)).toBeDefined();
    expect(selectSelectedField(state)?.id).toBe(fieldId);
    expect(selectCurrentPageFields(state)).toHaveLength(1);
  });
});
