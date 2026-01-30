/**
 * Template Store - State management para templates
 *
 * Maneja:
 * - Lista de templates
 * - Template activo en el builder
 * - CRUD de templates
 * - Versionado
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import {
  Template,
  Field,
  SignerRole,
  FieldType,
  TemplateSettings,
  ReminderFrequency,
  SigningOrder,
  FieldPosition,
} from '@/lib/types';

// ================
// STATE INTERFACE
// ================

interface TemplateState {
  // Data
  templates: Template[];
  currentTemplate: Template | null;

  // UI State
  selectedFieldId: string | null;
  currentPage: number;
  zoom: number;
  isDragging: boolean;
  showGrid: boolean;

  // Actions - Templates
  createTemplate: (name: string, pdfUrl: string, pdfFileName: string, totalPages: number) => void;
  loadTemplate: (templateId: string) => void;
  saveTemplate: () => void;
  deleteTemplate: (templateId: string) => void;
  duplicateTemplate: (templateId: string) => void;
  createNewVersion: (templateId: string, changeDescription: string) => void;

  // Actions - Fields
  addField: (type: FieldType, position: FieldPosition, assignedTo: string) => void;
  updateField: (fieldId: string, updates: Partial<Field>) => void;
  deleteField: (fieldId: string) => void;
  selectField: (fieldId: string | null) => void;

  // Actions - Signers
  addSigner: (name: string) => void;
  updateSigner: (signerId: string, updates: Partial<SignerRole>) => void;
  deleteSigner: (signerId: string) => void;

  // Actions - Settings
  updateSettings: (settings: Partial<TemplateSettings>) => void;

  // Actions - UI
  setCurrentPage: (page: number) => void;
  setZoom: (zoom: number) => void;
  setIsDragging: (isDragging: boolean) => void;
  toggleGrid: () => void;

  // Utility
  reset: () => void;
}

// ==============
// INITIAL STATE
// ==============

const defaultSettings: TemplateSettings = {
  expirationDays: 30,
  reminderFrequency: ReminderFrequency.DAILY,
  signingOrder: SigningOrder.SEQUENTIAL,
  allowDecline: true,
  requireAllFields: true,
  notifyOnComplete: true,
  notifyOnDecline: true,
  requireAccessCode: false,
};

// ======
// STORE
// ======

export const useTemplateStore = create<TemplateState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      templates: [],
      currentTemplate: null,
      selectedFieldId: null,
      currentPage: 1,
      zoom: 1,
      isDragging: false,
      showGrid: false,

      // =================
      // TEMPLATE ACTIONS
      // =================

      createTemplate: (name, pdfUrl, pdfFileName, totalPages) => {
        set((state) => {
          const newTemplate: Template = {
            id: nanoid(),
            name,
            description: '',
            version: 1,
            pdfUrl,
            pdfFileName,
            totalPages,
            fields: [],
            signers: [],
            settings: { ...defaultSettings },
            createdBy: 'current-user', // TODO: Get from auth
            createdAt: new Date(),
            updatedAt: new Date(),
            isArchived: false,
          };

          state.templates.push(newTemplate);
          state.currentTemplate = newTemplate;
          state.currentPage = 1;
          state.selectedFieldId = null;
        });
      },

      loadTemplate: (templateId) => {
        set((state) => {
          const template = state.templates.find((t) => t.id === templateId);
          if (template) {
            state.currentTemplate = template;
            state.currentPage = 1;
            state.selectedFieldId = null;
          }
        });
      },

      saveTemplate: () => {
        set((state) => {
          if (!state.currentTemplate) return;

          const index = state.templates.findIndex((t) => t.id === state.currentTemplate!.id);

          if (index !== -1) {
            state.currentTemplate.updatedAt = new Date();
            state.templates[index] = state.currentTemplate;
          }
        });
      },

      deleteTemplate: (templateId) => {
        set((state) => {
          state.templates = state.templates.filter((t) => t.id !== templateId);
          if (state.currentTemplate?.id === templateId) {
            state.currentTemplate = null;
          }
        });
      },

      duplicateTemplate: (templateId) => {
        set((state) => {
          const original = state.templates.find((t) => t.id === templateId);
          if (!original) return;

          const duplicate: Template = {
            ...original,
            id: nanoid(),
            name: `${original.name} (Copy)`,
            version: 1,
            previousVersionId: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Deep copy fields and signers
            fields: original.fields.map((f) => ({ ...f, id: nanoid() })),
            signers: original.signers.map((s) => ({ ...s, id: nanoid() })),
          };

          state.templates.push(duplicate);
        });
      },

      createNewVersion: (templateId, changeDescription) => {
        set((state) => {
          const original = state.templates.find((t) => t.id === templateId);
          if (!original) return;

          const newVersion: Template = {
            ...original,
            id: nanoid(),
            version: original.version + 1,
            previousVersionId: original.id,
            updatedAt: new Date(),
            // Deep copy
            fields: original.fields.map((f) => ({ ...f })),
            signers: original.signers.map((s) => ({ ...s })),
          };

          state.templates.push(newVersion);
          state.currentTemplate = newVersion;

          console.log(`Created version ${newVersion.version}: ${changeDescription}`);
        });
      },

      // ==============
      // FIELD ACTIONS
      // ==============

      addField: (type, position, assignedTo) => {
        set((state) => {
          if (!state.currentTemplate) return;

          const newField: Field = {
            id: nanoid(),
            type,
            position,
            assignedTo,
            required: true,
            createdAt: new Date(),
            order: state.currentTemplate.fields.length + 1,
          };

          state.currentTemplate.fields.push(newField);
          state.selectedFieldId = newField.id;
        });
      },

      updateField: (fieldId, updates) => {
        set((state) => {
          if (!state.currentTemplate) return;

          const field = state.currentTemplate.fields.find((f) => f.id === fieldId);
          if (field) {
            Object.assign(field, updates);
          }
        });
      },

      deleteField: (fieldId) => {
        set((state) => {
          if (!state.currentTemplate) return;

          state.currentTemplate.fields = state.currentTemplate.fields.filter(
            (f) => f.id !== fieldId
          );

          if (state.selectedFieldId === fieldId) {
            state.selectedFieldId = null;
          }
        });
      },

      selectField: (fieldId) => {
        set((state) => {
          state.selectedFieldId = fieldId;
        });
      },

      // ===============
      // SIGNER ACTIONS
      // ===============

      addSigner: (name) => {
        set((state) => {
          if (!state.currentTemplate) return;

          const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];
          const colorIndex = state.currentTemplate.signers.length % colors.length;

          const newSigner: SignerRole = {
            id: nanoid(),
            name,
            order: state.currentTemplate.signers.length + 1,
            color: colors[colorIndex],
          };

          state.currentTemplate.signers.push(newSigner);
        });
      },

      updateSigner: (signerId, updates) => {
        set((state) => {
          if (!state.currentTemplate) return;

          const signer = state.currentTemplate.signers.find((s) => s.id === signerId);
          if (signer) {
            Object.assign(signer, updates);
          }
        });
      },

      deleteSigner: (signerId) => {
        set((state) => {
          if (!state.currentTemplate) return;

          // Remove signer
          state.currentTemplate.signers = state.currentTemplate.signers.filter(
            (s) => s.id !== signerId
          );

          // Remove fields assigned to this signer
          state.currentTemplate.fields = state.currentTemplate.fields.filter(
            (f) => f.assignedTo !== signerId
          );
        });
      },

      // =================
      // SETTINGS ACTIONS
      // =================

      updateSettings: (settings) => {
        set((state) => {
          if (!state.currentTemplate) return;

          state.currentTemplate.settings = {
            ...state.currentTemplate.settings,
            ...settings,
          };
        });
      },

      // ===========
      // UI ACTIONS
      // ===========

      setCurrentPage: (page) => {
        set((state) => {
          state.currentPage = page;
        });
      },

      setZoom: (zoom) => {
        set((state) => {
          state.zoom = Math.max(0.5, Math.min(2, zoom)); // Clamp between 0.5x and 2x
        });
      },

      setIsDragging: (isDragging) => {
        set((state) => {
          state.isDragging = isDragging;
        });
      },

      toggleGrid: () => {
        set((state) => {
          state.showGrid = !state.showGrid;
        });
      },

      // ========
      // UTILITY
      // ========

      reset: () => {
        set((state) => {
          state.currentTemplate = null;
          state.selectedFieldId = null;
          state.currentPage = 1;
          state.zoom = 1;
          state.isDragging = false;
        });
      },
    })),
    {
      name: 'template-storage',
    }
  )
);

// ==============================================
// SELECTORS (for optimized component rendering)
// ==============================================

export const selectCurrentTemplate = (state: TemplateState) => state.currentTemplate;
export const selectSelectedField = (state: TemplateState) => {
  if (!state.currentTemplate || !state.selectedFieldId) return null;
  return state.currentTemplate.fields.find((f) => f.id === state.selectedFieldId);
};
export const selectCurrentPageFields = (state: TemplateState) => {
  if (!state.currentTemplate) return [];
  return state.currentTemplate.fields.filter((f) => f.position.page === state.currentPage);
};
