import { Template, FieldType, SigningOrder, ReminderFrequency } from '@/lib/types';

/**
 * Mock Database (Server-Side)
 *
 * Esta clase simula una base de datos en el servidor para respaldar
 * los API Endpoints de CRUD. Los datos persisten mientras el servidor
 * de desarrollo esté corriendo.
 */

class MockDatabase {
  private templates: Template[] = [];

  constructor() {
    this.templates = [
      {
        id: 'template-nda',
        accountId: 'account-1',
        name: 'Acuerdo de Confidencialidad (NDA)',
        description: 'Plantilla estándar para empleados y contratistas.',
        version: 1,
        pdfUrl:
          'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf', // PDF de ejemplo público
        pdfFileName: 'nda-v1.pdf',
        totalPages: 14,
        fields: [
          {
            id: 'f1',
            type: FieldType.SIGNATURE,
            position: { page: 1, x: 100, y: 150, width: 200, height: 60 },
            assignedTo: 'role-employee',
            required: true,
            createdAt: new Date(),
            order: 1,
          },
          {
            id: 'f2',
            type: FieldType.DATE,
            position: { page: 1, x: 350, y: 150, width: 150, height: 40 },
            assignedTo: 'role-employee',
            required: true,
            createdAt: new Date(),
            order: 2,
          },
        ],
        signers: [
          {
            id: 'role-employee',
            name: 'Empleado',
            order: 1,
            color: '#3B82F6',
          },
          {
            id: 'role-hr',
            name: 'RRHH',
            order: 2,
            color: '#EF4444',
          },
        ],
        settings: {
          expirationDays: 7,
          reminderFrequency: ReminderFrequency.DAILY,
          signingOrder: SigningOrder.SEQUENTIAL,
          allowDecline: true,
          requireAllFields: true,
          notifyOnComplete: true,
          notifyOnDecline: true,
          requireAccessCode: false,
        },
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        isArchived: false,
      },
    ];
  }

  getAll(): Template[] {
    return this.templates;
  }

  getById(id: string): Template | undefined {
    return this.templates.find((t) => t.id === id);
  }

  create(template: Template): Template {
    this.templates.push(template);
    return template;
  }

  update(id: string, data: Partial<Template>): Template | null {
    const index = this.templates.findIndex((t) => t.id === id);
    if (index === -1) return null;

    this.templates[index] = { ...this.templates[index], ...data, updatedAt: new Date() };
    return this.templates[index];
  }

  delete(id: string): boolean {
    const initialLength = this.templates.length;
    this.templates = this.templates.filter((t) => t.id !== id);
    return this.templates.length !== initialLength;
  }
}

// Singleton instance
export const db = new MockDatabase();
